const db = require('../../../config/db');

const validateOfferService = async ({ therapist_id, code, plan_id }) => {
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

    // Single source of truth for the discounted price — computed here, not on the client.
    let plan_amount = null, discount_amount = 0, final_amount = null;
    if (plan_id) {
      const [[plan]] = await db.query(`SELECT price_inr, billing_cycle FROM prodesk_plans WHERE id = ? AND is_active = 1`, [plan_id]);
      if (!plan) return { status: false, code: 404, message: 'Plan not found', data: null };
      if (offer.restricted_billing_cycle && offer.restricted_billing_cycle !== plan.billing_cycle) {
        return { status: false, code: 400, message: `This offer is valid for ${offer.restricted_billing_cycle} billing only`, data: null };
      }
      plan_amount = parseFloat(plan.price_inr);
      discount_amount = offer.is_percent
        ? Math.round(plan_amount * (parseFloat(offer.percent_discount) / 100))
        : 0; // flat-amount offers aren't in use yet — extend here if/when added
      final_amount = Math.max(0, plan_amount - discount_amount);
    }

    return {
      status: true, code: 200, message: 'Offer applied',
      data: {
        offer_id: offer.id, offer_code: offer.code, offer_name: offer.name,
        tag_name: offer.tag_name, is_percent: offer.is_percent,
        percent_discount: offer.percent_discount, payment_method: offer.payment_method,
        discount_duration: offer.discount_duration, discount_cycles: offer.discount_cycles,
        plan_id: plan_id || null, plan_amount, discount_amount, final_amount
      }
    };
  } catch (error) {
    console.log('Error in validateOfferService::>>', error);
    return null;
  }
};

module.exports = { validateOfferService };
