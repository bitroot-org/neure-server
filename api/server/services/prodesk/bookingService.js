const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../../../config/db');
const parentConsent = require('./parentConsentService');
const RazorpayService = require('./razorpayService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');
const { formatISTWallClock, istNowParts } = require('../../utils/dateHelper');
const { recordConsentService } = require('./consentService');
const { modesForModality } = require('../../utils/availabilityMode');
const { touchClient } = require('./clientActivity');
const planGuard = require('./planGuard');
const Intake = require('./intakeFormService');
const Consent = require('./consentFormService');
const Catalog = require('./serviceCatalogService');
const Purchases = require('./servicePurchaseService');
const InvoicePay = require('./invoicePayService');
const Activity = require('./activityLogService');

const HOLD_MINUTES = 8;
const AVATAR_COLORS = ['#5EA89A', '#6E8FB5', '#8B7CB0', '#C89364', '#B87276', '#A87E6A'];

const avatarColor = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// Generates slots for a single day from multiple time blocks.
// Overlapping blocks can yield the same time string more than once, so
// dedupe with a Set before sorting.
const generateSlotsFromBlocks = (blocks, slotMins, bufferMins, takenSet, dateStr) => {
  const step = slotMins + bufferMins;
  const slots = new Set();
  for (const block of blocks) {
    let [h, m] = block.from_time.slice(0, 5).split(':').map(Number);
    const [eh, em] = block.to_time.slice(0, 5).split(':').map(Number);
    const endMins = eh * 60 + em;
    while (h * 60 + m + slotMins <= endMins) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (!takenSet.has(`${dateStr}T${timeStr}`)) slots.add(timeStr);
      const totalMins = h * 60 + m + step;
      h = Math.floor(totalMins / 60);
      m = totalMins % 60;
    }
  }
  return [...slots].sort();
};

