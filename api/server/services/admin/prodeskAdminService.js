const db = require('../../../config/db');

const getOverviewService = async () => {
  try {
    // Count from users/therapists directly — works even before subscription flow
    const [[activeRow]] = await db.query(
      `SELECT COUNT(*) AS active_users FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       WHERE u.role_id = 4 AND u.is_active = 1`
    );
    const [[discRow]] = await db.query(
      `SELECT COUNT(*) AS discontinued_users FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       WHERE u.role_id = 4 AND u.is_active = 0`
    );
    // Paid/Free from subscriptions (builds up as therapists subscribe)
    const [[paidRow]] = await db.query(
      `SELECT COUNT(*) AS total_paid_users FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.status = 'active' AND pp.plan_type != 'starter'`
    );
    const [[freeRow]] = await db.query(
      `SELECT COUNT(*) AS total_free_users FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE ps.status = 'active' AND pp.plan_type = 'starter'`
    );
    const [[sessRow]] = await db.query(`SELECT COUNT(*) AS total_sessions FROM prodesk_sessions`);
    const [[clientRow]] = await db.query(`SELECT COUNT(*) AS total_clients FROM prodesk_clients`);
    const [[invoiceRow]] = await db.query(
      `SELECT IFNULL(SUM(total),0) AS total_invoice_amount FROM prodesk_invoices WHERE status = 'paid'`
    );
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10);
    const qtrAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().slice(0, 10);
    const yrAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

    const revenueQuery = (from) => db.query(
      `SELECT IFNULL(SUM(amount),0) AS rev FROM prodesk_subscription_payments WHERE status='captured' AND paid_at >= ?`,
      [from]
    );
    const [[[wRev]], [[mRev]], [[qRev]], [[yRev]]] = await Promise.all([
      revenueQuery(weekAgo), revenueQuery(monthAgo), revenueQuery(qtrAgo), revenueQuery(yrAgo)
    ]);

    return {
      status: true, code: 200, message: 'Overview fetched',
      data: {
        active_users: activeRow.active_users,
        discontinued_users: discRow.discontinued_users,
        total_paid_users: paidRow.total_paid_users,
        total_free_users: freeRow.total_free_users,
        revenue: {
          weekly: parseFloat(wRev.rev),
          monthly: parseFloat(mRev.rev),
          quarterly: parseFloat(qRev.rev),
          annual: parseFloat(yRev.rev)
        },
        total_sessions: sessRow.total_sessions,
        total_clients: clientRow.total_clients,
        total_invoice_amount: parseFloat(invoiceRow.total_invoice_amount)
      }
    };
  } catch (error) {
    console.log('Error in getOverviewService::>>', error);
    return null;
  }
};

const getRevenueService = async ({ start_date, end_date }) => {
  try {
    if (!start_date || !end_date) {
      return { status: false, code: 400, message: 'start_date and end_date are required', data: null };
    }
    const [[totalRow]] = await db.query(
      `SELECT IFNULL(SUM(amount),0) AS total_revenue FROM prodesk_subscription_payments
       WHERE status = 'captured' AND paid_at BETWEEN ? AND ?`,
      [start_date, end_date + ' 23:59:59']
    );
    const [breakdown] = await db.query(
      `SELECT DATE_FORMAT(paid_at,'%Y-%m') AS month, IFNULL(SUM(amount),0) AS revenue
       FROM prodesk_subscription_payments
       WHERE status = 'captured' AND paid_at BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(paid_at,'%Y-%m') ORDER BY month`,
      [start_date, end_date + ' 23:59:59']
    );
    return {
      status: true, code: 200, message: 'Revenue fetched',
      data: { total_revenue: parseFloat(totalRow.total_revenue), breakdown }
    };
  } catch (error) {
    console.log('Error in getRevenueService::>>', error);
    return null;
  }
};

