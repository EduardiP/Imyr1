// pxse-dergimi.js (PhronexusAI) — DERGIMI i email-eve te proves falas (pa hyrje) te seksionit publik.
// Server.js e therret: require('./pxse-dergimi')(app, pool, iAdmin);
//
// Si funksionon:
//  1. Direktoria e bizneseve (pxse_bizneset) mbushet nga admini me POST /api/admin/pxse/bizneset/import.
//  2. Faqja merr kategorite (/api/pxse/kategorite) dhe bizneset e nje kategorie (/api/pxse/bizneset).
//     Ne faqe dalin vetem emri dhe domaini i biznesit, ASNJEHERE adresa e email-it.
//  3. "Send" (/api/pxse/dergo): serveri kontrollon perseri gjithcka dhe e ndertoi email-in me TE NJEJTIN
//     skedar dizajnesh si parapamja (public/js/pxse-dizajnet.js), pastaj e vendos ne radhe sipas ores.
//     Rregullat e proves falas: 3 email-e per domain derguesi (gjithsej), te pakten 4 ore larg, deri 7 dite perpara, cdo marres
//     vetem nje here nga i njejti dergues, pa follow-up, vetem marres me email te verifikuar dhe jo ne "mos me kontakto".
//     Kapaciteti ditor: (numri i llogarive) x PXSE_KUFI_DITOR (paracaktim 15 -> 45 me 3 llogari). Dita llogaritet sipas ores se Berlinit.
//     Nese dita e zgjedhur eshte plot, "Send" nuk pranohet dhe klientit i kerkohet te hyje (dergim nga email-i i vet, pa kufi).
//     Nese nje email ne radhe nuk del dot ne diten e vet (kufiri u arrit), kalon ne diten tjeter dhe shfaqet "Delayed".
//  6. Ruajtja: 7 dite pas email-it te fundit fshihen email-et dhe analitika e proves pa hyrje (domaini mbetet "i perdorur"
//     te pxse-prova.js). Mbetet vetem token -> marres per Unsubscribe (qe lidhja ne email-et e vjetra te punoje gjithmone)
//     dhe lista "mos me kontakto" (nuk fshihet kurre). Provat e lidhura me nje llogari nuk fshihen.
//  4. Cdo minute dergohen ato qe u ka ardhur ora, nga llogarite e admin-it (te njejtat si "Marketingu":
//     GMAIL_USER/GMAIL_APP_PASSWORD, MKT_EMAIL_2..6_USER/PASS), me radhe: llogaria qe ka derguar me pak sot,
//     brenda kufirit ditor. Emri i derguesit = emri i biznesit te klientit; pergjigjet shkojne te llogaria derguese.
//  5. Gjurmimi (si te admin-i): piksel per hapjet, butoni kalon nga /pxse/k/<token> per klikimet.
//     Unsubscribe me nje klik (/pxse/c/<token>, edhe RFC 8058) -> lista e perbashket "mos me kontakto".
//
// Variabla ne Railway:
//   PXSE_DERGIMI_AKTIV=1     pa kete, "Send" pergjigjet "Sending opens soon" dhe asgje nuk dergohet
//   PXSE_KUFI_DITOR=15       sa email-e ne dite nga nje llogari (paracaktim 15)
//   PXSE_GJURMIM_HAPJE=0     (opsionale) fik pikselin e hapjeve;  PXSE_GJURMIM_KLIKIME=0 fik gjurmimin e klikimeve
//   PXSE_URL_BAZE            (opsionale) paracaktim https://phronexusai.com
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const pxseDizajnet = require(path.join(__dirname, 'public', 'js', 'pxse-dizajnet.js'));
const { pxseKontrolloEmailin } = require('./pxse-prova');

const PXSE_LLOGARITE = [
  { user: 'GMAIL_USER', pass: 'GMAIL_APP_PASSWORD' },
  { user: 'MKT_EMAIL_2_USER', pass: 'MKT_EMAIL_2_PASS' },
  { user: 'MKT_EMAIL_3_USER', pass: 'MKT_EMAIL_3_PASS' },
  { user: 'MKT_EMAIL_4_USER', pass: 'MKT_EMAIL_4_PASS' },
  { user: 'MKT_EMAIL_5_USER', pass: 'MKT_EMAIL_5_PASS' },
  { user: 'MKT_EMAIL_6_USER', pass: 'MKT_EMAIL_6_PASS' }
];
const PXSE_FALAS_PER_DOMAIN = 3;
const PXSE_KATER_ORE = 4 * 3600 * 1000;
const PXSE_DITE_MAKS = 7;
const PXSE_DITE_RUAJTJE = 7;
const PXSE_ZONA = 'Europe/Berlin';
const pxseKufiDitor = () => Math.max(1, Number(process.env.PXSE_KUFI_DITOR) || 15);
// Data (YYYY-MM-DD) sipas ores se Berlinit per nje kohe ne ms
const pxseDitaBerlin = t => new Intl.DateTimeFormat('en-CA', { timeZone: PXSE_ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));

