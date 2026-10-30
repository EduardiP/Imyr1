// pxse-portali.js (PhronexusAI) — "Outreach" me pagese per klientet e Upwork/Fiverr: faqe e ndare /outreach (anglisht),
// hyrje me KOD (pa llogari PhronexusAI), dashboard i ndare. Dergimin dhe orarin i ben VETEM admin-i.
// Server.js e therret PAS pxse-dergimi.js: require('./pxse-portali')(app, pool, iAdmin);
//
// Si funksionon:
//  - /outreach (publike, noindex): direktoria e bizneseve me filtra (kategoria, B2B/B2C, shteti, kerkim ne pershkrim).
//    Email-i dhe domaini fshihen NE SERVER (info@ph..ai.com, ph..ai.com); emri i kompanise nuk shfaqet.
//  - Admin-i krijon klientin dhe merr nje KOD (p.sh. PX-7K2M-9QXR-4TWD) ose lidhjen /outreach?k=KODI. Kodi ruhet vetem si hash.
//    Hera e pare: klienti plotëson emrin e kompanise dhe faqen (nese admin-i s'i ka vendosur). Pastaj hyn ne dashboard-in e vet.
//  - Dashboard-i i klientit: lidh email-in e biznesit (SMTP + app password, i enkriptuar me PXSE_CELESI_SMTP), shkruan ose
//    gjeneron email-in me AI, sheh parapamjen dhe analitiken e cdo email-i te derguar. NUK ka dergim dhe NUK ka orar.
//  - Admin-i (Sherbimet falas -> Klientet e Outreach): "aktiv deri me", kufiri ditor, marresit (AI propozon kategorite), orari.
//    Radha dergon nga email-i i klientit: te pakten 5 minuta midis email-eve, deri ne kufirin ditor, vetem kur klienti eshte aktiv.
//  - Tabelat jane te ndara (pxse_portal_*): provat falas, dashboard-i dhe Marketingu nuk preken.
//    Gjurmimi: /pxse/ph (hapjet), /pxse/pk (klikimet), /pxse/pc (Unsubscribe -> lista e perbashket "mos me kontakto").
// Variabla: PXSE_CELESI_SMTP (ekziston), OPENAI_API_KEY (ekziston). Asnje e re.
const crypto = require('crypto');
const dns = require('dns').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { pxsePastroDomain, pxseKontrolloEmailin, pxseStudimiEmailit, pxseNePlatforme, pxseHostPublik, pxseHashIP } = require('./pxse-prova');
const { pxseNdertoPerMarres } = require('./pxse-dergimi');
const pxpoDizajnet = require(path.join(__dirname, 'public', 'js', 'pxse-dizajnet.js'));

const PXPO_KUKI = 'px_portal';
const PXPO_SHKRONJAT = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PXPO_PORTET = [25, 465, 587, 2525];
const PXPO_HAPESIRA_MIN = 5;          // minuta te pakten midis dy email-eve te te njejtit klient
const PXPO_DITORE_MAKS = 50;          // kufiri ditor me i larte qe mund te vendose admin-i
const PXPO_AI_DITE = 5;               // gjenerime me AI ne dite per klient
const PXPO_FAQE = 50;                 // biznese ne nje faqe te direktorise publike
const PXPO_TE_PERGJITHSHME = /^(info|hello|hi|hey|contact|contactus|support|help|sales|team|admin|office|mail|enquiries|inquiries|billing|marketing|partners|partnerships|feedback|success|care|service|accounts|general|business|ask|demo|growth|ops|bd)$/i;

// ---------- Fshehja (ne server) ----------
function pxpoFshihDomain(d) {
  const p = String(d || '').toLowerCase().split('.').filter(Boolean);
  if (p.length < 2) return '••';
  let pr = 1; if (p.length > 2 && p[p.length - 2].length <= 3 && p[p.length - 1].length === 2) pr = 2; // co.uk, com.au
  const prapa = p.slice(-pr).join('.'), emri = p[p.length - pr - 1] || '';
  const f = emri.length <= 4 ? emri.slice(0, 1) + '..' : emri.slice(0, 2) + '..' + emri.slice(-2);
  return f + '.' + prapa;
}
function pxpoFshihEmail(e) {
  const [lok, dom] = String(e || '').toLowerCase().split('@');
  if (!lok || !dom) return '';
  const l = PXPO_TE_PERGJITHSHME.test(lok.replace(/[._-]/g, '')) ? lok : lok.slice(0, 2) + '..';
  return l + '@' + pxpoFshihDomain(dom);
}
// Emri dhe domaini i kompanise hiqen nga pershkrimi (qe te mos gjendet)
function pxpoPershkrimiIFshehur(x) {
  let t = String(x.pershkrimi || '');
  const fjale = [x.emri, String(x.domaini || '').split('.')[0]].filter(s => s && s.length >= 3);
  fjale.forEach(f => { t = t.replace(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'This company'); });
  return t.slice(0, 300);
}

