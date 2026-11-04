// pxse-backlinket.js — Eksperiment: gjen platforma me reputacion ku PhronexusAI mund te listohet / permendet me link.
//
// Rrjedha (pas klikimit "Kërko" te Marketingu → Backlinke):
//   1. Kerkon ne Google (DataForSEO SERP API) frazat-gjurme ("submit your SaaS", "write for us marketing", ...).
//   2. Per cdo domain te gjetur merr fuqine (rank 0–100) dhe spam score (DataForSEO Backlinks API).
//   3. Per ato me fuqi te mjaftueshme kontrollon live, si Googlebot: robots.txt (Googlebot, Bingbot, OAI-SearchBot),
//      noindex, faqe me login, dhe sa linke te jashtme ne faqe jane dofollow apo nofollow/ugc/sponsored.
//   4. "Kalon" = fuqi >= min, spam <= max, robotet lejohen, pa noindex, pa login, me te pakten nje link dofollow te jashtem.
//
// Railway Variables: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD (Secret). Kosto e perafert: ~$0.1–0.5 per kerkim te plote.
const { pxseHostPublik } = require('./pxse-prova');

const PXBL_API = (process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com/v3').replace(/\/$/, '');
const PXBL_UA = 'Mozilla/5.0 (compatible; PhronexusAI-backlinks/1.0; +https://phronexusai.com)';
const PXBL_PYETJET = [
  'submit your SaaS', 'submit your startup', 'add your startup to directory', 'submit your tool',
  'list your product startup directory', 'SaaS directory submit', 'startup directories list', 'best SaaS directories',
  'where to launch your startup', 'product launch platforms', 'write for us SaaS', 'write for us marketing',
  'guest post B2B marketing', 'contribute to our SaaS blog', 'best marketing tools for startups', 'best SaaS growth tools',
  'AI tools directory submit', 'cross promotion platform', 'alternatives to Google Ads for startups', 'free advertising for small business'
];
// rrjete/forume te pergjithshme (pranohen, por shenohen si te tilla)
const PXBL_SOCIALE = ['reddit.com', 'quora.com', 'medium.com', 'linkedin.com', 'bsky.app', 'x.com', 'twitter.com', 'facebook.com', 'youtube.com',
  'indiehackers.com', 'dev.to', 'producthunt.com', 'news.ycombinator.com', 'hashnode.com', 'substack.com', 'github.com'];
const PXBL_PA_LINK = /(^|\.)(facebook|twitter|x|linkedin|instagram|youtube|pinterest|tiktok|google|apple|whatsapp|t)\.(com|me|co)$/i;

const nr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const fle = ms => new Promise(r => setTimeout(r, ms));
function pxblDomain(u) {
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
}
function pxblNenDomain(host, dom) { return host === dom || host.endsWith('.' + dom); }

async function pxblMarr(url, ms = 12000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || !(await pxseHostPublik(u.hostname).catch(() => false))) return null;
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': PXBL_UA, Accept: 'text/html,text/plain,*/*' } });
    const tekst = Buffer.from(await r.arrayBuffer()).slice(0, 1500000).toString('utf8');
    return { status: r.status, url: r.url || url, tekst, lloji: r.headers.get('content-type') || '' };
  } catch (e) { return null; }
  finally { clearTimeout(t); }
}

// robots.txt: a lejohet roboti te rrenja e faqes? true / false / null (s'u lexua → nuk e bllokojme)
function pxblRobotLejon(robots, roboti) {
  if (robots == null) return null;
  const grupet = []; let gr = null, priteAgjent = false;
  for (const rr of String(robots).split(/\r?\n/)) {
    const l = rr.replace(/#.*/, '').trim(); if (!l) continue;
    const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!gr || !priteAgjent) { gr = { agjentet: [], rregullat: [] }; grupet.push(gr); } gr.agjentet.push(v.toLowerCase()); priteAgjent = true; }
    else if (gr && (k === 'disallow' || k === 'allow')) { gr.rregullat.push({ k, v }); priteAgjent = false; }
  }
  const emri = roboti.toLowerCase();
  const g = grupet.find(x => x.agjentet.some(a => a !== '*' && emri.includes(a))) || grupet.find(x => x.agjentet.includes('*'));
  if (!g) return true;
  const bllokRrenja = g.rregullat.some(r => r.k === 'disallow' && (r.v === '/' || r.v === '/*'));
  const lejonRrenja = g.rregullat.some(r => r.k === 'allow' && (r.v === '/' || r.v === '/*'));
  return !(bllokRrenja && !lejonRrenja);
}

