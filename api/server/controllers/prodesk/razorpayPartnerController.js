const {
  getConnectUrlService,
  handleOAuthCallbackService,
  getConnectionStatusService,
  disconnectService,
  verifyPartnerWebhookSignature,
  handlePartnerWebhookService,
} = require('../../services/prodesk/razorpayPartnerService');

const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class RazorpayPartnerController {
  static async getConnectUrl(req, res) {
    try {
      return respond(res, await getConnectUrlService({ therapist_id: req.user.therapist_id }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async getConnectionStatus(req, res) {
    try {
      return respond(res, await getConnectionStatusService({ therapist_id: req.user.therapist_id }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async disconnect(req, res) {
    try {
      return respond(res, await disconnectService({ therapist_id: req.user.therapist_id }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  // Browser redirect from Razorpay — no auth header, trust comes from the signed `state`.
  static async oauthCallback(req, res) {
    try {
      const { code, state, error } = req.query;
      const result = await handleOAuthCallbackService({ code, state, error });
      const base = result.cfg?.frontendReturnUrl;
      if (!base) return res.status(result.ok ? 200 : 400).send(result.ok ? 'Razorpay connected. You can close this tab.' : `Razorpay connection failed: ${result.reason}`);
      const sep = base.includes('?') ? '&' : '?';
      return res.redirect(`${base}${sep}razorpay=${result.ok ? 'connected' : 'error'}${result.ok ? '' : `&reason=${encodeURIComponent(result.reason)}`}`);
    } catch (e) {
      console.log('Error in oauthCallback::>>', e);
      return res.status(500).send('Razorpay connection failed');
    }
  }

  // Body arrives raw (express.raw in index.js) so the HMAC is computed on the exact bytes.
  static async partnerWebhook(req, res) {
    try {
      const raw = req.body;
      const valid = await verifyPartnerWebhookSignature(raw, req.headers['x-razorpay-signature']);
      if (!valid) return res.status(400).json({ status: false, message: 'Invalid signature' });
      await handlePartnerWebhookService(JSON.parse(raw.toString('utf8')));
      return res.status(200).json({ status: true });
    } catch (e) {
      console.log('Error in partnerWebhook::>>', e);
      return res.status(500).json({ status: false, message: 'Webhook error' });
    }
  }
}

module.exports = RazorpayPartnerController;
