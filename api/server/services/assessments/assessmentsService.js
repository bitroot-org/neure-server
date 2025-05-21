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

      // Get total count of unsubmitted active assessments for the user
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM assessments a 
         WHERE a.is_active = 1 
         AND NOT EXISTS (
           SELECT 1 
           FROM user_assessments ua 
           WHERE ua.assessment_id = a.id 
           AND ua.user_id = ?
         )`,
        [user_id]
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
        AND NOT EXISTS (
          SELECT 1 
          FROM user_assessments ua 
          WHERE ua.assessment_id = a.id 
          AND ua.user_id = ?
        )
        ORDER BY a.created_at DESC`;
      
      // Add pagination only if all=false
      if (!all) {
        assessmentQuery += " LIMIT ? OFFSET ?";
      }
      
      // Get assessments
      const [assessments] = await db.query(
        assessmentQuery,
        all ? [user_id] : [user_id, limit, offset]
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

      // Check if user has already submitted this assessment
      const [existingSubmission] = await connection.query(
        "SELECT id FROM user_assessments WHERE user_id = ? AND assessment_id = ?",
        [user_id, assessment_id]
      );

      if (existingSubmission && existingSubmission.length > 0) {
        throw new Error("Assessment already submitted");
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

      // If this is a PSI assessment, update the employee's PSI score
      if (assessment[0].is_psi_assessment) {
        console.log(`Updating PSI score for user ${user_id} to ${percentageScore}`);
        
        // Update the employee's PSI score with the percentage value
        await connection.query(
          `UPDATE company_employees 
           SET psi = ?
           WHERE user_id = ? AND company_id = ?`,
          [percentageScore, user_id, company_id]
        );
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
  static async getUserAssessmentResponses(user_id, assessment_id) {
    try {
      // First check if the user has submitted this assessment
      const [userAssessment] = await db.query(
        `SELECT id, score, total_points, max_possible_points, completed_at 
         FROM user_assessments 
         WHERE user_id = ? AND assessment_id = ?`,
        [user_id, assessment_id]
      );

      if (!userAssessment || userAssessment.length === 0) {
        throw new Error("Assessment not submitted by this user");
      }

      const userAssessmentId = userAssessment[0].id;

      // Get assessment details
      const [assessment] = await db.query(
        `SELECT title, description FROM assessments WHERE id = ?`,
        [assessment_id]
      );

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
          responses: processedQuestions
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
      const query = `
        SELECT 
          ua.id as submission_id,
          ua.assessment_id,
          a.title as assessment_title,
          ua.score,
          ua.completed_at,
          c.id as company_id,
          c.company_name
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

  static async generateAssessmentPdf(userId, assessmentId) {
    try {
      // Check if PDF already exists
      const [existingPdf] = await db.query(
        `SELECT pdf_url FROM user_assessments 
         WHERE user_id = ? AND assessment_id = ? AND pdf_url IS NOT NULL`,
        [userId, assessmentId]
      );
      
      if (existingPdf && existingPdf.length > 0 && existingPdf[0].pdf_url) {
        return { pdfUrl: existingPdf[0].pdf_url };
      }
      
      // Get assessment data with the correct interpretation from assessment_interpretation_ranges
      const [userAssessment] = await db.query(
        `SELECT ua.total_points, ua.score
         FROM user_assessments ua
         WHERE ua.user_id = ? AND ua.assessment_id = ?`,
        [userId, assessmentId]
      );
      
      if (!userAssessment || userAssessment.length === 0) {
        throw new Error('Assessment not found or not completed');
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
      
      // Prepare template data
      const templateData = {
        score: userAssessment[0].total_points,
        interpretation: interpretationRange && interpretationRange.length > 0 
          ? interpretationRange[0].description 
          : 'No interpretation available'
      };
      
      // Generate HTML and convert to PDF
      const html = await this.generateAssessmentReportHtml(templateData);
      const pdfBuffer = await this.convertHtmlToPdf(html);
      
      // Upload to S3
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      const pdfPath = `assessments/report_${userId}_${timestamp}.pdf`;
      const pdfUrl = await this.uploadAssessmentPdfToS3(pdfBuffer, pdfPath);
      
      // Update database with PDF URL
      await db.query(
        `UPDATE user_assessments SET pdf_url = ? WHERE user_id = ? AND assessment_id = ?`,
        [pdfUrl, userId, assessmentId]
      );
      
      return { pdfUrl };
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
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      return pdfBuffer;
    } finally {
      await browser.close();
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
}

module.exports = AssessmentsService;
