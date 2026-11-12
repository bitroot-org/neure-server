const crypto = require('crypto');
const db = require('../../../config/db');

const AUTH_BASE = 'https://auth.razorpay.com';
const SCOPE = 'read_write';
const STATE_TTL_MS = 15 * 60 * 1000;

// ─── Config (client_integration row, one per environment DB) ──────────────────

const getPartnerConfig = async () => {
  const [rows] = await db.query(
    "SELECT key_id, secret, meta FROM client_integration WHERE type = 'payment_partner' AND is_active = 1 LIMIT 1"
  );
  if (!rows || !rows.length) {
    throw new Error("Razorpay partner credentials not configured in client_integration (type = 'payment_partner')");
  }
  const meta = typeof rows[0].meta === 'string' ? JSON.parse(rows[0].meta) : (rows[0].meta || {});
  return {
    clientId: rows[0].key_id,
    clientSecret: rows[0].secret,
    mode: meta.mode === 'live' ? 'live' : 'test',
    // The partner row is shared by every environment on this database. A developer machine can point links at itself
    // with these two variables, so pay links and the OAuth return do not land on the deployed staging site.
    redirectUri: process.env.RAZORPAY_REDIRECT_URI_OVERRIDE || meta.redirect_uri,
    webhookSecret: meta.webhook_secret,
    frontendReturnUrl: process.env.FRONTEND_RETURN_URL_OVERRIDE || meta.frontend_return_url,
  };
};

// ─── Token encryption (AES-256-GCM) ───────────────────────────────────────────

const encKey = () => {
  if (!process.env.TOKEN_ENC_KEY) throw new Error('TOKEN_ENC_KEY is not set in .env');
  return crypto.createHash('sha256').update(process.env.TOKEN_ENC_KEY).digest();
};

const encrypt = (plain) => {
  if (!plain) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString('base64')).join('.');
};

