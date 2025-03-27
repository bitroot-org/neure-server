const db = require('../../../config/db');

class articleService {
  // Fetch all articles
  static async getArticles(page = 1, limit = 10) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const [totalRows] = await db.query('SELECT COUNT(*) as count FROM articles');
      const total = totalRows[0].count;

      // Get paginated articles
      const [articles] = await db.query(
        'SELECT * FROM articles LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: 'Articles fetched successfully',
        data: {
          articles,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit
          }
        }
      };
    } catch (error) {
      throw new Error('Error fetching articles: ' + error.message);
    }
  }

  // Fetch an article by its ID
  static async getArticleById(articleId) {
    try {
      const [article] = await db.query('SELECT * FROM articles WHERE id = ? ', [articleId]);
      
      if (article.length === 0) {
        return {
          status: false,
          code: 404,
          message: 'Article not found',
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: 'Article fetched successfully',
        data: article[0],
      };
    } catch (error) {
      throw new Error('Error fetching article: ' + error.message);
    }
  }

  // Create a new article
  static async createArticle(articleData) {
    try {
      const { title, content, reading_time, category, tags, imageUrl } = articleData;
      console.log("articleData:", articleData);
      const result = await db.query(
        'INSERT INTO articles (title, content, reading_time, category, tags, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, reading_time, category, tags, imageUrl]
      );

      return {
        status: true,
        code: 201,
        message: 'Article created successfully',
        data: { result },
      };
    } catch (error) {
      throw new Error('Error creating article: ' + error.message);
    }
  }

  // Update an article
  static async updateArticle(articleData) {
    try {
      const { id, title, content, reading_time, category, tags, image_url } = articleData;
  
      // Build the update query dynamically
      const fieldsToUpdate = [];
      const queryParams = [];
  
      if (title) {
        fieldsToUpdate.push("title = ?");
        queryParams.push(title);
      }
      if (content) {
        fieldsToUpdate.push("content = ?");
        queryParams.push(content);
      }
      if (reading_time) {
        fieldsToUpdate.push("reading_time = ?");
        queryParams.push(reading_time);
      }
      if (category) {
        fieldsToUpdate.push("category = ?");
        queryParams.push(category);
      }
      if (tags) {
        fieldsToUpdate.push("tags = ?");
        queryParams.push(tags);
      }
      if (image_url) {
        fieldsToUpdate.push("image_url = ?");
        queryParams.push(image_url);
      }
  
      if (fieldsToUpdate.length === 0) {
        return {
          status: false,
          code: 400,
          message: "No fields to update",
          data: null,
        };
      }
  
      queryParams.push(id);
  
      // Execute the update query
      const [result] = await db.query(
        `UPDATE articles SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
        queryParams
      );
  
      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Article not found",
          data: null,
        };
      }
  
      return {
        status: true,
        code: 200,
        message: "Article updated successfully",
        data: { id },
      };
    } catch (error) {
      throw new Error("Error updating article: " + error.message);
    }
  }

  // Delete an article
  static async deleteArticle(articleId) {
    try {
      const result = await db.query('UPDATE articles SET is_active = 0 WHERE id = ?', [articleId]);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: 'Article not found',
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: 'Article deleted successfully',
        data: { id: articleId },
      };
    } catch (error) {
      throw new Error('Error deleting article: ' + error.message);
    }
  }
}

module.exports = articleService;
