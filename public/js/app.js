// app.js — PAS HYRJES: home + dashboard/profili + wizard-i me hapa

// Mat lartesine reale te .topbar dhe e vendos si ndryshore CSS, qe .sidebar te dije
// saktesisht sa hapesire te ze poshte tij (jo 100vh fiks, qe shkaktonte mbivendosje).
(function(){
  function vendosLartesineTopbar(){
    const tb=document.querySelector('.topbar');
    if(tb) document.documentElement.style.setProperty('--topbar-h', tb.offsetHeight+'px');
  }
  vendosLartesineTopbar();
  window.addEventListener('resize', vendosLartesineTopbar);
  window.addEventListener('load', vendosLartesineTopbar);
})();

const NAV2 = [
  { k:'dashboard', l:'Dashboard' },
  { k:'snippetet', l:'Hapësira e reklamave', subs:[
    {l:'Hapësirat e mia', nav:'snippetet'},
    {l:'Cakto madhësinë', nav:'madhesiaShumefishte'}
  ]},
  { k:'kreative', l:'Creative', subs:[
    {l:'Krijo', nav:'kreative', tab:'krijo'},
    {l:'Krijimet e mia', nav:'kreative', tab:'lista'}
  ]},
  { k:'reklamat', l:'My Ads', subs:[
    {l:'Krijo', nav:'reklamat', sub:'create'},
    {l:'Reklamat', nav:'reklamat'},
    {l:'Performanca', nav:'rekPerformanca'}
  ]},
  { k:'konvertimet', l:'Konvertimet' },
  { k:'kufizimetKat', l:'Kufizimet e Kategorive' },
  { k:'analytics', l:'Analytics', subs:[
    {l:'Trafiku', nav:'anaTrafiku'},
    {l:'Automatiku', nav:'anaAutomatik'},
    {l:'Deficiti', nav:'anaDeficiti'}
  ]},
  { k:'insights', l:'Vështrime', subs:[
    {l:'Pika AI & kombinimet kryesore', nav:'insights'},
    {l:'Faza e ndihmës', nav:'insights'},
    {l:'Shëndeti i reklamave', nav:'insights'}
  ]}
];
var _nav2OpenKey = null; // cila kategori NAV2 ka panelin e nenkategorive te hapur (vetem nje njekohesisht)

function renderNav2(){
  let wrap=$('snav2');
  if(!wrap){
    wrap=document.createElement('nav'); wrap.id='snav2'; wrap.className='snav';
    wrap.style.cssText='margin-top:6px;';
    const s1=$('snav'); if(s1 && s1.parentNode) s1.parentNode.insertBefore(wrap, s1.nextSibling);
  }
  wrap.innerHTML='';
  NAV2.forEach(function(n){
    const b=document.createElement('button');
    b.type='button';
    b.style.cssText='display:flex;align-items:center;justify-content:space-between;width:100%;';
    const lbl=document.createElement('span'); lbl.textContent=n.l; b.appendChild(lbl);
    if(n.subs && n.subs.length){
      const arrow=document.createElement('span');
      arrow.textContent = (_nav2OpenKey===n.k) ? '▾' : '▸';
      arrow.style.cssText='margin-left:8px;font-size:11px;color:var(--mut);';
      b.appendChild(arrow);
      b.onclick=function(e){
        e.stopPropagation();
        if(_nav2OpenKey===n.k){ mbyllNav2Dropdown(); }
        else { hapNav2Dropdown(n, b); }
      };
    } else {
      b.onclick=function(){ mbyllNav2Dropdown(); nav({v:'profile', nav:n.k}); };
    }
    wrap.appendChild(b);
  });
}

// Nenkategorite shfaqen si PANEL PLUSKUES (tabelë), jo zgjerim brenda listës —
// njësoj si userMenuDropdown (renderUserMenu): position:fixed, pozicionuar me
// getBoundingClientRect(), mbyllet kur klikon jashtë.
function mbyllNav2Dropdown(){
  const dd=$('nav2Dropdown'); if(dd) dd.remove();
  if(_nav2OpenKey){ _nav2OpenKey=null; renderNav2(); }
}
function hapNav2Dropdown(n, btn){
  const dd0=$('nav2Dropdown'); if(dd0) dd0.remove();
  _nav2OpenKey=n.k;

  const dd=document.createElement('div');
  dd.id='nav2Dropdown';
  dd.style.cssText='position:fixed;width:200px;background:var(--card);border:1px solid var(--line);border-radius:0;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:9999;';
  n.subs.forEach(function(s){
    const sb=document.createElement('button');
    sb.type='button';
    sb.textContent=s.l;
    sb.style.cssText='display:block;width:100%;background:none;border:none;padding:9px 10px;cursor:pointer;font-family:inherit;font-size:13px;border-radius:6px;text-align:left;color:var(--txt);';
    sb.addEventListener('click', function(e){
      e.stopPropagation();
      mbyllNav2Dropdown();
      if(s.akcion && typeof window[s.akcion]==='function'){ window[s.akcion](); return; }
      nav({v:'profile', nav:s.nav||n.k, tab:s.tab, sub:s.sub});
    });
    dd.appendChild(sb);
  });
  document.body.appendChild(dd);

  const rect=btn.getBoundingClientRect();
  dd.style.left=(rect.right+8)+'px';
  dd.style.top=rect.top+'px';

  renderNav2(); // rifresko shigjetën (▾) e butonit te hapur
}
document.addEventListener('click', function(){ mbyllNav2Dropdown(); });


// ---------- HOME ----------
function renderHome(){
  const b=$('homeBody');
  b.innerHTML='<div style="text-align:center;padding:48px 0;">'+
    '<h1 style="color:var(--acc);letter-spacing:.06em;margin:0;">Mirë se erdhe!</h1>'+
    '<p class="small" id="homeHi" style="font-size:15px;"></p></div>';
  $('homeHi').textContent = une.emri;
}

function mainInsights(m){
  m.innerHTML='<h2 class="h">Insights</h2>'+
    '<p class="small" style="margin:8px 0 16px;">Statistika agregate nga motori AI.</p>'+
    '<div class="card"><p class="small mut">Kjo veçori vjen së shpejti.</p></div>';
}

async function ngarkoHtml5(){
  const titull=($('up_title')||{}).value||'';
  const link=($('up_link')||{}).value||'';
  const msg=$('up_msg');
  if(!link.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos linkun e destinacionit.';} return; }
  const f=($('up_file')||{}).files ? $('up_file').files[0] : null;
  const crId=($('up_creative_id')||{}).value||'';
  if(!f && !crId){ if(msg){msg.className='msg err';msg.textContent='Ngarko një skedar ose zgjidh nga Creative-t.';} return; }
  if(f && f.size > 200*1024){ if(msg){msg.className='msg err';msg.textContent='Skedari e kalon 200 KB.';} return; }
  $('up_btn').disabled=true;
  try{
    const fd=new FormData();
    fd.append('titull', titull);
    fd.append('link', link);
    if(crId){ fd.append('creative_id', crId); }
    else if(f){ fd.append('file', f); }
    const r=await (await fetch('/api/reklama/html5',{method:'POST',body:fd})).json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} $('up_btn').disabled=false; return; }
    if(msg){msg.className='msg ok';msg.textContent='✓ HTML5 u shtua.';}
    setTimeout(()=>nav({v:'profile',nav:'reklamat'}),800);
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} $('up_btn').disabled=false; }
}

async function ngarkoVideo(){
  const titull=($('up_title')||{}).value||'';
  const link=($('up_link')||{}).value||'';
  const video=($('up_video')||{}).value||'';
  const msg=$('up_msg');
  if(!link.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos linkun e destinacionit.';} return; }
  if(!video.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos linkun e YouTube.';} return; }
  $('up_btn').disabled=true;
  try{
    const r=await (await fetch('/api/reklama/video',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({titull, link, youtube:video})})).json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} $('up_btn').disabled=false; return; }
    if(msg){msg.className='msg ok';msg.textContent='✓ Video u shtua.';}
    setTimeout(()=>nav({v:'profile',nav:'reklamat'}),800);
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} $('up_btn').disabled=false; }
}


async function ruajPershkrim(){
  $('e_next').disabled=true;
  try{
    const perm=$('e_perm').value.trim();
    const rikombinim = !!window.__pamjeVecante;   // vetem Cilesimet/Dashboard-standalone, jo wizard-i i pare
    const r=await(await fetch('/api/permbledhje',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({permbledhje:perm, rikombinim})})).json();
    une.permbledhje=perm;
    window.__permOrig=perm;
    const msg=$('e_msg');
    if(rikombinim && r.kombinim===false && r.arsyeja==='snippet'){
      if(msg){ msg.className='msg err'; msg.textContent="U ruajt, por studimi AI u pengua sepse s'keni një snippet reklamë aktive (për shfaqjen e reklamave të të tjerëve)."; }
    } else {
      if(msg){ msg.className='msg ok'; msg.textContent='✓ U ruajt.'; }
    }
  }catch(e){ $('e_msg').className='msg err'; $('e_msg').textContent='Gabim: '+e.message; }
  $('e_next').disabled=true;
}

// ---------- LLOJET E REKLAMES (Image / Video / HTML5) ----------
const AD_TYPES = [
  { k:'image', l:'Image', d:'JPG / PNG / GIF' },
  { k:'video', l:'Video', d:'MP4' },
  { k:'html5', l:'HTML5', d:'.zip interaktiv' }
];
function adTypeUI(el){
  el.innerHTML=''+
    '<div id="adTypeGrid" style="display:flex;gap:10px;flex-wrap:wrap;"></div>'+
    '<div class="small" id="adTypeNote" style="margin-top:12px;"></div>';
  renderAdTypes();
}
function renderAdTypes(){
  const g=$('adTypeGrid'); if(!g) return; g.innerHTML='';
  AD_TYPES.forEach(t=>{
    const sel=window.__adType===t.k;
    const b=document.createElement('button');
    b.style.cssText='flex:1;min-width:120px;padding:16px 12px;border-radius:10px;cursor:pointer;background:#0e1116;color:var(--txt);'+
      'border:1px solid '+(sel?'#3b82f6':'var(--line)')+';'+(sel?'box-shadow:0 0 0 1px #3b82f6;':'');
    b.innerHTML='<div style="font-weight:600;font-size:15px;">'+t.l+'</div><div style="font-size:12px;color:var(--mut);margin-top:4px;">'+t.d+'</div>';
    b.onclick=()=>{ nav({v:'profile', nav:'reklamat', sub:'create', format:t.k}); };
    g.appendChild(b);
  });
}

// funksioni i ngarkimit ngarkimit video 
function ngarkoVideoUI(){
  const m=$('mainPanel');
  m.innerHTML=
    '<h2 class="h">Shto video</h2>'+
    '<p class="small" style="margin:2px 0 14px;">Video duhet të jetë në YouTube. Vendos linkun — reklama shfaqet si video, dhe klikimi çon te destinacioni.</p>'+
    '<label>Titulli (opsional)</label><input id="up_title" placeholder="Emri i reklamës">'+
    '<label style="margin-top:12px;">Linku i destinacionit *</label>'+
    '<input id="up_link" placeholder="https://faqja-ime.com/oferta" inputmode="url">'+
    '<div class="small mut" style="margin-top:3px;">Ku çohet vizitori kur klikon reklamën (dhe ku matet konvertimi).</div>'+
    '<label style="margin-top:12px;">Linku i videos (YouTube) *</label>'+
    '<input id="up_video" placeholder="https://www.youtube.com/watch?v=..." inputmode="url">'+
    '<div class="small mut" style="margin-top:3px;">Kopjo linkun e videos nga YouTube.</div>'+
    '<div id="up_prev" style="margin-top:12px;"></div>'+
    '<button class="primary" id="up_btn" onclick="ngarkoVideo()" style="margin-top:14px;">Shto →</button>'+
    '<div class="msg" id="up_msg"></div>';
  $('up_video').addEventListener('blur', function(){
    const id=nxjerrYtId(this.value);
    if(id) $('up_prev').innerHTML='<img src="https://img.youtube.com/vi/'+id+'/hqdefault.jpg" style="max-width:260px;border-radius:10px;border:1px solid var(--line);">';
  });
}

function nxjerrYtId(url){
  const m=String(url||'').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : '';
}

async function ngarkoVideo(){
  const titull=($('up_title')||{}).value||'';
  const link=($('up_link')||{}).value||'';
  const video=($('up_video')||{}).value||'';
  const msg=$('up_msg');
  if(!link.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos linkun e destinacionit.';} return; }
  const ytId=nxjerrYtId(video);
  if(!ytId){ if(msg){msg.className='msg err';msg.textContent='Linku i YouTube s\'është i vlefshëm.';} return; }
  $('up_btn').disabled=true;
  try{
    const r=await (await fetch('/api/reklama/video',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({titull, link, youtube_id:ytId, logjika_shperndarjes:(window.__llogariaModaliteti||'ankand')})})).json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} $('up_btn').disabled=false; return; }
    if(msg){msg.className='msg ok';msg.textContent='✓ Video u shtua.';}
    setTimeout(()=>nav({v:'profile',nav:'reklamat'}),800);
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} $('up_btn').disabled=false; }
}

//funksioni per HTML5
function ngarkoHtml5UI(){
  const m=$('mainPanel');
  m.innerHTML=
    '<h2 class="h">Ngarko HTML5</h2>'+
    '<p class="small" style="margin:2px 0 14px;">Ngarko një skedar .htm ose .zip (max 200 KB), ose merr nga Creative-t e mia.</p>'+
    '<label>Titulli (opsional)</label><input id="up_title" placeholder="Emri i reklamës">'+
    '<label style="margin-top:12px;">Linku i destinacionit *</label>'+
    '<input id="up_link" placeholder="https://faqja-ime.com/oferta" inputmode="url">'+
    '<div class="small mut" style="margin-top:3px;">Ku çohet vizitori kur klikon reklamën (dhe ku matet konvertimi).</div>'+
    '<label style="margin-top:12px;">Përmbajtja</label>'+
    '<div class="small mut" style="margin-top:3px;">Ku çohet vizitori kur klikon reklamën (dhe ku matet konvertimi).</div>'+
    // PARALAJMERIMI I RI:
    '<div class="html5Paralajmerim">'+
      '<b>⚠️ Përpara se të ngarkosh:</b>'+
      '<ul style="margin:8px 0 0;padding-left:18px;line-height:1.7;">'+
        '<li>Madhësia e skedarit: <b>max 200 KB</b>.</li>'+
        '<li>Përmasat: brenda <b>260×290px</b> (desktop) dhe <b>320×400px</b> (mobile).</li>'+
        '<li>Bëje <b>fleksibël (responsiv)</b> — të përshtatet me hapësira të ndryshme pa u prishur. Përdor përqindje dhe clamp(), jo px fikse.</li>'+
        '<li>Sa më i vogël dhe fleksibël, aq më shumë vende fiton.</li>'+
      '</ul>'+
    '</div>'+
    '<label style="margin-top:12px;">Përmbajtja</label>'+
    '<div class="upDy">'+
      '<label class="upBtn upBtnFile">📁 Choose file'+
        '<input type="file" id="up_file" accept=".htm,.html,.zip" style="display:none;">'+
      '</label>'+
      '<button type="button" class="upBtn upBtnCreative" onclick="hapCreativeBallon()">✨ Nga Creative-t e mia</button>'+
    '</div>'+
    '<div id="up_prev" style="margin-top:12px;"></div>'+
    '<input type="hidden" id="up_creative_id">'+
    '<button class="primary" id="up_btn" onclick="ngarkoHtml5()" style="margin-top:14px;">Ngarko →</button>'+
    '<div class="msg" id="up_msg"></div>';
  $('up_file').addEventListener('change', function(){
    const f=this.files[0]; if(!f) return;
    if(f.size > 200*1024){
      $('up_msg').className='msg err';
      $('up_msg').textContent='Skedari është '+Math.round(f.size/1024)+' KB. Maksimumi është 200 KB.';
      this.value=''; return;
    }
    $('up_msg').textContent='';
    $('up_creative_id').value='';
    $('up_prev').innerHTML='<div class="small">📄 '+f.name+' ('+Math.round(f.size/1024)+' KB)</div>';
  });
}

