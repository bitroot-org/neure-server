const db = require("../../../config/db");
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const ActivityLogService = require('../logs/ActivityLogService');
const UserServices = require('../user/UserServices');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const { chromium } = require('playwright');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class AssessmentsService {
  static async getAllAssessments(page = 1, limit = 10, user_id, all = false) {
    try {
      const offset = (page - 1) * limit;

      // Get total count of assessments for the user
      // For regular assessments: only show if not submitted
      // For PSI assessments: show if not submitted this month
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM assessments a 
         WHERE a.is_active = 1 
         AND (
           (a.is_psi_assessment = 0 AND NOT EXISTS (
             SELECT 1 
             FROM user_assessments ua 
             WHERE ua.assessment_id = a.id 
             AND ua.user_id = ?
           ))
           OR 
           (a.is_psi_assessment = 1 AND NOT EXISTS (
             SELECT 1 
             FROM user_assessments ua 
             WHERE ua.assessment_id = a.id 
             AND ua.user_id = ?
             AND DATE_FORMAT(ua.completed_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
           ))
         )`,
        [user_id, user_id]
      );
      
      // First get all assessment IDs
      let assessmentQuery = `
        SELECT 
          a.id, 
          a.title, 
          a.description, 
          a.created_at,
          a.is_psi_assessment
        FROM assessments a
        WHERE a.is_active = 1
        AND (
          (a.is_psi_assessment = 0 AND NOT EXISTS (
            SELECT 1 
            FROM user_assessments ua 
            WHERE ua.assessment_id = a.id 
            AND ua.user_id = ?
          ))
          OR 
          (a.is_psi_assessment = 1 AND NOT EXISTS (
            SELECT 1 
            FROM user_assessments ua 
            WHERE ua.assessment_id = a.id 
            AND ua.user_id = ?
            AND DATE_FORMAT(ua.completed_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
          ))
        )
        ORDER BY a.created_at DESC`;
      
      // Add pagination only if all=false
      if (!all) {
        assessmentQuery += " LIMIT ? OFFSET ?";
      }
      
      // Get assessments
      const [assessments] = await db.query(
        assessmentQuery,
        all ? [user_id, user_id] : [user_id, user_id, limit, offset]
      );
      
      // For each assessment, get its questions, options, and interpretation ranges
      const assessmentsWithDetails = await Promise.all(
        assessments.map(async (assessment) => {
          // Get questions
          const [questions] = await db.query(
            `SELECT 
              q.id, 
              q.question_text
            FROM questions q
            WHERE q.assessment_id = ?`,
            [assessment.id]
          );
          
          // For each question, get its options
          const questionsWithOptions = await Promise.all(
            questions.map(async (question) => {
              const [options] = await db.query(
                `SELECT 
                  o.id, 
                  o.option_text, 
                  o.points
                FROM options o
                WHERE o.question_id = ?`,
                [question.id]
              );
              
              return {
                ...question,
                options
              };
            })
          );
          
          // Get interpretation ranges for this assessment
          const [ranges] = await db.query(
            `SELECT id, min_score, max_score, description 
             FROM assessment_interpretation_ranges 
             WHERE assessment_id = ? 
             ORDER BY min_score ASC`,
            [assessment.id]
          );
          console.log("Ranges:", ranges);
          
          return {
            ...assessment,
            questions: questionsWithOptions,
            interpretation_ranges: ranges
          };
        })
      );
      
      const response = {
        assessments: assessmentsWithDetails
      };
      
      // Add pagination info only if not returning all records
      if (!all) {
        response.pagination = {
          total: totalRows[0].count,
          current_page: page,
          total_pages: Math.ceil(totalRows[0].count / limit),
          per_page: limit
        };
      }
      
      return response;
    } catch (error) {
      throw new Error("Error fetching assessments: " + error.message);
    }
  }

  static async getAssessmentById(id) {
    try {
      const query = `
        SELECT 
          a.*,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', q.id,
              'question_text', q.question_text,
              'question_type', q.question_type,
              'options', (
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', o.id,
                    'option_text', o.option_text,
                    'points', o.points
                  )
                )
                FROM options o
                WHERE o.question_id = q.id
              )
            )
          ) as questions
        FROM assessments a
        LEFT JOIN questions q ON a.id = q.assessment_id
        WHERE a.id = ? AND a.is_active = 1
        GROUP BY a.id`;

      const [results] = await db.query(query, [id]);
      
      // Get interpretation ranges for this assessment
      const [ranges] = await db.query(
        `SELECT id, min_score, max_score, description 
         FROM assessment_interpretation_ranges 
         WHERE assessment_id = ? 
         ORDER BY min_score ASC`,
        [id]
      );
      
      // Add ranges to the result
      if (results && results.length > 0) {
        results[0].interpretation_ranges = ranges;
      }
      
      return results[0];
    } catch (error) {
      throw error;
    }
  }

  static async createAssessment(assessmentData) {
    const connection = await db.getConnection();
    try {
      // console.log("Starting assessment creation with data:", {
      //   title: assessmentData.title,
      //   is_psi_assessment: assessmentData.is_psi_assessment
      // });

      await connection.beginTransaction();

      // Insert assessment with is_psi_assessment flag (1 or 0)
      const [assessmentResult] = await connection.query(
        "INSERT INTO assessments (title, description, is_psi_assessment) VALUES (?, ?, ?)",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.is_psi_assessment ? 1 : 0
        ]
      );
      const assessmentId = assessmentResult.insertId;
      // console.log("Assessment created with ID:", assessmentId);

      // Insert questions
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          "INSERT INTO questions (assessment_id, question_text) VALUES (?, ?)",
          [assessmentId, question.question_text]
        );
        const questionId = questionResult.insertId;

        // Insert options with points
        for (const option of question.options) {
          await connection.query(
            "INSERT INTO options (question_id, option_text, points) VALUES (?, ?, ?)",
            [questionId, option.option_text, option.points]
          );
        }
      }
      // console.log("Questions and options inserted successfully");

      // Insert interpretation ranges if provided
      if (assessmentData.interpretation_ranges && assessmentData.interpretation_ranges.length > 0) {
        // console.log("Processing interpretation ranges:", assessmentData.interpretation_ranges);
        for (const range of assessmentData.interpretation_ranges) {
          // Ensure we have valid values for min_score and max_score
          // Convert to numbers and handle 0 values properly
          const minScore = range.min_score !== undefined && range.min_score !== null ? 
                          Number(range.min_score) : 
                          (range.lowRange !== undefined && range.lowRange !== null ? 
                            Number(range.lowRange) : null);
                          
          const maxScore = range.max_score !== undefined && range.max_score !== null ? 
                          Number(range.max_score) : 
                          (range.highRange !== undefined && range.highRange !== null ? 
                            Number(range.highRange) : null);
          
          // Log the values we're about to insert
          // console.log(`Inserting range: min=${minScore}, max=${maxScore}, desc=${range.description}`);
          
          // Validate that min_score and max_score are not null
          if (minScore === null || maxScore === null) {
            console.error(`Invalid range values: min=${minScore}, max=${maxScore}`);
            throw new Error("Interpretation range min_score and max_score cannot be null");
          }
          
          await connection.query(
            "INSERT INTO assessment_interpretation_ranges (assessment_id, min_score, max_score, description) VALUES (?, ?, ?, ?)",
            [
              assessmentId, 
              minScore,
              maxScore,
              range.description || ''
            ]
          );
        }
        // console.log("Interpretation ranges inserted successfully");
      }

      // Get all active employees from all companies
      const [employees] = await connection.query(`
        SELECT 
          ce.user_id,
          ce.company_id,
          u.first_name,
          u.email
        FROM company_employees ce
        JOIN users u ON ce.user_id = u.user_id
        WHERE ce.is_active = 1
      `);

      console.log("Found total employees:", employees.length);

      // Create notifications for each employee
      const notificationPromises = employees.map(employee => {
        console.log("Creating notification for employee:", employee.user_id);
        
        return NotificationService.createNotification({
          title: `New Assessment Available: ${assessmentData.title}`,
          content: `A new assessment "${assessmentData.title}" has been assigned to you. ${
            assessmentData.description ? `\n\nDescription: ${assessmentData.description}` : ''
          }`,
          type: "NEW_ASSESSMENT",
          company_id: employee.company_id,
          user_id: employee.user_id,
          priority: "HIGH",
          metadata: JSON.stringify({
            assessment_id: assessmentId,
            total_questions: assessmentData.questions.length
          })
        });
      });

      console.log("Attempting to send notifications...");
      
      // Send all notifications
      const notificationResults = await Promise.all(notificationPromises);
      console.log("Notifications sent:", notificationResults.length);

      // If this is a PSI assessment, add a note in the log
      const assessmentType = assessmentData.is_psi_assessment ? "PSI assessment" : "assessment";
      // await ActivityLogService.createLog({
      //   user_id: assessmentData.user_id || null,
      //   performed_by: 'admin',
      //   module_name: 'assessments',
      //   action: 'create',
      //   description: `${assessmentType} "${assessmentData.title}" created with ${assessmentData.questions.length} questions.`
      // });

      await connection.commit();
      console.log("Transaction committed successfully");

      return await this.getAssessmentById(assessmentId);
    } catch (error) {
      console.error("Error in createAssessment:", error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateAssessment(assessmentId, assessmentData) {
    const connection = await db.getConnection();
    console.log("Starting assessment update with data:", {
      title: assessmentData.title,
      is_psi_assessment: assessmentData.is_psi_assessment
    });
    try {
      await connection.beginTransaction();

      // Update assessment details including is_psi_assessment (1 or 0)
      await connection.query(
        "UPDATE assessments SET title = ?, description = ?, is_psi_assessment = ? WHERE id = ?",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.is_psi_assessment ? 1 : 0,
          assessmentId
        ]
      );

      // Delete existing questions and options
      await connection.query(
        "DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE assessment_id = ?)",
        [assessmentId]
      );

      await connection.query("DELETE FROM questions WHERE assessment_id = ?", [
        assessmentId
      ]);

      // Delete existing interpretation ranges
      await connection.query(
        "DELETE FROM assessment_interpretation_ranges WHERE assessment_id = ?",
        [assessmentId]
      );

      // Insert updated questions and options
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          "INSERT INTO questions (assessment_id, question_text) VALUES (?, ?)",
          [assessmentId, question.question_text]
        );
        const questionId = questionResult.insertId;

        // Insert options with points
        for (const option of question.options) {
          await connection.query(
            "INSERT INTO options (question_id, option_text, points) VALUES (?, ?, ?)",
            [questionId, option.option_text, option.points]
          );
        }
      }

      // Insert updated interpretation ranges if provided
      if (assessmentData.interpretation_ranges && assessmentData.interpretation_ranges.length > 0) {
        console.log("Updating interpretation ranges:", assessmentData.interpretation_ranges);
        for (const range of assessmentData.interpretation_ranges) {
          // Ensure we have valid values for min_score and max_score
          const minScore = range.min_score !== undefined ? range.min_score : 
                          (range.lowRange !== undefined ? range.lowRange : 0);
          const maxScore = range.max_score !== undefined ? range.max_score : 
                          (range.highRange !== undefined ? range.highRange : 0);
          
          // Log the values we're about to insert
          console.log(`Inserting range: min=${minScore}, max=${maxScore}, desc=${range.description}`);
          
          await connection.query(
            "INSERT INTO assessment_interpretation_ranges (assessment_id, min_score, max_score, description) VALUES (?, ?, ?, ?)",
            [
              assessmentId, 
              minScore,
              maxScore,
              range.description || ''
            ]
          );
        }
      }

      await connection.commit();
      return await this.getAssessmentById(assessmentId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteAssessment(assessmentId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      console.log("assessmentId", assessmentId);

      // Check if assessment exists and is active
      const [assessment] = await connection.query(
        "SELECT id, title FROM assessments WHERE id = ? AND is_active = 1",
        [assessmentId]
      );

      console.log(assessment);

      if (!assessment || assessment.length === 0) {
        throw new Error("Assessment not found or already deleted");
      }

      // Soft delete the assessment
      await connection.query(
        "UPDATE assessments SET is_active = 0 WHERE id = ?",
        [assessmentId]
      );

      await connection.commit();
      return {
        status: true,
        message: "Assessment deleted successfully",
        data: {
          id: assessmentId,
          title: assessment[0].title,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async submitAssessment({ user_id, company_id, assessment_id, responses }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Ensure all IDs are valid integers
      user_id = parseInt(user_id, 10);
      company_id = parseInt(company_id, 10);
      assessment_id = parseInt(assessment_id, 10);

      // Validate IDs
      if (isNaN(user_id) || isNaN(company_id) || isNaN(assessment_id)) {
        throw new Error("Invalid user_id, company_id, or assessment_id");
      }

      // Check if assessment exists and is active
      const [assessment] = await connection.query(
        "SELECT id, title, is_psi_assessment FROM assessments WHERE id = ? AND is_active = 1",
        [assessment_id]
      );

      if (!assessment || assessment.length === 0) {
        throw new Error("Assessment not found");
      }

      // For non-PSI assessments, check if user has already submitted
      // For PSI assessments, check if user has already submitted this month
      if (!assessment[0].is_psi_assessment) {
        const [existingSubmission] = await connection.query(
          "SELECT id FROM user_assessments WHERE user_id = ? AND assessment_id = ?",
          [user_id, assessment_id]
        );

        if (existingSubmission && existingSubmission.length > 0) {
          throw new Error("Assessment already submitted");
        }
      } else {
        const [existingMonthlySubmission] = await connection.query(
          `SELECT id FROM user_assessments 
           WHERE user_id = ? AND assessment_id = ? 
           AND DATE_FORMAT(completed_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
          [user_id, assessment_id]
        );

        if (existingMonthlySubmission && existingMonthlySubmission.length > 0) {
          throw new Error("PSI assessment already submitted this month");
        }
      }

      // Get all questions and their options with points
      const [questions] = await connection.query(`
        SELECT 
          q.id as question_id,
          o.id as option_id,
          o.points
        FROM questions q
        JOIN options o ON q.id = o.question_id
        WHERE q.assessment_id = ?
        ORDER BY q.id, o.id
      `, [assessment_id]);

      // Restructure the questions and options
      const questionMap = questions.reduce((acc, curr) => {
        if (!acc[curr.question_id]) {
          acc[curr.question_id] = {
            question_id: curr.question_id,
            options: []
          };
        }
        acc[curr.question_id].options.push({
          id: curr.option_id,
          points: curr.points
        });
        return acc;
      }, {});

      const structuredQuestions = Object.values(questionMap);
      
      // Calculate total score based on points
      let totalPoints = 0;
      let maxPossiblePoints = 0;
      
      // Process responses
      for (const question of structuredQuestions) {
        const userResponse = responses.find(r => r.question_id === question.question_id);
        if (!userResponse) continue;
        
        // Get points for selected options
        if (userResponse.selected_options && userResponse.selected_options.length > 0) {
          const selectedOptionId = parseInt(userResponse.selected_options[0], 10); // Take first selected option
          const selectedOption = question.options.find(o => o.id === selectedOptionId);
          if (selectedOption) {
            totalPoints += parseFloat(selectedOption.points) || 0;
          }
        }
        
        // Calculate max possible points for this question
        const optionPoints = question.options.map(o => parseFloat(o.points) || 0);
        const maxPoints = optionPoints.length > 0 ? Math.max(...optionPoints) : 0;
        maxPossiblePoints += maxPoints;
      }
      
      // Calculate percentage score (0-100)
      const percentageScore = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
      
      // Insert submission with total_points and max_possible_points
      const [userAssessmentResult] = await connection.query(
        `INSERT INTO user_assessments 
         (user_id, company_id, assessment_id, responses, score, total_points, max_possible_points, completed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [user_id, company_id, assessment_id, JSON.stringify(responses), percentageScore, totalPoints, maxPossiblePoints]
      );
      
      const userAssessmentId = userAssessmentResult.insertId;
      
      // Store individual responses
      for (const response of responses) {
        const questionId = parseInt(response.question_id, 10);
        if (isNaN(questionId)) continue;
        
        // Get points for this response
        let responsePoints = 0;
        if (response.selected_options && response.selected_options.length > 0) {
          const selectedOptionId = parseInt(response.selected_options[0], 10);
          const question = structuredQuestions.find(q => q.question_id === questionId);
          if (question) {
            const selectedOption = question.options.find(o => o.id === selectedOptionId);
            if (selectedOption) {
              responsePoints = parseFloat(selectedOption.points) || 0;
            }
          }
        }
        
        await connection.query(
          `INSERT INTO user_assessment_responses 
           (user_assessment_id, question_id, selected_options, points) 
           VALUES (?, ?, ?, ?)`,
          [userAssessmentId, questionId, JSON.stringify(response.selected_options), responsePoints]
        );
      }

      // Get the interpretation range that matches the user's score
      const [interpretationRange] = await connection.query(
        `SELECT id, min_score, max_score, description 
         FROM assessment_interpretation_ranges 
         WHERE assessment_id = ? 
         AND ? BETWEEN min_score AND max_score
         LIMIT 1`,
        [assessment_id, totalPoints]
      );

      // Create notification for the user
      await NotificationService.createNotification({
        title: `Assessment Submission Result: ${assessment[0].title}`,
        content: `You have completed the assessment "${assessment[0].title}" with a score of ${percentageScore.toFixed(1)}%.`,
        type: "ASSESSMENT_COMPLETED",
        company_id: company_id,
        user_id: user_id,
        priority: "HIGH",
        metadata: JSON.stringify({
          assessment_id: assessment_id,
          score: percentageScore,
          total_points: totalPoints,
          max_possible_points: maxPossiblePoints,
          interpretation: interpretationRange && interpretationRange.length > 0 ? interpretationRange[0] : null,
          completion_date: new Date().toISOString()
        })
      });

      // If this is a PSI assessment, update the employee's PSI score and recalculate company PSI
      if (assessment[0].is_psi_assessment) {
        console.log(`Updating PSI score for user ${user_id} to ${percentageScore}`);
        
        // Update the employee's PSI score with the percentage value
        await connection.query(
          `UPDATE company_employees 
           SET psi = ?
           WHERE user_id = ? AND company_id = ?`,
          [percentageScore, user_id, company_id]
        );
        
        // Recalculate company's PSI score based on all employees with PSI scores
        // const [employeePsiScores] = await connection.query(
        //   `SELECT 
        //     ce.psi,
        //     COUNT(*) as employee_count
        //   FROM company_employees ce
        //   WHERE ce.company_id = ? 
        //     AND ce.is_active = 1 
        //     AND ce.psi IS NOT NULL
        //   GROUP BY ce.psi`,
        //   [company_id]
        // );
        
        // if (employeePsiScores && employeePsiScores.length > 0) {
        //   // Calculate weighted average of PSI scores
        //   let totalScore = 0;
        //   let totalEmployees = 0;
          
        //   employeePsiScores.forEach(result => {
        //     totalScore += (result.psi * result.employee_count);
        //     totalEmployees += result.employee_count;
        //   });
          
        //   // Calculate company PSI as average of all employee PSI scores
        //   const companyPsiScore = totalEmployees > 0 ? totalScore / totalEmployees : 0;
          
        //   // Update the company's PSI score
        //   await connection.query(
        //     `UPDATE companies 
        //     SET 
        //       psychological_safety_index = ?,
        //       updated_at = NOW()
        //     WHERE id = ?`,
        //     [companyPsiScore, company_id]
        //   );
          
        //   console.log(`Company ${company_id} PSI updated to: ${companyPsiScore}`);
        // }
      }

      await connection.commit();

      return {
        score: percentageScore,
        total_points: totalPoints,
        max_possible_points: maxPossiblePoints,
        interpretation: interpretationRange && interpretationRange.length > 0 ? interpretationRange[0] : null,
        questions: structuredQuestions
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAssessmentsList() {
    try {
      // Query to fetch only id and title of active assessments
      const query = `
        SELECT id, title 
        FROM assessments 
        WHERE is_active = 1 
        ORDER BY created_at DESC`;

      const [results] = await db.query(query);
      
      return {
        status: true,
        code: 200,
        message: "Assessment list retrieved successfully",
        data: results
      };
    } catch (error) {
      throw error;
    }
  }

  // New method to get user assessment responses with questions and correct answers
  static async getUserAssessmentResponses(user_id, assessment_id, submission_id = null) {
    try {
      // Get assessment details
      const [assessment] = await db.query(
        `SELECT id, title, description, is_psi_assessment FROM assessments WHERE id = ?`,
        [assessment_id]
      );
      
      if (!assessment || assessment.length === 0) {
        throw new Error("Assessment not found");
      }
      
      let userAssessmentQuery = `
        SELECT id, score, total_points, max_possible_points, completed_at 
        FROM user_assessments 
        WHERE user_id = ? AND assessment_id = ?
      `;
      
      const queryParams = [user_id, assessment_id];
      
      // If submission_id is provided, get that specific submission
      if (submission_id) {
        userAssessmentQuery += ` AND id = ?`;
        queryParams.push(submission_id);
      } else {
        // Otherwise, get the most recent submission
        userAssessmentQuery += ` ORDER BY completed_at DESC LIMIT 1`;
      }
      
      // Check if the user has submitted this assessment
      const [userAssessment] = await db.query(userAssessmentQuery, queryParams);

      if (!userAssessment || userAssessment.length === 0) {
        throw new Error("Assessment not submitted by this user");
      }

      const userAssessmentId = userAssessment[0].id;

      // Get interpretation range that matches the user's score
      const [interpretationRange] = await db.query(
        `SELECT id, min_score, max_score, description 
         FROM assessment_interpretation_ranges 
         WHERE assessment_id = ? 
         AND ? BETWEEN min_score AND max_score
         LIMIT 1`,
        [assessment_id, userAssessment[0].total_points || 0]
      );

      // Get questions with user responses
      const [questions] = await db.query(`
        SELECT 
          q.id as question_id,
          q.question_text,
          uar.selected_options as user_selected_options,
          uar.points as user_points
        FROM questions q
        JOIN user_assessment_responses uar ON q.id = uar.question_id
        WHERE uar.user_assessment_id = ?
        ORDER BY q.id
      `, [userAssessmentId]);

      // Process each question to get its options and parse JSON
      const processedQuestions = await Promise.all(questions.map(async (question) => {
        // Get options for this question
        const [options] = await db.query(`
          SELECT 
            id,
            option_text,
            points
          FROM options
          WHERE question_id = ?
        `, [question.question_id]);

        // Parse the selected_options JSON string
        let userSelectedOptions;
        try {
          userSelectedOptions = JSON.parse(question.user_selected_options);
        } catch (e) {
          console.error(`Error parsing selected_options for question ${question.question_id}:`, e);
          userSelectedOptions = [];
        }

        return {
          ...question,
          user_selected_options: userSelectedOptions,
          options: options
        };
      }));
      
      // If this is a PSI assessment, get all submission dates for this user
      let submissionHistory = [];
      if (assessment[0].is_psi_assessment) {
        const [history] = await db.query(
          `SELECT id, DATE_FORMAT(completed_at, '%Y-%m-%d') as submission_date, 
           score, total_points
           FROM user_assessments 
           WHERE user_id = ? AND assessment_id = ?
           ORDER BY completed_at DESC`,
          [user_id, assessment_id]
        );
        submissionHistory = history;
      }

      return {
        status: true,
        code: 200,
        message: "User assessment responses retrieved successfully",
        data: {
          assessment: assessment[0],
          user_assessment: {
            id: userAssessment[0].id,
            score: userAssessment[0].score,
            total_points: userAssessment[0].total_points,
            max_possible_points: userAssessment[0].max_possible_points,
            interpretation: interpretationRange && interpretationRange.length > 0 ? interpretationRange[0] : null,
            completed_at: userAssessment[0].completed_at
          },
          responses: processedQuestions,
          submission_history: submissionHistory
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAssessmentCompletionList({ 
    page = 1, 
    limit = 10, 
    company_id = null, 
    assessment_id = null 
  }) {
    try {
      const offset = (page - 1) * limit;
      
      // Build the query with joins to get all required data
      let query = `
        SELECT 
          u.first_name,
          u.last_name,
          u.email,
          u.user_id,
          c.company_name,
          c.id as company_id,
          a.title as assessment_name,
          a.id as assessment_id,
          ua.score,
          ua.completed_at,
          ua.id as user_assessment_id
        FROM user_assessments ua
        JOIN users u ON ua.user_id = u.user_id
        JOIN companies c ON ua.company_id = c.id
        JOIN assessments a ON ua.assessment_id = a.id
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Add filters if provided
      if (company_id) {
        query += ` AND ua.company_id = ?`;
        queryParams.push(company_id);
      }
      
      if (assessment_id) {
        query += ` AND ua.assessment_id = ?`;
        queryParams.push(assessment_id);
      }
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_assessments ua
        JOIN users u ON ua.user_id = u.user_id
        JOIN companies c ON ua.company_id = c.id
        JOIN assessments a ON ua.assessment_id = a.id
        WHERE 1=1
        ${company_id ? ' AND ua.company_id = ?' : ''}
        ${assessment_id ? ' AND ua.assessment_id = ?' : ''}
      `;

      const countParams = [];
      if (company_id) countParams.push(company_id);
      if (assessment_id) countParams.push(assessment_id);
      
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult && countResult[0] ? countResult[0].total : 0;
      
      // Add sorting and pagination to the main query
      query += ` ORDER BY ua.completed_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), offset);
      
      // Execute the main query
      const [results] = await db.query(query, queryParams);
      
      // Format the results
      const formattedResults = results.map(row => ({
        employee: `${row.first_name} ${row.last_name}`,
        email: row.email,
        user_id: row.user_id,
        company: row.company_name,
        company_id: row.company_id,
        assessment: row.assessment_name,
        assessment_id: row.assessment_id,
        user_assessment_id: row.user_assessment_id,
        completion_date: row.completed_at,
        score: `${Math.round(row.score)}%`,
        score_raw: row.score
      }));
      
      // Return a properly structured response
      return {
        status: true,
        code: 200,
        message: "Assessment completion list retrieved successfully",
        data: formattedResults,
        pagination: {
          total,
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          per_page: parseInt(limit)
        }
      };
    } catch (error) {
      console.error("Error in getAssessmentCompletionList:", error);
      throw error;
    }
  }

  static async getUserSubmittedAssessments(user_id) {
    try {
      // Query to get all assessments submitted by the user with scores
      // For PSI assessments, include a flag indicating if it's the latest monthly submission
      const query = `
        SELECT 
          ua.id as submission_id,
          ua.assessment_id,
          a.title as assessment_title,
          a.is_psi_assessment,
          ua.score,
          ua.completed_at,
          c.id as company_id,
          c.company_name,
          CASE 
            WHEN a.is_psi_assessment = 1 THEN 
              CASE 
                WHEN DATE_FORMAT(ua.completed_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN true
                ELSE false
              END
            ELSE true
          END as is_current_submission
        FROM 
          user_assessments ua
        JOIN 
          assessments a ON ua.assessment_id = a.id
        JOIN 
          companies c ON ua.company_id = c.id
        WHERE 
          ua.user_id = ?
        ORDER BY 
          ua.completed_at DESC
      `;

      const [results] = await db.query(query, [user_id]);
      
      return {
        status: true,
        code: 200,
        message: "User submitted assessments retrieved successfully",
        data: results
      };
    } catch (error) {
      console.error("Error retrieving user submitted assessments:", error);
      throw error;
    }
  }

  static async generateAssessmentPdf(userId, assessmentId, returnType = 'blob', submissionId = null) {
    try {
      // Get assessment data
      let userAssessmentQuery = `SELECT ua.id, ua.total_points, ua.score, ua.completed_at
                                FROM user_assessments ua
                                WHERE ua.user_id = ? AND ua.assessment_id = ?`;
      
      let queryParams = [userId, assessmentId];
      
      // If submissionId is provided, use it to find the specific submission
      if (submissionId) {
        userAssessmentQuery += ` AND ua.id = ?`;
        queryParams.push(submissionId);
      } else {
        // Otherwise get the most recent submission
        userAssessmentQuery += ` ORDER BY ua.completed_at DESC LIMIT 1`;
      }
      
      const [userAssessment] = await db.query(userAssessmentQuery, queryParams);
      
      if (!userAssessment || userAssessment.length === 0) {
        throw new Error('Assessment not found or not completed');
      }
      
      // Get the assessment details
      const [assessmentDetails] = await db.query(
        `SELECT title, description, is_psi_assessment 
         FROM assessments 
         WHERE id = ?`,
        [assessmentId]
      );
      
      if (!assessmentDetails || assessmentDetails.length === 0) {
        throw new Error('Assessment details not found');
      }
      
      // Get the interpretation range that matches the user's score
      const [interpretationRange] = await db.query(
        `SELECT description 
         FROM assessment_interpretation_ranges 
         WHERE assessment_id = ? 
         AND ? BETWEEN min_score AND max_score
         LIMIT 1`,
        [assessmentId, userAssessment[0].total_points]
      );
      
      // Get user details
      const [userDetails] = await db.query(
        `SELECT first_name, last_name 
         FROM users 
         WHERE user_id = ?`,
        [userId]
      );
      
      // Format the completion date
      const completionDate = new Date(userAssessment[0].completed_at).toLocaleDateString();
      
      // Prepare template data
      const templateData = {
        assessmentTitle: assessmentDetails[0].title,
        assessmentDescription: assessmentDetails[0].description,
        userName: userDetails.length > 0 ? `${userDetails[0].first_name} ${userDetails[0].last_name}` : 'User',
        score: userAssessment[0].total_points,
        scorePercentage: Math.round(userAssessment[0].score),
        completionDate: completionDate,
        submissionId: userAssessment[0].id,
        isPsiAssessment: assessmentDetails[0].is_psi_assessment === 1,
        interpretation: interpretationRange && interpretationRange.length > 0 
          ? interpretationRange[0].description 
          : 'No interpretation available'
      };
      
      // Generate HTML and convert to PDF
      const html = await this.generateAssessmentReportHtml(templateData);
      const pdfBuffer = await this.convertHtmlToPdf(html);
      
      // Return the PDF buffer with metadata
      return { 
        pdfBuffer,
        contentType: 'application/pdf',
        filename: `assessment_report_${userId}_${assessmentId}_${userAssessment[0].id}.pdf`
      };
    } catch (error) {
      console.error('Error generating assessment PDF:', error);
      throw error;
    }
  }

  static async generateAssessmentReportHtml(data) {
    const templatePath = path.join(__dirname, '../../../templates/assessment-report.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(data);
  }

  static async convertHtmlToPdf(html) {
    try {
      console.log('Using html-pdf for PDF generation...');
      const htmlPdf = require('html-pdf');
      
      return new Promise((resolve, reject) => {
        const options = {
          format: 'A4',
          border: {
            top: '0.5cm',
            right: '0.5cm',
            bottom: '0.5cm',
            left: '0.5cm'
          },
          // Reduce height to fit on one page
          height: '26cm',
          // Prevent page breaks
          pageBreak: { mode: 'avoid-all' },
          // Faster rendering
          timeout: 30000
        };
        
        htmlPdf.create(html, options).toBuffer((err, buffer) => {
          if (err) {
            console.error('Error in html-pdf conversion:', err);
            reject(err);
          } else {
            console.log('PDF generated successfully with html-pdf, size:', buffer.length);
            resolve(buffer);
          }
        });
      });
    } catch (error) {
      console.error('Error generating PDF with html-pdf:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  static async uploadAssessmentPdfToS3(pdfBuffer, pdfPath) {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfPath,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'public-read'
    };
    
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfPath}`;
  }

  static async getUserPsiHistory(user_id, company_id) {
    try {
      // Get all PSI assessments
      const [psiAssessments] = await db.query(
        `SELECT id, title FROM assessments WHERE is_psi_assessment = 1 AND is_active = 1`
      );
      
      if (!psiAssessments || psiAssessments.length === 0) {
        return {
          status: true,
          code: 200,
          message: "No PSI assessments found",
          data: []
        };
      }
      
      // Get all submissions for each PSI assessment
      const psiHistory = await Promise.all(psiAssessments.map(async (assessment) => {
        const [submissions] = await db.query(
          `SELECT 
            id, 
            score, 
            total_points, 
            max_possible_points,
            DATE_FORMAT(completed_at, '%Y-%m-%d') as submission_date,
            DATE_FORMAT(completed_at, '%Y-%m') as month_year
          FROM user_assessments 
          WHERE user_id = ? AND assessment_id = ? AND company_id = ?
          ORDER BY completed_at DESC`,
          [user_id, assessment.id, company_id]
        );
        
        return {
          assessment_id: assessment.id,
          assessment_title: assessment.title,
          submissions: submissions
        };
      }));
      
      return {
        status: true,
        code: 200,
        message: "PSI history retrieved successfully",
        data: psiHistory
      };
    } catch (error) {
      throw new Error(`Error retrieving PSI history: ${error.message}`);
    }
  }
}

module.exports = AssessmentsService;
