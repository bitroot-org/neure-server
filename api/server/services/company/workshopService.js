const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");

class workshopService {
  static async getWorkshopDetails(workshop_id, company_id) {
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
        "SELECT start_time,end_time,status,max_participants FROM workshop_schedules WHERE workshop_id = ? AND company_id = ?",
        [workshop_id, company_id]
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

  static async getWorkshopsByCompanyId(company_id, page = 1, limit = 6, start_time = null) {
    try {
      let timeFilterQuery = '';
      const queryParams = [company_id];

      if (start_time) {
        timeFilterQuery = 'AND DATE(ws.start_time) = ?';
        queryParams.push(start_time);
      }

      const [totalRows] = await db.query(
        `SELECT COUNT(DISTINCT w.id) as count
         FROM workshops w
         INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
         WHERE ws.company_id = ? AND w.is_active = 1 ${timeFilterQuery}`,
        queryParams
      );

      const offset = (page - 1) * limit;
      
      const [workshops] = await db.query(
        `SELECT w.id AS workshop_id, w.title, w.description, w.is_active, 
                ws.start_time, ws.end_time, ws.status, ws.max_participants, w.location, w.poster_image 
         FROM workshops w
         INNER JOIN workshop_schedules ws ON w.id = ws.workshop_id
         WHERE ws.company_id = ? AND w.is_active = 1 ${timeFilterQuery}
         ORDER BY ws.start_time ASC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: 'Workshops fetched successfully',
        data: {
          workshops,
          pagination: {
            total: totalRows[0].count,
            currentPage: page,
            totalPages: Math.ceil(totalRows[0].count / limit),
            limit
          }
        }
      };
    } catch (error) {
      throw new Error('Error fetching workshops: ' + error.message);
    }
  }

  static async getWorkshopDates(company_id) {
    try {
      const [dates] = await db.query(
        `SELECT DISTINCT ws.start_time as date
         FROM workshop_schedules ws
         INNER JOIN workshops w ON w.id = ws.workshop_id
         WHERE ws.company_id = ? AND w.is_active = 1
         ORDER BY ws.start_time ASC`,
        [company_id]
      );

      return {
        status: true,
        code: 200,
        message: 'Workshop dates fetched successfully',
        data: dates.map(row => {
          const date = new Date(row.date);
          return date.toISOString().split('T')[0];
        })
      };
    } catch (error) {
      throw new Error('Error fetching workshop dates: ' + error.message);
    }
  }
}

module.exports = workshopService;
