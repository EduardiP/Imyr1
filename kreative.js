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
  // Numri i modifikimeve te perdorura per kete kreativitet specifik (kufi per-krijim)
  await pool.query(`ALTER TABLE kreativitetet ADD COLUMN IF NOT EXISTS modifikime_perdorura INTEGER NOT NULL DEFAULT 0`);
}

// Kufijte mujore (krijime te REJA) dhe per-krijim (modifikime), sipas formatit
const KUFIJTE = {
  imazh: { krijimeMuaj: 20, modifikimeKrijim: 5 },
  video: { krijimeMuaj: 5,  modifikimeKrijim: 2 },
  html5: { krijimeMuaj: 7,  modifikimeKrijim: 3 }
};

// Sa krijime te REJA jane bere kete muaj (30 dite) per kete biznes+format
async function krijimeKeteMuaj(pool, bizId, lloji) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n FROM kreativitetet
     WHERE biznes_id=$1 AND lloji=$2 AND krijuar_at > now() - interval '30 days'`,
    [bizId, lloji]);
  return r.rows[0].n;
}

const falKlient = require('./fal-klient');

module.exports = function (app, pool, iLoguar, deps) {
  const { upload, s3, PutObjectCommand } = deps || {};
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

  // Kufijte (mbetur) per nje format — dhe per nje kreativitet specifik (modifikime) nese jepet ?id=
  app.get('/api/kreative/kufijte', iLoguar, async (req, res) => {
    const lloji = req.query.lloji;
    if (!KUFIJTE[lloji]) return res.status(400).json({ error: 'Lloj i pavlefshëm.' });
    try {
      const perdorura = await krijimeKeteMuaj(pool, req.biznesId, lloji);
      const rez = {
        krijime_mbetura: Math.max(0, KUFIJTE[lloji].krijimeMuaj - perdorura),
        krijime_gjithsej: KUFIJTE[lloji].krijimeMuaj
      };
      if (req.query.id) {
        const k = await pool.query(
          'SELECT modifikime_perdorura FROM kreativitetet WHERE id=$1 AND biznes_id=$2',
          [req.query.id, req.biznesId]);
        if (k.rows.length) {
          rez.modifikime_mbetura = Math.max(0, KUFIJTE[lloji].modifikimeKrijim - k.rows[0].modifikime_perdorura);
          rez.modifikime_gjithsej = KUFIJTE[lloji].modifikimeKrijim;
        }
      }
      res.json(rez);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GJENERIM I VERTETE (Imazh, per tani — video/html5 vijne me vone)
  app.post('/api/kreative/gjenero', iLoguar, upload.single('skedari'), async (req, res) => {
    const lloji = ((req.body && req.body.lloji) || '').trim();
    const emri = ((req.body && req.body.emri) || '').trim().slice(0, 200);
    const pershkrimi = ((req.body && req.body.pershkrimi) || '').trim().slice(0, 2000);
    const imageUrl = ((req.body && req.body.image_url) || '').trim(); // imazh ekzistues nga "kreativet e mia"
    if (!['imazh', 'video', 'html5'].includes(lloji)) return res.status(400).json({ error: 'Lloj i pavlefshëm.' });
    if (!emri) return res.status(400).json({ error: 'Emri është i detyrueshëm.' });
    if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
    try {
      const perdorura = await krijimeKeteMuaj(pool, req.biznesId, lloji);
      if (perdorura >= KUFIJTE[lloji].krijimeMuaj) {
        return res.status(429).json({ error: 'Ke arritur kufirin mujor (' + KUFIJTE[lloji].krijimeMuaj + ') për ' + lloji + '.' });
      }
      let url;
      if (lloji === 'imazh') {
        let buf, ext;
        if (req.file) {
          buf = req.file.buffer;
          ext = (req.file.mimetype && req.file.mimetype.includes('png')) ? 'png' : 'jpg';
        } else {
          if (!pershkrimi) return res.status(400).json({ error: 'Shkruaj përshkrimin ose ngarko një skedar.' });
          const falUrl = await falKlient.gjeneroImazh(pershkrimi);
          const imgResp = await fetch(falUrl);
          buf = Buffer.from(await imgResp.arrayBuffer());
          ext = 'png';
        }
        const key = 'kreative/' + req.biznesId + '_' + Date.now() + '.' + ext;
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: ext === 'png' ? 'image/png' : 'image/jpeg' }));
        url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;
      } else if (lloji === 'video') {
        // Video kerkon nje imazh baze — ose nga skedar i ngarkuar, ose nga imazhet e mia (image_url), ose gabim
        let imgUrlPerVideo = imageUrl;
        if (req.file) {
          const ext2 = (req.file.mimetype && req.file.mimetype.includes('png')) ? 'png' : 'jpg';
          const imgKey = 'kreative/' + req.biznesId + '_vid_src_' + Date.now() + '.' + ext2;
          await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: imgKey, Body: req.file.buffer, ContentType: req.file.mimetype || 'image/jpeg' }));
          imgUrlPerVideo = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + imgKey;
        }
        if (!imgUrlPerVideo) return res.status(400).json({ error: 'Video kërkon një imazh bazë — ngarko ose zgjidh nga imazhet e tua.' });
        if (!pershkrimi) return res.status(400).json({ error: 'Shkruaj përshkrimin për videon.' });
        const falUrl = await falKlient.gjeneroVideo(imgUrlPerVideo, pershkrimi);
        const vidResp = await fetch(falUrl);
        const buf = Buffer.from(await vidResp.arrayBuffer());
        const key = 'kreative/' + req.biznesId + '_' + Date.now() + '.mp4';
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: 'video/mp4' }));
        url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;
      } else if (lloji === 'html5') {
        if (!pershkrimi) return res.status(400).json({ error: 'Shkruaj përshkrimin për HTML5.' });
        let imgUrlPerHtml = imageUrl;
        if (req.file) {
          const ext3 = (req.file.mimetype && req.file.mimetype.includes('png')) ? 'png' : 'jpg';
          const imgKey = 'kreative/' + req.biznesId + '_h5_src_' + Date.now() + '.' + ext3;
          await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: imgKey, Body: req.file.buffer, ContentType: req.file.mimetype || 'image/jpeg' }));
          imgUrlPerHtml = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + imgKey;
        }
        const htmlCode = await falKlient.gjeneroHTML5(pershkrimi, imgUrlPerHtml || null);
        const buf = Buffer.from(htmlCode, 'utf8');
        const key = 'kreative/' + req.biznesId + '_' + Date.now() + '.html';
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: 'text/html' }));
        url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;
      }
      const r = await pool.query(
        `INSERT INTO kreativitetet (biznes_id, lloji, emri, pershkrimi, output_url, status)
         VALUES ($1,$2,$3,$4,$5,'gati') RETURNING id, lloji, emri, pershkrimi, output_url, status`,
        [req.biznesId, lloji, emri, pershkrimi, url]);
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });


  // MODIFIKIM — imazh (Flux Kontext), video (rigjenero nga imazhi i ri), html5 (rigjenero me Claude)
  app.post('/api/kreative/modifiko/:id', iLoguar, async (req, res) => {
    const pershkrimi = ((req.body && req.body.pershkrimi) || '').trim().slice(0, 2000);
    if (!pershkrimi) return res.status(400).json({ error: 'Shkruaj çfarë të ndryshohet.' });
    if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
    try {
      const k = await pool.query('SELECT * FROM kreativitetet WHERE id=$1 AND biznes_id=$2', [req.params.id, req.biznesId]);
      if (!k.rows.length) return res.status(404).json({ error: 'Kreativiteti s\'u gjet.' });
      const kr = k.rows[0];
      if (!kr.output_url) return res.status(400).json({ error: 'Ky krijim s\'ka ende output për t\'u modifikuar.' });
      const limiti = KUFIJTE[kr.lloji].modifikimeKrijim;
      if (kr.modifikime_perdorura >= limiti) {
        return res.status(429).json({ error: 'Ke arritur kufirin e modifikimeve (' + limiti + ') për këtë krijim.' });
      }
      let url;
      if (kr.lloji === 'imazh') {
        const falUrl = await falKlient.modifikoImazh(kr.output_url, pershkrimi);
        const imgResp = await fetch(falUrl);
        const buf = Buffer.from(await imgResp.arrayBuffer());
        const key = 'kreative/' + req.biznesId + '_' + Date.now() + '.png';
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: 'image/png' }));
        url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;
      } else if (kr.lloji === 'video') {
        // Video modifikim = rigjenero videon me prompt te ri, duke perdorur te njejtin imazh baze
        // (imazhi baze mund te jete ruajtur si skedari_url ose te jete vetem output_url e videos — ne ate rast rikerkojme imazh)
        return res.status(400).json({ error: 'Modifikimi i videos rigjeneron nga e para — shkruaj përshkrim të ri te Krijo.' });
      } else if (kr.lloji === 'html5') {
        const htmlCode = await falKlient.gjeneroHTML5(pershkrimi, null);
        const buf = Buffer.from(htmlCode, 'utf8');
        const key = 'kreative/' + req.biznesId + '_' + Date.now() + '.html';
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: 'text/html' }));
        url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;
      }
      const r = await pool.query(
        `UPDATE kreativitetet SET output_url=$2, pershkrimi=$3, modifikime_perdorura=modifikime_perdorura+1, perditesuar_at=now()
         WHERE id=$1 RETURNING id, lloji, emri, pershkrimi, output_url, status, modifikime_perdorura`,
        [kr.id, url, pershkrimi]);
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // RUAJ NJE IMAZH TE MODIFIKUAR MANUALISHT (nga Filerobot Image Editor, base64 → R2)
  app.post('/api/kreative/ruaj-editim/:id', iLoguar, async (req, res) => {
    const imageBase64 = (req.body && req.body.imageBase64) || '';
    if (!imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Imazh i pavlefshëm.' });
    }
    if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
    try {
      const k = await pool.query('SELECT * FROM kreativitetet WHERE id=$1 AND biznes_id=$2', [req.params.id, req.biznesId]);
      if (!k.rows.length) return res.status(404).json({ error: 'Kreativiteti s\'u gjet.' });
      if (k.rows[0].lloji !== 'imazh') return res.status(400).json({ error: 'Editimi manual vlen vetëm për imazhe.' });

      const match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Formati base64 i pavlefshëm.' });
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buf = Buffer.from(match[2], 'base64');

      const key = 'kreative/' + req.biznesId + '_edit_' + Date.now() + '.' + ext;
      await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: 'image/' + ext }));
      const url = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '') + '/' + key;

      const r = await pool.query(
        `UPDATE kreativitetet SET output_url=$2, perditesuar_at=now()
         WHERE id=$1 RETURNING id, lloji, emri, pershkrimi, output_url, status`,
        [k.rows[0].id, url]);
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
