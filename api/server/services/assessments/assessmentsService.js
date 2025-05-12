const db = require("../../../config/db");
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const ActivityLogService = require('../logs/ActivityLogService');
const UserServices = require('../user/UserServices');


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
      
      // Build query
      let query = `
        SELECT 
          a.id, 
          a.title, 
          a.description, 
          a.assessment_type,
          a.created_at
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
        query += " LIMIT ? OFFSET ?";
      }
      
      // Get assessments
      const [assessments] = await db.query(
        query,
        all ? [user_id] : [user_id, limit, offset]
      );
      
      const response = {
        assessments
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
                    'is_correct', o.is_correct
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
      return results[0];
    } catch (error) {
      throw error;
    }
  }

  static async createAssessment(assessmentData) {
    const connection = await db.getConnection();
    try {
      console.log("Starting assessment creation with data:", {
        title: assessmentData.title,
        isPsiAssessment: assessmentData.is_psi_assessment || false
      });

      await connection.beginTransaction();

      // Insert assessment without frequency_days
      const [assessmentResult] = await connection.query(
        "INSERT INTO assessments (title, description, is_psi_assessment) VALUES (?, ?, ?)",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.is_psi_assessment || 0, 
        ]
      );
      const assessmentId = assessmentResult.insertId;
      console.log("Assessment created with ID:", assessmentId);

      // Insert questions
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          "INSERT INTO questions (assessment_id, question_text, question_type) VALUES (?, ?, ?)",
          [assessmentId, question.question_text, question.question_type]
        );
        const questionId = questionResult.insertId;

        // Insert options
        for (const option of question.options) {
          await connection.query(
            "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
            [questionId, option.option_text, option.is_correct]
          );
        }
      }
      console.log("Questions and options inserted successfully");

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
      await ActivityLogService.createLog({
        user_id: assessmentData.user_id || null,
        performed_by: 'admin',
        module_name: 'assessments',
        action: 'create',
        description: `${assessmentType} "${assessmentData.title}" created with ${assessmentData.questions.length} questions.`
      });

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
    try {
      await connection.beginTransaction();

      // Update assessment details without frequency_days
      await connection.query(
        "UPDATE assessments SET title = ?, description = ?, is_psi_assessment = ? WHERE id = ?",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.is_psi_assessment || 0,
          assessmentId,
        ]
      );

      // Delete existing questions and options
      await connection.query(
        "DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE assessment_id = ?)",
        [assessmentId]
      );
      await connection.query("DELETE FROM questions WHERE assessment_id = ?", [
        assessmentId,
      ]);

      // Insert updated questions and options
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          "INSERT INTO questions (assessment_id, question_text, question_type) VALUES (?, ?, ?)",
          [assessmentId, question.question_text, question.question_type]
        );
        const questionId = questionResult.insertId;

        for (const option of question.options) {
          await connection.query(
            "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
            [questionId, option.option_text, option.is_correct]
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

      // Modified query to return options directly without JSON_ARRAYAGG
      const [questions] = await connection.query(`
        SELECT 
          q.id as question_id,
          q.question_type,
          o.id as option_id,
          o.is_correct
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
            question_type: curr.question_type,
            options: []
          };
        }
        acc[curr.question_id].options.push({
          id: curr.option_id,
          is_correct: curr.is_correct
        });
        return acc;
      }, {});

      const structuredQuestions = Object.values(questionMap);
      
      // Check if this is a PSI assessment
      const isPsiAssessment = assessment[0].is_psi_assessment === 1;
      
      // For PSI assessment, we'll calculate the PSI score differently
      let psiScore = 0;
      let totalPsiQuestions = 0;
      
      // Insert submission to get the user_assessment_id with score 100 for PSI assessments
      const score = isPsiAssessment ? 100 : 0; // Set score to 100 for PSI assessments
      
      const [userAssessmentResult] = await connection.query(
        `INSERT INTO user_assessments 
         (user_id, company_id, assessment_id, responses, score, completed_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, company_id, assessment_id, JSON.stringify(responses), score]
      );
      
      const userAssessmentId = userAssessmentResult.insertId;
      
      // For regular assessments, calculate score as before
      let totalQuestions = structuredQuestions.length;
      let correctAnswers = 0;
      
      // Process responses
      for (const question of structuredQuestions) {
        const userResponse = responses.find(r => r.question_id === question.question_id);
        if (!userResponse) continue;
        
        let isCorrect = 0;
        
        if (isPsiAssessment) {
          // For PSI assessment, we don't calculate correctness
          // Instead, we get the option number (1-5) and use it as points
          if (userResponse.selected_options && userResponse.selected_options.length > 0) {
            // Get all options for this question to find the index of selected option
            const [optionsOrdered] = await connection.query(
              `SELECT id FROM options WHERE question_id = ? ORDER BY id ASC`,
              [question.question_id]
            );
            
            const selectedOptionId = userResponse.selected_options[0];
            // Find the index (0-based) of the selected option
            const optionIndex = optionsOrdered.findIndex(opt => opt.id === selectedOptionId);
            
            if (optionIndex !== -1) {
              // Add points based on option index (1-5)
              const optionPoints = optionIndex + 1;
              psiScore += optionPoints;
              totalPsiQuestions++;
            }
          }
        } else {
          // Regular assessment scoring logic
          if (question.question_type === 'single_choice') {
            const selectedOption = userResponse.selected_options[0];
            const correctOption = question.options.find(o => o.is_correct)?.id;
            if (selectedOption === correctOption) {
              correctAnswers++;
              isCorrect = 1;
            }
          } else if (question.question_type === 'multiple_choice') {
            const correctOptions = new Set(question.options.filter(o => o.is_correct).map(o => o.id));
            const selectedOptions = new Set(userResponse.selected_options);
            if (this.setsAreEqual(correctOptions, selectedOptions)) {
              correctAnswers++;
              isCorrect = 1;
            }
          }
        }
        
        // Store individual response
        await connection.query(
          `INSERT INTO user_assessment_responses 
           (user_assessment_id, question_id, selected_options, is_correct) 
           VALUES (?, ?, ?, ?)`,
          [userAssessmentId, question.question_id, JSON.stringify(userResponse.selected_options), isCorrect]
        );
      }

      // Calculate final score for regular assessments
      if (!isPsiAssessment) {
        const calculatedScore = (correctAnswers / totalQuestions) * 100;
        
        // Update the score in user_assessments
        await connection.query(
          `UPDATE user_assessments SET score = ? WHERE id = ?`,
          [calculatedScore, userAssessmentId]
        );
      }
      
      // If this is a PSI assessment, update the user's PSI score
      if (isPsiAssessment && totalPsiQuestions > 0) {
        // Calculate average PSI score (1-5) with one decimal point
        const avgPsiScore = parseFloat((psiScore / totalPsiQuestions).toFixed(1));
        const finalPsiScore = Math.max(1, Math.min(5, avgPsiScore));
        
        // Update user's PSI score
        await UserServices.submitPSI(user_id, company_id, finalPsiScore);

        
        console.log(`Updated PSI score for user ${user_id} to ${finalPsiScore} based on assessment`);
      }

      // // Get user details for the notification
      // const [userDetails] = await connection.query(
      //   "SELECT first_name, last_name FROM users WHERE user_id = ?",
      //   [user_id]
      // );

      // Create notification for the user
      await NotificationService.createNotification({
        title: `Assessment Submission Result: ${assessment[0].title}`,
        content: isPsiAssessment 
          ? `You have completed the PSI assessment "${assessment[0].title}".`
          : `You have completed the assessment "${assessment[0].title}" with a score of ${score.toFixed(1)}%. 
             Correct answers: ${correctAnswers} out of ${totalQuestions} questions.`,
        type: "ASSESSMENT_COMPLETED",
        company_id: company_id,
        user_id: user_id,
        priority: "HIGH",
        metadata: JSON.stringify({
          assessment_id: assessment_id,
          score: isPsiAssessment ? 100 : score,
          total_questions: totalQuestions,
          correct_answers: isPsiAssessment ? totalQuestions : correctAnswers,
          completion_date: new Date().toISOString()
        })
      });

      await connection.commit();

      return {
        score: isPsiAssessment ? 100 : (correctAnswers / totalQuestions) * 100,
        total_questions: totalQuestions,
        correct_answers: isPsiAssessment ? totalQuestions : correctAnswers,
        questions: structuredQuestions,
        is_psi_assessment: isPsiAssessment
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper function to compare sets
  static setsAreEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const item of a) if (!b.has(item)) return false;
    return true;
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
        `SELECT id, score, completed_at 
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

      // Get questions with options and user responses
      const [results] = await db.query(`
        SELECT 
          q.id as question_id,
          q.question_text,
          q.question_type,
          uar.selected_options as user_selected_options,
          uar.is_correct as user_is_correct,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', o.id,
                'option_text', o.option_text,
                'is_correct', o.is_correct
              )
            )
            FROM options o
            WHERE o.question_id = q.id
          ) as options
        FROM questions q
        JOIN user_assessment_responses uar ON q.id = uar.question_id
        WHERE uar.user_assessment_id = ?
        ORDER BY q.id
      `, [userAssessmentId]);

      return {
        status: true,
        code: 200,
        message: "User assessment responses retrieved successfully",
        data: {
          assessment: assessment[0],
          user_assessment: {
            id: userAssessment[0].id,
            score: userAssessment[0].score,
            completed_at: userAssessment[0].completed_at
          },
          responses: results
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

  // Add a method to identify if an assessment is a PSI assessment
  static async isPsiAssessment(assessmentId) {
    try {
      const [result] = await db.query(
        "SELECT is_psi_assessment FROM assessments WHERE id = ? AND is_active = 1",
        [assessmentId]
      );
      
      // Return true if the assessment exists and is_psi_assessment is 1
      return result.length > 0 && result[0].is_psi_assessment === 1;
    } catch (error) {
      console.error("Error checking if assessment is PSI:", error);
      return false;
    }
  }
}

module.exports = AssessmentsService;
