const {
  getTeamService,
  inviteStaffService,
  updateStaffService,
  removeStaffService
} = require('../../services/prodesk/teamService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskTeamController {
  static async getTeam(req, res) {
    try {
      const result = await getTeamService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async inviteStaff(req, res) {
    try {
      const result = await inviteStaffService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateStaff(req, res) {
    try {
      const { staff_user_id } = req.body;
      if (!staff_user_id) return res.status(400).json({ status: false, code: 400, message: 'staff_user_id required', data: null });
      const result = await updateStaffService({ therapist_id: req.user.therapist_id, ...req.body });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async removeStaff(req, res) {
    try {
      const { staff_user_id } = req.body;
      if (!staff_user_id) return res.status(400).json({ status: false, code: 400, message: 'staff_user_id required', data: null });
      const result = await removeStaffService({ therapist_id: req.user.therapist_id, staff_user_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskTeamController;
