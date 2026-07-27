// selector.js — LOGJIKA E SHPERNDARJES SE REKLAMAVE
// Zgjedh reklamen qe shfaqet te nje snippet (host), me peshe:
//   pesha = vleresimi_AI(reklamues→host, nga `perputhjet`) + piket_e_profilit(reklamues)
// Filtri i tipit: b2b me b2b, b2c me b2c, b2b2c me te dyja.
// Probabiliteti = pesha e ketij ÷ shuma e peshave (weighted-random, pa perqindje fikse).
// Regjistron ankandin te tabela `garat` (kush garoi, pesha, kush fitoi).

const pesha = require('./pesha');

function tipetPerputhen(rTipi, hTipi) {
  if (rTipi === 'b2b2c' || hTipi === 'b2b2c') return true;
  return rTipi === hTipi;
}

// Pikët e profilit të reklamuesit — gjithmone aktive, pa learning phase
async function pikeProfiliBiznesi(pool, bizId, tipi) {
  const r = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
            COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
     FROM ngjarjet WHERE biznes_id=$1`, [bizId]);
  const shfaqje = r.rows[0].shfaqje, konvertime = r.rows[0].konvertime;
  const rate = pesha.PARAM.RATE[tipi] || pesha.PARAM.RATE.b2c;
  return (shfaqje / rate) + konvertime;
}

async function initGarat(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS garat (
      id SERIAL PRIMARY KEY,
      host_id      INTEGER NOT NULL,
      reklamues_id INTEGER NOT NULL,
      pesha        NUMERIC,
      fitoi        BOOLEAN DEFAULT false,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_garat_host ON garat(host_id)`);
}

async function zgjidhReklame(pool, hostId) {
  const h = await pool.query('SELECT tipi FROM bizneset WHERE id=$1', [hostId]);
  const hTipi = h.rows[0] && h.rows[0].tipi;

  const kand = await pool.query(
    `SELECT p.id, p.biznes_id, p.teksti, p.imazh_url, p.link, b.tipi
     FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
     WHERE p.biznes_id <> $1 AND p.aktiv = true
       AND (p.teksti IS NOT NULL OR p.imazh_url IS NOT NULL)`, [hostId]);

  const lista = [];
  for (const k of kand.rows) {
    if (hTipi && k.tipi && !tipetPerputhen(k.tipi, hTipi)) continue;
    let skorAI = 0;
    try {
      const s = await pool.query(
        'SELECT skori FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2', [k.biznes_id, hostId]);
      if (s.rows.length && s.rows[0].skori != null) skorAI = s.rows[0].skori;
    } catch (e) {}
    const pikeProf = await pikeProfiliBiznesi(pool, k.biznes_id, k.tipi || hTipi);
    const w = skorAI + pikeProf;
    lista.push({ k, pesha: w });
  }

  if (!lista.length) return null;

  const shuma = lista.reduce((a, x) => a + x.pesha, 0);
  let fituesi;
  if (shuma <= 0) {
    fituesi = lista[Math.floor(Math.random() * lista.length)];
  } else {
    let pike = Math.random() * shuma;
    for (const x of lista) { pike -= x.pesha; if (pike <= 0) { fituesi = x; break; } }
    if (!fituesi) fituesi = lista[lista.length - 1];
  }

  regjistroAnkandin(pool, hostId, lista, fituesi).catch(()=>{});
  return fituesi.k;
}

async function regjistroAnkandin(pool, hostId, lista, fituesi) {
  try {
    for (const x of lista) {
      await pool.query(
        'INSERT INTO garat (host_id, reklamues_id, pesha, fitoi) VALUES ($1,$2,$3,$4)',
        [hostId, x.k.biznes_id, Math.round(x.pesha * 10) / 10, x === fituesi]);
    }
  } catch (e) {}
}

module.exports = { zgjidhReklame, initGarat, tipetPerputhen };
