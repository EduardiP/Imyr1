// pxse-admin-analitika.js (PhronexusAI) — analitika e sherbimeve falas (Email-et dhe Sinjalet) per admin-in.
// Server.js e therret: require('./pxse-admin-analitika')(app, pool, iAdmin);
//
// Ngjarjet ruhen te pxse_ngjarjet (pa te dhena personale: lloji, seksioni, kodi i rastesishem i provës, koha, B2B/B2C, numri).
// Disa vijne nga faqja publike (POST /api/pxse/ngjarje): hyrja ne faqe, klikimet (✕, "Sign in", ✦ email, ✦ sinjale, "Open post").
// Te tjerat i shkruajne vete pxse-prova.js, pxse-dergimi.js, pxse-sinjalet.js: studimi, login-i, rikthimi, email-et, sinjalet e dhena.
// Burimet e sinjaleve (Reddit, Indie Hackers, HN, Stack Exchange, Google Alerts) shkruajne numrat ditore te pxse_burimet_ditore.
// Ngjarjet dhe numrat ditore NUK fshihen bashke me provat (1 jave): mbahen 13 muaj.
//
//   Hyrje e re = hera e pare qe nje shfletues hap faqen; Vizite perseri = hapje e re e faqes nga i njejti shfletues pas me shume se 30 minutash.
//   Rikthim = dikush jep perseri nje domain qe e ka perdorur proven falas (shpreson ta marre perseri falas).
//   B2B/B2C te Sinjalet: sipas studimit me AI; ngjarjet para studimit marrin llojin e kerkimit (ose te domainit te dhene perseri) te te njejtit vizitor.
//
// Rruget e admin-it: GET /api/admin/pxse/analitika/email?nga&deri      GET /api/admin/pxse/analitika/sinjale?nga&deri&tipi=b2b|b2c|
//                    GET /api/admin/pxse/analitika/bizneset?nga=email|sinjale   GET /api/admin/pxse/analitika/biznes/:id
const PXAN_ZONA = 'Europe/Berlin';
const PXAN_FAQJA = ['vizite', 'klik_x', 'klik_hyr', 'klik_studio', 'klik_sinjale', 'klik_postim'];
const PXAN_BURIMET = ['reddit', 'ih', 'hn', 'se', 'alerts'];

