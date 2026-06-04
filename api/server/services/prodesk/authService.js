const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../../config/db');
const EmailService = require('../email/emailService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;

const loginService = async (payload) => {
  try {
    console.log('Payload in loginService::>>', payload);
    const { email, password } = payload;

    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      return { status: false, code: 500, message: 'JWT configuration missing', data: null };
    }

    const [rows] = await db.query(
      `SELECT u.*, t.id AS therapist_id, t.booking_slug, t.about_me, t.rating
       FROM users u
       JOIN therapists t ON t.user_id = u.user_id
       WHERE u.email = ? AND u.role_id = 4 AND u.is_active = 1`,
      [email]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 401, message: 'Invalid credentials', data: null };
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { status: false, code: 401, message: 'Invalid credentials', data: null };
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email, role_id: 4, therapist_id: user.therapist_id, jti },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TTL }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id, role_id: 4 },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: `${REFRESH_TTL_DAYS}d` }
    );

    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, refreshToken, expiresAt]
    );

    await db.query(
      'INSERT INTO prodesk_device_sessions (therapist_id, jti) VALUES (?, ?)',
      [user.therapist_id, jti]
    );

    const { password: _, ...safeUser } = user;
    return {
      status: true, code: 200, message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        user: safeUser
      }
    };
  } catch (error) {
    console.log('Error in loginService::>>', error);
    return null;
  }
};

const logoutService = async (payload) => {
  try {
    console.log('Payload in logoutService::>>', payload);
    const { token } = payload;

    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await db.query('INSERT INTO blacklisted_tokens (token, expires_at) VALUES (?, ?)', [token, expiresAt]);

    if (decoded.jti) {
      await db.query('UPDATE prodesk_device_sessions SET revoked = 1 WHERE jti = ?', [decoded.jti]);
    }

    return { status: true, code: 200, message: 'Logged out successfully', data: null };
  } catch (error) {
    console.log('Error in logoutService::>>', error);
    return null;
  }
};

const logoutAllService = async (payload) => {
  try {
    console.log('Payload in logoutAllService::>>', payload);
    const { therapist_id } = payload;

    await db.query('UPDATE prodesk_device_sessions SET revoked = 1 WHERE therapist_id = ?', [therapist_id]);
    await db.query(
      `DELETE rt FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.user_id
       JOIN therapists t ON t.user_id = u.user_id
       WHERE t.id = ?`,
      [therapist_id]
    );

    return { status: true, code: 200, message: 'All sessions revoked', data: null };
  } catch (error) {
    console.log('Error in logoutAllService::>>', error);
    return null;
  }
};

const refreshTokenService = async (payload) => {
  try {
    console.log('Payload in refreshTokenService::>>', payload);
    const { refresh_token } = payload;

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const [tokens] = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refresh_token]
    );

    if (!tokens || !tokens.length) {
      return { status: false, code: 401, message: 'Invalid or expired refresh token', data: null };
    }

    const [users] = await db.query(
      `SELECT u.email, u.role_id, t.id AS therapist_id
       FROM users u JOIN therapists t ON t.user_id = u.user_id
       WHERE u.user_id = ?`,
      [decoded.user_id]
    );

    if (!users || !users.length) {
      return { status: false, code: 404, message: 'User not found', data: null };
    }

    const jti = crypto.randomUUID();
    const newAccessToken = jwt.sign(
      { user_id: decoded.user_id, email: users[0].email, role_id: 4, therapist_id: users[0].therapist_id, jti },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TTL }
    );

    return {
      status: true, code: 200, message: 'Token refreshed',
      data: { accessToken: newAccessToken, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
    };
  } catch (error) {
    console.log('Error in refreshTokenService::>>', error);
    return null;
  }
};

const forgotPasswordService = async (payload) => {
  try {
    console.log('Payload in forgotPasswordService::>>', payload);
    const { email } = payload;

    const [users] = await db.query(
      'SELECT user_id, first_name, email FROM users WHERE email = ? AND role_id = 4 AND is_active = 1',
      [email]
    );

    if (!users || !users.length) {
      return { status: true, code: 200, message: 'If that email exists, a reset link has been sent', data: null };
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.user_id]);
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, token, expiry]
    );

    try {
      await EmailService.sendPasswordResetEmail(user.first_name, user.email, token, 4);
    } catch (e) {
      console.log('Forgot password email error::>>', e.message);
    }

    return { status: true, code: 200, message: 'Password reset instructions sent', data: null };
  } catch (error) {
    console.log('Error in forgotPasswordService::>>', error);
    return null;
  }
};

const resetPasswordService = async (payload) => {
  try {
    console.log('Payload in resetPasswordService::>>', payload);
    const { token, new_password } = payload;

    const [tokens] = await db.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ? AND used = 0',
      [token]
    );

    if (!tokens || !tokens.length) {
      return { status: false, code: 400, message: 'Invalid or expired reset token', data: null };
    }

    if (new Date() > new Date(tokens[0].expires_at)) {
      return { status: false, code: 400, message: 'Reset token has expired', data: null };
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, tokens[0].user_id]);
    await db.query('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);

    await NotificationService.createNotification({
      title: 'Password Reset Successfully',
      content: `Your password was reset on ${new Date().toLocaleString()}. If you did not do this, contact support immediately.`,
      type: 'ACCOUNT_UPDATE',
      user_id: tokens[0].user_id
    });

    return { status: true, code: 200, message: 'Password reset successfully', data: null };
  } catch (error) {
    console.log('Error in resetPasswordService::>>', error);
    return null;
  }
};

const changePasswordService = async (payload) => {
  try {
    console.log('Payload in changePasswordService::>>', payload);
    const { user_id, current_password, new_password } = payload;

    const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [user_id]);
    if (!users || !users.length) {
      return { status: false, code: 404, message: 'User not found', data: null };
    }

    const match = await bcrypt.compare(current_password, users[0].password);
    if (!match) {
      return { status: false, code: 400, message: 'Current password is incorrect', data: null };
    }

    const same = await bcrypt.compare(new_password, users[0].password);
    if (same) {
      return { status: false, code: 400, message: 'New password cannot be same as current password', data: null };
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user_id]);

    return { status: true, code: 200, message: 'Password changed successfully', data: null };
  } catch (error) {
    console.log('Error in changePasswordService::>>', error);
    return null;
  }
};

const getDeviceSessionsService = async (payload) => {
  try {
    console.log('Payload in getDeviceSessionsService::>>', payload);
    const { therapist_id } = payload;

    const [rows] = await db.query(
      `SELECT id, jti, device_info, ip_address, last_active_at, created_at
       FROM prodesk_device_sessions
       WHERE therapist_id = ? AND revoked = 0
       ORDER BY last_active_at DESC`,
      [therapist_id]
    );

    return { status: true, code: 200, message: 'Sessions fetched', data: rows || [] };
  } catch (error) {
    console.log('Error in getDeviceSessionsService::>>', error);
    return null;
  }
};

const revokeDeviceSessionService = async (payload) => {
  try {
    console.log('Payload in revokeDeviceSessionService::>>', payload);
    const { therapist_id, session_id } = payload;

    const [rows] = await db.query(
      'SELECT id FROM prodesk_device_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );

    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    await db.query('UPDATE prodesk_device_sessions SET revoked = 1 WHERE id = ?', [session_id]);
    return { status: true, code: 200, message: 'Session revoked', data: null };
  } catch (error) {
    console.log('Error in revokeDeviceSessionService::>>', error);
    return null;
  }
};

module.exports = {
  loginService,
  logoutService,
  logoutAllService,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  getDeviceSessionsService,
  revokeDeviceSessionService
};
