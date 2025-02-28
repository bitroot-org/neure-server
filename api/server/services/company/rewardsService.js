const db = require("../../../config/db");

class RewardsService {
  static async createReward(title, termsAndConditions) {
    try {
      const query =
        "INSERT INTO rewards (title, terms_and_conditions) VALUES (?, ?)";
      const [result] = await db.execute(query, [title, termsAndConditions]);

      return {
        status: true,
        code: 201,
        message: "Reward created successfully",
        data: {
          id: result.insertId,
          title,
          terms_and_conditions: termsAndConditions,
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

      return {
        status: true,
        code: 200,
        message: "Rewards retrieved successfully",
        data: rows,
      };
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
}

module.exports = RewardsService;
