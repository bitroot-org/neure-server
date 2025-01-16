const articleService = require('../../services/articles/articleService');

class articleController {
  // Get all articles
  static async getArticles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await articleService.getArticles(page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Get an article by ID
  static async getArticleById(req, res) {
    try {
      const { articleId } = req.params;
      const result = await articleService.getArticleById(articleId);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Create a new article
  static async createArticle(req, res) {
    try {
      const articleData = req.body;
      const result = await articleService.createArticle(articleData);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Update an article
  static async updateArticle(req, res) {
    try {
      const { articleId } = req.params;
      const articleData = req.body;
      const result = await articleService.updateArticle(articleId, articleData);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Delete an article
  static async deleteArticle(req, res) {
    try {
      const { articleId } = req.params;
      const result = await articleService.deleteArticle(articleId);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }
}

module.exports = articleController; 