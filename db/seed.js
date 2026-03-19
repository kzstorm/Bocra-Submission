/**
 * seed.js – Populate initial data for BOCRA platform
 * Run once: node db/seed.js
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function save(name, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`  ✓ Seeded ${name}.json (${data.length} records)`);
}

// ── COMPLAINTS ────────────────────────────────────────
save('complaints', [
  {
    id: 'BOCRA-2025-1001', name: 'John Tladi', contact: 'john.tladi@gmail.com',
    provider: 'Mascom Wireless', category: 'Billing Dispute',
    description: 'Charged twice for the same data bundle on 01 March 2025.',
    status: 'Resolved', assignedTo: 'Consumer Affairs Officer – Ms. Kebonye',
    resolution: 'Provider instructed to issue full refund within 5 business days.',
    createdAt: '2025-03-01T09:00:00Z', updatedAt: '2025-03-05T14:30:00Z',
  },
  {
    id: 'BOCRA-2025-1150', name: 'Mary Molefe', contact: 'mary.m@outlook.com',
    provider: 'Orange Botswana', category: 'Poor Service Quality',
    description: 'No 4G signal in Francistown CBD for 2 weeks.',
    status: 'Under Investigation', assignedTo: 'Technical Investigations Unit',
    resolution: null,
    createdAt: '2025-03-10T11:00:00Z', updatedAt: '2025-03-12T08:00:00Z',
  },
  {
    id: 'BOCRA-2025-1247', name: 'Samuel Seretse', contact: '+267 71234567',
    provider: 'BTC', category: 'Unauthorised Charges',
    description: 'BWP 120 deducted from my account without authorisation.',
    status: 'Awaiting Provider Response', assignedTo: 'Consumer Affairs Officer – Mr. Kefilwe',
    resolution: null,
    createdAt: '2025-03-13T15:20:00Z', updatedAt: '2025-03-14T09:00:00Z',
  },
]);

// ── LICENCES ──────────────────────────────────────────
save('licences', [
  {
    id: 'TL-2025-089', type: 'Telecom', subtype: 'Class B – Individual',
    licencee: 'Netco Botswana Pty Ltd', contact: 'admin@netco.co.bw',
    status: 'Active', issued: '2025-01-15', expires: '2030-01-14',
    spectrum: ['900MHz', '1800MHz'], area: 'National',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'TL-2025-045', type: 'Telecom', subtype: 'Class A – National',
    licencee: 'Mascom Wireless Pty Ltd', contact: 'regulatory@mascom.bw',
    status: 'Active', issued: '2025-01-01', expires: '2030-12-31',
    spectrum: ['700MHz', '900MHz', '1800MHz', '2100MHz', '2600MHz'], area: 'National',
    createdAt: '2024-12-15T08:00:00Z',
  },
  {
    id: 'BL-2025-012', type: 'Broadcasting', subtype: 'Commercial Television',
    licencee: 'BTV Holdings Ltd', contact: 'licensing@btv.co.bw',
    status: 'Active', issued: '2025-02-01', expires: '2030-01-31',
    spectrum: [], area: 'National',
    createdAt: '2025-01-20T08:00:00Z',
  },
  {
    id: 'TL-2025-102', type: 'Telecom', subtype: 'Class C – ISP',
    licencee: 'FibreNet Solutions Pty Ltd', contact: 'licensing@fibrenet.co.bw',
    status: 'Pending', issued: null, expires: null,
    spectrum: [], area: 'Gaborone, Francistown',
    createdAt: '2025-03-01T08:00:00Z',
  },
]);

// ── DOMAINS ───────────────────────────────────────────
save('domains', [
  { id: 'D-001', domain: 'bocra.org.bw',     registrant: 'BOCRA',            status: 'Active', dnssec: true,  created: '2012-01-01', expires: '2026-01-01' },
  { id: 'D-002', domain: 'gov.bw',           registrant: 'Government of BW', status: 'Active', dnssec: true,  created: '2000-01-01', expires: '2026-01-01' },
  { id: 'D-003', domain: 'mascom.co.bw',     registrant: 'Mascom Wireless',  status: 'Active', dnssec: false, created: '2005-06-12', expires: '2026-06-12' },
  { id: 'D-004', domain: 'orange.co.bw',     registrant: 'Orange Botswana',  status: 'Active', dnssec: false, created: '2007-03-01', expires: '2026-03-01' },
  { id: 'D-005', domain: 'btc.co.bw',        registrant: 'BTC',              status: 'Active', dnssec: true,  created: '1998-09-15', expires: '2026-09-15' },
  { id: 'D-006', domain: 'ub.ac.bw',         registrant: 'University of BW', status: 'Active', dnssec: false, created: '2002-01-01', expires: '2026-01-01' },
  { id: 'D-007', domain: 'bankofbotswana.bw', registrant: 'Bank of Botswana',status: 'Active', dnssec: true,  created: '2001-04-01', expires: '2026-04-01' },
]);

// ── CONSULTATIONS ─────────────────────────────────────
save('consultations', [
  {
    id: 'CONS-2025-001',
    title: 'Mobile Number Portability Regulations 2025',
    sector: 'Telecom',
    summary: 'Proposed regulations to establish a comprehensive mobile number portability framework enabling subscribers to retain their phone numbers when switching mobile operators.',
    document: '/assets/MNP-Consultation-2025.pdf',
    status: 'Open',
    opens: '2025-02-14', closes: '2025-03-31',
    submissionsCount: 47,
    createdAt: '2025-02-10T08:00:00Z',
  },
  {
    id: 'CONS-2025-002',
    title: '5G Spectrum Allocation Framework',
    sector: 'Spectrum',
    summary: 'Consultation on the policy and technical framework for the allocation of millimeter-wave and sub-6GHz spectrum bands for commercial 5G deployment in Botswana.',
    document: '/assets/5G-Spectrum-Consultation-2025.pdf',
    status: 'Open',
    opens: '2025-03-01', closes: '2025-04-15',
    submissionsCount: 23,
    createdAt: '2025-02-28T08:00:00Z',
  },
  {
    id: 'CONS-2025-003',
    title: 'Electronic Communications (Tariff) Regulations Review',
    sector: 'Telecom',
    summary: 'Review of tariff regulations applicable to electronic communications service providers including interconnection rates and retail price benchmarking methodology.',
    document: '/assets/Tariff-Review-Consultation-2025.pdf',
    status: 'Closing',
    opens: '2025-02-01', closes: '2025-03-22',
    submissionsCount: 31,
    createdAt: '2025-01-28T08:00:00Z',
  },
  {
    id: 'CONS-2024-008',
    title: 'Draft Data Protection Regulations 2024',
    sector: 'Internet & Data',
    summary: 'Implementing regulations to the Botswana Data Protection Act, including data breach notification requirements and cross-border data transfer rules.',
    document: '/assets/DPA-Regulations-Consultation-2024.pdf',
    status: 'Closed',
    opens: '2024-10-01', closes: '2024-12-15',
    submissionsCount: 142,
    createdAt: '2024-09-25T08:00:00Z',
  },
]);

// ── NEWS ──────────────────────────────────────────────
save('news', [
  {
    id: 'NEWS-001', type: 'Press Release',
    title: 'BOCRA Opens Public Consultation on Mobile Number Portability Regulations 2025',
    excerpt: 'BOCRA invites all stakeholders to submit written comments on proposed Mobile Number Portability Regulations. The consultation period closes 31 March 2025.',
    body: 'The Botswana Communications Regulatory Authority (BOCRA) today opened a public consultation on the proposed Mobile Number Portability Regulations 2025. The regulations aim to enhance consumer choice and promote competition in the mobile telecommunications market by enabling subscribers to retain their mobile numbers when switching service providers. Stakeholders including telecommunications operators, consumer advocacy groups, and members of the public are invited to submit written comments by 31 March 2025. Submissions can be made online through the BOCRA Consultations Portal or submitted in writing to BOCRA House, Gaborone.',
    tags: ['MNP', 'Consumer', 'Regulation'],
    date: '2025-03-14', author: 'BOCRA Communications', featured: true,
    createdAt: '2025-03-14T08:00:00Z',
  },
  {
    id: 'NEWS-002', type: 'Advisory',
    title: 'BW-CIRT Issues Critical Advisory on Enterprise VPN Vulnerabilities',
    excerpt: 'BW-CIRT identifies critical remote code execution vulnerability in enterprise VPN solutions affecting Botswana organisations — immediate patching required.',
    body: 'The Botswana Computer Incident Response Team (BW-CIRT) has issued a critical security advisory regarding a zero-day remote code execution vulnerability (CVE-2025-0412) affecting widely deployed enterprise VPN solutions. Organisations using affected products are urged to apply available patches immediately and monitor systems for signs of compromise.',
    tags: ['Cybersecurity', 'BW-CIRT', 'Advisory'],
    date: '2025-03-12', author: 'BW-CIRT', featured: false,
    createdAt: '2025-03-12T10:00:00Z',
  },
  {
    id: 'NEWS-003', type: 'Announcement',
    title: 'BOCRA Announces 5G Spectrum Allocation Framework',
    excerpt: 'BOCRA releases framework for commercial 5G deployment in Botswana targeting Q3 2025 rollout in major urban centres.',
    body: 'BOCRA has published the 5G Spectrum Allocation Framework outlining the technical and licensing conditions for commercial 5G deployment. The framework covers sub-6GHz (700MHz, 2600MHz, 3500MHz) and mmWave (26GHz) bands. A public consultation will be held before final framework adoption.',
    tags: ['5G', 'Spectrum', 'Announcement'],
    date: '2025-03-08', author: 'BOCRA Spectrum Division', featured: false,
    createdAt: '2025-03-08T09:00:00Z',
  },
  {
    id: 'NEWS-004', type: 'Notice',
    title: 'New QoS Benchmarks for Mobile Broadband Published',
    excerpt: 'BOCRA sets mandatory quality-of-service benchmarks for mobile broadband effective Q2 2025. Operators must comply by 30 June 2025.',
    body: 'BOCRA has published revised Quality of Service benchmarks for mobile broadband services. The new benchmarks set minimum thresholds for download speeds, latency, and network availability. All licensed mobile operators are required to comply by 30 June 2025 and submit quarterly QoS reports.',
    tags: ['QoS', 'Consumer', 'Mobile'],
    date: '2025-03-03', author: 'BOCRA Technical Division', featured: false,
    createdAt: '2025-03-03T08:00:00Z',
  },
  {
    id: 'NEWS-005', type: 'Announcement',
    title: 'Upgraded .BW Domain Registry Portal Launched',
    excerpt: 'BOCRA launches enhanced .BW domain registry with DNSSEC support, improved WHOIS, and self-service domain management.',
    body: 'BOCRA has officially launched the upgraded .BW Domain Registry Portal, featuring full DNSSEC implementation, an enhanced WHOIS lookup service, and a self-service management dashboard for domain registrants. The portal integrates with all 12 accredited .bw registrars.',
    tags: ['Registry', '.BW', 'DNSSEC'],
    date: '2025-02-28', author: 'BOCRA Registry Division', featured: false,
    createdAt: '2025-02-28T08:00:00Z',
  },
]);

// ── USERS (for portal authentication) ────────────────
save('users', [
  {
    id: 'U-001', name: 'Admin User', email: 'admin@bocra.org.bw',
    role: 'admin', passwordHash: 'hashed_password_placeholder',
    active: true, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'U-002', name: 'Regulatory Officer', email: 'officer@bocra.org.bw',
    role: 'officer', passwordHash: 'hashed_password_placeholder',
    active: true, createdAt: '2025-01-01T00:00:00Z',
  },
]);

// ── ADVISORIES ────────────────────────────────────────
save('advisories', [
  {
    id: 'ADV-2025-04', severity: 'CRITICAL', title: 'Enterprise VPN Zero-Day — CVE-2025-0412',
    description: 'A critical remote code execution vulnerability has been identified in widely used enterprise VPN solutions. Immediate patching required.',
    cve: 'CVE-2025-0412', affectedProducts: ['FortiGate', 'Pulse Secure', 'Cisco AnyConnect'],
    mitigation: 'Apply vendor-provided patches immediately. If patching is not possible, restrict VPN access to trusted IP ranges.',
    status: 'Active', published: '2025-03-12', createdAt: '2025-03-12T10:00:00Z',
  },
  {
    id: 'ADV-2025-03', severity: 'MODERATE', title: 'Phishing Campaign Targeting Botswana Financial Institutions',
    description: 'Active phishing campaign impersonating major Botswana banks. Employees and customers are advised to verify all email communications.',
    cve: null, affectedProducts: ['Email clients', 'Web browsers'],
    mitigation: 'Enable multi-factor authentication. Train staff to identify phishing indicators. Report suspicious emails to BW-CIRT.',
    status: 'Active', published: '2025-03-05', createdAt: '2025-03-05T09:00:00Z',
  },
]);

console.log('\n🌱 BOCRA database seeded successfully!\n');
