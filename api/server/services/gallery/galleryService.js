const db = require("../../../config/db");

class GalleryService {
  static async getGalleryItems(
    companyId,
    fileType,
    page = 1,
    limit = 10,
    showUnassigned = false,
    search_term = null
  ) {
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
      SELECT COUNT(DISTINCT g.id) as count
      FROM gallery g
      `;

      let itemsQuery = `
      SELECT DISTINCT
        g.id,
        g.title,
        g.description,
        g.file_type,
        g.file_url,
        g.size,
        g.tags,
        g.created_at
      FROM gallery g
      `;

      const queryParams = [];

      if (companyId) {
        if (showUnassigned) {
          // Show items NOT assigned to the company
          totalQuery += `
          LEFT JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
          AND cga.company_id = ?
          WHERE g.file_type = ?
          AND cga.gallery_item_id IS NULL
        `;
          itemsQuery += `
          LEFT JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
          AND cga.company_id = ?
          WHERE g.file_type = ?
          AND cga.gallery_item_id IS NULL
        `;
          queryParams.push(companyId, fileType);
        } else {
          // Show items assigned to the company
          totalQuery += `
          INNER JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
          WHERE g.file_type = ?
          AND cga.company_id = ?
        `;
          itemsQuery += `
          INNER JOIN company_gallery_assignments cga ON g.id = cga.gallery_item_id
          WHERE g.file_type = ?
          AND cga.company_id = ?
        `;
          queryParams.push(fileType, companyId);
        }
      } else {
        // Show all items
        totalQuery += `WHERE g.file_type = ?`;
        itemsQuery += `WHERE g.file_type = ?`;
        queryParams.push(fileType);
      }
      
      // Add search condition if search_term is provided
      if (search_term) {
        totalQuery += ` AND (g.title LIKE ? OR g.description LIKE ? OR g.tags LIKE ?)`;
        itemsQuery += ` AND (g.title LIKE ? OR g.description LIKE ? OR g.tags LIKE ?)`;
        const searchPattern = `%${search_term}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      // Get total count
      const [totalRows] = await db.query(totalQuery, queryParams);
      const total = totalRows[0].count;

      // Add pagination to items query
      itemsQuery += " ORDER BY g.created_at DESC LIMIT ? OFFSET ?";
      const paginationParams = [limit, offset];

      // Get paginated gallery items
      const [items] = await db.query(
        itemsQuery,
        [...queryParams, ...paginationParams]
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
        ? item[0].assigned_companies.split(",").map((id) => parseInt(id))
        : [];

      // Format the response
      const formattedItem = {
        ...item[0],
        assigned_companies: assignedCompanies,
        tags: item[0].tags ? JSON.parse(item[0].tags) : null,
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
      let query;
      let queryParams = [];

      if (companyId) {
        // If companyId is provided, get counts for that specific company
        query = `SELECT
          cga.item_type as file_type,
          COUNT(*) as count
        FROM company_gallery_assignments cga
        WHERE cga.company_id = ?
        GROUP BY cga.item_type`;
        queryParams = [companyId];
      } else {
        // If no companyId is provided, get total counts across all companies
        query = `SELECT
          cga.item_type as file_type,
          COUNT(*) as count
        FROM company_gallery_assignments cga
        GROUP BY cga.item_type`;
      }

      console.log("query  :  ", query);

      const [counts] = await db.query(query, queryParams);

      console.log("counts  :  ", counts);

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
          throw new Error(
            "Invalid tags format. Must be an array or a valid JSON string."
          );
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
        "DELETE FROM company_gallery_assignments WHERE gallery_item_id = ?",
        [itemId]
      );

      // Delete the gallery item
      const [result] = await db.query("DELETE FROM gallery WHERE id = ?", [
        itemId,
      ]);

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

  static async assignToCompany({ company_id, resource_ids, user_id }) {
    const connection = await db.getConnection();
    console.log("user_id : ", user_id);
    try {
      await connection.beginTransaction();

      // Check if user has admin role (role_id = 1)
      const [userRole] = await connection.query(
        "SELECT role_id FROM users WHERE user_id = ?",
        [user_id]
      );

      if (!userRole.length || userRole[0].role_id !== 1) {
        throw new Error(
          "Unauthorized: Only administrators can assign gallery items"
        );
      }

      // Verify company exists
      const [company] = await connection.query(
        "SELECT id FROM companies WHERE id = ?",
        [company_id]
      );

      if (!company.length) {
        throw new Error("Company not found");
      }

      // Verify all gallery items exist
      const [validItems] = await connection.query(
        "SELECT id, file_type FROM gallery WHERE id IN (?)",
        [resource_ids]
      );

      if (validItems.length !== resource_ids.length) {
        throw new Error("One or more gallery items not found");
      }

      // Remove existing assignments for these resources
      await connection.query(
        "DELETE FROM company_gallery_assignments WHERE company_id = ? AND gallery_item_id IN (?)",
        [company_id, resource_ids]
      );

      // Create new assignments
      const assignments = validItems.map((item) => [
        company_id,
        item.id,
        item.file_type,
        new Date(),
      ]);

      await connection.query(
        `INSERT INTO company_gallery_assignments
         (company_id, gallery_item_id, item_type, assigned_at)
         VALUES ?`,
        [assignments]
      );

      await connection.commit();

      return {
        status: true,
        code: 200,
        message: "Gallery items assigned successfully",
        data: {
          company_id,
          assigned_items: resource_ids,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error assigning gallery items: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = GalleryService;
