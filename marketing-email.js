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
// Nxjerr emrin e "pastruar" te platformes nga domain-i: ashbyhq.com -> Ashbyhq
function emriPlatformesNgaDomain(domain) {
  if (!domain) return '';
  const pjesa = String(domain).split('.')[0] || '';
  return pjesa.charAt(0).toUpperCase() + pjesa.slice(1);
}

// Kthen "sasia" orë (format "HH:MM"), të shpërndara njëtrajtësisht brenda 24 orëve,
// me pak rastësi brenda secilit brez, që të mos duket krejt robotike (00:00, 08:00, 16:00 saktë).
// minutaFillimit: nga cila minute e dites te filloje shperndarja (0 = mesnate, normale per data te ardhshme;
// per "sot", kalohet minuta aktuale, qe te mos gjenerohen ore qe kane kaluar tashme).
function shperndajNe24Ore(sasia, minutaFillimit) {
  minutaFillimit = minutaFillimit || 0;
  const minutaGjithsej = (24 * 60) - minutaFillimit;
  if (minutaGjithsej <= 0) return []; // dita ka mbaruar plotesisht, s'ka me hapesire sot
  const gjeresiaBrezit = minutaGjithsej / sasia;
  const oret = [];
  for (let i = 0; i < sasia; i++) {
    const fillimiBrezit = minutaFillimit + i * gjeresiaBrezit;
    const minutaERastesishme = fillimiBrezit + Math.floor(Math.random() * gjeresiaBrezit);
    const h = Math.floor(minutaERastesishme / 60) % 24;
    const m = Math.floor(minutaERastesishme % 60);
    oret.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
  }
  return oret;
}

