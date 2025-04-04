const { uploadGalleryFile, deleteGalleryFile } = require("../upload/UploadController");
const GalleryService = require("../../services/gallery/galleryService");
const db = require("../../../config/db");


class GalleryController {
  // static async getGalleryItems(req, res) {
  //   try {
  //     const { companyId, type } = req.query;
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 10;

  //     if (!type) {
  //       return res.status(400).json({
  //         status: false,
  //         code: 400,
  //         message: "File type is required",
  //         data: null,
  //       });
  //     }

  //     const result = await GalleryService.getGalleryItems(
  //       companyId,
  //       type,
  //       page,
  //       limit
  //     );
  //     return res.status(result.code).json(result);
  //   } catch (error) {
  //     return res.status(500).json({
  //       status: false,
  //       code: 500,
  //       message: error.message,
  //       data: null,
  //     });
  //   }
  // }

  static async getGalleryItems(req, res) {
    try {
      const { companyId, type, showUnassigned } = req.query;
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
        companyId ? parseInt(companyId) : null,
        type,
        page,
        limit,
        showUnassigned === 'true'
      );
      
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Get gallery items error:", error);
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

  static async deleteGalleryItem(req, res) {
    try {
      const { itemId } = req.params;
  
      if (!itemId) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Item ID is required",
          data: null,
        });
      }
  
      // Get file URL directly from gallery table
      const [item] = await db.query(
        'SELECT file_url, file_type FROM gallery WHERE id = ?',
        [itemId]
      );

      console.log("item  :  ", item);
  
      if (!item || item.length === 0) {
        return res.status(404).json({
          status: false,
          code: 404,
          message: "Gallery item not found",
          data: null,
        });
      }
  
      // Delete file from AWS S3
      if (item[0].file_type !== 'video') {
        const s3Result = await deleteGalleryFile(item[0].file_url);
        if (!s3Result.success) {
          return res.status(500).json({
            status: false,
            code: 500,
            message: "Error deleting file from storage",
            data: null,
          });
        }
      }
  
      // Delete from database
      const result = await GalleryService.deleteGalleryItem(itemId);
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Delete gallery item error:", error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null,
      });
    }
  }

  static async assignToCompany(req, res) {
    try {
      const { company_id, resource_ids } = req.body;
      
      // Access user details from req.user (set by authorization middleware)
      const { user_id, role_id } = req.user;

      console.log("user_id : ", user_id);
      console.log("role_id : ", role_id);
  
      // Check if user is admin (role_id = 1)
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Unauthorized: Only administrators can assign gallery items",
          data: null
        });
      }
  
      // Validate required fields
      if (!company_id || !resource_ids || !Array.isArray(resource_ids)) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID and resource IDs array are required",
          data: null
        });
      }
  
      const result = await GalleryService.assignToCompany({
        company_id,
        resource_ids,
        user_id  // Pass the user_id to the service
      });
  
      return res.status(result.code).json(result);
    } catch (error) {
      console.error("Assign gallery items error:", error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        status: false,
        code: error.message.includes('Unauthorized') ? 403 : 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = GalleryController;