async function ngarkoHtml5(){
  const link=($('up_link')||{}).value||'';
  const msg=$('up_msg');
  if(!link.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos linkun e destinacionit.';} return; }
  const f=($('up_file')||{}).files ? $('up_file').files[0] : null;
  const crId=($('up_creative_id')||{}).value||'';
  if(!f && !crId){ if(msg){msg.className='msg err';msg.textContent='Ngarko një skedar ose zgjidh nga Creative-t.';} return; }
  if(msg){msg.className='msg ok';msg.textContent='✓ Gati për ngarkim (backend-i i html5 vjen së shpejti).';}
  // TODO: dërgo skedarin te serveri (multipart) ose crId te /api/reklama/html5
}


async function hapCreativetPerReklame(){
  try{
    const r = await (await fetch('/api/kreative/gati')).json();
    const bd = $('backdrop') || document.body;
    if(!r.kreative || !r.kreative.length){
      bd.innerHTML = '<div class="modal card"><button class="x" onclick="mbyllCrModal()">×</button>'+
        '<h3 style="margin:0 0 10px;">S\'ke Creative të krijuara</h3>'+
        '<p class="small mut">Krijo një reklamë me AI, dhe pastaj mund ta përdorësh këtu.</p>'+
        '<button class="btn cta" style="margin-top:12px;" onclick="mbyllCrModal();nav({v:\'profile\',nav:\'kreative\'})">Krijo tani</button></div>';
      if(bd.classList) bd.classList.remove('hide');
      return;
    }
    const grid = r.kreative.map(k =>
      '<div class="krPick" onclick="zgjidhCreativePerReklame('+k.id+')">'+
        '<div class="krPickPrev">'+(k.output_url ? '<img src="'+k.output_url+'">' : '📄')+'</div>'+
        '<div style="padding:8px;"><b>'+krEsc(k.emri)+'</b><div class="small mut">'+krEsc(k.lloji)+'</div></div>'+
      '</div>').join('');
    bd.innerHTML = '<div class="modal card" style="max-width:640px;"><button class="x" onclick="mbyllCrModal()">×</button>'+
      '<h3 style="margin:0 0 14px;">Zgjidh nga Creative-t e mia</h3>'+
      '<div class="krPickGrid">'+grid+'</div></div>';
    if(bd.classList) bd.classList.remove('hide');
  }catch(e){}
}
function zgjidhCreativePerReklame(id){ console.log('U zgjodh #'+id); mbyllCrModal(); }
function mbyllCrModal(){ const b=$('backdrop'); if(b){ b.classList.add('hide'); b.innerHTML=''; } }

function ngarkoImazhUI(){
  const m=$('mainPanel');
  m.innerHTML=
    '<h2 class="h">Ngarko imazhin</h2>'+
    '<p class="small" style="margin:2px 0 14px;">Zgjidh një imazh nga laptopi ose nga Creative-t e krijuara me AI.</p>'+
    '<label>Titulli (opsional)</label><input id="up_title" placeholder="Emri i reklamës">'+
    '<label style="margin-top:12px;">Linku i destinacionit *</label>'+
    '<input id="up_link" placeholder="https://faqja-ime.com/oferta" inputmode="url">'+
    '<div class="small mut" style="margin-top:3px;">Ku çohet vizitori kur klikon reklamën (dhe ku matet konvertimi).</div>'+
    '<label style="margin-top:12px;">Përmbajtja</label>'+
    '<div class="upDy">'+
      '<label class="upBtn upBtnFile">📁 Choose file'+
        '<input type="file" id="up_file" accept="image/*" style="display:none;">'+
      '</label>'+
      '<button type="button" class="upBtn upBtnCreative" onclick="hapCreativeBallon()">✨ Nga Creative-t e mia</button>'+
    '</div>'+
    '<div id="up_prev" style="margin-top:12px;"></div>'+
    '<input type="hidden" id="up_creative_id">'+
    '<button class="primary" id="up_btn" onclick="ngarkoImazh()" style="margin-top:14px;">Ngarko →</button>'+
    '<div class="msg" id="up_msg"></div>';
  $('up_file').addEventListener('change', function(){
    const f=this.files[0]; if(!f) return;
    $('up_creative_id').value='';  // fshi zgjedhjen nga Creative — nje reklame ka vetem nje permbajtje
    $('up_prev').innerHTML='<img src="'+URL.createObjectURL(f)+'" style="max-width:220px;border-radius:10px;border:1px solid var(--line);">';
  });
}

async function hapCreativeBallon(){
  const bd=$('backdrop'); if(!bd) return;
  try{
    const r=await (await fetch('/api/kreative/gati')).json();
    if(!r.kreative || !r.kreative.length){
      bd.innerHTML='<div class="modal card"><button class="x" onclick="mbyllCreativeBallon()">×</button>'+
        '<h3 style="margin:0 0 10px;">S\'ke Creative të krijuara</h3>'+
        '<p class="small mut">Krijo një reklamë me AI, pastaj mund ta përdorësh këtu.</p>'+
        '<button class="btn cta" style="margin-top:12px;" onclick="mbyllCreativeBallon();nav({v:\'profile\',nav:\'kreative\'})">Krijo tani</button></div>';
      bd.classList.remove('hide'); return;
    }
    const grid=r.kreative.map(k=>
      '<div class="krPick" onclick="zgjidhCreative('+k.id+',\''+encodeURIComponent(k.output_url||'')+'\',\''+krEsc(k.emri)+'\')">'+
        '<div class="krPickPrev">'+(k.output_url?'<img src="'+k.output_url+'">':'📄')+'</div>'+
        '<div style="padding:8px;"><b>'+krEsc(k.emri)+'</b><div class="small mut">'+krEsc(k.lloji)+'</div></div>'+
      '</div>').join('');
    bd.innerHTML='<div class="modal card" style="max-width:560px;"><button class="x" onclick="mbyllCreativeBallon()">×</button>'+
      '<h3 style="margin:0 0 14px;">Nga Creative-t e mia</h3>'+
      '<div class="krPickGrid">'+grid+'</div></div>';
    bd.classList.remove('hide');
  }catch(e){}
}

function zgjidhCreative(id, urlEnc, emri){
  const url=decodeURIComponent(urlEnc||'');
  const idF=$('up_creative_id'); if(idF) idF.value=id;
  const fileF=$('up_file'); if(fileF) fileF.value='';   // fshi file-in — nje permbajtje e vetme
  const prev=$('up_prev');
  if(prev) prev.innerHTML = url
    ? '<img src="'+url+'" style="max-width:220px;border-radius:10px;border:1px solid var(--line);"><div class="small mut" style="margin-top:4px;">'+emri+'</div>'
    : '<div class="small">'+emri+'</div>';
  mbyllCreativeBallon();
}
function mbyllCreativeBallon(){ const b=$('backdrop'); if(b){ b.classList.add('hide'); b.innerHTML=''; } }


async function ngarkoImazh(){
  const f=$('up_file').files[0];
  if(!f){ $('up_msg').className='msg err'; $('up_msg').textContent='Zgjidh një imazh.'; return; }
  let link=($('up_link').value||'').trim();
  if(!link){ $('up_msg').className='msg err'; $('up_msg').textContent='Fut linkun e destinacionit.'; $('up_link').focus(); return; }
  if(!/^https?:\/\//i.test(link)) link='https://'+link;
  $('up_btn').disabled=true; $('up_msg').className='msg'; $('up_msg').innerHTML='<span class="spin"></span> Po ngarkoj…';
  try{
    const fd=new FormData(); fd.append('file', f); fd.append('titulli', ($('up_title').value||'').trim()); fd.append('link', link); fd.append('logjika_shperndarjes', window.__llogariaModaliteti||'ankand');
    const r=await(await fetch('/api/ngarko',{method:'POST',body:fd})).json();
    if(r.error){ $('up_msg').className='msg err'; $('up_msg').textContent=r.error; $('up_btn').disabled=false; return; }
    window.__reklamat=null;
    await refreshProg();
    nav({v:'profile',nav:'reklamat'});
  }catch(e){ $('up_msg').className='msg err'; $('up_msg').textContent='Gabim: '+e.message; $('up_btn').disabled=false; }
}

// ---------- PROFILI / DASHBOARD ----------
function renderProfile(s){
  s = s || {};
  curNav = s.nav || 'dashboard';
  const oldCard = document.querySelector('.pcard');
  if(oldCard) oldCard.style.display='none';
  const snavEl=$('snav'); if(snavEl) snavEl.innerHTML='';
  renderUserMenu();
  if(curNav==='cilesimet') renderCilesimetNav(); else renderNav2();
  renderMain(s);
}
var _userMenuOpen=false;
document.addEventListener('click', function(){
  if(_userMenuOpen){ const dd=$('userMenuDropdown'); if(dd) dd.classList.add('hide'); _userMenuOpen=false; }
});
function renderUserMenu(){
  let foot=$('snavFoot');
  if(!foot){
    foot=document.createElement('div'); foot.id='snavFoot';
    foot.style.cssText='position:relative;';
    const hdr=$('hdrRight'); if(hdr) hdr.appendChild(foot);
  }
  const inic=((une&&une.emri)||'?').trim().charAt(0).toUpperCase();
  const avatarHTML = (une&&une.logo_url)
    ? '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex:0 0 auto;"><img src="'+esc(une.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
    : '<div style="width:32px;height:32px;border-radius:50%;background:var(--acc);color:#06121f;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex:0 0 auto;">'+esc(inic)+'</div>';
  foot.innerHTML =
    '<button type="button" id="userMenuBtn" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;padding:8px 4px;cursor:pointer;color:var(--txt);font-family:inherit;font-size:14px;text-align:left;">'+
      avatarHTML+
      '<span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc((une&&une.emri)||'')+'</span>'+
    '</button>'+
    '<div id="userMenuDropdown" class="hide" style="position:fixed;width:190px;background:var(--card);border:1px solid var(--line);border-radius:0;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:9999;"></div>';

  const items = [
    { l:'Profili',           fn:function(){ nav({v:'profile', nav:'profili'}); } },
    { l: (window.__llogariaModaliteti==='barazi' ? 'Switch to Auction Account' : 'Switch to Balance Account'),
      fn:function(){ switchLlogaria(); } },
    { l:'Ekipi & Rolet',     fn:function(){ hapEkipin(); } },
    { l:'Faturimi & Plani',  fn:function(){ nav({v:'profile', nav:'plani'}); } },
    { l:'Cilësimet',         fn:function(){ hapCilesimet(); } },
    { l:'Ndihmë & Suport',   fn:function(){ nav({v:'profile', nav:'suport'}); } },
    { l:'Dil',               fn:function(){ dil(); }, err:true }
  ];
  const dd=$('userMenuDropdown');
  dd.innerHTML = items.map(function(it,i){
    return '<button type="button" data-umi="'+i+'" style="display:block;width:100%;background:none;border:none;padding:9px 10px;cursor:pointer;font-family:inherit;font-size:13px;border-radius:6px;text-align:left;'+(it.err?'color:var(--err);':'color:var(--txt);')+'">'+it.l+'</button>';
  }).join('');
  Array.prototype.forEach.call(dd.querySelectorAll('button'), function(btn,i){
    btn.addEventListener('click', function(e){ e.stopPropagation(); dd.classList.add('hide'); _userMenuOpen=false; items[i].fn(); });
  });
  $('userMenuBtn').addEventListener('click', function(e){
    e.stopPropagation();
    _userMenuOpen=!_userMenuOpen;
    if(_userMenuOpen){
      const rect=this.getBoundingClientRect();
      dd.style.left=''; dd.style.bottom='';
      dd.style.right=(window.innerWidth-rect.right)+'px';
      dd.style.top=(rect.bottom+8)+'px';
    }
    dd.classList.toggle('hide', !_userMenuOpen);
  });
}
function renderMain(s){
  s = s || {};
  const m=$('mainPanel');
  if(curNav==='profili')    return s.edit ? profiliRenderEdit(m) : (window.__llogariaModaliteti==='barazi' ? mainProfiliBalance(m) : mainProfili(m));
  if(curNav==='cilesimet')  return mainCilesimet(m);
  if(curNav==='plani')      return mainPlani(m);
  if(curNav==='suport')     return mainSuport(m);
  if(curNav==='njoftimet')  return mainNjoftimet(m);
  if(curNav==='konvertimi') return mainKonvertimi(m);
  if(curNav==='konvertimet') return mainKonvertimi(m);
  if(curNav==='kufizimetKat') return mainKufizimetKategori(m);
  if(curNav==='lidhjaSnippet') return mainLidhjaSnippet(m);
  if(curNav==='biznesi')    return mainBiznesi(m);
  if(curNav==='ekipi')      return mainEkipi(m);
  if(curNav==='pershkrimi') return mainPershkrimi(m);
  if(curNav==='lidhja')     return mainLidhja(m);
  if(curNav==='snippetet')  return mainSnippetet(m, s);
  if(curNav==='madhesiaShumefishte') return mainMadhesiaShumefishte(m);
  if(curNav==='snippetStats')  return mainSnippetStatistikat(m);
  if(curNav==='rekPerformanca')  return mainRekPerformanca(m);
  if(curNav==='anaTrafiku')  return mainAnaTrafiku(m);
  if(curNav==='anaAutomatik')  return mainAnaAutomatik(m);
  if(curNav==='anaDeficiti')  return mainAnaDeficiti(m);
  if(curNav==='anaReklamat')  return mainAnaReklamat(m);
  if(curNav==='anaSnippetet')  return mainAnaSnippetet(m);
  if(curNav==='anaDhenie')  return mainAnaDhenie(m);
  if(curNav==='anaMarrje')  return mainAnaMarrje(m);
  if(curNav==='dashboard')  return mainDashboard(m);
  if(curNav==='kreative')   return mainKreative_NEW(m, s);
  if(curNav==='reklamat')   return mainReklamat(m, s);
  if(curNav==='analytics')  return mainAnalytics(m);
  if(curNav==='dashboard2')   return mainDashboard(m);
  if(curNav==='adspace2')     return mainSnippetet(m, s);
  if(curNav==='kreative2')    return mainKreative_NEW(m, s);
  if(curNav==='reklamat2')    return mainReklamat(m, s);
  if(curNav==='konvertimet2') return mainKonvertimi(m);
  if(curNav==='analytics2')   return mainAnalytics(m);
  if(curNav==='insights2')    return mainInsights(m);
}
async function mainProfili(m){
  m.innerHTML='<p class="small">Po ngarkoj…</p>';
  let d={};
  try{ d=await(await fetch('/api/profili')).json(); }catch(e){ m.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; return; }
  window.__profiliCache = d;
  profiliRenderPamje(m, d);
}
function profiliRenderPamje(m, d){
  const inic=(d.emri||'?').trim().charAt(0).toUpperCase();
  const avatarHTML = d.logo_url
    ? '<div class="avatar" style="overflow:hidden;"><img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
    : '<div class="avatar">'+esc(inic)+'</div>';
  const tipiTekst = d.tipi==='b2b'?'Bizneseve (B2B)':(d.tipi==='b2c'?'Individëve (B2C)':'Të dyjave');
  const konvMini =
    '<div class="miniStat"><div class="mv">'+(d.pike?d.pike.konvertime:0)+'</div><div class="small">konvertime → '+(d.pike?d.pike.pike_nga_konvertimet:0)+' pikë</div><div class="small mut">(1 konvertim = 1 pikë)</div></div>';
  m.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:6px;flex-wrap:wrap;">'+
      '<div style="display:flex;align-items:center;gap:16px;">'+
        avatarHTML+
        '<div><div style="font-size:20px;font-weight:700;">'+esc(d.emri||'')+'</div>'+
          '<div class="small">'+esc(d.email||'')+'</div>'+
          '<div class="small">Audienca: '+tipiTekst+'</div></div>'+
      '</div>'+
      '<button class="btn" onclick="profiliHapEdit()">Edit Profile</button>'+
    '</div>'+
    '<div class="pikeCard">'+
      '<div class="pikeNr">'+(d.pike_profili||0)+'</div>'+
      '<div class="small">pikë profili</div>'+
    '</div>'+
    '<h3 class="h" style="font-size:16px;margin:22px 0 4px;">Nga faqja jote (kontributi)</h3>'+
    '<div style="display:flex;gap:10px;margin:8px 0 4px;flex-wrap:wrap;">'+
      '<div class="miniStat"><div class="mv">'+(d.pike?d.pike.shfaqje:0)+'</div><div class="small">shfaqje → '+(d.pike?d.pike.pike_nga_shfaqjet:0)+' pikë</div><div class="small mut">('+(d.pike?d.pike.rate:0)+' shfaqje = 1 pikë)</div></div>'+
      konvMini+
    '</div>'+
    '<p class="small mut" style="margin:6px 0 18px;">Pikët e profilit rrisin sa shpesh shfaqet reklama jote te rrjeti. Mblidhen nga shfaqjet dhe konvertimet që sjell faqja jote.</p>';
}
function profiliHapEdit(){
  nav({v:'profile', nav:'profili', edit:true});
}
async function profiliRenderEdit(m){
  let d=window.__profiliCache;
  if(!d){ try{ d=await(await fetch('/api/profili')).json(); window.__profiliCache=d; }catch(e){ d={}; } }
  m.innerHTML=
    '<h2 class="h">Të dhënat e biznesit tënd</h2>'+
    '<label>Emri i biznesit (SaaS-it)</label><input id="pe_emri" placeholder="Biznesi im" value="'+esc(d.emri||'')+'">'+
    '<label>Logo (opsionale)</label>'+
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">'+
      '<div id="pe_logoPrev" class="avatar" style="width:52px;height:52px;font-size:22px;overflow:hidden;">'+(d.logo_url?'<img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;">':esc((d.emri||'?').charAt(0).toUpperCase()))+'</div>'+
      '<label class="btn" style="cursor:pointer;margin:0;">Ngarko<input type="file" id="pe_logo" accept="image/*" onchange="profiliNgarkoLogo(this)" style="display:none;"></label>'+
    '</div>'+
    '<label>Faqja (website)</label><input id="pe_web" placeholder="https://saasi-im.com" value="'+esc(d.website||'')+'">'+
    segHTML('pe_tipi')+
    '<button class="primary" id="pe_btn" onclick="profiliRuaj()" style="margin-top:14px;">Ruaj →</button>'+
    '<div class="msg" id="pe_msg"></div>';
  if(d.tipi){ const btn=document.querySelector('#pe_tipi button[data-v="'+d.tipi+'"]'); if(btn) segPick(btn); }
}
async function profiliNgarkoLogo(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  const fd=new FormData(); fd.append('file', f);
  try{
    const r=await(await fetch('/api/ngarko-logo',{method:'POST',body:fd})).json();
    if(r.url){
      if(window.__profiliCache) window.__profiliCache.logo_url=r.url;
      if(une) une.logo_url=r.url;
      const prev=$('pe_logoPrev'); if(prev) prev.innerHTML='<img src="'+r.url+'" style="width:100%;height:100%;object-fit:cover;">';
    }
  }catch(e){}
}
async function profiliRuaj(){
  const emri=($('pe_emri').value||'').trim();
  const web=($('pe_web').value||'').trim();
  const tipi=segVal('pe_tipi');
  const msg=$('pe_msg');
  if(!emri){ msg.className='msg err'; msg.textContent='Shkruaj emrin e biznesit.'; return; }
  if(!web){ msg.className='msg err'; msg.textContent='Shkruaj adresën e faqes.'; return; }
  if(!tipi){ msg.className='msg err'; msg.textContent='Zgjidh kujt i shërben platforma.'; return; }
  $('pe_btn').disabled=true;
  try{
    const r=await(await fetch('/api/biz-baza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({emri,website:web,tipi})})).json();
    if(r.error){ msg.className='msg err'; msg.textContent=r.error; $('pe_btn').disabled=false; return; }
    if(une){ une.emri=emri; une.website=web; une.tipi=tipi; }
    window.__profiliCache=null;   // detyro rifreskim te dhenash kur kthehet
    history.back();
  }catch(e){ msg.className='msg err'; msg.textContent='Gabim: '+e.message; $('pe_btn').disabled=false; }
}
async function mainNjoftimet(m){
  m.innerHTML='<h2 class="h">Njoftime</h2><div id="njLista" style="margin-top:12px;"><p class="small">Po ngarkoj…</p></div>';
  try{
    const r=await(await fetch('/api/njoftimet')).json();
    const nj=r.njoftimet||[];
    const el=$('njLista');
    if(!nj.length){ el.innerHTML='<p class="small">S\'ke njoftime të reja.</p>'; return; }
    let h='';
    nj.forEach(x=>{
      if(x.nga_admin){
        const btn = x.veprim
          ? '<button class="njBtn" onclick="event.stopPropagation();njAdminButon('+x.id+',\''+x.veprim+'\')">'+esc(x.veprim_label||'Hap')+'</button>'
          : '<div class="njGo" onclick="event.stopPropagation();njAdminMbyll('+x.id+')" style="cursor:pointer;">Shëno si të lexuar ✓</div>';
        h+='<div class="njCard njAdmin">'+
           '<div class="njT">📢 '+esc(x.titull)+'</div>'+
           '<div class="njX">'+esc(x.teksti)+'</div>'+btn+'</div>';
      } else {
        h+='<div class="njCard" onclick="njVeprim(\''+x.veprim+'\')">'+
           '<div class="njT">'+esc(x.titull)+'</div>'+
           '<div class="njX">'+esc(x.teksti)+'</div>'+
           '<div class="njGo">Rregulloje →</div></div>';
      }
    });
    el.innerHTML=h;
  }catch(e){ $('njLista').innerHTML='<p class="small">Gabim.</p>'; }
}
function mainDashboard(m){
  if(window.__llogariaModaliteti==='barazi') return mainDashboardBalance(m);
  m.innerHTML='<h2 class="h">Statusi i llogarisë</h2>'+
    '<p class="small" style="margin:2px 0 18px;">Këto tregojnë çfarë është gati dhe çfarë jo. Kliko një rresht për ta plotësuar.</p>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;">'+
      '<div class="card" style="flex:0 0 auto;">'+
        '<div class="vstep" id="vstep" style="display:flex;flex-direction:column;"></div>'+
      '</div>'+
      '<div class="card" id="dashAnalitika" style="flex:1;min-width:280px;cursor:pointer;">'+
        '<p class="small">Po ngarkoj…</p>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" id="dashReklamat" style="flex:1.6;min-width:300px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Reklamat</h3>'+
        '<div id="dashReklamatList"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
      '<div class="card" id="dashKategori" style="flex:1;min-width:220px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Kategoritë e bizneseve</h3>'+
        '<p class="small mut" style="margin:0 0 10px;">Ku janë ngarkuar reklamat tuaja.</p>'+
        '<div style="position:relative;margin-bottom:12px;">'+
          '<button type="button" id="dashKatRekBtn" class="btn" style="width:100%;">Reklamat <span id="dashKatRekBtnCount"></span> ▾</button>'+
          '<div id="dashKatRekDropdown" class="hide" style="position:absolute;top:110%;left:0;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<div id="dashKategoriLista" style="max-height:140px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
        '<button class="btn" style="width:100%;margin-top:12px;" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'analytics\'})">Shiko më shumë →</button>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" id="dashSnippetet2" style="flex:1;min-width:220px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Snippet-et e reklamave</h3>'+
        '<div id="dashSnippetet2List"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
      '<div class="card" id="dashKonvertimet" style="flex:1.6;min-width:300px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Gjurmimi i konvertimeve</h3>'+
        '<div id="dashKonvertimetList"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
    '</div>';
  renderDashStatus();
  ngarkoDashAnalitika();
  ngarkoDashReklamat();
  ngarkoDashSnippetet();
  ngarkoDashKonvertimet();
  ngarkoDashKategori();
}
async function ngarkoDashReklamat(){
  const card=$('dashReklamat'), el=$('dashReklamatList');
  if(card) card.onclick=()=>nav({v:'profile', nav:'reklamat'});
  if(!el) return;
  try{
    const rows=await(await fetch('/api/reklamat?logjika='+(window.__llogariaModaliteti||'ankand'))).json();
    if(!rows.length){ el.innerHTML='<button class="btn cta" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})">Krijo një reklamë →</button>'; return; }
    el.innerHTML = rows.map(r=>{
      const thumb = r.imazh_url
        ? '<img src="'+esc(r.imazh_url)+'" style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex:0 0 auto;">'
        : '<div style="width:34px;height:34px;border-radius:8px;background:#0e1116;border:1px solid var(--line);flex:0 0 auto;"></div>';
      const kaContent = !!(r.imazh_url || r.video_url || r.html5_url || r.teksti);
      let statusTxt, statusCol;
      if(r.pauzuar){ statusTxt='Pezulluar'; statusCol='var(--mut)'; }
      else if(kaContent){ statusTxt='Aktive'; statusCol='var(--good)'; }
      else { statusTxt='Pa lidhur'; statusCol='var(--mut)'; }
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #20262f;">'+
        thumb+
        '<span style="flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.emri)+'</span>'+
        '<span style="font-size:12px;color:'+statusCol+';flex:0 0 auto;">'+statusTxt+'</span>'+
      '</div>';
    }).join('');
  }catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; }
}
async function ngarkoDashSnippetet(){
  const c2=$('dashSnippetet2');
  if(c2) c2.onclick=()=>nav({v:'profile', nav:'snippetet'});
  try{
    const r=await(await fetch('/api/snippetet')).json();
    const rows=r.snippetet||[];
    renderDashSnippetList('dashSnippetet2List', rows);
  }catch(e){
    const b=$('dashSnippetet2List');
    if(b) b.innerHTML='<p class="small">Gabim.</p>';
  }
}
function renderDashSnippetList(elId, rows){
  const el=$(elId); if(!el) return;
  if(!rows.length){ el.innerHTML='<button class="btn cta" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'lidhjaSnippet\'})">Shto një snippet →</button>'; return; }
  el.innerHTML = rows.map(s=>{
    let statusTxt, statusCol;
    if(s.pauzuar){ statusTxt='Pezulluar'; statusCol='var(--mut)'; }
    else if(s.snippet_active){ statusTxt='Aktive'; statusCol='var(--good)'; }
    else { statusTxt='Palidhur'; statusCol='var(--mut)'; }
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #20262f;">'+
      '<span style="flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.emri||('Hapësira '+s.id))+'</span>'+
      '<span style="font-size:12px;color:'+statusCol+';flex:0 0 auto;">'+statusTxt+'</span>'+
    '</div>';
  }).join('');
}
async function ngarkoDashKonvertimet(){
  const card=$('dashKonvertimet'), el=$('dashKonvertimetList');
  if(card) card.onclick=()=>nav({v:'profile', nav:'konvertimi'});
  if(!el) return;
  try{
    const ku=await(await fetch('/api/konvertimet')).json();
    const kz=await(await fetch('/api/zonat')).json();
    const urlRows=(ku.konvertimet||[]).map(x=>({emri:x.url, lloji:'url', track_active:x.track_active, pauzuar:x.pauzuar}));
    const zonaRows=(kz.zonat||[]).map(x=>({emri:x.emri, lloji:'kod', track_active:x.track_active, pauzuar:x.pauzuar}));
    const rows=urlRows.concat(zonaRows);
    if(!rows.length){ el.innerHTML='<button class="btn cta" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'konvertimi\'})">Lidh konvertimet →</button>'; return; }
    el.innerHTML = rows.map(x=>{
      let statusTxt, statusCol;
      if(x.pauzuar){ statusTxt='Pezulluar'; statusCol='var(--mut)'; }
      else if(x.track_active){ statusTxt='Aktive'; statusCol='var(--good)'; }
      else { statusTxt='Palidhur'; statusCol='var(--mut)'; }
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #20262f;">'+
        '<span style="flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(x.emri||'—')+'</span>'+
        '<span style="font-size:11px;color:var(--mut);text-transform:uppercase;flex:0 0 auto;">'+(x.lloji==='url'?'URL':'Kod')+'</span>'+
        '<span style="font-size:12px;color:'+statusCol+';flex:0 0 auto;">'+statusTxt+'</span>'+
      '</div>';
    }).join('');
  }catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; }
}
// ================= DASHBOARD: Kategoritë e bizneseve (njësoj si tek Analytics, pa filtër date — 30 ditët e fundit) =================
var _dashKatSelectedAd=null, _dashKatRekAll=[], _dashKatDropdownOpen=false;
async function ngarkoDashKategori(){
  const btn=$('dashKatRekBtn'); if(!btn) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('dashKatRekDropdown'); if(!dd) return;
    _dashKatDropdownOpen=!_dashKatDropdownOpen;
    dd.classList.toggle('hide', !_dashKatDropdownOpen);
  });
  try{ _dashKatRekAll=await(await fetch('/api/reklamat')).json(); }catch(e){ _dashKatRekAll=[]; }
  dashKatRenderDropdown();
  dashKatNgarkoListen();
}
document.addEventListener('click', function(){
  const dd=$('dashKatRekDropdown');
  if(dd && _dashKatDropdownOpen){ dd.classList.add('hide'); _dashKatDropdownOpen=false; }
});
function dashKatRenderDropdown(){
  const dd=$('dashKatRekDropdown'); if(!dd) return;
  dd.innerHTML='';
  dd.appendChild(anaRekRresht('Të gjitha', !_dashKatSelectedAd, true, dashKatZgjidhTeGjitha));
  if(!_dashKatRekAll.length){ const p=document.createElement('p'); p.className='small mut'; p.style.padding='6px'; p.textContent="S'ke ende reklama."; dd.appendChild(p); dashKatUpdateBtnLabel(); return; }
  const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:4px 2px;'; dd.appendChild(hr);
  _dashKatRekAll.forEach(r=>{
    const thumb=anaRekThumbHTML(r);
    const html=thumb+'<span style="overflow:hidden;text-overflow:ellipsis;">'+esc(r.emri||('#'+r.id))+'</span>';
    dd.appendChild(anaRekRresht(html, _dashKatSelectedAd===r.id, false, function(){ dashKatZgjidhReklam(r.id); }));
  });
  dashKatUpdateBtnLabel();
}
function dashKatZgjidhTeGjitha(){ _dashKatSelectedAd=null; dashKatRenderDropdown(); dashKatNgarkoListen(); const dd=$('dashKatRekDropdown'); if(dd) dd.classList.add('hide'); _dashKatDropdownOpen=false; }
function dashKatZgjidhReklam(id){ _dashKatSelectedAd=id; dashKatRenderDropdown(); dashKatNgarkoListen(); const dd=$('dashKatRekDropdown'); if(dd) dd.classList.add('hide'); _dashKatDropdownOpen=false; }
function dashKatUpdateBtnLabel(){
  const el=$('dashKatRekBtnCount'); if(!el) return;
  el.textContent = _dashKatSelectedAd ? '(1)' : '';
}
async function dashKatNgarkoListen(){
  const el=$('dashKategoriLista'); if(!el) return;
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  const fmt=d=>{ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+dd; };
  let url='/api/analytics/kategorite?nga='+fmt(nga)+'&deri='+fmt(sot);
  if(_dashKatSelectedAd) url+='&reklama_ids='+_dashKatSelectedAd;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; return; }
  const kategorite=d.kategorite||[];
  if(!kategorite.length){ el.innerHTML='<p class="small mut">Asnjë kategori me të dhëna.</p>'; return; }
  el.innerHTML = kategorite.map(k=>{
    const tot={shfaqje:0,shikime:0,klikime:0,konvertime:0};
    k.pikat.forEach(p=>{ tot.shfaqje+=p.shfaqje; tot.shikime+=p.shikime; tot.klikime+=p.klikime; tot.konvertime+=p.konvertime; });
    return '<div style="padding:8px 0;border-bottom:1px solid #20262f;">'+
      '<div style="font-weight:600;font-size:12px;margin-bottom:4px;">'+esc(k.emri)+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--mut);">'+
        '<span>Shfaqje: <b style="color:var(--txt);">'+tot.shfaqje+'</b></span>'+
        '<span>Shikime: <b style="color:var(--txt);">'+tot.shikime+'</b></span>'+
        '<span>Klikime: <b style="color:var(--txt);">'+tot.klikime+'</b></span>'+
        '<span>Konvertime: <b style="color:var(--txt);">'+tot.konvertime+'</b></span>'+
      '</div>'+
    '</div>';
  }).join('');
}
async function ngarkoDashAnalitika(){
  const card=$('dashAnalitika'); if(!card) return;
  card.onclick=()=>nav({v:'profile', nav:'profili'});
  try{
    const d=await(await fetch('/api/profili')).json();
    const mm = d.marra || {shfaqje:0,klikime:0,konvertime:0};
    const inic=(d.emri||'?').trim().charAt(0).toUpperCase();
    const logoHTML = d.logo_url
      ? '<div style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex:0 0 auto;"><img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
      : '<div style="width:30px;height:30px;border-radius:50%;background:var(--acc);color:#06121f;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex:0 0 auto;">'+esc(inic)+'</div>';
    card.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="display:flex;align-items:center;gap:10px;width:fit-content;">'+
          logoHTML+
          '<div style="font-weight:700;font-size:15px;">'+esc(d.emri||'')+'</div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:130px;background:rgba(74,158,255,.12);border:1px solid var(--acc);border-radius:10px;padding:14px 16px;">'+
            '<div style="font-size:28px;font-weight:800;color:var(--acc);line-height:1;">'+(d.pike_profili||0)+'</div>'+
            '<div class="small" style="margin-top:4px;">pikë profili</div></div>'+
          '<div style="flex:1;min-width:130px;background:rgba(74,158,255,.12);border:1px solid var(--acc);border-radius:10px;padding:14px 16px;">'+
            '<div style="font-size:28px;font-weight:800;color:var(--acc);line-height:1;">'+(mm.konvertime||0)+'</div>'+
            '<div class="small" style="margin-top:4px;">konvertime</div></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:100px;background:#0e1116;border:1px solid var(--line);border-radius:9px;padding:8px 12px;opacity:.75;">'+
            '<div style="font-size:15px;font-weight:600;">'+(mm.shfaqje||0)+'</div>'+
            '<div class="small mut" style="font-size:11px;">shfaqje</div></div>'+
          '<div style="flex:1;min-width:100px;background:#0e1116;border:1px solid var(--line);border-radius:9px;padding:8px 12px;opacity:.75;">'+
            '<div style="font-size:15px;font-weight:600;">'+(mm.klikime||0)+'</div>'+
            '<div class="small mut" style="font-size:11px;">klikime</div></div>'+
        '</div>'+
      '</div>';
  }catch(e){ card.innerHTML='<p class="small">Gabim.</p>'; }
}
async function renderDashStatus(){
  const el=$('vstep'); if(!el) return; el.innerHTML='<p class="small mut">Po kontrolloj…</p>';
  let gjendjaKrijimi = 'asnje';
  try{
    const r = await (await fetch('/api/kreative/statusi-krijimit')).json();
    gjendjaKrijimi = r.gjendja || 'asnje';
  }catch(e){}
  el.innerHTML='';
  const rreshtat=[
    { done: !!prog.llogaria,   auto: !!prog.llogaria && !!prog.biznesiAuto, label:'Biznesi',             veprim:()=>nav({v:'profile',nav:'biznesi'}) },
    { done: !!prog.pershkrimi, auto: !!prog.pershkrimi && !!prog.pershkrimiAuto, label:'Përshkrimi',          veprim:()=>nav({v:'profile',nav:'pershkrimi'}) },
    { done: !!prog.lidhja,     label:'Lidhja e snippet-it', veprim:()=> prog.lidhja ? nav({v:'profile',nav:'snippetet'}) : nav({v:'profile',nav:'lidhjaSnippet'}) },
    { done: gjendjaKrijimi==='manual', auto: gjendjaKrijimi==='auto', label:'Krijo produkt', veprim:()=>nav({v:'profile',nav:'reklamat',sub:'create'}) },
    { done: !!prog.konvertimi, label:'Lidh konvertimin',    veprim:()=>nav({v:'profile',nav:'konvertimi'}) }
  ];
  rreshtat.forEach(r=>{
    const d=document.createElement('div');
    d.className='vs'+(r.auto?' auto':(r.done?' done':' click'));
    const shenja = r.auto ? '★' : (r.done ? '✓' : '+');
    const etiketa = r.auto ? ' — krijuar automatikisht, kliko për ta rregulluar' : (r.done ? '' : ' — plotëso');
    d.innerHTML='<span class="vd">'+shenja+'</span>'+
      '<span class="vl">'+r.label+etiketa+'</span>';
    if(!r.done || r.auto) d.onclick=r.veprim;
    el.appendChild(d);
  });
}
// Pamje te vecanta (jo wizard) — hapen nga Dashboard-i, gjithmone forma e plote
function mainBiznesi(m){
  window.__pamjeVecante=true;
  m.innerHTML='<h2 class="h" style="margin-bottom:4px;">Biznesi</h2>'+
    '<p class="small" style="margin:0 0 16px;">Të dhënat e biznesit tënd.</p>'+
    '<label>Emri i biznesit (SaaS-it)</label><input id="a_emri" placeholder="Biznesi im" value="'+esc((une&&une.emri)||'')+'">'+
    '<label>Logo (opsionale)</label>'+
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">'+
      '<div id="a_logoPrev" class="avatar" style="width:52px;height:52px;font-size:22px;overflow:hidden;">'+(((une&&une.logo_url))?'<img src="'+esc(une.logo_url)+'" style="width:100%;height:100%;object-fit:cover;">':esc(((une&&une.emri)||'?').charAt(0).toUpperCase()))+'</div>'+
      '<label class="btn" style="cursor:pointer;margin:0;">Ngarko<input type="file" id="a_logo" accept="image/*" onchange="ngarkoLogo(this)" style="display:none;"></label>'+
    '</div>'+
    '<label>Faqja (website)</label><input id="a_web" placeholder="https://saasi-im.com" value="'+esc((une&&une.website)||'')+'">'+
    segHTML('a_tipi')+
    '<button class="primary" id="a_btn" onclick="wizPlotesoBiz()">Ruaj →</button><div class="msg" id="a_msg"></div>';
  if(une&&une.tipi){ const btn=document.querySelector('#a_tipi button[data-v="'+une.tipi+'"]'); if(btn) segPick(btn); }
}
function mainPershkrimi(m){
  window.__pamjeVecante=true;
  m.innerHTML='<div id="pvBody"></div>';
  const b=document.getElementById('pvBody');
  if(b) stepPershkrimi(b);
}
// ═══ SNIPPET-ET (lista + krijim + detaje) ═══
var _snipAktiv = null;  // id i snippet-it te hapur (per caktimin e madhesise)
// mainSnippetStatistikat() — implementuar te analitika.js (ripërdor kategorite-dhene + Chart.js)
async function mainSnippetet(m, s){
  window.__pamjeVecante=true;
  s = s || {};
  if(s.sub==='detail' && s.id){ return snipDetaje(m, s.id); }
  // Lista
  m.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'+
    '<h2 class="h">Hapësira e reklamave</h2>'+
    '<button class="btn cta" onclick="snipKrijo()">Krijo +</button></div>'+
    '<p class="small" style="margin-bottom:14px;">Çdo hapësirë është një vend te faqja jote ku shfaqen reklamat. Krijo disa nëse vendos reklama në më shumë se një vend.</p>'+
    '<div id="snipLista"><p class="small">Po ngarkoj…</p></div>';
  ngarkoSnippetet();
}
async function ngarkoSnippetet(){
  const c=$('snipLista'); if(!c) return;
  try{
    const r=await(await fetch('/api/snippetet')).json();
    const lista=r.snippetet||[];
    if(!lista.length){ c.innerHTML='<p class="small">Ende s\'ka snippet.</p>'; return; }
    let h='<div class="rektbl">'+
      '<div class="rekhead" style="grid-template-columns:2fr 1fr 1fr auto auto auto;"><span>Emri</span><span>Statusi</span><span>Madhësia</span><span></span><span></span><span></span></div>';
    lista.forEach(sn=>{
      const status = sn.snippet_active ? '<span style="color:var(--good);">● I lidhur</span>' : '<span style="color:var(--mut);">○ Pa lidhur</span>';
      const tgl = '<label class="tgl" title="'+(sn.pauzuar?'I pauzuar':'Aktiv')+'"><input type="checkbox" '+(sn.pauzuar?'':'checked')+' onchange="snipPauza('+sn.id+',this.checked)"><span class="slider"></span></label>';
      h+='<div class="rekrow" style="grid-template-columns:2fr 1fr 1fr auto auto auto;align-items:center;" id="snipRow'+sn.id+'">'+
         '<span class="nm" id="snipEmri'+sn.id+'" onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+esc(sn.emri||'(Pa emër)')+'</span>'+
         '<span onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+status+'</span>'+
         '<span class="small" onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+esc(sn.madhesia_desktop||'—')+'</span>'+
         tgl+
         '<button class="btn" style="padding:5px 9px;" title="Ndrysho emrin" onclick="snipEmriEdito('+sn.id+',\''+esc((sn.emri||'').replace(/\x27/g,""))+'\')">✎</button>'+
         '<button class="btn" style="padding:5px 9px;" title="Fshi" onclick="snipKonfirmoFshi('+sn.id+',\''+esc((sn.emri||'').replace(/\x27/g,""))+'\','+(sn.snippet_active?1:0)+')">✕</button>'+
         '</div>';
    });
    h+='</div>';
    c.innerHTML=h;
  }catch(e){ c.innerHTML='<p class="small err">Gabim në ngarkim.</p>'; }
}

