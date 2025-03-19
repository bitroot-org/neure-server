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
        "SELECT id, title, author, sound_cover_image, sound_file_url, file_size, created_at, is_active FROM soundscapes WHERE is_active = 1 LIMIT ? OFFSET ?",
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
}

module.exports = SoundscapeService;
