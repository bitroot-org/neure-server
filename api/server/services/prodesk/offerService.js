const db = require('../../../config/db');

const validateOfferService = async ({ therapist_id, code }) => {
  try {
    if (!code) return { status: false, code: 400, message: 'code is required', data: null };

    const [[offer]] = await db.query(
      `SELECT po.*, pt.name AS tag_name FROM prodesk_offers po
       JOIN prodesk_offer_tags pt ON po.tag_id = pt.id
       WHERE po.code = ? AND po.is_active = 1 AND po.valid_from <= NOW() AND po.valid_till >= NOW()`,
      [code.toUpperCase().trim()]
    );
    if (!offer) return { status: false, code: 400, message: 'Invalid or expired offer code', data: null };

    if (offer.total_max_uses !== null && offer.total_used >= offer.total_max_uses) {
      return { status: false, code: 400, message: 'This offer code has reached its maximum usage limit', data: null };
    }

    if (offer.is_email_restricted) {
      const [[therapistRow]] = await db.query(
        `SELECT u.email FROM therapists t JOIN users u ON t.user_id = u.user_id WHERE t.id = ?`, [therapist_id]
      );
      if (!therapistRow) return { status: false, code: 404, message: 'Therapist not found', data: null };

      const [[emailRow]] = await db.query(
        `SELECT is_used FROM prodesk_offer_emails WHERE offer_id = ? AND email = ?`,
        [offer.id, therapistRow.email.toLowerCase()]
      );
      if (!emailRow) return { status: false, code: 400, message: 'Not valid for your email ID', data: null };
      if (emailRow.is_used) return { status: false, code: 400, message: 'This code has already been used for your email', data: null };
    } else {
      const [[alreadyUsed]] = await db.query(
        `SELECT id FROM prodesk_user_offers WHERE offer_id = ? AND therapist_id = ? AND is_redeemed = 1`,
        [offer.id, therapist_id]
      );
      if (alreadyUsed) return { status: false, code: 400, message: 'You have already used this offer code', data: null };
    }

    return {
      status: true, code: 200, message: 'Offer applied',
      data: {
        offer_id: offer.id, offer_code: offer.code, offer_name: offer.name,
        tag_name: offer.tag_name, is_percent: offer.is_percent,
        percent_discount: offer.percent_discount,
        pricing_type: offer.tag_name === 'early_access' ? 'early_access' : 'full_version'
      }
    };
  } catch (error) {
    console.log('Error in validateOfferService::>>', error);
    return null;
  }
};

module.exports = { validateOfferService };
