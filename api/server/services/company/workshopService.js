const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../../config/db');

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

}

module.exports = workshopService;