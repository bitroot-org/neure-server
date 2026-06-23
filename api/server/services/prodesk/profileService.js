const db = require('../../../config/db');

const toSlugBase = (firstName, lastName) =>
  `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const uniqueSlug = async (base, excludeId = null) => {
  let slug = base;
  let i = 2;
  while (true) {
    const query = excludeId
      ? 'SELECT id FROM therapists WHERE booking_slug = ? AND id != ?'
      : 'SELECT id FROM therapists WHERE booking_slug = ?';
    const params = excludeId ? [slug, excludeId] : [slug];
    const [rows] = await db.query(query, params);
    if (!rows || !rows.length) return slug;
    slug = `${base}-${i++}`;
  }
};

const getProfileService = async (payload) => {
  try {
    console.log('Payload in getProfileService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT u.user_id, u.email, u.phone, u.first_name, u.last_name, u.gender,
              u.date_of_birth, u.age, u.city, u.profile_url, u.job_title,
              u.accepted_terms, u.has_seen_dashboard_tour, u.last_login,
              t.id AS therapist_id, t.bio, t.specialization, t.years_of_experience,
              t.designation, t.qualification, t.booking_slug, t.about_me,
              t.experience_years, t.registration_number, t.rating, t.is_active,
              t.onboarding_completed, t.onboarding_step
       FROM users u
       JOIN therapists t ON t.user_id = u.user_id
       WHERE t.id = ?`,
      [therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Profile not found', data: null };
    }

    return { status: true, code: 200, message: 'Profile fetched', data: rows[0] };
  } catch (error) {
    console.log('Error in getProfileService::>>', error);
    return null;
  }
};

const updateProfileService = async (payload) => {
  try {
    console.log('Payload in updateProfileService::>>', payload);
    const { therapist_id, profile_url, ...data } = payload;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [thRow] = await conn.query('SELECT user_id FROM therapists WHERE id = ?', [therapist_id]);
      const userId = thRow[0].user_id;

      const userMap = {
        first_name: data.first_name, last_name: data.last_name,
        email: data.email, phone: data.phone, gender: data.gender,
        date_of_birth: data.date_of_birth, city: data.city,
        job_title: data.job_title, profile_url
      };
      const uFields = []; const uVals = [];
      for (const [k, v] of Object.entries(userMap)) {
        if (v !== undefined) { uFields.push(`${k} = ?`); uVals.push(v); }
      }
      if (uFields.length) {
        uVals.push(userId);
        await conn.query(`UPDATE users SET ${uFields.join(', ')} WHERE user_id = ?`, uVals);
      }

      const thMap = {
        bio: data.bio, specialization: data.specialization,
        years_of_experience: data.years_of_experience, designation: data.designation,
        qualification: data.qualification, about_me: data.about_me,
        experience_years: data.experience_years, registration_number: data.registration_number
      };
      const tFields = []; const tVals = [];
      for (const [k, v] of Object.entries(thMap)) {
        if (v !== undefined) { tFields.push(`${k} = ?`); tVals.push(v); }
      }

      if (data.first_name || data.last_name) {
        const [cur] = await conn.query(
          'SELECT u.first_name, u.last_name FROM therapists t JOIN users u ON u.user_id = t.user_id WHERE t.id = ?',
          [therapist_id]
        );
        const fn = data.first_name || cur[0].first_name;
        const ln = data.last_name || cur[0].last_name;
        const newSlug = await uniqueSlug(toSlugBase(fn, ln), therapist_id);
        tFields.push('booking_slug = ?');
        tVals.push(newSlug);
      }

      if (tFields.length) {
        tVals.push(therapist_id);
        await conn.query(`UPDATE therapists SET ${tFields.join(', ')} WHERE id = ?`, tVals);
      }

      await conn.commit();
      return getProfileService({ therapist_id });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in updateProfileService::>>', error);
    return null;
  }
};

