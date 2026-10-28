const db = require('../../../config/db');

// Marks a client as "just worked on" so they move to the top of the Clients list.
// Best effort: this must never make the real action (booking, invoice, sending) fail.
const touchClient = async (client_id) => {
  if (!client_id) return;
  try {
    await db.query('UPDATE prodesk_clients SET last_activity_at = NOW() WHERE id = ?', [client_id]);
  } catch (e) {
    console.log('touchClient failed (non-fatal)::>>', e.message);
  }
};

// Same, when only the session is known (e.g. rescheduling)
const touchClientBySession = async (session_id) => {
  if (!session_id) return;
  try {
    await db.query(
      `UPDATE prodesk_clients pc JOIN prodesk_sessions ps ON ps.client_id = pc.id
       SET pc.last_activity_at = NOW() WHERE ps.id = ?`,
      [session_id]
    );
  } catch (e) {
    console.log('touchClientBySession failed (non-fatal)::>>', e.message);
  }
};

module.exports = { touchClient, touchClientBySession };
