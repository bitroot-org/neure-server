const {
  createQuickNoteSessionService,
  discardEmptyQuickSessionService,
  createSessionService,
  createSessionBatchService,
  getSessionsService,
  getSessionByIdService,
  updateSessionService,
  rescheduleSessionService,
  cancelSessionService,
  completeSessionService,
  getCalendarSessionsService,
  getTodaySessionsService,
  getMeetingRoomService,
  sendSessionReminderService,
  getSlotsService,
  deleteSessionService,
  approveBookingRequestService,
  declineBookingRequestService
} = require('../../services/prodesk/sessionService');
const { getReminderSettingService, updateReminderSettingService } = require('../../services/prodesk/clientReminderService');
const { convertDatesToIST } = require('../../utils/dateHelper');
const Activity = require('../../services/prodesk/activityLogService');
const db = require('../../../config/db');

// Session activity log. What the event is about goes in meta (session / client / service / purchase ids).
// Best effort: logging must never change the response of the real action.
const sessionRow = async (session_id, therapist_id) => {
  try {
    const [[r]] = await db.query(
      'SELECT id, client_id, service_id, purchase_id, starts_at, status, modality FROM prodesk_sessions WHERE id = ? AND therapist_id = ?', [session_id, therapist_id]);
    return r || null;
  } catch (_) { return null; }
};
const logSession = async (req, action, description, session, extra = {}) => {
  if (!session) return;
  await Activity.record({
    actor_user_id: req.user.user_id, module_name: 'session', action, description,
    meta: { therapist_id: req.user.therapist_id, session_id: session.id, client_id: session.client_id, service_id: session.service_id || null, purchase_id: session.purchase_id || null, ...extra },
  });
};

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskSessionController {
  static async getReminderSetting(req, res) {
    try {
      return respond(res, await getReminderSettingService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateReminderSetting(req, res) {
    try {
      return respond(res, await updateReminderSettingService({ therapist_id: req.user.therapist_id, offsets: req.body.offsets, email: req.body.email !== false, whatsapp: req.body.whatsapp !== false }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createSessionBatch(req, res) {
    try {
      const result = await createSessionBatchService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createQuickNoteSession(req, res) {
    try {
      const result = await createQuickNoteSessionService({ therapist_id: req.user.therapist_id, client_id: req.body.client_id, modality: req.body.modality });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async discardQuickNoteSession(req, res) {
    try {
      const result = await discardEmptyQuickSessionService({ therapist_id: req.user.therapist_id, session_id: req.body.session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createSession(req, res) {
    try {
      const result = await createSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      if (result && result.status) await logSession(req, 'created', `Session booked for ${result.data.starts_at}`, result.data, { starts_at: result.data.starts_at, modality: result.data.modality, fee: result.data.fee });
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
      if (result && result.status) await logSession(req, 'updated', 'Session details updated', await sessionRow(req.body.session_id, req.user.therapist_id), { changed: Object.keys(req.body).filter((k) => !['session_id', 'therapist_id'].includes(k)) });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async rescheduleSession(req, res) {
    try {
      const { session_id, starts_at } = req.body;
      if (!session_id || !starts_at) return res.status(400).json({ status: false, code: 400, message: 'session_id and starts_at required', data: null });
      const before = await sessionRow(session_id, req.user.therapist_id);
      const result = await rescheduleSessionService({ therapist_id: req.user.therapist_id, ...req.body });
      if (result && result.status) await logSession(req, 'rescheduled', `Session moved to ${starts_at}`, await sessionRow(session_id, req.user.therapist_id), { from: before && before.starts_at, to: starts_at });
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
      if (result && result.status) await logSession(req, 'cancelled', 'Session cancelled', await sessionRow(session_id, req.user.therapist_id), { reason: req.body.reason || null });
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
      if (result && result.status) await logSession(req, req.body.no_show ? 'no_show' : 'completed', req.body.no_show ? 'Session marked no-show' : 'Session marked completed', await sessionRow(session_id, req.user.therapist_id));
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
  static async getSlots(req, res) {
    try {
      const { date, session_duration, modality } = req.body;
      const result = await getSlotsService({ therapist_id: req.user.therapist_id, date, session_duration, modality });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async deleteSession(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const before = await sessionRow(session_id, req.user.therapist_id);
      const result = await deleteSessionService({ therapist_id: req.user.therapist_id, session_id });
      if (result && result.status) await logSession(req, 'deleted', 'Session deleted', before, { starts_at: before && before.starts_at, status_was: before && before.status });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async approveBookingRequest(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await approveBookingRequestService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async declineBookingRequest(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await declineBookingRequestService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskSessionController;
