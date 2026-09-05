// core.js — gjendja e përbashkët, navigimi (me history/back), boot-i, header-i
const $ = id => document.getElementById(id);
let pollTimer = null, prog = null, une = null, curStep = 0, curNav = 'dashboard';

const STEPS = [
  { key:'llogaria',   label:'Biznesi' },
  { key:'pershkrimi', label:'Përshkrimi' },
  { key:'lidhja',     label:'Lidhja' }
];
const NAV = [
{ k:'dashboard', l:'Dashboard' },
{ k:'snippetet', l:'Hapësira e reklamave' },
{ k:'kreative', l:'Creative' },
{ k:'reklamat', l:'My Ads' },
{ k:'konvertimet', l:'Konvertimet' },
{ k:'analytics', l:'Analytics' },
{ k:'plani', l:'Plani', ndaresi:true },
{ k:'suport', l:'Ndihmë & Suport' }
];

function esc(t){ const d=document.createElement('div'); d.textContent=(t==null?'':t); return d.innerHTML; }
function segPick(btn){ const box=btn.parentNode; box.querySelectorAll('button').forEach(b=>b.classList.remove('sel')); btn.classList.add('sel'); }
function segVal(id){ const s=document.querySelector('#'+id+' button.sel'); return s ? s.getAttribute('data-v') : null; }
function segHTML(id){ return '<label>Kujt nga vizitorët e faqes tënde u shërben platforma?</label>'+
  '<div class="seg" id="'+id+'">'+
    '<button type="button" data-v="b2b" onclick="segPick(this)">Bizneseve</button>'+
    '<button type="button" data-v="b2c" onclick="segPick(this)">Individëve</button>'+
    '<button type="button" data-v="b2b2c" onclick="segPick(this)">Të dyjave</button>'+
  '</div>'; }
function showView(v){ ['hero','home','wizard','profile','analitika-full','ekipi','zgjedhja'].forEach(x=>{ const el=$('v-'+x); if(el) el.classList.toggle('on', x===v); }); }

async function refreshProg(){
  try { prog = await (await fetch('/api/progres')).json(); }
  catch(e){ prog = { llogaria:true, pershkrimi:false, lidhja:false, konvertimi:false, reklama:false }; }
  if(typeof ngarkoNjoftimet==='function') ngarkoNjoftimet();
}
function nextIncomplete(){ for(let i=0;i<STEPS.length;i++){ if(!prog[STEPS[i].key]) return i; } return STEPS.length; }
// Herën e parë (asnjë hap i plotësuar) → udhëzuesi me 3 pikat; përndryshe → paneli (dashboard)
function pasHyrjes(){
  const asgjeEBere = prog && !prog.llogaria && !prog.pershkrimi && !prog.lidhja;
  if(asgjeEBere) return {v:'zgjedhja'};
  return {v:'profile', nav:'dashboard'};
}

// ---------- URL <-> GJENDJE ----------
// Konverton objektin e gjendjes (i njejti qe ruhet ne history.state) ne nje URL
// reale te shiritit te adresave, dhe anasjelltas — per bookmark/share/refresh/Figma.
function stateToUrl(s){
  if(!s) return '/';
  if(s.v==='hero') return '/';
  if(s.v==='wizard') return '/fillo' + (s.step ? '/'+s.step : '');
  if(s.v==='home') return '/fillim';
  if(s.v==='analitika-full') return '/analytics';
  if(s.v==='ekipi') return '/ekipi';
  if(s.v==='zgjedhja') return '/fillo/zgjedh';
  if(s.v!=='profile') return '/';

  const n = s.nav || 'dashboard';
  if(n==='dashboard') return '/app/dashboard';
  if(n==='snippetet'){
    if(s.sub==='detail' && s.id) return '/app/hapesira/'+s.id;
    return '/app/hapesira';
  }
  if(n==='snippetStats') return '/app/hapesira/statistikat';
  if(n==='kreative'){
    if(s.tab==='krijo') return '/app/creative/krijo'+(s.lloji?'/'+s.lloji:'');
    if(s.tab==='lista') return '/app/creative/krijimet';
    return '/app/creative';
  }
  if(n==='reklamat'){
    if(s.sub==='create') return '/app/reklamat/krijo'+(s.format?'/'+s.format:'');
    if(s.sub==='detail' && s.id) return '/app/reklamat/'+s.id;
    return '/app/reklamat';
  }
  if(n==='rekPerformanca') return '/app/reklamat/performanca';
  if(n==='konvertimet' || n==='konvertimi') return '/app/konvertimet';
  if(n==='analytics') return '/app/analytics';
  if(n==='insights') return '/app/vshtrime';
  if(n==='biznesi') return '/app/biznesi';
  if(n==='pershkrimi') return '/app/pershkrimi';
  if(n==='lidhjaSnippet') return '/app/lidhja';
  if(n==='profili') return '/app/profili'+(s.edit?'/edito':'');
  if(n==='ekipi') return '/ekipi';
  if(n==='plani') return '/app/plani';
  if(n==='suport') return '/app/suport';
  if(n==='njoftimet') return '/app/njoftimet';
  if(n==='cilesimet') return '/app/cilesimet';
  return '/app/'+n;
}

