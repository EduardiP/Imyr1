// Imyr — server (Faza 1 + fillimi i Fazes 2)
// Rrjet cross-promotion per biznese.
// Faza 1: server + databaza + login i sigurt (regjistrim/hyrje).
// Faza 2 (fillim): snippet-i (widget.js), /ad, /track, ruajtja e promovimit, statusi i lidhjes.

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const http = require('http');
const selector = require('./selector');
const analytics = require('./analytics');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Ruajtja e skedareve (Cloudflare R2) ---
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const s3 = process.env.R2_ENDPOINT ? new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY }
}) : null;

// --- Krijimi i tabelave ---
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bizneset (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      emri TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      fjalekalimi TEXT NOT NULL,       -- i hash-uar (bcrypt)
      kategoria TEXT,                  -- kategoria e biznesit
      plani TEXT DEFAULT 'falas',      -- falas | plan1 | plan2 ...
      website TEXT,                    -- faqja e biznesit
      celes TEXT UNIQUE                -- celesi unik per snippet-in
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promovimet (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      titulli TEXT,
      teksti TEXT,
      imazh_url TEXT,
      link TEXT,
      aktiv BOOLEAN DEFAULT true
    );
  `);
  // Seanca (per te mbajtur perdoruesin te loguar)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seancat (
      token TEXT PRIMARY KEY,
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Seanca admin (paneli yt)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_seancat (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // --- Faza 2: kolona shtese per lidhjen/gjurmimin (shtohen vetem nese s'ekzistojne) ---
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS snippet_active BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS origjina TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kandidat_url TEXT`);
  // Analiza AI (kategorizimi + permbledhja per algoritmin)
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pershkrimi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS lejo_analize BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kategoria_kryesore TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS nenkategorite TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS permbledhje TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS tipi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS url_konvertimi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_active BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_url TEXT`);

  // Ngjarjet (shfaqje/klikime) — per gjurmimin
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ngjarjet (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      lloji TEXT,        -- 'view' | 'click'
      origjina TEXT
    );
  `);
  // Atribuimi: cila reklame u shfaq dhe e kujt eshte (reklamuesi)
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS reklama_id INT`);
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS reklamues_id INT`);
  // Gjurmimi i konvertimit: kodi qe lidh klikimin me konvertimin
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS klik_kod TEXT`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ngjarjet_klik_kod ON ngjarjet (klik_kod)`);

  console.log('DB gati.');
}

// --- Ndihmes: krijo nje celes unik ---
function beCeles() {
  return 'imyr_' + crypto.randomBytes(12).toString('hex');
}

// --- Ndihmes: CORS per endpoint-et publike (thirren nga dyqane te tjera) ---
function cors(res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
}

