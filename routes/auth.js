/**
 * routes/auth.js
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
import crypto from 'crypto';
import { db } from '../db/db.js';

const sessions = new Map(); // In-memory session store

function sendJSON(res, code, data) { res.writeHead(code); res.end(JSON.stringify(data)); }
function hashPassword(pw) { return crypto.createHash('sha256').update(pw + 'bocra_salt_2025').digest('hex'); }
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

export async function handleAuth({ req, res, seg, body }) {
  const action = seg[2]; // login | logout | me

  if (action === 'login' && req.method === 'POST') {
    const { email, password } = body;
    if (!email || !password) return sendJSON(res, 422, { error: 'Email and password are required.' });

    const user = db.findOne('users', { email: email.toLowerCase().trim() });
    // Demo: accept any password for seeded users in dev mode
    const isDev  = process.env.NODE_ENV !== 'production';
    const valid  = user && (isDev || user.passwordHash === hashPassword(password));
    if (!valid) return sendJSON(res, 401, { error: 'Invalid email or password.' });
    if (!user.active) return sendJSON(res, 403, { error: 'Account is inactive.' });

    const token = generateToken();
    sessions.set(token, { userId: user.id, role: user.role, name: user.name, email: user.email, created: Date.now() });

    res.setHeader('Set-Cookie', `bocra_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
    return sendJSON(res, 200, {
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }

  if (action === 'logout' && req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    sessions.delete(token);
    res.setHeader('Set-Cookie', 'bocra_session=; HttpOnly; Max-Age=0; Path=/');
    return sendJSON(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  if (action === 'me' && req.method === 'GET') {
    const token   = req.headers.authorization?.replace('Bearer ', '') || '';
    const session = sessions.get(token);
    if (!session) return sendJSON(res, 401, { error: 'Not authenticated.' });
    // Check session age (24h)
    if (Date.now() - session.created > 86400000) { sessions.delete(token); return sendJSON(res, 401, { error: 'Session expired.' }); }
    return sendJSON(res, 200, { user: session });
  }

  sendJSON(res, 404, { error: 'Auth endpoint not found.' });
}
