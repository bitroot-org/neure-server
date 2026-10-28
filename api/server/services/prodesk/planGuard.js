const db = require('../../../config/db');

// ─── The one door for plan limits ────────────────────────────────────────────
// Every way a client can come in or be worked with asks this module first:
//   • therapist adds a client                     -> checkAddClient
//   • a stranger's booking request is approved    -> checkApprove  (+ confirmClientOnApproval)
//   • new session / invoice / resource for client -> checkUseClient
//
// The plan is worked out LIVE each time (nothing stored), so a downgrade or a lapsed payment is
// respected immediately:  Professional = active / authenticated / halted(grace) paid plan;  anything else = Starter.
// Starter allows `limit` (2) clients to be "active". They are the clients flagged starter_active.
// Everyone else is view-only: they can be opened, but nothing new can be created for them.

const DEFAULT_STARTER_LIMIT = 2;

const getPlanInfo = async (therapist_id) => {
  const [[paid]] = await db.query(
    `SELECT ps.id, ps.pending_plan_id, ps.cancel_at_period_end
     FROM prodesk_subscriptions ps JOIN prodesk_plans pp ON pp.id = ps.plan_id
     WHERE ps.therapist_id = ? AND ps.status IN ('active','authenticated','halted') AND pp.plan_type != 'starter'
     ORDER BY ps.created_at DESC LIMIT 1`,
    [therapist_id]
  );
  // "pendingDowngrade": the paid plan is about to end (cancelled at period end, or a downgrade is scheduled).
  // The therapist may already have chosen which clients stay active on Starter, so that choice is kept.
  if (paid) return { plan: 'professional', limit: null, pendingDowngrade: !!paid.pending_plan_id || !!paid.cancel_at_period_end };

  const [[starter]] = await db.query(
    `SELECT client_limit FROM prodesk_plans WHERE plan_type = 'starter' AND is_active = 1 ORDER BY id LIMIT 1`
  );
  const limit = starter && starter.client_limit != null ? starter.client_limit : DEFAULT_STARTER_LIMIT;
  return { plan: 'starter', limit, pendingDowngrade: false };
};

// Starter: returns the ids the therapist can work with, repairing the flags when needed:
//  • too many flagged (e.g. old flags)           -> keep the most recently worked-on `limit`
//  • too few flagged (fresh downgrade / lapsed)  -> fill with the most recently worked-on clients
// Professional: flags mean nothing, so they are cleared (unless a downgrade is pending — the therapist may have chosen already).
const getAccess = async (therapist_id) => {
  const info = await getPlanInfo(therapist_id);

  if (info.plan === 'professional') {
    if (!info.pendingDowngrade) {
      await db.query('UPDATE prodesk_clients SET starter_active = 0 WHERE therapist_id = ? AND starter_active = 1', [therapist_id]);
    }
    return { ...info, usable: null, confirmedCount: null };
  }

  // flags on clients that no longer qualify (archived / not confirmed) are dropped
  await db.query(
    `UPDATE prodesk_clients SET starter_active = 0
     WHERE therapist_id = ? AND starter_active = 1 AND (status <> 'active' OR is_confirmed = 0)`,
    [therapist_id]
  );

  const [rows] = await db.query(
    `SELECT id, starter_active FROM prodesk_clients
     WHERE therapist_id = ? AND status = 'active' AND is_confirmed = 1
     ORDER BY COALESCE(last_activity_at, created_at) DESC, id DESC`,
    [therapist_id]
  );
  const flagged = rows.filter((r) => r.starter_active).map((r) => r.id);
  let chosen = flagged.slice(0, info.limit);

  if (chosen.length < Math.min(info.limit, rows.length)) {
    const extra = rows.filter((r) => !chosen.includes(r.id)).slice(0, info.limit - chosen.length).map((r) => r.id);
    chosen = [...chosen, ...extra];
  }

  const chosenSet = new Set(chosen);
  const toFlag = chosen.filter((id) => !flagged.includes(id));
  const toUnflag = flagged.filter((id) => !chosenSet.has(id));
  if (toFlag.length) await db.query('UPDATE prodesk_clients SET starter_active = 1 WHERE id IN (?)', [toFlag]);
  if (toUnflag.length) await db.query('UPDATE prodesk_clients SET starter_active = 0 WHERE id IN (?)', [toUnflag]);

  return { ...info, usable: chosenSet, confirmedCount: rows.length };
};

const waitingRequests = async (therapist_id) => {
  const [[r]] = await db.query(
    `SELECT COUNT(DISTINCT client_id) AS n FROM prodesk_sessions WHERE therapist_id = ? AND status = 'pending'`,
    [therapist_id]
  );
  return r ? Number(r.n) : 0;
};

