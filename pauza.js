// pauza.js — Pauzim (jo fshirje) i URL-ve dhe zonave (kodeve) te konvertimit.
// Kur nje element eshte "pauzuar": s'gjurmon, s'regjistron sinjale, s'ndikon ne pike/analitike,
// POR te dhenat e vjetra MBETEN, dhe mund te riaktivizohet.
// Rrenja (imyr-track.js) NUK pauzohet — cdo gjurmim varet nga ajo.
// Server.js e therret: require('./pauza')(app, pool, iLoguar);

async function init(pool) {
  // Kolona 'pauzuar' te tabelat perkatese. E sigurt, s'prek te dhenat.
  await pool.query(`ALTER TABLE konvertimet ADD COLUMN IF NOT EXISTS pauzuar BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE zonat ADD COLUMN IF NOT EXISTS pauzuar BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE snippetet ADD COLUMN IF NOT EXISTS pauzuar BOOLEAN DEFAULT false`);
}

module.exports = function (app, pool, iLoguar) {
  init(pool).catch(e => console.error('pauza init:', e.message));

  // ── PAUZO / RIAKTIVIZO nje URL konvertimi ──
  app.post('/api/konvertimet/:id/pauza', iLoguar, async (req, res) => {
    const pauzuar = !!(req.body && req.body.pauzuar);
    try {
      const r = await pool.query(
        'UPDATE konvertimet SET pauzuar=$1 WHERE id=$2 AND biznes_id=$3 RETURNING id, pauzuar',
        [pauzuar, req.params.id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'URL s\'u gjet.' });
      res.json({ ok: true, id: r.rows[0].id, pauzuar: r.rows[0].pauzuar });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── PAUZO / RIAKTIVIZO nje zone (kod) konvertimi ──
  app.post('/api/zonat/:id/pauza', iLoguar, async (req, res) => {
    const pauzuar = !!(req.body && req.body.pauzuar);
    try {
      const r = await pool.query(
        'UPDATE zonat SET pauzuar=$1 WHERE id=$2 AND biznes_id=$3 AND fshire=false RETURNING id, pauzuar',
        [pauzuar, req.params.id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'Zona s\'u gjet.' });
      res.json({ ok: true, id: r.rows[0].id, pauzuar: r.rows[0].pauzuar });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── PAUZO / RIAKTIVIZO nje SNIPPET reklame ──
  // Kur pauzuar: /ad s'kthen reklame → s'shfaqet, s'mat shfaqje, s'konkurron ne ankand.
  app.post('/api/snippetet/:id/pauza', iLoguar, async (req, res) => {
    const pauzuar = !!(req.body && req.body.pauzuar);
    try {
      const r = await pool.query(
        'UPDATE snippetet SET pauzuar=$1 WHERE id=$2 AND biznes_id=$3 RETURNING id, pauzuar',
        [pauzuar, req.params.id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'Snippet-i s\'u gjet.' });
      res.json({ ok: true, id: r.rows[0].id, pauzuar: r.rows[0].pauzuar });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
