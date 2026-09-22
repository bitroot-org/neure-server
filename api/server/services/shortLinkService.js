const crypto = require('crypto');
const db = require('../../config/db');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // no 0/O/1/I/l — avoids visual ambiguity

const generateCode = (length = 7) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  }
  return code;
};

// PUBLIC_API_URL can still override explicitly if ever needed, but normally
// this just follows NODE_ENV: PRODUCTION -> the real public domain,
// otherwise (STAGING/local/undefined) -> localhost.
const getPublicBaseUrl = () => {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL;
  if ((process.env.NODE_ENV || '').toUpperCase() === 'PRODUCTION') return 'https://api.neure.co.in';
  return `http://localhost:${process.env.PORT || 3002}`;
};

const createShortLinkService = async ({ target_url, therapist_id = null }) => {
  try {
    if (!target_url) return null;

    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      const [existing] = await db.query('SELECT id FROM short_links WHERE code = ?', [code]);
      if (!existing.length) break;
      code = null;
    }
    if (!code) throw new Error('Could not generate a unique short code');

    await db.query(
      'INSERT INTO short_links (code, target_url, therapist_id) VALUES (?, ?, ?)',
      [code, target_url, therapist_id]
    );

    return `${getPublicBaseUrl()}/r/${code}`;
  } catch (error) {
    console.log('Error in createShortLinkService::>>', error);
    return null;
  }
};

const resolveShortLinkService = async (code) => {
  try {
    const [[row]] = await db.query('SELECT target_url FROM short_links WHERE code = ?', [code]);
    if (!row) return null;
    db.query('UPDATE short_links SET click_count = click_count + 1 WHERE code = ?', [code]).catch(() => {});
    return row.target_url;
  } catch (error) {
    console.log('Error in resolveShortLinkService::>>', error);
    return null;
  }
};

module.exports = { createShortLinkService, resolveShortLinkService };
