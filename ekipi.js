// ekipi.js — "Ekipi & Rolet": TANI VETËM LISTË PRITJEJE (coming soon).
// Dërgimi real i ftesave/anëtarëve/roleve u HOQ — do rikthehet kur veçoria të ndërtohet plotësisht.
// Server.js e therret: require('./ekipi')(app, pool, iLoguar, resendKlient);

async function init(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ekipi_lista_pritjes (
      id SERIAL PRIMARY KEY,
      biznes_id INTEGER NOT NULL UNIQUE REFERENCES bizneset(id),
      email TEXT NOT NULL,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);
}

module.exports = function (app, pool, iLoguar, resendKlient) {
  init(pool).catch(e => console.error('ekipi init:', e.message));

  // A eshte biznesi aktual tashme ne listen e pritjes?
  app.get('/api/ekipi/lista-pritjes/statusi', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(`SELECT 1 FROM ekipi_lista_pritjes WHERE biznes_id=$1`, [req.biznesId]);
      res.json({ regjistruar: r.rows.length > 0 });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Regjistrohu ne listen e pritjes (email i mbushur automatikisht nga vete klienti, frontend)
  app.post('/api/ekipi/lista-pritjes/regjistrohu', iLoguar, async (req, res) => {
    const email = ((req.body && req.body.email) || '').trim();
    if (!email) return res.status(400).json({ error: 'Email-i mungon.' });
    try {
      const ekzistues = await pool.query(`SELECT 1 FROM ekipi_lista_pritjes WHERE biznes_id=$1`, [req.biznesId]);
      if (ekzistues.rows.length) return res.json({ tashme: true });

      await pool.query(
        `INSERT INTO ekipi_lista_pritjes (biznes_id, email) VALUES ($1,$2)`,
        [req.biznesId, email]);

      // Njofto pronarin (Eduard) me email, nese Resend eshte lidhur
      if (resendKlient) {
        try {
          await resendKlient.emails.send({
            from: process.env.EKIPI_EMAIL_FROM || 'PhronexusAI <onboarding@resend.dev>',
            to: process.env.PRONARI_EMAIL || 'eduardpepushaj@gmail.com',
            subject: 'Klient i ri në listën e pritjes — Teams & Roles',
            html: `<p>Biznesi (ID: ${req.biznesId}, email: ${email}) u regjistrua në listën e pritjes për "Teams & Roles".</p>`
          });
        } catch (e) { console.error('EKIPI-PRITJE: dergimi i njoftimit deshtoi:', e.message); }
      }

      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
