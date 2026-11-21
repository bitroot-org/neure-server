// Record History: a private "drive" of files for each client (PDF, Word, Excel, CSV, images ...).
// Files are stored in S3 WITHOUT a public link. The app asks for a short-lived link each time a file is opened.
// Only the therapist who owns the client can list, open, add or remove files.
const fs = require('fs');
const { nanoid } = require('nanoid');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const db = require('../../../config/db');
const { s3Client } = require('../../../config/s3Client');

const MAX_FILE_BYTES = 10 * 1024 * 1024;            // 10 MB per file
const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;     // 2 GB per therapist
const LINK_SECONDS = 300;                           // an opened link works for 5 minutes

// Allowed by file ending (what the browser says the type is can be wrong, e.g. CSV on Windows)
const TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};
const INLINE_OK = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt']); // can be shown in the browser instead of downloaded

const extOf = (name) => (String(name).split('.').pop() || '').toLowerCase();
const safeName = (name) => String(name || 'file').replace(/[\r\n"\\/]/g, '_').slice(0, 200);
const rm = (file) => { if (file?.path) try { fs.unlinkSync(file.path); } catch (_) {} };

const owns = async (therapist_id, client_id) => {
  const [r] = await db.query('SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ? AND deleted_at IS NULL', [client_id, therapist_id]);
  return !!(r && r.length);
};
const notFound = { status: false, code: 404, message: 'Client not found', data: null };

const listClientFilesService = async ({ therapist_id, client_id }) => {
  try {
    if (!(await owns(therapist_id, client_id))) return notFound;
    const [rows] = await db.query(
      `SELECT id, file_name, mime_type, size_bytes, created_at FROM prodesk_client_files
       WHERE client_id = ? AND therapist_id = ? AND deleted_at IS NULL ORDER BY created_at DESC, id DESC`, [client_id, therapist_id]);
    return { status: true, code: 200, message: 'Files fetched', data: rows };
  } catch (e) { console.log('Error in listClientFilesService::>>', e); return null; }
};

const uploadClientFileService = async ({ therapist_id, client_id, file }) => {
  try {
    if (!file) return { status: false, code: 400, message: 'Please choose a file', data: null };
    if (!(await owns(therapist_id, client_id))) { rm(file); return notFound; }
    const ext = extOf(file.originalname);
    if (!TYPES[ext]) { rm(file); return { status: false, code: 400, message: 'This file type is not allowed. Use PDF, Word, Excel, CSV, TXT or an image (JPG, PNG, WebP).', data: null }; }
    if (file.size > MAX_FILE_BYTES) { rm(file); return { status: false, code: 400, message: 'File is too big. The limit is 10 MB per file.', data: null }; }
    if (file.size === 0) { rm(file); return { status: false, code: 400, message: 'This file is empty.', data: null }; }

    const [[used]] = await db.query('SELECT COALESCE(SUM(size_bytes), 0) AS bytes FROM prodesk_client_files WHERE therapist_id = ? AND deleted_at IS NULL', [therapist_id]);
    if (Number(used.bytes) + file.size > MAX_TOTAL_BYTES) { rm(file); return { status: false, code: 403, message: 'Your storage is full (2 GB). Please delete some files first.', data: null }; }

    const key = `prodesk/client-files/${therapist_id}/${client_id}/${nanoid()}.${ext}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: fs.createReadStream(file.path), ContentType: TYPES[ext],
    })); // no ACL: the file is private
    rm(file);

    const name = safeName(file.originalname);
    const [r] = await db.query(
      'INSERT INTO prodesk_client_files (therapist_id, client_id, file_name, s3_key, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [therapist_id, client_id, name, key, TYPES[ext], file.size]);
    return { status: true, code: 200, message: 'File uploaded', data: { id: r.insertId, file_name: name, mime_type: TYPES[ext], size_bytes: file.size } };
  } catch (e) { rm(file); console.log('Error in uploadClientFileService::>>', e); return null; }
};

// Short-lived link to open or download one file
const getClientFileLinkService = async ({ therapist_id, file_id, inline = false }) => {
  try {
    const [rows] = await db.query('SELECT file_name, s3_key FROM prodesk_client_files WHERE id = ? AND therapist_id = ? AND deleted_at IS NULL', [file_id, therapist_id]);
    if (!rows || !rows.length) return { status: false, code: 404, message: 'File not found', data: null };
    const { file_name, s3_key } = rows[0];
    const show = inline && INLINE_OK.has(extOf(file_name));
    const url = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME, Key: s3_key,
      ResponseContentDisposition: `${show ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file_name)}`,
    }), { expiresIn: LINK_SECONDS });
    return { status: true, code: 200, message: 'Link ready', data: { url, file_name, expires_in: LINK_SECONDS } };
  } catch (e) { console.log('Error in getClientFileLinkService::>>', e); return null; }
};

const deleteClientFileService = async ({ therapist_id, file_id }) => {
  try {
    const [rows] = await db.query('SELECT s3_key FROM prodesk_client_files WHERE id = ? AND therapist_id = ? AND deleted_at IS NULL', [file_id, therapist_id]);
    if (!rows || !rows.length) return { status: false, code: 404, message: 'File not found', data: null };
    await db.query('UPDATE prodesk_client_files SET deleted_at = NOW() WHERE id = ?', [file_id]);
    try { await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: rows[0].s3_key })); }
    catch (e) { console.log('S3 delete failed (row already hidden)::>>', e.message); }
    return { status: true, code: 200, message: 'File deleted', data: null };
  } catch (e) { console.log('Error in deleteClientFileService::>>', e); return null; }
};

module.exports = { listClientFilesService, uploadClientFileService, getClientFileLinkService, deleteClientFileService, MAX_FILE_BYTES };
