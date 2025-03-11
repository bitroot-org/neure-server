const {
  getWorkshopDetails,
  getWorkshopsByCompanyIdOrUserId,
  getWorkshopDatesByCompanyIdOrUserId,

} = require('../../services/company/workshopService');

class workshopController {
  static async getWorkshopDetails(req, res) {
    try {
      const { workshop_id, company_id } = req.query;
      if (!workshop_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID and Company ID are required",
          data: null,
        });
      }

      const result = await getWorkshopDetails(workshop_id);
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

  static async getWorkshopsByCompanyIdOrUserId(req, res) {
    try {
      console.log("Received request to get workshops by company or user ID:", req.query);
      const company_id = req.query.company_id ? parseInt(req.query.company_id) : null;
      const user_id = req.query.user_id ? parseInt(req.query.user_id) : null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.pageSize) || 6;
      const start_time = req.query.start_time;
  
      const result = await getWorkshopsByCompanyIdOrUserId(company_id, user_id, page, limit, start_time);
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

  static async getWorkshopDatesByCompanyIdOrUserId(req, res) {
    try {
      const company_id = req.query.company_id ? parseInt(req.query.company_id) : null;
      const user_id = req.query.user_id ? parseInt(req.query.user_id) : null;
  
      const result = await getWorkshopDatesByCompanyIdOrUserId(company_id, user_id);
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

module.exports = workshopController;
