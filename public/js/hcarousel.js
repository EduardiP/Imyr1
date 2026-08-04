// hcarousel.js — Carousel i animacioneve ne faqen hyrese.
// Animacioni 1: dy faqe web shkembejne reklama; vizitoret (gri) dublikohen —
// kopjet kalojne te faqja tjeter POR origjinalet mbeten (plotesues, jo konkurrent),
// keshtu secila faqe nga 10 behet 20 (dy rreshta).
(function(){
  function person(cls, x, y){
    return '<g class="'+cls+'" style="--x:'+x+'px;--y:'+y+'px"><circle r="6.5" fill="#8b93a7"/><circle cy="-10" r="4.2" fill="#8b93a7"/></g>';
  }
  function anim1(){
    // 10 persona poshte secilES reklame (dy rreshta nga 5)
    var kuqPersonat='', bluPersonat='', kopjeKuq='', kopjeBlu='';
    var kx=[70,105,140,175,210], ky1=290, ky2=312;   // poshte faqes kuqe
    var bx=[390,425,460,495,530];                      // poshte faqes blu
    for(var i=0;i<5;i++){
      kuqPersonat += person('vK', kx[i], ky1);
      kuqPersonat += person('vK', kx[i], ky2);
      bluPersonat += person('vB', bx[i], ky1);
      bluPersonat += person('vB', bx[i], ky2);
    }
    // Kopjet qe do te "shkojne" te faqja tjeter (10 kuq → poshte faqes blu ne rresht te 3-te/4-te)
    for(i=0;i<5;i++){
      kopjeKuq += person('kopjeK', kx[i], ky1);  // niset te kuqja, perfundon te blu (rreshti i ri)
      kopjeKuq += person('kopjeK', kx[i], ky2);
      kopjeBlu += person('kopjeB', bx[i], ky1);
      kopjeBlu += person('kopjeB', bx[i], ky2);
    }
    return `
<svg class="hsvg" viewBox="0 0 620 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-promocion: klientët shumohen">
  <defs>
    <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#e63f5c"/></linearGradient>
    <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b8cff"/><stop offset="1" stop-color="#3552d6"/></linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.28"/></filter>
  </defs>
  <g filter="url(#soft)">
    <rect x="30" y="40" width="240" height="230" rx="14" fill="#ffffff"/>
    <rect x="30" y="40" width="240" height="30" rx="14" fill="#f1f2f6"/><rect x="30" y="56" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="48" cy="55" r="4" fill="#ff5f57"/><circle cx="62" cy="55" r="4" fill="#febc2e"/><circle cx="76" cy="55" r="4" fill="#28c840"/>
    <rect x="96" y="49" width="150" height="12" rx="6" fill="#e2e4ea"/>
    <circle cx="52" cy="94" r="9" fill="url(#gRed)"/><rect x="68" y="89" width="70" height="10" rx="5" fill="#2a2f3a"/>
    <rect x="210" y="90" width="46" height="16" rx="8" fill="url(#gRed)"/>
    <rect x="48" y="124" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="48" y="140" width="150" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="48" y="170" width="204" height="66" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="150" y="207" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#aab0be">hapësira e reklamës</text>
  </g>
  <g filter="url(#soft)">
    <rect x="350" y="40" width="240" height="230" rx="14" fill="#ffffff"/>
    <rect x="350" y="40" width="240" height="30" rx="14" fill="#f1f2f6"/><rect x="350" y="56" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="368" cy="55" r="4" fill="#ff5f57"/><circle cx="382" cy="55" r="4" fill="#febc2e"/><circle cx="396" cy="55" r="4" fill="#28c840"/>
    <rect x="416" y="49" width="150" height="12" rx="6" fill="#e2e4ea"/>
    <circle cx="372" cy="94" r="9" fill="url(#gBlue)"/><rect x="388" y="89" width="70" height="10" rx="5" fill="#2a2f3a"/>
    <rect x="530" y="90" width="46" height="16" rx="8" fill="url(#gBlue)"/>
    <rect x="368" y="124" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="368" y="140" width="150" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="368" y="170" width="204" height="66" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="470" y="207" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#aab0be">hapësira e reklamës</text>
  </g>
  <g class="ad adRed"><rect width="204" height="66" rx="10" fill="url(#gRed)"/><circle cx="26" cy="33" r="13" fill="#fff" opacity=".9"/><rect x="48" y="20" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="48" y="36" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="24" width="42" height="19" rx="9.5" fill="#fff"/></g>
  <g class="ad adBlue"><rect width="204" height="66" rx="10" fill="url(#gBlue)"/><circle cx="26" cy="33" r="13" fill="#fff" opacity=".9"/><rect x="48" y="20" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="48" y="36" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="24" width="42" height="19" rx="9.5" fill="#fff"/></g>
  ${kuqPersonat}
  ${bluPersonat}
  ${kopjeKuq}
  ${kopjeBlu}
</svg>`;
  }
  var slides=[{render:anim1}]; var idx=0,timer=null;
  function el(id){return document.getElementById(id);}
  function trego(i){
    idx=i; var a=el('hanim0'); if(a && !a.innerHTML) a.innerHTML=slides[0].render();
    var dots=el('hdots');
    if(dots){ var h=''; for(var k=0;k<slides.length;k++) h+='<span class="hdot'+(k===idx?' on':'')+'" data-i="'+k+'"></span>'; dots.innerHTML=h;
      Array.prototype.forEach.call(dots.querySelectorAll('.hdot'),function(d){ d.onclick=function(){ trego(parseInt(d.getAttribute('data-i'),10)); rikthejTimer(); }; }); }
  }
  function rikthejTimer(){ if(timer) clearInterval(timer); if(slides.length>1) timer=setInterval(function(){ trego((idx+1)%slides.length); },10000); }
  function nis(){ if(!el('hcarousel')) return; trego(0); rikthejTimer(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',nis); else nis();
})();
