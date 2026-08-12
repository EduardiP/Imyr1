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
const platforma = require('./platforma');
const pesha = require('./pesha');
const kombinimi = require('./kombinimi');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();

// Ridrejto URL-en e Railway te domain-i i vertete (per SEO dhe qartesi).
// Aktiv vetem nese PRIMARY_HOST eshte vendosur te variablat.
app.use((req, res, next) => {
  const primar = process.env.PRIMARY_HOST;   // p.sh. phronexusai.com
  if (primar && req.headers.host && req.headers.host !== primar) {
    // Mos ridrejto: snippet-et/endpoint-et (klientet i kane vendosur me URL-en e vjeter),
    // dhe admin/api (qe login-i e cookie-t te mos prishen mes domain-eve).
    const perjashto = ['/imyr.js','/imyr-track.js','/tag.js','/lidh','/track-lidh','/ad','/cil','/track','/klik','/konvertim','/konvertim-verifiko','/diag','/diag-zonat','/admin','/api'];
    if (!perjashto.some(p => req.path.startsWith(p))) {
      return res.redirect(302, 'https://' + primar + req.originalUrl);
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Migrim: snippet_id te ngjarjet (per te ditur cili snippet i biznesit shfaqi reklamen qe solli shikimin/klikimin/konvertimin)
pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS snippet_id INTEGER`).catch(e => console.error('migrim snippet_id:', e.message));

// Migrim: logjika e shperndarjes (ankand | barazi) — parazgjedhje 'ankand' per te GJITHA (ekzistueset + te reja)
pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS logjika_shperndarjes TEXT NOT NULL DEFAULT 'ankand'`).catch(e => console.error('migrim logjika_shperndarjes (bizneset):', e.message));
pool.query(`ALTER TABLE promovimet ADD COLUMN IF NOT EXISTS logjika_shperndarjes TEXT NOT NULL DEFAULT 'ankand'`).catch(e => console.error('migrim logjika_shperndarjes (promovimet):', e.message));

// Migrim: gjurmimi i perdorimit te "Analizo me AI" (kufi 2/24 ore per biznes)
pool.query(`CREATE TABLE IF NOT EXISTS analizo_perdorimi (
  id SERIAL PRIMARY KEY,
  biznes_id INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
  krijuar_at TIMESTAMPTZ DEFAULT now()
)`).catch(e => console.error('migrim analizo_perdorimi:', e.message));

// Migrim: burimi i ngjarjes ('ankand' | 'barazi') — tani mbushet realisht nga /track,/klik,/konvertim,
// duke lexuar logjika_shperndarjes te vete reklames se treguar (jo nga snippet-i i klientit).
pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS burimi TEXT`).catch(e => console.error('migrim burimi:', e.message));

// Migrim: perqindja Ankand/Balance per HOST (parazgjedhje/"te gjitha snippet-et bashke")
pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS barazi_perqindje INTEGER NOT NULL DEFAULT 50`).catch(e => console.error('migrim barazi_perqindje:', e.message));
// Migrim: menyra e Hosting-ut ('te-gjitha' | 'vecmas') + mbivendosje per-snippet (nese 'vecmas')
pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS hosting_menyra TEXT NOT NULL DEFAULT 'te-gjitha'`).catch(e => console.error('migrim hosting_menyra:', e.message));
pool.query(`ALTER TABLE snippetet ADD COLUMN IF NOT EXISTS barazi_perqindje INTEGER`).catch(e => console.error('migrim barazi_perqindje (snippetet):', e.message));

// Migrim: tabela `balancet` per regjistrimin e vendimeve ne logjiken Balance
require('./balanca')(pool).init().catch(e => console.error('init balancet:', e.message));

// --- Ruajtja e skedareve (Cloudflare R2) ---
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const s3 = process.env.R2_ENDPOINT ? new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY }
}) : null;

// initDB tani eshte te db.js
const { initDB } = require('./db');

// --- Ndihmes: krijo nje celes unik ---
function beCeles() {
  return 'imyr_' + crypto.randomBytes(12).toString('hex');
}

// --- Ndihmes: CORS per endpoint-et publike (thirren nga dyqane te tjera) ---
function cors(res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
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
  const logjika = ['ankand','barazi'].includes(req.body.logjika_shperndarjes) ? req.body.logjika_shperndarjes : 'ankand';
  const oferta = !!req.body.oferta;
  if (!emri || !email || !fjalekalimi) {
    return res.status(400).json({ error: 'Emri, email dhe fjalekalimi jane te detyrueshem.' });
  }
  if (!req.body.kushtet) {
    return res.status(400).json({ error: 'Duhet te pranosh Kushtet dhe Privatesine.' });
  }
  if (String(fjalekalimi).length < 6) {
    return res.status(400).json({ error: 'Fjalekalimi duhet te kete te pakten 6 shkronja.' });
  }
  try {
    const hash = await bcrypt.hash(fjalekalimi, 10);
    const celes = beCeles();
    const r = await pool.query(
      `INSERT INTO bizneset (emri, email, fjalekalimi, kategoria, website, celes, tipi, logjika_shperndarjes, pranoi_kushtet, pranoi_oferta, pranoi_kushtet_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,now()) RETURNING id`,
      [emri, email.toLowerCase().trim(), hash, kategoria || null, website || null, celes, tipi, logjika, oferta]
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
    if (!r.rows[0].fjalekalimi) return res.status(400).json({ error: 'Kjo llogari u krijua me Google. Hyr me Google.' });
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

// Mban perkohesisht te dhenat e Google-it derisa perdoruesi i ri te pranoje kushtet
const googlePending = {};
setInterval(() => { const tani = Date.now(); for (const k in googlePending) { if (tani - googlePending[k].koha > 15*60*1000) delete googlePending[k]; } }, 5*60*1000);

// Kontroll çdo 24 orë: verifikon nëse snippet-et aktive janë ende te faqja.
// Nëse kodi u hoq (s'gjendet me celes+imyr.js), snippet_active → false.
// Kur biznesi s'ka asnjë snippet aktiv, reklamat e tij ndalen automatikisht (selektori i filtron).
async function kontrolloSnippetet24h() {
  try {
    const r = await pool.query(
      `SELECT s.id, s.celes, b.website
       FROM snippetet s JOIN bizneset b ON b.id = s.biznes_id
       WHERE b.website IS NOT NULL AND b.website <> ''`);
    for (const s of r.rows) {
      let faqja = s.website;
      if (!/^https?:\/\//i.test(faqja)) faqja = 'https://' + faqja;
      let gjendet = false, arritur = false;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const resp = await fetch(faqja, { signal: ctrl.signal, redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } });
        clearTimeout(t);
        const html = await resp.text();
        arritur = true;
        if (html.indexOf('imyr.js') !== -1 && html.indexOf(s.celes) !== -1) gjendet = true;
      } catch (e) { arritur = false; }
      // Vendos statusin AKTUAL: nese e arritEm faqen, statusi pasqyron gjendjen reale.
      // (NEse s'e arritEm faqen, s'e prekim — mund tE jetE bllokim i pErkohshEm.)
      if (arritur) {
        await pool.query('UPDATE snippetet SET snippet_active=$1 WHERE id=$2', [gjendet, s.id]);
      }
      await new Promise(res => setTimeout(res, 1000));  // pauze mes kontrolleve
    }
  } catch (e) {}
}
setInterval(kontrolloSnippetet24h, 24 * 3600 * 1000);  // çdo 24 orë

// --- LOGIN ME GOOGLE ---
app.get('/auth/google', (req, res) => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!cid || !appUrl) return res.status(500).send('Google login s\'është konfiguruar.');
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: appUrl + '/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account'
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const cid = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!code || !cid || !secret || !appUrl) return res.redirect('/?login=gabim');
  try {
    // 1. Shkembe kodin per token
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: cid, client_secret: secret,
        redirect_uri: appUrl + '/auth/google/callback',
        grant_type: 'authorization_code'
      })
    });
    const tok = await tokRes.json();
    if (!tok.access_token) return res.redirect('/?login=gabim');

    // 2. Merr profilin (email + emri)
    const uRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + tok.access_token }
    });
    const u = await uRes.json();
    if (!u.email) return res.redirect('/?login=gabim');
    const email = u.email.toLowerCase().trim();
    const emri = u.name || email.split('@')[0];

    // 3. Gjej ose krijo biznesin
    let biz = await pool.query('SELECT id FROM bizneset WHERE email=$1', [email]);
    if (biz.rows.length) {
      // Ekziston => hyr direkt
      const token = crypto.randomBytes(24).toString('hex');
      await pool.query('INSERT INTO seancat (token, biznes_id) VALUES ($1,$2)', [token, biz.rows[0].id]);
      res.cookie('imyr_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
      return res.redirect('/?login=ok');
    }
    // Hyrje e PARE (ose pas fshirjes) => kerko pranimin e kushteve para se te krijohet
    const pending = crypto.randomBytes(16).toString('hex');
    googlePending[pending] = { email, emri, koha: Date.now() };
    res.cookie('imyr_pending', pending, { httpOnly: true, sameSite: 'lax', maxAge: 15*60*1000 });
    return res.redirect('/?login=kushte');
  } catch (e) {
    res.redirect('/?login=gabim');
  }
});

// --- Kush eshte ne pritje te pranimit (per faqen e kushteve) ---
app.get('/api/google-pending', (req, res) => {
  const p = req.cookies.imyr_pending;
  if (!p || !googlePending[p]) return res.json({ pending: false });
  res.json({ pending: true, emri: googlePending[p].emri, email: googlePending[p].email });
});

// --- Perfundo krijimin e llogarise Google pas pranimit te kushteve ---
app.post('/api/google-prano', async (req, res) => {
  const p = req.cookies.imyr_pending;
  if (!p || !googlePending[p]) return res.status(400).json({ error: 'Seanca skadoi. Provo sërish.' });
  if (!req.body.kushtet) return res.status(400).json({ error: 'Duhet të pranosh Kushtet dhe Privatësinë.' });
  const { email, emri } = googlePending[p];
  const oferta = !!req.body.oferta;
  try {
    // Nese u krijua ndermjet kohes, thjesht hyr
    let biz = await pool.query('SELECT id FROM bizneset WHERE email=$1', [email]);
    let bizId;
    if (biz.rows.length) {
      bizId = biz.rows[0].id;
    } else {
      const celes = beCeles();
      const ins = await pool.query(
        `INSERT INTO bizneset (emri, email, fjalekalimi, celes, pranoi_kushtet, pranoi_oferta, pranoi_kushtet_at)
         VALUES ($1,$2,$3,$4,true,$5,now()) RETURNING id`,
        [emri, email, null, celes, oferta]);
      bizId = ins.rows[0].id;
    }
    delete googlePending[p];
    res.clearCookie('imyr_pending');
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO seancat (token, biznes_id) VALUES ($1,$2)', [token, bizId]);
    res.cookie('imyr_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TE DHENAT BAZE TE BIZNESIT (emri + website + tipi) — pas login-it me Google ---
app.post('/api/biz-baza', iLoguar, async (req, res) => {
  const emri = (req.body.emri || '').trim();
  const website = (req.body.website || '').trim();
  const tipi = ['b2b','b2c','b2b2c'].includes(req.body.tipi) ? req.body.tipi : null;
  if (!emri || !website || !tipi) return res.status(400).json({ error: 'Emri, website dhe tipi jane te detyrueshem.' });
  try {
    if (['ankand','barazi'].includes(req.body.logjika_shperndarjes)) {
      await pool.query('UPDATE bizneset SET emri=$2, website=$3, tipi=$4, logjika_shperndarjes=$5 WHERE id=$1',
        [req.biznesId, emri, website, tipi, req.body.logjika_shperndarjes]);
    } else {
      // Nese s'dergohet eksplicit, mos e prek fare — mos rivendos aksidentalisht ne 'ankand'
      await pool.query('UPDATE bizneset SET emri=$2, website=$3, tipi=$4 WHERE id=$1', [req.biznesId, emri, website, tipi]);
    }
    res.json({ ok: true });
    // Studjo platformen ne sfond (pa e bllokuar pergjigjen) dhe ruaje
    platforma.ruajPlatformen(pool, req.biznesId, website).catch(() => {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LOGJIKA E SHPERNDARJES (ndryshim i vetin, per llogari ekzistuese — Ankand ↔ Barazi) ---
app.post('/api/logjika-shperndarjes', iLoguar, async (req, res) => {
  const logjika = ['ankand','barazi'].includes(req.body.logjika_shperndarjes) ? req.body.logjika_shperndarjes : null;
  if (!logjika) return res.status(400).json({ error: 'Vlerë e pavlefshme.' });
  try {
    await pool.query('UPDATE bizneset SET logjika_shperndarjes=$2 WHERE id=$1', [req.biznesId, logjika]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- HOSTING: lexo cilesimet aktuale (menyra + perqindjet) ---
app.get('/api/hosting/cilesimet', iLoguar, async (req, res) => {
  try {
    const b = await pool.query('SELECT hosting_menyra, barazi_perqindje FROM bizneset WHERE id=$1', [req.biznesId]);
    const sn = await pool.query('SELECT id, emri, barazi_perqindje FROM snippetet WHERE biznes_id=$1 ORDER BY id', [req.biznesId]);
    res.json({
      menyra: (b.rows[0] && b.rows[0].hosting_menyra) || 'te-gjitha',
      barazi_perqindje: (b.rows[0] && b.rows[0].barazi_perqindje != null) ? b.rows[0].barazi_perqindje : 50,
      snippetet: sn.rows.map(s => ({
        id: s.id, emri: s.emri,
        barazi_perqindje: s.barazi_perqindje != null ? s.barazi_perqindje : 50
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- HOSTING: ruaj cilesimet (menyra + perqindja/et) ---
app.post('/api/hosting/ruaj', iLoguar, async (req, res) => {
  const menyra = req.body.menyra === 'vecmas' ? 'vecmas' : 'te-gjitha';
  try {
    await pool.query('UPDATE bizneset SET hosting_menyra=$2 WHERE id=$1', [req.biznesId, menyra]);
    if (menyra === 'te-gjitha') {
      const p = Math.max(0, Math.min(100, parseInt(req.body.barazi_perqindje, 10)));
      await pool.query('UPDATE bizneset SET barazi_perqindje=$2 WHERE id=$1', [req.biznesId, isNaN(p) ? 50 : p]);
    } else {
      const lista = Array.isArray(req.body.snippetet) ? req.body.snippetet : [];
      for (const s of lista) {
        const sid = parseInt(s.id, 10);
        const p = Math.max(0, Math.min(100, parseInt(s.barazi_perqindje, 10)));
        if (sid) await pool.query('UPDATE snippetet SET barazi_perqindje=$2 WHERE id=$1 AND biznes_id=$3', [sid, isNaN(p) ? 50 : p, req.biznesId]);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
      `SELECT id, emri, email, kategoria, plani, website, celes, tipi, url_konvertimi, logo_url,
              kategoria_kryesore, nenkategorite, permbledhje, pershkrimi, logjika_shperndarjes
       FROM bizneset WHERE id=$1`, [req.biznesId]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PROGRESI (cilat hapa jane plotesuar) ---
app.get('/api/progres', iLoguar, async (req, res) => {
  try {
    const b = await pool.query(
      'SELECT permbledhje, pershkrimi, snippet_active, track_active, url_konvertimi, website, tipi FROM bizneset WHERE id=$1', [req.biznesId]);
    const p = await pool.query('SELECT 1 FROM promovimet WHERE biznes_id=$1 AND aktiv=true LIMIT 1', [req.biznesId]);
    const uLidhur = await pool.query('SELECT 1 FROM konvertimet WHERE biznes_id=$1 AND track_active=true LIMIT 1', [req.biznesId]);
    const zLidhur = await pool.query('SELECT 1 FROM zonat WHERE biznes_id=$1 AND track_active=true AND fshire=false LIMIT 1', [req.biznesId]);
    // A ka te pakten nje snippet reklame aktiv?
    const snLidhur = await pool.query('SELECT 1 FROM snippetet WHERE biznes_id=$1 AND snippet_active=true LIMIT 1', [req.biznesId]);
    const row = b.rows[0] || {};
    // Konvertimi i plote: snippet-i i gjurmimit aktiv DHE (nje URL ose nje zone e lidhur)
    const konvertimIPlote = !!row.track_active && (uLidhur.rows.length > 0 || zLidhur.rows.length > 0);
    res.json({
      llogaria: !!(row.website && row.tipi),            // gati kur ka website + tipi
      pershkrimi: !!(row.permbledhje || row.pershkrimi),// pershkrimi/AI u dha
      lidhja: snLidhur.rows.length > 0,                 // te pakten nje snippet reklame aktiv
      konvertimi: konvertimIPlote,                       // snippet + (URL ose kod) i lidhur
      reklama: p.rows.length > 0                         // reklama u krijua
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/analytics/reklamat', iLoguar, async (req, res) => {
  try {
    let nga = req.query.nga, deri = req.query.deri;
    const sot = new Date();
    if (!nga || !/^\d{4}-\d{2}-\d{2}$/.test(nga)) { const d=new Date(sot); d.setDate(d.getDate()-29); nga=d.toISOString().slice(0,10); }
    if (!deri || !/^\d{4}-\d{2}-\d{2}$/.test(deri)) { deri=sot.toISOString().slice(0,10); }
    if (nga > deri) { const t=nga; nga=deri; deri=t; }
    const ngaD=new Date(nga), deriD=new Date(deri);
    if ((deriD-ngaD)/(1000*60*60*24) > 366) { const d=new Date(deriD); d.setDate(d.getDate()-366); nga=d.toISOString().slice(0,10); }
    const rekIds = (req.query.reklama_ids || '').split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x));
    const filtroRek = rekIds.length ? ' AND reklama_id = ANY($4::int[])' : '';
    const params = rekIds.length ? [req.biznesId, nga, deri, rekIds] : [req.biznesId, nga, deri];

    const r = await pool.query(`
      SELECT gs::date AS data,
        COALESCE(v.n,0)::int  AS shfaqje,
        COALESCE(sh.n,0)::int AS shikime,
        COALESCE(k.n,0)::int  AS klikime,
        COALESCE(kv.n,0)::int AS konvertime
      FROM generate_series($2::date, $3::date, '1 day') AS gs
      LEFT JOIN (SELECT date_trunc('day',created_at)::date d, COUNT(*) n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='view'${filtroRek} GROUP BY d) v ON v.d=gs
      LEFT JOIN (SELECT date_trunc('day',created_at)::date d, COUNT(*) n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='shikim'${filtroRek} GROUP BY d) sh ON sh.d=gs
      LEFT JOIN (SELECT date_trunc('day',created_at)::date d, COUNT(*) n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='click'${filtroRek} GROUP BY d) k ON k.d=gs
      LEFT JOIN (SELECT date_trunc('day',created_at)::date d, COUNT(*) n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='konvertim'${filtroRek} GROUP BY d) kv ON kv.d=gs
      ORDER BY gs`, params);
    res.json({ nga, deri, rows: r.rows.map(x => ({
      data: x.data.toISOString().slice(0,10),
      shfaqje: x.shfaqje, shikime: x.shikime, klikime: x.klikime, konvertime: x.konvertime
    })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ANALYTICS: ecuria e reklamave, ndare sipas KATEGORISE se biznesit qe i shfaqi (host) ---
app.get('/api/analytics/kategorite', iLoguar, async (req, res) => {
  try {
    let nga = req.query.nga, deri = req.query.deri;
    const sot = new Date();
    if (!nga || !/^\d{4}-\d{2}-\d{2}$/.test(nga)) { const d=new Date(sot); d.setDate(d.getDate()-29); nga=d.toISOString().slice(0,10); }
    if (!deri || !/^\d{4}-\d{2}-\d{2}$/.test(deri)) { deri=sot.toISOString().slice(0,10); }
    if (nga > deri) { const t=nga; nga=deri; deri=t; }
    const ngaD=new Date(nga), deriD=new Date(deri);
    if ((deriD-ngaD)/(1000*60*60*24) > 366) { const d=new Date(deriD); d.setDate(d.getDate()-366); nga=d.toISOString().slice(0,10); }

    // Kategoria e vet biznesit — s'duhet shfaqur (asnjeherë s'shfaqet konkurrenca e vet)
    const vetja = await pool.query('SELECT kategoria_kryesore FROM bizneset WHERE id=$1', [req.biznesId]);
    const vetjaKat = vetja.rows.length ? vetja.rows[0].kategoria_kryesore : null;

    const rekIds = (req.query.reklama_ids || '').split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x));
    const filtroRek = rekIds.length ? ' AND e.reklama_id = ANY($4::int[])' : '';
    const baseParams = rekIds.length ? [req.biznesId, nga, deri, rekIds] : [req.biznesId, nga, deri];

    // 1) Kategorite qe kane te pakten 1 ngjarje (cfaredo lloji) ne kete periudhe/filtrim
    const katQ = await pool.query(`
      SELECT DISTINCT b.kategoria_kryesore AS kategoria
      FROM ngjarjet e JOIN bizneset b ON b.id = e.biznes_id
      WHERE e.reklamues_id=$1 AND e.created_at::date BETWEEN $2 AND $3
        AND e.lloji IN ('view','shikim','click','konvertim')
        AND b.kategoria_kryesore IS NOT NULL AND b.kategoria_kryesore <> ''
        ${filtroRek}`, baseParams);
    let kategorite = katQ.rows.map(r => r.kategoria);
    if (vetjaKat) kategorite = kategorite.filter(k => k !== vetjaKat);

    const rezultat = [];
    for (const kat of kategorite) {
      const filtroRek2 = rekIds.length ? ' AND e.reklama_id = ANY($4::int[])' : '';
      const katIdx = rekIds.length ? 5 : 4;
      const params2 = rekIds.length ? [req.biznesId, nga, deri, rekIds, kat] : [req.biznesId, nga, deri, kat];
      const r = await pool.query(`
        SELECT gs::date AS data,
          COALESCE(v.n,0)::int  AS shfaqje,
          COALESCE(sh.n,0)::int AS shikime,
          COALESCE(k.n,0)::int  AS klikime,
          COALESCE(kv.n,0)::int AS konvertime
        FROM generate_series($2::date, $3::date, '1 day') AS gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.biznes_id WHERE e.reklamues_id=$1 AND e.lloji='view'${filtroRek2} AND b.kategoria_kryesore=$${katIdx} GROUP BY d) v ON v.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.biznes_id WHERE e.reklamues_id=$1 AND e.lloji='shikim'${filtroRek2} AND b.kategoria_kryesore=$${katIdx} GROUP BY d) sh ON sh.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.biznes_id WHERE e.reklamues_id=$1 AND e.lloji='click'${filtroRek2} AND b.kategoria_kryesore=$${katIdx} GROUP BY d) k ON k.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.biznes_id WHERE e.reklamues_id=$1 AND e.lloji='konvertim'${filtroRek2} AND b.kategoria_kryesore=$${katIdx} GROUP BY d) kv ON kv.d=gs
        ORDER BY gs`, params2);
      rezultat.push({ emri: kat, pikat: r.rows.map(x => ({
        data: x.data.toISOString().slice(0,10),
        shfaqje: x.shfaqje, shikime: x.shikime, klikime: x.klikime, konvertime: x.konvertime
      })) });
    }

    res.json({ nga, deri, kategorite: rezultat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ANALYTICS: cfare u ke DHENE bizneseve te tjera, per SECILIN snippet te tend (host-side) ---
app.get('/api/analytics/snippetet-dhene', iLoguar, async (req, res) => {
  try {
    let nga = req.query.nga, deri = req.query.deri;
    const sot = new Date();
    if (!nga || !/^\d{4}-\d{2}-\d{2}$/.test(nga)) { const d=new Date(sot); d.setDate(d.getDate()-29); nga=d.toISOString().slice(0,10); }
    if (!deri || !/^\d{4}-\d{2}-\d{2}$/.test(deri)) { deri=sot.toISOString().slice(0,10); }
    if (nga > deri) { const t=nga; nga=deri; deri=t; }
    const ngaD=new Date(nga), deriD=new Date(deri);
    if ((deriD-ngaD)/(1000*60*60*24) > 366) { const d=new Date(deriD); d.setDate(d.getDate()-366); nga=d.toISOString().slice(0,10); }

    const r = await pool.query(`
      SELECT s.id, s.emri, s.snippet_active, s.pauzuar,
        COALESCE(v.n,0)::int  AS shfaqje,
        COALESCE(sh.n,0)::int AS shikime,
        COALESCE(k.n,0)::int  AS klikime,
        COALESCE(kv.n,0)::int AS konvertime
      FROM snippetet s
      LEFT JOIN (SELECT snippet_id, COUNT(*) n FROM ngjarjet WHERE lloji='view'      AND created_at::date BETWEEN $2 AND $3 GROUP BY snippet_id) v  ON v.snippet_id=s.id
      LEFT JOIN (SELECT snippet_id, COUNT(*) n FROM ngjarjet WHERE lloji='shikim'    AND created_at::date BETWEEN $2 AND $3 GROUP BY snippet_id) sh ON sh.snippet_id=s.id
      LEFT JOIN (SELECT snippet_id, COUNT(*) n FROM ngjarjet WHERE lloji='click'     AND created_at::date BETWEEN $2 AND $3 GROUP BY snippet_id) k  ON k.snippet_id=s.id
      LEFT JOIN (SELECT snippet_id, COUNT(*) n FROM ngjarjet WHERE lloji='konvertim' AND created_at::date BETWEEN $2 AND $3 GROUP BY snippet_id) kv ON kv.snippet_id=s.id
      WHERE s.biznes_id=$1
      ORDER BY s.id ASC`, [req.biznesId, nga, deri]);

    res.json({ nga, deri, snippetet: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ANALYTICS: cfare u ke DHENE secilës KATEGORI (host-side, drejtim i kundert nga /kategorite) ---
app.get('/api/analytics/kategorite-dhene', iLoguar, async (req, res) => {
  try {
    let nga = req.query.nga, deri = req.query.deri;
    const sot = new Date();
    if (!nga || !/^\d{4}-\d{2}-\d{2}$/.test(nga)) { const d=new Date(sot); d.setDate(d.getDate()-29); nga=d.toISOString().slice(0,10); }
    if (!deri || !/^\d{4}-\d{2}-\d{2}$/.test(deri)) { deri=sot.toISOString().slice(0,10); }
    if (nga > deri) { const t=nga; nga=deri; deri=t; }
    const ngaD=new Date(nga), deriD=new Date(deri);
    if ((deriD-ngaD)/(1000*60*60*24) > 366) { const d=new Date(deriD); d.setDate(d.getDate()-366); nga=d.toISOString().slice(0,10); }

    const vetja = await pool.query('SELECT kategoria_kryesore FROM bizneset WHERE id=$1', [req.biznesId]);
    const vetjaKat = vetja.rows.length ? vetja.rows[0].kategoria_kryesore : null;

    const katQ = await pool.query(`
      SELECT DISTINCT b.kategoria_kryesore AS kategoria
      FROM ngjarjet e JOIN bizneset b ON b.id = e.reklamues_id
      WHERE e.biznes_id=$1 AND e.created_at::date BETWEEN $2 AND $3
        AND e.lloji IN ('view','shikim','click','konvertim')
        AND b.kategoria_kryesore IS NOT NULL AND b.kategoria_kryesore <> ''`, [req.biznesId, nga, deri]);
    let kategorite = katQ.rows.map(r => r.kategoria);
    if (vetjaKat) kategorite = kategorite.filter(k => k !== vetjaKat);

    const rezultat = [];
    for (const kat of kategorite) {
      const r = await pool.query(`
        SELECT gs::date AS data,
          COALESCE(v.n,0)::int  AS shfaqje,
          COALESCE(sh.n,0)::int AS shikime,
          COALESCE(k.n,0)::int  AS klikime,
          COALESCE(kv.n,0)::int AS konvertime
        FROM generate_series($2::date, $3::date, '1 day') AS gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.reklamues_id WHERE e.biznes_id=$1 AND e.lloji='view'      AND b.kategoria_kryesore=$4 GROUP BY d) v  ON v.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.reklamues_id WHERE e.biznes_id=$1 AND e.lloji='shikim'    AND b.kategoria_kryesore=$4 GROUP BY d) sh ON sh.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.reklamues_id WHERE e.biznes_id=$1 AND e.lloji='click'     AND b.kategoria_kryesore=$4 GROUP BY d) k  ON k.d=gs
        LEFT JOIN (SELECT date_trunc('day',e.created_at)::date d, COUNT(*) n FROM ngjarjet e JOIN bizneset b ON b.id=e.reklamues_id WHERE e.biznes_id=$1 AND e.lloji='konvertim' AND b.kategoria_kryesore=$4 GROUP BY d) kv ON kv.d=gs
        ORDER BY gs`, [req.biznesId, nga, deri, kat]);
      rezultat.push({ emri: kat, pikat: r.rows.map(x => ({
        data: x.data.toISOString().slice(0,10),
        shfaqje: x.shfaqje, shikime: x.shikime, klikime: x.klikime, konvertime: x.konvertime
      })) });
    }

    res.json({ nga, deri, kategorite: rezultat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PROFILI I ZGJERUAR: pikët e profilit + analitika për çdo snippet ---
app.get('/api/profili', iLoguar, async (req, res) => {
  try {
    const bq = await pool.query(
      'SELECT emri, email, tipi, url_konvertimi, created_at, logo_url, logjika_shperndarjes, website FROM bizneset WHERE id=$1', [req.biznesId]);
    const biz = bq.rows[0] || {};
    const tipi = biz.tipi || 'b2c';

    const perSnippet = await pool.query(
      `SELECT COALESCE(origjina,'(pa origjinë)') AS origjina,
              COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE biznes_id=$1
         AND COALESCE(origjina,'') NOT LIKE 'zona:%'
         AND COALESCE(origjina,'') <> 'PROVE'
       GROUP BY origjina ORDER BY shfaqje DESC`, [req.biznesId]);

    const tot = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE biznes_id=$1`, [req.biznesId]);
    const shfaqje = tot.rows[0].shfaqje, konvertime = tot.rows[0].konvertime;

    const rate = pesha.PARAM.RATE[tipi] || pesha.PARAM.RATE.b2c;
    const pikeShfaqje = shfaqje / rate;
    const pikeTotal = pikeShfaqje + konvertime;

    // Marra: shfaqje/klikime/konvertime qe kane marre REKLAMAT E TIJ (si reklamues, te te tjeret)
    const marraQ = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE reklamues_id=$1`, [req.biznesId]);

    res.json({
      emri: biz.emri, email: biz.email, tipi, logo_url: biz.logo_url || null, website: biz.website || null,
      logjika_shperndarjes: biz.logjika_shperndarjes || 'ankand',
      pike_profili: Math.round(pikeTotal * 10) / 10,
      pike: {
        shfaqje, pike_nga_shfaqjet: Math.round(pikeShfaqje * 10) / 10, rate,
        konvertime, pike_nga_konvertimet: konvertime
      },
      marra: marraQ.rows[0],
      snippets: perSnippet.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PROFILI-BALANCE: sa ka dhene / sa ka marre, VETEM per burimin 'barazi' ---
// (0 legjitimisht derisa te ndertohet mekanizmi real i shperndarjes Balance ne /ad)
app.get('/api/profili-balance', iLoguar, async (req, res) => {
  try {
    const dheneQ = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE biznes_id=$1 AND burimi='barazi'`, [req.biznesId]);
    const marraQ = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE reklamues_id=$1 AND burimi='barazi'`, [req.biznesId]);
    res.json({ dhene: dheneQ.rows[0], marra: marraQ.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NJOFTIMET (llogariten në çast: gjendja + ditët nga regjistrimi) ---
app.get('/api/njoftimet', iLoguar, async (req, res) => {
  try {
    const b = await pool.query(
      'SELECT created_at, snippet_active, track_active, url_konvertimi FROM bizneset WHERE id=$1', [req.biznesId]);
    const p = await pool.query('SELECT COUNT(*)::int n FROM promovimet WHERE biznes_id=$1 AND aktiv=true AND pauzuar=false', [req.biznesId]);
    const uLidhur = await pool.query('SELECT 1 FROM konvertimet WHERE biznes_id=$1 AND track_active=true LIMIT 1', [req.biznesId]);
    const zLidhur = await pool.query('SELECT 1 FROM zonat WHERE biznes_id=$1 AND track_active=true AND fshire=false LIMIT 1', [req.biznesId]);
    const snLidhur = await pool.query('SELECT 1 FROM snippetet WHERE biznes_id=$1 AND snippet_active=true AND pauzuar=false LIMIT 1', [req.biznesId]);
    const kaSnippetAktiv = snLidhur.rows.length > 0;
    const row = b.rows[0] || {};
    const ditet = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
    const kaReklame = p.rows[0].n > 0;
    const kaKonvertimTeLidhur = !!row.track_active && (uLidhur.rows.length > 0 || zLidhur.rows.length > 0);
    const njf = [];

    if (!kaSnippetAktiv) {
      njf.push({ tip: 'snippet', titull: 'Reklamat e tua nuk po shfaqen',
        teksti: "S'ke asnjë hapësirë reklame aktive. Meqë s'po shfaq reklamat e të tjerëve, as reklamat e tua s'po marrin shfaqje te rrjeti. Lidh një hapësirë që të kthehet gjithçka në normalitet.", veprim: 'lidhja' });
    }
    if (!kaReklame) {
      njf.push({ tip: 'reklama', titull: 'Reklamat e tua nuk po shfaqen',
        teksti: "S'ke asnjë reklamë aktive. Krijo një të re ose riaktivizo një të pauzuar që të fillosh të shfaqesh te rrjeti.", veprim: 'reklamat' });
    }
    if (!kaKonvertimTeLidhur) {
      njf.push({ tip: 'konvertim', titull: 'Aktivizo gjurmimin e konvertimeve',
        teksti: "Gjurmimi i leads-ave s'është aktiv. Aktivizoje — konvertimet rrisin pikët e tua të profilit, që rrisin sa shpesh shfaqet reklama jote.", veprim: 'konvertimi' });
    }
    if (ditet >= 3 && !kaKonvertimTeLidhur) {
      njf.push({ tip: 'kujtese', titull: 'Kanë kaluar disa ditë',
        teksti: "Lidhja e konvertimit ende s'është bërë. Është mënyra kryesore për të mbledhur pikë nëse ke pak trafik.", veprim: 'konvertimi' });
    }

    // Njoftimet manuale nga admin (shtohen ne fillim — jane te rendesishme)
    try {
      const njAdmin = await require('./njoftime-admin').merrPerBiznes(pool, req.biznesId);
      njAdmin.forEach(a => {
        njf.unshift({
          tip: 'admin', id: a.id, titull: a.titulli, teksti: a.teksti,
          veprim: a.veprim || null, veprim_label: a.veprim_label || null, nga_admin: true
        });
      });
    } catch (e) {}

    res.json({ ditet, njoftimet: njf });
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
    const snK = await snippetet.ngaCelesi(pool, key);
    const h = { rows: snK ? [{ id: snK.biznes_id }] : [] };
    if (h.rows.length && rid) {
      const p = await pool.query(
        `SELECT p.id, p.biznes_id, p.logjika_shperndarjes, COALESCE(p.link, b.website) AS dest
         FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
         WHERE p.id=$1 AND p.aktiv=true`, [rid]);
      if (p.rows.length) {
        const kod = crypto.randomBytes(9).toString('hex');
        await pool.query(
          `INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, klik_kod, snippet_id, burimi)
           VALUES ($1,'click',$2,$3,$4,$5,$6,$7)`,
          [h.rows[0].id, req.headers.referer || null, p.rows[0].id, p.rows[0].biznes_id, kod, snK ? snK.snippet_id : null, p.rows[0].logjika_shperndarjes || 'ankand']);
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

// --- DIAGNOSTIK I PERKOHSHEM: shiko klikun/konvertimin per nje kod (fshije me pas) ---
app.get('/diag/:kod', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT lloji, origjina, reklama_id, reklamues_id, created_at
       FROM ngjarjet WHERE klik_kod=$1 ORDER BY created_at ASC`, [req.params.kod]);
    res.json({ kod: req.params.kod, ngjarje: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DIAGNOSTIK: shiko zonat e nje biznesi (p.sh. /diag-zonat/55) ---
app.get('/diag-zonat/:bizId', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, emri, track_active FROM zonat WHERE biznes_id=$1 ORDER BY id', [req.params.bizId]);
    res.json({ biznes_id: req.params.bizId, zonat: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- KRIJO NJE KLIK PROVE (per verifikimin e zones me kod) ---
app.post('/api/zona-prove', iLoguar, async (req, res) => {
  try {
    const kod = crypto.randomBytes(9).toString('hex');
    // klik "prove" — origjina e shenon si test qe te mos ndotet statistika
    await pool.query(
      `INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, klik_kod)
       VALUES ($1,'click','PROVE',NULL,$1,$2)`, [req.biznesId, kod]);
    let faqja = req.biznesId ? null : null;
    const b = await pool.query('SELECT website FROM bizneset WHERE id=$1', [req.biznesId]);
    faqja = b.rows.length ? b.rows[0].website : null;
    if (faqja && !/^https?:\/\//i.test(faqja)) faqja = 'https://' + faqja;
    res.json({ kod, faqja });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- KONVERTIMI: numerohet vetem nese ekziston nje klikim i vlefshem ---
// --- VERIFIKIMI I ZONES ME KOD (provë, s'numërohet si konvertim) ---
app.all('/konvertim-verifiko', async (req, res) => {
  cors(res);
  const key = req.query.key || (req.body && req.body.key);
  const zona = req.query.zona || (req.body && req.body.zona) || '';
  if (!key) return res.status(204).end();
  try {
    const b = await pool.query('SELECT id FROM bizneset WHERE celes=$1', [key]);
    if (b.rows.length) {
      await pool.query(
        'UPDATE zonat SET track_active=true, track_seen_at=now() WHERE biznes_id=$1 AND emri=$2',
        [b.rows[0].id, zona]);
    }
  } catch (e) {}
  res.status(204).end();
});

app.all('/konvertim', async (req, res) => {
  cors(res);
  const kod = req.query.kod || (req.body && req.body.kod);
  const zona = req.query.zona || (req.body && req.body.zona) || null;
  if (!kod) return res.status(204).end();
  try {
    const k = await pool.query(
      `SELECT reklama_id, reklamues_id, created_at, origjina, snippet_id, burimi FROM ngjarjet
       WHERE klik_kod=$1 AND lloji='click' LIMIT 1`, [kod]);
    if (!k.rows.length) return res.status(204).end();           // kod i panjohur
    const kl = k.rows[0];
    const DITE = 30 * 24 * 3600 * 1000;
    if (Date.now() - new Date(kl.created_at).getTime() > DITE) return res.status(204).end();

    // KLIK PROVE (verifikim): lidh zonen (krijo nese s'ekziston) POR mos regjistro konvertim te vertete
    if (kl.origjina === 'PROVE') {
      if (zona) {
        const z = await pool.query('SELECT id, fshire FROM zonat WHERE biznes_id=$1 AND emri=$2', [kl.reklamues_id, zona]);
        if (z.rows.length) {
          await pool.query('UPDATE zonat SET track_active=true, track_seen_at=now(), fshire=false WHERE id=$1', [z.rows[0].id]);
        } else {
          await pool.query('INSERT INTO zonat (biznes_id, emri, track_active, track_seen_at) VALUES ($1,$2,true,now())', [kl.reklamues_id, zona]);
        }
      } else {
        await pool.query("UPDATE zonat SET track_active=true, track_seen_at=now() WHERE biznes_id=$1 AND emri=''", [kl.reklamues_id]);
      }
      return res.status(204).end();
    }

    // Nese konvertimi vjen me KOD ME EMER (zona jo bosh):
    //  - nese zona eshte shenuar E FSHIRE → lidhja shkeputet → injoro konvertimin
    //  - nese ekziston (jo e fshire) → vazhdo dhe lidhe
    //  - nese s'ekziston fare → krijohet me poshte dhe lidhet (sjellja qe punonte)
    if (zona) {
      const zr = await pool.query('SELECT id, fshire, pauzuar FROM zonat WHERE biznes_id=$1 AND emri=$2 LIMIT 1', [kl.reklamues_id, zona]);
      if (zr.rows.length && zr.rows[0].fshire) return res.status(204).end();   // e fshire → injoro
      if (zr.rows.length && zr.rows[0].pauzuar) return res.status(204).end();  // e pauzuar → injoro (s'regjistrohet)
    }
    if (!zona) {
      const origjinaFaqe = req.headers.origin || req.headers.referer || null;
      if (origjinaFaqe) {
        try {
          let shteg = origjinaFaqe;
          try { const p = new URL(origjinaFaqe); shteg = (p.origin + p.pathname).replace(/\/+$/, ''); } catch(e){}
          const pz = await pool.query(
            "SELECT 1 FROM konvertimet WHERE biznes_id=$1 AND pauzuar=true AND ($2 LIKE rtrim(url,'/') || '%') LIMIT 1",
            [kl.reklamues_id, shteg]);
          if (pz.rows.length) return res.status(204).end();
        } catch(e){}
      }
    }
    // nje konvertim per klikim PER ZONE (zona te ndryshme numerohen veç)
    const ekz = await pool.query(
      `SELECT 1 FROM ngjarjet WHERE klik_kod=$1 AND lloji='konvertim'
       AND COALESCE(origjina,'') = COALESCE($2,'') LIMIT 1`, [kod, zona ? ('zona:' + zona) : '']);
    if (ekz.rows.length) return res.status(204).end();
    await pool.query(
      `INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, klik_kod, snippet_id, burimi)
       VALUES ($1,'konvertim',$2,$3,$4,$5,$6,$7)`,
      [kl.reklamues_id, zona ? ('zona:' + zona) : (req.headers.origin || req.headers.referer || null),
       kl.reklama_id, kl.reklamues_id, kod, kl.snippet_id, kl.burimi]);
    // Nje konvertim REAL eshte prova qe snippet-i i gjurmimit eshte aktiv → rivendos track_active.
    await pool.query('UPDATE bizneset SET track_active=true, track_seen_at=now() WHERE id=$1', [kl.reklamues_id]);
    // Nje konvertim REAL me zone → lidhe. Nese s'ekziston, krijoje si te lidhur (por jo e fshire).
    if (zona) {
      const z = await pool.query('SELECT id FROM zonat WHERE biznes_id=$1 AND emri=$2', [kl.reklamues_id, zona]);
      if (z.rows.length) {
        await pool.query('UPDATE zonat SET track_active=true, track_seen_at=now() WHERE id=$1', [z.rows[0].id]);
      } else {
        await pool.query('INSERT INTO zonat (biznes_id, emri, track_active, track_seen_at) VALUES ($1,$2,true,now())', [kl.reklamues_id, zona]);
      }
    }
  } catch (e) {}
  res.status(204).end();
});

// --- RUAJ PERMBLEDHJEN (klienti editon vetem permbledhjen; kategoria mbetet nga AI) ---
app.post('/api/permbledhje', iLoguar, async (req, res) => {
  const perm = (req.body.permbledhje || '').trim() || null;
  const rikombinim = !!req.body.rikombinim;
  try {
    await pool.query('UPDATE bizneset SET permbledhje=$2 WHERE id=$1', [req.biznesId, perm]);
    if (!rikombinim) return res.json({ ok: true });

    // Rikombinim vetem nese kerkohet eksplicit (Cilesimet / Dashboard-pershkrimi standalone,
    // jo wizard-i i pare) DHE vetem nese ka snippet aktiv (qe u shfaq REKLAMAT E TE TJEREVE).
    const b = await pool.query('SELECT snippet_active FROM bizneset WHERE id=$1', [req.biznesId]);
    const kaSnippetAktiv = !!(b.rows[0] && b.rows[0].snippet_active);
    if (!kaSnippetAktiv) {
      return res.json({ ok: true, kombinim: false, arsyeja: 'snippet' });
    }
    kombinimi.rikombinoBiznesin(req.biznesId).catch(() => {});
    res.json({ ok: true, kombinim: true });
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
    let link = (req.body.link || '').trim();
    if (!link) return res.status(400).json({ error: 'Fut linkun e destinacionit.' });
    if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
    let logjika = 'ankand';
    try { const b = await pool.query('SELECT logjika_shperndarjes FROM bizneset WHERE id=$1', [req.biznesId]); logjika = (b.rows[0] && b.rows[0].logjika_shperndarjes) || 'ankand'; } catch (e) {}
    if (['ankand','barazi'].includes(req.body.logjika_shperndarjes)) logjika = req.body.logjika_shperndarjes;
    await pool.query(
      'INSERT INTO promovimet (biznes_id, titulli, imazh_url, link, aktiv, logjika_shperndarjes) VALUES ($1,$2,$3,$4,true,$5)',
      [req.biznesId, titulli, url, link, logjika]);
    res.json({ ok: true, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NGARKO LOGON E BIZNESIT ---
app.post('/api/ngarko-logo', iLoguar, upload.single('file'), async (req, res) => {
  if (!s3) return res.status(500).json({ error: "Ruajtja (R2) s'është konfiguruar te serveri." });
  if (!req.file) return res.status(400).json({ error: "S'ka skedar." });
  const ext = (req.file.originalname.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = 'logos/' + req.biznesId + '_' + Date.now() + '.' + ext;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET, Key: key,
      Body: req.file.buffer, ContentType: req.file.mimetype
    }));
    const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const url = base + '/' + key;
    await pool.query('UPDATE bizneset SET logo_url=$2 WHERE id=$1', [req.biznesId, url]);
    res.json({ ok: true, url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LISTA E REKLAMAVE TE BIZNESIT (Creatives) ---
app.get('/api/reklamat', iLoguar, async (req, res) => {
  try {
    const logjikaFiltri = ['ankand','barazi'].includes(req.query.logjika) ? req.query.logjika : null;
    const params = logjikaFiltri ? [req.biznesId, logjikaFiltri] : [req.biznesId];
    const filtriSql = logjikaFiltri ? ' AND COALESCE(logjika_shperndarjes,\'ankand\')=$2' : '';
    const r = await pool.query(
      'SELECT id, titulli, teksti, imazh_url, video_url, html5_url, pauzuar, logjika_shperndarjes, created_at FROM promovimet WHERE biznes_id=$1 AND aktiv=true' + filtriSql + ' ORDER BY id DESC',
      params);
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
      video_url: x.video_url || null,
      html5_url: x.html5_url || null,
      teksti: x.teksti || null,
      pauzuar: x.pauzuar,
      logjika_shperndarjes: x.logjika_shperndarjes || 'ankand',
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
          // Pika e 3-te u plotesua → nis studimin/kombinimin me AI ne sfond
          kombinimi.kombinoBiznesin(req.biznesId).catch(()=>{});
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
    const snL = await snippetet.ngaCelesi(pool, key);
    if (snL) {
      const bizId = snL.biznes_id;
      const faqja = req.headers.referer || req.headers.origin || null;
      // Sheno active-n te snippet-i specifik
      if (snL.snippet_id) {
        await pool.query(
          `UPDATE snippetet SET snippet_active=true,
                  first_seen_at=COALESCE(first_seen_at, now()), last_seen_at=now()
           WHERE id=$1`, [snL.snippet_id]);
      }
      if (!snL.snippet_active) {
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
  res.set('Cache-Control', 'no-cache, must-revalidate');
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

  // Konvertimi menaxhohet nga snippet-i i gjurmimit (imyr-track.js), jo nga ky i reklamave.

  // ---------- NJOFTO LIDHJEN E REKLAMES ----------
  if(!preview){
    try {
      var pu = base + '/lidh?key=' + encodeURIComponent(key);
      navigator.sendBeacon ? navigator.sendBeacon(pu) : fetch(pu, {mode:'no-cors'});
    } catch(e){}
  }

  // ---------- HAPESIRA E REKLAMES ----------
  // 1) Nese ekziston <div id="imyr-slot"> => reklama shfaqet aty (i pari qe s'eshte zene).
  // 2) Perndryshe krijohet menjehere pas skriptit — cdo snippet ka slot-in e vet unik,
  //    keshtu disa snippet-e ne te njejten faqe shfaqin secili reklamen e vet.
  var _slotImyr = null;
  function gjejSlot(){
    if(_slotImyr) return _slotImyr;
    // slot i vendosur nga klienti qe s'eshte zene ende nga nje snippet tjeter
    var lista = document.querySelectorAll('#imyr-slot, .imyr-slot');
    for(var i=0;i<lista.length;i++){ if(!lista[i].getAttribute('data-imyr-zene')){ lista[i].setAttribute('data-imyr-zene','1'); _slotImyr=lista[i]; return _slotImyr; } }
    if(!s || !s.parentNode) return null;
    // Reklama del pikerisht aty ku ndodhet ky rresht — slot i vetin, pa ID fikse.
    var el = document.createElement('div'); el.className = 'imyr-slot'; el.setAttribute('data-imyr-zene','1');
    s.parentNode.insertBefore(el, s.nextSibling);
    _slotImyr = el;
    return el;
  }

  function run(){
    var slot = gjejSlot();
    if(!slot){
      // Vetem gjurmim shfaqjeje (skripti eshte te layout-i, pa hapesire reklame ketu).
      // Konvertimin e menaxhon snippet-i i gjurmimit (imyr-track.js), jo ky.
      return;
    }
    // Frequency capping per session — NJE cikel i vetem i perbashket per te gjithe
    // snippet-et e kesaj faqeje (i njejti host). Kur nje reklame shfaqet nga cilido
    // snippet, hiqet nga cikli; kur te gjitha jane shfaqur, cikli rifillon per te gjithe.
    var _parKey = 'imyr_pare';
    function lexoPare(){
      try { var v = sessionStorage.getItem(_parKey); var a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a.map(String) : []; } catch(e){ return []; }
    }
    function shtoPare(id){
      try {
        id = String(id);
        var l = lexoPare(); if(l.indexOf(id) === -1){ l.push(id); sessionStorage.setItem(_parKey, JSON.stringify(l)); }
      } catch(e){}
    }
    function rifilloCikel(id){
      // I pa te gjitha → fillo listen nga e para, vetem me kete te re
      try { sessionStorage.setItem(_parKey, JSON.stringify([String(id)])); } catch(e){}
    }

    function trajtoReklame(d){
      if(!d) return;
      if(d.imazh_url || d.teksti || d.video_url || d.html5_url){
        var rid = d.id ? ('&rid=' + encodeURIComponent(d.id)) : '';
        var mw = 210, mh = 261;
        var eshteMobile = (window.innerWidth || document.documentElement.clientWidth || 9999) <= 600;
        var madhStr = eshteMobile ? (d.madhesia_mobile || '290x260') : (d.madhesia || '210x261');
        if(eshteMobile){ mw = 290; mh = 260; }
        var pp = String(madhStr).split('x'); var a1=parseInt(pp[0],10), a2=parseInt(pp[1],10); if(a1>0 && a2>0){ mw=a1; mh=a2; }
        var inner, sVideoHtml = false;
        if(d.video_url){
          sVideoHtml = true;
          var ytId = d.video_url;
          var src = 'https://www.youtube.com/embed/' + ytId
            + '?autoplay=1&mute=1&controls=1&loop=1&playlist=' + ytId
            + '&modestbranding=1&rel=0&fs=0&end=30&playsinline=1';
          inner = '<iframe src="' + src + '" frameborder="0" allow="autoplay; encrypted-media" '
            + 'style="display:block;width:100%;height:100%;border:0;border-radius:10px;"></iframe>';
        } else if(d.html5_url){
          sVideoHtml = true;
          inner = '<iframe src="' + d.html5_url + '" frameborder="0" '
            + 'style="display:block;width:100%;height:100%;border:0;border-radius:10px;"></iframe>';
        } else if(d.imazh_url){
          inner = '<img src="' + d.imazh_url + '" style="display:block;width:100%;height:100%;object-fit:contain;border-radius:10px;">';
        } else {
          inner = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;box-sizing:border-box;'
            + 'border:1px solid #e2c68a;background:#fbf6ea;color:#5a4a24;padding:12px 14px;border-radius:10px;'
            + 'font:14px/1.5 system-ui,sans-serif;text-align:center;">' + esc(d.teksti) + '</div>';
        }
        if(!preview && !sVideoHtml){
          var href = base + '/klik?key=' + encodeURIComponent(key) + rid;
          inner = '<a href="' + href + '" target="_blank" rel="noopener"'
            + ' style="text-decoration:none;display:block;width:100%;height:100%;cursor:pointer;">' + inner + '</a>';
        }
        var poz = d.pozicioni || 'qender';
        var align = poz==='majtas' ? 'flex-start' : (poz==='djathtas' ? 'flex-end' : 'center');
        var kutia = '<div style="width:' + mw + 'px;height:' + mh + 'px;max-width:100%;position:sticky;top:10px;">' + inner + '</div>';
        slot.innerHTML = '<div style="display:flex;justify-content:' + align + ';width:100%;">' + kutia + '</div>';
        if(d.id){ if(d.cikel_ri){ rifilloCikel(d.id); } else { shtoPare(d.id); } }
        if(!preview){
          // Ngarkim (view): reklama u vendos ne faqe
          try { var v = base + '/track?key=' + encodeURIComponent(key) + '&event=view' + rid;
            navigator.sendBeacon ? navigator.sendBeacon(v) : fetch(v); } catch(e){}
          // Shikim real: 50% e reklames ne ekran per >=1 sekonde (Intersection Observer)
          try {
            var elKutia = slot.querySelector('div'); // kutia e reklames
            if (elKutia && 'IntersectionObserver' in window) {
              var pare = false, timer = null;
              var obs = new IntersectionObserver(function(entries){
                entries.forEach(function(en){
                  if (!pare && en.isIntersecting && en.intersectionRatio >= 0.5) {
                    if (!timer) timer = setTimeout(function(){
                      if (pare) return; pare = true;
                      try { var s = base + '/track?key=' + encodeURIComponent(key) + '&event=shikim' + rid;
                        navigator.sendBeacon ? navigator.sendBeacon(s) : fetch(s); } catch(e){}
                      obs.disconnect();
                    }, 1000); // 1 sekonde
                  } else {
                    if (timer) { clearTimeout(timer); timer = null; } // doli para 1 sek → rifillo
                  }
                });
              }, { threshold: [0, 0.5, 1] });
              obs.observe(elKutia);
            }
          } catch(e){}
        }
      }
    }

    // Koordinim ndër-snippet: reklamat e shfaqura nga snippet-et e tjera NE KETE NGARKIM
    // perjashtohen vetem per kete shfaqje (jo per ciklin/capping-un), qe dy snippet-e
    // te mos nxjerrin te njejten. Radhe sekuenciale me nje zinxhir global;
    // vonesat prej milisekondash jane te padukshme per vizitorin.
    window.__imyrTani = window.__imyrTani || [];
    window.__imyrZinxhir = window.__imyrZinxhir || Promise.resolve();
    window.__imyrZinxhir = window.__imyrZinxhir.then(function(){
      // Lexo ciklin e perbashket TANI (pasi snippet-et e meparshme kane shkruar),
      // qe cikli i vetem te respektohet nga te gjithe snippet-et.
      var pare = lexoPare();
      var perjashto = pare.concat(window.__imyrTani);
      var qp = perjashto.length ? ('&pare=' + encodeURIComponent(perjashto.join(','))) : '';
      return fetch(base + '/ad?key=' + encodeURIComponent(key) + qp + (preview?'&preview=1':''))
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d && d.id){ window.__imyrTani.push(String(d.id)); }
          trajtoReklame(d);
        })
        .catch(function(){});
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();`);
});

// --- KODI GJURMUES U NGARKUA (konfirmimi i lidhjes) ---
app.all('/track-lidh', async (req, res) => {
  cors(res);
  try {
    const faqja = req.headers.referer || req.headers.origin || null;
    await pool.query(
      `UPDATE bizneset SET track_active=true, track_seen_at=now(), track_url=$2 WHERE celes=$1`,
      [req.query.key, faqja]);
    // Shëno URL-në specifike të konvertimit nëse faqja aktuale përputhet me ndonjërën
    const b = await pool.query('SELECT id FROM bizneset WHERE celes=$1', [req.query.key]);
    if (b.rows.length && faqja) {
      const faqjaPlote = faqja.replace(/\/+$/, '');
      let shteg = faqja;
      try { const p = new URL(faqja); shteg = p.pathname + p.search; } catch (e) {}
      // perputh URL-en e plote OSE shtegun (per te dhena te vjetra)
      await pool.query(
        `UPDATE konvertimet SET track_active=true, track_seen_at=now()
         WHERE biznes_id=$1 AND ($2 LIKE rtrim(url,'/') || '%' OR $3 LIKE url || '%')`,
        [b.rows[0].id, faqjaPlote, shteg]);
    }
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
    const b = await pool.query('SELECT id, url_konvertimi FROM bizneset WHERE celes=$1', [req.query.key]);
    if (!b.rows.length) return res.json({ konv_url: null, konv_urls: [] });
    const urls = await konvertimet.urletPerBiznes(pool, b.rows[0].id);
    // konv_url: e para (perputhshmeri me snippet-in e vjeter); konv_urls: te gjitha
    res.json({ konv_url: urls.length ? urls[0] : null, konv_urls: urls });
  } catch (e) { res.json({ konv_url: null, konv_urls: [] }); }
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

  function dergo(zona){
    // MENYRA E VERIFIKIMIT: nese faqja ka ?imyr_test=1 (ose eshte ruajtur ne kete skede) → sinjal verifikimi, JO konvertim.
    var testo = false;
    try {
      if(new URLSearchParams(location.search).get('imyr_test') === '1'){ testo = true; try{ sessionStorage.setItem('imyr_test','1'); }catch(e){} }
      else { try{ testo = sessionStorage.getItem('imyr_test') === '1'; }catch(e){} }
    } catch(e){}
    if(testo){
      try {
        var uv = base + '/konvertim-verifiko?key=' + encodeURIComponent(key) + (zona ? ('&zona=' + encodeURIComponent(zona)) : '');
        navigator.sendBeacon ? navigator.sendBeacon(uv) : fetch(uv, {mode:'no-cors'});
      } catch(e){}
      return;  // mos regjistro konvertim gjate verifikimit
    }
    var kod = lexoKod(); if(!kod || preview) return;
    var celes = 'imyr_konv_' + kod + (zona ? ('_' + zona) : '');
    try { if(localStorage.getItem(celes)) return; } catch(e){}
    try {
      var u = base + '/konvertim?kod=' + encodeURIComponent(kod) + (zona ? ('&zona=' + encodeURIComponent(zona)) : '');
      navigator.sendBeacon ? navigator.sendBeacon(u) : fetch(u, {mode:'no-cors'});
      localStorage.setItem(celes, '1');
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
  // Gjate verifikimit (?imyr_test=1) mos kontrollo URL-t — verifikimi behet vetem nga thirrja e drejtperdrejte imyr.konvertim()
  try { if(new URLSearchParams(location.search).get('imyr_test') === '1') return; } catch(e){}
  fetch(base + '/cil?key=' + encodeURIComponent(key))
    .then(function(r){ return r.json(); })
    .then(function(c){
      var lista = (c && c.konv_urls && c.konv_urls.length) ? c.konv_urls : ((c && c.konv_url) ? [c.konv_url] : []);
      if(!lista.length) return;
      var tani = (location.origin + location.pathname + location.search).replace(/\\/+$/,'');
      var taniShteg = location.pathname + location.search;
      for(var i=0;i<lista.length;i++){
        var konvUrl = lista[i]; if(!konvUrl) continue;
        // Perputh URL-en e plote OSE shtegun (per perputhshmeri me te dhena te vjetra si "/welcome")
        var full = /^https?:\\/\\//i.test(konvUrl);
        var baze = full ? tani : taniShteg;
        var kU = konvUrl.replace(/\\/+$/,'');
        var pos = baze.indexOf(kU); if(pos === -1) continue;
        var pas = baze.charAt(pos + kU.length);
        if(pas !== '' && pas !== '?' && pas !== '#' && pas !== '/' && pas !== '&') continue;
        dergo(); return;  // perputhet me nje URL → konvertim
      }
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
    // Gjej snippet-in (ose biznesin per celesa te vjeter) nga celesi
    const sn = await snippetet.ngaCelesi(pool, key);
    if (!sn) return res.json({ teksti: null });
    if (sn.pauzuar) return res.json({ teksti: null });   // snippet ne pauze → asgje (s'shfaqet, s'mat, s'konkurron)
    const bizId = sn.biznes_id;
    // Merr url_konvertimi te biznesit (konvertimi eshte per biznes)
    const bkonv = await pool.query('SELECT url_konvertimi, snippet_active FROM bizneset WHERE id=$1', [bizId]);
    const b = { rows: [{
      id: bizId,
      snippet_active: sn.snippet_active,
      url_konvertimi: bkonv.rows.length ? bkonv.rows[0].url_konvertimi : null,
      madhesia_desktop: sn.madhesia_desktop,
      madhesia_mobile: sn.madhesia_mobile,
      pozicioni_reklames: sn.pozicioni,
      snippet_id: sn.snippet_id
    }] };
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
      // Sheno active-n te snippet-i specifik (nese eshte nga tabela snippetet)
      if (b.rows[0].snippet_id) {
        await pool.query(
          `UPDATE snippetet SET snippet_active=true,
                  first_seen_at=COALESCE(first_seen_at, now()), last_seen_at=now()
           WHERE id=$1`, [b.rows[0].snippet_id]);
      }
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
    // Reklamat e para nga ky vizitor brenda vizites (frequency capping)
    const pareRaw = (req.query.pare || '').split(',').map(x => x.trim()).filter(Boolean);
    const rek = await selector.zgjidhReklame(pool, bizId, pareRaw, b.rows[0].snippet_id || null);
    
    // konv_url = faqja e konvertimit E KETIJ biznesi (snippet-i e perdor per te njohur suksesin)
    res.json(Object.assign({ konv_url: b.rows[0].url_konvertimi || null, madhesia: b.rows[0].madhesia_desktop || '210x261', madhesia_mobile: b.rows[0].madhesia_mobile || '290x260', pozicioni: b.rows[0].pozicioni_reklames || 'qender' }, rek || {}));
  } catch (e) {
    res.json({ teksti: null });
  }
});

// --- TRACK (shfaqje/klikime) ---
app.all('/track', async (req, res) => {
  cors(res);
  if (req.query.preview === '1') return res.status(204).end(); // injoro preview-in
  const key = req.query.key;
  const lloji = req.query.event === 'click' ? 'click'
              : req.query.event === 'shikim' ? 'shikim'
              : 'view';
  const rid = parseInt(req.query.rid, 10) || null;
  try {
    const snK2 = await snippetet.ngaCelesi(pool, key);
    const b = { rows: snK2 ? [{ id: snK2.biznes_id }] : [] };
    if (b.rows.length) {
      let reklamuesId = null, burimi = null;
      if (rid) {
        const pr = await pool.query('SELECT biznes_id, logjika_shperndarjes FROM promovimet WHERE id=$1', [rid]);
        if (pr.rows.length) { reklamuesId = pr.rows[0].biznes_id; burimi = pr.rows[0].logjika_shperndarjes || 'ankand'; }
      }
      await pool.query(
        'INSERT INTO ngjarjet (biznes_id, lloji, origjina, reklama_id, reklamues_id, snippet_id, burimi) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [b.rows[0].id, lloji, req.headers.origin || req.headers.referer || null, rid, reklamuesId, snK2.snippet_id || null, burimi]
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
app.get('/api/analizo/mbetur', iLoguar, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int n FROM analizo_perdorimi WHERE biznes_id=$1 AND krijuar_at > now() - interval '24 hours'`,
      [req.biznesId]);
    res.json({ mbetur: Math.max(0, 2 - r.rows[0].n) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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
    if (!pershkrimi && !webTekst) {
      return res.status(400).json({ error: "Shkruaj një përshkrim, ose sigurohu që faqja jote është publike për t'u studiuar." });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      // Pa AI: ruaj pershkrimin, kthe njoftim (kategorizimi behet me vone)
      return res.json({ ok: true, ai: false, note: "AI s'është konfiguruar ende (mungon OPENAI_API_KEY)." });
    }

    // Kufi: max 2 analiza reale me AI ne 24 ore, per biznes (ruajtur ne DB — mbahet mend edhe kur kthehesh me vone)
    const perdorimiQ = await pool.query(
      `SELECT COUNT(*)::int n FROM analizo_perdorimi WHERE biznes_id=$1 AND krijuar_at > now() - interval '24 hours'`,
      [req.biznesId]);
    if (perdorimiQ.rows[0].n >= 2) {
      return res.status(429).json({ error: 'Ke arritur kufirin: vetëm 2 analiza me AI në 24 orë. Provo më vonë.' });
    }
    await pool.query('INSERT INTO analizo_perdorimi (biznes_id) VALUES ($1)', [req.biznesId]);

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const sys = 'Je analist qe klasifikon biznese SaaS per nje rrjet cross-promotion. Kthe VETEM JSON, pa asnje tekst tjeter.';
    const user =
      'Zgjidh SAKTESISHT nje kategori kryesore nga kjo liste: ' + KATEGORITE.join('; ') + '.\n\n' +
      'Pershkrimi i dhene nga biznesi: ' + (pershkrimi || '(pa pershkrim)') + '\n\n' +
      (webTekst ? ('Teksti i nxjerre nga faqja e biznesit:\n' + webTekst + '\n\n') : '') +
      'Detyra: shpjego QARTE cfare ofron ky biznes. Shpjegoje mire dhe plotesisht, pa e zgjatur kot, ' +
      'me gjuhe te thjeshte e te kuptueshme. Nje person qe e lexon duhet ta kuptoje sakte se cfare eshte sherbimi dhe kujt i sherben. ' +
      'Perdor aq fjale sa duhet per ta shpjeguar qarte — as te ngjeshura sa te humbase kuptimi, as te zgjatura kot. ' +
      'Kombino pershkrimin e biznesit me tekstin e faqes (nese ka) per ta bere me te sakte.\n\n' +
      'Kthe JSON me keto fusha:\n' +
      '{"kategoria_kryesore": string (SAKTESISHT nje nga lista), ' +
      '"nenkategorite": string[] (2-4 nenkategori specifike), ' +
      '"permbledhje": string (2-4 fjali te qarta qe shpjegojne cfare ofron biznesi dhe kujt i sherben, ' +
      'me gjuhe te thjeshte, te shkruara ashtu qe nje algoritem te gjeje me cilat sherbime plotesuese mund te cohet)}';

    let parsed = {};
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model, response_format: { type: 'json_object' },
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

// Endpoint-e shtese te admin-it (skedar i ndare — nuk prek webin real)
require('./admin-routes')(app, pool, iAdmin, kombinimi);

// Caktimi i madhesise se hapesires se reklames (skedar i ndare)
require('./madhesia')(app, pool, iLoguar);

// Snippet-e te shumta per biznes (skedar i ndare)
const snippetet = require('./snippetet');
snippetet(app, pool, iLoguar, beCeles);

// URL-e te shumta konvertimi per biznes (skedar i ndare)
const konvertimet = require('./konvertimet');
konvertimet(app, pool, iLoguar, iAdmin);

// Zbulimi i platformes se klientit nga URL-ja (skedar i ndare, pa AI)
platforma(app, pool, iLoguar, iAdmin);
platforma.init(pool).catch(() => {});

// Asistenti me Claude per vendosjen e kodit (skedar i ndare)
require('./asistenti')(app, pool, iLoguar);

// Asistenti i suportit te pergjithshem (FAQ, model i lire) — para dhe pas login
require('./suporti')(app, pool);

// Kreative — krijimi i reklamave me AI (imazh/video/HTML5)
require('./kreative')(app, pool, iLoguar);

require('./njoftime-admin')(app, pool, iLoguar, iAdmin);

require('./ndryshime-admin')(app, pool, iLoguar, iAdmin);

require('./ekipi')(app, pool, iLoguar, null);

require('./pike-reklama').rregjistroRoutet(app, pool, iAdmin);

require('./suport-human')(app, pool, iLoguar, iAdmin);

require('./reklama-media')(app, pool, iLoguar, { upload, s3, PutObjectCommand });
require('./pauza')(app, pool, iLoguar);
// Lista e bizneseve (emer + email)
app.get('/api/admin/bizneset', iAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT b.id, b.emri, b.email, b.logo_url, b.tipi,
        COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.reklamues_id = b.id AND e.lloji='view'),0)::int AS shfaqje_marre,
        COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.biznes_id = b.id AND e.lloji='view'),0)::int AS shfaqje_dhene,
        COALESCE((SELECT COUNT(*) FROM ngjarjet e WHERE e.reklamues_id = b.id AND e.lloji='konvertim'),0)::int AS konvertime
      FROM bizneset b ORDER BY b.created_at DESC`);
    const pesha = require('./pesha');
    const rows = r.rows.map(b => ({
      id: b.id, emri: b.emri, email: b.email, logo_url: b.logo_url, tipi: b.tipi,
      shfaqje_marre: b.shfaqje_marre, shfaqje_dhene: b.shfaqje_dhene,
      pike_profili: Math.round(pesha.pikeProfili(b.tipi || 'b2b', b.shfaqje_marre, b.konvertime))
    }));
    res.json(rows);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// --- BALANCAT: dhene/marra (shfaqje, burimi='barazi') per cdo biznes ne logjiken Balance ---
// Perdoret nga admin.html per grafikun "male/kodra" — kolona te vogla katroresh per biznes,
// neto = marra - dhene (pozitiv = ka marre me shume se ka dhene, negativ = anasjelltas).
// Biznesi konsiderohet "ne Balance" nese: (a) ka logjika_shperndarjes='barazi' te bizneset,
// OSE (b) ka te pakten nje reklame ne promovimet me logjika_shperndarjes='barazi'.
app.get('/api/admin/balancat', iAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT b.id, b.emri,
        COALESCE(dhene.n,0)::int AS dhene_shfaqje,
        COALESCE(marra.n,0)::int AS marra_shfaqje
      FROM bizneset b
      LEFT JOIN (
        SELECT biznes_id, COUNT(*)::int AS n FROM ngjarjet
        WHERE lloji='view' AND burimi='barazi' GROUP BY biznes_id
      ) dhene ON dhene.biznes_id = b.id
      LEFT JOIN (
        SELECT reklamues_id, COUNT(*)::int AS n FROM ngjarjet
        WHERE lloji='view' AND burimi='barazi' GROUP BY reklamues_id
      ) marra ON marra.reklamues_id = b.id
      WHERE b.logjika_shperndarjes='barazi'
         OR EXISTS (SELECT 1 FROM promovimet p
                    WHERE p.biznes_id=b.id AND p.aktiv=true AND p.logjika_shperndarjes='barazi')
      ORDER BY b.id`);
    res.json(r.rows.map(x => ({
      id: x.id, emri: x.emri,
      dhene: x.dhene_shfaqje, marra: x.marra_shfaqje,
      neto: x.marra_shfaqje - x.dhene_shfaqje
    })));
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// --- BALANCET (ANALITIKE): lista e bizneseve Balance me numra permbledhes te vendimeve ---
// Biznesi konsiderohet "ne Balance" nese: (a) ka logjika_shperndarjes='barazi' te bizneset,
// OSE (b) ka te pakten nje reklame ne promovimet me logjika_shperndarjes='barazi'.
app.get('/api/admin/balancet-lista', iAdmin, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT b.id, b.emri, b.email,
        COALESCE(v.vetem, 0)::int        AS fitore_vetem,
        COALESCE(v.fit_barazim, 0)::int  AS fitore_barazim,
        COALESCE(v.pjes_barazim, 0)::int AS pjesemarrje_barazim
      FROM bizneset b
      LEFT JOIN (
        SELECT reklamues_id,
          COUNT(*) FILTER (WHERE fitoi=true  AND me_barazim=false)::int AS vetem,
          COUNT(*) FILTER (WHERE fitoi=true  AND me_barazim=true )::int AS fit_barazim,
          COUNT(*) FILTER (WHERE                me_barazim=true )::int AS pjes_barazim
        FROM balancet GROUP BY reklamues_id
      ) v ON v.reklamues_id = b.id
      WHERE b.logjika_shperndarjes='barazi'
         OR EXISTS (SELECT 1 FROM promovimet p
                    WHERE p.biznes_id=b.id AND p.aktiv=true AND p.logjika_shperndarjes='barazi')
      ORDER BY b.emri`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BALANCET (ANALITIKE): detajet e nje biznesi (dy grupime AGREGUAR) ---
//   vetem    → nje rresht per HOST: sa here ka fituar ky biznes te ky host
//   skenaret → nje rresht per skenar (host + set kandidatesh identike qe kane
//              qene te barabarte): AI-ja e fundit + numri i fitoreve per secilin
app.get('/api/admin/balancet/:id', iAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'ID e pavlefshme' });
  try {
    // Tabela 1 — Fitore si i vetem, AGREGUAR sipas host
    const vetemQ = await pool.query(`
      SELECT b.host_id,
        COUNT(*)::int AS shfaqje,
        MAX(b.created_at) AS last_at,
        (SELECT emri FROM bizneset WHERE id = b.host_id) AS host_emri
      FROM balancet b
      WHERE b.reklamues_id=$1 AND b.fitoi=true AND b.me_barazim=false
      GROUP BY b.host_id
      ORDER BY shfaqje DESC`, [id]);

    // Tabela 2 — Skenaret e barazimit. Marrim raw pastaj agregojme ne JS
    // sipas (host_id + set i kandidateve te barabarte).
    const vendQ = await pool.query(`
      SELECT DISTINCT vendim_id FROM balancet
      WHERE reklamues_id=$1 AND me_barazim=true`, [id]);
    const vendimIdet = vendQ.rows.map(x => x.vendim_id);
    let skenaret = [];
    if (vendimIdet.length) {
      const detQ = await pool.query(`
        SELECT b.vendim_id, b.host_id, b.reklamues_id, b.ai_skori, b.fitoi, b.created_at,
          (SELECT emri FROM bizneset WHERE id = b.host_id)      AS host_emri,
          (SELECT emri FROM bizneset WHERE id = b.reklamues_id) AS reklamues_emri
        FROM balancet b
        WHERE b.vendim_id = ANY($1::bigint[])
        ORDER BY b.vendim_id DESC, b.reklamues_id`, [vendimIdet]);

      // Hapi 1: grupim per vendim_id
      const vendimet = {};
      detQ.rows.forEach(r => {
        if (!vendimet[r.vendim_id]) vendimet[r.vendim_id] = {
          host_id: r.host_id,
          host_emri: r.host_emri,
          created_at: r.created_at,
          kandidatet: []
        };
        vendimet[r.vendim_id].kandidatet.push({
          reklamues_id: r.reklamues_id,
          reklamues_emri: r.reklamues_emri,
          ai_skori: r.ai_skori,
          fitoi: r.fitoi
        });
      });

      // Hapi 2: grupim per skenar = host_id + sorted candidate ids
      const skenMap = {};
      Object.values(vendimet).forEach(v => {
        const kandIds = v.kandidatet.map(k => k.reklamues_id).sort((a,b) => a-b).join(',');
        const skenId = v.host_id + ':' + kandIds;
        if (!skenMap[skenId]) skenMap[skenId] = {
          host_id: v.host_id,
          host_emri: v.host_emri,
          last_at: v.created_at,
          ndodhi_here: 0,
          kandidatet: {}
        };
        const s = skenMap[skenId];
        s.ndodhi_here++;
        if (new Date(v.created_at) > new Date(s.last_at)) s.last_at = v.created_at;
        v.kandidatet.forEach(k => {
          if (!s.kandidatet[k.reklamues_id]) s.kandidatet[k.reklamues_id] = {
            reklamues_id: k.reklamues_id,
            reklamues_emri: k.reklamues_emri,
            ai_skori_latest: k.ai_skori,
            fitore: 0
          };
          if (k.fitoi) s.kandidatet[k.reklamues_id].fitore++;
        });
      });

      skenaret = Object.values(skenMap).map(s => ({
        host_id: s.host_id,
        host_emri: s.host_emri,
        last_at: s.last_at,
        ndodhi_here: s.ndodhi_here,
        kandidatet: Object.values(s.kandidatet)
      })).sort((a, b) => b.ndodhi_here - a.ndodhi_here);
    }

    res.json({ vetem: vetemQ.rows, skenaret });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
app.get('/si-funksionon', (req, res) => res.sendFile(path.join(__dirname, 'public', 'si-funksionon.html')));
app.get('/ekipi', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/cilesimet', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
// --- 5 SAAS PROVE (demo-*.js — secili i pavarur; fshiji kur te mbarosh) ---
const demot = {
  paguar: require('./demo-paguar'),
  matje:  require('./demo-matje'),
  posta:  require('./demo-posta'),
  suport: require('./demo-suport'),
  dizajn: require('./demo-dizajn')
};
app.get('/demo/:slug', (req, res) => {
  const d = demot[req.params.slug];
  if (!d) return res.status(404).send('SaaS i panjohur');
  res.send(d.faqet.ballina());
});
app.get('/demo/:slug/regjistrohu', (req, res) => {
  const d = demot[req.params.slug];
  if (!d) return res.status(404).send('SaaS i panjohur');
  res.send(d.faqet.regjistrohu());
});
app.get('/demo/:slug/welcome', (req, res) => {
  const d = demot[req.params.slug];
  if (!d) return res.status(404).send('SaaS i panjohur');
  res.send(d.faqet.welcome());
});

// --- SAJTI I PROVES (test-saas.js — fshije bashke me kete bllok kur te mbaroje testimi) ---
const testSaas = require('./test-saas');
app.get('/test', (req, res) => res.send(testSaas.faqet.ballina()));
app.get('/test/regjistrohu', (req, res) => res.send(testSaas.faqet.regjistrohu()));
app.get('/test/welcome', (req, res) => res.send(testSaas.faqet.welcome()));
app.get('/test2', (req, res) => res.sendFile(path.join(__dirname, 'index-test-saas2.html')));
app.get('/test2/regjistrohu', (req, res) => res.sendFile(path.join(__dirname, 'test2-regjistrohu.html')));
app.get('/test2/welcome', (req, res) => res.sendFile(path.join(__dirname, 'test2-welcome.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// health check
app.get('/health', (req, res) => res.json({ ok: true, koha: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
initDB(pool)
  .then(() => kombinimi.init(pool))
  .then(() => selector.initGarat(pool))
  .then(() => app.listen(PORT, () => console.log('Imyr po punon ne portin ' + PORT)))
  .catch(e => {
    console.error('Gabim init DB:', e.message);
    // Nis serverin gjithsesi qe health check te punoje
    app.listen(PORT, () => console.log('Imyr (pa DB) ne portin ' + PORT));
  });
