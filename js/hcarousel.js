// hcarousel.js — Carousel i animacioneve ne faqen hyrese.
// Animacioni 1: dy faqe (kuqe/blu) shkembejne hapesire reklame + vizitoret levizin mes tyre.
// Vektorial (SVG+CSS), pa video, ne lak, i pershtatur per mobile.
(function(){
  // ===== Animacioni 1: shkembimi i reklamave =====
  function anim1(){
    return `
<svg class="hsvg" viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dy SaaS shkëmbejnë reklama">
  <defs>
    <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#e63f5c"/>
    </linearGradient>
    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b7cff"/><stop offset="1" stop-color="#3552d6"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- ===== Faqja e KUQE (majtas) ===== -->
  <g filter="url(#soft)">
    <rect x="40" y="60" width="210" height="220" rx="12" fill="#141822" stroke="#2a2f3a"/>
    <!-- shiriti i browser-it -->
    <rect x="40" y="60" width="210" height="26" rx="12" fill="#1d2330"/>
    <circle cx="56" cy="73" r="3.5" fill="#ff6b6b"/><circle cx="68" cy="73" r="3.5" fill="#ffce54"/><circle cx="80" cy="73" r="3.5" fill="#2ecc71"/>
    <!-- header i faqes kuqe -->
    <rect x="54" y="98" width="120" height="10" rx="5" fill="url(#gRed)"/>
    <rect x="54" y="116" width="80" height="7" rx="3.5" fill="#2a2f3a"/>
    <!-- permbajtje -->
    <rect x="54" y="150" width="182" height="7" rx="3.5" fill="#232838"/>
    <rect x="54" y="164" width="150" height="7" rx="3.5" fill="#232838"/>
    <rect x="54" y="178" width="170" height="7" rx="3.5" fill="#232838"/>
    <!-- HAPESIRA e reklames (ku do vije reklama BLU) -->
    <rect x="54" y="205" width="182" height="56" rx="8" fill="#0e1116" stroke="#2a2f3a" stroke-dasharray="4 4"/>
    <text x="145" y="237" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" fill="#4a5163">hapësirë reklame</text>
  </g>

  <!-- ===== Faqja BLU (djathtas) ===== -->
  <g filter="url(#soft)">
    <rect x="350" y="60" width="210" height="220" rx="12" fill="#141822" stroke="#2a2f3a"/>
    <rect x="350" y="60" width="210" height="26" rx="12" fill="#1d2330"/>
    <circle cx="366" cy="73" r="3.5" fill="#ff6b6b"/><circle cx="378" cy="73" r="3.5" fill="#ffce54"/><circle cx="390" cy="73" r="3.5" fill="#2ecc71"/>
    <rect x="364" y="98" width="120" height="10" rx="5" fill="url(#gBlue)"/>
    <rect x="364" y="116" width="80" height="7" rx="3.5" fill="#2a2f3a"/>
    <rect x="364" y="150" width="182" height="7" rx="3.5" fill="#232838"/>
    <rect x="364" y="164" width="150" height="7" rx="3.5" fill="#232838"/>
    <rect x="364" y="178" width="170" height="7" rx="3.5" fill="#232838"/>
    <!-- HAPESIRA e reklames (ku do vije reklama KUQE) -->
    <rect x="364" y="205" width="182" height="56" rx="8" fill="#0e1116" stroke="#2a2f3a" stroke-dasharray="4 4"/>
    <text x="455" y="237" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" fill="#4a5163">hapësirë reklame</text>
  </g>

  <!-- ===== Reklama KUQE qe fluturon nga majtas te hapesira djathtas ===== -->
  <g class="adRed">
    <rect x="0" y="0" width="182" height="56" rx="8" fill="url(#gRed)"/>
    <rect x="14" y="16" width="60" height="8" rx="4" fill="#fff" opacity="0.9"/>
    <rect x="14" y="32" width="90" height="6" rx="3" fill="#fff" opacity="0.6"/>
    <rect x="132" y="18" width="38" height="20" rx="10" fill="#fff" opacity="0.95"/>
  </g>

  <!-- ===== Reklama BLU qe fluturon nga djathtas te hapesira majtas ===== -->
  <g class="adBlue">
    <rect x="0" y="0" width="182" height="56" rx="8" fill="url(#gBlue)"/>
    <rect x="14" y="16" width="60" height="8" rx="4" fill="#fff" opacity="0.9"/>
    <rect x="14" y="32" width="90" height="6" rx="3" fill="#fff" opacity="0.6"/>
    <rect x="132" y="18" width="38" height="20" rx="10" fill="#fff" opacity="0.95"/>
  </g>

  <!-- ===== Vizitor i KUQ: niset nga faqja kuqe, ndjek reklamen BLU, kalon te faqja blu ===== -->
  <circle class="visitorRed" cx="145" cy="300" r="7" fill="#ff6b6b"/>
  <!-- ===== Vizitor BLU: niset nga faqja blu, ndjek reklamen KUQE, kalon te faqja kuqe ===== -->
  <circle class="visitorBlue" cx="455" cy="320" r="7" fill="#5b7cff"/>
</svg>`;
  }

  // Lista e slide-ve (per tani vetem 1; shtojme 2 e 3 me vone)
  var slides = [ { render: anim1 } ];
  var idx = 0, timer = null;

  function el(id){ return document.getElementById(id); }

  function trego(i){
    idx = i;
    var s0 = el('hslide0');
    if(s0){ var a = el('hanim0'); if(a && !a.innerHTML) a.innerHTML = slides[0].render(); }
    // pikat
    var dots = el('hdots');
    if(dots){
      var h = '';
      for(var k=0;k<slides.length;k++) h += '<span class="hdot'+(k===idx?' on':'')+'" data-i="'+k+'"></span>';
      dots.innerHTML = h;
      Array.prototype.forEach.call(dots.querySelectorAll('.hdot'), function(d){
        d.onclick = function(){ trego(parseInt(d.getAttribute('data-i'),10)); rikthejTimer(); };
      });
    }
  }
  function rikthejTimer(){
    if(timer) clearInterval(timer);
    if(slides.length>1) timer = setInterval(function(){ trego((idx+1)%slides.length); }, 8000);
  }

  function nis(){
    if(!el('hcarousel')) return;
    trego(0);
    rikthejTimer();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', nis);
  else nis();
})();
