// demo-paguar.js — SAAS PROVE "PaguarFlow" (i ndare nga Imyr; fshije kur te mbaroje testimi)
// Faqe te ndara, kornize e perbashket per KETE saas.
// Rreshtin e Imyr-it e ngjit NJE HERE te layout() me poshte; vlen per te 3 faqet.


const CSS = `
  body{ margin:0; font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif; color:#1a1a2e; background:#f6f7fb; }
  header{ background:#2f7d4f; color:#fff; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  header .lg{ font-weight:700; letter-spacing:.04em; }
  header nav a{ color:rgba(255,255,255,.85); text-decoration:none; margin-left:18px; font-size:14px; }
  header nav a:hover{ color:#fff; }
  .wrap{ max-width:800px; margin:0 auto; padding:44px 24px; }
  h1{ font-size:32px; margin:0 0 10px; }
  h2{ font-size:20px; margin:32px 0 10px; }
  p.lead{ color:#555; font-size:18px; margin:0 0 24px; }
  .cta{ display:inline-block; background:#2f7d4f; color:#fff; padding:13px 26px; border-radius:8px;
        text-decoration:none; font-weight:600; border:none; cursor:pointer; font-size:16px; font-family:inherit; }
  .cta:hover{ background:#215c39; }
  .feats{ display:flex; gap:14px; flex-wrap:wrap; margin:18px 0; }
  .feat{ flex:1; min-width:210px; background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:16px 18px; }
  .feat b{ color:#2f7d4f; }
  .rreth{ background:#fff; border:1px solid #e6e8f0; border-left:4px solid #2f7d4f; border-radius:10px; padding:20px 22px; margin:8px 0; }
  .rreth h2{ margin-top:0; }
  .kv{ margin:10px 0; }
  .kv b{ color:#2f7d4f; }
  .card{ background:#fff; border:1px solid #e6e8f0; border-radius:12px; padding:24px; margin-top:8px; }
  label{ display:block; font-size:13px; color:#555; margin:14px 0 5px; font-weight:600; }
  input{ width:100%; box-sizing:border-box; padding:11px 13px; border:1px solid #e6e8f0; border-radius:8px; font-size:15px; font-family:inherit; }
  .note{ border:1px dashed #c8ccdb; border-radius:10px; padding:14px 16px; color:#555; font-size:14px; background:#fff; margin-top:26px; }
  .note b{ color:#2f7d4f; }
  .ok{ width:56px; height:56px; border-radius:50%; background:#2f7d4f22; color:#2f7d4f;
       display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:14px; }
  .steps{ display:flex; gap:8px; margin-bottom:26px; font-size:13px; color:#889; }
  .steps span{ padding:5px 12px; border-radius:20px; background:#fff; border:1px solid #e6e8f0; }
  .steps span.on{ background:#2f7d4f; color:#fff; border-color:#2f7d4f; }
  footer{ max-width:800px; margin:0 auto; padding:24px; color:#889; font-size:13px; border-top:1px solid #e6e8f0; }
`;

function layout(titulli, trupi){
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PaguarFlow — ${titulli}</title>
<style>${CSS}</style>
</head>
<body>

<header>
  <span class="lg">PaguarFlow</span>
  <nav><a href="/demo/paguar">Ballina</a><a href="/demo/paguar/regjistrohu">Regjistrohu</a></nav>
</header>

${trupi}

<footer>© 2026 PaguarFlow — faqe prove per Imyr</footer>

<!-- ═══ NGJIT KETU rreshtin e Imyr-it (copy-paste nga wizard-i) — vlen per TE GJITHA faqet e PaguarFlow -->
<script src="https://imyr-production.up.railway.app/imyr.js" data-key="imyr_cb7f25e44d9533d434b68d92"></script>

<!-- ═══ deri ketu ═══ -->
</body>
</html>`;
}

const feats = ["Abonime & fatura periodike", "Pagesa me kartë & digital wallet", "Panel të ardhurash në kohë reale", "Menaxhim planesh & çmimesh"].map(function(v){ return '<div class="feat"><b>&#10003;</b> ' + v + '</div>'; }).join('');

const faqet = {
  ballina: function(){ return layout('ballina', `
<div class="wrap">
  <h1>PaguarFlow</h1>
  <p class="lead">Pranoni pagesa online për SaaS-in tuaj në minuta.</p>
  <a class="cta" href="/demo/paguar/regjistrohu">Krijo llogari &rarr;</a>

  <section class="rreth">
    <h2>Rreth shërbimit</h2>
    <p>PaguarFlow është një platformë pagesash e ndërtuar posaçërisht për bizneset SaaS. Ne menaxhojmë abonimet, faturimin periodik dhe pagesat me kartë, që ju të përqendroheni te produkti. Integrimi bëhet me një rresht kod, dhe suportojmë plane mujore, vjetore dhe me përdorim.</p>
    <div class="kv"><b>Për kë është:</b> Kush kërkon të pranojë pagesa të përsëritura pa ndërtuar vetë infrastrukturën e faturimit — sidomos ekipet e vogla SaaS që duan të nisin shpejt.</div>
    <div class="kv"><b>Fjalë-kyçe:</b> pagesa, faturim, abonime, checkout, të ardhura</div>
  </section>

  <h2>Çfarë ofrojmë</h2>
  <div class="feats">${feats}</div>

  <!-- Reklama e Imyr-it shfaqet KETU (ballina) -->
  <div style="margin-top:30px;"><div id="imyr-slot"></div></div>

  <div class="note"><b>Prove Imyr:</b> perdor pershkrimin lart, tipi <b>B2B</b>,
    website <b>/demo/paguar</b>, URL konvertimi <b>/demo/paguar/welcome</b>.</div>
</div>`); },

  regjistrohu: function(){ return layout('regjistrohu', `
<div class="wrap">
  <div class="steps"><span class="on">1. Te dhenat</span><span>2. Gati</span></div>
  <h1>Krijo llogarine te PaguarFlow</h1>
  <p class="lead">Faqe e ndermjetme — konvertimi s'duhet te numerohet ende.</p>
  <div class="card">
    <label>Emri</label><input placeholder="Emri yt">
    <label>Email</label><input type="email" placeholder="email@shembull.com">
    <label>Fjalekalimi</label><input type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;">
    <div style="margin-top:20px;">
      <button class="cta" onclick="location.href='/demo/paguar/welcome'">Regjistrohu &rarr;</button>
    </div>
  </div>
  <div class="note">Pas butonit kalon te <b>/demo/paguar/welcome</b>.</div>
</div>`); },

  welcome: function(){ return layout('mire se erdhe', `
<div class="wrap">
  <div class="steps"><span>1. Te dhenat</span><span class="on">2. Gati</span></div>
  <div class="ok">&#10003;</div>
  <h1>Mire se erdhe te PaguarFlow!</h1>
  <p class="lead">Llogaria u krijua. Kjo faqe hapet <b>vetem</b> pas regjistrimit.</p>
  <div class="note">Nese vizitori erdhi nga nje reklame e Imyr-it, konvertimi shfaqet te profili i reklamuesit.</div>
</div>`); }
};

module.exports = { faqet };
