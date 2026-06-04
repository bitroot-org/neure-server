const { OAuth2Client } = require('google-auth-library');

const getOAuthClient = () => new OAuth2Client(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
);

const getAuthUrl = () => {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/meetings.space.created'],
    prompt: 'consent', // always prompt so we always get a refresh_token
  });
};

const exchangeCodeForTokens = async (code) => {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
};

// Creates a Google Meet space using the therapist's stored OAuth token.
const createMeetingSpace = async (therapistId) => {
  const db = require('../../../config/db');
  const [rows] = await db.query(
    'SELECT refresh_token FROM prodesk_google_tokens WHERE therapist_id = ?',
    [therapistId]
  );

  if (!rows || !rows.length) {
    throw new Error('Google account not connected. Go to Settings → Integrations to connect.');
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: rows[0].refresh_token });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Failed to refresh Google access token');

  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Google Meet error ${res.status}`);
  }

  return data.meetingUri; // https://meet.google.com/xxx-yyy-zzz
};

module.exports = { getAuthUrl, exchangeCodeForTokens, createMeetingSpace };
