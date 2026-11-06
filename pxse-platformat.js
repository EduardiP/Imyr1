// pxse-platformat.js (PhronexusAI) — "Lista e platformave" te admin-i (Marketingu): lista e platformave ku listohet
// PhronexusAI (backlinke / lansime / direktori), e ruajtur ne databaze, me ndjekjen e listimeve dhe kujtesat per ripostim.
//
//  - Admini ngarkon CSV-ne (ne shfletues kthehet ne rreshta dhe dergohet me grupe te vogla). Te dhenat e CSV-se ruhen
//    te `te_dhenat` (JSONB); fushat e ndjekjes (statusi, data e listimit, linku, kujtesa, shenimet) NUK preken nga ngarkimi.
//  - "Shëno si të listuar": statusi + data + linku i listimit + data e kujtesës për ripostim.
//  - Kujtesa: kur vjen data (kujto_at <= sot), admin-i e sheh te njoftimi lart dhe te menuja (pa email).
//
// Server.js e therret: require('./pxse-platformat')(app, pool, iAdmin);

const STATUSET = ['', 'pritje', 'listuar', 'refuzuar', 'kalo'];

module.exports = function (app, pool, iAdmin) {
  let _migruar = null;
  function migro() {
    if (_migruar) return _migruar;
    _migruar = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS pxse_platformat (
        domaini TEXT PRIMARY KEY,
        te_dhenat JSONB NOT NULL DEFAULT '{}',
        renditja INT,
        statusi TEXT NOT NULL DEFAULT '',
        listuar_at DATE,
        url_listimit TEXT,
        kujto_at DATE,
        shenime TEXT,
        perditesuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS pxse_platformat_meta (id INT PRIMARY KEY DEFAULT 1, kolonat JSONB NOT NULL DEFAULT '[]', CHECK (id = 1))`);
      await pool.query(`INSERT INTO pxse_platformat_meta (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    })().catch(e => { _migruar = null; console.error('pxse-platformat migrim:', e.message); });
    return _migruar;
  }
  migro();

  const domainOk = d => /^[a-z0-9.-]{3,200}$/.test(d);
  const pastroDomain = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[\/?#].*$/, '');
  const dataOk = v => v === null || v === '' || /^\d{4}-\d{2}-\d{2}$/.test(String(v));
  const SOT = `(now() AT TIME ZONE 'Europe/Berlin')::date`;

  // Lista e plote + numri i kujtesave te arritura
  app.get('/api/admin/pxse/platformat', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await migro();
      const m = (await pool.query('SELECT kolonat FROM pxse_platformat_meta WHERE id=1')).rows[0];
      const r = await pool.query(`SELECT domaini, te_dhenat, statusi, to_char(listuar_at,'YYYY-MM-DD') listuar_at, url_listimit,
          to_char(kujto_at,'YYYY-MM-DD') kujto_at, shenime, (kujto_at IS NOT NULL AND kujto_at <= ${SOT}) AS gati
        FROM pxse_platformat ORDER BY renditja NULLS LAST, domaini`);
      res.json({ ok: true, kolonat: (m && m.kolonat) || [], rreshta: r.rows, gati: r.rows.filter(x => x.gati).length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Vetem numri i kujtesave (per njoftimin lart ne admin)
  app.get('/api/admin/pxse/platformat/gati', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await migro();
      const r = await pool.query(`SELECT COUNT(*)::int n FROM pxse_platformat WHERE kujto_at IS NOT NULL AND kujto_at <= ${SOT}`);
      res.json({ ok: true, n: r.rows[0].n });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ngarkimi i CSV-se, me grupe: { kolonat:[...], rreshta:[{...}], fillimi: numri i rreshtit te pare (per renditjen) }
  // Fushat e ndjekjes nuk preken; per rreshtat e rinj, "Statusi im" i CSV-se (nese ka) behet shenim.
  app.post('/api/admin/pxse/platformat/ngarko', iAdmin, async (req, res) => {
    const b = req.body || {};
    const rreshta = Array.isArray(b.rreshta) ? b.rreshta.slice(0, 500) : [];
    const fillimi = parseInt(b.fillimi, 10) || 0;
    try {
      await migro();
      if (Array.isArray(b.kolonat) && b.kolonat.length)
        await pool.query('UPDATE pxse_platformat_meta SET kolonat=$1 WHERE id=1', [JSON.stringify(b.kolonat.map(String).slice(0, 80))]);
      let n = 0;
      for (let i = 0; i < rreshta.length; i++) {
        const o = rreshta[i] && typeof rreshta[i] === 'object' ? rreshta[i] : null;
        if (!o) continue;
        const d = pastroDomain(o['Domaini']);
        if (!domainOk(d)) continue;
        const shenim = String(o['Statusi im'] || '').trim().slice(0, 500) || null;
        await pool.query(`INSERT INTO pxse_platformat (domaini, te_dhenat, renditja, shenime) VALUES ($1,$2,$3,$4)
          ON CONFLICT (domaini) DO UPDATE SET te_dhenat=EXCLUDED.te_dhenat, renditja=EXCLUDED.renditja,
            shenime=COALESCE(pxse_platformat.shenime, EXCLUDED.shenime), perditesuar_at=now()`,
          [d, JSON.stringify(o), fillimi + i, shenim]);
        n++;
      }
      res.json({ ok: true, ruajtur: n });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Pas ngarkimit: hiq platformat qe s'jane me ne CSV — vetem ato pa asnje ndjekje (statusi/data/linku/shenime)
  app.post('/api/admin/pxse/platformat/fund-ngarkimi', iAdmin, async (req, res) => {
    const lista = Array.isArray((req.body || {}).domainet) ? req.body.domainet.map(pastroDomain).filter(domainOk) : null;
    if (!lista || !lista.length) return res.status(400).json({ error: 'Lista e domaineve mungon.' });
    try {
      await migro();
      const r = await pool.query(`DELETE FROM pxse_platformat WHERE NOT (domaini = ANY($1::text[]))
          AND statusi='' AND listuar_at IS NULL AND url_listimit IS NULL AND kujto_at IS NULL AND shenime IS NULL`, [lista]);
      res.json({ ok: true, hequr: r.rowCount });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ndjekja e nje platforme: statusi, data e listimit, linku, kujtesa, shenimet (fushat qe mungojne nuk preken)
  app.post('/api/admin/pxse/platformat/ndjek', iAdmin, async (req, res) => {
    const b = req.body || {};
    const d = pastroDomain(b.domaini);
    if (!domainOk(d)) return res.status(400).json({ error: 'Domain i pavlefshëm.' });
    const set = [], p = [d];
    const shto = (k, v) => { p.push(v); set.push(k + '=$' + p.length); };
    if (b.statusi !== undefined) { if (!STATUSET.includes(b.statusi)) return res.status(400).json({ error: 'Status i pavlefshëm.' }); shto('statusi', b.statusi); }
    if (b.listuar_at !== undefined) { if (!dataOk(b.listuar_at)) return res.status(400).json({ error: 'Data e listimit e pavlefshme.' }); shto('listuar_at', b.listuar_at || null); }
    if (b.kujto_at !== undefined) { if (!dataOk(b.kujto_at)) return res.status(400).json({ error: 'Data e kujtesës e pavlefshme.' }); shto('kujto_at', b.kujto_at || null); }
    if (b.url_listimit !== undefined) {
      const u = String(b.url_listimit || '').trim();
      if (u && !/^https?:\/\/\S{3,500}$/i.test(u)) return res.status(400).json({ error: 'Linku duhet të fillojë me http:// ose https://' });
      shto('url_listimit', u || null);
    }
    if (b.shenime !== undefined) shto('shenime', String(b.shenime || '').trim().slice(0, 1000) || null);
    if (!set.length) return res.status(400).json({ error: 'Asgjë për të ndryshuar.' });
    try {
      await migro();
      const r = await pool.query(`UPDATE pxse_platformat SET ${set.join(', ')}, perditesuar_at=now() WHERE domaini=$1
        RETURNING domaini, statusi, to_char(listuar_at,'YYYY-MM-DD') listuar_at, url_listimit, to_char(kujto_at,'YYYY-MM-DD') kujto_at, shenime,
          (kujto_at IS NOT NULL AND kujto_at <= ${SOT}) AS gati`, p);
      if (!r.rows.length) return res.status(404).json({ error: 'Platforma nuk u gjet.' });
      res.json({ ok: true, rreshti: r.rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
