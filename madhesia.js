// madhesia.js — Caktimi i madhesise se hapesires qe snippet-i nxjerr ne web.
// Nje madhesi per Desktop (dhe me vone Mobile); te 3 formatet (image/video/zip)
// pershtaten brenda saj. Standard: 300x380 (desktop).
// Server.js e therret: require('./madhesia')(app, pool, iLoguar);
// Nuk prek asnje logjike ekzistuese.

// Kufijte (desktop)
const MAX_W = 260, MAX_H = 290;
const MIN_W = 134, MIN_H = 155;
const STANDARD = '188x214';

function valido(mad) {
  // pret "GJERESIxLARTESI", p.sh. "300x380"
  const m = /^(\d{2,4})x(\d{2,4})$/.exec(String(mad || '').trim());
  if (!m) return null;
  let w = parseInt(m[1], 10), h = parseInt(m[2], 10);
  if (isNaN(w) || isNaN(h)) return null;
  w = Math.max(MIN_W, Math.min(MAX_W, w));
  h = Math.max(MIN_H, Math.min(MAX_H, h));
  return w + 'x' + h;
}

module.exports = function (app, pool, iLoguar) {

  // Lexo madhesine e profilit (desktop). Nese s'eshte caktuar → standardi.
  app.get('/api/madhesia', iLoguar, async (req, res) => {
    try {
      const r = await pool.query('SELECT madhesia_desktop FROM bizneset WHERE id=$1', [req.biznesId]);
      const d = (r.rows[0] && r.rows[0].madhesia_desktop) || STANDARD;
      res.json({ desktop: d, standard: STANDARD, max_w: MAX_W, max_h: MAX_H, min_w: MIN_W, min_h: MIN_H });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ruaj madhesine e re (desktop) vetem per kete profil.
  app.post('/api/madhesia', iLoguar, async (req, res) => {
    const v = valido(req.body && req.body.desktop);
    if (!v) return res.status(400).json({ error: 'Madhesi e pavlefshme.' });
    try {
      await pool.query('UPDATE bizneset SET madhesia_desktop=$2 WHERE id=$1', [req.biznesId, v]);
      res.json({ ok: true, desktop: v });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};

module.exports.STANDARD = STANDARD;
