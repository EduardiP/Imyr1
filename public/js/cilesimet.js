// cilesimet.js — Seksioni i plotë 'Cilësimet' (Account, Ad Delivery → Hosting, Advertising).
// I ndarë nga app.js që të mos rritet pafund. Presupozon core.js ($, esc, une, segVal, segHTML,
// segPick) dhe app.js (nav, applyState, stepPershkrimi, logjikaHTML, esc) të ngarkuara para tij.

var _cilTab='account'; // 'account' | 'hosting' | 'advertising'
var _cilOpenKey=null;   // 'delivery' kur "Ad Delivery" eshte hapur si dropdown

var CIL_ICONS = {
  account:  '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  delivery: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  kufizimetKat: '<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>'
};
var CIL_STRUKTURA=[
  { k:'account', l:'Account' },
  { k:'delivery', l:'Ad Delivery', subs:[
    { k:'hosting', l:'Hosting' },
    { k:'advertising', l:'Advertising' }
  ]},
  { k:'kufizimetKat', l:'Kufizimet e Kategorive' }
];

function renderCilesimetNav(){
  const el=$('snav'); if(!el) return;
  el.innerHTML='';
  CIL_STRUKTURA.forEach(function(n){
    const hasSubs = n.subs && n.subs.length;
    const eshteAktiv=(n.k==='account' && _cilTab==='account')||(n.k==='delivery' && (_cilTab==='hosting'||_cilTab==='advertising'))||(n.k==='kufizimetKat' && curNav==='kufizimetKat');
    const b=document.createElement('button');
    b.type='button';
    b.className='snItem'+(eshteAktiv?' active':'');
    b.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(CIL_ICONS[n.k]||'')+'</svg>'+
      '<span class="snLbl" style="flex:1;">'+esc(n.l)+'</span>'+
      (hasSubs ? '<svg class="snChev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:0 0 auto;transition:transform .15s;transform:rotate('+(_cilOpenKey===n.k?'90':'0')+'deg);"><polyline points="9 18 15 12 9 6"/></svg>' : '');
    if(hasSubs){
      b.onclick=function(e){ e.stopPropagation(); _cilOpenKey = (_cilOpenKey===n.k) ? null : n.k; renderCilesimetNav(); };
    } else if(n.k==='kufizimetKat'){
      b.onclick=function(){ nav({v:'profile', nav:'kufizimetKat'}); };
    } else {
      b.onclick=function(){ cilShkoTek(n.k); };
    }
    el.appendChild(b);
    if(hasSubs){
      const subWrap=document.createElement('div');
      subWrap.className='snSubs'+(_cilOpenKey===n.k?' open':'');
      n.subs.forEach(function(s){
        const sb=document.createElement('button');
        sb.type='button';
        sb.className = (_cilTab===s.k) ? 'active' : '';
        sb.textContent=s.l;
        sb.onclick=function(){ cilShkoTek(s.k); };
        subWrap.appendChild(sb);
      });
      el.appendChild(subWrap);
    }
  });
}

function hapCilesimet(){
  const s={v:'profile', nav:'cilesimet'};
  history.pushState(s, '', '/cilesimet');
  applyState(s);
}
function mainCilesimet(m){
  window.__pamjeVecante=true;
  m.innerHTML='<div id="cilBody"></div>';
  cilShkoTek(_cilTab);
}
function cilShkoTek(tab){
  _cilTab=tab; renderCilesimetNav();
  const body=$('cilBody'); if(!body) return;
  if(tab==='account') return cilAccount(body);
  if(tab==='hosting') return adDelHosting(body);
  if(tab==='advertising') return adDelAdvertising(body);
}
function cilAccount(body){
  body.innerHTML='<h2 class="h">Account</h2>'+
    '<div class="card" id="cl_pershkrimi_wrap"></div>';
  stepPershkrimi($('cl_pershkrimi_wrap'));
}

// ═══ HOSTING — dy nivele zgjedhjeje: (1) mode automatik/manual, (2) nese manual → vec e vec / te-gjitha ═══
var _hostMode='automatik'; // 'automatik' (i rekomanduar) | 'manual'
var _hostMenyra='vecmas'; // 'vecmas' | 'te-gjitha' — vetem kur _hostMode==='manual'
var _hostCache=null; // { mode, menyra, barazi_perqindje, snippetet:[{id,emri,barazi_perqindje}] }

