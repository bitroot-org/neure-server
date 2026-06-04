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
              t.experience_years, t.registration_number, t.rating, t.is_active
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

    const [rows] = await db.query(
      'SELECT * FROM therapist_availability WHERE therapist_id = ?',
      [therapist_id]
    );

    return { status: true, code: 200, message: 'Availability fetched', data: rows[0] || null };
  } catch (error) {
    console.log('Error in getAvailabilityService::>>', error);
    return null;
  }
};

const updateAvailabilityService = async (payload) => {
  try {
    console.log('Payload in updateAvailabilityService::>>', payload);
    const { therapist_id, days, from_time, to_time, slot_minutes = 60, buffer_minutes = 0 } = payload;

    if (!days || !from_time || !to_time) {
      return { status: false, code: 400, message: 'days, from_time, to_time are required', data: null };
    }

    await db.query(
      `INSERT INTO therapist_availability (therapist_id, days, from_time, to_time, slot_minutes, buffer_minutes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         days = VALUES(days), from_time = VALUES(from_time), to_time = VALUES(to_time),
         slot_minutes = VALUES(slot_minutes), buffer_minutes = VALUES(buffer_minutes)`,
      [therapist_id, JSON.stringify(days), from_time, to_time, slot_minutes, buffer_minutes]
    );

    return getAvailabilityService({ therapist_id });
  } catch (error) {
    console.log('Error in updateAvailabilityService::>>', error);
    return null;
  }
};

const getBrandingService = async (payload) => {
  try {
    console.log('Payload in getBrandingService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      'SELECT * FROM therapist_branding WHERE therapist_id = ?',
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
    const { therapist_id, ...data } = payload;

    const fields = ['brand_name', 'theme', 'accent', 'background_preset', 'logo_url', 'custom_background_url'];
    const setClause = []; const vals = [];
    for (const f of fields) {
      if (data[f] !== undefined) { setClause.push(`${f} = ?`); vals.push(data[f]); }
    }

    if (!setClause.length) {
      return { status: false, code: 400, message: 'No fields to update', data: null };
    }

    const insertFields = setClause.map(s => s.split(' = ')[0]);
    const insertVals = [...vals];

    await db.query(
      `INSERT INTO therapist_branding (therapist_id, ${insertFields.join(', ')})
       VALUES (?, ${insertFields.map(() => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${setClause.join(', ')}`,
      [therapist_id, ...insertVals, ...vals]
    );

    return getBrandingService({ therapist_id });
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

module.exports = {
  getProfileService,
  updateProfileService,
  getAvailabilityService,
  updateAvailabilityService,
  getBrandingService,
  updateBrandingService,
  uploadLogoService,
  getDocumentsService,
  uploadDocumentService,
  deleteDocumentService,
  getBookingLinkService
};
