const { uploadImage } = require("../upload/UploadController");
const ActivityLogService = require('../../services/logs/ActivityLogService');

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
      const search_term = req.query.search_term || null;
      
      const result = await getArticles(page, limit, search_term);
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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      const articleData = req.body;
      const user = req.user;
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
      
      // Log the article creation with user-friendly description
      if (result.status) {
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'articles',
          action: 'create',
          description: `Article "${articleData.title}" created`
        });
      }
  
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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can update articles",
          data: null,
        });
      }

      const articleData = req.body;
      const user = req.user;
      let imageUrl = null;
      
      // Get article details before update for logging
      const articleBeforeUpdate = await getArticleById(articleData.id);
      const articleTitle = articleBeforeUpdate.status ? 
        articleBeforeUpdate.data?.title || `Untitled Article` : 
        `Untitled Article`;
  
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
      
      // Log the article update with user-friendly description
      if (result.status) {
        // Determine which fields were updated
        const updatedFields = Object.keys(articleData)
          .filter(key => key !== 'id')
          .map(key => {
            // Make field names more readable
            switch(key) {
              case 'title': return 'title';
              case 'content': return 'content';
              case 'image_url': return 'image';
              case 'status': return 'status';
              case 'category': return 'category';
              default: return key.replace(/_/g, ' ');
            }
          })
          .join(', ');
          
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'articles',
          action: 'update',
          description: `Article "${articleTitle}" updated. Changes made to: ${updatedFields}`
        });
      }
  
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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can delete articles",
          data: null,
        });
      }

      const { articleId } = req.params;
      const user = req.user;
      
      // Get article details before deletion for logging
      const articleBeforeDelete = await getArticleById(articleId);
      const articleTitle = articleBeforeDelete.status ? 
        articleBeforeDelete.data?.title || `Untitled Article` : 
        `Untitled Article`;
      
      const result = await deleteArticle(articleId);
      
      // Log the article deletion with user-friendly description
      if (result.status) {
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'articles',
          action: 'delete',
          description: `Article "${articleTitle}" was deleted`
        });
      }
      
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
