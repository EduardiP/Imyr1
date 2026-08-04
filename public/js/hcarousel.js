// hcarousel.js — Carousel i animacioneve ne faqen hyrese.
// Animacioni 1: dy faqe web (kuqe/blu) shkembejne hapesire reklame + shume vizitore levizin.
(function(){
  function anim1(){
    return `
<svg class="hsvg" viewBox="0 0 620 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dy SaaS shkëmbejnë reklama">
  <defs>
    <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#e63f5c"/></linearGradient>
    <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b8cff"/><stop offset="1" stop-color="#3552d6"/></linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.28"/></filter>
  </defs>
  <g filter="url(#soft)">
    <rect x="30" y="50" width="240" height="250" rx="14" fill="#ffffff"/>
    <rect x="30" y="50" width="240" height="30" rx="14" fill="#f1f2f6"/><rect x="30" y="66" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="48" cy="65" r="4" fill="#ff5f57"/><circle cx="62" cy="65" r="4" fill="#febc2e"/><circle cx="76" cy="65" r="4" fill="#28c840"/>
    <rect x="96" y="59" width="150" height="12" rx="6" fill="#e2e4ea"/>
    <circle cx="52" cy="104" r="9" fill="url(#gRed)"/><rect x="68" y="99" width="70" height="10" rx="5" fill="#2a2f3a"/>
    <rect x="210" y="100" width="46" height="16" rx="8" fill="url(#gRed)"/>
    <rect x="48" y="134" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="48" y="150" width="150" height="9" rx="4.5" fill="#eceef3"/><rect x="48" y="166" width="170" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="48" y="196" width="204" height="70" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="150" y="235" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#aab0be">hapësira e reklamës</text>
  </g>
  <g filter="url(#soft)">
    <rect x="350" y="50" width="240" height="250" rx="14" fill="#ffffff"/>
    <rect x="350" y="50" width="240" height="30" rx="14" fill="#f1f2f6"/><rect x="350" y="66" width="240" height="14" fill="#f1f2f6"/>
    <circle cx="368" cy="65" r="4" fill="#ff5f57"/><circle cx="382" cy="65" r="4" fill="#febc2e"/><circle cx="396" cy="65" r="4" fill="#28c840"/>
    <rect x="416" y="59" width="150" height="12" rx="6" fill="#e2e4ea"/>
    <circle cx="372" cy="104" r="9" fill="url(#gBlue)"/><rect x="388" y="99" width="70" height="10" rx="5" fill="#2a2f3a"/>
    <rect x="530" y="100" width="46" height="16" rx="8" fill="url(#gBlue)"/>
    <rect x="368" y="134" width="180" height="9" rx="4.5" fill="#e6e8ee"/><rect x="368" y="150" width="150" height="9" rx="4.5" fill="#eceef3"/><rect x="368" y="166" width="170" height="9" rx="4.5" fill="#eceef3"/>
    <rect x="368" y="196" width="204" height="70" rx="10" fill="#f7f8fa" stroke="#dfe2e9" stroke-dasharray="5 5"/>
    <text x="470" y="235" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#aab0be">hapësira e reklamës</text>
  </g>
  <g class="ad adRed"><rect width="204" height="70" rx="10" fill="url(#gRed)"/><circle cx="26" cy="35" r="14" fill="#fff" opacity=".9"/><rect x="50" y="22" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="50" y="38" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="26" width="42" height="20" rx="10" fill="#fff"/></g>
  <g class="ad adBlue"><rect width="204" height="70" rx="10" fill="url(#gBlue)"/><circle cx="26" cy="35" r="14" fill="#fff" opacity=".9"/><rect x="50" y="22" width="80" height="9" rx="4.5" fill="#fff" opacity=".95"/><rect x="50" y="38" width="110" height="7" rx="3.5" fill="#fff" opacity=".6"/><rect x="150" y="26" width="42" height="20" rx="10" fill="#fff"/></g>
  <g class="person pR1"><circle r="7" fill="url(#gRed)"/><circle cy="-11" r="4.5" fill="url(#gRed)"/></g>
  <g class="person pR2"><circle r="7" fill="url(#gRed)"/><circle cy="-11" r="4.5" fill="url(#gRed)"/></g>
  <g class="person pR3"><circle r="7" fill="url(#gRed)"/><circle cy="-11" r="4.5" fill="url(#gRed)"/></g>
  <g class="person pB1"><circle r="7" fill="url(#gBlue)"/><circle cy="-11" r="4.5" fill="url(#gBlue)"/></g>
  <g class="person pB2"><circle r="7" fill="url(#gBlue)"/><circle cy="-11" r="4.5" fill="url(#gBlue)"/></g>
  <g class="person pB3"><circle r="7" fill="url(#gBlue)"/><circle cy="-11" r="4.5" fill="url(#gBlue)"/></g>
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
  function rikthejTimer(){ if(timer) clearInterval(timer); if(slides.length>1) timer=setInterval(function(){ trego((idx+1)%slides.length); },9000); }
  function nis(){ if(!el('hcarousel')) return; trego(0); rikthejTimer(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',nis); else nis();
})();
