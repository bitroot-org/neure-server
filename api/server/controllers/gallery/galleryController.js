const GalleryService = require("../../services/gallery/galleryService");

class GalleryController {
  static async getGalleryItems(req, res) {
    try {
      const { companyId, type } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!companyId || !type) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID and file type are required",
          data: null,
        });
      }

      const result = await GalleryService.getGalleryItems(companyId, type, page, limit);
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

  static async getGalleryItemById(req, res) {
    try {
      const { itemId } = req.params;
      const result = await GalleryService.getGalleryItemById(itemId);
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

  static async getMediaCounts(req, res) {
    try {
      const { companyId } = req.query;

      if (!companyId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null,
        });
      }

      const result = await GalleryService.getMediaCounts(companyId);
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

module.exports = GalleryController;