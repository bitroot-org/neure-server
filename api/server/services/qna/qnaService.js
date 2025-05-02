const db = require("../../../config/db");

class QnaService {
  static async createQna(question, answer) {
    try {
      const [result] = await db.query(
        `INSERT INTO qna (question, answer, is_active, created_at, updated_at) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [question, answer]
      );
      
      return {
        status: true,
        code: 201,
        message: "QnA created successfully",
        data: {
          id: result.insertId,
          question,
          answer,
        },
      };
    } catch (error) {
      throw new Error("Error creating QnA: " + error.message);
    }
  }

  static async getQnaList(page = 1, limit = 10, search = "") {
    try {
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT id, question, answer, is_active, created_at, updated_at 
        FROM qna
      `;
      
      const params = [];
      
      if (search) {
        query += ` WHERE question LIKE ? OR answer LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const [rows] = await db.query(query, params);
      
      // Get total count for pagination
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM qna ${search ? `WHERE question LIKE ? OR answer LIKE ?` : ''}`,
        search ? [`%${search}%`, `%${search}%`] : []
      );
      
      const total = countResult[0].total;
      
      return {
        status: true,
        code: 200,
        message: "QnA data retrieved successfully",
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error("Error fetching QnA list: " + error.message);
    }
  }

  static async getQnaById(id) {
    try {
      const [rows] = await db.query(
        `SELECT id, question, answer, is_active, created_at, updated_at 
         FROM qna 
         WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return {
          status: false,
          code: 404,
          message: "QnA not found",
          data: null,
        };
      }
      
      return {
        status: true,
        code: 200,
        message: "QnA retrieved successfully",
        data: rows[0],
      };
    } catch (error) {
      throw new Error("Error fetching QnA: " + error.message);
    }
  }

  static async updateQna(id, question, answer) {
    try {
      // Check if QnA exists
      const [existingQna] = await db.query(
        `SELECT id FROM qna WHERE id = ?`,
        [id]
      );
      
      if (existingQna.length === 0) {
        return {
          status: false,
          code: 404,
          message: "QnA not found",
          data: null,
        };
      }
      
      // Build update query dynamically based on provided fields
      const updateFields = [];
      const params = [];
      
      if (question !== undefined) {
        updateFields.push("question = ?");
        params.push(question);
      }
      
      if (answer !== undefined) {
        updateFields.push("answer = ?");
        params.push(answer);
      }
      
      updateFields.push("updated_at = NOW()");
      
      if (updateFields.length === 1) {
        return {
          status: false,
          code: 400,
          message: "No fields to update",
          data: null,
        };
      }
      
      params.push(id);
      
      await db.query(
        `UPDATE qna SET ${updateFields.join(", ")} WHERE id = ?`,
        params
      );
      
      return {
        status: true,
        code: 200,
        message: "QnA updated successfully",
        data: { id },
      };
    } catch (error) {
      throw new Error("Error updating QnA: " + error.message);
    }
  }

  static async deleteQna(id) {
    try {
      // Check if QnA exists
      const [existingQna] = await db.query(
        `SELECT id FROM qna WHERE id = ?`,
        [id]
      );
      
      if (existingQna.length === 0) {
        return {
          status: false,
          code: 404,
          message: "QnA not found",
          data: null,
        };
      }
      
      await db.query(
        `DELETE FROM qna WHERE id = ?`,
        [id]
      );
      
      return {
        status: true,
        code: 200,
        message: "QnA deleted successfully",
        data: null,
      };
    } catch (error) {
      throw new Error("Error deleting QnA: " + error.message);
    }
  }
}

module.exports = {
  createQna: QnaService.createQna,
  getQnaList: QnaService.getQnaList,
  getQnaById: QnaService.getQnaById,
  updateQna: QnaService.updateQna,
  deleteQna: QnaService.deleteQna,
};