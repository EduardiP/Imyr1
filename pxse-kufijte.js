// pxse-kufijte.js (PhronexusAI) — kufijte ditore te pjesemarrjeve sipas planit + rregulli i kandidateve te Ankandit.
//
// RREGULLAT (te konfirmuara nga pronari):
//  - Plani falas eshte i perhershem (pa 7/90 dite falas). Kufiri: FALAS_DITE pjesemarrje ne dite ne Ankand
//    dhe FALAS_DITE ne Balance (veç e veç). Plani me pagese ($7/muaj): PAGESE_DITE per secilen pishine.
//  - "Pjesemarrje" = biznesi ishte kandidat ne nje gare te asaj pishine (rreshtat te `garat` per Ankandin,
//    te `balancet` per Balancen). Pishina qe humb zgjedhjen nuk numerohet (keto tabela shkruhen vetem kur
//    pishina e tyre fiton).
//  - Dita = dita kalendarike sipas ores se Berlinit.
//  - Ankand: kur arrin kufirin, s'merr me pjese ne Ankand deri neser (ose deri te plani me pagese).
//  - Balance (plani falas): kur arrin kufirin, s'merr me pjese ne Balance; snippet-i i tij vazhdon te jape
//    derisa shfaqjet reale Balance te dhena SOT te barazohen me ato te marra SOT. Kur barazohet, BLLOKOHET:
//    snippet-i s'shfaq me reklama dhe reklamat e tij s'shfaqen askund, deri neser ose deri te plani me pagese.
//  - Kandidatet e Ankandit per nje host: KANDIDATE_ANKAND me vleresimin AI me te larte per klientet e host-it,
//    plus kushdo tjeter me AI > PRAG_AI. Te katra vlerat ndryshohen nga admin-i.
//
// Gjithashtu: cilesimi i faqes publike "shfaq_numrat" (numri i bizneseve per kategori/shtet te direktoria e email-eve),
// i ndezur/fikur nga admin-i; faqja publike e lexon te GET /api/pxse/publike. Paracaktim: i fikur.
//
// Server.js e therret: require('./pxse-kufijte').routet(app, pool, iAdmin);
// selector.js dhe automatik.js perdorin: pranueshmeria(), hostiBllokuar(), filtroAnkandin().

const PARAZGJEDHJE = { kandidate_ankand: 7, prag_ai: 400, falas_dite: 100, pagese_dite: 3000, shfaq_numrat: false };
const ZONA = 'Europe/Berlin';
// Fillimi i dites se sotme sipas ores se Berlinit, si TIMESTAMPTZ (perdoret ne te gjitha numerimet)
const FILLIMI_DITES = `(date_trunc('day', now() AT TIME ZONE '${ZONA}') AT TIME ZONE '${ZONA}')`;

