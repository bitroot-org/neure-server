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
}

module.exports = SoundscapeController;
