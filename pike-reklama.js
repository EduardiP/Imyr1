// pike-reklama.js — Ankandi i DYTE: kur nje biznes fiton ankandin kryesor dhe ka +2 reklama,
// ky zgjedh CILA reklame e tij shfaqet. Piket llogariten LIVE nga ngjarjet e 30 diteve te fundit.
//
// Formula e pikeve te nje reklame:
//   Pike = 1000 + (klikime × 5) + (konvertime × 2) − ((shikime − klikime) / 14)
//   ku "shikime" = shikime REALE (lloji='shikim'), jo ngarkime (lloji='view').
//
// Faza fillestare (learning): secila reklame zgjidhet me radhe derisa te marre 1, pastaj 2,
// pastaj 3 shikime reale. Pas kesaj → weighted-random sipas pikeve.
//
// Server.js/selector.js e therret: const pr = require('./pike-reklama');
//   const rekId = await pr.zgjedhReklamen(pool, bizId);

const DITE = 30;            // dritarja e skadimit
const KLIKIM_PIKE = 5;
const KONVERTIM_PIKE = 2;
const ZBRITJE_EMERUES = 14; // cdo shikim pa klikim zbret 1/14
const BAZA = 1000;
const SHIKIME_FAZA = 3;     // secila reklame merr deri 3 shikime para weighted-random

// Merr reklamat aktive (jo te pauzuara) te nje biznesi
async function reklamatEBiznesit(pool, bizId) {
  const r = await pool.query(
    `SELECT id FROM promovimet
     WHERE biznes_id=$1 AND aktiv=true AND COALESCE(pauzuar,false)=false
       AND (teksti IS NOT NULL OR imazh_url IS NOT NULL OR video_url IS NOT NULL OR html5_url IS NOT NULL)`,
    [bizId]);
  return r.rows.map(x => x.id);
}

// Statistikat (shikime/klikime/konvertime) per cdo reklame, brenda 30 diteve
async function statPerReklama(pool, rekIds) {
  if (!rekIds.length) return {};
  const r = await pool.query(
    `SELECT reklama_id,
            COUNT(*) FILTER (WHERE lloji='shikim')::int    AS shikime,
            COUNT(*) FILTER (WHERE lloji='click')::int     AS klikime,
            COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
     FROM ngjarjet
     WHERE reklama_id = ANY($1)
       AND created_at >= now() - ($2 || ' days')::interval
     GROUP BY reklama_id`,
    [rekIds, String(DITE)]);
  const m = {};
  r.rows.forEach(x => { m[x.reklama_id] = x; });
  return m;
}

// Pikët e nje reklame nga statistikat e saj
function pikeReklame(st) {
  const shikime    = (st && st.shikime)    || 0;
  const klikime    = (st && st.klikime)    || 0;
  const konvertime = (st && st.konvertime) || 0;
  const paKlikim = Math.max(0, shikime - klikime);
  return BAZA + (klikime * KLIKIM_PIKE) + (konvertime * KONVERTIM_PIKE) - (paKlikim / ZBRITJE_EMERUES);
}

// Zgjedh nje reklame te biznesit. Kthen id-ne e reklames, ose null nese s'ka.
async function zgjedhReklamen(pool, bizId) {
  const rekIds = await reklamatEBiznesit(pool, bizId);
  if (!rekIds.length) return null;
  if (rekIds.length === 1) return rekIds[0];   // nje reklame → s'ka ankand te dyte

  const stat = await statPerReklama(pool, rekIds);

  // FAZA FILLESTARE: nese ndonje reklame ka < SHIKIME_FAZA shikime,
  // zgjidh me radhe ate qe ka me pak shikime (barazim → rastesisht mes tyre).
  const mePakShikime = rekIds
    .map(id => ({ id, shikime: (stat[id] && stat[id].shikime) || 0 }))
    .filter(x => x.shikime < SHIKIME_FAZA);
  if (mePakShikime.length) {
    const min = Math.min.apply(null, mePakShikime.map(x => x.shikime));
    const kandidate = mePakShikime.filter(x => x.shikime === min);
    return kandidate[Math.floor(Math.random() * kandidate.length)].id;
  }

  // WEIGHTED-RANDOM sipas pikeve (te gjitha kane >=3 shikime)
  const lista = rekIds.map(id => ({ id, pike: Math.max(0, pikeReklame(stat[id])) }));
  const shuma = lista.reduce((a, x) => a + x.pike, 0);
  if (shuma <= 0) return lista[Math.floor(Math.random() * lista.length)].id;
  let pike = Math.random() * shuma;
  for (const x of lista) { pike -= x.pike; if (pike <= 0) return x.id; }
  return lista[lista.length - 1].id;
}

// Lista e reklamave te nje biznesi me statistika + pike aktuale (per admin)
async function reklamatMePike(pool, bizId) {
  const r = await pool.query(
    `SELECT id, titulli, teksti, imazh_url, video_url, html5_url
     FROM promovimet WHERE biznes_id=$1 AND aktiv=true ORDER BY id DESC`, [bizId]);
  if (!r.rows.length) return [];
  const ids = r.rows.map(x => x.id);
  const stat = await statPerReklama(pool, ids);
  return r.rows.map(p => {
    const st = stat[p.id] || {};
    const lloji = p.video_url ? 'video' : (p.html5_url ? 'html5' : (p.imazh_url ? 'imazh' : 'tekst'));
    return {
      id: p.id,
      emri: p.titulli || (p.teksti ? String(p.teksti).slice(0, 40) : 'Reklamë'),
      lloji,
      shikime: st.shikime || 0,
      klikime: st.klikime || 0,
      konvertime: st.konvertime || 0,
      pike: Math.round(Math.max(0, pikeReklame(st)))
    };
  });
}

// Regjistron endpoint-in per admin: GET /api/admin/biznes/:id/reklamat
function rregjistroRoutet(app, pool, iAdmin) {
  app.get('/api/admin/biznes/:id/reklamat', iAdmin, async (req, res) => {
    try {
      const rows = await reklamatMePike(pool, parseInt(req.params.id, 10));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

module.exports = { zgjedhReklamen, pikeReklame, reklamatEBiznesit, statPerReklama, reklamatMePike, rregjistroRoutet };
