/**
 * routes/stats.js – GET /api/stats
 */
import { db } from '../db/db.js';

function sendJSON(res, code, data) { res.writeHead(code); res.end(JSON.stringify(data)); }

export async function handleStats({ req, res }) {
  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed.' });

  const licences       = db.findAll('licences');
  const complaints     = db.findAll('complaints');
  const consultations  = db.findAll('consultations');
  const domains        = db.findAll('domains');
  const advisories     = db.findAll('advisories');

  sendJSON(res, 200, {
    timestamp: new Date().toISOString(),
    licences: {
      total:   licences.length,
      active:  licences.filter(l => l.status === 'Active').length,
      pending: licences.filter(l => l.status === 'Pending').length,
      expired: licences.filter(l => l.status === 'Expired').length,
      byType: {
        telecom:      licences.filter(l => l.type === 'Telecom').length,
        broadcasting: licences.filter(l => l.type === 'Broadcasting').length,
        postal:       licences.filter(l => l.type === 'Postal').length,
      },
    },
    complaints: {
      total:               complaints.length,
      received:            complaints.filter(c => c.status === 'Received').length,
      underInvestigation:  complaints.filter(c => c.status === 'Under Investigation').length,
      resolved:            complaints.filter(c => c.status === 'Resolved').length,
      resolutionRate:      complaints.length
        ? Math.round(complaints.filter(c => c.status === 'Resolved').length / complaints.length * 100)
        : 0,
    },
    consultations: {
      total:   consultations.length,
      open:    consultations.filter(c => c.status === 'Open').length,
      closed:  consultations.filter(c => c.status === 'Closed').length,
      totalSubmissions: consultations.reduce((s, c) => s + (c.submissionsCount || 0), 0),
    },
    domains: {
      total:          domains.length,
      active:         domains.filter(d => d.status === 'Active').length,
      dnssecEnabled:  domains.filter(d => d.dnssec).length,
    },
    sector: {
      mobileSubscribers: 4200000,
      mobilePenetration: 89,
      internetPenetration: 62,
      broadbandSubscribers: 820000,
    },
    advisories: {
      total:    advisories.length,
      active:   advisories.filter(a => a.status === 'Active').length,
      critical: advisories.filter(a => a.severity === 'CRITICAL').length,
    },
  });
}
