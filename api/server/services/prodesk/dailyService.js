const db = require('../../../config/db');

// Daily API key is stored in client_integration (type = 'video', name = 'Daily').
// Put the key in either key_id or secret.
const getDailyKey = async () => {
  const [rows] = await db.query(
    "SELECT key_id, secret FROM client_integration WHERE type = 'video' AND is_active = 1 LIMIT 1"
  );
  if (!rows || !rows.length) return null;
  return rows[0].key_id || rows[0].secret || null;
};

const dailyRequest = async (method, path, body = null) => {
  const apiKey = await getDailyKey();
  if (!apiKey) throw new Error('Daily API key not configured');

  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`https://api.daily.co/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.info || data?.error || `Daily error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    throw err;
  }
  return data;
};

// Ensure a public Daily room exists for the given name; return its URL.
const ensureRoom = async (roomName) => {
  // Try to fetch first (idempotent across page reloads)
  try {
    const existing = await dailyRequest('GET', `/rooms/${roomName}`);
    if (existing && existing.url) return existing.url;
  } catch (e) {
    if (e.statusCode && e.statusCode !== 404) throw e; // real error, not "missing"
  }

  const created = await dailyRequest('POST', '/rooms', {
    name: roomName,
    privacy: 'public',
    properties: {
      enable_prejoin_ui: false,
      enable_chat: true,
      enable_screenshare: true,
      enable_knocking: false,
    },
  });
  return created.url;
};

module.exports = { ensureRoom, getDailyKey };
