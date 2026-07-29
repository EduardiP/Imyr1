// madhesia.js — Caktimi i madhesise se hapesires qe snippet-i nxjerr ne web.
// Nje madhesi per Desktop dhe nje per Mobile; te 3 formatet (image/video/zip)
// pershtaten brenda saj.
// Server.js e therret: require('./madhesia')(app, pool, iLoguar);
// Nuk prek asnje logjike ekzistuese.

// Kufijte (desktop)
const MAX_W = 260, MAX_H = 290;
const MIN_W = 134, MIN_H = 155;
const STANDARD = '210x261';

// Kufijte (mobile)
const M_MAX_W = 320, M_MAX_H = 400;
const M_MIN_W = 260, M_MIN_H = 70;
const M_STANDARD = '290x260';

function validoMe(mad, maxW, maxH, minW, minH) {
  const m = /^(\d{2,4})x(\d{2,4})$/.exec(String(mad || '').trim());
  if (!m) return null;
  let w = parseInt(m[1], 10), h = parseInt(m[2], 10);
  if (isNaN(w) || isNaN(h)) return null;
  w = Math.max(minW, Math.min(maxW, w));
  h = Math.max(minH, Math.min(maxH, h));
  return w + 'x' + h;
}

module.exports = function (app, pool, iLoguar) {

  // Lexo madhesite e profilit (desktop + mobile). Nese s'jane caktuar → standardet.
  app.get('/api/madhesia', iLoguar, async (req, res) => {
    try {
      const r = await pool.query('SELECT madhesia_desktop, madhesia_mobile, pozicioni_reklames FROM bizneset WHERE id=$1', [req.biznesId]);
      const d = (r.rows[0] && r.rows[0].madhesia_desktop) || STANDARD;
      const mob = (r.rows[0] && r.rows[0].madhesia_mobile) || M_STANDARD;
      const poz = (r.rows[0] && r.rows[0].pozicioni_reklames) || 'qender';
      res.json({
        desktop: d, mobile: mob, pozicioni: poz,
        standard: STANDARD, max_w: MAX_W, max_h: MAX_H, min_w: MIN_W, min_h: MIN_H,
        m_standard: M_STANDARD, m_max_w: M_MAX_W, m_max_h: M_MAX_H, m_min_w: M_MIN_W, m_min_h: M_MIN_H
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ruaj madhesine e re. Pranon desktop dhe/ose mobile.
  app.post('/api/madhesia', iLoguar, async (req, res) => {
    const bd = req.body || {};
    const vd = bd.desktop != null ? validoMe(bd.desktop, MAX_W, MAX_H, MIN_W, MIN_H) : null;
    const vm = bd.mobile  != null ? validoMe(bd.mobile,  M_MAX_W, M_MAX_H, M_MIN_W, M_MIN_H) : null;
    const vp = bd.pozicioni != null ? (['qender','majtas','djathtas'].indexOf(bd.pozicioni) > -1 ? bd.pozicioni : null) : null;
    if (bd.desktop != null && !vd) return res.status(400).json({ error: 'Madhesi desktop e pavlefshme.' });
    if (bd.mobile  != null && !vm) return res.status(400).json({ error: 'Madhesi mobile e pavlefshme.' });
    if (bd.pozicioni != null && !vp) return res.status(400).json({ error: 'Pozicion i pavlefshem.' });
    if (!vd && !vm && !vp) return res.status(400).json({ error: 'Asgje per te ruajtur.' });
    try {
      if (vd) await pool.query('UPDATE bizneset SET madhesia_desktop=$2 WHERE id=$1', [req.biznesId, vd]);
      if (vm) await pool.query('UPDATE bizneset SET madhesia_mobile=$2 WHERE id=$1', [req.biznesId, vm]);
      if (vp) await pool.query('UPDATE bizneset SET pozicioni_reklames=$2 WHERE id=$1', [req.biznesId, vp]);
      res.json({ ok: true, desktop: vd || undefined, mobile: vm || undefined, pozicioni: vp || undefined });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};

module.exports.STANDARD = STANDARD;
module.exports.M_STANDARD = M_STANDARD;
