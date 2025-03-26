const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");

class workshopService {
  static async getWorkshopDetails(workshop_id) {
    try {
      // Fetch workshop details
      const [workshops] = await db.query(
        "SELECT * FROM workshops WHERE id = ? AND is_active = 1",
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

      // Fetch schedule details for the workshop
      const [schedules] = await db.query(
        "SELECT start_time,end_time,status,max_participants FROM workshop_schedules WHERE workshop_id = ?",
        [workshop_id]
      );

      if (schedules.length === 0) {
        return {
          status: false,
          code: 404,
          message: "No schedules found for the given workshop and company",
          data: null,
        };
      }

      // Combine workshop and schedule details
      const workshopDetails = {
        ...workshops[0],
        schedules,
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
      console.log("Received request to get workshops by company or user ID:", {
        company_id,
        user_id,
        page,
        limit,
        start_time,
      });
      let baseQuery = "";
      const queryParams = [];

      if (user_id) {
        baseQuery = `
          SELECT w.id AS workshop_id, w.title, w.description, w.is_active, 
                 ws.start_time, ws.end_time, ws.status, ws.max_participants, w.location, w.poster_image 
          FROM workshops w
          INNER JOIN workshop_assignments wa ON w.id = wa.workshop_id
          INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
          WHERE wa.user_id = ? AND w.is_active = 1
        `;
        queryParams.push(user_id);
      } else if (company_id) {
        baseQuery = `
          SELECT w.id AS workshop_id, w.title, w.description, w.is_active, 
                 ws.start_time, ws.end_time, ws.status, ws.max_participants, w.location, w.poster_image 
          FROM workshops w
          INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
          WHERE ws.company_id = ? AND w.is_active = 1
        `;
        queryParams.push(company_id);
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

      if (user_id) {
        query = `
          SELECT DISTINCT ws.start_time as date
          FROM workshop_schedules ws
          INNER JOIN workshops w ON w.id = ws.workshop_id
          INNER JOIN workshop_assignments wa ON w.id = wa.workshop_id
          WHERE wa.user_id = ? AND w.is_active = 1
        `;
        queryParams.push(user_id);
      } else if (company_id) {
        query = `
          SELECT DISTINCT ws.start_time as date
          FROM workshop_schedules ws
          INNER JOIN workshops w ON w.id = ws.workshop_id
          WHERE ws.company_id = ? AND w.is_active = 1
        `;
        queryParams.push(company_id);
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
        data: dates.map((row) => {
          const date = new Date(row.date);
          return date.toISOString().split("T")[0];
        }),
      };
    } catch (error) {
      throw new Error("Error fetching workshop dates: " + error.message);
    }
  }

  // Fetch all workshops with pagination
  static async getAllWorkshops(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get total count of workshops
      const [totalRows] = await db.query('SELECT COUNT(*) as count FROM workshops WHERE is_active = 1');
      const total = totalRows[0].count;

      // Fetch paginated workshops
      const [workshops] = await db.query(
        'SELECT * FROM workshops WHERE is_active = 1 LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: 'Workshops fetched successfully',
        data: {
          workshops,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
          },
        },
      };
    } catch (error) {
      throw new Error('Error fetching workshops: ' + error.message);
    }
  }

  // Update a workshop
  static async updateWorkshop(workshopId, workshopData) {
    try {
      // Dynamically build the query based on provided fields
      const fields = [];
      const values = [];
  
      if (workshopData.title) {
        fields.push('title = ?');
        values.push(workshopData.title);
      }
      if (workshopData.description) {
        fields.push('description = ?');
        values.push(workshopData.description);
      }
      if (workshopData.location) {
        fields.push('location = ?');
        values.push(workshopData.location);
      }
      if (workshopData.poster_image) {
        fields.push('poster_image = ?');
        values.push(workshopData.poster_image);
      }
  
      // If no fields are provided, return an error
      if (fields.length === 0) {
        return {
          status: false,
          code: 400,
          message: 'No fields provided to update',
          data: null,
        };
      }
  
      // Add the workshop ID to the values array
      values.push(workshopId);
  
      // Construct the SQL query
      const query = `UPDATE workshops SET ${fields.join(', ')} WHERE id = ? AND is_active = 1`;
  
      // Execute the query
      const result = await db.query(query, values);
  
      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: 'Workshop not found or inactive',
          data: null,
        };
      }
  
      return {
        status: true,
        code: 200,
        message: 'Workshop updated successfully',
        data: { id: workshopId },
      };
    } catch (error) {
      throw new Error('Error updating workshop: ' + error.message);
    }
  }

  // Delete a workshop (soft delete)
  static async deleteWorkshop(workshopId) {
    try {
      const result = await db.query('UPDATE workshops SET is_active = 0 WHERE id = ?', [workshopId]);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: 'Workshop not found or already inactive',
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: 'Workshop deleted successfully',
        data: { id: workshopId },
      };
    } catch (error) {
      throw new Error('Error deleting workshop: ' + error.message);
    }
  }

  static async createWorkshop(workshopData) {
    try {
      const { title, description, host_name, agenda } = workshopData;
  
      // Insert the workshop into the database
      const query = `
        INSERT INTO workshops (title, description, organizer, agenda, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
  
      const [result] = await db.query(query, [title, description, host_name, agenda]);
  
      return {
        status: true,
        code: 201,
        message: 'Workshop created successfully',
        data: { id: result.insertId, title, description, host_name, agenda },
      };
    } catch (error) {
      throw new Error('Error creating workshop: ' + error.message);
    }
  }

  static async getAllWorkshopSchedules() {
    try {
      const query = `
        SELECT 
          ws.id AS session_id,
          w.title AS workshop_title,
          c.company_name AS company_name,
          ws.start_time,
          DATE(ws.start_time) AS schedule_date,
          w.pdf_url
        FROM workshop_schedules ws
        INNER JOIN workshops w ON ws.workshop_id = w.id
        INNER JOIN companies c ON ws.company_id = c.id
        WHERE w.is_active = 1
        ORDER BY ws.start_time ASC
      `;
  
      const [schedules] = await db.query(query);
  
      if (schedules.length === 0) {
        return {
          status: false,
          code: 404,
          message: 'No workshop schedules found',
          data: null,
        };
      }
  
      return {
        status: true,
        code: 200,
        message: 'Workshop schedules retrieved successfully',
        data: schedules,
      };
    } catch (error) {
      throw new Error('Error fetching workshop schedules: ' + error.message);
    }
  }

  static async scheduleWorkshop(scheduleData) {
    try {
      const { company_id, date, time, workshop_id } = scheduleData;
  
      // Combine date and time into a single timestamp
      const start_time = new Date(`${date}T${time}`);
  
      // Insert the schedule into the database
      const query = `
        INSERT INTO workshop_schedules (company_id, workshop_id, start_time, status)
        VALUES (?, ?, ?, 'scheduled')
      `;
  
      const [result] = await db.query(query, [company_id, workshop_id, start_time]);
  
      return {
        status: true,
        code: 201,
        message: 'Workshop scheduled successfully',
        data: {
          schedule_id: result.insertId,
          company_id,
          workshop_id,
          start_time,
        },
      };
    } catch (error) {
      throw new Error('Error scheduling workshop: ' + error.message);
    }
  }

}

module.exports = workshopService;
