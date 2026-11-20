// Internal client ID: PD-<therapist no.>-<client no.>, e.g. PD-001-0007.
// Given once when the client is created and never changed. Numbers count up per therapist.
const db = require('../../../config/db');

const assignClientCode = async (clientId, therapistId, conn = db) => {
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const [[row]] = await conn.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(client_code, '-', -1) AS UNSIGNED)), 0) + 1 AS n
         FROM prodesk_clients WHERE therapist_id = ? AND client_code IS NOT NULL`, [therapistId]);
      const code = `PD-${String(therapistId).padStart(3, '0')}-${String(row.n).padStart(4, '0')}`;
      try {
        await conn.query('UPDATE prodesk_clients SET client_code = ? WHERE id = ? AND client_code IS NULL', [code, clientId]);
        return code;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e; // two clients added at the same moment: try the next number
      }
    }
  } catch (e) {
    console.log('Error in assignClientCode::>>', e); // never block adding a client because of the code
  }
  return null;
};

module.exports = { assignClientCode };
