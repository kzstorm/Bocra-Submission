/**
 * routes/licences.js
 * GET  /api/licences           – List all licences (paginated)
 * GET  /api/licences/:id       – Get single licence
 * POST /api/licences           – Submit new licence application
 * PUT  /api/licences/:id       – Update licence (admin)
 */
import { db } from '../db/db.js';

const LICENCE_TYPES = {
  telecom:      ['Class A – National', 'Class B – Individual', 'Class C – ISP', 'Class D – VSAT', 'Class E – Reseller'],
  broadcasting: ['Commercial TV', 'Community TV', 'Commercial Radio', 'Community Radio', 'Subscription Broadcasting'],
  postal:       ['National Postal Operator', 'Courier Service', 'International Mail'],
  spectrum:     ['Fixed Wireless', 'Amateur Radio', 'Maritime', 'Aeronautical'],
};

function sendJSON(res, code, data) {
  res.writeHead(code);
  res.end(JSON.stringify(data));
}

function generateLicenceId(type, crypto) {
  const prefix = type === 'telecom' ? 'TL' : type === 'broadcasting' ? 'BL' : type === 'postal' ? 'PL' : 'SL';
  const year   = new Date().getFullYear();
  const num    = String(crypto.randomInt(100, 999)).padStart(3, '0');
  return `${prefix}-${year}-${num}`;
}

export async function handleLicences({ req, res, seg, body, url, crypto }) {
  const method = req.method;
  const id     = seg[2];

  // GET /api/licences/:id
  if (method === 'GET' && id) {
    const licence = db.findById('licences', id);
    if (!licence) return sendJSON(res, 404, { error: `Licence ${id} not found.` });
    return sendJSON(res, 200, licence);
  }

  // GET /api/licences  (+ query filters)
  if (method === 'GET') {
    const type   = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const page   = parseInt(url.searchParams.get('page')) || 1;
    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    const result = db.paginate('licences', filter, page, 20);
    const summary = {
      total:   db.count('licences'),
      active:  db.count('licences', { status: 'Active' }),
      pending: db.count('licences', { status: 'Pending' }),
      expired: db.count('licences', { status: 'Expired' }),
    };
    return sendJSON(res, 200, { ...result, summary });
  }

  // POST /api/licences – apply
  if (method === 'POST') {
    const { type, subtype, licencee, contact, area, spectrum } = body;
    const errors = [];
    if (!type || !LICENCE_TYPES[type])    errors.push(`Type must be one of: ${Object.keys(LICENCE_TYPES).join(', ')}.`);
    if (!licencee?.trim())                errors.push('Licencee (company/individual name) is required.');
    if (!contact?.trim())                 errors.push('Contact email is required.');
    if (!area?.trim())                    errors.push('Coverage area is required.');
    if (errors.length) return sendJSON(res, 422, { error: 'Validation failed.', details: errors });

    let lid;
    do { lid = generateLicenceId(type, crypto); } while (db.findById('licences', lid));

    const record = {
      id:       lid,
      type:     type.charAt(0).toUpperCase() + type.slice(1),
      subtype:  subtype || '',
      licencee: licencee.trim(),
      contact:  contact.trim(),
      status:   'Pending',
      issued:   null,
      expires:  null,
      spectrum: spectrum || [],
      area:     area.trim(),
    };
    db.insert('licences', record);

    return sendJSON(res, 201, {
      success: true,
      message: 'Licence application submitted successfully.',
      applicationId: lid,
      status:        'Pending',
      nextSteps:     'Your application will be reviewed within 5–10 business days. You will receive an email notification on any status changes.',
    });
  }

  // PUT /api/licences/:id
  if (method === 'PUT' && id) {
    const { status, issued, expires } = body;
    const updated = db.update('licences', id, { status, issued, expires });
    if (!updated) return sendJSON(res, 404, { error: `Licence ${id} not found.` });
    return sendJSON(res, 200, { success: true, licence: updated });
  }

  sendJSON(res, 405, { error: 'Method not allowed.' });
}
