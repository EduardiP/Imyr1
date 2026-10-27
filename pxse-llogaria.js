// pxse-llogaria.js (PhronexusAI) — "Find Customers" PAS LOGIN (dashboard): Interest Signals + Email Outreach.
// Server.js e therret PAS pxse-sinjalet.js: require('./pxse-llogaria')(app, pool, iLoguar);
//
// Si funksionon:
//  1. Prova falas e faqes publike i kalon llogarise (nese te dhenat nuk jane fshire ende):
//     sipas shfletuesit (pxse-lidhja.js -> /api/pxse/lidh) ose sipas domainit te faqes se llogarise (bizneset.website).
//     Pasi lidhen, nuk fshihen me.
//  2. Sinjalet: shfaqen sinjalet e llogarise (statuset, pergjigjet me AI pa kufi). Fusha e domainit nuk ekziston:
//     nese llogaria s'ka asnje kerkim, lejohet 1 kerkim per domainin e llogarise (i njejti kerkim si prova, pxse-sinjalet.js).
//  3. Email-et: dergohen nga email-i i biznesit te klientit (SMTP + fjalekalim aplikacioni), pa kufi numri, me orar.
//     Pranohet vetem email biznesi ne domainin e faqes se llogarise. Fjalekalimi ruhet i enkriptuar (AES-256-GCM).
//     Gjurmimi eshte i njejti si te prova (pikseli /pxse/h, klikimet /pxse/k, Unsubscribe /pxse/c te pxse-dergimi.js).
//     Pa sticker-in e PhronexusAI vetem kur llogaria ka snippet aktiv (Ad Space -> My spaces).
//
// Variabla ne Railway:
//   PXSE_CELESI_SMTP   tekst i gjate i rastesishem (40+ karaktere) per enkriptimin e fjalekalimeve SMTP. Pa te, lidhja e email-it nuk lejohet.
//
// Tabela e re: pxse_derguesit (email-i dergues i secilës llogari). Te pxse_dergimet perdoret kolona derguesi_id.
const crypto = require('crypto');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');
const { pxsePastroDomain, pxseKontrolloEmailin, pxseStudimiEmailit, pxseNePlatforme, pxseHostPublik, pxseHashIP } = require('./pxse-prova');
const { pxseNdertoPerMarres } = require('./pxse-dergimi');
const pxseDizajnetLL = require(require('path').join(__dirname, 'public', 'js', 'pxse-dizajnet.js'));

const PXLL_MAKS_MARRES = 500;        // marres ne nje "Schedule"
const PXLL_DITE_MAKS = 90;           // orari deri 90 dite perpara
const PXLL_STUDIME_DITE = 10;        // studime me AI ne dite per llogari (kosto)
const PXLL_PERGJIGJE_DITE = 100;     // pergjigje me AI ne dite per llogari (kufi sigurie, jo kufi i planit)
const PXLL_PER_MINUTE = 10;          // email-e ne minute nga nje email dergues (mbron reputacionin e domainit te klientit)
const PXLL_PORTET = [25, 465, 587, 2525];
const PXLL_DITORE = 15;              // email-e ne dite nga nje llogari (sipas zones kohore te klientit)
const PXLL_HAPESIRA_MIN = 5;         // minuta te pakten midis dy email-eve
// Data (YYYY-MM-DD) e nje kohe ne zonen e klientit
function pxllDita(t, zona) { return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t)); }
function pxllZona(z) { try { new Intl.DateTimeFormat('en-CA', { timeZone: String(z || '') }); return String(z); } catch (e) { return 'Europe/Berlin'; } }

