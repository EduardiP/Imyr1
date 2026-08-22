// ekipi.js — "Ekipi & Rolet": anëtarë, role (shabllone+leje), ftesa me email, regjistër aktiviteti.
// Server.js e therret: require('./ekipi')(app, pool, iLoguar, resendKlient);
//
// SHËNIM I RËNDËSISHËM: pjesa e hyrjes (login) të anëtarëve duhet të përputhet me auth.js-in
// tënd real — s'e kam parë atë skedar. Këtu supozoj se çdo anëtar merr rresht të vetin te
// `bizneset` (me email+fjalëkalim si çdo llogari tjetër), + `pronari_biznes_id` që tregon
// biznesin "prind" të cilit i shërben. Nëse auth.js funksionon ndryshe, kjo pjesë duhet
// përshtatur — mos e supozo të saktë pa e krahasuar.

const crypto = require('crypto');

async function init(pool) {
  // Kolona shtesë te bizneset (nese s'ekzistojne tashme) — per te dalluar anetaret e ekipit
  // nga bizneset "reale" (klientet kryesore te Imyr)
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS eshte_anetar_ekipi BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pronari_biznes_id INTEGER REFERENCES bizneset(id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ekipi_role_shabllonet (
      id SERIAL PRIMARY KEY,
      biznes_id INTEGER NOT NULL REFERENCES bizneset(id),
      emri TEXT NOT NULL,
      leje JSONB NOT NULL DEFAULT '{}',
      eshte_pronesi BOOLEAN DEFAULT false,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ekipi_anetaret (
      id SERIAL PRIMARY KEY,
      biznes_id INTEGER NOT NULL REFERENCES bizneset(id),
      anetar_biznes_id INTEGER REFERENCES bizneset(id),
      email TEXT NOT NULL,
      emri TEXT,
      eshte_pronar BOOLEAN DEFAULT false,
      rol_id INTEGER REFERENCES ekipi_role_shabllonet(id),
      leje_personalizuara JSONB,
      statusi TEXT NOT NULL DEFAULT 'ftese_ne_pritje',
      krijuar_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(biznes_id, email)
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ekipi_ftesat (
      id SERIAL PRIMARY KEY,
      biznes_id INTEGER NOT NULL REFERENCES bizneset(id),
      email TEXT NOT NULL,
      rol_id INTEGER REFERENCES ekipi_role_shabllonet(id),
      kodi TEXT NOT NULL UNIQUE,
      skadon_at TIMESTAMPTZ NOT NULL,
      pranuar BOOLEAN DEFAULT false,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ekipi_aktiviteti (
      id SERIAL PRIMARY KEY,
      biznes_id INTEGER NOT NULL REFERENCES bizneset(id),
      aktori_email TEXT,
      veprimi TEXT NOT NULL,
      detaje JSONB,
      krijuar_at TIMESTAMPTZ DEFAULT now()
    )`);

  // Rolet standarde (shabllone) — krijohen 1 here per biznes, nese s'ekzistojne
  const LEJE_ADMIN = { creative_krijo: true, creative_shiko: true, snippet_ndrysho: true,
    faturimi_shiko: true, ekipi_menaxho: true, analytics_shiko: true, konvertimet_shiko: true };
  const LEJE_EDITOR = { creative_krijo: true, creative_shiko: true, snippet_ndrysho: false,
    faturimi_shiko: false, ekipi_menaxho: false, analytics_shiko: true, konvertimet_shiko: true };
  const LEJE_LEXUES = { creative_krijo: false, creative_shiko: true, snippet_ndrysho: false,
    faturimi_shiko: false, ekipi_menaxho: false, analytics_shiko: true, konvertimet_shiko: false };

  await pool.query(`
    INSERT INTO ekipi_role_shabllonet (biznes_id, emri, leje)
    SELECT b.id, r.emri, r.leje::jsonb
    FROM bizneset b
    CROSS JOIN (VALUES
      ('Admin', $1::text),
      ('Editor', $2::text),
      ('Lexues', $3::text)
    ) AS r(emri, leje)
    WHERE NOT EXISTS (
      SELECT 1 FROM ekipi_role_shabllonet ers WHERE ers.biznes_id = b.id AND ers.emri = r.emri
    )
  `, [JSON.stringify(LEJE_ADMIN), JSON.stringify(LEJE_EDITOR), JSON.stringify(LEJE_LEXUES)]);
}

async function logAktivitet(pool, biznesId, aktorEmail, veprimi, detaje) {
  try {
    await pool.query(
      `INSERT INTO ekipi_aktiviteti (biznes_id, aktori_email, veprimi, detaje) VALUES ($1,$2,$3,$4)`,
      [biznesId, aktorEmail, veprimi, JSON.stringify(detaje || {})]);
  } catch (e) { console.error('log aktiviteti:', e.message); }
}

module.exports = function (app, pool, iLoguar, resendKlient) {
  init(pool).catch(e => console.error('ekipi init:', e.message));

  // ═══ ANËTARËT ═══
  app.get('/api/ekipi/anetaret', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT ea.id, ea.email, ea.emri, ea.eshte_pronar, ea.statusi, ea.krijuar_at,
                ers.emri AS roli
         FROM ekipi_anetaret ea
         LEFT JOIN ekipi_role_shabllonet ers ON ers.id = ea.rol_id
         WHERE ea.biznes_id = $1
         ORDER BY ea.eshte_pronar DESC, ea.krijuar_at ASC`,
        [req.biznesId]);
      res.json({ anetaret: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/ekipi/anetaret/:id/pezullo', iLoguar, async (req, res) => {
    try {
      await pool.query(
        `UPDATE ekipi_anetaret SET statusi='pezulluar' WHERE id=$1 AND biznes_id=$2 AND eshte_pronar=false`,
        [req.params.id, req.biznesId]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'pezullo_anetar', { anetar_id: req.params.id });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/ekipi/anetaret/:id/aktivizo', iLoguar, async (req, res) => {
    try {
      await pool.query(
        `UPDATE ekipi_anetaret SET statusi='aktiv' WHERE id=$1 AND biznes_id=$2`,
        [req.params.id, req.biznesId]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'aktivizo_anetar', { anetar_id: req.params.id });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/ekipi/anetaret/:id', iLoguar, async (req, res) => {
    try {
      await pool.query(
        `DELETE FROM ekipi_anetaret WHERE id=$1 AND biznes_id=$2 AND eshte_pronar=false`,
        [req.params.id, req.biznesId]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'hiq_anetar', { anetar_id: req.params.id });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ ROLET (shabllone + leje) ═══
  app.get('/api/ekipi/rolet', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, emri, leje FROM ekipi_role_shabllonet WHERE biznes_id=$1 ORDER BY id`,
        [req.biznesId]);
      res.json({ rolet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/ekipi/rolet', iLoguar, async (req, res) => {
    const { emri, leje } = req.body || {};
    if (!emri) return res.status(400).json({ error: 'Emri i rolit është i detyrueshëm.' });
    try {
      const r = await pool.query(
        `INSERT INTO ekipi_role_shabllonet (biznes_id, emri, leje) VALUES ($1,$2,$3) RETURNING id`,
        [req.biznesId, emri, JSON.stringify(leje || {})]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'krijo_rol', { emri });
      res.json({ ok: true, id: r.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/ekipi/rolet/:id', iLoguar, async (req, res) => {
    const { leje } = req.body || {};
    try {
      await pool.query(
        `UPDATE ekipi_role_shabllonet SET leje=$1 WHERE id=$2 AND biznes_id=$3`,
        [JSON.stringify(leje || {}), req.params.id, req.biznesId]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'ndrysho_leje_rol', { rol_id: req.params.id });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Cakto rol (dhe/ose leje te personalizuara) te nje anetar specifik
  app.post('/api/ekipi/anetaret/:id/rol', iLoguar, async (req, res) => {
    const { rol_id, leje_personalizuara } = req.body || {};
    try {
      await pool.query(
        `UPDATE ekipi_anetaret SET rol_id=$1, leje_personalizuara=$2 WHERE id=$3 AND biznes_id=$4`,
        [rol_id || null, leje_personalizuara ? JSON.stringify(leje_personalizuara) : null, req.params.id, req.biznesId]);
      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'cakto_rol', { anetar_id: req.params.id, rol_id });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ FTESAT ═══
  app.get('/api/ekipi/ftesat', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT f.id, f.email, f.skadon_at, f.pranuar, f.krijuar_at, ers.emri AS roli
         FROM ekipi_ftesat f LEFT JOIN ekipi_role_shabllonet ers ON ers.id = f.rol_id
         WHERE f.biznes_id=$1 ORDER BY f.krijuar_at DESC`,
        [req.biznesId]);
      res.json({ ftesat: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/ekipi/ftesat/dergo', iLoguar, async (req, res) => {
    const { email, rol_id } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email-i është i detyrueshëm.' });
    try {
      const kodi = crypto.randomBytes(24).toString('hex');
      const skadonAt = new Date(Date.now() + 72 * 3600 * 1000); // 72 ore

      await pool.query(
        `INSERT INTO ekipi_ftesat (biznes_id, email, rol_id, kodi, skadon_at) VALUES ($1,$2,$3,$4,$5)`,
        [req.biznesId, email, rol_id || null, kodi, skadonAt]);

      await pool.query(
        `INSERT INTO ekipi_anetaret (biznes_id, email, rol_id, statusi) VALUES ($1,$2,$3,'ftese_ne_pritje')
         ON CONFLICT (biznes_id, email) DO UPDATE SET rol_id=$3, statusi='ftese_ne_pritje'`,
        [req.biznesId, email, rol_id || null]);

      // Dergimi real i email-it — kerkon RESEND_KEY te konfiguruar dhe resendKlient te dhene nga server.js.
      // Nese s'e ke ende Resend te lidhur, kjo pjese duhet plotesuar; struktura e te dhenave megjithate eshte gati.
      if (resendKlient) {
        try {
          await resendKlient.emails.send({
            from: process.env.EKIPI_EMAIL_FROM || 'Imyr <onboarding@resend.dev>',
            to: email,
            subject: 'Je ftuar në ekipin e PronexusAI',
            html: `<p>Je ftuar të bashkohesh. <a href="https://phronexusai.com/prano-ftesen?kodi=${kodi}">Kliko këtu për të pranuar</a> (skadon në 72 orë).</p>`
          });
        } catch (e) { console.error('Dergimi i email-it deshtoi:', e.message); }
      }

      await logAktivitet(pool, req.biznesId, req.bizniEmail, 'dergo_ftese', { email });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/ekipi/ftesat/:id/anullo', iLoguar, async (req, res) => {
    try {
      const f = await pool.query(`SELECT email FROM ekipi_ftesat WHERE id=$1 AND biznes_id=$2`, [req.params.id, req.biznesId]);
      await pool.query(`DELETE FROM ekipi_ftesat WHERE id=$1 AND biznes_id=$2`, [req.params.id, req.biznesId]);
      if (f.rows[0]) {
        await pool.query(`DELETE FROM ekipi_anetaret WHERE biznes_id=$1 AND email=$2 AND statusi='ftese_ne_pritje'`,
          [req.biznesId, f.rows[0].email]);
      }
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Pranimi i ftesës — publik (s'kërkon iLoguar, vetë personi i ftuar s'ka ende llogari)
  app.post('/api/ekipi/ftesat/prano', async (req, res) => {
    const { kodi, fjalekalimi, emri } = req.body || {};
    try {
      const f = await pool.query(
        `SELECT * FROM ekipi_ftesat WHERE kodi=$1 AND pranuar=false AND skadon_at > now()`, [kodi]);
      if (!f.rows[0]) return res.status(400).json({ error: 'Ftesa është e pavlefshme ose ka skaduar.' });
      const ftesa = f.rows[0];

      // KUJDES: rreshti poshte supozon strukturen e bizneset (email/fjalekalim_hash) —
      // duhet krahasuar/pershtatur me funksionin real te regjistrimit ne auth.js.
      const bcrypt = require('bcrypt');
      const hashi = await bcrypt.hash(fjalekalimi, 10);
      const anetarBiznes = await pool.query(
        `INSERT INTO bizneset (email, fjalekalimi_hash, emri, eshte_anetar_ekipi, pronari_biznes_id)
         VALUES ($1,$2,$3,true,$4) RETURNING id`,
        [ftesa.email, hashi, emri || '', ftesa.biznes_id]);

      await pool.query(
        `UPDATE ekipi_anetaret SET statusi='aktiv', anetar_biznes_id=$1, emri=$2 WHERE biznes_id=$3 AND email=$4`,
        [anetarBiznes.rows[0].id, emri || '', ftesa.biznes_id, ftesa.email]);
      await pool.query(`UPDATE ekipi_ftesat SET pranuar=true WHERE id=$1`, [ftesa.id]);
      await logAktivitet(pool, ftesa.biznes_id, ftesa.email, 'pranoi_ftesen', {});

      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ REGJISTRI I AKTIVITETIT ═══
  app.get('/api/ekipi/aktiviteti', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, aktori_email, veprimi, detaje, krijuar_at FROM ekipi_aktiviteti
         WHERE biznes_id=$1 ORDER BY krijuar_at DESC LIMIT 100`,
        [req.biznesId]);
      res.json({ aktiviteti: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};

module.exports.init = init;
