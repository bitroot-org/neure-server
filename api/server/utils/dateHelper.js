const DATE_FIELDS = new Set([
  'created_at', 'updated_at', 'paid_at', 'uploaded_at',
  'expires_at', 'last_active_at', 'due_date', 'issue_date', 'start_date',
  'joined_date', 'last_login', 'replaced_at', 'connected_at',
  'last_stress_modal_seen_at', 'pdf_generated_at', 'claimed_at',
  'assigned_at', 'completed_at', 'onboarding_date', 'conference_date',
  'date_of_birth', 'renewal_date'
]);
// NOTE: 'starts_at' is intentionally excluded — it is stored as a naive
// IST wall-clock string (user-supplied session time), not a UTC timestamp,
// so it must pass through unshifted. Shifting it here caused sessions to
// display/notify at the wrong time (e.g. 6pm shown as 11:30pm).

function toIST(utcVal) {
  if (!utcVal) return null;
  const d = new Date(utcVal);
  if (isNaN(d.getTime())) return utcVal;
  d.setMinutes(d.getMinutes() + 330); // +5h30m
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function convertDatesToIST(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertDatesToIST);
  const out = {};
  for (const key of Object.keys(obj)) {
    if (DATE_FIELDS.has(key) && obj[key] != null) {
      out[key] = toIST(obj[key]);
    } else if (obj[key] !== null && typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
      out[key] = convertDatesToIST(obj[key]);
    } else {
      out[key] = obj[key];
    }
  }
  return out;
}

// starts_at (and similar user-supplied session times) is stored as a naive
// IST wall-clock string ("YYYY-MM-DD HH:MM:SS" / "YYYY-MM-DDTHH:MM:SS"), not
// UTC. Format it literally instead of running it through Date + timeZone
// conversion, which double-shifts it by the IST offset.
function formatISTWallClock(naiveDateStr) {
  if (!naiveDateStr) return null;
  const [datePart, timePart = '00:00:00'] = String(naiveDateStr).replace(' ', 'T').split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  const wallClock = new Date(Date.UTC(y, (m || 1) - 1, d || 1, h || 0, mi || 0, s || 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(wallClock);
}

module.exports = { toIST, convertDatesToIST, formatISTWallClock };