// URL → objekt gjendjeje. Kthen null nese s'njihet (mbetet '/', trajtohet nga
// logjika ekzistuese e boot()-it: une ? home : hero).
function urlToState(pathname){
  const p = pathname.replace(/\/+$/,'') || '/';
  if(p==='/'||p==='') return null;
  if(p==='/analytics') return {v:'analitika-full'};
  if(p==='/ekipi') return {v:'ekipi'};
  if(p==='/fillim') return {v:'home'};
  if(p==='/fillo/zgjedh') return {v:'zgjedhja'};
  if(p.indexOf('/fillo')===0){
    const parts=p.split('/'); const step=parseInt(parts[2],10);
    return {v:'wizard', step:isNaN(step)?0:step};
  }
  if(p.indexOf('/app/')!==0) return null;

  const parts = p.slice(5).split('/').filter(Boolean);
  const n = parts[0];
  if(n==='dashboard') return {v:'profile', nav:'dashboard'};
  if(n==='hapesira'){
    if(parts[1]==='statistikat') return {v:'profile', nav:'snippetStats'};
    if(parts[1]) return {v:'profile', nav:'snippetet', sub:'detail', id:parseInt(parts[1],10)};
    return {v:'profile', nav:'snippetet'};
  }
  if(n==='creative'){
    if(parts[1]==='krijo') return {v:'profile', nav:'kreative', tab:'krijo', lloji:parts[2]||undefined};
    if(parts[1]==='krijimet') return {v:'profile', nav:'kreative', tab:'lista'};
    return {v:'profile', nav:'kreative'};
  }
  if(n==='reklamat'){
    if(parts[1]==='krijo') return {v:'profile', nav:'reklamat', sub:'create', format:parts[2]||undefined};
    if(parts[1]==='performanca') return {v:'profile', nav:'rekPerformanca'};
    if(parts[1]) return {v:'profile', nav:'reklamat', sub:'detail', id:parseInt(parts[1],10)};
    return {v:'profile', nav:'reklamat'};
  }
  if(n==='konvertimet') return {v:'profile', nav:'konvertimet'};
  if(n==='analytics') return {v:'profile', nav:'analytics'};
  if(n==='vshtrime') return {v:'profile', nav:'insights'};
  if(n==='biznesi') return {v:'profile', nav:'biznesi'};
  if(n==='pershkrimi') return {v:'profile', nav:'pershkrimi'};
  if(n==='lidhja') return {v:'profile', nav:'lidhjaSnippet'};
  if(n==='profili') return {v:'profile', nav:'profili', edit: parts[1]==='edito'};
  if(n==='plani') return {v:'profile', nav:'plani'};
  if(n==='suport') return {v:'profile', nav:'suport'};
  if(n==='njoftimet') return {v:'profile', nav:'njoftimet'};
  if(n==='cilesimet') return {v:'profile', nav:'cilesimet'};
  return {v:'profile', nav:n};
}

