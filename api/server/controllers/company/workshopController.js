const workshopService = require("../../services/company/workshopService");

const { getWorkshopDetails } = require('../../services/company/workshopService');

class workshopController {
  static async getWorkshopDetails(req, res) {
    try {
      const { workshop_id, company_id } = req.body;
      if (!workshop_id || !company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID and Company ID are required",
          data: null,
        });
      }

      const result = await getWorkshopDetails(workshop_id, company_id);
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
