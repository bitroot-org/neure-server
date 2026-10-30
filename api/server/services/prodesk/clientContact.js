const db = require('../../../config/db');

// A client under 18 is contacted through their parent only (DPDP: the parent gave the consent).
// Every place that sends a session / invoice / resource message to a client runs its recipient
// row through here: if a parent consent is linked to the client, email and phone become the parent's.
// The parent's email is optional, so a missing one means "no email", never the child's own.
const applyParentContact = async (client_id, row) => {
  if (!row || !client_id) return row;
  try {
    const [[p]] = await db.query(
      `SELECT parent_phone, parent_email FROM prodesk_parent_consents
       WHERE client_id = ? AND verified_at IS NOT NULL ORDER BY id DESC LIMIT 1`,
      [client_id]
    );
    if (p) {
      row.email = p.parent_email || null;
      row.phone = p.parent_phone || null;
      row.is_parent_contact = true;
    }
  } catch (e) {
    console.log('applyParentContact failed (non-fatal)::>>', e.message);
  }
  return row;
};

module.exports = { applyParentContact };
