const { uploadGalleryFile } = require('../upload/UploadController');
const {
  getCatalogueResourcesService,
  uploadCatalogueResourceService,
  deleteCatalogueResourceService
} = require('../../services/gallery/catalogueResourceService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const adminOnly = (req, res) => {
  res.status(403).json({ status: false, code: 403, message: 'Access denied. Superadmin only.', data: null });
};

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class CatalogueResourceController {
  static async getCatalogueResources(req, res) {
    try {
      if (req.user.role_id !== 1) return adminOnly(req, res);
      const { page, limit, type, q } = req.query;
      const result = await getCatalogueResourcesService({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, type, q });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadCatalogueResource(req, res) {
    try {
      if (req.user.role_id !== 1) return adminOnly(req, res);
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'file is required', data: null });

      const uploadResult = await uploadGalleryFile(req);
      if (!uploadResult?.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });

      const result = await uploadCatalogueResourceService({
        ...req.body,
        file_url: uploadResult.url,
        size_bytes: req.file.size
      });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async deleteCatalogueResource(req, res) {
    try {
      if (req.user.role_id !== 1) return adminOnly(req, res);
      const { resource_id } = req.body;
      if (!resource_id) return res.status(400).json({ status: false, code: 400, message: 'resource_id required', data: null });
      const result = await deleteCatalogueResourceService({ resource_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = CatalogueResourceController;
