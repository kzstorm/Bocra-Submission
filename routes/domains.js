/**
 * routes/domains.js
 */
import { db } from '../db/db.js';

const RESERVED = ['bocra','gov','parliament','police','mopit','bnls','burs','ppadb','bota','bobs','nbfira'];

function sendJSON(res, code, data) { res.writeHead(code); res.end(JSON.stringify(data)); }

export async function handleDomains({ req, res, seg, body, url, crypto }) {
  const method = req.method;
  const action = seg[2]; // check | register | whois

  // GET /api/domains/check?domain=example
  if (method === 'GET' && action === 'check') {
    const domain = url.searchParams.get('domain')?.toLowerCase().trim().replace(/\.co\.bw$|\.bw$/, '');
    if (!domain || domain.length < 2) return sendJSON(res, 422, { error: 'Domain name is required.' });
    if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(domain)) return sendJSON(res, 422, { error: 'Invalid domain name format.' });

    const existing = db.findAll('domains').find(d => d.domain.startsWith(domain + '.'));
    const reserved = RESERVED.includes(domain);
    const available = !existing && !reserved;

    return sendJSON(res, 200, {
      domain:      `${domain}.co.bw`,
      available,
      reason:      reserved ? 'Reserved domain name.' : existing ? 'Already registered.' : null,
      registrant:  existing ? '(redacted for privacy)' : null,
      suggestions: available ? [] : [
        `${domain}-bw.co.bw`, `${domain}online.co.bw`, `my${domain}.co.bw`,
      ],
    });
  }

  // POST /api/domains/register
  if (method === 'POST' && action === 'register') {
    const { domain, registrant, contact, years = 1 } = body;
    if (!domain || !registrant || !contact) return sendJSON(res, 422, { error: 'domain, registrant and contact are required.' });
    const clean = domain.toLowerCase().replace(/\.co\.bw$/, '');
    const existing = db.findAll('domains').find(d => d.domain.startsWith(clean + '.'));
    if (existing) return sendJSON(res, 409, { error: `${domain} is already registered.` });

    const now     = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + parseInt(years));

    const record = {
      id:         'D-' + crypto.randomBytes(4).toString('hex'),
      domain:     `${clean}.co.bw`,
      registrant: registrant.trim(),
      contact:    contact.trim(),
      status:     'Active',
      dnssec:     false,
      created:    now.toISOString().slice(0, 10),
      expires:    expires.toISOString().slice(0, 10),
    };
    db.insert('domains', record);
    return sendJSON(res, 201, { success: true, domain: record, message: 'Domain registered successfully.' });
  }

  // GET /api/domains/whois?domain=example.co.bw
  if (method === 'GET' && action === 'whois') {
    const d = url.searchParams.get('domain')?.toLowerCase().trim();
    if (!d) return sendJSON(res, 422, { error: 'domain query parameter required.' });
    const record = db.findAll('domains').find(r => r.domain === d);
    if (!record) return sendJSON(res, 404, { error: 'Domain not found in .BW registry.' });
    const { registrant, contact, ...pub } = record; // redact personal info
    return sendJSON(res, 200, { ...pub, registrant: 'REDACTED', contact: 'See registrar for contact details.' });
  }

  // GET /api/domains – list stats
  if (method === 'GET') {
    const all    = db.findAll('domains');
    const dnssec = all.filter(d => d.dnssec).length;
    return sendJSON(res, 200, {
      total:           all.length,
      active:          all.filter(d => d.status === 'Active').length,
      dnssecEnabled:   dnssec,
      dnssecPercent:   all.length ? Math.round(dnssec / all.length * 100) : 0,
      recentDomains:   all.slice(-5).reverse().map(d => ({ domain: d.domain, created: d.created })),
    });
  }

  sendJSON(res, 405, { error: 'Method not allowed.' });
}