async function snipPauza(id, aktiv){
  const pauzuar = !aktiv;
  try{
    await fetch('/api/snippetet/'+id+'/pauza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pauzuar})});
    try{ await ngarkoNjoftimet(); }catch(e){}   // rifresko ziljen menjehere
  }catch(e){}
}

async function snipKrijo(){
  // Krijo menjEhere (pa emer) dhe hap detajet — emri vihet ne krye te asaj faqeje
  try{
    const r=await(await fetch('/api/snippetet',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
    if(r.id){ nav({v:'profile',nav:'snippetet',sub:'detail',id:r.id}); }
  }catch(e){}
}
async function snipKonfirmoFshi(id, emri, ishteLidhur){
  // Nese s'ka qene i lidhur ndonjehere → fshi menjehere
  if(!ishteLidhur){ snipFshi(id); return; }
  // Ishte i lidhur → gjurmo nese kodi eshte ende te faqja
  const c=$('snipLista');
  const stat=document.createElement('div');
  stat.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
  stat.innerHTML='<div style="background:var(--bg2,#161a22);border:1px solid var(--line);border-radius:12px;padding:22px;max-width:420px;margin:16px;text-align:center;"><span class="spin"></span> Po kontrolloj nëse kodi është ende te faqja jote…</div>';
  document.body.appendChild(stat);
  try{
    const r=await(await fetch('/api/snippetet/'+id+'/gjurmo')).json();
    stat.remove();
    if(r.gjendet){
      // Kodi eshte ende aty → mos e fshi, kerko ta heqe
      fshiDialogThjesht('Kodi i kësaj hapësire është ende te faqja jote. <b>Hiqe së pari kodin</b> ('+esc(emri||'')+') nga skedari i faqes, pastaj provo ta fshish sërish. Përndryshe reklama do të vazhdojë të shfaqet.');
    } else {
      // S'u gjet (ose s'u arrit faqja) → lejo fshirjen me konfirmim
      fshiDialog('Kodi s\'u gjet më te faqja. Do ta heqësh hapësirën <b>'+esc(emri||'')+'</b>?', ()=>snipFshi(id));
    }
  }catch(e){ stat.remove(); }
}
async function snipFshi(id){
  try{ await fetch('/api/snippetet/'+id,{method:'DELETE'}); }catch(e){}
  ngarkoSnippetet();
  try{ await refreshProg(); }catch(e){}
  try{ await ngarkoNjoftimet(); }catch(e){}
}
// Dialog vetem-informues (nje buton OK)
function fshiDialogThjesht(mesazhi){
  let d=$('fshiModal');
  if(!d){ d=document.createElement('div'); d.id='fshiModal'; document.body.appendChild(d); }
  d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
  d.innerHTML='<div style="background:var(--bg2,#161a22);border:1px solid var(--line);border-radius:12px;padding:22px;max-width:420px;margin:16px;">'+
    '<div style="font-weight:600;font-size:16px;margin-bottom:10px;">Hiq kodin së pari</div>'+
    '<p class="small" style="margin:0 0 18px;">'+mesazhi+'</p>'+
    '<div style="display:flex;justify-content:flex-end;"><button class="btn" onclick="fshiMbyll()">E kuptova</button></div></div>';
}
function snipEmriEdito(id, emriAktual){
  const span=$('snipEmri'+id); if(!span) return;
  span.innerHTML='<input id="snipEmriEdit'+id+'" value="'+esc(emriAktual)+'" style="width:70%;"> '+
    '<button class="btn" style="padding:3px 8px;" onclick="snipEmriRuaj('+id+')">✓</button>';
  const inp=$('snipEmriEdit'+id); if(inp){ inp.focus(); inp.onkeydown=(e)=>{ if(e.key==='Enter') snipEmriRuaj(id); if(e.key==='Escape') ngarkoSnippetet(); }; }
}
async function snipEmriRuaj(id){
  const emri=(($('snipEmriEdit'+id)||{}).value||'').trim();
  if(!emri){ ngarkoSnippetet(); return; }
  try{ await fetch('/api/snippetet/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({emri})}); }catch(e){}
  ngarkoSnippetet();
}
// Butoni i suportit Claude (implementimi i kodit) — hapesire qe hapet mes Kopjo dhe URL
function vizatoClaudeSuport(id){
  const box=$('claudeSuport'+id); if(!box) return;
  const idArg = isNaN(id) ? "'"+id+"'" : id;
  box.innerHTML='<button class="btn" onclick="claudeHap('+idArg+')" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border:1px dashed var(--acc);color:var(--acc);padding:10px;">'+
    '<span style="font-size:16px;">✨</span> Nuk di ku ta vendosësh kodin? Pyet asistentin</button>';
}
var _claudeHist = {};
function claudeHap(id){
  const box=$('claudeSuport'+id); if(!box) return;
  if(!_claudeHist[id]) _claudeHist[id]=[];
  var pyetjaKonv = "Hi! I'm here to help you set up conversion tracking on your website. This involves placing a tracking snippet, and then tracking either by URL (a success page) or by code (a button/action). To point you in the right direction — what do you need help with? For example: where the tracking snippet goes, which file to edit, how to track a button click, or anything else on your mind.";
  var pyetjaRek = "Hi! I'm here to help you add the ad code to your website. To point you in the right direction — could you tell me what's stopping you or what you need help with? For example: you're not sure which file to edit, you don't know where in the code it goes, you don't have access, or anything else on your mind.";
  var pyetja = (id==='Konv') ? pyetjaKonv : pyetjaRek;
  box.innerHTML='<div style="border:1px solid var(--acc);border-radius:12px;overflow:hidden;">'+
    '<div style="background:var(--acc);color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">'+
      '<span style="font-weight:600;">✨ Asistenti i kodit</span>'+
      '<button onclick="vizatoClaudeSuport('+(isNaN(id)?"'"+id+"'":id)+')" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;">✕</button>'+
    '</div>'+
    '<div id="claudeChat'+id+'" style="padding:14px;max-height:340px;overflow-y:auto;min-height:80px;font-size:13px;line-height:1.5;">'+
      '<div style="margin:8px 0;"><span style="background:var(--bg2,#1a1f28);padding:8px 12px;border-radius:10px;display:inline-block;max-width:90%;">'+esc(pyetja)+'</span></div>'+
    '</div>'+
    '<div style="padding:10px 14px;border-top:1px solid var(--line);display:flex;gap:8px;">'+
      '<input id="claudeInput'+id+'" placeholder="Shkruaj pyetjen tënde..." style="flex:1;" onkeydown="if(event.key===\'Enter\')claudeDergo('+(isNaN(id)?"'"+id+"'":id)+')">'+
      '<button class="btn cta" id="claudeBtn'+id+'" onclick="claudeDergo('+(isNaN(id)?"'"+id+"'":id)+')">Dërgo</button>'+
    '</div>'+
  '</div>';
  if(!_claudeHist[id] || !_claudeHist[id].length){
    _claudeHist[id]=[{role:'assistant',content: pyetja}];
  }
}
async function claudeDergo(id){
  const inp=$('claudeInput'+id); const chat=$('claudeChat'+id); const btn=$('claudeBtn'+id);
  if(!inp||!chat) return;
  const teksti=(inp.value||'').trim(); if(!teksti) return;
  if(!_claudeHist[id]) _claudeHist[id]=[];
  // Shfaq mesazhin e klientit
  chat.innerHTML+='<div style="text-align:right;margin:8px 0;"><span style="background:var(--acc);color:#fff;padding:6px 10px;border-radius:10px;display:inline-block;max-width:85%;text-align:left;">'+esc(teksti)+'</span></div>';
  _claudeHist[id].push({role:'user',content:teksti});
  inp.value=''; if(btn){ btn.disabled=true; btn.textContent='...'; }
  const pritId='claudePrit'+Date.now();
  chat.innerHTML+='<div id="'+pritId+'" style="margin:8px 0;"><span style="background:var(--bg2,#222);padding:6px 10px;border-radius:10px;display:inline-block;color:var(--mut);"><span class="spin"></span> Po mendoj...</span></div>';
  chat.scrollTop=chat.scrollHeight;
  try{
    const r=await(await fetch('/api/asistenti',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mesazhet:_claudeHist[id], konteksti: (id==='Konv'?'konvertim':'reklama')})})).json();
    const p=document.getElementById(pritId); if(p) p.remove();
    if(r.pergjigje){
      _claudeHist[id].push({role:'assistant',content:r.pergjigje});
      // Pastro Markdown bazE (**bold**, ##) qe te mos dale i madh; ruaj rreshtat
      let txt=r.pergjigje.replace(/\*\*(.+?)\*\*/g,'$1').replace(/^#+\s*/gm,'').replace(/`([^`]+)`/g,'$1');
      chat.innerHTML+='<div style="margin:8px 0;"><span style="background:var(--bg2,#1a1f28);padding:8px 12px;border-radius:10px;display:inline-block;max-width:90%;white-space:pre-wrap;font-size:13px;line-height:1.5;">'+esc(txt)+'</span></div>';
    } else {
      chat.innerHTML+='<div style="margin:8px 0;color:var(--err);font-size:13px;">'+esc(r.error||'Gabim në përgjigje.')+'</div>';
    }
  }catch(e){
    const p=document.getElementById(pritId); if(p) p.remove();
    chat.innerHTML+='<div style="margin:8px 0;color:var(--err);font-size:13px;">Gabim në lidhje.</div>';
  }
  if(btn){ btn.disabled=false; btn.textContent='Dërgo'; }
  chat.scrollTop=chat.scrollHeight;
}
async function snipEmriRuajFush(id){
  const emri=(($('snipEmriFush')||{}).value||'').trim();
  if(!emri) return;
  try{ await fetch('/api/snippetet/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({emri})}); }catch(e){}
}
async function snipDetaje(m, id){
  _snipAktiv=id;
  m.innerHTML='<div id="pvBody"><p class="small">Po ngarkoj…</p></div>';
  const b=$('pvBody');
  try{
    const sn=await(await fetch('/api/snippetet/'+id)).json();
    if(sn.error){ b.innerHTML='<p class="small err">'+esc(sn.error)+'</p>'; return; }
    const krye='<div style="margin-bottom:10px;"><a href="#" style="color:#4a9eff;text-decoration:none;font-size:13px;" onclick="event.preventDefault();nav({v:\'profile\',nav:\'snippetet\'})">← Të gjitha snippet-et</a></div>'+
      '<h2 class="h">'+esc(sn.emri||'(Pa emër — vendos një poshtë)')+'</h2>';
    if(sn.snippet_active){
      // I LIDHUR → konfirmim + madhesia PER KETE snippet specifik
      b.innerHTML=krye+
        '<div class="miniStat" style="margin:10px 0 18px;"><span class="vd">✓</span> I lidhur</div>'+
        '<div id="madhWrapNjeSnip"></div>';
      const w=b.querySelector('#madhWrapNjeSnip');
      if(w) ndertoMadhesineNjeSnip(w, id, sn);
    } else {
      // PA LIDHUR → kodi + kopjo + URL + verifiko (madhesia s'perzihet me ketu)
      b.innerHTML=krye+
        '<div style="margin:6px 0 14px;">'+
          '<label>Emri i kësaj hapësire</label>'+
          '<input id="snipEmriFush" value="'+esc(sn.emri||'')+'" placeholder="p.sh. Fund faqe, Anash blogu" onblur="snipEmriRuajFush('+id+')">'+
        '</div>'+
        '<p class="small" style="margin:6px 0 10px;">Vendose këtë rresht aty ku do të shfaqet reklama te faqja jote.</p>'+
        '<textarea class="kod" id="snipKod" readonly>'+esc(snipKodi(sn.celes))+'</textarea>'+
        '<div class="rowbtn"><button class="btn cta" id="snipCbtn" onclick="snipKopjo()">Kopjo</button></div>'+
        '<div id="claudeSuport'+id+'" style="margin:14px 0;"></div>'+
        '<div style="margin-top:14px;">'+
          '<label>URL-ja e faqes ku e vendose</label>'+
          '<input id="snipUrl" value="'+esc((une&&une.website)||'')+'" placeholder="https://faqja-ime.com">'+
          '<button class="primary" id="snipVbtn" onclick="snipVerifiko('+id+')">Hap faqen dhe konfirmo →</button>'+
          '<div class="status wait hide" id="snipStatus"></div>'+
        '</div>';
      vizatoClaudeSuport(id);
    }
  }catch(e){ b.innerHTML='<p class="small err">Gabim.</p>'; }
}
function snipKodi(celes){
  return '<script src="'+location.origin+'/imyr.js" data-key="'+celes+'"></scr'+'ipt>';
}
function snipKopjo(){
  const t=$('snipKod'); if(!t) return;
  t.select && t.select(); t.setSelectionRange && t.setSelectionRange(0,99999);
  try{ document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(t.value||t.textContent||''); }
  const b=$('snipCbtn'); if(b){ b.textContent='U kopjua ✓'; setTimeout(()=>b.textContent='Kopjo',1500); }
}
function snipVerifiko(id){
  let url=($('snipUrl').value||'').trim(); if(!url){ $('snipUrl').focus(); return; }
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  window.open(url,'_blank');
  const st=$('snipStatus'); if(st){ st.classList.remove('hide'); st.className='status wait'; st.innerHTML='⏳ Po pres sinjalin e lidhjes…'; }
  if(pollTimer) clearInterval(pollTimer);
  const tick=async()=>{
    try{
      const r=await(await fetch('/api/snippetet/'+id+'/kontrollo')).json();
      if(r.active){
        clearInterval(pollTimer); pollTimer=null;
        // Nese pati bisedE me asistentin, nxirr kodin+vendin prej saj dhe ruaje (biseda s'ruhet)
        try{
          if(_claudeHist[id] && _claudeHist[id].length){
            fetch('/api/asistenti/ruaj-vendin',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({mesazhet:_claudeHist[id], lloji:'reklama'})}).catch(()=>{});
          }
        }catch(e){}
        // Snippet-i u lidh → rifresko piken/njoftimin live, pastaj pamjen
        try{ await refreshProg(); }catch(e){}
        try{ await ngarkoNjoftimet(); }catch(e){}
        nav({v:'profile',nav:'snippetet',sub:'detail',id:id});
      }
    }catch(e){}
  };
  tick(); pollTimer=setInterval(tick,6000);
}

function mainKreative(m, s){
  s = s || {};
  const zgjedhur = s.lloji || null;
  m.innerHTML = '<h2 class="h">Creative</h2>'+
    '<p class="small" style="margin:8px 0 20px;">Krijo reklama me AI: imazh, video, ose HTML5.</p>'+
    '<div id="krGatiWrap" style="display:none;margin-bottom:20px;">'+
      '<label>Krijimet e gatshme</label>'+
      '<div id="krGatiLista" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:8px 4px;margin-top:8px;"></div>'+
    '</div>'+
    // Zgjedhesi i llojit
    '<label>Cfare do te krijosh?</label>'+
    '<div class="krTip">'+
      '<button class="krT '+(zgjedhur==='imazh'?'sel':'')+'" onclick="krZgjidh(\'imazh\')">'+
        '<div class="krIco">🖼️</div><div>Imazh</div></button>'+
      '<button class="krT '+(zgjedhur==='video'?'sel':'')+'" onclick="krZgjidh(\'video\')">'+
        '<div class="krIco">🎬</div><div>Video</div></button>'+
      '<button class="krT '+(zgjedhur==='html5'?'sel':'')+'" onclick="krZgjidh(\'html5\')">'+
        '<div class="krIco">💻</div><div>HTML5</div></button>'+
    '</div>'+
    // Permbajtja kur zgjedhet nje lloj
    (zgjedhur ? formaKreative(zgjedhur) : '<p class="small mut" style="margin-top:16px;">Zgjidh nje lloj për të vazhduar.</p>')+
    // Lista e krijimeve te fundit
    '<div id="krLista" style="margin-top:30px;"></div>';
  ngarkoKreativetGati();
  ngarkoKreativetGati();
}

// ═══ VERSION I RI ME TABS (test) — origjinali sipër mbetet aktiv derisa te konfirmohet ═══
function mainKreative_NEW(m, s){
  s = s || {};
  const tab = s.tab || 'krijo';
  const zgjedhur = s.lloji || null;
  m.innerHTML = '<h2 class="h">Creative</h2>'+
    '<p class="small" style="margin:8px 0 16px;">Krijo reklama me AI: imazh, video, ose HTML5.</p>'+
    '<div class="tabs" style="max-width:320px;">'+
      '<div class="tab '+(tab==='krijo'?'active':'')+'" onclick="krTab(\'krijo\')">Krijo</div>'+
      '<div class="tab '+(tab==='lista'?'active':'')+'" onclick="krTab(\'lista\')">Krijimet e mia</div>'+
    '</div>'+
    (tab==='krijo' ? (
      '<label>Cfare do te krijosh?</label>'+
      '<div class="krTip">'+
        '<button class="krT '+(zgjedhur==='imazh'?'sel':'')+'" onclick="krZgjidh(\'imazh\')">'+
          '<div class="krIco">🖼️</div><div>Imazh</div></button>'+
        '<button class="krT '+(zgjedhur==='video'?'sel':'')+'" onclick="krZgjidh(\'video\')">'+
          '<div class="krIco">🎬</div><div>Video</div></button>'+
        '<button class="krT '+(zgjedhur==='html5'?'sel':'')+'" onclick="krZgjidh(\'html5\')">'+
          '<div class="krIco">💻</div><div>HTML5</div></button>'+
      '</div>'+
      (zgjedhur ? formaKreative(zgjedhur) : '<p class="small mut" style="margin-top:16px;">Zgjidh nje lloj për të vazhduar.</p>')
    ) : (
      '<div id="krGatiWrap" style="margin-top:18px;">'+
        '<div id="krGatiLista" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:8px 4px;"></div>'+
      '</div>'
    ));
  if(tab==='krijo'){ if(zgjedhur) krNgarkoKufirin(zgjedhur); }
  else { ngarkoKreativetGati(); }
}
function krTab(t){ nav({v:'profile', nav:'kreative', tab:t}); }


function krThumbHTML(k){
  const wrap='width:30px;height:30px;border-radius:6px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0e1116;border:1px solid var(--line);';
  if(k.lloji==='imazh' && (k.output_url||k.skedari_url)) return '<div style="'+wrap+'"><img src="'+esc(k.output_url||k.skedari_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
  if(k.lloji==='video') return '<div style="'+wrap+'font-size:13px;color:var(--mut);">▶</div>';
  if(k.lloji==='html5') return '<div style="'+wrap+'font-size:11px;color:var(--mut);">&lt;/&gt;</div>';
  return '<div style="'+wrap+'"></div>';
}
async function ngarkoKreativetGati(){
  const wrap=$('krGatiWrap'), el=$('krGatiLista'); if(!wrap||!el) return;
  el.innerHTML='<p class="small mut">Po ngarkoj…</p>';
  try{
    const r=await(await fetch('/api/kreative')).json();
    const rows=r.kreative||[];
    if(!rows.length){ el.innerHTML='<p class="small mut">Ende s\'ke krijuar asgjë.</p>'; return; }
    el.innerHTML = rows.map(k=>{
      const url = k.output_url||k.skedari_url;
      const eshteImazh = (k.lloji==='imazh' && url);
      const eshteHtml5 = (k.lloji==='html5' && url);
      return '<div style="position:relative;flex:0 0 auto;width:84px;">'+
        '<div style="width:84px;height:84px;border-radius:10px;overflow:hidden;background:#0e1116;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;">'+
          (eshteImazh
            ? '<img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover;">'
            : (k.lloji==='video' ? '<span style="font-size:22px;color:var(--mut);">▶</span>' : '<span style="font-size:16px;color:var(--mut);">&lt;/&gt;</span>'))+
        '</div>'+
        (url
          ? '<button onclick="krHapPamjenPlote(\''+esc(url)+'\')" title="Shiko madhësinë reale" '+
            'style="position:absolute;top:4px;right:44px;width:24px;height:24px;border-radius:50%;background:rgba(14,17,22,.85);border:1px solid var(--line);color:var(--txt);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;">🔍</button>'
          : '')+
        (eshteImazh
          ? '<button onclick="krHapEditor('+k.id+',\''+esc(url)+'\')" title="Ndrysho" '+
            'style="position:absolute;top:4px;right:24px;width:24px;height:24px;border-radius:50%;background:rgba(14,17,22,.85);border:1px solid var(--line);color:var(--txt);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">✎</button>'
          : '')+
        (eshteHtml5
          ? '<button onclick="krHapEditorHtml5('+k.id+',\''+esc(url)+'\')" title="Ndrysho" '+
            'style="position:absolute;top:4px;right:24px;width:24px;height:24px;border-radius:50%;background:rgba(14,17,22,.85);border:1px solid var(--line);color:var(--txt);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">✎</button>'
          : '')+
        '<button onclick="krFshi('+k.id+')" title="Fshi" '+
          'style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(14,17,22,.85);border:1px solid var(--line);color:var(--txt);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;">✕</button>'+
        '<div style="font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mut);">'+esc(k.emri||'')+'</div>'+
      '</div>';
    }).join('');
  }catch(e){ el.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function krFshi(id){
  if(!confirm('Fshi këtë krijim?')) return;
  try{
    await fetch('/api/kreative/'+id,{method:'DELETE'});
    ngarkoKreativetGati();
  }catch(e){}
}

// ═══ EDITIMI I IMAZHIT (Filerobot Image Editor — versioni vanilla-JS, jo React) ═══
// Editori vet krijon modalin e vet (showInModal:true, parazgjedhur) — s'na duhet
// nje overlay/div i ndertuar nga ne, thjesht .open(url) e hap ate.
var _fieInstance = null;
var _fieAktualiId = null;
var _fieOrigjinaliFingerprint = null;

async function krHapEditor(kreativId, imageUrl){
  _fieAktualiId = kreativId;
  // Marrim vete imazhin si blob PARA se ta hapim — kjo garanton nje URL "same-origin"
  // (blob:) qe canvas-i i editorit s'e trajton kurre si "tainted", pavaresisht si e
  // trajton Filerobot brenda vetes crossOrigin-in e <img>-it te tij te brendshem.
  var blobUrl;
  try{
    var resp = await fetch('/api/kreative/proxy?url=' + encodeURIComponent(imageUrl));
    if(!resp.ok){
      var errBody = await resp.json().catch(function(){ return {}; });
      throw new Error(errBody.error || ('HTTP ' + resp.status));
    }
    var blob = await resp.blob();
    blobUrl = URL.createObjectURL(blob);
  }catch(e){
    alert('Gabim: s\'u mor imazhi (' + e.message + ').');
    return;
  }
  // Gjurma e imazhit ORIGJINAL — e kalojme neper te njejtin encode PNG qe do perdore
  // edhe ruajtja (canvas.toDataURL('image/png')), qe krahasimi te mos jape "ndryshim"
  // fals thjesht sepse formati origjinal ishte JPEG dhe ruajtja gjithmone prodhon PNG.
  _fieOrigjinaliFingerprint = null;
  try{
    var img = new Image();
    await new Promise(function(res, rej){ img.onload=res; img.onerror=rej; img.src=blobUrl; });
    var c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    _fieOrigjinaliFingerprint = c.toDataURL('image/png');
  }catch(e){ _fieOrigjinaliFingerprint = null; } // deshtim ketu s'e bllokon editimin, thjesht s'kontrollohet ndryshimi

  function fillimi(){
    if(!_fieInstance){
      _fieInstance = new FilerobotImageEditor(
        { tools:['adjust','effects','filters','rotate','crop','resize'], colorScheme:'dark', finishButtonLabel:'Ruaj' },
        {
          onBeforeComplete: krFilerobotDuke, // ndalon upload/download automatik, ruan vete
          onClose: function(){ _fieAktualiId=null; }
        }
      );
    }
    _fieInstance.open(blobUrl);
  }
  if(window.FilerobotImageEditor){ fillimi(); return; }
  var script = document.createElement('script');
  script.src = 'https://cdn.scaleflex.it/plugins/filerobot-image-editor/3.12.17/filerobot-image-editor.min.js';
  script.onload = fillimi;
  script.onerror = function(){ alert('Gabim: s\'u ngarkua editori (kontrollo lidhjen e internetit).'); };
  document.head.appendChild(script);
}

// Thirret PARA se Filerobot te bej upload/download vete — kthejme 'false' qe ta ndalojme
// ate, dhe ne vend te tij marrim canvas-in dhe e ruajme vete te backend-i yne.
function krFilerobotDuke(payload){
  var canvas = payload && payload.canvas;
  if(!canvas || !_fieAktualiId){ return false; }
  var dataUrl = canvas.toDataURL('image/png');
  if(_fieOrigjinaliFingerprint && dataUrl === _fieOrigjinaliFingerprint){
    alert('S\'ke bërë asnjë ndryshim — ruajtja u anulua.');
    return false;
  }
  krShfaqZgjedhjenRuajtje(function(mode){ krRuajEditorin(_fieAktualiId, dataUrl, mode); });
  return false; // ndalon sjelljen e parazgjedhur (shkarkim/upload te Filerobot/Cloudimage)
}

// ═══ ZGJEDHJA "Ruaj si Kopje" vs "Zëvendëso Origjinalin" — e perbashket per te dy editoret ═══
function krShfaqZgjedhjenRuajtje(onZgjedh){
  var p=document.createElement('div');
  p.id='krZgjedhjaRuajtje';
  p.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10002;display:flex;align-items:center;justify-content:center;';
  p.innerHTML=
    '<div style="background:#12151b;border:1px solid var(--line);border-radius:10px;padding:22px;max-width:320px;text-align:center;">'+
      '<p style="margin:0 0 16px;font-size:14px;">Si dëshiron ta ruash?</p>'+
      '<button class="btn primary" style="width:100%;margin-bottom:8px;" onclick="krZgjedhjaBerja(\'copy\')">📄 Ruaj si Kopje</button>'+
      '<button class="btn" style="width:100%;margin-bottom:8px;" onclick="krZgjedhjaBerja(\'overwrite\')">💾 Zëvendëso Origjinalin</button>'+
      '<button class="btn" style="width:100%;background:transparent;" onclick="krZgjedhjaAnulo()">Anulo</button>'+
    '</div>';
  document.body.appendChild(p);
  window.__krZgjedhjaCallback = onZgjedh;
}
function krZgjedhjaBerja(mode){
  var p=$('krZgjedhjaRuajtje'); if(p) p.remove();
  if(window.__krZgjedhjaCallback) window.__krZgjedhjaCallback(mode);
  window.__krZgjedhjaCallback=null;
}
function krZgjedhjaAnulo(){
  var p=$('krZgjedhjaRuajtje'); if(p) p.remove();
  window.__krZgjedhjaCallback=null;
}

async function krRuajEditorin(kreativId, imageBase64, mode){
  try{
    const r = await (await fetch('/api/kreative/ruaj-editim/'+kreativId, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ imageBase64: imageBase64, mode: mode })
    })).json();
    if(r.error){ alert('Gabim: '+r.error); return; }
    if(_fieInstance){ try{ _fieInstance.close(); }catch(e){} }
    ngarkoKreativetGati();
  }catch(e){ alert('Gabim: '+e.message); }
}

// ═══ EDITIMI I HTML5 (GrapesJS — falas, plotesisht client-side, pa API) ═══
// Ndryshe nga Filerobot, GrapesJS s'krijon vet modal — ndertojme ne overlay-in
// dhe #gjs mount-in, dhe editori vendoset brenda tij.
var _gjsEditor = null;
var _gjsAktualiId = null;

async function krHapEditorHtml5(kreativId, url){
  var htmlContent = '';
  try{
    htmlContent = await (await fetch('/api/kreative/proxy?url=' + encodeURIComponent(url))).text();
  }catch(e){ alert('Gabim: s\'u ngarkua përmbajtja HTML.'); return; }

  _gjsAktualiId = kreativId;
  var overlay = document.createElement('div');
  overlay.id = 'krGjsOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="width:min(1200px,96vw);height:min(760px,92vh);background:#12151b;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);">'+
        '<span style="font-weight:600;">Ndrysho HTML5</span>'+
        '<div>'+
          '<button class="btn primary" onclick="krRuajGjsPergjigje()" style="margin-right:8px;">💾 Ruaj</button>'+
          '<button class="btn" onclick="krMbyllGjs()">✕ Mbyll</button>'+
        '</div>'+
      '</div>'+
      '<div id="krGjsMount" style="flex:1;min-height:0;"></div>'+
    '</div>';
  document.body.appendChild(overlay);
  krNgarkoGrapes(htmlContent);
}

function krMbyllGjs(){
  if(_gjsEditor){ try{ _gjsEditor.destroy(); }catch(e){} _gjsEditor=null; }
  _gjsAktualiId=null;
  var ov=$('krGjsOverlay'); if(ov) ov.remove();
}

function krNgarkoGrapes(htmlContent){
  function fillimi(){
    var mount=$('krGjsMount'); if(!mount) return;
    _gjsEditor = grapesjs.init({
      container: mount,
      height: '100%',
      fromElement: false,
      storageManager: false,
      components: htmlContent
    });
  }
  if(window.grapesjs){ fillimi(); return; }
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href='https://cdn.jsdelivr.net/npm/grapesjs/dist/css/grapes.min.css';
  document.head.appendChild(link);
  var script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/grapesjs/dist/grapes.min.js';
  script.onload=fillimi;
  script.onerror=function(){ var m=$('krGjsMount'); if(m) m.innerHTML='<p class="small" style="padding:20px;">Gabim: s\'u ngarkua editori.</p>'; };
  document.head.appendChild(script);
}

function krRuajGjsPergjigje(){
  if(_gjsEditor && _gjsEditor.UndoManager && !_gjsEditor.UndoManager.hasChanges()){
    alert('S\'ke bërë asnjë ndryshim — ruajtja u anulua.');
    return;
  }
  krShfaqZgjedhjenRuajtje(function(mode){ krRuajGjs(mode); });
}
async function krRuajGjs(mode){
  if(!_gjsEditor || !_gjsAktualiId) return;
  var html = _gjsEditor.getHtml();
  var css = _gjsEditor.getCss();
  var full = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'+html+'</body></html>';
  try{
    const r = await (await fetch('/api/kreative/ruaj-editim-html5/'+_gjsAktualiId, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ html: full, mode: mode })
    })).json();
    if(r.error){ alert('Gabim: '+r.error); return; }
    krMbyllGjs();
    ngarkoKreativetGati();
  }catch(e){ alert('Gabim: '+e.message); }
}

function krZgjidh(l){ nav({v:'profile', nav:'kreative', lloji:l}); }

var krZgjedhurit = []; // {burimi:'file'|'url', file, url, emri}

function formaKreative(lloji){
  const shumefishte = (lloji==='video' || lloji==='html5');
  const accept = lloji==='html5' ? 'image/*,.htm,.html,.zip' : 'image/*';
  const ndihma = lloji==='html5'
    ? 'Mund të ngarkosh disa imazhe (secili do t\'i referohet Claude sipas emrit që i vendos), ose një skedar .htm/.zip për modifikim.'
    : lloji==='video'
      ? 'Mund të ngarkosh disa imazhe, por modeli i videos përdor VETËM imazhin e parë si bazë.'
      : 'Mund të ngarkosh vetëm imazhe (JPG, PNG).';
  krZgjedhurit = []; // reset sa here që hapet forma nga e para
  window._formaKreativeLloji = lloji; // lexohet nga kreative-chat-ui.js
  if(window.krPermasaReset) krPermasaReset(); // gjendja e "Cakto madhësinë" — modul i veçantë (kreative-permasa.js)
  if(window.krChatReset) krChatReset(); // gjendja e "Përshkruaj te AI" — modul i veçantë (kreative-chat-ui.js)
  const imgZgjedhBtn = shumefishte
    ? '<button type="button" class="btn" onclick="krZgjidhImazh()" style="margin-left:8px;">📁 Nga imazhet e mia</button>'
    : '';
  // "Cakto madhësinë" vlen per Imazh (gjenerim AI direkt) dhe HTML5 (Claude ndertohet fiks
  // per kete permase). Per Video, permasa rrjedh nga imazhi baze, s'ka opsion te vetin.
  const permasaLink = (lloji==='imazh' || lloji==='html5') && window.krPermasaLinkHTML
    ? krPermasaLinkHTML() : '';
  // "Përshkruaj te AI" — ZEVENDESON teresisht fushen e vjeter "Përshkrimi". S'ka
  // buton veçues — chat-i eshte gjithmone i hapur (nisur nga krChatAutoHap ne
  // krNgarkoKufirin, PAS insertimit ne DOM).
  // NESE kreative-chat-ui.js s'eshte ngarkuar, DUHET te jete E QARTE (jo fallback
  // i heshtur ne fushen e vjeter — kjo shkaktoi konfuzion me pare).
  const pershkrimiHTML = window.krChatEmbedHTML
    ? krChatEmbedHTML()
    : ('<p style="margin-top:12px;padding:12px;background:#3a1414;border:1px solid #a33;border-radius:8px;color:#ff8080;">'+
       '⚠️ GABIM: kreative-chat-ui.js s\'është ngarkuar. Kontrollo &lt;script src="/js/kreative-chat-ui.js"&gt; te index.html.</p>');
  return '<div id="krForma" style="margin-top:18px;">'+
    '<label>Emri</label>'+
    '<input id="krEmri" placeholder="Emri i reklamës (p.sh. Fushata Verë)">'+
    pershkrimiHTML+
    '<label style="margin-top:12px;">Ngarko skedarë</label>'+
    '<div class="krFile" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
      '<input type="file" id="krFile" accept="'+accept+'"'+(shumefishte?' multiple':'')+' onchange="krNdryshoFile(this,\''+lloji+'\')" style="display:none;">'+
      '<button type="button" class="btn" onclick="document.getElementById(\'krFile\').click()">📁 Zgjidh skedar</button>'+
      imgZgjedhBtn+
    '</div>'+
    '<div id="krEmertimet" style="margin-top:6px;"></div>'+
    permasaLink+
    '<p class="small mut" style="margin:6px 0 0;">'+ndihma+'</p>'+
    '<input type="hidden" id="krImageUrl" value="">'+
    '<div id="krZgjedhPrev"></div>'+
    '<div id="krZgjedhurLista" style="margin-top:10px;"></div>'+
    '<button class="primary" id="krGjenBtn" onclick="krGjenero(\''+lloji+'\')" style="margin-top:18px;">✨ Gjenero me AI</button>'+
    '<span class="small mut" id="krKufiri" style="margin-left:10px;"></span>'+
    '<p id="krMsg" class="msg"></p>'+
  '</div>';
}

// Kur zgjidhen skedare NGA KOMPJUTERI (mund te jene disa, per html5/video)
function krNdryshoFile(inp, lloji){
  const shumefishte = (lloji==='video' || lloji==='html5');
  if(!shumefishte){
    // Rasti IMAZH (nje skedar i vetem) — s'perdor krZgjedhurit (mbetet skedariNjeshi
    // te krGjenero, siç ishte), POR prap njoftojme chat-in DHE tregojme emrin qartazi,
    // duke perfshire emrin ORIGJINAL te skedarit nga kompjuteri.
    if(inp.files && inp.files[0]){
      if(window.krChatShtoReferencaImazhi) krChatShtoReferencaImazhi('mt1');
      krTregoEmertimin([{ origjinali: inp.files[0].name, emri: 'mt1' }]);
    }
    return;
  }
  // Emertim UNIVERSAL "mt" (material) — i njejte per imazh/video/kod, numerim GLOBAL
  // (jo i ndare sipas tipit), qe chat-i te kete nje rregull te vetem per t'i njohur.
  Array.prototype.forEach.call(inp.files, function(f){
    const emriAuto = 'mt' + (krZgjedhurit.length + 1);
    krZgjedhurit.push({ burimi:'file', file:f, emri: emriAuto, origjinali: f.name });
    if(window.krChatShtoReferencaImazhi) krChatShtoReferencaImazhi(emriAuto);
  });
  inp.value = ''; // pastro input-in qe te mund te shtosh me shume me vone pa i dyfishuar
  krRenderZgjedhurit();
  krTregoEmertimin(krZgjedhurit);
}
// Etiketa gjithmone e dukshme, direkt poshte butonit "Choose File" — mos u fsheh
// brenda scroll-it te chat-it. Per skedare nga kompjuteri, tregon EDHE emrin
// ORIGJINAL ("emri_origjinal.jpg emërtohet si img1") — per ato nga "Krijimet e
// mia" (s'kane koncept "emer skedari"), tregon vetem emrin ekzistues.
function krTregoEmertimin(lista){
  const el = $('krEmertimet'); if(!el) return;
  if(!lista || !lista.length){ el.innerHTML=''; return; }
  el.innerHTML = '<div class="small" style="color:var(--acc);line-height:1.6;">'+
    lista.map(function(x){
      if(x.origjinali){
        return '📌 <b>'+esc(x.origjinali)+'</b> emërtohet si <b>'+esc(x.emri)+'</b> — përdore <b>"'+esc(x.emri)+'"</b> te biseda.';
      }
      return '📌 <b>'+esc(x.emri)+'</b> — përdore <b>"'+esc(x.emri)+'"</b> te biseda.';
    }).join('<br>')+
  '</div>';
}
function krRenderZgjedhurit(){
  const el=$('krZgjedhurLista'); if(!el) return;
  if(!krZgjedhurit.length){ el.innerHTML=''; return; }
  el.innerHTML = '<label>Imazhet e zgjedhura</label>'+
    krZgjedhurit.map(function(x,i){
      const thumb = x.burimi==='url' ? x.url : URL.createObjectURL(x.file);
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">'+
        '<img src="'+esc(thumb)+'" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">'+
        '<input value="'+esc(x.emri)+'" placeholder="Emërto këtë imazh (p.sh. Logo)" '+
          'oninput="krZgjedhurit['+i+'].emri=this.value; krTregoEmertimin(krZgjedhurit);" style="flex:1;">'+
        '<button type="button" class="btn" onclick="krHiqZgjedhurin('+i+')" style="padding:4px 10px;">✕</button>'+
      '</div>';
    }).join('');
}
function krHiqZgjedhurin(i){ krZgjedhurit.splice(i,1); krRenderZgjedhurit(); krTregoEmertimin(krZgjedhurit); }

async function krNgarkoKufirin(lloji){
  if(window.krChatAutoHap) krChatAutoHap(); // nis "Përshkruaj te AI" automatikisht
  const el=$('krKufiri'); if(!el) return;
  try{
    const r=await(await fetch('/api/kreative/kufijte?lloji='+lloji)).json();
    if(r.error) return;
    el.textContent='Të mbetura këtë muaj: '+r.krijime_mbetura+'/'+r.krijime_gjithsej;
  }catch(e){}
}

var _kzModalZgjedhur = []; // {url, origjinali} — zgjedhjet e perkohshme brenda modalit, para "Ngarko"

async function krZgjidhImazh(){
  _kzModalZgjedhur = [];
  var overlay = document.createElement('div');
  overlay.id = 'krZgjedhModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10004;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="width:min(560px,92vw);max-height:80vh;background:#12151b;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--line);">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);">'+
        '<span style="font-weight:600;">📁 Nga imazhet e mia</span>'+
        '<button type="button" onclick="krZgjidhImazhMbyll()" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:16px;">✕</button>'+
      '</div>'+
      '<div id="krZgjedhModalGrid" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-wrap:wrap;gap:10px;"></div>'+
      '<div style="padding:12px 16px;border-top:1px solid var(--line);text-align:right;">'+
        '<button type="button" class="btn primary" onclick="krZgjidhImazhKonfirmo()">Ngarko</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(overlay);

  const grid = document.getElementById('krZgjedhModalGrid');
  grid.innerHTML = '<p class="small mut">Po ngarkoj imazhet…</p>';
  try{
    const r = await (await fetch('/api/kreative/gati')).json();
    const imazhet = (r.kreative||[]).filter(k=>k.lloji==='imazh' && (k.output_url||k.skedari_url));
    if(!imazhet.length){ grid.innerHTML='<p class="small mut">S\'ke imazhe të gatshme. Krijo së pari një imazh.</p>'; return; }
    grid.innerHTML = imazhet.map((k,i)=>{
      const url = k.output_url||k.skedari_url;
      return '<div id="krZgjModItem'+i+'" onclick="krZgjidhImazhToggle('+i+',\''+esc(url)+'\',\''+esc(k.emri||'')+'\')" '+
        'style="width:70px;height:70px;border-radius:8px;cursor:pointer;border:2px solid transparent;overflow:hidden;">'+
        '<img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover;">'+
      '</div>';
    }).join('');
  }catch(e){ grid.innerHTML = '<p class="small">Gabim.</p>'; }
}

function krZgjidhImazhToggle(i, url, emriEkzistues){
  const el = document.getElementById('krZgjModItem'+i); if(!el) return;
  const idx = _kzModalZgjedhur.findIndex(function(x){ return x.url===url; });
  if(idx > -1){
    _kzModalZgjedhur.splice(idx, 1);
    el.style.borderColor = 'transparent';
  } else {
    _kzModalZgjedhur.push({ url: url, origjinali: emriEkzistues });
    el.style.borderColor = 'var(--acc)';
  }
}

function krZgjidhImazhMbyll(){
  var ov = document.getElementById('krZgjedhModalOverlay');
  if(ov) ov.remove();
}

function krZgjidhImazhKonfirmo(){
  _kzModalZgjedhur.forEach(function(x){
    const emriAuto = 'mt' + (krZgjedhurit.length + 1);
    krZgjedhurit.push({ burimi:'url', url:x.url, emri:emriAuto, origjinali:x.origjinali||'nga Krijimet e mia' });
    if(window.krChatShtoReferencaImazhi) krChatShtoReferencaImazhi(emriAuto);
  });
  krRenderZgjedhurit();
  krTregoEmertimin(krZgjedhurit);
  krZgjidhImazhMbyll();
}

async function krGjenero(lloji){
  const emri = ($('krEmri')||{}).value || '';
  // Pershkrimi vjen tashme nga "Përshkruaj te AI" (kreative-chat-ui.js), jo nga
  // nje textarea e vjeter — s'ka me #krPer fare ne DOM.
  const pershkrimiChat = window.krChatMerrPershkrimin ? krChatMerrPershkrimin() : null;
  const pershkrimi = pershkrimiChat || '';
  const shumefishte = (lloji==='video' || lloji==='html5');
  const fileInp = $('krFile');
  const skedariNjeshi = (!shumefishte && fileInp && fileInp.files && fileInp.files[0]) ? fileInp.files[0] : null;
  const imageUrlNjeshi = (!shumefishte) ? (($('krImageUrl')||{}).value || '') : '';
  const msg = $('krMsg');
  const btn = $('krGjenBtn');
  // Permasa e synuar (vetem per imazh/html5) — nga moduli i vecante kreative-permasa.js
  let permasaW = '', permasaH = '';
  if((lloji==='imazh' || lloji==='html5') && window.krPermasaMerrZgjedhurin){
    const p = await krPermasaMerrZgjedhurin();
    if(p){ permasaW = p.w; permasaH = p.h; }
  }
  if(!emri.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos emrin.';} return; }
  if(lloji==='imazh' && !skedariNjeshi && !pershkrimiChat){ if(msg){msg.className='msg err';msg.textContent='Përfundo bisedën "Përshkruaj te AI" ose ngarko një skedar.';} return; }
  if((lloji==='video'||lloji==='html5') && !pershkrimiChat){ if(msg){msg.className='msg err';msg.textContent='Përfundo bisedën "Përshkruaj te AI" së pari.';} return; }
  if(lloji==='video' && !krZgjedhurit.length){ if(msg){msg.className='msg err';msg.textContent='Ngarko ose zgjidh të paktën një imazh bazë për videon.';} return; }
  if(btn) btn.disabled=true;
  var kohaTxt = lloji==='video'?'Duke gjeneruar video… (mund të zgjasë deri 1 min)' : lloji==='html5'?'Duke gjeneruar HTML5…' : (skedariNjeshi?'Duke ngarkuar…':'Duke gjeneruar… (disa sekonda)');
  if(msg){msg.className='msg';msg.textContent=kohaTxt;}
  try{
    let resp;
    if(shumefishte && krZgjedhurit.length){
      // Disa imazhe (nga kompjuteri dhe/ose "imazhet e mia"), secili me emrin e vet
      const fd=new FormData();
      fd.append('lloji', lloji); fd.append('emri', emri); fd.append('pershkrimi', pershkrimi);
      if(permasaW){ fd.append('permasa_w', permasaW); fd.append('permasa_h', permasaH); }
      const etiketat = [];
      krZgjedhurit.forEach(function(x, i){
        if(x.burimi==='file'){
          fd.append('skedaret', x.file);
          etiketat.push({ burimi:'file', indeksi:i, emri:x.emri||'' });
        } else {
          etiketat.push({ burimi:'url', url:x.url, emri:x.emri||'' });
        }
      });
      fd.append('etiketat', JSON.stringify(etiketat));
      resp = await fetch('/api/kreative/gjenero', { method:'POST', body: fd });
    } else if(skedariNjeshi){
      const fd=new FormData();
      fd.append('lloji', lloji); fd.append('emri', emri); fd.append('pershkrimi', pershkrimi);
      fd.append('skedari', skedariNjeshi);
      if(permasaW){ fd.append('permasa_w', permasaW); fd.append('permasa_h', permasaH); }
      resp = await fetch('/api/kreative/gjenero', { method:'POST', body: fd });
    } else {
      resp = await fetch('/api/kreative/gjenero', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({lloji, emri, pershkrimi, image_url:imageUrlNjeshi||undefined, permasa_w:permasaW||undefined, permasa_h:permasaH||undefined}) });
    }
    const r = await resp.json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} if(btn) btn.disabled=false; return; }
    if(msg){msg.className='msg ok';msg.textContent='✓ U krijua.';}
    krShfaqRezultatin(r);
    krNgarkoKufirin(lloji);
    ngarkoKreativetGati();
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} }
  if(btn) btn.disabled=false;
}
function krShfaqRezultatin(k){
  const el=$('krForma'); if(!el) return;
  let preview='';
  if(k.output_url){
    if(k.lloji==='video') preview='<video src="'+esc(k.output_url)+'" controls style="max-width:280px;border-radius:10px;display:block;margin-bottom:10px;"></video>';
    else if(k.lloji==='html5') preview='<iframe src="'+esc(k.output_url)+'" style="width:300px;height:250px;border:1px solid var(--line);border-radius:10px;display:block;margin-bottom:10px;" sandbox="allow-scripts"></iframe>';
    else preview='<img src="'+esc(k.output_url)+'" style="max-width:280px;border-radius:10px;display:block;margin-bottom:10px;">';
  }
  el.innerHTML=
    '<div id="krImgWrap">'+preview+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'+
      '<button class="btn" onclick="krHapPamjenPlote(\''+esc(k.output_url)+'\')" title="Shiko madhësinë reale">🔍</button>'+
      (k.lloji==='video' ? '<a class="btn" href="'+esc(k.output_url)+'" download="kreative_'+k.id+'.mp4" style="text-decoration:none;">⬇ Shkarko</a>' : '')+
      '<button class="btn" onclick="krRuaj('+k.id+')">💾 Ruaje</button>'+
      '<button class="btn" onclick="krHapModifiko('+k.id+',\''+esc(k.lloji)+'\')">✏️ Modifiko</button>'+
    '</div>'+
    '<span class="small mut" id="krModKufiri"></span>'+
    '<span class="small" id="krRuajMsg" style="margin-left:10px;"></span>'+
    '<div id="krModForm"></div>';
  krNgarkoModKufirin(k.id, k.lloji);
}
// Hap materialin ne dritare/tab te re, ne madhesine e vet reale — vlen per imazh
// (shfaqet direkt), video (shfaqet direkt), dhe HTML5 (shfaqet si faqe e gjalle,
// browser-i e "render"-on vete, sepse skedari eshte i tipit text/html).
function krHapPamjenPlote(url){
  if(!url) return;
  window.open(url, '_blank');
}
async function krRuaj(id){
  const msg=$('krRuajMsg');
  try{
    const r=await(await fetch('/api/kreative')).json();
    const k=(r.kreative||[]).find(x=>x.id===id);
    if(k && k.output_url && k.status==='gati'){
      if(msg){msg.style.color='var(--good)';msg.textContent='✓ Tashmë i ruajtur.';}
    } else {
      if(msg){msg.style.color='var(--mut)';msg.textContent='S\'ka çfarë ruhet ende.';}
    }
  }catch(e){ if(msg){msg.style.color='var(--err)';msg.textContent='Gabim.';} }
}
async function krNgarkoModKufirin(id, lloji){
  const el=$('krModKufiri'); if(!el) return;
  try{
    const r=await(await fetch('/api/kreative/kufijte?lloji='+lloji+'&id='+id)).json();
    if(r.error || r.modifikime_mbetura==null) return;
    el.textContent='Modifikime të mbetura: '+r.modifikime_mbetura+'/'+r.modifikime_gjithsej;
  }catch(e){}
}
function krHapModifiko(id, lloji){
  const el=$('krModForm'); if(!el) return;
  el.innerHTML=
    '<label style="margin-top:14px;">Çfarë të ndryshohet?</label>'+
    '<textarea id="krModPer" placeholder="p.sh. bëje sfondin blu, shto një filxhan kafeje" style="min-height:80px;"></textarea>'+
    '<button class="primary" id="krModBtn" onclick="krModifiko('+id+',\''+lloji+'\')" style="margin-top:12px;">✨ Gjenero me AI</button>'+
    '<p id="krModMsg" class="msg"></p>';
}
async function krModifiko(id, lloji){
  const pershkrimi = ($('krModPer')||{}).value || '';
  const msg = $('krModMsg');
  const btn = $('krModBtn');
  if(!pershkrimi.trim()){ if(msg){msg.className='msg err';msg.textContent='Shkruaj çfarë të ndryshohet.';} return; }
  if(btn) btn.disabled=true;
  if(msg){msg.className='msg';msg.textContent='Duke korrigjuar…';}
  try{
    const r = await (await fetch('/api/kreative/modifiko/'+id,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pershkrimi})})).json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} if(btn) btn.disabled=false; return; }
    // Rikthej krejt pamjen (imazh i ri + tri butonat) ne te njejtin vend
    krShfaqRezultatin(r);
    ngarkoKreativetGati();
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} }
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function mainLidhja(m){
  window.__pamjeVecante=true;
  _snipAktiv=null;
  m.innerHTML='<div id="pvBody"></div>';
  const b=document.getElementById('pvBody');
  if(!b) return;
  if(prog.lidhja){
    // Hapi i plotesuar → thjesht "i lidhur" + caktimi i madhesise (i hapur, pa buton) + Ruaj
    b.innerHTML=
      '<h2 class="h">Lidhja e snippet-it</h2>'+
      '<div class="miniStat" style="margin:10px 0 18px;"><span class="vd">✓</span> I lidhur</div>'+
      '<div id="madhWrap"></div>';
    const w=b.querySelector('#madhWrap');
    if(w) ndertoMadhesine(w, true);
  } else {
    // I ri → hapi normal + link blu "cakto parametrat" (i fshehur derisa klikohet)
    stepLidhja(b);
    const extra=document.createElement('div');
    extra.innerHTML=
      '<div style="margin-top:16px;"><a href="#" id="caktoLink" style="color:#4a9eff;text-decoration:none;font-size:14px;" '+
      'onclick="event.preventDefault();document.getElementById(\'madhBox\').classList.toggle(\'hide\');">Cakto parametrat e hapësirës</a></div>'+
      '<div id="madhBox" class="hide" style="margin-top:12px;"></div>';
    b.appendChild(extra);
    ndertoMadhesine($('madhBox'), false);
  }
}

