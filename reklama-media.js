// reklama-media.js — Endpoint-et per reklama VIDEO (YouTube link) dhe HTML5 (skedar te R2).
// Ndjek te njejtin model si /api/ngarko (imazhet). Server.js e therret:
//   require('./reklama-media')(app, pool, iLoguar, { upload, s3, PutObjectCommand });
//
// Migrimi shton kolonat video_url dhe html5_url te tabela promovimet.

async function init(pool) {
  await pool.query(`ALTER TABLE promovimet ADD COLUMN IF NOT EXISTS video_url TEXT`);
  await pool.query(`ALTER TABLE promovimet ADD COLUMN IF NOT EXISTS html5_url TEXT`);
}

// Nxjerr ID-ne 11-shkronjore te YouTube nga cdo forme linku
function nxjerrYtId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? m[1] : '';
}

module.exports = function (app, pool, iLoguar, deps) {
  const { upload, s3, PutObjectCommand } = deps || {};
  init(pool).catch(e => console.error('reklama-media init:', e.message));

  // --- REKLAME VIDEO (YouTube link — s'ruajme skedar, vetem ID-ne) ---
  app.post('/api/reklama/video', iLoguar, async (req, res) => {
    const titulli = ((req.body && req.body.titull) || '').trim() || null;
    let link = ((req.body && req.body.link) || '').trim();
    const ytRaw = ((req.body && req.body.youtube) || (req.body && req.body.youtube_id) || '').trim();
    if (!link) return res.status(400).json({ error: 'Fut linkun e destinacionit.' });
    if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
    // youtube mund te vije si ID e paster ose si URL e plote
    const ytId = /^[\w-]{11}$/.test(ytRaw) ? ytRaw : nxjerrYtId(ytRaw);
    if (!ytId) return res.status(400).json({ error: "Linku i YouTube s'është i vlefshëm." });
    try {
      const r = await pool.query(
        'INSERT INTO promovimet (biznes_id, titulli, video_url, link, aktiv) VALUES ($1,$2,$3,$4,true) RETURNING id',
        [req.biznesId, titulli, ytId, link]);
      res.json({ ok: true, id: r.rows[0].id, youtube_id: ytId });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // --- REKLAME HTML5 (skedar .htm/.zip te R2, max 200 KB) ---
  app.post('/api/reklama/html5', iLoguar, upload.single('file'), async (req, res) => {
    if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
    // Nese vjen nga Creative-t e mia (kreativitet ekzistues), s'ka skedar te ri
    const creativeId = req.body && req.body.creative_id;
    let titulli = ((req.body && req.body.titull) || '').trim() || null;
    let link = ((req.body && req.body.link) || '').trim();
    if (!link) return res.status(400).json({ error: 'Fut linkun e destinacionit.' });
    if (!/^https?:\/\//i.test(link)) link = 'https://' + link;

    try {
      let url = '';
      if (creativeId) {
        // Merr output_url ose skedari_url nga kreativiteti
        const k = await pool.query(
          'SELECT output_url, skedari_url FROM kreativitetet WHERE id=$1 AND biznes_id=$2',
          [creativeId, req.biznesId]);
        if (!k.rows.length) return res.status(400).json({ error: 'Kreativiteti s\'u gjet.' });
        url = k.rows[0].output_url || k.rows[0].skedari_url || '';
        if (!url) return res.status(400).json({ error: 'Ky kreativitet s\'ka skedar të gatshëm.' });
      } else {
        if (!req.file) return res.status(400).json({ error: "S'ka skedar." });
        if (req.file.size > 200 * 1024) {
          return res.status(400).json({ error: 'Skedari e kalon 200 KB.' });
        }
        const ext = (req.file.originalname.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!['htm', 'html', 'zip'].includes(ext)) {
          return res.status(400).json({ error: 'Lejohet vetëm .htm ose .zip.' });
        }
        const key = 'html5/' + req.biznesId + '_' + Date.now() + '.' + ext;
        await s3.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET, Key: key,
          Body: req.file.buffer, ContentType: req.file.mimetype || 'text/html'
        }));
        const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
        url = base + '/' + key;
      }
      const r = await pool.query(
        'INSERT INTO promovimet (biznes_id, titulli, html5_url, link, aktiv) VALUES ($1,$2,$3,$4,true) RETURNING id',
        [req.biznesId, titulli, url, link]);
      res.json({ ok: true, id: r.rows[0].id, url });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
module.exports.nxjerrYtId = nxjerrYtId;
