// suport-human.js — Kur nje klient kerkon te kontaktoje ekipin njerezor permes chat-it,
// asistenti e pyet cfare do t'i thote ekipit; kur klienti e shkruan, ruhet ketu dhe
// i vjen admin-it si njoftim (te seksioni Njoftime → div i kerkesave).
//
// Server.js e therret: require('./suport-human')(app, pool, iLoguar, iAdmin);

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kerkesat_suport (
      id SERIAL PRIMARY KEY,
      biznes_id   INTEGER REFERENCES bizneset(id) ON DELETE CASCADE,
      shqetesimi  TEXT NOT NULL,
      trajtuar    BOOLEAN DEFAULT false,
      krijuar_at  TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_kerkesat_suport_biz ON kerkesat_suport(biznes_id)`);
}

module.exports = function (app, pool, iLoguar, iAdmin) {
  init(pool).catch(e => console.error('suport-human init:', e.message));

  // ── KLIENTI: dergon nje kerkese per ekipin njerezor ──
  app.post('/api/suport/kontakto-ekipin', iLoguar, async (req, res) => {
    const shqetesimi = ((req.body && req.body.shqetesimi) || '').trim();
    if (!shqetesimi) return res.status(400).json({ error: 'Shkruaj shqetësimin.' });
    try {
      await pool.query(
        'INSERT INTO kerkesat_suport (biznes_id, shqetesimi) VALUES ($1,$2)',
        [req.biznesId, shqetesimi.slice(0, 4000)]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: lista e kerkesave (te patrajtuara + te trajtuara), me te dhenat e biznesit ──
  app.get('/api/admin/kerkesat-suport', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT k.id, k.shqetesimi, k.trajtuar, k.krijuar_at,
               b.id AS biznes_id, b.emri, b.email, b.logo_url
        FROM kerkesat_suport k
        LEFT JOIN bizneset b ON b.id = k.biznes_id
        ORDER BY k.trajtuar ASC, k.krijuar_at DESC`);
      res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: shëno nje kerkese si te trajtuar ──
  app.post('/api/admin/kerkesat-suport/:id/trajto', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(
        'UPDATE kerkesat_suport SET trajtuar=true WHERE id=$1 RETURNING id',
        [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Kërkesa s\'u gjet.' });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
