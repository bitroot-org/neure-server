const DashboardService = require("../../services/dashboard/dashboardService");

class DashboardController {
  static async getDashboardMetrics(req, res) {
    console.log("Dashboard metrics request");
    try {
      const result = await DashboardService.getDashboardMetrics();
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = DashboardController;