// ---------- HEADER (i loguar) ----------
function setHeaderLoggedIn(){
  // Logo i ri (rrjet pikash) — injektohet mbi div-in ekzistues .logo, s'prek index.html
  const logoEl = document.querySelector('.logo');
  if(logoEl && !logoEl.dataset.uiUpdated){
    logoEl.dataset.uiUpdated='1';
    logoEl.style.cursor='pointer';
    logoEl.onclick=function(){ goHome(); };
    logoEl.style.cssText='display:flex;align-items:center;gap:9px;';
    logoEl.innerHTML =
      '<svg class="pxa-logo-mark" width="24" height="24" viewBox="0 0 744 693"><path d="M 128.305 16.696 C 127.862 18.788, 127.510 27.250, 127.523 35.500 C 127.550 52.547, 128.733 58.298, 134.955 71.619 C 151.278 106.565, 186.792 131.105, 251 151.808 C 317.267 173.174, 324.338 175.771, 341 184.862 C 366.427 198.736, 375.345 220.913, 366.590 248.500 C 362.891 260.156, 357.723 268.277, 347.500 278.500 C 337.633 288.367, 329.578 293.438, 317 297.700 C 307.640 300.872, 291.601 301.901, 281.370 299.986 C 251.454 294.385, 228.872 273.255, 220.875 243.378 C 219.235 237.250, 218.760 232.501, 218.736 222 C 218.709 210.210, 219.041 207.387, 221.359 199.712 C 224.189 190.342, 229.195 179.693, 233.419 174.056 C 234.839 172.161, 236 170.320, 236 169.964 C 236 169.608, 234.088 168.752, 231.750 168.062 C 216.479 163.556, 187.041 150.310, 171.361 140.890 C 166.885 138.200, 162.977 136, 162.676 136 C 162.376 136, 158.783 140.444, 154.692 145.875 C 130.527 177.953, 115.134 221.340, 108.525 276 C 106.322 294.214, 104.936 320.257, 105.663 329.753 L 106.296 338.007 245.156 337.753 L 384.016 337.500 390.426 323.242 C 409.029 281.860, 426.605 257.133, 443.149 249.067 C 453.160 244.186, 462.672 243.755, 474.023 247.668 L 482.500 250.590 482.500 232.545 C 482.500 212.687, 483.490 207.029, 489.048 195.107 C 495.390 181.505, 504.920 170.757, 525.903 153.541 C 553.153 131.183, 559.072 125.100, 565.523 112.825 C 572.772 99.030, 575.063 78.969, 571.418 61.208 C 569.730 52.982, 564.230 35.895, 560.616 27.650 L 558.421 22.642 552.461 33.540 C 545.701 45.898, 535.532 59.578, 528.357 65.966 C 522.777 70.933, 510.792 79.015, 506.163 80.932 C 503.194 82.162, 502.306 81.917, 490.756 76.673 C 453.037 59.547, 417.149 49.682, 377.343 45.499 C 350.364 42.664, 310.850 43.888, 278.500 48.561 C 267.263 50.185, 245.076 54.591, 244.317 55.349 C 244.086 55.581, 249.432 58.688, 256.198 62.253 C 299.883 85.276, 319.770 97.360, 345.500 116.512 C 384.199 145.318, 406.791 171.990, 414.933 198.484 C 417.430 206.607, 418.560 215.633, 417.573 219.565 C 416.900 222.246, 416.740 222.121, 411.691 214.952 C 395.567 192.061, 372.271 166.448, 353.316 150.769 C 316.641 120.434, 290.105 104.284, 220 69.630 C 170.414 45.118, 155.567 36.151, 135.805 18.778 L 129.111 12.892 128.305 16.696 M 546 165.683 C 542.975 168.155, 538.210 172.051, 535.410 174.339 L 530.321 178.500 534.139 183.562 C 539.779 191.040, 544.629 202.367, 546.539 212.522 C 551.628 239.575, 538.726 266.936, 515.250 278.879 C 512.913 280.068, 511 281.281, 511 281.574 C 511 281.868, 512.532 286.696, 514.404 292.304 C 518.866 305.673, 521.377 320.921, 520.789 331.080 L 520.331 339 537.492 339 L 554.652 339 559.329 324.250 C 564.451 308.095, 567.967 293.109, 570.705 275.764 C 573.232 259.761, 573.230 220.221, 570.703 207.730 C 567.387 191.346, 558.992 169.854, 553.364 163.344 L 551.500 161.189 546 165.683 M 287.500 188.339 C 285.300 189.068, 282.025 190.432, 280.223 191.372 C 274.804 194.196, 265.434 203.683, 263.545 208.258 C 262.583 210.591, 261.360 213.331, 260.829 214.347 C 259.180 217.497, 258.750 228.026, 260.070 232.900 C 263.211 244.490, 271.741 254.684, 282.500 259.702 C 287.647 262.102, 289.709 262.491, 297 262.437 C 304.050 262.385, 306.540 261.904, 311.600 259.618 C 323.978 254.025, 333.704 240.557, 334.747 227.567 C 335.314 220.504, 332.877 210.274, 330.401 209.324 C 329.566 209.003, 329.139 208.081, 329.450 207.270 C 330.353 204.916, 318.018 193.356, 311.344 190.300 C 304.523 187.177, 293.696 186.287, 287.500 188.339 M 633.713 260.480 C 629.979 261.254, 624.467 263.013, 621.463 264.389 C 618.458 265.764, 616 266.640, 616 266.336 C 616 266.032, 612.281 269.544, 607.735 274.141 C 599.556 282.412, 594.603 288, 595.451 288 C 595.692 288, 594.815 290.363, 593.503 293.250 C 590.318 300.257, 588.601 310.803, 589.391 318.513 L 590.032 324.770 585.766 326.473 C 579.577 328.944, 573.071 334.245, 568.530 340.517 L 564.560 346 542.780 346 L 521 346 520.923 350.750 C 520.881 353.363, 520.718 356.175, 520.559 357 C 520.177 358.994, 518.837 369.912, 518.935 370.241 C 518.977 370.384, 518.109 373.757, 517.006 377.737 C 515.903 381.718, 515 385.205, 515 385.487 C 515 385.769, 526.004 386, 539.453 386 L 563.906 386 565.654 389.750 C 568.338 395.507, 577.834 404.294, 584.135 406.852 L 589.590 409.066 589.178 418.470 C 588.849 426.003, 589.182 429.230, 590.851 434.687 C 601.522 469.565, 638.266 485.059, 670.379 468.223 C 689.366 458.269, 699.095 441.635, 699.274 418.819 L 699.359 408.137 705.429 405.936 C 710.269 404.181, 712.919 402.289, 718.500 396.607 C 728.012 386.923, 731.232 380.727, 731.788 371.038 C 732.032 366.786, 731.690 361.538, 731.004 359 C 730.335 356.525, 729.913 354.500, 730.065 354.500 C 730.216 354.500, 729.133 352.587, 727.658 350.250 C 726.182 347.913, 725.143 346, 725.349 346 C 725.914 346, 715.576 335.417, 715 335.406 C 713.294 335.374, 710 333.705, 710 332.874 C 710 332.328, 709.633 332.109, 709.185 332.386 C 708.737 332.663, 706.037 332.205, 703.185 331.369 C 698.708 330.057, 698.061 329.552, 698.449 327.675 C 700.220 319.098, 699.992 312.140, 697.641 302.911 C 694.449 290.387, 691.513 284.806, 683.552 276.131 C 679.948 272.204, 677 269.214, 677 269.487 C 677 269.759, 674.813 268.636, 672.139 266.991 C 669.466 265.346, 666.740 264, 666.080 264 C 665.421 264, 665.203 263.480, 665.595 262.845 C 666.033 262.138, 665.870 261.962, 665.175 262.392 C 664.551 262.778, 662.060 262.421, 659.640 261.599 C 653.018 259.351, 641.544 258.855, 633.713 260.480 M 446.485 276.250 C 442.046 280.788, 435.888 288.109, 432.800 292.520 C 427.406 300.226, 415 321.628, 415 323.227 C 415 323.652, 415.682 324, 416.514 324 C 419.229 324, 435.203 330.893, 442.408 335.173 C 449.997 339.682, 463.762 352.686, 468.750 360.060 C 473.571 367.187, 479.601 379.794, 482.022 387.808 C 484.548 396.169, 484.840 396.072, 489.348 385.361 C 500.942 357.815, 500.634 320.771, 488.602 295.500 C 483.167 284.086, 477.819 277.380, 469.975 272.142 C 464.944 268.783, 462.902 268, 459.164 268 C 454.711 268, 454.284 268.278, 446.485 276.250 M 636.803 286.344 C 627.448 288.973, 620.120 295.881, 616.424 305.559 C 613.765 312.522, 614.796 324.201, 618.679 331.114 C 630.404 351.985, 661.186 350.196, 671.385 328.051 C 672.987 324.571, 673.483 321.500, 673.490 315 C 673.499 307.434, 673.173 305.910, 670.529 301.136 C 663.776 288.944, 649.632 282.741, 636.803 286.344 M 67.353 346.465 C 63.343 349.274, 62 354.034, 62 365.433 C 62 377.819, 63.328 382.010, 68.190 384.974 C 71.480 386.980, 72.687 386.993, 263.750 386.996 C 423.357 386.999, 456 386.773, 456 385.666 C 456 384.932, 454.214 381.782, 452.031 378.666 C 449.848 375.550, 448.316 373, 448.627 373 C 450.080 373, 427.858 351.876, 423.013 348.651 L 417.527 345 243.486 345 C 92.228 345, 69.171 345.192, 67.353 346.465 M 596.500 348.896 C 576.899 357.971, 581.788 387.053, 602.884 386.874 C 613.151 386.787, 620.716 381.482, 623.077 372.715 C 627.479 356.366, 611.431 341.983, 596.500 348.896 M 682.071 355.752 C 676.625 358.528, 674.493 362.233, 674.544 368.826 C 674.598 375.791, 676.607 379.147, 682.399 381.951 C 693.679 387.412, 705.775 380.763, 706.788 368.545 C 707.159 364.072, 706.861 362.989, 704.488 360.168 C 702.988 358.386, 700.488 356.269, 698.931 355.464 C 695.049 353.457, 686.278 353.606, 682.071 355.752 M 631.442 391.805 C 608.131 403.074, 608.461 435.655, 632 446.877 C 636.493 449.019, 638.873 449.486, 645 449.425 C 653.987 449.337, 658.188 447.711, 664.524 441.871 C 674.771 432.426, 677.318 418.384, 671.023 406.045 C 665.685 395.582, 656.829 389.862, 645.038 389.261 C 638.311 388.918, 636.848 389.191, 631.442 391.805 M 507.753 402.750 C 500.359 415.439, 494.484 422.612, 485.980 429.337 C 473.533 439.179, 474.006 439.043, 466.214 435.004 C 456.463 429.948, 437.436 417.769, 421.206 406.194 L 406.912 396 321.456 396 L 236 396 236.006 429.750 C 236.009 449.880, 236.428 465.001, 237.044 467.219 C 239.161 474.842, 259.363 490.770, 289.500 508.577 C 299.400 514.426, 309.975 520.677, 313 522.468 C 316.025 524.259, 325.925 529.911, 335 535.028 C 383.183 562.198, 402.692 574.468, 424 591.003 C 446.989 608.843, 465.143 630.494, 479.125 656.747 C 481.531 661.265, 483.822 664.970, 484.216 664.981 C 484.610 664.991, 488.940 661.638, 493.838 657.528 C 503.924 649.065, 518.752 633.805, 529.817 620.500 C 533.934 615.550, 537.684 611.350, 538.151 611.167 C 538.618 610.983, 539 610.402, 539 609.874 C 539 609.346, 540.731 606.571, 542.846 603.707 C 544.961 600.843, 547.499 596.925, 548.485 595 C 549.472 593.075, 550.779 591.169, 551.390 590.765 C 552 590.361, 552.192 590.024, 551.815 590.015 C 551.438 590.007, 552.876 586.273, 555.011 581.717 C 564.181 562.149, 567.998 544.864, 567.976 523 C 567.956 502.615, 565.656 489.450, 556.011 454.500 C 548.311 426.597, 547.381 421.936, 545.477 401.750 L 544.841 395 528.555 395 L 512.270 395 507.753 402.750 M 104.875 427.500 C 104.806 444.825, 104.694 459.788, 104.625 460.750 C 104.510 462.356, 106.202 462.522, 125.250 462.770 L 146 463.041 146 447.020 L 146 431 162.500 431 L 179 431 179 447 L 179 463 199 463 L 219 463 219 429.500 L 219 396 162 396 L 105 396 104.875 427.500"/></svg>'+
      '<span style="font-family:var(--f-head);font-weight:800;letter-spacing:.06em;font-size:15px;color:#fff;">PHRONEXUS <span style="color:var(--acc2);">AI</span></span>';
  }
  $('hdrLeft').innerHTML=
    '<button id="mobMenuBtn" onclick="mobDrawerToggle()" aria-label="Menu">'+
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>'+
    '</button>';
  if(!$('mobDrawerBackdrop')){
    const bd=document.createElement('div'); bd.id='mobDrawerBackdrop'; bd.onclick=mobDrawerClose;
    const dr=document.createElement('div'); dr.id='mobDrawer';
    document.body.appendChild(bd); document.body.appendChild(dr);
  }
  $('hdrRight').innerHTML=
    '<button id="mobKerkBtn" onclick="mobKerkToggle()" style="display:none;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:none;color:var(--mut2);cursor:pointer;">'+
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'+
    '</button>'+
    '<div id="kerkWrap" style="display:flex;align-items:center;gap:8px;height:32px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--card2);width:200px;">'+
      '<svg class="kerkSvgIco" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--mut2);flex:0 0 auto;"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'+
      '<input id="kerkInput" placeholder="Kërko…" autocomplete="off" oninput="kerkoRun(this.value)" style="border:none;background:none;padding:0;height:auto;font-size:12px;">'+
      '<div id="kerkRez" class="hide"></div>'+
    '</div>'+
    '<button class="hdrIco" title="Choose language" style="display:flex;align-items:center;gap:5px;height:32px;padding:0 10px;border-radius:10px;border:1px solid var(--line);background:none;color:var(--mut2);font-family:var(--f-mono);font-size:11px;font-weight:600;cursor:pointer;">'+
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>'+
      '<span>EN</span>'+
    '</button>'+
    '<button class="hdrIco" title="Theme" onclick="pxaThemeToggle()" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:none;color:var(--mut2);cursor:pointer;">'+
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'+
    '</button>'+
    '<div class="zile-wrap"><button class="zile hdrIco" onclick="toggleNjoftimet(event)" aria-label="Njoftimet" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:none;color:var(--mut2);cursor:pointer;position:relative;">'+
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'+
      '<span id="zileBadge" class="zile-badge hide">0</span>'+
    '</button><div id="njBox" class="njBox hide"></div></div>';
  ngarkoNjoftimet();
  dashFooterVendos();
}