// ===== CAKTIMI I MADHESISE PER 1 SNIPPET SPECIFIK (brenda faqes se vet snippet-it) =====
var _madNjeSnip = { w:210, h:261, MAXW:260, MAXH:290, MINW:134, MINH:155,
  mw:290, mh:260, mMAXW:320, mMAXH:400, mMINW:260, mMINH:192, pajisje:'desktop', pozicioni:'qender', snipId:null };
async function ndertoMadhesineNjeSnip(cont, snipId, snipData){
  if(!cont) return;
  _madNjeSnip.snipId = snipId;
  cont.innerHTML='<p class="small">Po ngarkoj…</p>';
  try{
    const r=await(await fetch('/api/madhesia')).json();
    _madNjeSnip.MAXW=r.max_w||260; _madNjeSnip.MAXH=r.max_h||290; _madNjeSnip.MINW=r.min_w||134; _madNjeSnip.MINH=r.min_h||155;
    _madNjeSnip.mMAXW=r.m_max_w||320; _madNjeSnip.mMAXH=r.m_max_h||400; _madNjeSnip.mMINW=r.m_min_w||260; _madNjeSnip.mMINH=r.m_min_h||192;
    const dsk = (snipData && snipData.madhesia_desktop) || r.desktop || '210x261';
    const mob = (snipData && snipData.madhesia_mobile) || r.mobile || '290x260';
    const poz = (snipData && snipData.pozicioni) || r.pozicioni || 'qender';
    const p=dsk.split('x'); _madNjeSnip.w=parseInt(p[0],10)||210; _madNjeSnip.h=parseInt(p[1],10)||261;
    const pm=mob.split('x'); _madNjeSnip.mw=parseInt(pm[0],10)||290; _madNjeSnip.mh=parseInt(pm[1],10)||260;
    _madNjeSnip.pozicioni=poz;
  }catch(e){}
  cont.innerHTML=
    '<div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line);">'+
    '<div class="small" style="margin-bottom:10px;font-weight:600;">Madhësia e kësaj hapësire</div>'+
    '<div style="display:flex;gap:10px;margin-bottom:14px;">'+
      '<button class="madhPaj active" data-p="desktop" onclick="madhPajisjaNjeSnip(\'desktop\')">Desktop</button>'+
      '<button class="madhPaj" data-p="mobile" onclick="madhPajisjaNjeSnip(\'mobile\')">Mobile</button>'+
    '</div>'+
    '<div id="madhDesktopNjeSnip"></div></div>';
  const dd=cont.querySelector('#madhDesktopNjeSnip');
  if(dd) ndertoKanavasinNjeSnip(dd, 'desktop');
}
function madhPajisjaNjeSnip(p){
  _madNjeSnip.pajisje=p;
  document.querySelectorAll('#madhWrapNjeSnip .madhPaj').forEach(b=>b.classList.toggle('active', b.getAttribute('data-p')===p));
  const d=document.querySelector('#madhDesktopNjeSnip');
  if(d) ndertoKanavasinNjeSnip(d, p);
}
function ndertoKanavasinNjeSnip(cont, pajisje){
  if(!cont) return;
  const eshteMob = pajisje==='mobile';
  const MAXW = eshteMob?_madNjeSnip.mMAXW:_madNjeSnip.MAXW, MAXH = eshteMob?_madNjeSnip.mMAXH:_madNjeSnip.MAXH;
  const MINW = eshteMob?_madNjeSnip.mMINW:_madNjeSnip.MINW, MINH = eshteMob?_madNjeSnip.mMINH:_madNjeSnip.MINH;
  const W = eshteMob?_madNjeSnip.mw:_madNjeSnip.w, H = eshteMob?_madNjeSnip.mh:_madNjeSnip.h;
  cont.innerHTML=
    '<div style="display:flex;align-items:center;gap:14px;margin-top:8px;flex-wrap:wrap;">'+
      '<label class="small">Gjerësi <input id="madhWns" type="number" value="'+W+'" min="'+MINW+'" max="'+MAXW+'" style="width:70px;" onchange="madhNumratNjeSnip()"></label>'+
      '<label class="small">Lartësi <input id="madhHns" type="number" value="'+H+'" min="'+MINH+'" max="'+MAXH+'" style="width:70px;" onchange="madhNumratNjeSnip()"></label>'+
    '</div>'+
    '<button class="primary" id="madhRuajNs" onclick="ruajMadhesineNjeSnip()" style="margin-top:14px;">Ruaj</button>'+
    '<div class="msg" id="madhMsgNs"></div>';
}
function madhNumratNjeSnip(){
  const w=parseInt((document.getElementById('madhWns')||{}).value,10);
  const h=parseInt((document.getElementById('madhHns')||{}).value,10);
  if(_madNjeSnip.pajisje==='mobile'){ _madNjeSnip.mw=w; _madNjeSnip.mh=h; } else { _madNjeSnip.w=w; _madNjeSnip.h=h; }
}
async function ruajMadhesineNjeSnip(){
  const btn=$('madhRuajNs'); if(btn) btn.disabled=true;
  const msg=$('madhMsgNs'); if(msg){ msg.className='msg'; msg.textContent='Po ruaj…'; }
  const trupi = _madNjeSnip.pajisje==='mobile'
    ? { mobile:_madNjeSnip.mw+'x'+_madNjeSnip.mh, pozicioni:_madNjeSnip.pozicioni }
    : { desktop:_madNjeSnip.w+'x'+_madNjeSnip.h, pozicioni:_madNjeSnip.pozicioni };
  try{
    const r=await(await fetch('/api/snippetet/'+_madNjeSnip.snipId+'/madhesia',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(trupi)})).json();
    if(msg){ msg.className=r.error?'msg err':'msg ok'; msg.textContent=r.error?('Gabim: '+r.error):'U ruajt.'; }
  }catch(e){ if(msg){ msg.className='msg err'; msg.textContent='Gabim.'; } }
  if(btn) btn.disabled=false;
}

