// kreative.js — Krijimi i reklamave me AI (imazh/video/HTML5).
// Ruan cdo reklame te krijuar te tabela `kreativitetet`, qe klienti ta perdore me von te My Ads.
// Server.js e therret: require('./kreative')(app, pool, iLoguar);
//
// STRUKTURE: kjo eshte vetem struktura + ruajtja. Gjenerimi me AI vjen me von.

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kreativitetet (
      id SERIAL PRIMARY KEY,
      biznes_id     INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
      lloji         TEXT NOT NULL,           -- imazh | video | html5
      emri          TEXT DEFAULT '',
      pershkrimi    TEXT DEFAULT '',
      skedari_url   TEXT DEFAULT '',         -- URL e skedarit te ngarkuar (imazh/html/zip)
      output_url    TEXT DEFAULT '',         -- URL e output-it te AI (kur te gjenerohet)
      status        TEXT DEFAULT 'draft',    -- draft | duke_u_gjeneruar | gati | deshtoi
      krijuar_at    TIMESTAMPTZ DEFAULT now(),
      perditesuar_at TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_kreativitetet_biz ON kreativitetet(biznes_id)`);
}

module.exports = function (app, pool, iLoguar) {
  init(pool).catch(e => console.error('kreative init:', e.message));

  // Listo kreativitetet e biznesit
  app.get('/api/kreative', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, lloji, emri, pershkrimi, skedari_url, output_url, status, krijuar_at
         FROM kreativitetet WHERE biznes_id=$1 ORDER BY krijuar_at DESC`,
        [req.biznesId]);
      res.json({ kreative: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Merr vetem ato qe jane GATI (per t'u perdorur te My Ads)
  app.get('/api/kreative/gati', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, lloji, emri, output_url, skedari_url
         FROM kreativitetet WHERE biznes_id=$1 AND status='gati' ORDER BY krijuar_at DESC`,
        [req.biznesId]);
      res.json({ kreative: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Krijo nje kreativitet te ri (draft) — struktura, pa gjenerim ende
  app.post('/api/kreative', iLoguar, async (req, res) => {
    const lloji = ((req.body && req.body.lloji) || '').trim();
    const emri = ((req.body && req.body.emri) || '').trim().slice(0, 200);
    const pershkrimi = ((req.body && req.body.pershkrimi) || '').trim().slice(0, 2000);
    const skedari_url = ((req.body && req.body.skedari_url) || '').trim().slice(0, 500);
    if (!['imazh', 'video', 'html5'].includes(lloji)) {
      return res.status(400).json({ error: 'Lloji duhet: imazh, video, ose html5.' });
    }
    if (!emri) return res.status(400).json({ error: 'Emri është i detyrueshëm.' });
    try {
      const r = await pool.query(
        `INSERT INTO kreativitetet (biznes_id, lloji, emri, pershkrimi, skedari_url)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, lloji, emri, pershkrimi, skedari_url, status`,
        [req.biznesId, lloji, emri, pershkrimi, skedari_url]);
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Fshi nje kreativitet
  app.delete('/api/kreative/:id', iLoguar, async (req, res) => {
    try {
      await pool.query('DELETE FROM kreativitetet WHERE id=$1 AND biznes_id=$2',
        [req.params.id, req.biznesId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