async function adDelHosting(body){
  body.innerHTML='<h2 class="h">Hosting</h2>'+
    '<p class="small mut" style="margin:4px 0 16px;">Zgjidh si do të vendoset shpërndarja e reklamave në snippet-et e tua.</p>'+
    '<div id="hostModeWrap" style="margin-bottom:18px;"></div>'+
    '<div id="hostManualWrap"></div>'+
    '<button class="btn" onclick="hostRuaj()" style="margin-top:16px;">Ruaj</button>'+
    '<span class="small" id="hostRuajMsg" style="margin-left:10px;"></span>';
  try{ _hostCache = await (await fetch('/api/hosting/cilesimet')).json(); }
  catch(e){ _hostCache = { mode:'automatik', menyra:'te-gjitha', barazi_perqindje:50, snippetet:[] }; }
  _hostMode   = (_hostCache && _hostCache.mode)   || 'automatik';
  _hostMenyra = (_hostCache && _hostCache.menyra) || 'te-gjitha';
  hostRenderMode();
  await hostRenderManual();
}

function hostRenderMode(){
  var el=$('hostModeWrap'); if(!el) return;
  function opt(v, titull, pershkrim, isRecommended){
    var sel = _hostMode===v;
    var badge = isRecommended ? '<span style="background:var(--acc);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;margin-left:8px;">REKOMANDUAR</span>' : '';
    return '<label onclick="hostZgjidhMode(\''+v+'\')" style="display:block;cursor:pointer;padding:14px;border:1px solid '+(sel?'var(--acc)':'var(--line)')+';border-radius:8px;margin-bottom:8px;background:'+(sel?'rgba(59,130,246,0.08)':'transparent')+';">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<span style="width:16px;height:16px;border-radius:50%;border:2px solid '+(sel?'var(--acc)':'var(--mut)')+';display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;">'+
          (sel?'<span style="width:8px;height:8px;border-radius:50%;background:var(--acc);"></span>':'')+
        '</span>'+
        '<span style="font-weight:600;">'+titull+'</span>'+badge+
      '</div>'+
      '<div class="small mut" style="margin-top:6px;margin-left:26px;">'+pershkrim+'</div>'+
    '</label>';
  }
  el.innerHTML=
    opt('automatik','Automatik','Sistemi vendos vetë ekuilibrin optimal Ankand↔Balancë për çdo snippet, bazuar në aktivitetin e biznesit tënd.',true)+
    opt('manual','Manual','Cakto vetë përqindjen Ankand/Balancë — për të gjithë snippet-et bashkë, ose veç e veç për secilin.',false);
}

function hostZgjidhMode(v){
  _hostMode=v;
  hostRenderMode();
  hostRenderManual();
}

