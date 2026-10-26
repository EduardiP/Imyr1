// pxse-admin-analitika.js (PhronexusAI) — analitika e sherbimeve falas (Email-et; Sinjalet me vone) per admin-in.
// Server.js e therret: require('./pxse-admin-analitika')(app, pool, iAdmin);
//
// Ngjarjet ruhen te pxse_ngjarjet (pa te dhena personale: lloji, nga cili seksion, kodi i rastesishem i provës, koha).
// Disa vijne nga faqja publike (POST /api/pxse/ngjarje): hyrja ne faqe, klikimi i ✕ te stickerit, klikimi i "Sign in".
// Te tjerat i shkruajne vete pxse-prova.js, pxse-dergimi.js dhe pxse-sinjalet.js: studimi, login-i, email-et e planifikuara/derguara.
// Ngjarjet NUK fshihen bashke me provat (1 jave): mbahen 13 muaj, qe numrat e kaluar te mbeten.
//
//   Hyrje e re = hera e pare qe nje shfletues hap faqen; Rikthim = hapje e re e faqes nga i njejti shfletues, pas me shume se 30 minutash.
//
// Rruget e admin-it: GET /api/admin/pxse/analitika/email?nga=YYYY-MM-DD&deri=YYYY-MM-DD
//                    GET /api/admin/pxse/analitika/bizneset   GET /api/admin/pxse/analitika/biznes/:id
const PXAN_ZONA = 'Europe/Berlin';
const PXAN_FAQJA = ['vizite', 'klik_x', 'klik_hyr'];

