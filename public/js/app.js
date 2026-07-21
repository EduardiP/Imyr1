// app.js — PAS HYRJES: home + dashboard/profili + wizard-i me hapa

// ---------- HOME ----------
function renderHome(){
  const b=$('homeBody');
  b.innerHTML='<div style="text-align:center;padding:48px 0;">'+
    '<h1 style="color:var(--acc);letter-spacing:.06em;margin:0;">Mirë se erdhe!</h1>'+
    '<p class="small" id="homeHi" style="font-size:15px;"></p></div>';
  $('homeHi').textContent = une.emri;
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
    b.onclick=()=>{ window.__adType=t.k; if(t.k==='image'){ ngarkoImazhUI(); return; } renderAdTypes(); $('adTypeNote').textContent='Ngarkimi i "'+t.l+'" — së shpejti.'; };
    g.appendChild(b);
  });
}
function ngarkoImazhUI(){
  const m=$('mainPanel');
  m.innerHTML=
    '<h2 class="h">Ngarko imazhin</h2>'+
    '<p class="small" style="margin:2px 0 14px;">Zgjidh një imazh nga laptopi (JPG / PNG / GIF).</p>'+
    '<label>Titulli (opsional)</label><input id="up_title" placeholder="Emri i reklamës">'+
    '<label style="margin-top:12px;">Imazhi</label><input type="file" id="up_file" accept="image/*">'+
    '<div id="up_prev" style="margin-top:12px;"></div>'+
    '<button class="primary" id="up_btn" onclick="ngarkoImazh()">Ngarko →</button>'+
    '<div class="msg" id="up_msg"></div>';
  $('up_file').addEventListener('change', function(){
    const f=this.files[0]; if(!f) return;
    $('up_prev').innerHTML='<img src="'+URL.createObjectURL(f)+'" style="max-width:220px;border-radius:10px;border:1px solid var(--line);">';
  });
}
async function ngarkoImazh(){
  const f=$('up_file').files[0];
  if(!f){ $('up_msg').className='msg err'; $('up_msg').textContent='Zgjidh një imazh.'; return; }
  $('up_btn').disabled=true; $('up_msg').className='msg'; $('up_msg').innerHTML='<span class="spin"></span> Po ngarkoj…';
  try{
    const fd=new FormData(); fd.append('file', f); fd.append('titulli', ($('up_title').value||'').trim());
    const r=await(await fetch('/api/ngarko',{method:'POST',body:fd})).json();
    if(r.error){ $('up_msg').className='msg err'; $('up_msg').textContent=r.error; $('up_btn').disabled=false; return; }
    window.__reklamat=null;
    nav({v:'profile',nav:'reklamat'});
  }catch(e){ $('up_msg').className='msg err'; $('up_msg').textContent='Gabim: '+e.message; $('up_btn').disabled=false; }
}

