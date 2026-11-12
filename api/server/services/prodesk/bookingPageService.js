const db = require('../../../config/db');
const Activity = require('./activityLogService');

// ─── Content of the therapist's public booking page: gallery photos and client reviews ─────
// (Name, photo, about, specialisation, experience, age and address are edited on the Profile page.)

const MAX_GALLERY = 12;
const MAX_REVIEWS = 30;
const bad = (code, message) => ({ status: false, code, message, data: null });

// Only pictures we stored ourselves (uploaded through this app) can go in the gallery
const ownImage = (url) => typeof url === 'string' && url.startsWith(`https://${process.env.AWS_BUCKET_NAME}.s3.`) && url.length <= 500;

const getBookingPageContentService = async ({ therapist_id }) => {
  try {
    const [gallery] = await db.query('SELECT id, image_url, sort_order FROM therapist_gallery WHERE therapist_id = ? ORDER BY sort_order, id', [therapist_id]);
    const [reviews] = await db.query('SELECT id, reviewer_name, body, rating, is_visible, created_at FROM therapist_reviews WHERE therapist_id = ? ORDER BY id DESC', [therapist_id]);
    return { status: true, code: 200, message: 'Booking page content', data: { gallery, reviews: reviews.map((r) => ({ ...r, is_visible: !!r.is_visible })), limits: { gallery: MAX_GALLERY, reviews: MAX_REVIEWS } } };
  } catch (error) {
    console.log('Error in getBookingPageContentService::>>', error);
    return null;
  }
};

const addGalleryImageService = async ({ therapist_id, actor_user_id, image_url }) => {
  try {
    if (!ownImage(image_url)) return bad(400, 'The picture must be uploaded through this app');
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM therapist_gallery WHERE therapist_id = ?', [therapist_id]);
    if (n >= MAX_GALLERY) return bad(409, `The gallery can hold up to ${MAX_GALLERY} pictures. Remove one first.`);
    const [[{ next }]] = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM therapist_gallery WHERE therapist_id = ?', [therapist_id]);
    const [r] = await db.query('INSERT INTO therapist_gallery (therapist_id, image_url, sort_order) VALUES (?, ?, ?)', [therapist_id, image_url, next]);
    await Activity.record({ actor_user_id, module_name: 'booking_page', action: 'gallery_added', description: 'Added a picture to the gallery', meta: { therapist_id, image_id: r.insertId } });
    return { status: true, code: 201, message: 'Picture added', data: { id: r.insertId, image_url, sort_order: next } };
  } catch (error) {
    console.log('Error in addGalleryImageService::>>', error);
    return null;
  }
};

const deleteGalleryImageService = async ({ therapist_id, actor_user_id, image_id }) => {
  try {
    const [rows] = await db.query('SELECT id, image_url FROM therapist_gallery WHERE id = ? AND therapist_id = ?', [image_id, therapist_id]);
    if (!rows || !rows.length) return bad(404, 'Picture not found');
    await db.query('DELETE FROM therapist_gallery WHERE id = ?', [image_id]);
    await Activity.record({ actor_user_id, module_name: 'booking_page', action: 'gallery_removed', description: 'Removed a picture from the gallery', meta: { therapist_id, image_id: Number(image_id) } });
    return { status: true, code: 200, message: 'Picture removed', data: { id: Number(image_id), image_url: rows[0].image_url } };
  } catch (error) {
    console.log('Error in deleteGalleryImageService::>>', error);
    return null;
  }
};

// review_id present = edit, absent = add
const saveReviewService = async ({ therapist_id, actor_user_id, review_id, reviewer_name, body, rating, is_visible = true }) => {
  try {
    const name = String(reviewer_name || '').trim();
    const text = String(body || '').trim();
    if (!name) return bad(400, "Add the client's name (a first name or initials is fine)");
    if (name.length > 100) return bad(400, 'The name is too long');
    if (!text) return bad(400, 'Write the review');
    if (text.length > 1000) return bad(400, 'The review is too long (max 1000 characters)');
    let stars = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      stars = Number(rating);
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) return bad(400, 'Rating must be a whole number from 1 to 5');
    }
    const visible = is_visible === false || is_visible === 0 || is_visible === '0' || is_visible === 'false' ? 0 : 1;

    if (review_id) {
      const [rows] = await db.query('SELECT id FROM therapist_reviews WHERE id = ? AND therapist_id = ?', [review_id, therapist_id]);
      if (!rows || !rows.length) return bad(404, 'Review not found');
      await db.query('UPDATE therapist_reviews SET reviewer_name = ?, body = ?, rating = ?, is_visible = ? WHERE id = ?', [name, text, stars, visible, review_id]);
      await Activity.record({ actor_user_id, module_name: 'booking_page', action: 'review_updated', description: `Updated the review by ${name}`, meta: { therapist_id, review_id: Number(review_id) } });
      return { status: true, code: 200, message: 'Review updated', data: { id: Number(review_id) } };
    }
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM therapist_reviews WHERE therapist_id = ?', [therapist_id]);
    if (n >= MAX_REVIEWS) return bad(409, `You can keep up to ${MAX_REVIEWS} reviews. Remove one first.`);
    const [r] = await db.query('INSERT INTO therapist_reviews (therapist_id, reviewer_name, body, rating, is_visible) VALUES (?, ?, ?, ?, ?)', [therapist_id, name, text, stars, visible]);
    await Activity.record({ actor_user_id, module_name: 'booking_page', action: 'review_added', description: `Added a review by ${name}`, meta: { therapist_id, review_id: r.insertId } });
    return { status: true, code: 201, message: 'Review added', data: { id: r.insertId } };
  } catch (error) {
    console.log('Error in saveReviewService::>>', error);
    return null;
  }
};

const deleteReviewService = async ({ therapist_id, actor_user_id, review_id }) => {
  try {
    const [rows] = await db.query('SELECT reviewer_name FROM therapist_reviews WHERE id = ? AND therapist_id = ?', [review_id, therapist_id]);
    if (!rows || !rows.length) return bad(404, 'Review not found');
    await db.query('DELETE FROM therapist_reviews WHERE id = ?', [review_id]);
    await Activity.record({ actor_user_id, module_name: 'booking_page', action: 'review_removed', description: `Removed the review by ${rows[0].reviewer_name}`, meta: { therapist_id, review_id: Number(review_id) } });
    return { status: true, code: 200, message: 'Review removed', data: null };
  } catch (error) {
    console.log('Error in deleteReviewService::>>', error);
    return null;
  }
};

module.exports = { getBookingPageContentService, addGalleryImageService, deleteGalleryImageService, saveReviewService, deleteReviewService, MAX_GALLERY, MAX_REVIEWS };
