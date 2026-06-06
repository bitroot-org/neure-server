const {
  createSessionService,
  getSessionsService,
  getSessionByIdService,
  updateSessionService,
  rescheduleSessionService,
  cancelSessionService,
  completeSessionService,
  getCalendarSessionsService,
  getTodaySessionsService,
  getMeetingRoomService,
  sendSessionReminderService
} = require('../../services/prodesk/sessionService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskSessionController {
  static async createSession(req, res) {
    try {
      const result = await createSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSessions(req, res) {
    try {
      const result = await getSessionsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSessionById(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await getSessionByIdService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateSession(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await updateSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async rescheduleSession(req, res) {
    try {
      const { session_id, starts_at } = req.body;
      if (!session_id || !starts_at) return res.status(400).json({ status: false, code: 400, message: 'session_id and starts_at required', data: null });
      const result = await rescheduleSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async cancelSession(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await cancelSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async completeSession(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await completeSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getCalendarSessions(req, res) {
    try {
      const result = await getCalendarSessionsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getTodaySessions(req, res) {
    try {
      const result = await getTodaySessionsService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getMeetingRoom(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await getMeetingRoomService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async sendSessionReminder(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await sendSessionReminderService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskSessionController;
