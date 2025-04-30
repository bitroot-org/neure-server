const { query } = require('../../../config/db');
const {
  getWorkshopDetails,
  getWorkshopsByCompanyIdOrUserId,
  getWorkshopDatesByCompanyIdOrUserId,
  getAllWorkshops,
  updateWorkshop,
  deleteWorkshop,
  createWorkshop,
  getAllWorkshopSchedules,
  scheduleWorkshop,
  cancelWorkshopSchedule,
  rescheduleWorkshop,
  getWorkshopAttendance,
  getUserWorkshopTickets,

  markAttendance,
  getWorkshopStats
} = require('../../services/company/workshopService');
const MediaController = require('../upload/UploadController');

class workshopController {
  static async getWorkshopDetails(req, res) {
    try {
      const { workshop_id, company_id } = req.query;
      
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

  // static async getAllWorkshops(req, res) {
  //   try {
  //     const page = parseInt(req.query.page, 10) || 1;
  //     const limit = parseInt(req.query.limit, 10) || 10;

  //     const result = await getAllWorkshops(page, limit);
  //     return res.status(result.code).json(result);
  //   } catch (error) {
  //     return res.status(500).json({
  //       status: false,
  //       code: 500,
  //       message: error.message,
  //       data: null,
  //     });
  //   }
  // }

  static async getAllWorkshops(req, res) {
    console.log("Received request to get all workshops:", req.query);
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const start_date = req.query.start_date || null;
      const end_date = req.query.end_date || null;


      const result = await getAllWorkshops(page, limit, start_date, end_date);
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

  // static async deleteWorkshop(req, res) {
  //   try {
  //     const { id } = req.params;

  //     if (!id) {
  //       return res.status(400).json({
  //         status: false,
  //         code: 400,
  //         message: 'Workshop ID is required',
  //         data: null,
  //       });
  //     }

  //     const result = await deleteWorkshop(id);
  //     return res.status(result.code).json(result);
  //   } catch (error) {
  //     return res.status(500).json({
  //       status: false,
  //       code: 500,
  //       message: error.message,
  //       data: null,
  //     });
  //   }
  // }

  static async deleteWorkshop(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Workshop ID is required"
        });
      }
  
      // First delete the files
      await MediaController.deleteWorkshopFiles(id);
  
      // Then delete the workshop record
      const result = await deleteWorkshop(id);
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Delete workshop error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting workshop",
        error: error.message
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

  // static async getAllWorkshopSchedules(req, res) {
  //   try {
  //     // Call the service to fetch all workshop schedules
  //     const result = await getAllWorkshopSchedules();
  
  //     return res.status(result.code).json(result);
  //   } catch (error) {
  //     return res.status(500).json({
  //       status: false,
  //       code: 500,
  //       message: error.message,
  //       data: null,
  //     });
  //   }
  // }

  static async getAllWorkshopSchedules(req, res) {
    try {
      const { start_date, end_date, search_term } = req.query;

      const result = await getAllWorkshopSchedules(start_date, end_date, search_term);
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
      const { company_id, date, time, workshop_id, duration_minutes } = req.body;

      // Validate required fields
      if (!company_id || !date || !time || !workshop_id || !duration_minutes) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Company ID, date, time, workshop ID, and duration minutes are required',
          data: null,
        });
      }

      // Validate duration_minutes is a positive number
      if (isNaN(duration_minutes) || duration_minutes <= 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Duration minutes must be a positive number',
          data: null,
        });
      }

      // Call the service to schedule the workshop and generate PDFs
      const result = await scheduleWorkshop({ 
        company_id, 
        date, 
        time, 
        workshop_id,
        duration_minutes 
      });

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

  static async cancelWorkshopSchedule(req, res) {
    try {
      const { schedule_id } = req.body;

      if (!schedule_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Schedule ID is required',
          data: null,
        });
      }

      const result = await cancelWorkshopSchedule(schedule_id);
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

  static async rescheduleWorkshop(req, res) {
    try {
      const { schedule_id, new_start_time, new_end_time, duration_minutes } = req.body;

      if (!schedule_id || !new_start_time || !new_end_time || !duration_minutes) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Schedule ID, new start time, new end time, and duration minutes are required',
          data: null,
        });
      }

      // Validate duration_minutes is a positive number
      if (isNaN(duration_minutes) || duration_minutes <= 0) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Duration minutes must be a positive number',
          data: null,
        });
      }

      const result = await rescheduleWorkshop(
        schedule_id, 
        new_start_time, 
        new_end_time, 
        duration_minutes
      );
      
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

  static async getWorkshopAttendance(req, res) {
    try {
      const { workshopId } = req.params;
      const { company_id } = req.query;
      
      if (!workshopId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID is required",
          data: null
        });
      }

      const result = await getWorkshopAttendance(workshopId, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getUserWorkshopTickets(req, res) {
    try {
      const { userId } = req.params;
      console.log("Received request for user workshop tickets:", userId);
      
      if (!userId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "User ID is required",
          data: null
        });
      }
  
      const tickets = await getUserWorkshopTickets(userId);
      
      return res.status(200).json({
        status: true,
        code: 200,
        message: "User workshop tickets retrieved successfully",
        data: tickets
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async markAttendance(req, res) {
    try {
      const { ticketCode } = req.body;
      const { company_id } = req.body;
      
      if (!ticketCode) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Ticket code is required",
          data: null
        });
      }

      const result = await markAttendance(ticketCode, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getWorkshopStats(req, res) {
    try {
      const { workshopId } = req.params;
      const { company_id } = req.query;
      
      if (!workshopId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID is required",
          data: null
        });
      }

      const result = await getWorkshopStats(workshopId, company_id);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

}

module.exports = workshopController;
