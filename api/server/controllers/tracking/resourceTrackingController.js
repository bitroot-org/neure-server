const ResourceTrackingService = require('../../services/tracking/resourceTrackingService');

class ResourceTrackingController {
  static async trackResourceView(req, res) {
    try {
      const { resource_type, resource_id } = req.body;
      const user_id = req.user.user_id;

      if (!resource_type || !resource_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "resource_type and resource_id are required",
          data: null
        });
      }

      const result = await ResourceTrackingService.trackResourceView(
        user_id,
        resource_type,
        resource_id
      );

      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error in trackResourceView:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getUserResourceHistory(req, res) {
    try {
      const user_id = req.user.user_id;
      const { resource_type, start_date, end_date } = req.query;

      const result = await ResourceTrackingService.getUserResourceHistory(
        user_id,
        resource_type,
        start_date,
        end_date
      );

      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error in getUserResourceHistory:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = ResourceTrackingController;