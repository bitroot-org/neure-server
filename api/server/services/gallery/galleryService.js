const db = require("../../../config/db");

class GalleryService {
  // static async getGalleryItems(companyId, fileType, page = 1, limit = 10) {
  //   try {
  //     const offset = (page - 1) * limit;

  //     // Validate file type
  //     const validTypes = ["image", "video", "document"];
  //     if (!validTypes.includes(fileType)) {
  //       return {
  //         status: false,
  //         code: 400,
  //         message: "Invalid file type. Must be image, video, or document",
  //         data: null,
  //       };
  //     }

  //     // Get total count
  //     const [totalRows] = await db.query(
  //       "SELECT COUNT(*) as count FROM gallery WHERE company_id = ? AND file_type = ?",
  //       [companyId, fileType]
  //     );
  //     const total = totalRows[0].count;

  //     // Get paginated gallery items
  //     const [items] = await db.query(
  //       `SELECT
  //         id,
  //         company_id,
  //         file_type,
  //         file_url,
  //         size,
  //         created_at
  //       FROM gallery
  //       WHERE company_id = ? AND file_type = ?
  //       ORDER BY created_at DESC
  //       LIMIT ? OFFSET ?`,
  //       [companyId, fileType, limit, offset]
  //     );

  //     return {
  //       status: true,
  //       code: 200,
  //       message: `Gallery ${fileType}s fetched successfully`,
  //       data: {
  //         items,
  //         pagination: {
  //           total,
  //           currentPage: page,
  //           totalPages: Math.ceil(total / limit),
  //           limit,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     throw new Error(`Error fetching gallery ${fileType}s: ${error.message}`);
  //   }
  // }

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
  
      let totalQuery = `
        SELECT COUNT(*) as count 
        FROM gallery g
        LEFT JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
        WHERE g.file_type = ?
      `;
      let itemsQuery = `
        SELECT 
          g.id, 
          g.title,
          g.description,
          g.file_type, 
          g.file_url, 
          g.size,
          g.tags, 
          g.created_at 
        FROM gallery g
        LEFT JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
        WHERE g.file_type = ?
      `;
      const queryParams = [fileType];
  
      // Add companyId condition if provided
      if (companyId) {
        totalQuery += " AND cga.company_id = ?";
        itemsQuery += " AND cga.company_id = ?";
        queryParams.push(companyId);
      }
  
      itemsQuery += " ORDER BY g.created_at DESC LIMIT ? OFFSET ?";
      queryParams.push(limit, offset);
  
      // Get total count
      const [totalRows] = await db.query(
        totalQuery,
        queryParams.slice(0, queryParams.length - 2)
      );
      const total = totalRows[0].count;
  
      // Get paginated gallery items
      const [items] = await db.query(itemsQuery, queryParams);
  
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
          g.id, 
          g.file_type, 
          g.file_url, 
          g.title,
          g.description,
          g.tags,
          g.size, 
          g.created_at,
          GROUP_CONCAT(cga.company_id) as assigned_companies
        FROM gallery g
        LEFT JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
        WHERE g.id = ?
        GROUP BY g.id`,
        [itemId]
      );

      console.log("item  :  ", item);
  
      if (item.length === 0) {
        return {
          status: false,
          code: 404,
          message: "Gallery item not found",
          data: null,
        };
      }
  
      // Parse the assigned companies into an array if they exist
      const assignedCompanies = item[0].assigned_companies 
        ? item[0].assigned_companies.split(',').map(id => parseInt(id))
        : [];
  
      // Format the response
      const formattedItem = {
        ...item[0],
        assigned_companies: assignedCompanies,
        tags: item[0].tags ? JSON.parse(item[0].tags) : null
      };
  
      delete formattedItem.assigned_companies; // Remove the comma-separated string version
  
      return {
        status: true,
        code: 200,
        message: "Gallery item fetched successfully",
        data: formattedItem,
      };
    } catch (error) {
      throw new Error(`Error fetching gallery item: ${error.message}`);
    }
  }

  static async getMediaCounts(companyId) {
    try {
      const [counts] = await db.query(
        `SELECT 
          cga.item_type as file_type,
          COUNT(*) as count
        FROM company_gallery_assignments cga
        WHERE cga.company_id = ?
        GROUP BY cga.item_type`,
        [companyId]
      );
  
      // Format the results into an object with default values
      const formattedCounts = {
        image: 0,
        video: 0,
        document: 0,
      };
  
      // Update counts from query results
      counts.forEach((item) => {
        formattedCounts[item.file_type] = item.count;
      });
  
      return {
        status: true,
        code: 200,
        message: "Media counts fetched successfully",
        data: formattedCounts,
      };
    } catch (error) {
      throw new Error(`Error fetching media counts: ${error.message}`);
    }
  }

  static async uploadGalleryItem({ type, title, description, tags, url }) {
    try {
      // Validate file type
      const validTypes = ["image", "video", "document"];
      if (!validTypes.includes(type)) {
        return {
          status: false,
          code: 400,
          message: "Invalid file type. Must be image, video, or document",
          data: null,
        };
      }

      let tagsJson = null;
    if (tags) {
      if (Array.isArray(tags)) {
        // If tags is an array, stringify it
        tagsJson = JSON.stringify(tags);
      } else if (typeof tags === "string") {
        try {
          // If tags is a string, parse it to ensure it's valid JSON
          JSON.parse(tags);
          tagsJson = tags; // Already valid JSON
        } catch (error) {
          throw new Error("Invalid tags format. Must be a valid JSON array.");
        }
      } else {
        throw new Error("Invalid tags format. Must be an array or a valid JSON string.");
      }
    }


      console.log("type:", type);
      console.log("title:", title);
      console.log("description:", description);
      console.log("tags:", tagsJson);
      console.log("url:", url);


      // Insert the new gallery item into the database
      const [result] = await db.query(
        `INSERT INTO gallery (file_type, title, description, tags, file_url, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [type, title, description || null, tagsJson || null, url]
      );