// ===== CAKTIMI I MADHESISE (korniza interaktive) =====
var _mad = { w:210, h:261, MAXW:260, MAXH:290, MINW:134, MINH:155,
             mw:290, mh:260, mMAXW:320, mMAXH:400, mMINW:260, mMINH:192, pajisje:'desktop', pozicioni:'qender' };
var _madSnipZgjedhur = new Set(); // ID-te e snippet-eve te zgjedhur per te aplikuar madhesine

async function mainMadhesiaShumefishte(m){
  window.__pamjeVecante=true;
  _madSnipZgjedhur = new Set();
  m.innerHTML='<h2 class="h">Cakto madhësinë</h2>'+
    '<p class="small" style="margin-bottom:18px;">Zgjidh pajisjen, pastaj zgjidh cilat hapësira do të marrin këtë madhësi.</p>'+
    '<div id="madhWrap"><p class="small">Po ngarkoj…</p></div>';
  const w=$('madhWrap');
  await ndertoMadhesine(w);
}

async function madhListoSnippetet(cont){
  cont.innerHTML='<p class="small">Po ngarkoj hapësirat…</p>';
  try{
    const r=await(await fetch('/api/snippetet')).json();
    const lista=r.snippetet||[];
    if(!lista.length){ cont.innerHTML='<p class="small mut">Ende s\'ke asnjë hapësirë të krijuar.</p>'; return; }
    cont.innerHTML=lista.map(sn=>
      '<label style="display:flex;align-items:center;gap:8px;padding:7px 0;cursor:pointer;">'+
        '<input type="checkbox" onchange="madhToggleSnip('+sn.id+',this.checked)"> '+
        '<span>'+esc(sn.emri||'(Pa emër)')+'</span>'+
        '<span class="small mut">('+esc(sn.madhesia_desktop||'—')+')</span>'+
      '</label>'
    ).join('');
  }catch(e){ cont.innerHTML='<p class="small err">Gabim në ngarkim.</p>'; }
}
function madhToggleSnip(id, checked){
  if(checked) _madSnipZgjedhur.add(id); else _madSnipZgjedhur.delete(id);
}

