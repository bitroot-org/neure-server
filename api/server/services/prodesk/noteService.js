const db = require('../../../config/db');

const autoPreview = (body) => {
  if (!body) return null;
  return body.replace(/[#*_`>\-]/g, '').trim().substring(0, 120);
};

const getNoteService = async (payload) => {
  try {
    console.log('Payload in getNoteService::>>', payload);
    const { therapist_id, session_id } = payload;

    const [session] = await db.query(
      'SELECT id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!session || !session.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const [rows] = await db.query(
      'SELECT * FROM prodesk_session_notes WHERE session_id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Note not found', data: null };
    }

    const note = rows[0];
    const [attachments] = await db.query(
      'SELECT * FROM prodesk_note_attachments WHERE note_id = ? ORDER BY uploaded_at DESC',
      [note.id]
    );
    note.attachments = attachments || [];

    return { status: true, code: 200, message: 'Note fetched', data: note };
  } catch (error) {
    console.log('Error in getNoteService::>>', error);
    return null;
  }
};

const createNoteService = async (payload) => {
  try {
    console.log('Payload in createNoteService::>>', payload);
    const { therapist_id, session_id, title, body, format = 'markdown', is_draft = false } = payload;

    const [session] = await db.query(
      'SELECT id, client_id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!session || !session.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const [existing] = await db.query(
      'SELECT id FROM prodesk_session_notes WHERE session_id = ?',
      [session_id]
    );
    if (existing && existing.length) {
      return { status: false, code: 409, message: 'Note already exists — use updateNote', data: null };
    }

    const preview = autoPreview(body);
    const [result] = await db.query(
      `INSERT INTO prodesk_session_notes
       (session_id, client_id, therapist_id, title, body, preview, format, is_draft)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session_id, session[0].client_id, therapist_id, title || null, body || null, preview, format, is_draft ? 1 : 0]
    );

    await db.query('UPDATE prodesk_sessions SET note_id = ? WHERE id = ?', [result.insertId, session_id]);
    return getNoteService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in createNoteService::>>', error);
    return null;
  }
};

const updateNoteService = async (payload) => {
  try {
    console.log('Payload in updateNoteService::>>', payload);
    const { therapist_id, session_id, title, body, format, is_draft } = payload;

    const [session] = await db.query(
      'SELECT id FROM prodesk_sessions WHERE id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!session || !session.length) {
      return { status: false, code: 404, message: 'Session not found', data: null };
    }

    const [existing] = await db.query(
      'SELECT id FROM prodesk_session_notes WHERE session_id = ? AND therapist_id = ?',
      [session_id, therapist_id]
    );
    if (!existing || !existing.length) {
      return { status: false, code: 404, message: 'Note not found — use createNote first', data: null };
    }

    const fields = []; const vals = [];
    if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
    if (body !== undefined) { fields.push('body = ?', 'preview = ?'); vals.push(body, autoPreview(body)); }
    if (format !== undefined) { fields.push('format = ?'); vals.push(format); }
    if (is_draft !== undefined) { fields.push('is_draft = ?'); vals.push(is_draft ? 1 : 0); }

    if (fields.length) {
      vals.push(existing[0].id);
      await db.query(`UPDATE prodesk_session_notes SET ${fields.join(', ')} WHERE id = ?`, vals);
    }

    return getNoteService({ therapist_id, session_id });
  } catch (error) {
    console.log('Error in updateNoteService::>>', error);
    return null;
  }
};

const getClientNotesService = async (payload) => {
  try {
    console.log('Payload in getClientNotesService::>>', payload);
    const { therapist_id, client_id, page = 1, limit = 20 } = payload;

    const offset = (page - 1) * limit;
    const [check] = await db.query(
      'SELECT id FROM prodesk_clients WHERE id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );
    if (!check || !check.length) {
      return { status: false, code: 404, message: 'Client not found', data: null };
    }

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM prodesk_session_notes WHERE client_id = ? AND therapist_id = ?',
      [client_id, therapist_id]
    );

    const [rows] = await db.query(
      `SELECT n.id, n.session_id, n.title, n.preview, n.format, n.is_draft,
              DATE_ADD(DATE_ADD(n.created_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS created_at,
              DATE_ADD(DATE_ADD(n.updated_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS updated_at,
              ps.session_number,
              DATE_ADD(DATE_ADD(ps.starts_at, INTERVAL 5 HOUR), INTERVAL 30 MINUTE) AS session_starts_at
       FROM prodesk_session_notes n
       JOIN prodesk_sessions ps ON ps.id = n.session_id
       WHERE n.client_id = ? AND n.therapist_id = ?
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [client_id, therapist_id, limit, offset]
    );

    return {
      status: true, code: 200, message: 'Client notes fetched',
      data: rows || [],
      pagination: { total, current_page: page, per_page: limit, total_pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.log('Error in getClientNotesService::>>', error);
    return null;
  }
};

const uploadNoteAttachmentService = async (payload) => {
  try {
    console.log('Payload in uploadNoteAttachmentService::>>', payload);
    const { therapist_id, session_id, file_name, file_url, size_bytes } = payload;

    const [note] = await db.query(
      `SELECT n.id FROM prodesk_session_notes n
       JOIN prodesk_sessions ps ON ps.id = n.session_id
       WHERE n.session_id = ? AND ps.therapist_id = ?`,
      [session_id, therapist_id]
    );
    if (!note || !note.length) {
      return { status: false, code: 404, message: 'Note not found', data: null };
    }

    const [result] = await db.query(
      'INSERT INTO prodesk_note_attachments (note_id, file_name, file_url, size_bytes) VALUES (?, ?, ?, ?)',
      [note[0].id, file_name, file_url, size_bytes || null]
    );

    return {
      status: true, code: 201, message: 'Attachment uploaded',
      data: { id: result.insertId, file_name, file_url, size_bytes }
    };
  } catch (error) {
    console.log('Error in uploadNoteAttachmentService::>>', error);
    return null;
  }
};

const deleteNoteAttachmentService = async (payload) => {
  try {
    console.log('Payload in deleteNoteAttachmentService::>>', payload);
    const { therapist_id, attachment_id } = payload;

    const [rows] = await db.query(
      `SELECT a.id FROM prodesk_note_attachments a
       JOIN prodesk_session_notes n ON n.id = a.note_id
       WHERE a.id = ? AND n.therapist_id = ?`,
      [attachment_id, therapist_id]
    );
    if (!rows || !rows.length) {
      return { status: false, code: 404, message: 'Attachment not found', data: null };
    }

    await db.query('DELETE FROM prodesk_note_attachments WHERE id = ?', [attachment_id]);
    return { status: true, code: 200, message: 'Attachment deleted', data: null };
  } catch (error) {
    console.log('Error in deleteNoteAttachmentService::>>', error);
    return null;
  }
};

module.exports = {
  getNoteService,
  createNoteService,
  updateNoteService,
  getClientNotesService,
  uploadNoteAttachmentService,
  deleteNoteAttachmentService
};
