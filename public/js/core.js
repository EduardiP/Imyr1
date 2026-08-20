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
function showView(v){ ['hero','home','wizard','profile','analitika-full','ekipi'].forEach(x=>{ const el=$('v-'+x); if(el) el.classList.toggle('on', x===v); }); }

async function refreshProg(){
  try { prog = await (await fetch('/api/progres')).json(); }
  catch(e){ prog = { llogaria:true, pershkrimi:false, lidhja:false, konvertimi:false, reklama:false }; }
  if(typeof ngarkoNjoftimet==='function') ngarkoNjoftimet();
}
function nextIncomplete(){ for(let i=0;i<STEPS.length;i++){ if(!prog[STEPS[i].key]) return i; } return STEPS.length; }
// Herën e parë (asnjë hap i plotësuar) → udhëzuesi me 3 pikat; përndryshe → paneli (dashboard)
function pasHyrjes(){
  const asgjeEBere = prog && !prog.llogaria && !prog.pershkrimi && !prog.lidhja;
  if(asgjeEBere) return {v:'wizard', step:0};
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
  $('hdrLeft').innerHTML='<button class="btn ghost" onclick="goHome()">Home</button>';
  $('hdrRight').innerHTML=
    '<div id="kerkWrap">'+
      '<svg class="kerkSvgIco" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'+
      '<input id="kerkInput" placeholder="Kërko…" autocomplete="off" oninput="kerkoRun(this.value)">'+
      '<div id="kerkRez" class="hide"></div>'+
    '</div>'+
    '<div class="zile-wrap"><button class="zile" onclick="toggleNjoftimet(event)" aria-label="Njoftimet">'+
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'+
      '<span id="zileBadge" class="zile-badge hide">0</span>'+
    '</button><div id="njBox" class="njBox hide"></div></div>';
  ngarkoNjoftimet();
}
function toggleMenu(e){ e.stopPropagation(); const m=$('menuBox'); if(m) m.classList.toggle('hide'); const n=$('njBox'); if(n) n.classList.add('hide'); }
function toggleNjoftimet(e){ e.stopPropagation(); const n=$('njBox'); if(n) n.classList.toggle('hide'); const m=$('menuBox'); if(m) m.classList.add('hide'); }
document.addEventListener('click', ()=>{ const m=$('menuBox'); if(m) m.classList.add('hide'); const n=$('njBox'); if(n) n.classList.add('hide'); });

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
  une=await r.json(); await refreshProg(); setHeaderLoggedIn(); return true;
}

// ---------- NAVIGIMI (me shigjetën back të browser-it + URL reale) ----------
function applyState(s, replace){
  if(!s){ s = une ? {v:'profile', nav:'dashboard'} : {v:'hero'}; }
  if(s.v==='wizard'){ renderWizard(s.step||0); }
  else if(s.v==='profile' && une){ renderProfile(s); showView('profile'); }
  else if(s.v==='home' && une){ renderHome(); showView('home'); }
  else if(s.v==='analitika-full' && une){ renderAnalyticsFull(); showView('analitika-full'); }
  else if(s.v==='ekipi' && une){ ekipiNdertoSkeleten(); showView('ekipi'); }
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