const pxllHttps = u => { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const pxllEmriNgaDomain = d => { const e = String(d || '').split('.')[0] || ''; return e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Your company'; };
// Nje seance e qendrueshme per cdo llogari (32 hex), qe kerkimi dhe email-et te perdorin te njejtat tabela si prova
const pxllSeanca = id => crypto.createHash('sha256').update('pxse-llogari|' + id).digest('hex').slice(0, 32);

// ---------- Enkriptimi i fjalekalimit SMTP ----------
function pxllCelesi() { const k = String(process.env.PXSE_CELESI_SMTP || ''); return k.length >= 20 ? crypto.createHash('sha256').update(k).digest() : null; }
function pxllEnkripto(t) {
  const k = pxllCelesi(), iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const d = Buffer.concat([c.update(String(t), 'utf8'), c.final()]);
  return 'v1:' + iv.toString('base64') + ':' + c.getAuthTag().toString('base64') + ':' + d.toString('base64');
}
function pxllDekripto(s) {
  const k = pxllCelesi(), p = String(s || '').split(':');
  if (!k || p.length !== 4 || p[0] !== 'v1') return null;
  try {
    const dc = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(p[1], 'base64'));
    dc.setAuthTag(Buffer.from(p[2], 'base64'));
    return Buffer.concat([dc.update(Buffer.from(p[3], 'base64')), dc.final()]).toString('utf8');
  } catch (e) { return null; }
}

// Serveri SMTP sipas MX te domainit (ofruesit me te zakonshem); klienti mund ta ndryshoje te "Advanced".
async function pxllSmtpNgaMx(domaini) {
  let mx = [];
  try { mx = await dns.resolveMx(domaini); } catch (e) { return null; }
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

module.exports = function (app, pool, iLoguar) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_derguesit (
      biznes_id INT PRIMARY KEY,
      email TEXT NOT NULL,
      emri TEXT,
      host TEXT NOT NULL,
      port INT NOT NULL,
      perdoruesi TEXT NOT NULL,
      fjalekalimi TEXT NOT NULL,          -- i enkriptuar (PXSE_CELESI_SMTP)
      gabimi TEXT,                         -- p.sh. fjalekalimi u ndryshua: dergimi ndalon derisa te rilidhet
      lidhur_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query('ALTER TABLE pxse_dergimet ADD COLUMN IF NOT EXISTS derguesi_id INT');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_derg_biz ON pxse_dergimet (biznes_id)');
    // Domaini i llogarise kur profili i biznesit nuk ka website (profili nuk preket)
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_llogaria_domaini (
      biznes_id INT PRIMARY KEY,
      domaini TEXT NOT NULL,
      vendosur_at TIMESTAMPTZ DEFAULT now()
    )`);
  })().catch(e => console.error('pxse-llogaria migrim:', e.message));

  const pxllNgjarje = (lloji, nga, biznesId, n) => pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, seanca, biznes_id' + (n != null ? ', n' : '') + ') VALUES ($1,$2,$3,$4' + (n != null ? ',$5' : '') + ')',
    [lloji, nga, pxllSeanca(biznesId), biznesId].concat(n != null ? [n] : [])).catch(() => {});

  // ---------- Llogaria: domaini i faqes dhe snippet-i ----------
  async function pxllLlogaria(id) {
    const r = await pool.query('SELECT id, emri, website FROM bizneset WHERE id=$1', [id]);
    const b = r.rows[0] || {};
    const pa = pxsePastroDomain(b.website);
    let domaini = pa ? pa.replace(/^www\./, '') : '', ngaProfili = !!domaini;
    if (!domaini) { try { const x = await pool.query('SELECT domaini FROM pxse_llogaria_domaini WHERE biznes_id=$1', [id]); if (x.rows.length) domaini = x.rows[0].domaini; } catch (e) {} }
    let snippetAktiv = false;
    try { const s = await pool.query('SELECT 1 FROM snippetet WHERE biznes_id=$1 AND snippet_active=true LIMIT 1', [id]); snippetAktiv = s.rows.length > 0; } catch (e) {}
    return { id, emri: b.emri || '', domaini, ngaProfili, snippetAktiv };
  }
  // Domaini i dhene nga klienti (vetem kur profili nuk ka website dhe llogaria s'ka ende studim, sinjale ose email dergues)
  async function pxllVendosDomainin(ll, dhene) {
    if (ll.ngaProfili || !dhene) return ll;
    const pa = pxsePastroDomain(dhene), d = pa ? pa.replace(/^www\./, '') : '';
    if (!d) throw Object.assign(new Error('Enter a valid domain, e.g. yourcompany.com'), { kodi: 400 });
    if (d === ll.domaini) return ll;
    const ka = await pool.query(`SELECT (SELECT COUNT(*) FROM pxse_prova_rezultate WHERE biznes_id=$1) + (SELECT COUNT(*) FROM pxse_derguesit WHERE biznes_id=$1) n`, [ll.id]);
    if (Number(ka.rows[0].n) > 0 && ll.domaini) throw Object.assign(new Error('Your account already uses ' + ll.domaini + '.'), { kodi: 409 });
    await pool.query('INSERT INTO pxse_llogaria_domaini (biznes_id, domaini) VALUES ($1,$2) ON CONFLICT (biznes_id) DO UPDATE SET domaini=EXCLUDED.domaini, vendosur_at=now()', [ll.id, d]);
    ll.domaini = d; return ll;
  }
  // Provat falas te ketij domaini qe nuk i takojne askujt (dhe nuk jane fshire ende) i kalojne llogarise
  async function pxllLidhProvat(ll) {
    if (!ll.domaini) return;
    try {
      const r = await pool.query('UPDATE pxse_prova_rezultate SET biznes_id=$1 WHERE biznes_id IS NULL AND domaini=$2 RETURNING seanca', [ll.id, ll.domaini]);
      const seancat = Array.from(new Set(r.rows.map(x => x.seanca)));
      for (const s of seancat) await pool.query("INSERT INTO pxse_seanca_llogaria (seanca, biznes_id, domaini, nga) VALUES ($1,$2,$3,'domain') ON CONFLICT (seanca) DO NOTHING", [s, ll.id, ll.domaini]);
      await pool.query('UPDATE pxse_dergimet SET biznes_id=$1 WHERE biznes_id IS NULL AND domaini_derguesit=$2', [ll.id, ll.domaini]);
    } catch (e) { console.error('pxse lidhja e provave:', e.message); }
  }
  async function pxllRreshtiSinjaleve(id) {
    const r = await pool.query("SELECT id, domaini, te_dhenat, krijuar_at FROM pxse_prova_rezultate WHERE biznes_id=$1 AND sherbimi='sinjale' ORDER BY id DESC LIMIT 1", [id]);
    return r.rows[0] || null;
  }
  // Seanca e llogarise shenohet si "e lidhur", qe analitika e admin-it ta tregoje si te loguar (jo si prove pa hyrje)
  const pxllShenoSeancen = (ll, nga) => pool.query('INSERT INTO pxse_seanca_llogaria (seanca, biznes_id, domaini, nga) VALUES ($1,$2,$3,$4) ON CONFLICT (seanca) DO NOTHING',
    [pxllSeanca(ll.id), ll.id, ll.domaini || null, nga]).catch(() => {});
  const pxllGabim = (res, e) => { const k = e && e.kodi; if (k) return res.status(k).json({ error: e.message }); console.error('pxse llogaria:', e && e.message); res.status(500).json({ error: 'Try again in a few minutes.' }); };

  // =====================================================================
  //  INTEREST SIGNALS
  // =====================================================================
  const pxllPamjaSinjaleve = (rr, ll) => {
    const t = rr.te_dhenat || {};
    return { ok: true, gjendja: 'gati', domaini: rr.domaini, llogariaDomaini: ll.domaini, krijuar_at: rr.krijuar_at, lloji: t.lloji, pershkrimi: t.pershkrimi,
      rezultatet: t.rezultatet || [], numri: t.numri, burimet: t.burimet || {}, statuset: t.statuset || {}, pergjigjet: t.pergjigjet || {},
      kategorite: t.alertet_kategorite || [], pergjigjeMbetur: null };
  };
  app.get('/api/pxse/llogaria/sinjale', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId); await pxllLidhProvat(ll);
      const S = app.locals.pxseSinjalet, seanca = pxllSeanca(ll.id);
      const puna = S && ll.domaini ? S.puna(seanca, ll.domaini) : null;
      if (puna && !['gati', 'gabim'].includes(puna.gjendja)) return res.json(Object.assign({}, puna, { rezultatet: undefined, llogariaDomaini: ll.domaini }));
      const rr = await pxllRreshtiSinjaleve(ll.id);
      if (rr) return res.json(pxllPamjaSinjaleve(rr, ll));
      res.json({ ok: true, gjendja: puna && puna.gjendja === 'gabim' ? 'gabim' : 'asnje', error: puna && puna.error, domaini: ll.domaini, llogariaDomaini: ll.domaini, ngaProfili: ll.ngaProfili });
    } catch (e) { pxllGabim(res, e); }
  });
  // 1 kerkim per llogari (kur nuk ka asnje), per domainin e faqes se llogarise
  app.post('/api/pxse/llogaria/sinjale/kerko', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId);
      if (await pxllRreshtiSinjaleve(ll.id)) return res.status(409).json({ lidhur: true, error: 'Your signals are already connected to your account.' });
      await pxllVendosDomainin(ll, (req.body || {}).domaini); await pxllLidhProvat(ll);
      if (await pxllRreshtiSinjaleve(ll.id)) return res.status(409).json({ lidhur: true, error: 'Your signals are already connected to your account.' });
      if (!ll.domaini) return res.status(400).json({ paDomain: true, error: 'Enter your website domain first.' });
      const S = app.locals.pxseSinjalet;
      if (!S) return res.status(503).json({ error: 'Try again in a few minutes.' });
      const puna = S.nis(ll.id, pxllSeanca(ll.id), ll.domaini, pxseHashIP(req));
      pxllShenoSeancen(ll, 'sinjale');
      res.json(Object.assign(puna, { llogariaDomaini: ll.domaini }));
    } catch (e) { pxllGabim(res, e); }
  });
  app.post('/api/pxse/llogaria/sinjale/konfirmo', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId), S = app.locals.pxseSinjalet;
      if (!S || !ll.domaini) return res.status(400).json({ error: 'Please start the search again.' });
      res.json(S.konfirmo(pxllSeanca(ll.id), ll.domaini, (req.body || {}).lloji));
    } catch (e) { pxllGabim(res, e); }
  });
  app.post('/api/pxse/llogaria/sinjale/statusi', iLoguar, async (req, res) => {
    try {
      const b = req.body || {}, S = app.locals.pxseSinjalet, statusi = String(b.statusi || '');
      if (!S || !S.statuset.includes(statusi)) return res.status(400).json({ error: 'Invalid status.' });
      const rr = await pxllRreshtiSinjaleve(req.biznesId);
      const url = String(b.url || '');
      if (!rr || !((rr.te_dhenat || {}).rezultatet || []).some(x => x.url === url)) return res.status(404).json({ error: 'Signal not found.' });
      await pool.query(`UPDATE pxse_prova_rezultate SET te_dhenat = jsonb_set(COALESCE(te_dhenat,'{}'::jsonb), '{statuset}',
          COALESCE(te_dhenat->'statuset','{}'::jsonb) || jsonb_build_object($2::text, $3::text)), aktiv_at = now() WHERE id=$1`, [rr.id, url, statusi]);
      pxllNgjarje('statusi_' + statusi, 'sinjale', req.biznesId);
      res.json({ ok: true, url, statusi });
    } catch (e) { pxllGabim(res, e); }
  });
  const pxllPergjigjetSot = new Map(); // biznes_id -> numri sot
  setInterval(() => pxllPergjigjetSot.clear(), 24 * 3600 * 1000).unref();
  app.post('/api/pxse/llogaria/sinjale/pergjigje', iLoguar, async (req, res) => {
    try {
      const b = req.body || {}, S = app.locals.pxseSinjalet;
      if (!S || !String(process.env.OPENAI_API_KEY || '').trim()) return res.status(503).json({ error: 'Try again in a few minutes.' });
      const rr = await pxllRreshtiSinjaleve(req.biznesId), t = (rr && rr.te_dhenat) || {};
      const url = String(b.url || ''), postimi = (t.rezultatet || []).find(x => x.url === url);
      if (!rr || !postimi) return res.status(404).json({ error: 'Signal not found.' });
      const n = (pxllPergjigjetSot.get(req.biznesId) || 0) + 1;
      if (n > PXLL_PERGJIGJE_DITE) return res.status(429).json({ error: 'Daily limit reached. Please try again tomorrow.' });
      pxllPergjigjetSot.set(req.biznesId, n);
      const pergjigja = await S.pergjigje(t.pershkrimi, rr.domaini, postimi);
      if (pergjigja.length < 20) return res.status(502).json({ error: 'AI could not write a reply. Try again.' });
      await pool.query(`UPDATE pxse_prova_rezultate SET te_dhenat = jsonb_set(jsonb_set(COALESCE(te_dhenat,'{}'::jsonb), '{pergjigje_numri}', to_jsonb(COALESCE((te_dhenat->>'pergjigje_numri')::int,0) + 1)),
          '{pergjigjet}', COALESCE(te_dhenat->'pergjigjet','{}'::jsonb) || jsonb_build_object($2::text, $3::text)), aktiv_at = now() WHERE id=$1`, [rr.id, url, pergjigja]);
      pxllNgjarje('pergjigje_ai', 'sinjale', req.biznesId);
      res.json({ ok: true, url, pergjigja });
    } catch (e) { pxllGabim(res, e); }
  });
  app.post('/api/pxse/llogaria/sinjale/pergjigje-ndrysho', iLoguar, async (req, res) => {
    try {
      const b = req.body || {}, rr = await pxllRreshtiSinjaleve(req.biznesId), url = String(b.url || '');
      if (!rr || !((rr.te_dhenat || {}).pergjigjet && Object.prototype.hasOwnProperty.call(rr.te_dhenat.pergjigjet, url))) return res.status(404).json({ error: 'Reply not found.' });
      const tekst = String(b.tekst == null ? '' : b.tekst).replace(/\r/g, '').slice(0, 3000);
      await pool.query(`UPDATE pxse_prova_rezultate SET te_dhenat = jsonb_set(te_dhenat, '{pergjigjet}', COALESCE(te_dhenat->'pergjigjet','{}'::jsonb) || jsonb_build_object($2::text, $3::text)), aktiv_at = now() WHERE id=$1`, [rr.id, url, tekst]);
      res.json({ ok: true });
    } catch (e) { pxllGabim(res, e); }
  });

  // =====================================================================
  //  EMAIL OUTREACH
  // =====================================================================
  async function pxllDerguesi(id) {
    const r = await pool.query('SELECT biznes_id, email, emri, host, port, perdoruesi, fjalekalimi, gabimi, lidhur_at FROM pxse_derguesit WHERE biznes_id=$1', [id]);
    return r.rows[0] || null;
  }
  const pxllDerguesiPublik = g => g ? { email: g.email, emri: g.emri || '', host: g.host, port: g.port, gabimi: g.gabimi || null, lidhur_at: g.lidhur_at } : null;

  // Totalet e email-eve te llogarise (te gjitha: prova + dashboard)
  async function pxllTotalet(id) {
    const r = await pool.query(`SELECT
        COUNT(*) FILTER (WHERE statusi IN ('ne_radhe','duke'))::int aktive,
        COUNT(*) FILTER (WHERE statusi='derguar')::int derguar,
        COALESCE(SUM(hapje) FILTER (WHERE statusi='derguar'),0)::int pare,
        COUNT(*) FILTER (WHERE hapur_at IS NOT NULL)::int hapur,
        COUNT(*) FILTER (WHERE klikuar_at IS NOT NULL)::int klikuar,
        COALESCE(SUM(klikime),0)::int klikime,
        COUNT(*) FILTER (WHERE cregj_at IS NOT NULL)::int cregj,
        COUNT(*) FILTER (WHERE statusi='deshtoi')::int deshtoi
      FROM pxse_dergimet WHERE biznes_id=$1`, [id]);
    return r.rows[0];
  }

  app.get('/api/pxse/llogaria/email', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId); await pxllLidhProvat(ll);
      const g = await pxllDerguesi(ll.id);
      const st = await pool.query("SELECT te_dhenat FROM pxse_prova_rezultate WHERE biznes_id=$1 AND sherbimi='email' ORDER BY id DESC LIMIT 1", [ll.id]);
      const d = await pool.query(`SELECT d.id, d.ora, d.statusi, d.derguar_at, d.hapur_at, d.hapje, d.klikuar_at, d.klikime, d.cregj_at, d.subjekti, d.vonuar, d.derguesi_id, d.gabimi,
          b.emri, b.domaini FROM pxse_dergimet d JOIN pxse_bizneset b ON b.id = d.marres_id WHERE d.biznes_id=$1 ORDER BY d.ora DESC LIMIT 500`, [ll.id]);
      // Email-i i fundit i derguar (per ta rihapur te "Your email")
      const fundit = await pool.query('SELECT subjekti_burim, trupi_burim, marka, dizajn FROM pxse_dergimet WHERE biznes_id=$1 AND trupi_burim IS NOT NULL ORDER BY id DESC LIMIT 1', [ll.id]);
      res.json({ ok: true, domaini: ll.domaini, ngaProfili: ll.ngaProfili, domainPlatforme: !!(ll.domaini && pxseNePlatforme(ll.domaini)), emri: ll.emri, snippetAktiv: ll.snippetAktiv, derguesi: pxllDerguesiPublik(g), celesi: !!pxllCelesi(),
        studimi: st.rows.length ? st.rows[0].te_dhenat : null,
        fundit: fundit.rows.length ? { subjekti: fundit.rows[0].subjekti_burim, trupi: fundit.rows[0].trupi_burim, marka: fundit.rows[0].marka, dizajn: fundit.rows[0].dizajn } : null,
        totalet: await pxllTotalet(ll.id), ditore: PXLL_DITORE, hapesiraMin: PXLL_HAPESIRA_MIN,
        oretZena: (await pool.query(`SELECT COALESCE(derguar_at, ora) t FROM pxse_dergimet WHERE derguesi_id=$1
            AND (statusi IN ('ne_radhe','duke') OR derguar_at > now() - interval '2 days')`, [ll.id])).rows.map(x => x.t),
        dergimet: d.rows.map(x => ({ id: x.id, marresi: x.emri || pxllEmriNgaDomain(x.domaini), domaini: x.domaini, subjekti: x.subjekti, ora: x.ora,
          statusi: x.statusi === 'duke' ? 'ne_radhe' : x.statusi, derguar_at: x.derguar_at, vonuar: !!x.vonuar, ngaProva: !x.derguesi_id,
          hapur: !!x.hapur_at, hapje: x.hapje || 0, klikuar: !!x.klikuar_at, klikime: x.klikime || 0, cregj: !!x.cregj_at })) });
    } catch (e) { pxllGabim(res, e); }
  });

  // Studimi me AI per domainin e llogarise (nuk ka "nje prove": kufi vetem per koston)
  const pxllStudimeSot = new Map();
  setInterval(() => pxllStudimeSot.clear(), 24 * 3600 * 1000).unref();
  app.post('/api/pxse/llogaria/email/studio', iLoguar, async (req, res) => {
    try {
      if (!String(process.env.OPENAI_API_KEY || '').trim()) return res.status(503).json({ error: 'Try again in a few minutes.' });
      const ll = await pxllLlogaria(req.biznesId);
      await pxllVendosDomainin(ll, (req.body || {}).domaini); await pxllLidhProvat(ll);
      if (!ll.domaini) return res.status(400).json({ paDomain: true, error: 'Enter your website domain first.' });
      // Prova falas e ketij domaini (ende pa u fshire) u lidh sapo: jepet ajo, pa thirrje te re AI
      const ekz = await pool.query("SELECT te_dhenat FROM pxse_prova_rezultate WHERE biznes_id=$1 AND sherbimi='email' AND domaini=$2 ORDER BY id DESC LIMIT 1", [ll.id, ll.domaini]);
      if (ekz.rows.length && !(req.body || {}).perseri) return res.json(Object.assign({}, ekz.rows[0].te_dhenat, { ngaProva: true }));
      const n = (pxllStudimeSot.get(ll.id) || 0) + 1;
      if (n > PXLL_STUDIME_DITE) return res.status(429).json({ error: 'Daily limit reached. Please try again tomorrow.' });
      pxllStudimeSot.set(ll.id, n);
      const st = await pxseStudimiEmailit(pool, ll.domaini);
      if (!st.ok) return res.status(st.kodi).json(st.trupi);
      await pool.query("INSERT INTO pxse_prova_domaine (domaini, sherbimi, seanca) VALUES ($1,'email',$2) ON CONFLICT (domaini, sherbimi) DO NOTHING", [ll.domaini, pxllSeanca(ll.id)]);
      await pool.query("INSERT INTO pxse_prova_rezultate (seanca, ip_hash, domaini, sherbimi, te_dhenat, biznes_id) VALUES ($1,$2,$3,'email',$4,$5)",
        [pxllSeanca(ll.id), pxseHashIP(req), ll.domaini, JSON.stringify(st.pergjigja), ll.id]);
      pxllNgjarje('studim_email', 'email', ll.id);
      pxllShenoSeancen(ll, 'email');
      res.json(st.pergjigja);
    } catch (e) { pxllGabim(res, e); }
  });

  // Direktoria per llogarine: 100 ne faqe, pa ata qe kjo llogari i ka kontaktuar
  app.get('/api/pxse/llogaria/bizneset', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId);
      const kat = String(req.query.kategoria || '').slice(0, 120), faqe = Math.max(0, parseInt(req.query.faqe, 10) || 0);
      const kushti = `b.aktiv AND b.email_verifikuar AND b.email IS NOT NULL AND ($1 = '' OR b.kategoria = $1) AND b.domaini <> $2
          AND NOT EXISTS (SELECT 1 FROM pxse_dergimet d WHERE d.marres_id = b.id AND (d.domaini_derguesit = $2 OR d.biznes_id = $3))
          AND NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))`;
      const n = await pool.query('SELECT COUNT(*)::int n FROM pxse_bizneset b WHERE ' + kushti, [kat, ll.domaini || '-', ll.id]);
      const r = await pool.query(`SELECT b.id, b.emri, b.domaini, b.kategoria, b.vendi, GREATEST(0, EXTRACT(DAY FROM now() - b.shtuar_at))::int AS dite
        FROM pxse_bizneset b WHERE ${kushti} ORDER BY b.shtuar_at DESC, b.id DESC LIMIT 100 OFFSET $4`, [kat, ll.domaini || '-', ll.id, faqe * 100]);
      res.json({ ok: true, total: n.rows[0].n, faqe, bizneset: r.rows.map(x => ({ id: String(x.id), emri: x.emri || pxllEmriNgaDomain(x.domaini), domaini: x.domaini, kat: x.kategoria, vendi: x.vendi, dite: x.dite })) });
    } catch (e) { pxllGabim(res, e); }
  });

  // ---------- Email-i dergues ----------
  app.get('/api/pxse/llogaria/derguesi/sugjerim', iLoguar, async (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase(), dom = email.split('@')[1] || '';
    if (!/^[^\s@<>]+@([a-z0-9-]+\.)+[a-z]{2,}$/.test(email)) return res.json({ ok: true });
    res.json(Object.assign({ ok: true }, (await pxllSmtpNgaMx(dom)) || {}));
  });
  app.post('/api/pxse/llogaria/derguesi', iLoguar, async (req, res) => {
    try {
      const b = req.body || {}, ll = await pxllLlogaria(req.biznesId);
      if (!pxllCelesi()) { console.error('pxse: PXSE_CELESI_SMTP mungon te Railway: lidhja e email-it nuk lejohet.'); return res.status(503).json({ error: 'Connecting a mailbox is not available yet. Please try again later.' }); }
      const email = String(b.email || '').trim().toLowerCase();
      if (!/^[^\s@<>"]+@([a-z0-9-]+\.)+[a-z]{2,}$/.test(email) || email.length > 254) return res.status(400).json({ fusha: 'email', error: 'Enter a valid email address.' });
      const dom = email.split('@')[1];
      if (pxseNePlatforme(dom)) return res.status(400).json({ fusha: 'email', error: 'Please use your business email, not Gmail, Outlook or a similar personal address.' });
      if (!ll.domaini) return res.status(400).json({ paDomain: true, error: 'Add your website in your business profile first.' });
      const iNjejte = dom === ll.domaini || dom.endsWith('.' + ll.domaini) || ll.domaini.endsWith('.' + dom);
      if (!iNjejte) return res.status(400).json({ fusha: 'email', error: 'Use an email on your website domain (@' + ll.domaini + ').' });
      const mx = await pxllSmtpNgaMx(dom);
      if (!mx) return res.status(400).json({ fusha: 'email', error: 'This email domain cannot receive email. Check the address.' });
      const host = String(b.host || mx.host || '').trim().toLowerCase(), port = parseInt(b.port, 10) || mx.port || 587;
      if (!host) return res.status(400).json({ fusha: 'host', error: 'Enter your SMTP server (for example smtp.yourprovider.com).' });
      if (!PXLL_PORTET.includes(port)) return res.status(400).json({ fusha: 'port', error: 'Use port 587 or 465.' });
      if (!(await pxseHostPublik(host))) return res.status(400).json({ fusha: 'host', error: 'This SMTP server cannot be reached.' });
      const perdoruesi = String(b.perdoruesi || email).trim().slice(0, 254), fjalekalimi = String(b.fjalekalimi || '');
      if (!fjalekalimi) return res.status(400).json({ fusha: 'fjalekalimi', error: 'Enter the password (or app password) of this email.' });
      const emri = String(b.emri || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 60);
      // Hyrja e vertete ne SMTP (keshtu dihet qe email-i eshte i klientit)
      const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: perdoruesi, pass: fjalekalimi }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 });
      try { if (typeof t.verify === 'function') await t.verify(); }
      catch (e) { return res.status(400).json({ fusha: 'fjalekalimi', error: 'Could not sign in to your mailbox. Check the password: with 2-step verification you need an app password.' }); }
      await pool.query(`INSERT INTO pxse_derguesit (biznes_id, email, emri, host, port, perdoruesi, fjalekalimi, gabimi, lidhur_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,now())
        ON CONFLICT (biznes_id) DO UPDATE SET email=EXCLUDED.email, emri=EXCLUDED.emri, host=EXCLUDED.host, port=EXCLUDED.port, perdoruesi=EXCLUDED.perdoruesi,
          fjalekalimi=EXCLUDED.fjalekalimi, gabimi=NULL, lidhur_at=now()`, [ll.id, email, emri || null, host, port, perdoruesi, pxllEnkripto(fjalekalimi)]);
      delete pxllTransporteret[ll.id];
      pxllNgjarje('dergues_lidhur', 'email', ll.id);
      res.json({ ok: true, derguesi: pxllDerguesiPublik(await pxllDerguesi(ll.id)) });
    } catch (e) { pxllGabim(res, e); }
  });
  app.delete('/api/pxse/llogaria/derguesi', iLoguar, async (req, res) => {
    try { await pool.query('DELETE FROM pxse_derguesit WHERE biznes_id=$1', [req.biznesId]); delete pxllTransporteret[req.biznesId]; res.json({ ok: true }); }
    catch (e) { pxllGabim(res, e); }
  });

  // ---------- "Schedule" (pa kufi numri) ----------
  app.post('/api/pxse/llogaria/email/dergo', iLoguar, async (req, res) => {
    try {
      const b = req.body || {}, ll = await pxllLlogaria(req.biznesId);
      if (!ll.domaini) return res.status(400).json({ paDomain: true, error: 'Add your website in your business profile first.' });
      const g = await pxllDerguesi(ll.id);
      if (!g) return res.status(409).json({ paDergues: true, error: 'Connect your business email first.' });
      const marresit = Array.from(new Set((Array.isArray(b.marresit) ? b.marresit : []).map(x => parseInt(x, 10)).filter(x => x > 0)));
      if (!marresit.length) return res.status(400).json({ error: 'Choose at least one business.' });
      if (marresit.length > PXLL_MAKS_MARRES) return res.status(400).json({ error: 'Choose up to ' + PXLL_MAKS_MARRES + ' businesses at a time.' });
      // Nje ore per cdo biznes (te njejtat qe klienti pa ne "Schedule")
      const oret = (Array.isArray(b.oret) ? b.oret : []).map(x => Date.parse(x)), tani = Date.now(), zona = pxllZona(b.zona);
      if (oret.length !== marresit.length) return res.status(400).json({ error: 'Every selected business needs a sending time.' });
      if (oret.some(t => isNaN(t) || t < tani - 120000 || t > tani + PXLL_DITE_MAKS * 86400000)) return res.status(400).json({ error: 'Choose times in the next ' + PXLL_DITE_MAKS + ' days, not in the past.' });
      // Rregullat kunder spam-it (te njejtat si ne prove): mbrojne reputacionin e domainit te klientit
      const subjekti = String(b.subjekti || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
      const trupi = String(b.trupi || '').replace(/\r/g, '').trim().slice(0, 2000);
      const probleme = pxseKontrolloEmailin(subjekti, trupi);
      if (probleme.length) return res.status(422).json({ probleme, error: 'Please fix the email first: ' + probleme.join('; ') + '.' });
      const paSticker = !!b.paSticker;
      if (paSticker && !ll.snippetAktiv) return res.status(403).json({ snippet: true, error: 'To remove the PhronexusAI footer, add your ad space snippet to your website first.' });
      const d = b.dizajn || {};
      const dizajn = {
        id: pxseDizajnetLL.some(x => x.id === String(d.id)) ? String(d.id) : '2',
        ngjyra: /^#[0-9a-f]{6}$/i.test(String(d.ngjyra || '')) ? String(d.ngjyra).toLowerCase() : '#3b6ef0',
        logo: pxllHttps(d.logo).slice(0, 500), meButon: !!d.meButon,
        butoniTekst: String(d.butoniTekst || '').replace(/[<>\r\n]/g, '').trim().slice(0, 40) || 'Visit our website', butoniLink: ''
      };
      if (dizajn.meButon) {
        const link = pxllHttps(d.butoniLink) || 'https://' + ll.domaini;
        let host = ''; try { host = new URL(link).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) {}
        if (!(host === ll.domaini || host.endsWith('.' + ll.domaini))) return res.status(400).json({ error: 'The button must link to your own website (' + ll.domaini + ').' });
        dizajn.butoniLink = link.slice(0, 500);
      }
      const marka = String(b.marka || g.emri || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 60) || ll.emri || pxllEmriNgaDomain(ll.domaini);
      const email = { marka, domaini: ll.domaini, subjekti, trupi, dizajn };
      const biz = await pool.query(`SELECT b.id, b.emri, b.domaini, b.email FROM pxse_bizneset b WHERE b.id = ANY($1::int[]) AND b.aktiv AND b.email_verifikuar AND b.email IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))`, [marresit]);
      const seanca = pxllSeanca(ll.id);
      if (biz.rows.length !== marresit.length) return res.status(400).json({ error: 'One of the selected businesses can no longer be emailed. Refresh the list and try again.' });
      let planifikuar = 0;
      const kl = await pool.connect();
      try {
        await kl.query('BEGIN');
        await kl.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['pxll:' + ll.id]); // dy "Send" njekohesisht nuk i kalojne kufijte
        // Kufijte: te pakten 5 minuta midis email-eve dhe deri 15 ne dite (bashke me ato qe jane tashme ne radhe ose u derguan)
        const ek = await kl.query(`SELECT COALESCE(derguar_at, ora) t FROM pxse_dergimet WHERE derguesi_id=$1
            AND (statusi IN ('ne_radhe','duke') OR derguar_at > now() - interval '2 days')`, [ll.id]);
        const teGjitha = oret.map(t => ({ t, iri: true })).concat(ek.rows.map(x => ({ t: new Date(x.t).getTime() }))).sort((a, c) => a.t - c.t);
        for (let k = 1; k < teGjitha.length; k++) {
          if ((teGjitha[k].iri || teGjitha[k - 1].iri) && teGjitha[k].t - teGjitha[k - 1].t < PXLL_HAPESIRA_MIN * 60000) {
            await kl.query('ROLLBACK');
            return res.status(400).json({ afer: true, error: 'Two emails are less than ' + PXLL_HAPESIRA_MIN + ' minutes apart. Space them out: emails sent close together are more likely to land in spam.' });
          }
        }
        const neDite = {};
        teGjitha.forEach(x => { const d = pxllDita(x.t, zona); neDite[d] = (neDite[d] || 0) + 1; });
        const plot = Object.keys(neDite).filter(d => neDite[d] > PXLL_DITORE && oret.some(t => pxllDita(t, zona) === d));
        if (plot.length) {
          await kl.query('ROLLBACK');
          return res.status(400).json({ ditore: true, ditet: plot, error: 'You can send up to ' + PXLL_DITORE + ' emails a day. ' + plot.join(', ') + ' would have more. Choose more days or fewer emails.' });
        }
        for (let i = 0; i < marresit.length; i++) {
          const x = biz.rows.find(r => r.id === marresit[i]);
          const token = crypto.randomBytes(18).toString('hex');
          const marresi = { emri: x.emri || pxllEmriNgaDomain(x.domaini) };
          const nd = pxseNdertoPerMarres(email, marresi, token, { paSticker });
          const r = await kl.query(`INSERT INTO pxse_dergimet (token, seanca, biznes_id, derguesi_id, domaini_derguesit, marka, marres_id, marres_email, subjekti, html, tekst, dizajn, butoni_link, ora, subjekti_burim, trupi_burim)
            VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (domaini_derguesit, marres_id) DO NOTHING RETURNING id`,
            [token, seanca, ll.id, ll.domaini, marka, x.id, x.email, subjekti.replace(/\{company\}/g, marresi.emri), nd.html, nd.tekst, JSON.stringify(Object.assign({}, dizajn, { paSticker })),
             dizajn.meButon ? dizajn.butoniLink : null, new Date(oret[i]), subjekti, trupi]);
          if (!r.rows.length) { await kl.query('ROLLBACK'); return res.status(409).json({ error: (x.emri || x.domaini) + ' was already emailed. Refresh the list and try again.' }); }
          planifikuar++;
        }
        await kl.query('COMMIT');
      } catch (e) { await kl.query('ROLLBACK').catch(() => {}); throw e; } finally { kl.release(); }
      if (planifikuar) pxllNgjarje('email_planifikuar', 'email', ll.id, planifikuar);
      res.json({ ok: true, planifikuar, totalet: await pxllTotalet(ll.id) });
    } catch (e) { pxllGabim(res, e); }
  });
  // Anulimi i nje email-i qe ende pret ne radhe
  app.post('/api/pxse/llogaria/email/anulo', iLoguar, async (req, res) => {
    try {
      const id = parseInt((req.body || {}).id, 10);
      const r = await pool.query("DELETE FROM pxse_dergimet WHERE id=$1 AND biznes_id=$2 AND derguesi_id IS NOT NULL AND statusi='ne_radhe' RETURNING id", [id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'This email can no longer be cancelled.' });
      res.json({ ok: true });
    } catch (e) { pxllGabim(res, e); }
  });

  // ---------- Permbledhja per Dashboard-in ----------
  app.get('/api/pxse/llogaria/permbledhje', iLoguar, async (req, res) => {
    try {
      const ll = await pxllLlogaria(req.biznesId); await pxllLidhProvat(ll);
      const rr = await pxllRreshtiSinjaleve(ll.id), t = (rr && rr.te_dhenat) || {}, st = t.statuset || {}, lista = t.rezultatet || [];
      const nr = k => lista.filter(x => (st[x.url] || 'new') === k).length;
      const g = await pxllDerguesi(ll.id);
      res.json({ ok: true, domaini: ll.domaini, snippetAktiv: ll.snippetAktiv,
        sinjale: { ka: !!rr, total: lista.length, te_reja: nr('new'), ruajtur: nr('saved'), pergjigjur: nr('replied') },
        email: Object.assign({ derguesi: g ? g.email : null, gabimi: g ? g.gabimi : null }, await pxllTotalet(ll.id)) });
    } catch (e) { pxllGabim(res, e); }
  });

  // ---------- Radha e email-eve nga email-i i klientit: cdo minute ----------
  const pxllTransporteret = {};
  function pxllTransporti(g) {
    const c = pxllTransporteret[g.biznes_id];
    if (c && c.kur === String(g.lidhur_at)) return c.t;
    const pass = pxllDekripto(g.fjalekalimi); if (!pass) return null;
    const t = nodemailer.createTransport({ host: g.host, port: g.port, secure: g.port === 465, auth: { user: g.perdoruesi, pass },
      connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
    pxllTransporteret[g.biznes_id] = { t, kur: String(g.lidhur_at) };
    return t;
  }
  let pxllDukePunuar = false;
  async function pxllDergoRadhen() {
    if (pxllDukePunuar || !pxllCelesi()) return;
    pxllDukePunuar = true;
    try {
      await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE statusi='duke' AND derguesi_id IS NOT NULL AND derguar_at IS NULL AND ora < now() - interval '15 minutes'");
      // Vetem derguesit e lidhur dhe pa gabim; deri PXLL_PER_MINUTE per dergues ne cdo minute
      const r = await pool.query(`UPDATE pxse_dergimet SET statusi='duke' WHERE id IN (
          SELECT id FROM (SELECT d.id, row_number() OVER (PARTITION BY d.derguesi_id ORDER BY d.ora) nr FROM pxse_dergimet d
            JOIN pxse_derguesit g ON g.biznes_id = d.derguesi_id AND g.gabimi IS NULL
            WHERE d.statusi='ne_radhe' AND d.derguesi_id IS NOT NULL AND d.ora <= now()) q WHERE q.nr <= ${PXLL_PER_MINUTE})
        AND statusi='ne_radhe' RETURNING id, token, derguesi_id, marka, marres_email, subjekti, html, tekst`);
      const derguesit = {};
      for (const d of r.rows) {
        let g = derguesit[d.derguesi_id];
        if (g === undefined) g = derguesit[d.derguesi_id] = await pxllDerguesi(d.derguesi_id);
        if (!g || g.gabimi) { await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]); continue; }
        const nm = await pool.query('SELECT 1 FROM pxse_mos_kontakto WHERE email=lower($1)', [d.marres_email]);
        if (nm.rows.length) { await pool.query("UPDATE pxse_dergimet SET statusi='deshtoi', gabimi='do-not-contact' WHERE id=$1", [d.id]); continue; }
        const t = pxllTransporti(g);
        if (!t) { await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]); continue; }
        const cregj = String(process.env.PXSE_URL_BAZE || 'https://phronexusai.com').replace(/\/+$/, '') + '/pxse/c/' + d.token;
        try {
          await t.sendMail({
            from: { name: String(d.marka || g.emri || '').slice(0, 60), address: g.email }, replyTo: g.email,
            to: d.marres_email, subject: d.subjekti, html: d.html, text: d.tekst,
            headers: { 'List-Unsubscribe': '<' + cregj + '>, <mailto:' + g.email + '?subject=unsubscribe>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
          });
          await pool.query("UPDATE pxse_dergimet SET statusi='derguar', llogaria=$2, derguar_at=now(), gabimi=NULL WHERE id=$1", [d.id, g.email]);
          pxllNgjarje('email_derguar', 'email', d.derguesi_id);
        } catch (e) {
          const msg = String((e && e.message) || e).slice(0, 300);
          if ((e && e.code === 'EAUTH') || /\b535\b|auth/i.test(msg)) {
            // Fjalekalimi nuk punon me: dergimi ndalon (email-et mbeten ne radhe) derisa klienti te rilidhe email-in
            await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]);
            await pool.query('UPDATE pxse_derguesit SET gabimi=$2 WHERE biznes_id=$1', [g.biznes_id, 'Sign-in to your mailbox failed. Reconnect it to keep sending.']);
            g.gabimi = 'auth';
          } else {
            await pool.query("UPDATE pxse_dergimet SET statusi='deshtoi', llogaria=$2, gabimi=$3 WHERE id=$1", [d.id, g.email, msg]);
          }
        }
      }
    } catch (e) { console.error('pxse llogaria radha:', e.message); }
    pxllDukePunuar = false;
  }
  setTimeout(pxllDergoRadhen, 25000).unref();
  setInterval(pxllDergoRadhen, 60000).unref();
};
