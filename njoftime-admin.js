// njoftime-admin.js — Njoftime manuale nga admin te ikona e ziles se perdoruesve.
// Admin zgjedh nje ose disa biznese, shkruan titull+tekst, dhe opsionalisht nje buton me destinacion.
// "Plotesimi": nese s'ka buton → mjafton lexo/mbyll; nese ka buton → duhet klikuar butoni.
// Server.js e therret: require('./njoftime-admin')(app, pool, iLoguar, iAdmin);

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS njoftimet_admin (
      id SERIAL PRIMARY KEY,
      biznes_id     INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
      titulli       TEXT NOT NULL,
      teksti        TEXT DEFAULT '',
      veprim        TEXT DEFAULT '',        -- destinacioni i butonit (bosh = pa buton)
      veprim_label  TEXT DEFAULT '',        -- teksti i butonit
      plotesuar     BOOLEAN DEFAULT false,  -- lexuar/mbyllur (pa buton) OSE butoni u klikua
      krijuar_at    TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_njofadmin_biz ON njoftimet_admin(biznes_id)`);
}

module.exports = function (app, pool, iLoguar, iAdmin) {
  init(pool).catch(e => console.error('njoftime-admin init:', e.message));

  // ── ADMIN: listo te gjitha bizneset (per te zgjedhur marresit) ──
  app.get('/api/admin/njoftime/bizneset', iAdmin, async (req, res) => {
    try {
      const r = await pool.query('SELECT id, emri, tipi FROM bizneset WHERE emri IS NOT NULL ORDER BY emri ASC');
      res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: dergo nje njoftim te nje ose disa biznese ──
  app.post('/api/admin/njoftime/dergo', iAdmin, async (req, res) => {
    const b = req.body || {};
    const idet = Array.isArray(b.biznes_ids) ? b.biznes_ids : [];
    const titulli = (b.titulli || '').trim();
    const teksti = (b.teksti || '').trim();
    const veprim = (b.veprim || '').trim();
    const veprim_label = (b.veprim_label || '').trim();
    if (!idet.length) return res.status(400).json({ error: 'Zgjidh të paktën një biznes.' });
    if (!titulli) return res.status(400).json({ error: 'Titulli është i detyrueshëm.' });
    try {
      let n = 0;
      for (const bid of idet) {
        await pool.query(
          `INSERT INTO njoftimet_admin (biznes_id, titulli, teksti, veprim, veprim_label)
           VALUES ($1,$2,$3,$4,$5)`,
          [bid, titulli, teksti, veprim, veprim_label]);
        n++;
      }
      res.json({ ok: true, derguar: n });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── PERDORUESI: merr njoftimet e veta admin qe s'jane plotesuar ──
  // (Perdoret nga /api/njoftimet — shih server.js. Ky endpoint eshte i drejtperdrejte nese duhet.)
  app.get('/api/njoftime-admin', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, titulli, teksti, veprim, veprim_label
         FROM njoftimet_admin WHERE biznes_id=$1 AND plotesuar=false ORDER BY krijuar_at DESC`,
        [req.biznesId]);
      res.json({ njoftimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── PERDORUESI: shëno nje njoftim si te plotesuar ──
  // Nese njoftimi ka buton (veprim), plotesohet vetem kur klikohet butoni (frontend dergon kur klikon).
  // Nese s'ka buton, plotesohet kur mbyllet/lexohet.
  app.post('/api/njoftime-admin/:id/ploteso', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        'UPDATE njoftimet_admin SET plotesuar=true WHERE id=$1 AND biznes_id=$2 RETURNING id',
        [req.params.id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'Njoftimi s\'u gjet.' });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;

// Ndihmes qe server.js mund ta perdore te /api/njoftimet per t'i bashkuar me automatiket
module.exports.merrPerBiznes = async function (pool, bizId) {
  try {
    const r = await pool.query(
      `SELECT id, titulli, teksti, veprim, veprim_label
       FROM njoftimet_admin WHERE biznes_id=$1 AND plotesuar=false ORDER BY krijuar_at DESC`,
      [bizId]);
    return r.rows;
  } catch (e) { return []; }
};
