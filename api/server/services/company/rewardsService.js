const db = require("../../../config/db");

class RewardsService {
  static async createReward(title, termsAndConditions, iconUrl = null) {
    try {
      const query = `
        INSERT INTO rewards (
          title, 
          terms_and_conditions, 
          icon_url
        ) VALUES (?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        title, 
        termsAndConditions, 
        iconUrl
      ]);

      return {
        status: true,
        code: 201,
        message: "Reward created successfully",
        data: {
          id: result.insertId,
          title,
          terms_and_conditions: termsAndConditions,
          icon_url: iconUrl
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAllRewards() {
    try {
      const query = "SELECT * FROM rewards ORDER BY created_at DESC";
      const [rows] = await db.execute(query);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getRewardById(id) {
    try {
      const query = "SELECT * FROM rewards WHERE id = ?";
      const [rows] = await db.execute(query, [id]);

      if (!rows[0]) {
        return {
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Reward retrieved successfully",
        data: rows[0],
      };
    } catch (error) {
      throw error;
    }
  }

  static async deleteReward(id) {
    try {
      const query = "DELETE FROM rewards WHERE id = ?";
      const [result] = await db.execute(query, [id]);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Reward deleted successfully",
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateReward(id, { title, terms_and_conditions, icon_url }) {
    try {
      // First check if reward exists
      const [existingReward] = await db.execute(
        "SELECT * FROM rewards WHERE id = ?",
        [id]
      );

      if (!existingReward || existingReward.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        };
      }

      const query = `
        UPDATE rewards 
        SET title = ?, 
            terms_and_conditions = ?,
            icon_url = COALESCE(?, icon_url),
            updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [
        title,
        terms_and_conditions,
        icon_url,
        id
      ]);

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 400,
          message: "No changes were made to the reward",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Reward updated successfully",
        data: {
          id,
          title,
          terms_and_conditions,
          icon_url,
          updated_at: new Date()
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RewardsService;
