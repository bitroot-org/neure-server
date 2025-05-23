const db = require("../../../config/db");
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
  updateWorkshopScheduleStatus,
  markAttendance,
  getWorkshopStats
} = require('../../services/company/workshopService');
const MediaController = require('../upload/UploadController');
const ActivityLogService = require('../../services/logs/ActivityLogService');

class workshopController {
  static async getWorkshopDetails(req, res) {
    try {
      const { workshop_id, company_id, schedule_id } = req.query;
      
      if (!workshop_id || !company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID and Company ID are required",
          data: null,
        });
      }

      const result = await getWorkshopDetails(workshop_id, company_id, schedule_id);
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
      // console.log("Received request to get workshops by company or user ID:", req.query);
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
    console.log("Received request to get all workshops:", req.query);
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const start_date = req.query.start_date || null;
      const end_date = req.query.end_date || null;
      const search_term = req.query.search_term || null;
      const all = req.query.all === 'true';

      const result = await getAllWorkshops(page, limit, start_date, end_date, search_term, all);
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
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!id || !workshopData) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Workshop ID and data are required',
          data: null,
        });
      }

      // Get workshop details before update for logging
      const [workshopDetails] = await db.query(
        "SELECT title FROM workshops WHERE id = ?",
        [id]
      );

      const result = await updateWorkshop(id, workshopData);
      
      // Log the workshop update
      if (result.status) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user.user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user.user_id}`;
          
          const updatedFields = Object.keys(workshopData)
            .filter(key => key !== 'id')
            .join(', ');
          
          await ActivityLogService.createLog({
            user_id: user.user_id,
            performed_by: performedBy,
            module_name: 'workshops',
            action: 'update',
            description: `Workshop "${workshopDetails[0]?.title || id}" (ID: ${id}) updated. Fields changed: ${updatedFields}`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }

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
      const { id } = req.params;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Workshop ID is required"
        });
      }
  
      // Get workshop details before deletion for logging
      const [workshopDetails] = await db.query(
        "SELECT title FROM workshops WHERE id = ?",
        [id]
      );
      
      // First delete the files
      await MediaController.deleteWorkshopFiles(id);
  
      // Then delete the workshop record
      const result = await deleteWorkshop(id);
  
      // Log the workshop deletion
      // if (result.status) {
      //   await ActivityLogService.createLog({
      //     user_id: user?.user_id,
      //     performed_by: 'admin',
      //     module_name: 'workshops',
      //     action: 'delete',
      //     description: `Workshop "${workshopDetails[0]?.title || ''}" (ID: ${id}) deleted`
      //   });
      // }

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
      const { title, description, agenda } = req.body;
      const user = req.user; 

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Title and description are required',
          data: null,
        });
      }

      // Call the service to create the workshop
      const result = await createWorkshop({ title, description, agenda });

      // Log the workshop creation
      // if (result.status) {
      //   await ActivityLogService.createLog({
      //     user_id: user?.user_id,
      //     performed_by: 'admin',
      //     module_name: 'workshops',
      //     action: 'create',
      //     description: `Workshop "${title}" created with ID ${result.data.id}`
      //   });
      // }

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
      const { company_id, date, time, workshop_id, duration_minutes, host_name } = req.body;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

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

      // Get workshop and company details for logging
      const [workshopDetails] = await db.query(
        "SELECT title FROM workshops WHERE id = ?",
        [workshop_id]
      );
      
      const [companyDetails] = await db.query(
        "SELECT company_name FROM companies WHERE id = ?",
        [company_id]
      );

      // Call the service to schedule the workshop and generate PDFs
      const result = await scheduleWorkshop({ 
        company_id, 
        date, 
        time, 
        workshop_id,
        duration_minutes,
        host_name 
      });

      // Log the workshop scheduling
      if (result.status) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user.user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user.user_id}`;
          
          const formattedDateTime = new Date(`${date} ${time}`).toLocaleString();
          await ActivityLogService.createLog({
            user_id: user.user_id,
            performed_by: performedBy,
            company_id: company_id,
            module_name: 'workshops',
            action: 'schedule',
            description: `Workshop "${workshopDetails[0]?.title || ''}" (ID: ${workshop_id}) scheduled for company "${companyDetails[0]?.company_name || ''}" (ID: ${company_id}) on ${formattedDateTime}`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }

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
      const { schedule_id, reason } = req.body;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!schedule_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Schedule ID is required',
          data: null,
        });
      }

      // Get schedule details before cancellation for logging
      const [scheduleDetails] = await db.query(`
        SELECT 
          ws.id, 
          w.id as workshop_id, 
          w.title as workshop_title, 
          c.id as company_id, 
          c.company_name,
          ws.start_time
        FROM workshop_schedules ws
        JOIN workshops w ON ws.workshop_id = w.id
        JOIN companies c ON ws.company_id = c.id
        WHERE ws.id = ?
      `, [schedule_id]);

      // Use the generalized method with 'canceled' status
      const result = await updateWorkshopScheduleStatus(schedule_id, 'cancelled', reason);
      
      // Log the workshop cancellation
      if (result.status && scheduleDetails.length > 0) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user.user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user.user_id}`;
          
          const formattedDateTime = new Date(scheduleDetails[0].start_time).toLocaleString();
          await ActivityLogService.createLog({
            user_id: user.user_id,
            performed_by: performedBy,
            company_id: scheduleDetails[0].company_id,
            module_name: 'workshops',
            action: 'cancel',
            description: `Workshop "${scheduleDetails[0].workshop_title}" (ID: ${scheduleDetails[0].workshop_id}) for company "${scheduleDetails[0].company_name}" (ID: ${scheduleDetails[0].company_id}) scheduled for ${formattedDateTime} was cancelled${reason ? `. Reason: ${reason}` : ''}`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }

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
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!schedule_id || !new_start_time || !new_end_time) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Schedule ID, new start time, and new end time are required',
          data: null,
        });
      }

      // Validate duration_minutes if provided
      if (duration_minutes !== undefined && (isNaN(duration_minutes) || duration_minutes <= 0)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: 'Duration minutes must be a positive number',
          data: null,
        });
      }

      console.log("Starting reschedule with data:", req.body);

      // Get schedule details before rescheduling for logging
      const [scheduleDetails] = await db.query(`
        SELECT 
          ws.id, 
          w.id as workshop_id, 
          w.title as workshop_title, 
          c.id as company_id, 
          c.company_name,
          ws.start_time,
          ws.end_time
        FROM workshop_schedules ws
        JOIN workshops w ON ws.workshop_id = w.id
        JOIN companies c ON ws.company_id = c.id
        WHERE ws.id = ?
      `, [schedule_id]);

      console.log("Schedule details:", scheduleDetails);

      const result = await rescheduleWorkshop(
        schedule_id, 
        new_start_time, 
        new_end_time, 
        duration_minutes
      );
      
      // Log the workshop rescheduling
      if (result.status && scheduleDetails.length > 0) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user.user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user.user_id}`;
          
          const oldStartTime = new Date(scheduleDetails[0].start_time).toLocaleString();
          const oldEndTime = new Date(scheduleDetails[0].end_time).toLocaleString();
          const newStartTimeFormatted = new Date(new_start_time).toLocaleString();
          const newEndTimeFormatted = new Date(new_end_time).toLocaleString();
          
          await ActivityLogService.createLog({
            user_id: user.user_id,
            performed_by: performedBy,
            company_id: scheduleDetails[0].company_id,
            module_name: 'workshops',
            action: 'reschedule',
            description: `Workshop "${scheduleDetails[0].workshop_title}" (ID: ${scheduleDetails[0].workshop_id}) for company "${scheduleDetails[0].company_name}" (ID: ${scheduleDetails[0].company_id}) rescheduled from ${oldStartTime}-${oldEndTime} to ${newStartTimeFormatted}-${newEndTimeFormatted}`
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }
      
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
      const { company_id, schedule_id, all, status } = req.query;
      console.log("Received request for workshop attendance:", { workshopId, company_id, schedule_id, all, status });

      const attendance_status = status || null;

      
      // If 'all' parameter is present, set limit to -1 to return all records
      // Otherwise use normal pagination
      const limit = all === 'true' ? -1 : parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      
      if (!workshopId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Workshop ID is required",
          data: null
        });
      }

      const result = await getWorkshopAttendance(
        workshopId, 
        company_id, 
        schedule_id,
        page,
        limit,
        "json",
        attendance_status
      );
      
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
      const { ticketCode, company_id, schedule_id } = req.body;
      
      if (!ticketCode) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Ticket code is required",
          data: null
        });
      }

      const result = await markAttendance(ticketCode, company_id, schedule_id);
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

  static async updateWorkshopScheduleStatus(req, res) {
    try {
      const { schedule_id, status, reason } = req.body;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      if (!schedule_id || !status) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Schedule ID and status are required",
          data: null,
        });
      }

      // Get schedule details before status update for logging
      const [scheduleDetails] = await db.query(`
        SELECT 
          ws.id, 
          w.id as workshop_id, 
          w.title as workshop_title, 
          c.id as company_id, 
          c.company_name,
          ws.status as current_status,
          ws.start_time
        FROM workshop_schedules ws
        JOIN workshops w ON ws.workshop_id = w.id
        JOIN companies c ON ws.company_id = c.id
        WHERE ws.id = ?
      `, [schedule_id]);

      const result = await updateWorkshopScheduleStatus(schedule_id, status, reason);
      
      // Log the workshop status update
      if (result.status && scheduleDetails.length > 0) {
        try {
          // Get user details for the log
          const [userDetails] = await db.query(
            `SELECT first_name, last_name FROM users WHERE user_id = ?`,
            [user.user_id]
          );
          
          const performedBy = userDetails && userDetails.length > 0 
            ? `${userDetails[0].first_name} ${userDetails[0].last_name}`
            : `User ID: ${user.user_id}`;
          
          const formattedDateTime = new Date(scheduleDetails[0].start_time).toLocaleString();
          let actionType = 'status_update';
          let description = '';
          
          // Customize log message based on status
          if (status === 'cancelled') {
            actionType = 'cancel';
            description = `Workshop "${scheduleDetails[0].workshop_title}" (ID: ${scheduleDetails[0].workshop_id}) for company "${scheduleDetails[0].company_name}" (ID: ${scheduleDetails[0].company_id}) scheduled for ${formattedDateTime} was cancelled${reason ? `. Reason: ${reason}` : ''}`;
          } else if (status === 'completed') {
            actionType = 'complete';
            description = `Workshop "${scheduleDetails[0].workshop_title}" (ID: ${scheduleDetails[0].workshop_id}) for company "${scheduleDetails[0].company_name}" (ID: ${scheduleDetails[0].company_id}) held on ${formattedDateTime} was marked as completed`;
          } else {
            description = `Workshop "${scheduleDetails[0].workshop_title}" (ID: ${scheduleDetails[0].workshop_id}) for company "${scheduleDetails[0].company_name}" (ID: ${scheduleDetails[0].company_id}) status changed from "${scheduleDetails[0].current_status}" to "${status}"${reason ? `. Reason: ${reason}` : ''}`;
          }
          
          await ActivityLogService.createLog({
            user_id: user.user_id,
            performed_by: performedBy,
            company_id: scheduleDetails[0].company_id,
            module_name: 'workshops',
            action: actionType,
            description: description
          });
        } catch (logError) {
          console.error("Error creating activity log:", logError);
          // Continue with the response even if logging fails
        }
      }

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
