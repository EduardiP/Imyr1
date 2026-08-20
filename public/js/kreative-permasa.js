// kreative-permasa.js — "Ndrysho madhësinë" per Creative (Imazh/HTML5).
// Skedar i VEÇANTË, i ndare qellimisht nga app.js, per te mos e mbingarkuar.
// Eksporton VETEM disa funksione globale minimale qe app.js i therret:
//   krPermasaLinkHTML()      — HTML i butonit + statusit (per formaKreative)
//   krPermasaReset()         — pastron gjendjen (per t'u thirrur kur hapet forma nga e para)
//   krPermasaMerrZgjedhurin()— kthen {w,h} E KONFIRMUAR (pas "Ruaj") — per krGjenero
//
// SJELLJA: buton diskret (jo link i theksuar), hap MODAL (si "Nga imazhet e mia"),
// ndryshimet brenda modalit jane "draft" derisa klikohet "Ruaj" — vetem atehere
// konfirmohen dhe shfaqen si status prane butonit. Mbyllja pa "Ruaj" = anulim.

// ═══ GJENDJA E BRENDSHME ═══
var _kpKonfirmuar = null; // {w,h,pajisje} — VETEM pas "Ruaj" — perdoret nga krGjenero
var _kpZgjedhur = null;   // {w,h} — draft-i brenda modalit, para "Ruaj"
var _kpPajisje = null;    // 'desktop' | 'mobile' — draft-i brenda modalit
var _kpLimits = null;     // cache nga /api/madhesia

// ═══ BUTONI + STATUSI (thirret nga formaKreative() ne app.js) ═══
function krPermasaLinkHTML(){
  return '<button type="button" class="btn" onclick="krPermasaHap()" '+
    'style="font-size:12px;padding:5px 10px;opacity:.8;">🔧 Ndrysho madhësinë</button>'+
    '<span id="krPermasaStatus" class="small mut" style="margin-left:8px;"></span>';
}

function krPermasaReset(){
  _kpKonfirmuar = null; _kpZgjedhur = null; _kpPajisje = null;
  var st = document.getElementById('krPermasaStatus');
  if(st) st.textContent = '';
  var ov = document.getElementById('krPermasaOverlay');
  if(ov) ov.remove();
}

// ═══ HAPJA E MODALIT ═══
async function krPermasaHap(){
  var overlay = document.createElement('div');
  overlay.id = 'krPermasaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10005;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="width:min(400px,92vw);max-height:85vh;overflow-y:auto;background:#12151b;border-radius:12px;border:1px solid var(--line);">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);">'+
        '<span style="font-weight:600;">🔧 Ndrysho madhësinë</span>'+
        '<button type="button" onclick="krPermasaMbyll()" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:16px;">✕</button>'+
      '</div>'+
      '<div id="krPermasaBrendesia" style="padding:16px;"></div>'+
    '</div>';
  document.body.appendChild(overlay);

  const brendesia = document.getElementById('krPermasaBrendesia');
  brendesia.innerHTML = '<p class="small mut">Po ngarkoj kufijtë…</p>';
  if(!_kpLimits){
    try{ _kpLimits = await (await fetch('/api/madhesia')).json(); }
    catch(e){ brendesia.innerHTML = '<p class="small">Gabim gjatë ngarkimit të kufijve.</p>'; return; }
  }
  // Vazhdo nga zgjedhja e fundit e konfirmuar, nese ka
  _kpPajisje = (_kpKonfirmuar && _kpKonfirmuar.pajisje) || null;
  _kpZgjedhur = (_kpKonfirmuar && { w: _kpKonfirmuar.w, h: _kpKonfirmuar.h }) || null;
  krPermasaRenderZgjedhesin();
}

function krPermasaMbyll(){
  var ov = document.getElementById('krPermasaOverlay');
  if(ov) ov.remove();
}

