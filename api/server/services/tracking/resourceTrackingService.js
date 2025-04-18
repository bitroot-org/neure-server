const db = require('../../../config/db');

class ResourceTrackingService {
  static async verifyResourceExists(resource_type, resource_id) {
    try {
      let query;
      switch (resource_type) {
        case 'article':
          query = 'SELECT id FROM articles WHERE id = ?';
          break;
        case 'gallery_image':
        case 'gallery_video':
        case 'gallery_document':
          query = 'SELECT id FROM gallery WHERE id = ? AND file_type = ?';
          const fileType = resource_type.replace('gallery_', '');
          const [galleryItem] = await db.query(query, [resource_id, fileType]);
          return galleryItem && galleryItem.length > 0;
        case 'soundscape':
          query = 'SELECT id FROM soundscapes WHERE id = ?';
          break;
        default:
          return false;
      }

      if (resource_type !== 'gallery_image' && 
          resource_type !== 'gallery_video' && 
          resource_type !== 'gallery_document') {
        const [result] = await db.query(query, [resource_id]);
        return result && result.length > 0;
      }
    } catch (error) {
      throw new Error(`Error verifying resource: ${error.message}`);
    }
  }

  static async trackResourceView(user_id, resource_type, resource_id) {
    try {
      // Validate resource type
      const validResourceTypes = ['article', 'gallery_image', 'gallery_video', 'gallery_document', 'soundscape'];
      if (!validResourceTypes.includes(resource_type)) {
        return {
          status: false,
          code: 400,
          message: `Invalid resource_type. Must be one of: ${validResourceTypes.join(', ')}`,
          data: null
        };
      }

      // Verify resource exists
      const resourceExists = await this.verifyResourceExists(resource_type, resource_id);
      if (!resourceExists) {
        return {
          status: false,
          code: 404,
          message: `Resource not found with id ${resource_id} and type ${resource_type}`,
          data: null
        };
      }

      // Insert tracking record
      const query = `
        INSERT INTO user_resource_tracking 
        (user_id, resource_type, resource_id, action_type) 
        VALUES (?, ?, ?, 'view')
      `;

      const [result] = await db.query(query, [user_id, resource_type, resource_id]);

      return {
        status: true,
        code: 201,
        message: "Resource view tracked successfully",
        data: {
          tracking_id: result.insertId,
          user_id,
          resource_type,
          resource_id,
          action_type: 'view',
          timestamp: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Error tracking resource view: ${error.message}`);
    }
  }

  static async getUserResourceHistory(user_id, resource_type = null, start_date = null, end_date = null) {
    try {
      let query = `
        SELECT 
          urt.id,
          urt.resource_type,
          urt.resource_id,
          urt.action_type,
          urt.action_timestamp,
          CASE 
            WHEN urt.resource_type = 'article' THEN a.title
            WHEN urt.resource_type IN ('gallery_image', 'gallery_video', 'gallery_pdf') THEN g.title
            WHEN urt.resource_type = 'soundscape' THEN s.title
            ELSE NULL
          END as resource_title
        FROM user_resource_tracking urt
        LEFT JOIN articles a ON urt.resource_type = 'article' AND urt.resource_id = a.id
        LEFT JOIN gallery g ON urt.resource_type IN ('gallery_image', 'gallery_video', 'gallery_pdf') AND urt.resource_id = g.id
        LEFT JOIN soundscapes s ON urt.resource_type = 'soundscape' AND urt.resource_id = s.id
        WHERE urt.user_id = ?
      `;
      const queryParams = [user_id];

      if (resource_type) {
        query += ' AND urt.resource_type = ?';
        queryParams.push(resource_type);
      }

      if (start_date) {
        query += ' AND DATE(urt.action_timestamp) >= ?';
        queryParams.push(start_date);
      }

      if (end_date) {
        query += ' AND DATE(urt.action_timestamp) <= ?';
        queryParams.push(end_date);
      }

      query += ' ORDER BY urt.action_timestamp DESC';

      const [history] = await db.query(query, queryParams);

      return {
        status: true,
        code: 200,
        message: "Resource history retrieved successfully",
        data: history
      };
    } catch (error) {
      throw new Error(`Error fetching resource history: ${error.message}`);
    }
  }
}

module.exports = ResourceTrackingService;
