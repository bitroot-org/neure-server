const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");
const WorkshopPdfService = require("../pdf/workshopPdfService");
const CsvGenerator = require("../../utils/csvGenerator");
const NotificationService = require("../notificationsAndAnnouncements/notificationService");
const moment = require("moment-timezone");

class workshopService {
  static async getWorkshopDetails(
    workshop_id,
    company_id = null,
    schedule_id = null
  ) {
    try {
      // Fetch workshop details
      const [workshops] = await db.query(
        "SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at FROM workshops WHERE id = ? AND is_active = 1",
        [workshop_id]
      );

      if (workshops.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Workshop not found or inactive",
          data: null,
        };
      }

      // If no company_id provided, return only workshop details
      if (!company_id) {
        return {
          status: true,
          code: 200,
          message: "Workshop details retrieved successfully",
          data: workshops[0],
        };
      }

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Build the query with base conditions
      let scheduleQuery = `
        SELECT 
          ws.id AS schedule_id,
          DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') as start_time,
          DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') as end_time,
          ws.status,
          ws.max_participants,
          ws.host_name,
          COALESCE(
            (SELECT COUNT(*) 
             FROM workshop_tickets wt 
             WHERE wt.workshop_id = ws.workshop_id 
             AND wt.company_id = ws.company_id
             AND wt.schedule_id = ws.id),
            0
          ) as current_participants
        FROM workshop_schedules ws
        WHERE ws.workshop_id = ? 
        AND ws.company_id = ?
      `;

      const queryParams = [workshop_id, company_id];

      // Add schedule_id filter if provided
      if (schedule_id) {
        scheduleQuery += " AND ws.id = ?";
        queryParams.push(schedule_id);
      } else {
        // Otherwise use date filter and status filter
        scheduleQuery +=
          " AND DATE(ws.start_time) >= ? AND ws.status NOT IN ('cancelled', 'completed')";
        queryParams.push(yesterdayStr);
      }

      scheduleQuery += " ORDER BY ws.start_time ASC";

      const [schedules] = await db.query(scheduleQuery, queryParams);

      if (schedules.length === 0) {
        return {
          status: false,
          code: 404,
          message: schedule_id
            ? `No schedule found with ID ${schedule_id} for the given workshop and company`
            : "No schedules found for the given workshop and company",
          data: null,
        };
      }

      // Combine workshop and schedule details
      const workshopDetails = {
        ...workshops[0],
        schedules: schedules.map((schedule) => ({
          ...schedule,
        })),
      };

      return {
        status: true,
        code: 200,
        message: "Workshop details retrieved successfully",
        data: workshopDetails,
      };
    } catch (error) {
      throw new Error("Error fetching workshop details: " + error.message);
    }
  }

  static async getWorkshopsByCompanyIdOrUserId(
    company_id = null,
    user_id = null,
    page = 1,
    limit = 6,
    start_time = null
  ) {
    try {
      // console.log("Received request to get workshops by company or user ID:", {
      //   company_id,
      //   user_id,
      //   page,
      //   limit,
      //   start_time,
      // });
      let baseQuery = "";
      const queryParams = [];
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      if (user_id) {
        baseQuery = `
          SELECT w.id AS workshop_id, w.title, w.description, w.is_active, 
                 ws.id AS schedule_id, 
                 DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') as start_time, 
                 DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') as end_time, 
                 ws.status, ws.max_participants, 
                 w.location, w.poster_image 
          FROM workshops w
          INNER JOIN workshop_assignments wa ON w.id = wa.workshop_id
          INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
          WHERE wa.user_id = ? 
          AND w.is_active = 1
          AND ws.status NOT IN ('cancelled', 'completed')
          AND DATE(ws.start_time) >= ?
        `;
        queryParams.push(user_id, today);
      } else if (company_id) {
        baseQuery = `
          SELECT w.id AS workshop_id, w.title, w.description, w.is_active, 
                 ws.id AS schedule_id, 
                 DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') as start_time, 
                 DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') as end_time, 
                 ws.status, ws.max_participants, 
                 w.location, w.poster_image 
          FROM workshops w
          INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
          WHERE ws.company_id = ? 
          AND w.is_active = 1 
          AND ws.status NOT IN ('cancelled', 'completed')
          AND DATE(ws.start_time) >= ?
        `;
        queryParams.push(company_id, today);
      } else {
        return {
          status: false,
          code: 400,
          message: "Either company_id or user_id must be provided",
          data: null,
        };
      }

      if (start_time) {
        baseQuery += " AND DATE(ws.start_time) = ?";
        queryParams.push(start_time);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM (${baseQuery}) as total
      `;
      const [totalRows] = await db.query(countQuery, queryParams);

      // Main query with pagination
      const offset = (page - 1) * limit;
      const mainQuery = `${baseQuery} ORDER BY ws.start_time ASC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      const [workshops] = await db.query(mainQuery, queryParams);

      return {
        status: true,
        code: 200,
        message: "Workshops fetched successfully",
        data: workshops,
        pagination: {
          total: totalRows[0].count,
          currentPage: page,
          totalPages: Math.ceil(totalRows[0].count / limit),
          limit,
        },
      };
    } catch (error) {
      throw new Error("Error fetching workshops: " + error.message);
    }
  }

  static async getWorkshopDatesByCompanyIdOrUserId(
    company_id = null,
    user_id = null
  ) {
    try {
      let query = "";
      const queryParams = [];
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      if (user_id) {
        query = `
          SELECT DISTINCT DATE_FORMAT(ws.start_time, '%Y-%m-%d') as date
          FROM workshop_schedules ws
          INNER JOIN workshops w ON w.id = ws.workshop_id
          INNER JOIN workshop_assignments wa ON w.id = wa.workshop_id
          WHERE wa.user_id = ? 
          AND w.is_active = 1 
          AND ws.status NOT IN ('cancelled', 'completed')
          AND DATE(ws.start_time) >= ?
        `;
        queryParams.push(user_id, today);
      } else if (company_id) {
        query = `
          SELECT DISTINCT DATE_FORMAT(ws.start_time, '%Y-%m-%d') as date
          FROM workshop_schedules ws
          INNER JOIN workshops w ON w.id = ws.workshop_id
          WHERE ws.company_id = ? 
          AND w.is_active = 1 
          AND ws.status NOT IN ('cancelled', 'completed')
          AND DATE(ws.start_time) >= ?
        `;
        queryParams.push(company_id, today);
      } else {
        return {
          status: false,
          code: 400,
          message: "Either company_id or user_id must be provided",
          data: null,
        };
      }

      const [dates] = await db.query(query, queryParams);

      return {
        status: true,
        code: 200,
        message: "Workshop dates fetched successfully",
        data: dates.map((row) => row.date),
      };
    } catch (error) {
      throw new Error("Error fetching workshop dates: " + error.message);
    }
  }

  static async getAllWorkshops(
    page = 1,
    limit = 10,
    start_date = null,
    end_date = null,
    search_term = null,
    all = false
  ) {
    try {
      const offset = (page - 1) * limit;
      const queryParams = [];
      let query = "SELECT * FROM workshops WHERE is_active = 1";

      // Add date range filter if provided
      if (start_date && end_date) {
        query += " AND created_at BETWEEN ? AND ?";
        queryParams.push(start_date, end_date);
      }

      // Add search term filter if provided
      if (search_term) {
        query += ` AND (
          title LIKE ? OR 
          description LIKE ? OR 
          organizer LIKE ? OR
          location LIKE ?
        )`;
        const searchPattern = `%${search_term}%`;
        queryParams.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }

      // Get total count of workshops
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count FROM (${query}) as total`,
        queryParams
      );
      const total = totalRows[0].count;

      // Add ordering
      query += " ORDER BY created_at DESC";
      
      // Add pagination only if all=false
      if (!all) {
        query += " LIMIT ? OFFSET ?";
        queryParams.push(limit, offset);
      }
      
      // Fetch workshops
      const [workshops] = await db.query(query, queryParams);

      const response = {
        status: true,
        code: 200,
        message: "Workshops fetched successfully",
        data: {
          workshops
        }
      };
      
      // Add pagination info only if not returning all records
      if (!all) {
        response.data.pagination = {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit,
        };
      }

      return response;
    } catch (error) {
      throw new Error("Error fetching workshops: " + error.message);
    }
  }

  // Update a workshop
  static async updateWorkshop(workshopId, workshopData) {
    try {
      // Dynamically build the query based on provided fields
      const fields = [];
      const values = [];

      if (workshopData.title) {
        fields.push("title = ?");
        values.push(workshopData.title);
      }
      if (workshopData.description) {
        fields.push("description = ?");
        values.push(workshopData.description);
      }

      if (workshopData.agenda) {
        fields.push("agenda = ?");
        values.push(workshopData.agenda);
      }

      if (workshopData.location) {
        fields.push("location = ?");
        values.push(workshopData.location);
      }
      if (workshopData.poster_image) {
        fields.push("poster_image = ?");
        values.push(workshopData.poster_image);
      }

      // If no fields are provided, return an error
      if (fields.length === 0) {
        return {
          status: false,
          code: 400,
          message: "No fields provided to update",
          data: null,
        };
      }

      // Add the workshop ID to the values array
      values.push(workshopId);

      // Construct the SQL query
      const query = `UPDATE workshops SET ${fields.join(
        ", "
      )} WHERE id = ? AND is_active = 1`;

      // Execute the query
      const result = await db.query(query, values);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Workshop not found or inactive",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Workshop updated successfully",
        data: { id: workshopId },
      };
    } catch (error) {
      throw new Error("Error updating workshop: " + error.message);
    }
  }

  // Delete a workshop (soft delete)
  static async deleteWorkshop(workshopId) {
    console.log("Deleting workshop with ID:", workshopId);
    try {
      console.log("Deleting workshop with ID in service:", workshopId);
      const result = await db.query("DELETE FROM workshops WHERE id = ?", [
        workshopId,
      ]);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Workshop not found or already inactive",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Workshop deleted successfully",
        data: { id: workshopId },
      };
    } catch (error) {
      throw new Error("Error deleting workshop: " + error.message);
    }
  }

  static async createWorkshop(workshopData) {
    try {
      const { title, description, agenda, poster_image } =
        workshopData;

      // Insert the workshop into the database
      const query = `
        INSERT INTO workshops (title, description, agenda, poster_image, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const [result] = await db.query(query, [
        title,
        description,
        agenda,
        poster_image,
      ]);

      return {
        status: true,
        code: 201,
        message: "Workshop created successfully",
        data: { id: result.insertId, title, description, agenda },
      };
    } catch (error) {
      throw new Error("Error creating workshop: " + error.message);
    }
  }

  static async getAllWorkshopSchedules(
    start_date = null,
    end_date = null,
    search_term = null
  ) {
    try {
      let query = `
        SELECT 
          ws.id AS session_id,
          w.title AS workshop_title,
          c.company_name AS company_name,
          DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') AS start_time,
          DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') AS end_time,
          DATE_FORMAT(ws.start_time, '%Y-%m-%d') AS schedule_date,
          w.pdf_url,
          ws.status,
          ws.host_name,
          w.description
        FROM workshop_schedules ws
        INNER JOIN workshops w ON ws.workshop_id = w.id
        INNER JOIN companies c ON ws.company_id = c.id
        WHERE w.is_active = 1 AND ws.status != 'canceled'
      `;
      const queryParams = [];

      // Add date range filter if provided
      if (start_date && end_date) {
        query += " AND ws.start_time BETWEEN ? AND ?";
        queryParams.push(start_date, end_date);
      }

      // Add search term filter if provided
      if (search_term) {
        query += ` AND (
          w.title LIKE ? OR 
          c.company_name LIKE ? OR 
          w.location LIKE ? OR
          w.description LIKE ?
        )`;
        const searchPattern = `%${search_term}%`;
        queryParams.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }

      query += " ORDER BY ws.updated_at DESC";

      const [schedules] = await db.query(query, queryParams);

      if (schedules.length === 0) {
        return {
          status: false,
          code: 200,
          message: "No workshop schedules found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Workshop schedules retrieved successfully",
        data: schedules,
      };
    } catch (error) {
      throw new Error("Error fetching workshop schedules: " + error.message);
    }
  }

  static async scheduleWorkshop(scheduleData) {
    try {
      const { company_id, date, time, workshop_id, duration_minutes, host_name } = scheduleData;
      console.log("Starting workshop scheduling with data:", scheduleData);

      // Validate workshop exists
      const [workshop] = await db.query(
        "SELECT * FROM workshops WHERE id = ?",
        [workshop_id]
      );

      if (!workshop || workshop.length === 0) {
        throw new Error(`Workshop not found with ID: ${workshop_id}`);
      }

      // Validate company exists
      const [company] = await db.query("SELECT * FROM companies WHERE id = ?", [
        company_id,
      ]);

      if (!company || company.length === 0) {
        throw new Error(`Company not found with ID: ${company_id}`);
      }

      // Combine date and time into a single timestamp for start_time
      const start_time = new Date(`${date} ${time}`);

      // Calculate end_time based on duration_minutes
      const end_time = new Date(
        start_time.getTime() + duration_minutes * 60000
      );

      // Insert the schedule into the database
      const query = `
        INSERT INTO workshop_schedules (
          company_id, 
          workshop_id, 
          start_time, 
          end_time,
          duration_minutes,
          host_name,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
      `;

      const [result] = await db.query(query, [
        company_id,
        workshop_id,
        start_time,
        end_time,
        duration_minutes,
        host_name
      ]);

      const scheduleId = result.insertId;
      console.log("Created schedule with ID:", scheduleId);

      // Get all active employees in the company
      const [companyEmployees] = await db.query(
        `SELECT ce.user_id, u.first_name, u.last_name, u.email 
         FROM company_employees ce
         JOIN users u ON ce.user_id = u.user_id
         WHERE ce.company_id = ? AND ce.is_active = 1
         AND u.role_id NOT IN (1, 2)`,
        [company_id]
      );

      // Get the formatted dates directly from the database to avoid timezone issues
      const [formattedDates] = await db.query(
        `SELECT 
          DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as formatted_start_time,
          DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') as formatted_end_time
         FROM workshop_schedules
         WHERE id = ?`,
        [scheduleId]
      );

      // Prepare workshop data with schedule details and formatted dates
      const workshopData = {
        ...workshop[0],
        schedule_id: scheduleId,
        start_time: formattedDates[0].formatted_start_time,
        end_time: formattedDates[0].formatted_end_time,
        host_name
      };

      // Generate tickets for all employees and start PDF generation in background
      const ticketResults = await WorkshopPdfService.generateTicketsForWorkshop(
        workshopData,
        company[0],
        companyEmployees,
        scheduleId
      );

      // Format date and time for notification
      const formattedDate = start_time.toLocaleDateString();
      const formattedTime = start_time.toLocaleTimeString();

      // Create notifications for all employees
      const notificationPromises = companyEmployees.map((employee) =>
        NotificationService.createNotification({
          title: `New Workshop Scheduled: ${workshop[0].title}`,
          content: `A new workshop "${
            workshop[0].title
          }" has been scheduled for ${formattedDate} at ${formattedTime}. Duration: ${duration_minutes} minutes. Location: ${
            workshop[0].location || "TBA"
          }`,
          type: "WORKSHOP_SCHEDULED",
          company_id: company_id,
          user_id: employee.user_id,
          priority: "HIGH",
          metadata: JSON.stringify({
            workshop_id: workshop_id,
            schedule_id: scheduleId,
            start_time: formattedDates[0].formatted_start_time,
            end_time: formattedDates[0].formatted_end_time,
            duration_minutes: duration_minutes,
            location: workshop[0].location,
          }),
        })
      );

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      return {
        status: true,
        code: 201,
        message: "Workshop scheduled successfully and tickets generated",
        data: {
          schedule_id: scheduleId,
          company_id,
          workshop_id,
          start_time: formattedDates[0].formatted_start_time,
          end_time: formattedDates[0].formatted_end_time,
          duration_minutes,
          host_name,
          tickets_generated: ticketResults.length
        },
      };
    } catch (error) {
      console.error("Error in scheduleWorkshop:", error);
      throw error;
    }
  }

  static async updateWorkshopScheduleStatus(scheduleId, status, reason = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get workshop and schedule details first
      const [scheduleDetails] = await connection.query(
        `
        SELECT 
          ws.*,
          w.title as workshop_title,
          w.location
        FROM workshop_schedules ws
        JOIN workshops w ON ws.workshop_id = w.id
        WHERE ws.id = ?
      `,
        [scheduleId]
      );

      if (scheduleDetails.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Workshop schedule not found",
          data: null,
        };
      }

      const workshop = scheduleDetails[0];

      // Validate status
      const validStatuses = [
        "scheduled",
        "rescheduled",
        "cancelled",
        "completed",
      ];
      if (!validStatuses.includes(status)) {
        return {
          status: false,
          code: 400,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
          data: null,
        };
      }

      // Update workshop status
      await connection.query(
        "UPDATE workshop_schedules SET status = ?, updated_at = NOW() WHERE id = ?",
        [status, scheduleId]
      );

      // Get all active employees for the company
      const [employees] = await connection.query(
        `
        SELECT 
          ce.user_id,
          u.first_name,
          u.email
        FROM company_employees ce
        JOIN users u ON ce.user_id = u.user_id
        WHERE ce.company_id = ?
        AND ce.is_active = 1
      `,
        [workshop.company_id]
      );

      const startTime = new Date(workshop.start_time);
      const formattedDate = startTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Create notifications based on status
      let notificationPromises = [];

      if (status === "cancelled") {
        // Create cancellation notifications for all employees
        notificationPromises = employees.map((employee) =>
          NotificationService.createNotification({
            title: `Workshop Cancelled: ${workshop.workshop_title}`,
            content: `The workshop "${
              workshop.workshop_title
            }" scheduled for ${formattedDate} at ${formattedTime} has been cancelled. ${
              reason ? `\nReason: ${reason}` : ""
            }`,
            type: "WORKSHOP_CANCELLED",
            company_id: workshop.company_id,
            user_id: employee.user_id,
            priority: "HIGH",
            metadata: JSON.stringify({
              workshop_id: workshop.workshop_id,
              schedule_id: scheduleId,
              original_start_time: workshop.start_time,
              location: workshop.location,
            }),
          })
        );
      } else if (status === "completed") {
        // Create completion notifications for all employees
        notificationPromises = employees.map((employee) =>
          NotificationService.createNotification({
            title: `Workshop Completed: ${workshop.workshop_title}`,
            content: `The workshop "${workshop.workshop_title}" that was held on ${formattedDate} at ${formattedTime} has been marked as completed. Thank you for your participation.`,
            type: "WORKSHOP_COMPLETED",
            company_id: workshop.company_id,
            user_id: employee.user_id,
            priority: "MEDIUM",
            metadata: JSON.stringify({
              workshop_id: workshop.workshop_id,
              schedule_id: scheduleId,
              completion_date: new Date().toISOString(),
              location: workshop.location,
            }),
          })
        );
      }

      // Send all notifications
      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: `Workshop ${
          status === "canceled" ? "cancelled" : status
        } successfully${
          notificationPromises.length > 0 ? " and notifications sent" : ""
        }`,
        data: {
          schedule_id: scheduleId,
          status: status,
          notifications_sent: notificationPromises.length,
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error(
        `Error updating workshop schedule status to ${status}:`,
        error
      );
      throw new Error(
        `Error updating workshop schedule status: ${error.message}`
      );
    } finally {
      connection.release();
    }
  }

  static async rescheduleWorkshop(
    scheduleId,
    newStartTime,
    newEndTime,
    durationMinutes = null
  ) {
    const connection = await db.getConnection();
    try {
      console.log("Starting reschedule with data:", {
        scheduleId,
        newStartTime,
        newEndTime,
        durationMinutes,
      });
      await connection.beginTransaction();

      // Get schedule details first
      const [schedule] = await connection.query(
        `SELECT ws.*, w.title as workshop_title, c.company_name 
         FROM workshop_schedules ws
         JOIN workshops w ON ws.workshop_id = w.id
         JOIN companies c ON ws.company_id = c.id
         WHERE ws.id = ?`,
        [scheduleId]
      );

      if (schedule.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Workshop schedule not found",
          data: null,
        };
      }

      const workshopDetails = schedule[0];

      // Calculate duration if not provided
      let calculatedDuration = durationMinutes;
      if (!calculatedDuration) {
        // Convert string dates to Date objects if they aren't already
        const startDate = new Date(newStartTime);
        const endDate = new Date(newEndTime);

        // Calculate difference in milliseconds
        const diffMs = endDate - startDate;

        // Convert to minutes
        calculatedDuration = Math.round(diffMs / 60000);

        if (calculatedDuration <= 0) {
          return {
            status: false,
            code: 400,
            message: "End time must be after start time",
            data: null,
          };
        }
      }

      // Update the workshop schedule
      await connection.query(
        `UPDATE workshop_schedules 
         SET start_time = ?, 
             end_time = ?, 
             duration_minutes = ?,
             status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          newStartTime,
          newEndTime,
          calculatedDuration,
          "rescheduled",
          scheduleId,
        ]
      );

      // Get all active employees for the company
      const [employees] = await connection.query(
        `
        SELECT 
          ce.user_id,
          u.first_name,
          u.email
        FROM company_employees ce
        JOIN users u ON ce.user_id = u.user_id
        WHERE ce.company_id = ?
        AND ce.is_active = 1
        AND u.role_id NOT IN (1, 2)
      `,
        [workshopDetails.company_id]
      );

      // Format dates for notification
      const startTime = new Date(newStartTime);
      const formattedDate = startTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Create rescheduling notifications for all employees
      const notificationPromises = employees.map((employee) =>
        NotificationService.createNotification({
          title: `Workshop Rescheduled: ${workshopDetails.workshop_title}`,
          content: `The workshop "${workshopDetails.workshop_title}" has been rescheduled to ${formattedDate} at ${formattedTime}. Please update your calendar.`,
          type: "WORKSHOP_RESCHEDULED",
          company_id: workshopDetails.company_id,
          user_id: employee.user_id,
          priority: "HIGH",
          metadata: JSON.stringify({
            workshop_id: workshopDetails.workshop_id,
            schedule_id: scheduleId,
            new_start_time: newStartTime,
            new_end_time: newEndTime,
            location: workshopDetails.location,
          }),
        })
      );

      // Send all notifications
      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Workshop rescheduled successfully and notifications sent",
        data: {
          schedule_id: scheduleId,
          new_start_time: newStartTime,
          new_end_time: newEndTime,
          duration_minutes: calculatedDuration,
          notifications_sent: notificationPromises.length,
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error in rescheduleWorkshop:", error);
      throw new Error("Error rescheduling workshop: " + error.message);
    } finally {
      connection.release();
    }
  }

  // Get workshop details with attendance information
  static async getWorkshopAttendance(
    workshop_id,
    company_id = null,
    schedule_id = null,
    page = 1,
    limit = 10,
    format = "json",
    attendance_status = null
  ) {
    try {
      // Base query to get total count
      let countQuery = `
        WITH LatestTickets AS (
          SELECT 
            wt.*,
            ROW_NUMBER() OVER (
              PARTITION BY wt.workshop_id, wt.user_id 
              ORDER BY wt.created_at DESC
            ) as rn
          FROM workshop_tickets wt
          WHERE wt.workshop_id = ?
          ${schedule_id ? "AND wt.schedule_id = ?" : ""}
        )
        SELECT COUNT(*) as total
        FROM LatestTickets lt
        JOIN workshops w ON lt.workshop_id = w.id
        JOIN companies c ON lt.company_id = c.id
        JOIN users u ON lt.user_id = u.user_id
        JOIN workshop_schedules ws ON lt.schedule_id = ws.id
        WHERE lt.rn = 1
        AND u.role_id NOT IN (1, 2)
      `;

      // Main data query
      let dataQuery = `
        WITH LatestTickets AS (
          SELECT 
            wt.*,
            ROW_NUMBER() OVER (
              PARTITION BY wt.workshop_id, wt.user_id 
              ORDER BY wt.created_at DESC
            ) as rn
          FROM workshop_tickets wt
          WHERE wt.workshop_id = ?
          ${schedule_id ? "AND wt.schedule_id = ?" : ""}
        )
        SELECT 
          w.title AS workshop_title,
          w.id AS workshop_id,
          lt.company_id,
          c.company_name,
          lt.schedule_id,
          ws.host_name,
          DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') AS start_time,
          DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') AS end_time,
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          lt.ticket_code,
          lt.is_attended
        FROM LatestTickets lt
        JOIN workshops w ON lt.workshop_id = w.id
        JOIN companies c ON lt.company_id = c.id
        JOIN users u ON lt.user_id = u.user_id
        JOIN workshop_schedules ws ON lt.schedule_id = ws.id
        WHERE lt.rn = 1
        AND u.role_id NOT IN (1, 2)
      `;

      const countParams = [workshop_id];
      const queryParams = [workshop_id];
      
      if (schedule_id) {
        countParams.push(schedule_id);
        queryParams.push(schedule_id);
      }

      if (company_id) {
        countQuery += " AND lt.company_id = ?";
        dataQuery += " AND lt.company_id = ?";
        countParams.push(company_id);
        queryParams.push(company_id);
      }

      // Add attendance status filter if provided
      if (attendance_status !== null) {
        const isAttended = attendance_status === '1' || attendance_status === 1;
        countQuery += " AND lt.is_attended = ?";
        dataQuery += " AND lt.is_attended = ?";
        countParams.push(isAttended);
        queryParams.push(isAttended);
      }

      // Get total count
      const [totalRows] = await db.query(countQuery, countParams);

      // If no records found when NOT filtering by attendance status
      if (totalRows[0].total === 0 && attendance_status === null) {
        let message = `No attendance data found for workshop ID ${workshop_id}`;
        if (company_id) {
          message += ` and company ID ${company_id}`;
        }
        if (schedule_id) {
          message += ` and schedule ID ${schedule_id}`;
        }
        
        return {
          status: false,
          code: 404,
          message,
          data: null,
        };
      }
      
      // If filtering by attendance status but no records found, return 200 with empty data
      if (totalRows[0].total === 0 && attendance_status !== null) {
        let message = `No ${attendance_status === '1' || attendance_status === 1 ? 'attended' : 'not attended'} records found for workshop ID ${workshop_id}`;
        if (company_id) {
          message += ` and company ID ${company_id}`;
        }
        if (schedule_id) {
          message += ` and schedule ID ${schedule_id}`;
        }
        
        return {
          status: true,
          code: 200,
          message,
          data: [],
          pagination: {
            total: 0,
            currentPage: parseInt(page),
            totalPages: 0,
            limit: parseInt(limit)
          }
        };
      }

      // Add ordering
      dataQuery += " ORDER BY u.first_name, u.last_name";

      // Add pagination if limit is not -1 (special value to return all)
      if (limit !== -1) {
        const offset = (page - 1) * limit;
        dataQuery += " LIMIT ? OFFSET ?";
        queryParams.push(parseInt(limit), offset);
      }

      // Get attendance data
      const [results] = await db.query(dataQuery, queryParams);

      const response = {
        status: true,
        code: 200,
        message: "Workshop attendance retrieved successfully",
        data: results
      };

      // Add pagination info if not returning all records
      if (limit !== -1) {
        response.pagination = {
          total: totalRows[0].total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRows[0].total / parseInt(limit)),
          limit: parseInt(limit)
        };
      }

      return response;
    } catch (error) {
      throw new Error("Error fetching workshop attendance: " + error.message);
    }
  }

  // Get user's workshop tickets
  static async getUserWorkshopTickets(user_id) {
    const query = `
      SELECT 
        w.title AS workshop_title,
        DATE_FORMAT(wt.created_at, '%Y-%m-%d %H:%i:%s') AS ticket_generated_at,
        u.first_name,
        u.last_name,
        u.email,
        wt.ticket_code,
        wt.is_attended,
        c.company_name
      FROM workshop_tickets wt
      JOIN workshops w ON wt.workshop_id = w.id
      JOIN users u ON wt.user_id = u.user_id
      JOIN companies c ON wt.company_id = c.id
      WHERE wt.user_id = ?
      ORDER BY wt.created_at DESC
    `;

    const [tickets] = await db.query(query, [user_id]);
    return tickets;
  }

  // Mark attendance using ticket code
  static async markAttendance(ticket_code, company_id = null, schedule_id = null) {
    try {
      // First check if the ticket exists and get related information
      let query = `
        SELECT 
          wt.id as ticket_id,
          wt.user_id,
          wt.workshop_id,
          wt.company_id,
          wt.schedule_id,
          wt.is_attended,
          w.title as workshop_title,
          DATE_FORMAT(ws.start_time, '%Y-%m-%d %H:%i:%s') as start_time,
          DATE_FORMAT(ws.end_time, '%Y-%m-%d %H:%i:%s') as end_time,
          ws.status
        FROM workshop_tickets wt
        JOIN workshops w ON wt.workshop_id = w.id
        JOIN workshop_schedules ws ON wt.schedule_id = ws.id
        WHERE wt.ticket_code = ?
      `;

      const queryParams = [ticket_code];

      if (company_id) {
        query += " AND wt.company_id = ?";
        queryParams.push(company_id);
      }

      if (schedule_id) {
        query += " AND wt.schedule_id = ?";
        queryParams.push(schedule_id);
      }

      const [ticketInfo] = await db.query(query, queryParams);

      // If ticket not found
      if (!ticketInfo || ticketInfo.length === 0) {
        return {
          status: false,
          code: 404,
          message: schedule_id
            ? `Invalid ticket code or ticket not associated with schedule ID ${schedule_id}`
            : "Invalid ticket code",
          data: null,
        };
      }

      // Check if schedule is valid for attendance marking
      const ticket = ticketInfo[0];
      if (ticket.status === 'cancelled') {
        return {
          status: false,
          code: 400,
          message: "Cannot mark attendance for a cancelled workshop",
          data: null,
        };
      }

      // Check if already attended
      if (ticket.is_attended) {
        return {
          status: false,
          code: 400,
          message: "Attendance already marked for this ticket",
          data: {
            workshop_title: ticket.workshop_title,
            marked_at: ticket.attendance_marked_at,
          },
        };
      }

      // Start transaction
      await db.query("START TRANSACTION");

      try {
        // Mark attendance with timestamp
        const updateQuery = `
          UPDATE workshop_tickets 
          SET 
            is_attended = TRUE,
            updated_at = NOW()
          WHERE ticket_code = ? 
          AND is_attended = FALSE
        `;

        const [result] = await db.query(updateQuery, [ticket_code]);

        if (result.affectedRows === 0) {
          await db.query("ROLLBACK");
          return {
            status: false,
            code: 400,
            message: "Failed to mark attendance",
            data: null,
          };
        }

        // Update company_employees table
        const updateEmployeeQuery = `
          UPDATE company_employees 
          SET 
            workshop_attendance_count = workshop_attendance_count + 1,
            last_activity_date = NOW(),
            last_activity_type = 'workshop'
          WHERE company_id = ? 
          AND user_id = ?
        `;

        await db.query(updateEmployeeQuery, [
          ticket.company_id,
          ticket.user_id,
        ]);

        // Commit transaction
        await db.query("COMMIT");

        // Get user details for notification
        const [userInfo] = await db.query(
          "SELECT first_name, last_name,email FROM users WHERE user_id = ?",
          [ticket.user_id]
        );

        console.log("Creating notification for user:", userInfo[0].first_name);

        return {
          status: true,
          code: 200,
          message: "Attendance marked successfully",
          data: {
            ticket_code,
            workshop_title: ticket.workshop_title,
            marked_at: new Date(),
            user_id: ticket.user_id,
            user_email: userInfo[0].first_name + " " + userInfo[0].last_name,
            company_id: ticket.company_id,
            workshop_id: ticket.workshop_id,
          },
        };
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Error in markAttendance:", error);
      throw new Error("Error marking attendance: " + error.message);
    }
  }

  // Get workshop attendance statistics
  static async getWorkshopStats(workshop_id, company_id = null) {
    try {
      let query = `
        SELECT 
          w.title,
          w.id AS workshop_id,
          wt.company_id,
          c.company_name,
          COUNT(wt.id) as total_tickets,
          SUM(wt.is_attended) as attended_count,
          (SUM(wt.is_attended) / COUNT(wt.id) * 100) as attendance_percentage
        FROM workshops w
        JOIN workshop_tickets wt ON w.id = wt.workshop_id
        JOIN companies c ON wt.company_id = c.id
        WHERE w.id = ?
      `;

      const queryParams = [workshop_id];

      if (company_id) {
        query += " AND wt.company_id = ?";
        queryParams.push(company_id);
      }

      query += " GROUP BY w.id, wt.company_id";

      const [stats] = await db.query(query, queryParams);

      if (stats.length === 0) {
        return {
          status: false,
          code: 404,
          message: company_id
            ? `No statistics found for workshop ID ${workshop_id} and company ID ${company_id}`
            : `No statistics found for workshop ID ${workshop_id}`,
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Workshop statistics retrieved successfully",
        data: stats,
      };
    } catch (error) {
      throw new Error("Error fetching workshop statistics: " + error.message);
    }
  }
}

module.exports = workshopService;
