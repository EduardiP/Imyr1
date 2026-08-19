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
  if(dsk) dsk.style.background = (pajisje==='desktop') ? 'var(--acc)' : '';
  if(mob) mob.style.background = (pajisje==='mobile') ? 'var(--acc)' : '';

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
function krPermasaRenderKanavasin(maxW, maxH, minW, minH){
  var wrap = document.getElementById('kpKanavasWrap'); if(!wrap) return;
  var SCALE = 0.8; // shkalle vizuale — kutia e jashtme perfaqeson permasen MAKSIMALE te snippet-it
  var outerW = Math.round(maxW*SCALE), outerH = Math.round(maxH*SCALE);
  wrap.innerHTML =
    '<div style="position:relative;width:'+outerW+'px;height:'+outerH+'px;border:1px dashed var(--line);border-radius:6px;background:#0e1116;">'+
      '<div id="kpKatrori" style="position:absolute;top:0;left:0;background:rgba(59,130,246,.25);'+
        'border:2px solid var(--acc);border-radius:4px;cursor:nwse-resize;box-sizing:border-box;"></div>'+
    '</div>';
  krPermasaVendosKatrorin(SCALE, maxW, maxH, minW, minH);
  krPermasaLidhZvarritjen(SCALE, maxW, maxH, minW, minH);
}

function krPermasaVendosKatrorin(scale, maxW, maxH, minW, minH){
  var k = document.getElementById('kpKatrori'); if(!k) return;
  k.style.width  = Math.round(_kpZgjedhur.w*scale)+'px';
  k.style.height = Math.round(_kpZgjedhur.h*scale)+'px';
  krPermasaPerditesoInfo(maxW, maxH, minW, minH);
}

function krPermasaPerditesoInfo(maxW, maxH, minW, minH){
  var info = document.getElementById('kpInfo'); if(!info) return;
  info.textContent = 'Përmasa e zgjedhur: '+_kpZgjedhur.w+'×'+_kpZgjedhur.h+' px  '+
    '(kufijtë: '+minW+'–'+maxW+' × '+minH+'–'+maxH+' px)';
}

// Zvarritje e cepit poshte-djathtas — ruan raportin origjinal te standardit,
// dhe kufizohet qe TE PAKTEN NJERA ane (gjeresi OSE lartesi) te mos e kaloje
// maksimumin (siç u konfirmua: perputhje 100% me njerën, tjetra rrjedh nga raporti).
function krPermasaLidhZvarritjen(scale, maxW, maxH, minW, minH){
  var k = document.getElementById('kpKatrori'); if(!k) return;
  var raporti = _kpZgjedhur.w / _kpZgjedhur.h;
  var duke = false;
  k.onmousedown = function(e){
    duke = true; e.preventDefault();
    var fillimX = e.clientX;
    var fillimW = _kpZgjedhur.w;
    function levizja(ev){
      if(!duke) return;
      var dx = (ev.clientX - fillimX) / scale;
      var neW = Math.max(minW, fillimW + dx);
      var neH = neW / raporti;
      if(neW > maxW){ neW = maxW; neH = neW/raporti; }
      if(neH > maxH){ neH = maxH; neW = neH*raporti; }
      if(neH < minH){ neH = minH; neW = neH*raporti; }
      _kpZgjedhur = { w: Math.round(neW), h: Math.round(neH) };
      krPermasaVendosKatrorin(scale, maxW, maxH, minW, minH);
    }
    function ndalo(){
      duke = false;
      document.removeEventListener('mousemove', levizja);
      document.removeEventListener('mouseup', ndalo);
    }
    document.addEventListener('mousemove', levizja);
    document.addEventListener('mouseup', ndalo);
  };
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
