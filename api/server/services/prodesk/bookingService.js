const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../../../config/db');
const RazorpayService = require('./razorpayService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const HOLD_MINUTES = 8;
const AVATAR_COLORS = ['#5EA89A', '#6E8FB5', '#8B7CB0', '#C89364', '#B87276', '#A87E6A'];

const avatarColor = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const generateSlots = (availability, takenSet, from, to) => {
  if (!availability) return [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Array.isArray(availability.days) ? availability.days
    : (typeof availability.days === 'string' ? JSON.parse(availability.days) : []);
  const { from_time, to_time, slot_minutes, buffer_minutes } = availability;

  const results = [];
  const startD = new Date(from + 'T00:00:00Z');
  const endD = new Date(to + 'T23:59:59Z');

  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const dayName = dayNames[d.getUTCDay()];
    if (!days.includes(dayName)) continue;

    const dateStr = d.toISOString().slice(0, 10);
    const slots = [];
    let [h, m] = from_time.split(':').map(Number);
    const [eh, em] = to_time.split(':').map(Number);
    const endMins = eh * 60 + em;

    while (h * 60 + m + slot_minutes <= endMins) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const key = `${dateStr}T${timeStr}`;
      if (!takenSet.has(key)) slots.push(timeStr);
      const totalMins = h * 60 + m + slot_minutes + buffer_minutes;
      h = Math.floor(totalMins / 60);
      m = totalMins % 60;
    }
    results.push({ date: dateStr, day: dayName, slots });
  }
  return results;
};

const getPublicProfileService = async (payload) => {
  try {
    console.log('Payload in getPublicProfileService::>>', payload);
    const { slug } = payload;

    const [rows] = await db.query(
      `SELECT t.id, t.booking_slug, t.about_me, t.specialization, t.rating,
              t.experience_years, t.registration_number,
              u.first_name, u.last_name, u.profile_url,
              b.brand_name, b.theme, b.accent, b.background_preset, b.logo_url, b.custom_background_url
       FROM therapists t
       JOIN users u ON u.user_id = t.user_id
       LEFT JOIN therapist_branding b ON b.therapist_id = t.id
       WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1`,
      [slug]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Therapist not found', data: null };
    }

    const t = rows[0];
    const [docs] = await db.query(
      "SELECT type, file_url FROM therapist_documents WHERE therapist_id = ? AND type IN ('agreement','consent')",
      [t.id]
    );

    return {
      status: true, code: 200, message: 'Public profile fetched',
      data: {
        slug: t.booking_slug,
        name: `${t.first_name} ${t.last_name}`,
        specialization: t.specialization,
        experience_years: t.experience_years,
        about_me: t.about_me,
        rating: t.rating,
        profile_url: t.profile_url,
        branding: {
          brand_name: t.brand_name, theme: t.theme, accent: t.accent,
          background_preset: t.background_preset, logo_url: t.logo_url,
          custom_background_url: t.custom_background_url
        },
        documents: docs || []
      }
    };
  } catch (error) {
    console.log('Error in getPublicProfileService::>>', error);
    return null;
  }
};

