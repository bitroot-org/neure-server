const db = require('../../../config/db');

const getResourcesService = async (payload) => {
  try {
    console.log('Payload in getResourcesService::>>', payload);
    const { therapist_id, scope, type, category, q, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const conds = ["(pr.therapist_id = ? OR pr.scope = 'catalogue') AND pr.is_deleted = 0"];
    const vals = [therapist_id];

    if (scope === 'mine') {
      conds.length = 0;
      conds.push("pr.therapist_id = ? AND pr.scope = 'mine' AND pr.is_deleted = 0");
      vals.length = 0;
      vals.push(therapist_id);
    } else if (scope === 'catalogue') {
      conds.length = 0;
      conds.push("pr.scope = 'catalogue' AND pr.is_deleted = 0");
      vals.length = 0;
    }

    if (type) { conds.push('pr.type = ?'); vals.push(type); }
    if (category) { conds.push('pr.category = ?'); vals.push(category); }
    if (q) { conds.push('pr.title LIKE ?'); vals.push(`%${q}%`); }

    const where = conds.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_resources pr WHERE ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT * FROM prodesk_resources pr WHERE ${where} ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Resources fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getResourcesService::>>', error);
    return null;
  }
};

const getResourceCategoriesService = async (payload) => {
  try {
    console.log('Payload in getResourceCategoriesService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT DISTINCT category FROM prodesk_resources
       WHERE (therapist_id = ? OR scope = 'catalogue') AND is_deleted = 0 AND category IS NOT NULL
       ORDER BY category ASC`,
      [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Categories fetched',
      data: rows ? rows.map(r => r.category) : []
    };
  } catch (error) {
    console.log('Error in getResourceCategoriesService::>>', error);
    return null;
  }
};

const uploadResourceService = async (payload) => {
  try {
    console.log('Payload in uploadResourceService::>>', payload);
    const { therapist_id, title, type, category, file_url, size_bytes } = payload;

    if (!title || !type || !file_url) {
      return { status: false, code: 400, message: 'title, type and file_url are required', data: null };
    }

    const [result] = await db.query(
      `INSERT INTO prodesk_resources (therapist_id, title, type, category, scope, owner, file_url, size_bytes)
       VALUES (?, ?, ?, ?, 'mine', 'therapist', ?, ?)`,
      [therapist_id, title, type, category || null, file_url, size_bytes || null]
    );

    const [rows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [result.insertId]);
    return { status: true, code: 201, message: 'Resource uploaded', data: rows[0] };
  } catch (error) {
    console.log('Error in uploadResourceService::>>', error);
    return null;
  }
};

const updateResourceService = async (payload) => {
  try {
    console.log('Payload in updateResourceService::>>', payload);
    const { therapist_id, resource_id, title, category } = payload;

    const [check] = await db.query(
      'SELECT id, scope FROM prodesk_resources WHERE id = ? AND therapist_id = ?',
      [resource_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Resource not found', data: null };
    }
    if (check[0].scope === 'catalogue') {
      return { status: false, code: 403, message: 'Cannot edit catalogue resources', data: null };
    }

    const fields = []; const vals = [];
    if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
    if (category !== undefined) { fields.push('category = ?'); vals.push(category); }
    if (!fields.length) {
      return { status: false, code: 400, message: 'No fields to update', data: null };
    }

    vals.push(resource_id);
    await db.query(`UPDATE prodesk_resources SET ${fields.join(', ')} WHERE id = ?`, vals);

    const [rows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [resource_id]);
    return { status: true, code: 200, message: 'Resource updated', data: rows[0] };
  } catch (error) {
    console.log('Error in updateResourceService::>>', error);
    return null;
  }
};

const deleteResourceService = async (payload) => {
  try {
    console.log('Payload in deleteResourceService::>>', payload);
    const { therapist_id, resource_id } = payload;

    const [check] = await db.query(
      'SELECT id, scope FROM prodesk_resources WHERE id = ? AND therapist_id = ?',
      [resource_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Resource not found', data: null };
    }
    if (check[0].scope === 'catalogue') {
      return { status: false, code: 403, message: 'Cannot delete catalogue resources', data: null };
    }

    await db.query('UPDATE prodesk_resources SET is_deleted = 1 WHERE id = ?', [resource_id]);
    return { status: true, code: 200, message: 'Resource deleted', data: null };
  } catch (error) {
    console.log('Error in deleteResourceService::>>', error);
    return null;
  }
};

const saveResourceToLibraryService = async (payload) => {
  try {
    console.log('Payload in saveResourceToLibraryService::>>', payload);
    const { therapist_id, resource_id } = payload;

    const [rows] = await db.query(
      "SELECT * FROM prodesk_resources WHERE id = ? AND scope = 'catalogue'",
      [resource_id]
    );
    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Catalogue resource not found', data: null };
    }

    const src = rows[0];
    const [result] = await db.query(
      `INSERT INTO prodesk_resources (therapist_id, title, type, category, scope, owner, file_url, size_bytes)
       VALUES (?, ?, ?, ?, 'mine', 'therapist', ?, ?)`,
      [therapist_id, src.title, src.type, src.category, src.file_url, src.size_bytes]
    );

    const [newRows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [result.insertId]);
    return { status: true, code: 201, message: 'Saved to library', data: newRows[0] };
  } catch (error) {
    console.log('Error in saveResourceToLibraryService::>>', error);
    return null;
  }
};

module.exports = {
  getResourcesService,
  getResourceCategoriesService,
  uploadResourceService,
  updateResourceService,
  deleteResourceService,
  saveResourceToLibraryService
};
