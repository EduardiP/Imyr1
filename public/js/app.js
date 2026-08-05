// app.js — PAS HYRJES: home + dashboard/profili + wizard-i me hapa

// ---------- HOME ----------
function renderHome(){
  const b=$('homeBody');
  b.innerHTML='<div style="text-align:center;padding:48px 0;">'+
    '<h1 style="color:var(--acc);letter-spacing:.06em;margin:0;">Mirë se erdhe!</h1>'+
    '<p class="small" id="homeHi" style="font-size:15px;"></p></div>';
  $('homeHi').textContent = une.emri;
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
    await fetch('/api/permbledhje',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({permbledhje:perm})});
    une.permbledhje=perm;
    const msg=$('e_msg');
    if(msg){ msg.className='msg ok'; msg.textContent='✓ U ruajt.'; }
    $('e_next').disabled=false;
  }catch(e){ $('e_msg').className='msg err'; $('e_msg').textContent='Gabim: '+e.message; $('e_next').disabled=false; }
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
      body:JSON.stringify({titull, link, youtube_id:ytId})})).json();
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
    const fd=new FormData(); fd.append('file', f); fd.append('titulli', ($('up_title').value||'').trim()); fd.append('link', link);
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
  $('p_emri').textContent = une.emri;
  $('p_email').textContent = une.email;
  $('p_kat').textContent = '';
  const card = document.querySelector('.pcard');
  if(card){ card.style.cursor='pointer'; card.onclick=()=>nav({v:'profile', nav:'profili'}); }
  renderNav();
  renderMain(s);
}
function renderNav(){
  const el=$('snav'); el.innerHTML='';
  NAV.forEach(n=>{
    if(n.ndaresi){ const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:10px 4px;'; el.appendChild(hr); }
    const b=document.createElement('button');
    b.textContent=n.l; if(n.k===curNav) b.className='active';
    b.onclick=()=>nav({v:'profile', nav:n.k});
    el.appendChild(b);
  });
  // Footer i sidebar-it: Cilesimet (ingranazh) + Dilni, ne fund fare
  let foot=$('snavFoot');
  if(!foot){
    foot=document.createElement('div'); foot.id='snavFoot';
    foot.style.cssText='margin-top:auto;padding-top:12px;border-top:1px solid var(--line);';
    const aside=el.closest('.sidebar'); if(aside) aside.appendChild(foot);
  }
  foot.innerHTML='';
  const cil=document.createElement('button');
  cil.innerHTML='<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Cilësimet</span>';
  if(curNav==='cilesimet') cil.className='active';
  cil.onclick=()=>nav({v:'profile', nav:'cilesimet'});
  foot.appendChild(cil);
  const lo=document.createElement('button');
  lo.textContent='Dilni'; lo.style.cssText='color:var(--err);';
  lo.onclick=()=>dil();
  foot.appendChild(lo);
}
function renderMain(s){
  s = s || {};
  const m=$('mainPanel');
  if(curNav==='profili')    return mainProfili(m);
  if(curNav==='cilesimet')  return mainCilesimet(m);
  if(curNav==='plani')      return mainPlani(m);
  if(curNav==='suport')     return mainSuport(m);
  if(curNav==='njoftimet')  return mainNjoftimet(m);
  if(curNav==='konvertimi') return mainKonvertimi(m);
  if(curNav==='konvertimet') return mainKonvertimi(m);
  if(curNav==='lidhjaSnippet') return mainLidhjaSnippet(m);
  if(curNav==='biznesi')    return mainBiznesi(m);
  if(curNav==='pershkrimi') return mainPershkrimi(m);
  if(curNav==='lidhja')     return mainLidhja(m);
  if(curNav==='snippetet')  return mainSnippetet(m, s);
  if(curNav==='dashboard')  return mainDashboard(m);
  if(curNav==='kreative')   return mainKreative(m, s);
  if(curNav==='reklamat')   return mainReklamat(m, s);
  if(curNav==='analytics')  return mainAnalytics(m);
}
async function mainProfili(m){
  m.innerHTML='<p class="small">Po ngarkoj…</p>';
  let d={};
  try{ d=await(await fetch('/api/profili')).json(); }catch(e){ m.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; return; }
  const inic=(d.emri||'?').trim().charAt(0).toUpperCase();
  const avatarHTML = d.logo_url
    ? '<div class="avatar" style="overflow:hidden;"><img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
    : '<div class="avatar">'+esc(inic)+'</div>';
  const tipiTekst = d.tipi==='b2b'?'Bizneseve (B2B)':(d.tipi==='b2c'?'Individëve (B2C)':'Të dyjave');
  const konvLidhur = !!(une && une.url_konvertimi);
  let snip='';
  if(d.snippets && d.snippets.length){
    snip='<div class="rektbl" style="margin-top:10px;"><div class="rekhead"><span>Faqja (snippet)</span><span>Shfaqje</span><span>Klikime</span><span>Konvertime</span></div>';
    d.snippets.forEach(x=>{
      const konvQel = '<span>'+x.konvertime+'</span>';
      snip+='<div class="rekrow" style="cursor:default;"><span class="rekname"><span class="nm">'+esc(x.origjina)+'</span></span>'+
            '<span>'+x.shfaqje+'</span><span>'+x.klikime+'</span>'+konvQel+'</div>';
    });
    snip+='</div>';
  } else {
    snip='<p class="small" style="margin-top:8px;">Ende s\'ka të dhëna nga asnjë snippet.</p>';
  }
  const konvMini =
    '<div class="miniStat"><div class="mv">'+(d.pike?d.pike.konvertime:0)+'</div><div class="small">konvertime → '+(d.pike?d.pike.pike_nga_konvertimet:0)+' pikë</div><div class="small mut">(1 konvertim = 1 pikë)</div></div>';
  m.innerHTML=
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:6px;">'+
      avatarHTML+
      '<div><div style="font-size:20px;font-weight:700;">'+esc(d.emri||'')+'</div>'+
        '<div class="small">'+esc(d.email||'')+'</div>'+
        '<div class="small">Audienca: '+tipiTekst+'</div></div>'+
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
    '<p class="small mut" style="margin:6px 0 18px;">Pikët e profilit rrisin sa shpesh shfaqet reklama jote te rrjeti. Mblidhen nga shfaqjet dhe konvertimet që sjell faqja jote.</p>'+
    '<h3 class="h" style="font-size:16px;margin:0 0 4px;">Sipas snippet-it</h3>'+snip;
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
      h+='<div class="njCard" onclick="njVeprim(\''+x.veprim+'\')">'+
         '<div class="njT">'+esc(x.titull)+'</div>'+
         '<div class="njX">'+esc(x.teksti)+'</div>'+
         '<div class="njGo">Rregulloje →</div></div>';
    });
    el.innerHTML=h;
  }catch(e){ $('njLista').innerHTML='<p class="small">Gabim.</p>'; }
}
function mainDashboard(m){
  m.innerHTML='<h2 class="h">Statusi i llogarisë</h2>'+
    '<p class="small" style="margin:2px 0 18px;">Këto tregojnë çfarë është gati dhe çfarë jo. Kliko një rresht për ta plotësuar.</p>'+
    '<div class="vstep" id="vstep" style="max-width:520px;"></div>';
  renderDashStatus();
}
function renderDashStatus(){
  const el=$('vstep'); if(!el) return; el.innerHTML='';
  const rreshtat=[
    { done: !!prog.llogaria,   label:'Biznesi',             veprim:()=>nav({v:'profile',nav:'biznesi'}) },
    { done: !!prog.pershkrimi, label:'Përshkrimi',          veprim:()=>nav({v:'profile',nav:'pershkrimi'}) },
    { done: !!prog.lidhja,     label:'Lidhja e snippet-it', veprim:()=> prog.lidhja ? nav({v:'profile',nav:'snippetet'}) : nav({v:'profile',nav:'lidhjaSnippet'}) },
    { done: !!prog.reklama,    label:'Krijo produkt',       veprim:()=>nav({v:'profile',nav:'reklamat',sub:'create'}) },
    { done: !!prog.konvertimi, label:'Lidh konvertimin',    veprim:()=>nav({v:'profile',nav:'konvertimi'}) }
  ];
  rreshtat.forEach(r=>{
    const d=document.createElement('div');
    d.className='vs click'+(r.done?' done':'');
    d.innerHTML='<span class="vd">'+(r.done?'✓':'+')+'</span>'+
      '<span class="vl">'+r.label+(r.done?'':' — plotëso')+'</span>';
    d.onclick=r.veprim;
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
      '<div class="rekhead" style="grid-template-columns:2fr 1fr 1fr auto auto;"><span>Emri</span><span>Statusi</span><span>Madhësia</span><span></span><span></span></div>';
    lista.forEach(sn=>{
      const status = sn.snippet_active ? '<span style="color:var(--good);">● I lidhur</span>' : '<span style="color:var(--mut);">○ Pa lidhur</span>';
      h+='<div class="rekrow" style="grid-template-columns:2fr 1fr 1fr auto auto;align-items:center;" id="snipRow'+sn.id+'">'+
         '<span class="nm" id="snipEmri'+sn.id+'" onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+esc(sn.emri||('Hapësira '+sn.id))+'</span>'+
         '<span onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+status+'</span>'+
         '<span class="small" onclick="nav({v:\'profile\',nav:\'snippetet\',sub:\'detail\',id:'+sn.id+'})" style="cursor:pointer;">'+esc(sn.madhesia_desktop||'—')+'</span>'+
         '<button class="btn" style="padding:5px 9px;" title="Ndrysho emrin" onclick="snipEmriEdito('+sn.id+',\''+esc((sn.emri||'').replace(/\x27/g,""))+'\')">✎</button>'+
         '<button class="btn" style="padding:5px 9px;" title="Fshi" onclick="snipKonfirmoFshi('+sn.id+',\''+esc((sn.emri||'').replace(/\x27/g,""))+'\','+(sn.snippet_active?1:0)+')">✕</button>'+
         '</div>';
    });
    h+='</div>';
    c.innerHTML=h;
  }catch(e){ c.innerHTML='<p class="small err">Gabim në ngarkim.</p>'; }
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
      '<h2 class="h">'+esc(sn.emri||('Snippet '+id))+'</h2>';
    if(sn.snippet_active){
      // I LIDHUR → thjesht "I lidhur" + caktimi i madhesise
      b.innerHTML=krye+
        '<div class="miniStat" style="margin:10px 0 18px;"><span class="vd">✓</span> I lidhur</div>'+
        '<div id="madhWrap"></div>';
      const w=b.querySelector('#madhWrap');
      if(w) ndertoMadhesine(w, true, sn.celes, sn);
    } else {
      // PA LIDHUR → kodi + kopjo + URL + verifiko
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
        '</div>'+
        '<div id="madhWrap" style="margin-top:22px;"></div>';
      const w=b.querySelector('#madhWrap');
      if(w) ndertoMadhesine(w, true, sn.celes, sn);
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
  ngarkoKreativet();
}

function krZgjidh(l){ nav({v:'profile', nav:'kreative', lloji:l}); }

function formaKreative(lloji){
  // Ngarkimi lejon: imazh (jpg/png) per te treja; per HTML5 lejon edhe .htm dhe .zip
  const accept = lloji==='html5' ? 'image/*,.htm,.html,.zip' : 'image/*';
  const ndihma = lloji==='html5'
    ? 'Mund të ngarkosh imazhe, ose një skedar .htm/.zip për modifikim.'
    : 'Mund të ngarkosh vetëm imazhe (JPG, PNG).';
  return '<div style="margin-top:18px;">'+
    '<label>Emri</label>'+
    '<input id="krEmri" placeholder="Emri i reklamës (p.sh. Fushata Verë)">'+
    '<label style="margin-top:12px;">Përshkrimi</label>'+
    '<textarea id="krPer" placeholder="Çfarë do të tregojë reklama? (mesazhi, ndjesia, thirrja për veprim)" style="min-height:100px;"></textarea>'+
    '<label style="margin-top:12px;">Ngarko skedarë</label>'+
    '<div class="krFile">'+
      '<input type="file" id="krFile" accept="'+accept+'" multiple>'+
      '<p class="small mut" style="margin:6px 0 0;">'+ndihma+'</p>'+
    '</div>'+
    '<button class="primary" onclick="krGjenero(\''+lloji+'\')" style="margin-top:18px;">✨ Gjenero me AI</button>'+
    '<p id="krMsg" class="msg"></p>'+
  '</div>';
}

async function krGjenero(lloji){
  const emri = ($('krEmri')||{}).value || '';
  const pershkrimi = ($('krPer')||{}).value || '';
  const msg = $('krMsg');
  if(!emri.trim()){ if(msg){msg.className='msg err';msg.textContent='Vendos emrin.';} return; }
  try{
    const r = await (await fetch('/api/kreative',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({lloji, emri, pershkrimi})})).json();
    if(r.error){ if(msg){msg.className='msg err';msg.textContent=r.error;} return; }
    if(msg){msg.className='msg ok';msg.textContent='✓ U ruajt si draft. Gjenerimi me AI vjen së shpejti.';}
    ngarkoKreativet();
  }catch(e){ if(msg){msg.className='msg err';msg.textContent='Gabim: '+e.message;} }
}

async function ngarkoKreativet(){
  const el = $('krLista'); if(!el) return;
  try{
    const r = await (await fetch('/api/kreative')).json();
    if(!r.kreative || !r.kreative.length){ el.innerHTML=''; return; }
    el.innerHTML = '<h3 style="font-size:15px;margin:0 0 12px;">Krijimet e mia</h3>'+
      '<div class="krLista">'+
      r.kreative.map(k => 
        '<div class="krItem">'+
          '<div class="krItemHead"><b>'+esc(k.emri||'')+'</b>'+
            '<span class="krLloj">'+esc(k.lloji)+'</span></div>'+
          (k.pershkrimi ? '<p class="small mut" style="margin:6px 0 0;">'+esc(k.pershkrimi).slice(0,150)+'</p>' : '')+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'+
            '<span class="small mut">'+esc(k.status)+'</span>'+
            '<button class="btn" style="padding:4px 10px;font-size:12px;" onclick="krFshi('+k.id+')">Fshi</button>'+
          '</div>'+
        '</div>').join('')+
      '</div>';
  }catch(e){}
}

async function krFshi(id){
  if(!confirm('Fshi këtë krijim?')) return;
  try{
    await fetch('/api/kreative/'+id,{method:'DELETE'});
    ngarkoKreativet();
  }catch(e){}
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

// ===== CAKTIMI I MADHESISE (korniza interaktive) =====
var _mad = { w:210, h:261, MAXW:260, MAXH:290, MINW:134, MINH:155,
             mw:290, mh:260, mMAXW:320, mMAXH:400, mMINW:260, mMINH:192, pajisje:'desktop', pozicioni:'qender' };
async function ndertoMadhesine(cont, ruajVetem, snipCeles, snipData){
  if(!cont) return;
  _mad.snipId = _snipAktiv || null;   // nese jemi te nje snippet, ruaj per snippet
  cont.innerHTML='<p class="small">Po ngarkoj…</p>';
  try{
    // Kufijte i marrim gjithmone nga /api/madhesia; vlerat aktuale nga snippet-i nese kemi
    const r=await(await fetch('/api/madhesia')).json();
    _mad.MAXW=r.max_w||260; _mad.MAXH=r.max_h||290; _mad.MINW=r.min_w||134; _mad.MINH=r.min_h||155;
    _mad.mMAXW=r.m_max_w||320; _mad.mMAXH=r.m_max_h||400; _mad.mMINW=r.m_min_w||260; _mad.mMINH=r.m_min_h||192;
    // Vlerat aktuale: nga snippet-i (nese dhene) ose nga biznesi (Lidhja e vjeter)
    const dsk = (snipData && snipData.madhesia_desktop) || r.desktop || '210x261';
    const mob = (snipData && snipData.madhesia_mobile) || r.mobile || '290x260';
    const poz = (snipData && snipData.pozicioni) || r.pozicioni || 'qender';
    const p=dsk.split('x'); _mad.w=parseInt(p[0],10)||210; _mad.h=parseInt(p[1],10)||261;
    const pm=mob.split('x'); _mad.mw=parseInt(pm[0],10)||290; _mad.mh=parseInt(pm[1],10)||260;
    _mad.pozicioni=poz;
  }catch(e){}
  cont.innerHTML=
    '<div style="display:flex;gap:10px;margin-bottom:14px;">'+
      '<button class="madhPaj active" data-p="desktop" onclick="madhPajisja(\'desktop\')">Desktop</button>'+
      '<button class="madhPaj" data-p="mobile" onclick="madhPajisja(\'mobile\')">Mobile</button>'+
    '</div>'+
    '<div id="madhDesktop"></div>';
  const dd=cont.querySelector('#madhDesktop');
  if(dd) ndertoKanavasin(dd, 'desktop');
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
    '</div>'+
    '<button class="primary" id="madhRuaj" onclick="ruajMadhesine()" style="margin-top:14px;">Ruaj</button>'+
    '<div class="msg" id="madhMsg"></div>';
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
  const url = _mad.snipId ? ('/api/snippetet/'+_mad.snipId+'/madhesia') : '/api/madhesia';
  try{
    const r=await(await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(trupi)})).json();
    if(msg){ msg.className=r.error?'msg err':'msg ok'; msg.textContent=r.error?('Gabim: '+r.error):('U ruajt: '+(r.desktop||r.mobile||'')); }
  }catch(e){ if(msg){ msg.className='msg err'; msg.textContent='Gabim.'; } }
  if(btn) btn.disabled=false;
}
function mainLidhjaSnippet(m){
  m.innerHTML=
    '<h2 class="h">Reklamat e tua nuk po shfaqen</h2>'+
    '<div style="background:#3a1212;border:1px solid var(--err);border-radius:10px;padding:16px;margin:12px 0 18px;">'+
      '<p style="margin:0 0 10px;color:#f5b6b6;">S\'ke asnjë hapësirë reklame aktive te faqja jote.</p>'+
      '<p class="small" style="margin:0;">Rrjeti ynë punon me shkëmbim: ti shfaq reklamat e bizneseve të tjera te faqja jote, dhe ata shfaqin tuajat te faqet e tyre. Meqë tani s\'po shfaq asnjë reklamë (s\'ke hapësirë aktive), <b>as reklamat e tua s\'po marrin shfaqje</b> te rrjeti.</p>'+
    '</div>'+
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
    if(!pr.lidhja){
      el.innerHTML='<div onclick="nav({v:\'profile\',nav:\'lidhjaSnippet\'})" style="cursor:pointer;background:#3a1212;border:1px solid var(--err);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;">'+
        '<div style="flex:1;"><div style="color:var(--err);font-weight:600;">Reklamat e tua nuk po shfaqen</div>'+
        '<div class="small" style="margin-top:2px;">S\'ke asnjë hapësirë reklame aktive. Meqë s\'po shfaq reklamat e të tjerëve, as reklamat e tua s\'po marrin shfaqje. Kliko për të mësuar si →</div></div>'+
        '<button class="btn cta" style="white-space:nowrap;" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'lidhjaSnippet\'})">Shiko</button></div>';
    } else { el.innerHTML=''; }
  }catch(e){}
}
async function loadReklamat(){
  const el=$('reklamaList'); if(!el) return;
  try{
    const rows=await(await fetch('/api/reklamat')).json();
    window.__reklamat = rows;
    if(!rows.length){ el.innerHTML='<p class="small">Ende s\'ke krijuar reklama. Kliko “+ Create”.</p>'; return; }
    let h='<div class="rektbl"><div class="rekhead"><span>Reklama</span><span>Shikime</span><span>Klikime</span><span>Konvertime</span></div>';
    rows.forEach(r=>{
      const thumb = r.imazh_url ? '<span class="rekthumb"><img src="'+esc(r.imazh_url)+'"></span>' : '<span class="rekthumb">▦</span>';
      h+='<div class="rekrow" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'detail\',id:'+r.id+'})">'+
         '<span class="rekname">'+thumb+'<span class="nm">'+esc(r.emri)+'</span></span>'+
         '<span>'+r.shikime+'</span><span>'+r.klikime+'</span><span>'+r.konvertime+'</span></div>';
    });
    h+='</div>';
    el.innerHTML=h;
  }catch(e){ el.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function hapReklame(id, m){
  m.innerHTML='<p class="small">Po ngarkoj…</p>';
  let rows=window.__reklamat;
  if(!rows){ try{ rows=await(await fetch('/api/reklamat')).json(); window.__reklamat=rows; }catch(e){ rows=[]; } }
  const r=(rows||[]).find(x=>x.id===id)||{};
  const konvLidhur = !!(une && une.url_konvertimi);
  const konvKuti = '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.konvertime||0)+'</div><div class="small">Konvertime</div></div>';
  m.innerHTML=
    '<h2 class="h">'+esc(r.emri||'Reklama')+'</h2>'+
    '<div style="display:flex;gap:10px;margin:14px 0;">'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.shikime||0)+'</div><div class="small">Shikime</div></div>'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.klikime||0)+'</div><div class="small">Klikime</div></div>'+
      konvKuti+
    '</div>'+
    '<p class="small">Variantet e krijuara (Image / Video / HTML5) do të shfaqen këtu — për të parë cili performon më mirë në testim.</p>';
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
function mainCilesimet(m){
  m.innerHTML='<h2 class="h">Cilësimet</h2>'+
    '<p class="small" style="margin:10px 0 16px;">Këtu do të mund të aktivizosh ose çaktivizosh funksione të llogarisë tënde.</p>'+
    '<div style="border:1px solid var(--line);border-radius:12px;padding:20px;color:var(--mut);">'+
      '<p class="small" style="margin:0;">Së shpejti.</p>'+
    '</div>';
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
function mainAnalytics(m){
  m.innerHTML='<h2 class="h">Analytics</h2>'+
    '<p class="small" style="margin-top:10px;">Së shpejti: shikime, klikime dhe konvertime për reklamën tënde.</p>';
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
function closeWizard(){ if(pollTimer){clearInterval(pollTimer);pollTimer=null;} nav({v: une?'home':'hero'}); }
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
    _konvUrls = (r.konvertimet||[]).map(x=>({id:x.id, url:x.url, track_active:x.track_active}));
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
    _konvZona=(r.zonat||[]).map(z=>({id:z.id, emri:z.emri||'', track_active:z.track_active}));
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
        '<button class="primary" id="a_btn" onclick="wizPlotesoBiz()">Vazhdo →</button><div class="msg" id="a_msg"></div>';
      if(une.tipi){ const btn=document.querySelector('#a_tipi button[data-v="'+une.tipi+'"]'); if(btn) segPick(btn); }
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
    '<div class="msg" id="d_msg"></div>'+
    '<div id="d_res" class="hide" style="margin-top:16px;">'+
      '<label>Përmbledhja (e editueshme)</label>'+
      '<textarea id="e_perm"></textarea>'+
      '<button class="primary" id="e_next" onclick="ruajPershkrim()">Ruaj</button>'+
      '<div class="msg" id="e_msg"></div>'+
    '</div>';
  if(une.permbledhje){ $('d_res').classList.remove('hide'); $('e_perm').value=une.permbledhje; }
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
