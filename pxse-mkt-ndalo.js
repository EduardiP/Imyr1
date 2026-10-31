// pxse-mkt-ndalo.js — Ndalimi i fushatave te Marketingut nga admini (menuja "Emailet").
// Nuk prek marketing-email.js: vetem e shenon fushaten 'perfunduar', ashtu si e shenon vete motori kur mbaron.
// Email-et e derguara mbeten ne regjistër; ato ne pritje nuk dergohen me.
module.exports = function (app, pool, iAdmin) {
  const kaTabelat = async () => {
    const r = (await pool.query("SELECT to_regclass('marketing_fushatat') AS f, to_regclass('marketing_fushata_kontakte') AS fk, to_regclass('marketing_kontaktet') AS k")).rows[0];
    return !!(r.f && r.fk && r.k);
  };

  // Fushatat aktive me sa email-e kane ende ne pritje
  app.get('/api/admin/pxse/mkt/fushatat-aktive', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!(await kaTabelat())) return res.json({ ok: true, fushatat: [] });
      const r = await pool.query(`
        SELECT f.id, f.emri, f.llogaria, f.krijuar_at,
          (SELECT COUNT(*)::int FROM marketing_fushata_kontakte fk JOIN marketing_kontaktet k ON k.id = fk.kontakt_id
             WHERE fk.fushata_id = f.id AND NOT fk.derguar AND NOT k.unsubscribed) AS ne_pritje,
          (SELECT COUNT(*)::int FROM marketing_fushata_kontakte fk WHERE fk.fushata_id = f.id AND fk.derguar) AS derguar,
          ARRAY(SELECT DISTINCT k.kategoria FROM marketing_fushata_kontakte fk JOIN marketing_kontaktet k ON k.id = fk.kontakt_id
             WHERE fk.fushata_id = f.id AND k.kategoria IS NOT NULL) AS kategorite
        FROM marketing_fushatat f WHERE f.statusi = 'aktiv' ORDER BY f.id DESC LIMIT 50`);
      res.json({ ok: true, fushatat: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Ndal nje fushate: email-et ne pritje nuk dergohen me
  app.post('/api/admin/pxse/mkt/fushata/:id/ndalo', iAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Fushata e pavlefshme.' });
    try {
      const r = await pool.query("UPDATE marketing_fushatat SET statusi = 'perfunduar' WHERE id = $1 AND statusi = 'aktiv' RETURNING id", [id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Fushata nuk u gjet ose është ndalur tashmë.' });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
