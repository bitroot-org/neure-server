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

// Generates slots for a single day from multiple time blocks
const generateSlotsFromBlocks = (blocks, slotMins, bufferMins, takenSet, dateStr) => {
  const step = slotMins + bufferMins;
  const slots = [];
  for (const block of blocks) {
    let [h, m] = block.from_time.slice(0, 5).split(':').map(Number);
    const [eh, em] = block.to_time.slice(0, 5).split(':').map(Number);
    const endMins = eh * 60 + em;
    while (h * 60 + m + slotMins <= endMins) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (!takenSet.has(`${dateStr}T${timeStr}`)) slots.push(timeStr);
      const totalMins = h * 60 + m + step;
      h = Math.floor(totalMins / 60);
      m = totalMins % 60;
    }
  }
  slots.sort();
  return slots;
};

const getPublicProfileService = async (payload) => {
  try {
    console.log('Payload in getPublicProfileService::>>', payload);
    const { slug } = payload;

    const [rows] = await db.query(
      `SELECT t.id, t.booking_slug, t.about_me, t.specialization, t.rating,
              t.experience_years, t.registration_number,
              u.first_name, u.last_name, u.profile_url,
              b.brand_name, b.theme, b.accent, b.background_type, b.background_preset,
              b.logo_url, b.wallpaper_id, b.wallpaper_url
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
          background_type: t.background_type, background_preset: t.background_preset,
          logo_url: t.logo_url, wallpaper_id: t.wallpaper_id, wallpaper_url: t.wallpaper_url
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

    const [[therapist]] = await db.query(
      'SELECT t.id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1',
      [slug]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };
    const therapistId = therapist.id;

    const [[settings]] = await db.query(
      'SELECT slot_minutes, buffer_minutes FROM therapist_availability WHERE therapist_id = ?',
      [therapistId]
    );
    const slotMins   = settings?.slot_minutes   || 60;
    const bufferMins = settings?.buffer_minutes || 0;

    const [allBlocks] = await db.query(
      'SELECT day, from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? ORDER BY from_time',
      [therapistId]
    );
    if (!allBlocks || !allBlocks.length) {
      return { status: true, code: 200, message: 'No availability set', data: { days: [] } };
    }

    // Group blocks by day
    const blocksByDay = {};
    for (const b of allBlocks) {
      if (!blocksByDay[b.day]) blocksByDay[b.day] = [];
      blocksByDay[b.day].push(b);
    }

    const [booked] = await db.query(
      `SELECT DATE_FORMAT(DATE_ADD(DATE_ADD(starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE), '%Y-%m-%d') AS date,
              DATE_FORMAT(DATE_ADD(DATE_ADD(starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE), '%H:%i') AS time_slot
       FROM prodesk_sessions
       WHERE therapist_id = ? AND status != 'cancelled' AND DATE(starts_at) BETWEEN ? AND ?`,
      [therapistId, from, to]
    );

    const [holds] = await db.query(
      "SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, DATE_FORMAT(time_slot, '%H:%i') AS time_slot FROM prodesk_slot_holds WHERE therapist_id = ? AND claimed = 0 AND expires_at > NOW()",
      [therapistId]
    );

    const takenSet = new Set([
      ...(booked || []).map(r => `${r.date}T${r.time_slot}`),
      ...(holds  || []).map(r => `${r.date}T${r.time_slot}`)
    ]);

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const results = [];
    const startD = new Date(from + 'T00:00:00Z');
    const endD   = new Date(to   + 'T23:59:59Z');

    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const dayName = DAY_NAMES[d.getUTCDay()];
      const dateStr = d.toISOString().slice(0, 10);
      const blocks  = blocksByDay[dayName];
      if (!blocks || !blocks.length) continue;
      const slots = generateSlotsFromBlocks(blocks, slotMins, bufferMins, takenSet, dateStr);
      results.push({ date: dateStr, day: dayName, slots });
    }

    return { status: true, code: 200, message: 'Available slots fetched', data: { days: results } };
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

// ─── Public direct-booking APIs ──────────────────────────────────────────────

const getBookingSlotsService = async ({ slug, date, session_duration }) => {
  try {
    if (!slug || !date || !session_duration) {
      return { status: false, code: 400, message: 'slug, date and session_duration are required', data: null };
    }

    const duration = parseInt(session_duration);
    if (![30, 45, 60, 90, 120].includes(duration)) {
      return { status: false, code: 400, message: 'session_duration must be 30, 45, 60, 90 or 120', data: null };
    }

    const [[therapist]] = await db.query(
      'SELECT t.id AS therapist_id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1',
      [slug]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };
    const therapist_id = therapist.therapist_id;

    const [[settings]] = await db.query(
      'SELECT buffer_minutes FROM therapist_availability WHERE therapist_id = ?',
      [therapist_id]
    );
    const buffer = settings?.buffer_minutes || 0;

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = DAY_NAMES[new Date(date + 'T00:00:00').getDay()];

    const [dayBlocks] = await db.query(
      'SELECT from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? AND day = ? ORDER BY from_time',
      [therapist_id, dayName]
    );

    if (!dayBlocks || !dayBlocks.length) {
      return {
        status: true, code: 200, message: 'No availability on this day',
        data: { date, day: dayName, is_working_day: false, available_slots: [], available_count: 0 }
      };
    }

    // Build taken set from bookings
    const [booked] = await db.query(
      `SELECT starts_at, duration_min FROM prodesk_sessions
       WHERE therapist_id = ? AND DATE(starts_at) = ? AND status NOT IN ('cancelled')`,
      [therapist_id, date]
    );

    const now = new Date();
    const isToday = date === now.toISOString().slice(0, 10);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const bookedSlotTimes = booked.map(sess => {
      const d = new Date(sess.starts_at);
      return { start_mins: d.getHours() * 60 + d.getMinutes(), duration_min: sess.duration_min };
    });

    // Generate slots across all blocks
    const step = duration + buffer;
    const allSlots = [];
    for (const block of dayBlocks) {
      const [fromH, fromM] = block.from_time.slice(0,5).split(':').map(Number);
      const [toH, toM]     = block.to_time.slice(0,5).split(':').map(Number);
      const fromMins = fromH * 60 + fromM;
      const toMins   = toH * 60 + toM;
      for (let mins = fromMins; mins + duration <= toMins; mins += step) {
        const h = Math.floor(mins/60).toString().padStart(2,'0');
        const m = (mins%60).toString().padStart(2,'0');
        allSlots.push({ time: `${h}:${m}`, mins });
      }
    }
    allSlots.sort((a, b) => a.mins - b.mins);

    const available_slots = [];
    for (const slot of allSlots) {
      if (isToday && slot.mins <= nowMins + 30) continue;
      let blocked = false;
      for (const b of bookedSlotTimes) {
        if (slot.mins < b.start_mins + b.duration_min + buffer && slot.mins + duration > b.start_mins) {
          blocked = true; break;
        }
      }
      if (!blocked) available_slots.push({ time: slot.time, datetime: `${date}T${slot.time}:00` });
    }

    return {
      status: true, code: 200, message: 'Slots fetched',
      data: { date, day: dayName, is_working_day: true, session_duration: duration, available_slots, available_count: available_slots.length }
    };
  } catch (error) {
    console.log('Error in getBookingSlotsService::>>', error);
    return null;
  }
};

const lookupBookingClientService = async ({ slug, email }) => {
  try {
    if (!slug || !email) return { status: false, code: 400, message: 'slug and email are required', data: null };

    const [[therapist]] = await db.query(
      'SELECT t.id AS therapist_id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1',
      [slug]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const [[user]] = await db.query('SELECT user_id, first_name, last_name, phone FROM users WHERE email = ?', [email]);
    if (!user) return { status: true, code: 200, message: 'Client not found', data: { found: false } };

    const [[client]] = await db.query(
      'SELECT id FROM prodesk_clients WHERE user_id = ? AND therapist_id = ?',
      [user.user_id, therapist.therapist_id]
    );

    return {
      status: true, code: 200, message: 'Client found',
      data: {
        found: true,
        already_client: !!client,
        name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.phone || ''
      }
    };
  } catch (error) {
    console.log('Error in lookupBookingClientService::>>', error);
    return null;
  }
};

const createBookingSessionService = async ({ slug, date, time, duration_min = 60, modality, email, name, phone, concern }) => {
  try {
    if (!slug || !date || !time || !modality || !email) {
      return { status: false, code: 400, message: 'slug, date, time, modality and email are required', data: null };
    }

    const [[therapistRow]] = await db.query(
      `SELECT t.id AS therapist_id,
              CONCAT(tu.first_name, ' ', tu.last_name) AS therapist_name,
              tu.email AS therapist_email,
              tu.phone AS therapist_phone,
              COALESCE(tb.brand_name, CONCAT(tu.first_name, ' ', tu.last_name)) AS clinic_name
       FROM therapists t
       JOIN users tu ON tu.user_id = t.user_id
       LEFT JOIN therapist_branding tb ON tb.therapist_id = t.id
       WHERE t.booking_slug = ? AND t.is_active = 1 AND tu.is_active = 1`,
      [slug]
    );
    if (!therapistRow) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const { therapist_id, therapist_name, therapist_email, therapist_phone, clinic_name } = therapistRow;
    const fee = 0;
    const starts_at = `${date}T${time}:00`;

    if (new Date(starts_at) < new Date()) {
      return { status: false, code: 422, message: 'Session time cannot be in the past', data: null };
    }

    // Overlap check
    const [overlap] = await db.query(
      `SELECT id FROM prodesk_sessions
       WHERE therapist_id = ? AND status NOT IN ('cancelled')
       AND starts_at < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(starts_at, INTERVAL duration_min MINUTE) > ?
       LIMIT 1`,
      [therapist_id, starts_at, duration_min, starts_at]
    );
    if (overlap && overlap.length) return { status: false, code: 409, message: 'That slot was just taken. Please pick another.', data: null };

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Find or create user
      let [[existingUser]] = await conn.query('SELECT user_id, first_name, last_name, phone FROM users WHERE email = ?', [email]);
      let userId;
      let clientName = name;

      if (existingUser) {
        userId = existingUser.user_id;
        clientName = `${existingUser.first_name} ${existingUser.last_name}`.trim();
      } else {
        if (!name) { await conn.rollback(); return { status: false, code: 400, message: 'name is required for new clients', data: null }; }
        const nameParts = name.trim().split(/\s+/);
        const tempPwd = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        const [userRes] = await conn.query(
          'INSERT INTO users (first_name, last_name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?, 5)',
          [nameParts[0], nameParts.slice(1).join(' ') || '', email, phone ? phone.replace(/\D/g, '') : null, tempPwd]
        );
        userId = userRes.insertId;
      }

      // Find or create prodesk_clients record for this therapist
      let [[clientRow]] = await conn.query(
        'SELECT id FROM prodesk_clients WHERE user_id = ? AND therapist_id = ?',
        [userId, therapist_id]
      );
      if (!clientRow) {
        const color = avatarColor(clientName || email);
        const [cRes] = await conn.query(
          `INSERT INTO prodesk_clients (user_id, therapist_id, presenting_concerns, default_fee, avatar_color, start_date)
           VALUES (?, ?, ?, ?, ?, CURDATE())`,
          [userId, therapist_id, concern || null, fee || 0, color]
        );
        clientRow = { id: cRes.insertId };
      }

      const client_id = clientRow.id;

      // Session number
      const [[{ cnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM prodesk_sessions WHERE client_id = ?', [client_id]);
      const sessionNum = cnt + 1;

      const [sessRes] = await conn.query(
        `INSERT INTO prodesk_sessions (therapist_id, client_id, session_number, title, starts_at, duration_min, modality, fee, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
        [therapist_id, client_id, sessionNum, `Session ${sessionNum}`, starts_at, duration_min, modality, fee || 0]
      );
      const session_id = sessRes.insertId;

      await conn.commit();

      // Auto-create Google Meet for video sessions
      let meetUrl = null;
      if (modality === 'video') {
        try {
          const { createMeetingSpace } = require('./googleMeetService');
          meetUrl = await createMeetingSpace(therapist_id);
          await db.query('UPDATE prodesk_sessions SET meet_url = ? WHERE id = ?', [meetUrl, session_id]);
        } catch (e) {
          console.log('Meet create (non-blocking):', e.message);
        }
      }

      // Formatted time for emails
      const formattedTime = new Date(starts_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
      });

      // Email to client
      try {
        await NotificationService.sendSessionScheduledEmail({
          toEmail: email,
          toName: clientName,
          therapistName: therapist_name,
          sessionTime: formattedTime,
          meetUrl,
          clinicName: clinic_name,
          sessionStartISO: starts_at,
          durationMin: duration_min
        });
      } catch (e) { console.log('Client email (non-blocking):', e.message); }

      // Email to therapist
      try {
        await NotificationService.sendBookingNotificationToTherapist({
          toEmail: therapist_email,
          toName: therapist_name,
          clientName,
          clientEmail: email,
          clientPhone: phone || '',
          sessionTime: formattedTime,
          modality,
          durationMin: duration_min,
          meetUrl,
          clinicName: clinic_name
        });
      } catch (e) { console.log('Therapist email (non-blocking):', e.message); }

      // WhatsApp to therapist
      if (therapist_phone) {
        try {
          const digits = therapist_phone.replace(/\D/g, '');
          const phone_e164 = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
          const formatLabel = modality === 'video' ? 'Video' : 'In Person';
          await NotificationService.sendWhatsAppNotification({
            to: phone_e164,
            templateName: 'booking_new_therapist',
            variables: [
              therapist_name,                             // {{1}} Hi *{{1}}*
              clientName,                                 // {{2}} Client
              `${email}${phone ? ' / ' + phone : ''}`,   // {{3}} Contact
              formattedTime,                              // {{4}} Date & Time
              `${formatLabel} · ${duration_min} min`,    // {{5}} Format
              meetUrl || 'N/A'                            // {{6}} Session Link
            ],
            meta: { session_id }
          });
        } catch (e) { console.log('Therapist WhatsApp (non-blocking):', e.message); }
      }

      return {
        status: true, code: 200, message: 'Session booked successfully',
        data: {
          session_id,
          therapist_name,
          client_name: clientName,
          starts_at,
          duration_min,
          modality,
          meet_url: meetUrl,
          formatted_time: formattedTime
        }
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in createBookingSessionService::>>', error);
    return null;
  }
};

module.exports = {
  getPublicProfileService,
  getAvailableSlotsService,
  holdSlotService,
  confirmBookingService,
  verifyBookingPaymentService,
  getBookingSlotsService,
  lookupBookingClientService,
  createBookingSessionService
};
