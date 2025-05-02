const db = require("../../../config/db");

class RewardsService {
  static async createReward(title, termsAndConditions, iconUrl = null, rewardType = 'global', companyIds = []) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Insert the reward
      const query = `
        INSERT INTO rewards (
          title, 
          terms_and_conditions, 
          icon_url,
          reward_type
        ) VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        title, 
        termsAndConditions, 
        iconUrl,
        rewardType
      ]);
      
      const rewardId = result.insertId;
      
      // If reward type is custom, associate with companies
      if (rewardType === 'custom' && companyIds && companyIds.length > 0) {
        const companyRewardsQuery = `
          INSERT INTO company_rewards (company_id, reward_id) VALUES ?
        `;
        
        const values = companyIds.map(companyId => [companyId, rewardId]);
        await connection.query(companyRewardsQuery, [values]);
      }
      
      await connection.commit();

      return {
        status: true,
        code: 201,
        message: "Reward created successfully",
        data: {
          id: rewardId,
          title,
          terms_and_conditions: termsAndConditions,
          icon_url: iconUrl,
          reward_type: rewardType,
          company_ids: companyIds
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAllRewards(companyId = null) {
    try {
      let query;
      let params = [];
      
      if (companyId) {
        // Get global rewards and company-specific rewards
        query = `
          SELECT r.* FROM rewards r
          WHERE r.reward_type = 'global'
          UNION
          SELECT r.* FROM rewards r
          JOIN company_rewards cr ON r.id = cr.reward_id
          WHERE cr.company_id = ?
          ORDER BY created_at DESC
        `;
        params = [companyId];
      } else {
        // Get all rewards
        query = "SELECT * FROM rewards ORDER BY created_at DESC";
      }
      
      const [rows] = await db.execute(query, params);
      
      // Get company IDs and names for each custom reward
      const rewardsWithCompanies = await Promise.all(rows.map(async (reward) => {
        if (reward.reward_type === 'custom') {
          const [companyRows] = await db.execute(
            `SELECT cr.company_id, c.company_name 
             FROM company_rewards cr
             JOIN companies c ON cr.company_id = c.id
             WHERE cr.reward_id = ?`,
            [reward.id]
          );
          
          return {
            ...reward,
            companies: companyRows.map(row => ({
              id: row.company_id,
              name: row.company_name
            }))
          };
        } else {
          return {
            ...reward,
            company_ids: [],
            companies: []
          };
        }
      }));
      
      return rewardsWithCompanies;
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

      // Get company IDs and names if it's a custom reward
      let company_ids = [];
      let companies = [];
      if (rows[0].reward_type === 'custom') {
        const [companyRows] = await db.execute(
          `SELECT cr.company_id, c.company_name 
           FROM company_rewards cr
           JOIN companies c ON cr.company_id = c.id
           WHERE cr.reward_id = ?`,
          [id]
        );
        companies = companyRows.map(row => ({
          id: row.company_id,
          name: row.company_name
        }));
      }

      return {
        status: true,
        code: 200,
        message: "Reward retrieved successfully",
        data: {
          ...rows[0],
          company_ids,
          companies
        },
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

  static async updateReward(id, { title, terms_and_conditions, icon_url, reward_type, company_ids }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // First check if reward exists
      const [existingReward] = await connection.execute(
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

      // Update the reward basic info
      const query = `
        UPDATE rewards 
        SET title = ?, 
            terms_and_conditions = ?,
            icon_url = COALESCE(?, icon_url),
            reward_type = COALESCE(?, reward_type),
            updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await connection.execute(query, [
        title,
        terms_and_conditions,
        icon_url,
        reward_type,
        id
      ]);

      // Handle company associations based on reward type changes
      if (reward_type) {
        if (reward_type === 'global') {
          // If changing to global, remove all company associations
          await connection.execute(
            "DELETE FROM company_rewards WHERE reward_id = ?",
            [id]
          );
        } else if (reward_type === 'custom') {
          // If changing to custom, update company associations
          // First delete existing associations
          await connection.execute(
            "DELETE FROM company_rewards WHERE reward_id = ?",
            [id]
          );
          
          // Then add new ones if provided
          if (company_ids && Array.isArray(company_ids) && company_ids.length > 0) {
            const companyRewardsQuery = `
              INSERT INTO company_rewards (company_id, reward_id) VALUES ?
            `;
            
            const values = company_ids.map(companyId => [companyId, id]);
            await connection.query(companyRewardsQuery, [values]);
          }
        }
      } else if (existingReward[0].reward_type === 'custom' && company_ids && Array.isArray(company_ids)) {
        // If reward type is not changing but is already custom and company_ids are provided
        // Update company associations
        await connection.execute(
          "DELETE FROM company_rewards WHERE reward_id = ?",
          [id]
        );
        
        if (company_ids.length > 0) {
          const companyRewardsQuery = `
            INSERT INTO company_rewards (company_id, reward_id) VALUES ?
          `;
          
          const values = company_ids.map(companyId => [companyId, id]);
          await connection.query(companyRewardsQuery, [values]);
        }
      }

      await connection.commit();

      // Get updated company IDs and names (will be empty for global rewards)
      let updatedCompanyIds = [];
      let companies = [];
      const updatedRewardType = reward_type || existingReward[0].reward_type;
      
      if (updatedRewardType === 'custom') {
        const [companyRows] = await db.execute(
          `SELECT cr.company_id, c.company_name 
           FROM company_rewards cr
           JOIN companies c ON cr.company_id = c.id
           WHERE cr.reward_id = ?`,
          [id]
        );
        companies = companyRows.map(row => ({
          id: row.company_id,
          name: row.company_name
        }));
      }

      return {
        status: true,
        code: 200,
        message: "Reward updated successfully",
        data: {
          id,
          title,
          terms_and_conditions,
          icon_url: icon_url || existingReward[0].icon_url,
          reward_type: updatedRewardType,
          company_ids: updatedCompanyIds,
          companies,
          updated_at: new Date()
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = RewardsService;
