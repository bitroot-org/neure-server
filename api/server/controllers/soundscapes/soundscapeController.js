const {
  uploadImage,
  uploadSound,
  deleteSound,
} = require("../upload/UploadController");
const SoundscapeService = require("../../services/soundscapes/soundscapeService");

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
  static async getSoundscapeById(req, res) {
    try {
      const { soundscapeId } = req.params;
      const result = await SoundscapeService.getSoundscapeById(soundscapeId);
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

      // console.log("Sound file URL:", soundFileUrl);
      // console.log("Cover image URL:", coverImageUrl);
      // console.log("Duration:", duration);
      // console.log("fileSize: ", uploadResult.data.fileSize);

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
  // In your SoundscapeController.js
  static async deleteSoundscape(req, res) {
    try {
      const { soundscapeId } = req.query;

      const result = await deleteSound(soundscapeId);

      if (!result.success) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: result.message,
          data: null,
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
}

module.exports = SoundscapeController;
