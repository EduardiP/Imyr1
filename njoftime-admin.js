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
  // Kur klienti e sheh (hap ziles ose faqen e njoftimeve). Pas 10 minutash nga shikimi, njoftimi zhduket.
  await pool.query(`ALTER TABLE njoftimet_admin ADD COLUMN IF NOT EXISTS pare_at TIMESTAMPTZ`);
}

module.exports = function (app, pool, iLoguar, iAdmin) {
  init(pool).catch(e => console.error('njoftime-admin init:', e.message));

  // ── ADMIN: listo te gjitha bizneset (per te zgjedhur marresit) ──
  app.get('/api/admin/njoftime/bizneset', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT b.id, b.emri, b.email, b.logo_url, b.tipi,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.reklamues_id=b.id AND e.lloji='view'),0)::int AS shfaqje_marre,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.biznes_id=b.id AND e.lloji='view'),0)::int AS shfaqje_dhene,
          COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.reklamues_id=b.id AND e.lloji='konvertim'),0)::int AS konvertime
        FROM bizneset b WHERE b.emri IS NOT NULL ORDER BY b.emri ASC`);
      const pesha = require('./pesha');
      res.json(r.rows.map(b => ({
        id:b.id, emri:b.emri, email:b.email, logo_url:b.logo_url, tipi:b.tipi,
        shfaqje_marre:b.shfaqje_marre, shfaqje_dhene:b.shfaqje_dhene,
        pike_profili: Math.round(pesha.pikeProfili(b.tipi||'b2b', b.shfaqje_marre, b.konvertime))
      })));
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
    if (!idet.length) return res.status(400).json({ error: 'Choose at least one business.' });
    if (!titulli) return res.status(400).json({ error: 'Title is required.' });
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
         FROM njoftimet_admin WHERE biznes_id=$1 AND plotesuar=false AND (pare_at IS NULL OR pare_at > now() - interval '10 minutes') ORDER BY krijuar_at DESC`,
        [req.biznesId]);
      res.json({ njoftimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── PERDORUESI: shëno si te pare (hapi ziles / faqen e njoftimeve). Zhduken 10 min pas shikimit. ──
  // (Ne pamjen "Shiko si klienti" te admin-it, POST bllokohet -> admini s'i shenon si te para.)
  app.post('/api/njoftime-admin/pare', iLoguar, async (req, res) => {
    try {
      const ids = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).map(x => parseInt(x, 10)).filter(Boolean).slice(0, 50);
      if (ids.length) await pool.query('UPDATE njoftimet_admin SET pare_at = COALESCE(pare_at, now()) WHERE id = ANY($1::int[]) AND biznes_id = $2', [ids, req.biznesId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: lista e njoftimeve manuale te derguara ──
  app.get('/api/admin/njoftime/derguara', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT n.id, n.biznes_id, b.emri, n.titulli, n.teksti, n.veprim_label, n.krijuar_at, n.pare_at, n.plotesuar
          FROM njoftimet_admin n JOIN bizneset b ON b.id = n.biznes_id ORDER BY n.krijuar_at DESC LIMIT 300`);
      res.json({ njoftimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // ── ADMIN: hiq nje njoftim (zhduket menjehere nga zilja e klientit) ──
  app.delete('/api/admin/njoftime/:id', iAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM njoftimet_admin WHERE id = $1', [parseInt(req.params.id, 10)]);
      res.json({ ok: true });
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
      if (!r.rows.length) return res.status(404).json({ error: 'Notification not found.' });
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
       FROM njoftimet_admin WHERE biznes_id=$1 AND plotesuar=false AND (pare_at IS NULL OR pare_at > now() - interval '10 minutes') ORDER BY krijuar_at DESC`,
      [bizId]);
    return r.rows;
  } catch (e) { return []; }
};
