const db = require("../../../config/db");

class AssessmentsService {
  static async getAllAssessments(page = 1, limit = 10, user_id) {
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
      const total = totalRows[0].count;

      // Fetch paginated unsubmitted assessments with questions and options
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
        WHERE a.is_active = 1 
        AND NOT EXISTS (
          SELECT 1 
          FROM user_assessments ua 
          WHERE ua.assessment_id = a.id 
          AND ua.user_id = ?
        )
        GROUP BY a.id
        LIMIT ? OFFSET ?`;

      const [results] = await db.query(query, [user_id, limit, offset]);

      return {
        assessments: results,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      };
    } catch (error) {
      throw error;
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
      await connection.beginTransaction();

      // Insert assessment
      const [assessmentResult] = await connection.query(
        "INSERT INTO assessments (title, description, frequency_days) VALUES (?, ?, ?)",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.frequency_days,
        ]
      );
      const assessmentId = assessmentResult.insertId;

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

      await connection.commit();
      return await this.getAssessmentById(assessmentId);
    } catch (error) {
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

      // Update assessment details
      await connection.query(
        "UPDATE assessments SET title = ?, description = ?, frequency_days = ? WHERE id = ?",
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.frequency_days,
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
        "SELECT id FROM assessments WHERE id = ? AND is_active = 1",
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
      console.log("Structured Questions:", JSON.stringify(structuredQuestions, null, 2));

      // Calculate score
      let totalQuestions = structuredQuestions.length;
      let correctAnswers = 0;

      for (const question of structuredQuestions) {
        const userResponse = responses.find(r => r.question_id === question.question_id);
        if (!userResponse) continue;
        
        if (question.question_type === 'single_choice') {
          const selectedOption = userResponse.selected_options[0];
          const correctOption = question.options.find(o => o.is_correct)?.id;
          if (selectedOption === correctOption) correctAnswers++;
        } else if (question.question_type === 'multiple_choice') {
          const correctOptions = new Set(question.options.filter(o => o.is_correct).map(o => o.id));
          const selectedOptions = new Set(userResponse.selected_options);
          if (this.setsAreEqual(correctOptions, selectedOptions)) correctAnswers++;
        }
      }

      const score = (correctAnswers / totalQuestions) * 100;

      // Insert submission
      await connection.query(
        `INSERT INTO user_assessments 
         (user_id, company_id, assessment_id, responses, score, completed_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, company_id, assessment_id, JSON.stringify(responses), score]
      );

      await connection.commit();

      return {
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        questions: structuredQuestions // Optional: return for debugging
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
}

module.exports = AssessmentsService;
