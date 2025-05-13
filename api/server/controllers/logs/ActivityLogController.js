const ActivityLogService = require('../../services/logs/ActivityLogService');

class ActivityLogController {
  static async createLog(req, res) {
    try {
      const logData = req.body;
      
      // Validate required fields
      const requiredFields = ['performed_by', 'module_name', 'action'];
      const missingFields = requiredFields.filter(field => !logData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          data: null
        });
      }
      
      const result = await ActivityLogService.createLog(logData);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error in createLog controller:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Error creating activity log',
        data: null
      });
    }
  }
  
  static async getLogs(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        module_name: req.query.module_name || null,
        action: req.query.action || null,
        performed_by: req.query.performed_by || null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        user_id: req.query.user_id || null,
        company_id: req.query.company_id || null
      };
      
      const result = await ActivityLogService.getLogs(options);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error in getLogs controller:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Error retrieving activity logs',
        data: null
      });
    }
  }
  
  static async getActivitySummary(req, res) {
    try {
      const start_date = req.query.start_date || null;
      const end_date = req.query.end_date || null;
      const company_id = req.query.company_id || null;
      
      const result = await ActivityLogService.getActivitySummary(start_date, end_date, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error in getActivitySummary controller:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: 'Error retrieving activity summary',
        data: null
      });
    }
  }
}

module.exports = ActivityLogController;
