const {
  getProfileService,
  updateProfileService,
  getAvailabilityService,
  updateAvailabilityService,
  getBrandingService,
  updateBrandingService,
  uploadLogoService,
  uploadWallpaperService,
  getDocumentsService,
  uploadDocumentService,
  deleteDocumentService,
  getBookingLinkService
} = require('../../services/prodesk/profileService');
const { uploadImage } = require('../upload/UploadController');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskProfileController {
  static async getProfile(req, res) {
    try {
      const result = await getProfileService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateProfile(req, res) {
    try {
      let profile_url;
      if (req.file) {
        req.body.type = 'profile';
        const uploadResult = await uploadImage(req);
        if (uploadResult?.url) profile_url = uploadResult.url;
      }
      const result = await updateProfileService({ therapist_id: req.user.therapist_id, ...req.body, profile_url });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getAvailability(req, res) {
    try {
      const result = await getAvailabilityService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateAvailability(req, res) {
    try {
      const result = await updateAvailabilityService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getBranding(req, res) {
    try {
      const result = await getBrandingService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateBranding(req, res) {
    try {
      const result = await updateBrandingService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadBrandingLogo(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'logo file is required', data: null });
      req.body.type = 'profile';
      const uploadResult = await uploadImage(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await uploadLogoService({ therapist_id: req.user.therapist_id, logo_url: uploadResult.url });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadWallpaper(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'wallpaper file is required', data: null });
      req.body.type = 'profile';
      const uploadResult = await uploadImage(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await uploadWallpaperService({ therapist_id: req.user.therapist_id, wallpaper_url: uploadResult.url });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getDocuments(req, res) {
    try {
      const result = await getDocumentsService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadDocument(req, res) {
    try {
      const { type } = req.body;
      if (!req.file || !type) return res.status(400).json({ status: false, code: 400, message: 'file and type are required', data: null });
      req.body.type = 'profile';
      const uploadResult = await uploadImage(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await uploadDocumentService({ therapist_id: req.user.therapist_id, type, file_url: uploadResult.url });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async deleteDocument(req, res) {
    try {
      const { document_id } = req.body;
      if (!document_id) return res.status(400).json({ status: false, code: 400, message: 'document_id required', data: null });
      const result = await deleteDocumentService({ therapist_id: req.user.therapist_id, document_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getBookingLink(req, res) {
    try {
      const result = await getBookingLinkService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskProfileController;