// Footer minimal, per dashboard (pas login) — 1 rresht, i ndare nga footer-i i madh publik.
function dashFooterVendos(){
  if(document.getElementById('dashFooter')) return; // shtohet vetem 1 here
  var f = document.createElement('div');
  f.id = 'dashFooter';
  f.style.cssText = 'text-align:center;padding:14px 10px;font-size:12px;color:var(--mut);border-top:1px solid var(--line);margin-top:20px;';
  f.innerHTML = '© 2026 PhronexusAI · '+
    '<a href="/how-it-works" target="_blank" style="color:inherit;">How It Works</a> · '+
    '<a href="/privacy" target="_blank" style="color:inherit;">Privacy</a> · '+
    '<a href="/terms" target="_blank" style="color:inherit;">Terms</a> · '+
    '<a href="/refund" target="_blank" style="color:inherit;">Refund Policy</a> · '+
    '<a href="/contact" target="_blank" style="color:inherit;">Contact</a>';
  document.body.appendChild(f);
}
function toggleMenu(e){ e.stopPropagation(); const m=$('menuBox'); if(m) m.classList.toggle('hide'); const n=$('njBox'); if(n) n.classList.add('hide'); }
function toggleNjoftimet(e){ e.stopPropagation(); const n=$('njBox'); if(n) n.classList.toggle('hide'); const m=$('menuBox'); if(m) m.classList.add('hide'); }
document.addEventListener('click', (e)=>{
  const m=$('menuBox'); if(m) m.classList.add('hide');
  const n=$('njBox'); if(n) n.classList.add('hide');
  const kw=$('kerkWrap');
  if(kw && kw.classList.contains('mobOpen') && !e.target.closest('#kerkWrap') && !e.target.closest('#mobKerkBtn')){
    kw.classList.remove('mobOpen');
  }
});

