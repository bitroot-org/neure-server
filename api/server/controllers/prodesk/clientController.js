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
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskClientController {
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
