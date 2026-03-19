/**
 * routes/news.js – GET /api/news, GET /api/news/:id
 */
import { db } from '../db/db.js';
function sendJSON(res, code, data) { res.writeHead(code); res.end(JSON.stringify(data)); }

export async function handleNews({ req, res, seg, url }) {
  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed.' });
  const id = seg[2];
  if (id) {
    const item = db.findById('news', id);
    if (!item) return sendJSON(res, 404, { error: 'Article not found.' });
    return sendJSON(res, 200, item);
  }
  const type  = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const page  = parseInt(url.searchParams.get('page'))  || 1;
  const filter = type ? { type } : {};
  const result = db.paginate('news', filter, page, limit);
  return sendJSON(res, 200, result);
}
