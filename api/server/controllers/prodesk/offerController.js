const { validateOfferService } = require('../../services/prodesk/offerService');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

class OfferController {
  static async validateOffer(req, res) {
    try {
      const { code } = req.body;
      return respond(res, await validateOfferService({ therapist_id: req.user.therapist_id, code }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = OfferController;
