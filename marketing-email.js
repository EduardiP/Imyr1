// marketing-email.js — Dergim email-esh MARKETING (outreach i ftohte) te bizneset e gjetura
// nga projekti i vecante "biznes-finder". Skedar i vecante (backend); UI-ja tani jeton
// brenda admin.html, si seksioni "Marketingu" (jo me faqe e ndare /admin/marketing).
//
// Variabla mjedisi (Railway -> Variables):
//   GMAIL_USER, GMAIL_APP_PASSWORD          (RIPERDOR ato qe TASHME ekzistojne — info@phronexusai.com)
//   MKT_EMAIL_2_USER, MKT_EMAIL_2_PASS      (i ri)
//   MKT_EMAIL_3_USER, MKT_EMAIL_3_PASS      (i ri)
//   MKT_EMAIL_4_..., MKT_EMAIL_5_..., MKT_EMAIL_6_...  (USER dhe PASS; nje llogari aktivizohet vetem kur ka te dyja)
//   BIZNES_FINDER_URL                       (p.sh. https://emailet-production.up.railway.app)

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const LLOGARITE_KONFIG = [
  { user: 'GMAIL_USER', pass: 'GMAIL_APP_PASSWORD' },
  { user: 'MKT_EMAIL_2_USER', pass: 'MKT_EMAIL_2_PASS' },
  { user: 'MKT_EMAIL_3_USER', pass: 'MKT_EMAIL_3_PASS' },
  { user: 'MKT_EMAIL_4_USER', pass: 'MKT_EMAIL_4_PASS' },
  { user: 'MKT_EMAIL_5_USER', pass: 'MKT_EMAIL_5_PASS' },
  { user: 'MKT_EMAIL_6_USER', pass: 'MKT_EMAIL_6_PASS' }
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

// Per testet e vendosjes (p.sh. InboxIssue): nese ne Railway ekziston MKT_TEST_KODI, nje rresht i vogel "ref: KODI" shtohet ne fund
// te cdo emaili qe dergohet. Pa ate variabel nuk ndryshon asgje. HIQE variablen pas testit.
function rreshtiKodiTestit() {
  const k = String(process.env.MKT_TEST_KODI || '').trim();
  return /^[A-Za-z0-9_.: -]{4,80}$/.test(k) ? '\n<p style="color:#94a3b8;font-size:10px;">ref: ' + k + '</p>' : '';
}

// ═══ Gjurmim (i FIKUR si paracaktim) ═══
// Railway -> Variables: MKT_GJURMIM_HAPJE=1 shton nje piksel te padukshem; MKT_GJURMIM_KLIKIME=1 e kalon lidhjen e faqes
// (phronexusai.com) neper serverin tend. Pa to, email-et dalin saktesisht si me pare (vetem rregjistrohet dergimi).
const BAZA_PUBLIKE = 'https://phronexusai.com';
function gjurmimHapjeNdezur() { return process.env.MKT_GJURMIM_HAPJE === '1'; }
function gjurmimKlikimeNdezur() { return process.env.MKT_GJURMIM_KLIKIME === '1'; }
function krijoToken() { return crypto.randomBytes(12).toString('hex'); } // 24 shkronja hex, i pavlefte per t'u hamendesuar
function pergatitHtmlPerDergim(html, token) {
  let h = html;
  if (gjurmimKlikimeNdezur()) {
    // Vetem lidhjet e kesaj faqeje; Unsubscribe mbetet i paprekur. Destinacioni ndertohet gjithmone mbi phronexusai.com (pa "open redirect").
    h = h.replace(/href="https:\/\/phronexusai\.com(\/[^"#]*)?(#[^"]*)?"/g, (m, shtegu) => {
      const p = (shtegu || '/').replace(/&amp;/g, '&');
      if (p.indexOf('/marketing-unsubscribe') === 0 || p.indexOf('/m/') === 0) return m;
      return 'href="' + BAZA_PUBLIKE + '/m/c/' + token + '?p=' + encodeURIComponent(p) + '"';
    });
  }
  h = h + rreshtiKodiTestit();
  if (gjurmimHapjeNdezur()) h += '\n<img src="' + BAZA_PUBLIKE + '/m/o/' + token + '.gif" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;opacity:0;">';
  return h;
}
const GIF_1X1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

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
// Shndërron HTML-në e thjeshtë të shabllonëve tanë në tekst të rrafshët — kërkohet nga
// linku i Gmail-it ("body="), i cili pranon VETËM tekst, jo HTML.
function htmlNeTekst(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '·').replace(/&mdash;/g, '—').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


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
  // Regjistron cdo dergim (sukses ose deshtim). Nje gabim ketu NUK e ndalon kurre dergimin.
  async function regjistroDergimin(r) {
    try {
      await pool.query(
        'INSERT INTO marketing_dergimet (token, kontakt_id, email, domain, kategoria, shabllon_id, shabllon_emri, llogaria, subjekti, fushata_id, statusi, gabimi) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [r.token, r.kontakt_id || null, r.email, r.domain || null, r.kategoria || null, r.shabllon_id || null, r.shabllon_emri || null, r.llogaria || null, r.subjekti || null, r.fushata_id || null, r.statusi, r.gabimi ? String(r.gabimi).slice(0, 500) : null]);
    } catch (e) { console.error('marketing_dergimet:', e.message); }
  }

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
      await pool.query(`ALTER TABLE marketing_kontaktet ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT false`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_shabllonet (
        id SERIAL PRIMARY KEY, emri TEXT NOT NULL, subjekti TEXT NOT NULL, html TEXT NOT NULL,
        krijuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      // Perditeso permbajtjen e shabllonit "Biznes online - outreach" ne versionin e ri, te thjeshtuar
      // (struktura shume me e thjeshte, njesoj si email.js qe funksionon) — rinovohet cdo rinisje.
      await pool.query(
        "UPDATE marketing_shabllonet SET html=$1, subjekti=$2 WHERE emri='Biznes online - outreach'",
        ['<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;">\n<tr><td align="center" style="padding:32px 16px;">\n<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">\n\n<tr><td style="background:#0f1729;padding:22px 32px;">\n<table role="presentation" cellpadding="0" cellspacing="0"><tr>\n<td style="width:28px;height:28px;"><img src="https://phronexusai.com/favicon-192.png" width="28" height="28" alt="PhronexusAI" style="display:block;border-radius:7px;"></td>\n<td style="padding-left:10px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">PhronexusAI</td>\n</tr></table>\n</td></tr>\n\n<tr><td style="padding:34px 32px 6px;">\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.4;font-weight:600;color:#0f1729;">\nHow is {platforma} getting in front of new SaaS buyers right now?\n</p>\n</td></tr>\n\n<tr><td style="padding:14px 32px 26px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nMostly Google or Facebook ads? If so, you already know the problem &mdash; those platforms make you pay full price while their algorithm is still figuring out who your customer even is.\n</td></tr>\n\n<tr><td style="padding:0 32px 28px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n<tr>\n<td width="48%" valign="top" style="background:#f4f5f7;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#8891a0;">Paid ads</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#5b6472;">Pay full price while the algorithm learns. Budget burns before results show up.</p>\n</td>\n<td width="4%"></td>\n<td width="48%" valign="top" style="background:#eef3ff;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#3b6ef0;">PhronexusAI</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1c2128;">Swap exposure with other SaaS tools. No learning phase eating your budget first.</p>\n</td>\n</tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 28px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nSetup takes about 2 minutes &mdash; give us your website URL, and category matching, ad creative, and tracking are handled automatically.\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">90 days completely free, no plan required</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Priority matching for your first 7 days &mdash; real exposure from day one</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Lock in $7/month, forever &mdash; the price rises for everyone who joins later</td>\n</tr>\n\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 32px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border-radius:12px;">\n<tr><td align="center" style="padding:26px 24px;">\n<p style="margin:0 0 16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;color:#3d4451;">Worth 2 minutes to see what it looks like for {platforma}?</p>\n<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3b6ef0;border-radius:7px;">\n<a href="https://phronexusai.com" style="display:inline-block;padding:13px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">See how it works</a>\n</td></tr></table>\n</td></tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c2128;">\nEduard<br>PhronexusAI\n</td></tr>\n\n<tr><td style="border-top:1px solid #edeef1;padding:18px 32px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9aa4b2;">\nPhronexusAI &middot; phronexusai.com &middot; <a href="{unsubscribe_link}" style="color:#9aa4b2;">Unsubscribe</a>\n</td></tr>\n\n</table>\n</td></tr>\n</table>\n', 'No marketing budget for {platforma}? This is for you']
      );
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
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_log (
        id SERIAL PRIMARY KEY, fushata_id INT, email TEXT, sukses BOOLEAN NOT NULL,
        detaje TEXT, krijuar_at TIMESTAMPTZ DEFAULT now()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS marketing_dergimet (
        id SERIAL PRIMARY KEY, token TEXT UNIQUE NOT NULL, kontakt_id INT, email TEXT NOT NULL, domain TEXT, kategoria TEXT,
        shabllon_id INT, shabllon_emri TEXT, llogaria TEXT, subjekti TEXT, fushata_id INT,
        statusi TEXT NOT NULL, gabimi TEXT, derguar_at TIMESTAMPTZ DEFAULT now(),
        hapur_at TIMESTAMPTZ, hapje INT NOT NULL DEFAULT 0, hapur_ua TEXT, klikuar_at TIMESTAMPTZ, klikime INT NOT NULL DEFAULT 0
      )`);
      await pool.query('CREATE INDEX IF NOT EXISTS marketing_dergimet_koha ON marketing_dergimet (derguar_at DESC)');
    } catch (e) { console.error('marketing-email migrim:', e.message); }

    // Para-ngarko 1 shabllon te dizajnuar, gati per t'u perdorur — vetem 1 here,
    // kur ende s'ekziston asnje shabllon me kete emer (nuk perseritet ne restart-e te tjera).
    try {
      const ekziston = await pool.query("SELECT 1 FROM marketing_shabllonet WHERE emri=$1", ['PyjamaHR stil - profesional']);
      if (!ekziston.rows.length) {
        await pool.query(
          'INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3)',
          ['PyjamaHR stil - profesional', "Quick question about {platforma}'s SaaS growth", '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;">\n<tr><td align="center" style="padding:32px 16px;">\n<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">\n\n<!-- Header band -->\n<tr><td style="background:#0f1729;padding:22px 32px;">\n<table role="presentation" cellpadding="0" cellspacing="0"><tr>\n<td style="width:28px;height:28px;background:#3b6ef0;border-radius:7px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-align:center;line-height:28px;">P</td>\n<td style="padding-left:10px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">PhronexusAI</td>\n</tr></table>\n</td></tr>\n\n<!-- Opening -->\n<tr><td style="padding:34px 32px 6px;">\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.4;font-weight:600;color:#0f1729;">\nHow is {platforma} getting in front of new SaaS buyers right now?\n</p>\n</td></tr>\n\n<tr><td style="padding:14px 32px 26px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nMostly Google or Facebook ads? If so, you already know the problem &mdash; those platforms make you pay full price while their algorithm is still figuring out who your customer even is.\n</td></tr>\n\n<!-- Comparison -->\n<tr><td style="padding:0 32px 28px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n<tr>\n<td width="48%" valign="top" style="background:#f4f5f7;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#8891a0;">Paid ads</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#5b6472;">Pay full price while the algorithm learns. Budget burns before results show up.</p>\n</td>\n<td width="4%"></td>\n<td width="48%" valign="top" style="background:#eef3ff;border-radius:10px;padding:18px 16px;">\n<p style="margin:0 0 6px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#3b6ef0;">PhronexusAI</p>\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1c2128;">Swap exposure with other SaaS tools. No learning phase eating your budget first.</p>\n</td>\n</tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 28px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nSetup takes about 2 minutes &mdash; give us your website URL, and category matching, ad creative, and tracking are handled automatically.\n</td></tr>\n\n<!-- Benefit badges -->\n<tr><td style="padding:0 32px 30px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">90 days completely free, no plan required</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Priority matching for your first 7 days &mdash; real exposure from day one</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;">Lock in $7/month, forever &mdash; the price rises for everyone who joins later</td>\n</tr>\n\n</table>\n</td></tr>\n\n<!-- CTA panel -->\n<tr><td style="padding:0 32px 32px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border-radius:12px;">\n<tr><td align="center" style="padding:26px 24px;">\n<p style="margin:0 0 16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;color:#3d4451;">Worth 2 minutes to see what it looks like for {platforma}?</p>\n<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3b6ef0;border-radius:7px;">\n<a href="https://phronexusai.com" style="display:inline-block;padding:13px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Try it free</a>\n</td></tr></table>\n</td></tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c2128;">\nEduard<br>PhronexusAI\n</td></tr>\n\n<tr><td style="border-top:1px solid #edeef1;padding:18px 32px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9aa4b2;">\nPhronexusAI &middot; phronexusai.com &middot; <a href="{unsubscribe_link}" style="color:#9aa4b2;">Unsubscribe</a>\n</td></tr>\n\n</table>\n</td></tr>\n</table>\n']
        );
        console.log('marketing-email: shabllon fillestar u para-ngarkua.');
      }
    } catch (e) { console.error('marketing-email seed shablloni:', e.message); }

    // Shabllon i dyte, i para-ngarkuar — "Biznes online", subjekt i shkurter, i personalizuar.
    try {
      const ekziston2 = await pool.query("SELECT 1 FROM marketing_shabllonet WHERE emri=$1", ['Biznes online - outreach']);
      if (!ekziston2.rows.length) {
        await pool.query(
          'INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3)',
          ['Biznes online - outreach', 'No marketing budget for {platforma}? This is for you', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;">\n<tr><td align="center" style="padding:32px 16px;">\n<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">\n\n<tr><td style="background:#0f1729;padding:22px 32px;">\n<table role="presentation" cellpadding="0" cellspacing="0"><tr>\n<td style="width:28px;height:28px;"><img src="https://phronexusai.com/favicon-192.png" width="28" height="28" alt="PhronexusAI" style="display:block;border-radius:7px;"></td>\n<td style="padding-left:10px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">PhronexusAI</td>\n</tr></table>\n</td></tr>\n\n<tr><td style="padding:34px 32px 6px;">\n<p style="margin:0;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.4;font-weight:600;color:#0f1729;">\nIs your online business getting the exposure it deserves?\n</p>\n</td></tr>\n\n<tr><td style="padding:14px 32px 26px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3d4451;">\nPhronexusAI is a simple way for online businesses to promote each other. Your business gets shown to other companies\' visitors &mdash; and in return, you show a small number of complementary businesses to your own. Businesses helping bring customers to each other.\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:18px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;"><b>First 7 days:</b> free exposure, automatically &mdash; nothing to set up.</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;padding-bottom:18px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;"><b>First 90 days:</b> completely free, full access, no plan required.</td>\n</tr>\n\n<tr>\n<td width="32" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:22px;height:22px;background:#3b6ef0;border-radius:11px;font-family:-apple-system,Arial,sans-serif;font-size:13px;color:#ffffff;text-align:center;line-height:22px;">&#10003;</td></tr></table></td>\n<td style="padding-left:12px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#1c2128;"><b>Join within this window:</b> your lower monthly rate is locked in forever. Businesses joining later pay a higher rate, permanently.</td>\n</tr>\n\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 28px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;border-radius:10px;">\n<tr><td style="padding:18px 20px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3d4451;">\n<b style="color:#151a21;">To be clear about how this works:</b> we never show your direct competitors to your visitors, or you to theirs. Only complementary businesses, in different categories, are shown. The goal is simply helping non-competing businesses bring customers to each other.\n</td></tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 32px;">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border-radius:12px;">\n<tr><td align="center" style="padding:26px 24px;">\n<p style="margin:0 0 16px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;color:#3d4451;">Setup takes about 2 minutes &mdash; just your website URL.</p>\n<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3b6ef0;border-radius:7px;">\n<a href="https://phronexusai.com" style="display:inline-block;padding:13px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">See how it works</a>\n</td></tr></table>\n</td></tr>\n</table>\n</td></tr>\n\n<tr><td style="padding:0 32px 30px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c2128;">\nEduard Pepushaj<br>Founder, PhronexusAI\n</td></tr>\n\n<tr><td style="border-top:1px solid #edeef1;padding:18px 32px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9aa4b2;">\nPhronexusAI &middot; phronexusai.com &middot; <a href="{unsubscribe_link}" style="color:#9aa4b2;">Unsubscribe</a>\n</td></tr>\n\n</table>\n</td></tr>\n</table>\n']
        );
        console.log('marketing-email: shabllon i 2-te (Biznes online) u para-ngarkua.');
      }
    } catch (e) { console.error('marketing-email seed shablloni 2:', e.message); }

    // Shabllon i 3-te, i para-ngarkuar — permbajtje IDENTIKE me 7-ditesh-in e email.js (qe funksionon).
    try {
      const ekziston3 = await pool.query("SELECT 1 FROM marketing_shabllonet WHERE emri=$1", ['TEST - identik me 7-ditesh-in']);
      if (!ekziston3.rows.length) {
        await pool.query(
          'INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3)',
          ['TEST - identik me 7-ditesh-in', '90 days ends soon for new signups', '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">\n<p>Hi there,</p>\n<p>Quick heads-up: PhronexusAI is currently running an early-signup window.</p>\n<p>Join now, and you get 90 days completely free (plus 7 days of live traffic right away), then $7/month after — locked in for as long as you stay.</p>\n<p>Once this window closes, new signups only get a 14-day trial, and the rate becomes $20/month.</p>\n<p>Same idea either way: your business gets paired with complementary businesses (never competitors) so you show up in front of their visitors, and vice versa.</p>\n<p><a href="https://phronexusai.com" style="display:inline-block;background:#3b6ef0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Get started →</a></p>\n<p style="color:#94a3b8;font-size:12px;margin-top:28px;">PhronexusAI &middot; <a href="{unsubscribe_link}" style="color:#94a3b8;">Unsubscribe</a></p>\n</div>']
        );
        console.log('marketing-email: shabllon i 3-te (TEST 7-ditesh) u para-ngarkua.');
      }
    } catch (e) { console.error('marketing-email seed shablloni 3:', e.message); }

    // Shabllon i 4-t — "Dritarja e regjistrimit". Permbajtja perditesohet GJITHMONE (UPDATE i
    // pakushtezuar), qe ndryshimet e ardhshme te aplikohen gjithmone, pavaresisht nese rreshti ekziston tashme.
    try {
      await pool.query(
        "UPDATE marketing_shabllonet SET html=$1, subjekti=$2 WHERE emri='Dritarja e regjistrimit'",
        ['<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">\n<p>Hi there,</p>\n<p>Quick heads-up: the early window for PhronexusAI is wrapping up.</p>\n<p>Right now, joining gets you 90 days completely free, plus a lower rate locked in for as long as you stay. Once this window closes, the terms change for anyone signing up after.</p>\n<p>Same idea either way: your business gets paired with complementary businesses (never competitors), so you show up in front of their visitors, and vice versa.</p>\n<p><a href="https://phronexusai.com" style="display:inline-block;background:#3b6ef0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">See how it works</a></p>\n<p style="color:#94a3b8;font-size:12px;margin-top:28px;">PhronexusAI &middot; <a href="{unsubscribe_link}" style="color:#94a3b8;">Unsubscribe</a></p>\n</div>', 'Your free period is ending']
      );
      const ekziston4 = await pool.query("SELECT 1 FROM marketing_shabllonet WHERE emri=$1", ['Dritarja e regjistrimit']);
      if (!ekziston4.rows.length) {
        await pool.query(
          'INSERT INTO marketing_shabllonet (emri, subjekti, html) VALUES ($1,$2,$3)',
          ['Dritarja e regjistrimit', 'Quick note about PhronexusAI', '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">\n      <p style="line-height:1.6;">Hi there,</p>\n      <p style="line-height:1.6;">Quick note about PhronexusAI — the cross-promotion network I mentioned before.</p>\n      <p style="line-height:1.6;">Right now, businesses that join get 90 days completely free, no subscription needed. After that, if you choose to continue, the monthly rate stays permanently lower than what new signups will pay once this window closes.</p>\n      <p style="line-height:1.6;">The idea itself: your business gets paired with complementary businesses (never competitors), so you show up in front of their visitors, and vice versa. AI handles the matching based on what\'s likely to convert.</p>\n      <p style="line-height:1.6;">Once this early window ends, the free period shortens and the rate goes up for anyone joining after. Signing up now locks in both.</p>\n      <p><a href="https://phronexusai.com" style="display:inline-block;background:#3b6ef0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">See how it works</a></p>\n      <p style="color:#94a3b8;font-size:12px;margin-top:28px;">PhronexusAI &middot; <a href="{unsubscribe_link}" style="color:#94a3b8;">Unsubscribe</a></p>\n    </div>\n']
        );
        console.log('marketing-email: shabllon i 4-t (Dritarja e regjistrimit) u para-ngarkua.');
      }
    } catch (e) { console.error('marketing-email seed shablloni 4:', e.message); }
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
  // Publik, pa autorizim — marresi e klikon direkt nga email-i.
  app.get('/marketing-unsubscribe', async (req, res) => {
    const email = req.query.email;
    try {
      if (email) await pool.query('UPDATE marketing_kontaktet SET unsubscribed=true WHERE email=$1', [email]);
      res.type('html').send('<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:420px;margin:60px auto;text-align:center;color:#1c2128;"><h2>You have been unsubscribed</h2><p>You will not receive further emails from PhronexusAI.</p></body></html>');
    } catch (e) { res.status(500).send('Error processing request.'); }
  });
  // RFC 8058 — Gmail/Yahoo e thërrasin këtë automatikisht kur marresi klikon "Unsubscribe" te vetë Gmail-i.
  app.post('/marketing-unsubscribe', async (req, res) => {
    const email = req.query.email;
    try { if (email) await pool.query('UPDATE marketing_kontaktet SET unsubscribed=true WHERE email=$1', [email]); } catch (e) {}
    res.status(200).end();
  });

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
  // Dergim I DREJTPERDREJTE, menjehere — brenda vete kerkeses HTTP, pa kaluar nepermjet
  // databazes/motorit ne sfond — e njejta qasje si email.js, per te izoluar nese mekanizmi
  // schedule vete eshte faktor ne deliverability.
  // Gjeneron linqe Gmail, te mbushur paraprakisht — perdoruesi vete klikon "Send", brenda Gmail-it.
  app.post('/api/admin/marketing/linqet-gmail', iAdmin, async (req, res) => {
    const { llogaria, shabllon_id, kontakt_ids, email_tek } = req.body || {};
    if (!llogaria) return res.status(400).json({ error: 'Zgjidh nje llogari derguesi.' });
    if (!shabllon_id) return res.status(400).json({ error: 'Zgjidh nje shabllon.' });
    if (!Array.isArray(kontakt_ids) || !kontakt_ids.length) return res.status(400).json({ error: 'Zgjidh te pakten 1 kontakt.' });
    if (!email_tek) return res.status(400).json({ error: 'Shkruaj email-in tend, ku duhet te vijne linqet.' });
    const llog = ndertoTransporteret();
    const transporter = llog[llogaria];
    if (!transporter) return res.status(400).json({ error: 'Llogaria "' + llogaria + '" s\'eshte konfiguruar.' });
    try {
      const sh = await pool.query('SELECT subjekti, html FROM marketing_shabllonet WHERE id=$1', [shabllon_id]);
      if (!sh.rows.length) return res.status(400).json({ error: 'Shablloni s\'u gjet.' });
      const { subjekti, html: htmlBazë } = sh.rows[0];
      const r = await pool.query('SELECT id, email, emri, domain FROM marketing_kontaktet WHERE id = ANY($1::int[]) AND NOT unsubscribed', [kontakt_ids]);
      const linqe = r.rows.map(kont => {
        const unsubLink = 'https://phronexusai.com/marketing-unsubscribe?email=' + encodeURIComponent(kont.email);
        const platformaEmri = emriPlatformesNgaDomain(kont.domain);
        const tekstiBaze = htmlNeTekst(htmlBazë).replace(/\{emri\}/g, kont.emri || kont.domain).replace(/\{domain\}/g, kont.domain || '').replace(/\{platforma\}/g, platformaEmri).replace(/\{unsubscribe_link\}/g, unsubLink);
        const subjektiFinal = subjekti.replace(/\{emri\}/g, kont.emri || kont.domain).replace(/\{domain\}/g, kont.domain || '').replace(/\{platforma\}/g, platformaEmri);
        const link = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(kont.email) + '&su=' + encodeURIComponent(subjektiFinal) + '&body=' + encodeURIComponent(tekstiBaze);
        return { kontakt_id: kont.id, email: kont.email, link };
      });
      // Ndertoi email-in "digest" — lista e linqeve, si butona te klikueshem.
      const htmlDigest = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">' +
        '<p>' + linqe.length + ' kontakte gati per dergim:</p>' +
        linqe.map(l => '<p><a href="' + l.link + '" style="display:inline-block;background:#3b6ef0;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Dergo te ' + escHtml(l.email) + '</a></p>').join('') +
        '</div>';
      await transporter.sendMail({ from: '"PhronexusAI" <' + llogaria + '>', to: email_tek, subject: linqe.length + ' email gati per dergim', html: htmlDigest });
      res.json({ ok: true, dergu_tek: email_tek, sasia: linqe.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/admin/marketing/dergo-menjehere', iAdmin, async (req, res) => {
    const { llogaria, shabllon_id, kontakt_ids } = req.body || {};
    if (!llogaria) return res.status(400).json({ error: 'Zgjidh nje llogari derguesi.' });
    if (!shabllon_id) return res.status(400).json({ error: 'Zgjidh nje shabllon.' });
    if (!Array.isArray(kontakt_ids) || !kontakt_ids.length) return res.status(400).json({ error: 'Zgjidh te pakten 1 kontakt.' });
    const llog = ndertoTransporteret();
    const transporter = llog[llogaria];
    if (!transporter) return res.status(400).json({ error: 'Llogaria "' + llogaria + '" s\'eshte konfiguruar.' });
    try {
      const sh = await pool.query('SELECT emri, subjekti, html FROM marketing_shabllonet WHERE id=$1', [shabllon_id]);
      if (!sh.rows.length) return res.status(400).json({ error: 'Shablloni s\'u gjet.' });
      const { emri: shabllonEmri, subjekti, html: htmlBazë } = sh.rows[0];
      const r = await pool.query('SELECT id, email, emri, domain, kategoria FROM marketing_kontaktet WHERE id = ANY($1::int[]) AND NOT unsubscribed', [kontakt_ids]);
      let dergu = 0, deshtuar = 0;
      for (const kont of r.rows) {
        const unsubLink = 'https://phronexusai.com/marketing-unsubscribe?email=' + encodeURIComponent(kont.email);
        const platformaEmri = emriPlatformesNgaDomain(kont.domain);
        const html = htmlBazë.replace(/\{emri\}/g, escHtml(kont.emri || kont.domain)).replace(/\{domain\}/g, escHtml(kont.domain || '')).replace(/\{platforma\}/g, escHtml(platformaEmri)).replace(/\{unsubscribe_link\}/g, unsubLink);
        const subjektiFinal = subjekti.replace(/\{emri\}/g, kont.emri || kont.domain).replace(/\{domain\}/g, kont.domain || '').replace(/\{platforma\}/g, platformaEmri);
        const token = krijoToken();
        try {
          await transporter.sendMail({
            from: '"PhronexusAI" <' + llogaria + '>', to: kont.email, subject: subjektiFinal, html: pergatitHtmlPerDergim(html, token)
          });
          await pool.query('UPDATE marketing_kontaktet SET derguar=true, derguar_nga=$1, derguar_at=now(), derguar_sasi=derguar_sasi+1 WHERE id=$2', [llogaria, kont.id]);
          await pool.query('INSERT INTO marketing_log (fushata_id, email, sukses, detaje) VALUES (NULL,$1,true,$2)', [kont.email, 'Derguar menjehere nga ' + llogaria]);
          await regjistroDergimin({ token, kontakt_id: kont.id, email: kont.email, domain: kont.domain, kategoria: kont.kategoria, shabllon_id, shabllon_emri: shabllonEmri, llogaria, subjekti: subjektiFinal, statusi: 'derguar' });
          dergu++;
        } catch (e) {
          await pool.query('INSERT INTO marketing_log (fushata_id, email, sukses, detaje) VALUES (NULL,$1,false,$2)', [kont.email, String(e.message).slice(0, 500)]).catch(()=>{});
          await regjistroDergimin({ token, kontakt_id: kont.id, email: kont.email, domain: kont.domain, kategoria: kont.kategoria, shabllon_id, shabllon_emri: shabllonEmri, llogaria, subjekti: subjektiFinal, statusi: 'deshtoi', gabimi: e.message });
          deshtuar++;
        }
      }
      res.json({ ok: true, dergu, deshtuar });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

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

  app.get('/api/admin/marketing/log', iAdmin, async (req, res) => {
    try {
      const r = await pool.query('SELECT * FROM marketing_log ORDER BY krijuar_at DESC LIMIT 100');
      res.json({ log: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Gjurmim: piksel hapjeje dhe klikim (publike, pa hyrje) ═══
  // Pikseli kthen gjithmone nje GIF 1x1, edhe per kod te pavlefshem, qe te mos zbulohet cili kod ekziston.
  app.get('/m/o/:token', async (req, res) => {
    const token = String(req.params.token || '').replace(/\.gif$/i, '');
    if (/^[0-9a-f]{24}$/.test(token)) {
      const ua = String((req.headers && req.headers['user-agent']) || '').slice(0, 200);
      try { await pool.query('UPDATE marketing_dergimet SET hapur_at = COALESCE(hapur_at, now()), hapje = hapje + 1, hapur_ua = COALESCE(hapur_ua, $2) WHERE token = $1', [token, ua || null]); }
      catch (e) { console.error('marketing hapje:', e.message); }
    }
    res.set({ 'Content-Type': 'image/gif', 'Content-Length': GIF_1X1.length, 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0', 'Pragma': 'no-cache' });
    res.status(200).end(GIF_1X1);
  });

  // Klikimi regjistrohet dhe pastaj ridrejtohet GJITHMONE te phronexusai.com + nje shteg i brendshem (pa "open redirect").
  app.get('/m/c/:token', async (req, res) => {
    const token = String(req.params.token || '');
    const p = String((req.query && req.query.p) || '/');
    const eSigurt = p.length <= 500 && /^\/(?![\/\\])[^\s\u0000-\u001f\\]*$/.test(p);
    if (/^[0-9a-f]{24}$/.test(token)) {
      try { await pool.query('UPDATE marketing_dergimet SET klikuar_at = COALESCE(klikuar_at, now()), klikime = klikime + 1, hapur_at = COALESCE(hapur_at, now()) WHERE token = $1', [token]); }
      catch (e) { console.error('marketing klikim:', e.message); }
    }
    res.redirect(302, BAZA_PUBLIKE + (eSigurt ? p : '/'));
  });

  // ═══ Lista e email-eve te dergura (menuja "Email-et") ═══
  app.get('/api/admin/marketing/emailet', iAdmin, async (req, res) => {
    try {
      const KUSHTET = { 'te-gjitha': 'TRUE', 'pa-shkuar': "statusi <> 'derguar'", 'pa-hapur': "statusi = 'derguar' AND hapur_at IS NULL", 'hapur': 'hapur_at IS NOT NULL', 'klikuar': 'klikuar_at IS NOT NULL' };
      const q = req.query || {};
      const filtri = Object.prototype.hasOwnProperty.call(KUSHTET, q.filtri) ? q.filtri : 'te-gjitha';
      const limit = Math.min(500, Math.max(1, parseInt(q.limit, 10) || 200));
      const offset = Math.max(0, parseInt(q.offset, 10) || 0);
      const rows = (await pool.query(
        'SELECT id, email, domain, kategoria, shabllon_emri, llogaria, subjekti, statusi, gabimi, derguar_at, hapur_at, hapje, klikuar_at, klikime FROM marketing_dergimet WHERE ' +
        KUSHTET[filtri] + ' ORDER BY derguar_at DESC, id DESC LIMIT $1 OFFSET $2', [limit, offset])).rows;
      const PRITJE = 'FROM marketing_fushata_kontakte fk JOIN marketing_fushatat f ON f.id = fk.fushata_id JOIN marketing_kontaktet k ON k.id = fk.kontakt_id ' +
        "WHERE NOT fk.derguar AND f.statusi = 'aktiv' AND NOT k.unsubscribed";
      let ne_pritje = [];
      if (filtri === 'te-gjitha' || filtri === 'pa-shkuar') {
        ne_pritje = (await pool.query('SELECT fk.id, k.email, k.domain, k.kategoria, (SELECT emri FROM marketing_shabllonet WHERE id = f.shabllon_id) AS shabllon_emri, f.llogaria ' +
          PRITJE + ' ORDER BY f.id DESC, fk.radha ASC LIMIT 200')).rows
          .map(x => ({ id: 'p' + x.id, email: x.email, domain: x.domain, kategoria: x.kategoria, shabllon_emri: x.shabllon_emri, llogaria: x.llogaria, subjekti: null, statusi: 'ne_pritje', gabimi: null, derguar_at: null, hapur_at: null, hapje: 0, klikuar_at: null, klikime: 0 }));
      }
      const n = (await pool.query(
        "SELECT COUNT(*)::int AS gjithsej, COUNT(*) FILTER (WHERE statusi = 'deshtoi')::int AS deshtoi, COUNT(*) FILTER (WHERE statusi = 'derguar' AND hapur_at IS NULL)::int AS pa_hapur, " +
        'COUNT(*) FILTER (WHERE hapur_at IS NOT NULL)::int AS hapur, COUNT(*) FILTER (WHERE klikuar_at IS NOT NULL)::int AS klikuar FROM marketing_dergimet')).rows[0] || {};
      const pritje = ((await pool.query('SELECT COUNT(*)::int AS n ' + PRITJE)).rows[0] || {}).n || 0;
      const numrat = { te_gjitha: (n.gjithsej || 0) + pritje, pa_shkuar: (n.deshtoi || 0) + pritje, pa_hapur: n.pa_hapur || 0, hapur: n.hapur || 0, klikuar: n.klikuar || 0 };
      res.json({ ok: true, filtri, rows: ne_pritje.concat(rows), numrat, gjurmim: { hapje: gjurmimHapjeNdezur(), klikime: gjurmimKlikimeNdezur() } });
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
        ORDER BY sl.data ASC, sl.ora ASC
        LIMIT 1`); // VETEM 1 slot per ekzekutim — nese disa jane "vone" njekohesisht (p.sh. pas nje rinisje
                    // serveri), vazhdojne 1 nga 1, minute pas minute, jo te gjitha njeheresh.

      for (const slot of slotsGati.rows) {
        const transporter = llog[slot.llogaria];
        if (!transporter) continue; // llogaria s'eshte me e konfiguruar, anashkalo ne heshtje
        const sasiaAkoma = slot.sasia - slot.perdorur;
        if (sasiaAkoma <= 0) continue;

        const sh = await pool.query('SELECT emri, subjekti, html FROM marketing_shabllonet WHERE id=$1', [slot.shabllon_id]);
        if (!sh.rows.length) continue;
        const { emri: shabllonEmri, subjekti, html: htmlBazë } = sh.rows[0];

        const teDerguar = await pool.query(`
          SELECT fk.id AS fk_id, k.id AS kontakt_id, k.email, k.emri, k.domain, k.kategoria
          FROM marketing_fushata_kontakte fk JOIN marketing_kontaktet k ON k.id = fk.kontakt_id
          WHERE fk.fushata_id=$1 AND NOT fk.derguar AND NOT k.unsubscribed ORDER BY fk.radha ASC LIMIT $2`,
          [slot.fushata_id, sasiaAkoma]);

        for (const kont of teDerguar.rows) {
          const unsubLink = 'https://phronexusai.com/marketing-unsubscribe?email=' + encodeURIComponent(kont.email);
          const platformaEmri = emriPlatformesNgaDomain(kont.domain);
          const html = htmlBazë.replace(/\{emri\}/g, escHtml(kont.emri || kont.domain)).replace(/\{domain\}/g, escHtml(kont.domain || '')).replace(/\{platforma\}/g, escHtml(platformaEmri)).replace(/\{unsubscribe_link\}/g, unsubLink);
          const subjektiFinal = subjekti.replace(/\{emri\}/g, kont.emri || kont.domain).replace(/\{domain\}/g, kont.domain || '').replace(/\{platforma\}/g, platformaEmri);
          const token = krijoToken();
          try {
            await transporter.sendMail({
              from: '"PhronexusAI" <' + slot.llogaria + '>', to: kont.email, subject: subjektiFinal, html: pergatitHtmlPerDergim(html, token)
            });
            await pool.query('UPDATE marketing_fushata_kontakte SET derguar=true, derguar_at=now() WHERE id=$1', [kont.fk_id]);
            await pool.query('UPDATE marketing_kontaktet SET derguar=true, derguar_nga=$1, derguar_at=now(), derguar_sasi=derguar_sasi+1 WHERE id=$2', [slot.llogaria, kont.kontakt_id]);
            await pool.query('UPDATE marketing_fushata_slots SET perdorur = perdorur + 1 WHERE id=$1', [slot.slot_id]);
            await pool.query('INSERT INTO marketing_log (fushata_id, email, sukses, detaje) VALUES ($1,$2,true,$3)', [slot.fushata_id, kont.email, 'Derguar nga ' + slot.llogaria]);
            await regjistroDergimin({ token, kontakt_id: kont.kontakt_id, email: kont.email, domain: kont.domain, kategoria: kont.kategoria, shabllon_id: slot.shabllon_id, shabllon_emri: shabllonEmri, llogaria: slot.llogaria, subjekti: subjektiFinal, fushata_id: slot.fushata_id, statusi: 'derguar' });
          } catch (e) {
            console.error('marketing dergim deshtoi:', kont.email, e.message);
            await pool.query('INSERT INTO marketing_log (fushata_id, email, sukses, detaje) VALUES ($1,$2,false,$3)', [slot.fushata_id, kont.email, String(e.message).slice(0, 500)]).catch(()=>{});
            await regjistroDergimin({ token, kontakt_id: kont.kontakt_id, email: kont.email, domain: kont.domain, kategoria: kont.kategoria, shabllon_id: slot.shabllon_id, shabllon_emri: shabllonEmri, llogaria: slot.llogaria, subjekti: subjektiFinal, fushata_id: slot.fushata_id, statusi: 'deshtoi', gabimi: e.message });
          }
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