async function ngarkoNjoftimet(){
  try{
    const r=await(await fetch('/api/njoftimet')).json();
    window.__njoftimet=r.njoftimet||[];
    const badge=$('zileBadge');
    // Mos shfaq njoftime derisa udhezuesi i 3 pikave te jete mbyllur/perfunduar
    const teUdhezuesi = (history.state && history.state.v==='wizard');
    if(badge){
      const n = teUdhezuesi ? 0 : window.__njoftimet.length;
      badge.textContent=n; badge.classList.toggle('hide', n===0);
    }
    renderNjBox();
  }catch(e){}
}
function njVeprim(v){
  const box=$('njBox'); if(box) box.classList.add('hide');
  if(v==='konvertimi') nav({v:'profile', nav:'konvertimi'});
  else if(v==='creatives') nav({v:'profile',nav:'reklamat',sub:'create'});
  else if(v==='reklamat') nav({v:'profile',nav:'reklamat'});
  else if(v==='lidhja') nav({v:'profile',nav:'lidhjaSnippet'});
  else nav({v:'profile'});
}

async function njAdminMbyll(id){
  try{ await fetch('/api/njoftime-admin/'+id+'/ploteso',{method:'POST'}); }catch(e){}
  try{ await ngarkoNjoftimet(); }catch(e){}
}
async function njAdminButon(id, veprim){
  // Plotesohet vetem kur klikohet butoni
  try{ await fetch('/api/njoftime-admin/'+id+'/ploteso',{method:'POST'}); }catch(e){}
  const box=$('njBox'); if(box) box.classList.add('hide');
  njVeprim(veprim);
  try{ await ngarkoNjoftimet(); }catch(e){}
}


