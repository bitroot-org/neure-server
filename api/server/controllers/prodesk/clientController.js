const {
  createClientService,
  getClientsService,
  getClientByIdService,
  updateClientService,
  archiveClientService
} = require('../../services/prodesk/clientService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskClientController {
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
}

module.exports = ProdeskClientController;
