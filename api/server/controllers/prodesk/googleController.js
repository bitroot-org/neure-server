const { getAuthUrl, exchangeCodeForTokens } = require('../../services/prodesk/googleMeetService');
const db = require('../../../config/db');

class GoogleController {
  // Returns the Google OAuth URL for the frontend to redirect to
  static async authUrl(req, res) {
    try {
      // Allow caller to specify where to return after OAuth (defaults to /settings)
      const returnTo = req.body.return_to || '/settings';
      const state = Buffer.from(JSON.stringify({ therapist_id: req.user.therapist_id, return_to: returnTo })).toString('base64');
      const url = `${getAuthUrl()}&state=${encodeURIComponent(state)}`;
      return res.json({ status: true, data: { url } });
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }
  }

  // Google redirects here after user grants permission
  static async callback(req, res) {
    // Fallback used only when return_to is a relative path (legacy)
    const fallbackOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    let returnTo = `${fallbackOrigin}/settings`;

    try {
      const { code, state } = req.query;
      if (!code || !state) return res.redirect(`${returnTo}?google=error`);

      let therapistId;
      try {
        const decoded = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
        therapistId = decoded.therapist_id;
        if (decoded.return_to) {
          // If it's already an absolute URL (starts with http), use it directly
          // Otherwise prepend fallback origin (backwards compat)
          returnTo = decoded.return_to.startsWith('http')
            ? decoded.return_to
            : `${fallbackOrigin}${decoded.return_to}`;
        }
      } catch {
        return res.redirect(`${returnTo}?google=error`);
      }

      const tokens = await exchangeCodeForTokens(code);
      if (!tokens.refresh_token) {
        return res.redirect(`${returnTo}?google=error&reason=no_refresh`);
      }

      await db.query(
        `INSERT INTO prodesk_google_tokens (therapist_id, refresh_token)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE refresh_token = ?, updated_at = NOW()`,
        [therapistId, tokens.refresh_token, tokens.refresh_token]
      );

      return res.redirect(`${returnTo}?google=connected`);
    } catch (e) {
      console.error('Google OAuth callback error:', e.message);
      return res.redirect(`${returnTo}?google=error`);
    }
  }

  // Check if this therapist has connected Google
  static async status(req, res) {
    try {
      const [rows] = await db.query(
        'SELECT therapist_id FROM prodesk_google_tokens WHERE therapist_id = ?',
        [req.user.therapist_id]
      );
      return res.json({ status: true, data: { connected: !!(rows && rows.length) } });
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }
  }

  // Remove stored tokens
  static async disconnect(req, res) {
    try {
      await db.query('DELETE FROM prodesk_google_tokens WHERE therapist_id = ?', [req.user.therapist_id]);
      return res.json({ status: true, message: 'Google account disconnected' });
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }
  }
}

module.exports = GoogleController;
