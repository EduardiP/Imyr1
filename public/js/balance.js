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

// ================= PROFILI (Balance) — te njejtat te dhena bazë, statistika dhenie/marrje ne vend te pikëve =================
async function mainProfiliBalance(m){
  m.innerHTML='<p class="small">Po ngarkoj…</p>';
  let d={}, bal={dhene:{shfaqje:0,klikime:0,konvertime:0}, marra:{shfaqje:0,klikime:0,konvertime:0}};
  try{
    d = await(await fetch('/api/profili')).json();
    bal = await(await fetch('/api/profili-balance')).json();
  }catch(e){ m.innerHTML='<p class="small">Gabim gjatë ngarkimit.</p>'; return; }
  window.__profiliCache = d;
  const inic=(d.emri||'?').trim().charAt(0).toUpperCase();
  const avatarHTML = d.logo_url
    ? '<div class="avatar" style="overflow:hidden;"><img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
    : '<div class="avatar">'+esc(inic)+'</div>';
  const tipiTekst = d.tipi==='b2b'?'Bizneseve (B2B)':(d.tipi==='b2c'?'Individëve (B2C)':'Të dyjave');
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
    '<h3 class="h" style="font-size:16px;margin:22px 0 4px;">Ke dhënë (Balance)</h3>'+
    '<div style="display:flex;gap:10px;margin:8px 0 4px;flex-wrap:wrap;">'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.shfaqje+'</div><div class="small">shfaqje</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.klikime+'</div><div class="small">klikime</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.konvertime+'</div><div class="small">konvertime</div></div>'+
    '</div>'+
    '<h3 class="h" style="font-size:16px;margin:22px 0 4px;">Ke marrë (Balance)</h3>'+
    '<div style="display:flex;gap:10px;margin:8px 0 4px;flex-wrap:wrap;">'+
      '<div class="miniStat"><div class="mv">'+bal.marra.shfaqje+'</div><div class="small">shfaqje</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.marra.klikime+'</div><div class="small">klikime</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.marra.konvertime+'</div><div class="small">konvertime</div></div>'+
    '</div>'+
    '<p class="small mut" style="margin:10px 0 4px;">Balance synon shfaqje = shfaqje: sa jep, aq merr. (Numrat mbeten 0 derisa mekanizmi i shpërndarjes Balance të fillojë.)</p>';
}