const pxanData = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null;
const pxanSot = () => new Intl.DateTimeFormat('en-CA', { timeZone: PXAN_ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function pxanDitet(nga, deri) {
  const l = []; const d = new Date(nga + 'T12:00:00Z'), f = new Date(deri + 'T12:00:00Z');
  while (d <= f && l.length < 400) { l.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return l;
}
function pxanPeriudha(q) {
  const sot = pxanSot();
  let nga = pxanData(q.nga) || sot, deri = pxanData(q.deri) || nga;
  if (deri < nga) [nga, deri] = [deri, nga];
  const ditet = pxanDitet(nga, deri);
  return { sot, nga, deri, ditet, njeDite: ditet.length === 1, pikat: ditet.length === 1 ? Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' : '') + i) : ditet };
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_ngjarjet (
      id BIGSERIAL PRIMARY KEY,
      lloji TEXT NOT NULL,   -- hyrje_e_re | vizite_perseri | klik_x | klik_hyr | klik_studio | klik_sinjale | klik_postim | login | rikthim_domain
                             -- | studim_email | studim_sinjale | sinjale_marre | email_planifikuar | email_derguar
      nga TEXT,              -- 'email' | 'sinjale' (seksioni)
      seanca TEXT,
      biznes_id INT,
      koha TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await pool.query('ALTER TABLE pxse_ngjarjet ADD COLUMN IF NOT EXISTS tipi TEXT');               // 'b2b' | 'b2c' (Sinjalet)
    await pool.query('ALTER TABLE pxse_ngjarjet ADD COLUMN IF NOT EXISTS burimi TEXT');             // per "Open post": reddit | ih | hn | se | alerts
    await pool.query('ALTER TABLE pxse_ngjarjet ADD COLUMN IF NOT EXISTS n INT NOT NULL DEFAULT 1'); // p.sh. sa sinjale u dhane ne nje kerkim
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_ngj_koha ON pxse_ngjarjet (koha, lloji)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_ngj_seanca ON pxse_ngjarjet (seanca)');
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_vizitoret (
      seanca TEXT PRIMARY KEY,
      pare_at TIMESTAMPTZ DEFAULT now(),
      fundit_at TIMESTAMPTZ DEFAULT now(),
      hyrje INT NOT NULL DEFAULT 1
    )`);
    // Numrat ditore te burimeve (rezultate te gjetura, kredite Serper, kerkime); per Alerts edhe kategoria.
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_burimet_ditore (
      dita DATE NOT NULL,
      burimi TEXT NOT NULL,          -- reddit | ih | hn | se | alerts
      tipi TEXT NOT NULL DEFAULT '', -- b2b | b2c | '' (pa lloj)
      kategoria TEXT NOT NULL DEFAULT '',
      kerkime INT NOT NULL DEFAULT 0,
      rezultate INT NOT NULL DEFAULT 0,
      kredite INT NOT NULL DEFAULT 0,
      PRIMARY KEY (dita, burimi, tipi, kategoria)
    )`);
  })().catch(e => console.error('pxse-admin-analitika migrim:', e.message));
  setInterval(() => {
    pool.query("DELETE FROM pxse_ngjarjet WHERE koha < now() - interval '13 months'").catch(() => {});
    pool.query("DELETE FROM pxse_vizitoret WHERE fundit_at < now() - interval '13 months'").catch(() => {});
    pool.query("DELETE FROM pxse_burimet_ditore WHERE dita < (now() - interval '13 months')::date").catch(() => {});
  }, 24 * 3600 * 1000).unref();

  // ---------- Ngjarjet nga faqja publike ----------
  const kufiri = new Map(); // seanca|lloji -> numri sot (mbrojtje nga klikime pa fund)
  setInterval(() => kufiri.clear(), 24 * 3600 * 1000).unref();
  app.post('/api/pxse/ngjarje', async (req, res) => {
    const b = req.body || {};
    const seanca = String(b.seanca || ''), lloji = String(b.lloji || ''), nga = b.nga === 'sinjale' ? 'sinjale' : 'email';
    const burimi = PXAN_BURIMET.includes(b.burimi) ? b.burimi : null;
    if (!/^[a-f0-9]{32}$/.test(seanca) || !PXAN_FAQJA.includes(lloji)) return res.status(400).json({ ok: false });
    const k = seanca + '|' + lloji, n = (kufiri.get(k) || 0) + 1; kufiri.set(k, n);
    if (n > (lloji === 'klik_postim' ? 200 : 30)) return res.json({ ok: true });
    try {
      if (lloji === 'vizite') {
        const r = await pool.query(`INSERT INTO pxse_vizitoret (seanca) VALUES ($1)
          ON CONFLICT (seanca) DO UPDATE SET fundit_at = now(), hyrje = pxse_vizitoret.hyrje + CASE WHEN pxse_vizitoret.fundit_at < now() - interval '30 minutes' THEN 1 ELSE 0 END
          RETURNING (xmax = 0) AS iri`, [seanca]);
        if (r.rows[0].iri) await pool.query("INSERT INTO pxse_ngjarjet (lloji, seanca) VALUES ('hyrje_e_re', $1)", [seanca]);
        else {
          const prev = await pool.query("SELECT 1 FROM pxse_ngjarjet WHERE seanca=$1 AND lloji IN ('hyrje_e_re','rikthim','vizite_perseri') AND koha > now() - interval '30 minutes' LIMIT 1", [seanca]);
          if (!prev.rows.length) await pool.query("INSERT INTO pxse_ngjarjet (lloji, seanca) VALUES ('vizite_perseri', $1)", [seanca]);
        }
      } else {
        await pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, seanca, burimi) VALUES ($1,$2,$3,$4)', [lloji, nga, seanca, burimi]);
      }
      res.json({ ok: true });
    } catch (e) { res.json({ ok: false }); }
  });

  // Ngjarjet e periudhes, te grupuara; "tipi" = B2B/B2C i ngjarjes ose, kur mungon, i kerkimit te sinjaleve te te njejtit vizitor.
  async function pxanNgjarjet(p) {
    const ndarje = p.njeDite ? 'HH24' : 'YYYY-MM-DD';
    return (await pool.query(`WITH st AS (
        SELECT DISTINCT ON (seanca) seanca, tipi FROM pxse_ngjarjet WHERE lloji IN ('studim_sinjale','rikthim_domain') AND tipi IS NOT NULL ORDER BY seanca, koha DESC)
      SELECT to_char(e.koha AT TIME ZONE '${PXAN_ZONA}', 'YYYY-MM-DD') dita, to_char(e.koha AT TIME ZONE '${PXAN_ZONA}', '${ndarje}') pika,
        e.lloji, e.nga, COALESCE(e.tipi, st.tipi) tipi, SUM(e.n)::int n
      FROM pxse_ngjarjet e LEFT JOIN st ON st.seanca = e.seanca
      WHERE (e.koha AT TIME ZONE '${PXAN_ZONA}')::date BETWEEN $1::date AND $2::date
      GROUP BY 1,2,3,4,5`, [p.nga, p.deri])).rows;
  }
  // Llogarite nga prova (seksioni "nga") qe kane sot snippet aktiv, sipas dites se lidhjes
  async function pxanSnippet(p, ngaSeksioni) {
    try {
      return (await pool.query(`WITH st AS (
          SELECT DISTINCT ON (seanca) seanca, tipi FROM pxse_ngjarjet WHERE lloji IN ('studim_sinjale','rikthim_domain') AND tipi IS NOT NULL ORDER BY seanca, koha DESC)
        SELECT to_char(l.lidhur_at AT TIME ZONE '${PXAN_ZONA}', 'YYYY-MM-DD') dita, st.tipi, COUNT(DISTINCT l.biznes_id)::int n
        FROM pxse_seanca_llogaria l JOIN snippetet s ON s.biznes_id = l.biznes_id AND s.snippet_active = true AND COALESCE(s.pauzuar, false) = false
        LEFT JOIN st ON st.seanca = l.seanca
        WHERE l.nga = $3 AND (l.lidhur_at AT TIME ZONE '${PXAN_ZONA}')::date BETWEEN $1::date AND $2::date GROUP BY 1,2`, [p.nga, p.deri, ngaSeksioni])).rows;
    } catch (e) { return []; }
  }
  const pxanSeri = (p, harta) => p.pikat.map(x => ({ pika: x, vlera: harta[x] || 0 }));

  // ---------- Admin: Email-et ----------
  const KOLONAT = ['derguar', 'klik_x', 'klik_hyr', 'login', 'snippet', 'email_dergues', 'rikthim', 'hyrje_e_re', 'klik_studio', 'prova'];
  app.get('/api/admin/pxse/analitika/email', iAdmin, async (req, res) => {
    try {
      const p = pxanPeriudha(req.query);
      const rows = await pxanNgjarjet(p), snip = await pxanSnippet(p, 'email');
      const bosh = () => ({ derguar: 0, klik_x: 0, klik_hyr: 0, login: 0, snippet: 0, email_dergues: null, rikthim: 0, hyrje_e_re: 0, klik_studio: 0, prova: 0 });
      const sipasDites = {}; p.ditet.forEach(d => { sipasDites[d] = bosh(); });
      const kubat = { hyrje: {}, hyrje_e_re: {}, login: {}, rikthim: {} };
      rows.forEach(r => {
        const x = sipasDites[r.dita]; if (!x) return;
        if (r.lloji === 'email_derguar') x.derguar += r.n;
        if (r.lloji === 'klik_x') x.klik_x += r.n;
        if (r.lloji === 'klik_hyr' && r.nga !== 'sinjale') x.klik_hyr += r.n;
        if (r.lloji === 'login' && r.nga !== 'sinjale') x.login += r.n;
        if (r.lloji === 'rikthim_domain' && r.nga !== 'sinjale') x.rikthim += r.n;
        if (r.lloji === 'hyrje_e_re') x.hyrje_e_re += r.n;
        if (r.lloji === 'studim_email') x.prova += r.n;
        if (r.lloji === 'klik_studio') x.klik_studio += r.n;
        const shto = (k, v) => { kubat[k][r.pika] = (kubat[k][r.pika] || 0) + v; };
        if (r.lloji === 'hyrje_e_re' || r.lloji === 'rikthim' || r.lloji === 'vizite_perseri') shto('hyrje', r.n);
        if (r.lloji === 'hyrje_e_re') shto('hyrje_e_re', r.n);
        if (r.lloji === 'rikthim_domain' && r.nga !== 'sinjale') shto('rikthim', r.n);
        if (r.lloji === 'login') shto('login', r.n);
      });
      snip.forEach(r => { if (sipasDites[r.dita]) sipasDites[r.dita].snippet += r.n; });
      const gjithsej = bosh();
      Object.values(sipasDites).forEach(x => KOLONAT.forEach(k => { if (k !== 'email_dergues') gjithsej[k] += x[k]; }));
      const seri = {}; Object.keys(kubat).forEach(k => { seri[k] = pxanSeri(p, kubat[k]); });
      const shuma = k => seri[k].reduce((a, b) => a + b.vlera, 0);
      res.json({ ok: true, nga: p.nga, deri: p.deri, sot: p.sot, kolonat: KOLONAT, ditet: p.ditet.map(d => Object.assign({ dita: d }, sipasDites[d])), gjithsej,
        kubat: { hyrje: shuma('hyrje'), hyrje_e_re: shuma('hyrje_e_re'), login: shuma('login'), rikthim: shuma('rikthim') },
        ndarje: p.njeDite ? 'ora' : 'dita', seri });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ---------- Admin: Sinjalet (B2B / B2C / te gjitha) ----------
  const KOLONAT_SJ = ['klik_sinjale', 'studim', 'rikthim', 'klik_hyr', 'login', 'snippet', 'sinjale_marre', 'klik_postim', 'hyrje_e_re', 'hyrje'];
  app.get('/api/admin/pxse/analitika/sinjale', iAdmin, async (req, res) => {
    try {
      const p = pxanPeriudha(req.query);
      const tipi = req.query.tipi === 'b2b' || req.query.tipi === 'b2c' ? req.query.tipi : '';
      const perTipin = t => !tipi || t === tipi;
      const rows = (await pxanNgjarjet(p)).filter(r => perTipin(r.tipi));
      const snip = (await pxanSnippet(p, 'sinjale')).filter(r => perTipin(r.tipi));
      const bosh = () => ({ klik_sinjale: 0, studim: 0, rikthim: 0, klik_hyr: 0, login: 0, snippet: 0, sinjale_marre: 0, klik_postim: 0, hyrje_e_re: 0, hyrje: 0 });
      const sipasDites = {}; p.ditet.forEach(d => { sipasDites[d] = bosh(); });
      rows.forEach(r => {
        const x = sipasDites[r.dita]; if (!x) return;
        if (r.lloji === 'klik_sinjale') x.klik_sinjale += r.n;
        if (r.lloji === 'studim_sinjale') x.studim += r.n;
        if (r.lloji === 'rikthim_domain' && r.nga === 'sinjale') x.rikthim += r.n;
        if (r.lloji === 'klik_hyr' && r.nga === 'sinjale') x.klik_hyr += r.n;
        if (r.lloji === 'login' && r.nga === 'sinjale') x.login += r.n;
        if (r.lloji === 'sinjale_marre') x.sinjale_marre += r.n;
        if (r.lloji === 'klik_postim') x.klik_postim += r.n;
        if (r.lloji === 'hyrje_e_re') x.hyrje_e_re += r.n;
        if (r.lloji === 'hyrje_e_re' || r.lloji === 'rikthim' || r.lloji === 'vizite_perseri') x.hyrje += r.n;
      });
      snip.forEach(r => { if (sipasDites[r.dita]) sipasDites[r.dita].snippet += r.n; });
      const gjithsej = bosh();
      Object.values(sipasDites).forEach(x => KOLONAT_SJ.forEach(k => { gjithsej[k] += x[k]; }));

      // Burimet: rezultate dhe kredite sipas dites (ose ores, kur periudha eshte nje dite: vetem totali i dites)
      const b = (await pool.query(`SELECT to_char(dita, 'YYYY-MM-DD') dita, burimi, tipi, kategoria, SUM(kerkime)::int kerkime, SUM(rezultate)::int rezultate, SUM(kredite)::int kredite
        FROM pxse_burimet_ditore WHERE dita BETWEEN $1::date AND $2::date GROUP BY 1,2,3,4`, [p.nga, p.deri])).rows
        .filter(r => !tipi || r.tipi === tipi);
      const burimet = {};
      PXAN_BURIMET.forEach(k => { burimet[k] = { rezultate: 0, kredite: 0, kerkime: 0, seri: {}, seriKredite: {} }; });
      b.forEach(r => {
        const x = burimet[r.burimi]; if (!x) return;
        x.rezultate += r.rezultate; x.kredite += r.kredite; x.kerkime += r.kerkime;
        x.seri[r.dita] = (x.seri[r.dita] || 0) + r.rezultate; x.seriKredite[r.dita] = (x.seriKredite[r.dita] || 0) + r.kredite;
      });
      const ditetSeri = p.ditet; // burimet ruhen sipas dites
      Object.values(burimet).forEach(x => {
        x.seri = ditetSeri.map(d => ({ pika: d, vlera: x.seri[d] || 0 }));
        x.seriKredite = ditetSeri.map(d => ({ pika: d, vlera: x.seriKredite[d] || 0 }));
      });
      // Google Alerts: alertet e lidhura (B2B/B2C, kategorite) dhe sinjalet e periudhes sipas kategorise
      let alertet = { lidhur: 0, b2b: 0, b2c: 0, pa_kategori: 0, kategorite: [] };
      try {
        const f = (await pool.query(`SELECT COALESCE(kategoria,'') kategoria, COALESCE(lloji,'') lloji, COUNT(*)::int feed FROM pxse_alertet_feedet WHERE aktiv GROUP BY 1,2`)).rows;
        const sinj = {}; b.filter(r => r.burimi === 'alerts').forEach(r => { sinj[r.kategoria] = (sinj[r.kategoria] || 0) + r.rezultate; });
        const kat = {};
        f.forEach(r => {
          alertet.lidhur += r.feed;
          if (!r.kategoria) { alertet.pa_kategori += r.feed; return; }
          if (r.lloji === 'b2b') alertet.b2b += r.feed; if (r.lloji === 'b2c') alertet.b2c += r.feed;
          if (tipi && r.lloji !== tipi) return;
          kat[r.kategoria] = kat[r.kategoria] || { kategoria: r.kategoria, lloji: r.lloji, alerte: 0, sinjale: 0 };
          kat[r.kategoria].alerte += r.feed;
        });
        Object.keys(sinj).forEach(k => { if (k && kat[k]) kat[k].sinjale = sinj[k]; });
        alertet.kategorite = Object.values(kat).sort((x, y) => y.sinjale - x.sinjale || y.alerte - x.alerte || x.kategoria.localeCompare(y.kategoria));
      } catch (e) {}
      res.json({ ok: true, nga: p.nga, deri: p.deri, tipi, kolonat: KOLONAT_SJ, ditet: p.ditet.map(d => Object.assign({ dita: d }, sipasDites[d])), gjithsej, burimet, alertet });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ---------- Bizneset e regjistruara nga sherbimet falas ----------
  app.get('/api/admin/pxse/analitika/bizneset', iAdmin, async (req, res) => {
    try {
      const nga = req.query.nga === 'sinjale' ? 'sinjale' : (req.query.nga === 'email' ? 'email' : '');
      const r = await pool.query(`SELECT DISTINCT ON (b.id) b.id, b.emri, b.email, l.domaini, l.nga, l.lidhur_at
        FROM pxse_seanca_llogaria l JOIN bizneset b ON b.id = l.biznes_id
        WHERE ($1 = '' OR l.nga = $1) ORDER BY b.id, l.lidhur_at DESC`, [nga]);
      res.json({ ok: true, bizneset: r.rows.sort((x, y) => new Date(y.lidhur_at) - new Date(x.lidhur_at)).slice(0, 400) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/admin/pxse/analitika/biznes/:id', iAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!(id > 0)) return res.status(400).json({ error: 'id' });
    try {
      const b = await pool.query('SELECT id, emri, email, created_at FROM bizneset WHERE id=$1', [id]);
      if (!b.rows.length) return res.status(404).json({ error: 'Nuk u gjet.' });
      const l = await pool.query('SELECT seanca, domaini, nga, lidhur_at FROM pxse_seanca_llogaria WHERE biznes_id=$1 ORDER BY lidhur_at', [id]);
      const seancat = l.rows.map(x => x.seanca);
      const ngj = await pool.query(`SELECT lloji, SUM(n)::int n FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) OR biznes_id = $2 GROUP BY 1`, [seancat, id]);
      const n = {}; ngj.rows.forEach(x => { n[x.lloji] = x.n; });
      const tipi = (await pool.query(`SELECT tipi FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) AND lloji IN ('studim_sinjale','rikthim_domain') AND tipi IS NOT NULL ORDER BY koha DESC LIMIT 1`, [seancat])).rows;
      // Sipas dites: hyrjet, sinjalet e marra, klikimet e postimeve
      const ditore = (await pool.query(`SELECT to_char(koha AT TIME ZONE '${PXAN_ZONA}', 'YYYY-MM-DD') dita,
          SUM(n) FILTER (WHERE lloji IN ('hyrje_e_re','vizite_perseri','rikthim'))::int hyrje,
          SUM(n) FILTER (WHERE lloji = 'sinjale_marre')::int sinjale,
          SUM(n) FILTER (WHERE lloji = 'klik_postim')::int klikime
        FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) OR biznes_id = $2 GROUP BY 1 ORDER BY 1 DESC LIMIT 60`, [seancat, id])).rows;
      // Aktivitetet e fundit (me ore)
      const aktivitetet = (await pool.query(`SELECT lloji, nga, burimi, n, koha FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) OR biznes_id = $2 ORDER BY koha DESC LIMIT 60`, [seancat, id])).rows;
      let snippet = null;
      try { const s = await pool.query('SELECT bool_or(snippet_active AND NOT COALESCE(pauzuar,false)) aktiv, COUNT(*)::int numri FROM snippetet WHERE biznes_id=$1', [id]); snippet = s.rows[0]; } catch (e) {}
      let dergimet = null;
      try { const d = await pool.query("SELECT statusi, COUNT(*)::int n FROM pxse_dergimet WHERE biznes_id=$1 OR seanca = ANY($2::text[]) GROUP BY 1", [id, seancat]); dergimet = d.rows; } catch (e) {}
      res.json({ ok: true, biznesi: b.rows[0], tipi: tipi.length ? tipi[0].tipi : null, provat: l.rows.map(x => ({ domaini: x.domaini, nga: x.nga, lidhur_at: x.lidhur_at })),
        ngjarjet: n, ditore, aktivitetet, snippet, dergimet });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ---------- Provat falas: aktive (te dhenat ende ruhen) dhe te skaduara (ka mbetur vetem domaini) ----------
  // ?sherbimi=email|sinjale. Prova pa login fshihet 7 dite pas krijimit; te email-et, 7 dite pas email-it te fundit.
  app.get('/api/admin/pxse/analitika/provat', iAdmin, async (req, res) => {
    try {
      const sherbimi = req.query.sherbimi === 'sinjale' ? 'sinjale' : 'email';
      const r = (await pool.query(`SELECT DISTINCT ON (r.domaini, r.seanca) r.id, r.seanca, r.domaini, r.te_dhenat, r.krijuar_at, r.biznes_id,
          l.biznes_id AS lidhur_biznes, l.lidhur_at, b.emri AS b_emri, b.email AS b_email
        FROM pxse_prova_rezultate r
        LEFT JOIN pxse_seanca_llogaria l ON l.seanca = r.seanca
        LEFT JOIN bizneset b ON b.id = COALESCE(r.biznes_id, l.biznes_id)
        WHERE r.sherbimi = $1 ORDER BY r.domaini, r.seanca, r.id DESC`, [sherbimi])).rows;
      const seancat = Array.from(new Set(r.map(x => x.seanca)));
      // Ngjarjet e ketyre vizitoreve (hyrjet, klikimet)
      const ngj = {};
      if (seancat.length) {
        (await pool.query(`SELECT seanca, lloji, nga, burimi, SUM(n)::int n FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) GROUP BY 1,2,3,4`, [seancat])).rows.forEach(x => {
          const o = ngj[x.seanca] = ngj[x.seanca] || { hyrje: 0, klik_hyr: 0, klik_postim: 0, klikime_burimi: {}, rikthime: 0 };
          if (['hyrje_e_re', 'vizite_perseri', 'rikthim'].includes(x.lloji)) o.hyrje += x.n;
          if (x.lloji === 'klik_hyr' && x.nga === sherbimi) o.klik_hyr += x.n;
          if (x.lloji === 'rikthim_domain' && x.nga === sherbimi) o.rikthime += x.n;
          if (x.lloji === 'klik_postim') { o.klik_postim += x.n; const k = x.burimi || '?'; o.klikime_burimi[k] = (o.klikime_burimi[k] || 0) + x.n; }
        });
      }
      // Email-et e provave (vetem per menune Email-et)
      const derg = {};
      if (sherbimi === 'email' && seancat.length) {
        try {
          (await pool.query(`SELECT domaini_derguesit d, seanca, COUNT(*)::int gjithsej,
              COUNT(*) FILTER (WHERE statusi IN ('ne_radhe','duke'))::int ne_radhe, COUNT(*) FILTER (WHERE statusi='derguar')::int derguar,
              COUNT(*) FILTER (WHERE statusi='deshtoi')::int deshtoi, COUNT(*) FILTER (WHERE hapur_at IS NOT NULL)::int hapur,
              COUNT(*) FILTER (WHERE klikuar_at IS NOT NULL)::int klikuar, COUNT(*) FILTER (WHERE cregj_at IS NOT NULL)::int cregj,
              MAX(COALESCE(derguar_at, ora)) fundit
            FROM pxse_dergimet WHERE seanca = ANY($1::text[]) GROUP BY 1,2`, [seancat])).rows.forEach(x => { derg[x.d + '|' + x.seanca] = x; });
        } catch (e) {}
      }
      const DITE = 7 * 86400000;
      const aktive = r.map(x => {
        const t = x.te_dhenat || {}, n = ngj[x.seanca] || { hyrje: 0, klik_hyr: 0, klik_postim: 0, klikime_burimi: {}, rikthime: 0 };
        const loguar = !!(x.biznes_id || x.lidhur_biznes);
        let fshihet = null;
        if (!loguar) {
          let f = new Date(x.krijuar_at).getTime() + DITE;
          const d = derg[x.domaini + '|' + x.seanca];
          if (d && d.fundit) f = Math.max(f, new Date(d.fundit).getTime() + DITE);
          fshihet = new Date(f).toISOString();
        }
        const o = { domaini: x.domaini, krijuar_at: x.krijuar_at, loguar, biznesi: loguar ? { emri: x.b_emri, email: x.b_email, lidhur_at: x.lidhur_at } : null,
          fshihet, hyrje: n.hyrje, klik_hyr: n.klik_hyr, rikthime: n.rikthime };
        if (sherbimi === 'email') {
          o.email = derg[x.domaini + '|' + x.seanca] || { gjithsej: 0, ne_radhe: 0, derguar: 0, deshtoi: 0, hapur: 0, klikuar: 0, cregj: 0 };
          o.subjekti = t.subjekti || '';
        } else {
          const st = { saved: 0, replied: 0, rejected: 0 }; Object.values(t.statuset || {}).forEach(v => { if (st[v] !== undefined) st[v]++; });
          o.lloji = t.lloji || null; o.burimet = t.burimet || {}; o.gjetur = t.numri || 0; o.dhene = (t.rezultatet || []).length;
          o.alertet_kategorite = t.alertet_kategorite || []; o.statuset = st; o.pergjigje_ai = t.pergjigje_numri || 0;
          o.klik_postim = n.klik_postim; o.klikime_burimi = n.klikime_burimi;
        }
        return o;
      }).sort((a, b) => new Date(b.krijuar_at) - new Date(a.krijuar_at)).slice(0, 400);
      // Te skaduarat: domaini mbetet "i perdorur", por te dhenat e proves jane fshire
      const skaduara = (await pool.query(`SELECT d.domaini, d.perdorur_at FROM pxse_prova_domaine d
        WHERE d.sherbimi = $1 AND NOT EXISTS (SELECT 1 FROM pxse_prova_rezultate r WHERE r.domaini = d.domaini AND r.sherbimi = d.sherbimi)
        ORDER BY d.perdorur_at DESC LIMIT 400`, [sherbimi])).rows;
      res.json({ ok: true, sherbimi, aktive, skaduara });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