function krPermasaRenderZgjedhesin(){
  var el = document.getElementById('krPermasaBrendesia'); if(!el) return;
  el.innerHTML =
    '<p class="small mut" style="margin-bottom:8px;">⚠️ Zgjidh <b>VETËM NJË</b> — do të krijohet <b>një krijim i vetëm</b>, jo dy:</p>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px;">'+
      '<button type="button" class="btn" id="kpBtnDesktop" onclick="krPermasaZgjidhPajisjen(\'desktop\')">🖥️ Desktop</button>'+
      '<button type="button" class="btn" id="kpBtnMobile" onclick="krPermasaZgjidhPajisjen(\'mobile\')">📱 Mobile</button>'+
    '</div>'+
    '<div id="kpKanavasWrap"></div>'+
    '<p class="small mut" id="kpInfo" style="margin-top:8px;">Zgjidh Desktop ose Mobile për të filluar.</p>'+
    '<button type="button" class="btn primary" onclick="krPermasaRuaj()" style="margin-top:14px;width:100%;">💾 Ruaj</button>';
  // Nese ka zgjedhje te meparshme, vazhdo direkt nga aty (mos rifillo nga zero)
  if(_kpPajisje) krPermasaZgjidhPajisjen(_kpPajisje, /*ruajZgjedhurin=*/true);
}

// ═══ ZGJEDHJA E PAJISJES (Desktop OSE Mobile — jo te dyja njekohesisht) ═══
function krPermasaZgjidhPajisjen(pajisje, ruajZgjedhurin){
  _kpPajisje = pajisje;
  var dsk = document.getElementById('kpBtnDesktop'), mob = document.getElementById('kpBtnMobile');
  if(dsk){ dsk.style.background = (pajisje==='desktop') ? 'var(--acc)' : ''; dsk.style.opacity = (pajisje==='desktop') ? '1' : '.45'; }
  if(mob){ mob.style.background = (pajisje==='mobile') ? 'var(--acc)' : ''; mob.style.opacity = (pajisje==='mobile') ? '1' : '.45'; }

  var maxW = pajisje==='desktop' ? _kpLimits.max_w : _kpLimits.m_max_w;
  var maxH = pajisje==='desktop' ? _kpLimits.max_h : _kpLimits.m_max_h;
  var minW = pajisje==='desktop' ? _kpLimits.min_w : _kpLimits.m_min_w;
  var minH = pajisje==='desktop' ? _kpLimits.min_h : _kpLimits.m_min_h;

  if(!ruajZgjedhurin || !_kpZgjedhur){
    var standard = pajisje==='desktop' ? _kpLimits.standard : _kpLimits.m_standard;
    var std = String(standard||'210x261').split('x').map(Number);
    _kpZgjedhur = { w: std[0], h: std[1] };
  }
  krPermasaRenderKanavasin(maxW, maxH, minW, minH);
}

// ═══ KATRORI I LEVIZSHEM/NDRYSHUESHEM (zvarritje me mouse) ═══
function krPermasaRenderKanavasin(maxW, maxH, minW, minH){
  var wrap = document.getElementById('kpKanavasWrap'); if(!wrap) return;
  wrap.innerHTML =
    '<div id="kpKanavas" style="position:relative;width:'+maxW+'px;max-width:100%;height:'+maxH+'px;'+
      'border:1px dashed var(--line);border-radius:6px;background:#0e1116;overflow:hidden;">'+
      '<div id="kpKuti" style="position:absolute;top:0;left:0;background:rgba(59,130,246,.13);'+
        'border:2px solid var(--acc);box-sizing:border-box;">'+
        '<div id="kpDore" style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;'+
          'background:var(--acc);border-radius:3px;cursor:nwse-resize;"></div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-top:12px;flex-wrap:wrap;">'+
      '<label class="small">Gjerësi <input id="kpW" type="number" value="'+_kpZgjedhur.w+'" min="'+minW+'" max="'+maxW+'" style="width:70px;"></label>'+
      '<label class="small">Lartësi <input id="kpH" type="number" value="'+_kpZgjedhur.h+'" min="'+minH+'" max="'+maxH+'" style="width:70px;"></label>'+
    '</div>';
  krPermasaVendos(_kpZgjedhur.w, _kpZgjedhur.h, maxW, maxH, minW, minH);
  krPermasaLidhTerheqjen(maxW, maxH, minW, minH);
  var iW = document.getElementById('kpW'), iH = document.getElementById('kpH');
  if(iW) iW.oninput = function(){ krPermasaVendos(parseInt(iW.value,10)||minW, _kpZgjedhur.h, maxW, maxH, minW, minH); };
  if(iH) iH.oninput = function(){ krPermasaVendos(_kpZgjedhur.w, parseInt(iH.value,10)||minH, maxW, maxH, minW, minH); };
}

