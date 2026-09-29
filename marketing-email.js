// marketing-email.js — Dergim email-esh MARKETING (outreach i ftohte) te bizneset e gjetura
// nga projekti i vecante "biznes-finder". SKEDAR I VECANT, i pa lidhur me pjesen tjeter
// te platformes (email.js/ekipi.js mbeten te paprekur) — vetem faqja e vet admin,
// e re, ne /admin/marketing.
//
// Kerkon variabla mjedisi (Railway -> Variables):
//   GMAIL_USER, GMAIL_APP_PASSWORD          (RIPERDOR ato qe TASHME ekzistojne per info@phronexusai.com)
//   MKT_EMAIL_2_USER, MKT_EMAIL_2_PASS      (i ri — p.sh. eduardpepushaj@gmail.com)
//   MKT_EMAIL_3_USER, MKT_EMAIL_3_PASS      (i ri — p.sh. phronexusplatform@gmail.com)
// Cdo llogari qe s'i ka te 2 variablat e veta, thjesht anashkalohet (s'prish gjeresine tjeter).

const nodemailer = require('nodemailer');

const LLOGARITE_KONFIG = [
  { emri: 'info@phronexusai.com (ekzistuese)', user: 'GMAIL_USER', pass: 'GMAIL_APP_PASSWORD' },
  { emri: 'Llogaria 2', user: 'MKT_EMAIL_2_USER', pass: 'MKT_EMAIL_2_PASS' },
  { emri: 'Llogaria 3', user: 'MKT_EMAIL_3_USER', pass: 'MKT_EMAIL_3_PASS' }
];

const transporteret = []; // { email, transporter }
function ndertoTransporteret() {
  if (transporteret.length) return transporteret;
  for (const l of LLOGARITE_KONFIG) {
    const user = process.env[l.user], pass = process.env[l.pass];
    if (!user || !pass) continue;
    transporteret.push({
      email: user,
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user, pass },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
      })
    });
  }
  return transporteret;
}

function escHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = function (app, pool, iAdmin) {

  pool.query(`CREATE TABLE IF NOT EXISTS marketing_kontaktet (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    domain TEXT,
    emri TEXT,
    kategoria TEXT,
    derguar BOOLEAN NOT NULL DEFAULT false,
    derguar_nga TEXT,
    derguar_at TIMESTAMPTZ,
    importuar_at TIMESTAMPTZ DEFAULT now()
  )`).catch(e => console.error('marketing_kontaktet migrim:', e.message));

  // ═══ Faqja e vet, e vecante — /admin/marketing ═══
  app.get('/admin/marketing', iAdmin, (req, res) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marketing Email — PhronexusAI Admin</title>
<style>
  body{ margin:0; font:15px/1.6 system-ui,sans-serif; background:#0b0f17; color:#e6edf3; }
  .wrap{ max-width:1000px; margin:0 auto; padding:32px 20px; }
  h1{ font-size:22px; margin:0 0 6px; }
  h2{ font-size:16px; margin:28px 0 10px; color:#e6edf3; }
  p.mut{ color:#8b949e; font-size:13px; }
  .card{ background:#141b26; border:1px solid #2a313c; border-radius:10px; padding:18px; margin-bottom:16px; }
  input, textarea, select{ width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #2a313c; border-radius:8px; background:#0e1420; color:#e6edf3; font-size:14px; margin-bottom:10px; font-family:inherit; }
  textarea{ min-height:160px; resize:vertical; }
  button{ padding:10px 20px; border-radius:8px; border:none; background:#3b6ef0; color:#fff; font-weight:600; cursor:pointer; font-size:14px; }
  button:disabled{ opacity:.5; }
  table{ width:100%; border-collapse:collapse; margin-top:10px; }
  th, td{ text-align:left; padding:7px 9px; border-bottom:1px solid #2a313c; font-size:13px; }
  th{ color:#8b949e; }
  .status{ font-size:13px; color:#8b949e; margin-top:8px; }
  .llogarite{ font-size:13px; color:#3fb950; }
</style></head>
<body><div class="wrap">
  <h1>Marketing Email</h1>
  <p class="mut">I ndare plotesisht nga pjesa tjeter e platformes. Kontaktet importohen nga CSV (eksportuar te projekti "biznes-finder").</p>

  <div class="card">
    <h2>1. Sinkronizo kontaktet (automatikisht, nga biznes-finder)</h2>
    <button onclick="sinkronizo()">Sinkronizo tani</button>
    <div class="status" id="statusImport"></div>
  </div>

  <div class="card">
    <h2>2. Kontaktet</h2>
    <div id="permbledhjeKontakte" class="status"></div>
    <table id="tabelaKontakte" style="display:none;">
      <thead><tr><th>Email</th><th>Domain</th><th>Emri</th><th>Kategoria</th><th>Status</th></tr></thead>
      <tbody id="tabelaKontakteBody"></tbody>
    </table>
  </div>

  <div class="card">
    <h2>3. Shkruaj email-in</h2>
    <input type="text" id="subjekti" placeholder="Subjekti">
    <textarea id="permbajtja" placeholder="Permbajtja (HTML lejohet). Perdor {emri} per emrin e biznesit, {domain} per domain-in."></textarea>
  </div>

  <div class="card">
    <h2>4. Dergo</h2>
    <div id="statusLlogarite" class="llogarite"></div>
    <input type="number" id="sasia" placeholder="Sa kontakte te reja te dergohen tani (p.sh. 3)" value="3" min="1">
    <button onclick="dergo()">Dergo</button>
    <div class="status" id="statusDergim"></div>
  </div>
</div>
<script>
async function ngarkoPermbledhjen(){
  try{
    var r = await fetch('/api/admin/marketing/permbledhje');
    var d = await r.json();
    document.getElementById('permbledhjeKontakte').textContent = d.gjithsej + ' gjithsej — ' + d.dergu + ' te dergu, ' + d.paDergu + ' ende pa dergu.';
    document.getElementById('statusLlogarite').textContent = d.llogarite.length + ' llogari email aktive: ' + d.llogarite.join(', ');
  }catch(e){}
}
async function sinkronizo(){
  var statusImport = document.getElementById('statusImport');
  statusImport.textContent = 'Duke sinkronizuar...';
  try{
    var r = await fetch('/api/admin/marketing/sinkronizo', { method: 'POST' });
    var d = await r.json();
    if(d.error){ statusImport.textContent = 'Gabim: ' + d.error; return; }
    statusImport.textContent = d.importuar + ' kontakte te reja u importuan (' + d.dublikate + ' ishin tashme te njohura, ' + d.pa_email + ' pa email). Gjithsej ne burim: ' + d.gjithsejNeBurim + '.';
    ngarkoPermbledhjen();
  }catch(e){ statusImport.textContent = 'Gabim: ' + e.message; }
}
async function dergo(){
  var sasia = parseInt(document.getElementById('sasia').value) || 3;
  var subjekti = document.getElementById('subjekti').value.trim();
  var permbajtja = document.getElementById('permbajtja').value.trim();
  var statusDergim = document.getElementById('statusDergim');
  if(!subjekti || !permbajtja){ statusDergim.textContent = 'Ploteso subjektin dhe permbajtjen fillimisht.'; return; }
  statusDergim.textContent = 'Duke derguar...';
  try{
    var r = await fetch('/api/admin/marketing/dergo', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ subjekti, permbajtja, sasia })
    });
    var d = await r.json();
    if(d.error){ statusDergim.textContent = 'Gabim: ' + d.error; return; }
    statusDergim.textContent = d.dergu + ' u derguan, ' + d.deshtuar + ' deshtuan.';
    ngarkoPermbledhjen();
  }catch(e){ statusDergim.textContent = 'Gabim: ' + e.message; }
}
ngarkoPermbledhjen();
</script>
</body></html>`);
  });

  // ═══ API-te ═══
  app.get('/api/admin/marketing/permbledhje', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT
        COUNT(*)::int AS gjithsej,
        COUNT(*) FILTER (WHERE derguar) ::int AS dergu,
        COUNT(*) FILTER (WHERE NOT derguar) ::int AS "paDergu"
        FROM marketing_kontaktet`);
      const llogarite = ndertoTransporteret().map(l => l.email);
      res.json({ ...r.rows[0], llogarite });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ═══ Sinkronizim automatik nga projekti "biznes-finder" (jo CSV manual) ═══
  app.post('/api/admin/marketing/sinkronizo', iAdmin, async (req, res) => {
    const burimi = process.env.BIZNES_FINDER_URL; // p.sh. https://emailet-production.up.railway.app
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
          'INSERT INTO marketing_kontaktet (email, domain, emri) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id',
          [row.email, row.domain, row.emri]
        );
        if (ins.rows.length) importuar++; else dublikate++;
      }
      res.json({ importuar, dublikate, pa_email, gjithsejNeBurim: rreshta.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/admin/marketing/dergo', iAdmin, async (req, res) => {
    const { subjekti, permbajtja, sasia } = req.body || {};
    if (!subjekti || !permbajtja) return res.status(400).json({ error: 'Mungon subjekti ose permbajtja.' });
    const llogarite = ndertoTransporteret();
    if (!llogarite.length) return res.status(500).json({ error: 'Asnje llogari email s\'eshte konfiguruar.' });
    try {
      const r = await pool.query('SELECT * FROM marketing_kontaktet WHERE NOT derguar ORDER BY importuar_at ASC LIMIT $1', [sasia || 3]);
      let dergu = 0, deshtuar = 0;
      for (let i = 0; i < r.rows.length; i++) {
        const kontakti = r.rows[i];
        const llogaria = llogarite[i % llogarite.length]; // rotullim mes llogarive
        const html = permbajtja
          .replace(/\{emri\}/g, escHtml(kontakti.emri || kontakti.domain))
          .replace(/\{domain\}/g, escHtml(kontakti.domain || ''));
        try {
          await llogaria.transporter.sendMail({
            from: '"PhronexusAI" <' + llogaria.email + '>',
            to: kontakti.email, subject: subjekti, html
          });
          await pool.query('UPDATE marketing_kontaktet SET derguar=true, derguar_nga=$1, derguar_at=now() WHERE id=$2', [llogaria.email, kontakti.id]);
          dergu++;
        } catch (e) { deshtuar++; }
      }
      res.json({ dergu, deshtuar });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
