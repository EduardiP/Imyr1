// konvertimet.js — Lejon disa URL konvertimi per biznes (te ndara: ruajtje, gjurmim, verifikim).
// Migron url_konvertimi ekzistuese si URL-en e pare (pa prekur 5 bizneset ekzistuese, pa kosto).
// Server.js e therret: require('./konvertimet')(app, pool, iLoguar);
// Nuk prek gjurmimin ekzistues (url_konvertimi te bizneset mbetet per perputhshmeri).

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS konvertimet (
      id SERIAL PRIMARY KEY,
      biznes_id     INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
      url           TEXT NOT NULL,
      track_active  BOOLEAN DEFAULT false,
      track_seen_at TIMESTAMPTZ,
      krijuar_at    TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_konvertimet_biz ON konvertimet(biznes_id)`);

  // MIGRIMI: cdo biznes qe ka url_konvertimi por s'ka ende rresht te tabela e re →
  // krijo URL-en e pare me statusin ekzistues (track_active nga bizneset).
  await pool.query(`
    INSERT INTO konvertimet (biznes_id, url, track_active, track_seen_at)
    SELECT b.id, b.url_konvertimi, COALESCE(b.track_active,false), b.track_seen_at
    FROM bizneset b
    WHERE b.url_konvertimi IS NOT NULL AND b.url_konvertimi <> ''
      AND NOT EXISTS (SELECT 1 FROM konvertimet k WHERE k.biznes_id = b.id)
  `);
}

// Normalizo nje URL konvertimi ne nje shteg (path) — si logjika ekzistuese.
function normalizo(u) {
  u = (u || '').trim();
  if (!u) return null;
  try { if (/^https?:\/\//i.test(u)) { const p = new URL(u); u = p.pathname + p.search; } } catch (e) {}
  if (u[0] !== '/') u = '/' + u;
  if (u === '/') return { error: "Ballina s'mund të jetë faqe konvertimi — jep një adresë që hapet vetëm pas konvertimit." };
  return { url: u };
}

// Kthen te gjitha URL-te e konvertimit te nje biznesi (per snippet-in gjurmues).
async function urletPerBiznes(pool, bizId) {
  const r = await pool.query('SELECT url FROM konvertimet WHERE biznes_id=$1 ORDER BY id ASC', [bizId]);
  return r.rows.map(x => x.url);
}

module.exports = function (app, pool, iLoguar, iAdmin) {

  init(pool).catch(e => console.error('konvertimet init:', e.message));

  // ADMIN: numri i freskët i URL-ve të një biznesi + statusi i secilës
  if (iAdmin) {
    app.get('/api/admin/konvertimet/:id', iAdmin, async (req, res) => {
      try {
        const r = await pool.query(
          `SELECT id, url, track_active, track_seen_at FROM konvertimet WHERE biznes_id=$1 ORDER BY id ASC`,
          [req.params.id]);
        const total = r.rows.length;
        const lidhur = r.rows.filter(x => x.track_active).length;
        res.json({ total, lidhur, urlat: r.rows });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });
  }

  // Listo URL-te e konvertimit te biznesit (te loguar) me statusin e secilit
  app.get('/api/konvertimet', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, url, track_active, track_seen_at FROM konvertimet WHERE biznes_id=$1 ORDER BY id ASC`,
        [req.biznesId]);
      res.json({ konvertimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Shto nje URL te re konvertimi (pa lidhur ende)
  app.post('/api/konvertimet', iLoguar, async (req, res) => {
    const n = normalizo(req.body && req.body.url);
    if (!n) return res.status(400).json({ error: 'Fut një adresë.' });
    if (n.error) return res.status(400).json({ error: n.error });
    try {
      // mos lejo dublikate per te njejtin biznes
      const ek = await pool.query('SELECT id FROM konvertimet WHERE biznes_id=$1 AND url=$2', [req.biznesId, n.url]);
      if (ek.rows.length) return res.json({ id: ek.rows[0].id, url: n.url, track_active: false });
      const r = await pool.query(
        `INSERT INTO konvertimet (biznes_id, url) VALUES ($1,$2)
         RETURNING id, url, track_active, track_seen_at`, [req.biznesId, n.url]);
      // Nese kjo URL eshte pare tashme nga kodi gjurmues (biznesi ka track_url qe perputhet),
      // shenoje menjehere si aktive — qe fshirja + rikrijimi te mos e humbase statusin.
      try {
        const bz = await pool.query('SELECT track_url, track_active FROM bizneset WHERE id=$1', [req.biznesId]);
        if (bz.rows.length && bz.rows[0].track_active && bz.rows[0].track_url) {
          let shteg = bz.rows[0].track_url;
          try { const p = new URL(shteg); shteg = p.pathname + p.search; } catch (e) {}
          if (shteg.indexOf(n.url) === 0) {
            await pool.query('UPDATE konvertimet SET track_active=true, track_seen_at=now() WHERE id=$1', [r.rows[0].id]);
            r.rows[0].track_active = true;
          }
        }
      } catch (e) {}
      // Perputhshmeri: nese eshte URL-ja e pare, vendose edhe te bizneset.url_konvertimi
      await sinkronizoTeBizneset(pool, req.biznesId);
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Fshi nje URL konvertimi
  app.delete('/api/konvertimet/:id', iLoguar, async (req, res) => {
    try {
      await pool.query('DELETE FROM konvertimet WHERE id=$1 AND biznes_id=$2', [req.params.id, req.biznesId]);
      await sinkronizoTeBizneset(pool, req.biznesId);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};

// Mban bizneset.url_konvertimi = URL-ja e pare (perputhshmeri me kodin ekzistues).
async function sinkronizoTeBizneset(pool, bizId) {
  const r = await pool.query('SELECT url FROM konvertimet WHERE biznes_id=$1 ORDER BY id ASC LIMIT 1', [bizId]);
  const u = r.rows.length ? r.rows[0].url : null;
  await pool.query('UPDATE bizneset SET url_konvertimi=$2 WHERE id=$1', [bizId, u]);
}

module.exports.init = init;
module.exports.urletPerBiznes = urletPerBiznes;
module.exports.normalizo = normalizo;
module.exports.sinkronizoTeBizneset = sinkronizoTeBizneset;
