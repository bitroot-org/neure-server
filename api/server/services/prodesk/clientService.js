const bcrypt = require('bcrypt');
const db = require('../../../config/db');

const AVATAR_COLORS = ['#5EA89A', '#6E8FB5', '#8B7CB0', '#C89364', '#B87276', '#A87E6A'];

const avatarColor = (name) => {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getClientByIdService = async (payload) => {
  try {
    console.log('Payload in getClientByIdService::>>', payload);
    const { therapist_id, client_id } = payload;

    const [rows] = await db.query(
      `SELECT pc.*, u.first_name, u.last_name, u.email, u.phone,
              CONCAT(u.first_name, ' ', u.last_name) AS name,
              (SELECT COUNT(*) FROM prodesk_sessions ps WHERE ps.client_id = pc.id) AS sessions_count
       FROM prodesk_clients pc
       JOIN users u ON u.user_id = pc.user_id
       WHERE pc.id = ? AND pc.therapist_id = ?`,
      [client_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    return { status: true, code: 200, message: 'Client fetched', data: rows[0] };
  } catch (error) {
    console.log('Error in getClientByIdService::>>', error);
    return null;
  }
};

const createClientService = async (payload) => {
  try {
    console.log('Payload in createClientService::>>', payload);
    const { therapist_id, name, email, phone, age, gender, city, emergency_contact,
            start_date, presenting_concerns, issues, default_fee } = payload;

    if (!name) {
      return { status: false, code: 400, message: 'name is required', data: null };
    }

    // Normalise phone — strip all non-digits, keep country code if present
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (email) {
        // Check if email already exists as a client for this therapist
        const [dup] = await conn.query(
          `SELECT pc.id FROM prodesk_clients pc
           JOIN users u ON u.user_id = pc.user_id
           WHERE u.email = ? AND pc.therapist_id = ?`,
          [email, therapist_id]
        );
        if (dup && dup.length) {
          await conn.rollback();
          return { status: false, code: 409, message: 'Client with this email already exists', data: null };
        }

        // Check if email exists in users table under any role
        const [existingUser] = await conn.query(
          'SELECT user_id FROM users WHERE email = ?',
          [email]
        );
        if (existingUser && existingUser.length) {
          await conn.rollback();
          return { status: false, code: 409, message: 'A user with this email already exists in the system. Use a different email for this client.', data: null };
        }
      }

      const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const [userResult] = await conn.query(
        `INSERT INTO users (first_name, last_name, email, phone, password, role_id, gender)
         VALUES (?, ?, ?, ?, ?, 5, ?)`,
        [firstName, lastName, email || null, cleanPhone || null, tempPassword, gender || null]
      );

      const color = avatarColor(name);
      const [clientResult] = await conn.query(
        `INSERT INTO prodesk_clients
         (user_id, therapist_id, age, gender, city, emergency_contact, start_date,
          presenting_concerns, issues, default_fee, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userResult.insertId, therapist_id, age || null, gender || null,
          city || null, emergency_contact || null,
          start_date || new Date().toISOString().slice(0, 10),
          presenting_concerns || null,
          issues ? JSON.stringify(issues) : null,
          default_fee || 0, color
        ]
      );

      await conn.commit();
      return getClientByIdService({ therapist_id, client_id: clientResult.insertId });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in createClientService::>>', error);
    return null;
  }
};

const getClientsService = async (payload) => {
  try {
    console.log('Payload in getClientsService::>>', payload);
    const { therapist_id, page = 1, limit = 20, search = '', status = 'active' } = payload;

    const offset = (page - 1) * limit;
    const searchCond = search ? 'AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)' : '';
    const searchVals = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const statusCond = status ? 'AND pc.status = ?' : '';
    const statusVals = status ? [status] : [];

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_clients pc
       JOIN users u ON u.user_id = pc.user_id
       WHERE pc.therapist_id = ? ${statusCond} ${searchCond}`,
      [therapist_id, ...statusVals, ...searchVals]
    );

    const [rows] = await db.query(
      `SELECT pc.*, u.first_name, u.last_name, u.email, u.phone,
              CONCAT(u.first_name, ' ', u.last_name) AS name,
              (SELECT COUNT(*) FROM prodesk_sessions ps WHERE ps.client_id = pc.id) AS sessions_count,
              (SELECT ps2.starts_at FROM prodesk_sessions ps2
               WHERE ps2.client_id = pc.id AND ps2.status = 'scheduled'
               ORDER BY ps2.starts_at ASC LIMIT 1) AS next_session_at
       FROM prodesk_clients pc
       JOIN users u ON u.user_id = pc.user_id
       WHERE pc.therapist_id = ? ${statusCond} ${searchCond}
       ORDER BY pc.created_at DESC LIMIT ? OFFSET ?`,
      [therapist_id, ...statusVals, ...searchVals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Clients fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getClientsService::>>', error);
    return null;
  }
};

const updateClientService = async (payload) => {
  try {
    console.log('Payload in updateClientService::>>', payload);
    const { therapist_id, client_id, ...data } = payload;

    const [check] = await db.query(
      'SELECT user_id FROM prodesk_clients WHERE id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );

    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    const userId = check[0].user_id;

    const userMap = { first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone };
    const uFields = []; const uVals = [];
    for (const [k, v] of Object.entries(userMap)) {
      if (v !== undefined) { uFields.push(`${k} = ?`); uVals.push(v); }
    }
    if (uFields.length) {
      uVals.push(userId);
      await db.query(`UPDATE users SET ${uFields.join(', ')} WHERE user_id = ?`, uVals);
    }

    const clientMap = {
      age: data.age, gender: data.gender, city: data.city,
      emergency_contact: data.emergency_contact, start_date: data.start_date,
      presenting_concerns: data.presenting_concerns,
      issues: data.issues ? JSON.stringify(data.issues) : undefined,
      default_fee: data.default_fee, status: data.status
    };
    const cFields = []; const cVals = [];
    for (const [k, v] of Object.entries(clientMap)) {
      if (v !== undefined) { cFields.push(`${k} = ?`); cVals.push(v); }
    }
    if (cFields.length) {
      cVals.push(client_id);
      await db.query(`UPDATE prodesk_clients SET ${cFields.join(', ')} WHERE id = ?`, cVals);
    }

    return getClientByIdService({ therapist_id, client_id });
  } catch (error) {
    console.log('Error in updateClientService::>>', error);
    return null;
  }
};

const archiveClientService = async (payload) => {
  try {
    console.log('Payload in archiveClientService::>>', payload);
    const { therapist_id, client_id } = payload;

    const [rows] = await db.query(
      'SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    await db.query("UPDATE prodesk_clients SET status = 'archived' WHERE id = ?", [client_id]);
    return { status: true, code: 200, message: 'Client archived', data: null };
  } catch (error) {
    console.log('Error in archiveClientService::>>', error);
    return null;
  }
};

module.exports = {
  createClientService,
  getClientsService,
  getClientByIdService,
  updateClientService,
  archiveClientService
};