      return {
        status: true,
        code: 201,
        message: "Gallery item uploaded successfully",
        data: {
          id: result.insertId,
          type,
          title,
          description,
          tags: tagsJson ? JSON.parse(tagsJson) : null,
          url,
        },
      };
    } catch (error) {
      throw new Error(`Error uploading gallery item: ${error.message}`);
    }
  }

  static async updateGalleryItem({ id, type, title, description, tags, url }) {
    try {
      // Validate file type
      const validTypes = ["image", "video", "document"];
      if (type && !validTypes.includes(type)) {
        return {
          status: false,
          code: 400,
          message: "Invalid file type. Must be image, video, or document",
          data: null,
        };
      }
  
      // Convert tags to JSON array if provided
      const tagsJson = tags ? JSON.stringify(tags) : null;
  
      // Build the update query dynamically
      const fieldsToUpdate = [];
      const queryParams = [];
  
      if (type) {
        fieldsToUpdate.push("file_type = ?");
        queryParams.push(type);
      }
      if (title) {
        fieldsToUpdate.push("title = ?");
        queryParams.push(title);
      }
      if (description) {
        fieldsToUpdate.push("description = ?");
        queryParams.push(description);
      }
      if (tagsJson) {
        fieldsToUpdate.push("tags = ?");
        queryParams.push(tagsJson);
      }
      if (url) {
        fieldsToUpdate.push("file_url = ?");
        queryParams.push(url);
      }
  
      if (fieldsToUpdate.length === 0) {
        return {
          status: false,
          code: 400,
          message: "No fields to update",
          data: null,
        };
      }
  
      queryParams.push(id);
  
      // Execute the update query
      const [result] = await db.query(
        `UPDATE gallery SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
        queryParams
      );
  
      if (result.affectedRows === 0) {
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
        message: "Gallery item updated successfully",
        data: {
          id,
          type,
          title,
          description,
          tags: tagsJson ? JSON.parse(tagsJson) : null,
          url,
        },
      };
    } catch (error) {
      throw new Error(`Error updating gallery item: ${error.message}`);
    }
  }

  static async deleteGalleryItem(itemId) {
    console.log("Deleting gallery item with ID:", itemId);
    try {
      // Delete any company gallery assignments first
      await db.query(
        'DELETE FROM company_gallery_assignments WHERE gallery_item_id = ?',
        [itemId]
      );

      // Delete the gallery item
      const [result] = await db.query(
        'DELETE FROM gallery WHERE id = ?',
        [itemId]
      );

      if (result.affectedRows === 0) {
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
        message: "Gallery item deleted successfully",
        data: { id: itemId },
      };
    } catch (error) {
      throw new Error(`Error deleting gallery item: ${error.message}`);
    }
  }
}

module.exports = GalleryService;
