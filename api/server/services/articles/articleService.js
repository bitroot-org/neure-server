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
      const { title, content, reading_time, category, tags, image_url } = articleData;
      const result = await db.query(
        'INSERT INTO articles (title, content, reading_time, category, tags, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, reading_time, category, JSON.stringify(tags), image_url]
      );

      return {
        status: true,
        code: 201,
        message: 'Article created successfully',
        data: { id: result.insertId },
      };
    } catch (error) {
      throw new Error('Error creating article: ' + error.message);
    }
  }

  // Update an article
  static async updateArticle(articleId, articleData) {
    try {
      const { title, content, reading_time, category, tags, image_url } = articleData;
      const result = await db.query(
        'UPDATE articles SET title = ?, content = ?, reading_time = ?, category = ?, tags = ?, image_url = ? WHERE id = ?',
        [title, content, reading_time, category, JSON.stringify(tags), image_url, articleId]
      );

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
        message: 'Article updated successfully',
        data: { id: articleId },
      };
    } catch (error) {
      throw new Error('Error updating article: ' + error.message);
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
