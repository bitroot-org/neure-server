const {
  getNoteService,
  createNoteService,
  updateNoteService,
  getClientNotesService,
  uploadNoteAttachmentService,
  deleteNoteAttachmentService
} = require('../../services/prodesk/noteService');
const { uploadGalleryFile } = require('../upload/UploadController');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskNoteController {
  static async getNote(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await getNoteService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createNote(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await createNoteService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateNote(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await updateNoteService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getClientNotes(req, res) {
    try {
      const { client_id } = req.body;
      if (!client_id) return res.status(400).json({ status: false, code: 400, message: 'client_id required', data: null });
      const result = await getClientNotesService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadNoteAttachment(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id || !req.file) return res.status(400).json({ status: false, code: 400, message: 'session_id and file required', data: null });
      const uploadResult = await uploadGalleryFile(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await uploadNoteAttachmentService({
        therapist_id: req.user.therapist_id,
        session_id,
        file_name: req.file.originalname || req.file.filename,
        file_url: uploadResult.url,
        size_bytes: req.file.size
      });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async deleteNoteAttachment(req, res) {
    try {
      const { attachment_id } = req.body;
      if (!attachment_id) return res.status(400).json({ status: false, code: 400, message: 'attachment_id required', data: null });
      const result = await deleteNoteAttachmentService({ therapist_id: req.user.therapist_id, attachment_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskNoteController;
