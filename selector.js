// selector.js — LOGJIKA E SHPERNDARJES SE REKLAMAVE
// Ketu vendoset e gjithe logjika: cila reklame shfaqet te nje host i caktuar.
// Ndryshohet VETEM ky skedar; server.js thjesht e therret.

// bizId = biznesi qe ka snippet-in (hosti, ku do shfaqet reklama).
// Kthen tekstin e reklames qe do shfaqet, ose null nese s'ka.
//
// PLACEHOLDER v1 (pershkohet kur te percaktohet logjika reale):
//   - nje reklame nga nje biznes TJETER (jo vet hosti), zgjedhur rastesisht.
//   - me vone: perputhje AI (kategori plotesuese) + performance + oferte + weighted random.
async function zgjidhReklame(pool, bizId) {
  const p = await pool.query(
    `SELECT teksti FROM promovimet
     WHERE biznes_id <> $1 AND aktiv = true AND teksti IS NOT NULL
     ORDER BY random() LIMIT 1`, [bizId]);
  return p.rows.length ? p.rows[0].teksti : null;
}

module.exports = { zgjidhReklame };
