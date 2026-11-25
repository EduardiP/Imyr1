// claude-connector.js — Lidhesi (connector) i PhronexusAI per Claude (MCP + OAuth 2.1).
// Server.js e therret NJE HERE, para rrugeve te Google:  require('./claude-connector')(app, pool);
//
// Cfare shton (asgje ekzistuese nuk ndryshohet):
//   POST /mcp                                   -> protokolli MCP (JSON-RPC, "Streamable HTTP" pa SSE)
//   GET  /.well-known/oauth-protected-resource[/mcp], /.well-known/oauth-authorization-server
//   GET/POST /oauth/authorize                   -> dritarja "Connect": Google/email, kushtet, faqja, leja
//   POST /oauth/token, POST /oauth/register     -> kodet/token-at (PKCE S256), regjistrim klienti (DCR)
//   GET  /oauth/google                          -> nis hyrjen me Google dhe kthehet te dritarja "Connect"
//   GET  /claude                                -> faqja publike e dokumentimit
// Mjetet: 1 publik (pa hyrje) + 6 per llogarine (vetem LEXIM). Asnje mjet nuk shkruan ne databaze.
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');

const BAZA = String(process.env.APP_URL || 'https://phronexusai.com').replace(/\/+$/, '');
const RESURSI = BAZA + '/mcp';
const SCOPE = 'phronexus:read';
const SEKRETI = process.env.CLAUDE_OAUTH_SECRET || crypto.randomBytes(32).toString('hex');
const VERSIONET = ['2025-11-25', '2025-06-18', '2025-03-26'];
const LINKU_REGJ = BAZA + '/?utm_source=claude&utm_medium=connector';

// Kategorite e studimit (te njejtat si te importi) dhe 2 plotesueset per secilen (jo konkurrente).
const KAT_PLOTESUESE = {
  'Marketing': ['Sales & CRM', 'Data & analytics'],
  'Sales & CRM': ['Marketing', 'Customer support'],
  'Customer support': ['Sales & CRM', 'Communication'],
  'Finance & accounting': ['HR & recruiting', 'E-commerce'],
  'HR & recruiting': ['Finance & accounting', 'Productivity & projects'],
  'Productivity & projects': ['Communication', 'HR & recruiting'],
  'Developer tools': ['IT & infrastructure', 'Security & compliance'],
  'Data & analytics': ['Marketing', 'Finance & accounting'],
  'Security & compliance': ['IT & infrastructure', 'Legal'],
  'IT & infrastructure': ['Developer tools', 'Security & compliance'],
  'E-commerce': ['Marketing', 'Finance & accounting'],
  'Design & creative': ['Marketing', 'Media & content'],
  'Communication': ['Productivity & projects', 'Customer support'],
  'Education': ['Media & content', 'Marketing'],
  'Legal': ['Finance & accounting', 'Real estate & property'],
  'Real estate & property': ['Finance & accounting', 'Legal'],
  'AI & automation': ['Productivity & projects', 'Sales & CRM'],
  'Media & content': ['Marketing', 'Design & creative'],
  'Hospitality & travel': ['Marketing', 'E-commerce']
};
const KATEGORITE = Object.keys(KAT_PLOTESUESE).concat(['Healthcare', 'Other']);

function sha(x) { return crypto.createHash('sha256').update(String(x)).digest('hex'); }
function rast(n) { return crypto.randomBytes(n || 32).toString('base64url'); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function cors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id');
  res.set('Access-Control-Expose-Headers', 'WWW-Authenticate');
}

// ── Mbrojtje: serveri lexon vetem adresa publike (jo rrjetin e brendshem) ──
function ipPrivat(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
  }
  const x = ip.toLowerCase();
  if (x === '::1' || x === '::') return true;
  if (x.startsWith('::ffff:')) return ipPrivat(x.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb)/.test(x);
}
async function kontrolloUrl(u, vetemHttps) {
  const x = new URL(u);
  if (!(x.protocol === 'https:' || (!vetemHttps && x.protocol === 'http:'))) throw new Error('only http(s) URLs are allowed');
  if (x.port && !['80', '443'].includes(x.port)) throw new Error('non-standard ports are not allowed');
  if (net.isIP(x.hostname)) { if (ipPrivat(x.hostname)) throw new Error('private address'); return x; }
  const adresat = await dns.lookup(x.hostname, { all: true });
  if (!adresat.length || adresat.some(a => ipPrivat(a.address))) throw new Error('address not allowed');
  return x;
}
// Merr nje faqe publike: ndjek deri 4 ridrejtime (secili i kontrolluar), max 1.5 MB, 8 sekonda.
async function merrPublik(u, opsione) {
  const o = opsione || {};
  let url = u;
  for (let i = 0; i < 5; i++) {
    await kontrolloUrl(url, o.vetemHttps);
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PhronexusAI/1.0; +' + BAZA + '/claude)', 'Accept': o.accept || 'text/html,application/xhtml+xml' } });
    if ([301, 302, 303, 307, 308].includes(r.status) && r.headers.get('location')) { url = new URL(r.headers.get('location'), url).toString(); continue; }
    const reader = r.body && r.body.getReader ? r.body.getReader() : null;
    let teksti = '';
    if (reader) {
      const dek = new TextDecoder();
      let gjat = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; gjat += value.length; teksti += dek.decode(value, { stream: true }); if (gjat > 1500000) { try { reader.cancel(); } catch (e) {} break; } }
    } else teksti = await r.text();
    return { status: r.status, url, body: teksti };
  }
  throw new Error('too many redirects');
}
function pastroHtml(h) {
  return String(h || '').replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}