const pxanData = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null;
const pxanSot = () => new Intl.DateTimeFormat('en-CA', { timeZone: PXAN_ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function pxanDitet(nga, deri) {
  const l = []; const d = new Date(nga + 'T12:00:00Z'), f = new Date(deri + 'T12:00:00Z');
  while (d <= f && l.length < 400) { l.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return l;
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_ngjarjet (
      id BIGSERIAL PRIMARY KEY,
      lloji TEXT NOT NULL,   -- hyrje_e_re | rikthim | klik_x | klik_hyr | login | studim_email | studim_sinjale | email_planifikuar | email_derguar
      nga TEXT,              -- 'email' | 'sinjale' (seksioni)
      seanca TEXT,
      biznes_id INT,
      koha TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_ngj_koha ON pxse_ngjarjet (koha, lloji)');
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_vizitoret (
      seanca TEXT PRIMARY KEY,
      pare_at TIMESTAMPTZ DEFAULT now(),
      fundit_at TIMESTAMPTZ DEFAULT now(),
      hyrje INT NOT NULL DEFAULT 1
    )`);
  })().catch(e => console.error('pxse-admin-analitika migrim:', e.message));
  setInterval(() => {
    pool.query("DELETE FROM pxse_ngjarjet WHERE koha < now() - interval '13 months'").catch(() => {});
    pool.query("DELETE FROM pxse_vizitoret WHERE fundit_at < now() - interval '13 months'").catch(() => {});
  }, 24 * 3600 * 1000).unref();

  // ---------- Ngjarjet nga faqja publike ----------
  const kufiri = new Map(); // seanca|lloji -> numri sot (mbrojtje nga klikime pa fund)
  setInterval(() => kufiri.clear(), 24 * 3600 * 1000).unref();
  app.post('/api/pxse/ngjarje', async (req, res) => {
    const b = req.body || {};
    const seanca = String(b.seanca || ''), lloji = String(b.lloji || ''), nga = b.nga === 'sinjale' ? 'sinjale' : 'email';
    if (!/^[a-f0-9]{32}$/.test(seanca) || !PXAN_FAQJA.includes(lloji)) return res.status(400).json({ ok: false });
    const k = seanca + '|' + lloji, n = (kufiri.get(k) || 0) + 1; kufiri.set(k, n);
    if (n > 30) return res.json({ ok: true });
    try {
      if (lloji === 'vizite') {
        // E re apo rikthim: rikthim = hapje e faqes pas me shume se 30 minutash nga hera e fundit
        const r = await pool.query(`INSERT INTO pxse_vizitoret (seanca) VALUES ($1)
          ON CONFLICT (seanca) DO UPDATE SET fundit_at = now(), hyrje = pxse_vizitoret.hyrje + CASE WHEN pxse_vizitoret.fundit_at < now() - interval '30 minutes' THEN 1 ELSE 0 END
          RETURNING (xmax = 0) AS iri`, [seanca]);
        const x = r.rows[0];
        if (x.iri) await pool.query("INSERT INTO pxse_ngjarjet (lloji, seanca) VALUES ('hyrje_e_re', $1)", [seanca]);
        else {
          const prev = await pool.query("SELECT 1 FROM pxse_ngjarjet WHERE seanca=$1 AND lloji IN ('hyrje_e_re','rikthim') AND koha > now() - interval '30 minutes' LIMIT 1", [seanca]);
          if (!prev.rows.length) await pool.query("INSERT INTO pxse_ngjarjet (lloji, seanca) VALUES ('rikthim', $1)", [seanca]);
        }
      } else {
        await pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, seanca) VALUES ($1,$2,$3)', [lloji, nga, seanca]);
      }
      res.json({ ok: true });
    } catch (e) { res.json({ ok: false }); }
  });

  // ---------- Admin: Email-et ----------
  // Kolonat e tabeles (ne kete renditje)
  const KOLONAT = ['derguar', 'klik_x', 'klik_hyr', 'login', 'snippet', 'email_dergues', 'rikthim', 'hyrje_e_re', 'prova'];
  app.get('/api/admin/pxse/analitika/email', iAdmin, async (req, res) => {
    try {
      const sot = pxanSot();
      let nga = pxanData(req.query.nga) || sot, deri = pxanData(req.query.deri) || nga;
      if (deri < nga) [nga, deri] = [deri, nga];
      const ditet = pxanDitet(nga, deri);
      const kufijt = [nga, deri];
      const ndarje = ditet.length === 1 ? 'HH24' : 'YYYY-MM-DD'; // nje dite -> sipas oreve; disa dite -> sipas diteve
      const q = await pool.query(`SELECT to_char(koha AT TIME ZONE '${PXAN_ZONA}', 'YYYY-MM-DD') dita, to_char(koha AT TIME ZONE '${PXAN_ZONA}', '${ndarje}') pika, lloji, nga, COUNT(*)::int n
        FROM pxse_ngjarjet
        WHERE (koha AT TIME ZONE '${PXAN_ZONA}')::date BETWEEN $1::date AND $2::date
        GROUP BY 1,2,3,4`, kufijt);
      // Snippet: llogarite qe erdhen nga prova e email-eve ate dite dhe kane sot snippet aktiv (jo te pauzuar)
      let snip = [];
      try {
        snip = (await pool.query(`SELECT to_char(l.lidhur_at AT TIME ZONE '${PXAN_ZONA}', 'YYYY-MM-DD') dita, COUNT(DISTINCT l.biznes_id)::int n
          FROM pxse_seanca_llogaria l JOIN snippetet s ON s.biznes_id = l.biznes_id AND s.snippet_active = true AND COALESCE(s.pauzuar, false) = false
          WHERE l.nga = 'email' AND (l.lidhur_at AT TIME ZONE '${PXAN_ZONA}')::date BETWEEN $1::date AND $2::date GROUP BY 1`, kufijt)).rows;
      } catch (e) { snip = []; }
      const bosh = () => ({ derguar: 0, klik_x: 0, klik_hyr: 0, login: 0, snippet: 0, email_dergues: null, rikthim: 0, hyrje_e_re: 0, prova: 0 });
      const sipasDites = {}; ditet.forEach(d => { sipasDites[d] = bosh(); });
      const kubat = { hyrje: {}, hyrje_e_re: {}, login: {}, rikthim: {} };
      q.rows.forEach(r => {
        const x = sipasDites[r.dita]; if (!x) return;
        if (r.lloji === 'email_derguar') x.derguar += r.n;
        if (r.lloji === 'klik_x') x.klik_x += r.n;
        if (r.lloji === 'klik_hyr' && r.nga !== 'sinjale') x.klik_hyr += r.n;
        if (r.lloji === 'login' && r.nga !== 'sinjale') x.login += r.n;
        if (r.lloji === 'rikthim') x.rikthim += r.n;
        if (r.lloji === 'hyrje_e_re') x.hyrje_e_re += r.n;
        if (r.lloji === 'studim_email') x.prova += r.n;
        const shto = (k, v) => { kubat[k][r.pika] = (kubat[k][r.pika] || 0) + v; };
        if (r.lloji === 'hyrje_e_re' || r.lloji === 'rikthim') shto('hyrje', r.n);
        if (r.lloji === 'hyrje_e_re') shto('hyrje_e_re', r.n);
        if (r.lloji === 'rikthim') shto('rikthim', r.n);
        if (r.lloji === 'login') shto('login', r.n); // login-et nga i gjithe seksioni falas
      });
      snip.forEach(r => { if (sipasDites[r.dita]) sipasDites[r.dita].snippet = r.n; });
      const gjithsej = bosh();
      Object.values(sipasDites).forEach(x => KOLONAT.forEach(k => { if (k !== 'email_dergues') gjithsej[k] += x[k]; }));
      // Seria e grafikut per cdo kub: cdo ore (nje dite) ose cdo dite (periudhe)
      const pikat = ditet.length === 1 ? Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' : '') + i) : ditet;
      const seri = {}; Object.keys(kubat).forEach(k => { seri[k] = pikat.map(p => ({ pika: p, vlera: kubat[k][p] || 0 })); });
      const shuma = k => seri[k].reduce((a, b) => a + b.vlera, 0);
      res.json({ ok: true, nga, deri, sot, kolonat: KOLONAT, ditet: ditet.map(d => Object.assign({ dita: d }, sipasDites[d])), gjithsej,
        kubat: { hyrje: shuma('hyrje'), hyrje_e_re: shuma('hyrje_e_re'), login: shuma('login'), rikthim: shuma('rikthim') },
        ndarje: ditet.length === 1 ? 'ora' : 'dita', seri });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Bizneset e regjistruara nga sherbimet falas (prova e lidhur me nje llogari)
  app.get('/api/admin/pxse/analitika/bizneset', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT b.id, b.emri, b.email, l.domaini, l.nga, l.lidhur_at
        FROM pxse_seanca_llogaria l JOIN bizneset b ON b.id = l.biznes_id
        ORDER BY l.lidhur_at DESC LIMIT 400`);
      res.json({ ok: true, bizneset: r.rows });
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
      const ngj = await pool.query(`SELECT lloji, COUNT(*)::int n FROM pxse_ngjarjet WHERE seanca = ANY($1::text[]) OR biznes_id = $2 GROUP BY 1`, [seancat, id]);
      const n = {}; ngj.rows.forEach(x => { n[x.lloji] = x.n; });
      let snippet = null;
      try { const s = await pool.query('SELECT bool_or(snippet_active AND NOT COALESCE(pauzuar,false)) aktiv, COUNT(*)::int numri FROM snippetet WHERE biznes_id=$1', [id]); snippet = s.rows[0]; } catch (e) {}
      let dergimet = null;
      try { const d = await pool.query("SELECT statusi, COUNT(*)::int n FROM pxse_dergimet WHERE biznes_id=$1 OR seanca = ANY($2::text[]) GROUP BY 1", [id, seancat]); dergimet = d.rows; } catch (e) {}
      res.json({ ok: true, biznesi: b.rows[0], provat: l.rows.map(x => ({ domaini: x.domaini, nga: x.nga, lidhur_at: x.lidhur_at })),
        ngjarjet: n, snippet, dergimet });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
