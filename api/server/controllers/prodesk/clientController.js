const {
  createClientService,
  getClientsService,
  getClientByIdService,
  updateClientService,
  archiveClientService,
  requestRecordHistoryUpdateService,
  setClientPhotoService,
  clientBelongsToTherapist
} = require('../../services/prodesk/clientService');
const { uploadImage } = require('../upload/UploadController');
const planGuard = require('../../services/prodesk/planGuard');
const { buildAllDataZip } = require('../../services/prodesk/dataExportService');
const { deleteClientService, getAccountDeletionStatusService, requestAccountDeletionService, cancelAccountDeletionService } = require('../../services/prodesk/privacyService');
const { getAccessLogsService } = require('../../services/prodesk/accessLogService');
const { sendParentOtpService, verifyParentOtpService } = require('../../services/prodesk/parentConsentService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const exportRuns = new Map();   // therapist_id -> { running, at }

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskClientController {
  // Plan, which clients are active / view-only, waiting requests and when the next swap is allowed
  static async getPlanAccess(req, res) {
    try {
      const data = await planGuard.getPlanOverview(req.user.therapist_id);
      return res.status(200).json({ status: true, code: 200, message: 'Plan access fetched', data });
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  // The therapist picks which clients are active on the Starter plan (once every 30 days)
  static async setActiveClients(req, res) {
    try {
      const result = await planGuard.setActiveClients(req.user.therapist_id, req.body.client_ids);
      if (!result.ok) return res.status(result.response.code).json(result.response);
      const data = await planGuard.getPlanOverview(req.user.therapist_id);
      return res.status(200).json({ status: true, code: 200, message: result.changed ? 'Active clients updated' : 'No change', data });
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadClientPhoto(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'Photo file is required (JPG, PNG or WebP)', data: null });
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype))
        return res.status(400).json({ status: false, code: 400, message: 'Only JPG, PNG or WebP images are allowed', data: null });
      if (req.file.size > 3 * 1024 * 1024)
        return res.status(400).json({ status: false, code: 400, message: 'Photo must be under 3 MB', data: null });
      const client_id = parseInt(req.body.client_id);
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id is required', data: null });
      if (!(await clientBelongsToTherapist(req.user.therapist_id, client_id)))
        return res.status(404).json({ status: false, code: 404, message: 'Client not found', data: null });
      req.body.type = 'profile';
      const uploadResult = await uploadImage(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await setClientPhotoService({ therapist_id: req.user.therapist_id, client_id, profile_url: uploadResult.url });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async removeClientPhoto(req, res) {
    try {
      const result = await setClientPhotoService({ therapist_id: req.user.therapist_id, client_id: parseInt(req.body.client_id), profile_url: null });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getAccountDeletionStatus(req, res) {
    try {
      return respond(res, await getAccountDeletionStatusService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async requestAccountDeletion(req, res) {
    try {
      return respond(res, await requestAccountDeletionService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async cancelAccountDeletion(req, res) {
    try {
      return respond(res, await cancelAccountDeletionService({ therapist_id: req.user.therapist_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async exportAllData(req, res) {
    // One download at a time per therapist, and not more often than every 30 seconds (it is heavy: it renders every note as a PDF)
    const key = req.user.therapist_id;
    const last = exportRuns.get(key);
    if (last && (last.running || Date.now() - last.at < 30000)) {
      return res.status(429).json({ status: false, code: 429, message: 'Your download is already being prepared. Please wait a moment and try again.', data: null });
    }
    exportRuns.set(key, { running: true, at: Date.now() });
    try {
      const { buffer } = await buildAllDataZip({ therapist_id: req.user.therapist_id });
      const day = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="ProDesk-data-${day}.zip"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(buffer);
    } catch (e) {
      console.log('exportAllData failed::>>', e);
      return res.status(500).json({ status: false, code: 500, message: 'Could not create the download. Please try again.', data: null });
    } finally {
      exportRuns.set(key, { running: false, at: Date.now() });
    }
  }

  static async deleteClient(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await deleteClientService({ therapist_id: req.user.therapist_id, client_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getAccessLogs(req, res) {
    try {
      const result = await getAccessLogsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async sendParentOtp(req, res) {
    try {
      const result = await sendParentOtpService({ therapist_id: req.user.therapist_id, ...req.body, ip_address: req.ip });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async verifyParentOtp(req, res) {
    try {
      const result = await verifyParentOtpService({ therapist_id: req.user.therapist_id, consent_id: req.body.consent_id, otp: req.body.otp });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createClient(req, res) {
    try {
      const result = await createClientService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getClients(req, res) {
    try {
      const result = await getClientsService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getClientById(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await getClientByIdService({ therapist_id: req.user.therapist_id, client_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateClient(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await updateClientService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async archiveClient(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await archiveClientService({ therapist_id: req.user.therapist_id, client_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async requestRecordHistoryUpdate(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await requestRecordHistoryUpdateService({ therapist_id: req.user.therapist_id, client_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskClientController;
