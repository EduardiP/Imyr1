// ndryshime-admin.js — "Çfarë të re": ndryshime PUBLIKE të platformës, dërguar VETËM manualisht
// nga admin (asnjë trigger automatik). Shfaqet te widget-i global (ndryshime.js) — për çdo klient
// të loguar, jo lidhur me biznes specifik. Ndryshe nga njoftime-admin.js (i drejtuar te biznese).
// Server.js e therret: require('./ndryshime-admin')(app, pool, iLoguar, iAdmin);
//
// SKADIMI: nje ndryshim shfaqet te klienti VETEM per 14 dite nga krijimi (SKADIMI_DITE poshte) —
// pas kesaj, thjesht s'shfaqet me te /api/ndryshimet (mbetet ne DB per histori/fshirje admin).

const SKADIMI_DITE = 14;

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ndryshimet (
      id SERIAL PRIMARY KEY,
      titull TEXT NOT NULL,
      teksti TEXT DEFAULT '',
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);
}

module.exports = function (app, pool, iLoguar, iAdmin) {
  init(pool).catch(e => console.error('ndryshime-admin init:', e.message));

  // ── ADMIN: dërgo një ndryshim të ri te widget-i publik ──
  app.post('/api/admin/ndryshime/dergo', iAdmin, async (req, res) => {
    const b = req.body || {};
    const titull = (b.titull || '').trim();
    const teksti = (b.teksti || '').trim();
    if (!titull) return res.status(400).json({ error: 'Titulli është i detyrueshëm.' });
    try {
      await pool.query(
        `INSERT INTO ndryshimet (titull, teksti) VALUES ($1,$2)`,
        [titull, teksti]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: listo te gjitha (per pamjen e listes + fshirje) — pavaresisht skadimit ──
  app.get('/api/admin/ndryshime/lista', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, titull, teksti, krijuar_at,
           (krijuar_at > now() - interval '${SKADIMI_DITE} days') AS aktiv
         FROM ndryshimet ORDER BY krijuar_at DESC LIMIT 100`);
      res.json({ ndryshimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── ADMIN: fshi nje ndryshim ──
  app.delete('/api/admin/ndryshime/:id', iAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM ndryshimet WHERE id=$1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── KLIENTI: 10 ndryshimet e fundit, VETEM ato brenda periudhes se skadimit
  // (perdoret nga public/js/ndryshime.js) ──
  app.get('/api/ndryshimet', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, titull, teksti, krijuar_at AS data
         FROM ndryshimet
         WHERE krijuar_at > now() - interval '${SKADIMI_DITE} days'
         ORDER BY krijuar_at DESC LIMIT 10`);
      res.json({ ndryshimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
