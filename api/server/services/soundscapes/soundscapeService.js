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

      // Get paginated soundscapes
      const [soundscapes] = await db.query(
        "SELECT * FROM soundscapes WHERE is_active = 1 LIMIT ? OFFSET ?",
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
  static async getSoundscapeById(soundscapeId) {
    try {
      const [soundscape] = await db.query(
        "SELECT * FROM soundscapes WHERE id = ? AND is_active = 1",
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

      return {
        status: true,
        code: 200,
        message: "Soundscape fetched successfully",
        data: soundscape[0],
      };
    } catch (error) {
      throw new Error("Error fetching soundscape: " + error.message);
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
}

module.exports = SoundscapeService;