// ---------- Enkriptimi i fjalekalimit SMTP (i njejti celes si dashboard-i) ----------
function pxpoCelesi() { const k = String(process.env.PXSE_CELESI_SMTP || ''); return k.length >= 20 ? crypto.createHash('sha256').update(k).digest() : null; }
function pxpoEnkripto(t) {
  const k = pxpoCelesi(), iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const d = Buffer.concat([c.update(String(t), 'utf8'), c.final()]);
  return 'v1:' + iv.toString('base64') + ':' + c.getAuthTag().toString('base64') + ':' + d.toString('base64');
}
function pxpoDekripto(s) {
  const k = pxpoCelesi(), p = String(s || '').split(':');
  if (!k || p.length !== 4 || p[0] !== 'v1') return null;
  try { const dc = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(p[1], 'base64')); dc.setAuthTag(Buffer.from(p[2], 'base64')); return Buffer.concat([dc.update(Buffer.from(p[3], 'base64')), dc.final()]).toString('utf8'); }
  catch (e) { return null; }
}
async function pxpoSmtpNgaMx(domaini) {
  let mx = []; try { mx = await dns.resolveMx(domaini); } catch (e) { return null; }
  if (!mx.length) return null;
  const h = mx.map(x => String(x.exchange || '').toLowerCase()).join(' ');
  if (/google\.com|googlemail\.com/.test(h)) return { ofruesi: 'Google Workspace', host: 'smtp.gmail.com', port: 587 };
  if (/outlook\.com|office365|microsoft/.test(h)) return { ofruesi: 'Microsoft 365', host: 'smtp.office365.com', port: 587 };
  if (/zoho\.eu/.test(h)) return { ofruesi: 'Zoho Mail', host: 'smtp.zoho.eu', port: 587 };
  if (/zoho/.test(h)) return { ofruesi: 'Zoho Mail', host: 'smtp.zoho.com', port: 587 };
  if (/secureserver\.net/.test(h)) return { ofruesi: 'GoDaddy', host: 'smtpout.secureserver.net', port: 465 };
  if (/ionos|1and1/.test(h)) return { ofruesi: 'IONOS', host: 'smtp.ionos.com', port: 587 };
  if (/protonmail|proton\.me/.test(h)) return { ofruesi: 'Proton', host: 'smtp.protonmail.ch', port: 587 };
  return { ofruesi: '', host: '', port: 587 };
}
const pxpoHttps = u => { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const pxpoHash = k => crypto.createHash('sha256').update('pxpo|' + String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');
function pxpoKodRi() {
  const b = crypto.randomBytes(16); let s = '';
  for (let i = 0; i < 16; i++) s += PXPO_SHKRONJAT[b[i] % PXPO_SHKRONJAT.length];
  return 'PX-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16);
}
function pxpoDita(t, zona) { return new Intl.DateTimeFormat('en-CA', { timeZone: zona || 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t)); }
function pxpoZona(z) { try { new Intl.DateTimeFormat('en-CA', { timeZone: String(z || '') }); return String(z); } catch (e) { return 'America/New_York'; } }
// Ora lokale (YYYY-MM-DD, ora, minuta) ne nje zone -> kohe UTC
function pxpoNeUtc(dita, ora, min, zona) {
  const [y, m, d] = dita.split('-').map(Number);
  let t = Date.UTC(y, m - 1, d, ora, min);
  for (let i = 0; i < 2; i++) {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(t));
    const g = k => Number((p.find(x => x.type === k) || {}).value);
    const lok = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
    t += Date.UTC(y, m - 1, d, ora, min) - lok;
  }
  return t;
}
// Email-i i klientit ne formatin e ndertuesit te dizajneve (i njejti kod si te sherbimi falas)
function pxpoEmailiPerNdertim(em, kl) {
  const d = (em && em.dizajn) || {};
  const dizajn = {
    id: pxpoDizajnet.some(x => x.id === String(d.id)) ? String(d.id) : '2',
    ngjyra: /^#[0-9a-f]{6}$/i.test(String(d.ngjyra || '')) ? String(d.ngjyra).toLowerCase() : '#3b6ef0',
    logo: pxpoHttps(d.logo).slice(0, 500), meButon: !!d.meButon,
    butoniTekst: String(d.butoniTekst || '').replace(/[<>\r\n]/g, '').trim().slice(0, 40) || 'Visit our website',
    butoniLink: pxpoHttps(d.butoniLink) || (kl.domaini ? 'https://' + kl.domaini : '')
  };
  return { marka: String((em && em.marka) || kl.emri || '').slice(0, 60) || kl.domaini, domaini: kl.domaini, subjekti: String((em && em.subjekti) || ''), trupi: String((em && em.trupi) || ''), dizajn };
}
function pxpoNdertoHtml(email, marresi, token) {
  const n = pxseNdertoPerMarres(email, marresi, token, { paSticker: true }); // sherbim me pagese: pa sticker-in e PhronexusAI
  const zv = s => s.split('/pxse/c/' + token).join('/pxse/pc/' + token).split('/pxse/k/' + token).join('/pxse/pk/' + token).split('/pxse/h/' + token).join('/pxse/ph/' + token);
  return { html: zv(n.html), tekst: zv(n.tekst) };
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_portal_klientet (
      id SERIAL PRIMARY KEY,
      kodi_hash TEXT UNIQUE NOT NULL,
      kodi_fundi TEXT,
      emri TEXT, domaini TEXT, shenim TEXT,
      aktiv BOOLEAN NOT NULL DEFAULT true,
      aktiv_deri DATE,
      ditore INT NOT NULL DEFAULT 15,
      zona TEXT NOT NULL DEFAULT 'America/New_York',
      studimi JSONB,                       -- pershkrimi dhe kategorite e propozuara nga AI (per marresit)
      hyrje_fundit TIMESTAMPTZ,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_portal_seancat (token TEXT PRIMARY KEY, klient_id INT NOT NULL REFERENCES pxse_portal_klientet(id) ON DELETE CASCADE, krijuar_at TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_portal_derguesit (
      klient_id INT PRIMARY KEY REFERENCES pxse_portal_klientet(id) ON DELETE CASCADE,
      email TEXT NOT NULL, emri TEXT, host TEXT NOT NULL, port INT NOT NULL, perdoruesi TEXT NOT NULL,
      fjalekalimi TEXT NOT NULL, gabimi TEXT, lidhur_at TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_portal_emailet (
      klient_id INT PRIMARY KEY REFERENCES pxse_portal_klientet(id) ON DELETE CASCADE,
      subjekti TEXT, trupi TEXT, marka TEXT, dizajn JSONB, nga TEXT, perditesuar_at TIMESTAMPTZ DEFAULT now())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_portal_dergimet (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      klient_id INT NOT NULL REFERENCES pxse_portal_klientet(id) ON DELETE CASCADE,
      marres_id INT NOT NULL, marres_email TEXT NOT NULL, marres_domaini TEXT, marres_kategoria TEXT,
      subjekti TEXT NOT NULL, html TEXT NOT NULL, tekst TEXT NOT NULL, butoni_link TEXT,
      ora TIMESTAMPTZ NOT NULL,
      statusi TEXT NOT NULL DEFAULT 'ne_radhe',   -- ne_radhe | duke | derguar | deshtoi
      gabimi TEXT, derguar_at TIMESTAMPTZ,
      hapur_at TIMESTAMPTZ, hapje INT NOT NULL DEFAULT 0, klikuar_at TIMESTAMPTZ, klikime INT NOT NULL DEFAULT 0, cregj_at TIMESTAMPTZ,
      krijuar_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (klient_id, marres_id))`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxpo_radha ON pxse_portal_dergimet (statusi, ora)');
    // Fushat e direktorise qe perdor kjo faqe (krijohen edhe nga pxse-importi.js; te dhenat nuk preken)
    for (const k of ['lloji TEXT', 'data_domainit DATE']) await pool.query('ALTER TABLE pxse_bizneset ADD COLUMN IF NOT EXISTS ' + k);
  })().catch(e => console.error('pxse-portali migrim:', e.message));

  // ---------- Faqja ----------
  app.get('/outreach', (req, res) => {
    res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
    res.sendFile(path.join(__dirname, 'public', 'outreach.html'));
  });

  // ---------- Direktoria publike (e fshehur) ----------
  function pxpoKushtiDirektorise(q) {
    const p = [], k = ["b.aktiv", "b.email_verifikuar", "b.email IS NOT NULL", "NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))"];
    const shto = (sql, v) => { p.push(v); k.push(sql.replace('?', '$' + p.length)); };
    if (q.kategoria) shto('b.kategoria = ?', String(q.kategoria).slice(0, 120));
    if (q.lloji === 'b2b') k.push("b.lloji IN ('b2b','both')"); else if (q.lloji === 'b2c') k.push("b.lloji IN ('b2c','both')");
    if (q.vendi) shto('b.vendi = ?', String(q.vendi).slice(0, 2).toUpperCase());
    if (q.kerko) shto('(b.pershkrimi ILIKE ? OR b.kategoria ILIKE $X)'.replace('$X', '$' + (p.length + 1)), '%' + String(q.kerko).slice(0, 60).replace(/[%_\\]/g, '') + '%');
    return { sql: k.join(' AND '), p };
  }
  app.get('/api/portal/direktoria', async (req, res) => {
    try {
      const faqe = Math.max(0, Math.min(200, parseInt(req.query.faqe, 10) || 0));
      const { sql, p } = pxpoKushtiDirektorise(req.query);
      const n = await pool.query('SELECT COUNT(*)::int n FROM pxse_bizneset b WHERE ' + sql, p);
      const r = await pool.query(`SELECT b.emri, b.domaini, b.email, b.kategoria, b.vendi, b.lloji, b.pershkrimi, EXTRACT(YEAR FROM b.data_domainit)::int viti FROM pxse_bizneset b
        WHERE ${sql} ORDER BY b.shtuar_at DESC, b.id DESC LIMIT ${PXPO_FAQE} OFFSET ${faqe * PXPO_FAQE}`, p);
      const baza = pxpoKushtiDirektorise({});
      const kat = await pool.query(`SELECT b.kategoria v, COUNT(*)::int n FROM pxse_bizneset b WHERE ${baza.sql} AND b.kategoria IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`, baza.p);
      const ven = await pool.query(`SELECT b.vendi v, COUNT(*)::int n FROM pxse_bizneset b WHERE ${baza.sql} AND b.vendi IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 60`, baza.p);
      res.set('Cache-Control', 'no-store');
      res.json({ ok: true, total: n.rows[0].n, faqe, neFaqe: PXPO_FAQE, kategorite: kat.rows, vendet: ven.rows,
        bizneset: r.rows.map(x => ({ domaini: pxpoFshihDomain(x.domaini), email: pxpoFshihEmail(x.email), kategoria: x.kategoria, vendi: x.vendi, lloji: x.lloji,
          pershkrimi: pxpoPershkrimiIFshehur(x), viti: x.viti || null })) });
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });

  // ---------- Hyrja me kod ----------
  const pxpoProvat = new Map(); // ip -> kohet e provave (15 minuta)
  app.post('/api/portal/hyr', async (req, res) => {
    try {
      const ip = pxseHashIP(req), tani = Date.now();
      const l = (pxpoProvat.get(ip) || []).filter(t => tani - t < 15 * 60000);
      if (l.length >= 10) return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes.' });
      l.push(tani); pxpoProvat.set(ip, l); if (pxpoProvat.size > 20000) pxpoProvat.clear();
      const kodi = String((req.body || {}).kodi || '').trim();
      if (kodi.length < 10) return res.status(400).json({ error: 'Enter your access code.' });
      const r = await pool.query('SELECT id, aktiv FROM pxse_portal_klientet WHERE kodi_hash=$1', [pxpoHash(kodi)]);
      if (!r.rows.length) return res.status(401).json({ error: 'This code is not valid.' });
      if (!r.rows[0].aktiv) return res.status(403).json({ error: 'Your access is paused. Please contact us.' });
      const token = crypto.randomBytes(24).toString('hex');
      await pool.query('INSERT INTO pxse_portal_seancat (token, klient_id) VALUES ($1,$2)', [token, r.rows[0].id]);
      await pool.query('UPDATE pxse_portal_klientet SET hyrje_fundit=now() WHERE id=$1', [r.rows[0].id]);
      res.cookie(PXPO_KUKI, token, { httpOnly: true, sameSite: 'lax', secure: req.secure || req.headers['x-forwarded-proto'] === 'https', maxAge: 30 * 86400000, path: '/' });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });
  app.post('/api/portal/dil', async (req, res) => {
    const t = req.cookies && req.cookies[PXPO_KUKI];
    if (t) await pool.query('DELETE FROM pxse_portal_seancat WHERE token=$1', [t]).catch(() => {});
    res.clearCookie(PXPO_KUKI, { path: '/' }); res.json({ ok: true });
  });
  async function pxpoKlienti(req, res, next) {
    try {
      const t = req.cookies && req.cookies[PXPO_KUKI];
      if (!t) return res.status(401).json({ hyr: true, error: 'Please sign in with your access code.' });
      const r = await pool.query("SELECT k.*, to_char(k.aktiv_deri,'YYYY-MM-DD') aktiv_deri_t FROM pxse_portal_seancat s JOIN pxse_portal_klientet k ON k.id = s.klient_id WHERE s.token=$1", [t]);
      if (!r.rows.length) return res.status(401).json({ hyr: true, error: 'Please sign in with your access code.' });
      if (!r.rows[0].aktiv) return res.status(403).json({ hyr: true, error: 'Your access is paused. Please contact us.' });
      req.pxpoKl = r.rows[0]; next();
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  }
  const pxpoAktivTani = kl => !!kl.aktiv && (!kl.aktiv_deri_t || pxpoDita(Date.now(), 'Europe/Berlin') <= kl.aktiv_deri_t);

  // ---------- Te dhenat e klientit ----------
  async function pxpoDerguesi(id) { return (await pool.query('SELECT * FROM pxse_portal_derguesit WHERE klient_id=$1', [id])).rows[0] || null; }
  const pxpoDerguesiPublik = g => g ? { email: g.email, emri: g.emri || '', host: g.host, port: g.port, gabimi: g.gabimi || null, lidhur_at: g.lidhur_at } : null;
  async function pxpoEmaili(id) { return (await pool.query('SELECT subjekti, trupi, marka, dizajn, nga, perditesuar_at FROM pxse_portal_emailet WHERE klient_id=$1', [id])).rows[0] || null; }
  async function pxpoTotalet(id) {
    return (await pool.query(`SELECT COUNT(*) FILTER (WHERE statusi IN ('ne_radhe','duke'))::int planifikuar, COUNT(*) FILTER (WHERE statusi='derguar')::int derguar,
        COUNT(*) FILTER (WHERE hapur_at IS NOT NULL)::int hapur, COUNT(*) FILTER (WHERE klikuar_at IS NOT NULL)::int klikuar, COALESCE(SUM(klikime),0)::int klikime,
        COUNT(*) FILTER (WHERE cregj_at IS NOT NULL)::int cregj, COUNT(*) FILTER (WHERE statusi='deshtoi')::int deshtoi FROM pxse_portal_dergimet WHERE klient_id=$1`, [id])).rows[0];
  }
  app.get('/api/portal/une', pxpoKlienti, async (req, res) => {
    try {
      const kl = req.pxpoKl;
      const d = await pool.query(`SELECT marres_domaini, marres_kategoria, subjekti, ora, statusi, derguar_at, hapur_at, hapje, klikuar_at, klikime, cregj_at
        FROM pxse_portal_dergimet WHERE klient_id=$1 AND statusi IN ('derguar','deshtoi') ORDER BY derguar_at DESC NULLS LAST, id DESC LIMIT 500`, [kl.id]);
      res.set('Cache-Control', 'no-store');
      res.json({ ok: true, klienti: { emri: kl.emri, domaini: kl.domaini, aktiv: pxpoAktivTani(kl), aktiv_deri: kl.aktiv_deri_t || null, ditore: kl.ditore, gati: !!(kl.emri && kl.domaini) },
        derguesi: pxpoDerguesiPublik(await pxpoDerguesi(kl.id)), celesi: !!pxpoCelesi(), emaili: await pxpoEmaili(kl.id), totalet: await pxpoTotalet(kl.id),
        dizajnet: pxpoDizajnet.map(x => x.id),
        dergimet: d.rows.map(x => ({ marresi: pxpoFshihDomain(x.marres_domaini), kategoria: x.marres_kategoria, subjekti: x.subjekti, derguar_at: x.derguar_at, statusi: x.statusi,
          hapur: !!x.hapur_at, hapje: x.hapje || 0, klikuar: !!x.klikuar_at, klikime: x.klikime || 0, cregj: !!x.cregj_at })) });
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });
  // Hera e pare: emri i kompanise dhe faqja (pasi lidhet email-i, faqja nuk ndryshohet me nga klienti)
  app.post('/api/portal/profili', pxpoKlienti, async (req, res) => {
    try {
      const kl = req.pxpoKl, b = req.body || {};
      const emri = String(b.emri || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 80);
      const pa = pxsePastroDomain(b.domaini), dom = pa ? pa.replace(/^www\./, '') : '';
      if (emri.length < 2) return res.status(400).json({ fusha: 'emri', error: 'Enter your company name.' });
      if (!dom) return res.status(400).json({ fusha: 'domaini', error: 'Enter your website, e.g. yourcompany.com' });
      if (pxseNePlatforme(dom)) return res.status(400).json({ fusha: 'domaini', error: 'Enter your own company website.' });
      if (kl.domaini && kl.domaini !== dom && await pxpoDerguesi(kl.id)) return res.status(409).json({ fusha: 'domaini', error: 'Disconnect your email first to change the website.' });
      await pool.query('UPDATE pxse_portal_klientet SET emri=$2, domaini=$3 WHERE id=$1', [kl.id, emri, dom]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });

  // ---------- Email-i dergues i klientit ----------
  app.get('/api/portal/derguesi/sugjerim', pxpoKlienti, async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase(), dom = email.split('@')[1] || '';
    if (!/^[^\s@<>]+@([a-z0-9-]+\.)+[a-z]{2,}$/.test(email)) return res.json({ ok: true });
    res.json(Object.assign({ ok: true }, (await pxpoSmtpNgaMx(dom)) || {}));
  });
  const pxpoTransporteret = {};
  async function pxpoLidhDerguesin(kl, b) {
    if (!pxpoCelesi()) return { kodi: 503, trupi: { error: 'Connecting a mailbox is not available yet. Please try again later.' } };
    const email = String(b.email || '').trim().toLowerCase();
    if (!/^[^\s@<>"]+@([a-z0-9-]+\.)+[a-z]{2,}$/.test(email) || email.length > 254) return { kodi: 400, trupi: { fusha: 'email', error: 'Enter a valid email address.' } };
    const dom = email.split('@')[1];
    if (pxseNePlatforme(dom)) return { kodi: 400, trupi: { fusha: 'email', error: 'Please use your business email, not Gmail, Outlook or a similar personal address.' } };
    if (!kl.domaini) return { kodi: 400, trupi: { error: 'Add your company website first.' } };
    if (!(dom === kl.domaini || dom.endsWith('.' + kl.domaini) || kl.domaini.endsWith('.' + dom))) return { kodi: 400, trupi: { fusha: 'email', error: 'Use an email on your website domain (@' + kl.domaini + ').' } };
    const mx = await pxpoSmtpNgaMx(dom);
    if (!mx) return { kodi: 400, trupi: { fusha: 'email', error: 'This email domain cannot receive email. Check the address.' } };
    const host = String(b.host || mx.host || '').trim().toLowerCase(), port = parseInt(b.port, 10) || mx.port || 587;
    if (!host) return { kodi: 400, trupi: { fusha: 'host', error: 'Enter your SMTP server (for example smtp.yourprovider.com).' } };
    if (!PXPO_PORTET.includes(port)) return { kodi: 400, trupi: { fusha: 'port', error: 'Use port 587 or 465.' } };
    if (!(await pxseHostPublik(host))) return { kodi: 400, trupi: { fusha: 'host', error: 'This SMTP server cannot be reached.' } };
    const perdoruesi = String(b.perdoruesi || email).trim().slice(0, 254), fjalekalimi = String(b.fjalekalimi || '');
    if (!fjalekalimi) return { kodi: 400, trupi: { fusha: 'fjalekalimi', error: 'Enter the password (or app password) of this email.' } };
    const emri = String(b.emri || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 60);
    const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: perdoruesi, pass: fjalekalimi }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 });
    try { if (typeof t.verify === 'function') await t.verify(); }
    catch (e) { return { kodi: 400, trupi: { fusha: 'fjalekalimi', error: 'Could not sign in to your mailbox. Check the password: with 2-step verification you need an app password.' } }; }
    await pool.query(`INSERT INTO pxse_portal_derguesit (klient_id, email, emri, host, port, perdoruesi, fjalekalimi, gabimi, lidhur_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,now())
      ON CONFLICT (klient_id) DO UPDATE SET email=EXCLUDED.email, emri=EXCLUDED.emri, host=EXCLUDED.host, port=EXCLUDED.port, perdoruesi=EXCLUDED.perdoruesi,
        fjalekalimi=EXCLUDED.fjalekalimi, gabimi=NULL, lidhur_at=now()`, [kl.id, email, emri || null, host, port, perdoruesi, pxpoEnkripto(fjalekalimi)]);
    delete pxpoTransporteret[kl.id];
    return { kodi: 200, trupi: { ok: true, derguesi: pxpoDerguesiPublik(await pxpoDerguesi(kl.id)) } };
  }
  app.post('/api/portal/derguesi', pxpoKlienti, async (req, res) => {
    try { const r = await pxpoLidhDerguesin(req.pxpoKl, req.body || {}); res.status(r.kodi).json(r.trupi); }
    catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });
  app.delete('/api/portal/derguesi', pxpoKlienti, async (req, res) => {
    await pool.query('DELETE FROM pxse_portal_derguesit WHERE klient_id=$1', [req.pxpoKl.id]).catch(() => {});
    delete pxpoTransporteret[req.pxpoKl.id]; res.json({ ok: true });
  });

  // ---------- Email-i (klienti e shkruan ose e gjeneron; admin-i mund ta ndryshoje) ----------
  function pxpoPastroEmailin(b) {
    const d = b.dizajn || {};
    return {
      subjekti: String(b.subjekti || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 120),
      trupi: String(b.trupi || '').replace(/\r/g, '').trim().slice(0, 2000),
      marka: String(b.marka || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 60),
      dizajn: { id: pxpoDizajnet.some(x => x.id === String(d.id)) ? String(d.id) : '2', ngjyra: /^#[0-9a-f]{6}$/i.test(String(d.ngjyra || '')) ? String(d.ngjyra).toLowerCase() : '#3b6ef0',
        logo: pxpoHttps(d.logo).slice(0, 500), meButon: !!d.meButon, butoniTekst: String(d.butoniTekst || '').replace(/[<>\r\n]/g, '').trim().slice(0, 40), butoniLink: pxpoHttps(d.butoniLink).slice(0, 500) }
    };
  }
  async function pxpoRuajEmailin(id, e, nga) {
    await pool.query(`INSERT INTO pxse_portal_emailet (klient_id, subjekti, trupi, marka, dizajn, nga, perditesuar_at) VALUES ($1,$2,$3,$4,$5,$6,now())
      ON CONFLICT (klient_id) DO UPDATE SET subjekti=EXCLUDED.subjekti, trupi=EXCLUDED.trupi, marka=EXCLUDED.marka, dizajn=EXCLUDED.dizajn, nga=EXCLUDED.nga, perditesuar_at=now()`,
      [id, e.subjekti, e.trupi, e.marka, JSON.stringify(e.dizajn), nga]);
  }
  app.post('/api/portal/email', pxpoKlienti, async (req, res) => {
    try {
      const e = pxpoPastroEmailin(req.body || {});
      if (!e.subjekti || !e.trupi) return res.status(400).json({ error: 'Write a subject and a message.' });
      await pxpoRuajEmailin(req.pxpoKl.id, e, 'klienti');
      res.json({ ok: true, paralajmerime: pxseKontrolloEmailin(e.subjekti, e.trupi) });
    } catch (x) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });
  const pxpoAISot = new Map();
  setInterval(() => pxpoAISot.clear(), 24 * 3600000).unref();
  async function pxpoStudio(kl) {
    const st = await pxseStudimiEmailit(pool, kl.domaini);
    if (st.ok) await pool.query('UPDATE pxse_portal_klientet SET studimi=$2 WHERE id=$1', [kl.id, JSON.stringify({ pershkrimi: st.pergjigja.pershkrimi, kategorite: st.pergjigja.kategorite, lloji: st.pergjigja.lloji, at: new Date().toISOString() })]);
    return st;
  }
  app.post('/api/portal/email/ai', pxpoKlienti, async (req, res) => {
    try {
      const kl = req.pxpoKl;
      if (!kl.domaini) return res.status(400).json({ error: 'Add your company website first.' });
      if (!String(process.env.OPENAI_API_KEY || '').trim()) return res.status(503).json({ error: 'Please try again in a few minutes.' });
      const n = (pxpoAISot.get(kl.id) || 0) + 1;
      if (n > PXPO_AI_DITE) return res.status(429).json({ error: 'Daily limit reached. Please try again tomorrow.' });
      pxpoAISot.set(kl.id, n);
      const st = await pxpoStudio(kl);
      if (!st.ok) return res.status(st.kodi).json(st.trupi);
      const p = st.pergjigja;
      res.json({ ok: true, subjekti: p.subjekti, trupi: p.trupi, marka: p.emri || kl.emri || '', butoniTekst: p.butoniTekst, ngjyra: p.ngjyra, paralajmerime: p.paralajmerime || [] });
    } catch (e) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });
  // Parapamja: i njejti ndertues si email-i qe dergohet
  app.post('/api/portal/parapamje', pxpoKlienti, async (req, res) => {
    try {
      const e = pxpoPastroEmailin(req.body || {});
      const em = pxpoEmailiPerNdertim(e, req.pxpoKl);
      res.json({ ok: true, html: pxpoNdertoHtml(em, { emri: 'Acme' }, 'parapamje').html });
    } catch (x) { res.status(500).json({ error: 'Please try again in a few minutes.' }); }
  });

  // ---------- Gjurmimi ----------
  const PXPO_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const pxpoTokenOk = t => /^[a-f0-9]{36}$/.test(String(t || ''));
  app.get('/pxse/ph/:token.gif', (req, res) => {
    if (pxpoTokenOk(req.params.token)) pool.query('UPDATE pxse_portal_dergimet SET hapje=hapje+1, hapur_at=COALESCE(hapur_at, now()) WHERE token=$1', [req.params.token]).catch(() => {});
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, max-age=0' }).send(PXPO_GIF);
  });
  app.get('/pxse/pk/:token', async (req, res) => {
    try {
      if (!pxpoTokenOk(req.params.token)) return res.redirect(302, 'https://phronexusai.com/');
      const r = await pool.query('UPDATE pxse_portal_dergimet SET klikime=klikime+1, klikuar_at=COALESCE(klikuar_at, now()) WHERE token=$1 RETURNING butoni_link', [req.params.token]);
      res.redirect(302, (r.rows.length && pxpoHttps(r.rows[0].butoni_link)) || 'https://phronexusai.com/');
    } catch (e) { res.redirect(302, 'https://phronexusai.com/'); }
  });
  async function pxpoCregjistro(token) {
    if (!pxpoTokenOk(token)) return false;
    const r = await pool.query('UPDATE pxse_portal_dergimet SET cregj_at=COALESCE(cregj_at, now()) WHERE token=$1 RETURNING marres_email', [token]);
    if (!r.rows.length) return false;
    await pool.query("INSERT INTO pxse_mos_kontakto (email, arsyeja) VALUES (lower($1), 'unsubscribe (outreach)') ON CONFLICT (email) DO NOTHING", [r.rows[0].marres_email]);
    return true;
  }
  app.get('/pxse/pc/:token', async (req, res) => {
    let ok = false; try { ok = await pxpoCregjistro(req.params.token); } catch (e) {}
    res.type('html').send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>' +
      '<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;margin:0;padding:48px 16px;color:#1c2128;"><div style="max-width:460px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">' +
      '<h1 style="font-size:20px;margin:0 0 10px;">' + (ok ? 'You have been unsubscribed' : 'This link is no longer valid') + '</h1>' +
      '<p style="margin:0;line-height:1.6;color:#5b6472;">' + (ok ? 'You will not receive these emails again.' : 'If you keep receiving emails, reply "no" to the email.') + '</p></div></body></html>');
  });
  app.post('/pxse/pc/:token', async (req, res) => { try { await pxpoCregjistro(req.params.token); } catch (e) {} res.status(200).send('OK'); });

  // ---------- Radha: dergon nga email-i i klientit ----------
  function pxpoTransporti(g) {
    const c = pxpoTransporteret[g.klient_id];
    if (c && c.kur === String(g.lidhur_at)) return c.t;
    const pass = pxpoDekripto(g.fjalekalimi); if (!pass) return null;
    const t = nodemailer.createTransport({ host: g.host, port: g.port, secure: g.port === 465, auth: { user: g.perdoruesi, pass }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
    pxpoTransporteret[g.klient_id] = { t, kur: String(g.lidhur_at) };
    return t;
  }
  let pxpoDukePunuar = false;
  async function pxpoDergoRadhen() {
    if (pxpoDukePunuar || !pxpoCelesi()) return;
    pxpoDukePunuar = true;
    try {
      await pool.query("UPDATE pxse_portal_dergimet SET statusi='ne_radhe' WHERE statusi='duke' AND derguar_at IS NULL AND ora < now() - interval '15 minutes'");
      // Nje email per klient ne cdo kontroll: vetem klientet aktive, me email te lidhur pa gabim, 5 minuta nga i fundit, nen kufirin ditor
      const kandidatet = (await pool.query(`SELECT DISTINCT ON (d.klient_id) d.id, d.klient_id FROM pxse_portal_dergimet d
          JOIN pxse_portal_klientet k ON k.id = d.klient_id AND k.aktiv AND (k.aktiv_deri IS NULL OR k.aktiv_deri >= (now() AT TIME ZONE 'Europe/Berlin')::date)
          JOIN pxse_portal_derguesit g ON g.klient_id = d.klient_id AND g.gabimi IS NULL
          WHERE d.statusi='ne_radhe' AND d.ora <= now()
            AND NOT EXISTS (SELECT 1 FROM pxse_portal_dergimet x WHERE x.klient_id = d.klient_id AND x.derguar_at > now() - interval '${PXPO_HAPESIRA_MIN} minutes')
            AND (SELECT COUNT(*) FROM pxse_portal_dergimet x WHERE x.klient_id = d.klient_id AND x.statusi='derguar'
                 AND (x.derguar_at AT TIME ZONE 'Europe/Berlin')::date = (now() AT TIME ZONE 'Europe/Berlin')::date) < k.ditore
          ORDER BY d.klient_id, d.ora`)).rows;
      for (const k of kandidatet) {
        const r = await pool.query("UPDATE pxse_portal_dergimet SET statusi='duke' WHERE id=$1 AND statusi='ne_radhe' RETURNING *", [k.id]);
        const d = r.rows[0]; if (!d) continue;
        const g = await pxpoDerguesi(d.klient_id);
        const nm = await pool.query('SELECT 1 FROM pxse_mos_kontakto WHERE email=lower($1)', [d.marres_email]);
        if (nm.rows.length) { await pool.query("UPDATE pxse_portal_dergimet SET statusi='deshtoi', gabimi='do-not-contact' WHERE id=$1", [d.id]); continue; }
        const t = g && pxpoTransporti(g);
        if (!t) { await pool.query("UPDATE pxse_portal_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]); continue; }
        const kl = (await pool.query('SELECT emri FROM pxse_portal_klientet WHERE id=$1', [d.klient_id])).rows[0] || {};
        const cregj = String(process.env.PXSE_URL_BAZE || 'https://phronexusai.com').replace(/\/+$/, '') + '/pxse/pc/' + d.token;
        try {
          await t.sendMail({ from: { name: String(g.emri || kl.emri || '').slice(0, 60), address: g.email }, replyTo: g.email, to: d.marres_email, subject: d.subjekti, html: d.html, text: d.tekst,
            headers: { 'List-Unsubscribe': '<' + cregj + '>, <mailto:' + g.email + '?subject=unsubscribe>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
          await pool.query("UPDATE pxse_portal_dergimet SET statusi='derguar', derguar_at=now(), gabimi=NULL WHERE id=$1", [d.id]);
        } catch (e) {
          const msg = String((e && e.message) || e).slice(0, 300);
          if ((e && e.code === 'EAUTH') || /\b535\b|auth/i.test(msg)) {
            await pool.query("UPDATE pxse_portal_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]);
            await pool.query('UPDATE pxse_portal_derguesit SET gabimi=$2 WHERE klient_id=$1', [d.klient_id, 'Sign-in to your mailbox failed. Reconnect it to keep sending.']);
          } else await pool.query("UPDATE pxse_portal_dergimet SET statusi='deshtoi', gabimi=$2 WHERE id=$1", [d.id, msg]);
        }
      }
    } catch (e) { console.error('pxse portali radha:', e.message); }
    pxpoDukePunuar = false;
  }
  setTimeout(pxpoDergoRadhen, 30000).unref();
  setInterval(pxpoDergoRadhen, 60000).unref();

  // =====================================================================
  //  ADMIN
  // =====================================================================
  const pxpoGabimAdmin = (res, e) => res.status(500).json({ error: e.message });
  app.get('/api/admin/pxse/portali', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT k.id, k.kodi_fundi, k.emri, k.domaini, k.shenim, k.aktiv, to_char(k.aktiv_deri,'YYYY-MM-DD') aktiv_deri, k.ditore, k.zona, k.hyrje_fundit, k.krijuar_at,
          g.email derguesi, g.gabimi derguesi_gabimi, (e.klient_id IS NOT NULL) ka_email,
          (SELECT COUNT(*) FROM pxse_portal_dergimet d WHERE d.klient_id=k.id AND d.statusi IN ('ne_radhe','duke'))::int planifikuar,
          (SELECT COUNT(*) FROM pxse_portal_dergimet d WHERE d.klient_id=k.id AND d.statusi='derguar')::int derguar,
          (SELECT COUNT(*) FROM pxse_portal_dergimet d WHERE d.klient_id=k.id AND d.hapur_at IS NOT NULL)::int hapur,
          (SELECT COUNT(*) FROM pxse_portal_dergimet d WHERE d.klient_id=k.id AND d.klikuar_at IS NOT NULL)::int klikuar
        FROM pxse_portal_klientet k LEFT JOIN pxse_portal_derguesit g ON g.klient_id=k.id LEFT JOIN pxse_portal_emailet e ON e.klient_id=k.id ORDER BY k.id DESC`);
      res.json({ ok: true, klientet: r.rows });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  function pxpoTeDhenatAdmin(b, k) {
    const v = {};
    if (b.emri !== undefined) v.emri = String(b.emri || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 80) || null;
    if (b.domaini !== undefined) { const pa = pxsePastroDomain(b.domaini); v.domaini = pa ? pa.replace(/^www\./, '') : null; }
    if (b.shenim !== undefined) v.shenim = String(b.shenim || '').slice(0, 500) || null;
    if (b.aktiv_deri !== undefined) v.aktiv_deri = /^\d{4}-\d{2}-\d{2}$/.test(String(b.aktiv_deri || '')) ? b.aktiv_deri : null;
    if (b.ditore !== undefined) v.ditore = Math.max(1, Math.min(PXPO_DITORE_MAKS, parseInt(b.ditore, 10) || 15));
    if (b.zona !== undefined) v.zona = pxpoZona(b.zona);
    if (b.aktiv !== undefined) v.aktiv = !!b.aktiv;
    return v;
  }
  app.post('/api/admin/pxse/portali', iAdmin, async (req, res) => {
    try {
      const v = pxpoTeDhenatAdmin(req.body || {}), kodi = pxpoKodRi();
      const r = await pool.query(`INSERT INTO pxse_portal_klientet (kodi_hash, kodi_fundi, emri, domaini, shenim, aktiv_deri, ditore, zona) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [pxpoHash(kodi), kodi.slice(-4), v.emri || null, v.domaini || null, v.shenim || null, v.aktiv_deri || null, v.ditore || 15, v.zona || 'America/New_York']);
      res.json({ ok: true, id: r.rows[0].id, kodi, lidhja: String(process.env.PXSE_URL_BAZE || 'https://phronexusai.com').replace(/\/+$/, '') + '/outreach?k=' + encodeURIComponent(kodi) });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.post('/api/admin/pxse/portali/:id', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, v = pxpoTeDhenatAdmin(req.body || {}), k = Object.keys(v);
      if (!k.length) return res.status(400).json({ error: 'Asgjë për të ndryshuar.' });
      await pool.query('UPDATE pxse_portal_klientet SET ' + k.map((x, i) => x + '=$' + (i + 2)).join(', ') + ' WHERE id=$1', [id].concat(k.map(x => v[x])));
      res.json({ ok: true });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.post('/api/admin/pxse/portali/:id/kodi', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, kodi = pxpoKodRi();
      const r = await pool.query('UPDATE pxse_portal_klientet SET kodi_hash=$2, kodi_fundi=$3 WHERE id=$1 RETURNING id', [id, pxpoHash(kodi), kodi.slice(-4)]);
      if (!r.rows.length) return res.status(404).json({ error: 'Klienti nuk u gjet.' });
      await pool.query('DELETE FROM pxse_portal_seancat WHERE klient_id=$1', [id]); // kodi i vjeter nuk hyn me
      res.json({ ok: true, kodi, lidhja: String(process.env.PXSE_URL_BAZE || 'https://phronexusai.com').replace(/\/+$/, '') + '/outreach?k=' + encodeURIComponent(kodi) });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.delete('/api/admin/pxse/portali/:id', iAdmin, async (req, res) => {
    try { await pool.query('DELETE FROM pxse_portal_klientet WHERE id=$1', [parseInt(req.params.id, 10) || 0]); res.json({ ok: true }); }
    catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.get('/api/admin/pxse/portali/:id', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0;
      const k = (await pool.query("SELECT *, to_char(aktiv_deri,'YYYY-MM-DD') aktiv_deri_t FROM pxse_portal_klientet WHERE id=$1", [id])).rows[0];
      if (!k) return res.status(404).json({ error: 'Klienti nuk u gjet.' });
      const d = await pool.query(`SELECT id, marres_email, marres_domaini, marres_kategoria, subjekti, ora, statusi, gabimi, derguar_at, hapur_at, hapje, klikuar_at, klikime, cregj_at
        FROM pxse_portal_dergimet WHERE klient_id=$1 ORDER BY ora DESC LIMIT 1000`, [id]);
      const kat = await pool.query(`SELECT b.kategoria v, COUNT(*)::int n FROM pxse_bizneset b WHERE b.aktiv AND b.email_verifikuar AND b.email IS NOT NULL AND b.kategoria IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`);
      const em = await pxpoEmaili(id);
      res.json({ ok: true, klienti: { id: k.id, emri: k.emri, domaini: k.domaini, shenim: k.shenim, aktiv: k.aktiv, aktiv_deri: k.aktiv_deri_t, ditore: k.ditore, zona: k.zona, kodi_fundi: k.kodi_fundi,
          aktivTani: pxpoAktivTani(k), studimi: k.studimi, hyrje_fundit: k.hyrje_fundit },
        derguesi: pxpoDerguesiPublik(await pxpoDerguesi(id)), emaili: em, totalet: await pxpoTotalet(id), dergimet: d.rows, kategorite: kat.rows,
        parapamje: em && em.subjekti ? pxpoNdertoHtml(pxpoEmailiPerNdertim(em, k), { emri: 'Acme' }, 'parapamje').html : '' });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.post('/api/admin/pxse/portali/:id/email', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, e = pxpoPastroEmailin(req.body || {});
      if (!e.subjekti || !e.trupi) return res.status(400).json({ error: 'Shkruaj subjektin dhe mesazhin.' });
      await pxpoRuajEmailin(id, e, 'admin');
      res.json({ ok: true, paralajmerime: pxseKontrolloEmailin(e.subjekti, e.trupi) });
    } catch (x) { pxpoGabimAdmin(res, x); }
  });
  // Studimi me AI i biznesit te klientit: kategorite e propozuara te marresve
  app.post('/api/admin/pxse/portali/:id/studio', iAdmin, async (req, res) => {
    try {
      const k = (await pool.query('SELECT * FROM pxse_portal_klientet WHERE id=$1', [parseInt(req.params.id, 10) || 0])).rows[0];
      if (!k || !k.domaini) return res.status(400).json({ error: 'Klienti nuk ka domain.' });
      const st = await pxpoStudio(k);
      if (!st.ok) return res.status(st.kodi).json(st.trupi);
      res.json({ ok: true, pershkrimi: st.pergjigja.pershkrimi, kategorite: st.pergjigja.kategorite, lloji: st.pergjigja.lloji });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  // Marresit e mundshem: direktoria, pa ata qe ky klient i ka kontaktuar, pa "mos me kontakto", pa domainin e vet
  app.get('/api/admin/pxse/portali/:id/bizneset', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, q = req.query, faqe = Math.max(0, parseInt(q.faqe, 10) || 0);
      const k = (await pool.query('SELECT domaini FROM pxse_portal_klientet WHERE id=$1', [id])).rows[0] || {};
      const p = [id, k.domaini || '-'], w = ['b.aktiv', 'b.email_verifikuar', 'b.email IS NOT NULL', 'b.domaini <> $2',
        'NOT EXISTS (SELECT 1 FROM pxse_portal_dergimet d WHERE d.klient_id = $1 AND d.marres_id = b.id)', 'NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))'];
      const kat = String(q.kategorite || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 30);
      if (kat.length) { p.push(kat); w.push('b.kategoria = ANY($' + p.length + '::text[])'); }
      if (q.lloji === 'b2b') w.push("b.lloji IN ('b2b','both')"); else if (q.lloji === 'b2c') w.push("b.lloji IN ('b2c','both')");
      if (q.vendi) { p.push(String(q.vendi).slice(0, 2).toUpperCase()); w.push('b.vendi = $' + p.length); }
      const n = await pool.query('SELECT COUNT(*)::int n FROM pxse_bizneset b WHERE ' + w.join(' AND '), p);
      const r = await pool.query(`SELECT b.id, b.emri, b.domaini, b.email, b.kategoria, b.vendi, b.lloji, b.pershkrimi FROM pxse_bizneset b WHERE ${w.join(' AND ')}
        ORDER BY b.shtuar_at DESC, b.id DESC LIMIT 200 OFFSET ${faqe * 200}`, p);
      res.json({ ok: true, total: n.rows[0].n, faqe, bizneset: r.rows });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  // Orari: {marresit:[id], nga:'YYYY-MM-DD', neDite:n, oraNga:9, oraDeri:17, zona, paFundjave:true}
  app.post('/api/admin/pxse/portali/:id/planifiko', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, b = req.body || {};
      const k = (await pool.query('SELECT * FROM pxse_portal_klientet WHERE id=$1', [id])).rows[0];
      if (!k) return res.status(404).json({ error: 'Klienti nuk u gjet.' });
      if (!k.domaini) return res.status(400).json({ error: 'Klienti nuk ka domain.' });
      if (!(await pxpoDerguesi(id))) return res.status(409).json({ error: 'Klienti ende nuk ka lidhur email-in.' });
      const em = await pxpoEmaili(id);
      if (!em || !em.subjekti || !em.trupi) return res.status(409).json({ error: 'Email-i i klientit mungon.' });
      const marresit = Array.from(new Set((Array.isArray(b.marresit) ? b.marresit : []).map(x => parseInt(x, 10)).filter(x => x > 0))).slice(0, 3000);
      if (!marresit.length) return res.status(400).json({ error: 'Zgjidh të paktën një marrës.' });
      const zona = pxpoZona(b.zona || k.zona), neDite = Math.max(1, Math.min(k.ditore, parseInt(b.neDite, 10) || k.ditore));
      const oraNga = Math.max(0, Math.min(23, parseInt(b.oraNga, 10) || 9)), oraDeri = Math.max(oraNga + 1, Math.min(24, parseInt(b.oraDeri, 10) || 17));
      if ((oraDeri - oraNga) * 60 / neDite < PXPO_HAPESIRA_MIN) return res.status(400).json({ error: 'Dritarja e orëve është shumë e ngushtë për këtë numër në ditë.' });
      let dita = /^\d{4}-\d{2}-\d{2}$/.test(String(b.nga || '')) ? b.nga : pxpoDita(Date.now(), zona);
      const biz = (await pool.query(`SELECT b.id, b.emri, b.domaini, b.email, b.kategoria FROM pxse_bizneset b WHERE b.id = ANY($1::int[]) AND b.aktiv AND b.email_verifikuar AND b.email IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))
          AND NOT EXISTS (SELECT 1 FROM pxse_portal_dergimet d WHERE d.klient_id=$2 AND d.marres_id=b.id)`, [marresit, id])).rows;
      const sipas = new Map(biz.map(x => [x.id, x]));
      const lista = marresit.map(x => sipas.get(x)).filter(Boolean);
      // Oret: neDite email-e ne dite, te shperndara ne menyre te barabarte ne dritare, (pa te shtunen/te dielen sipas zgjedhjes)
      const oret = []; let i = 0, ruajtje = 0;
      while (oret.length < lista.length && ruajtje++ < 800) {
        const dt = new Date(dita + 'T12:00:00Z'), dj = dt.getUTCDay();
        if (!(b.paFundjave !== false && (dj === 0 || dj === 6))) {
          const hapi = (oraDeri - oraNga) * 60 / neDite;
          for (let n = 0; n < neDite && oret.length < lista.length; n++) {
            const m = Math.round(oraNga * 60 + hapi * n + hapi / 2), t = pxpoNeUtc(dita, Math.floor(m / 60), m % 60, zona);
            if (t > Date.now() + 60000) oret.push(t);
          }
        }
        dt.setUTCDate(dt.getUTCDate() + 1); dita = dt.toISOString().slice(0, 10); i++;
      }
      const email = pxpoEmailiPerNdertim(em, k);
      let n = 0;
      for (let j = 0; j < lista.length && j < oret.length; j++) {
        const x = lista[j], token = crypto.randomBytes(18).toString('hex');
        const nd = pxpoNdertoHtml(email, { emri: x.emri || String(x.domaini).split('.')[0] }, token);
        const r = await pool.query(`INSERT INTO pxse_portal_dergimet (token, klient_id, marres_id, marres_email, marres_domaini, marres_kategoria, subjekti, html, tekst, butoni_link, ora)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (klient_id, marres_id) DO NOTHING RETURNING id`,
          [token, id, x.id, x.email, x.domaini, x.kategoria, email.subjekti.replace(/\{company\}/g, x.emri || String(x.domaini).split('.')[0]), nd.html, nd.tekst,
           email.dizajn.meButon ? email.dizajn.butoniLink : null, new Date(oret[j])]);
        if (r.rows.length) n++;
      }
      res.json({ ok: true, planifikuar: n, anashkaluar: marresit.length - n, ePara: oret[0] ? new Date(oret[0]).toISOString() : null, eFundit: oret[Math.min(n, oret.length) - 1] ? new Date(oret[Math.min(n, oret.length) - 1]).toISOString() : null });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
  app.post('/api/admin/pxse/portali/:id/anulo', iAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10) || 0, d = parseInt((req.body || {}).dergimi, 10) || 0;
      const r = d ? await pool.query("DELETE FROM pxse_portal_dergimet WHERE klient_id=$1 AND id=$2 AND statusi='ne_radhe' RETURNING id", [id, d])
        : await pool.query("DELETE FROM pxse_portal_dergimet WHERE klient_id=$1 AND statusi='ne_radhe' RETURNING id", [id]);
      res.json({ ok: true, anuluar: r.rows.length });
    } catch (e) { pxpoGabimAdmin(res, e); }
  });
};
module.exports.pxpoFshihDomain = pxpoFshihDomain;
module.exports.pxpoFshihEmail = pxpoFshihEmail;
