// demo-dizajn.js — SAAS PROVE "PayFlow HR" (Payroll Software), i ndare nga Imyr.
// Kategoria eshte QELLIMISHT "Payroll Software" — jo "Recruiting/ATS Software" — meqe kjo
// e fundit do ta benin biznes KONKURRENT te drejtperdrejte me pikerisht ato biznese qe duam
// te testojme (rregulli i fort: e njejta kategori kryesore → AI=0 automatik, perjashtim i plote).
// "Payroll Software" eshte kategoria KOMPLEMENTARE, e identifikuar me pare per Recruiting/ATS —
// duhet te marre skor te larte AI, JO te perjashtohet si konkurrent.
//
// 1 FAQE E VETME, publike — pershkrim + disa hapesira snippet-i (per te testuar shume snippeta
// njekohesisht). Asnje login/register — thjesht faqe qe njeh AI-ja e platformes kur e analizon.
//
// SI TA PERDORESH:
// 1. Regjistro biznesin e ri ne PhronexusAI, duke perdorur kete URL si "website" — lejo qe AI-ja
//    ta analizoje vete kete pershkrim.
// 2. Kategoria kryesore duhet te dale "Payroll Software" automatikisht.
// 3. Per secilen hapesire (snippet) qe krijon te platforma, kopjo kodin e saj dhe zevendeso nje nga
//    3 vendet e shenuara me "<!-- SNIPPET X: ngjit KETU -->" me poshte.

const CSS = `
  body{ margin:0; font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif; color:#1a1a2e; background:#f6f7fb; }
  header{ background:#1a7a4c; color:#fff; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  header .lg{ font-weight:700; letter-spacing:.04em; }
  .wrap{ max-width:800px; margin:0 auto; padding:44px 24px; }
  h1{ font-size:32px; margin:0 0 10px; }
  h2{ font-size:20px; margin:32px 0 10px; }
  p.lead{ color:#555; font-size:18px; margin:0 0 24px; }
  .feats{ display:flex; gap:14px; flex-wrap:wrap; margin:18px 0; }
  .feat{ flex:1; min-width:210px; background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:16px 18px; }
  .feat b{ color:#1a7a4c; }
  .rreth{ background:#fff; border:1px solid #e6e8f0; border-left:4px solid #1a7a4c; border-radius:10px; padding:20px 22px; margin:8px 0; }
  .rreth h2{ margin-top:0; }
  .kv{ margin:10px 0; }
  .kv b{ color:#1a7a4c; }
  .slotBox{ background:#fff; border:1px dashed #c8ccdb; border-radius:10px; padding:16px 18px; margin:14px 0; }
  .slotBox .lbl{ font-size:12px; color:#889; text-transform:uppercase; letter-spacing:.05em; margin-bottom:10px; font-weight:600; }
  footer{ max-width:800px; margin:0 auto; padding:24px; color:#889; font-size:13px; border-top:1px solid #e6e8f0; }
`;

function layout(){
  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-G3EGWQ4DYD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-G3EGWQ4DYD');
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PayFlow HR — Payroll Software</title>
<style>${CSS}</style>
</head>
<body>

<header>
  <span class="lg">PayFlow HR</span>
</header>

<div class="wrap">
  <h1>PayFlow HR</h1>
  <p class="lead">Payroll software for small and mid-sized teams.</p>

  <section class="rreth">
    <h2>About</h2>
    <p>PayFlow HR automates payroll for growing companies — calculate wages, taxes, and deductions automatically, pay employees and contractors on schedule, and generate compliant pay stubs and tax filings without spreadsheets. Built for HR and finance teams who currently run payroll manually or through a patchwork of tools.</p>
    <div class="kv"><b>Who it's for:</b> HR and finance teams at growing companies who need reliable, automated payroll without hiring a dedicated payroll specialist.</div>
    <div class="kv"><b>Keywords:</b> payroll, wages, tax filing, pay stubs, direct deposit, contractor payments, compliance</div>
  </section>

  <h2>What PayFlow HR offers</h2>
  <div class="feats">
    <div class="feat"><b>&#10003;</b> Automatic payroll runs, every cycle</div>
    <div class="feat"><b>&#10003;</b> Tax calculation &amp; filing built in</div>
    <div class="feat"><b>&#10003;</b> Direct deposit for employees &amp; contractors</div>
    <div class="feat"><b>&#10003;</b> Digital pay stubs, always on time</div>
  </div>

  <h2>Ad spaces (test)</h2>
  <p class="lead" style="font-size:15px;">Each box below is an independent ad space — paste one snippet per box to test multiple placements at once.</p>

  <div class="slotBox">
    <div class="lbl">Slot 1 — Header</div>
    <!-- SNIPPET 1: ngjit KETU -->
    <script src="https://phronexusai.com/phronexusai.js" data-key="REPLACE_WITH_YOUR_KEY"></script>
    <!-- deri ketu -->
  </div>

  <div class="slotBox">
    <div class="lbl">Slot 2 — Mid-page</div>
    <!-- SNIPPET 2: ngjit KETU -->
    <script src="https://phronexusai.com/phronexusai.js" data-key="REPLACE_WITH_YOUR_KEY"></script>
    <!-- deri ketu -->
  </div>

  <div class="slotBox">
    <div class="lbl">Slot 3 — Footer</div>
    <!-- SNIPPET 3: ngjit KETU -->
    <script src="https://phronexusai.com/phronexusai.js" data-key="REPLACE_WITH_YOUR_KEY"></script>
    <!-- deri ketu -->
  </div>

</div>

<footer>© 2026 PayFlow HR — test page for PhronexusAI</footer>

</body>
</html>`;
}

// VETEM 1 faqe e vertete tani — "regjistrohu"/"welcome" mbahen si redirect te thjeshte per
// perputhshmeri (nese server.js akoma i referon keto rruge diku), s'perdoren me realisht.
const faqet = {
  ballina: function(){ return layout(); },
  regjistrohu: function(){ return '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/demo/dizajn"></head><body></body></html>'; },
  welcome: function(){ return '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/demo/dizajn"></head><body></body></html>'; }
};

module.exports = { faqet };
