const { uploadImage } = require("../upload/UploadController");

const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,

} = require("../../services/articles/articleService");

class articleController {
  // Get all articles
  static async getArticles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await getArticles(page, limit);
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
      const result = await getArticleById(articleId);
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
      console.log("Article data:", articleData);
      let imageUrl = null;
  
      // If an image file is uploaded, handle the upload
      if (req.file) {
        const uploadResult = await uploadImage(req);
        console.log("Upload result:", uploadResult.url);
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading image",
            data: null,
          });
        }
        imageUrl = uploadResult.url; // Get the uploaded image URL
      }
  
      // Add the image URL to the article data
      articleData.imageUrl = imageUrl;
  
      // Call the service to create the article
      const result = await createArticle(articleData);
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Create article error:", error);
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
      const articleData = req.body;
      let imageUrl = null;
  
      // If an image file is uploaded, handle the upload
      if (req.file) {
        const uploadResult = await uploadImage(req);
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading image",
            data: null,
          });
        }
        imageUrl = uploadResult.url; // Get the uploaded image URL
      }
  
      // Add the image URL to the article data if a new image was uploaded
      if (imageUrl) {
        articleData.image_url = imageUrl;
      }
  
      // Call the service to update the article
      const result = await updateArticle(articleData);
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Update article error:", error);
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
      const result = await deleteArticle(articleId);
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