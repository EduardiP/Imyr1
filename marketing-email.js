// marketing-email.js — Dergim email-esh MARKETING (outreach i ftohte) te bizneset e gjetura
// nga projekti i vecante "biznes-finder". Skedar i vecante (backend); UI-ja tani jeton
// brenda admin.html, si seksioni "Marketingu" (jo me faqe e ndare /admin/marketing).
//
// Variabla mjedisi (Railway -> Variables):
//   GMAIL_USER, GMAIL_APP_PASSWORD          (RIPERDOR ato qe TASHME ekzistojne — info@phronexusai.com)
//   MKT_EMAIL_2_USER, MKT_EMAIL_2_PASS      (i ri)
//   MKT_EMAIL_3_USER, MKT_EMAIL_3_PASS      (i ri)
//   BIZNES_FINDER_URL                       (p.sh. https://emailet-production.up.railway.app)

const nodemailer = require('nodemailer');

const LLOGARITE_KONFIG = [
  { user: 'GMAIL_USER', pass: 'GMAIL_APP_PASSWORD' },
  { user: 'MKT_EMAIL_2_USER', pass: 'MKT_EMAIL_2_PASS' },
  { user: 'MKT_EMAIL_3_USER', pass: 'MKT_EMAIL_3_PASS' }
];
const transporteret = {}; // { [email]: transporter }
function ndertoTransporteret() {
  if (Object.keys(transporteret).length) return transporteret;
  for (const l of LLOGARITE_KONFIG) {
    const user = process.env[l.user], pass = process.env[l.pass];
    if (!user || !pass) continue;
    transporteret[user] = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user, pass },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
    });
  }
  return transporteret;
}
function listaLlogariveAktive() { return Object.keys(ndertoTransporteret()); }

function escHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = function (app, pool, iAdmin) {

  // ═══ Migrime ═══
  (async () => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_kontaktet (
        id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, domain TEXT, emri TEXT, kategoria TEXT,
        derguar BOOLEAN NOT NULL DEFAULT false, derguar_nga TEXT, derguar_at TIMESTAMPTZ,
        importuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_shabllonet (
        id SERIAL PRIMARY KEY, emri TEXT NOT NULL, subjekti TEXT NOT NULL, html TEXT NOT NULL,
        krijuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_fushatat (
        id SERIAL PRIMARY KEY, emri TEXT, llogaria TEXT NOT NULL, shabllon_id INT REFERENCES marketing_shabllonet(id),
        statusi TEXT NOT NULL DEFAULT 'aktiv', krijuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_fushata_kontakte (
        id SERIAL PRIMARY KEY, fushata_id INT NOT NULL REFERENCES marketing_fushatat(id) ON DELETE CASCADE,
        kontakt_id INT NOT NULL REFERENCES marketing_kontaktet(id), radha INT NOT NULL,
        derguar BOOLEAN NOT NULL DEFAULT false, derguar_at TIMESTAMPTZ
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_fushata_slots (
        id SERIAL PRIMARY KEY, fushata_id INT NOT NULL REFERENCES marketing_fushatat(id) ON DELETE CASCADE,
        data DATE NOT NULL, ora TIME NOT NULL, sasia INT NOT NULL, perdorur INT NOT NULL DEFAULT 0
      )`);
    } catch (e) { console.error('marketing-email migrim:', e.message); }
  })();

  // ═══ Sinkronizim automatik nga biznes-finder ═══
  app.post('/api/admin/marketing/sinkronizo', iAdmin, async (req, res) => {
    const burimi = process.env.BIZNES_FINDER_URL;
    if (!burimi) return res.status(500).json({ error: 'BIZNES_FINDER_URL s\'eshte konfiguruar.' });
    try {
      const r = await fetch(burimi.replace(/\/$/, '') + '/api/te-gjitha');
      if (!r.ok) return res.status(500).json({ error: 'biznes-finder ktheu ' + r.status });
      const d = await r.json();
      const rreshta = d.rows || [];
      let importuar = 0, dublikate = 0, pa_email = 0;
      for (const row of rreshta) {
        if (!row.email || !row.email.includes('@')) { pa_email++; continue; }
        const ins = await pool.query(
          'INSERT INTO marketing_kontaktet (email, domain, emri, kategoria) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET kategoria=COALESCE(marketing_kontaktet.kategoria, EXCLUDED.kategoria) RETURNING id',
          [row.email, row.domain, row.emri, row.kategoria || null]
        );
        if (ins.rows.length) importuar++; else dublikate++;
      }
      res.json({ importuar, dublikate, pa_email, gjithsejNeBurim: rreshta.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/admin/marketing/permbledhje', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT COUNT(*)::int AS gjithsej,
        COUNT(*) FILTER (WHERE derguar)::int AS dergu, COUNT(*) FILTER (WHERE NOT derguar)::int AS "paDergu"
        FROM marketing_kontaktet`);
      res.json({ ...r.rows[0], llogarite: listaLlogariveAktive() });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Llogarite disponueshme ═══
  app.get('/api/admin/marketing/llogarite', iAdmin, (req, res) => {
    res.json({ llogarite: listaLlogariveAktive() });
  });

  // ═══ Kategorite (nga kontaktet e importuara) ═══
  app.get('/api/admin/marketing/kategorite', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT kategoria, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE NOT derguar)::int AS "paDergu"
        FROM marketing_kontaktet WHERE kategoria IS NOT NULL GROUP BY kategoria ORDER BY kategoria ASC`);
      res.json({ kategorite: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Kontaktet e nje kategorie ═══
  app.get('/api/admin/marketing/kontaktet', iAdmin, async (req, res) => {
    try {
      const { kategoria } = req.query;
      const r = kategoria
        ? await pool.query('SELECT id, email, domain, emri, derguar FROM marketing_kontaktet WHERE kategoria=$1 ORDER BY emri ASC', [kategoria])
        : await pool.query('SELECT id, email, domain, emri, derguar FROM marketing_kontaktet ORDER BY emri ASC');
      res.json({ kontaktet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Shabllonet ═══
  app.get('/api/admin/marketing/shabllonet', iAdmin, async (req, res) => {
    try {
      const r = await pool.query('SELECT id, emri, subjekti FROM marketing_shabllonet ORDER BY krijuar_at DESC');
      res.json({ shabllonet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/marketing/shabllonet', iAdmin, async (req, res) => {
    const { emri, subjekti, html } = req.body || {};
    if (!emri || !subjekti || !html) return res.status(400).json({ error: 'Mungon emri, subjekti, ose permbajtja.' });
    try {
      const r = await pool.query('INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3) RETURNING id', [emri, subjekti, html]);
      res.json({ ok: true, id: r.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Krijo fushate (kontakte te selektuara + shabllon + orar) ═══
  app.post('/api/admin/marketing/fushata', iAdmin, async (req, res) => {
    const { emri, llogaria, shabllon_id, kontakt_ids, slots } = req.body || {};
    if (!llogaria) return res.status(400).json({ error: 'Zgjidh nje llogari derguesi.' });
    if (!shabllon_id) return res.status(400).json({ error: 'Zgjidh nje shabllon.' });
    if (!Array.isArray(kontakt_ids) || !kontakt_ids.length) return res.status(400).json({ error: 'Zgjidh te pakten 1 kontakt.' });
    if (!Array.isArray(slots) || !slots.length) return res.status(400).json({ error: 'Shto te pakten 1 date/ore ne orar.' });
    if (!listaLlogariveAktive().includes(llogaria)) return res.status(400).json({ error: 'Llogaria "' + llogaria + '" s\'eshte konfiguruar.' });
    const klient = await pool.connect();
    try {
      await klient.query('BEGIN');
      const f = await klient.query(
        'INSERT INTO marketing_fushatat (emri, llogaria, shabllon_id) VALUES ($1,$2,$3) RETURNING id',
        [emri || null, llogaria, shabllon_id]
      );
      const fushataId = f.rows[0].id;
      for (let i = 0; i < kontakt_ids.length; i++) {
        await klient.query('INSERT INTO marketing_fushata_kontakte (fushata_id, kontakt_id, radha) VALUES ($1,$2,$3)', [fushataId, kontakt_ids[i], i]);
      }
      for (const s of slots) {
        if (!s.data || !s.ora || !s.sasia) continue;
        await klient.query('INSERT INTO marketing_fushata_slots (fushata_id, data, ora, sasia) VALUES ($1,$2,$3,$4)', [fushataId, s.data, s.ora, s.sasia]);
      }
      await klient.query('COMMIT');
      res.json({ ok: true, fushata_id: fushataId });
    } catch (e) {
      await klient.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { klient.release(); }
  });

  // ═══ Lista e fushatave (per Analitiken) ═══
  app.get('/api/admin/marketing/fushatat', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT f.id, f.emri, f.llogaria, f.statusi, f.krijuar_at, s.emri AS shabllon_emri,
          COUNT(fk.id)::int AS gjithsej_kontakte,
          COUNT(fk.id) FILTER (WHERE fk.derguar)::int AS derguar_kontakte
        FROM marketing_fushatat f
        LEFT JOIN marketing_shabllonet s ON s.id = f.shabllon_id
        LEFT JOIN marketing_fushata_kontakte fk ON fk.fushata_id = f.id
        GROUP BY f.id, s.emri ORDER BY f.krijuar_at DESC`);
      res.json({ fushatat: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Motori i planifikuar — kontrollon cdo minute, dergon kur eshte koha ═══
  async function kontrolloDheDergoFushatat() {
    const llog = ndertoTransporteret();
    try {
      const slotsGati = await pool.query(`
        SELECT sl.id AS slot_id, sl.fushata_id, sl.sasia, sl.perdorur, f.llogaria, f.shabllon_id, f.statusi
        FROM marketing_fushata_slots sl
        JOIN marketing_fushatat f ON f.id = sl.fushata_id
        WHERE f.statusi = 'aktiv' AND sl.perdorur < sl.sasia
          AND (sl.data + sl.ora) <= now()
        ORDER BY sl.data ASC, sl.ora ASC`);

      for (const slot of slotsGati.rows) {
        const transporter = llog[slot.llogaria];
        if (!transporter) continue; // llogaria s'eshte me e konfiguruar, anashkalo ne heshtje
        const sasiaAkoma = slot.sasia - slot.perdorur;
        if (sasiaAkoma <= 0) continue;

        const sh = await pool.query('SELECT subjekti, html FROM marketing_shabllonet WHERE id=$1', [slot.shabllon_id]);
        if (!sh.rows.length) continue;
        const { subjekti, html: htmlBazë } = sh.rows[0];

        const teDerguar = await pool.query(`
          SELECT fk.id AS fk_id, k.id AS kontakt_id, k.email, k.emri, k.domain
          FROM marketing_fushata_kontakte fk JOIN marketing_kontaktet k ON k.id = fk.kontakt_id
          WHERE fk.fushata_id=$1 AND NOT fk.derguar ORDER BY fk.radha ASC LIMIT $2`,
          [slot.fushata_id, sasiaAkoma]);

        for (const kont of teDerguar.rows) {
          const html = htmlBazë.replace(/\{emri\}/g, escHtml(kont.emri || kont.domain)).replace(/\{domain\}/g, escHtml(kont.domain || ''));
          try {
            await transporter.sendMail({ from: '"PhronexusAI" <' + slot.llogaria + '>', to: kont.email, subject: subjekti, html });
            await pool.query('UPDATE marketing_fushata_kontakte SET derguar=true, derguar_at=now() WHERE id=$1', [kont.fk_id]);
            await pool.query('UPDATE marketing_kontaktet SET derguar=true, derguar_nga=$1, derguar_at=now() WHERE id=$2', [slot.llogaria, kont.kontakt_id]);
            await pool.query('UPDATE marketing_fushata_slots SET perdorur = perdorur + 1 WHERE id=$1', [slot.slot_id]);
          } catch (e) { console.error('marketing dergim deshtoi:', kont.email, e.message); }
        }

        // Nese s'ka me kontakte pa dergu fare ne kete fushate, e shenon te perfunduar.
        const mbetur = await pool.query('SELECT COUNT(*)::int AS n FROM marketing_fushata_kontakte WHERE fushata_id=$1 AND NOT derguar', [slot.fushata_id]);
        if (mbetur.rows[0].n === 0) {
          await pool.query(`UPDATE marketing_fushatat SET statusi='perfunduar' WHERE id=$1`, [slot.fushata_id]);
        }
      }
    } catch (e) { console.error('kontrolloDheDergoFushatat:', e.message); }
  }
  setInterval(kontrolloDheDergoFushatat, 60 * 1000);
  kontrolloDheDergoFushatat();
};