const decrypt = (blob) => {
  if (!blob) return null;
  const [iv, tag, enc] = blob.split('.').map(p => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
};

// ─── OAuth state (signed, short-lived, ties the callback to a therapist) ─────

const signState = (therapist_id) => {
  const body = Buffer.from(JSON.stringify({ t: therapist_id, ts: Date.now(), n: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  const sig = crypto.createHmac('sha256', encKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verifyState = (state) => {
  if (!state || !state.includes('.')) return null;
  const [body, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', encKey()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!data.ts || Date.now() - data.ts > STATE_TTL_MS) return null;
  return data;
};

const postJson = async (url, body) => {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

// ─── Therapist-facing ─────────────────────────────────────────────────────────

const getConnectUrlService = async ({ therapist_id }) => {
  try {
    const cfg = await getPartnerConfig();
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      response_type: 'code',
      redirect_uri: cfg.redirectUri,
      scope: SCOPE,
      state: signState(therapist_id),
    });
    return { status: true, code: 200, message: 'Connect URL generated', data: { url: `${AUTH_BASE}/authorize?${params}` } };
  } catch (error) {
    console.log('Error in getConnectUrlService::>>', error);
    return null;
  }
};

// Runs when Razorpay redirects the therapist back. Returns { ok, reason } — the controller redirects to the app.
const handleOAuthCallbackService = async ({ code, state, error }) => {
  const cfg = await getPartnerConfig();
  try {
    if (error) return { ok: false, reason: error, cfg };
    const st = verifyState(state);
    if (!st) return { ok: false, reason: 'invalid_state', cfg };
    if (!code) return { ok: false, reason: 'missing_code', cfg };

    const tok = await postJson(`${AUTH_BASE}/token`, {
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: cfg.redirectUri,
      code,
      mode: cfg.mode,
    });
    if (!tok.ok || !tok.data.access_token) {
      console.log('Razorpay token exchange failed::>>', tok.status, tok.data);
      return { ok: false, reason: 'token_exchange_failed', cfg };
    }

    const d = tok.data;
    const expiresAt = d.expires_in ? new Date(Date.now() + d.expires_in * 1000) : null;
    await db.query(
      `INSERT INTO therapist_razorpay_accounts
         (therapist_id, razorpay_account_id, public_token, access_token_enc, refresh_token_enc,
          token_expires_at, mode, status, connected_at, revoked_at, last_error)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE
          razorpay_account_id = VALUES(razorpay_account_id), public_token = VALUES(public_token),
          access_token_enc = VALUES(access_token_enc), refresh_token_enc = VALUES(refresh_token_enc),
          token_expires_at = VALUES(token_expires_at), mode = VALUES(mode),
          status = 'active', connected_at = NOW(), revoked_at = NULL, last_error = NULL`,
      [st.t, d.razorpay_account_id || null, d.public_token || null, encrypt(d.access_token),
       encrypt(d.refresh_token), expiresAt, cfg.mode]
    );
    return { ok: true, therapist_id: st.t, cfg };
  } catch (e) {
    console.log('Error in handleOAuthCallbackService::>>', e);
    return { ok: false, reason: 'server_error', cfg };
  }
};

const getConnectionStatusService = async ({ therapist_id }) => {
  try {
    const [[row]] = await db.query(
      `SELECT razorpay_account_id, mode, status, kyc_status, connected_at, token_expires_at, last_error
       FROM therapist_razorpay_accounts WHERE therapist_id = ?`, [therapist_id]
    );
    const data = row
      ? { connected: row.status === 'active', ...row }
      : { connected: false, status: 'not_connected' };
    return { status: true, code: 200, message: 'Razorpay connection fetched', data };
  } catch (error) {
    console.log('Error in getConnectionStatusService::>>', error);
    return null;
  }
};

// Returns a usable access token, refreshing it if it is about to expire.
const getAccessToken = async (therapist_id) => {
  const [[row]] = await db.query(
    'SELECT * FROM therapist_razorpay_accounts WHERE therapist_id = ? AND status = ?', [therapist_id, 'active']
  );
  if (!row) return null;
  const expiring = row.token_expires_at && new Date(row.token_expires_at).getTime() - Date.now() < 5 * 60 * 1000;
  if (!expiring) return { accessToken: decrypt(row.access_token_enc), publicToken: row.public_token, accountId: row.razorpay_account_id };

  const cfg = await getPartnerConfig();
  const r = await postJson(`${AUTH_BASE}/token`, {
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    grant_type: 'refresh_token', refresh_token: decrypt(row.refresh_token_enc),
  });
  if (!r.ok || !r.data.access_token) {
    await db.query('UPDATE therapist_razorpay_accounts SET last_error = ? WHERE therapist_id = ?',
      ['Token refresh failed', therapist_id]);
    return null;
  }
  const expiresAt = r.data.expires_in ? new Date(Date.now() + r.data.expires_in * 1000) : null;
  await db.query(
    'UPDATE therapist_razorpay_accounts SET access_token_enc = ?, refresh_token_enc = ?, token_expires_at = ?, last_error = NULL WHERE therapist_id = ?',
    [encrypt(r.data.access_token), encrypt(r.data.refresh_token || decrypt(row.refresh_token_enc)), expiresAt, therapist_id]
  );
  return { accessToken: r.data.access_token, publicToken: row.public_token, accountId: row.razorpay_account_id };
};

const disconnectService = async ({ therapist_id }) => {
  try {
    const [[row]] = await db.query('SELECT * FROM therapist_razorpay_accounts WHERE therapist_id = ?', [therapist_id]);
    if (!row) return { status: false, code: 404, message: 'No Razorpay connection found', data: null };

    // Best-effort revoke at Razorpay; we always clear locally.
    try {
      const cfg = await getPartnerConfig();
      await postJson(`${AUTH_BASE}/revoke`, {
        client_id: cfg.clientId, client_secret: cfg.clientSecret,
        token: decrypt(row.access_token_enc), token_type_hint: 'access_token',
      });
    } catch (e) { console.log('Razorpay revoke (best-effort) failed::>>', e.message); }

    await db.query(
      `UPDATE therapist_razorpay_accounts
       SET status = 'revoked', access_token_enc = NULL, refresh_token_enc = NULL, revoked_at = NOW()
       WHERE therapist_id = ?`, [therapist_id]
    );
    return { status: true, code: 200, message: 'Razorpay disconnected', data: null };
  } catch (error) {
    console.log('Error in disconnectService::>>', error);
    return null;
  }
};

// ─── Calls made on behalf of a connected therapist ───────────────────────────

const partnerRequest = async (therapist_id, { method, path, body }) => {
  const tok = await getAccessToken(therapist_id);
  if (!tok) throw new Error('Razorpay is not connected for this therapist');
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`https://api.razorpay.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${tok.accessToken}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.description || `Razorpay error: ${res.status}`);
  return { data, accountId: tok.accountId };
};

// Payment link: prefilled amount / customer / description, money settles to the therapist's account.
const createPaymentLinkForTherapist = async (therapist_id, { amount, description, reference_id, customer = {}, notes = {} }) => {
  const contact = String(customer.contact || '').replace(/\D/g, '');
  const body = {
    amount: Math.round(Number(amount) * 100),
    currency: 'INR',
    accept_partial: false,
    description,
    reference_id,
    customer: {
      ...(customer.name ? { name: customer.name } : {}),
      ...(customer.email ? { email: customer.email } : {}),
      ...(contact.length >= 10 ? { contact: contact.length === 10 ? `+91${contact}` : `+${contact}` } : {}),
    },
    notify: { sms: false, email: false }, // we send the invoice ourselves
    reminder_enable: false,
    notes,
  };
  const { data, accountId } = await partnerRequest(therapist_id, { method: 'POST', path: '/v1/payment_links', body });
  return { id: data.id, short_url: data.short_url, accountId };
};

const cancelPaymentLinkForTherapist = (therapist_id, linkId) =>
  partnerRequest(therapist_id, { method: 'POST', path: `/v1/payment_links/${linkId}/cancel` });

const refundPaymentForTherapist = async (therapist_id, paymentId, { amount, notes = {} } = {}) => {
  const body = { notes };
  if (amount) body.amount = Math.round(Number(amount) * 100);
  const { data } = await partnerRequest(therapist_id, { method: 'POST', path: `/v1/payments/${paymentId}/refund`, body });
  return data;
};

// ─── Partner webhook ──────────────────────────────────────────────────────────

const verifyPartnerWebhookSignature = async (rawBody, signature) => {
  const { webhookSecret } = await getPartnerConfig();
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const ACCOUNT_EVENTS = {
  'account.activated':          { kyc: 'activated' },
  'product.payment_gateway.activated': { kyc: 'activated' },
  'account.under_review':       { kyc: 'under_review' },
  'account.needs_clarification': { kyc: 'needs_clarification' },
  'account.suspended':          { kyc: 'suspended', status: 'suspended' },
  'account.rejected':           { kyc: 'rejected', status: 'suspended' },
};

const handlePartnerWebhookService = async (event) => {
  const type = event.event;
  const accountId = event.account_id;
  console.log('Razorpay partner webhook::>>', type, accountId);

  if (type === 'account.app.authorization_revoked' && accountId) {
    await db.query(
      `UPDATE therapist_razorpay_accounts
       SET status = 'revoked', access_token_enc = NULL, refresh_token_enc = NULL, revoked_at = NOW()
       WHERE razorpay_account_id = ?`, [accountId]
    );
    return;
  }

  if (ACCOUNT_EVENTS[type] && accountId) {
    const { kyc, status } = ACCOUNT_EVENTS[type];
    await db.query(
      `UPDATE therapist_razorpay_accounts SET kyc_status = ?${status ? ', status = ?' : ''} WHERE razorpay_account_id = ?`,
      status ? [kyc, status, accountId] : [kyc, accountId]
    );
    return;
  }

  // payment_link.* / payment.* / refund.* — invoice bookkeeping lives in billingService
  if (/^(payment_link|payment|refund)\./.test(type)) {
    const { handlePartnerPaymentEvent } = require('./billingService');
    await handlePartnerPaymentEvent({ event, accountId });
  }
};

module.exports = {
  getPartnerConfig,
  getConnectUrlService,
  handleOAuthCallbackService,
  getConnectionStatusService,
  getAccessToken,
  partnerRequest,
  createPaymentLinkForTherapist,
  cancelPaymentLinkForTherapist,
  refundPaymentForTherapist,
  disconnectService,
  verifyPartnerWebhookSignature,
  handlePartnerWebhookService,
};
