// hcarousel.js — Animacioni 1: vizitoret shkojne nje-nga-nje te reklama, zhduken,
// shfaqen te reklama e faqes tjeter, dhe zbresin te rreshti i ri (dublikim).
// Fillim: 1 rresht x 10 poshte secilES faqe. Fund: 2 rreshta x 10 = 20 per secilen.
(function(){
  function anim1(){
    // Pozicionet e rreshtit fillestar (10 vizitore poshte secilES faqe)
    var kx=[], bx=[];
    for(var i=0;i<10;i++){ kx.push(44 + i*21); bx.push(364 + i*21); }
    var kY=300;                 // rreshti fillestar (poshte faqes)
    var reklamaKuqeQender={x:150,y:203};  // qender e hapesires se reklames te faqja kuqe (48..252, 170..236)
    var reklamaBluQender={x:470,y:203};   // qender e hapesires se reklames te faqja blu
    // Reklama BLU eshte te faqja KUQE (majtas), reklama KUQE eshte te faqja BLU (djathtas) pas shkembimit.

    var origK='', origB='', udhK='', udhB='';
    for(i=0;i<10;i++){
      var d=(i*0.28).toFixed(2);  // vonesa nje-nga-nje
      // Origjinalet qe MBETEN te rreshti fillestar (thjesht shfaqen)
      origK += '<g class="p vOrig" style="--x:'+kx[i]+'px;--y:'+kY+'px;--d:'+d+'s"><circle r="6.5" fill="#8b93a7"/><circle cy="-10" r="4.2" fill="#8b93a7"/></g>';
      origB += '<g class="p vOrig" style="--x:'+bx[i]+'px;--y:'+kY+'px;--d:'+d+'s"><circle r="6.5" fill="#8b93a7"/><circle cy="-10" r="4.2" fill="#8b93a7"/></g>';
      // Udhetaret: nga rreshti i faqes kuqe → te reklama (te faqja kuqe) → zhduken → shfaqen te reklama e faqes blu → zbresin te rreshti i ri poshte faqes blu
      var xtK=364 + i*21;  // pozicioni final te rreshti i ri poshte faqes BLU
      udhK += '<g class="p udhK" style="--sx:'+kx[i]+'px;--sy:'+kY+'px;'+
              '--rx:'+reklamaKuqeQender.x+'px;--ry:'+reklamaKuqeQender.y+'px;'+
              '--rx2:'+reklamaBluQender.x+'px;--ry2:'+reklamaBluQender.y+'px;'+
              '--fx:'+xtK+'px;--fy:340px;--d:'+d+'s"><circle r="6.5" fill="#8b93a7"/><circle cy="-10" r="4.2" fill="#8b93a7"/></g>';
      // Udhetaret nga faqja BLU → reklama (te faqja blu) → zhduken → shfaqen te reklama e faqes kuqe → rreshti i ri poshte faqes KUQE
      var xtB=44 + i*21;
      udhB += '<g class="p udhB" style="--sx:'+bx[i]+'px;--sy:'+kY+'px;'+
              '--rx:'+reklamaBluQender.x+'px;--ry:'+reklamaBluQender.y+'px;'+
              '--rx2:'+reklamaKuqeQender.x+'px;--ry2:'+reklamaKuqeQender.y+'px;'+
              '--fx:'+xtB+'px;--fy:340px;--d:'+d+'s"><circle r="6.5" fill="#8b93a7"/><circle cy="-10" r="4.2" fill="#8b93a7"/></g>';
    }
    return `
<svg class="hsvg" viewBox="0 0 620 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-promocion: klientët shumohen">
  <defs>
    <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#e63f5c"/></linearGradient>
    <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b8cff"/><stop offset="1" stop-color="#3552d6"/></linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.28"/></filter>
  </defs>
  <g filter="url(#soft)">
    <rect x="30" y="34" width="240" height="210" rx="14" fill="#ffffff"/>
    <rect x="30" y="34" width="240" height="28" rx="14" fill="#f1f2f6"/><rect x="30" y="48" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="48" cy="48" r="4" fill="#ff5f57"/><circle cx="62" cy="48" r="4" fill="#febc2e"/><circle cx="76" cy="48" r="4" fill="#28c840"/>
    <rect x="96" y="43" width="150" height="11" rx="5.5" fill="#e2e4ea"/>
    <circle cx="52" cy="86" r="9" fill="url(#gRed)"/><rect x="68" y="81" width="70" height="10" rx="5" fill="#2a2f3a"/><rect x="210" y="82" width="46" height="16" rx="8" fill="url(#gRed)"/>
    <rect x="48" y="112" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="48" y="128" width="150" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="48" y="170" width="204" height="66" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="150" y="147" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#c2c6d0">faqja jote</text>
  </g>
  <g filter="url(#soft)">
    <rect x="350" y="34" width="240" height="210" rx="14" fill="#ffffff"/>
    <rect x="350" y="34" width="240" height="28" rx="14" fill="#f1f2f6"/><rect x="350" y="48" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="368" cy="48" r="4" fill="#ff5f57"/><circle cx="382" cy="48" r="4" fill="#febc2e"/><circle cx="396" cy="48" r="4" fill="#28c840"/>
    <rect x="416" y="43" width="150" height="11" rx="5.5" fill="#e2e4ea"/>
    <circle cx="372" cy="86" r="9" fill="url(#gBlue)"/><rect x="388" y="81" width="70" height="10" rx="5" fill="#2a2f3a"/><rect x="530" y="82" width="46" height="16" rx="8" fill="url(#gBlue)"/>
    <rect x="368" y="112" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="368" y="128" width="150" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="368" y="170" width="204" height="66" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="470" y="147" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#c2c6d0">SaaS plotësuese</text>
  </g>
  <g class="ad adRed"><rect width="204" height="66" rx="10" fill="url(#gRed)"/><circle cx="26" cy="33" r="13" fill="#fff" opacity=".9"/><rect x="48" y="20" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="48" y="36" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="24" width="42" height="19" rx="9.5" fill="#fff"/></g>
  <g class="ad adBlue"><rect width="204" height="66" rx="10" fill="url(#gBlue)"/><circle cx="26" cy="33" r="13" fill="#fff" opacity=".9"/><rect x="48" y="20" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="48" y="36" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="24" width="42" height="19" rx="9.5" fill="#fff"/></g>
  ${origK}${origB}${udhK}${udhB}
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
  function rikthejTimer(){ if(timer) clearInterval(timer); if(slides.length>1) timer=setInterval(function(){ trego((idx+1)%slides.length); },11000); }
  function nis(){ if(!el('hcarousel')) return; trego(0); rikthejTimer(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',nis); else nis();
})();