async function ndertoMadhesine(cont, ruajVetem, snipCeles, snipData){
  if(!cont) return;
  _mad.snipId = null; // s'aplikohet me per 1 snippet — tani per te zgjedhurit (_madSnipZgjedhur)
  cont.innerHTML='<p class="small">Po ngarkoj…</p>';
  try{
    const r=await(await fetch('/api/madhesia')).json();
    _mad.MAXW=r.max_w||260; _mad.MAXH=r.max_h||290; _mad.MINW=r.min_w||134; _mad.MINH=r.min_h||155;
    _mad.mMAXW=r.m_max_w||320; _mad.mMAXH=r.m_max_h||400; _mad.mMINW=r.m_min_w||260; _mad.mMINH=r.m_min_h||192;
    const dsk = r.desktop || '210x261';
    const mob = r.mobile || '290x260';
    const poz = r.pozicioni || 'qender';
    const p=dsk.split('x'); _mad.w=parseInt(p[0],10)||210; _mad.h=parseInt(p[1],10)||261;
    const pm=mob.split('x'); _mad.mw=parseInt(pm[0],10)||290; _mad.mh=parseInt(pm[1],10)||260;
    _mad.pozicioni=poz;
  }catch(e){}
  cont.innerHTML=
    '<div style="display:flex;gap:10px;margin-bottom:14px;">'+
      '<button class="madhPaj active" data-p="desktop" onclick="madhPajisja(\'desktop\')">Desktop</button>'+
      '<button class="madhPaj" data-p="mobile" onclick="madhPajisja(\'mobile\')">Mobile</button>'+
    '</div>'+
    '<div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start;">'+
      '<div id="madhDesktop" style="flex:1 1 320px;"></div>'+
      '<div style="flex:1 1 260px;">'+
        '<div class="small" style="margin-bottom:10px;font-weight:600;">Aplikoje te këto hapësira:</div>'+
        '<div id="madhSnipLista"></div>'+
      '</div>'+
    '</div>'+
    '<button class="primary" id="madhRuaj" onclick="ruajMadhesine()" style="margin-top:20px;">Ruaj</button>'+
    '<div class="msg" id="madhMsg"></div>';
  const dd=cont.querySelector('#madhDesktop');
  if(dd) ndertoKanavasin(dd, 'desktop');
  const sl=cont.querySelector('#madhSnipLista');
  if(sl) madhListoSnippetet(sl);
}
function madhPozicioni(p){
  _mad.pozicioni=p;
  document.querySelectorAll('.madhPoz').forEach(b=>b.classList.toggle('active', b.getAttribute('data-poz')===p));
}
function madhPajisja(p){
  _mad.pajisje=p;
  document.querySelectorAll('.madhPaj').forEach(b=>b.classList.toggle('active', b.getAttribute('data-p')===p));
  const d=$('madhDesktop');
  if(d) ndertoKanavasin(d, p);
}
// Ndertuesi i kanavasit — punon per te dyja pajisjet sipas parametrit
function ndertoKanavasin(cont, pajisje){
  if(!cont) return;
  _mad.cont = cont;   // kontejneri aktiv — per te gjetur elementet brenda tij (jo globalisht)
  const eshteMob = pajisje==='mobile';
  const MAXW = eshteMob?_mad.mMAXW:_mad.MAXW, MAXH = eshteMob?_mad.mMAXH:_mad.MAXH;
  const MINW = eshteMob?_mad.mMINW:_mad.MINW, MINH = eshteMob?_mad.mMINH:_mad.MINH;
  const W = eshteMob?_mad.mw:_mad.w, H = eshteMob?_mad.mh:_mad.h;
  const etiketa = eshteMob ? 'telefon' : 'desktop';
  cont.innerHTML=
    '<p class="small" style="margin-bottom:10px;">Hapësira që snippet-i do të zërë në faqen tënde ('+etiketa+'). Tërhiq cepin ose ndrysho numrat. Reklamat përshtaten brenda kësaj mase.</p>'+
    '<div id="madhKanavas" style="position:relative;width:'+MAXW+'px;max-width:100%;height:'+MAXH+'px;'+
      'border:1px dashed #2a313c;border-radius:6px;background:#0e1116;overflow:hidden;">'+
      '<div id="madhKuti" style="position:absolute;top:0;left:0;width:'+W+'px;height:'+H+'px;'+
        'background:#4a9eff22;border:2px solid #4a9eff;box-sizing:border-box;">'+
        '<div id="madhDore" style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;'+
          'background:#4a9eff;border-radius:3px;cursor:nwse-resize;"></div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-top:12px;flex-wrap:wrap;">'+
      '<label class="small">Gjerësi <input id="madhW" type="number" value="'+W+'" min="'+MINW+'" max="'+MAXW+'" style="width:70px;"></label>'+
      '<label class="small">Lartësi <input id="madhH" type="number" value="'+H+'" min="'+MINH+'" max="'+MAXH+'" style="width:70px;"></label>'+
      '<span class="small" id="madhLive" style="font-weight:600;color:#4a9eff;">'+W+' × '+H+' px</span>'+
    '</div>'+
    '<div style="margin-top:16px;">'+
      '<div class="small" style="margin-bottom:6px;">Pozicioni në hapësirë</div>'+
      '<div style="display:flex;gap:6px;">'+
        '<button class="madhPoz'+(_mad.pozicioni==='majtas'?' active':'')+'" data-poz="majtas" onclick="madhPozicioni(\'majtas\')">Majtas</button>'+
        '<button class="madhPoz'+(_mad.pozicioni==='qender'?' active':'')+'" data-poz="qender" onclick="madhPozicioni(\'qender\')">Qendër</button>'+
        '<button class="madhPoz'+(_mad.pozicioni==='djathtas'?' active':'')+'" data-poz="djathtas" onclick="madhPozicioni(\'djathtas\')">Djathtas</button>'+
      '</div>'+
    '</div>';
  madhLidhTerheqjen();
  const iW=_mq('madhW'), iH=_mq('madhH');
  if(iW) iW.oninput=()=>madhNgaNumrat();
  if(iH) iH.oninput=()=>madhNgaNumrat();
}
function _mq(id){ return _mad.cont ? _mad.cont.querySelector('#'+id) : document.getElementById(id); }
function madhKufiP(){ // kthen kufijte sipas pajisjes aktive
  return _mad.pajisje==='mobile'
    ? {MINW:_mad.mMINW,MAXW:_mad.mMAXW,MINH:_mad.mMINH,MAXH:_mad.mMAXH}
    : {MINW:_mad.MINW,MAXW:_mad.MAXW,MINH:_mad.MINH,MAXH:_mad.MAXH};
}
function madhKufizo(w,h){
  const k=madhKufiP();
  w=Math.max(k.MINW,Math.min(k.MAXW,Math.round(w)));
  h=Math.max(k.MINH,Math.min(k.MAXH,Math.round(h)));
  return [w,h];
}
function madhVendos(w,h){
  [w,h]=madhKufizo(w,h);
  if(_mad.pajisje==='mobile'){ _mad.mw=w; _mad.mh=h; } else { _mad.w=w; _mad.h=h; }
  const k=_mq('madhKuti'); if(k){ k.style.width=w+'px'; k.style.height=h+'px'; }
  if(_mq('madhW')) _mq('madhW').value=w;
  if(_mq('madhH')) _mq('madhH').value=h;
  if(_mq('madhLive')) _mq('madhLive').textContent=w+' × '+h+' px';
}
function madhNgaNumrat(){
  const cur = _mad.pajisje==='mobile' ? {w:_mad.mw,h:_mad.mh} : {w:_mad.w,h:_mad.h};
  madhVendos(parseInt(_mq('madhW').value,10)||cur.w, parseInt(_mq('madhH').value,10)||cur.h);
}
function madhLidhTerheqjen(){
  const dore=_mq('madhDore'), kan=_mq('madhKanavas'); if(!dore||!kan) return;
  let duke=false;
  function nis(e){ duke=true; e.preventDefault(); }
  function levize(e){
    if(!duke) return;
    const rect=kan.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    madhVendos(cx, cy);
  }
  function ndal(){ duke=false; }
  dore.addEventListener('mousedown', nis);
  dore.addEventListener('touchstart', nis, {passive:false});
  document.addEventListener('mousemove', levize);
  document.addEventListener('touchmove', levize, {passive:false});
  document.addEventListener('mouseup', ndal);
  document.addEventListener('touchend', ndal);
}
async function ruajMadhesine(){
  const btn=$('madhRuaj'); if(btn) btn.disabled=true;
  const msg=$('madhMsg'); if(msg){ msg.className='msg'; msg.textContent='Po ruaj…'; }
  const trupi = _mad.pajisje==='mobile'
    ? { mobile:_mad.mw+'x'+_mad.mh, pozicioni:_mad.pozicioni }
    : { desktop:_mad.w+'x'+_mad.h, pozicioni:_mad.pozicioni };

  if(!_madSnipZgjedhur.size){
    if(msg){ msg.className='msg err'; msg.textContent='Zgjidh të paktën një hapësirë sipër.'; }
    if(btn) btn.disabled=false;
    return;
  }

  try{
    let dështoi=false;
    for(const id of _madSnipZgjedhur){
      const r=await(await fetch('/api/snippetet/'+id+'/madhesia',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(trupi)})).json();
      if(r.error) dështoi=true;
    }
    if(msg){ msg.className=dështoi?'msg err':'msg ok'; msg.textContent=dështoi?'Disa dështuan.':('U ruajt për '+_madSnipZgjedhur.size+' hapësira.'); }
  }catch(e){ if(msg){ msg.className='msg err'; msg.textContent='Gabim.'; } }
  if(btn) btn.disabled=false;
}
function mainLidhjaSnippet(m){
  const neGraceperiod = !!(prog && prog.biznesiAuto && prog.ditet < 7);
  const paralajmerimi = neGraceperiod
    ? '<div style="background:#0e2a1a;border:1px solid var(--good);border-radius:10px;padding:16px;margin:12px 0 18px;">'+
        '<p style="margin:0;color:#7ee2a8;">Reklama jote tashmë është aktive dhe mund të shfaqet te rrjeti gjatë 7 ditëve të para, edhe pa lidhur hapësirë ende. Lidhe kur të jesh gati, brenda kësaj periudhe, që të vazhdojë të shfaqet edhe më tej.</p>'+
      '</div>'
    : '<div style="background:#3a1212;border:1px solid var(--err);border-radius:10px;padding:16px;margin:12px 0 18px;">'+
        '<p style="margin:0 0 10px;color:#f5b6b6;">S\'ke asnjë hapësirë reklame aktive te faqja jote.</p>'+
        '<p class="small" style="margin:0;">Rrjeti ynë punon me shkëmbim: ti shfaq reklamat e bizneseve të tjera te faqja jote, dhe ata shfaqin tuajat te faqet e tyre. Meqë tani s\'po shfaq asnjë reklamë (s\'ke hapësirë aktive), <b>as reklamat e tua s\'po marrin shfaqje</b> te rrjeti.</p>'+
      '</div>';
  m.innerHTML=
    '<h2 class="h">'+(neGraceperiod ? 'Lidhja e hapësirës së reklamave' : 'Reklamat e tua nuk po shfaqen')+'</h2>'+
    paralajmerimi+
    '<div class="small" style="margin-bottom:18px;">'+
      '<p><b>Si ta rregullosh:</b></p>'+
      '<p>1. Krijo një hapësirë reklame (i vë një emër, p.sh. "Fund faqe").</p>'+
      '<p>2. Vendos kodin e saj te faqja jote, aty ku do të shfaqet reklama.</p>'+
      '<p>3. Verifiko lidhjen. Sapo një hapësirë bëhet aktive, reklamat e tua kthehen në rrjet menjëherë.</p>'+
    '</div>'+
    '<button class="btn cta" onclick="lidhHapesiren()">Lidh hapësirën e reklamave →</button>';
}
async function lidhHapesiren(){
  // Nese ka snippet-e ekzistuese → te lista; nese s'ka → krijo te re direkt
  try{
    const r=await(await fetch('/api/snippetet')).json();
    const lista=r.snippetet||[];
    if(lista.length){ nav({v:'profile',nav:'snippetet'}); }
    else { snipKrijo(); }
  }catch(e){ nav({v:'profile',nav:'snippetet'}); }
}
function mainReklamat(m, s){
  s = s || {};
  if(s.sub==='detail'){ return hapReklame(s.id, m); }
  if(s.sub==='create'){ return krijoReklame(m, s); }
  m.innerHTML=
    '<h2 class="h">My Ads</h2>'+
    '<div id="rekShiritSnippet"></div>'+
    '<div style="margin:12px 0 14px;"><button class="btn cta" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})">+ Create</button></div>'+
    '<div id="reklamaList"><p class="small">Po ngarkoj…</p></div>';
  loadReklamat();
  rekKontrolloSnippet();
}
async function rekKontrolloSnippet(){
  const el=$('rekShiritSnippet'); if(!el) return;
  try{
    const pr=await(await fetch('/api/progres')).json();
    const neGraceperiod = !!(pr.biznesiAuto && pr.ditet < 7);
    if(!pr.lidhja && !neGraceperiod){
      el.innerHTML='<div onclick="nav({v:\'profile\',nav:\'lidhjaSnippet\'})" style="cursor:pointer;background:#3a1212;border:1px solid var(--err);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;">'+
        '<div style="flex:1;"><div style="color:var(--err);font-weight:600;">Reklamat e tua nuk po shfaqen</div>'+
        '<div class="small" style="margin-top:2px;">S\'ke asnjë hapësirë reklame aktive. Meqë s\'po shfaq reklamat e të tjerëve, as reklamat e tua s\'po marrin shfaqje. Kliko për të mësuar si →</div></div>'+
        '<button class="btn cta" style="white-space:nowrap;" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'lidhjaSnippet\'})">Shiko</button></div>';
    } else if(!pr.lidhja && neGraceperiod){
      el.innerHTML='<div style="background:#0e2a1a;border:1px solid var(--good);border-radius:10px;padding:12px 14px;">'+
        '<div class="small" style="color:#7ee2a8;">Reklama jote tashmë është aktive te rrjeti, edhe pa lidhur hapësirë ende — lidhe brenda 7 ditëve të para që të vazhdojë të shfaqet.</div></div>';
    } else { el.innerHTML=''; }
  }catch(e){}
}
async function loadReklamat(){
  const el=$('reklamaList'); if(!el) return;
  try{
    const rows=await(await fetch('/api/reklamat?logjika='+(window.__llogariaModaliteti||'ankand'))).json();
    window.__reklamat = rows;
    if(!rows.length){ el.innerHTML='<p class="small">Ende s\'ke krijuar reklama. Kliko “+ Create”.</p>'; return; }
    let h='<div class="rektbl"><div class="rekhead"><span>Reklama</span><span>Shikime</span><span>Klikime</span><span>Konvertime</span><span></span><span></span></div>';
    rows.forEach(r=>{
      const thumb = r.imazh_url ? '<span class="rekthumb"><img src="'+esc(r.imazh_url)+'"></span>' : '<span class="rekthumb">▦</span>';
      const tgl = '<label class="tgl" title="'+(r.pauzuar?'E pauzuar':'Aktive')+'" onclick="event.stopPropagation()"><input type="checkbox" '+(r.pauzuar?'':'checked')+' onchange="reklamaPauza('+r.id+',this.checked)"><span class="slider"></span></label>';
      const xbtn = '<button class="btn" style="padding:4px 9px;" title="Fshi" onclick="event.stopPropagation();reklamaKonfirmoFshi('+r.id+',\''+esc((r.emri||'').replace(/\x27/g,""))+'\')">✕</button>';
      h+='<div class="rekrow" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'detail\',id:'+r.id+'})">'+
         '<span class="rekname">'+thumb+'<span class="nm">'+esc(r.emri)+'</span></span>'+
         '<span>'+r.shikime+'</span><span>'+r.klikime+'</span><span>'+r.konvertime+'</span>'+
         '<span>'+tgl+'</span><span>'+xbtn+'</span></div>';
    });
    h+='</div>';
    el.innerHTML=h;
  }catch(e){ el.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; }
}

function reklamaKonfirmoFshi(id, emri){
  const bd=$('backdrop'); if(!bd) return;
  bd.innerHTML='<div class="modal card"><button class="x" onclick="mbyllReklamaModal()">×</button>'+
    '<h3 style="margin:0 0 10px;">Fshi reklamën?</h3>'+
    '<p class="small mut">Je i sigurt që do të fshish "<b>'+esc(emri||'këtë reklamë')+'</b>"? Kjo reklamë nuk do të shfaqet më dhe nuk mund të kthehet.</p>'+
    '<div style="display:flex;gap:10px;margin-top:16px;">'+
      '<button class="btn" style="flex:1;" onclick="mbyllReklamaModal()">Anulo</button>'+
      '<button class="btn" style="flex:1;background:#dc2626;color:#fff;border-color:#dc2626;" onclick="reklamaFshi('+id+')">Fshi</button>'+
    '</div></div>';
  bd.classList.remove('hide');
}
async function reklamaFshi(id){
  try{
    await fetch('/api/reklamat/'+id,{method:'DELETE'});
    mbyllReklamaModal();
    window.__reklamat=null;
    loadReklamat();
    try{ await ngarkoNjoftimet(); }catch(e){}
  }catch(e){}
}
function mbyllReklamaModal(){ const b=$('backdrop'); if(b){ b.classList.add('hide'); b.innerHTML=''; } }


async function reklamaPauza(id, aktiv){
  const pauzuar = !aktiv;   // toggle ON = aktive; OFF = pauzuar
  try{
    await fetch('/api/reklamat/'+id+'/pauza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pauzuar})});
    try{ await ngarkoNjoftimet(); }catch(e){}   // rifresko ziljen menjehere
  }catch(e){}
}


var _rekTab = 'reklama';
async function hapReklame(id, m){
  m.innerHTML='<p class="small">Po ngarkoj…</p>';
  let rows=window.__reklamat;
  if(!rows){ try{ rows=await(await fetch('/api/reklamat')).json(); window.__reklamat=rows; }catch(e){ rows=[]; } }
  const r=(rows||[]).find(x=>x.id===id)||{};
  _rekTab='reklama';
  m.innerHTML=
    '<h2 class="h">'+esc(r.emri||'Reklama')+'</h2>'+
    '<div style="display:flex;gap:10px;margin:14px 0 18px;border-bottom:1px solid var(--line);">'+
      '<button class="rekTabBtn active" id="rekTabReklama" onclick="rekSetTab(\'reklama\','+id+')">Reklama</button>'+
      '<button class="rekTabBtn" id="rekTabAudienca" onclick="rekSetTab(\'audienca\','+id+')">Audienca</button>'+
    '</div>'+
    '<style>.rekTabBtn{background:none;border:none;color:var(--mut);padding:8px 4px;margin-right:18px;cursor:pointer;font-size:14px;font-weight:600;border-bottom:2px solid transparent;}'+
      '.rekTabBtn.active{color:var(--txt);border-color:var(--acc);}</style>'+
    '<div id="rekTabPermbajtja"></div>';
  rekRenderReklama(r, id);
}
function rekSetTab(t, id){
  _rekTab=t;
  const bR=$('rekTabReklama'), bA=$('rekTabAudienca');
  if(bR) bR.className='rekTabBtn'+(t==='reklama'?' active':'');
  if(bA) bA.className='rekTabBtn'+(t==='audienca'?' active':'');
  const rows=window.__reklamat||[];
  const r=rows.find(x=>x.id===id)||{};
  if(t==='reklama') rekRenderReklama(r, id); else rekRenderAudienca(id);
}
function rekFormatPreviewHTML(r){
  if(r.imazh_url) return '<img src="'+esc(r.imazh_url)+'" style="max-width:100%;max-height:220px;border-radius:10px;display:block;">';
  if(r.video_url) return '<div class="small mut">Video: '+esc(r.video_url)+'</div>';
  if(r.html5_url) return '<iframe src="'+esc(r.html5_url)+'" style="width:100%;height:220px;border:none;border-radius:10px;"></iframe>';
  if(r.teksti) return '<div style="padding:16px;background:#0e1116;border-radius:10px;">'+esc(r.teksti)+'</div>';
  return '<p class="small mut">Pa format ende.</p>';
}
function rekRenderReklama(r, id){
  const konvLidhur = !!(une && une.url_konvertimi);
  const konvKuti = '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.konvertime||0)+'</div><div class="small">Konvertime</div></div>';
  const c=$('rekTabPermbajtja'); if(!c) return;
  c.innerHTML=
    '<div style="margin-bottom:16px;">'+rekFormatPreviewHTML(r)+'</div>'+
    '<div style="display:flex;gap:10px;margin:14px 0;">'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.shikime||0)+'</div><div class="small">Shikime</div></div>'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.klikime||0)+'</div><div class="small">Klikime</div></div>'+
      konvKuti+
    '</div>'+
    '<p class="small">Variantet e krijuara (Image / Video / HTML5) do të shfaqen këtu — për të parë cili performon më mirë në testim.</p>'+
    '<div class="card" style="margin-top:18px;"><h3 class="h" style="font-size:15px;margin:0 0 12px;">Ecuria (30 ditët e fundit)</h3><canvas id="rekEcuriaCanvas" height="90"></canvas></div>';
  rekVizatoEcurine(id);
}
async function rekVizatoEcurine(id){
  try{
    const rows=await(await fetch('/api/reklamat/'+id+'/ecuria')).json();
    const ctx=$('rekEcuriaCanvas'); if(!ctx||!window.Chart) return;
    if(window.__rekChart) window.__rekChart.destroy();
    window.__rekChart=new Chart(ctx,{type:'line',data:{
      labels:rows.map(x=>x.dita),
      datasets:[
        {label:'Shikime',data:rows.map(x=>x.shikime),borderColor:'#4a9eff',tension:.3},
        {label:'Klikime',data:rows.map(x=>x.klikime),borderColor:'#3fb950',tension:.3}
      ]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
  }catch(e){}
}
async function rekRenderAudienca(id){
  const c=$('rekTabPermbajtja'); if(!c) return;
  c.innerHTML='<p class="small">Po ngarkoj…</p>';
  let cur={vendet:[],pajisjet:[]};
  try{ cur=await(await fetch('/api/reklamat/'+id+'/audienca')).json(); }catch(e){}
  const VENDET=['Shqipëri','Kosovë','Itali','Gjermani','SHBA','Mbretëri e Bashkuar','Francë','Tjetër (global)'];
  const PAJISJET=[{v:'desktop',l:'Desktop'},{v:'mobile',l:'Mobile'}];
  c.innerHTML=
    '<p class="small mut" style="margin-bottom:16px;">Zgjidh shtetet/pajisjet ku dëshiron ta shfaqësh (lëre bosh për të gjitha).</p>'+
    '<div class="small" style="font-weight:600;margin-bottom:8px;">Shtetet</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">'+
      VENDET.map(v=>'<label style="display:flex;align-items:center;gap:6px;background:#0e1116;border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer;">'+
        '<input type="checkbox" value="'+esc(v)+'" class="rekAudVend" '+(cur.vendet.includes(v)?'checked':'')+'> '+esc(v)+'</label>').join('')+
    '</div>'+
    '<div class="small" style="font-weight:600;margin-bottom:8px;">Pajisjet</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:20px;">'+
      PAJISJET.map(p=>'<label style="display:flex;align-items:center;gap:6px;background:#0e1116;border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer;">'+
        '<input type="checkbox" value="'+p.v+'" class="rekAudPaj" '+(cur.pajisjet.includes(p.v)?'checked':'')+'> '+p.l+'</label>').join('')+
    '</div>'+
    '<button class="primary" id="rekAudRuaj" onclick="rekAudRuaj('+id+')">Ruaj</button>'+
    '<div class="msg" id="rekAudMsg"></div>';
}
async function rekAudRuaj(id){
  const vendet=Array.from(document.querySelectorAll('.rekAudVend:checked')).map(x=>x.value);
  const pajisjet=Array.from(document.querySelectorAll('.rekAudPaj:checked')).map(x=>x.value);
  const btn=$('rekAudRuaj'), msg=$('rekAudMsg');
  if(btn) btn.disabled=true;
  try{
    const r=await(await fetch('/api/reklamat/'+id+'/audienca',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({vendet,pajisjet})})).json();
    if(msg){ msg.className=r.error?'msg err':'msg ok'; msg.textContent=r.error||'U ruajt.'; }
  }catch(e){ if(msg){ msg.className='msg err'; msg.textContent='Gabim.'; } }
  if(btn) btn.disabled=false;
}
function krijoReklame(m, s){
  s = s || {};
  // Nese eshte zgjedhur nje format, shfaq formen perkatese
  if(s.format==='image'){ window.__adType='image'; return ngarkoImazhUI(); }
  if(s.format==='video'){ window.__adType='video'; return ngarkoVideoUI(); }
  if(s.format==='html5'){ window.__adType='html5'; return ngarkoHtml5UI(); }
  // Ndryshe, shfaq zgjedhjen e tre formateve
  m.innerHTML=
    '<h2 class="h">Krijo reklamë</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Zgjidh llojin që do të ngarkosh.</p>'+
    '<div id="adTypeWrap2"></div>';
  adTypeUI($('adTypeWrap2'));
}

// ZËVENDËSO funksionin ekzistues mainEkipi(m) (placeholder "vjen së shpejti") me këtë.
// Asgjë tjetër te app.js s'ka nevojë të ndryshojë — rrjedha e navigimit (avatar → nav({v:'profile',nav:'ekipi'}))
// mbetet identike, thjesht vetë funksioni tani ndërton interface të vërtetë brenda 'm'.

var _ekipiTab = 'permbledhje';
var _ekipiCache = { anetaret: null, rolet: null, ftesat: null, aktiviteti: null };

function mainEkipi(m){
  m.innerHTML='<h2 class="h">Ekipi & Rolet</h2>'+
    '<p class="small" style="margin:8px 0 16px;">Ftoj kolegë të menaxhojnë llogarinë me role të ndryshme (admin/editor/lexues).</p>'+
    '<div class="card"><p class="small mut">Kjo veçori vjen së shpejti.</p></div>';
}



function mainPlani(m){
  m.innerHTML='<h2 class="h">Plani</h2>'+
    '<div style="border:1px solid var(--line);border-radius:12px;padding:20px;margin-top:14px;">'+
      '<div style="font-size:18px;font-weight:600;">Plani Falas</div>'+
      '<p class="small" style="margin:8px 0 0;">Aktualisht je në planin falas. Ke qasje te rrjeti i cross-promocionit, gjurmimi i konvertimeve dhe analitika bazë.</p>'+
    '</div>'+
    '<p class="small" style="margin-top:16px;color:var(--mut);">Planet me pagesë do të vijnë së shpejti — me përparësi në renditje dhe veçori shtesë.</p>';
}
function mainSuport(m){
  m.innerHTML='<h2 class="h">Ndihmë & Suport</h2>'+
    '<p class="small" style="margin:10px 0 16px;">Ke një pyetje ose problem? Na shkruaj dhe të ndihmojmë.</p>'+
    '<div style="border:1px solid var(--line);border-radius:12px;padding:20px;">'+
      '<p class="small" style="margin:0;">Email: <b>suport@phronexusai.com</b></p>'+
    '</div>';
}
function renderVStep(){
  const nx=nextIncomplete(), el=$('vstep'); el.innerHTML='';
  STEPS.forEach((s,i)=>{
    const done=prog[s.key], isCur=(i===nx), locked=(i>nx), clickable=done||isCur;
    const d=document.createElement('div');
    d.className='vs'+(done?' done':'')+(isCur?' cur':'')+(locked?' locked':'')+(clickable?' click':'');
    d.innerHTML='<span class="vd">'+(done?'✓':(i+1))+'</span><span class="vl">'+s.label+
      (isCur?' — vazhdo':'')+(locked?' — i kyçur':'')+'</span>';
    if(clickable) d.onclick=()=>openWizard(i);
    el.appendChild(d);
  });
}

// ---------- WIZARD ----------
function startWizard(){ if(une){ openWizard(nextIncomplete()); } else { hapModal('reg'); } }

// ---------- ZGJEDHJA (Manual vs Automatic), shfaqet 1 here, menjehere pas hyrjes se pare ----------
var _zgjTab = 'automatic';
function renderZgjedhja(){
  const el = $('v-zgjedhja'); if(!el) return;
  el.innerHTML =
    '<div class="wrap" style="max-width:640px;margin:60px auto;">'+
      '<h2 class="h" style="text-align:center;">Si dëshiron ta fillosh?</h2>'+
      '<p class="small mut" style="text-align:center;margin:6px 0 28px;">Zgjidh njërën, mund ta ndryshosh më vonë.</p>'+
      '<style>'+
        '.zgjTabBtn{flex:1;padding:16px;border-radius:12px;border:1.5px solid var(--line);background:#0e1116;color:var(--txt);'+
          'font-size:15px;font-weight:600;cursor:pointer;position:relative;transition:border-color .15s,background .15s;}'+
        '.zgjTabBtn:active{transform:none;}'+
        '.zgjTabBtn.sel{border-color:var(--acc);background:rgba(59,110,240,.08);}'+
        '.zgjBadge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--acc);color:#fff;'+
          'font-size:10px;font-weight:700;letter-spacing:.03em;padding:3px 10px;border-radius:20px;text-transform:uppercase;}'+
      '</style>'+
      '<div style="display:flex;gap:14px;margin-bottom:24px;">'+
        '<button class="zgjTabBtn sel" id="zgjBtnAuto" onclick="zgjSetTab(\'automatic\')">'+
          '<span class="zgjBadge">Rekomandohet</span>Automatic'+
        '</button>'+
        '<button class="zgjTabBtn" id="zgjBtnManual" onclick="zgjSetTab(\'manual\')">Manual</button>'+
      '</div>'+
      '<div id="zgjPermbajtja"></div>'+
    '</div>';
  zgjSetTab('automatic');
}
function zgjSetTab(t){
  _zgjTab = t;
  const bM=$('zgjBtnManual'), bA=$('zgjBtnAuto');
  if(bM) bM.className = 'zgjTabBtn'+(t==='manual'?' sel':'');
  if(bA) bA.className = 'zgjTabBtn'+(t==='automatic'?' sel':'');
  const c = $('zgjPermbajtja'); if(!c) return;
  if(t==='manual'){
    c.innerHTML =
      '<div class="card">'+
        '<p class="small" style="margin:0 0 16px;">Plotëso vetë të dhënat e biznesit, përshkrimin, dhe lidh snippet-in — hap pas hapi, me kontroll të plotë mbi çdo detaj.</p>'+
        '<button class="primary" style="width:100%;" onclick="nav({v:\'wizard\',step:0})">Vazhdo manualisht →</button>'+
      '</div>';
  } else {
    c.innerHTML =
      '<div class="card">'+
        '<p class="small" style="margin:0 0 16px;">Jep vetëm URL-në e biznesit tënd — platforma plotëson vetë emrin, kategorinë, dhe përshkrimin, dhe krijon një reklamë fillestare automatikisht, që të fillosh menjëherë.</p>'+
        '<label>URL e biznesit</label><input id="zgjAutoUrl" placeholder="https://biznesi-im.com">'+
        '<button class="primary" style="width:100%;margin-top:14px;" id="zgjAutoBtn" onclick="zgjVazhdoAutomatik()">Vazhdo automatikisht →</button>'+
        '<div class="msg" id="zgjAutoMsg"></div>'+
      '</div>';
  }
}
async function zgjVazhdoAutomatik(){
  const url = ($('zgjAutoUrl').value||'').trim();
  const msg = $('zgjAutoMsg'), btn = $('zgjAutoBtn');
  if(!url){ msg.textContent='Fut URL-në e biznesit tënd.'; msg.className='msg err'; return; }
  btn.disabled = true; msg.textContent='Duke analizuar faqen tënde…'; msg.className='msg';
  try{
    const r = await (await fetch('/api/zgjedhja-automatike',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({url})})).json();
    if(r.error){ msg.textContent=r.error; msg.className='msg err'; btn.disabled=false; return; }
    await refreshProg();
    nav({v:'profile',nav:'dashboard'});
  }catch(e){ msg.textContent='Gabim: '+e.message; msg.className='msg err'; btn.disabled=false; }
}
function closeWizard(){
  if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
  if(!une){ nav({v:'hero'}); return; }
  // Cohu direkt te dashboard-i i sakte, sipas modalitetit te zgjedhur ne wizard
  nav({v:'profile', nav:'dashboard'});
}

// Ruaj modalitetin Ankand/Balance PARA se te vazhdoje wizPlotesoBiz() origjinal — s'e prek fare ate funksion.
async function wizPlotesoBizMeModalitet(){
  const m = segVal('a_logjika') || 'ankand';
  try{
    await fetch('/api/logjika-shperndarjes',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({logjika_shperndarjes: m})});
    window.__llogariaModaliteti = m;
    if(une) une.logjika_shperndarjes = m;
  }catch(e){ /* fail-open — vazhdo gjithsesi, s'e ndal regjistrimin per kete */ }
  wizPlotesoBiz();
}
function openWizard(i){ const max=STEPS.length; if(i>max) i=max; nav({v:'wizard', step:i}); }
function renderWizard(i){
  if(!une) i=0;
  if(i>STEPS.length) i=STEPS.length;
  curStep=i; showView('wizard'); renderHStep(); renderStepBody(i);
}
function renderHStep(){
  const total = STEPS.length;
  if(curStep>=total){ $('wizStepN').textContent='Opsionale'; }
  else $('wizStepN').textContent='Hapi '+(curStep+1)+' nga '+total;
  const el=$('hstep'); el.innerHTML='';
  STEPS.forEach((s,i)=>{
    const done=une&&prog[s.key], cur=(i===curStep);
    const d=document.createElement('div');
    d.className='st'+(done?' done':'')+(cur?' cur':'');
    d.innerHTML='<div class="dot">'+(done?'✓':(i+1))+'</div><div class="lbl">'+s.label+'</div>';
    el.appendChild(d);
  });
}
async function advance(){
  await refreshProg();
  // Nese hapi u hap si pamje e vecante (nga Dashboard-i), kthehu te Dashboard
  if(window.__pamjeVecante){ window.__pamjeVecante=false; nav({v:'profile',nav:'dashboard'}); return; }
  renderHStep();
  const nx=nextIncomplete();
  if(nx>=STEPS.length){ closeWizard(); return; }
  openWizard(nx);
}
function renderStepBody(i){
  window.__pamjeVecante=false;
  const b=$('wizBody');
  if(i===0) return stepLlogaria(b);
  if(i===1) return stepPershkrimi(b);
  if(i===2) return stepLidhja(b);
  if(i===3) return stepKonvertimi(b);   // opsional — hapet nga "Aktivizo" te Konvertimet, jo nga rrjedha
}