// ---------- PROFILI / DASHBOARD ----------
function renderProfile(s){
  s = s || {};
  curNav = s.nav || 'dashboard';
  $('p_emri').textContent = une.emri;
  $('p_email').textContent = une.email;
  $('p_kat').textContent = ''; // kategoria s'i tregohet klientit
  renderNav();
  renderMain(s);
}
function renderNav(){
  const el=$('snav'); el.innerHTML='';
  NAV.forEach(n=>{
    const b=document.createElement('button');
    b.textContent=n.l; if(n.k===curNav) b.className='active';
    b.onclick=()=>nav({v:'profile', nav:n.k});
    el.appendChild(b);
  });
}
function renderMain(s){
  s = s || {};
  const m=$('mainPanel');
  if(curNav==='dashboard') return mainDashboard(m);
  if(curNav==='reklamat')  return mainReklamat(m, s);
  if(curNav==='analytics') return mainAnalytics(m);
}
function mainDashboard(m){
  m.innerHTML='<h2 class="h">Hapat e konfigurimit</h2>'+
    '<p class="small" style="margin:2px 0 18px;">Përfundo hapat për ta aktivizuar plotësisht Imyr.</p>'+
    '<div class="vstep" id="vstep" style="max-width:460px;"></div>';
  renderVStep();
}
function mainReklamat(m, s){
  s = s || {};
  if(s.sub==='detail'){ return hapReklame(s.id, m); }
  if(s.sub==='create'){ return krijoReklame(m); }
  m.innerHTML=
    '<h2 class="h">Creatives</h2>'+
    '<div style="margin:12px 0 14px;"><button class="btn cta" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})">+ Create</button></div>'+
    '<div id="reklamaList"><p class="small">Po ngarkoj…</p></div>';
  loadReklamat();
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
  m.innerHTML=
    '<h2 class="h">'+esc(r.emri||'Reklama')+'</h2>'+
    '<div style="display:flex;gap:10px;margin:14px 0;">'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.shikime||0)+'</div><div class="small">Shikime</div></div>'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.klikime||0)+'</div><div class="small">Klikime</div></div>'+
      '<div style="flex:1;background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:12px 14px;"><div style="font-size:22px;font-weight:700;color:var(--acc);">'+(r.konvertime||0)+'</div><div class="small">Konvertime</div></div>'+
    '</div>'+
    '<p class="small">Variantet e krijuara (Image / Video / HTML5) do të shfaqen këtu — për të parë cili performon më mirë në testim.</p>';
}
function krijoReklame(m){
  m.innerHTML=
    '<h2 class="h">Krijo reklamë</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Zgjidh llojin që do të ngarkosh. Ngarkimi vjen së shpejti.</p>'+
    '<div id="adTypeWrap2"></div>';
  adTypeUI($('adTypeWrap2'));
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
function startWizard(){ openWizard(une ? nextIncomplete() : 0); }
function closeWizard(){ if(pollTimer){clearInterval(pollTimer);pollTimer=null;} nav({v: une?'home':'hero'}); }
function openWizard(i){ if(i>=STEPS.length) i=STEPS.length-1; nav({v:'wizard', step:i}); }
function renderWizard(i){
  if(!une) i=0;
  if(i>=STEPS.length) i=STEPS.length-1;
  curStep=i; showView('wizard'); renderHStep(); renderStepBody(i);
}
function renderHStep(){
  $('wizStepN').textContent='Hapi '+(curStep+1)+' nga '+STEPS.length;
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
  await refreshProg(); renderHStep();
  const nx=nextIncomplete();
  if(nx>=STEPS.length){ closeWizard(); return; }
  openWizard(nx);
}
function renderStepBody(i){
  const b=$('wizBody');
  if(i===0) return stepLlogaria(b);
  if(i===1) return stepPershkrimi(b);
  if(i===2) return stepLidhja(b);
}

// STEP 0 — Llogaria
function stepLlogaria(b){
  if(une){
    b.innerHTML='<h2 class="h">Llogaria ✓</h2><p class="small">Llogaria u krijua për <b>'+une.emri+'</b>.</p>'+
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
    '<p class="small">AI e pastron përshkrimin; ti mund ta rregullosh para se të vazhdosh.</p>'+
    '<label>Çfarë ofron biznesi yt?</label>'+
    '<textarea id="d_persh" placeholder="p.sh. Mjet email-marketing për dyqane të vogla online...">'+(une.pershkrimi||'')+'</textarea>'+
    '<label class="chk"><input type="checkbox" id="d_lejo" checked><span>Lejo që linku i SaaS-it të studiohet automatikisht për saktësi më të madhe.</span></label>'+
    '<button class="btn" id="d_btn" onclick="wizAnalizo()">Analizo me AI</button>'+
    '<div class="msg" id="d_msg"></div>'+
    '<div id="d_res" class="hide" style="margin-top:16px;">'+
      '<label>Përmbledhja (e editueshme)</label>'+
      '<textarea id="e_perm"></textarea>'+
      '<button class="primary" id="e_next" onclick="vazhdoPershkrim()">Vazhdo →</button>'+
      '<div class="msg" id="e_msg"></div>'+
    '</div>';
  if(une.permbledhje){ $('d_res').classList.remove('hide'); $('e_perm').value=une.permbledhje; }
}
async function wizAnalizo(){
  const pershkrimi=$('d_persh').value.trim(), lejo=$('d_lejo').checked;
  if(!pershkrimi){ $('d_msg').className='msg err'; $('d_msg').textContent='Shkruaj një përshkrim.'; return; }
  $('d_btn').disabled=true; $('d_msg').className='msg'; $('d_msg').innerHTML='<span class="spin"></span> Imyr po studion biznesin…';
  try{
    const r=await(await fetch('/api/analizo',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pershkrimi,lejo})})).json();
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
    '<button class="primary hide" id="lidhNext" onclick="nav({v:\'profile\',nav:\'reklamat\',sub:\'create\'})">Krijo reklamën →</button>';
  window.__onLidhur = ()=>{ renderHStep(); $('lidhNext').classList.remove('hide'); setTimeout(()=>nav({v:'profile',nav:'reklamat',sub:'create'}),900); };
  connectUI($('connectWrap'));
  if(prog.lidhja){ $('lidhNext').classList.remove('hide'); }
}