// Faqja: noindex, login, linke te jashtme dofollow / nofollow
function pxblAnalizoFaqen(html, urlFaqes) {
  const host = pxblDomain(urlFaqes);
  const meta = (html.match(/<meta[^>]+name=["'](robots|googlebot)["'][^>]*>/gi) || []).join(' ');
  const noindex = /noindex/i.test(meta);
  const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const login = /<input[^>]+type=["']password["']/i.test(html) && tekst.length < 3000;
  let dofollow = 0, nofollow = 0;
  const pare = new Set();
  for (const m of html.matchAll(/<a\s[^>]*href=["'](https?:\/\/[^"'#\s]+)["'][^>]*>/gi)) {
    const h = pxblDomain(m[1]);
    if (!h || pxblNenDomain(h, host) || pxblNenDomain(host, h) || PXBL_PA_LINK.test(h) || pare.has(h)) continue;
    pare.add(h);
    const rel = ((m[0].match(/\srel=["']([^"']*)["']/i) || [])[1] || '').toLowerCase();
    if (/nofollow|ugc|sponsored/.test(rel)) nofollow++; else dofollow++;
  }
  const titulli = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  return { noindex, login, dofollow, nofollow, titulli };
}

function pxblLloji(domaini, pyetja, titulli, url) {
  const t = (titulli + ' ' + url).toLowerCase(), q = (pyetja || '').toLowerCase();
  if (PXBL_SOCIALE.some(s => pxblNenDomain(domaini, s))) return 'Rrjet / komunitet';
  if (/write for us|guest post|contribut/.test(t) || /write for us|guest post|contribute/.test(q)) return 'Guest post';
  if (/submit|directory|list your|add your|launch/.test(t)) return 'Direktori / lançim';
  if (/\bbest\b|\btop \d|alternatives|tools/.test(t)) return 'Listë "best" / artikull';
  if (/submit|directory|launch/.test(q)) return 'Direktori / lançim';
  return 'Tjetër';
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_bl_domenet (
      domaini TEXT PRIMARY KEY, url TEXT, titulli TEXT, pyetja TEXT,
      fuqia INT, spam INT, rob_google BOOLEAN, rob_bing BOOLEAN, rob_oai BOOLEAN,
      noindex BOOLEAN, login BOOLEAN, dofollow INT, nofollow INT, lloji TEXT, kalon BOOLEAN, arsye TEXT,
      gjetur_at TIMESTAMPTZ DEFAULT now(), kontrolluar_at TIMESTAMPTZ)`);
    await pool.query('CREATE TABLE IF NOT EXISTS pxse_bl_cilesimet (celesi TEXT PRIMARY KEY, vlera TEXT)');
  })().catch(e => console.error('pxse-backlinket migrim:', e.message));

  async function cilesimi(k, d) { try { const r = await pool.query('SELECT vlera FROM pxse_bl_cilesimet WHERE celesi=$1', [k]); return r.rows.length ? r.rows[0].vlera : d; } catch (e) { return d; } }
  async function vendos(k, v) { await pool.query('INSERT INTO pxse_bl_cilesimet (celesi, vlera) VALUES ($1,$2) ON CONFLICT (celesi) DO UPDATE SET vlera=$2', [k, String(v)]); }

  const gjendja = { duke: false, hapi: '', kosto: 0, gabimi: null };

  async function dfs(rruga, body) {
    const login = process.env.DATAFORSEO_LOGIN, pass = process.env.DATAFORSEO_PASSWORD;
    if (!login || !pass) throw new Error('Mungojnë DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD te Railway Variables.');
    const r = await fetch(PXBL_API + rruga, {
      method: 'POST', body: JSON.stringify(body),
      headers: { Authorization: 'Basic ' + Buffer.from(login + ':' + pass).toString('base64'), 'Content-Type': 'application/json' }
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) throw Object.assign(new Error('DataForSEO HTTP ' + r.status + (j && (j.status_message || j.status_code) ? ' — ' + (j.status_code ? j.status_code + ': ' : '') + (j.status_message || '') : '')), { fatal: true });
    if (j.status_code !== 20000) throw new Error('DataForSEO: ' + (j.status_message || j.status_code));
    gjendja.kosto += Number(j.cost) || 0;
    const t = (j.tasks || [])[0];
    if (!t || t.status_code !== 20000) { const e = new Error('DataForSEO: ' + (t ? t.status_code + ' ' + (t.status_message || '') : 'detyra dështoi')); e.kodi = t && t.status_code; throw e; }
    return (t.result || [])[0] || {};
  }

  async function kontrollo(x, min, maxSpam) {
    const arsye = [];
    let rob = { g: null, b: null, o: null }, fq = { noindex: false, login: false, dofollow: 0, nofollow: 0, titulli: x.titulli || '' };
    const robotsR = await pxblMarr('https://' + x.domaini + '/robots.txt', 8000);
    const robots = robotsR && robotsR.status === 200 && !/html/i.test(robotsR.lloji) ? robotsR.tekst : (robotsR && robotsR.status >= 400 && robotsR.status < 500 ? '' : null);
    rob = { g: pxblRobotLejon(robots, 'Googlebot'), b: pxblRobotLejon(robots, 'Bingbot'), o: pxblRobotLejon(robots, 'OAI-SearchBot') };
    const faqja = x.url ? await pxblMarr(x.url) : null;
    if (faqja && faqja.status < 400 && /html/i.test(faqja.lloji)) fq = Object.assign(fq, pxblAnalizoFaqen(faqja.tekst, faqja.url));
    else arsye.push('faqja s’u hap');
    if (x.fuqia != null && x.fuqia < min) arsye.push('fuqi e ulët');
    if (x.spam != null && x.spam > maxSpam) arsye.push('spam i lartë');
    if (rob.g === false) arsye.push('bllokon Googlebot');
    if (rob.b === false) arsye.push('bllokon Bingbot');
    if (rob.o === false) arsye.push('bllokon ChatGPT');
    if (fq.noindex) arsye.push('noindex');
    if (fq.login) arsye.push('kërkon login');
    if (faqja && !fq.dofollow) arsye.push(fq.nofollow ? 'linket janë nofollow' : 's’ka linke të jashtme');
    const lloji = pxblLloji(x.domaini, x.pyetja, (x.titulli || '') + ' ' + (fq.titulli || ''), x.url || '');
    await pool.query(`UPDATE pxse_bl_domenet SET rob_google=$2, rob_bing=$3, rob_oai=$4, noindex=$5, login=$6, dofollow=$7, nofollow=$8,
        lloji=$9, kalon=$10, arsye=$11, titulli=COALESCE(NULLIF($12,''), titulli), kontrolluar_at=now() WHERE domaini=$1`,
      [x.domaini, rob.g, rob.b, rob.o, fq.noindex, fq.login, fq.dofollow, fq.nofollow, lloji, !arsye.length, arsye.join(', ') || null, fq.titulli || '']);
  }

  async function kerko(pyetjet, thellesia, min, maxSpam) {
    if (gjendja.duke) return; Object.assign(gjendja, { duke: true, hapi: 'Po fillon…', kosto: 0, gabimi: null });
    try {
      // 1. Kerkimet ne Google
      let i = 0; const deshtuan = []; let shenim = '';
      for (const q of pyetjet) {
        gjendja.hapi = `Kërkim në Google ${++i}/${pyetjet.length}: “${q}”`;
        let r;
        try { r = await dfs('/serp/google/organic/live/regular', [{ keyword: q, location_code: 2840, language_code: 'en', depth: thellesia }]); }
        catch (e) { if (e.fatal || /^402/.test(String(e.kodi || ''))) throw e; deshtuan.push(q + ' (' + e.message.replace('DataForSEO: ', '') + ')'); continue; }
        for (const it of (r.items || [])) {
          if (it.type !== 'organic' || !it.url) continue;
          const d = pxblDomain(it.url); if (!d || pxblNenDomain(d, 'phronexusai.com')) continue;
          await pool.query(`INSERT INTO pxse_bl_domenet (domaini, url, titulli, pyetja) VALUES ($1,$2,$3,$4) ON CONFLICT (domaini) DO NOTHING`,
            [d, it.url, String(it.title || '').slice(0, 200), q]);
        }
      }
      // 2. Fuqia dhe spam per ata qe s'e kane
      const pa = (await pool.query('SELECT domaini FROM pxse_bl_domenet WHERE fuqia IS NULL')).rows.map(x => x.domaini);
      try { for (let k = 0; k < pa.length; k += 1000) {
        const pjesa = pa.slice(k, k + 1000);
        gjendja.hapi = `Fuqia e ${pjesa.length} domaineve…`;
        const rr = await dfs('/backlinks/bulk_ranks/live', [{ targets: pjesa, rank_scale: 'one_hundred' }]);
        for (const it of (rr.items || [])) await pool.query('UPDATE pxse_bl_domenet SET fuqia=$2 WHERE domaini=$1', [String(it.target).replace(/^www\./, ''), nr(it.rank, 0)]);
        gjendja.hapi = `Spam score i ${pjesa.length} domaineve…`;
        const rs = await dfs('/backlinks/bulk_spam_score/live', [{ targets: pjesa }]);
        for (const it of (rs.items || [])) await pool.query('UPDATE pxse_bl_domenet SET spam=$2 WHERE domaini=$1', [String(it.target).replace(/^www\./, ''), nr(it.spam_score, 0)]);
      } } catch (e) { shenim = 'fuqia dhe spam s’u morën (' + e.message.replace('DataForSEO ', '') + ') — Backlinks API e DataForSEO kërkon abonim; filtri i fuqisë u anashkalua'; }
      // 3. Kontrolli live (vetem per ata me fuqi dhe pa spam; te tjeret shenohen pa i hapur)
      await pool.query(`UPDATE pxse_bl_domenet SET kalon=false, kontrolluar_at=now(),
          arsye = CONCAT_WS(', ', CASE WHEN fuqia < $1 THEN 'fuqi e ulët' END, CASE WHEN spam > $2 THEN 'spam i lartë' END)
        WHERE kontrolluar_at IS NULL AND (fuqia < $1 OR spam > $2)`, [min, maxSpam]);
      const per = (await pool.query('SELECT domaini, url, titulli, pyetja, fuqia, spam FROM pxse_bl_domenet WHERE kontrolluar_at IS NULL ORDER BY fuqia DESC NULLS LAST')).rows;
      let j = 0, b = 0;
      await Promise.all(Array.from({ length: 6 }, async () => {
        while (j < per.length) {
          const x = per[j++];
          try { await kontrollo(x, min, maxSpam); } catch (e) { await pool.query('UPDATE pxse_bl_domenet SET kalon=false, arsye=$2, kontrolluar_at=now() WHERE domaini=$1', [x.domaini, 'gabim: ' + String(e.message).slice(0, 80)]); }
          gjendja.hapi = `Kontroll live ${++b}/${per.length} (robotët, noindex, login, dofollow)…`;
        }
      }));
      gjendja.hapi = 'Përfundoi' + (deshtuan.length ? ' · fraza pa rezultat: ' + deshtuan.join('; ') : '') + (shenim ? ' · ' + shenim : '');
    } catch (e) {
      gjendja.gabimi = e.message; gjendja.hapi = 'U ndal me gabim';
      console.error('pxse backlinket:', e.message);
    } finally {
      gjendja.duke = false;
      try { await vendos('kosto_totale', (parseFloat(await cilesimi('kosto_totale', '0')) || 0) + gjendja.kosto); } catch (e) {}
    }
  }

  // ---------- Admin API ----------
  app.get('/api/admin/pxse/backlinket', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const vetemKalojne = req.query.kalon === '1';
      const lista = (await pool.query(`SELECT domaini, url, titulli, pyetja, fuqia, spam, rob_google, rob_bing, rob_oai, noindex, login, dofollow, nofollow, lloji, kalon, arsye
          FROM pxse_bl_domenet ${vetemKalojne ? 'WHERE kalon' : ''} ORDER BY kalon DESC NULLS LAST, fuqia DESC NULLS LAST LIMIT 600`)).rows;
      const s = (await pool.query(`SELECT COUNT(*)::int gjetur, COUNT(*) FILTER (WHERE kalon)::int kalojne,
          COUNT(*) FILTER (WHERE kontrolluar_at IS NULL)::int pa_kontroll FROM pxse_bl_domenet`)).rows[0];
      let pyetjet = PXBL_PYETJET; try { const p = JSON.parse(await cilesimi('pyetjet', 'null')); if (Array.isArray(p) && p.length) pyetjet = p; } catch (e) {}
      res.json({ ok: true, gjendja, statistika: s, lista, pyetjet,
        kufijte: { min: nr(await cilesimi('min', ''), 20), max_spam: nr(await cilesimi('max_spam', ''), 30), thellesia: nr(await cilesimi('thellesia', ''), 30) },
        kosto_totale: parseFloat(await cilesimi('kosto_totale', '0')) || 0,
        kredencialet: !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/backlinket/kerko', iAdmin, async (req, res) => {
    const b = req.body || {};
    if (gjendja.duke) return res.status(409).json({ error: 'Një kërkim po punon tashmë.' });
    if (!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)) return res.status(400).json({ error: 'Shto DATAFORSEO_LOGIN dhe DATAFORSEO_PASSWORD te Railway Variables.' });
    const pyetjet = (Array.isArray(b.pyetjet) ? b.pyetjet : []).map(x => String(x).trim()).filter(Boolean).slice(0, 60);
    if (!pyetjet.length) return res.status(400).json({ error: 'Shkruaj të paktën një frazë kërkimi.' });
    const min = Math.min(100, Math.max(0, nr(b.min, 20))), maxSpam = Math.min(100, Math.max(0, nr(b.max_spam, 30))), thellesia = Math.min(100, Math.max(10, nr(b.thellesia, 30)));
    try {
      await vendos('pyetjet', JSON.stringify(pyetjet)); await vendos('min', min); await vendos('max_spam', maxSpam); await vendos('thellesia', thellesia);
      // kufijte e rinj vlejne edhe per domainet e kontrolluara me pare: rikontrollohen
      if (b.rikontrollo) await pool.query('UPDATE pxse_bl_domenet SET kontrolluar_at=NULL, kalon=NULL, arsye=NULL');
      kerko(pyetjet, thellesia, min, maxSpam);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/backlinket/fshi', iAdmin, async (req, res) => {
    if (gjendja.duke) return res.status(409).json({ error: 'Prit sa të mbarojë kërkimi.' });
    try { await pool.query('DELETE FROM pxse_bl_domenet'); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
module.exports.pxblRobotLejon = pxblRobotLejon;
module.exports.pxblAnalizoFaqen = pxblAnalizoFaqen;
