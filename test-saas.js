// test-saas.js — SAJT PROVE (i ndare nga Imyr; fshije kur te mbaroje testimi)
// Faqe te ndara, kornize e perbashket — si nje SaaS i vertete.
// Rreshtin e Imyr-it ngjite NJE HERE te layout() me poshte; vlen per te gjitha faqet.

const CSS = `
  body { margin:0; font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif; color:#1a1a2e; background:#f5f6fa; }
  header { background:#3b3b98; color:#fff; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  header .lg { font-weight:700; letter-spacing:.05em; }
  header nav a { color:#c8c8e8; text-decoration:none; margin-left:18px; font-size:14px; }
  header nav a:hover { color:#fff; }
  .wrap { max-width:760px; margin:0 auto; padding:44px 24px; }
  h1 { font-size:32px; margin:0 0 10px; }
  p.lead { color:#555; font-size:18px; margin:0 0 22px; }
  .cta { display:inline-block; background:#3b3b98; color:#fff; padding:13px 26px; border-radius:8px;
         text-decoration:none; font-weight:600; border:none; cursor:pointer; font-size:16px; font-family:inherit; }
  .cta:hover { background:#2f2f7a; }
  .card { background:#fff; border:1px solid #dcdcec; border-radius:12px; padding:24px; margin-top:8px; }
  label { display:block; font-size:13px; color:#555; margin:14px 0 5px; font-weight:600; }
  input { width:100%; box-sizing:border-box; padding:11px 13px; border:1px solid #dcdcec; border-radius:8px;
          font-size:15px; font-family:inherit; }
  .note { border:1px dashed #b0b0d0; border-radius:10px; padding:14px 16px; color:#555; font-size:14px;
          background:#fff; margin-top:26px; }
  .note b { color:#3b3b98; }
  .ok { width:56px; height:56px; border-radius:50%; background:#e8e8f7; color:#3b3b98; display:flex;
        align-items:center; justify-content:center; font-size:28px; margin-bottom:14px; }
  .steps { display:flex; gap:8px; margin-bottom:26px; font-size:13px; color:#9a9ab8; }
  .steps span { padding:5px 12px; border-radius:20px; background:#fff; border:1px solid #dcdcec; }
  .steps span.on { background:#3b3b98; color:#fff; border-color:#3b3b98; }
  footer { max-width:760px; margin:0 auto; padding:24px; color:#888; font-size:13px; border-top:1px solid #ddd; }
`;

// ===== LAYOUT-I: ketu eshte NJE rreshti i Imyr-it, per te gjitha faqet =====
function layout(titulli, trupi) {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SaaS Prov 1 — ${titulli}</title>
<style>${CSS}</style>
</head>
<body>

<header>
  <span class="lg">SAAS PROV 1</span>
  <nav><a href="/test">Ballina</a><a href="/test/regjistrohu">Regjistrohu</a></nav>
</header>

${trupi}

<footer>© 2026 SaaS Prov 1</footer>

<!-- ═══ NGJIT KËTU rreshtin e Imyr-it (nga wizard-i, hapi "Konvertimi") ═══ -->


<!-- ═══ deri këtu — vlen për TË GJITHA faqet ═══ -->
</body>
</html>`;
}

// ===== FAQET (vetem permbajtja; layout-i shtohet vete) =====
const faqet = {
  ballina: () => layout('ballina', `
<div class="wrap">
  <h1>Faqja ime SaaS (provë)</h1>
  <p class="lead">Ballina. Këtu shfaqet reklama, dhe këtu zbret vizitori që klikon reklamën.</p>
  <a class="cta" href="/test/regjistrohu">Krijo llogari →</a>

  <!-- Vendi i reklames -->
  <div style="margin-top:34px;"><div id="imyr-slot"></div></div>

  <div class="note">
    Skripti është vetëm te layout-i — një herë. Reklama del këtu sepse kjo faqe ka
    <b>&lt;div id="imyr-slot"&gt;</b>. Faqet e tjera vetëm gjurmojnë.
  </div>
</div>`),

  regjistrohu: () => layout('regjistrohu', `
<div class="wrap">
  <div class="steps"><span class="on">1. Të dhënat</span><span>2. Gati</span></div>
  <h1>Krijo llogarinë</h1>
  <p class="lead">Faqe e ndërmjetme — konvertimi nuk duhet të numërohet ende.</p>

  <div class="card">
    <label>Emri</label><input placeholder="Emri yt">
    <label>Email</label><input type="email" placeholder="email@shembull.com">
    <label>Fjalëkalimi</label><input type="password" placeholder="••••••">
    <div style="margin-top:20px;">
      <button class="cta" onclick="location.href='/test/welcome'">Regjistrohu →</button>
    </div>
  </div>

  <div class="note">Pa <b>imyr-slot</b> këtu — pra pa reklamë, vetëm gjurmim. Pas butonit: <b>/test/welcome</b>.</div>
</div>`),
<script src="https://imyr-production.up.railway.app/imyr.js" data-key="imyr_ab2a9a0ea22373c3b24461c2"></script>
  welcome: () => layout('mirë se erdhe', `
<div class="wrap">
  <div class="steps"><span>1. Të dhënat</span><span class="on">2. Gati</span></div>
  <div class="ok">✓</div>
  <h1>Mirë se erdhe!</h1>
  <p class="lead">Llogaria u krijua. Kjo faqe hapet <b>vetëm</b> pas regjistrimit.</p>

  <div class="note">
    Faqja e konvertimit (<b>/test/welcome</b>). Skripti është këtu përmes layout-it, pa e shtuar veç.
    Nëse vizitori erdhi nga një reklamë e Imyr-it, konvertimi shfaqet te <b>Creatives</b>.
  </div>
</div>`)
};

module.exports = { faqet };
