// analytics.js — LLOGARITJA E STATISTIKAVE
// Perdoret nga admin-i DHE nga klienti (te dy th;errasin te njejtat funksione).
// Ndryshohet vetem ky skedar.

// Statistikat e nje biznesi (hosti + reklamat e tij).
async function statistikaBiznesi(pool, bizId) {
  const ads    = await pool.query('SELECT COUNT(*)::int n FROM promovimet WHERE biznes_id=$1 AND aktiv=true', [bizId]);
  const views  = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE biznes_id=$1 AND lloji='view'", [bizId]);
  const clicks = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE biznes_id=$1 AND lloji='click'", [bizId]);
  const vende  = await pool.query('SELECT COUNT(DISTINCT origjina)::int n FROM ngjarjet WHERE biznes_id=$1 AND origjina IS NOT NULL', [bizId]);
  return {
    reklama_krijuara: ads.rows[0].n,
    shfaqje_ne_webin_e_tij: views.rows[0].n,
    klikime_ne_webin_e_tij: clicks.rows[0].n,
    snippet_vende: vende.rows[0].n,
    // Mbushet kur te ndertohet atribuimi per reklame (cila reklame u shfaq te kush):
    shfaqje_te_reklamave_te_tij: 0
  };
}

module.exports = { statistikaBiznesi };