const getAvailabilityService = async (payload) => {
  try {
    console.log('Payload in getAvailabilityService::>>', payload);
    const { therapist_id } = payload;

    const [[settings]] = await db.query(
      'SELECT slot_minutes, buffer_minutes FROM therapist_availability WHERE therapist_id = ?',
      [therapist_id]
    );

    const [blockRows] = await db.query(
      'SELECT day, from_time, to_time FROM therapist_availability_blocks WHERE therapist_id = ? ORDER BY FIELD(day,"Mon","Tue","Wed","Thu","Fri","Sat","Sun"), from_time',
      [therapist_id]
    );

    // Group blocks by day: { Mon: [{from:"09:00",to:"11:00"}, ...], ... }
    const blocks = {};
    for (const row of (blockRows || [])) {
      if (!blocks[row.day]) blocks[row.day] = [];
      blocks[row.day].push({ from: row.from_time.slice(0, 5), to: row.to_time.slice(0, 5) });
    }

    return {
      status: true, code: 200, message: 'Availability fetched',
      data: {
        blocks,
        slot_minutes: settings?.slot_minutes ?? 60,
        buffer_minutes: settings?.buffer_minutes ?? 0
      }
    };
  } catch (error) {
    console.log('Error in getAvailabilityService::>>', error);
    return null;
  }
};

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const updateAvailabilityService = async (payload) => {
  try {
    console.log('Payload in updateAvailabilityService::>>', payload);
    const { therapist_id, blocks, slot_minutes = 60, buffer_minutes = 0 } = payload;

    if (!blocks || typeof blocks !== 'object') {
      return { status: false, code: 400, message: 'blocks object is required', data: null };
    }

    // Upsert therapist-level settings (slot_minutes, buffer_minutes)
    await db.query(
      `INSERT INTO therapist_availability (therapist_id, slot_minutes, buffer_minutes)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE slot_minutes = VALUES(slot_minutes), buffer_minutes = VALUES(buffer_minutes)`,
      [therapist_id, slot_minutes, buffer_minutes]
    );

    // Replace all blocks for this therapist
    await db.query('DELETE FROM therapist_availability_blocks WHERE therapist_id = ?', [therapist_id]);

    const insertRows = [];
    for (const [day, dayBlocks] of Object.entries(blocks)) {
      if (!VALID_DAYS.includes(day)) continue;
      for (const block of (dayBlocks || [])) {
        if (block.from && block.to && block.from < block.to) {
          insertRows.push([therapist_id, day, block.from, block.to]);
        }
      }
    }

    if (insertRows.length) {
      await db.query(
        'INSERT IGNORE INTO therapist_availability_blocks (therapist_id, day, from_time, to_time) VALUES ?',
        [insertRows]
      );
    }

    return getAvailabilityService({ therapist_id });
  } catch (error) {
    console.log('Error in updateAvailabilityService::>>', error);
    return null;
  }
};

const VALID_ACCENTS          = ['sage','slate','plum','bronze','clay'];
const VALID_GRADIENTS        = ['mist','linen','tide','dusk','mono'];
const VALID_WALLPAPERS       = ['misty_peaks','warm_dusk','ocean_calm','forest_fog'];
const VALID_THEMES           = ['dark','light'];
const VALID_BG_TYPES         = ['gradient','preset_wallpaper','custom_wallpaper'];

