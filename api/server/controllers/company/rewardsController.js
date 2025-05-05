const {
  createReward,
  getAllRewards,
  getRewardById,
  deleteReward,
  updateReward,
} = require("../../services/company/rewardsService");
const { uploadImage, deleteImage } = require("../../controllers/upload/UploadController");
const ActivityLogService = require('../../services/logs/ActivityLogService');

class RewardsController {
  static async createReward(req, res) {
    try {
      let { title, terms_and_conditions, reward_type, company_ids } = req.body;
      const user = req.user;
      
      // Parse company_ids if it's a string
      if (company_ids && typeof company_ids === 'string') {
        try {
          company_ids = JSON.parse(company_ids);
        } catch (e) {
          console.error("Error parsing company_ids:", e);
          return res.status(400).json({
            status: false,
            code: 400,
            message: "Invalid company_ids format. Must be an array.",
            data: null,
          });
        }
      }

      if (!title || !terms_and_conditions) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Title and terms are required.",
          data: null,
        });
      }

      // Validate reward_type if provided
      if (reward_type && !['global', 'custom'].includes(reward_type)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Invalid reward type. Must be 'global' or 'custom'.",
          data: null,
        });
      }

      // Validate company_ids if reward_type is custom
      if (reward_type === 'custom' && (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company IDs are required for custom rewards.",
          data: null,
        });
      }

      let iconUrl = null;
      // Handle icon upload if file is present
      if (req.file) {
        req.body.type = 'icon';
        const uploadResult = await uploadImage(req);
        
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading icon",
            data: null,
          });
        }
        iconUrl = uploadResult.url;
      }

      const result = await createReward(
        title, 
        terms_and_conditions, 
        iconUrl, 
        reward_type || 'global', 
        company_ids || []
      );
      
      // Log the reward creation
      if (result.status) {
        let description = `Reward "${title}" created`;
        
        // Add company information if it's a custom reward
        if (reward_type === 'custom' && company_ids && company_ids.length > 0) {
          // Get company names if available
          try {
            const companyNames = await RewardsController.getCompanyNames(company_ids);
            const readableCompanyNames = companyNames.map(name => name.split(' (ID:')[0]).join(', ');
            description += `. Assigned to companies: ${readableCompanyNames}`;
          } catch (error) {
            description += `. Assigned to specific companies`;
          }
        } else {
          description += ` (Global reward)`;
        }
        
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'rewards',
          action: 'create',
          description: description
        });
      }
      
      res.status(result.code).json(result);
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
      const { company_id } = req.query;
      const rewards = await getAllRewards(company_id || null);

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
      const user = req.user;

      const reward = await getRewardById(id);
      
      if (!reward || !reward.data) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        });
      }

      // Delete icon if it exists
      if (reward.data.icon_url) {
        const deleteReq = {
          body: {
            url: reward.data.icon_url,
            type: 'icon'
          }
        };
        await deleteImage(deleteReq);
      }

      const deletedRows = await deleteReward(id);

      // Log the reward deletion with more user-friendly description
      await ActivityLogService.createLog({
        user_id: user?.user_id,
        performed_by: 'admin',
        module_name: 'rewards',
        action: 'delete',
        description: `Reward "${reward.data.title}" was deleted`
      });

      res.status(200).json({
        status: true,
        code: 200,
        message: "Reward and associated icon deleted successfully",
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

  static async updateReward(req, res) {
    try {
      const { id } = req.params;
      let { title, terms_and_conditions, reward_type, company_ids } = req.body;
      const user = req.user;
      
      // Parse company_ids if it's a string
      if (company_ids && typeof company_ids === 'string') {
        try {
          company_ids = JSON.parse(company_ids);
        } catch (e) {
          console.error("Error parsing company_ids:", e);
          return res.status(400).json({
            status: false,
            code: 400,
            message: "Invalid company_ids format. Must be an array.",
            data: null,
          });
        }
      }

      // Check if any update data is provided
      if (!title && !terms_and_conditions && !req.file && reward_type === undefined && !company_ids) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "At least one field (title, terms_and_conditions, icon, reward_type, or company_ids) is required for update",
          data: null,
        });
      }

      // Validate reward_type if provided
      if (reward_type && !['global', 'custom'].includes(reward_type)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Invalid reward type. Must be 'global' or 'custom'.",
          data: null,
        });
      }

      // Validate company_ids if reward_type is custom
      if (reward_type === 'custom' && (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company IDs are required for custom rewards.",
          data: null,
        });
      }

      // First get the existing reward
      const existingReward = await getRewardById(id);
      if (!existingReward || !existingReward.data) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Reward not found",
          data: null,
        });
      }

      // Prepare update data with existing values as fallback
      const updateData = {
        title: title || existingReward.data.title,
        terms_and_conditions: terms_and_conditions || existingReward.data.terms_and_conditions,
        icon_url: existingReward.data.icon_url,
        reward_type: reward_type,
        company_ids: company_ids
      };

      // If new file is uploaded, handle old icon deletion and new upload
      if (req.file) {
        // Delete existing icon if it exists
        if (existingReward.data.icon_url) {
          const deleteReq = {
            body: {
              url: existingReward.data.icon_url,
              type: 'icon'
            }
          };
          const deleteResult = await deleteImage(deleteReq);
          if (!deleteResult.success) {
            console.error("Failed to delete old icon:", deleteResult.message);
          }
        }

        // Upload new icon
        req.body.type = 'icon';
        const uploadResult = await uploadImage(req);
        
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading new icon",
            data: null,
          });
        }
        updateData.icon_url = uploadResult.url;
      }

      const result = await updateReward(id, updateData);

      // Log the reward update
      if (result.status) {
        // Determine which fields were updated
        const updatedFields = [];
        if (title) updatedFields.push('title');
        if (terms_and_conditions) updatedFields.push('terms and conditions');
        if (req.file) updatedFields.push('icon');
        if (reward_type) updatedFields.push('reward type');
        if (company_ids) updatedFields.push('assigned companies');
        
        let description = `Reward "${existingReward.data.title}" updated. Changes made to: ${updatedFields.join(', ')}`;
        
        // Add company information if it's a custom reward
        if ((reward_type === 'custom' || (!reward_type && existingReward.data.reward_type === 'custom')) && company_ids && company_ids.length > 0) {
          // Get company names if available
          try {
            const companyNames = await RewardsController.getCompanyNames(company_ids);
            const readableCompanyNames = companyNames.map(name => name.split(' (ID:')[0]).join(', ');
            description += `. Now assigned to companies: ${readableCompanyNames}`;
          } catch (error) {
            description += `. Now assigned to different companies`;
          }
        } else if (reward_type === 'global') {
          description += `. Changed to a Global reward (available to all companies)`;
        }
        
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'rewards',
          action: 'update',
          description: description
        });
      }

      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Error updating reward:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: "An error occurred while updating the reward",
        data: null,
      });
    }
  }

  // Helper function to get company names from IDs
  static async getCompanyNames(companyIds) {
    try {
      const db = require("../../../config/db");
      const placeholders = companyIds.map(() => '?').join(',');
      const [companies] = await db.query(
        `SELECT id, company_name FROM companies WHERE id IN (${placeholders})`,
        companyIds
      );
      
      return companies.map(company => `${company.company_name} (ID: ${company.id})`);
    } catch (error) {
      console.error("Error fetching company names:", error);
      throw error;
    }
  }
}

// Add the helper function to the class
RewardsController.getCompanyNames = async function(companyIds) {
  try {
    const db = require("../../../config/db");
    const placeholders = companyIds.map(() => '?').join(',');
    const [companies] = await db.query(
      `SELECT id, company_name FROM companies WHERE id IN (${placeholders})`,
      companyIds
    );
    
    return companies.map(company => `${company.company_name} (ID: ${company.id})`);
  } catch (error) {
    console.error("Error fetching company names:", error);
    throw error;
  }
};

module.exports = RewardsController;
