// selector.js — LOGJIKA E SHPERNDARJES SE REKLAMAVE
// pesha = vleresimi_AI(reklamues→host) + piket_e_profilit(reklamues) + ndihma_neto
//   ndihma jepet vetem nese cifti eshte nder 3 kombinimet me te mira te reklamuesit,
//   AI brenda 20-320, dhe zbritet nga piket e profilit (nje-per-nje). Pa learning phase.
// Filtri i tipit: b2b me b2b, b2c me b2c, b2b2c me te dyja.
// Probabiliteti = pesha ÷ shuma (weighted-random). Regjistron ankandin te `garat`.

const pesha = require('./pesha');

function tipetPerputhen(rTipi, hTipi) {
  if (rTipi === 'b2b2c' || hTipi === 'b2b2c') return true;
  return rTipi === hTipi;
}

// Piket e profilit — nga shfaqjet/konvertimet qe biznesi OFRON si host. Gjithmone aktive.
async function pikeProfiliBiznesi(pool, bizId, tipi) {
  const r = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
            COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
     FROM ngjarjet WHERE biznes_id=$1`, [bizId]);
  const shfaqje = r.rows[0].shfaqje, konvertime = r.rows[0].konvertime;
  const rate = pesha.PARAM.RATE[tipi] || pesha.PARAM.RATE.b2c;
  return (shfaqje / rate) + konvertime;
}

// A eshte host-i nder 3 kombinimet me te mira (AI) te reklamuesit?
async function eshteNderTop3(pool, reklamuesId, hostId) {
  const r = await pool.query(
    `SELECT host_id FROM perputhjet
     WHERE reklamues_id=$1 AND skori IS NOT NULL
     ORDER BY skori DESC LIMIT $2`, [reklamuesId, pesha.PARAM.TOP_KOMBINIME]);
  return r.rows.some(x => x.host_id === hostId);
}

async function initGarat(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS garat (
      id SERIAL PRIMARY KEY,
      host_id      INTEGER NOT NULL,
      reklamues_id INTEGER NOT NULL,
      pesha        NUMERIC,
      ai           NUMERIC,
      profili      NUMERIC,
      ndihma       NUMERIC,
      ndihma_bruto NUMERIC,
      fitoi        BOOLEAN DEFAULT false,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_garat_host ON garat(host_id)`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ai NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS profili NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ndihma NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS snippet_id INTEGER`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ndihma_bruto NUMERIC`);
}

async function zgjidhReklame(pool, hostId, pare, snippetId) {
  pare = Array.isArray(pare) ? pare : [];
  const h = await pool.query('SELECT tipi FROM bizneset WHERE id=$1', [hostId]);
  const hTipi = h.rows[0] && h.rows[0].tipi;

  const kand = await pool.query(
    `SELECT p.id, p.biznes_id, p.teksti, p.imazh_url, p.link, b.tipi
     FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
     WHERE p.biznes_id <> $1 AND p.aktiv = true
       AND (p.teksti IS NOT NULL OR p.imazh_url IS NOT NULL)
       AND EXISTS (SELECT 1 FROM snippetet s WHERE s.biznes_id = b.id AND s.snippet_active = true)`, [hostId]);

  // Filtri i tipit
  let kandidatet = kand.rows.filter(k => !(hTipi && k.tipi && !tipetPerputhen(k.tipi, hTipi)));

  // Frequency capping: hiq ato qe vizitori i ka pare tashme kete vizite.
  // Nese pas heqjes s'mbetet asnje (i pa te gjitha), rifillo ciklin nga e para.
  let cikelRi = false;
  if (pare.length) {
    const pareStr = pare.map(String);
    const paFiltruar = kandidatet.filter(k => pareStr.indexOf(String(k.id)) === -1);
    if (paFiltruar.length) {
      kandidatet = paFiltruar;
    } else {
      cikelRi = true;   // i pa te gjitha → cikel i ri, snippet-i pastron listen
    }
  }

  const lista = [];
  for (const k of kandidatet) {

    // 1. Vleresimi AI: reklamues→host
    let skorAI = 0;
    try {
      const s = await pool.query(
        'SELECT skori FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2', [k.biznes_id, hostId]);
      if (s.rows.length && s.rows[0].skori != null) skorAI = s.rows[0].skori;
    } catch (e) {}

    // 2. Piket e profilit
    const pikeProf = await pikeProfiliBiznesi(pool, k.biznes_id, k.tipi || hTipi);

    // 3. Ndihma — vetem nese nder top-3 e reklamuesit; zbritet nga profili
    let nderTop3 = false;
    try { nderTop3 = await eshteNderTop3(pool, k.biznes_id, hostId); } catch (e) {}
    const ndihBruto = nderTop3 ? pesha.ndihma(skorAI) : 0;      // para zbritjes
    const ndih = pesha.ndihmaNeto(skorAI, pikeProf, nderTop3);  // pas zbritjes

    const w = skorAI + pikeProf + ndih;   // pesha totale
    lista.push({ k, pesha: w, ai: skorAI, profili: pikeProf, ndihma: ndih, ndihmaBruto: ndihBruto });
  }

  if (!lista.length) return null;

  // Weighted-random
  const shuma = lista.reduce((a, x) => a + x.pesha, 0);
  let fituesi;
  if (shuma <= 0) {
    fituesi = lista[Math.floor(Math.random() * lista.length)];
  } else {
    let pike = Math.random() * shuma;
    for (const x of lista) { pike -= x.pesha; if (pike <= 0) { fituesi = x; break; } }
    if (!fituesi) fituesi = lista[lista.length - 1];
  }

  regjistroAnkandin(pool, hostId, lista, fituesi, snippetId).catch(()=>{});
  return Object.assign({}, fituesi.k, { cikel_ri: cikelRi });
}

async function regjistroAnkandin(pool, hostId, lista, fituesi, snippetId) {
  try {
    for (const x of lista) {
      await pool.query(
        `INSERT INTO garat (host_id, reklamues_id, pesha, ai, profili, ndihma, ndihma_bruto, fitoi, snippet_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [hostId, x.k.biznes_id,
         rr(x.pesha), rr(x.ai), rr(x.profili), rr(x.ndihma), rr(x.ndihmaBruto), x === fituesi, snippetId || null]);
    }
  } catch (e) {}
}
function rr(n){ return Math.round(n * 10) / 10; }

module.exports = { zgjidhReklame, initGarat, tipetPerputhen };