function renderNjBox(){
  const box=$('njBox'); if(!box) return;
  const nj=window.__njoftimet||[];
  let h='<div class="njHead">Njoftime</div>';
  if(!nj.length){ h+='<div class="njEmpty">S\'ke njoftime të reja.</div>'; }
  else {
    nj.slice(0,5).forEach((x,i)=>{
      if(x.nga_admin){
        // Preview: vetem titull + tekst. Butoni shfaqet te faqja e plote.
        h+='<div class="njItem njAdmin" onclick="hapNjoftimet()">'+
           '<div class="njT">📢 '+esc(x.titull)+'</div>'+
           '<div class="njX">'+esc(x.teksti)+'</div></div>';
      } else {
        h+='<div class="njItem" onclick="njVeprim(\''+x.veprim+'\')">'+
           '<div class="njT">'+esc(x.titull)+'</div>'+
           '<div class="njX">'+esc(x.teksti)+'</div></div>';
      }
    });
  }
  h+='<div class="njMore" onclick="hapNjoftimet()">Shiko më shumë →</div>';
  box.innerHTML=h;
}
function hapNjoftimet(){
  const box=$('njBox'); if(box) box.classList.add('hide');
  nav({v:'profile', nav:'njoftimet'});
}
function goProfile(){ nav({v:'profile'}); }
function goHome(){ nav({v:'profile', nav:'dashboard'}); }

