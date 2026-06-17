const { submitFeedbackService, getFaqService } = require('../../services/prodesk/feedbackService');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

class FeedbackController {
  static async submitFeedback(req, res) {
    try {
      const { subject, message, rating } = req.body;
      return respond(res, await submitFeedbackService({ therapist_id: req.user.therapist_id, subject, message, rating }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
  static async getFaq(req, res) {
    try {
      return respond(res, await getFaqService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = FeedbackController;