const getAvailableSlotsService = async (payload) => {
  try {
    console.log('Payload in getAvailableSlotsService::>>', payload);
    const { slug, from, to } = payload;

    if (!from || !to) {
      return { status: false, code: 400, message: 'from and to are required', data: null };
    }

    const [therapist] = await db.query(
      'SELECT id FROM therapists WHERE booking_slug = ? AND is_active = 1',
      [slug]
    );
    if (!therapist || !therapist.length) {
      return { status: false, code: 404, message: 'Therapist not found', data: null };
    }
    const therapistId = therapist[0].id;

    const [avail] = await db.query(
      'SELECT * FROM therapist_availability WHERE therapist_id = ?',
      [therapistId]
    );
    if (!avail || !avail.length) {
      return { status: true, code: 200, message: 'No availability set', data: { days: [] } };
    }

    const [booked] = await db.query(
      `SELECT DATE_FORMAT(starts_at, '%Y-%m-%d') AS date,
              DATE_FORMAT(starts_at, '%H:%i') AS time_slot
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status != 'cancelled'
       AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapistId, from, to]
    );

    const [holds] = await db.query(
      "SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, DATE_FORMAT(time_slot, '%H:%i') AS time_slot FROM prodesk_slot_holds WHERE therapist_id = ? AND claimed = 0 AND expires_at > NOW()",
      [therapistId]
    );

    const takenSet = new Set([
      ...(booked || []).map(r => `${r.date}T${r.time_slot}`),
      ...(holds || []).map(r => `${r.date}T${r.time_slot}`)
    ]);

    const days = generateSlots(avail[0], takenSet, from, to);
    return { status: true, code: 200, message: 'Available slots fetched', data: { days } };
  } catch (error) {
    console.log('Error in getAvailableSlotsService::>>', error);
    return null;
  }
};

const holdSlotService = async (payload) => {
  try {
    console.log('Payload in holdSlotService::>>', payload);
    const { slug, date, time, modality } = payload;

    const [therapist] = await db.query(
      'SELECT id FROM therapists WHERE booking_slug = ? AND is_active = 1',
      [slug]
    );
    if (!therapist || !therapist.length) {
      return { status: false, code: 404, message: 'Therapist not found', data: null };
    }
    const therapistId = therapist[0].id;

    const timeSlot = time.length === 5 ? `${time}:00` : time;

    const [existing] = await db.query(
      'SELECT id FROM prodesk_slot_holds WHERE therapist_id = ? AND date = ? AND time_slot = ? AND claimed = 0 AND expires_at > NOW()',
      [therapistId, date, timeSlot]
    );
    if (existing && existing.length) {
      return { status: false, code: 409, message: 'Slot unavailable', data: null };
    }

    const [sessionCheck] = await db.query(
      "SELECT id FROM prodesk_sessions WHERE therapist_id = ? AND DATE(starts_at) = ? AND TIME_FORMAT(starts_at, '%H:%i:%s') = ? AND status != 'cancelled'",
      [therapistId, date, timeSlot]
    );
    if (sessionCheck && sessionCheck.length) {
      return { status: false, code: 409, message: 'Slot already booked', data: null };
    }

    const holdToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    await db.query(
      'INSERT INTO prodesk_slot_holds (therapist_id, date, time_slot, modality, hold_token, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [therapistId, date, timeSlot, modality, holdToken, expiresAt]
    );

    return {
      status: true, code: 201, message: 'Slot held for 8 minutes',
      data: { hold_token: holdToken, expires_at: expiresAt.toISOString() }
    };
  } catch (error) {
    console.log('Error in holdSlotService::>>', error);
    return null;
  }
};

const confirmBookingService = async (payload) => {
  try {
    console.log('Payload in confirmBookingService::>>', payload);
    const { hold_token, name, email, phone, concern, consent_accepted } = payload;

    if (!name || !consent_accepted) {
      return { status: false, code: 400, message: 'name and consent_accepted are required', data: null };
    }

    const [holds] = await db.query(
      'SELECT * FROM prodesk_slot_holds WHERE hold_token = ? AND claimed = 0 AND expires_at > NOW()',
      [hold_token]
    );
    if (!holds || !holds.length) {
      return { status: false, code: 409, message: 'Hold expired or invalid', data: null };
    }
    const hold = holds[0];

    let clientId = null;
    let userId = null;

    if (email) {
      const [existing] = await db.query(
        `SELECT pc.id, pc.user_id FROM prodesk_clients pc
         JOIN users u ON u.user_id = pc.user_id
         WHERE u.email = ? AND pc.therapist_id = ?`,
        [email, hold.therapist_id]
      );
      if (existing && existing.length) {
        clientId = existing[0].id;
        userId = existing[0].user_id;
        if (concern) {
          await db.query('UPDATE prodesk_clients SET presenting_concerns = ? WHERE id = ?', [concern, clientId]);
        }
      }
    }

    if (!clientId) {
      const nameParts = name.trim().split(/\s+/);
      const tempPwd = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
      const [uResult] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?, 5)',
        [nameParts[0], nameParts.slice(1).join(' ') || '', email || null, phone || null, tempPwd]
      );
      userId = uResult.insertId;
      const [cResult] = await db.query(
        'INSERT INTO prodesk_clients (user_id, therapist_id, presenting_concerns, avatar_color, start_date) VALUES (?, ?, ?, ?, CURDATE())',
        [userId, hold.therapist_id, concern || null, avatarColor(name)]
      );
      clientId = cResult.insertId;
    }

    const fee = 0;
    const tax = parseFloat((fee * 0.18).toFixed(2));
    const total = parseFloat((fee + tax).toFixed(2));

    let razorpayOrderId = null;
    let razorpayKeyId = null;
    try {
      const order = await RazorpayService.createOrder({
        amount: total || 1,
        notes: { therapist_id: hold.therapist_id, client_id: clientId }
      });
      razorpayOrderId = order.id;
      razorpayKeyId = await RazorpayService.getKeyId();
    } catch (e) {
      console.log('Razorpay order error::>>', e.message);
    }

    const [payResult] = await db.query(
      `INSERT INTO prodesk_payment (user_id, therapist_id, payment_type, provider, amount, status, razorpay_order_id)
       VALUES (?, ?, 'booking', 'razorpay', ?, 'created', ?)`,
      [userId, hold.therapist_id, total, razorpayOrderId]
    );

    return {
      status: true, code: 200, message: 'Booking initiated',
      data: {
        payment_id: payResult.insertId,
        hold_token,
        razorpay_order_id: razorpayOrderId,
        razorpay_key_id: razorpayKeyId,
        amount: total,
        subtotal: fee,
        tax,
        currency: 'INR',
        client_id: clientId,
        prefill: { name, email: email || '', contact: phone || '' }
      }
    };
  } catch (error) {
    console.log('Error in confirmBookingService::>>', error);
    return null;
  }
};

const verifyBookingPaymentService = async (payload) => {
  try {
    console.log('Payload in verifyBookingPaymentService::>>', payload);
    const { hold_token, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = payload;

    const valid = await RazorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
    if (!valid) {
      return { status: false, code: 400, message: 'Payment verification failed', data: null };
    }

    const [holds] = await db.query(
      'SELECT * FROM prodesk_slot_holds WHERE hold_token = ? AND claimed = 0',
      [hold_token]
    );
    if (!holds || !holds.length) {
      return { status: false, code: 409, message: 'Hold not found or already claimed', data: null };
    }
    const hold = holds[0];

    const [payment] = await db.query('SELECT * FROM prodesk_payment WHERE id = ?', [payment_id]);
    if (!payment || !payment.length) {
      return { status: false, code: 404, message: 'Payment record not found', data: null };
    }

    const [clientRows] = await db.query('SELECT id FROM prodesk_clients WHERE user_id = ?', [payment[0].user_id]);
    const pcId = clientRows[0]?.id;

    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM prodesk_sessions WHERE client_id = ?', [pcId]);

    const dateStr = String(hold.date).slice(0, 10);
    const timeStr = String(hold.time_slot);
    const startsAt = `${dateStr} ${timeStr}`;

    const [sessionResult] = await db.query(
      `INSERT INTO prodesk_sessions (therapist_id, client_id, session_number, starts_at, duration_min, modality, fee, status)
       VALUES (?, ?, ?, ?, 60, ?, ?, 'scheduled')`,
      [hold.therapist_id, pcId, cnt + 1, startsAt, hold.modality, payment[0].amount]
    );

    // For video bookings, create an in-app Daily.co room (best-effort; else lazy on join)
    if (hold.modality === 'video') {
      try {
        const { ensureRoom } = require('./dailyService');
        const url = await ensureRoom(`neure-prodesk-session-${sessionResult.insertId}`);
        await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [url, sessionResult.insertId]);
      } catch (e) {
        console.log('Daily room create on booking (deferred):', e.message);
      }
    }

    await db.query('UPDATE prodesk_slot_holds SET claimed = 1 WHERE hold_token = ?', [hold_token]);
    await db.query(
      'UPDATE prodesk_payment SET status = ?, razorpay_ref_id = ?, session_id = ? WHERE id = ?',
      ['captured', razorpay_payment_id, sessionResult.insertId, payment_id]
    );
    await db.query(
      'INSERT INTO prodesk_payment_log (payment_id, reference_id, status) VALUES (?, ?, ?)',
      [payment_id, razorpay_payment_id, 'captured']
    );

    const [therapistUser] = await db.query('SELECT user_id FROM therapists WHERE id = ?', [hold.therapist_id]);
    if (therapistUser && therapistUser.length) {
      await NotificationService.createNotification({
        title: 'New Session Booked',
        content: `A new session has been booked for ${dateStr} at ${timeStr}.`,
        type: 'SESSION_BOOKED',
        user_id: therapistUser[0].user_id
      });
    }

    return {
      status: true, code: 200, message: 'Booking confirmed',
      data: {
        session_id: sessionResult.insertId,
        starts_at: startsAt,
        modality: hold.modality,
        amount_paid: payment[0].amount
      }
    };
  } catch (error) {
    console.log('Error in verifyBookingPaymentService::>>', error);
    return null;
  }
};

module.exports = {
  getPublicProfileService,
  getAvailableSlotsService,
  holdSlotService,
  confirmBookingService,
  verifyBookingPaymentService
};
