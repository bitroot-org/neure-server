const db = require('../../../config/db');

class AssessmentsService {
  static async getAllAssessments(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get total count of active assessments
      const [totalRows] = await db.query('SELECT COUNT(*) as count FROM assessments WHERE is_active = 1');
      const total = totalRows[0].count;

      // Fetch paginated assessments with questions and options
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
        GROUP BY a.id
        LIMIT ? OFFSET ?`;

      const [results] = await db.query(query, [limit, offset]);

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
        'INSERT INTO assessments (title, description, frequency_days) VALUES (?, ?, ?)',
        [assessmentData.title, assessmentData.description, assessmentData.frequency_days]
      );
      const assessmentId = assessmentResult.insertId;

      // Insert questions
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          'INSERT INTO questions (assessment_id, question_text, question_type) VALUES (?, ?, ?)',
          [assessmentId, question.question_text, question.question_type]
        );
        const questionId = questionResult.insertId;

        // Insert options
        for (const option of question.options) {
          await connection.query(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
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
        'UPDATE assessments SET title = ?, description = ?, frequency_days = ? WHERE id = ?',
        [assessmentData.title, assessmentData.description, assessmentData.frequency_days, assessmentId]
      );

      // Delete existing questions and options
      await connection.query('DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE assessment_id = ?)', [assessmentId]);
      await connection.query('DELETE FROM questions WHERE assessment_id = ?', [assessmentId]);

      // Insert updated questions and options
      for (const question of assessmentData.questions) {
        const [questionResult] = await connection.query(
          'INSERT INTO questions (assessment_id, question_text, question_type) VALUES (?, ?, ?)',
          [assessmentId, question.question_text, question.question_type]
        );
        const questionId = questionResult.insertId;

        for (const option of question.options) {
          await connection.query(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
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
        'SELECT id, title FROM assessments WHERE id = ? AND is_active = 1',
        [assessmentId]
      );

      console.log(assessment);

      if (!assessment || assessment.length === 0) {
        throw new Error('Assessment not found or already deleted');
      }

      // Soft delete the assessment
      await connection.query(
        'UPDATE assessments SET is_active = 0 WHERE id = ?',
        [assessmentId]
      );

      await connection.commit();
      return {
        status: true,
        message: 'Assessment deleted successfully',
        data: {
          id: assessmentId,
          title: assessment[0].title
        }
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AssessmentsService;