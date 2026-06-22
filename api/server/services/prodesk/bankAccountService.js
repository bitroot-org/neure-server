const db    = require('../../../config/db');
const axios = require('axios');

const COOLDOWN_HOURS = 24;

// Mask account number — show only last 4 digits
const maskAccount = (num) => num ? `${'•'.repeat(Math.max(0, num.length - 4))}${num.slice(-4)}` : '';

// ─── Therapist-facing ─────────────────────────────────────────────────────────

const getBankAccountService = async ({ therapist_id }) => {
  try {
    const [[row]] = await db.query(
      'SELECT * FROM therapist_bank_accounts WHERE therapist_id = ?',
      [therapist_id]
    );
    if (!row) return { status: true, code: 200, message: 'No bank account found', data: null };

    const hoursElapsed = row.last_edited_at
      ? (Date.now() - new Date(row.last_edited_at).getTime()) / 36e5
      : null;
    const canEditAt = row.last_edited_at
      ? new Date(new Date(row.last_edited_at).getTime() + COOLDOWN_HOURS * 36e5)
      : null;

    return {
      status: true, code: 200, message: 'Bank account fetched',
      data: {
        id:               row.id,
        account_holder:   row.account_holder,
        account_number:   maskAccount(row.account_number),
        ifsc_code:        row.ifsc_code,
        bank_name:        row.bank_name,
        branch_name:      row.branch_name,
        account_type:     row.account_type,
        last_edited_at:   row.last_edited_at,
        can_edit:         !row.last_edited_at || hoursElapsed >= COOLDOWN_HOURS,
        can_edit_at:      canEditAt,
        created_at:       row.created_at,
      }
    };
  } catch (error) {
    console.log('Error in getBankAccountService::>>', error);
    return null;
  }
};