let _migruar = null;
function migro(pool) {
  if (_migruar) return _migruar;
  _migruar = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_kufijte (
      id INTEGER PRIMARY KEY DEFAULT 1,
      kandidate_ankand INTEGER NOT NULL DEFAULT 7,
      prag_ai INTEGER NOT NULL DEFAULT 400,
      falas_dite INTEGER NOT NULL DEFAULT 100,
      pagese_dite INTEGER NOT NULL DEFAULT 3000,
      perditesuar_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT pxse_kufijte_nje_rresht CHECK (id = 1)
    )`);
    await pool.query('INSERT INTO pxse_kufijte (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    await pool.query('ALTER TABLE pxse_kufijte ADD COLUMN IF NOT EXISTS shfaq_numrat BOOLEAN NOT NULL DEFAULT false');
    // Indekse per numerimet ditore (CONCURRENTLY: nuk bllokon shkrimet gjate ndertimit)
    const ind = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_garat_reklamues_koha ON garat (reklamues_id, created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_balancet_reklamues_koha ON balancet (reklamues_id, created_at)',
      "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ngj_bal_dhene ON ngjarjet (biznes_id, created_at) WHERE lloji='shikim' AND burimi='barazi'",
      "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ngj_bal_marre ON ngjarjet (reklamues_id, created_at) WHERE lloji='shikim' AND burimi='barazi'"
    ];
    for (const q of ind) { try { await pool.query(q); } catch (e) { console.error('pxse-kufijte indeks:', e.message); } }
  })().catch(e => { _migruar = null; console.error('pxse-kufijte migrim:', e.message); });
  return _migruar;
}

// Cilesimet (cache 30 sekonda, qe te mos lexohen ne cdo kerkese reklame)
let _cache = null, _cacheKoha = 0;
async function cilesimet(pool) {
  if (_cache && Date.now() - _cacheKoha < 30000) return _cache;
  try {
    await migro(pool);
    const r = await pool.query('SELECT kandidate_ankand, prag_ai, falas_dite, pagese_dite, shfaq_numrat FROM pxse_kufijte WHERE id=1');
    _cache = Object.assign({}, PARAZGJEDHJE, r.rows[0] || {});
  } catch (e) { _cache = _cache || Object.assign({}, PARAZGJEDHJE); }
  _cacheKoha = Date.now();
  return _cache;
}

// Gjendja e sotme per nje liste bizneshesh: plani, pjesemarrjet Ankand/Balance, shfaqjet Balance te dhena/marra.
async function gjendjaSot(pool, idet) {
  const ids = Array.from(new Set((idet || []).map(Number).filter(Boolean)));
  if (!ids.length) return {};
  const r = await pool.query(`
    SELECT b.id,
      (COALESCE(b.plani,'falas') = 'premium') AS paguar,
      (SELECT COUNT(*) FROM garat g WHERE g.reklamues_id = b.id AND g.created_at >= ${FILLIMI_DITES})::int AS ankand,
      (SELECT COUNT(*) FROM balancet x WHERE x.reklamues_id = b.id AND x.created_at >= ${FILLIMI_DITES})::int AS balance,
      (SELECT COUNT(*) FROM ngjarjet e WHERE e.biznes_id = b.id AND e.lloji='shikim' AND e.burimi='barazi' AND e.created_at >= ${FILLIMI_DITES})::int AS dhene,
      (SELECT COUNT(*) FROM ngjarjet e WHERE e.reklamues_id = b.id AND e.lloji='shikim' AND e.burimi='barazi' AND e.created_at >= ${FILLIMI_DITES})::int AS marre
    FROM bizneset b WHERE b.id = ANY($1::int[])`, [ids]);
  const m = {};
  r.rows.forEach(x => { m[x.id] = x; });
  return m;
}

function kufiri(c, gj) { return gj && gj.paguar ? c.pagese_dite : c.falas_dite; }
// Bllokuar = plan falas, ka arritur kufirin e Balances sot DHE ka dhene sot te pakten aq sa ka marre.
function eshteBllokuar(c, gj) {
  return !!(gj && !gj.paguar && gj.balance >= c.falas_dite && gj.dhene >= gj.marre);
}

// Kthen Set-in e ID-ve qe NUK lejohen sot ne kete pishine ('ankand' | 'barazi'):
// kufiri i pishines i arritur, ose biznesi i bllokuar (atehere s'lejohet ne asnje pishine).
// Nese numerimi deshton, s'perjashton askend (mos e ndal shperndarjen fare).
async function pranueshmeria(pool, idet, pishina) {
  const jashte = new Set();
  try {
    const c = await cilesimet(pool);
    const gj = await gjendjaSot(pool, idet);
    Object.keys(gj).forEach(k => {
      const x = gj[k], id = Number(k);
      if (eshteBllokuar(c, x)) { jashte.add(id); return; }
      const n = pishina === 'barazi' ? x.balance : x.ankand;
      if (n >= kufiri(c, x)) jashte.add(id);
    });
  } catch (e) { console.error('pxse-kufijte pranueshmeria:', e.message); }
  return jashte;
}

// A eshte host-i i bllokuar sot (snippet-i i tij s'shfaq asgje)?
async function hostiBllokuar(pool, hostId) {
  try {
    const c = await cilesimet(pool);
    const gj = await gjendjaSot(pool, [hostId]);
    return eshteBllokuar(c, gj[Number(hostId)]);
  } catch (e) { console.error('pxse-kufijte hostiBllokuar:', e.message); return false; }
}

// Ankand: mban KANDIDATE_ANKAND me AI me te larte per host-in + kedo me AI > PRAG_AI.
// rreshtat = [{ biznes_id, ... }]. Renditja e kthyer ruan renditjen origjinale te rreshtave.
async function filtroAnkandin(pool, hostId, rreshtat) {
  if (!rreshtat || !rreshtat.length) return rreshtat || [];
  try {
    const c = await cilesimet(pool);
    const ids = rreshtat.map(k => Number(k.biznes_id));
    const r = await pool.query(
      'SELECT reklamues_id, skori FROM perputhjet WHERE host_id=$1 AND reklamues_id = ANY($2::int[]) AND skori IS NOT NULL',
      [hostId, ids]);
    const ai = {}; ids.forEach(id => { ai[id] = 0; });
    r.rows.forEach(x => { ai[x.reklamues_id] = Number(x.skori) || 0; });
    const renditur = ids.slice().sort((a, b) => ai[b] - ai[a]);
    const mbaj = new Set(renditur.slice(0, Math.max(1, c.kandidate_ankand)));
    renditur.forEach(id => { if (ai[id] > c.prag_ai) mbaj.add(id); });
    return rreshtat.filter(k => mbaj.has(Number(k.biznes_id)));
  } catch (e) { console.error('pxse-kufijte filtroAnkandin:', e.message); return rreshtat; }
}

// ---------- Rruget e admin-it ----------
function routet(app, pool, iAdmin) {
  migro(pool);
  app.get('/api/admin/pxse/kufijte', iAdmin, async (req, res) => {
    try {
      await migro(pool);
      const r = await pool.query('SELECT kandidate_ankand, prag_ai, falas_dite, pagese_dite, shfaq_numrat, perditesuar_at FROM pxse_kufijte WHERE id=1');
      res.json({ ok: true, kufijte: r.rows[0] || PARAZGJEDHJE });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Faqja publike: shfaq / fsheh numrin e bizneseve per kategori dhe shtet (vlen menjehere)
  app.post('/api/admin/pxse/kufijte/numrat', iAdmin, async (req, res) => {
    try {
      await migro(pool);
      const v = !!(req.body || {}).shfaq;
      await pool.query('UPDATE pxse_kufijte SET shfaq_numrat=$1, perditesuar_at=now() WHERE id=1', [v]);
      _cache = null;
      res.json({ ok: true, shfaq_numrat: v });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/pxse/publike', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { const c = await cilesimet(pool); res.json({ shfaq_numrat: !!c.shfaq_numrat }); }
    catch (e) { res.json({ shfaq_numrat: false }); }
  });
  app.post('/api/admin/pxse/kufijte', iAdmin, async (req, res) => {
    const b = req.body || {};
    const nr = (v, min, max) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
    const v = {
      kandidate_ankand: nr(b.kandidate_ankand, 1, 100),
      prag_ai: nr(b.prag_ai, 0, 1000),
      falas_dite: nr(b.falas_dite, 1, 1000000),
      pagese_dite: nr(b.pagese_dite, 1, 1000000)
    };
    if (Object.values(v).some(x => x === null)) return res.status(400).json({ error: 'Vlera të pavlefshme: kandidatët 1–100, pragu 0–1000, kufijtë 1–1 000 000.' });
    if (v.pagese_dite < v.falas_dite) return res.status(400).json({ error: 'Kufiri i planit me pagesë s\'mund të jetë më i vogël se i planit falas.' });
    try {
      await migro(pool);
      await pool.query(`UPDATE pxse_kufijte SET kandidate_ankand=$1, prag_ai=$2, falas_dite=$3, pagese_dite=$4, perditesuar_at=now() WHERE id=1`,
        [v.kandidate_ankand, v.prag_ai, v.falas_dite, v.pagese_dite]);
      _cache = null; // vlerat e reja vlejne menjehere
      res.json({ ok: true, kufijte: v });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

module.exports = { routet, cilesimet, gjendjaSot, pranueshmeria, hostiBllokuar, filtroAnkandin, eshteBllokuar, kufiri };