// --- Middleware: kontrollo a eshte i loguar ---
async function iLoguar(req, res, next) {
  const token = req.cookies.imyr_session;
  if (!token) return res.status(401).json({ error: 'Nuk je i loguar.' });
  try {
    const r = await pool.query('SELECT biznes_id FROM seancat WHERE token=$1', [token]);
    if (!r.rows.length) return res.status(401).json({ error: 'Seanca e pavlefshme.' });
    req.biznesId = r.rows[0].biznes_id;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- REGJISTRIM ---
app.post('/api/regjistrohu', async (req, res) => {
  const { emri, email, fjalekalimi, kategoria, website } = req.body;
  const tipi = ['b2b','b2c','b2b2c'].includes(req.body.tipi) ? req.body.tipi : null;
  if (!emri || !email || !fjalekalimi) {
    return res.status(400).json({ error: 'Emri, email dhe fjalekalimi jane te detyrueshem.' });
  }
  if (String(fjalekalimi).length < 6) {
    return res.status(400).json({ error: 'Fjalekalimi duhet te kete te pakten 6 shkronja.' });
  }
  try {
    const hash = await bcrypt.hash(fjalekalimi, 10);
    const celes = beCeles();
    const r = await pool.query(
      `INSERT INTO bizneset (emri, email, fjalekalimi, kategoria, website, celes, tipi)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [emri, email.toLowerCase().trim(), hash, kategoria || null, website || null, celes, tipi]
    );
    // krijo seance (login automatik pas regjistrimit)
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO seancat (token, biznes_id) VALUES ($1,$2)', [token, r.rows[0].id]);
    res.cookie('imyr_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
    res.json({ ok: true, biznes_id: r.rows[0].id });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Ky email eshte i regjistruar tashme.' });
    res.status(500).json({ error: e.message });
  }
});

// --- HYRJE (login) ---
app.post('/api/hyr', async (req, res) => {
  const { email, fjalekalimi } = req.body;
  if (!email || !fjalekalimi) return res.status(400).json({ error: 'Email dhe fjalekalimi jane te detyrueshem.' });
  try {
    const r = await pool.query('SELECT id, fjalekalimi FROM bizneset WHERE email=$1', [email.toLowerCase().trim()]);
    if (!r.rows.length) return res.status(400).json({ error: 'Email ose fjalekalim i gabuar.' });
    const ok = await bcrypt.compare(fjalekalimi, r.rows[0].fjalekalimi);
    if (!ok) return res.status(400).json({ error: 'Email ose fjalekalim i gabuar.' });
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO seancat (token, biznes_id) VALUES ($1,$2)', [token, r.rows[0].id]);
    res.cookie('imyr_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- DIL (logout) ---
app.post('/api/dil', async (req, res) => {
  const token = req.cookies.imyr_session;
  if (token) await pool.query('DELETE FROM seancat WHERE token=$1', [token]).catch(()=>{});
  res.clearCookie('imyr_session');
  res.json({ ok: true });
});

// --- INFO IME (kush jam) ---
app.get('/api/une', iLoguar, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, emri, email, kategoria, plani, website, celes, tipi, url_konvertimi,
              kategoria_kryesore, nenkategorite, permbledhje, pershkrimi
       FROM bizneset WHERE id=$1`, [req.biznesId]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PROGRESI (cilat hapa jane plotesuar) ---
app.get('/api/progres', iLoguar, async (req, res) => {
  try {
    const b = await pool.query(
      'SELECT permbledhje, pershkrimi, snippet_active, url_konvertimi FROM bizneset WHERE id=$1', [req.biznesId]);
    const p = await pool.query('SELECT 1 FROM promovimet WHERE biznes_id=$1 AND aktiv=true LIMIT 1', [req.biznesId]);
    const row = b.rows[0] || {};
    res.json({
      llogaria: true,                                   // i loguar => llogaria gati
      pershkrimi: !!(row.permbledhje || row.pershkrimi),// pershkrimi/AI u dha
      lidhja: !!row.snippet_active,                     // snippet-i u lidh
      konvertimi: !!row.url_konvertimi,                 // url-ja e konvertimit u dha
      reklama: p.rows.length > 0                         // reklama u krijua
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RUAJ URL-EN E KONVERTIMIT (faqja qe shfaqet VETEM pas konvertimit) ---
app.post('/api/url-konvertimi', iLoguar, async (req, res) => {
  let u = (req.body.url || '').trim();
  if (!u) {
    await pool.query('UPDATE bizneset SET url_konvertimi=NULL WHERE id=$1', [req.biznesId]);
    return res.json({ ok: true, url: null });
  }
  try { if (/^https?:\/\//i.test(u)) { const p = new URL(u); u = p.pathname + p.search; } } catch (e) {}
  if (u[0] !== '/') u = '/' + u;
  if (u === '/') {
    return res.status(400).json({ error: "Ballina s'mund të jetë faqe konvertimi — çdo vizitor do të numërohej. Jep një adresë që hapet vetëm pas regjistrimit." });
  }
  try {
    await pool.query('UPDATE bizneset SET url_konvertimi=$2 WHERE id=$1', [req.biznesId, u]);
    res.json({ ok: true, url: u });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- KLIKIMI: sheno klikimin me nje kod, pastaj ridrejto te reklamuesi ---
app.get('/klik', async (req, res) => {
  const key = req.query.key;
  const rid = parseInt(req.query.rid, 10) || null;
  let dest = null;
  try {
    const h = await pool.query('SELECT id FROM bizneset WHERE celes=$1', [key]);
    if (h.rows.length && rid) {
      const p = await pool.query(
        `SELECT p.id, p.biznes_id, COALESCE(p.link, b.website) AS dest
         FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
         WHERE p.id=$1 AND p.aktiv=true`, [rid]);
      if (p.rows.length) {
        const kod = crypto.randomBytes(9).toString('hex');
        await pool.query(
          `INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, klik_kod)
           VALUES ($1,'click',$2,$3,$4,$5)`,
          [h.rows[0].id, req.headers.referer || null, p.rows[0].id, p.rows[0].biznes_id, kod]);
        dest = p.rows[0].dest;
        if (dest) {
          if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest;
          dest += (dest.indexOf('?') === -1 ? '?' : '&') + 'imyr=' + kod;
        }
      }
    }
  } catch (e) {}
  res.redirect(302, dest || '/');
});

// --- KONVERTIMI: numerohet vetem nese ekziston nje klikim i vlefshem ---
app.all('/konvertim', async (req, res) => {
  cors(res);
  const kod = req.query.kod || (req.body && req.body.kod);
  if (!kod) return res.status(204).end();
  try {
    const k = await pool.query(
      `SELECT reklama_id, reklamues_id, created_at FROM ngjarjet
       WHERE klik_kod=$1 AND lloji='click' LIMIT 1`, [kod]);
    if (!k.rows.length) return res.status(204).end();           // kod i panjohur
    const kl = k.rows[0];
    const DITE = 30 * 24 * 3600 * 1000;
    if (Date.now() - new Date(kl.created_at).getTime() > DITE) return res.status(204).end();
    const ekz = await pool.query(
      `SELECT 1 FROM ngjarjet WHERE klik_kod=$1 AND lloji='konvertim' LIMIT 1`, [kod]);
    if (ekz.rows.length) return res.status(204).end();          // nje konvertim per klikim
    await pool.query(
      `INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, klik_kod)
       VALUES ($1,'konvertim',$2,$3,$4,$5)`,
      [kl.reklamues_id, req.headers.origin || req.headers.referer || null,
       kl.reklama_id, kl.reklamues_id, kod]);
  } catch (e) {}
  res.status(204).end();
});

// --- RUAJ PERMBLEDHJEN (klienti editon vetem permbledhjen; kategoria mbetet nga AI) ---
app.post('/api/permbledhje', iLoguar, async (req, res) => {
  const perm = (req.body.permbledhje || '').trim() || null;
  try {
    await pool.query('UPDATE bizneset SET permbledhje=$2 WHERE id=$1', [req.biznesId, perm]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RUAJ PROMOVIMIN (teksti qe do shfaqet ne snippet) ---
app.post('/api/promovimi', iLoguar, async (req, res) => {
  const teksti = (req.body.teksti || '').trim();
  if (!teksti) return res.status(400).json({ error: 'Shkruaj tekstin e promovimit.' });
  try {
    // per tani: nje promovim aktiv per biznes
    await pool.query('DELETE FROM promovimet WHERE biznes_id=$1', [req.biznesId]);
    await pool.query(
      'INSERT INTO promovimet (biznes_id, teksti, aktiv) VALUES ($1,$2,true)',
      [req.biznesId, teksti]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NGARKO SKEDAR (imazh/video/zip) te R2 dhe ruaj si reklame ---
app.post('/api/ngarko', iLoguar, upload.single('file'), async (req, res) => {
  if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
  if (!req.file) return res.status(400).json({ error: "S'ka skedar." });
  const ext = (req.file.originalname.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = 'ads/' + req.biznesId + '_' + Date.now() + '.' + ext;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));
    const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const url = base + '/' + key;
    const titulli = (req.body.titulli || '').trim() || null;
    await pool.query(
      'INSERT INTO promovimet (biznes_id, titulli, imazh_url, aktiv) VALUES ($1,$2,$3,true)',
      [req.biznesId, titulli, url]);
    res.json({ ok: true, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LISTA E REKLAMAVE TE BIZNESIT (Creatives) ---
app.get('/api/reklamat', iLoguar, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, titulli, teksti, imazh_url, created_at FROM promovimet WHERE biznes_id=$1 AND aktiv=true ORDER BY id DESC',
      [req.biznesId]);
    const st = await pool.query(
      `SELECT reklama_id,
              COUNT(*) FILTER (WHERE lloji='view')::int      AS shikime,
              COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE reklamues_id=$1 AND reklama_id IS NOT NULL
       GROUP BY reklama_id`, [req.biznesId]);
    const m = {};
    st.rows.forEach(x => { m[x.reklama_id] = x; });
    const rows = r.rows.map(x => ({
      id: x.id,
      emri: x.titulli || (x.teksti ? x.teksti.slice(0, 40) : 'Reklamë'),
      imazh_url: x.imazh_url || null,
      shikime:    (m[x.id] && m[x.id].shikime)    || 0,
      klikime:    (m[x.id] && m[x.id].klikime)    || 0,
      konvertime: (m[x.id] && m[x.id].konvertime) || 0
    }));
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- STATUSI (a u lidh snippet-i te dyqani) ---
// Dritarja e "gjalle": nese e kemi pare snippet-in brenda kesaj kohe, quhet aktiv tani.
const DRITARJA_LIVE_MS = 10 * 60 * 1000; // 10 minuta
app.get('/api/status', iLoguar, async (req, res) => {
  try {
    const b = await pool.query(
      'SELECT snippet_active, origjina, last_seen_at FROM bizneset WHERE id=$1', [req.biznesId]);
    const p = await pool.query('SELECT teksti FROM promovimet WHERE biznes_id=$1 ORDER BY id DESC LIMIT 1', [req.biznesId]);
    const row = b.rows[0] || {};
    const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
    const live = lastSeen > 0 && (Date.now() - lastSeen) < DRITARJA_LIVE_MS;
    res.json({
      active: !!row.snippet_active,             // a u lidh ndonjehere (kerkese reale, jo preview)
      live: live,                               // a po e shohim tani (i fresket)
      origjina: row.origjina || null,
      last_seen_at: row.last_seen_at || null,
      teksti: p.rows.length ? p.rows[0].teksti : null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Ndihmes: merr HTML-in e nje faqeje (server-ane, pa varesi shtese) ---
function merrFaqen(url, thellesia = 0) {
  return new Promise((resolve, reject) => {
    if (thellesia > 4) return reject(new Error('shume ridrejtime'));
    const lib = url.startsWith('https') ? https : http;
    const opts = { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    } };
    const kerkesa = lib.get(url, opts, resp => {
      if ([301,302,303,307,308].includes(resp.statusCode) && resp.headers.location) {
        resp.resume();
        return resolve(merrFaqen(new URL(resp.headers.location, url).toString(), thellesia + 1));
      }
      const status = resp.statusCode;
      let data = '';
      resp.on('data', c => { data += c; if (data.length > 2000000) resp.destroy(); });
      resp.on('end', () => resolve({ status, body: data }));
    });
    kerkesa.on('error', reject);
    kerkesa.setTimeout(8000, () => kerkesa.destroy(new Error('koha skadoi')));
  });
}

// --- VERIFIKO (server-ane): a eshte kodi i vendosur te faqja? (pa vizitore) ---
app.post('/api/verifiko', iLoguar, async (req, res) => {
  try {
    const biz = await pool.query('SELECT celes, website FROM bizneset WHERE id=$1', [req.biznesId]);
    if (!biz.rows.length) return res.status(400).json({ error: 'Biznes i panjohur.' });
    const celes = biz.rows[0].celes;
    let url = (req.body.url || biz.rows[0].website || '').trim();
    if (!url) return res.status(400).json({ error: 'Jep URL-ne e faqes ku e vendose kodin.' });
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    let faqja;
    try { faqja = await merrFaqen(url); }
    catch (e) { return res.json({ found: false, error: "S'u arrit faqja: " + e.message, url }); }

    const found = faqja.body.includes(celes); // celes-i shfaqet te data-key i snippet-it
    if (found) {
      await pool.query(
        `UPDATE bizneset SET snippet_active=true,
           first_seen_at=COALESCE(first_seen_at, now()),
           last_seen_at=now(), origjina=$2 WHERE id=$1`,
        [req.biznesId, url]
      );
      return res.json({ found: true, url });
    }
    // Diagnostike me e qarte kur s'gjendet
    let error;
    if (faqja.status >= 400) {
      error = 'Faqja u përgjigj me status ' + faqja.status + ' — ndoshta është me fjalëkalim ose e paarritshme publikisht.';
    } else {
      error = 'Faqja u arrit (status ' + faqja.status + ') por kodi s\'u gjet aty. Ndoshta tema është draft/e papublikuar, ose kodi s\'u ruajt te kjo faqe.';
    }
    res.json({ found: false, url, status: faqja.status, error });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- KONTROLLO (auto): kontrollon vete faqen e regjistruar, pa vizitore ---
const kontrolliFundit = new Map(); // biznes_id -> timestamp (throttle)
app.get('/api/kontrollo', iLoguar, async (req, res) => {
  try {
    const b = await pool.query(
      'SELECT celes, website, kandidat_url, snippet_active, origjina, last_seen_at FROM bizneset WHERE id=$1', [req.biznesId]);
    if (!b.rows.length) return res.status(400).json({ error: 'Biznes i panjohur.' });
    const row = b.rows[0];
    const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
    const live = lastSeen > 0 && (Date.now() - lastSeen) < DRITARJA_LIVE_MS;

    // Nese eshte tashme i lidhur, kthe statusin (mos e ngarko faqen kot).
    if (row.snippet_active) {
      return res.json({ active: true, live, origjina: row.origjina || null });
    }

    // URL per kontroll: fillimisht ajo qe u kap vete (kandidat), pastaj website-i i regjistruar.
    let url = (row.kandidat_url || row.website || '').trim();
    if (!url) return res.json({ active: false, live: false, siteMissing: true });
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    // Throttle: nje ngarkim faqeje cdo 5s per biznes (edhe nese frontend-i pyet me shpesh).
    const tani = Date.now();
    if (tani - (kontrolliFundit.get(req.biznesId) || 0) >= 5000) {
      kontrolliFundit.set(req.biznesId, tani);
      try {
        const faqja = await merrFaqen(url);
        if (faqja.body.includes(row.celes)) {
          await pool.query(
            `UPDATE bizneset SET snippet_active=true,
               first_seen_at=COALESCE(first_seen_at, now()),
               last_seen_at=now(), origjina=$2 WHERE id=$1`,
            [req.biznesId, url]);
          return res.json({ active: true, live: true, origjina: url });
        }
      } catch (e) { /* faqja s'u arrit — ende pa lidhur */ }
    }
    res.json({ active: false, live: false, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TAG.JS (tag i vogel vetem per LIDHJE — firon nga cdo faqe, s'ka nevoje per slot) ---
app.get('/tag.js', (req, res) => {
  res.type('application/javascript');
  res.send(`(function(){
  var s = document.currentScript;
  var key = s ? s.getAttribute('data-key') : null;
  var base = s ? new URL(s.src).origin : '';
  if(!key) return;
  if(window.Shopify && window.Shopify.designMode) return; // mos numero preview-in e Shopify
  function njofto(){
    try {
      var u = base + '/lidh?key=' + encodeURIComponent(key);
      navigator.sendBeacon ? navigator.sendBeacon(u) : fetch(u, {mode:'no-cors'});
    } catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', njofto);
  else njofto();
})();`);
});

// --- LIDH (sinjali i tag-ut: shenon lidhjen + URL-en, pa lidhje me slot-in) ---
app.all('/lidh', async (req, res) => {
  cors(res);
  const key = req.query.key;
  if (!key) return res.status(204).end();
  try {
    const b = await pool.query('SELECT id, snippet_active FROM bizneset WHERE celes=$1', [key]);
    if (b.rows.length) {
      const bizId = b.rows[0].id;
      const faqja = req.headers.referer || req.headers.origin || null;
      if (!b.rows[0].snippet_active) {
        await pool.query(
          `UPDATE bizneset SET snippet_active=true, first_seen_at=now(), last_seen_at=now(),
             origjina=$2, kandidat_url=COALESCE(kandidat_url,$2) WHERE id=$1`,
          [bizId, faqja]);
      } else {
        await pool.query('UPDATE bizneset SET last_seen_at=now() WHERE id=$1', [bizId]);
      }
    }
  } catch (e) {}
  res.status(204).end();
});

// --- IMYR.JS (gjithcka ne nje rresht: lidhje + hapesire + reklame + gjurmim) ---
app.get('/imyr.js', (req, res) => {
  res.type('application/javascript');
  res.send(`(function(){
  var s = document.currentScript;
  var key = s ? s.getAttribute('data-key') : null;
  var base = s ? new URL(s.src).origin : '';
  if(!key) return;
  var preview = !!(window.Shopify && window.Shopify.designMode);
  function esc(t){ var d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

  // ---------- KODI I KLIKIMIT ----------
  function ruajKod(kod){
    try { localStorage.setItem('imyr_klik', kod); } catch(e){}
    try {
      var pjeset = location.hostname.split('.');
      var rrenja = pjeset.length > 1 ? '.' + pjeset.slice(-2).join('.') : location.hostname;
      document.cookie = 'imyr_klik=' + kod + ';path=/;max-age=2592000;SameSite=Lax';
      document.cookie = 'imyr_klik=' + kod + ';path=/;max-age=2592000;domain=' + rrenja + ';SameSite=Lax';
    } catch(e){}
  }
  function lexoKod(){
    try { var v = localStorage.getItem('imyr_klik'); if(v) return v; } catch(e){}
    var m = document.cookie.match(/(?:^|;\\s*)imyr_klik=([^;]+)/);
    return m ? m[1] : null;
  }
  try { var qp = new URLSearchParams(location.search).get('imyr'); if(qp) ruajKod(qp); } catch(e){}

  // ---------- KONVERTIMI ----------
  function dergoKonv(){
    var kod = lexoKod(); if(!kod || preview) return;
    try { if(localStorage.getItem('imyr_konv_' + kod)) return; } catch(e){}
    try {
      var u = base + '/konvertim?kod=' + encodeURIComponent(kod);
      navigator.sendBeacon ? navigator.sendBeacon(u) : fetch(u, {mode:'no-cors'});
      localStorage.setItem('imyr_konv_' + kod, '1');
    } catch(e){}
  }
  window.imyr = window.imyr || {};
  window.imyr.konvertim = dergoKonv;

  function kontrolloKonvertim(konvUrl){
    if(!konvUrl || preview) return;
    if(!lexoKod()) return;
    var tani = location.pathname + location.search;
    var pos = tani.indexOf(konvUrl); if(pos === -1) return;
    var pas = tani.charAt(pos + konvUrl.length);
    if(pas !== '' && pas !== '?' && pas !== '#' && pas !== '/' && pas !== '&') return;
    dergoKonv();
  }

  // ---------- NJOFTO LIDHJEN ----------
  if(!preview){
    try {
      var pu = base + '/track-lidh?key=' + encodeURIComponent(key);
      navigator.sendBeacon ? navigator.sendBeacon(pu) : fetch(pu, {mode:'no-cors'});
    } catch(e){}
  }

  // ---------- HAPESIRA E REKLAMES ----------
  // 1) Nese ekziston <div id="imyr-slot"> => reklama shfaqet aty.
  // 2) Perndryshe krijohet menjehere pas skriptit — POR vetem nese skripti
  //    s'eshte vendosur direkt te <body>/<head> (d.m.th. te layout-i).
  //    Keshtu, i njejti rresht te layout-i gjurmon kudo pa nxjerre reklama kudo.
  function gjejSlot(){
    var el = document.getElementById('imyr-slot');
    if(el) return el;
    if(!s || !s.parentNode) return null;
    var p = s.parentNode.nodeName;
    if(p === 'BODY' || p === 'HEAD' || p === 'HTML') return null;
    el = document.createElement('div'); el.id = 'imyr-slot';
    s.parentNode.insertBefore(el, s.nextSibling);
    return el;
  }

  function run(){
    var slot = gjejSlot();
    if(!slot){
      // Vetem gjurmim (skripti eshte te layout-i, pa hapesire reklame ketu)
      if(!preview && lexoKod()){
        fetch(base + '/cil?key=' + encodeURIComponent(key))
          .then(function(r){ return r.json(); })
          .then(function(c){ kontrolloKonvertim(c && c.konv_url); })
          .catch(function(){});
      }
      return;
    }
    fetch(base + '/ad?key=' + encodeURIComponent(key) + (preview?'&preview=1':''))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d) return;
        kontrolloKonvertim(d.konv_url);
        if(d.imazh_url || d.teksti){
          var rid = d.id ? ('&rid=' + encodeURIComponent(d.id)) : '';
          var inner;
          if(d.imazh_url){
            inner = '<img src="' + d.imazh_url + '" style="display:block;max-width:100%;height:auto;border-radius:10px;">';
          } else {
            inner = '<div style="display:inline-block;max-width:100%;box-sizing:border-box;'
              + 'border:1px solid #e2c68a;background:#fbf6ea;color:#5a4a24;padding:12px 14px;border-radius:10px;'
              + 'font:14px/1.5 system-ui,sans-serif;">' + esc(d.teksti) + '</div>';
          }
          if(!preview){
            var href = base + '/klik?key=' + encodeURIComponent(key) + rid;
            inner = '<a href="' + href + '" target="_blank" rel="noopener"'
              + ' style="text-decoration:none;display:inline-block;max-width:100%;cursor:pointer;">' + inner + '</a>';
          }
          slot.innerHTML = inner;
          if(!preview){ try { var v = base + '/track?key=' + encodeURIComponent(key) + '&event=view' + rid;
            navigator.sendBeacon ? navigator.sendBeacon(v) : fetch(v); } catch(e){} }
        }
      })
      .catch(function(){});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();`);
});

// --- KODI GJURMUES U NGARKUA (konfirmimi i lidhjes) ---
app.all('/track-lidh', async (req, res) => {
  cors(res);
  try {
    await pool.query(
      `UPDATE bizneset SET track_active=true, track_seen_at=now(), track_url=$2 WHERE celes=$1`,
      [req.query.key, req.headers.referer || req.headers.origin || null]);
  } catch (e) {}
  res.status(204).end();
});

// --- STATUSI I KODIT GJURMUES ---
app.get('/api/track-status', iLoguar, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT track_active, track_seen_at, track_url FROM bizneset WHERE id=$1', [req.biznesId]);
    res.json(r.rows[0] || { track_active: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CILESIMET E GJURMIMIT (endpoint i lehte per imyr-track.js) ---
app.get('/cil', async (req, res) => {
  cors(res);
  try {
    const b = await pool.query('SELECT url_konvertimi FROM bizneset WHERE celes=$1', [req.query.key]);
    res.json({ konv_url: b.rows.length ? (b.rows[0].url_konvertimi || null) : null });
  } catch (e) { res.json({ konv_url: null }); }
});

// --- IMYR-TRACK.JS (vetem gjurmim: vendoset ne CDO faqe, s'shfaq asgje) ---
app.get('/imyr-track.js', (req, res) => {
  res.type('application/javascript');
  res.send(`(function(){
  var s = document.currentScript;
  var key = s ? s.getAttribute('data-key') : null;
  var base = s ? new URL(s.src).origin : '';
  if(!key) return;
  var preview = !!(window.Shopify && window.Shopify.designMode);

  function ruajKod(kod){
    try { localStorage.setItem('imyr_klik', kod); } catch(e){}
    try {
      var pjeset = location.hostname.split('.');
      var rrenja = pjeset.length > 1 ? '.' + pjeset.slice(-2).join('.') : location.hostname;
      document.cookie = 'imyr_klik=' + kod + ';path=/;max-age=2592000;SameSite=Lax';
      document.cookie = 'imyr_klik=' + kod + ';path=/;max-age=2592000;domain=' + rrenja + ';SameSite=Lax';
    } catch(e){}
  }
  function lexoKod(){
    try { var v = localStorage.getItem('imyr_klik'); if(v) return v; } catch(e){}
    var m = document.cookie.match(/(?:^|;\\s*)imyr_klik=([^;]+)/);
    return m ? m[1] : null;
  }
  try {
    var qp = new URLSearchParams(location.search).get('imyr');
    if(qp) ruajKod(qp);
  } catch(e){}

  function dergo(){
    var kod = lexoKod(); if(!kod || preview) return;
    try { if(localStorage.getItem('imyr_konv_' + kod)) return; } catch(e){}
    try {
      var u = base + '/konvertim?kod=' + encodeURIComponent(kod);
      navigator.sendBeacon ? navigator.sendBeacon(u) : fetch(u, {mode:'no-cors'});
      localStorage.setItem('imyr_konv_' + kod, '1');
    } catch(e){}
  }
  window.imyr = window.imyr || {};
  window.imyr.konvertim = dergo;

  // Njofto nje here qe kodi u ngarkua (per konfirmimin te profili)
  if(!preview){
    try {
      var pu = base + '/track-lidh?key=' + encodeURIComponent(key);
      navigator.sendBeacon ? navigator.sendBeacon(pu) : fetch(pu, {mode:'no-cors'});
    } catch(e){}
  }

  // A eshte kjo faqja e suksesit? (vetem nese ka kod te ruajtur)
  if(!lexoKod() || preview) return;
  fetch(base + '/cil?key=' + encodeURIComponent(key))
    .then(function(r){ return r.json(); })
    .then(function(c){
      var konvUrl = c && c.konv_url; if(!konvUrl) return;
      var tani = location.pathname + location.search;
      var pos = tani.indexOf(konvUrl); if(pos === -1) return;
      var pas = tani.charAt(pos + konvUrl.length);
      if(pas !== '' && pas !== '?' && pas !== '#' && pas !== '/' && pas !== '&') return;
      dergo();
    })
    .catch(function(){});
})();`);
});

// --- WIDGET.JS (snippet-i qe vendoset te dyqani) ---
app.get('/widget.js', (req, res) => {
  res.type('application/javascript');
  res.send(`(function(){
  var s = document.currentScript;
  var key = s ? s.getAttribute('data-key') : null;
  var base = s ? new URL(s.src).origin : '';
  // Preview i Shopify (editori): shfaqe reklamen, por MOS e numero si lidhje reale.
  var preview = !!(window.Shopify && window.Shopify.designMode);
  var pq = preview ? '&preview=1' : '';
  function esc(t){ var d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
  function run(){
    var slot = document.getElementById('imyr-slot');
    if(!slot || !key) return;
    fetch(base + '/ad?key=' + encodeURIComponent(key) + pq)
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d && d.teksti){
          slot.innerHTML = '<div style="border:1px solid #e2c68a;background:#fbf6ea;color:#5a4a24;'
            + 'padding:12px 14px;border-radius:10px;font:14px/1.5 system-ui,sans-serif;cursor:pointer;">'
            + esc(d.teksti) + '</div>';
          if(!preview){
            try {
              var u = base + '/track?key=' + encodeURIComponent(key) + '&event=view';
              navigator.sendBeacon ? navigator.sendBeacon(u) : fetch(u);
            } catch(e){}
          }
          slot.addEventListener('click', function(){
            if(preview) return;
            try { fetch(base + '/track?key=' + encodeURIComponent(key) + '&event=click'); } catch(e){}
          });
        }
      })
      .catch(function(){});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();`);
});

// --- AD (kthen permbajtjen + shenon lidhjen ne kerkesen e pare) ---
app.get('/ad', async (req, res) => {
  cors(res);
  const key = req.query.key;
  if (!key) return res.json({ teksti: null });
  const preview = req.query.preview === '1';
  try {
    const b = await pool.query('SELECT id, snippet_active, url_konvertimi FROM bizneset WHERE celes=$1', [key]);
    if (!b.rows.length) return res.json({ teksti: null });
    const bizId = b.rows[0].id;
    const origin = req.headers.origin || req.headers.referer || null;
    // URL e plote e faqes ku u ngarkua widget-i (per te kontrolluar pikerisht ate faqe, jo vetem homepage-in)
    const faqjaPlote = req.headers.referer || req.headers.origin || null;

    // Kap faqen ku ndodhet kodi (edhe ne preview) — PA e shenuar te lidhur.
    // Ruajme URL-en e plote me te fundit ku u pa widget-i; kjo perdoret per kontrollin server-ane.
    if (faqjaPlote) {
      await pool.query('UPDATE bizneset SET kandidat_url=$2 WHERE id=$1', [bizId, faqjaPlote]);
    }

    // VETEM per kerkesa reale (jo preview i Shopify): sheno lidhjen + heartbeat.
    if (!preview) {
      if (!b.rows[0].snippet_active) {
        // ngarkim real (faqe e ruajtur/live): shenim i lidhjes
        await pool.query(
          'UPDATE bizneset SET snippet_active=true, first_seen_at=now(), last_seen_at=now(), origjina=$2 WHERE id=$1',
          [bizId, origin]
        );
      } else {
        // heartbeat: e pame perseri tani (per statusin "live")
        await pool.query('UPDATE bizneset SET last_seen_at=now() WHERE id=$1', [bizId]);
      }
    }

    // Shperndarja: logjika ndodhet te selector.js (ndryshohet vetem aty).
    const rek = await selector.zgjidhReklame(pool, bizId);
    // konv_url = faqja e konvertimit E KETIJ biznesi (snippet-i e perdor per te njohur suksesin)
    res.json(Object.assign({ konv_url: b.rows[0].url_konvertimi || null }, rek || {}));
  } catch (e) {
    res.json({ teksti: null });
  }
});

// --- TRACK (shfaqje/klikime) ---
app.all('/track', async (req, res) => {
  cors(res);
  if (req.query.preview === '1') return res.status(204).end(); // injoro preview-in
  const key = req.query.key;
  const lloji = req.query.event === 'click' ? 'click' : 'view';
  const rid = parseInt(req.query.rid, 10) || null;
  try {
    const b = await pool.query('SELECT id FROM bizneset WHERE celes=$1', [key]);
    if (b.rows.length) {
      let reklamuesId = null;
      if (rid) {
        const pr = await pool.query('SELECT biznes_id FROM promovimet WHERE id=$1', [rid]);
        if (pr.rows.length) reklamuesId = pr.rows[0].biznes_id;
      }
      await pool.query(
        'INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id) VALUES ($1,$2,$3,$4,$5)',
        [b.rows[0].id, lloji, req.headers.origin || req.headers.referer || null, rid, reklamuesId]
      );
    }
  } catch (e) {}
  res.status(204).end();
});

// --- Ndihmes: pastro HTML-in ne tekst te thjeshte ---
function pastroHtml(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kategorite kryesore (korniza; AI zgjedh SAKTESISHT nje prej tyre)
const KATEGORITE = [
  'Marketing & Growth', 'Sales & CRM', 'Finance & Accounting', 'HR & Recruiting',
  'Productivity & Collaboration', 'Developer Tools & Infrastructure', 'Design & Creative',
  'Customer Support & Success', 'Analytics & Data', 'E-commerce Tools',
  'Security & Compliance', 'AI/ML Tools'
];

// --- ANALIZO (AI): kategori kryesore + nenkategori + permbledhje per algoritmin ---
app.post('/api/analizo', iLoguar, async (req, res) => {
  const pershkrimi = (req.body.pershkrimi || '').trim();
  const lejo = !!req.body.lejo;
  try {
    await pool.query('UPDATE bizneset SET pershkrimi=$2, lejo_analize=$3 WHERE id=$1',
      [req.biznesId, pershkrimi || null, lejo]);

    // nese lejohet, merr tekstin e faqes se biznesit
    let webTekst = '';
    if (lejo) {
      const b = await pool.query('SELECT website FROM bizneset WHERE id=$1', [req.biznesId]);
      let url = (b.rows[0] && b.rows[0].website || '').trim();
      if (url) {
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        try { const f = await merrFaqen(url); webTekst = pastroHtml(f.body).slice(0, 4000); } catch (e) {}
      }
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      // Pa AI: ruaj pershkrimin, kthe njoftim (kategorizimi behet me vone)
      return res.json({ ok: true, ai: false, note: "AI s'është konfiguruar ende (mungon OPENAI_API_KEY)." });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const sys = 'Je analist qe klasifikon biznese SaaS per nje rrjet cross-promotion. Kthe VETEM JSON, pa asnje tekst tjeter.';
    const user =
      'Zgjidh SAKTESISHT nje kategori kryesore nga kjo liste: ' + KATEGORITE.join('; ') + '.\n\n' +
      'Pershkrimi i dhene nga biznesi: ' + (pershkrimi || '(pa pershkrim)') + '\n\n' +
      (webTekst ? ('Teksti i nxjerre nga faqja e biznesit:\n' + webTekst + '\n\n') : '') +
      'Kthe JSON me keto fusha:\n' +
      '{"kategoria_kryesore": string (SAKTESISHT nje nga lista), ' +
      '"nenkategorite": string[] (2-4 nenkategori specifike), ' +
      '"permbledhje": string (1-3 fjali te qarta qe tregojne cfare ofron biznesi dhe audiencen e tij, ' +
      'te shkruara ashtu qe nje algoritem te gjeje me cilat sherbime plotesuese (jo konkurrente) mund te cohet)}';

    let parsed = {};
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model, temperature: 0, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
        })
      });
      const data = await r.json();
      if (data.error) return res.json({ ok: true, ai: false, note: 'AI: ' + data.error.message });
      parsed = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      return res.json({ ok: true, ai: false, note: 'Analiza AI dështoi: ' + e.message });
    }

    const kk = parsed.kategoria_kryesore || null;
    const nk = Array.isArray(parsed.nenkategorite) ? parsed.nenkategorite.join(', ') : (parsed.nenkategorite || null);
    const perm = parsed.permbledhje || null;

    await pool.query(
      'UPDATE bizneset SET kategoria_kryesore=$2, nenkategorite=$3, permbledhje=$4, kategoria=$2 WHERE id=$1',
      [req.biznesId, kk, nk, perm]);

    res.json({ ok: true, ai: true, kategoria_kryesore: kk, nenkategorite: nk, permbledhje: perm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ADMIN: autentikimi (paneli yt) ---
async function iAdmin(req, res, next){
  const token = req.cookies.imyr_admin;
  if(!token) return res.status(401).json({ error: "S'je i loguar si admin." });
  try {
    const r = await pool.query('SELECT 1 FROM admin_seancat WHERE token=$1', [token]);
    if(!r.rows.length) return res.status(401).json({ error: 'Seanca e pavlefshme.' });
    next();
  } catch(e){ res.status(500).json({ error: e.message }); }
}
app.post('/api/admin/hyr', async (req, res) => {
  const pass = req.body.password || '';
  const real = process.env.ADMIN_PASSWORD;
  if(!real) return res.status(500).json({ error: "ADMIN_PASSWORD s'është caktuar te serveri." });
  if(pass !== real) return res.status(400).json({ error: 'Fjalëkalim i gabuar.' });
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('INSERT INTO admin_seancat (token) VALUES ($1)', [token]);
  res.cookie('imyr_admin', token, { httpOnly:true, sameSite:'lax', maxAge:7*24*60*60*1000 });
  res.json({ ok:true });
});
app.post('/api/admin/dil', async (req, res) => {
  const t = req.cookies.imyr_admin;
  if(t) await pool.query('DELETE FROM admin_seancat WHERE token=$1', [t]).catch(()=>{});
  res.clearCookie('imyr_admin'); res.json({ ok:true });
});
app.get('/api/admin/une', iAdmin, (req, res) => res.json({ ok:true }));

// Lista e bizneseve (emer + email)
app.get('/api/admin/bizneset', iAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, emri, email FROM bizneset ORDER BY created_at DESC');
    res.json(r.rows);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Detajet e nje biznesi + statistika
app.get('/api/admin/biznes/:id', iAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const b = await pool.query(
      `SELECT id, emri, email, website, kategoria_kryesore, nenkategorite, permbledhje, pershkrimi,
              plani, celes, created_at, snippet_active, origjina, kandidat_url, first_seen_at, last_seen_at
       FROM bizneset WHERE id=$1`, [id]);
    if(!b.rows.length) return res.status(404).json({ error: 'Nuk u gjet.' });
    const statistika = await analytics.statistikaBiznesi(pool, id);
    res.json({ biznes: b.rows[0], statistika });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// --- Faqet ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
// --- SAJTI I PROVES (test-saas.js — fshije bashke me kete bllok kur te mbaroje testimi) ---
const testSaas = require('./test-saas');
app.get('/test', (req, res) => res.send(testSaas.faqet.ballina()));
app.get('/test/regjistrohu', (req, res) => res.send(testSaas.faqet.regjistrohu()));
app.get('/test/welcome', (req, res) => res.send(testSaas.faqet.welcome()));
const testSaas2 = require('./test-saas2');
app.get('/test2', (req, res) => res.send(testSaas2.faqet.ballina()));
app.get('/test2/regjistrohu', (req, res) => res.send(testSaas2.faqet.regjistrohu()));
app.get('/test2/welcome', (req, res) => res.send(testSaas2.faqet.welcome()));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// health check
app.get('/health', (req, res) => res.json({ ok: true, koha: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
initDB()
  .then(() => app.listen(PORT, () => console.log('Imyr po punon ne portin ' + PORT)))
  .catch(e => {
    console.error('Gabim init DB:', e.message);
    // Nis serverin gjithsesi qe health check te punoje
    app.listen(PORT, () => console.log('Imyr (pa DB) ne portin ' + PORT));
  });
