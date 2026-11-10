const {
  getBankAccountService,
  createBankAccountService,
  updateBankAccountService,
  deleteBankAccountService,
  saveDirectPaymentService,
  verifyIFSCService,
  adminGetAllBankAccountsService,
  adminGetBankAccountByIdService,
  adminGetBankAccountLogsService,
} = require('../../services/prodesk/bankAccountService');

const { uploadImage } = require('../upload/UploadController');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

// x-forwarded-for is set by nginx/load balancer in production (real client IP)
// req.ip is ::1 on localhost — strip IPv6 prefix if present
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip.replace(/^::ffff:/, ''); // strip IPv6-mapped IPv4 prefix
};

// Therapist-facing responses: shift UTC timestamps to IST like the rest of ProDesk (admin responses stay untouched)
const respondIST = (res, result) => respond(res, result && { ...result, data: convertDatesToIST(result.data) });

class BankAccountController {

  // ── Therapist-facing ──────────────────────────────────────────────────────

  static async getBankAccount(req, res) {
    try {
      return respondIST(res, await getBankAccountService({ therapist_id: req.user.therapist_id }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async saveDirectPayment(req, res) {
    try {
      const { upi_id, direct_pay_enabled } = req.body;
      return respondIST(res, await saveDirectPaymentService({ therapist_id: req.user.therapist_id, upi_id, direct_pay_enabled }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async uploadPaymentQr(req, res) {
    try {
      if (!req.file || !req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ status: false, code: 400, message: 'QR image file is required', data: null });
      }
      req.body.type = 'profile';
      const uploaded = await uploadImage(req);
      if (!uploaded?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      return respondIST(res, await saveDirectPaymentService({ therapist_id: req.user.therapist_id, qr_url: uploaded.url }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async createBankAccount(req, res) {
    try {
      const { account_holder, account_number, account_number_confirm, ifsc_code, bank_name, branch_name, account_type } = req.body;
      if (!account_holder || !account_number || !account_number_confirm || !ifsc_code) {
        return res.status(400).json({ status: false, code: 400, message: 'account_holder, account_number, account_number_confirm and ifsc_code are required', data: null });
      }
      if (account_number.trim() !== account_number_confirm.trim()) {
        return res.status(400).json({ status: false, code: 400, message: 'Account numbers do not match', data: null });
      }
      return respondIST(res, await createBankAccountService({
        therapist_id: req.user.therapist_id,
        account_holder, account_number, ifsc_code, bank_name, branch_name, account_type,
        user_id: req.user.user_id,
        ip: getClientIP(req),
        user_agent: req.headers['user-agent'],
      }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async updateBankAccount(req, res) {
    try {
      const { account_holder, account_number, account_number_confirm, ifsc_code, bank_name, branch_name, account_type } = req.body;
      if (account_number && account_number !== account_number_confirm) {
        return res.status(400).json({ status: false, code: 400, message: 'Account numbers do not match', data: null });
      }
      return respondIST(res, await updateBankAccountService({
        therapist_id: req.user.therapist_id,
        account_holder, account_number, ifsc_code, bank_name, branch_name, account_type,
        user_id: req.user.user_id,
        ip: getClientIP(req),
        user_agent: req.headers['user-agent'],
      }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async deleteBankAccount(req, res) {
    try {
      return respond(res, await deleteBankAccountService({
        therapist_id: req.user.therapist_id,
        user_id: req.user.user_id,
        ip: getClientIP(req),
        user_agent: req.headers['user-agent'],
      }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async verifyIFSC(req, res) {
    try {
      const { ifsc_code } = req.body;
      return respond(res, await verifyIFSCService({ ifsc_code }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  // ── Admin-facing ──────────────────────────────────────────────────────────

  static async adminGetAllBankAccounts(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.body;
      return respond(res, await adminGetAllBankAccountsService({ page: parseInt(page), limit: parseInt(limit), search }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async adminGetBankAccountById(req, res) {
    try {
      const { therapist_id } = req.body;
      if (!therapist_id) return res.status(400).json({ status: false, code: 400, message: 'therapist_id is required', data: null });
      return respond(res, await adminGetBankAccountByIdService({ therapist_id }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }

  static async adminGetBankAccountLogs(req, res) {
    try {
      const { therapist_id, page = 1, limit = 20 } = req.body;
      if (!therapist_id) return res.status(400).json({ status: false, code: 400, message: 'therapist_id is required', data: null });
      return respond(res, await adminGetBankAccountLogsService({ therapist_id, page: parseInt(page), limit: parseInt(limit) }));
    } catch (e) { return res.status(500).json({ status: false, code: 500, message: e.message, data: null }); }
  }
}

module.exports = BankAccountController;
