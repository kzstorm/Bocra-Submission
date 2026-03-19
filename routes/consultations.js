/**
 * routes/consultations.js
 * GET  /api/consultations         – List consultations
 * GET  /api/consultations/:id     – Get single consultation
 * POST /api/consultations/:id/comment – Submit a comment
 */
import { db } from '../db/db.js';

function sendJSON(res, code, data) { res.writeHead(code); res.end(JSON.stringify(data)); }

export async function handleConsultations({ req, res, seg, body, crypto }) {
  const method = req.method;
  const id     = seg[2];
  const action = seg[3]; // 'comment'

  // POST /api/consultations/:id/comment
  if (method === 'POST' && id && action === 'comment') {
    const { name, organisation, email, comment, type } = body;
    const errors = [];
    if (!name?.trim())    errors.push('Name is required.');
    if (!email?.trim())   errors.push('Email is required.');
    if (!comment?.trim() || comment.trim().length < 30) errors.push('Comment must be at least 30 characters.');
    if (errors.length) return sendJSON(res, 422, { error: 'Validation failed.', details: errors });

    const consultation = db.findById('consultations', id);
    if (!consultation) return sendJSON(res, 404, { error: 'Consultation not found.' });
    if (consultation.status === 'Closed') return sendJSON(res, 409, { error: 'This consultation is closed. The submission period has ended.' });

    const refNum = 'SUB-' + id + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const record = {
      id:           refNum,
      consultationId: id,
      name:         name.trim(),
      organisation: organisation?.trim() || 'Individual',
      email:        email.trim(),
      comment:      comment.trim(),
      type:         type || 'General',
    };
    db.insert('submissions', record);
    // increment count
    db.update('consultations', id, { submissionsCount: (consultation.submissionsCount || 0) + 1 });

    return sendJSON(res, 201, {
      success:   true,
      message:   'Your submission has been received. Thank you for participating in this consultation.',
      reference: refNum,
    });
  }

  // GET /api/consultations/:id
  if (method === 'GET' && id) {
    const c = db.findById('consultations', id);
    if (!c) return sendJSON(res, 404, { error: 'Consultation not found.' });
    return sendJSON(res, 200, c);
  }

  // GET /api/consultations
  if (method === 'GET') {
    const status = seg[2]; // optional filter
    const all = status ? db.findAll('consultations', { status }) : db.findAll('consultations');
    return sendJSON(res, 200, {
      consultations: all,
      summary: {
        total:   all.length,
        open:    all.filter(c => c.status === 'Open').length,
        closing: all.filter(c => c.status === 'Closing').length,
        closed:  all.filter(c => c.status === 'Closed').length,
      },
    });
  }

  sendJSON(res, 405, { error: 'Method not allowed.' });
}
