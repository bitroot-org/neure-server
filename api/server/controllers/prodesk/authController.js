const {
  loginService,
  logoutService,
  logoutAllService,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  getDeviceSessionsService,
  revokeDeviceSessionService
} = require('../../services/prodesk/authService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

class ProdeskAuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ status: false, code: 400, message: 'email and password are required', data: null });
      const result = await loginService({ email, password });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(400).json({ status: false, code: 400, message: 'Token required', data: null });
      const result = await logoutService({ token });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async logoutAll(req, res) {
    try {
      const result = await logoutAllService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) return res.status(400).json({ status: false, code: 400, message: 'refresh_token required', data: null });
      const result = await refreshTokenService({ refresh_token });
      return respond(res, result);
    } catch (e) {
      return res.status(401).json({ status: false, code: 401, message: e.message, data: null });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ status: false, code: 400, message: 'email is required', data: null });
      const result = await forgotPasswordService({ email });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) return res.status(400).json({ status: false, code: 400, message: 'token and new_password are required', data: null });
      const result = await resetPasswordService({ token, new_password });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) return res.status(400).json({ status: false, code: 400, message: 'current_password and new_password are required', data: null });
      const result = await changePasswordService({ user_id: req.user.user_id, current_password, new_password });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSessions(req, res) {
    try {
      const result = await getDeviceSessionsService({ therapist_id: req.user.therapist_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async revokeSession(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ status: false, code: 400, message: 'session_id required', data: null });
      const result = await revokeDeviceSessionService({ therapist_id: req.user.therapist_id, session_id });
      return respond(res, result);
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskAuthController;
