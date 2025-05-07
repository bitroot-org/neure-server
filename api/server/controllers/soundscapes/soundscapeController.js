const {
  uploadImage,
  uploadSound,
  deleteSound,
} = require("../upload/UploadController");
const SoundscapeService = require("../../services/soundscapes/soundscapeService");
const ActivityLogService = require('../../services/logs/ActivityLogService');

class SoundscapeController {
  // Get all soundscapes
  static async getSoundscapes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await SoundscapeService.getSoundscapes(page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Get a soundscape by ID
  static async getSoundscapeByUserId(req, res) {
    try {
      const userId = req.user?.user_id || null; // Get user ID if authenticated, otherwise null
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await SoundscapeService.getSoundscapeByUserId(userId, page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Create a new soundscape
  static async createSoundscape(req, res) {
    try {
      const { title, artistName, tags, category } = req.body;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      // Validate required fields
      if (!title || !artistName || !category) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Title, artist name, and category are required",
          data: null,
        });
      }

      console.log("Request body:", req.body);

      // Upload sound and cover image
      const uploadResult = await uploadSound({
        soundFile: req.files.audio[0],
        coverImage: req.files.coverImage ? req.files.coverImage[0] : null,
      });

      if (!uploadResult.success) {
        return res.status(500).json({
          status: false,
          code: 500,
          message: uploadResult.message,
          data: null,
        });
      }

      const { soundFileUrl, coverImageUrl, duration, fileSize } =
        uploadResult.data;

      // Save soundscscape to the database
      const result = await SoundscapeService.createSoundscape({
        title,
        artistName,
        tags,
        category,
        soundFileUrl,
        coverImageUrl,
        duration,
        fileSize,
      });

      // Log the soundscape creation
      if (result.status) {
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'soundscapes',
          action: 'create',
          description: `Soundscape "${title}" created by artist "${artistName}" in category "${category}".`
        });
      }

      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Create soundscape error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Delete a soundscape by ID
  static async deleteSoundscape(req, res) {
    try {
      const { soundscapeId } = req.query;
      const user = req.user;

      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create articles",
          data: null,
        });
      }

      // Get soundscape details before deletion for logging
      const soundscapeDetails = await SoundscapeController.getSoundscapeDetails(soundscapeId);
      
      const result = await deleteSound(soundscapeId);

      if (!result.success) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: result.message,
          data: null,
        });
      }

      // Log the soundscape deletion
      if (soundscapeDetails) {
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'soundscapes',
          action: 'delete',
          description: `Soundscape "${soundscapeDetails.title}" by artist "${soundscapeDetails.artist_name}" was deleted`
        });
      } else {
        // Fallback if we couldn't get the details
        await ActivityLogService.createLog({
          user_id: user?.user_id,
          performed_by: 'admin',
          module_name: 'soundscapes',
          action: 'delete',
          description: `Soundscape was deleted`
        });
      }

      return res.status(200).json({
        status: true,
        code: 200,
        message: "Soundscape deleted successfully",
        data: null,
      });
    } catch (error) {
      console.error("Delete soundscape error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  // Helper function to get soundscape details for logging
  static async getSoundscapeDetails(soundscapeId) {
    try {
      const db = require("../../../config/db");
      const [soundscape] = await db.query(
        "SELECT title, artist_name, categories, duration FROM soundscapes WHERE id = ?",
        [soundscapeId]
      );
      
      return soundscape.length > 0 ? soundscape[0] : null;
    } catch (error) {
      console.error("Error fetching soundscape details:", error);
      return null;
    }
  }


  static async likeSoundscape(req, res) {
    try {
      const { soundscapeId } = req.params;
      const { user_id } = req.user; // Assuming user info is added by authorization middleware

      const result = await SoundscapeService.likeSoundscape(user_id, soundscapeId);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error liking soundscape:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async unlikeSoundscape(req, res) {
    try {
      const { soundscapeId } = req.params;
      const { user_id } = req.user;

      const result = await SoundscapeService.unlikeSoundscape(user_id, soundscapeId);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error unliking soundscape:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async isLikedByUser(req, res) {
    try {
      const { soundscapeId } = req.params;
      const { user_id } = req.user;

      const result = await SoundscapeService.isLikedByUser(user_id, soundscapeId);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error checking like status:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async getLikedSoundscapes(req, res) {
    try {
      const { user_id } = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await SoundscapeService.getLikedSoundscapesByUser(user_id, page, limit);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error('Error fetching liked soundscapes:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}


module.exports = SoundscapeController;