const getBrandingService = async (payload) => {
  try {
    console.log('Payload in getBrandingService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT brand_name, theme, accent, background_type, background_preset,
              wallpaper_id, wallpaper_url, logo_url, invoice_prefix
       FROM therapist_branding WHERE therapist_id = ?`,
      [therapist_id]
    );

    return { status: true, code: 200, message: 'Branding fetched', data: rows[0] || null };
  } catch (error) {
    console.log('Error in getBrandingService::>>', error);
    return null;
  }
};

const updateBrandingService = async (payload) => {
  try {
    console.log('Payload in updateBrandingService::>>', payload);
    const { therapist_id, brand_name, theme, accent, background_type,
            background_preset, wallpaper_id, wallpaper_url, logo_url, invoice_prefix } = payload;

    // Validations
    if (theme && !VALID_THEMES.includes(theme))
      return { status: false, code: 400, message: `Invalid theme. Allowed: ${VALID_THEMES.join(', ')}`, data: null };
    if (accent && !VALID_ACCENTS.includes(accent))
      return { status: false, code: 400, message: `Invalid accent. Allowed: ${VALID_ACCENTS.join(', ')}`, data: null };
    if (background_type && !VALID_BG_TYPES.includes(background_type))
      return { status: false, code: 400, message: `Invalid background_type. Allowed: ${VALID_BG_TYPES.join(', ')}`, data: null };
    if (background_type === 'gradient' && background_preset && !VALID_GRADIENTS.includes(background_preset))
      return { status: false, code: 400, message: `Invalid background_preset. Allowed: ${VALID_GRADIENTS.join(', ')}`, data: null };
    if (background_type === 'preset_wallpaper' && wallpaper_id && !VALID_WALLPAPERS.includes(wallpaper_id))
      return { status: false, code: 400, message: `Invalid wallpaper_id. Allowed: ${VALID_WALLPAPERS.join(', ')}`, data: null };

    // Enforce background_type exclusivity — null out unused fields
    let finalPreset     = background_preset || null;
    let finalWallpaperId  = wallpaper_id || null;
    let finalWallpaperUrl = wallpaper_url || null;

    if (background_type === 'gradient')         { finalWallpaperId = null; finalWallpaperUrl = null; }
    if (background_type === 'preset_wallpaper') { finalPreset = null; finalWallpaperUrl = null; }
    if (background_type === 'custom_wallpaper') { finalPreset = null; finalWallpaperId = null; }

    const setClause = [];
    const vals = [];
    const addField = (col, val) => { setClause.push(`${col} = ?`); vals.push(val); };

    if (brand_name      !== undefined) addField('brand_name',        brand_name);
    if (theme           !== undefined) addField('theme',             theme);
    if (accent          !== undefined) addField('accent',            accent);
    if (background_type !== undefined) addField('background_type',   background_type);
    if (background_type !== undefined) addField('background_preset', finalPreset);
    if (background_type !== undefined) addField('wallpaper_id',      finalWallpaperId);
    if (background_type !== undefined) addField('wallpaper_url',     finalWallpaperUrl);
    if (logo_url        !== undefined) addField('logo_url',          logo_url);
    if (invoice_prefix  !== undefined) addField('invoice_prefix',    invoice_prefix);

    if (!setClause.length)
      return { status: false, code: 400, message: 'No fields to update', data: null };

    const insertFields = setClause.map(s => s.split(' = ')[0]);
    await db.query(
      `INSERT INTO therapist_branding (therapist_id, ${insertFields.join(', ')})
       VALUES (?, ${insertFields.map(() => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${setClause.join(', ')}`,
      [therapist_id, ...vals, ...vals]
    );

    return { status: true, code: 200, message: 'Branding updated', data: null };
  } catch (error) {
    console.log('Error in updateBrandingService::>>', error);
    return null;
  }
};

const uploadLogoService = async (payload) => {
  try {
    console.log('Payload in uploadLogoService::>>', payload);
    const { therapist_id, logo_url } = payload;

    await db.query(
      `INSERT INTO therapist_branding (therapist_id, logo_url) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE logo_url = ?`,
      [therapist_id, logo_url, logo_url]
    );

    return { status: true, code: 200, message: 'Logo uploaded', data: { logo_url } };
  } catch (error) {
    console.log('Error in uploadLogoService::>>', error);
    return null;
  }
};

const uploadWallpaperService = async (payload) => {
  try {
    console.log('Payload in uploadWallpaperService::>>', payload);
    const { therapist_id, wallpaper_url } = payload;

    await db.query(
      `INSERT INTO therapist_branding (therapist_id, wallpaper_url) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE wallpaper_url = ?`,
      [therapist_id, wallpaper_url, wallpaper_url]
    );

    return { status: true, code: 200, message: 'Wallpaper uploaded', data: { wallpaper_url } };
  } catch (error) {
    console.log('Error in uploadWallpaperService::>>', error);
    return null;
  }
};

const getDocumentsService = async (payload) => {
  try {
    console.log('Payload in getDocumentsService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      'SELECT * FROM therapist_documents WHERE therapist_id = ? ORDER BY created_at DESC',
      [therapist_id]
    );

    return { status: true, code: 200, message: 'Documents fetched', data: rows || [] };
  } catch (error) {
    console.log('Error in getDocumentsService::>>', error);
    return null;
  }
};

const uploadDocumentService = async (payload) => {
  try {
    console.log('Payload in uploadDocumentService::>>', payload);
    const { therapist_id, type, file_url } = payload;

    if (!['agreement', 'consent', 'certification'].includes(type)) {
      return { status: false, code: 400, message: 'Invalid document type. Must be agreement, consent, or certification', data: null };
    }

    if (type !== 'certification') {
      await db.query(
        'DELETE FROM therapist_documents WHERE therapist_id = ? AND type = ?',
        [therapist_id, type]
      );
    }

    const [result] = await db.query(
      'INSERT INTO therapist_documents (therapist_id, type, file_url) VALUES (?, ?, ?)',
      [therapist_id, type, file_url]
    );

    return {
      status: true, code: 201, message: 'Document uploaded',
      data: { id: result.insertId, therapist_id, type, file_url }
    };
  } catch (error) {
    console.log('Error in uploadDocumentService::>>', error);
    return null;
  }
};

const deleteDocumentService = async (payload) => {
  try {
    console.log('Payload in deleteDocumentService::>>', payload);
    const { therapist_id, document_id } = payload;

    const [rows] = await db.query(
      'SELECT id FROM therapist_documents WHERE id = ? AND therapist_id = ?',
      [document_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Document not found', data: null };
    }

    await db.query('DELETE FROM therapist_documents WHERE id = ?', [document_id]);
    return { status: true, code: 200, message: 'Document deleted', data: null };
  } catch (error) {
    console.log('Error in deleteDocumentService::>>', error);
    return null;
  }
};

const getBookingLinkService = async (payload) => {
  try {
    console.log('Payload in getBookingLinkService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      'SELECT booking_slug FROM therapists WHERE id = ?',
      [therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Therapist not found', data: null };
    }

    const slug = rows[0].booking_slug;
    const baseUrl = process.env.PRODESK_PUBLIC_URL || 'https://prodesk.neure.health';

    return {
      status: true, code: 200, message: 'Booking link fetched',
      data: { slug, url: `${baseUrl}/book/${slug}`, is_live: !!slug }
    };
  } catch (error) {
    console.log('Error in getBookingLinkService::>>', error);
    return null;
  }
};

const completeOnboardingService = async ({ therapist_id }) => {
  try {
    await db.query(
      'UPDATE therapists SET onboarding_completed = 1, onboarding_step = 6 WHERE id = ?',
      [therapist_id]
    );
    return { status: true, code: 200, message: 'Onboarding marked complete', data: null };
  } catch (error) {
    console.log('Error in completeOnboardingService::>>', error);
    return null;
  }
};

const updateOnboardingStepService = async ({ therapist_id, step }) => {
  try {
    const stepNum = parseInt(step);
    if (isNaN(stepNum) || stepNum < 0 || stepNum > 6) {
      return { status: false, code: 400, message: 'step must be between 0 and 6', data: null };
    }
    await db.query(
      'UPDATE therapists SET onboarding_step = ? WHERE id = ?',
      [stepNum, therapist_id]
    );
    return { status: true, code: 200, message: 'Onboarding step updated', data: { onboarding_step: stepNum } };
  } catch (error) {
    console.log('Error in updateOnboardingStepService::>>', error);
    return null;
  }
};

module.exports = {
  getProfileService,
  updateProfileService,
  getAvailabilityService,
  updateAvailabilityService,
  getBrandingService,
  updateBrandingService,
  uploadLogoService,
  uploadWallpaperService,
  getDocumentsService,
  uploadDocumentService,
  deleteDocumentService,
  getBookingLinkService,
  completeOnboardingService,
  updateOnboardingStepService
};
