// connect.js — mekanizmi i lidhjes: zgjedhësi i formatit + snippet-i (i ndarë, thirret nga kudo)

const FORMATS = [
  { k:'auto',        l:'Auto',        d:'mbush hapësirën', w:96, h:36, dashed:true },
  { k:'rectangle',   l:'Rectangle',   d:'~300×250',        w:70, h:58 },
  { k:'leaderboard', l:'Leaderboard', d:'~728×90',         w:104, h:14 },
  { k:'skyscraper',  l:'Skyscraper',  d:'~300×600',        w:30, h:74 }
];

function snippetKod(){
  const fmt = window.__fmt || 'auto';
  const attr = (fmt && fmt!=='auto') ? ' data-format="'+fmt+'"' : '';
  return '<script src="'+location.origin+'/imyr.js" data-key="'+((une&&une.celes)||'')+'"'+attr+'></'+'script>';
}

// Ndërton UI-në e lidhjes: zgjedhësi i formatit → pastaj kodi (thirret nga wizard-i ose kudo)
function connectUI(el){
  el.innerHTML=
    '<div class="small" style="margin-bottom:6px;">1) Zgjidh formatin e hapësirës:</div>'+
    '<div class="fmtgrid" id="fmtGrid"></div>'+
    '<div id="snipZone" class="hide">'+
      '<div class="small" style="margin-bottom:6px;">2) Kopjo kodin dhe vendose te faqja jote (p.sh. te footer-i):</div>'+
      '<textarea class="kod" id="kodBox" readonly></textarea>'+
      '<div class="rowbtn"><button class="btn cta" id="cbtn" onclick="kopjo()">Kopjo</button></div>'+
      '<div id="afterCopy" class="hide">'+
        '<div class="small" style="margin-top:12px;">Pasi ta ruash te faqja jote, shkruaj URL-në ku e vendose dhe hape për të konfirmuar lidhjen.</div>'+
        '<label>URL-ja e faqes</label><input id="hapUrl" value="'+(((une&&une.website)||'')).replace(/"/g,"&quot;")+'" placeholder="https://faqja-ime.com">'+
        '<button class="primary" id="hbtn" onclick="hapDheVerifiko()">Hap faqen dhe konfirmo →</button>'+
        '<div class="status wait hide" id="statusLine"></div>'+
      '</div>'+
    '</div>';
  renderFmt();
  if(window.__fmt){ showSnip(); }   // nëse tashmë ka format të zgjedhur (rikthim)
}

function renderFmt(){
  const g=$('fmtGrid'); if(!g) return; g.innerHTML='';
  FORMATS.forEach(f=>{
    const sel = window.__fmt===f.k;
    const d=document.createElement('div');
    d.className='fmt'+(sel?' sel':'');
    d.innerHTML=
      '<div class="prev"><div class="shape" style="width:'+f.w+'px;height:'+f.h+'px;'+(f.dashed?'border-style:dashed;':'')+'"></div></div>'+
      '<div class="lbl">'+f.l+'</div><div class="dim">'+f.d+'</div>';
    d.onclick=()=>selectFormat(f.k);
    g.appendChild(d);
  });
}
function selectFormat(k){ window.__fmt=k; renderFmt(); showSnip(); }
function showSnip(){
  const z=$('snipZone'); if(!z) return;
  z.classList.remove('hide');
  $('kodBox').value = snippetKod().replace(/</g,'&lt;');
  if(prog && prog.lidhja){
    $('afterCopy').classList.remove('hide');
    $('statusLine').classList.remove('hide'); $('statusLine').textContent='✓ E lidhur.';
  }
}

function kopjo(){
  const t=$('kodBox'); t.select(); t.setSelectionRange(0,99999);
  try{document.execCommand('copy');}catch(e){}
  $('cbtn').textContent='U kopjua ✓'; setTimeout(()=>$('cbtn').textContent='Kopjo',1500);
  $('afterCopy').classList.remove('hide');
}
function hapDheVerifiko(){
  let url=($('hapUrl').value||'').trim(); if(!url){ $('hapUrl').focus(); return; }
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  window.open(url,'_blank');
  $('statusLine').classList.remove('hide'); $('statusLine').innerHTML='⏳ Po pres sinjalin e lidhjes…';
  startPolling(window.__onLidhur);
}
function startPolling(onLidhur){
  if(pollTimer) clearInterval(pollTimer);
  const tick=async()=>{
    try{
      const st=await(await fetch('/api/kontrollo')).json();
      if(st.active){
        clearInterval(pollTimer); pollTimer=null;
        if($('statusLine')){ $('statusLine').className='status'; $('statusLine').innerHTML='✓ U lidh me sukses!'; }
        await refreshProg();
        if(typeof onLidhur==='function') onLidhur();
      }
    }catch(e){}
  };
  tick(); pollTimer=setInterval(tick,6000);
}