const getActiveUsersService = async ({ page = 1, limit = 20, search = '', plan_type = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE u.role_id = 4 AND u.is_active = 1`;
    if (plan_type) { where += ` AND pp.plan_type = ?`; params.push(plan_type); }
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id AND ps.status = 'active'
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, u.user_id, CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, u.phone,
              IFNULL(pp.name, 'No Plan') AS plan_name,
              IFNULL(pp.plan_type, 'none') AS plan_type,
              pp.access_type,
              ps.billing_cycle,
              ps.current_period_start AS activation_date,
              ps.current_period_end AS period_end,
              IFNULL(ps.status, 'no_subscription') AS status
       FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id AND ps.status = 'active'
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Active users fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getActiveUsersService::>>', error);
    return null;
  }
};

const getDiscontinuedUsersService = async ({ page = 1, limit = 20, search = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    // Discontinued = deactivated therapist account OR cancelled/expired subscription
    let where = `WHERE (u.is_active = 0 OR ps.status IN ('cancelled','expired'))`;
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE u.role_id = 4 AND (u.is_active = 0 OR ps.status IN ('cancelled','expired'))
       ${search ? `AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)` : ''}`,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, u.phone, IFNULL(pp.name,'No Plan') AS plan_name,
              pp.plan_type, ps.billing_cycle,
              ps.current_period_start AS activation_date,
              ps.updated_at AS cancelled_on,
              IFNULL(ps.status, 'deactivated') AS status
       FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE u.role_id = 4 AND (u.is_active = 0 OR ps.status IN ('cancelled','expired'))
       ${search ? `AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)` : ''}
       ORDER BY u.updated_at DESC LIMIT ? OFFSET ?`,
      [...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []), parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Discontinued users fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getDiscontinuedUsersService::>>', error);
    return null;
  }
};

const getTherapistsService = async ({ page = 1, limit = 20, search = '', plan_type = '', subscription_status = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE u.role_id = 4`;
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (plan_type) { where += ` AND pp.plan_type = ?`; params.push(plan_type); }
    if (subscription_status) { where += ` AND ps.status = ?`; params.push(subscription_status); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, u.user_id, CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, u.phone, u.profile_url, u.is_active, u.created_at, t.booking_slug,
              pp.name AS plan_name, pp.plan_type, pp.access_type,
              ps.billing_cycle, ps.status AS subscription_status,
              ps.current_period_end AS period_end
       FROM users u
       JOIN therapists t ON u.user_id = t.user_id
       LEFT JOIN prodesk_subscriptions ps ON t.id = ps.therapist_id
       LEFT JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const data = rows.map(r => ({
      therapist_id: r.therapist_id, user_id: r.user_id, name: r.name,
      email: r.email, phone: r.phone, profile_url: r.profile_url,
      is_active: r.is_active, created_at: r.created_at, booking_slug: r.booking_slug,
      subscription: r.plan_name ? {
        plan_name: r.plan_name, plan_type: r.plan_type, access_type: r.access_type,
        billing_cycle: r.billing_cycle, status: r.subscription_status, period_end: r.period_end
      } : null
    }));
    return { status: true, code: 200, message: 'Therapists fetched', data, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getTherapistsService::>>', error);
    return null;
  }
};

const getFeedbackService = async ({ page = 1, limit = 20, search = '', status = '', start_date = '', end_date = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (status) { where += ` AND pf.status = ?`; params.push(status); }
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR pf.subject LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (start_date) { where += ` AND DATE(pf.created_at) >= ?`; params.push(start_date); }
    if (end_date) { where += ` AND DATE(pf.created_at) <= ?`; params.push(end_date); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_feedback pf
       JOIN therapists t ON pf.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT pf.id, pf.therapist_id, CONCAT(u.first_name,' ',u.last_name) AS therapist_name,
              u.email AS therapist_email, pf.subject, pf.message, pf.rating,
              pf.status, pf.admin_notes, pf.created_at
       FROM prodesk_feedback pf
       JOIN therapists t ON pf.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id ${where}
       ORDER BY pf.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Feedback fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getFeedbackService::>>', error);
    return null;
  }
};

const updateFeedbackStatusService = async ({ feedback_id, status, admin_notes }) => {
  try {
    if (!feedback_id || !status) return { status: false, code: 400, message: 'feedback_id and status are required', data: null };
    const allowed = ['new', 'reviewed', 'resolved'];
    if (!allowed.includes(status)) return { status: false, code: 400, message: 'Invalid status', data: null };
    await db.query(
      `UPDATE prodesk_feedback SET status = ?, admin_notes = ? WHERE id = ?`,
      [status, admin_notes || null, feedback_id]
    );
    return { status: true, code: 200, message: 'Feedback status updated', data: null };
  } catch (error) {
    console.log('Error in updateFeedbackStatusService::>>', error);
    return null;
  }
};

const getDeactivatedAccountsService = async ({ page = 1, limit = 20, search = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE ps.status IN ('cancelled','expired')`;
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_subscriptions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, u.phone, pp.name AS plan_name, ps.billing_cycle,
              IFNULL(psp.amount, 0) AS amount_paid,
              ps.current_period_start AS activation_date, ps.updated_at AS deactivated_on, ps.status
       FROM prodesk_subscriptions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_subscription_payments psp ON ps.latest_payment_id = psp.id ${where}
       ORDER BY ps.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Deactivated accounts fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getDeactivatedAccountsService::>>', error);
    return null;
  }
};

const createOfferTagService = async ({ name, description }) => {
  try {
    if (!name) return { status: false, code: 400, message: 'name is required', data: null };
    const [result] = await db.query(`INSERT INTO prodesk_offer_tags (name, description) VALUES (?,?)`, [name.toLowerCase().trim(), description || null]);
    return { status: true, code: 201, message: 'Tag created', data: { tag_id: result.insertId } };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return { status: false, code: 409, message: 'Tag name already exists', data: null };
    console.log('Error in createOfferTagService::>>', error);
    return null;
  }
};

const getOfferTagsService = async () => {
  try {
    const [rows] = await db.query(`SELECT id, name, description, created_at FROM prodesk_offer_tags ORDER BY id`);
    return { status: true, code: 200, message: 'Tags fetched', data: rows };
  } catch (error) {
    console.log('Error in getOfferTagsService::>>', error);
    return null;
  }
};

const createOfferService = async (payload) => {
  try {
    const { code, name, description, tag_id, is_percent = 0, percent_discount = null,
      is_email_restricted = 0, valid_from, valid_till, max_uses_per_email = 1,
      total_max_uses = null, admin_id } = payload;
    if (!code || !name || !tag_id || !valid_from || !valid_till) {
      return { status: false, code: 400, message: 'code, name, tag_id, valid_from, valid_till are required', data: null };
    }
    if (is_percent && !percent_discount) {
      return { status: false, code: 400, message: 'percent_discount is required when is_percent = 1', data: null };
    }
    const [result] = await db.query(
      `INSERT INTO prodesk_offers (code, name, description, tag_id, is_percent, percent_discount,
        is_email_restricted, valid_from, valid_till, max_uses_per_email, total_max_uses, created_by_admin_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code.toUpperCase().trim(), name, description || null, tag_id, is_percent ? 1 : 0,
       percent_discount || null, is_email_restricted ? 1 : 0, valid_from, valid_till,
       max_uses_per_email, total_max_uses || null, admin_id || null]
    );
    return { status: true, code: 201, message: 'Offer created', data: { offer_id: result.insertId } };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return { status: false, code: 409, message: 'Offer code already exists', data: null };
    console.log('Error in createOfferService::>>', error);
    return null;
  }
};

const uploadOfferEmailsService = async ({ offer_id, emails }) => {
  try {
    if (!offer_id || !emails || !emails.length) {
      return { status: false, code: 400, message: 'offer_id and emails are required', data: null };
    }
    const [offerRows] = await db.query(`SELECT id FROM prodesk_offers WHERE id = ?`, [offer_id]);
    if (!offerRows.length) return { status: false, code: 404, message: 'Offer not found', data: null };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = [];
    const valid = [];
    emails.forEach(e => {
      const trimmed = e.trim().toLowerCase();
      if (!trimmed) return;
      if (!emailRegex.test(trimmed)) { invalid.push(trimmed); return; }
      valid.push(trimmed);
    });

    if (!valid.length) return { status: false, code: 400, message: 'No valid emails provided', data: { invalid_emails: invalid } };

    let inserted = 0;
    let skipped = 0;
    for (const email of valid) {
      try {
        await db.query(`INSERT INTO prodesk_offer_emails (offer_id, email) VALUES (?,?)`, [offer_id, email]);
        inserted++;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') { skipped++; } else { throw e; }
      }
    }
    return { status: true, code: 200, message: 'Emails uploaded', data: { inserted, skipped_duplicates: skipped, invalid_emails: invalid } };
  } catch (error) {
    console.log('Error in uploadOfferEmailsService::>>', error);
    return null;
  }
};

const getOffersService = async ({ page = 1, limit = 20, search = '', tag_id = null, is_active = null }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (tag_id) { where += ` AND po.tag_id = ?`; params.push(tag_id); }
    if (is_active !== null && is_active !== '') { where += ` AND po.is_active = ?`; params.push(is_active); }
    if (search) { where += ` AND (po.code LIKE ? OR po.name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_offers po
       JOIN prodesk_offer_tags pt ON po.tag_id = pt.id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT po.id, po.code, po.name, pt.name AS tag_name, po.is_percent, po.percent_discount,
              po.is_email_restricted, po.valid_from, po.valid_till, po.total_used,
              po.is_active, po.created_at,
              (SELECT COUNT(*) FROM prodesk_offer_emails poe WHERE poe.offer_id = po.id) AS total_emails_whitelisted
       FROM prodesk_offers po
       JOIN prodesk_offer_tags pt ON po.tag_id = pt.id ${where}
       ORDER BY po.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Offers fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getOffersService::>>', error);
    return null;
  }
};

const getOfferDetailService = async ({ offer_id }) => {
  try {
    if (!offer_id) return { status: false, code: 400, message: 'offer_id is required', data: null };
    const [[offer]] = await db.query(
      `SELECT po.*, pt.name AS tag_name FROM prodesk_offers po
       JOIN prodesk_offer_tags pt ON po.tag_id = pt.id WHERE po.id = ?`, [offer_id]
    );
    if (!offer) return { status: false, code: 404, message: 'Offer not found', data: null };
    const [emails] = await db.query(
      `SELECT email, is_used, used_at, used_by_therapist_id FROM prodesk_offer_emails WHERE offer_id = ? ORDER BY is_used DESC, email`,
      [offer_id]
    );
    return { status: true, code: 200, message: 'Offer detail fetched', data: { ...offer, emails } };
  } catch (error) {
    console.log('Error in getOfferDetailService::>>', error);
    return null;
  }
};

const updateOfferService = async ({ offer_id, name, valid_till, is_active }) => {
  try {
    if (!offer_id) return { status: false, code: 400, message: 'offer_id is required', data: null };
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (valid_till !== undefined) { fields.push('valid_till = ?'); params.push(valid_till); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (!fields.length) return { status: false, code: 400, message: 'No fields to update', data: null };
    params.push(offer_id);
    await db.query(`UPDATE prodesk_offers SET ${fields.join(', ')} WHERE id = ?`, params);
    return { status: true, code: 200, message: 'Offer updated', data: null };
  } catch (error) {
    console.log('Error in updateOfferService::>>', error);
    return null;
  }
};

const getReferralsService = async ({ page = 1, limit = 20, search = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(DISTINCT t.id) AS total FROM therapists t
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_referral_wallet prw ON t.id = prw.therapist_id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, CONCAT(u.first_name,' ',u.last_name) AS name, u.email,
              t.referral_code,
              (SELECT COUNT(*) FROM prodesk_referrals pr WHERE pr.referrer_therapist_id = t.id) AS referred_count,
              prw.total_earned, prw.pending_balance, prw.total_paid,
              (SELECT prp.paid_on FROM prodesk_referral_payouts prp WHERE prp.therapist_id = t.id ORDER BY prp.created_at DESC LIMIT 1) AS last_disbursement_date,
              (SELECT prp.status FROM prodesk_referral_payouts prp WHERE prp.therapist_id = t.id ORDER BY prp.created_at DESC LIMIT 1) AS last_disbursement_status
       FROM therapists t
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_referral_wallet prw ON t.id = prw.therapist_id ${where}
       ORDER BY prw.total_earned DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Referrals fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getReferralsService::>>', error);
    return null;
  }
};

const getReferralDetailService = async ({ therapist_id }) => {
  try {
    if (!therapist_id) return { status: false, code: 400, message: 'therapist_id is required', data: null };
    const [[therapist]] = await db.query(
      `SELECT t.id, t.referral_code, CONCAT(u.first_name,' ',u.last_name) AS name, u.email
       FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`, [therapist_id]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };
    const [[wallet]] = await db.query(`SELECT * FROM prodesk_referral_wallet WHERE therapist_id = ?`, [therapist_id]);
    const [referrals] = await db.query(
      `SELECT CONCAT(u.first_name,' ',u.last_name) AS referred_name, u.email AS referred_email,
              pr.status, pr.reward_amount, pr.converted_at
       FROM prodesk_referrals pr
       JOIN therapists t ON pr.referred_therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       WHERE pr.referrer_therapist_id = ? ORDER BY pr.created_at DESC`, [therapist_id]
    );
    const [payouts] = await db.query(
      `SELECT amount, status, payout_month, paid_on, bank_transfer_ref
       FROM prodesk_referral_payouts WHERE therapist_id = ? ORDER BY created_at DESC`, [therapist_id]
    );
    const [ledger] = await db.query(
      `SELECT type, amount, description, balance_after, created_at
       FROM prodesk_referral_wallet_ledger WHERE therapist_id = ? ORDER BY created_at DESC`, [therapist_id]
    );
    return {
      status: true, code: 200, message: 'Referral detail fetched',
      data: { therapist_id: therapist.id, name: therapist.name, referral_code: therapist.referral_code, wallet: wallet || null, referrals, payouts, ledger }
    };
  } catch (error) {
    console.log('Error in getReferralDetailService::>>', error);
    return null;
  }
};

const getPendingPayoutsService = async () => {
  try {
    const [rows] = await db.query(
      `SELECT t.id AS therapist_id, CONCAT(u.first_name,' ',u.last_name) AS name, u.email,
              prw.pending_balance
       FROM prodesk_referral_wallet prw
       JOIN therapists t ON prw.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       WHERE prw.pending_balance > 0 ORDER BY prw.pending_balance DESC`
    );
    return { status: true, code: 200, message: 'Pending payouts fetched', data: rows, meta: { total: rows.length } };
  } catch (error) {
    console.log('Error in getPendingPayoutsService::>>', error);
    return null;
  }
};

const processPayoutService = async ({ therapist_ids, payout_month, bank_transfer_refs = {} }) => {
  try {
    if (!therapist_ids || !therapist_ids.length || !payout_month) {
      return { status: false, code: 400, message: 'therapist_ids and payout_month are required', data: null };
    }
    const conn = await db.getConnection();
    let processed = 0;
    let total_disbursed = 0;
    try {
      await conn.beginTransaction();
      for (const tid of therapist_ids) {
        const [[wallet]] = await conn.query(
          `SELECT pending_balance FROM prodesk_referral_wallet WHERE therapist_id = ? FOR UPDATE`, [tid]
        );
        if (!wallet || wallet.pending_balance <= 0) continue;
        const amount = parseFloat(wallet.pending_balance);
        const ref = bank_transfer_refs[tid] || null;
        await conn.query(
          `UPDATE prodesk_referral_wallet SET total_paid = total_paid + ?, pending_balance = 0, balance = 0 WHERE therapist_id = ?`,
          [amount, tid]
        );
        const [[updatedWallet]] = await conn.query(`SELECT (total_earned - total_paid) AS balance_after FROM prodesk_referral_wallet WHERE therapist_id = ?`, [tid]);
        const [payoutResult] = await conn.query(
          `INSERT INTO prodesk_referral_payouts (therapist_id, amount, status, payout_month, bank_transfer_ref, paid_on)
           VALUES (?,?,'paid',?,?,CURDATE())`,
          [tid, amount, payout_month, ref]
        );
        await conn.query(
          `INSERT INTO prodesk_referral_wallet_ledger (therapist_id, type, amount, description, reference_id, reference_type, balance_after)
           VALUES (?,'debit',?,?,?,'payout',?)`,
          [tid, amount, `Payout — ${payout_month}`, payoutResult.insertId, updatedWallet.balance_after || 0]
        );
        processed++;
        total_disbursed += amount;
      }
      await conn.commit();
      return { status: true, code: 200, message: 'Payouts processed', data: { processed, total_disbursed, payout_month } };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in processPayoutService::>>', error);
    return null;
  }
};

const getSessionsAdminService = async ({ page = 1, limit = 20, therapist_id = null, start_date = '', end_date = '', status = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (therapist_id) { where += ` AND ps.therapist_id = ?`; params.push(therapist_id); }
    if (status) { where += ` AND ps.status = ?`; params.push(status); }
    if (start_date) { where += ` AND DATE(ps.starts_at) >= ?`; params.push(start_date); }
    if (end_date) { where += ` AND DATE(ps.starts_at) <= ?`; params.push(end_date); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_sessions ps ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT ps.id AS session_id, ps.therapist_id,
              CONCAT(tu.first_name,' ',tu.last_name) AS therapist_name,
              CONCAT(cu.first_name,' ',cu.last_name) AS client_name,
              ps.session_number, ps.starts_at, ps.duration_min, ps.modality,
              ps.status, ps.fee,
              CASE WHEN psn.id IS NOT NULL THEN 1 ELSE 0 END AS has_note,
              psn.preview AS note_preview
       FROM prodesk_sessions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users tu ON t.user_id = tu.user_id
       JOIN prodesk_clients pc ON ps.client_id = pc.id
       JOIN users cu ON pc.user_id = cu.user_id
       LEFT JOIN prodesk_session_notes psn ON ps.id = psn.session_id ${where}
       ORDER BY ps.starts_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Sessions fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getSessionsAdminService::>>', error);
    return null;
  }
};

const getSubscriptionsAdminService = async ({ page = 1, limit = 20, search = '', plan_type = '', status = '', billing_cycle = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (plan_type) { where += ` AND pp.plan_type = ?`; params.push(plan_type); }
    if (status) { where += ` AND ps.status = ?`; params.push(status); }
    if (billing_cycle) { where += ` AND ps.billing_cycle = ?`; params.push(billing_cycle); }
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_subscriptions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT ps.id AS subscription_id, ps.therapist_id, CONCAT(u.first_name,' ',u.last_name) AS therapist_name,
              u.email, pp.name AS plan_name, pp.plan_type, pp.access_type, ps.billing_cycle,
              ps.status, psp.amount AS amount_paid, ps.current_period_start AS period_start,
              ps.current_period_end AS period_end, po.code AS offer_code, ps.created_at
       FROM prodesk_subscriptions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_subscription_payments psp ON ps.latest_payment_id = psp.id
       LEFT JOIN prodesk_offers po ON ps.offer_id = po.id ${where}
       ORDER BY ps.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Subscriptions fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getSubscriptionsAdminService::>>', error);
    return null;
  }
};

const getSubscriptionDetailService = async ({ subscription_id }) => {
  try {
    if (!subscription_id) return { status: false, code: 400, message: 'subscription_id is required', data: null };

    const [[sub]] = await db.query(
      `SELECT ps.id AS subscription_id, ps.therapist_id,
              CONCAT(u.first_name,' ',u.last_name) AS therapist_name, u.email,
              pp.name AS plan_name, pp.plan_type, pp.access_type, pp.price_inr,
              ps.billing_cycle, ps.status, ps.current_period_start AS period_start,
              ps.current_period_end AS period_end, ps.psychologist_count,
              po.code AS offer_code, po.name AS offer_name,
              ps.created_at, ps.updated_at
       FROM prodesk_subscriptions ps
       JOIN therapists t ON ps.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_offers po ON ps.offer_id = po.id
       WHERE ps.id = ?`, [subscription_id]
    );
    if (!sub) return { status: false, code: 404, message: 'Subscription not found', data: null };

    const [payments] = await db.query(
      `SELECT id AS payment_id, amount, currency, razorpay_order_id, razorpay_payment_id,
              status, payment_for, paid_at, created_at
       FROM prodesk_subscription_payments
       WHERE subscription_id = ? ORDER BY created_at DESC`, [subscription_id]
    );

    return {
      status: true, code: 200, message: 'Subscription detail fetched',
      data: { ...sub, payment_history: payments }
    };
  } catch (error) {
    console.log('Error in getSubscriptionDetailService::>>', error);
    return null;
  }
};

const getPaymentsService = async ({ page = 1, limit = 20, search = '', status = '', payment_for = '', start_date = '', end_date = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = `WHERE 1=1`;
    if (status) { where += ` AND psp.status = ?`; params.push(status); }
    if (payment_for) { where += ` AND psp.payment_for = ?`; params.push(payment_for); }
    if (start_date) { where += ` AND DATE(psp.created_at) >= ?`; params.push(start_date); }
    if (end_date) { where += ` AND DATE(psp.created_at) <= ?`; params.push(end_date); }
    if (search) {
      where += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR psp.razorpay_payment_id LIKE ? OR psp.razorpay_order_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM prodesk_subscription_payments psp
       JOIN therapists t ON psp.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT psp.id AS payment_id, psp.subscription_id, psp.therapist_id,
              CONCAT(u.first_name,' ',u.last_name) AS therapist_name, u.email,
              pp.name AS plan_name, pp.plan_type,
              psp.amount, psp.currency, psp.razorpay_order_id, psp.razorpay_payment_id,
              psp.status, psp.payment_for, psp.paid_at, psp.created_at
       FROM prodesk_subscription_payments psp
       JOIN therapists t ON psp.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_subscriptions ps ON psp.subscription_id = ps.id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id ${where}
       ORDER BY psp.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return { status: true, code: 200, message: 'Payments fetched', data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit) } };
  } catch (error) {
    console.log('Error in getPaymentsService::>>', error);
    return null;
  }
};

const getPaymentDetailService = async ({ payment_id }) => {
  try {
    if (!payment_id) return { status: false, code: 400, message: 'payment_id is required', data: null };

    const [[payment]] = await db.query(
      `SELECT psp.id AS payment_id, psp.subscription_id, psp.therapist_id,
              CONCAT(u.first_name,' ',u.last_name) AS therapist_name, u.email, u.phone,
              pp.name AS plan_name, pp.plan_type, pp.access_type, pp.billing_cycle AS plan_billing,
              ps.billing_cycle AS subscription_billing, ps.status AS subscription_status,
              ps.current_period_start, ps.current_period_end,
              psp.amount, psp.currency, psp.razorpay_order_id, psp.razorpay_payment_id,
              psp.status, psp.payment_for, psp.paid_at, psp.meta, psp.created_at
       FROM prodesk_subscription_payments psp
       JOIN therapists t ON psp.therapist_id = t.id
       JOIN users u ON t.user_id = u.user_id
       JOIN prodesk_subscriptions ps ON psp.subscription_id = ps.id
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       WHERE psp.id = ?`, [payment_id]
    );
    if (!payment) return { status: false, code: 404, message: 'Payment not found', data: null };

    // All payment attempts/logs for the same subscription (trial logs)
    const [allAttempts] = await db.query(
      `SELECT id AS payment_id, amount, currency, razorpay_order_id, razorpay_payment_id,
              status, payment_for, paid_at, meta, created_at
       FROM prodesk_subscription_payments
       WHERE subscription_id = ? ORDER BY created_at ASC`,
      [payment.subscription_id]
    );

    return {
      status: true, code: 200, message: 'Payment detail fetched',
      data: { ...payment, payment_logs: allAttempts }
    };
  } catch (error) {
    console.log('Error in getPaymentDetailService::>>', error);
    return null;
  }
};

const getTherapistByIdService = async ({ therapist_id }) => {
  try {
    if (!therapist_id) return { status: false, code: 400, message: 'therapist_id is required', data: null };

    const [[therapist]] = await db.query(
      `SELECT t.id AS therapist_id, u.user_id, CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, u.phone, u.profile_url, u.is_active, u.created_at,
              t.booking_slug, t.about_me, t.experience_years, t.qualification,
              t.registration_number, t.referral_code
       FROM therapists t
       JOIN users u ON t.user_id = u.user_id
       WHERE t.id = ?`, [therapist_id]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const [[sub]] = await db.query(
      `SELECT ps.id AS subscription_id, pp.name AS plan_name, pp.plan_type, pp.access_type,
              ps.billing_cycle, ps.status, ps.current_period_start AS period_start,
              ps.current_period_end AS period_end, psp.amount AS amount_paid, po.code AS offer_code
       FROM prodesk_subscriptions ps
       JOIN prodesk_plans pp ON ps.plan_id = pp.id
       LEFT JOIN prodesk_subscription_payments psp ON ps.latest_payment_id = psp.id
       LEFT JOIN prodesk_offers po ON ps.offer_id = po.id
       WHERE ps.therapist_id = ? ORDER BY ps.created_at DESC LIMIT 1`, [therapist_id]
    );

    const [[branding]] = await db.query(
      `SELECT brand_name, theme, accent, logo_url FROM therapist_branding WHERE therapist_id = ?`, [therapist_id]
    );

    const [[availability]] = await db.query(
      `SELECT days, from_time, to_time, slot_minutes FROM therapist_availability WHERE therapist_id = ?`, [therapist_id]
    );

    const [[stats]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM prodesk_clients WHERE therapist_id = ?) AS total_clients,
        (SELECT COUNT(*) FROM prodesk_sessions WHERE therapist_id = ?) AS total_sessions,
        (SELECT COUNT(*) FROM prodesk_invoices WHERE therapist_id = ? AND status = 'paid') AS total_invoices,
        (SELECT IFNULL(SUM(total),0) FROM prodesk_invoices WHERE therapist_id = ? AND status = 'paid') AS total_invoice_amount`,
      [therapist_id, therapist_id, therapist_id, therapist_id]
    );

    const [[wallet]] = await db.query(
      `SELECT balance, pending_balance, total_earned, total_paid FROM prodesk_referral_wallet WHERE therapist_id = ?`,
      [therapist_id]
    );

    return {
      status: true, code: 200, message: 'Therapist fetched',
      data: {
        ...therapist,
        subscription: sub || null,
        branding: branding || null,
        availability: availability || null,
        stats,
        wallet: wallet || { balance: 0, pending_balance: 0, total_earned: 0, total_paid: 0 }
      }
    };
  } catch (error) {
    console.log('Error in getTherapistByIdService::>>', error);
    return null;
  }
};

module.exports = {
  getOverviewService, getRevenueService, getActiveUsersService, getDiscontinuedUsersService,
  getTherapistsService, getFeedbackService, updateFeedbackStatusService, getDeactivatedAccountsService,
  createOfferTagService, getOfferTagsService, createOfferService, uploadOfferEmailsService,
  getOffersService, getOfferDetailService, updateOfferService,
  getReferralsService, getReferralDetailService, getPendingPayoutsService, processPayoutService,
  getSessionsAdminService, getSubscriptionsAdminService,
  getSubscriptionDetailService, getPaymentsService, getPaymentDetailService,
  getTherapistByIdService
};
