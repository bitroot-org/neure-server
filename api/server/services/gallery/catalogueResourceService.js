const db = require('../../../config/db');

const getCatalogueResourcesService = async ({ page = 1, limit = 20, type, q }) => {
  try {
    const offset = (page - 1) * limit;
    const conds = ["scope = 'catalogue' AND is_deleted = 0"];
    const vals = [];

    if (type) { conds.push('type = ?'); vals.push(type); }
    if (q)    { conds.push('title LIKE ?'); vals.push(`%${q}%`); }

    const where = conds.join(' AND ');

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_resources WHERE ${where}`, vals
    );

    const [rows] = await db.query(
      `SELECT * FROM prodesk_resources WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Catalogue resources fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.error('getCatalogueResourcesService error:', error);
    return null;
  }
};

const uploadCatalogueResourceService = async ({ title, type, category, file_url, size_bytes }) => {
  try {
    if (!title || !type || !file_url) {
      return { status: false, code: 400, message: 'title, type and file_url are required', data: null };
    }

    const validTypes = ['PDF', 'Worksheet', 'Audio'];
    if (!validTypes.includes(type)) {
      return { status: false, code: 400, message: 'type must be PDF, Worksheet, or Audio', data: null };
    }

    const [result] = await db.query(
      `INSERT INTO prodesk_resources (therapist_id, title, type, category, scope, owner, file_url, size_bytes)
       VALUES (NULL, ?, ?, ?, 'catalogue', 'neure', ?, ?)`,
      [title, type, category || null, file_url, size_bytes || null]
    );

    const [rows] = await db.query('SELECT * FROM prodesk_resources WHERE id = ?', [result.insertId]);
    return { status: true, code: 201, message: 'Catalogue resource uploaded', data: rows[0] };
  } catch (error) {
    console.error('uploadCatalogueResourceService error:', error);
    return null;
  }
};

const deleteCatalogueResourceService = async ({ resource_id }) => {
  try {
    const [check] = await db.query(
      "SELECT id FROM prodesk_resources WHERE id = ? AND scope = 'catalogue' AND is_deleted = 0",
      [resource_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Catalogue resource not found', data: null };
    }

    await db.query('UPDATE prodesk_resources SET is_deleted = 1 WHERE id = ?', [resource_id]);
    return { status: true, code: 200, message: 'Catalogue resource deleted', data: null };
  } catch (error) {
    console.error('deleteCatalogueResourceService error:', error);
    return null;
  }
};

module.exports = {
  getCatalogueResourcesService,
  uploadCatalogueResourceService,
  deleteCatalogueResourceService
};