async function loadMe(){
  let r; try{ r=await fetch('/api/une'); }catch(e){ une=null; return false; }
  if(!r.ok){ une=null; return false; }
  une=await r.json();
  window.une = une; // balance.js (dhe cdo skedar tjeter) e lexon si window.une — sigurohu qe eshte gjithmone i njejte
  // Sinkronizo MENJEHERE modalitetin Ankand/Balance, PARA se te vizatohet cfardo —
  // mos prit klikimin e menyse se avatarit (ai ishte shkaku i vertete i bug-ut: ne
  // refresh, modaliteti mbetej te vlera fillestare hardcoded 'ankand').
  if(typeof window._sinkronizoModalitetin==='function') window._sinkronizoModalitetin();
  await refreshProg(); setHeaderLoggedIn(); return true;
}

// ---------- NAVIGIMI (me shigjetën back të browser-it + URL reale) ----------
function applyState(s, replace){
  if(!s){ s = une ? {v:'profile', nav:'dashboard'} : {v:'hero'}; }
  if(s.v==='wizard'){ renderWizard(s.step||0); }
  else if(s.v==='profile' && une){ renderProfile(s); showView('profile'); }
  else if(s.v==='home' && une){ renderHome(); showView('home'); }
  else if(s.v==='analitika-full' && une){ renderAnalyticsFull(); showView('analitika-full'); }
  else if(s.v==='ekipi' && une){ ekipiNdertoSkeleten(); showView('ekipi'); }
  else if(s.v==='zgjedhja' && une){ renderZgjedhja(); showView('zgjedhja'); }
  else { showView('hero'); }
  if(replace) history.replaceState(s,'',stateToUrl(s));
}
function nav(s){ history.pushState(s,'',stateToUrl(s)); applyState(s); }
window.onpopstate = e => applyState(e.state);

async function boot(){
  const params = new URLSearchParams(location.search);
  const loginRez = params.get('login');
  await loadMe();

  // Ngarkim i drejtperdrejte/refresh/link i ndare — rindërto gjendjen nga vetë URL-ja
  // (zevendeson rastet e vjetra hardcoded /ekipi dhe /cilesimet me nje zgjidhje te pergjithshme).
  if(!history.state && une){
    const gjendjaNgaUrl = urlToState(location.pathname);
    if(gjendjaNgaUrl){ applyState(gjendjaNgaUrl, true); return; }
  }

  if(loginRez){
    // Pastro parametrin nga URL-ja
    history.replaceState(null,'',location.pathname);
    if(loginRez==='kushte'){
      applyState({v:'hero'}, true);
      if(typeof hapKushteGoogle==='function') await hapKushteGoogle();
      return;
    }
    if(loginRez==='ok' && une){
      applyState(pasHyrjes(), true);
      return;
    }
    if(loginRez==='gabim'){
      applyState(history.state, true);
      alert('Hyrja me Google dështoi. Provo sërish.');
      return;
    }
  }
  applyState(history.state, true);
}

