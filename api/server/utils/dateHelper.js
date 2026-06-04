const DATE_FIELDS = new Set([
  'created_at', 'updated_at', 'starts_at', 'paid_at', 'uploaded_at',
  'expires_at', 'last_active_at', 'due_date', 'issue_date', 'start_date',
  'joined_date', 'last_login', 'replaced_at', 'connected_at',
  'last_stress_modal_seen_at', 'pdf_generated_at', 'claimed_at',
  'assigned_at', 'completed_at', 'onboarding_date', 'conference_date',
  'date_of_birth', 'renewal_date'
]);

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

module.exports = { toIST, convertDatesToIST };