const getPublicProfileService = async (payload) => {
  try {
    console.log('Payload in getPublicProfileService::>>', payload);
    const { slug } = payload;

    const [rows] = await db.query(
      `SELECT t.id, t.booking_slug, t.about_me, t.specialization, t.rating,
              t.experience_years, t.registration_number, t.booking_preview_url,
              u.first_name, u.last_name, u.profile_url, u.age,
              b.brand_name, b.clinic_address, b.theme, b.accent, b.background_type, b.background_preset,
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

    const [gal] = await db.query('SELECT image_url FROM therapist_gallery WHERE therapist_id = ? ORDER BY sort_order, id', [t.id]);
    const [rev] = await db.query('SELECT reviewer_name AS name, body AS text, rating FROM therapist_reviews WHERE therapist_id = ? AND is_visible = 1 ORDER BY id DESC LIMIT 30', [t.id]);

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
        preview_image_url: t.booking_preview_url || null,
        address: t.clinic_address || null,
        age: t.age || null,
        gallery: gal.map((g) => g.image_url),
        testimonials: rev,
        review_count: rev.length,
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
    const { slug, from, to, modality } = payload;

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

    const modes = modesForModality(modality);
    const [allBlocks] = await db.query(
      `SELECT day, from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? ${modes ? 'AND mode IN (?)' : ''} ORDER BY from_time`,
      modes ? [therapistId, modes] : [therapistId]
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
      `SELECT DATE_FORMAT(starts_at, '%Y-%m-%d') AS date,
              DATE_FORMAT(starts_at, '%H:%i') AS time_slot
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

    // Dates the therapist has marked entirely unavailable (e.g. travel/OOO)
    const [blockedRows] = await db.query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date FROM therapist_availability_exceptions
       WHERE therapist_id = ? AND date BETWEEN ? AND ?`,
      [therapistId, from, to]
    );
    const blockedDates = new Set((blockedRows || []).map(r => r.date));

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const results = [];
    const startD = new Date(from + 'T00:00:00Z');
    const endD   = new Date(to   + 'T23:59:59Z');

    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const dayName = DAY_NAMES[d.getUTCDay()];
      const dateStr = d.toISOString().slice(0, 10);
      if (blockedDates.has(dateStr)) continue;
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

    let legacyGate = null;
    if (!clientId) {
      // New person through the older pay-and-book flow: same plan limit as everywhere else
      legacyGate = await planGuard.checkAddClient(hold.therapist_id);
      if (!legacyGate.ok) {
        return { status: false, code: 409, message: 'This therapist is not available for booking right now. Please try again later.', data: null };
      }
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
      await planGuard.markClientActive(hold.therapist_id, clientId, legacyGate.access);
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

const MAX_BOOKING_AHEAD_DAYS = 60;

const getBookingSlotsService = async ({ slug, date, session_duration, modality }) => {
  try {
    if (!slug || !date || !session_duration) {
      return { status: false, code: 400, message: 'slug, date and session_duration are required', data: null };
    }

    // Any length a service can have (the service form allows 5 to 480 minutes), not just a fixed list
    const duration = parseInt(session_duration);
    if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
      return { status: false, code: 400, message: 'session_duration must be between 5 and 480 minutes', data: null };
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

    // Therapist has marked this specific date unavailable (e.g. travel/OOO)
    const [[blockedDate]] = await db.query(
      'SELECT id FROM therapist_availability_exceptions WHERE therapist_id = ? AND date = ?',
      [therapist_id, date]
    );
    if (blockedDate) {
      return {
        status: true, code: 200, message: 'Therapist unavailable on this day',
        data: { date, day: dayName, is_working_day: false, available_slots: [], available_count: 0 }
      };
    }

    // Online slots only for video bookings, Offline only for in-person, Both for either
    const modes = modesForModality(modality);
    const [dayBlocks] = await db.query(
      `SELECT from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? AND day = ? ${modes ? 'AND mode IN (?)' : ''} ORDER BY from_time`,
      modes ? [therapist_id, dayName, modes] : [therapist_id, dayName]
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

    const istNow = istNowParts();
    const isToday = date === istNow.date;
    const nowMins = istNow.mins;

    const bookedSlotTimes = booked.map(sess => {
      const d = new Date(sess.starts_at);
      return { start_mins: d.getHours() * 60 + d.getMinutes(), duration_min: sess.duration_min };
    });

    // Generate slots across all blocks. Overlapping blocks can yield the
    // same `mins` more than once, so dedupe by `mins` before sorting.
    const step = duration + buffer;
    const slotsByMins = new Map();
    for (const block of dayBlocks) {
      const [fromH, fromM] = block.from_time.slice(0,5).split(':').map(Number);
      const [toH, toM]     = block.to_time.slice(0,5).split(':').map(Number);
      const fromMins = fromH * 60 + fromM;
      const toMins   = toH * 60 + toM;
      for (let mins = fromMins; mins + duration <= toMins; mins += step) {
        if (slotsByMins.has(mins)) continue;
        const h = Math.floor(mins/60).toString().padStart(2,'0');
        const m = (mins%60).toString().padStart(2,'0');
        slotsByMins.set(mins, { time: `${h}:${m}`, mins });
      }
    }
    const allSlots = [...slotsByMins.values()].sort((a, b) => a.mins - b.mins);

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
    email = String(email || '').trim().toLowerCase();
    if (!slug || !email) return { status: false, code: 400, message: 'slug and email are required', data: null };

    const [[therapist]] = await db.query(
      'SELECT t.id AS therapist_id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1',
      [slug]
    );
    if (!therapist) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const [[user]] = await db.query('SELECT user_id, first_name, last_name, phone FROM users WHERE email = ?', [email]);
    if (!user) return { status: true, code: 200, message: 'Client not found', data: { found: false } };

    const [[client]] = await db.query(
      'SELECT id FROM prodesk_clients WHERE user_id = ? AND therapist_id = ? AND deleted_at IS NULL',
      [user.user_id, therapist.therapist_id]
    );

    // The prices special to this client, so the booking page can show them straight away
    let prices = {};
    if (client) {
      const [cp] = await db.query(
        `SELECT cp.service_id, cp.price FROM prodesk_service_client_prices cp JOIN prodesk_services s ON s.id = cp.service_id
         WHERE cp.client_id = ? AND s.therapist_id = ? AND s.status = 'active'`, [client.id, therapist.therapist_id]);
      prices = Object.fromEntries(cp.map((r) => [r.service_id, Number(r.price)]));
    }

    return {
      status: true, code: 200, message: 'Client found',
      data: {
        found: true,
        already_client: !!client,
        name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.phone || '',
        prices
      }
    };
  } catch (error) {
    console.log('Error in lookupBookingClientService::>>', error);
    return null;
  }
};

// Public: the services a therapist offers on the booking link, and how the client may pay
const getPublicServicesService = async ({ slug }) => {
  try {
    if (!slug) return { status: false, code: 400, message: 'slug is required', data: null };
    const [[t]] = await db.query(
      `SELECT t.id FROM therapists t JOIN users u ON u.user_id = t.user_id
       WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1`, [slug]);
    if (!t) return { status: false, code: 404, message: 'Therapist not found', data: null };

    const [rows] = await db.query(
      `SELECT id, name, description, session_mode, duration_min, sessions_count, validity_days, price, payment_method, payment_timing,
              (intake_form_mode <> 'none') AS has_intake, (consent_form_id IS NOT NULL) AS has_consent
       FROM prodesk_services WHERE therapist_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())
       ORDER BY sessions_count, price, id`, [t.id]);

    const ready = { razorpay: !(await Purchases.paymentMethodReady(t.id, 'razorpay')), direct: !(await Purchases.paymentMethodReady(t.id, 'direct')) };
    const services = rows.map((r) => ({ ...r, price: Number(r.price), has_intake: !!r.has_intake, has_consent: !!r.has_consent, pay_now_available: !!ready[r.payment_method] }));
    return { status: true, code: 200, message: 'Services', data: { services } };
  } catch (error) {
    console.log('Error in getPublicServicesService::>>', error);
    return null;
  }
};

// Public: what this person must still do to book this service (price, intake form, agreement)
const getPublicBookingRequirementsService = async ({ slug, service_id, email }) => {
  try {
    email = String(email || '').trim().toLowerCase();
    if (!slug || !service_id) return { status: false, code: 400, message: 'slug and service_id are required', data: null };
    const [[t]] = await db.query('SELECT t.id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1', [slug]);
    if (!t) return { status: false, code: 404, message: 'Therapist not found', data: null };
    let client_id;
    if (email) {
      const [[c]] = await db.query(
        'SELECT pc.id FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE u.email = ? AND pc.therapist_id = ? AND pc.deleted_at IS NULL', [email, t.id]);
      client_id = c ? c.id : undefined;
    }
    const r = await Purchases.getRequirementsService({ therapist_id: t.id, service_id, client_id });
    if (!r || !r.status) return r;
    const { price, intake, consent } = r.data;
    return { status: true, code: 200, message: 'Requirements', data: { price, intake, consent } };
  } catch (error) {
    console.log('Error in getPublicBookingRequirementsService::>>', error);
    return null;
  }
};

// Public booking form, under 18: the parent's OTP (same service the therapist's Add client form uses)
const therapistIdForSlug = async (slug) => {
  const [[t]] = await db.query(
    'SELECT t.id FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.booking_slug = ? AND t.is_active = 1 AND u.is_active = 1', [slug]
  );
  return t ? t.id : null;
};
const sendBookingParentOtpService = async ({ slug, parent_name, parent_phone, parent_email, ip_address }) => {
  const therapist_id = await therapistIdForSlug(slug);
  if (!therapist_id) return { status: false, code: 404, message: 'Therapist not found', data: null };
  return parentConsent.sendParentOtpService({ therapist_id, parent_name, parent_phone, parent_email, ip_address });
};
const verifyBookingParentOtpService = async ({ slug, consent_id, otp }) => {
  const therapist_id = await therapistIdForSlug(slug);
  if (!therapist_id) return { status: false, code: 404, message: 'Therapist not found', data: null };
  return parentConsent.verifyParentOtpService({ therapist_id, consent_id, otp });
};

// A price special to a client only applies to someone who was already this therapist's client before this request
const existingClientId = (clientRow) => (clientRow && clientRow.existed ? clientRow.id : null);

const createBookingSessionService = async ({ slug, date, time, duration_min = 60, modality, email, name, phone, concern, consent_accepted, age, parent_consent_id, ip_address = null, user_agent = null, service_id = null, intake_answers = null }) => {
  try {
    email = String(email || '').trim().toLowerCase();
    if (!slug || !date || !time || !modality || !email) {
      return { status: false, code: 400, message: 'slug, date, time, modality and email are required', data: null };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: false, code: 400, message: 'Enter a valid email address', data: null };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}$/.test(String(time))) return { status: false, code: 400, message: 'date must be YYYY-MM-DD and time HH:MM', data: null };
    if (!consent_accepted) {
      return { status: false, code: 400, message: 'You must agree to the consent form to request a session', data: null };
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
    let fee = 0;

    // ── A service was chosen: its own length, mode, price, agreement, intake form and payment rules apply ──
    let svc = null, choice = null, reqs = null;
    if (service_id) {
      const [[sv]] = await db.query("SELECT * FROM prodesk_services WHERE id = ? AND therapist_id = ? AND status = 'active'", [service_id, therapist_id]);
      if (!sv) return { status: false, code: 404, message: 'That service is not available', data: null };
      if (sv.expires_at && new Date(String(sv.expires_at).replace(' ', 'T') + 'Z') < new Date()) return { status: false, code: 409, message: 'That service is no longer available', data: null };
      const allowedModes = { online: ['video'], in_person: ['in_person'], both: ['video', 'in_person'] }[sv.session_mode] || [];
      if (!allowedModes.includes(modality)) return { status: false, code: 422, message: `This service is ${sv.session_mode === 'online' ? 'online only' : 'in person only'}`, data: null };
      svc = sv;
      duration_min = sv.duration_min;

      // The service decides: prepaid = pay now and request, postpaid = request first and pay when approved
      choice = sv.payment_timing === 'prepaid' ? 'now' : 'later';
      if (choice === 'now') { const notReady = await Purchases.paymentMethodReady(therapist_id, sv.payment_method); if (notReady) return notReady; }

      // Intake form: a new person answers it, an existing client (or one who already did) skips it
      const [[u0]] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
      let known = null;
      if (u0) { const [[c0]] = await db.query('SELECT id FROM prodesk_clients WHERE user_id = ? AND therapist_id = ? AND deleted_at IS NULL', [u0.user_id, therapist_id]); known = c0 ? c0.id : null; }
      const rq = await Purchases.getRequirementsService({ therapist_id, service_id, client_id: known || undefined });
      if (!rq || !rq.status) return rq || { status: false, code: 500, message: 'Could not check the booking requirements', data: null };
      reqs = rq.data;
      if (reqs.intake.needed) {
        if (reqs.intake.required && !Array.isArray(intake_answers)) return { status: false, code: 422, message: 'Please fill in the intake form', data: null };
        if (Array.isArray(intake_answers)) {
          const form = await Intake.loadForm(reqs.intake.form_id, therapist_id);
          const v = Intake.validateAnswers(form, intake_answers);
          if (v.error) return v.error;
        }
      }
    }
    const starts_at = `${date}T${time}:00`;

    if (new Date(starts_at) < new Date()) {
      return { status: false, code: 422, message: 'Session time cannot be in the past', data: null };
    }
    // Only a time the therapist actually offers: inside their hours, for this length and mode, not already taken, and within the booking window
    if (new Date(starts_at) > new Date(Date.now() + MAX_BOOKING_AHEAD_DAYS * 86400000)) {
      return { status: false, code: 422, message: `Sessions can only be booked up to ${MAX_BOOKING_AHEAD_DAYS} days ahead`, data: null };
    }
    {
      const offered = await getBookingSlotsService({ slug, date, session_duration: duration_min, modality });
      const times = offered && offered.status ? offered.data.available_slots.map((x) => x.time) : [];
      if (!times.includes(time)) return { status: false, code: 409, message: 'That time is no longer available. Please pick another slot.', data: null };
    }

    // Blocked by this therapist (same email, or same mobile number): no request is created, and the message does not say "blocked"
    {
      const last10 = String(phone || '').replace(/\D/g, '').slice(-10);
      const [blockedRows] = await db.query(
        `SELECT pc.id FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id
         WHERE pc.therapist_id = ? AND pc.is_blocked = 1 AND pc.deleted_at IS NULL
           AND (u.email = ? OR (? <> '' AND RIGHT(REGEXP_REPLACE(COALESCE(u.phone, ''), '[^0-9]', ''), 10) = ?))
         LIMIT 1`,
        [therapist_id, email, last10.length === 10 ? last10 : '', last10]
      );
      if (blockedRows && blockedRows.length) {
        return { status: false, code: 403, message: "This therapist isn't taking bookings from you right now. Please contact them directly.", data: null };
      }
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

    // The chosen time must not sit inside a slot reserved for the other format
    // (e.g. an Online-only slot can't be booked as an in-person session).
    {
      const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = DAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
      const [coveringBlocks] = await db.query(
        `SELECT mode FROM therapist_availability_blocks
         WHERE therapist_id = ? AND day = ? AND from_time <= ? AND to_time >= SEC_TO_TIME(TIME_TO_SEC(?) + ? * 60)`,
        [therapist_id, dayName, `${time}:00`, `${time}:00`, duration_min]
      );
      const allowed = modesForModality(modality);
      if (coveringBlocks && coveringBlocks.length && allowed && !coveringBlocks.some(b => allowed.includes(b.mode))) {
        return { status: false, code: 422, message: `That time isn't available for ${modality === 'in_person' ? 'in-person' : 'video'} sessions. Please pick another slot.`, data: null };
      }
    }

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
        'SELECT id, deleted_at, purged_at FROM prodesk_clients WHERE user_id = ? AND therapist_id = ?',
        [userId, therapist_id]
      );
      if (clientRow) clientRow.existed = true;
      // Someone the therapist deleted (still in the 30-day backup) books again: they come back as a NEW request to approve
      if (clientRow && clientRow.deleted_at && !clientRow.purged_at) {
        await conn.query("UPDATE prodesk_clients SET deleted_at = NULL, is_confirmed = 0, status = 'active' WHERE id = ?", [clientRow.id]);
      }
      if (!clientRow) {
        // A new person must give their age; under 18 needs the parent's OTP consent (DPDP)
        const ageNum = parseInt(age, 10);
        if (!ageNum || ageNum < 1 || ageNum > 120) { await conn.rollback(); return { status: false, code: 400, message: 'Please enter your age.', data: null }; }
        if (ageNum < 18) {
          const pc = await parentConsent.checkParentConsent({ therapist_id, consent_id: parent_consent_id, client_phone: phone });
          if (!pc.ok) { await conn.rollback(); return { status: false, code: 403, message: pc.response.message, data: pc.response.data }; }
        }
        const color = avatarColor(clientName || email);
        const [cRes] = await conn.query(
          `INSERT INTO prodesk_clients (user_id, therapist_id, age, presenting_concerns, default_fee, avatar_color, start_date, is_confirmed)
           VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 0)`,
          [userId, therapist_id, ageNum, concern || null, fee || 0, color]
        );
        clientRow = { id: cRes.insertId, existed: false };
        if (ageNum < 18) await parentConsent.attachParentConsent(parent_consent_id, cRes.insertId);
      }

      const client_id = clientRow.id;
      let priceInfo = null;
      if (svc) {
        priceInfo = await Catalog.resolvePrice(service_id, existingClientId(clientRow));
        fee = Math.round((priceInfo.price / svc.sessions_count) * 100) / 100;   // fee of ONE session
      }

      // Session number
      const [[{ cnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM prodesk_sessions WHERE client_id = ?', [client_id]);
      const sessionNum = cnt + 1;

      let purchase_id = null;
      if (svc) {
        const [pRes] = await conn.query(
          `INSERT INTO prodesk_service_purchases (therapist_id, client_id, service_id, sessions_total, price_paid, validity_days, status)
           VALUES (?, ?, ?, ?, ?, ?, 'pending_payment')`,
          [therapist_id, client_id, service_id, svc.sessions_count, priceInfo.price, svc.validity_days]
        );
        purchase_id = pRes.insertId;
      }
      const [sessRes] = await conn.query(
        `INSERT INTO prodesk_sessions (therapist_id, client_id, session_number, title, starts_at, duration_min, modality, fee, status, service_id, purchase_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [therapist_id, client_id, sessionNum, svc ? svc.name : `Session ${sessionNum}`, starts_at, duration_min, modality, fee || 0, svc ? service_id : null, purchase_id]
      );
      const session_id = sessRes.insertId;

      await conn.commit();
      touchClient(client_id); // new booking request: client moves to the top of the Clients list

      // Service booking: save the intake answers and the agreement, and open the invoice for "pay now"
      let pay_url = null, payment_error = null, pay_fallback = null;
      if (svc) {
        if (reqs.intake.needed && Array.isArray(intake_answers)) {
          await Intake.submitResponseService({ therapist_id, form_id: reqs.intake.form_id, client_id, purchase_id, answers: intake_answers });
        }
        if (reqs.consent.needed) {
          await Consent.recordAcceptance({ therapist_id, performed_by: 'client', consent_form_id: reqs.consent.consent_form_id, client_id, purchase_id, ip_address });
        }
        if (choice === 'now') {
          // A person the therapist's plan cannot take yet cannot be invoiced (same rule as everywhere): the request still goes
          // through, and the invoice follows when the therapist approves it.
          const gate = await planGuard.checkUseClient(therapist_id, client_id);
          if (!gate.ok) {
            choice = 'later';
            pay_fallback = 'The therapist has to approve your request first. Your invoice follows once they do.';
          } else {
            const inv = await Purchases.openInvoiceForPurchase({ therapist_id, client_id, session_id, purchase_id, svc, price: priceInfo.price, notify: false });
            if (inv && inv.status) {
              pay_url = await InvoicePay.payUrl(inv.data.id);
            } else payment_error = (inv && inv.message) || 'Could not open the payment';
          }
        }
      }
      planGuard.notifyPlanFullRequest(therapist_id, client_id); // background: nudge the therapist if their plan is full

      // Log the client's consent to the booking form (same audit trail the
      // superadmin dashboard's Consent Logs page shows for therapists).
      try {
        await recordConsentService({
          actor_type: 'client',
          actor_id: userId,
          therapist_id,
          email,
          consent_types: ['booking_consent'],
          ip_address,
          user_agent
        });
      } catch (e) { console.log('Consent log (non-blocking):', e.message); }

      // Formatted time for notifications
      const formattedTime = formatISTWallClock(starts_at);

      // No Meet link and no client confirmation yet — this is a request,
      // not a confirmed booking. Both happen once the therapist approves.

      // Email to therapist — new request awaiting approval
      try {
        await NotificationService.sendBookingRequestNotificationToTherapist({
          toEmail: therapist_email,
          toName: therapist_name,
          clientName,
          clientEmail: email,
          clientPhone: phone || '',
          sessionTime: formattedTime,
          modality,
          durationMin: duration_min,
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
            templateName: 'booking_request_therapist',
            variables: [
              therapist_name,                             // {{1}} Hi *{{1}}*
              clientName,                                 // {{2}} Client
              `${email}${phone ? ' / ' + phone : ''}`,   // {{3}} Contact
              formattedTime,                              // {{4}} Date & Time
              `${formatLabel} · ${duration_min} min`,    // {{5}} Format
            ],
            meta: { session_id }
          });
        } catch (e) { console.log('Therapist WhatsApp (non-blocking):', e.message); }
      }

      // Everything done on the public booking page is on record
      if (svc) {
        await Activity.record({
          actor_user_id: null, performed_by: 'client', module_name: 'booking_request', action: 'created',
          description: `Booking request from ${clientName} for "${svc.name}" (${choice === 'now' ? 'prepaid' : 'postpaid'}${pay_url ? ', payment link opened' : ''})`,
          meta: { therapist_id, session_id, purchase_id, service_id: Number(service_id), client_id, price: priceInfo.price, special_price: priceInfo.special,
                  payment_timing: choice === 'now' ? 'prepaid' : 'postpaid', modality, starts_at, intake_filled: !!(reqs && reqs.intake && reqs.intake.needed && Array.isArray(intake_answers)),
                  invoice_opened: !!pay_url, pay_fallback: pay_fallback || null, payment_error: payment_error || null },
        });
      }

      return {
        status: true, code: 200, message: 'Booking request sent',
        data: {
          session_id,
          therapist_name,
          client_name: clientName,
          starts_at,
          duration_min,
          modality,
          status: 'pending',
          formatted_time: formattedTime,
          ...(svc ? { purchase_id, price: priceInfo.price, special_price: priceInfo.special, payment_timing: choice === 'now' ? 'prepaid' : 'postpaid', pay_url, payment_error, pay_fallback } : {})
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
  createBookingSessionService,
  getPublicServicesService,
  getPublicBookingRequirementsService,
  sendBookingParentOtpService,
  verifyBookingParentOtpService
};
