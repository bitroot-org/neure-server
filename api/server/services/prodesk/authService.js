const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../../config/db');
const EmailService = require('../email/emailService');
const NotificationService = require('../notificationsAndAnnouncements/notificationService');

const OTP_TTL_MINUTES = 10;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const saveOtp = async (user_id, type) => {
  const otp = generateOtp();
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await db.query('DELETE FROM prodesk_otps WHERE user_id = ? AND type = ?', [user_id, type]);
  await db.query(
    'INSERT INTO prodesk_otps (user_id, otp, type, expires_at) VALUES (?, ?, ?, ?)',
    [user_id, otp, type, expires_at]
  );
  return otp;
};

const issueTokens = async (user) => {
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
  await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.user_id, refreshToken, expiresAt]);
  await db.query('INSERT INTO prodesk_device_sessions (therapist_id, jti) VALUES (?, ?)', [user.therapist_id, jti]);
  return { accessToken, refreshToken, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
};

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

const generateReferralCode = (firstName, userId) => {
  const name = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X');
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `DR-${name}-${rand}`;
};

const registerService = async (payload) => {
  try {
    console.log('Payload in registerService::>>', payload);
    const { first_name, last_name = '', email, password, phone, referral_code } = payload;

    if (!first_name || !email || !password) {
      return { status: false, code: 400, message: 'first_name, email and password are required', data: null };
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing && existing.length) {
      return { status: false, code: 409, message: 'An account with this email already exists', data: null };
    }

    // Validate referral code if provided
    let referrerTherapistId = null;
    if (referral_code) {
      const [[referrer]] = await db.query('SELECT id FROM therapists WHERE referral_code = ?', [referral_code.trim().toUpperCase()]);
      if (!referrer) {
        return { status: false, code: 400, message: 'Invalid referral code', data: null };
      }
      referrerTherapistId = referrer.id;
    }

    const firstName = first_name.trim();
    const lastName = (last_name || '').trim();
    const hashed = await bcrypt.hash(password, 10);
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult] = await conn.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role_id, is_active) VALUES (?, ?, ?, ?, ?, 4, 0)',
        [firstName, lastName, email, cleanPhone, hashed]
      );
      const userId = userResult.insertId;

      const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${userId}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let uniqueReferralCode = generateReferralCode(firstName, userId);
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const [[codeExists]] = await conn.query('SELECT id FROM therapists WHERE referral_code = ?', [uniqueReferralCode]);
        if (!codeExists) break;
        uniqueReferralCode = generateReferralCode(firstName, userId + attempts + 1);
        attempts++;
      }

      const [therapistResult] = await conn.query(
        'INSERT INTO therapists (user_id, booking_slug, referral_code) VALUES (?, ?, ?)',
        [userId, slug, uniqueReferralCode]
      );
      const therapistId = therapistResult.insertId;

      // Create referral wallet for this new therapist
      await conn.query(
        'INSERT INTO prodesk_referral_wallet (therapist_id) VALUES (?)', [therapistId]
      );

      // Store pending referral record if referral code was used
      if (referrerTherapistId) {
        // Self-referral guard
        if (referrerTherapistId !== therapistId) {
          await conn.query(
            `INSERT INTO prodesk_referrals (referrer_therapist_id, referred_therapist_id, referral_code_used, status)
             VALUES (?,?,?,'pending')`,
            [referrerTherapistId, therapistId, referral_code.trim().toUpperCase()]
          );
        }
      }

      await conn.commit();

      const otp = await saveOtp(userId, 'email_verify');
      await NotificationService.sendOtpEmail({ toEmail: email, toName: firstName, otp, type: 'verify' });

      return { status: true, code: 201, message: 'Account created. Please verify your email with the OTP sent.', data: { email } };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.log('Error in registerService::>>', error);
    return null;
  }
};

