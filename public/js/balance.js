// balance.js — Llogaria "Balance" (Barazi): pamje/organizim i vecante mbi TE NJEJTAT te dhena.
// Permbledhja e biznesit, vleresimi AI (kombinimi), vete snippet-et, dhe gjurmimi i konvertimeve
// jane TE PERBASHKETA me llogarine Ankand — s'duplikohen. Vetem reklamat, Dashboard-i, My Ads,
// dhe Analytics kane pamje te veçante, filtruar sipas logjika_shperndarjes==='barazi' / burimi='barazi'.
//
// VLERAT: __llogariaModaliteti mban VETEM 'ankand' ose 'barazi' — te njejtat qe kupton serveri.
// Nuk perdoret me vlera 'balance' — 'barazi' eshte vlera e sakte per DB dhe API.
//
// SINKRONIZIM ME SERVERIN:
// Kur perdoruesi klikon "Switch to Balance Account", perditesohet edhe `bizneset.logjika_shperndarjes`
// te DB-ja, keshtu qe:
//   (a) Reklamat e krijuara pas kesaj marrin logjiken e re si default.
//   (b) Biznesi shfaqet menjehere te admin panel → Balancat.
//   (c) Modaliteti persiston nepër rifreskime — lexohet nga biznesi ne boot.

// Vlera fillestare (do te perditesohet nga `une` sapo te jete e ngarkuar)
window.__llogariaModaliteti = window.__llogariaModaliteti || 'ankand';

// Sinkronizim me `une` — thirret perpara se te ndertohet menyja
function _sinkronizoModalitetin(){
  if(window.une && window.une.logjika_shperndarjes){
    window.__llogariaModaliteti = (window.une.logjika_shperndarjes==='barazi') ? 'barazi' : 'ankand';
  }
}

// Monkey-patch renderUserMenu qe modaliteti te sinkronizohet nga `une` para se te lexohet labelli
(function(){
  if(typeof window.renderUserMenu === 'function'){
    var _orig = window.renderUserMenu;
    window.renderUserMenu = function(){
      _sinkronizoModalitetin();
      return _orig.apply(this, arguments);
    };
  }
})();

async function switchLlogaria(){
  var iRi = (window.__llogariaModaliteti==='barazi') ? 'ankand' : 'barazi';
  // Sinkronizo me serverin PARA se te ndryshohet UI-ja
  try{
    var r = await (await fetch('/api/logjika-shperndarjes',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({logjika_shperndarjes: iRi})})).json();
    if(r.error){ alert('Gabim: '+r.error); return; }
  }catch(e){ alert('Gabim gjatë ndërrimit të llogarisë: '+e.message); return; }
  // Perditeso ndryshoret lokale
  window.__llogariaModaliteti = iRi;
  if(window.une) window.une.logjika_shperndarjes = iRi;
  // Rifresko labelin e menyse dhe pamjen
  if(typeof renderUserMenu === 'function') renderUserMenu();
  renderMain({nav: curNav});
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
    const rows=await(await fetch('/api/reklamat?logjika=barazi')).json();
    kaReklameBarazi = Array.isArray(rows) && rows.length>0;
  }catch(e){}
  el.innerHTML='';
  const rreshtat=[
    { done: !!(prog && prog.llogaria),   label:'Biznesi', veprim:()=>nav({v:'profile',nav:'biznesi'}) },
    { done: !!(prog && prog.pershkrimi), label:'Përshkrimi', veprim:()=>nav({v:'profile',nav:'pershkrimi'}) },
    { done: !!(prog && prog.lidhja),     label:'Lidhja e snippet-it', veprim:()=>nav({v:'profile',nav:'lidhjaSnippet'}) },
    { done:kaReklameBarazi, label:'Krijo reklamë (Balance)', veprim:()=>nav({v:'profile',nav:'reklamat',sub:'create'}) },
    { done: !!(prog && prog.konvertimi), label:'Lidh konvertimin', veprim:()=>nav({v:'profile',nav:'konvertimet'}) }
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
