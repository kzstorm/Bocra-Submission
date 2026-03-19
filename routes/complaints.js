/**
 * routes/complaints.js
 * POST /api/complaints         – File a complaint
 * GET  /api/complaints         – List all (admin)
 * GET  /api/complaints/:ref    – Track by reference
 * PUT  /api/complaints/:ref    – Update status (admin)
 */
import { db } from '../db/db.js';

const VALID_PROVIDERS   = ['Mascom Wireless','Orange Botswana','BTC','Botswana Fibre','Liquid Intelligent Technologies','Other'];
const VALID_CATEGORIES  = ['Billing Dispute','Poor Service Quality','Unauthorised Charges','Data Protection','Contract Dispute','Network Outage','Other'];
const VALID_STATUSES    = ['Received','Under Investigation','Awaiting Provider Response','Resolved','Closed'];

function generateRef(crypto) {
  const year = new Date().getFullYear();
  const num  = crypto.randomInt(1000, 9999);
  return `BOCRA-${year}-${num}`;
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export async function handleComplaints({ req, res, seg, body, crypto }) {
  const method = req.method;
  const ref    = seg[2]; // /api/complaints/:ref

  // GET /api/complaints/:ref  – public complaint tracker
  if (method === 'GET' && ref) {
    const complaint = db.findById('complaints', ref) || db.findOne('complaints', { id: ref });
    if (!complaint) return sendJSON(res, 404, { error: `Complaint ${ref} not found.` });
    // Return sanitised view (no internal notes for public)
    const { name, contact, ...safe } = complaint;
    return sendJSON(res, 200, safe);
  }

  // GET /api/complaints – list (paginated)
  if (method === 'GET') {
    const page   = parseInt(seg[3]) || 1;
    const limit  = 20;
    const status = req.headers['x-filter-status'];
    const filter = status ? { status } : {};
    const result = db.paginate('complaints', filter, page, limit);
    return sendJSON(res, 200, result);
  }

  // POST /api/complaints – file a new complaint
  if (method === 'POST') {
    const { name, contact, provider, category, description } = body;

    // Validation
    const errors = [];
    if (!name?.trim() || name.trim().length < 3)          errors.push('Full name is required (min 3 characters).');
    if (!contact?.trim() || contact.trim().length < 5)    errors.push('Contact details (email or phone) are required.');
    if (!provider || !VALID_PROVIDERS.includes(provider)) errors.push(`Provider must be one of: ${VALID_PROVIDERS.join(', ')}.`);
    if (!category || !VALID_CATEGORIES.includes(category))errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    if (!description?.trim() || description.trim().length < 20) errors.push('Complaint description is required (min 20 characters).');
    if (errors.length) return sendJSON(res, 422, { error: 'Validation failed.', details: errors });

    // Check for duplicate (same contact + provider in last 24h)
    const recent = db.findAll('complaints', { contact: contact.trim(), provider });
    const duplicate = recent.find(c => {
      const age = Date.now() - new Date(c.createdAt).getTime();
      return age < 86400000;
    });
    if (duplicate) {
      return sendJSON(res, 409, {
        error: 'Duplicate complaint.',
        message: `A complaint against ${provider} from this contact was already submitted within the last 24 hours.`,
        existingRef: duplicate.id,
      });
    }

    // Create complaint
    let ref;
    do { ref = generateRef(crypto); } while (db.findById('complaints', ref));

    const record = {
      id: ref, name: name.trim(), contact: contact.trim(),
      provider, category, description: description.trim(),
      status: 'Received', assignedTo: null, resolution: null,
    };
    db.insert('complaints', record);

    return sendJSON(res, 201, {
      success: true,
      message: 'Complaint received successfully.',
      reference: ref,
      status: 'Received',
      estimatedResolution: '48–72 business hours',
      trackingUrl: `/api/complaints/${ref}`,
    });
  }

  // PUT /api/complaints/:ref – update status
  if (method === 'PUT' && ref) {
    const { status, assignedTo, resolution } = body;
    if (status && !VALID_STATUSES.includes(status)) {
      return sendJSON(res, 422, { error: `Invalid status. Use: ${VALID_STATUSES.join(', ')}` });
    }
    const updated = db.update('complaints', ref, { status, assignedTo, resolution });
    if (!updated) return sendJSON(res, 404, { error: `Complaint ${ref} not found.` });
    return sendJSON(res, 200, { success: true, complaint: updated });
  }

  sendJSON(res, 405, { error: 'Method not allowed.' });
}
