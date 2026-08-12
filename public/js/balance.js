// balance.js — Llogaria "Balance" (Barazi): pamje/organizim i vecante mbi TE NJEJTAT te dhena.
// Permbledhja e biznesit, vleresimi AI (kombinimi), vete snippet-et, dhe gjurmimi i konvertimeve
// jane TE PERBASHKETA me llogarine Ankand — s'duplikohen. Vetem reklamat, Dashboard-i, My Ads,
// dhe Analytics kane pamje te veçante, filtruar sipas logjika_shperndarjes==='barazi' / burimi='barazi'.
//
// Modaliteti ruhet ne nje ndryshore globale (jo ne history) — thjesht nderron cfare shfaqin
// funksionet ekzistuese, njesoj si nje filter, jo nje llogari/login e re.

window.__llogariaModaliteti = window.__llogariaModaliteti || 'ankand'; // 'ankand' | 'balance'

function switchLlogaria(){
  window.__llogariaModaliteti = (window.__llogariaModaliteti==='balance') ? 'ankand' : 'balance';
  renderMain({nav:curNav});
}

// ================= DASHBOARD (Balance) =================
async function mainDashboardBalance(m){
  m.innerHTML='<h2 class="h">Statusi i llogarisë — Balance</h2>'+
    '<p class="small" style="margin:2px 0 18px;">Përshkrimi, vlerësimi AI, snippet-et dhe gjurmimi i konvertimeve janë të përbashkëta me llogarinë Ankand. Mbetet vetëm të krijosh reklama për Balance.</p>'+
    '<div class="card" style="flex:0 0 auto;max-width:360px;">'+
      '<div class="vstep" id="vstepBal" style="display:flex;flex-direction:column;"></div>'+
    '</div>';
  await renderDashStatusBalance();
}

async function renderDashStatusBalance(){
  const el=$('vstepBal'); if(!el) return; el.innerHTML='<p class="small mut">Po kontrolloj…</p>';
  let kaReklameBarazi=false;
  try{
    const rows=await(await fetch('/api/reklamat')).json();
    kaReklameBarazi = Array.isArray(rows) && rows.some(r=>r.logjika_shperndarjes==='barazi');
  }catch(e){}
  el.innerHTML='';
  const rreshtat=[
    { done:true,  label:'Biznesi' },
    { done:true,  label:'Përshkrimi' },
    { done:true,  label:'Lidhja e snippet-it' },
    { done:kaReklameBarazi, label:'Krijo reklamë (Balance)', veprim:()=>nav({v:'profile',nav:'reklamat',sub:'create'}) },
    { done:true,  label:'Lidh konvertimin' }
  ];
  rreshtat.forEach(r=>{
    const d=document.createElement('div');
    d.className='vs'+(r.done?' done':' click');
    d.innerHTML='<span class="vd">'+(r.done?'✓':'+')+'</span>'+
      '<span class="vl">'+r.label+(r.done?'':' — plotëso')+'</span>';
    if(!r.done && r.veprim) d.onclick=r.veprim;
    el.appendChild(d);
  });
}
