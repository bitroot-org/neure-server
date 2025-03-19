const db = require("../../../config/db");

class GalleryService {
  static async getGalleryItems(companyId, fileType, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Validate file type
      const validTypes = ["image", "video", "document"];
      if (!validTypes.includes(fileType)) {
        return {
          status: false,
          code: 400,
          message: "Invalid file type. Must be image, video, or document",
          data: null,
        };
      }

      // Get total count
      const [totalRows] = await db.query(
        "SELECT COUNT(*) as count FROM gallery WHERE company_id = ? AND file_type = ?",
        [companyId, fileType]
      );
      const total = totalRows[0].count;

      // Get paginated gallery items
      const [items] = await db.query(
        `SELECT 
          id, 
          company_id, 
          file_type, 
          file_url, 
          size, 
          created_at 
        FROM gallery 
        WHERE company_id = ? AND file_type = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [companyId, fileType, limit, offset]
      );

      return {
        status: true,
        code: 200,
        message: `Gallery ${fileType}s fetched successfully`,
        data: {
          items,
          pagination: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
          },
        },
      };
    } catch (error) {
      throw new Error(`Error fetching gallery ${fileType}s: ${error.message}`);
    }
  }

  static async getGalleryItemById(itemId) {
    try {
      const [item] = await db.query(
        `SELECT 
          id, 
          company_id, 
          file_type, 
          file_url, 
          size, 
          created_at 
        FROM gallery 
        WHERE id = ?`,
        [itemId]
      );

      if (item.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Gallery item not found",
          data: null,
        };
      }

      return {
        status: true,
        code: 200,
        message: "Gallery item fetched successfully",
        data: item[0],
      };
    } catch (error) {
      throw new Error(`Error fetching gallery item: ${error.message}`);
    }
  }
}

module.exports = GalleryService;