const verifyEmailService = async (payload) => {
  try {
    console.log('Payload in verifyEmailService::>>', payload);
    const { email, otp } = payload;

    if (!email || !otp) {
      return { status: false, code: 400, message: 'email and otp are required', data: null };
    }

    const [users] = await db.query(
      'SELECT user_id, first_name, email FROM users WHERE email = ? AND role_id = 4',
      [email]
    );
    if (!users || !users.length) {
      return { status: false, code: 404, message: 'Account not found', data: null };
    }
    const user = users[0];

    const [otpRows] = await db.query(
      'SELECT id, expires_at, used FROM prodesk_otps WHERE user_id = ? AND otp = ? AND type = ?',
      [user.user_id, otp, 'email_verify']
    );

    if (!otpRows || !otpRows.length) {
      return { status: false, code: 400, message: 'Invalid OTP', data: null };
    }
    if (otpRows[0].used) {
      return { status: false, code: 400, message: 'OTP already used', data: null };
    }
    if (new Date() > new Date(otpRows[0].expires_at)) {
      return { status: false, code: 400, message: 'OTP expired. Please request a new one.', data: null };
    }

    await db.query('UPDATE users SET is_active = 1 WHERE user_id = ?', [user.user_id]);
    await db.query('UPDATE prodesk_otps SET used = 1 WHERE id = ?', [otpRows[0].id]);

    const [fullUser] = await db.query(
      `SELECT u.*, t.id AS therapist_id, t.booking_slug FROM users u
       JOIN therapists t ON t.user_id = u.user_id WHERE u.user_id = ?`,
      [user.user_id]
    );

    const tokens = await issueTokens(fullUser[0]);
    const { password: _, ...safeUser } = fullUser[0];

    // Send welcome email (best-effort)
    try {
      await NotificationService.sendWelcomeEmail({
        toEmail: user.email,
        toName: fullUser[0].first_name
      });
    } catch (e) {
      console.log('Welcome email error:', e.message);
    }

    return {
      status: true, code: 200, message: 'Email verified. Welcome to Neure Prodesk!',
      data: { ...tokens, user: safeUser }
    };
  } catch (error) {
    console.log('Error in verifyEmailService::>>', error);
    return null;
  }
};

const resendOtpService = async (payload) => {
  try {
    const { email, type } = payload;
    if (!email || !type) return { status: false, code: 400, message: 'email and type are required', data: null };

    const isActive = type === 'email_verify' ? 0 : 1;
    const [users] = await db.query(
      'SELECT user_id, first_name FROM users WHERE email = ? AND role_id = 4 AND is_active = ?',
      [email, isActive]
    );
    if (!users || !users.length) {
      return { status: true, code: 200, message: 'If that email exists, an OTP has been sent', data: null };
    }

    const otp = await saveOtp(users[0].user_id, type);
    await NotificationService.sendOtpEmail({ toEmail: email, toName: users[0].first_name, otp, type });

    return { status: true, code: 200, message: 'OTP resent successfully', data: null };
  } catch (error) {
    console.log('Error in resendOtpService::>>', error);
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
      return { status: true, code: 200, message: 'If that email exists, an OTP has been sent', data: null };
    }

    const user = users[0];
    const otp = await saveOtp(user.user_id, 'forgot_password');
    await NotificationService.sendOtpEmail({ toEmail: email, toName: user.first_name, otp, type: 'forgot_password' });

    return { status: true, code: 200, message: 'OTP sent to your email', data: null };
  } catch (error) {
    console.log('Error in forgotPasswordService::>>', error);
    return null;
  }
};

const verifyForgotOtpService = async (payload) => {
  try {
    console.log('Payload in verifyForgotOtpService::>>', payload);
    const { email, otp } = payload;

    if (!email || !otp) return { status: false, code: 400, message: 'email and otp are required', data: null };

    const [users] = await db.query(
      'SELECT user_id FROM users WHERE email = ? AND role_id = 4 AND is_active = 1',
      [email]
    );
    if (!users || !users.length) return { status: false, code: 400, message: 'Invalid OTP', data: null };

    const [otpRows] = await db.query(
      'SELECT id, expires_at, used FROM prodesk_otps WHERE user_id = ? AND otp = ? AND type = ?',
      [users[0].user_id, otp, 'forgot_password']
    );

    if (!otpRows || !otpRows.length) return { status: false, code: 400, message: 'Invalid OTP', data: null };
    if (otpRows[0].used) return { status: false, code: 400, message: 'OTP already used', data: null };
    if (new Date() > new Date(otpRows[0].expires_at)) return { status: false, code: 400, message: 'OTP expired. Request a new one.', data: null };

    await db.query('UPDATE prodesk_otps SET used = 1 WHERE id = ?', [otpRows[0].id]);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [users[0].user_id]);
    await db.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [users[0].user_id, resetToken, expiry]);

    return { status: true, code: 200, message: 'OTP verified', data: { reset_token: resetToken } };
  } catch (error) {
    console.log('Error in verifyForgotOtpService::>>', error);
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

    // Send confirmation email (best-effort)
    try {
      const [userRow] = await db.query('SELECT first_name, email FROM users WHERE user_id = ?', [tokens[0].user_id]);
      if (userRow && userRow.length) {
        await NotificationService.sendPasswordResetSuccessEmail({
          toEmail: userRow[0].email,
          toName: userRow[0].first_name
        });
      }
    } catch (e) {
      console.log('Password reset success email error:', e.message);
    }

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
  registerService,
  verifyEmailService,
  resendOtpService,
  loginService,
  logoutService,
  logoutAllService,
  refreshTokenService,
  forgotPasswordService,
  verifyForgotOtpService,
  resetPasswordService,
  changePasswordService,
  getDeviceSessionsService,
  revokeDeviceSessionService
};