// One consistent "upgrade needed" answer for every entry point (the New Client page already understands it)
const blocked = (message, access, extra = {}) => ({
  ok: false,
  response: {
    status: false, code: 403, message,
    data: {
      upgrade_required: true, plan: access.plan,
      client_limit: access.limit, current_count: access.usable ? access.usable.size : null,
      ...extra
    }
  }
});

// Can this therapist add one more (new) client?
const checkAddClient = async (therapist_id) => {
  const access = await getAccess(therapist_id);
  if (access.plan === 'professional' || access.usable.size < access.limit) return { ok: true, access };
  return blocked(
    `Your Starter (Free) plan allows a maximum of ${access.limit} active clients. Please upgrade to Professional to add unlimited clients.`,
    access
  );
};

// A client just added/approved: on Starter they take one of the places
const markClientActive = async (therapist_id, client_id, access) => {
  if (access && access.plan === 'starter') {
    await db.query('UPDATE prodesk_clients SET starter_active = 1 WHERE id = ? AND therapist_id = ?', [client_id, therapist_id]);
  }
};

// Can new work (session, invoice, resource) be created for this client?
const checkUseClient = async (therapist_id, client_id) => {
  const access = await getAccess(therapist_id);
  if (access.plan === 'professional' || access.usable.has(Number(client_id))) return { ok: true, access };

  const [[c]] = await db.query(
    `SELECT CONCAT(u.first_name, ' ', u.last_name) AS name FROM prodesk_clients pc JOIN users u ON u.user_id = pc.user_id WHERE pc.id = ?`,
    [client_id]
  );
  const who = c && c.name && c.name.trim() ? c.name.trim() : 'This client';
  return blocked(
    `${who} is view-only on your Starter plan (${access.limit} active clients). Upgrade to Professional to schedule sessions, create invoices or send resources for all your clients.`,
    access
  );
};

// Approving a booking request from this client
const checkApprove = async (therapist_id, client_id) => {
  const access = await getAccess(therapist_id);
  if (access.plan === 'professional') return { ok: true, access, claim: false };
  if (access.usable.has(Number(client_id))) return { ok: true, access, claim: false };

  // not one of the active clients: needs a free place
  if (access.usable.size < access.limit) return { ok: true, access, claim: true };

  const waiting = await waitingRequests(therapist_id);
  const [[c]] = await db.query('SELECT is_confirmed FROM prodesk_clients WHERE id = ?', [client_id]);
  const existing = c && c.is_confirmed === 1;
  return blocked(
    existing
      ? `This client is view-only on your Starter plan (${access.limit} active clients). Upgrade to Professional to approve their request.`
      : `Your Starter plan is full (${access.usable.size} of ${access.limit} clients). ${waiting} ${waiting === 1 ? 'person is' : 'people are'} waiting to book with you. Upgrade to Professional to approve them.`,
    access,
    { waiting_requests: waiting }
  );
};

// After a successful approval: the person is now a real client (and, on Starter, takes a place)
const confirmClientOnApproval = async (therapist_id, client_id, access) => {
  await db.query(
    `UPDATE prodesk_clients SET is_confirmed = 1, status = 'active', starter_active = IF(?, 1, starter_active)
     WHERE id = ? AND therapist_id = ?`,
    [access && access.plan === 'starter' ? 1 : 0, client_id, therapist_id]
  );
};

// ─── Swapping the active clients: once every 30 days ─────────────────────────
const SWAP_DAYS = 30;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

const getSwapStatus = async (therapist_id) => {
  const [[t]] = await db.query('SELECT starter_selection_changed_at AS changed FROM therapists WHERE id = ?', [therapist_id]);
  if (!t || !t.changed) return { canSwap: true, nextSwapAt: null };
  const next = new Date(new Date(t.changed).getTime() + SWAP_DAYS * 24 * 60 * 60 * 1000);
  return { canSwap: Date.now() >= next.getTime(), nextSwapAt: next };
};

const checkSwapAllowed = async (therapist_id, access) => {
  const st = await getSwapStatus(therapist_id);
  if (st.canSwap) return { ok: true };
  return blocked(
    `You can change your active clients once every ${SWAP_DAYS} days. You can change them again on ${fmtDate(st.nextSwapAt)}, or upgrade to Professional to work with all your clients.`,
    access, { next_swap_at: st.nextSwapAt }
  );
};

const recordSwap = async (therapist_id) => {
  await db.query('UPDATE therapists SET starter_selection_changed_at = NOW() WHERE id = ?', [therapist_id]);
};

