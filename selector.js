// selector.js — LOGJIKA E SHPERNDARJES SE REKLAMAVE
// Ndryshohet VETEM ky skedar; server.js thjesht e therret.

// bizId = biznesi qe ka snippet-in (hosti). Kthen reklamen qe do shfaqet, ose null.
// PLACEHOLDER v1: nje reklame nga nje biznes TJETER (tekst OSE imazh), rastesisht.
async function zgjidhReklame(pool, bizId) {
  const p = await pool.query(
    `SELECT teksti, imazh_url, link FROM promovimet
     WHERE biznes_id <> $1 AND aktiv = true
       AND (teksti IS NOT NULL OR imazh_url IS NOT NULL)
     ORDER BY random() LIMIT 1`, [bizId]);
  return p.rows.length ? p.rows[0] : null;
}

module.exports = { zgjidhReklame };
