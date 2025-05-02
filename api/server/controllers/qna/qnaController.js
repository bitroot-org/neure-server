const db = require("../../../config/db");
const { 
  createQna, 
  getQnaList, 
  getQnaById, 
  updateQna, 
  deleteQna 
} = require("../../services/qna/qnaService");

class QnaController {
  static async createQna(req, res) {
    try {
      const { question, answer } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Question and answer are required",
          data: null,
        });
      }
      
      const result = await createQna(question, answer);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating QnA:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while creating QnA",
        data: null,
      });
    }
  }

  static async getQnaList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      
      const result = await getQnaList(page, limit, search);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching QnA list:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching QnA data",
        data: null,
      });
    }
  }

  static async getQnaById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "QnA ID is required",
          data: null,
        });
      }
      
      const result = await getQnaById(id);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching QnA:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching QnA data",
        data: null,
      });
    }
  }

  static async updateQna(req, res) {
    try {
      const { id, question, answer } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "QnA ID is required",
          data: null,
        });
      }
      
      const result = await updateQna(id, question, answer);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating QnA:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while updating QnA",
        data: null,
      });
    }
  }

  static async deleteQna(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "QnA ID is required",
          data: null,
        });
      }
      
      const result = await deleteQna(id);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting QnA:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while deleting QnA",
        data: null,
      });
    }
  }
}

module.exports = QnaController;