// Everything the screens need to know about the plan, in one answer
const getPlanOverview = async (therapist_id) => {
  const access = await getAccess(therapist_id);
  const swap = await getSwapStatus(therapist_id);
  const waiting = await waitingRequests(therapist_id);
  const isStarter = access.plan === 'starter';
  let starterLimit = access.limit;
  if (!isStarter) {
    const [[sp]] = await db.query(`SELECT client_limit FROM prodesk_plans WHERE plan_type = 'starter' AND is_active = 1 ORDER BY id LIMIT 1`);
    starterLimit = sp && sp.client_limit != null ? sp.client_limit : DEFAULT_STARTER_LIMIT;
  }
  return {
    plan: access.plan,
    starter_limit: starterLimit,   // what Starter allows (shown when a Professional user is about to move down)
    is_starter: isStarter,
    client_limit: access.limit,
    pending_downgrade: !!access.pendingDowngrade,
    active_client_ids: isStarter ? [...access.usable] : null,   // null = everyone (Professional)
    confirmed_count: isStarter ? access.confirmedCount : null,
    view_only_count: isStarter ? Math.max(0, access.confirmedCount - access.usable.size) : 0,
    plan_full: isStarter ? access.usable.size >= access.limit : false,
    waiting_requests: waiting,
    can_swap: swap.canSwap,
    next_swap_at: swap.nextSwapAt
  };
};

// The therapist chooses which clients are active.
//  • Starter: exactly min(limit, clients) of them; allowed once every 30 days (the first automatic choice does not count).
//  • Professional with a downgrade pending: the choice made while downgrading (not counted as a swap).
const setActiveClients = async (therapist_id, client_ids) => {
  const access = await getAccess(therapist_id);
  const duringDowngrade = access.plan === 'professional' && access.pendingDowngrade;
  if (access.plan === 'professional' && !duringDowngrade) {
    return { ok: false, response: { status: false, code: 409, message: 'You are on Professional: all your clients are active.', data: null } };
  }
  const limit = access.limit != null ? access.limit : DEFAULT_STARTER_LIMIT;
  const ids = [...new Set((Array.isArray(client_ids) ? client_ids : []).map((x) => Number(x)).filter(Boolean))];

  const [rows] = await db.query(
    `SELECT id FROM prodesk_clients WHERE therapist_id = ? AND status = 'active' AND is_confirmed = 1`,
    [therapist_id]
  );
  const valid = new Set(rows.map((r) => r.id));
  const needed = Math.min(limit, rows.length);
  if (ids.length !== needed || ids.some((id) => !valid.has(id))) {
    return { ok: false, response: { status: false, code: 400, message: `Choose exactly ${needed} of your clients.`, data: null } };
  }

  const current = duringDowngrade ? new Set() : access.usable;
  const unchanged = ids.length === current.size && ids.every((id) => current.has(id));
  if (unchanged) return { ok: true, changed: false };

  if (!duringDowngrade) {
    const gate = await checkSwapAllowed(therapist_id, access);
    if (!gate.ok) return gate;
  }
  await db.query('UPDATE prodesk_clients SET starter_active = 0 WHERE therapist_id = ?', [therapist_id]);
  await db.query('UPDATE prodesk_clients SET starter_active = 1 WHERE therapist_id = ? AND id IN (?)', [therapist_id, ids]);
  if (!duringDowngrade) await recordSwap(therapist_id);
  return { ok: true, changed: true };
};

// Archiving an active client frees a place — that counts as the monthly swap
const checkArchive = async (therapist_id, client_id) => {
  const access = await getAccess(therapist_id);
  if (access.plan === 'professional' || !access.usable.has(Number(client_id))) return { ok: true, access, counts: false };
  const gate = await checkSwapAllowed(therapist_id, access);
  if (!gate.ok) return gate;
  return { ok: true, access, counts: true };
};

// Bringing an archived client back needs a free place on Starter
const checkRestore = async (therapist_id) => checkAddClient(therapist_id);

// A booking request from a new person arrived while the plan is full: tell the therapist (in-app), once per request
const notifyPlanFullRequest = async (therapist_id, client_id) => {
  try {
    const access = await getAccess(therapist_id);
    if (access.plan !== 'starter' || access.usable.size < access.limit || access.usable.has(Number(client_id))) return;
    const waiting = await waitingRequests(therapist_id);
    const [[t]] = await db.query('SELECT user_id FROM therapists WHERE id = ?', [therapist_id]);
    if (!t) return;
    const NotificationService = require('../notificationsAndAnnouncements/notificationService');
    await NotificationService.createNotification({
      user_id: t.user_id,
      type: 'BOOKING_REQUEST_PLAN_FULL',
      title: `${waiting} ${waiting === 1 ? 'person is' : 'people are'} waiting to book with you`,
      content: `Your Starter plan is full (${access.usable.size} of ${access.limit} clients). Upgrade to Professional to approve new booking requests.`,
      meta: { therapist_id, waiting }
    });
  } catch (e) {
    console.log('notifyPlanFullRequest failed (non-fatal)::>>', e.message);
  }
};

module.exports = {
  getPlanInfo, getAccess, checkAddClient, markClientActive,
  checkUseClient, checkApprove, confirmClientOnApproval, waitingRequests,
  getPlanOverview, setActiveClients, checkArchive, checkRestore, recordSwap, getSwapStatus, notifyPlanFullRequest
};