function domainNgaInput(s) {
  let t = String(s || '').trim().toLowerCase();
  if (!t) return null;
  if (!/^https?:\/\//.test(t)) t = 'https://' + t;
  try {
    const h = new URL(t).hostname.replace(/^www\./, '');
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(h) && !net.isIP(h) ? h : null;
  } catch (e) { return null; }
}

module.exports = function (app, pool) {
  // ── Tabelat (krijohen nese mungojne; fshihen vete me biznesin) ──
  let gati = null;
  function siguroTabelat() {
    if (!gati) gati = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS claude_oauth_klientet (client_id TEXT PRIMARY KEY, emri TEXT, redirect_uris JSONB NOT NULL, krijuar TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS claude_oauth_kodet (kodi_hash TEXT PRIMARY KEY, biznes_id INT NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, code_challenge TEXT NOT NULL, scope TEXT, skadon TIMESTAMPTZ NOT NULL)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS claude_oauth_tokenat (token_hash TEXT PRIMARY KEY, lloji TEXT NOT NULL, biznes_id INT NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL, scope TEXT, skadon TIMESTAMPTZ NOT NULL, krijuar TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await pool.query('CREATE INDEX IF NOT EXISTS claude_oauth_tokenat_biz ON claude_oauth_tokenat (biznes_id)');
      await pool.query(`CREATE TABLE IF NOT EXISTS claude_analizat (domaini TEXT PRIMARY KEY, emri TEXT, kategoria TEXT, lloji TEXT, permbledhje TEXT, koha TIMESTAMPTZ NOT NULL DEFAULT now())`);
    })().catch(e => { gati = null; throw e; });
    return gati;
  }
  siguroTabelat().catch(e => console.error('claude-connector migrim:', e.message));
  setInterval(() => {
    pool.query('DELETE FROM claude_oauth_kodet WHERE skadon < now()').catch(() => {});
    pool.query('DELETE FROM claude_oauth_tokenat WHERE skadon < now()').catch(() => {});
  }, 3600 * 1000).unref();

  // ── Kush eshte i futur (seanca e faqes). Seancat e admin-it ("Shiko si klienti") nuk vlejne ketu. ──
  async function biznesiNgaSeanca(req) {
    const t = req.cookies && req.cookies.imyr_session;
    if (!t) return null;
    const r = await pool.query('SELECT * FROM seancat WHERE token=$1', [t]);
    if (!r.rows.length || r.rows[0].admin_skadon) return null;
    const id = r.rows[0].biznes_id;
    const b = await pool.query('SELECT id, pronari_biznes_id, eshte_anetar_ekipi FROM bizneset WHERE id=$1', [id]);
    if (!b.rows.length) return null;
    return (b.rows[0].eshte_anetar_ekipi && b.rows[0].pronari_biznes_id) ? b.rows[0].pronari_biznes_id : id;
  }
  async function biznesiNgaToken(req) {
    const h = String(req.headers.authorization || '');
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) return { kaToken: false, biznesId: null };
    try {
      await siguroTabelat();
      const r = await pool.query(`SELECT t.biznes_id FROM claude_oauth_tokenat t JOIN bizneset b ON b.id = t.biznes_id
          WHERE t.token_hash=$1 AND t.lloji='access' AND t.skadon > now()`, [sha(m[1].trim())]);
      return { kaToken: true, biznesId: r.rows.length ? r.rows[0].biznes_id : null };
    } catch (e) { return { kaToken: true, biznesId: null }; }
  }

  // ── Klienti OAuth: URL (CIMD) ose i regjistruar (DCR) ──
  const cacheCimd = new Map();
  async function merrKlientin(clientId) {
    if (/^https:\/\//i.test(clientId)) {
      const c = cacheCimd.get(clientId);
      if (c && Date.now() - c.koha < 10 * 60 * 1000) return c.doc;
      const r = await merrPublik(clientId, { vetemHttps: true, accept: 'application/json' });
      if (r.status !== 200) throw new Error('client metadata not reachable');
      const doc = JSON.parse(r.body);
      if (doc.client_id !== clientId) throw new Error('client_id mismatch in client metadata');
      if (!Array.isArray(doc.redirect_uris) || !doc.redirect_uris.length) throw new Error('client metadata has no redirect_uris');
      cacheCimd.set(clientId, { koha: Date.now(), doc });
      return doc;
    }
    await siguroTabelat();
    const r = await pool.query('SELECT client_id, emri, redirect_uris FROM claude_oauth_klientet WHERE client_id=$1', [clientId]);
    if (!r.rows.length) throw new Error('unknown client_id');
    return { client_id: r.rows[0].client_id, client_name: r.rows[0].emri, redirect_uris: r.rows[0].redirect_uris };
  }
  function redirectLejuar(doc, uri) {
    let u; try { u = new URL(uri); } catch (e) { return false; }
    return (doc.redirect_uris || []).some(r => {
      if (r === uri) return true;
      try {
        const x = new URL(r);
        const loop = h => ['127.0.0.1', '[::1]', 'localhost'].includes(h);
        return loop(x.hostname) && loop(u.hostname) && x.hostname === u.hostname && x.protocol === u.protocol && x.pathname === u.pathname && x.search === u.search;
      } catch (e) { return false; }
    });
  }
  function emriKlientit(clientId, doc) {
    if (/^https:\/\//i.test(clientId)) { try { return new URL(clientId).host; } catch (e) {} }
    return (doc && doc.client_name) ? String(doc.client_name).slice(0, 60) : 'An application';
  }

  // ═══ Zbulimi (metadata) ═══
  function metaResursi() { return { resource: RESURSI, authorization_servers: [BAZA], scopes_supported: [SCOPE], bearer_methods_supported: ['header'], resource_name: 'PhronexusAI', resource_documentation: BAZA + '/claude' }; }
  function metaServeri() {
    return { issuer: BAZA, authorization_endpoint: BAZA + '/oauth/authorize', token_endpoint: BAZA + '/oauth/token', registration_endpoint: BAZA + '/oauth/register',
      scopes_supported: [SCOPE], response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'], code_challenge_methods_supported: ['S256'], client_id_metadata_document_supported: true,
      authorization_response_iss_parameter_supported: true, service_documentation: BAZA + '/claude' };
  }
  ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'].forEach(p => {
    app.options(p, (req, res) => { cors(res); res.status(204).end(); });
    app.get(p, (req, res) => { cors(res); res.json(metaResursi()); });
  });
  ['/.well-known/oauth-authorization-server', '/.well-known/openid-configuration'].forEach(p => {
    app.options(p, (req, res) => { cors(res); res.status(204).end(); });
    app.get(p, (req, res) => { cors(res); res.json(metaServeri()); });
  });

  // ═══ Regjistrimi i klientit (DCR) — p.sh. MCP Inspector; Claude perdor CIMD ═══
  app.options('/oauth/register', (req, res) => { cors(res); res.status(204).end(); });
  app.post('/oauth/register', async (req, res) => {
    cors(res);
    try {
      const b = req.body || {};
      const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris.filter(u => typeof u === 'string' && u.length < 500).slice(0, 10) : [];
      if (!uris.length || uris.some(u => { try { const x = new URL(u); return !(x.protocol === 'https:' || ['127.0.0.1', 'localhost', '[::1]'].includes(x.hostname)); } catch (e) { return true; } }))
        return res.status(400).json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris must be https or loopback URLs' });
      await siguroTabelat();
      const id = 'pxc_' + rast(18);
      await pool.query('INSERT INTO claude_oauth_klientet (client_id, emri, redirect_uris) VALUES ($1,$2,$3)', [id, String(b.client_name || '').slice(0, 80) || null, JSON.stringify(uris)]);
      res.status(201).json({ client_id: id, client_name: b.client_name || undefined, redirect_uris: uris, grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'], token_endpoint_auth_method: 'none', client_id_issued_at: Math.floor(Date.now() / 1000) });
    } catch (e) { res.status(500).json({ error: 'server_error', error_description: e.message }); }
  });

  // ═══ Hyrja me Google nga dritarja "Connect": pas Google kthehet te /oauth/authorize ═══
  app.get('/oauth/google', (req, res) => {
    const nx = String(req.query.next || '');
    if (!/^\/oauth\/authorize\?/.test(nx) || nx.length > 3000) return res.status(400).send('Invalid request.');
    res.cookie('px_oauth_next', nx, { httpOnly: true, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.redirect('/auth/google');
  });
  // Rruga ekzistuese e Google nuk preket: vetem kur kemi "px_oauth_next", destinacioni i saj kthehet te dritarja "Connect".
  app.use('/auth/google/callback', (req, res, next) => {
    const nx = req.cookies && req.cookies.px_oauth_next;
    if (nx && /^\/oauth\/authorize\?/.test(nx)) {
      const origjinal = res.redirect.bind(res);
      res.redirect = function (a, b) {
        const ku = typeof a === 'number' ? b : a;
        if (ku === '/?login=ok' || ku === '/?login=kushte') { res.clearCookie('px_oauth_next'); return origjinal(302, nx); }
        return origjinal.apply(null, arguments);
      };
    }
    next();
  });

  // ═══ Dritarja "Connect" (/oauth/authorize) ═══
  async function validoKerkesen(q) {
    const p = {
      response_type: String(q.response_type || ''), client_id: String(q.client_id || ''), redirect_uri: String(q.redirect_uri || ''),
      state: q.state == null ? '' : String(q.state), code_challenge: String(q.code_challenge || ''), code_challenge_method: String(q.code_challenge_method || ''),
      scope: String(q.scope || SCOPE), resource: q.resource == null ? '' : String(q.resource)
    };
    if (!p.client_id || p.client_id.length > 500) return { gabimFatal: 'Missing or invalid client_id.' };
    let doc;
    try { doc = await merrKlientin(p.client_id); } catch (e) { return { gabimFatal: 'Unknown application (' + e.message + ').' }; }
    if (!p.redirect_uri || !redirectLejuar(doc, p.redirect_uri)) return { gabimFatal: 'The redirect address is not registered for this application.' };
    if (p.response_type !== 'code') return { gabimRedirect: 'unsupported_response_type', p };
    if (!p.code_challenge || p.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge)) return { gabimRedirect: 'invalid_request', p, pershkrim: 'PKCE with S256 is required' };
    if (p.resource && p.resource.replace(/\/+$/, '') !== RESURSI) return { gabimRedirect: 'invalid_target', p };
    return { p, doc };
  }
  function ktheMeGabim(res, p, kodi, pershkrim) {
    const u = new URL(p.redirect_uri);
    u.searchParams.set('error', kodi);
    if (pershkrim) u.searchParams.set('error_description', pershkrim);
    if (p.state) u.searchParams.set('state', p.state);
    u.searchParams.set('iss', BAZA);
    return res.redirect(302, u.toString());
  }
  function csrf(req, p) { return crypto.createHmac('sha256', SEKRETI).update([req.cookies.imyr_session || '', p.client_id, p.redirect_uri, p.code_challenge, p.state].join('|')).digest('hex'); }

  function faqja(titulli, trupi) {
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
      '<title>' + esc(titulli) + ' · PhronexusAI</title><style>' +
      ':root{color-scheme:light}body{margin:0;background:#f4f6f9;font:15px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1c2128}' +
      '.k{max-width:420px;margin:40px auto;background:#fff;border:1px solid #e3e7ee;border-radius:14px;padding:28px 26px}' +
      '.logo{display:flex;align-items:center;gap:10px;font-weight:700;margin-bottom:18px}.logo img{width:28px;height:28px;border-radius:7px}' +
      'h1{font-size:20px;margin:0 0 6px}p{margin:8px 0;color:#3d4451}.mut{color:#6b7280;font-size:13px}' +
      '.btn{display:block;width:100%;box-sizing:border-box;text-align:center;padding:11px 14px;border-radius:8px;border:1px solid #d0d7de;background:#fff;font-family:inherit;font-size:15px;font-weight:600;color:#1c2128;cursor:pointer;text-decoration:none;margin-top:10px}' +
      '.pri{background:#3b6ef0;border-color:#3b6ef0;color:#fff}.btn:disabled{opacity:.6;cursor:default}' +
      'input[type=text],input[type=email],input[type=password],input[type=url]{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d0d7de;border-radius:8px;font:inherit;margin-top:6px}' +
      'label{display:block;margin-top:12px;font-size:13px;font-weight:600}.ck{display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:13.5px}.ck input{margin-top:3px}' +
      'ul{padding-left:20px;margin:8px 0;color:#3d4451}li{margin:4px 0}.ndares{text-align:center;color:#9aa4b2;font-size:12px;margin:16px 0 6px}' +
      '.gab{color:#c62828;font-size:13.5px;margin-top:10px}.kuti{background:#f7f9fc;border:1px solid #e3e7ee;border-radius:8px;padding:10px 12px;margin:12px 0}' +
      '</style></head><body><div class="k"><div class="logo"><img src="/favicon-192.png" alt="">PhronexusAI</div>' + trupi + '</div></body></html>';
  }
  function faqjaGabimi(res, msg) { res.status(400).type('html').send(faqja('Connection error', '<h1>Connection error</h1><p>' + esc(msg) + '</p><p class="mut">Close this window and try connecting again from Claude.</p>')); }

  app.get('/oauth/authorize', async (req, res) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Frame-Options', 'DENY');
    try {
      const v = await validoKerkesen(req.query);
      if (v.gabimFatal) return faqjaGabimi(res, v.gabimFatal);
      if (v.gabimRedirect) return ktheMeGabim(res, v.p, v.gabimRedirect, v.pershkrim);
      const p = v.p;
      const kjoFaqe = req.originalUrl;
      const aplikacioni = emriKlientit(p.client_id, v.doc);
      const bizId = await biznesiNgaSeanca(req);

      // 1) Pa hyre: Google (regjistrim ose hyrje) ose email. Nese sapo hyri me Google per here te pare -> kushtet.
      if (!bizId) {
        const kaPending = !!(req.cookies && req.cookies.imyr_pending);
        if (kaPending) {
          return res.type('html').send(faqja('Create your account',
            '<h1>Create your free account</h1><p>One last step to finish signing up with Google.</p>' +
            '<label class="ck"><input type="checkbox" id="k"> <span>I accept the <a href="/terms" target="_blank">Terms</a>, the <a href="/privacy" target="_blank">Privacy Policy</a> and data processing.</span></label>' +
            '<label class="ck"><input type="checkbox" id="o"> <span>Send me offers and news from PhronexusAI (optional).</span></label>' +
            '<button class="btn pri" id="b">Create account</button><div class="gab" id="g"></div>' +
            '<script>document.getElementById("b").onclick=async function(){var g=document.getElementById("g");g.textContent="";' +
            'if(!document.getElementById("k").checked){g.textContent="Please accept the Terms and the Privacy Policy.";return;}this.disabled=true;' +
            'try{var r=await fetch("/api/google-prano",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kushtet:true,oferta:document.getElementById("o").checked})});' +
            'var d=await r.json().catch(function(){return{}});if(!r.ok){g.textContent=(d&&d.error)||"Something went wrong. Please try again.";this.disabled=false;return;}location.reload();}catch(e){g.textContent="Network error.";this.disabled=false;}};</script>'));
        }
        return res.type('html').send(faqja('Connect to Claude',
          '<h1>Connect PhronexusAI to ' + esc(aplikacioni) + '</h1><p>Sign in, or create a free account for your business. No credit card.</p>' +
          '<a class="btn pri" href="/oauth/google?next=' + encodeURIComponent(kjoFaqe) + '">Continue with Google</a>' +
          '<div class="ndares">or log in with email</div>' +
          '<input type="email" id="e" placeholder="email@business.com" autocomplete="email"><input type="password" id="f" placeholder="Password" autocomplete="current-password">' +
          '<button class="btn" id="b">Log in</button><div class="gab" id="g"></div>' +
          '<p class="mut" style="margin-top:16px">PhronexusAI is for businesses with a website. By continuing you agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</p>' +
          '<script>document.getElementById("b").onclick=async function(){var g=document.getElementById("g");g.textContent="";this.disabled=true;' +
          'try{var r=await fetch("/api/hyr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:document.getElementById("e").value,fjalekalimi:document.getElementById("f").value})});' +
          'var d=await r.json().catch(function(){return{}});if(!r.ok){g.textContent=(d&&d.error)||"Login failed.";this.disabled=false;return;}location.reload();}catch(e){g.textContent="Network error.";this.disabled=false;}};</script>'));
      }

      const b = (await pool.query('SELECT id, emri, email, website FROM bizneset WHERE id=$1', [bizId])).rows[0];
      if (!b) return faqjaGabimi(res, 'Account not found.');

      // 2) Llogari pa faqe biznesi: jep faqen -> AI e konfiguron biznesin (njesoj si "Continue automatically").
      if (!b.website) {
        return res.type('html').send(faqja('Your business website',
          '<h1>Add your business website</h1><p>Our AI reads your website and sets up your business profile and your first ad automatically. It takes about 15 seconds.</p>' +
          '<label for="w">Business website</label><input type="url" id="w" placeholder="https://your-business.com">' +
          '<button class="btn pri" id="b">Continue</button><div class="gab" id="g"></div>' +
          '<script>document.getElementById("b").onclick=async function(){var g=document.getElementById("g"),btn=this,w=document.getElementById("w").value.trim();g.textContent="";' +
          'if(!w){g.textContent="Please enter your business website.";return;}btn.disabled=true;btn.textContent="Setting up your business…";' +
          'try{var r=await fetch("/api/zgjedhja-automatike",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:w})});' +
          'var d=await r.json().catch(function(){return{}});if(!r.ok||d.error){g.textContent=(d&&d.error)||"We could not read this website. Check the address and try again.";btn.disabled=false;btn.textContent="Continue";return;}location.reload();}' +
          'catch(e){g.textContent="Network error.";btn.disabled=false;btn.textContent="Continue";}};</script>'));
      }

      // 3) Leja: cfare mund te lexoje Claude (vetem lexim).
      const shenja = csrf(req, p);
      const fshehura = Object.keys(p).map(k => '<input type="hidden" name="' + k + '" value="' + esc(p[k]) + '">').join('');
      res.type('html').send(faqja('Allow access',
        '<h1>Allow ' + esc(aplikacioni) + ' to access PhronexusAI?</h1>' +
        '<div class="kuti"><b>' + esc(b.emri || 'Your business') + '</b><div class="mut">' + esc(b.website) + ' · ' + esc(b.email || '') + '</div></div>' +
        '<p>It will be able to <b>read</b>:</p><ul><li>your account status and setup steps</li><li>your ads and their performance</li><li>the categories of partners you were matched with</li><li>your ad space code, to help you install it</li></ul>' +
        '<p class="mut">Read-only: it cannot change, publish or delete anything. You can disconnect at any time in Claude.</p>' +
        '<form method="post" action="/oauth/authorize">' + fshehura + '<input type="hidden" name="csrf" value="' + shenja + '">' +
        '<button class="btn pri" name="vendimi" value="lejo">Allow</button><button class="btn" name="vendimi" value="refuzo">Cancel</button></form>'));
    } catch (e) { console.error('oauth authorize:', e.message); faqjaGabimi(res, 'Something went wrong. Please try again.'); }
  });

  app.post('/oauth/authorize', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const v = await validoKerkesen(req.body || {});
      if (v.gabimFatal) return faqjaGabimi(res, v.gabimFatal);
      if (v.gabimRedirect) return ktheMeGabim(res, v.p, v.gabimRedirect, v.pershkrim);
      const p = v.p;
      const bizId = await biznesiNgaSeanca(req);
      const s = String((req.body && req.body.csrf) || '');
      const pritur = csrf(req, p);
      if (!bizId || s.length !== pritur.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(pritur))) return faqjaGabimi(res, 'Your session expired. Please try connecting again.');
      if (req.body.vendimi !== 'lejo') return ktheMeGabim(res, p, 'access_denied', 'The user cancelled the connection');
      await siguroTabelat();
      const kodi = rast(32);
      await pool.query(`INSERT INTO claude_oauth_kodet (kodi_hash, biznes_id, client_id, redirect_uri, code_challenge, scope, skadon)
          VALUES ($1,$2,$3,$4,$5,$6, now() + interval '5 minutes')`, [sha(kodi), bizId, p.client_id, p.redirect_uri, p.code_challenge, SCOPE]);
      const u = new URL(p.redirect_uri);
      u.searchParams.set('code', kodi);
      if (p.state) u.searchParams.set('state', p.state);
      u.searchParams.set('iss', BAZA);
      res.redirect(302, u.toString());
    } catch (e) { console.error('oauth approve:', e.message); faqjaGabimi(res, 'Something went wrong. Please try again.'); }
  });

  // ═══ Token-at ═══
  async function leshoToken(biznesId, clientId) {
    const access = rast(32), refresh = rast(32);
    await pool.query(`INSERT INTO claude_oauth_tokenat (token_hash, lloji, biznes_id, client_id, scope, skadon) VALUES
        ($1,'access',$3,$4,$5, now() + interval '1 hour'), ($2,'refresh',$3,$4,$5, now() + interval '60 days')`, [sha(access), sha(refresh), biznesId, clientId, SCOPE]);
    return { access_token: access, token_type: 'Bearer', expires_in: 3600, refresh_token: refresh, scope: SCOPE };
  }
  app.options('/oauth/token', (req, res) => { cors(res); res.status(204).end(); });
  app.post('/oauth/token', async (req, res) => {
    cors(res); res.set('Cache-Control', 'no-store'); res.set('Pragma', 'no-cache');
    const b = req.body || {};
    const gabim = (kodi, msg) => res.status(400).json({ error: kodi, error_description: msg });
    try {
      await siguroTabelat();
      const clientId = String(b.client_id || '');
      if (b.grant_type === 'authorization_code') {
        const k = (await pool.query('DELETE FROM claude_oauth_kodet WHERE kodi_hash=$1 RETURNING *', [sha(String(b.code || ''))])).rows[0];
        if (!k || new Date(k.skadon).getTime() < Date.now()) return gabim('invalid_grant', 'The authorization code is invalid or expired.');
        if (clientId && clientId !== k.client_id) return gabim('invalid_grant', 'client_id does not match.');
        if (String(b.redirect_uri || '') !== k.redirect_uri) return gabim('invalid_grant', 'redirect_uri does not match.');
        const ver = String(b.code_verifier || '');
        if (!/^[A-Za-z0-9._~-]{43,128}$/.test(ver) || crypto.createHash('sha256').update(ver).digest('base64url') !== k.code_challenge) return gabim('invalid_grant', 'PKCE verification failed.');
        return res.json(await leshoToken(k.biznes_id, k.client_id));
      }
      if (b.grant_type === 'refresh_token') {
        const t = (await pool.query("DELETE FROM claude_oauth_tokenat WHERE token_hash=$1 AND lloji='refresh' RETURNING *", [sha(String(b.refresh_token || ''))])).rows[0];
        if (!t || new Date(t.skadon).getTime() < Date.now()) return gabim('invalid_grant', 'The refresh token is invalid or expired.');
        if (clientId && clientId !== t.client_id) return gabim('invalid_grant', 'client_id does not match.');
        const ekziston = await pool.query('SELECT 1 FROM bizneset WHERE id=$1', [t.biznes_id]);
        if (!ekziston.rows.length) return gabim('invalid_grant', 'Account not found.');
        return res.json(await leshoToken(t.biznes_id, t.client_id));
      }
      return gabim('unsupported_grant_type', 'Use authorization_code or refresh_token.');
    } catch (e) { console.error('oauth token:', e.message); res.status(500).json({ error: 'server_error' }); }
  });

  // ═══ Mjetet ═══
  const ANOT_LEXIM = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  const MJETET = [
    { name: 'find_complementary_partners', title: 'Find complementary partner categories for a website', publik: true,
      description: 'Analyzes a public business website and returns its business category, whether it sells to businesses or consumers, and the two business categories whose customers are most likely to need it without competing with it. Use when the user wants to know which kinds of businesses could cross-promote with a given website. Input: the website address.',
      inputSchema: { type: 'object', properties: { website: { type: 'string', description: 'Business website address, for example example.com or https://example.com' } }, required: ['website'], additionalProperties: false },
      annotations: Object.assign({}, ANOT_LEXIM, { title: 'Find complementary partner categories for a website', openWorldHint: true }) },
    { name: 'get_account_overview', title: 'Get PhronexusAI account overview',
      description: "Returns the signed-in user's PhronexusAI account: business name and website, plan, which distribution pools (Auction, Balance) the account uses, today's used and remaining daily participations, and the status of each setup step (business, description, ad space, ad, conversion tracking).",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: Object.assign({}, ANOT_LEXIM, { title: 'Get PhronexusAI account overview' }) },
    { name: 'get_ad_performance', title: 'Get ad performance statistics',
      description: "Returns statistics for the signed-in user's business over a period: impressions, real views (seen at least 1 second), clicks and conversions of the user's ads on partner websites, and of partner ads on the user's website, with daily totals for charts.",
      inputSchema: { type: 'object', properties: { days: { type: 'integer', enum: [7, 30, 90], default: 30, description: 'Period in days' }, pool: { type: 'string', enum: ['all', 'auction', 'balance'], default: 'all', description: 'Distribution pool to include' } }, additionalProperties: false },
      annotations: Object.assign({}, ANOT_LEXIM, { title: 'Get ad performance statistics' }) },
    { name: 'list_my_ads', title: 'List my ads',
      description: "Lists the signed-in user's ads with their text, status (active or paused), pool, creation date and impressions and clicks in the last 30 days.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: Object.assign({}, ANOT_LEXIM, { title: 'List my ads' }) },
    { name: 'list_partner_categories', title: 'List partner categories',
      description: "Returns the business categories of the partner websites where the signed-in user's ads were shown, and of the partners whose ads were shown on the user's website, with impressions and clicks per category.",
      inputSchema: { type: 'object', properties: { days: { type: 'integer', enum: [7, 30, 90], default: 30, description: 'Period in days' } }, additionalProperties: false },
      annotations: Object.assign({}, ANOT_LEXIM, { title: 'List partner categories' }) },
    { name: 'get_ad_space_code', title: 'Get my ad space code',
      description: "Returns the HTML code of the signed-in user's ad spaces (where partner ads appear) with installation instructions for common website platforms, including the PhronexusAI WordPress plugin.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: Object.assign({}, ANOT_LEXIM, { title: 'Get my ad space code' }) },
    { name: 'check_ad_space_installation', title: 'Check ad space installation',
      description: "Loads a public page of the signed-in user's website and reports whether the PhronexusAI ad space code is present in its HTML. Does not change anything. Code added only by JavaScript may not be detected.",
      inputSchema: { type: 'object', properties: { page_url: { type: 'string', description: "Page to check; defaults to the account's website" } }, additionalProperties: false },
      annotations: Object.assign({}, ANOT_LEXIM, { title: 'Check ad space installation', openWorldHint: true, idempotentHint: true }) }
  ];
  const MBROJTUR = new Set(MJETET.filter(t => !t.publik).map(t => t.name));
  const rez = (teksti, strukt) => ({ content: [{ type: 'text', text: teksti }], structuredContent: strukt });
  const gabMjeti = msg => ({ content: [{ type: 'text', text: msg }], isError: true });

  // Kufi per mjetin publik: 20 analiza te reja / IP / dite (rezultatet e ruajtura nuk numerohen)
  const kufiIP = new Map();
  function lejoIP(ip) {
    const dita = new Date().toISOString().slice(0, 10), k = dita + '|' + ip;
    if (kufiIP.size > 5000) kufiIP.clear();
    const n = (kufiIP.get(k) || 0) + 1; kufiIP.set(k, n);
    return n <= 20;
  }

  async function analizo(domaini, ip) {
    await siguroTabelat();
    const c = (await pool.query("SELECT * FROM claude_analizat WHERE domaini=$1 AND koha > now() - interval '30 days'", [domaini])).rows[0];
    if (c) return c;
    try {
      const d = (await pool.query('SELECT * FROM pxse_bizneset WHERE domaini=$1 LIMIT 1', [domaini])).rows[0];
      if (d && d.kategoria && KATEGORITE.includes(d.kategoria)) return { domaini, emri: d.emri, kategoria: d.kategoria, lloji: d.lloji || null, permbledhje: d.pershkrimi || null };
    } catch (e) {}
    if (!lejoIP(ip)) throw new Error('Daily analysis limit reached. Please try again tomorrow.');
    let f;
    try { f = await merrPublik('https://' + domaini); } catch (e) { try { f = await merrPublik('http://' + domaini); } catch (e2) { throw new Error('The website could not be loaded (' + e.message + ').'); } }
    const titulli = ((f.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
    const meta = ((f.body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [])[1] || '');
    const teksti = (titulli + '\n' + meta + '\n' + pastroHtml(f.body)).slice(0, 3500);
    if (teksti.trim().length < 40) throw new Error('The website has too little readable text to analyze.');
    let a = { emri: titulli.slice(0, 80) || domaini, kategoria: 'Other', lloji: null, permbledhje: null };
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' }, temperature: 0,
          messages: [{ role: 'system', content: 'You classify businesses from their website text. Reply with JSON only.' },
            { role: 'user', content: 'Website text:\n' + teksti + '\n\nReturn JSON: {"name": short business or product name, "category": exactly one of ' + JSON.stringify(KATEGORITE) +
              ', "audience": one of "b2b","b2c","both", "summary": one plain sentence (max 25 words) saying what the business offers}' }] }) });
      const d = await r.json();
      try {
        const j = JSON.parse(d.choices[0].message.content);
        a = { emri: String(j.name || a.emri).slice(0, 80), kategoria: KATEGORITE.includes(j.category) ? j.category : 'Other',
          lloji: ['b2b', 'b2c', 'both'].includes(j.audience) ? j.audience : null, permbledhje: String(j.summary || '').slice(0, 300) || null };
      } catch (e) {}
    }
    await pool.query(`INSERT INTO claude_analizat (domaini, emri, kategoria, lloji, permbledhje, koha) VALUES ($1,$2,$3,$4,$5, now())
        ON CONFLICT (domaini) DO UPDATE SET emri=EXCLUDED.emri, kategoria=EXCLUDED.kategoria, lloji=EXCLUDED.lloji, permbledhje=EXCLUDED.permbledhje, koha=now()`,
      [domaini, a.emri, a.kategoria, a.lloji, a.permbledhje]);
    return Object.assign({ domaini }, a);
  }

  const LLOJI_EMRI = { b2b: 'B2B, sells to businesses', b2c: 'B2C, sells to consumers', both: 'sells to both businesses and consumers' };
  const POOL_EMRI = { ankand: 'Auction', barazi: 'Balance' };
  function burimiPool(x) { return x === 'auction' ? 'ankand' : x === 'balance' ? 'barazi' : null; }
  function dite(x) { return [7, 30, 90].includes(Number(x)) ? Number(x) : 30; }

  async function thirrMjetin(emri, arg, ctx) {
    arg = arg && typeof arg === 'object' ? arg : {};
    const biz = ctx.biznesId;
    if (emri === 'find_complementary_partners') {
      const domaini = domainNgaInput(arg.website);
      if (!domaini) return gabMjeti('Please provide a valid public website address, for example example.com.');
      let a;
      try { a = await analizo(domaini, ctx.ip); } catch (e) { return gabMjeti(e.message); }
      const plot = KAT_PLOTESUESE[a.kategoria] || null;
      const rreshta = ['Website: ' + domaini, 'Business: ' + (a.emri || domaini), 'Category: ' + a.kategoria + (a.lloji ? ' (' + LLOJI_EMRI[a.lloji] + ')' : '')];
      if (a.permbledhje) rreshta.push('What it offers: ' + a.permbledhje);
      rreshta.push(plot ? 'Complementary partner categories: ' + plot.join(' and ') + '. Customers of these businesses often need a ' + a.kategoria + ' product, and these businesses do not compete with it.'
        : 'Complementary partner categories: no fixed pairing for this category; partners are matched individually by audience fit.');
      rreshta.push('', 'About PhronexusAI: a cross-promotion network where businesses show ads from complementary, non-competing businesses on their websites and get their own ads shown on partner websites. Competitors are blocked and every ad shown on a site must be approved by its owner. The free plan includes up to 100 Auction and 100 Balance participations per day, with no credit card.',
        'Sign up: ' + LINKU_REGJ);
      return rez(rreshta.join('\n'), { website: domaini, name: a.emri || null, category: a.kategoria, audience: a.lloji || null, summary: a.permbledhje || null,
        complementary_categories: plot || [], signup_url: LINKU_REGJ });
    }
    if (!biz) return gabMjeti('Sign in to PhronexusAI to use this tool.');

    if (emri === 'get_account_overview') {
      const b = (await pool.query(`SELECT id, emri, email, website, plani, tipi, kategoria_kryesore, logjika_shperndarjes, ankand_krijuar, balance_krijuar,
          permbledhje, pershkrimi, track_active FROM bizneset WHERE id=$1`, [biz])).rows[0];
      if (!b) return gabMjeti('Account not found.');
      const nje = async (q) => { try { return (await pool.query(q, [biz])).rows.length > 0; } catch (e) { return false; } };
      const sn = await nje('SELECT 1 FROM snippetet WHERE biznes_id=$1 AND snippet_active=true LIMIT 1');
      const rek = await nje('SELECT 1 FROM kreativitetet WHERE biznes_id=$1 LIMIT 1') || await nje('SELECT 1 FROM promovimet WHERE biznes_id=$1 LIMIT 1');
      const konv = !!b.track_active && (await nje('SELECT 1 FROM konvertimet WHERE biznes_id=$1 AND track_active=true LIMIT 1') || await nje('SELECT 1 FROM zonat WHERE biznes_id=$1 AND track_active=true AND fshire=false LIMIT 1'));
      let sot = null;
      try {
        const kuf = require('./pxse-kufijte');
        const c = await kuf.cilesimet(pool), gj = (await kuf.gjendjaSot(pool, [biz]))[biz];
        if (gj) { const max = kuf.kufiri(c, gj); sot = { daily_limit_per_pool: max, auction_used: gj.ankand, balance_used: gj.balance, auction_remaining: Math.max(0, max - gj.ankand), balance_remaining: Math.max(0, max - gj.balance) }; }
      } catch (e) {}
      const pools = [];
      if (b.ankand_krijuar) pools.push('Auction');
      if (b.balance_krijuar) pools.push('Balance');
      const hapat = { business: !!(b.website && b.tipi), description: !!(b.permbledhje || b.pershkrimi), ad_space_connected: sn, ad_created: rek, conversion_tracking: konv };
      const plani = (b.plani || 'falas') === 'premium' ? 'Premium' : 'Free';
      const t = ['Business: ' + (b.emri || '—') + (b.website ? ' (' + b.website + ')' : ''), 'Plan: ' + plani,
        'Pools: ' + (pools.join(', ') || 'none yet') + (b.logjika_shperndarjes ? ' · default for new ads: ' + (POOL_EMRI[b.logjika_shperndarjes] || b.logjika_shperndarjes) : ''),
        sot ? 'Today: Auction ' + sot.auction_used + '/' + sot.daily_limit_per_pool + ', Balance ' + sot.balance_used + '/' + sot.daily_limit_per_pool + ' participations' : 'Today: not available',
        'Setup: business ' + (hapat.business ? '✓' : '✗') + ' · description ' + (hapat.description ? '✓' : '✗') + ' · ad space connected ' + (hapat.ad_space_connected ? '✓' : '✗') +
          ' · ad created ' + (hapat.ad_created ? '✓' : '✗') + ' · conversion tracking ' + (hapat.conversion_tracking ? '✓' : '✗'),
        hapat.ad_space_connected ? '' : 'Your ads are not shown on partner websites until your ad space is connected (see get_ad_space_code).',
        'Dashboard: ' + BAZA + '/app/dashboard'].filter(Boolean);
      return rez(t.join('\n'), { business: { name: b.emri, website: b.website, category: b.kategoria_kryesore || null, audience: b.tipi || null }, plan: plani,
        pools, default_pool: POOL_EMRI[b.logjika_shperndarjes] || null, today: sot, setup: hapat, dashboard_url: BAZA + '/app/dashboard' });
    }

    if (emri === 'get_ad_performance') {
      const d = dite(arg.days), bur = burimiPool(arg.pool);
      const kushtB = bur ? ' AND e.burimi = $3' : '';
      const params = bur ? [biz, d, bur] : [biz, d];
      const mbl = `COUNT(*) FILTER (WHERE e.lloji='view')::int AS impressions, COUNT(*) FILTER (WHERE e.lloji='shikim')::int AS real_views,
          COUNT(*) FILTER (WHERE e.lloji='click')::int AS clicks, COUNT(*) FILTER (WHERE e.lloji='konvertim')::int AS conversions`;
      const kohe = ` AND e.created_at > now() - ($2::int * interval '1 day')`;
      const imat = (await pool.query(`SELECT ${mbl} FROM ngjarjet e JOIN promovimet p ON p.id = e.reklama_id WHERE p.biznes_id=$1${kohe}${kushtB}`, params)).rows[0];
      const teMia = (await pool.query(`SELECT ${mbl} FROM ngjarjet e WHERE e.biznes_id=$1${kohe}${kushtB}`, params)).rows[0];
      const ditore = (await pool.query(`SELECT to_char(dd, 'YYYY-MM-DD') AS date,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e JOIN promovimet p ON p.id=e.reklama_id WHERE p.biznes_id=$1 AND e.lloji='view' AND e.created_at::date = dd${kushtB}),0)::int AS my_ad_impressions,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e JOIN promovimet p ON p.id=e.reklama_id WHERE p.biznes_id=$1 AND e.lloji='click' AND e.created_at::date = dd${kushtB}),0)::int AS my_ad_clicks,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.biznes_id=$1 AND e.lloji='view' AND e.created_at::date = dd${kushtB}),0)::int AS partner_ad_impressions_on_my_site
        FROM generate_series((now() - (($2::int - 1) * interval '1 day'))::date, now()::date, interval '1 day') AS dd ORDER BY dd`, params)).rows;
      const ctr = x => x.impressions ? (Math.round(x.clicks / x.impressions * 1000) / 10) + '%' : '—';
      const t = ['Period: last ' + d + ' days' + (bur ? ' · pool: ' + POOL_EMRI[bur] : ' · all pools'),
        'Your ads on partner websites: ' + imat.impressions + ' impressions, ' + imat.real_views + ' real views, ' + imat.clicks + ' clicks (CTR ' + ctr(imat) + '), ' + imat.conversions + ' conversions',
        'Partner ads on your website: ' + teMia.impressions + ' impressions, ' + teMia.real_views + ' real views, ' + teMia.clicks + ' clicks, ' + teMia.conversions + ' conversions',
        'Daily totals are included in the structured result.'];
      return rez(t.join('\n'), { period_days: d, pool: bur ? POOL_EMRI[bur] : 'All', my_ads_on_partner_sites: imat, partner_ads_on_my_site: teMia, daily: ditore });
    }

    if (emri === 'list_my_ads') {
      const r = (await pool.query(`SELECT p.id, p.teksti, p.aktiv, p.pauzuar, p.auto_krijuar, p.created_at, COALESCE(p.logjika_shperndarjes,'ankand') AS pool,
          (SELECT COUNT(*) FROM ngjarjet e WHERE e.reklama_id=p.id AND e.lloji='view' AND e.created_at > now() - interval '30 days')::int AS impressions_30d,
          (SELECT COUNT(*) FROM ngjarjet e WHERE e.reklama_id=p.id AND e.lloji='click' AND e.created_at > now() - interval '30 days')::int AS clicks_30d
        FROM promovimet p WHERE p.biznes_id=$1 ORDER BY p.id DESC LIMIT 50`, [biz])).rows;
      if (!r.length) return rez('You have no ads yet. Create one in your dashboard: ' + BAZA + '/app/dashboard', { ads: [] });
      const ads = r.map(x => ({ id: x.id, text: x.teksti ? String(x.teksti).slice(0, 300) : null, status: x.pauzuar ? 'paused' : (x.aktiv === false ? 'inactive' : 'active'),
        pool: POOL_EMRI[x.pool] || x.pool, created_by: x.auto_krijuar ? 'AI (automatic)' : 'you', created_at: x.created_at, impressions_30d: x.impressions_30d, clicks_30d: x.clicks_30d }));
      return rez(ads.map((a, i) => (i + 1) + '. [' + a.status + ', ' + a.pool + '] ' + (a.text || '(image or video ad)') + ' — ' + a.impressions_30d + ' impressions, ' + a.clicks_30d + ' clicks (30 days)').join('\n'), { ads });
    }

    if (emri === 'list_partner_categories') {
      const d = dite(arg.days);
      const imat = (await pool.query(`SELECT COALESCE(NULLIF(b.kategoria_kryesore,''),'Uncategorized') AS category,
          COUNT(*) FILTER (WHERE e.lloji='view')::int AS impressions, COUNT(*) FILTER (WHERE e.lloji='click')::int AS clicks
        FROM ngjarjet e JOIN promovimet p ON p.id=e.reklama_id JOIN bizneset b ON b.id=e.biznes_id
        WHERE p.biznes_id=$1 AND e.created_at > now() - ($2::int * interval '1 day') GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, [biz, d])).rows;
      const teMia = (await pool.query(`SELECT COALESCE(NULLIF(b.kategoria_kryesore,''),'Uncategorized') AS category,
          COUNT(*) FILTER (WHERE e.lloji='view')::int AS impressions, COUNT(*) FILTER (WHERE e.lloji='click')::int AS clicks
        FROM ngjarjet e JOIN promovimet p ON p.id=e.reklama_id JOIN bizneset b ON b.id=p.biznes_id
        WHERE e.biznes_id=$1 AND e.created_at > now() - ($2::int * interval '1 day') GROUP BY 1 ORDER BY 2 DESC LIMIT 15`, [biz, d])).rows;
      const fmt = l => l.length ? l.map(x => '- ' + x.category + ': ' + x.impressions + ' impressions, ' + x.clicks + ' clicks').join('\n') : '- none yet';
      return rez('Last ' + d + ' days.\nYour ads were shown on partner websites in these categories:\n' + fmt(imat) + '\nPartner ads shown on your website came from these categories:\n' + fmt(teMia),
        { period_days: d, where_my_ads_were_shown: imat, partner_ads_on_my_site: teMia });
    }

    if (emri === 'get_ad_space_code') {
      let sn = [];
      try { sn = (await pool.query('SELECT * FROM snippetet WHERE biznes_id=$1 ORDER BY id', [biz])).rows; } catch (e) {}
      if (!sn.length) return rez('You have no ad space yet. Create one in your dashboard: ' + BAZA + '/app/connection', { ad_spaces: [] });
      const spaces = sn.filter(x => x.celes).map(x => ({ name: x.emri || ('Ad space ' + x.id), connected: !!x.snippet_active, paused: !!x.pauzuar,
        code: '<script src="' + BAZA + '/phronexusai.js" data-key="' + x.celes + '"></script>' }));
      const udh = ['Where to paste the code (on the page where partner ads should appear, for example the footer or a sidebar):',
        '- WordPress: install the free "PhronexusAI" plugin (Plugins → Add New → search "PhronexusAI"), then paste the code in Settings → PhronexusAI. Or add it with a "Custom HTML" block.',
        '- Shopify: Online Store → Themes → Edit code → theme.liquid, paste before </body>.',
        '- Webflow: Site settings → Custom code → Footer code. Wix: Settings → Custom code → Body - end.',
        '- Plain HTML or a site built with code: paste it before </body>, or where the ads should appear.',
        'After installing, use check_ad_space_installation or click "Verify connection" in the dashboard: ' + BAZA + '/app/connection'];
      return rez(spaces.map(s => s.name + (s.connected ? ' (connected)' : ' (not connected yet)') + ':\n' + s.code).join('\n\n') + '\n\n' + udh.join('\n'), { ad_spaces: spaces, instructions: udh });
    }

    if (emri === 'check_ad_space_installation') {
      const b = (await pool.query('SELECT website, celes FROM bizneset WHERE id=$1', [biz])).rows[0] || {};
      let url = String(arg.page_url || b.website || '').trim();
      if (!url) return gabMjeti('No website on the account. Provide page_url.');
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      let celesat = [];
      try { celesat = (await pool.query('SELECT celes FROM snippetet WHERE biznes_id=$1 AND celes IS NOT NULL', [biz])).rows.map(x => x.celes); } catch (e) {}
      if (b.celes) celesat.push(b.celes);
      let f;
      try { f = await merrPublik(url); } catch (e) { return gabMjeti('The page could not be loaded: ' + e.message); }
      const gjetur = celesat.filter(k => k && f.body.includes(k));
      const ok = gjetur.length > 0;
      return rez(ok ? 'Found: the PhronexusAI ad space code is on ' + f.url + '. Confirm it in the dashboard with "Verify connection" (' + BAZA + '/app/connection) if it is not marked as connected yet.'
        : 'Not found: the PhronexusAI ad space code was not detected in the HTML of ' + f.url + '. If you added it with a tag manager or JavaScript, use "Verify connection" in the dashboard instead.',
        { page: f.url, http_status: f.status, code_found: ok });
    }
    return null;
  }

  // ═══ MCP (JSON-RPC 2.0 mbi HTTP) ═══
  function pergjigjeGabim(id, kodi, msg) { return { jsonrpc: '2.0', id: id === undefined ? null : id, error: { code: kodi, message: msg } }; }
  async function trajto(msg, ctx) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      return (msg && (msg.result !== undefined || msg.error !== undefined)) ? null : pergjigjeGabim(msg && msg.id, -32600, 'Invalid Request');
    }
    const njoftim = msg.id === undefined || msg.id === null;
    const ok = result => njoftim ? null : { jsonrpc: '2.0', id: msg.id, result };
    switch (msg.method) {
      case 'initialize': {
        const kerkuar = msg.params && msg.params.protocolVersion;
        return ok({ protocolVersion: VERSIONET.includes(kerkuar) ? kerkuar : VERSIONET[1], capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'phronexusai', title: 'PhronexusAI', version: '1.0.0', websiteUrl: BAZA },
          instructions: 'PhronexusAI tools: find_complementary_partners works without signing in. The other tools read the signed-in user\'s PhronexusAI account and are read-only.' });
      }
      case 'ping': return ok({});
      case 'tools/list': return ok({ tools: MJETET.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations })) });
      case 'resources/list': return ok({ resources: [] });
      case 'prompts/list': return ok({ prompts: [] });
      case 'tools/call': {
        const emri = msg.params && msg.params.name;
        if (!MJETET.some(t => t.name === emri)) return njoftim ? null : pergjigjeGabim(msg.id, -32602, 'Unknown tool: ' + emri);
        try {
          const r = await thirrMjetin(emri, msg.params.arguments, ctx);
          return ok(r || gabMjeti('Unknown tool.'));
        } catch (e) { console.error('claude tool ' + emri + ':', e.message); return ok(gabMjeti('The tool failed: ' + e.message)); }
      }
      default:
        if (msg.method.startsWith('notifications/')) return null;
        return njoftim ? null : pergjigjeGabim(msg.id, -32601, 'Method not found: ' + msg.method);
    }
  }
  const WWW_AUTH = 'Bearer error="invalid_token", error_description="Sign in to PhronexusAI to use this tool", resource_metadata="' + BAZA + '/.well-known/oauth-protected-resource/mcp", scope="' + SCOPE + '"';

  app.options('/mcp', (req, res) => { cors(res); res.status(204).end(); });
  app.get('/mcp', (req, res) => { cors(res); res.set('Allow', 'POST'); res.status(405).json({ error: 'Use POST for MCP requests.' }); });
  app.delete('/mcp', (req, res) => { cors(res); res.status(405).end(); });
  app.post('/mcp', async (req, res) => {
    cors(res);
    try {
      const trupi = req.body;
      if (trupi == null || (typeof trupi !== 'object')) return res.status(400).json(pergjigjeGabim(null, -32700, 'Parse error'));
      const mesazhet = Array.isArray(trupi) ? trupi : [trupi];
      if (!mesazhet.length || mesazhet.length > 20) return res.status(400).json(pergjigjeGabim(null, -32600, 'Invalid Request'));
      const t = await biznesiNgaToken(req);
      const kerkonLlogari = mesazhet.some(m => m && m.method === 'tools/call' && m.params && MBROJTUR.has(m.params.name));
      if (kerkonLlogari && !t.biznesId) {
        res.set('WWW-Authenticate', WWW_AUTH);
        return res.status(401).json({ error: 'invalid_token', error_description: 'Sign in to PhronexusAI to use this tool' });
      }
      const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(); // Railway: IP e vertete vjen te x-forwarded-for
      const ctx = { biznesId: t.biznesId, ip };
      const pergjigjet = (await Promise.all(mesazhet.map(m => trajto(m, ctx)))).filter(Boolean);
      if (!pergjigjet.length) return res.status(202).end();
      res.json(Array.isArray(trupi) ? pergjigjet : pergjigjet[0]);
    } catch (e) {
      console.error('mcp:', e.message);
      if (!res.headersSent) res.status(500).json(pergjigjeGabim(null, -32603, 'Internal error'));
    }
  });

  // ═══ Dokumentimi publik ═══
  app.get('/claude', (req, res) => {
    res.type('html').send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>PhronexusAI connector for Claude</title><meta name="description" content="Connect PhronexusAI to Claude: find complementary partner categories for any business website, and check your ads, statistics and ad space from a conversation.">' +
      '<link rel="canonical" href="' + BAZA + '/claude"><style>body{margin:0;background:#fff;color:#1c2128;font:16px/1.65 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
      'main{max-width:760px;margin:0 auto;padding:40px 16px 60px}h1{font-size:30px;line-height:1.25}h2{margin-top:34px;font-size:21px}code{background:#f3f4f6;padding:2px 6px;border-radius:5px;font-size:14px}' +
      'table{border-collapse:collapse;width:100%;font-size:14.5px}td,th{border:1px solid #e3e7ee;padding:8px 10px;text-align:left;vertical-align:top}a{color:#2f5fd0}</style></head><body><main>' +
      '<p><a href="/">← PhronexusAI</a></p><h1>PhronexusAI connector for Claude</h1>' +
      '<p>The PhronexusAI connector lets you use PhronexusAI, a cross-promotion network for businesses, from a conversation with Claude. Ask which kinds of businesses could promote a website, check your account, see how your ads perform, and get help installing your ad space, without opening the dashboard.</p>' +
      '<h2>Set up</h2><ol><li>In Claude, open <b>Customize → Connectors</b> and add <b>PhronexusAI</b>. To add it manually, choose <b>Add custom connector</b> and enter <code>' + esc(RESURSI) + '</code>.</li>' +
      '<li>Ask Claude something like <i>"Which businesses could cross-promote with example.com?"</i>. This works without an account.</li>' +
      '<li>For your own data, Claude shows a <b>Connect</b> button. Sign in with Google or email. New users can create a free account and add their business website in the same window.</li></ol>' +
      '<p>Requirements: a business website. PhronexusAI is not for personal use. The free plan needs no credit card.</p>' +
      '<h2>Tools</h2><table><tr><th>Tool</th><th>What it does</th><th>Sign-in</th></tr>' +
      MJETET.map(t => '<tr><td><code>' + t.name + '</code></td><td>' + esc(t.description) + '</td><td>' + (t.publik ? 'Not needed' : 'Required') + '</td></tr>').join('') + '</table>' +
      '<p>All tools are read-only. They cannot create, change, publish or delete anything in your account.</p>' +
      '<h2>Example prompts</h2><ul><li>"Which business categories would be good cross-promotion partners for acme.com?"</li><li>"How did my PhronexusAI ads perform in the last 30 days? Show a chart."</li>' +
      '<li>"Is my ad space installed correctly on my website?"</li><li>"Give me my ad space code and help me add it to my WordPress site."</li></ul>' +
      '<h2>Data and privacy</h2><p>When you connect, Claude can read only the data listed above for your business. Access tokens expire after one hour and refresh tokens after 60 days; you can disconnect at any time in Claude. The public tool reads the homepage of the website you provide and stores its category for 30 days. ' +
      'See the <a href="/privacy">Privacy Policy</a> and the <a href="/terms">Terms</a>.</p>' +
      '<h2>Support</h2><p>Email <a href="mailto:info@phronexusai.com">info@phronexusai.com</a>.</p></main></body></html>');
  });
};
