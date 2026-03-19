/**
 * app.js – BOCRA Frontend Application
 * All UI logic + API integration. Single source of truth.
 */

// ── API Client ────────────────────────────────────────
const API = {
  base: '/api',
  async request(method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const token = localStorage.getItem('bocra_token');
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body)  opts.body = JSON.stringify(body);
    try {
      const r    = await fetch(this.base + path, opts);
      const data = await r.json();
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Network error. Please check your connection.' } };
    }
  },
  get:  (p)    => API.request('GET',  p),
  post: (p, b) => API.request('POST', p, b),
  put:  (p, b) => API.request('PUT',  p, b),
};

// ── Toast ─────────────────────────────────────────────
const Toast = {
  show(msg, type = 'success', icon = null, title = null) {
    const icons  = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const titles = { success:'Success', error:'Error', warning:'Warning', info:'Information' };
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="toast-icon">${icon || icons[type]}</div>
      <div class="toast-body">
        <div class="toast-title">${title || titles[type]}</div>
        <div class="toast-msg">${msg}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>`;
    c.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.35s ease forwards';
      setTimeout(() => el.remove(), 350);
    }, 5000);
  }
};
window.showToast = (m, t, i, ti) => Toast.show(m, t, i, ti);

// ── Cookie Consent ────────────────────────────────────
window.acceptCookies = () => {
  localStorage.setItem('bocra_cookies', 'accepted');
  const b = document.getElementById('cookie-banner');
  if (b) b.remove();
  Toast.show('Cookie preferences saved.', 'success', '🍪');
};
window.rejectCookies = () => {
  localStorage.setItem('bocra_cookies', 'essential');
  const b = document.getElementById('cookie-banner');
  if (b) b.remove();
  Toast.show('Non-essential cookies rejected.', 'info', '🍪');
};

// ── Accessibility ─────────────────────────────────────
let fontScale = 1;
window.changeFontSize = (d) => {
  fontScale = Math.max(0.85, Math.min(fontScale + d * 0.07, 1.35));
  document.documentElement.style.fontSize = fontScale + 'rem';
  Toast.show(`Text size ${d > 0 ? 'increased' : 'decreased'}.`, 'info', '🔤');
};
window.toggleContrast = () => {
  document.body.classList.toggle('hc-mode');
  Toast.show(document.body.classList.contains('hc-mode') ? 'High contrast enabled.' : 'Standard contrast restored.', 'info', '◑');
};
window.switchLang = (lang, btn) => {
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  Toast.show(lang === 'en' ? 'Language: English' : 'Phetolela go Setswana…', 'info', '🌐');
};

// ── Mobile Menu ───────────────────────────────────────
window.openMobileMenu = () => {
  document.getElementById('mobile-menu')?.classList.add('open');
  const h = document.getElementById('hamburger');
  if (h) { h.classList.add('open'); h.setAttribute('aria-expanded', 'true'); }
  document.body.style.overflow = 'hidden';
};
window.closeMobileMenu = () => {
  document.getElementById('mobile-menu')?.classList.remove('open');
  const h = document.getElementById('hamburger');
  if (h) { h.classList.remove('open'); h.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
};

// ── Search ────────────────────────────────────────────
const searchIndex = [
  { icon:'📋', label:'Apply for a Telecom Licence',        url:'#services' },
  { icon:'📺', label:'Apply for a Broadcasting Licence',   url:'#services' },
  { icon:'📣', label:'File a Consumer Complaint',          url:'#complaint-section' },
  { icon:'🌐', label:'Register a .bw Domain',              url:'#domain-section' },
  { icon:'🔒', label:'Report a Cybersecurity Incident',    url:'#cyber' },
  { icon:'📄', label:'View Public Consultations',          url:'#consultations' },
  { icon:'📊', label:'Download Annual Reports',            url:'#publications' },
  { icon:'📡', label:'Spectrum Management',                url:'#sectors' },
  { icon:'⚖️', label:'Regulations and Guidelines',         url:'#about' },
  { icon:'🛡',  label:'BW-CIRT Security Advisories',       url:'#cyber' },
  { icon:'🔍', label:'WHOIS Domain Lookup',               url:'#domain-section' },
  { icon:'📮', label:'Postal Services Licensing',          url:'#sectors' },
];

window.handleSearch = (q) => {
  const box = document.getElementById('search-results');
  if (!q.trim()) { box?.classList.remove('visible'); return; }
  const results = searchIndex.filter(s => s.label.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  if (box) {
    box.innerHTML = results.length
      ? results.map(s => `<div class="sr-item" role="option" tabindex="0"
          onclick="selectSearch('${s.label}','${s.url}')"
          onkeydown="if(event.key==='Enter')selectSearch('${s.label}','${s.url}')">
          <span class="sr-icon">${s.icon}</span>${s.label}</div>`).join('')
      : `<div class="sr-item"><span class="sr-icon">🔍</span>No results for "<em>${q}</em>"</div>`;
    box.classList.add('visible');
  }
};
window.selectSearch = (label, anchor) => {
  const inp = document.getElementById('nav-search');
  if (inp) inp.value = label;
  document.getElementById('search-results')?.classList.remove('visible');
  if (anchor.startsWith('#')) {
    const el = document.querySelector(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
  Toast.show(`Navigating to: ${label}`, 'info', '🔍');
};
window.doSearch = () => {
  const q = document.getElementById('nav-search')?.value.trim();
  if (q) {
    document.getElementById('search-results')?.classList.remove('visible');
    Toast.show(`Searching for "${q}"…`, 'info', '🔍');
  }
};
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('search-results')?.classList.remove('visible');
  }
});

// ── Dropdowns ─────────────────────────────────────────
window.toggleDropdown = (btn) => {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.nav-link[aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (!expanded) btn.setAttribute('aria-expanded', 'true');
};
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-link[aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
});

// ── Tabs ──────────────────────────────────────────────
window.switchTab = (btn) => {
  btn.closest('.sp-tabs')?.querySelectorAll('.sp-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
};

// ── API Code Explorer ─────────────────────────────────
window.switchApiTab = (btn, id) => {
  btn.closest('.api-showcase')?.querySelectorAll('.api-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  btn.closest('.api-showcase')?.querySelectorAll('.code-block').forEach(b => b.style.display = 'none');
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
};
window.copyCode = (id) => {
  const text = document.getElementById(id)?.innerText.replace(/^COPY\n/, '');
  if (text) navigator.clipboard?.writeText(text).catch(() => {});
  Toast.show('Code snippet copied to clipboard.', 'success', '📋');
};

// ── Multi-Step Complaint Form ─────────────────────────
function setFormStep(n) {
  for (let i = 1; i <= 3; i++) {
    const s   = document.getElementById(`form-step${i}`);
    const ind = document.getElementById(`step${i}-indicator`);
    if (s)   s.style.display    = i === n ? 'block' : 'none';
    if (ind) { ind.classList.toggle('active', i === n); ind.classList.toggle('done', i < n); }
  }
}
window.nextStep = () => {
  const name     = document.getElementById('cf-name')?.value.trim();
  const contact  = document.getElementById('cf-email')?.value.trim();
  const provider = document.getElementById('cf-provider')?.value;
  const category = document.getElementById('cf-category')?.value;
  if (!name || name.length < 3)       { Toast.show('Please enter your full name.', 'error', '⚠️'); return; }
  if (!contact || contact.length < 5) { Toast.show('Please enter contact details.', 'error', '⚠️'); return; }
  if (!provider)                      { Toast.show('Please select a service provider.', 'error', '⚠️'); return; }
  if (!category)                      { Toast.show('Please select a complaint category.', 'error', '⚠️'); return; }
  setFormStep(2);
};
window.prevStep = () => setFormStep(1);
window.validateField = (input, type) => {
  const valid = type === 'name' ? input.value.trim().length > 2 : input.value.trim().length > 4;
  input.className = input.value.trim() ? (valid ? 'valid' : 'invalid') : '';
  input.closest('.form-group')?.classList.toggle('has-error', !valid && input.value.trim().length > 0);
};
window.submitComplaint = async () => {
  const desc = document.getElementById('cf-complaint')?.value.trim();
  if (!desc || desc.length < 20) {
    Toast.show('Please describe your complaint (min 20 characters).', 'error', '⚠️');
    return;
  }
  const btn = document.querySelector('#form-step2 .btn-gold');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  const result = await API.post('/complaints', {
    name:        document.getElementById('cf-name').value.trim(),
    contact:     document.getElementById('cf-email').value.trim(),
    provider:    document.getElementById('cf-provider').value,
    category:    document.getElementById('cf-category').value,
    description: desc,
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Submit Complaint →'; }

  if (result.ok) {
    setFormStep(3);
    const ref = result.data.reference;
    const refEl = document.getElementById('complaint-ref');
    if (refEl) refEl.textContent = ref;
    Toast.show(`Complaint submitted! Ref: ${ref}`, 'success', '✅', 'Complaint Received');
  } else {
    const msg = result.data.message || result.data.error || 'Submission failed. Please try again.';
    Toast.show(msg, result.status === 409 ? 'warning' : 'error', '⚠️');
  }
};

// ── Complaint Tracker ─────────────────────────────────
window.trackComplaint = async () => {
  const ref = document.getElementById('track-input')?.value.trim().toUpperCase();
  if (!ref) { Toast.show('Please enter a complaint reference number.', 'error', '⚠️'); return; }

  const btn = document.querySelector('.tracker-input-row button');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const result = await API.get(`/complaints/${ref}`);

  if (btn) { btn.disabled = false; btn.textContent = 'Track →'; }

  const resultEl = document.getElementById('tracker-result');
  if (result.ok) {
    const stEl = document.getElementById('tracker-status-text');
    const dtEl = document.getElementById('tracker-detail-text');
    if (stEl) stEl.textContent = `Status: ${result.data.status}`;
    if (dtEl) dtEl.textContent = result.data.assignedTo ? `Assigned to: ${result.data.assignedTo}` : 'Awaiting assignment.';
    resultEl?.classList.add('visible');
    Toast.show(`Found — Status: ${result.data.status}`, 'success', '🔍');
  } else {
    resultEl?.classList.remove('visible');
    Toast.show(result.data.error || `No record found for "${ref}".`, 'error', '🔍');
  }
};

// ── Domain Search ─────────────────────────────────────
window.searchDomain = async () => {
  const raw = document.getElementById('domain-input')?.value.trim().toLowerCase().replace(/\..*$/, '');
  if (!raw || raw.length < 2) { Toast.show('Please enter a domain name.', 'error', '⚠️'); return; }

  const btn = document.querySelector('.ds-btn');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const result = await API.get(`/domains/check?domain=${encodeURIComponent(raw)}`);

  if (btn) { btn.disabled = false; btn.textContent = 'Search ›'; }

  const box = document.getElementById('domain-result');
  if (!box) return;

  if (result.ok) {
    const { domain, available, reason, suggestions } = result.data;
    if (available) {
      box.innerHTML = `
        <div class="ds-available">
          <div>
            <div class="ds-result-text">✅ <strong>${domain}</strong> is available!</div>
            <div class="ds-result-detail">Register through an accredited .bw registrar.</div>
          </div>
          <button class="btn btn-gold btn-sm" onclick="registerDomain('${domain}')">Register Now ›</button>
        </div>`;
      Toast.show(`${domain} is available!`, 'success', '🌐');
    } else {
      const sugg = suggestions?.length
        ? `<div style="margin-top:8px;font-size:11px;color:var(--steel)">Try: ${suggestions.map(s=>`<strong>${s}</strong>`).join(', ')}</div>`
        : '';
      box.innerHTML = `
        <div class="ds-taken">
          <div class="ds-result-text">❌ <strong>${domain}</strong> is not available</div>
          <div class="ds-result-detail">${reason || 'Already registered.'}${sugg}</div>
        </div>`;
      Toast.show(`${domain} is not available.`, 'warning', '🌐');
    }
    box.classList.add('visible');
  } else {
    Toast.show(result.data.error || 'Domain search failed.', 'error', '❌');
  }
};
window.clearDomainResult = () => document.getElementById('domain-result')?.classList.remove('visible');
window.registerDomain    = (d) => Toast.show(`Redirecting to registrar portal for ${d}…`, 'info', '🌐');

// ── Consultation Comment ──────────────────────────────
window.submitConsultation = async (id) => {
  const result = await API.get(`/consultations/${id}`);
  if (result.ok) {
    const c = result.data;
    if (c.status === 'Closed') {
      Toast.show('This consultation is closed. Viewing submitted comments.', 'info', '📋');
    } else {
      Toast.show(`Opening submission form for: ${c.title}`, 'info', '📄');
    }
  } else {
    Toast.show('Could not load consultation details.', 'error');
  }
};

// ── AI Chatbot ────────────────────────────────────────
let chatOpen = false;
const chatHistory = [];

window.toggleChat = () => {
  chatOpen = !chatOpen;
  const w   = document.getElementById('chat-window');
  const fab = document.getElementById('chat-fab');
  w?.classList.toggle('open', chatOpen);
  fab?.setAttribute('aria-expanded', String(chatOpen));
  if (fab) fab.innerHTML = chatOpen
    ? '✕<span class="chat-label" aria-hidden="true">BOCRA AI Assistant</span>'
    : '💬<span class="chat-label" aria-hidden="true">BOCRA AI Assistant</span>';
  if (chatOpen) document.getElementById('chat-input')?.focus();
};

window.sendQuick = (msg) => {
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = msg;
  const qk = document.getElementById('chat-quick');
  if (qk) qk.style.display = 'none';
  window.sendChat();
};

window.sendChat = async () => {
  const input = document.getElementById('chat-input');
  const msg   = input?.value.trim();
  if (!msg) return;
  input.value = '';
  appendMsg(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });
  const typing = appendTyping();
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: `You are BOCRA's official AI Assistant for the Botswana Communications Regulatory Authority.
Help users with: telecom/broadcasting/postal licences, consumer complaints, .bw domain registration, BW-CIRT cybersecurity, public consultations, regulations, and publications.
Be concise, helpful and professional. Direct users to scroll to relevant page sections for actions.
Never provide specific legal advice.`,
        messages: chatHistory.slice(-10),
      }),
    });
    typing.remove();
    const data = await resp.json();
    const text = data.content?.[0]?.text
      || 'I\'m having trouble connecting. Please call +267 395 7755 or email info@bocra.org.bw.';
    chatHistory.push({ role: 'assistant', content: text });
    appendMsg(text, 'bot');
  } catch {
    typing.remove();
    appendMsg('I\'m unable to connect right now. For assistance call +267 395 7755 or email info@bocra.org.bw.', 'bot');
  }
};

function appendMsg(text, role) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el   = document.createElement('div');
  el.className = `chat-msg ${role}`;
  el.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g,'<br>')}</div><div class="chat-time">${time}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}
function appendTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return { remove: () => {} };
  const el = document.createElement('div');
  el.className = 'chat-msg bot';
  el.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// ── Load Live Stats from API ──────────────────────────
async function loadStats() {
  const result = await API.get('/stats');
  if (!result.ok) return;
  const { licences, complaints, consultations, domains } = result.data;
  const map = {
    'dc-licences':      licences.active,
    'dc-pending':       licences.pending,
    'dc-complaints':    complaints.received + complaints.underInvestigation,
    'dc-consultations': consultations.open,
  };
  Object.entries(map).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v ?? '–';
  });
}

// ── Load News from API ────────────────────────────────
async function loadNews() {
  const result = await API.get('/news?limit=5');
  if (!result.ok) return;
  const items = result.data.data || [];
  if (!items.length) return;

  // Featured article
  const feat = items[0];
  const titleEl   = document.getElementById('featured-news-title');
  const excerptEl = document.getElementById('featured-news-excerpt');
  const dateEl    = document.getElementById('featured-news-date');
  if (titleEl)   titleEl.textContent   = feat.title;
  if (excerptEl) excerptEl.textContent = feat.excerpt;
  if (dateEl)    dateEl.textContent    = new Date(feat.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

  // Side list
  const listEl = document.getElementById('news-list-dynamic');
  if (listEl && items.length > 1) {
    listEl.innerHTML = items.slice(1, 5).map((item, i) => `
      <article class="nl-item reveal" tabindex="0">
        <span class="nl-num" aria-hidden="true">0${i + 1}</span>
        <div>
          <div class="nl-tag">${item.type}</div>
          <div class="nl-title">${item.title}</div>
          <div class="nl-date">${new Date(item.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
      </article>`).join('');
    // Re-observe new elements
    listEl.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  }
}

// ── Load Consultations from API ───────────────────────
async function loadConsultations() {
  const result = await API.get('/consultations');
  if (!result.ok) return;
  const items = (result.data.consultations || []).slice(0, 4);
  const grid  = document.getElementById('cons-grid-dynamic');
  if (!grid || !items.length) return;

  const clsMap = { Open:'open', Closing:'closing', Closed:'closed' };
  grid.innerHTML = items.map(c => {
    const cls  = clsMap[c.status] || 'closed';
    const dead = c.status === 'Closed'
      ? `📋 ${c.submissionsCount} submissions received`
      : `⏰ Closes: ${new Date(c.closes).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`;
    const cta  = c.status === 'Closed' ? 'View Submissions ⟶' : 'Submit Comment ⟶';
    const label= c.status === 'Closing' ? 'Closing Soon' : c.status;
    return `
      <div class="cons-card reveal" tabindex="0" role="listitem">
        <div class="cons-status-row">
          <div class="cons-dot ${cls}" aria-hidden="true"></div>
          <span class="cons-status-txt ${cls}">${label}</span>
        </div>
        <div class="cons-title">${c.title}</div>
        <p class="cons-desc">${c.summary}</p>
        <div class="cons-footer">
          <span class="cons-deadline">${dead}</span>
          <button class="cons-cta" onclick="submitConsultation('${c.id}')">${cta}</button>
        </div>
      </div>`;
  }).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}

// ── Counter Animation ─────────────────────────────────
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting || e.target.dataset.done) return;
    e.target.dataset.done = '1';
    const target = parseFloat(e.target.dataset.target);
    const dec    = target % 1 !== 0;
    const dur    = 1800;
    const start  = performance.now();
    const tick   = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const v = (1 - Math.pow(1 - p, 3)) * target;
      e.target.textContent = dec ? v.toFixed(1) : Math.round(v).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.5 });

// ── Scroll Reveal ─────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 55);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

// ── Keyboard Shortcuts ────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (chatOpen) window.toggleChat();
    if (document.getElementById('mobile-menu')?.classList.contains('open')) window.closeMobileMenu();
    document.getElementById('search-results')?.classList.remove('visible');
  }
});

// ── Init on DOM Ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Show cookie banner if not dismissed
  if (!localStorage.getItem('bocra_cookies')) {
    const b = document.getElementById('cookie-banner');
    if (b) b.style.display = 'flex';
  }

  // Observe counters + reveals
  document.querySelectorAll('.counter').forEach(c => counterObs.observe(c));
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // Pause ticker on hover
  const ticker = document.querySelector('.ticker');
  if (ticker) {
    ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
    ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
  }

  // Load live data from backend
  loadStats();
  loadNews();
  loadConsultations();

  // Auto-refresh stats every 60s
  setInterval(loadStats, 60000);

  console.log('%c🇧🇼 BOCRA Digital Platform v1.0.0', 'color:#C9A84C;font-size:16px;font-weight:bold');
  console.log('%c→ API: http://localhost:3000/api/health', 'color:#8BA3BF');
});

// ══════════════════════════════════════════════════════
//  MODAL SYSTEM
// ══════════════════════════════════════════════════════

function openOverlay(title, bodyHTML) {
  document.getElementById('modal-title-text').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.closeModal = () => {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeModal(); });

// helper: scroll to section & close any modal
window.scrollToSection = (id) => {
  window.closeModal();
  const el = document.getElementById(id) || document.querySelector(`.${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// ── LICENCE APPLICATION MODAL ──────────────────────────
const LICENCE_TYPES = {
  telecom:      ['Class A – National', 'Class B – Individual', 'Class C – ISP', 'Class D – VSAT'],
  broadcasting: ['Commercial TV', 'Community TV', 'Commercial Radio', 'Community Radio'],
  postal:       ['National Postal Operator', 'Courier Service', 'International Mail'],
};

window.openModal = async (type, ...args) => {
  switch (type) {

    // ── LICENCE ──────────────────────────────────────
    case 'licence':
    case 'broadcasting':
    case 'typeapproval': {
      const defaultType = type === 'broadcasting' ? 'broadcasting' : type === 'typeapproval' ? 'telecom' : 'telecom';
      openOverlay('Apply for a Licence', `
        <div class="modal-info-box"><p>Submit your licence application online. You will receive a reference number and email updates at each stage.</p></div>
        <div class="step-indicator"><div class="step-dot active" id="ls1"></div><div class="step-dot" id="ls2"></div><div class="step-dot" id="ls3"></div></div>
        <div id="lic-step1">
          <div class="modal-row">
            <div class="modal-section">
              <div class="modal-label">Licence Type *</div>
              <select id="lic-type" class="modal-field modal-select" onchange="updateSubtypes()">
                <option value="">Select type…</option>
                <option value="telecom" ${defaultType==='telecom'?'selected':''}>Telecommunications</option>
                <option value="broadcasting" ${defaultType==='broadcasting'?'selected':''}>Broadcasting</option>
                <option value="postal">Postal Services</option>
                <option value="spectrum">Spectrum / Radio</option>
              </select>
            </div>
            <div class="modal-section">
              <div class="modal-label">Sub-type *</div>
              <select id="lic-subtype" class="modal-field modal-select"><option value="">Select type first…</option></select>
            </div>
          </div>
          <div class="modal-section">
            <div class="modal-label">Company / Applicant Name *</div>
            <input id="lic-name" class="modal-field" placeholder="Registered entity name">
          </div>
          <div class="modal-row">
            <div class="modal-section">
              <div class="modal-label">Contact Email *</div>
              <input id="lic-email" type="email" class="modal-field" placeholder="email@company.co.bw">
            </div>
            <div class="modal-section">
              <div class="modal-label">Phone Number *</div>
              <input id="lic-phone" class="modal-field" placeholder="+267 7X XXX XXX">
            </div>
          </div>
          <div class="modal-section">
            <div class="modal-label">Coverage Area *</div>
            <input id="lic-area" class="modal-field" placeholder="e.g. National, Gaborone, Francistown">
          </div>
          <div class="modal-btn-row">
            <button class="modal-cancel" onclick="closeModal()">Cancel</button>
            <button class="modal-submit" onclick="licenceStep2()">Continue →</button>
          </div>
        </div>
        <div id="lic-step2" style="display:none">
          <div class="modal-section">
            <div class="modal-label">Business Registration Number</div>
            <input id="lic-reg" class="modal-field" placeholder="e.g. BW-2024-XXXXXX">
          </div>
          <div class="modal-section">
            <div class="modal-label">Describe Your Intended Service *</div>
            <textarea id="lic-desc" class="modal-field modal-textarea" placeholder="Briefly describe the service you intend to provide, target market, and geographic coverage…"></textarea>
          </div>
          <div class="modal-section">
            <div class="modal-label">Spectrum Bands Required (if any)</div>
            <input id="lic-spectrum" class="modal-field" placeholder="e.g. 900MHz, 1800MHz, 2600MHz">
          </div>
          <div class="modal-btn-row">
            <button class="modal-cancel" onclick="licenceStep1()">← Back</button>
            <button class="modal-submit" id="lic-submit-btn" onclick="submitLicence()">Submit Application →</button>
          </div>
        </div>
        <div id="lic-step3" style="display:none"></div>
      `);
      if (defaultType !== 'telecom') {
        document.getElementById('lic-type').value = defaultType;
        updateSubtypes();
      }
      break;
    }

    // ── INCIDENT REPORT ───────────────────────────────
    case 'incident': {
      openOverlay('🚨 Report a Cybersecurity Incident', `
        <div class="modal-info-box"><p><strong>BW-CIRT</strong> — Botswana Computer Incident Response Team. All reports are handled confidentially with a <strong>2-hour response SLA</strong>.</p></div>
        <div class="modal-section">
          <div class="modal-label">Organisation Name *</div>
          <input id="inc-org" class="modal-field" placeholder="Your organisation name">
        </div>
        <div class="modal-row">
          <div class="modal-section">
            <div class="modal-label">Contact Name *</div>
            <input id="inc-name" class="modal-field" placeholder="Full name">
          </div>
          <div class="modal-section">
            <div class="modal-label">Contact Email *</div>
            <input id="inc-email" type="email" class="modal-field" placeholder="secure@org.co.bw">
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-label">Incident Type *</div>
          <select id="inc-type" class="modal-field modal-select">
            <option value="">Select incident type…</option>
            <option>Ransomware / Malware Attack</option>
            <option>Data Breach / Unauthorised Access</option>
            <option>Phishing / Social Engineering</option>
            <option>DDoS Attack</option>
            <option>Critical Infrastructure Attack</option>
            <option>Vulnerability Discovered</option>
            <option>Other</option>
          </select>
        </div>
        <div class="modal-row">
          <div class="modal-section">
            <div class="modal-label">Severity *</div>
            <select id="inc-sev" class="modal-field modal-select">
              <option value="">Severity level…</option>
              <option>Critical — Systems down / data lost</option>
              <option>High — Active attack in progress</option>
              <option>Moderate — Suspicious activity</option>
              <option>Low — Informational</option>
            </select>
          </div>
          <div class="modal-section">
            <div class="modal-label">Date / Time Detected</div>
            <input id="inc-date" type="datetime-local" class="modal-field">
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-label">Incident Description *</div>
          <textarea id="inc-desc" class="modal-field modal-textarea" placeholder="Describe what happened, systems affected, initial impact assessment, and any steps already taken…"></textarea>
        </div>
        <div class="modal-btn-row">
          <button class="modal-cancel" onclick="closeModal()">Cancel</button>
          <button class="modal-submit" id="inc-btn" onclick="submitIncident()">🔒 Submit Encrypted Report →</button>
        </div>
      `);
      break;
    }

    // ── VULNERABILITY SCANNER ─────────────────────────
    case 'scanner': {
      openOverlay('🔍 Vulnerability Scanner', `
        <div class="modal-info-box"><p>Enter your domain and we'll run a <strong>basic external vulnerability scan</strong> checking for open ports, exposed admin panels, missing security headers, and known CVEs.</p></div>
        <div class="modal-section">
          <div class="modal-label">Target Domain or IP *</div>
          <input id="scan-target" class="modal-field" placeholder="e.g. company.co.bw or 192.168.1.1">
        </div>
        <div class="modal-section">
          <div class="modal-label">Organisation Name</div>
          <input id="scan-org" class="modal-field" placeholder="Your organisation">
        </div>
        <div class="modal-section">
          <div class="modal-label">Scan Type</div>
          <select id="scan-type" class="modal-field modal-select">
            <option>Basic — HTTP Headers &amp; SSL Check</option>
            <option>Standard — Ports + Headers + CVE Lookup</option>
            <option>Comprehensive — Full External Assessment</option>
          </select>
        </div>
        <div id="scan-result" style="display:none;margin-top:14px"></div>
        <div class="modal-btn-row">
          <button class="modal-cancel" onclick="closeModal()">Cancel</button>
          <button class="modal-submit" id="scan-btn" onclick="runScan()">▶ Start Scan</button>
        </div>
      `);
      break;
    }

    // ── SECURITY ASSESSMENT ───────────────────────────
    case 'assessment': {
      openOverlay('🛡 Request Security Assessment', `
        <div class="modal-info-box"><p>BOCRA offers <strong>free baseline cybersecurity assessments</strong> for critical national infrastructure operators and regulated service providers.</p></div>
        <div class="modal-section">
          <div class="modal-label">Organisation Name *</div>
          <input id="ass-org" class="modal-field" placeholder="Regulated entity or CNI operator">
        </div>
        <div class="modal-row">
          <div class="modal-section">
            <div class="modal-label">Contact Name *</div>
            <input id="ass-name" class="modal-field" placeholder="Full name">
          </div>
          <div class="modal-section">
            <div class="modal-label">Contact Email *</div>
            <input id="ass-email" type="email" class="modal-field" placeholder="contact@org.co.bw">
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-label">Organisation Type</div>
          <select id="ass-type" class="modal-field modal-select">
            <option>Telecom Operator</option>
            <option>Financial Institution</option>
            <option>Government Agency</option>
            <option>Healthcare Provider</option>
            <option>Energy / Utilities</option>
            <option>Other Critical Infrastructure</option>
          </select>
        </div>
        <div class="modal-section">
          <div class="modal-label">Preferred Assessment Date</div>
          <input id="ass-date" type="date" class="modal-field">
        </div>
        <div class="modal-btn-row">
          <button class="modal-cancel" onclick="closeModal()">Cancel</button>
          <button class="modal-submit" onclick="submitAssessment()">Request Assessment →</button>
        </div>
      `);
      break;
    }

    // ── SECURITY AWARENESS TRAINING ───────────────────
    case 'training': {
      openOverlay('📚 Security Awareness Training', `
        <div class="modal-info-box"><p>Free e-learning modules for Botswana organisations. Complete online at your own pace — certificate issued on completion.</p></div>
        <ul class="modal-list">
          <li><span>🎣</span><div><strong>Phishing Prevention</strong><br><small style="color:var(--steel)">45 min · 12 lessons · Beginner</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="enrollTraining('Phishing Prevention')">Enrol</button></li>
          <li><span>🔑</span><div><strong>Password & Authentication Security</strong><br><small style="color:var(--steel)">30 min · 8 lessons · Beginner</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="enrollTraining('Password Security')">Enrol</button></li>
          <li><span>📱</span><div><strong>Mobile Device Security</strong><br><small style="color:var(--steel)">35 min · 10 lessons · Intermediate</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="enrollTraining('Mobile Security')">Enrol</button></li>
          <li><span>🧠</span><div><strong>Social Engineering Awareness</strong><br><small style="color:var(--steel)">50 min · 14 lessons · Intermediate</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="enrollTraining('Social Engineering')">Enrol</button></li>
          <li><span>📋</span><div><strong>Data Protection Act 2018 Compliance</strong><br><small style="color:var(--steel)">60 min · 16 lessons · All levels</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="enrollTraining('DPA Compliance')">Enrol</button></li>
        </ul>
      `);
      break;
    }

    // ── CONSULTATION COMMENT ──────────────────────────
    case 'consult': {
      const [consId, consTitle] = args;
      openOverlay(`Submit Comment`, `
        <div class="modal-info-box"><p><strong>${consTitle}</strong><br>Your submission will be acknowledged and considered in the final regulatory decision.</p></div>
        <div class="modal-row">
          <div class="modal-section">
            <div class="modal-label">Full Name *</div>
            <input id="cs-name" class="modal-field" placeholder="Your full name">
          </div>
          <div class="modal-section">
            <div class="modal-label">Email Address *</div>
            <input id="cs-email" type="email" class="modal-field" placeholder="your@email.com">
          </div>
        </div>
        <div class="modal-section">
          <div class="modal-label">Organisation (if applicable)</div>
          <input id="cs-org" class="modal-field" placeholder="Company or institution name">
        </div>
        <div class="modal-section">
          <div class="modal-label">Submission Type</div>
          <select id="cs-type" class="modal-field modal-select">
            <option>General Comment</option>
            <option>Support with Recommendations</option>
            <option>Objection with Alternatives</option>
            <option>Technical Input</option>
            <option>Legal / Regulatory Input</option>
          </select>
        </div>
        <div class="modal-section">
          <div class="modal-label">Your Submission *</div>
          <textarea id="cs-comment" class="modal-field modal-textarea" style="min-height:120px" placeholder="Provide your detailed comments, recommendations, or objections regarding this consultation…"></textarea>
        </div>
        <div class="modal-btn-row">
          <button class="modal-cancel" onclick="closeModal()">Cancel</button>
          <button class="modal-submit" id="cs-btn" onclick="submitComment('${consId}')">Submit Comment →</button>
        </div>
      `);
      break;
    }

    // ── VIEW SUBMISSIONS ──────────────────────────────
    case 'submissions': {
      const [, consTitle] = args;
      openOverlay('Consultation Submissions', `
        <div class="modal-info-box"><p><strong>${consTitle}</strong> — This consultation is now closed. 142 submissions were received and are under review.</p></div>
        <ul class="modal-list">
          <li><span>🏛</span><div><strong>Botswana Telecommunications Operators Association</strong><br><small style="color:var(--steel)">Organisation · Technical Input · 15 pages</small></div></li>
          <li><span>👤</span><div><strong>Consumer Forum of Botswana</strong><br><small style="color:var(--steel)">NGO · Support with Recommendations · 8 pages</small></div></li>
          <li><span>🎓</span><div><strong>University of Botswana — ICT Dept</strong><br><small style="color:var(--steel)">Academic · Technical Input · 12 pages</small></div></li>
          <li><span>👤</span><div><strong>Individual Submissions</strong><br><small style="color:var(--steel)">139 individual citizens and businesses</small></div></li>
        </ul>
        <div class="modal-btn-row">
          <button class="modal-submit" onclick="Toast.show('Downloading all submissions…','info','⬇');closeModal()">⬇ Download All Submissions</button>
        </div>
      `);
      break;
    }

    // ── PUBLICATION DOWNLOAD ──────────────────────────
    case 'pub': {
      const [pubTitle, size, filename] = args;
      openOverlay('📄 ' + pubTitle, `
        <div class="modal-info-box"><p>Official BOCRA publication. File size: <strong>${size}</strong>. Available in PDF format.</p></div>
        <ul class="modal-list">
          <li><span>📋</span><div><strong>Document Title</strong><br><small style="color:var(--steel)">${pubTitle}</small></div></li>
          <li><span>🏛</span><div><strong>Published by</strong><br><small style="color:var(--steel)">Botswana Communications Regulatory Authority</small></div></li>
          <li><span>📅</span><div><strong>File Size</strong><br><small style="color:var(--steel)">${size} — PDF Format</small></div></li>
        </ul>
        <div class="modal-btn-row">
          <button class="modal-cancel" onclick="closeModal()">Cancel</button>
          <button class="modal-submit" onclick="downloadPub('${filename}','${pubTitle}')">⬇ Download PDF →</button>
        </div>
      `);
      break;
    }

    // ── NEWS ARCHIVE ──────────────────────────────────
    case 'newsarchive': {
      const result = await API.get('/news?limit=10');
      const items  = result.ok ? (result.data.data || []) : [];
      openOverlay('📰 News Archive', `
        <ul class="modal-list" style="gap:8px">
          ${items.map(n => `
            <li style="flex-direction:column;align-items:flex-start;gap:4px">
              <div style="display:flex;align-items:center;gap:8px;width:100%">
                <strong style="flex:1;font-size:13.5px;color:var(--navy)">${n.title}</strong>
              </div>
              <small style="color:var(--steel)">${n.type} · ${new Date(n.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</small>
              <p style="font-size:12.5px;color:var(--text-mid);margin-top:4px">${n.excerpt}</p>
            </li>`).join('')}
        </ul>
      `);
      break;
    }

    // ── PUBLICATIONS ARCHIVE ──────────────────────────
    case 'pubarchive': {
      openOverlay('📚 Publications Archive', `
        <ul class="modal-list">
          <li><span>📊</span><div><strong>BOCRA Annual Report 2024</strong><br><small style="color:var(--steel)">February 2025 · PDF · 4.2 MB</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="downloadPub('annual-2024.pdf','Annual Report 2024')">⬇ PDF</button></li>
          <li><span>📡</span><div><strong>Telecom Market Statistics Q4 2024</strong><br><small style="color:var(--steel)">January 2025 · PDF · 2.8 MB</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="downloadPub('market-q4.pdf','Market Stats Q4')">⬇ PDF</button></li>
          <li><span>📶</span><div><strong>Mobile Broadband QoS Report 2024</strong><br><small style="color:var(--steel)">March 2025 · PDF · 1.9 MB</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="downloadPub('qos-2024.pdf','QoS Report 2024')">⬇ PDF</button></li>
          <li><span>🔒</span><div><strong>Cybersecurity Threat Landscape 2024</strong><br><small style="color:var(--steel)">December 2024 · PDF · 3.5 MB</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="downloadPub('cyber-2024.pdf','Cyber Report 2024')">⬇ PDF</button></li>
          <li><span>📻</span><div><strong>Annual Spectrum Audit Report 2024</strong><br><small style="color:var(--steel)">November 2024 · PDF · 2.1 MB</small></div><button class="modal-submit" style="flex:0;padding:8px 14px;font-size:12px" onclick="downloadPub('spectrum-2024.pdf','Spectrum Audit 2024')">⬇ PDF</button></li>
        </ul>
      `);
      break;
    }

    // ── STAKEHOLDER DIRECTORY ─────────────────────────
    case 'directory': {
      const [dirTitle, icon] = args;
      const licences = await API.get('/licences');
      const items    = licences.ok ? (licences.data.data || []) : [];
      const rows     = items.length
        ? items.map(l => `<tr><td>${l.licencee}</td><td>${l.subtype||l.type}</td><td>${l.area||'National'}</td><td><span class="status-badge active-b dir-table">${l.status}</span></td></tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;color:var(--steel);padding:20px">No records found</td></tr>';
      openOverlay(`${icon} ${dirTitle}`, `
        <div class="modal-info-box"><p>BOCRA-licensed entities in this category. Last updated: March 2025.</p></div>
        <div style="overflow-x:auto">
          <table class="dir-table">
            <thead><tr><th>Entity</th><th>Licence Type</th><th>Area</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="modal-btn-row" style="margin-top:16px">
          <button class="modal-submit" onclick="Toast.show('Downloading directory…','info','⬇');closeModal()">⬇ Download Full Directory</button>
        </div>
      `);
      break;
    }

  } // end switch
}; // end openModal

// ── LICENCE FORM LOGIC ────────────────────────────────
window.updateSubtypes = () => {
  const type = document.getElementById('lic-type')?.value;
  const sel  = document.getElementById('lic-subtype');
  if (!sel) return;
  const opts = LICENCE_TYPES[type] || [];
  sel.innerHTML = opts.length
    ? opts.map(o => `<option>${o}</option>`).join('')
    : '<option value="">Select type first…</option>';
};
window.licenceStep1 = () => {
  document.getElementById('lic-step1').style.display = 'block';
  document.getElementById('lic-step2').style.display = 'none';
  document.getElementById('ls1').className = 'step-dot active';
  document.getElementById('ls2').className = 'step-dot';
};
window.licenceStep2 = () => {
  const name  = document.getElementById('lic-name')?.value.trim();
  const email = document.getElementById('lic-email')?.value.trim();
  const type  = document.getElementById('lic-type')?.value;
  const area  = document.getElementById('lic-area')?.value.trim();
  if (!type)  { Toast.show('Please select a licence type.', 'error', '⚠️'); return; }
  if (!name)  { Toast.show('Please enter the applicant name.', 'error', '⚠️'); return; }
  if (!email) { Toast.show('Please enter a contact email.', 'error', '⚠️'); return; }
  if (!area)  { Toast.show('Please enter the coverage area.', 'error', '⚠️'); return; }
  document.getElementById('lic-step1').style.display = 'none';
  document.getElementById('lic-step2').style.display = 'block';
  document.getElementById('ls1').className = 'step-dot done';
  document.getElementById('ls2').className = 'step-dot active';
};
window.submitLicence = async () => {
  const desc = document.getElementById('lic-desc')?.value.trim();
  if (!desc || desc.length < 20) { Toast.show('Please describe your intended service.', 'error', '⚠️'); return; }
  const btn = document.getElementById('lic-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
  const result = await API.post('/licences', {
    type:     document.getElementById('lic-type').value,
    subtype:  document.getElementById('lic-subtype').value,
    licencee: document.getElementById('lic-name').value.trim(),
    contact:  document.getElementById('lic-email').value.trim(),
    area:     document.getElementById('lic-area').value.trim(),
    spectrum: document.getElementById('lic-spectrum')?.value.split(',').map(s=>s.trim()).filter(Boolean) || [],
  });
  if (btn) { btn.disabled = false; btn.textContent = 'Submit Application →'; }
  if (result.ok) {
    document.getElementById('lic-step2').style.display = 'none';
    document.getElementById('ls2').className = 'step-dot done';
    document.getElementById('ls3').className = 'step-dot active';
    document.getElementById('lic-step3').innerHTML = `
      <div class="modal-success">
        <div class="modal-success-icon">✅</div>
        <div class="modal-success-title">Application Submitted!</div>
        <div class="modal-success-msg">Your licence application has been received and assigned reference:</div>
        <div class="modal-ref">${result.data.applicationId}</div>
        <div class="modal-success-msg" style="margin-top:8px">${result.data.nextSteps}</div>
        <button class="modal-submit" style="margin-top:16px;max-width:200px" onclick="closeModal()">Done ✓</button>
      </div>`;
    document.getElementById('lic-step3').style.display = 'block';
  } else {
    Toast.show(result.data.details?.[0] || result.data.error || 'Submission failed.', 'error', '❌');
  }
};

// ── INCIDENT SUBMIT ───────────────────────────────────
window.submitIncident = () => {
  const org  = document.getElementById('inc-org')?.value.trim();
  const name = document.getElementById('inc-name')?.value.trim();
  const email= document.getElementById('inc-email')?.value.trim();
  const type = document.getElementById('inc-type')?.value;
  const sev  = document.getElementById('inc-sev')?.value;
  const desc = document.getElementById('inc-desc')?.value.trim();
  if (!org || !name || !email || !type || !sev || !desc || desc.length < 20) {
    Toast.show('Please complete all required fields.', 'error', '⚠️'); return;
  }
  const ref = 'BWC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random()*8999);
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-success">
      <div class="modal-success-icon">🔒</div>
      <div class="modal-success-title">Incident Report Submitted</div>
      <div class="modal-success-msg">Your report has been securely transmitted to BW-CIRT. Reference number:</div>
      <div class="modal-ref">${ref}</div>
      <div class="modal-success-msg" style="margin-top:8px">A BW-CIRT analyst will contact you within <strong>2 hours</strong>. For critical incidents, call: <strong>+267 395 7755</strong></div>
      <button class="modal-submit" style="margin-top:16px;max-width:200px" onclick="closeModal()">Done ✓</button>
    </div>`;
};

// ── SCAN ──────────────────────────────────────────────
window.runScan = () => {
  const target = document.getElementById('scan-target')?.value.trim();
  if (!target) { Toast.show('Please enter a target domain or IP.', 'error', '⚠️'); return; }
  const btn = document.getElementById('scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Scanning…'; }
  const res = document.getElementById('scan-result');
  if (res) { res.style.display = 'block'; res.innerHTML = '<div style="color:var(--steel);font-size:13px;padding:12px">⏳ Running scan on <strong>' + target + '</strong>… This may take 10–30 seconds.</div>'; }
  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.textContent = '▶ Scan Again'; }
    if (res) res.innerHTML = `
      <div style="background:var(--off-white);border:1px solid var(--border);border-left:4px solid var(--green);padding:14px 16px">
        <div style="font-weight:700;color:var(--navy);margin-bottom:10px">Scan Results: ${target}</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:12.5px">
          <div style="display:flex;justify-content:space-between"><span>✅ SSL/TLS Certificate</span><span style="color:var(--green);font-weight:600">Valid</span></div>
          <div style="display:flex;justify-content:space-between"><span>✅ HTTPS Redirect</span><span style="color:var(--green);font-weight:600">Enabled</span></div>
          <div style="display:flex;justify-content:space-between"><span>⚠️ Security Headers</span><span style="color:var(--orange);font-weight:600">2 Missing</span></div>
          <div style="display:flex;justify-content:space-between"><span>✅ Open Ports</span><span style="color:var(--green);font-weight:600">80, 443 only</span></div>
          <div style="display:flex;justify-content:space-between"><span>✅ Known CVEs</span><span style="color:var(--green);font-weight:600">None found</span></div>
        </div>
        <div style="margin-top:10px;font-size:11.5px;color:var(--steel)">⚠️ Missing headers: X-Frame-Options, Content-Security-Policy. Contact BW-CIRT for remediation guidance.</div>
      </div>`;
    Toast.show('Scan complete for ' + target, 'success', '🔍');
  }, 2500);
};

// ── ASSESSMENT SUBMIT ─────────────────────────────────
window.submitAssessment = () => {
  const org  = document.getElementById('ass-org')?.value.trim();
  const name = document.getElementById('ass-name')?.value.trim();
  const email= document.getElementById('ass-email')?.value.trim();
  if (!org || !name || !email) { Toast.show('Please complete all required fields.', 'error', '⚠️'); return; }
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-success">
      <div class="modal-success-icon">🛡</div>
      <div class="modal-success-title">Assessment Request Received</div>
      <div class="modal-success-msg">Your security assessment request for <strong>${org}</strong> has been submitted. A BW-CIRT representative will contact <strong>${email}</strong> within 2 business days to confirm scheduling.</div>
      <button class="modal-submit" style="margin-top:16px;max-width:200px" onclick="closeModal()">Done ✓</button>
    </div>`;
};

// ── TRAINING ENROL ────────────────────────────────────
window.enrollTraining = (course) => {
  Toast.show(`Enrolled in: ${course}. Check your email for access link.`, 'success', '📚');
  closeModal();
};

// ── CONSULTATION COMMENT SUBMIT ───────────────────────
window.submitComment = async (consId) => {
  const name    = document.getElementById('cs-name')?.value.trim();
  const email   = document.getElementById('cs-email')?.value.trim();
  const comment = document.getElementById('cs-comment')?.value.trim();
  const org     = document.getElementById('cs-org')?.value.trim();
  const type    = document.getElementById('cs-type')?.value;
  if (!name || !email || !comment || comment.length < 30) {
    Toast.show('Please complete all fields. Comment must be at least 30 characters.', 'error', '⚠️'); return;
  }
  const btn = document.getElementById('cs-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
  const result = await API.post(`/consultations/${consId}/comment`, { name, email, organisation: org, comment, type });
  if (btn) { btn.disabled = false; btn.textContent = 'Submit Comment →'; }
  if (result.ok) {
    document.getElementById('modal-body').innerHTML = `
      <div class="modal-success">
        <div class="modal-success-icon">📄</div>
        <div class="modal-success-title">Submission Received!</div>
        <div class="modal-success-msg">Your consultation submission reference is:</div>
        <div class="modal-ref">${result.data.reference}</div>
        <div class="modal-success-msg" style="margin-top:8px">Thank you for participating in shaping Botswana's regulatory framework.</div>
        <button class="modal-submit" style="margin-top:16px;max-width:200px" onclick="closeModal()">Done ✓</button>
      </div>`;
  } else {
    Toast.show(result.data.details?.[0] || result.data.error || 'Submission failed.', 'error', '❌');
  }
};

// ── PDF DOWNLOAD ──────────────────────────────────────
window.downloadPub = (filename, title) => {
  // Create a fake PDF blob for demo
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n%%EOF`;
  const blob = new Blob([content], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  Toast.show(`Downloading: ${title}`, 'success', '⬇');
  closeModal();
};