// STEP 3 — Konvertimi (faqja qe shfaqet vetem pas regjistrimit)
// Pamja e VETME e lidhjes se konvertimit (brenda profilit, si Creatives)
var _kufKatZgjedhur = null; // Set() me kategorite AKTUALISHT te perjashtuara
async function mainKufizimetKategori(m){
  m.innerHTML='<h2 class="h">Kufizimet e Kategorive</h2>'+
    '<p class="small mut" style="margin:4px 0 14px;">Kategori të <b>shënuara</b> = mund t\'i shfaqin reklamat e tyre te ti (dhe reklamat e tua te ta). Kategori <b>e pashënuar</b> = e bllokuar plotësisht (as marrje, as dhënie ekspozimi). Kategoria jote (konkurrenca e njohur) fillon e pashënuar — shëno nëse do ta lejosh.</p>'+
    '<div id="kufKatLista"><p class="small mut">Po ngarkoj…</p></div>'+
    '<button class="primary" style="margin-top:16px;" onclick="kufKatRuaj()">Ruaj</button>'+
    '<span class="small" id="kufKatStat" style="margin-left:10px;"></span>';
  try{
    const r=await(await fetch('/api/kategori-kufizimet')).json();
    // BACKEND-i vazhdon te kthej "perjashtuar" (kategorite e BLLOKUARA) — vetem SHFAQJA
    // ketu eshte e KTHYER: checkbox i SHENUAR = LEJUAR (jo ne "perjashtuar"), i pashenuar
    // = BLLOKUAR (eshte ne "perjashtuar"). _kufKatZgjedhur mban gjithmone kategorite E
    // BLLOKUARA (njesoj si backend-i), thjesht checkbox-i i shfaqet TI PERMBYSUR.
    _kufKatZgjedhur = new Set(r.perjashtuar||[]);
    if(r.vetjaKatVjeteruar){
      m.innerHTML = '<div style="padding:12px 16px;background:#3a2f14;border:1px solid #a38333;border-radius:8px;margin-bottom:16px;color:#ffcf80;">'+
        '⚠️ Kategoria jote aktuale ("'+esc(r.vetjaKat)+'") është nga sistemi i vjetër dhe s\'përputhet me listën e re — prandaj s\'është trajtuar automatikisht si konkurrencë. '+
        '<a href="#" onclick="event.preventDefault();nav({v:\'profile\',nav:\'pershkrimi\'});" style="color:var(--acc);">Ri-analizo përshkrimin</a> për ta përditësuar.'+
        '</div>' + m.innerHTML;
    }
    const el=$('kufKatLista');
    el.innerHTML=(r.kategorite||[]).map(function(k){
      const eshteBllokuar=_kufKatZgjedhur.has(k);
      const eshteLejuar=!eshteBllokuar;   // checkbox i SHENUAR = lejuar
      const eshteVetja=(k===r.vetjaKat);
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">'+
        '<input type="checkbox" '+(eshteLejuar?'checked':'')+
          ' style="width:15px;height:15px;min-width:15px;flex:0 0 15px;margin:0;cursor:pointer;" '+
          'onchange="kufKatToggloi(\''+k.replace(/'/g,"\\'")+'\',this.checked)">'+
        '<span style="font-size:13px;flex:1;">'+esc(k)+(eshteVetja?' <span class="small mut">(kategoria jote)</span>':'')+'</span>'+
        '</div>';
    }).join('');
  }catch(e){ m.innerHTML+='<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
function kufKatToggloi(kategoria, eSHENUAR){
  if(!_kufKatZgjedhur) return;
  // eSHENUAR (checkbox u be checked) = LEJUAR = HIQ nga bashkesia e bllokuarave.
  // eSHENUAR=false (u zhgjidh) = BLLOKUAR = SHTO ne bashkesine e bllokuarave.
  if(eSHENUAR) _kufKatZgjedhur.delete(kategoria); else _kufKatZgjedhur.add(kategoria);
}
async function kufKatRuaj(){
  const stat=$('kufKatStat');
  try{
    await fetch('/api/kategori-kufizimet', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ perjashtuar: Array.from(_kufKatZgjedhur||[]) })
    });
    if(stat){ stat.textContent='✓ U ruajt.'; setTimeout(()=>{ stat.textContent=''; },2000); }
  }catch(e){ if(stat) stat.textContent='Gabim: '+e.message; }
}

function mainKonvertimi(m){
  ndertoKonvertim(m, false);
}
// Hapi opsional i wizardit (arrihet vetem nga "Aktivizo"/Dashboard perpara krijimit)
function stepKonvertimi(b){
  ndertoKonvertim(b, true);
}
function ndertoKonvertim(b, ngaWizard){
  const pasRuajtjes = ngaWizard
    ? 'nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})'
    : 'nav({v:\'profile\',nav:\'dashboard\'})';
  b.innerHTML=
    '<h2 class="h">Gjurmo konvertimet</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Kur dikush klikon reklamën tënde dhe pastaj kryen një veprim që ka vlerë — regjistrohet, blen, ose lë të dhënat — kjo quhet <b>konvertim</b>. Gjurmimi i konvertimeve rrit pikët e tua të profilit, që rrisin sa shpesh shfaqet reklama jote.</p>'+
    // KODI I SNIPPET-IT — gjithmone i dukshem (vlen per te dyja rruget)
    '<div style="padding:14px;border:1px solid var(--line);border-radius:10px;background:#0e1116;margin-bottom:16px;">'+
      '<b style="font-size:14px;">Rreshti i gjurmimit</b>'+
      '<p class="small" style="margin:6px 0 10px;">Ky rresht <b>nuk shfaq asgjë</b> — vetëm gjurmon konvertimet (nga adresa ose nga kodi, sipas zgjedhjes poshtë). Vendose para <code>&lt;/body&gt;</code> te <b>skedari kryesor</b> që ngarkohet në çdo faqe të sajtit tënd. Varet nga si është ndërtuar sajti — p.sh. <i>theme.liquid</i> (Shopify), <i>layout.html / base.html</i> (shabllon i përbashkët), <i>index.html</i>, ose <i>_app.js / App.jsx</i> (React/Next). Nëse ke disa shabllone, vendose te secili.</p>'+
      '<div class="kodbox" id="k_kod"></div>'+
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">'+
        '<button class="btn" onclick="kopjoTrack()">Kopjo</button>'+
        '<button class="btn" id="k_ver" onclick="riverifikoSnippet()">Verifiko lidhjen</button>'+
      '</div>'+
      '<div id="k_snipStat" style="margin-top:10px;"></div>'+
      '<div id="claudeSuportKonv" style="margin-top:12px;"></div>'+
    '</div>'+
    // ZGJEDHJA: me URL ose me kod
    '<label>Si e shënon konvertimin?</label>'+
    '<p class="small" style="margin:2px 0 8px;">Dy mënyra: <b>Me adresë</b> — nëse pas konvertimit hapet një faqe e veçantë (p.sh. një faqe "faleminderit" ose "mirë se erdhe"), na jep atë adresë. <b>Me kod</b> — nëse konvertimi ndodh pa ndryshuar faqe (p.sh. klikimi i një butoni, dërgimi i një forme), vendos një rresht te ai veprim.</p>'+
    '<div class="seg" id="k_ka">'+
      '<button type="button" data-v="po" onclick="segPick(this);kSwitch()">Me adresë</button>'+
      '<button type="button" data-v="jo" onclick="segPick(this);kSwitch()">Me kod</button>'+
    '</div>'+
    '<div id="k_po" class="hide" style="margin-top:14px;">'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'+
        '<span style="color:var(--acc);font-weight:700;">*</span>'+
        '<label style="margin:0;">Adresat e faqeve te konvertimit</label>'+
      '</div>'+
      '<p class="small" style="margin:0 0 10px;">Fut adresën e plotë të faqes që hapet pas konvertimit, p.sh. <b>https://faqja-ime.com/welcome</b>. Pasi të vendosësh kodin lart, kliko <b>Verifiko</b> te secila adresë. Kliko <b>+</b> për të shtuar një tjetër.</p>'+
      '<div id="k_lista"></div>'+
      '<button class="btn" style="margin-top:8px;" onclick="konvShto()">+ Shto adrese</button>'+
      '<div id="k_stat" class="small" style="margin-top:12px;"></div>'+
      '<button class="primary" id="k_btn" onclick="mbyllKonvertim(\''+pasRuajtjes.replace(/'/g,"\\'")+'\')">Dil →</button>'+
    '</div>'+
    '<div id="k_jo" class="hide" style="margin-top:14px;">'+
      '<p class="small" style="margin:0 0 12px;">Thirre kodin poshtë pikërisht aty ku ndodh <b>konvertimi i vërtetë</b> — te veprimi që ka vlerë për ty (regjistrim i përfunduar, blerje e kryer, formë e dërguar me sukses). Konvertimi gjurmohet vetëm kur ky veprim ndodh vërtet nga një vizitor real. Kërkon që rreshti i gjurmimit lart të jetë vendosur — ai krijon funksionin <code>imyr.konvertim()</code>.</p>'+
      '<p class="small" style="margin:0 0 6px;">Nëse ke <b>disa lloje konvertimi</b> (p.sh. regjistrim dhe blerje), jepi secilit një emër që t\'i dallosh më vonë. Për secilin merr kodin e vet:</p>'+
      '<div id="k_zonaLista"></div>'+
      '<button class="btn" style="margin-top:8px;" onclick="zonaShto()">+ Shto lloj</button>'+
      '<button class="primary" onclick="mbyllKonvertim(\''+pasRuajtjes.replace(/'/g,"\\'")+'\')" style="margin-top:18px;display:block;">'+(ngaWizard?'Vazhdo →':'Dil →')+'</button>'+
    '</div>'+
    '<div class="msg" id="k_msg"></div>';
  if(une && une.url_konvertimi){
    const btn=document.querySelector('#k_ka button[data-v="po"]');
    if(btn){ segPick(btn); kSwitch(); }
  }
  mbushTrack();
  ngarkoKonvertimet();
  kontrolloSnippetFresket();
  vizatoClaudeSuport('Konv');
}
// Kontroll i fresket i snippet-it te gjurmimit kur hapet seksioni.
// Serveri viziton faqen publike dhe sheh nese kodi eshte ende aty.
async function riverifikoSnippet(){
  // Hap faqen (qe kodi te ngarkohet) dhe rikontrollo snippet-in
  let faqja=(une && une.website) || '';
  if(faqja && !/^https?:\/\//i.test(faqja)) faqja='https://'+faqja;
  if(faqja){ try{ window.open(faqja,'_blank','noopener'); }catch(e){} }
  const nj=$('k_snipStat'); if(nj) nj.innerHTML='<span class="spin"></span> Po kontrolloj sërish…';
  setTimeout(()=>{ kontrolloSnippetFresket(); }, 2500);
}
async function kontrolloSnippetFresket(){
  const nj=$('k_snipStat'); if(nj) nj.innerHTML='<span class="spin"></span> Po kontrolloj nëse snippet-i është ende te faqja…';
  try{
    const r=await(await fetch('/api/track-fresket')).json();
    if(!nj) return;
    if(r.aktiv){
      nj.innerHTML='<div style="background:#123a1e;border:1px solid var(--good);color:#b6f5c8;padding:10px 12px;border-radius:8px;font-size:13px;">✓ Snippet-i u lidh me sukses.</div>';
      setTimeout(()=>{ const x=$('k_snipStat'); if(x && x.innerHTML.indexOf('u lidh me sukses')>-1) x.innerHTML=''; }, 5000);
      // Nese pati bisedE me asistentin te konvertimet, ruaj implementimin e rrenjes
      try{
        if(_claudeHist && _claudeHist['Konv'] && _claudeHist['Konv'].length){
          fetch('/api/asistenti/ruaj-vendin',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({mesazhet:_claudeHist['Konv'], lloji:'rrenja'})}).catch(()=>{});
        }
      }catch(e){}
      // Pika/njoftimi plotesohen VETEM nese ka edhe nje URL ose kod te lidhur — e leme serverin te vendose.
      try{ await refreshProg(); }catch(e){}
      try{ await ngarkoNjoftimet(); }catch(e){}
      if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
    }
    else{
      nj.innerHTML='<div style="background:#3d1418;border:1px solid var(--err);color:#ffb3b3;'+
        'padding:10px 12px;border-radius:8px;font-size:13px;">⚠ Snippet-i i gjurmimit nuk u gjet te faqja jote. '+
        'Vendose përsëri kodin lart te çdo faqe, pastaj kliko butonin poshtë.'+
        '<div style="margin-top:10px;"><button class="btn" onclick="riverifikoSnippet()">Kam vendosur kodin — kontrollo sërish</button></div></div>';
      // snippet-i i palidhur → URL-t u shkeputen te serveri; rifresko listen, progresin, njoftimet
      try{ await ngarkoKonvertimet(); }catch(e){}
      const kst=$('k_stat'); if(kst) kst.innerHTML='';  // pastro mesazhin "u lidhen"
      try{ await refreshProg(); }catch(e){}
      try{ ngarkoNjoftimet(); }catch(e){}
    }
  }catch(e){ if(nj) nj.innerHTML=''; }
}
// ── Disa URL konvertimi ──
var _konvUrls = [];   // {id?, url, track_active}
async function ngarkoKonvertimet(){
  try{
    const r=await(await fetch('/api/konvertimet')).json();
    _konvUrls = (r.konvertimet||[]).map(x=>({id:x.id, url:x.url, track_active:x.track_active, pauzuar:x.pauzuar}));
  }catch(e){ _konvUrls=[]; }
  if(!_konvUrls.length) _konvUrls=[{url:'', track_active:false}];  // nje fushe bosh per fillim
  vizatoKonvertimet();
}
function vizatoKonvertimet(){
  const c=$('k_lista'); if(!c) return;
  let h='';
  _konvUrls.forEach((u,i)=>{
    const status = u.id ? (u.track_active
        ? '<span style="color:var(--good);font-size:12px;white-space:nowrap;">✓ E lidhur</span>'
        : '<span style="color:var(--mut);font-size:12px;white-space:nowrap;">○ Pa lidhur</span>')
      : '<span style="color:var(--mut);font-size:12px;white-space:nowrap;">Pa ruajtur</span>';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">'+
       '<input value="'+esc(u.url)+'" placeholder="https://faqja-ime.com/welcome" oninput="konvNdrysho('+i+',this.value)" style="flex:1;min-width:140px;">'+
       '<button class="btn" style="padding:7px 12px;" onclick="verifikoNje('+i+')">Verifiko</button>'+
       (_konvUrls.length>1 ? '<button class="btn" style="padding:7px 10px;" onclick="konvKonfirmoFshi('+i+')">✕</button>' : '')+
       '<span style="min-width:74px;text-align:right;">'+status+'</span>'+
       (u.id ? '<label class="tgl" title="'+(u.pauzuar?'I pauzuar':'Aktiv')+'"><input type="checkbox" '+(u.pauzuar?'':'checked')+' onchange="konvPauza('+i+',this.checked)"><span class="slider"></span></label>' : '')+
       '</div>';
  });
  c.innerHTML=h;
  perditesoKonvBtn();
}
function konvNdrysho(i,v){ if(_konvUrls[i]){ _konvUrls[i].url=v; _konvUrls[i].track_active=false; _konvUrls[i].id=null; } perditesoKonvBtn(); }
function konvShto(){ _konvUrls.push({url:'', track_active:false}); vizatoKonvertimet(); }
// Dialog konfirmimi para fshirjes (siguri — fshirja shkeput gjurmimin)
function fshiDialog(mesazhi, onFshi){
  let d=$('fshiModal');
  if(!d){ d=document.createElement('div'); d.id='fshiModal'; document.body.appendChild(d); }
  d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
  d.innerHTML='<div style="background:var(--bg2,#161a22);border:1px solid var(--line);border-radius:12px;padding:22px;max-width:420px;margin:16px;">'+
    '<div style="font-weight:600;font-size:16px;margin-bottom:10px;">A je i sigurt?</div>'+
    '<p class="small" style="margin:0 0 8px;">'+mesazhi+'</p>'+
    '<p class="small" style="margin:0 0 18px;color:var(--mut);">Mos harro të heqësh edhe kodin/adresën përkatëse nga skedari i faqes tënde — përndryshe do të vazhdojë të dërgojë sinjale që s\'do të numërohen.</p>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;">'+
      '<button class="btn" onclick="fshiMbyll()">Anulo</button>'+
      '<button class="primary" id="fshiPo" style="background:var(--err);border-color:var(--err);">Po, hiqe</button>'+
    '</div></div>';
  $('fshiPo').onclick=()=>{ fshiMbyll(); onFshi(); };
}
function fshiMbyll(){ const d=$('fshiModal'); if(d){ d.style.display='none'; d.innerHTML=''; } }
function konvKonfirmoFshi(i){
  const u=_konvUrls[i];
  // Nese s'eshte i lidhur (bosh ose i pa-verifikuar) → fshi menjehere, pa konfirmim
  if(!u || !u.id || !u.track_active){ konvFshi(i); return; }
  const emri=u.url||'këtë adresë';
  fshiDialog('Do të heqësh <b>'+esc(emri)+'</b>. Lidhja për gjurmim do të shkëputet dhe konvertimet e saj s\'do të numërohen më.', ()=>konvFshi(i));
}
function zonaKonfirmoFshi(i){
  const z=_konvZona[i];
  // Nese s'eshte i lidhur (i sapokrijuar ose i pa-verifikuar) → fshi menjehere, pa konfirmim
  if(!z || !z.id || !z.track_active){ zonaFshi(i); return; }
  const emri=z.emri?('"'+z.emri+'"'):'këtë kod';
  fshiDialog('Do të heqësh kodin <b>'+esc(emri)+'</b>. Lidhja për gjurmim do të shkëputet dhe konvertimet e tij s\'do të numërohen më.', ()=>zonaFshi(i));
}
async function konvFshi(i){
  const u=_konvUrls[i];
  if(u && u.id){ try{ await fetch('/api/konvertimet/'+u.id,{method:'DELETE'}); }catch(e){} }
  _konvUrls.splice(i,1);
  if(!_konvUrls.length) _konvUrls=[{url:'', track_active:false}];
  vizatoKonvertimet();
  // Fshirja mund te heqe te vetmen URL te lidhur → rifresko piken/njoftimin live
  try{ await refreshProg(); }catch(e){}
  try{ await ngarkoNjoftimet(); }catch(e){}
  if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
}
function perditesoKonvBtn(){ /* butoni Dil eshte gjithmone aktiv */ }
function trackKod(){
  return '<script src="'+location.origin+'/imyr-track.js" data-key="'+((une&&une.celes)||'')+'"><\/script>';
}
function mbushTrack(){ const el=$('k_kod'); if(el) el.textContent=trackKod(); kStatus(); }
function kopjoTrack(){
  navigator.clipboard.writeText(trackKod()).then(()=>{
    const m=$('k_msg'); if(m){ m.className='msg ok'; m.textContent='U kopjua.'; setTimeout(()=>{m.textContent='';},2000); }
  }).catch(()=>{});
}
function kopjoKodKonv(){
  navigator.clipboard.writeText('imyr.konvertim();').then(()=>{
    const m=$('k_msg'); if(m){ m.className='msg ok'; m.textContent='U kopjua.'; setTimeout(()=>{m.textContent='';},2000); }
  }).catch(()=>{});
}
// ── Zonat e konvertimit me kod ──
var _konvZona = [{emri:'', id:null, track_active:false}];
function pastroEmer(emri){
  // Lejo vetem shkronja (perfshire Ö Ä etj.), numra, vize dhe nenvize — heq thonjeza/simbole qe prishin kodin
  return (emri||'').trim().replace(/[^\p{L}\p{N}_-]/gu, '');
}
function kodiZones(emri){
  emri=pastroEmer(emri);
  return emri ? ("window.imyr&&imyr.konvertim('"+emri+"');") : "window.imyr&&imyr.konvertim();";
}
async function ngarkoZonat(){
  try{
    const r=await(await fetch('/api/zonat')).json();
    _konvZona=(r.zonat||[]).map(z=>({id:z.id, emri:z.emri||'', track_active:z.track_active, pauzuar:z.pauzuar}));
  }catch(e){ _konvZona=[]; }
  if(!_konvZona.length) _konvZona=[{emri:'', id:null, track_active:false}];
  vizatoZonat();
  // Polling i lehte: rifresko statuset (nese vjen konvertim real, zona behet e verifikuar live)
  if(_zonaPoll){ clearInterval(_zonaPoll); }
  _zonaPoll=setInterval(zonaRifreskoStatus, 5000);
}
var _zonaPoll=null;
async function zonaRifreskoStatus(){
  // Ndalo nese s'jemi me te seksioni "Me kod"
  if(!$('k_zonaLista') || segVal('k_ka')!=='jo'){ if(_zonaPoll){ clearInterval(_zonaPoll); _zonaPoll=null; } return; }
  try{
    const r=await(await fetch('/api/zonat')).json();
    const nga=(r.zonat||[]);
    let ndryshoi=false;
    _konvZona.forEach(z=>{
      if(!z.id) return;
      const g=nga.find(x=>x.id===z.id);
      if(g && g.track_active!==z.track_active){ z.track_active=g.track_active; ndryshoi=true; }
    });
    // shto zona te reja qe u krijuan nga konvertime reale (s'ishin te lista)
    nga.forEach(g=>{ if(!_konvZona.some(z=>z.id===g.id)){ _konvZona.push({id:g.id, emri:g.emri||'', track_active:g.track_active}); ndryshoi=true; } });
    if(ndryshoi){ vizatoZonat();
      // nese ndonje zone eshte e lidhur → rifresko piken/njoftimin live
      if(_konvZona.some(z=>z.track_active)){
        try{ await refreshProg(); }catch(e){}
        try{ await ngarkoNjoftimet(); }catch(e){}
        if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
      }
    }
  }catch(e){}
}
function vizatoZonat(){
  const c=$('k_zonaLista'); if(!c) return;
  let h='';
  _konvZona.forEach((z,i)=>{
    const status = z.id ? (z.track_active
        ? '<span style="color:var(--good);font-size:12px;">✓ E lidhur</span>'
        : '<span style="color:var(--mut);font-size:12px;">○ Pa lidhur</span>')
      : '<span style="color:var(--mut);font-size:12px;">Pa ruajtur</span>';
    h+='<div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px;">'+
       '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
         '<input value="'+esc(z.emri)+'" placeholder="emri i llojit (p.sh. blerje) — ose lëre bosh" oninput="zonaNdrysho('+i+',this.value)" style="flex:1;">'+
         (_konvZona.length>1 ? '<button class="btn" style="padding:7px 10px;" onclick="zonaKonfirmoFshi('+i+')">✕</button>' : '')+
       '</div>'+
       '<div class="kodbox" id="k_zonaKod'+i+'">'+esc(kodiZones(z.emri))+'</div>'+
       '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap;">'+
         '<button class="btn" onclick="zonaKopjo('+i+')">Kopjo</button>'+
         '<button class="btn" onclick="zonaVerifiko('+i+')">Verifiko</button>'+
         '<span style="margin-left:auto;">'+status+'</span>'+
         (z.id ? '<label class="tgl" title="'+(z.pauzuar?'I pauzuar':'Aktiv')+'"><input type="checkbox" '+(z.pauzuar?'':'checked')+' onchange="zonaPauza('+i+',this.checked)"><span class="slider"></span></label>' : '')+
       '</div>'+
       '</div>';
  });
  c.innerHTML=h;
}
function zonaNdrysho(i,v){
  if(_konvZona[i]){ _konvZona[i].emri=v; _konvZona[i].id=null; _konvZona[i].track_active=false;
    const k=$('k_zonaKod'+i); if(k) k.textContent=kodiZones(v); }
}
function zonaShto(){ _konvZona.push({emri:'', id:null, track_active:false}); vizatoZonat(); }
async function zonaFshi(i){
  const z=_konvZona[i];
  if(z && z.id){ try{ await fetch('/api/zonat/'+z.id,{method:'DELETE'}); }catch(e){} }
  _konvZona.splice(i,1);
  if(!_konvZona.length) _konvZona=[{emri:'', id:null, track_active:false}];
  vizatoZonat();
  // Fshirja mund te heqe te vetmen zone te lidhur → rifresko piken/njoftimin live
  try{ await refreshProg(); }catch(e){}
  try{ await ngarkoNjoftimet(); }catch(e){}
  if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
}
function zonaKopjo(i){
  const z=_konvZona[i]; if(!z) return;
  navigator.clipboard.writeText(kodiZones(z.emri)).then(()=>{
    const m=$('k_msg'); if(m){ m.className='msg ok'; m.textContent='U kopjua.'; setTimeout(()=>{m.textContent='';},2000); }
  }).catch(()=>{});
}

async function konvPauza(i, aktiv){
  const u=_konvUrls[i]; if(!u || !u.id) return;
  const pauzuar = !aktiv;   // toggle ON = aktiv; OFF = pauzuar
  try{
    await fetch('/api/konvertimet/'+u.id+'/pauza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pauzuar})});
    u.pauzuar = pauzuar;
    try{ await refreshProg(); }catch(e){}
  }catch(e){}
}
async function zonaPauza(i, aktiv){
  const z=_konvZona[i]; if(!z || !z.id) return;
  const pauzuar = !aktiv;
  try{
    await fetch('/api/zonat/'+z.id+'/pauza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pauzuar})});
    z.pauzuar = pauzuar;
    try{ await refreshProg(); }catch(e){}
  }catch(e){}
}

async function zonaVerifiko(i){
  const z=_konvZona[i]; if(!z) return;
  // Ruaj zonen nese s'eshte ruajtur
  if(!z.id){
    try{
      const r=await(await fetch('/api/zonat',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({emri:pastroEmer(z.emri)})})).json();
      if(r.id){ z.id=r.id; z.track_active=!!r.track_active; }
    }catch(e){}
  }
  // Krijo nje klik PROVE dhe hap faqen me ate kod — klienti navigon te faqja e butonit dhe kryen veprimin.
  // Konvertimi prove lidh zonen POR s'numerohet si i vertete.
  try{
    const r=await(await fetch('/api/zona-prove',{method:'POST'})).json();
    let faqja=r.faqja || (une && une.website) || '';
    if(faqja && !/^https?:\/\//i.test(faqja)) faqja='https://'+faqja;
    if(faqja && r.kod){
      const sep = faqja.indexOf('?')>-1 ? '&' : '?';
      window.open(faqja + sep + 'imyr=' + encodeURIComponent(r.kod), '_blank', 'noopener');
    }
  }catch(e){}
  const m=$('k_msg'); if(m){ m.className='msg'; m.innerHTML='<span class="spin"></span> Hapëm faqen tënde. Shko te vendi ku vendose kodin dhe kryej veprimin (kliko butonin) — kjo provë s\'numërohet si konvertim.'; }
  vizatoZonat();
  if(_zonaTimer){ clearInterval(_zonaTimer); }
  let here=0;
  _zonaTimer=setInterval(async ()=>{ here++; const ok=await zonaStatus(); if(ok||here>30){ clearInterval(_zonaTimer); _zonaTimer=null; } },3000);
}
var _zonaTimer=null;
async function zonaStatus(){
  try{
    const r=await(await fetch('/api/zonat')).json();
    const nga=(r.zonat||[]);
    let ndonje=false;
    _konvZona.forEach(z=>{ const g=nga.find(x=>x.id===z.id); if(g){ z.track_active=g.track_active; if(g.track_active) ndonje=true; } });
    vizatoZonat();
    if(ndonje){
      const m=$('k_msg'); if(m){ m.className='msg ok'; m.textContent='Kodi u lidh.'; setTimeout(()=>{m.textContent='';},3000); }
      // Ruaj implementimin e kodit nese pati bisedE me asistentin
      try{
        if(_claudeHist && _claudeHist['Konv'] && _claudeHist['Konv'].length){
          fetch('/api/asistenti/ruaj-vendin',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({mesazhet:_claudeHist['Konv'], lloji:'kod'})}).catch(()=>{});
        }
      }catch(e){}
      // Zona u lidh → rifresko piken e Dashboard + njoftimin e ziles menjehere
      try{ await refreshProg(); }catch(e){}
      try{ await ngarkoNjoftimet(); }catch(e){}
      if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
    }
    return ndonje;
  }catch(e){ return false; }
}
async function kStatus(){
  const st=$('k_stat');
  try{
    const r=await(await fetch('/api/konvertimet')).json();
    const nga=(r.konvertimet||[]);
    // Burimi i vertete = pergjigja e fresket nga serveri
    _konvUrls.forEach(u=>{
      const gjet=nga.find(x=>x.url===u.url);
      if(gjet){ u.id=gjet.id; u.track_active=!!gjet.track_active; }
      else if(u.id){ u.track_active=false; }
    });
    const urletMia = _konvUrls.filter(u=>u.url.trim());
    const ka = urletMia.length>0;
    const teGjitha = ka && urletMia.every(u=>{ const g=nga.find(x=>x.id===u.id || x.url===u.url); return g && g.track_active; });
    const ndonjeLidhur = urletMia.some(u=>{ const g=nga.find(x=>x.id===u.id || x.url===u.url); return g && g.track_active; });

    vizatoKonvertimet();
    if(ndonjeLidhur){
      try{ await refreshProg(); }catch(e){}
      try{ await ngarkoNjoftimet(); }catch(e){}
      if(typeof renderDashStatus==='function' && document.getElementById('vstep')){ try{ renderDashStatus(); }catch(e){} }
    }
    if(st){
      if(ka && teGjitha){ st.innerHTML='<span style="color:var(--good)">✓ Të gjitha adresat u lidhën.</span>';
        try{
          if(_claudeHist && _claudeHist['Konv'] && _claudeHist['Konv'].length){
            fetch('/api/asistenti/ruaj-vendin',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({mesazhet:_claudeHist['Konv'], lloji:'url'})}).catch(()=>{});
          }
        }catch(e){}
        if(kTimer){ clearInterval(kTimer); kTimer=null; } return true; }
      else if(ndonjeLidhur){ st.innerHTML='<span class="mut">Disa u lidhën, të tjerat jo ende. Hap secilën faqe dhe prit…</span>'; }
      else { st.innerHTML='<span class="mut">Ende s\'i kemi parë. Vendos kodin te faqja jote dhe hap secilën adresë.</span>'; }
    }
    return (ka && teGjitha);
  }catch(e){}
  return false;
}
let kTimer=null;
async function verifikoNje(i){
  const st=$('k_stat');
  const u=_konvUrls[i]; if(!u || !u.url.trim()){ if(st){ st.innerHTML='<span style="color:var(--err)">Shkruaj adresën.</span>'; } return; }
  // Ruaj kete URL nese s'eshte ruajtur ende
  if(!u.id){
    try{
      const r=await(await fetch('/api/konvertimet',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:u.url.trim()})})).json();
      if(r.id){ u.id=r.id; u.track_active=!!r.track_active; if(r.url){ u.url=r.url; } }
      else if(r.error){ if(st){ st.innerHTML='<span style="color:var(--err)">'+esc(r.error)+'</span>'; } return; }
    }catch(e){}
  }
  // Hap pikërisht atë URL (klienti fut URL të plotë)
  let hapUrl = u.url.trim();
  if(!/^https?:\/\//i.test(hapUrl)) hapUrl='https://'+hapUrl;
  try{ window.open(hapUrl, '_blank', 'noopener'); }catch(e){}
  if(st) st.innerHTML='<span class="spin"></span> Hapëm faqen në një skedë. Po kontrolloj…';
  vizatoKonvertimet();
  if(kTimer){ clearInterval(kTimer); kTimer=null; }
  const kontrollo=async()=>{ return await kStatus(); };
  await kontrollo();
  let here=0;
  kTimer=setInterval(async ()=>{ here++; if(await kontrollo() || here>20){ clearInterval(kTimer); kTimer=null; } },3000);
}
function kSwitch(){
  const v=segVal('k_ka');
  $('k_po').classList.toggle('hide', v!=='po');
  $('k_jo').classList.toggle('hide', v!=='jo');
  if(v==='jo'){ ngarkoZonat(); }
}
async function mbyllKonvertim(pasRuajtjes){
  // Gjithcka ruhet/fshihet menjehere (verifikim=ruaj, ✕=fshi). Ky vetem kthehet.
  try{
    if(une){ const plot=_konvUrls.filter(u=>u.url.trim()); une.url_konvertimi = plot.length ? plot[0].url : null; }
    await refreshProg();
    ngarkoNjoftimet();
    if(pasRuajtjes){ try{ eval(pasRuajtjes); return; }catch(e){} }
    nav({v:'profile',nav:'dashboard'});
  }catch(e){ nav({v:'profile',nav:'dashboard'}); }
}

