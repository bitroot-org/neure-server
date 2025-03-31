const AnalyticsService = require("../../services/analytics/analyticsService");

class AnalyticsController {
  static async getAnalytics(req, res) {
    try {
      const timeRange = parseInt(req.query.days) || 30;
      
      if (timeRange < 1 || timeRange > 365) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Time range must be between 1 and 365 days",
          data: null
        });
      }

      const result = await AnalyticsService.getAnalytics(timeRange);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Analytics error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = AnalyticsController;