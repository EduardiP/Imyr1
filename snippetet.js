// snippetet.js — Mundeson qe nje biznes te kete disa snippet-e reklamash.
// Snippet-i i pare (celesi te bizneset) migrohet automatikisht si "Snippet 1".
// Cdo snippet ka celesin, madhesine (desktop+mobile) dhe pozicionin e vet.
// Statistikat/pikët/reklamat mbeten PER BIZNES — ndryshon vetem madhesia/pozicioni per snippet.
// Server.js e therret: require('./snippetet')(app, pool, iLoguar, beCeles);
// Nuk prek asnje logjike ekzistuese.

const STANDARD_D = '210x261';
const STANDARD_M = '290x260';

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS snippetet (
      id SERIAL PRIMARY KEY,
      biznes_id        INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
      celes            TEXT UNIQUE NOT NULL,
      emri             TEXT,
      madhesia_desktop TEXT DEFAULT '210x261',
      madhesia_mobile  TEXT DEFAULT '290x260',
      pozicioni        TEXT DEFAULT 'qender',
      snippet_active   BOOLEAN DEFAULT false,
      first_seen_at    TIMESTAMPTZ,
      last_seen_at     TIMESTAMPTZ,
      krijuar_at       TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_snippetet_biz ON snippetet(biznes_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_snippetet_celes ON snippetet(celes)`);

  // MIGRIMI: cdo biznes qe ka celes por s'ka ende asnje snippet te tabela e re →
  // krijo snippet-in e pare me te dhenat ekzistuese (celes, madhesi, pozicion, active).
  await pool.query(`
    INSERT INTO snippetet (biznes_id, celes, emri, madhesia_desktop, madhesia_mobile, pozicioni, snippet_active, first_seen_at, last_seen_at)
    SELECT b.id, b.celes, 'Snippet 1',
           COALESCE(b.madhesia_desktop, '210x261'),
           COALESCE(b.madhesia_mobile, '290x260'),
           COALESCE(b.pozicioni_reklames, 'qender'),
           COALESCE(b.snippet_active, false),
           b.first_seen_at, b.last_seen_at
    FROM bizneset b
    WHERE b.celes IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM snippetet s WHERE s.biznes_id = b.id)
  `);
}

// Ndihmes qe endpoint-et ekzistuese (server.js) e perdorin:
// gjej snippet-in + biznesin nga nje celes. Kthen null nese s'gjendet.
// Perputhshmeri prapa: kerkon te snippetet; nese celesi eshte i vjetri i bizneset
// por s'u migrua ende, e gjen te bizneset.
async function ngaCelesi(pool, celes) {
  let r = await pool.query(
    `SELECT s.id AS snippet_id, s.biznes_id, s.celes,
            s.madhesia_desktop, s.madhesia_mobile, s.pozicioni, s.snippet_active
     FROM snippetet s WHERE s.celes = $1`, [celes]);
  if (r.rows.length) return r.rows[0];
  // Fallback te bizneset (nese ndonje celes s'eshte migruar)
  r = await pool.query(
    `SELECT NULL::int AS snippet_id, id AS biznes_id, celes,
            madhesia_desktop, madhesia_mobile, pozicioni_reklames AS pozicioni, snippet_active
     FROM bizneset WHERE celes = $1`, [celes]);
  return r.rows.length ? r.rows[0] : null;
}

module.exports = function (app, pool, iLoguar, beCeles) {

  init(pool).catch(e => console.error('snippetet init:', e.message));

  // Listo snippet-et e biznesit (te loguar)
  app.get('/api/snippetet', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, celes, emri, madhesia_desktop, madhesia_mobile, pozicioni, snippet_active, krijuar_at
         FROM snippetet WHERE biznes_id=$1 ORDER BY id ASC`, [req.biznesId]);
      res.json({ snippetet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Merr nje snippet te vetem
  app.get('/api/snippetet/:id', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, celes, emri, madhesia_desktop, madhesia_mobile, pozicioni, snippet_active
         FROM snippetet WHERE id=$1 AND biznes_id=$2`, [req.params.id, req.biznesId]);
      if (!r.rows.length) return res.status(404).json({ error: 'S\'u gjet.' });
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Krijo nje snippet te ri
  app.post('/api/snippetet', iLoguar, async (req, res) => {
    try {
      const celes = beCeles();
      const numri = await pool.query('SELECT COUNT(*)::int AS n FROM snippetet WHERE biznes_id=$1', [req.biznesId]);
      const emri = 'Snippet ' + (numri.rows[0].n + 1);
      const r = await pool.query(
        `INSERT INTO snippetet (biznes_id, celes, emri, madhesia_desktop, madhesia_mobile, pozicioni)
         VALUES ($1,$2,$3,$4,$5,'qender')
         RETURNING id, celes, emri, madhesia_desktop, madhesia_mobile, pozicioni, snippet_active`,
        [req.biznesId, celes, emri, STANDARD_D, STANDARD_M]);
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Fshi nje snippet (jo lejohet fshirja e te fundit — biznesi duhet te kete te pakten nje)
  app.delete('/api/snippetet/:id', iLoguar, async (req, res) => {
    try {
      const c = await pool.query('SELECT COUNT(*)::int AS n FROM snippetet WHERE biznes_id=$1', [req.biznesId]);
      if (c.rows[0].n <= 1) return res.status(400).json({ error: 'S\'mund të fshihet snippet-i i fundit.' });
      await pool.query('DELETE FROM snippetet WHERE id=$1 AND biznes_id=$2', [req.params.id, req.biznesId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Kontrollo nese nje snippet eshte lidhur (per polling gjate verifikimit)
  app.get('/api/snippetet/:id/kontrollo', iLoguar, async (req, res) => {
    try {
      const r = await pool.query('SELECT snippet_active FROM snippetet WHERE id=$1 AND biznes_id=$2',
        [req.params.id, req.biznesId]);
      res.json({ active: r.rows.length ? !!r.rows[0].snippet_active : false });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ruaj madhesine/pozicionin e nje snippet-i specifik
  app.post('/api/snippetet/:id/madhesia', iLoguar, async (req, res) => {
    const bd = req.body || {};
    const cakto = [], vals = [req.params.id, req.biznesId];
    let n = 2;
    if (bd.desktop != null) { const v = validoDesktop(bd.desktop); if(!v) return res.status(400).json({error:'Madhesi desktop e pavlefshme.'}); cakto.push('madhesia_desktop=$'+(++n)); vals.push(v); }
    if (bd.mobile != null)  { const v = validoMobile(bd.mobile);  if(!v) return res.status(400).json({error:'Madhesi mobile e pavlefshme.'});  cakto.push('madhesia_mobile=$'+(++n));  vals.push(v); }
    if (bd.pozicioni != null){ const v = ['qender','majtas','djathtas'].indexOf(bd.pozicioni)>-1?bd.pozicioni:null; if(!v) return res.status(400).json({error:'Pozicion i pavlefshem.'}); cakto.push('pozicioni=$'+(++n)); vals.push(v); }
    if (!cakto.length) return res.status(400).json({ error: 'Asgje per te ruajtur.' });
    try {
      await pool.query(`UPDATE snippetet SET ${cakto.join(', ')} WHERE id=$1 AND biznes_id=$2`, vals);
      res.json({ ok: true, desktop: bd.desktop, mobile: bd.mobile, pozicioni: bd.pozicioni });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};

// Validim i thjeshte i madhesive (te njejtat kufij si madhesia.js)
function validoDesktop(m){ return _valido(m, 260, 290, 134, 155); }
function validoMobile(m){ return _valido(m, 320, 400, 260, 192); }
function _valido(mad, maxW, maxH, minW, minH){
  const r = /^(\d{2,4})x(\d{2,4})$/.exec(String(mad||'').trim());
  if(!r) return null;
  let w=parseInt(r[1],10), h=parseInt(r[2],10);
  if(isNaN(w)||isNaN(h)) return null;
  w=Math.max(minW,Math.min(maxW,w)); h=Math.max(minH,Math.min(maxH,h));
  return w+'x'+h;
}

module.exports.ngaCelesi = ngaCelesi;
module.exports.init = init;
