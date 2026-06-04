const {
  getResourcesService,
  getResourceCategoriesService,
  uploadResourceService,
  updateResourceService,
  deleteResourceService,
  saveResourceToLibraryService
} = require('../../services/prodesk/resourceService');
const { uploadGalleryFile } = require('../upload/UploadController');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskResourceController {
  static async getResources(req, res) {
    try {
      const result = await getResourcesService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getResourceCategories(req, res) {
    try {
      const result = await getResourceCategoriesService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadResource(req, res) {
    try {
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'file is required', data: null });
      const uploadResult = await uploadGalleryFile(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      const result = await uploadResourceService({
        therapist_id: req.user.therapist_id,
        ...req.body,
        file_url: uploadResult.url,
        size_bytes: req.file.size
      });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateResource(req, res) {
    try {
      const { resource_id } = req.body;
      if (!resource_id) return res.status(400).json({ status: false, code: 400, message: 'resource_id required', data: null });
      const result = await updateResourceService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async deleteResource(req, res) {
    try {
      const { resource_id } = req.body;
      if (!resource_id) return res.status(400).json({ status: false, code: 400, message: 'resource_id required', data: null });
      const result = await deleteResourceService({ therapist_id: req.user.therapist_id, resource_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async saveResourceToLibrary(req, res) {
    try {
      const { resource_id } = req.body;
      if (!resource_id) return res.status(400).json({ status: false, code: 400, message: 'resource_id required', data: null });
      const result = await saveResourceToLibraryService({ therapist_id: req.user.therapist_id, resource_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskResourceController;
