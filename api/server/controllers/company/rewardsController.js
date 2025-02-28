const {
  createReward,
  getAllRewards,
  getRewardById,
  deleteReward,
} = require("../../services/company/rewardsService");

class RewardsController {
  static async createReward(req, res) {
    try {
      const { title, terms_and_conditions } = req.body;

      if (!title || !terms_and_conditions) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Title and terms are required.",
          data: null,
        });
      }

      const id = await createReward(title, terms_and_conditions);

      res.status(201).json({
        status: true,
        code: 201,
        message: "Reward added successfully",
        data: { id },
      });
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while creating the reward",
        data: null,
      });
    }
  }

  static async getAllRewards(req, res) {
    try {
      const rewards = await getAllRewards();

      res.status(200).json({
        status: true,
        code: 200,
        message: "Rewards retrieved successfully",
        data: rewards,
      });
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching rewards",
        data: null,
      });
    }
  }

  static async getRewardById(req, res) {
    try {
      const { id } = req.params;
      const reward = await getRewardById(id);

      if (!reward) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        });
      }

      res.status(200).json({
        status: true,
        code: 200,
        message: "Reward retrieved successfully",
        data: reward,
      });
    } catch (error) {
      console.error("Error fetching reward:", error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while fetching the reward",
        data: null,
      });
    }
  }

  static async deleteReward(req, res) {
    try {
      const { id } = req.params;
      const deletedRows = await deleteReward(id);

      if (deletedRows === 0) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        });
      }

      res.status(200).json({
        status: true,
        code: 200,
        message: "Reward deleted successfully",
        data: null,
      });
    } catch (error) {
      console.error("Error deleting reward:", error);
      res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while deleting the reward",
        data: null,
      });
    }
  }
}

module.exports = RewardsController;
