// cilesimet.js — Seksioni i plotë 'Cilësimet' (Account, Ad Delivery → Hosting, Advertising).
// I ndarë nga app.js që të mos rritet pafund. Presupozon core.js ($, esc, une, segVal, segHTML,
// segPick) dhe app.js (nav, applyState, stepPershkrimi, logjikaHTML, esc) të ngarkuara para tij.

var _cilTab='account'; // 'account' | 'hosting' | 'advertising'
var _cilOpenKey=null;   // 'delivery' kur "Ad Delivery" eshte hapur si dropdown

var CIL_STRUKTURA=[
  { k:'account', l:'Account' },
  { k:'delivery', l:'Ad Delivery', subs:[
    { k:'hosting', l:'Hosting' },
    { k:'advertising', l:'Advertising' }
  ]}
];

function renderCilesimetNav(){
  const el=$('snav'); if(!el) return;
  const snav2=$('snav2'); if(snav2) snav2.innerHTML=''; // fshi mbetjet e vjetra te NAV2, s'duhet te shfaqet ketu
  el.innerHTML='';
  const header=document.createElement('div');
  header.style.cssText='padding:8px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);';
  header.textContent='Cilësimet';
  el.appendChild(header);

  CIL_STRUKTURA.forEach(function(n){
    const b=document.createElement('button');
    b.type='button';
    b.style.cssText='display:flex;align-items:center;justify-content:space-between;width:100%;';
    const lbl=document.createElement('span'); lbl.textContent=n.l; b.appendChild(lbl);
    const eshteAktiv=(n.k==='account' && _cilTab==='account')||(n.k==='delivery' && (_cilTab==='hosting'||_cilTab==='advertising'));
    if(eshteAktiv) b.classList.add('active');

    if(n.subs && n.subs.length){
      const arrow=document.createElement('span');
      arrow.textContent=(_cilOpenKey===n.k)?'▾':'▸';
      arrow.style.cssText='margin-left:8px;font-size:11px;color:var(--mut);';
      b.appendChild(arrow);
      b.onclick=function(e){
        e.stopPropagation();
        if(_cilOpenKey===n.k){ mbyllCilDropdown(); }
        else { hapCilDropdown(n, b); }
      };
    } else {
      b.onclick=function(){ mbyllCilDropdown(); cilShkoTek(n.k); };
    }
    el.appendChild(b);
  });
}
function mbyllCilDropdown(){
  const dd=$('cilDropdown'); if(dd) dd.remove();
  if(_cilOpenKey){ _cilOpenKey=null; renderCilesimetNav(); }
}
function hapCilDropdown(n, btn){
  const dd0=$('cilDropdown'); if(dd0) dd0.remove();
  _cilOpenKey=n.k;
  const dd=document.createElement('div');
  dd.id='cilDropdown';
  dd.style.cssText='position:fixed;width:200px;background:var(--card);border:1px solid var(--line);border-radius:0;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:9999;';
  n.subs.forEach(function(s){
    const sb=document.createElement('button');
    sb.type='button';
    sb.textContent=s.l;
    sb.style.cssText='display:block;width:100%;background:none;border:none;padding:9px 10px;cursor:pointer;font-family:inherit;font-size:13px;border-radius:6px;text-align:left;color:var(--txt);';
    sb.addEventListener('click', function(e){
      e.stopPropagation();
      mbyllCilDropdown();
      cilShkoTek(s.k);
    });
    dd.appendChild(sb);
  });
  document.body.appendChild(dd);
  const rect=btn.getBoundingClientRect();
  dd.style.left=(rect.right+8)+'px';
  dd.style.top=rect.top+'px';
  renderCilesimetNav();
}
document.addEventListener('click', function(){ mbyllCilDropdown(); });

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
    '<div class="card" style="margin:14px 0 16px;">'+
      logjikaHTML('cl_logjika', une && une.logjika_shperndarjes)+
      '<button class="btn" id="cl_logjika_btn" onclick="ruajLogjikaCilesime()" style="margin-top:10px;">Ruaj</button>'+
      '<span class="small" id="cl_logjika_msg" style="margin-left:10px;"></span>'+
    '</div>'+
    '<div class="card" id="cl_pershkrimi_wrap"></div>';
  stepPershkrimi($('cl_pershkrimi_wrap'));
}

// ═══ HOSTING — struktura (pa funksion real ende) ═══
var _hostMenyra='vecmas'; // 'vecmas' (parazgjedhur) | 'te-gjitha'
var _hostCache=null; // { menyra, barazi_perqindje, snippetet:[{id,emri,barazi_perqindje}] } — nga /api/hosting/cilesimet
async function adDelHosting(body){
  body.innerHTML='<h2 class="h">Hosting</h2>'+
    '<label style="margin-top:14px;">Si do t\'i caktosh përqindjet e shpërndarjes?</label>'+
    '<select id="hostMenyra" onchange="hostNdryshoMenyren(this.value)" style="width:100%;max-width:320px;padding:9px;background:#0e1116;border:1px solid var(--line);border-radius:8px;color:var(--txt);">'+
      '<option value="vecmas">Snippet veç e veç</option>'+
      '<option value="te-gjitha">Të gjithë snippet-et</option>'+
    '</select>'+
    '<div id="hostPercentazhet" style="margin-top:20px;"></div>'+
    '<button class="btn" onclick="hostRuaj()" style="margin-top:16px;">Ruaj</button>'+
    '<span class="small" id="hostRuajMsg" style="margin-left:10px;"></span>';
  try{ _hostCache = await (await fetch('/api/hosting/cilesimet')).json(); }
  catch(e){ _hostCache = { menyra:'te-gjitha', barazi_perqindje:50, snippetet:[] }; }
  _hostMenyra = (_hostCache && _hostCache.menyra) || 'te-gjitha';
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
  var payload={ menyra:_hostMenyra };
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