module.exports = function (app, pool, iAdmin) {

  // ═══ Migrime ═══
  (async () => {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_kontaktet (
        id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, domain TEXT, emri TEXT, kategoria TEXT,
        derguar BOOLEAN NOT NULL DEFAULT false, derguar_nga TEXT, derguar_at TIMESTAMPTZ,
        derguar_sasi INT NOT NULL DEFAULT 0,
        importuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`ALTER TABLE marketing_kontaktet ADD COLUMN IF NOT EXISTS derguar_sasi INT NOT NULL DEFAULT 0`);
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

    // Para-ngarko 1 shabllon te dizajnuar, gati per t'u perdorur — vetem 1 here,
    // kur ende s'ekziston asnje shabllon me kete emer (nuk perseritet ne restart-e te tjera).
    try {
      const ekziston = await pool.query("SELECT 1 FROM marketing_shabllonet WHERE emri=$1", ['PyjamaHR stil - profesional']);
      if (!ekziston.rows.length) {
        await pool.query(
          'INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3)',
          ['PyjamaHR stil - profesional', "Quick question about {platforma}'s SaaS growth", '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;">\n<tr><td align="center" style="padding:32px 16px;">\n<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">\n\n<!-- Header band -->\n<tr><td style="background:#0f1729;padding:22px 32px;">\n<table role="presentation" cellpadding="0" cellspacing="0"><tr>\n<td style="width:28px;height:28px;background:#3b6ef0;border-radius:7px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-align:center;line-height:28px;">P</td>\n<td style="padding-left:10px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">PhronexusAI</td>\n</tr></table>\n</td></tr>\n\n<!-- Opening -->\n<tr><td style="padding:34px 32px 6px;">\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.4;font-weight:600;color:#0f1729;">\nHow is {platforma} getting in front of new SaaS buyers right now?\n</p>\n</td></tr>\n\n<tr><td style="padding:14px 32px 26px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nMostly Google or Facebook ads? If so, you already know the problem &mdash; those platforms make you pay full price while their algorithm is still figuring out who your customer even is.\n</td></tr>\n\n<!-- Comparison -->\n<tr><td style="padding:0 32px 28px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n<tr>\n<td width="48%" valign="top" style="background:#f4f5f7;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#8891a0;">Paid ads</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#5b6472;">Pay full price while the algorithm learns. Budget burns before results show up.</p>\n</td>\n<td width="4%"></td>\n<td width="48%" valign="top" style="background:#eef3ff;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#3b6ef0;">PhronexusAI</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1c2128;">Swap exposure with other SaaS tools. No learning phase eating your budget first.</p>\n</td>\n</tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 28px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nSetup takes about 2 minutes &mdash; give us your website URL, and category matching, ad creative, and tracking are handled automatically.\n</td></tr>\n\n<!-- Benefit badges -->\n<tr><td style="padding:0 32px 30px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">90 days completely free, no plan required</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Priority matching for your first 7 days &mdash; real exposure from day one</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Lock in $7/month, forever &mdash; the price rises for everyone who joins later</td>\n</tr>\n\n</table>\n</td></tr>\n\n<!-- CTA panel -->\n<tr><td style="padding:0 32px 32px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border-radius:12px;">\n<tr><td align="center" style="padding:26px 24px;">\n<p style="margin:0 0 16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;color:#3d4451;">Worth 2 minutes to see what it looks like for {platforma}?</p>\n<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3b6ef0;border-radius:7px;">\n<a href="https://phronexusai.com" style="display:inline-block;padding:13px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Try it free</a>\n</td></tr></table>\n</td></tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c2128;">\nEduard<br>PhronexusAI\n</td></tr>\n\n<tr><td style="border-top:1px solid #edeef1;padding:18px 32px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9aa4b2;">\nPhronexusAI &middot; phronexusai.com\n</td></tr>\n\n</table>\n</td></tr>\n</table>\n']
        );
        console.log('marketing-email: shabllon fillestar u para-ngarkua.');
      }
    } catch (e) { console.error('marketing-email seed shablloni:', e.message); }
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

  app.get('/api/admin/marketing/debug', iAdmin, async (req, res) => {
    try {
      const r = await pool.query('SELECT id, email, kategoria FROM marketing_kontaktet ORDER BY importuar_at DESC LIMIT 10');
      const rDistinct = await pool.query('SELECT DISTINCT kategoria, COUNT(*)::int AS n FROM marketing_kontaktet GROUP BY kategoria');
      res.json({ dhjeteRreshtatEFundit: r.rows, kategoriteDistinkte: rDistinct.rows });
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
        ? await pool.query('SELECT id, email, domain, emri, derguar, derguar_sasi FROM marketing_kontaktet WHERE kategoria=$1 ORDER BY emri ASC', [kategoria])
        : await pool.query('SELECT id, email, domain, emri, derguar, derguar_sasi FROM marketing_kontaktet ORDER BY emri ASC');
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
      // Merr daten/oren aktuale sipas Tiranes (1 here, perdoret per te gjithe slot-et e ketij krijimi).
      const tani = await klient.query("SELECT (now() AT TIME ZONE 'Europe/Tirane')::date AS data, EXTRACT(HOUR FROM (now() AT TIME ZONE 'Europe/Tirane'))::int * 60 + EXTRACT(MINUTE FROM (now() AT TIME ZONE 'Europe/Tirane'))::int AS minuta");
      const dataSotme = tani.rows[0].data.toISOString().slice(0, 10);
      const minutaTani = tani.rows[0].minuta;

      for (const s of slots) {
        if (!s.data || !s.ora || !s.sasia) continue;
        if (s.sasia > 1) {
          // Nese data e zgjedhur eshte SOT, shperndaj vetem ne oret e MBETURA (jo qe nga mesnata),
          // qe te mos gjenerohen ore qe tashme kane kaluar per kete dite.
          const minutaFillimit = (s.data === dataSotme) ? minutaTani : 0;
          const oret = shperndajNe24Ore(s.sasia, minutaFillimit);
          for (const ora of oret) {
            await klient.query('INSERT INTO marketing_fushata_slots (fushata_id, data, ora, sasia) VALUES ($1,$2,$3,1)', [fushataId, s.data, ora]);
          }
        } else {
          await klient.query('INSERT INTO marketing_fushata_slots (fushata_id, data, ora, sasia) VALUES ($1,$2,$3,$4)', [fushataId, s.data, s.ora, s.sasia]);
        }
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
  let poPunon = false;
  async function kontrolloDheDergoFushatat() {
    if (poPunon) return; // nje ekzekutim tashme ne progres, mos fillo nje te dyte mbi te
    poPunon = true;
    const llog = ndertoTransporteret();
    try {
      const slotsGati = await pool.query(`
        SELECT sl.id AS slot_id, sl.fushata_id, sl.sasia, sl.perdorur, f.llogaria, f.shabllon_id, f.statusi
        FROM marketing_fushata_slots sl
        JOIN marketing_fushatat f ON f.id = sl.fushata_id
        WHERE f.statusi = 'aktiv' AND sl.perdorur < sl.sasia
          AND ((sl.data + sl.ora) AT TIME ZONE 'Europe/Tirane') <= now()
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
          const html = htmlBazë.replace(/\{emri\}/g, escHtml(kont.emri || kont.domain)).replace(/\{domain\}/g, escHtml(kont.domain || '')).replace(/\{platforma\}/g, escHtml(emriPlatformesNgaDomain(kont.domain)));
          try {
            await transporter.sendMail({ from: '"PhronexusAI" <' + slot.llogaria + '>', to: kont.email, subject: subjekti, html });
            await pool.query('UPDATE marketing_fushata_kontakte SET derguar=true, derguar_at=now() WHERE id=$1', [kont.fk_id]);
            await pool.query('UPDATE marketing_kontaktet SET derguar=true, derguar_nga=$1, derguar_at=now(), derguar_sasi=derguar_sasi+1 WHERE id=$2', [slot.llogaria, kont.kontakt_id]);
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
    finally { poPunon = false; }
  }
  setInterval(kontrolloDheDergoFushatat, 60 * 1000);
  kontrolloDheDergoFushatat();
};