async function hostRenderManual(){
  var el=$('hostManualWrap'); if(!el) return;
  if(_hostMode==='automatik'){
    el.innerHTML='';
    return;
  }
  // Mode = manual → shfaq strukturen ekzistuese (nenzgjedhja + sliderat)
  el.innerHTML=
    '<div style="margin-top:8px;padding:16px;border:1px solid var(--line);border-radius:8px;background:#0a0d12;">'+
      '<label>Si do t\'i caktosh përqindjet manualisht?</label>'+
      '<select id="hostMenyra" onchange="hostNdryshoMenyren(this.value)" style="width:100%;max-width:320px;padding:9px;background:#0e1116;border:1px solid var(--line);border-radius:8px;color:var(--txt);margin-top:6px;">'+
        '<option value="vecmas">Snippet veç e veç</option>'+
        '<option value="te-gjitha">Të gjithë snippet-et</option>'+
      '</select>'+
      '<div id="hostPercentazhet" style="margin-top:20px;"></div>'+
    '</div>';
  var sel=$('hostMenyra'); if(sel) sel.value=_hostMenyra;
  await hostRenderPercentazhet();
}
function hostNdryshoMenyren(v){ _hostMenyra=v; hostRenderPercentazhet(); }
function hostSliderHTML(id, ankandFillestar){
  ankandFillestar = ankandFillestar==null ? 50 : ankandFillestar;
  return '<div style="margin-top:6px;">'+
    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">'+
      '<span>Ankand: <b id="'+id+'_ankand_v">'+ankandFillestar+'%</b></span>'+
      '<span>Balancë: <b id="'+id+'_bal_v">'+(100-ankandFillestar)+'%</b></span>'+
    '</div>'+
    '<input type="range" min="0" max="100" value="'+ankandFillestar+'" id="'+id+'" style="width:100%;" oninput="hostSliderNdrysho(\''+id+'\', this.value)">'+
  '</div>';
}
function hostSliderNdrysho(id, v){
  v=parseInt(v,10);
  var a=$(id+'_ankand_v'), b=$(id+'_bal_v');
  if(a) a.textContent=v+'%';
  if(b) b.textContent=(100-v)+'%';
}
async function hostRenderPercentazhet(){
  var el=$('hostPercentazhet'); if(!el) return;
  if(_hostMenyra==='te-gjitha'){
    var baraziRuajtur = (_hostCache && _hostCache.barazi_perqindje!=null) ? _hostCache.barazi_perqindje : 50;
    el.innerHTML='<div class="card">'+hostSliderHTML('host_te_gjitha', 100-baraziRuajtur)+'</div>';
    return;
  }
  el.innerHTML='<p class="small mut">Po ngarkoj snippet-et…</p>';
  try{
    var r=await (await fetch('/api/snippetet')).json();
    var lista=r.snippetet||[];
    if(!lista.length){ el.innerHTML='<p class="small mut">Ende s\'ke snippet-e.</p>'; return; }
    var ruajtura = (_hostCache && _hostCache.snippetet) || [];
    el.innerHTML=lista.map(function(sn){
      var id='host_sn_'+sn.id;
      var rj = ruajtura.filter(function(x){ return x.id===sn.id; })[0];
      var baraziV = rj ? rj.barazi_perqindje : 50;
      return '<div class="card" style="margin-bottom:12px;">'+
        '<div style="font-weight:600;margin-bottom:4px;">'+esc(sn.emri||('Snippet #'+sn.id))+'</div>'+
        hostSliderHTML(id, 100-baraziV)+
      '</div>';
    }).join('');
  }catch(e){ el.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function hostRuaj(){
  var msg=$('hostRuajMsg');
  var payload={ mode:_hostMode };
  if(_hostMode==='manual'){
    payload.menyra=_hostMenyra;
    if(_hostMenyra==='te-gjitha'){
      var inp=$('host_te_gjitha');
      var ankandV = inp ? parseInt(inp.value,10) : 50;
      payload.barazi_perqindje = 100-ankandV;
    } else {
      var lista=[];
      document.querySelectorAll('#hostPercentazhet input[type="range"]').forEach(function(inp){
        var sid=parseInt(inp.id.replace('host_sn_',''),10);
        var ankandV=parseInt(inp.value,10);
        if(sid) lista.push({ id:sid, barazi_perqindje:100-ankandV });
      });
      payload.snippetet=lista;
    }
  }
  try{
    var r=await (await fetch('/api/hosting/ruaj',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json();
    if(r.error){ if(msg){ msg.style.color='var(--err)'; msg.textContent=r.error; } return; }
    if(msg){ msg.style.color='var(--good)'; msg.textContent='✓ U ruajt.'; }
  }catch(e){ if(msg){ msg.style.color='var(--err)'; msg.textContent='Gabim: '+e.message; } }
}

// ═══ ADVERTISING — ende bosh ═══
function adDelAdvertising(body){
  body.innerHTML='<h2 class="h">Advertising</h2><p class="small mut" style="margin-top:8px;">Së shpejti.</p>';
}
async function ruajLogjikaCilesime(){
  const v = segVal('cl_logjika')||'ankand';
  const msg = $('cl_logjika_msg');
  const btn = $('cl_logjika_btn');
  if(btn) btn.disabled=true;
  try{
    const r = await (await fetch('/api/logjika-shperndarjes',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({logjika_shperndarjes:v})})).json();
    if(r.error){ if(msg){msg.style.color='var(--err)';msg.textContent=r.error;} if(btn) btn.disabled=false; return; }
    if(une) une.logjika_shperndarjes=v;
    if(msg){ msg.style.color='var(--good)'; msg.textContent='✓ U ruajt.'; }
  }catch(e){ if(msg){msg.style.color='var(--err)';msg.textContent='Gabim: '+e.message;} }
  if(btn) btn.disabled=false;
}
