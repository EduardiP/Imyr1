// kreative-permasa.js — "Cakto madhësinë" per Creative (Imazh/HTML5).
// Skedar i VEÇANTË, i ndare qellimisht nga app.js, per te mos e mbingarkuar.
// Eksporton VETEM disa funksione globale minimale qe app.js i therret:
//   krPermasaLinkHTML()      — HTML i linkut "Cakto madhësinë" (per formaKreative)
//   krPermasaReset()         — pastron gjendjen (per t'u thirrur kur hapet forma nga e para)
//   krPermasaMerrZgjedhurin()— kthen {w,h} e zgjedhur (per t'u thirrur nga krGjenero)
// Asnje funksion tjeter ketu s'preket nga jashte, dhe asnje funksion ekzistues i
// app.js s'eshte ndryshuar ne strukturen e vet — vetem thirret nga jashte.

// ═══ GJENDJA E BRENDSHME (private per kete modul) ═══
var _kpAktiv = false;
var _kpPajisje = null;   // 'desktop' | 'mobile' | null (null = s'eshte prekur ende)
var _kpZgjedhur = null;  // {w,h} — permasa aktuale brenda editorit
var _kpLimits = null;    // cache nga /api/madhesia (standard/max/min per desktop+mobile)

// ═══ HTML-JA E LINKUT (thirret nga formaKreative() ne app.js) ═══
function krPermasaLinkHTML(){
  return '<a href="javascript:void(0)" onclick="krPermasaToggle()" '+
    'style="color:var(--acc);font-size:13px;display:inline-block;margin-top:6px;">Cakto madhësinë</a>'+
    '<div id="krPermasaEditor" style="display:none;margin-top:10px;"></div>';
}

// Pastron gjendjen — thirret nga formaKreative() sa here qe hapet forma nga e para,
// qe te mos mbeten permasa te zgjedhura nga nje krijim i meparshem.
function krPermasaReset(){
  _kpAktiv = false; _kpPajisje = null; _kpZgjedhur = null;
  var el = document.getElementById('krPermasaEditor');
  if(el){ el.style.display='none'; el.innerHTML=''; }
}

// ═══ HAPJA/MBYLLJA E EDITORIT ═══
async function krPermasaToggle(){
  var el = document.getElementById('krPermasaEditor');
  if(!el) return;
  if(_kpAktiv){ el.style.display='none'; _kpAktiv=false; return; }
  _kpAktiv = true;
  el.style.display='block';
  if(!_kpLimits){
    el.innerHTML = '<p class="small mut">Po ngarkoj kufijtë…</p>';
    try{ _kpLimits = await (await fetch('/api/madhesia')).json(); }
    catch(e){ el.innerHTML = '<p class="small">Gabim gjatë ngarkimit të kufijve.</p>'; return; }
  }
  krPermasaRenderZgjedhesin();
}

function krPermasaRenderZgjedhesin(){
  var el = document.getElementById('krPermasaEditor'); if(!el) return;
  el.innerHTML =
    '<p class="small mut" style="margin-bottom:8px;">⚠️ Zgjidh <b>VETËM NJË</b> — do të krijohet <b>një krijim i vetëm</b>, jo dy:</p>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px;">'+
      '<button type="button" class="btn" id="kpBtnDesktop" onclick="krPermasaZgjidhPajisjen(\'desktop\')">🖥️ Desktop</button>'+
      '<button type="button" class="btn" id="kpBtnMobile" onclick="krPermasaZgjidhPajisjen(\'mobile\')">📱 Mobile</button>'+
    '</div>'+
    '<div id="kpKanavasWrap"></div>'+
    '<p class="small mut" id="kpInfo" style="margin-top:8px;">Zgjidh Desktop ose Mobile për të filluar (standardi mbetet 210×261 nëse s\'e prek fare).</p>';
}

// ═══ ZGJEDHJA E PAJISJES (Desktop OSE Mobile — jo te dyja njekohesisht) ═══
function krPermasaZgjidhPajisjen(pajisje){
  _kpPajisje = pajisje;
  var dsk = document.getElementById('kpBtnDesktop'), mob = document.getElementById('kpBtnMobile');
  // I zgjedhuri theksohet plotesisht; tjetri zbehet (opacity) qe te jete e qarte
  // se VETEM njeri po perdoret — jo qe te dy jane "aktive" njekohesisht.
  if(dsk){ dsk.style.background = (pajisje==='desktop') ? 'var(--acc)' : ''; dsk.style.opacity = (pajisje==='desktop') ? '1' : '.45'; }
  if(mob){ mob.style.background = (pajisje==='mobile') ? 'var(--acc)' : ''; mob.style.opacity = (pajisje==='mobile') ? '1' : '.45'; }

  var maxW = pajisje==='desktop' ? _kpLimits.max_w : _kpLimits.m_max_w;
  var maxH = pajisje==='desktop' ? _kpLimits.max_h : _kpLimits.m_max_h;
  var minW = pajisje==='desktop' ? _kpLimits.min_w : _kpLimits.m_min_w;
  var minH = pajisje==='desktop' ? _kpLimits.min_h : _kpLimits.m_min_h;
  var standard = pajisje==='desktop' ? _kpLimits.standard : _kpLimits.m_standard;
  var std = String(standard||'210x261').split('x').map(Number);

  _kpZgjedhur = { w: std[0], h: std[1] };
  krPermasaRenderKanavasin(maxW, maxH, minW, minH);
}

// ═══ KATRORI I LEVIZSHEM/NDRYSHUESHEM (zvarritje me mouse) ═══
// Kanavasi — SAKTESISHT si sistemi ekzistues i snippet-it (madhKanavas): kutia e
// jashtme = permasa MAKSIMALE; brenda saj nje "kuti" me doreze zvarritje ne cep,
// PLUS fusha numrash per te shkruar direkt. Gjeresia dhe lartesia jane KREJT TE
// PAVARURA nga njera-tjetra — asnje raport i kyçur, secila kufizohet vetem nga
// min-max e VET (njesoj si madhKufizo() ne app.js).
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

// Kufizon w/h KREJT TE PAVARURA — njesoj si madhKufizo() ne app.js
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
  krPermasaPerditesoInfo(maxW, maxH, minW, minH);
}

function krPermasaPerditesoInfo(maxW, maxH, minW, minH){
  var info = document.getElementById('kpInfo'); if(!info) return;
  info.innerHTML = '✓ Do të krijohet <b>1 (një) krijim</b>, saktësisht <b>'+_kpZgjedhur.w+'×'+_kpZgjedhur.h+' px</b>  '+
    '(kufijtë e lejuara: '+minW+'–'+maxW+' × '+minH+'–'+maxH+' px)';
}

// Zvarritje e dorezes — pozicioni ABSOLUT i kursorit kundrejt kanavasit behet
// direkt w/h (njesoj si madhLidhTerheqjen() ne app.js), PA asnje raport te kycur.
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

// ═══ MERR PERMASEN PERFUNDIMTARE (thirret nga krGjenero() ne app.js) ═══
// Nese klienti s'e ka prekur fare "Cakto madhesine" (asnje pajisje e zgjedhur),
// kthen standardin Desktop (210x261), siç u kerkua.
async function krPermasaMerrZgjedhurin(){
  if(_kpZgjedhur && _kpPajisje) return _kpZgjedhur;
  try{
    var l = _kpLimits || await (await fetch('/api/madhesia')).json();
    var std = String(l.standard||'210x261').split('x').map(Number);
    return { w: std[0], h: std[1] };
  }catch(e){ return { w: 210, h: 261 }; }
}