// STEP 0 — Llogaria
function logjikaHTML(id, valDefault){
  const v = valDefault || 'ankand';
  return '<label>Si duhet të shpërndahen shfaqjet e reklamave të tua?</label>'+
    '<div class="seg" id="'+id+'">'+
      '<button type="button" data-v="ankand" class="'+(v==='ankand'?'sel':'')+'" onclick="segPick(this)">Ankand <span class="small mut">(Rekomanduar)</span></button>'+
      '<button type="button" data-v="barazi" class="'+(v==='barazi'?'sel':'')+'" onclick="segPick(this)">Barazi</button>'+
    '</div>'+
    '<p class="small mut" style="margin-top:4px;">Ankandi shpërndan sipas performancës — reklamat më të mira marrin më shumë shfaqje. Barazia synon që të marrësh aq shfaqje sa jep, pavarësisht performancës.</p>';
}
function stepLlogaria(b){
  if(une){
    // Nese i mungon website ose tipi (p.sh. hyri me Google), mblidhi ketu
    if(!une.website || !une.tipi){
      b.innerHTML=
        '<h2 class="h">Të dhënat e biznesit</h2><p class="small" style="margin:2px 0 14px;">Plotëso këto për të vazhduar.</p>'+
        '<label>Emri i biznesit (SaaS-it)</label><input id="a_emri" placeholder="Biznesi im" value="'+esc(une.emri||'')+'">'+
        '<label>Logo (opsionale)</label>'+
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">'+
          '<div id="a_logoPrev" class="avatar" style="width:52px;height:52px;font-size:22px;overflow:hidden;">'+((une.logo_url)?'<img src="'+esc(une.logo_url)+'" style="width:100%;height:100%;object-fit:cover;">':esc((une.emri||'?').charAt(0).toUpperCase()))+'</div>'+
          '<label class="btn" style="cursor:pointer;margin:0;">Ngarko<input type="file" id="a_logo" accept="image/*" onchange="ngarkoLogo(this)" style="display:none;"></label>'+
        '</div>'+
        '<label>Faqja (website)</label><input id="a_web" placeholder="https://saasi-im.com" value="'+esc(une.website||'')+'">'+
        segHTML('a_tipi')+
        '<label style="margin-top:12px;">Modeli i shpërndarjes</label>'+
        '<div class="seg" id="a_logjika">'+
          '<button type="button" data-v="ankand" onclick="segPick(this)">Ankand (rekomandohet)</button>'+
          '<button type="button" data-v="barazi" onclick="segPick(this)">Barazi</button>'+
        '</div>'+
        '<button class="primary" id="a_btn" onclick="wizPlotesoBizMeModalitet()">Vazhdo →</button><div class="msg" id="a_msg"></div>';
      if(une.tipi){ const btn=document.querySelector('#a_tipi button[data-v="'+une.tipi+'"]'); if(btn) segPick(btn); }
      const modPreferuar = window.__preferuarModaliteti || 'ankand';
      const modBtn=document.querySelector('#a_logjika button[data-v="'+modPreferuar+'"]'); if(modBtn) segPick(modBtn);
      return;
    }
    b.innerHTML='<h2 class="h">Biznesi ✓</h2><p class="small">Të dhënat u ruajtën për <b>'+esc(une.emri)+'</b>.</p>'+
      '<button class="primary" onclick="openWizard(1)">Vazhdo →</button>';
    return;
  }
  b.innerHTML=
    '<h2 class="h">Krijo llogarinë</h2><p class="small">Fillo me të dhënat bazë.</p>'+
    '<label>Emri i biznesit</label><input id="a_emri" placeholder="Biznesi im">'+
    '<label>Email</label><input id="a_email" type="email" placeholder="email@biznesi.com">'+
    '<label>Fjalëkalimi (min 6)</label><input id="a_pass" type="password" placeholder="••••••">'+
    '<label>Faqja / linku i SaaS-it</label><input id="a_web" placeholder="https://saasi-im.com">'+
    segHTML('a_tipi')+
    '<button class="primary" id="a_btn" onclick="wizKrijo()">Vazhdo →</button><div class="msg" id="a_msg"></div>';
}
async function ngarkoLogo(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  const fd=new FormData(); fd.append('file', f);
  try{
    const r=await(await fetch('/api/ngarko-logo',{method:'POST',body:fd})).json();
    if(r.url){
      if(une) une.logo_url=r.url;
      const prev=$('a_logoPrev'); if(prev) prev.innerHTML='<img src="'+r.url+'" style="width:100%;height:100%;object-fit:cover;">';
    }
  }catch(e){}
}
async function wizPlotesoBiz(){
  const emri=($('a_emri').value||'').trim();
  const web=($('a_web').value||'').trim();
  const tipi=segVal('a_tipi');
  if(!emri){ $('a_msg').className='msg err'; $('a_msg').textContent='Shkruaj emrin e biznesit.'; return; }
  if(!web){ $('a_msg').className='msg err'; $('a_msg').textContent='Shkruaj adresën e faqes.'; return; }
  if(!tipi){ $('a_msg').className='msg err'; $('a_msg').textContent='Zgjidh kujt i shërben platforma.'; return; }
  $('a_btn').disabled=true;
  try{
    const r=await(await fetch('/api/biz-baza',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({emri,website:web,tipi})})).json();
    if(r.error){ $('a_msg').className='msg err'; $('a_msg').textContent=r.error; $('a_btn').disabled=false; return; }
    if(une){ une.emri=emri; une.website=web; une.tipi=tipi; }
    await refreshProg();
    if(window.__pamjeVecante){ window.__pamjeVecante=false; nav({v:'profile',nav:'dashboard'}); return; }
    openWizard(1);
  }catch(e){ $('a_msg').className='msg err'; $('a_msg').textContent='Gabim: '+e.message; $('a_btn').disabled=false; }
}
async function wizKrijo(){
  const emri=$('a_emri').value.trim(),email=$('a_email').value.trim(),pass=$('a_pass').value,web=$('a_web').value.trim();
  const tipi=segVal('a_tipi');
  if(!emri||!email||!pass){ $('a_msg').className='msg err'; $('a_msg').textContent='Plotëso emrin, email-in dhe fjalëkalimin.'; return; }
  if(pass.length<6){ $('a_msg').className='msg err'; $('a_msg').textContent='Fjalëkalimi min 6 shkronja.'; return; }
  if(!tipi){ $('a_msg').className='msg err'; $('a_msg').textContent='Zgjidh kujt i shërben platforma.'; return; }
  $('a_btn').disabled=true;
  try{
    const r=await(await fetch('/api/regjistrohu',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({emri,email,fjalekalimi:pass,website:web,tipi})})).json();
    if(r.error){ $('a_msg').className='msg err'; $('a_msg').textContent=r.error; $('a_btn').disabled=false; return; }
    await loadMe();
    await advance();
  }catch(e){ $('a_msg').className='msg err'; $('a_msg').textContent='Gabim: '+e.message; $('a_btn').disabled=false; }
}

// STEP 1 — Përshkrimi (klientit i tregohet vetëm përmbledhja; kategoria caktohet nga AI në sfond)
function stepPershkrimi(b){
  b.innerHTML=
    '<h2 class="h">Përshkruaj biznesin</h2>'+
    '<p class="small" style="margin-bottom:14px;">Sa më i qartë dhe specifik të jetë përshkrimi, aq më mirë AI-ja të çiftëzon me biznese plotësuese — çka <b>rrit pikët e tua dhe reklamën ta shfaq më shpesh</b>. AI-ja e pastron pastaj; ti mund ta rregullosh.</p>'+
    '<label>Çfarë ofron biznesi yt?</label>'+
    '<textarea id="d_persh" placeholder="p.sh. Mjet email-marketing për dyqane online. Automatizon fushatat dhe rikthen blerësit.">'+(une.pershkrimi||'')+'</textarea>'+
    '<label class="chk"><input type="checkbox" id="d_lejo" checked><span>Lejo që linku i SaaS-it të studiohet automatikisht për saktësi më të madhe.</span></label>'+
    '<button class="btn" id="d_btn" onclick="wizAnalizo()">Analizo me AI</button>'+
    '<span class="small mut" id="d_mbetur" style="margin-left:10px;"></span>'+
    '<div class="msg" id="d_msg"></div>'+
    '<div id="d_res" class="hide" style="margin-top:16px;">'+
      '<label>Përmbledhja (e editueshme)</label>'+
      '<textarea id="e_perm"></textarea>'+
      '<button class="primary" id="e_next" onclick="vazhdoPershkrim()">Ruaj</button>'+
      '<div class="msg" id="e_msg"></div>'+
    '</div>';
  if(une.permbledhje){ $('d_res').classList.remove('hide'); $('e_perm').value=une.permbledhje; }
  window.__permOrig = une.permbledhje || '';
  const enBtn=$('e_next');
  if(enBtn) enBtn.disabled = true;
  $('e_perm').addEventListener('input', function(){
    if(enBtn) enBtn.disabled = (this.value.trim() === (window.__permOrig||'').trim());
  });
  ngarkoAnalizoMbetur();
}
async function ngarkoAnalizoMbetur(){
  const el=$('d_mbetur'); if(!el) return;
  try{
    const r=await(await fetch('/api/analizo/mbetur')).json();
    el.textContent = 'Të mbetura sot: '+r.mbetur+'/2';
  }catch(e){}
}
async function wizAnalizo(){
  const pershkrimi=$('d_persh').value.trim(), lejo=$('d_lejo').checked;
  if(!pershkrimi && !lejo){
    $('d_msg').className='msg err';
    $('d_msg').textContent='Shkruaj një përshkrim ose lejo studimin automatik të faqes.';
    return;
  }
  $('d_btn').disabled=true; $('d_msg').className='msg'; $('d_msg').innerHTML='<span class="spin"></span> Imyr po studion biznesin…';
  try{
    const r=await(await fetch('/api/analizo',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pershkrimi,lejo})})).json();
    if(r.error){ $('d_msg').className='msg err'; $('d_msg').textContent=r.error; $('d_btn').disabled=false; return; }
    $('d_msg').textContent = r.ai ? '' : (r.note||'');
    $('e_perm').value = r.permbledhje || pershkrimi;
    $('d_res').classList.remove('hide');
    une.pershkrimi=pershkrimi;
    const enBtn2=$('e_next');
    if(enBtn2) enBtn2.disabled = ($('e_perm').value.trim() === (window.__permOrig||'').trim());
    ngarkoAnalizoMbetur();
  }catch(e){ $('d_msg').className='msg err'; $('d_msg').textContent='Gabim: '+e.message; }
  $('d_btn').disabled=false;
}
async function vazhdoPershkrim(){
  $('e_next').disabled=true;
  try{
    const perm=$('e_perm').value.trim();
    await fetch('/api/permbledhje',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({permbledhje:perm})});
    une.permbledhje=perm;
    await advance();
  }catch(e){ $('e_msg').className='msg err'; $('e_msg').textContent='Gabim: '+e.message; $('e_next').disabled=false; }
}

// STEP 2 — Lidhja (përdor connect.js). Pas lidhjes → Creatives + Create.
function stepLidhja(b){
  b.innerHTML=
    '<h2 class="h">Lidh Imyr-in te faqja jote</h2>'+
    '<p class="small">Kopjo këtë rresht dhe vendose kudo te faqja jote (p.sh. te footer-i).</p>'+
    '<div id="connectWrap"></div>'+
    '<div id="claudeSuportWiz" style="margin:14px 0;"></div>'+
    '<div style="margin-top:14px;"><a href="#" id="caktoLink" style="color:#4a9eff;text-decoration:none;font-size:14px;" '+
      'onclick="event.preventDefault();var x=document.getElementById(\'madhBox\');x.classList.toggle(\'hide\');if(!x.dataset.ngarkuar){x.dataset.ngarkuar=1;ndertoMadhesine(x,false);}">Cakto madhësinë e hapësirës</a></div>'+
    '<div id="madhBox" class="hide" style="margin-top:12px;"></div>'+
    '<button class="primary hide" id="lidhNext" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})">Krijo reklamën →</button>';
  window.__onLidhur = ()=>{ renderHStep(); $('lidhNext').classList.remove('hide'); };
  connectUI($('connectWrap'));
  vizatoClaudeSuport('Wiz');
  _snipAktiv=null;   // te wizard-i, madhesia ruhet per-biznes
  if(prog.lidhja){ $('lidhNext').classList.remove('hide'); }
}