function mobKerkToggle(){
  const w=$('kerkWrap'); if(!w) return;
  const eshteHapur = w.classList.toggle('mobOpen');
  if(eshteHapur){ const inp=$('kerkInput'); if(inp) setTimeout(function(){ inp.focus(); },50); }
}
function mobKerkMbyll(){ const w=$('kerkWrap'); if(w) w.classList.remove('mobOpen'); }
// ---------- SIRTARI MOBILE (drill-down, si Shopify Dawn Android) ----------
function mobDrawerToggle(){
  const dr=$('mobDrawer');
  if(dr && dr.classList.contains('open')) mobDrawerClose();
  else mobDrawerOpen();
}
function mobDrawerOpen(){
  const neSetings = (typeof curNav!=='undefined' && (curNav==='cilesimet' || curNav==='kufizimetKat'));
  const listaFillestare = neSetings
    ? (typeof CIL_STRUKTURA!=='undefined' ? CIL_STRUKTURA : [])
    : (typeof NAV2!=='undefined' ? NAV2 : []);
  mobDrawerRenderNiveli(listaFillestare, neSetings ? 'Cilësimet' : null);
  const bd=$('mobDrawerBackdrop'), dr=$('mobDrawer');
  if(bd) bd.classList.add('open');
  if(dr) dr.classList.add('open');
}
function mobDrawerClose(){
  const bd=$('mobDrawerBackdrop'), dr=$('mobDrawer');
  if(bd) bd.classList.remove('open');
  if(dr) dr.classList.remove('open');
}
// items: lista per kete nivel. titulli: titulli i header-it te panelit (null = niveli kryesor).
// mbrapa: funksion per t'u kthyer nje nivel me lart (null nese jemi ne krye).
function mobDrawerRenderNiveli(items, titulli, mbrapa){
  const dr=$('mobDrawer'); if(!dr) return;
  const neSetings = (typeof curNav!=='undefined' && (curNav==='cilesimet' || curNav==='kufizimetKat'));
  const ikonat = neSetings
    ? (typeof CIL_ICONS!=='undefined' ? CIL_ICONS : {})
    : (typeof NAV_ICONS!=='undefined' ? NAV_ICONS : {});
  dr.innerHTML =
    '<div class="mobDrawerHead">'+
      (mbrapa ? '<button onclick="window.__mobDrawerMbrapa()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' : '')+
      '<span class="t">'+(titulli?esc(titulli):'PhronexusAI')+'</span>'+
      '<button onclick="mobDrawerClose()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
    '</div>'+
    '<div class="mobDrawerList" id="mobDrawerList"></div>';
  window.__mobDrawerMbrapa = mbrapa || function(){};
  const listEl=$('mobDrawerList');
  items.forEach(function(n){
    const hasSubs = n.subs && n.subs.length;
    const isActive = !hasSubs && (n.nav===curNav || n.k===curNav);
    const b=document.createElement('button');
    b.className='mobDrawerItem'+(isActive?' active':'');
    const icoSvg = n.k && ikonat[n.k] ? '<svg class="ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ikonat[n.k]+'</svg>' : '';
    b.innerHTML = icoSvg + '<span>'+esc(n.l)+'</span>' +
      (hasSubs ? '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' : '');
    if(hasSubs){
      b.onclick=function(){ mobDrawerRenderNiveli(n.subs, n.l, function(){ mobDrawerRenderNiveli(items, titulli, mbrapa); }); };
    } else if(n.akcion && typeof window[n.akcion]==='function'){
      b.onclick=function(){ mobDrawerClose(); window[n.akcion](); };
    } else if(neSetings && typeof cilShkoTek==='function' && (n.k==='account'||n.k==='hosting'||n.k==='advertising')){
      b.onclick=function(){ mobDrawerClose(); cilShkoTek(n.k); };
    } else {
      b.onclick=function(){ mobDrawerClose(); nav({v:'profile', nav:n.nav||n.k, tab:n.tab, sub:n.sub}); };
    }
    listEl.appendChild(b);
  });
}
