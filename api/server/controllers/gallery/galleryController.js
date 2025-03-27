const { uploadGalleryFile, deleteGalleryFile } = require("../upload/UploadController");
const GalleryService = require("../../services/gallery/galleryService");

class GalleryController {
  static async getGalleryItems(req, res) {
    try {
      const { companyId, type } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!type) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "File type is required",
          data: null,
        });
      }

      const result = await GalleryService.getGalleryItems(
        companyId,
        type,
        page,
        limit
      );
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

  static async uploadGalleryItem(req, res) {
    try {
      const { type, title, description, tags, url } = req.body;
  
      // Validate required fields
      if (!type || !title) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Type and title are required",
          data: null,
        });
      }
  
      let fileUrl = url;
  
      // If no URL is provided, handle file upload
      if (!fileUrl && req.file) {
        const uploadResult = await uploadGalleryFile(req);
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading file",
            data: null,
          });
        }
        fileUrl = uploadResult.url;
      }
  
      // Call the service to handle the upload
      const result = await GalleryService.uploadGalleryItem({
        type,
        title,
        description,
        tags,
        url: fileUrl,
      });
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Upload gallery item error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  static async updateGalleryItem(req, res) {
    try {
      const { id, type, title, description, tags, url } = req.body;
  
      // Validate required fields
      if (!id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Item ID is required",
          data: null,
        });
      }
  
      let fileUrl = url;
  
      // If no URL is provided, handle file upload
      if (!fileUrl && req.file) {
        const uploadResult = await uploadGalleryFile(req);
        if (!uploadResult.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error uploading file",
            data: null,
          });
        }
        fileUrl = uploadResult.url;
      }
  
      // Call the service to handle the update
      const result = await GalleryService.updateGalleryItem({
        id,
        type,
        title,
        description,
        tags,
        url: fileUrl,
      });
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Update gallery item error:", error);
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
