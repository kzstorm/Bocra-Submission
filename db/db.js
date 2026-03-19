/**
 * db.js – Simple JSON file-based database (zero dependencies)
 * Each collection is stored as a JSON file in /db/data/
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function read(collection) {
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return []; }
}

function write(collection, data) {
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf8');
}

export const db = {
  // ── Find all ────────────────────────────────────
  findAll(col, filter = {}) {
    let rows = read(col);
    for (const [k, v] of Object.entries(filter)) {
      rows = rows.filter(r => r[k] === v);
    }
    return rows;
  },

  // ── Find one ────────────────────────────────────
  findOne(col, filter = {}) {
    return this.findAll(col, filter)[0] || null;
  },

  // ── Find by ID ──────────────────────────────────
  findById(col, id) {
    return read(col).find(r => r.id === id) || null;
  },

  // ── Insert ──────────────────────────────────────
  insert(col, record) {
    const data = read(col);
    data.push({ ...record, createdAt: new Date().toISOString() });
    write(col, data);
    return record;
  },

  // ── Update ──────────────────────────────────────
  update(col, id, updates) {
    const data = read(col);
    const idx  = data.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    write(col, data);
    return data[idx];
  },

  // ── Delete ──────────────────────────────────────
  delete(col, id) {
    const data = read(col);
    const next = data.filter(r => r.id !== id);
    write(col, next);
    return data.length !== next.length;
  },

  // ── Count ───────────────────────────────────────
  count(col, filter = {}) {
    return this.findAll(col, filter).length;
  },

  // ── Paginate ────────────────────────────────────
  paginate(col, filter = {}, page = 1, limit = 10) {
    const all   = this.findAll(col, filter).reverse(); // newest first
    const total = all.length;
    const data  = all.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  },
};
