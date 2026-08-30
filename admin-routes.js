// admin-routes.js — endpoint-e SHTESE per admin panelin (te ndara nga server.js)
// Server.js e therret me nje rresht: require('./admin-routes')(app, pool, iAdmin);
// Nuk prek asnje endpoint te klienteve realë.

module.exports = function (app, pool, iAdmin, kombinimi) {

  // --- Bizneset "gati per kombinim": kane plotesuar 3 pikat (biznesi + pershkrimi + lidhja) ---
  // biznesi = website && tipi ; pershkrimi = permbledhje||pershkrimi ; lidhja = snippet_active
  app.get('/api/admin/kombinim/bizneset', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, emri, tipi, logo_url
         FROM bizneset
         WHERE website IS NOT NULL AND tipi IS NOT NULL
           AND (permbledhje IS NOT NULL OR pershkrimi IS NOT NULL)
           AND snippet_active = true
         ORDER BY emri ASC`);
      res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- Vleresimi i nje cifti (te dy drejtimet): a→b dhe b→a ---
  // Lexon nga tabela `perputhjet` nese ekziston; perndryshe kthen null (skori s'eshte ndertuar ende).
  app.get('/api/admin/kombinim/cift', iAdmin, async (req, res) => {
    const a = parseInt(req.query.a, 10);
    const b = parseInt(req.query.b, 10);
    if (!a || !b || a === b) return res.status(400).json({ error: 'Zgjidh dy biznese te ndryshme.' });
    try {
      const bz = await pool.query('SELECT id, emri, tipi FROM bizneset WHERE id = ANY($1)', [[a, b]]);
      const map = {}; bz.rows.forEach(x => map[x.id] = x);
      if (!map[a] || !map[b]) return res.status(404).json({ error: 'Biznesi s\'u gjet.' });

      // Skori (nese tabela perputhjet ekziston). Ndryshe: null.
      let ab = null, ba = null;
      try {
        const q = await pool.query(
          'SELECT reklamues_id, host_id, skori FROM perputhjet WHERE (reklamues_id=$1 AND host_id=$2) OR (reklamues_id=$2 AND host_id=$1)',
          [a, b]);
        q.rows.forEach(row => {
          if (row.reklamues_id === a && row.host_id === b) ab = row.skori;
          if (row.reklamues_id === b && row.host_id === a) ba = row.skori;
        });
      } catch (e) { /* tabela perputhjet s'ekziston ende → vlerat mbeten null */ }

      res.json({
        a: { id: map[a].id, emri: map[a].emri, tipi: map[a].tipi },
        b: { id: map[b].id, emri: map[b].emri, tipi: map[b].tipi },
        a_per_b: ab,   // sa eshte A plotesues per B (null = ende s'eshte llogaritur)
        b_per_a: ba    // sa eshte B plotesues per A
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- Nis kombinimin per te gjitha bizneset gati (per ekzistueset, nje here) ---
  app.post('/api/admin/kombinim/nis', iAdmin, async (req, res) => {
    if (!kombinimi) return res.status(500).json({ error: 'Moduli i kombinimit s\'eshte i disponueshem.' });
    try {
      const r = await pool.query(
        `SELECT id FROM bizneset
         WHERE tipi IS NOT NULL AND snippet_active = true
           AND (permbledhje IS NOT NULL OR pershkrimi IS NOT NULL)`);
      res.json({ ok: true, nisur: r.rows.length });
      (async () => {
        for (const row of r.rows) {
          try { await kombinimi.kombinoBiznesin(row.id); } catch (e) {}
        }
      })();
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- Ankandet e nje host-i: sa kerkesa, kush garoi, pesha, sa fitore ---
  app.get('/api/admin/ankandet/:id', iAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID e pavlefshme.' });
    try {
      const biz = await pool.query('SELECT emri FROM bizneset WHERE id=$1', [id]);
      if (!biz.rows.length) return res.status(404).json({ error: 'Biznesi nuk u gjet.' });

      // Snippet-et e ketij biznesi qe kane ankande
      const snipRows = await pool.query(
        `SELECT DISTINCT g.snippet_id, s.emri
         FROM garat g LEFT JOIN snippetet s ON s.id = g.snippet_id
         WHERE g.host_id=$1
         ORDER BY g.snippet_id NULLS FIRST`, [id]);

      const snippetet = [];
      for (const sr of snipRows.rows) {
        const snId = sr.snippet_id;
        const kushtSnip = snId == null ? 'g.snippet_id IS NULL' : 'g.snippet_id = ' + parseInt(snId,10);
        const kerkesa = await pool.query(
          `SELECT COUNT(*)::int n FROM garat g WHERE g.host_id=$1 AND g.fitoi=true AND ${kushtSnip}`, [id]);
        const kand = await pool.query(
          `SELECT s.reklamues_id, b.emri,
                  s.pesha, s.ai, s.profili, s.ndihma, s.ndihma_bruto,
                  COALESCE(f.fitore,0) AS fitore
           FROM (
             SELECT DISTINCT ON (reklamues_id)
                    reklamues_id, pesha, ai, profili, ndihma, ndihma_bruto
             FROM garat g WHERE g.host_id=$1 AND ${kushtSnip}
             ORDER BY reklamues_id, created_at DESC
           ) s
           LEFT JOIN (
             SELECT reklamues_id, COUNT(*) FILTER (WHERE fitoi)::int AS fitore
             FROM garat g WHERE g.host_id=$1 AND ${kushtSnip} GROUP BY reklamues_id
           ) f ON f.reklamues_id = s.reklamues_id
           LEFT JOIN bizneset b ON b.id = s.reklamues_id
           ORDER BY fitore DESC, s.pesha DESC`, [id]);
        snippetet.push({
          snippet_id: snId,
          emri: sr.emri || (snId == null ? 'Pa snippet (te vjetra)' : ('Snippet #' + snId)),
          kerkesa: kerkesa.rows[0].n,
          kandidatet: kand.rows
        });
      }

      // TREGUESI I PERGJITHSHEM: te gjithe snippet-et bashke (cikli i ankandit si pamje e vetme)
      const kerkGjith = await pool.query(
        `SELECT COUNT(*)::int n FROM garat WHERE host_id=$1 AND fitoi=true`, [id]);
      const kandGjith = await pool.query(
        `SELECT s.reklamues_id, b.emri,
                s.pesha, s.ai, s.profili, s.ndihma, s.ndihma_bruto,
                COALESCE(f.fitore,0) AS fitore
         FROM (
           SELECT DISTINCT ON (reklamues_id)
                  reklamues_id, pesha, ai, profili, ndihma, ndihma_bruto
           FROM garat WHERE host_id=$1
           ORDER BY reklamues_id, created_at DESC
         ) s
         LEFT JOIN (
           SELECT reklamues_id, COUNT(*) FILTER (WHERE fitoi)::int AS fitore
           FROM garat WHERE host_id=$1 GROUP BY reklamues_id
         ) f ON f.reklamues_id = s.reklamues_id
         LEFT JOIN bizneset b ON b.id = s.reklamues_id
         ORDER BY fitore DESC, s.pesha DESC`, [id]);

      res.json({
        emri: biz.rows[0].emri,
        pergjithshem: { kerkesa: kerkGjith.rows[0].n, kandidatet: kandGjith.rows },
        snippetet: snippetet
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- Lista e pritjes per "Teams & Roles" (regjistrimet e interesit) ---
  app.get('/api/admin/lista-pritjes', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT lp.id, lp.email, lp.krijuar_at, b.emri AS biznesi, b.logo_url
         FROM ekipi_lista_pritjes lp
         LEFT JOIN bizneset b ON b.id = lp.biznes_id
         ORDER BY lp.krijuar_at DESC`);
      res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};
