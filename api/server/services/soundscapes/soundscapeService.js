const db = require("../../../config/db");

class SoundscapeService {
  // Fetch all soundscapes
  static async getSoundscapes(page = 1, limit = 10) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const [totalRows] = await db.query(
        "SELECT COUNT(*) as count FROM soundscapes WHERE is_active = 1"
      );
      const total = totalRows[0].count;

      // Get paginated soundscapes in descending order (newest first)
      const [soundscapes] = await db.query(
        "SELECT * FROM soundscapes WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: "Soundscapes fetched successfully",
        data: {
          soundscapes,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
          },
        },
      };
    } catch (error) {
      throw new Error("Error fetching soundscapes: " + error.message);
    }
  }

  // Fetch a soundscape by its ID
  static async getSoundscapeByUserId(userId, page = 1, limit = 10) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const [totalRows] = await db.query(
        "SELECT COUNT(*) as count FROM soundscapes WHERE is_active = 1"
      );
      const total = totalRows[0].count;

      // Get paginated soundscapes with like status
      const [soundscapes] = await db.query(
        `SELECT 
          s.*,
          COUNT(DISTINCT sl.id) as likes_count,
          ${userId ? 'IF(ul.id IS NOT NULL, 1, 0) as is_liked_by_user' : '0 as is_liked_by_user'}
        FROM soundscapes s
        LEFT JOIN soundscape_likes sl ON s.id = sl.soundscape_id
        ${userId ? 'LEFT JOIN soundscape_likes ul ON s.id = ul.soundscape_id AND ul.user_id = ?' : ''}
        WHERE s.is_active = 1
        GROUP BY s.id
        LIMIT ? OFFSET ?`,
        userId ? [userId, limit, offset] : [limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: "Soundscapes fetched successfully",
        data: {
          soundscapes,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
          },
        },
      };
    } catch (error) {
      throw new Error("Error fetching soundscapes: " + error.message);
    }
  }

  // Create a new soundscape
  static async createSoundscape({
    title,
    artistName,
    tags,
    category,
    coverImageUrl,
    soundFileUrl,
    duration,
    fileSize
  }) {
    try {
      console.log("audioUrl:", soundFileUrl);
      console.log("imageCoverUrl:", coverImageUrl);


      // Insert the new soundscape into the database
      const [result] = await db.query(
        `INSERT INTO soundscapes (title, artist_name, tags, categories, sound_cover_image, sound_file_url, duration, file_size,created_at) 
         VALUES (?, ?, ?, ?, ?, ?,?, ?, NOW())`,
        [title, artistName, tags, category, coverImageUrl, soundFileUrl, duration, fileSize]
      );

      return {
        status: true,
        code: 201,
        message: "Soundscape created successfully",
        data: {
          id: result.insertId,
          title,
          artistName,
          tags: tags ? JSON.parse(tags) : null,
          category,
          coverImageUrl,
          soundFileUrl,
          duration
        },
      };
    } catch (error) {
      throw new Error("Error creating soundscape: " + error.message);
    }
  }

  static async deleteSoundscape(soundscapeId) {
    try {
      const [result] = await db.query(
        "DELETE FROM soundscapes WHERE id = ?",
        [soundscapeId]
      );

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Soundscape not found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Soundscape deleted successfully",
        data: null,
      };
    } catch (error) {
      throw new Error("Error deleting soundscape: " + error.message);
    }
  }

  static async likeSoundscape(userId, soundscapeId) {
    try {
      // Check if soundscape exists
      const [soundscape] = await db.query(
        "SELECT id FROM soundscapes WHERE id = ? AND is_active = 1",
        [soundscapeId]
      );

      if (soundscape.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Soundscape not found",
          data: null,
        };
      }

      // Add like (will fail if already liked due to unique constraint)
      await db.query(
        "INSERT INTO soundscape_likes (user_id, soundscape_id) VALUES (?, ?)",
        [userId, soundscapeId]
      );

      return {
        status: true,
        code: 200,
        message: "Soundscape liked successfully",
        data: null,
      };
    } catch (error) {
      // If duplicate entry error (already liked)
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          status: false,
          code: 400,
          message: "Soundscape already liked",
          data: null,
        };
      }
      throw new Error("Error liking soundscape: " + error.message);
    }
  }

  static async unlikeSoundscape(userId, soundscapeId) {
    try {
      const [result] = await db.query(
        "DELETE FROM soundscape_likes WHERE user_id = ? AND soundscape_id = ?",
        [userId, soundscapeId]
      );

      if (result.affectedRows === 0) {
        return {
          status: false,
          code: 404,
          message: "Like not found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Soundscape unliked successfully",
        data: null,
      };
    } catch (error) {
      throw new Error("Error unliking soundscape: " + error.message);
    }
  }

  static async isLikedByUser(userId, soundscapeId) {
    try {
      const [result] = await db.query(
        "SELECT 1 FROM soundscape_likes WHERE user_id = ? AND soundscape_id = ?",
        [userId, soundscapeId]
      );

      return {
        status: true,
        code: 200,
        message: "Like status retrieved successfully",
        data: {
          isLiked: result.length > 0
        },
      };
    } catch (error) {
      throw new Error("Error checking like status: " + error.message);
    }
  }

  static async getLikedSoundscapesByUser(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get total count of liked soundscapes
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as count 
         FROM soundscape_likes sl
         JOIN soundscapes s ON sl.soundscape_id = s.id
         WHERE sl.user_id = ? AND s.is_active = 1`,
        [userId]
      );
      const total = totalRows[0].count;

      // Get paginated liked soundscapes with details
      const [soundscapes] = await db.query(
        `SELECT 
          s.*,
          COUNT(DISTINCT sl2.id) as total_likes,
          1 as is_liked_by_user,
          sl.created_at as liked_at
        FROM soundscape_likes sl
        JOIN soundscapes s ON sl.soundscape_id = s.id
        LEFT JOIN soundscape_likes sl2 ON s.id = sl2.soundscape_id
        WHERE sl.user_id = ? AND s.is_active = 1
        GROUP BY s.id
        ORDER BY sl.created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: "Liked soundscapes fetched successfully",
        data: {
          soundscapes,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
          },
        },
      };
    } catch (error) {
      throw new Error("Error fetching liked soundscapes: " + error.message);
    }
  }
}

module.exports = SoundscapeService;
