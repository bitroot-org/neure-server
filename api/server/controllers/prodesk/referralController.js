const { getReferralService, getReferralHistoryService } = require('../../services/prodesk/referralService');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

class ReferralController {
  static async getReferral(req, res) {
    try {
      return respond(res, await getReferralService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getReferralHistory(req, res) {
    try {
      const { page, limit } = req.body;
      return respond(res, await getReferralHistoryService({ therapist_id: req.user.therapist_id, page, limit }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ReferralController;