function krPermasaKufizo(w, h, maxW, maxH, minW, minH){
  w = Math.max(minW, Math.min(maxW, Math.round(w)));
  h = Math.max(minH, Math.min(maxH, Math.round(h)));
  return [w, h];
}

function krPermasaVendos(w, h, maxW, maxH, minW, minH){
  var kufizuar = krPermasaKufizo(w, h, maxW, maxH, minW, minH);
  w = kufizuar[0]; h = kufizuar[1];
  _kpZgjedhur = { w: w, h: h };
  var k = document.getElementById('kpKuti');
  if(k){ k.style.width = w+'px'; k.style.height = h+'px'; }
  var iW = document.getElementById('kpW'), iH = document.getElementById('kpH');
  if(iW) iW.value = w;
  if(iH) iH.value = h;
  var info = document.getElementById('kpInfo');
  if(info) info.innerHTML = '✓ Do të krijohet <b>1 (një) krijim</b>, saktësisht <b>'+w+'×'+h+' px</b>';
}

function krPermasaLidhTerheqjen(maxW, maxH, minW, minH){
  var dore = document.getElementById('kpDore'), kan = document.getElementById('kpKanavas');
  if(!dore || !kan) return;
  var duke = false;
  function nis(e){ duke = true; e.preventDefault(); }
  function levize(e){
    if(!duke) return;
    var rect = kan.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    krPermasaVendos(cx, cy, maxW, maxH, minW, minH);
  }
  function ndal(){ duke = false; }
  dore.addEventListener('mousedown', nis);
  dore.addEventListener('touchstart', nis, {passive:false});
  document.addEventListener('mousemove', levize);
  document.addEventListener('touchmove', levize, {passive:false});
  document.addEventListener('mouseup', ndal);
  document.addEventListener('touchend', ndal);
}

// ═══ RUAJ — konfirmon draft-in, e mbyll modalin, perditeson statusin ═══
function krPermasaRuaj(){
  if(!_kpPajisje || !_kpZgjedhur){
    alert('Zgjidh Desktop ose Mobile së pari.');
    return;
  }
  _kpKonfirmuar = { w: _kpZgjedhur.w, h: _kpZgjedhur.h, pajisje: _kpPajisje };
  var st = document.getElementById('krPermasaStatus');
  if(st) st.textContent = '✓ '+_kpKonfirmuar.w+'×'+_kpKonfirmuar.h+' px të ruajtura';
  krPermasaMbyll();
}

// ═══ MERR PERMASEN PERFUNDIMTARE (thirret nga krGjenero() ne app.js) ═══
// Nese klienti s'ka ruajtur asnjehere (asnje "Ruaj" i klikuar), kthen standardin Desktop.
async function krPermasaMerrZgjedhurin(){
  if(_kpKonfirmuar) return { w: _kpKonfirmuar.w, h: _kpKonfirmuar.h };
  try{
    var l = _kpLimits || await (await fetch('/api/madhesia')).json();
    var std = String(l.standard||'210x261').split('x').map(Number);
    return { w: std[0], h: std[1] };
  }catch(e){ return { w: 210, h: 261 }; }
}
