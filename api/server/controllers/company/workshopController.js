const {
  getWorkshopDetails,
  getWorkshopsByCompanyIdOrUserId,
  getWorkshopDatesByCompanyIdOrUserId,
  getAllWorkshops,
  updateWorkshop,
  deleteWorkshop,
  createWorkshop,
  getAllWorkshopSchedules,
  scheduleWorkshop
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

  static async getAllWorkshops(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await getAllWorkshops(page, limit);
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

  static async updateWorkshop(req, res) {
    try {
      const { id } = req.body;
      const workshopData = req.body;

      if (!id || !workshopData) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Workshop ID and data are required',
          data: null,
        });
      }

      const result = await updateWorkshop(id, workshopData);
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

  static async deleteWorkshop(req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Workshop ID is required',
          data: null,
        });
      }

      const result = await deleteWorkshop(id);
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

  static async createWorkshop(req, res) {
    try {
      const { title, description, host_name, agenda } = req.body;

      // Validate required fields
      if (!title || !description || !host_name) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Title, description, and host name are required',
          data: null,
        });
      }

      // Call the service to create the workshop
      const result = await createWorkshop({ title, description, host_name, agenda });

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

  static async getAllWorkshopSchedules(req, res) {
    try {
      // Call the service to fetch all workshop schedules
      const result = await getAllWorkshopSchedules();
  
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

  static async scheduleWorkshop(req, res) {
    try {
      const { company_id, date, time, workshop_id } = req.body;
  
      // Validate required fields
      if (!company_id || !date || !time || !workshop_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Company ID, date, time, and workshop ID are required',
          data: null,
        });
      }
  
      // Call the service to schedule the workshop
      const result = await scheduleWorkshop({ company_id, date, time, workshop_id });
  
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
