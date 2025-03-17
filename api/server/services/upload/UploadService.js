const db = require('../../../config/db');

class MediaService {

  static async uploadImageService(fileData) {
    try {
      const {
        type,
        url,
        userId,
        companyId,
        rewardId,
        articleId,
        workshopId
      } = fileData;

      let result;
      let updateInfo = {};

      // Switch case handling specific image types only
      switch (type) {
        case 'profile':
          if (userId) {
            // Update user profile
            const userQuery = `
              UPDATE users 
              SET profile_url = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE user_id = ?
            `;
            [result] = await db.query(userQuery, [url, userId]);

            if (result.affectedRows === 0) {
              throw new Error("User not found");
            }

            updateInfo = {
              message: "User profile updated successfully",
              userId,
              profileUrl: url
            };
          }
          else if (companyId) {
            // Update company profile
            const companyQuery = `
              UPDATE companies 
              SET company_profile_url = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `;
            [result] = await db.query(companyQuery, [url, companyId]);

            if (result.affectedRows === 0) {
              throw new Error("Company not found");
            }

            updateInfo = {
              message: "Company profile updated successfully",
              companyId,
              profileUrl: url
            };
          }
          else {
            throw new Error("Either userId or companyId is required for profile updates");
          }
          break;

        case 'icon':
          if (!rewardId) {
            throw new Error("Reward ID is required for icon uploads");
          }

          const iconQuery = `UPDATE rewards SET icon_url = ? WHERE id = ?`;
          [result] = await db.query(iconQuery, [url, rewardId]);

          if (result.affectedRows === 0) {
            throw new Error("Reward not found");
          }

          updateInfo = {
            message: "Reward icon updated successfully",
            rewardId,
            iconUrl: url
          };
          break;

        case 'article':
          if (!articleId) {
            throw new Error("Article ID is required for article image uploads");
          }

          const articleQuery = `
            UPDATE articles 
            SET image_url = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `;
          [result] = await db.query(articleQuery, [url, articleId]);

          if (result.affectedRows === 0) {
            throw new Error("Article not found");
          }

          updateInfo = {
            message: "Article image updated successfully",
            articleId,
            imageUrl: url
          };
          break;

        case 'workshop':
          if (!workshopId) {
            throw new Error("Workshop ID is required for workshop poster uploads");
          }

          const workshopQuery = `UPDATE workshops SET poster_image = ? WHERE id = ?`;
          [result] = await db.query(workshopQuery, [url, workshopId]);

          if (result.affectedRows === 0) {
            throw new Error("Workshop not found");
          }

          updateInfo = {
            message: "Workshop poster updated successfully",
            workshopId,
            posterUrl: url
          };
          break;

        default:
          throw new Error(`Unsupported image type: ${type}. Supported types are: profile, icon, article, workshop`);
      }

      return {
        success: true,
        type,
        url,
        ...updateInfo
      };

    } catch (error) {
      console.error("Database error:", error);
      throw new Error(`Error saving ${fileData.type || 'image'}: ${error.message}`);
    }
  }
  
  static async uploadSoundService(fileData) {
    try {
      // Extract the data we need to save
      const { title, url, path, fileSize, duration } = fileData;

      // Insert with file size and duration into soundscapes table
      const query = `
        INSERT INTO soundscapes (title, sound_file_url, file_size, duration, is_active)
        VALUES (?, ?, ?, ?, 1)
      `;

      const [result] = await db.query(query, [title, url, fileSize, duration || null]);

      return {
        id: result.insertId,
        title: title,
        sound_file_url: url,
        file_size: fileSize,
        duration: duration || null,
        path
      };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Error saving sound file data");
    }
  }

  static async saveGalleryFile(fileData) {
    try {
      // Insert directly into the gallery table
      const query = `
        INSERT INTO gallery (company_id, file_type, file_url, size)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await db
        .promise()
        .query(query, [
          fileData.company_id,
          fileData.file_type,
          fileData.file_url,
          fileData.size
        ]);

      return {
        id: result.insertId,
        ...fileData
      };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Error saving gallery file data");
    }
  }

  static async deleteGalleryFile(fileId) {
    try {
      const query = `
        DELETE FROM gallery
        WHERE id = ?
      `;

      const [result] = await db
        .promise()
        .query(query, [fileId]);

      return { success: result.affectedRows > 0 };
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Error deleting gallery file data");
    }
  }

}

module.exports = MediaService;
