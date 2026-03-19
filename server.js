/**
 * BOCRA – Botswana Communications Regulatory Authority
 * Backend Server  |  Node.js 22+ (zero npm dependencies)
 * ───────────────────────────────────────────────────────
 * Run:  node server.js
 * URL:  http://localhost:3000
 */

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// ── Route handlers ───────────────────────────────────
import { handleComplaints }    from './routes/complaints.js';
import { handleLicences }      from './routes/licences.js';
import { handleDomains }       from './routes/domains.js';
import { handleConsultations } from './routes/consultations.js';
import { handleStats }         from './routes/stats.js';
import { handleNews }          from './routes/news.js';
import { handleAuth }          from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = process.env.PORT || 3000;
const PUBLIC    = path.join(__dirname, 'public');

// ── MIME types ───────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff2': 'font/woff2',
};

// ── CORS + Security headers ──────────────────────────
function setSecureHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-BOCRA-Token');
  res.setHeader('X-Content-Type-Options',       'nosniff');
  res.setHeader('X-Frame-Options',              'SAMEORIGIN');
  res.setHeader('X-XSS-Protection',             '1; mode=block');
  res.setHeader('Referrer-Policy',              'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security',    'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.anthropic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.anthropic.com;");
}

// ── Body parser ──────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ── Serve static files ───────────────────────────────
function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath)) {
    // SPA fallback – serve index.html
    const index = path.join(PUBLIC, 'index.html');
    if (fs.existsSync(index)) {
      res.setHeader('Content-Type', MIME['.html']);
      res.writeHead(200);
      res.end(fs.readFileSync(index));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=3600');
  res.setHeader('Content-Length', stat.size);
  res.writeHead(200);
  fs.createReadStream(filePath).pipe(res);
}

// ── Request logger ───────────────────────────────────
function log(req, status) {
  const ts   = new Date().toISOString();
  const ip   = req.socket.remoteAddress || '-';
  const flag = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
  console.log(`${flag}  ${ts}  ${ip}  ${req.method.padEnd(7)} ${status}  ${req.url}`);
}

// ── Rate limiter (simple in-memory) ─────────────────
const rateLimitMap = new Map();
function rateLimit(ip, limit = 100, windowMs = 60000) {
  const now  = Date.now();
  const data = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > data.reset) { data.count = 0; data.reset = now + windowMs; }
  data.count++;
  rateLimitMap.set(ip, data);
  return data.count > limit;
}

// ── Main router ──────────────────────────────────────
async function router(req, res) {
  setSecureHeaders(res);

  // OPTIONS preflight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const ip  = req.socket.remoteAddress || '0.0.0.0';
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const seg = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);

  // Rate limiting on API routes
  if (seg[0] === 'api' && rateLimit(ip, 200)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
    log(req, 429);
    return;
  }

  // ── API ROUTES ────────────────────────────────────
  if (seg[0] === 'api') {
    res.setHeader('Content-Type', 'application/json');
    let body = {};
    if (req.method !== 'GET') body = await parseBody(req);

    const ctx = { req, res, url, seg, body, ip, crypto };

    try {
      switch (seg[1]) {
        case 'complaints':    await handleComplaints(ctx);    break;
        case 'licences':      await handleLicences(ctx);      break;
        case 'domains':       await handleDomains(ctx);       break;
        case 'consultations': await handleConsultations(ctx); break;
        case 'stats':         await handleStats(ctx);         break;
        case 'news':          await handleNews(ctx);          break;
        case 'auth':          await handleAuth(ctx);          break;
        case 'health':
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }));
          break;
        default:
          res.writeHead(404);
          res.end(JSON.stringify({ error: `API endpoint /api/${seg[1]} not found.` }));
      }
    } catch (err) {
      console.error('[API Error]', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
    }

    log(req, res.statusCode);
    return;
  }

  // ── STATIC FILES ──────────────────────────────────
  let filePath = url.pathname === '/' ? path.join(PUBLIC, 'index.html') : path.join(PUBLIC, url.pathname);
  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); res.end('Forbidden'); return; }
  serveStatic(res, filePath);
  log(req, res.statusCode);
}

// ── Boot ─────────────────────────────────────────────
const server = http.createServer(router);
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🇧🇼  BOCRA Digital Platform  v1.0.0        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   Server: http://localhost:${PORT}               ║`);
  console.log(`║   API:    http://localhost:${PORT}/api/health     ║`);
  console.log('║   Press Ctrl+C to stop                       ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});
server.on('error', err => { console.error('Server error:', err.message); process.exit(1); });