const createBankAccountService = async ({ therapist_id, account_holder, account_number, ifsc_code, bank_name, branch_name, account_type = 'savings', user_id, ip, user_agent }) => {
  try {
    if (!account_holder || !account_number || !ifsc_code) {
      return { status: false, code: 400, message: 'account_holder, account_number and ifsc_code are required', data: null };
    }

    const [[existing]] = await db.query(
      'SELECT id FROM therapist_bank_accounts WHERE therapist_id = ?', [therapist_id]
    );
    if (existing) return { status: false, code: 409, message: 'Bank account already exists. Use update instead.', data: null };

    await db.query(
      `INSERT INTO therapist_bank_accounts
         (therapist_id, account_holder, account_number, ifsc_code, bank_name, branch_name, account_type, last_edited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [therapist_id, account_holder.trim(), account_number.trim(), ifsc_code.trim().toUpperCase(), bank_name || null, branch_name || null, account_type]
    );

    // Audit log
    await db.query(
      `INSERT INTO therapist_bank_account_logs (therapist_id, action, old_data, new_data, changed_by_user, ip_address, user_agent)
       VALUES (?, 'created', NULL, ?, ?, ?, ?)`,
      [therapist_id, JSON.stringify({ account_holder, ifsc_code, bank_name, branch_name, account_type }), user_id || null, ip || null, user_agent || null]
    );

    return getBankAccountService({ therapist_id });
  } catch (error) {
    console.log('Error in createBankAccountService::>>', error);
    return null;
  }
};

const updateBankAccountService = async ({ therapist_id, account_holder, account_number, ifsc_code, bank_name, branch_name, account_type, user_id, ip, user_agent }) => {
  try {
    const [[existing]] = await db.query(
      'SELECT * FROM therapist_bank_accounts WHERE therapist_id = ?', [therapist_id]
    );
    if (!existing) return { status: false, code: 404, message: 'No bank account found. Create one first.', data: null };

    // 24-hour cooldown check
    if (existing.last_edited_at) {
      const hoursElapsed = (Date.now() - new Date(existing.last_edited_at).getTime()) / 36e5;
      if (hoursElapsed < COOLDOWN_HOURS) {
        const canEditAt = new Date(new Date(existing.last_edited_at).getTime() + COOLDOWN_HOURS * 36e5);
        return {
          status: false, code: 429,
          message: `Bank account can only be edited once every ${COOLDOWN_HOURS} hours.`,
          data: { can_edit_at: canEditAt }
        };
      }
    }

    const updates = {};
    if (account_holder) updates.account_holder = account_holder.trim();
    if (account_number) updates.account_number = account_number.trim();
    if (ifsc_code)      updates.ifsc_code      = ifsc_code.trim().toUpperCase();
    if (bank_name)      updates.bank_name      = bank_name;
    if (branch_name)    updates.branch_name    = branch_name;
    if (account_type)   updates.account_type   = account_type;
    updates.last_edited_at = new Date();

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const vals   = [...Object.values(updates), therapist_id];

    await db.query(`UPDATE therapist_bank_accounts SET ${fields} WHERE therapist_id = ?`, vals);

    // Audit log — store old data (masked)
    const oldData = {
      account_holder: existing.account_holder,
      account_number: maskAccount(existing.account_number),
      ifsc_code:      existing.ifsc_code,
      bank_name:      existing.bank_name,
      account_type:   existing.account_type,
    };
    const newData = { account_holder: updates.account_holder || existing.account_holder, ifsc_code: updates.ifsc_code || existing.ifsc_code, bank_name: updates.bank_name ?? existing.bank_name, account_type: updates.account_type || existing.account_type };

    await db.query(
      `INSERT INTO therapist_bank_account_logs (therapist_id, action, old_data, new_data, changed_by_user, ip_address, user_agent)
       VALUES (?, 'updated', ?, ?, ?, ?, ?)`,
      [therapist_id, JSON.stringify(oldData), JSON.stringify(newData), user_id || null, ip || null, user_agent || null]
    );

    return getBankAccountService({ therapist_id });
  } catch (error) {
    console.log('Error in updateBankAccountService::>>', error);
    return null;
  }
};

const deleteBankAccountService = async ({ therapist_id, user_id, ip, user_agent }) => {
  try {
    const [[existing]] = await db.query(
      'SELECT * FROM therapist_bank_accounts WHERE therapist_id = ?', [therapist_id]
    );
    if (!existing) return { status: false, code: 404, message: 'No bank account found', data: null };

    await db.query('DELETE FROM therapist_bank_accounts WHERE therapist_id = ?', [therapist_id]);

    await db.query(
      `INSERT INTO therapist_bank_account_logs (therapist_id, action, old_data, new_data, changed_by_user, ip_address, user_agent)
       VALUES (?, 'deleted', ?, NULL, ?, ?, ?)`,
      [
        therapist_id,
        JSON.stringify({ account_holder: existing.account_holder, ifsc_code: existing.ifsc_code, account_number: maskAccount(existing.account_number) }),
        user_id || null, ip || null, user_agent || null
      ]
    );

    return { status: true, code: 200, message: 'Bank account deleted', data: null };
  } catch (error) {
    console.log('Error in deleteBankAccountService::>>', error);
    return null;
  }
};

const verifyIFSCService = async ({ ifsc_code }) => {
  try {
    if (!ifsc_code) return { status: false, code: 400, message: 'ifsc_code is required', data: null };
    const code = ifsc_code.trim().toUpperCase();
    const response = await axios.get(`https://ifsc.razorpay.com/${code}`, { timeout: 5000 });
    const d = response.data;
    return {
      status: true, code: 200, message: 'IFSC verified',
      data: {
        ifsc:     d.IFSC,
        bank:     d.BANK,
        branch:   d.BRANCH,
        address:  d.ADDRESS,
        city:     d.CITY,
        district: d.DISTRICT,
        state:    d.STATE,
      }
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { status: false, code: 404, message: 'Invalid IFSC code — not found in Razorpay database', data: null };
    }
    console.log('Error in verifyIFSCService::>>', error.message);
    return { status: false, code: 500, message: 'Could not verify IFSC at this time', data: null };
  }
};

// ─── Admin-facing ─────────────────────────────────────────────────────────────

const adminGetAllBankAccountsService = async ({ page = 1, limit = 20, search = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const searchCond = search ? 'AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR tba.ifsc_code LIKE ?)' : '';
    const searchVals = search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [];

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM therapist_bank_accounts tba
       JOIN therapists t ON t.id = tba.therapist_id
       JOIN users u ON u.user_id = t.user_id
       WHERE 1=1 ${searchCond}`,
      searchVals
    );

    const [rows] = await db.query(
      `SELECT tba.id, tba.therapist_id, tba.account_holder,
              tba.account_number, tba.ifsc_code, tba.bank_name,
              tba.branch_name, tba.account_type, tba.last_edited_at,
              tba.created_at,
              CONCAT(u.first_name, ' ', u.last_name) AS therapist_name,
              u.email AS therapist_email
       FROM therapist_bank_accounts tba
       JOIN therapists t ON t.id = tba.therapist_id
       JOIN users u ON u.user_id = t.user_id
       WHERE 1=1 ${searchCond}
       ORDER BY tba.created_at DESC
       LIMIT ? OFFSET ?`,
      [...searchVals, limit, offset]
    );

    // Mask account numbers in list view
    const data = (rows || []).map(r => ({ ...r, account_number: maskAccount(r.account_number) }));

    return {
      status: true, code: 200, message: 'Bank accounts fetched',
      data,
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in adminGetAllBankAccountsService::>>', error);
    return null;
  }
};

const adminGetBankAccountByIdService = async ({ therapist_id }) => {
  try {
    const [[row]] = await db.query(
      `SELECT tba.*, CONCAT(u.first_name, ' ', u.last_name) AS therapist_name, u.email AS therapist_email
       FROM therapist_bank_accounts tba
       JOIN therapists t ON t.id = tba.therapist_id
       JOIN users u ON u.user_id = t.user_id
       WHERE tba.therapist_id = ?`,
      [therapist_id]
    );
    if (!row) return { status: false, code: 404, message: 'No bank account found for this therapist', data: null };

    // Admin gets full unmasked account number
    return { status: true, code: 200, message: 'Bank account fetched', data: row };
  } catch (error) {
    console.log('Error in adminGetBankAccountByIdService::>>', error);
    return null;
  }
};

const adminGetBankAccountLogsService = async ({ therapist_id, page = 1, limit = 20 }) => {
  try {
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM therapist_bank_account_logs WHERE therapist_id = ?',
      [therapist_id]
    );

    const [rows] = await db.query(
      `SELECT l.*, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name, u.email AS changed_by_email
       FROM therapist_bank_account_logs l
       LEFT JOIN users u ON u.user_id = l.changed_by_user
       WHERE l.therapist_id = ?
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [therapist_id, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Audit logs fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in adminGetBankAccountLogsService::>>', error);
    return null;
  }
};

module.exports = {
  getBankAccountService,
  createBankAccountService,
  updateBankAccountService,
  deleteBankAccountService,
  verifyIFSCService,
  adminGetAllBankAccountsService,
  adminGetBankAccountByIdService,
  adminGetBankAccountLogsService,
};