const pxseAktiv = () => String(process.env.PXSE_DERGIMI_AKTIV || '') === '1';
const pxseNdezur = v => !/^(0|off|false|jo)$/i.test(String(v == null ? '' : v).trim());
const pxseBaza = () => String(process.env.PXSE_URL_BAZE || 'https://phronexusai.com').replace(/\/+$/, '');
const pxseSeancaOk = s => typeof s === 'string' && /^[a-f0-9]{32}$/.test(s);
const pxseHttps = u => { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const pxseEscHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pxseEmriNgaDomain = d => { const e = String(d || '').split('.')[0] || ''; return e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Your company'; };

const pxseTransporteret = {};
function pxseLlogarite() {
  for (const l of PXSE_LLOGARITE) {
    const user = process.env[l.user], pass = process.env[l.pass];
    if (!user || !pass || pxseTransporteret[user]) continue;
    pxseTransporteret[user] = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false, auth: { user, pass },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000
    });
  }
  return Object.keys(pxseTransporteret);
}

// Te njejtat vlera si parapamja (pxse-seksioni.js -> pxseVleratEmailit), me {company} = emri i marresit.
function pxseVlerat(e, marres, paSticker) {
  const d = e.dizajn || {};
  return {
    marka: e.marka, domaini: e.domaini, logo: pxseHttps(d.logo), ngjyra: d.ngjyra,
    paragrafet: String(e.trupi || '').replace(/\{company\}/g, marres.emri).split(/\n\s*\n/).map(x => x.trim()).filter(Boolean),
    butoni: d.meButon ? { tekst: String(d.butoniTekst || 'Visit our website').slice(0, 40), link: d.butoniLink } : null,
    fundiJo: 'Not relevant? Just reply "no" and you will not hear from us again.', cregj: 'Unsubscribe',
    sticker: paSticker ? false : { rreshti1: 'Powered by PhronexusAI', rreshti2: 'Send emails, 100% free' }
  };
}
// HTML-ja e dizajnit te zgjedhur + gjurmimi + Unsubscribe i vertete; dhe versioni tekst.
// opsione.paSticker: vetem per llogarite me snippet aktiv (pxse-llogaria.js)
function pxseNdertoPerMarres(e, marres, token, opsione) {
  const dz = pxseDizajnet.find(x => x.id === (e.dizajn && e.dizajn.id)) || pxseDizajnet[1] || pxseDizajnet[0];
  const v = pxseVlerat(e, marres, !!(opsione && opsione.paSticker));
  const baza = pxseBaza(), cregj = baza + '/pxse/c/' + token;
  let html = dz.nderto(v);
  // Unsubscribe: dizajnet e kane href="#"
  html = html.split('href="#"').join('href="' + pxseEscHtml(cregj) + '"');
  // Klikimet: vetem lidhja e butonit kalon nga serveri (destinacioni ruhet ne databaze, pa "open redirect")
  if (v.butoni && pxseNdezur(process.env.PXSE_GJURMIM_KLIKIME)) {
    html = html.split('href="' + pxseEscHtml(v.butoni.link) + '"').join('href="' + pxseEscHtml(baza + '/pxse/k/' + token) + '"');
  }
  if (pxseNdezur(process.env.PXSE_GJURMIM_HAPJE)) {
    html += '<img src="' + pxseEscHtml(baza + '/pxse/h/' + token + '.gif') + '" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;">';
  }
  const tekst = v.paragrafet.join('\n\n') + '\n\n' + v.marka +
    (v.butoni ? '\n' + v.butoni.tekst + ': ' + v.butoni.link : '') +
    '\n\n' + v.fundiJo + '\nUnsubscribe: ' + cregj + (v.sticker ? '\n\nPowered by PhronexusAI - https://phronexusai.com/' : '');
  return { html, tekst };
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_bizneset (
      id SERIAL PRIMARY KEY,
      domaini TEXT UNIQUE NOT NULL,
      emri TEXT,
      email TEXT,
      kategoria TEXT,
      vendi TEXT,
      pershkrimi TEXT,
      email_verifikuar BOOLEAN NOT NULL DEFAULT false,
      aktiv BOOLEAN NOT NULL DEFAULT true,
      shtuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_biz_kat ON pxse_bizneset (kategoria, shtuar_at DESC)');
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_mos_kontakto (
      email TEXT PRIMARY KEY,
      arsyeja TEXT,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_dergimet (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      seanca TEXT NOT NULL,
      biznes_id INT,                           -- llogaria PhronexusAI pas hyrjes (pxse/lidh)
      domaini_derguesit TEXT NOT NULL,
      marka TEXT,
      marres_id INT NOT NULL REFERENCES pxse_bizneset(id),
      marres_email TEXT NOT NULL,
      subjekti TEXT NOT NULL,
      html TEXT NOT NULL,
      tekst TEXT NOT NULL,
      dizajn JSONB,
      butoni_link TEXT,
      ora TIMESTAMPTZ NOT NULL,
      statusi TEXT NOT NULL DEFAULT 'ne_radhe', -- ne_radhe | duke | derguar | deshtoi
      gabimi TEXT,
      llogaria TEXT,
      derguar_at TIMESTAMPTZ,
      hapur_at TIMESTAMPTZ, hapje INT NOT NULL DEFAULT 0,
      klikuar_at TIMESTAMPTZ, klikime INT NOT NULL DEFAULT 0,
      cregj_at TIMESTAMPTZ,
      krijuar_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (domaini_derguesit, marres_id)
    )`);
    // Burimi i email-it (subjekti/trupi para {company}) per ta shfaqur kur klienti kthehet; "vonuar" = kaloi ne diten tjeter
    await pool.query('ALTER TABLE pxse_dergimet ADD COLUMN IF NOT EXISTS subjekti_burim TEXT');
    await pool.query('ALTER TABLE pxse_dergimet ADD COLUMN IF NOT EXISTS trupi_burim TEXT');
    await pool.query('ALTER TABLE pxse_dergimet ADD COLUMN IF NOT EXISTS vonuar BOOLEAN NOT NULL DEFAULT false');
    // derguesi_id: email-et qe dalin nga email-i i vete klientit (dashboard, pxse-llogaria.js). Kjo radhe nuk i prek.
    await pool.query('ALTER TABLE pxse_dergimet ADD COLUMN IF NOT EXISTS derguesi_id INT');
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_tokenet_cregj (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_derg_radha ON pxse_dergimet (statusi, ora)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_derg_dom ON pxse_dergimet (domaini_derguesit)');
  })().catch(e => console.error('pxse-dergimi migrim:', e.message));

  async function pxseNeMosKontakto(email) {
    const r = await pool.query('SELECT 1 FROM pxse_mos_kontakto WHERE email=lower($1)', [email]);
    if (r.rows.length) return true;
    // Lista e Marketingut te admin-it (nese ekziston): kush eshte cregjistruar atje nuk kontaktohet as ketu.
    try { const m = await pool.query('SELECT 1 FROM marketing_kontaktet WHERE lower(email)=lower($1) AND unsubscribed=true LIMIT 1', [email]); if (m.rows.length) return true; } catch (e) {}
    return false;
  }

  // ---------- Kapaciteti ditor (te gjitha provat bashke) ----------
  // Te zena ne nje dite = te derguara ate dite + ato qe presin ne radhe per ate dite.
  async function pxseTeZenaDitet() {
    const r = await pool.query(`SELECT to_char((CASE WHEN statusi='derguar' THEN derguar_at ELSE ora END) AT TIME ZONE '${PXSE_ZONA}', 'YYYY-MM-DD') dita, COUNT(*)::int n
      FROM pxse_dergimet WHERE statusi IN ('ne_radhe','duke','derguar') AND derguesi_id IS NULL
        AND (CASE WHEN statusi='derguar' THEN derguar_at ELSE ora END) > now() - interval '2 days' GROUP BY 1`);
    const m = {}; r.rows.forEach(x => { m[x.dita] = x.n; }); return m;
  }
  const pxseKapaciteti = () => pxseLlogarite().length * pxseKufiDitor();
  async function pxseDitetELira() {
    const zena = await pxseTeZenaDitet(), kap = pxseKapaciteti(), l = [];
    for (let i = 0; i <= PXSE_DITE_MAKS; i++) {
      const d = pxseDitaBerlin(Date.now() + i * 86400000);
      if (!l.some(x => x.dita === d)) l.push({ dita: d, lira: Math.max(0, kap - (zena[d] || 0)) });
    }
    return l;
  }
  app.get('/api/pxse/ditet', async (req, res) => {
    try { res.json({ ok: true, aktiv: pxseAktiv(), sot: pxseDitaBerlin(Date.now()), ditet: await pxseDitetELira() }); }
    catch (e) { res.json({ ok: true, ditet: [] }); }
  });

  // ---------- Direktoria (publike: pa adresa email-i) ----------
  app.get('/api/pxse/kategorite', async (req, res) => {
    try {
      const r = await pool.query(`SELECT kategoria, COUNT(*)::int n FROM pxse_bizneset
        WHERE aktiv AND email_verifikuar AND kategoria IS NOT NULL AND kategoria <> '' GROUP BY kategoria ORDER BY kategoria`);
      res.json({ ok: true, kategorite: r.rows.map(x => ({ v: x.kategoria, emri: x.kategoria, n: x.n })) });
    } catch (e) { res.json({ ok: true, kategorite: [] }); }
  });

  app.get('/api/pxse/bizneset', async (req, res) => {
    try {
      const kat = String(req.query.kategoria || '').slice(0, 120);
      const dom = String(req.query.domaini || '').toLowerCase().slice(0, 253);
      const r = await pool.query(`SELECT b.id, b.emri, b.domaini, b.kategoria,
          GREATEST(0, EXTRACT(DAY FROM now() - b.shtuar_at))::int AS dite
        FROM pxse_bizneset b
        WHERE b.aktiv AND b.email_verifikuar AND b.email IS NOT NULL AND ($1 = '' OR b.kategoria = $1)
          AND b.domaini <> $2
          AND NOT EXISTS (SELECT 1 FROM pxse_dergimet d WHERE d.marres_id = b.id AND d.domaini_derguesit = $2)
          AND NOT EXISTS (SELECT 1 FROM pxse_mos_kontakto m WHERE m.email = lower(b.email))
        ORDER BY b.shtuar_at DESC, b.id DESC LIMIT 60`, [kat, dom]);
      res.json({ ok: true, bizneset: r.rows.map(x => ({ id: String(x.id), emri: x.emri || pxseEmriNgaDomain(x.domaini), domaini: x.domaini, kat: x.kategoria, dite: x.dite })) });
    } catch (e) { res.status(500).json({ ok: false, error: 'Try again in a few minutes.' }); }
  });

  // ---------- Dergimet e nje domaini (vetem per proven qe e studioi) ----------
  async function pxseListaDergimeve(domaini, seanca) {
    const r = await pool.query(`SELECT d.id, d.ora, d.statusi, d.derguar_at, d.hapur_at, d.klikuar_at, d.cregj_at, d.subjekti, d.vonuar,
        d.subjekti_burim, d.trupi_burim, d.marka, d.dizajn, b.emri, b.domaini
      FROM pxse_dergimet d JOIN pxse_bizneset b ON b.id = d.marres_id
      WHERE d.domaini_derguesit = $1 AND d.seanca = $2 ORDER BY d.ora`, [domaini, seanca]);
    const perdorur = await pool.query('SELECT COUNT(*)::int n FROM pxse_dergimet WHERE domaini_derguesit=$1', [domaini]);
    // Email-i qe u dergua (i njejti per te gjithe marresit), per ta shfaqur kur klienti kthehet
    const b0 = r.rows.find(x => x.trupi_burim);
    return {
      mbetur: Math.max(0, PXSE_FALAS_PER_DOMAIN - perdorur.rows[0].n),
      email: b0 ? { subjekti: b0.subjekti_burim, trupi: b0.trupi_burim, marka: b0.marka, dizajn: b0.dizajn } : null,
      dergimet: r.rows.map(x => ({
        id: x.id, marresi: x.emri || pxseEmriNgaDomain(x.domaini), domaini: x.domaini, subjekti: x.subjekti, ora: x.ora,
        statusi: x.statusi === 'duke' ? 'ne_radhe' : x.statusi, derguar_at: x.derguar_at, vonuar: !!x.vonuar,
        hapur: !!x.hapur_at, klikuar: !!x.klikuar_at, cregj: !!x.cregj_at
      }))
    };
  }
  app.get('/api/pxse/dergimet', async (req, res) => {
    const seanca = String(req.query.seanca || ''), domaini = String(req.query.domaini || '').toLowerCase().replace(/^www\./, '');
    if (!pxseSeancaOk(seanca) || !domaini) return res.status(400).json({ ok: false });
    try { res.json(Object.assign({ ok: true, aktiv: pxseAktiv() }, await pxseListaDergimeve(domaini, seanca))); }
    catch (e) { res.status(500).json({ ok: false }); }
  });

  // ---------- "Send" ----------
  app.post('/api/pxse/dergo', async (req, res) => {
    try {
      if (!pxseAktiv()) return res.status(503).json({ error: 'Sending opens soon. Your email is ready.' });
      if (!pxseLlogarite().length) return res.status(503).json({ error: 'Try again in a few minutes.' });
      const b = req.body || {};
      if (!pxseSeancaOk(b.seanca)) return res.status(400).json({ error: 'Please reload the page and try again.' });
      const domaini = String(b.domaini || '').toLowerCase().trim().replace(/^www\./, '');
      // Domaini duhet te jete studiuar nga kjo prove (keshtu email-i vjen nga AI dhe nga faqja e klientit).
      const st = await pool.query("SELECT 1 FROM pxse_prova_domaine WHERE domaini=$1 AND sherbimi='email' AND seanca=$2", [domaini, b.seanca]);
      if (!st.rows.length) return res.status(400).json({ error: 'Study your business with AI first.' });
      // Pas fshirjes (1 jave) studimi nuk ekziston me: prova ka perfunduar, edhe nese kodi i seances eshte i njejti.
      const ruajtur = await pool.query("SELECT 1 FROM pxse_prova_rezultate WHERE seanca=$1 AND domaini=$2 AND sherbimi='email' LIMIT 1", [b.seanca, domaini]);
      if (!ruajtur.rows.length) return res.status(409).json({ mbaroi: true, mbetur: 0, error: 'Your free try has ended. Sign in to keep sending, with no limit.' });

      const marresit = (Array.isArray(b.marresit) ? b.marresit : []).map(x => parseInt(x, 10)).filter(x => x > 0);
      const oret = (Array.isArray(b.oret) ? b.oret : []).map(x => Date.parse(x));
      if (!marresit.length || marresit.length !== oret.length || new Set(marresit).size !== marresit.length) return res.status(400).json({ error: 'Choose up to 3 businesses and a time for each.' });

      const perdorur = await pool.query("SELECT COUNT(*)::int n, array_agg(ora) oret FROM pxse_dergimet WHERE domaini_derguesit=$1", [domaini]);
      if (perdorur.rows[0].n + marresit.length > PXSE_FALAS_PER_DOMAIN) {
        return res.status(409).json({ limit: true, mbetur: Math.max(0, PXSE_FALAS_PER_DOMAIN - perdorur.rows[0].n),
          error: 'The free try sends up to 3 emails per domain. Sign in to send more.' });
      }
      // Oret: ne te ardhmen (me nje minute tolerance), jo me shume se 14 dite, te pakten 4 ore larg (edhe nga ato qe jane ne radhe).
      const tani = Date.now();
      if (oret.some(t => isNaN(t) || t < tani - 60000 || t > tani + PXSE_DITE_MAKS * 86400000)) return res.status(400).json({ error: 'Choose a time in the next 7 days.' });
      const teGjitha = oret.concat((perdorur.rows[0].oret || []).filter(Boolean).map(x => new Date(x).getTime())).sort((a, c) => a - c);
      for (let i = 1; i < teGjitha.length; i++) if (teGjitha[i] - teGjitha[i - 1] < PXSE_KATER_ORE) return res.status(400).json({ error: 'In the free try, emails must be at least 4 hours apart.' });

      // Permbajtja: rregullat kunder spam-it vlejne edhe pas ndryshimit me dore (mbron llogarite derguese).
      const subjekti = String(b.subjekti || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
      const trupi = String(b.trupi || '').replace(/\r/g, '').trim().slice(0, 2000);
      const probleme = pxseKontrolloEmailin(subjekti, trupi);
      if (probleme.length) return res.status(422).json({ probleme, error: 'Please fix the email first: ' + probleme.join('; ') + '.' });

      const d = b.dizajn || {};
      const dizajn = {
        id: pxseDizajnet.some(x => x.id === String(d.id)) ? String(d.id) : '2',
        ngjyra: /^#[0-9a-f]{6}$/i.test(String(d.ngjyra || '')) ? String(d.ngjyra).toLowerCase() : '#3b6ef0',
        logo: pxseHttps(d.logo).slice(0, 500), meButon: !!d.meButon,
        butoniTekst: String(d.butoniTekst || '').replace(/[<>\r\n]/g, '').trim().slice(0, 40) || 'Visit our website',
        butoniLink: ''
      };
      if (dizajn.meButon) {
        // Butoni lejohet vetem drejt faqes se vete klientit (mbron nga lidhje mashtruese te derguara nga llogarite tona).
        const link = pxseHttps(d.butoniLink) || 'https://' + domaini;
        let host = ''; try { host = new URL(link).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) {}
        if (!(host === domaini || host.endsWith('.' + domaini))) return res.status(400).json({ error: 'The button must link to your own website (' + domaini + ').' });
        dizajn.butoniLink = link.slice(0, 500);
      }
      const marka = String(b.marka || '').replace(/[<>\r\n"]/g, '').trim().slice(0, 60) || pxseEmriNgaDomain(domaini);
      const email = { marka, domaini, subjekti, trupi, dizajn };

      const biz = await pool.query('SELECT id, emri, domaini, email FROM pxse_bizneset WHERE id = ANY($1::int[]) AND aktiv AND email_verifikuar AND email IS NOT NULL', [marresit]);
      if (biz.rows.length !== marresit.length) return res.status(400).json({ error: 'One of the selected businesses is no longer available.' });
      for (const x of biz.rows) if (await pxseNeMosKontakto(x.email)) return res.status(400).json({ error: (x.emri || x.domaini) + ' cannot be contacted. Choose another business.' });

      const kl = await pool.connect();
      try {
        await kl.query('BEGIN');
        await kl.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['pxse:' + domaini]); // dy "Send" njekohesisht nuk e kalojne kufirin
        const n = await kl.query('SELECT COUNT(*)::int n FROM pxse_dergimet WHERE domaini_derguesit=$1', [domaini]);
        if (n.rows[0].n + marresit.length > PXSE_FALAS_PER_DOMAIN) { await kl.query('ROLLBACK'); return res.status(409).json({ limit: true, error: 'The free try sends up to 3 emails per domain. Sign in to send more.' }); }
        // Kapaciteti ditor i llogarive tona (bllokim i perbashket, qe dy klientë njekohesisht te mos e kalojne)
        await kl.query("SELECT pg_advisory_xact_lock(hashtext('pxse:kapaciteti'))");
        const zena = await pxseTeZenaDitet(), kap = pxseKapaciteti(), teReja = {};
        oret.forEach(t => { const d = pxseDitaBerlin(t); teReja[d] = (teReja[d] || 0) + 1; });
        const plot = Object.keys(teReja).filter(d => (zena[d] || 0) + teReja[d] > kap);
        if (plot.length) {
          await kl.query('ROLLBACK');
          const sot = plot.includes(pxseDitaBerlin(Date.now()));
          return res.status(409).json({ plot: true, ditetPlot: plot, ditet: await pxseDitetELira(),
            error: 'Free sending from our mailboxes is full for ' + (sot ? 'today' : plot.join(', ')) + '. Sign in and send from your own email, with no limit.' });
        }
        for (let i = 0; i < marresit.length; i++) {
          const x = biz.rows.find(r => r.id === marresit[i]);
          const token = crypto.randomBytes(18).toString('hex');
          const marresi = { emri: x.emri || pxseEmriNgaDomain(x.domaini) };
          const sub = subjekti.replace(/\{company\}/g, marresi.emri);
          const nd = pxseNdertoPerMarres(email, marresi, token);
          await kl.query(`INSERT INTO pxse_dergimet (token, seanca, domaini_derguesit, marka, marres_id, marres_email, subjekti, html, tekst, dizajn, butoni_link, ora, subjekti_burim, trupi_burim)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [token, b.seanca, domaini, marka, x.id, x.email, sub, nd.html, nd.tekst, JSON.stringify(dizajn), dizajn.meButon ? dizajn.butoniLink : null, new Date(oret[i]), subjekti, trupi]);
        }
        await kl.query('COMMIT');
        for (let i = 0; i < marresit.length; i++) pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, seanca, biznes_id) VALUES ($1,$2,$3,$4)', ['email_planifikuar', 'email', b.seanca, null]).catch(() => {}); // analitika
      } catch (e) {
        await kl.query('ROLLBACK').catch(() => {});
        if (/duplicate key/i.test(e.message)) return res.status(409).json({ error: 'You already emailed one of these businesses.' });
        throw e;
      } finally { kl.release(); }
      res.json(Object.assign({ ok: true }, await pxseListaDergimeve(domaini, b.seanca)));
    } catch (e) { console.error('pxse dergo:', e.message); res.status(500).json({ error: 'Try again in a few minutes.' }); }
  });

  // ---------- Radha: cdo minute ----------
  let pxseDukePunuar = false;
  async function pxseDergoRadhen() {
    if (pxseDukePunuar || !pxseAktiv()) return;
    const llogarite = pxseLlogarite(); if (!llogarite.length) return;
    pxseDukePunuar = true;
    try {
      // Email-et qe mbeten "duke" (p.sh. rinisje gjate dergimit) kthehen ne radhe pas 15 minutash.
      await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE statusi='duke' AND derguesi_id IS NULL AND krijuar_at < now() - interval '15 minutes' AND derguar_at IS NULL AND ora < now() - interval '15 minutes'");
      const kufi = pxseKufiDitor();
      for (let i = 0; i < 10; i++) {
        const r = await pool.query(`UPDATE pxse_dergimet SET statusi='duke' WHERE id = (
            SELECT id FROM pxse_dergimet WHERE statusi='ne_radhe' AND derguesi_id IS NULL AND ora <= now() ORDER BY ora LIMIT 1 FOR UPDATE SKIP LOCKED)
          RETURNING id, token, seanca, marka, marres_email, subjekti, html, tekst`);
        if (!r.rows.length) break;
        const d = r.rows[0];
        if (await pxseNeMosKontakto(d.marres_email)) { await pool.query("UPDATE pxse_dergimet SET statusi='deshtoi', gabimi='do-not-contact' WHERE id=$1", [d.id]); continue; }
        // Llogaria qe ka derguar me pak sot (brenda kufirit): ngarkese e shperndare njetrajtesisht.
        const sot = await pool.query(`SELECT llogaria, COUNT(*)::int n FROM pxse_dergimet WHERE statusi='derguar' AND derguesi_id IS NULL
          AND derguar_at >= (date_trunc('day', now() AT TIME ZONE '${PXSE_ZONA}') AT TIME ZONE '${PXSE_ZONA}') GROUP BY llogaria`);
        const numri = {}; sot.rows.forEach(x => { numri[x.llogaria] = x.n; });
        const zgjedhur = llogarite.filter(u => (numri[u] || 0) < kufi).sort((a, c) => (numri[a] || 0) - (numri[c] || 0))[0];
        if (!zgjedhur) {
          // Kufiri i dites u arrit per te gjitha llogarite: ky dhe te gjithe ata qe u ka ardhur ora kalojne ne diten tjeter (e njejta ore).
          await pool.query("UPDATE pxse_dergimet SET statusi='ne_radhe' WHERE id=$1", [d.id]);
          await pool.query("UPDATE pxse_dergimet SET ora = ora + interval '1 day', vonuar = true WHERE statusi='ne_radhe' AND derguesi_id IS NULL AND ora <= now()");
          break;
        }
        const cregj = pxseBaza() + '/pxse/c/' + d.token;
        try {
          await pxseTransporteret[zgjedhur].sendMail({
            from: { name: String(d.marka || '').slice(0, 60), address: zgjedhur },
            to: d.marres_email, subject: d.subjekti, html: d.html, text: d.tekst,
            headers: { 'List-Unsubscribe': '<' + cregj + '>, <mailto:' + zgjedhur + '?subject=unsubscribe>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
          });
          await pool.query("UPDATE pxse_dergimet SET statusi='derguar', llogaria=$2, derguar_at=now(), gabimi=NULL WHERE id=$1", [d.id, zgjedhur]);
          pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, seanca, biznes_id) VALUES ($1,$2,$3,$4)', ['email_derguar', 'email', d.seanca, null]).catch(() => {}); // analitika
        } catch (e) {
          await pool.query("UPDATE pxse_dergimet SET statusi='deshtoi', llogaria=$2, gabimi=$3 WHERE id=$1", [d.id, zgjedhur, String(e.message || e).slice(0, 300)]);
          console.error('pxse dergimi deshtoi:', e.message);
        }
      }
    } catch (e) { console.error('pxse radha:', e.message); }
    pxseDukePunuar = false;
  }
  setTimeout(pxseDergoRadhen, 20000).unref();
  setInterval(pxseDergoRadhen, 60000).unref();

  // ---------- Fshirja pas 1 jave (vetem provat pa hyrje) ----------
  // Nje grup (domain + seance) fshihet kur te gjitha email-et e tij kane mbaruar dhe i fundit doli para 7 ditesh.
  // Para fshirjes ruhet token -> marres qe Unsubscribe ne email-et e vjetra te punoje edhe me pas.
  async function pxseFshiTeVjetrat() {
    try {
      const kush = `SELECT domaini_derguesit, seanca FROM pxse_dergimet WHERE biznes_id IS NULL GROUP BY domaini_derguesit, seanca
        HAVING bool_and(statusi IN ('derguar','deshtoi')) AND MAX(COALESCE(derguar_at, ora)) < now() - interval '${PXSE_DITE_RUAJTJE} days'`;
      await pool.query(`INSERT INTO pxse_tokenet_cregj (token, email) SELECT d.token, d.marres_email FROM pxse_dergimet d
        JOIN (${kush}) g ON g.domaini_derguesit = d.domaini_derguesit AND g.seanca = d.seanca ON CONFLICT (token) DO NOTHING`);
      await pool.query(`DELETE FROM pxse_dergimet d USING (${kush}) g WHERE g.domaini_derguesit = d.domaini_derguesit AND g.seanca = d.seanca AND d.biznes_id IS NULL`);
      await pool.query("DELETE FROM pxse_tokenet_cregj WHERE krijuar_at < now() - interval '2 years'");
    } catch (e) { console.error('pxse fshirja e dergimeve:', e.message); }
  }
  setTimeout(pxseFshiTeVjetrat, 60000).unref();
  setInterval(pxseFshiTeVjetrat, 60 * 60 * 1000).unref();

  // ---------- Gjurmimi dhe Unsubscribe (publike, nga email-i) ----------
  const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const tokenOk = t => /^[a-f0-9]{36}$/.test(String(t || ''));
  app.get('/pxse/h/:token.gif', async (req, res) => {
    if (tokenOk(req.params.token)) pool.query('UPDATE pxse_dergimet SET hapje=hapje+1, hapur_at=COALESCE(hapur_at, now()) WHERE token=$1', [req.params.token]).catch(() => {});
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, max-age=0' }).send(GIF);
  });
  app.get('/pxse/k/:token', async (req, res) => {
    try {
      if (!tokenOk(req.params.token)) return res.redirect(302, 'https://phronexusai.com/');
      const r = await pool.query('UPDATE pxse_dergimet SET klikime=klikime+1, klikuar_at=COALESCE(klikuar_at, now()) WHERE token=$1 RETURNING butoni_link', [req.params.token]);
      const link = r.rows.length ? pxseHttps(r.rows[0].butoni_link) : '';
      res.redirect(302, link || 'https://phronexusai.com/');
    } catch (e) { res.redirect(302, 'https://phronexusai.com/'); }
  });
  async function pxseCregjistro(token) {
    if (!tokenOk(token)) return false;
    const r = await pool.query('UPDATE pxse_dergimet SET cregj_at=COALESCE(cregj_at, now()) WHERE token=$1 RETURNING marres_email', [token]);
    let email = r.rows.length ? r.rows[0].marres_email : null;
    if (!email) { const v = await pool.query('SELECT email FROM pxse_tokenet_cregj WHERE token=$1', [token]); if (v.rows.length) email = v.rows[0].email; }
    if (!email) return false;
    await pool.query("INSERT INTO pxse_mos_kontakto (email, arsyeja) VALUES (lower($1), 'unsubscribe') ON CONFLICT (email) DO NOTHING", [email]);
    try { await pool.query('UPDATE marketing_kontaktet SET unsubscribed=true WHERE lower(email)=lower($1)', [email]); } catch (e) {}
    return true;
  }
  app.get('/pxse/c/:token', async (req, res) => {
    let ok = false; try { ok = await pxseCregjistro(req.params.token); } catch (e) {}
    res.type('html').send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>' +
      '<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;margin:0;padding:48px 16px;color:#1c2128;"><div style="max-width:460px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">' +
      '<h1 style="font-size:20px;margin:0 0 10px;">' + (ok ? 'You have been unsubscribed' : 'This link is no longer valid') + '</h1>' +
      '<p style="margin:0;line-height:1.6;color:#5b6472;">' + (ok ? 'You will not receive emails sent through PhronexusAI again.' : 'If you keep receiving emails, reply "no" to the email.') + '</p></div></body></html>');
  });
  app.post('/pxse/c/:token', async (req, res) => { try { await pxseCregjistro(req.params.token); } catch (e) {} res.status(200).send('OK'); }); // RFC 8058

  // ---------- Admin: importi i direktorise ----------
  // Body: { bizneset: [ { domaini, emri, email, kategoria, vendi, pershkrimi, email_verifikuar } ] }  (deri 2000 ne nje thirrje)
  app.post('/api/admin/pxse/bizneset/import', iAdmin, async (req, res) => {
    const lista = Array.isArray(req.body && req.body.bizneset) ? req.body.bizneset.slice(0, 2000) : [];
    let shtuar = 0, perditesuar = 0, refuzuar = 0;
    for (const x of lista) {
      const domaini = String((x && x.domaini) || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '').replace(/^www\./, '');
      const email = String((x && x.email) || '').trim().toLowerCase();
      if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domaini) || (email && !/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/.test(email))) { refuzuar++; continue; }
      try {
        const r = await pool.query(`INSERT INTO pxse_bizneset (domaini, emri, email, kategoria, vendi, pershkrimi, email_verifikuar)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (domaini) DO UPDATE SET emri=EXCLUDED.emri, email=EXCLUDED.email, kategoria=EXCLUDED.kategoria, vendi=EXCLUDED.vendi,
            pershkrimi=EXCLUDED.pershkrimi, email_verifikuar=EXCLUDED.email_verifikuar
          RETURNING (xmax = 0) AS iri`,
          [domaini, String(x.emri || '').slice(0, 160) || null, email || null, String(x.kategoria || '').slice(0, 120) || null,
           String(x.vendi || '').slice(0, 80) || null, String(x.pershkrimi || '').slice(0, 1000) || null, x.email_verifikuar === true || x.email_verifikuar === 'true' || x.email_verifikuar === 1]);
        if (r.rows[0].iri) shtuar++; else perditesuar++;
      } catch (e) { refuzuar++; }
    }
    res.json({ ok: true, shtuar, perditesuar, refuzuar });
  });
  app.get('/api/admin/pxse/permbledhje', iAdmin, async (req, res) => {
    try {
      const b = await pool.query('SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE email_verifikuar)::int verifikuar FROM pxse_bizneset');
      const d = await pool.query("SELECT statusi, COUNT(*)::int n FROM pxse_dergimet GROUP BY statusi");
      res.json({ ok: true, aktiv: pxseAktiv(), llogarite: pxseLlogarite(), bizneset: b.rows[0], dergimet: d.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
// Per dashboard-in (pxse-llogaria.js): i njejti ndertim i email-it dhe i njejti gjurmim.
module.exports.pxseNdertoPerMarres = pxseNdertoPerMarres;
module.exports.pxseNeMosKontaktoSql = "SELECT 1 FROM pxse_mos_kontakto WHERE email=lower($1)";
