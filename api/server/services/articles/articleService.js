const db = require('../../../config/db');

class articleService {
  // Fetch all articles
  static async getArticles(page = 1, limit = 10, search_term = null, all = false) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Build query and params
      let query = 'SELECT * FROM articles';
      const queryParams = [];
      
      // Add search condition if search_term is provided
      if (search_term) {
        query += ' WHERE title LIKE ? OR content LIKE ? OR category LIKE ? OR tags LIKE ?';
        const searchPattern = `%${search_term}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      // Get total count with search applied
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count FROM (${query}) as filtered_articles`, 
        queryParams
      );
      const total = totalRows[0].count;

      // Add ordering
      query += ' ORDER BY created_at DESC';
      
      // Add pagination only if all=false
      if (!all) {
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
      }
      
      // Get articles
      const [articles] = await db.query(query, queryParams);

      const response = {
        status: true,
        code: 200,
        message: 'Articles fetched successfully',
        data: {
          articles
        }
      };
      
      // Add pagination info only if not returning all records
      if (!all) {
        response.data.pagination = {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit
        };
      }
      
      return response;
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
      const [result] = await db.query('DELETE FROM articles WHERE id = ?', [articleId]);

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
        message: 'Article permanently deleted successfully',
        data: { id: articleId },
      };
    } catch (error) {
      throw new Error('Error deleting article: ' + error.message);
    }
  }
}

module.exports = articleService;
