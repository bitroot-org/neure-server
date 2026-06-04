const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../../../config/db');
const EmailService = require('../email/emailService');

const getTeamService = async (payload) => {
  try {
    console.log('Payload in getTeamService::>>', payload);
    const { therapist_id, q, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const searchCond = q ? 'AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)' : '';
    const searchVals = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u
       WHERE u.role_id = 6 AND u.is_active = 1 ${searchCond}`,
      searchVals
    );

    const [rows] = await db.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone,
              u.profile_url, u.job_title, u.created_at AS joined_at
       FROM users u
       WHERE u.role_id = 6 AND u.is_active = 1 ${searchCond}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...searchVals, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Team fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getTeamService::>>', error);
    return null;
  }
};

const inviteStaffService = async (payload) => {
  try {
    console.log('Payload in inviteStaffService::>>', payload);
    const { therapist_id, name, email, phone } = payload;

    if (!name || !email) {
      return { status: false, code: 400, message: 'name and email are required', data: null };
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing && existing.length) {
      return { status: false, code: 409, message: 'Email already exists', data: null };
    }

    const tempPassword = `${name.slice(0, 4)}@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashed = await bcrypt.hash(tempPassword, 10);
    const nameParts = name.trim().split(/\s+/);

    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role_id)
       VALUES (?, ?, ?, ?, ?, 6)`,
      [nameParts[0], nameParts.slice(1).join(' ') || '', email, phone || null, hashed]
    );

    try {
      await EmailService.sendEmail({
        to: email,
        subject: 'You have been invited to ProDesk',
        html: `<p>Hello ${nameParts[0]},</p>
               <p>You have been invited to join ProDesk.</p>
               <p>Your temporary password is: <strong>${tempPassword}</strong></p>
               <p>Please log in and change your password immediately.</p>`
      });
    } catch (e) {
      console.log('Invite email error::>>', e.message);
    }

    return {
      status: true, code: 201, message: 'Staff invited successfully',
      data: { user_id: result.insertId, email, temp_password: tempPassword }
    };
  } catch (error) {
    console.log('Error in inviteStaffService::>>', error);
    return null;
  }
};

const updateStaffService = async (payload) => {
  try {
    console.log('Payload in updateStaffService::>>', payload);
    const { therapist_id, staff_user_id, ...data } = payload;

    const [check] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ? AND role_id = 6',
      [staff_user_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Staff member not found', data: null };
    }

    const allowed = ['first_name', 'last_name', 'phone', 'job_title'];
    const fields = []; const vals = [];
    for (const f of allowed) {
      if (data[f] !== undefined) { fields.push(`${f} = ?`); vals.push(data[f]); }
    }
    if (!fields.length) {
      return { status: false, code: 400, message: 'No fields to update', data: null };
    }

    vals.push(staff_user_id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, vals);

    const [rows] = await db.query(
      'SELECT user_id, first_name, last_name, email, phone, job_title FROM users WHERE user_id = ?',
      [staff_user_id]
    );

    return { status: true, code: 200, message: 'Staff updated', data: rows[0] };
  } catch (error) {
    console.log('Error in updateStaffService::>>', error);
    return null;
  }
};

const removeStaffService = async (payload) => {
  try {
    console.log('Payload in removeStaffService::>>', payload);
    const { therapist_id, staff_user_id } = payload;

    const [check] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ? AND role_id = 6',
      [staff_user_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Staff member not found', data: null };
    }

    await db.query('UPDATE users SET is_active = 0 WHERE user_id = ?', [staff_user_id]);
    return { status: true, code: 200, message: 'Staff member removed', data: null };
  } catch (error) {
    console.log('Error in removeStaffService::>>', error);
    return null;
  }
};

module.exports = {
  getTeamService,
  inviteStaffService,
  updateStaffService,
  removeStaffService
};
