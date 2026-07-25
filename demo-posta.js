// demo-posta.js — SAAS PROVE "PostaPro" (i ndare nga Imyr; fshije kur te mbaroje testimi)
// Faqe te ndara, kornize e perbashket per KETE saas.
// Rreshtin e Imyr-it e ngjit NJE HERE te layout() me poshte; vlen per te 3 faqet.

const CELESI = 'CELESI_IMYR';   // <- vendos celesin e ktij biznesi (nga wizard-i)
const BASE   = 'https://imyr-production.up.railway.app';

const CSS = `
  body{ margin:0; font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif; color:#1a1a2e; background:#f6f7fb; }
  header{ background:#c0392b; color:#fff; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  header .lg{ font-weight:700; letter-spacing:.04em; }
  header nav a{ color:rgba(255,255,255,.85); text-decoration:none; margin-left:18px; font-size:14px; }
  header nav a:hover{ color:#fff; }
  .wrap{ max-width:800px; margin:0 auto; padding:44px 24px; }
  h1{ font-size:32px; margin:0 0 10px; }
  h2{ font-size:20px; margin:32px 0 10px; }
  p.lead{ color:#555; font-size:18px; margin:0 0 24px; }
  .cta{ display:inline-block; background:#c0392b; color:#fff; padding:13px 26px; border-radius:8px;
        text-decoration:none; font-weight:600; border:none; cursor:pointer; font-size:16px; font-family:inherit; }
  .cta:hover{ background:#992d22; }
  .feats{ display:flex; gap:14px; flex-wrap:wrap; margin:18px 0; }
  .feat{ flex:1; min-width:210px; background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:16px 18px; }
  .feat b{ color:#c0392b; }
  .rreth{ background:#fff; border:1px solid #e6e8f0; border-left:4px solid #c0392b; border-radius:10px; padding:20px 22px; margin:8px 0; }
  .rreth h2{ margin-top:0; }
  .kv{ margin:10px 0; }
  .kv b{ color:#c0392b; }
  .card{ background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:24px; margin-top:8px; }
  label{ display:block; font-size:13px; color:#555; margin:14px 0 5px; font-weight:600; }
  input{ width:100%; box-sizing:border-box; padding:11px 13px; border:1px solid #e6e8f0; border-radius:8px; font-size:15px; font-family:inherit; }
  .note{ border:1px dashed #c8ccdb; border-radius:10px; padding:14px 16px; color:#555; font-size:14px; background:#fff; margin-top:26px; }
  .note b{ color:#c0392b; }
  .ok{ width:56px; height:56px; border-radius:50%; background:#c0392b22; color:#c0392b;
       display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:14px; }
  .steps{ display:flex; gap:8px; margin-bottom:26px; font-size:13px; color:#889; }
  .steps span{ padding:5px 12px; border-radius:20px; background:#fff; border:1px solid #e6e8f0; }
  .steps span.on{ background:#c0392b; color:#fff; border-color:#c0392b; }
  footer{ max-width:800px; margin:0 auto; padding:24px; color:#889; font-size:13px; border-top:1px solid #e6e8f0; }
`;

function layout(titulli, trupi){
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PostaPro — ${titulli}</title>
<style>${CSS}</style>
</head>
<body>

<header>
  <span class="lg">PostaPro</span>
  <nav><a href="/demo/posta">Ballina</a><a href="/demo/posta/regjistrohu">Regjistrohu</a></nav>
</header>

${trupi}

<footer>© 2026 PostaPro — faqe prove per Imyr</footer>

<!-- Imyr: NJE rresht, ne layout => vlen per TE GJITHA faqet e PostaPro -->
<script src="${BASE}/imyr.js" data-key="${CELESI}"></script>
</body>
</html>`;
}

const feats = ["Fushata të automatizuara", "Sekuenca mirëseardhjeje", "Segmentim liste", "Raporte hapjesh & klikimesh"].map(function(v){ return '<div class="feat"><b>&#10003;</b> ' + v + '</div>'; }).join('');

const faqet = {
  ballina: function(){ return layout('ballina', `
<div class="wrap">
  <h1>PostaPro</h1>
  <p class="lead">Email marketing & fushata automatike për rritjen tuaj.</p>
  <a class="cta" href="/demo/posta/regjistrohu">Krijo llogari &rarr;</a>

  <section class="rreth">
    <h2>Rreth shërbimit</h2>
    <p>PostaPro ndihmon bizneset të dërgojnë newsletter, fushata të automatizuara dhe email-e transaksionale. Ndërtoni sekuenca mirëseardhjeje, segmentoni listën sipas sjelljes dhe matni hapjet e klikimet në kohë reale.</p>
    <div class="kv"><b>Për kë është:</b> Bizneset që duan të komunikojnë me përdoruesit e tyre me email — nga mirëseardhja te fushatat e rimarrjes.</div>
    <div class="kv"><b>Fjalë-kyçe:</b> email, newsletter, fushata, automatizim, segmentim</div>
  </section>

  <h2>Çfarë ofrojmë</h2>
  <div class="feats">${feats}</div>

  <!-- Reklama e Imyr-it shfaqet KETU (ballina) -->
  <div style="margin-top:30px;"><div id="imyr-slot"></div></div>

  <div class="note"><b>Prove Imyr:</b> perdor pershkrimin lart, tipi <b>B2B</b>,
    website <b>/demo/posta</b>, URL konvertimi <b>/demo/posta/welcome</b>.</div>
</div>`); },

  regjistrohu: function(){ return layout('regjistrohu', `
<div class="wrap">
  <div class="steps"><span class="on">1. Te dhenat</span><span>2. Gati</span></div>
  <h1>Krijo llogarine te PostaPro</h1>
  <p class="lead">Faqe e ndermjetme — konvertimi s'duhet te numerohet ende.</p>
  <div class="card">
    <label>Emri</label><input placeholder="Emri yt">
    <label>Email</label><input type="email" placeholder="email@shembull.com">
    <label>Fjalekalimi</label><input type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;">
    <div style="margin-top:20px;">
      <button class="cta" onclick="location.href='/demo/posta/welcome'">Regjistrohu &rarr;</button>
    </div>
  </div>
  <div class="note">Pas butonit kalon te <b>/demo/posta/welcome</b>.</div>
</div>`); },

  welcome: function(){ return layout('mire se erdhe', `
<div class="wrap">
  <div class="steps"><span>1. Te dhenat</span><span class="on">2. Gati</span></div>
  <div class="ok">&#10003;</div>
  <h1>Mire se erdhe te PostaPro!</h1>
  <p class="lead">Llogaria u krijua. Kjo faqe hapet <b>vetem</b> pas regjistrimit.</p>
  <div class="note">Nese vizitori erdhi nga nje reklame e Imyr-it, konvertimi shfaqet te profili i reklamuesit.</div>
</div>`); }
};

module.exports = { faqet };
