// analytics.js — LLOGARITJA E STATISTIKAVE
// Perdoret nga admin-i DHE nga klienti. Ndryshohet vetem ky skedar.

async function statistikaBiznesi(pool, bizId) {
  // Si HOST (faqja e tij tregon reklama te te tjereve):
  const ads    = await pool.query('SELECT COUNT(*)::int n FROM promovimet WHERE biznes_id=$1 AND aktiv=true', [bizId]);
  const views  = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE biznes_id=$1 AND lloji='view'", [bizId]);
  const clicks = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE biznes_id=$1 AND lloji='click'", [bizId]);
  const vende  = await pool.query('SELECT COUNT(DISTINCT origjina)::int n FROM ngjarjet WHERE biznes_id=$1 AND origjina IS NOT NULL', [bizId]);
  // Si REKLAMUES (reklamat e tij te shfaqura/klikuara te te tjeret):
  const adViews  = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='view'", [bizId]);
  const adClicks = await pool.query("SELECT COUNT(*)::int n FROM ngjarjet WHERE reklamues_id=$1 AND lloji='click'", [bizId]);
  return {
    reklama_krijuara: ads.rows[0].n,
    shfaqje_ne_webin_e_tij: views.rows[0].n,
    klikime_ne_webin_e_tij: clicks.rows[0].n,
    snippet_vende: vende.rows[0].n,
    shfaqje_te_reklamave_te_tij: adViews.rows[0].n,
    klikime_te_reklamave_te_tij: adClicks.rows[0].n
  };
}

module.exports = { statistikaBiznesi };
