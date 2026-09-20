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
  var konfirmuar = false;
  try{
    var st = await (await fetch('/api/llogarite-konfirmuara')).json();
    konfirmuar = iRi==='barazi' ? !!st.barazi : !!st.ankand;
  }catch(e){ /* fail-open drejt modalit, per siguri */ }

  if(!konfirmuar){
    hapModalKonfirmoLlogarine(iRi);
    return;
  }
  await bejKalimin(iRi);
}

async function bejKalimin(iRi){
  try{
    var r = await (await fetch('/api/logjika-shperndarjes',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({logjika_shperndarjes: iRi})})).json();
    if(r.error){ alert('Error: '+r.error); return; }
  }catch(e){ alert('Error switching account: '+e.message); return; }
  window.__llogariaModaliteti = iRi;
  if(window.une) window.une.logjika_shperndarjes = iRi;
  if(typeof renderUserMenu === 'function') renderUserMenu();
  nav({v:'profile', nav:'dashboard'});
}

function hapModalKonfirmoLlogarine(iRi){
  var emriModelit = (iRi==='barazi') ? 'Balance' : 'Auction';
  var ankora = (iRi==='barazi') ? 'balance-details' : 'auction-details';
  var el = document.createElement('div');
  el.className = 'backdrop';
  el.id = 'modalKonfirmoLlogarine';
  el.innerHTML =
    '<div class="card modal">'+
      '<button class="x" onclick="mbyllModalKonfirmoLlogarine()">✕</button>'+
      '<h2 class="h" style="font-size:19px;">Switch to the '+emriModelit+' account?</h2>'+
      '<p class="small" style="margin:10px 0;">This is a separate account from the one you\'re in now — tracked independently, with its own ads and its own distribution logic. It won\'t show or receive impressions until you create it.</p>'+
      '<p class="small mut" style="margin:0 0 16px;"><a href="/si-funksionon#'+ankora+'" target="_blank" style="color:var(--acc);">Learn how '+emriModelit+' works →</a></p>'+
      '<button class="primary" onclick="konfirmoLlogarineTeRe(\''+iRi+'\')">Create '+emriModelit+' account</button>'+
    '</div>';
  document.body.appendChild(el);
}
function mbyllModalKonfirmoLlogarine(){
  var el = $('modalKonfirmoLlogarine');
  if(el) el.remove();
}
async function konfirmoLlogarineTeRe(iRi){
  try{
    var r = await (await fetch('/api/konfirmo-llogarine',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({logjika: iRi})})).json();
    if(r.error){ alert('Error: '+r.error); return; }
  }catch(e){ alert('Error: '+e.message); return; }
  mbyllModalKonfirmoLlogarine();
  window.__llogariaModaliteti = iRi;
  if(window.une) window.une.logjika_shperndarjes = iRi;
  if(typeof renderUserMenu === 'function') renderUserMenu();
  // Nese nje reklame ishte para-krijuar (nga regjistrimi automatik i pares llogari) dhe
  // sapo u aktivizua nga konfirmo-llogarine, kjo llogari e re ka TASHME reklame gati —
  // kalo direkt te dashboard-i, jo te krijimi (perndryshe do te krijohej nje reklame E DYTE).
  let kaReklameTashme = false;
  try{
    const st = await (await fetch('/api/kreative/statusi-krijimit?logjika='+encodeURIComponent(iRi))).json();
    kaReklameTashme = !!(st.gjendja && st.gjendja !== 'asnje');
  }catch(e){}
  if(typeof refreshProg === 'function') await refreshProg();
  nav(kaReklameTashme ? {v:'profile', nav:'dashboard'} : {v:'profile', nav:'kreative', tab:'krijo'});
}

// ================= DASHBOARD (Balance) =================
async function mainDashboardBalance(m){
  m.innerHTML=planiBanerHtml()+'<h2 class="h">Account status — Balance</h2>'+
    '<p class="small" style="margin:2px 0 18px;">Description, AI matching, snippets and conversion tracking are shared with the Auction account. All that is left is creating ads for Balance.</p>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;">'+
      '<div class="card" style="flex:0 0 auto;">'+
        '<div class="vstep" id="vstepBal" style="display:flex;flex-direction:column;"></div>'+
      '</div>'+
      '<div class="card" id="dashAnalitikaBal" style="flex:1;min-width:280px;cursor:pointer;">'+
        '<p class="small">Loading…</p>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" id="dashReklamat" style="flex:1.6;min-width:300px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Ads (Balance)</h3>'+
        '<div id="dashReklamatList"><p class="small">Loading…</p></div>'+
      '</div>'+
      '<div class="card" id="dashKategori" style="flex:1;min-width:220px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Business categories</h3>'+
        '<p class="small mut" style="margin:0 0 10px;">Where your ads have been uploaded.</p>'+
        '<div style="position:relative;margin-bottom:12px;">'+
          '<button type="button" id="dashKatRekBtn" class="btn" style="width:100%;">Ads <span id="dashKatRekBtnCount"></span> ▾</button>'+
          '<div id="dashKatRekDropdown" class="hide" style="position:absolute;top:110%;left:0;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<div id="dashKategoriLista" style="max-height:140px;overflow-y:auto;padding-right:4px;"><p class="small">Loading…</p></div>'+
        '<button class="btn" style="width:100%;margin-top:12px;" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'analytics\'})">See more →</button>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" id="dashSnippetet2" style="flex:1;min-width:220px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Ad snippets</h3>'+
        '<div id="dashSnippetet2List"><p class="small">Loading…</p></div>'+
      '</div>'+
      '<div class="card" id="dashKonvertimet" style="flex:1.6;min-width:300px;cursor:pointer;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 10px;">Conversion tracking</h3>'+
        '<div id="dashKonvertimetList"><p class="small">Loading…</p></div>'+
      '</div>'+
    '</div>';
  await renderDashStatusBalance();
  planiBanerNgarko();
  if(typeof ngarkoDashReklamat==='function') ngarkoDashReklamat();
  if(typeof ngarkoDashKategori==='function') ngarkoDashKategori();
  if(typeof ngarkoDashSnippetet==='function') ngarkoDashSnippetet();
  if(typeof ngarkoDashKonvertimet==='function') ngarkoDashKonvertimet();
  ngarkoDashAnalitikaBalance();
}

// Karta "Analytics" per Balance — perdor /api/profili-balance (tashme ekzistues,
// shikime reale te ndara nga ngarkime) ne vend te /api/profili (i cili s'eshte
// logjika-aware, eshte i lidhur specifikisht me te dhena Ankand-stil).
async function ngarkoDashAnalitikaBalance(){
  const card=$('dashAnalitikaBal'); if(!card) return;
  card.onclick=()=>nav({v:'profile', nav:'profili'});
  try{
    const bal=await(await fetch('/api/profili-balance')).json();
    const dhene=bal.dhene||{shfaqje:0,klikime:0,konvertime:0};
    const marra=bal.marra||{shfaqje:0,klikime:0,konvertime:0};
    card.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="font-weight:700;font-size:15px;">Balance activity</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:130px;background:rgba(74,158,255,.12);border:1px solid var(--acc);border-radius:10px;padding:14px 16px;">'+
            '<div style="font-size:28px;font-weight:800;color:var(--acc);line-height:1;">'+(marra.shfaqje||0)+'</div>'+
            '<div class="small" style="margin-top:4px;">real views received</div></div>'+
          '<div style="flex:1;min-width:130px;background:rgba(74,158,255,.12);border:1px solid var(--acc);border-radius:10px;padding:14px 16px;">'+
            '<div style="font-size:28px;font-weight:800;color:var(--acc);line-height:1;">'+(dhene.shfaqje||0)+'</div>'+
            '<div class="small" style="margin-top:4px;">real views given</div></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:100px;background:#0e1116;border:1px solid var(--line);border-radius:9px;padding:8px 12px;opacity:.75;">'+
            '<div style="font-size:15px;font-weight:600;color:#e6edf3;">'+(marra.konvertime||0)+'</div>'+
            '<div class="small" style="font-size:11px;color:#8b949e;">conversions received</div></div>'+
          '<div style="flex:1;min-width:100px;background:#0e1116;border:1px solid var(--line);border-radius:9px;padding:8px 12px;opacity:.75;">'+
            '<div style="font-size:15px;font-weight:600;color:#e6edf3;">'+(marra.klikime||0)+'</div>'+
            '<div class="small" style="font-size:11px;color:#8b949e;">clicks received</div></div>'+
        '</div>'+
      '</div>';
  }catch(e){ card.innerHTML='<p class="small">Error.</p>'; }
}

async function renderDashStatusBalance(){
  const el=$('vstepBal'); if(!el) return; el.innerHTML='<p class="small mut">Checking…</p>';
  let gjendjaKrijimi = 'asnje';
  try{
    const r = await (await fetch('/api/kreative/statusi-krijimit?logjika=barazi')).json();
    gjendjaKrijimi = r.gjendja || 'asnje';
  }catch(e){}
  // Rifresko ziljen e njoftimeve — njesoj si versioni Ankand (app.js) — nese reklama
  // sapo u krijua ne sfond (regjistrim automatik), njoftimi i vjeter duhet te zhduket
  // menjehere, pa pritur rifreskim manual/rindezje browser-i.
  if(gjendjaKrijimi !== 'asnje'){
    try{ ngarkoNjoftimet(); }catch(e){}
  } else if(!window.__dashStatusBalRiprovuar){
    window.__dashStatusBalRiprovuar = true;
    setTimeout(async ()=>{
      try{
        const r2 = await (await fetch('/api/kreative/statusi-krijimit?logjika=barazi')).json();
        if(r2.gjendja && r2.gjendja !== 'asnje'){ try{ ngarkoNjoftimet(); }catch(e){} renderDashStatusBalance(); }
      }catch(e){}
    }, 6000);
  }
  el.innerHTML='';
  const rreshtat=[
    { done: !!(prog && prog.llogaria), auto: !!(prog && prog.llogaria && prog.biznesiAuto), label:'Business', veprim:()=>nav({v:'profile',nav:'biznesi'}) },
    { done: !!(prog && prog.pershkrimi), auto: !!(prog && prog.pershkrimi && prog.pershkrimiAuto), label:'Description', veprim:()=>nav({v:'profile',nav:'pershkrimi'}) },
    { done: !!(prog && prog.lidhja),     label:'Snippet connection', veprim:()=>nav({v:'profile',nav:'lidhjaSnippet'}) },
    { done: gjendjaKrijimi==='manual', auto: gjendjaKrijimi==='auto', label:'Create an ad (Balance)', veprim:()=>nav({v:'profile',nav:'reklamat',sub:'create'}) },
    { done: !!(prog && prog.konvertimi), label:'Connect conversions', veprim:()=>nav({v:'profile',nav:'konvertimet'}) }
  ];
  rreshtat.forEach(r=>{
    const d=document.createElement('div');
    d.className='vs'+(r.auto?' auto':(r.done?' done':' click'));
    const shenja = r.auto ? '★' : (r.done ? '✓' : '+');
    const etiketa = r.auto ? ' — created automatically, click to adjust' : (r.done ? '' : ' — complete this');
    d.innerHTML='<span class="vd">'+shenja+'</span>'+
      '<span class="vl">'+r.label+etiketa+'</span>';
    if(!r.done || r.auto) d.onclick=r.veprim;
    el.appendChild(d);
  });
}

// ================= PROFILI (Balance) — te njejtat te dhena bazë, statistika dhenie/marrje ne vend te pikëve =================
async function mainProfiliBalance(m){
  m.innerHTML='<p class="small">Loading…</p>';
  let d={}, bal={dhene:{shfaqje:0,klikime:0,konvertime:0}, marra:{shfaqje:0,klikime:0,konvertime:0}};
  try{
    d = await(await fetch('/api/profili')).json();
    bal = await(await fetch('/api/profili-balance')).json();
  }catch(e){ m.innerHTML='<p class="small">Loading error.</p>'; return; }
  window.__profiliCache = d;
  const inic=(d.emri||'?').trim().charAt(0).toUpperCase();
  const avatarHTML = d.logo_url
    ? '<div class="avatar" style="overflow:hidden;"><img src="'+esc(d.logo_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>'
    : '<div class="avatar">'+esc(inic)+'</div>';
  const tipiTekst = d.tipi==='b2b'?'Businesses (B2B)':(d.tipi==='b2c'?'Individuals (B2C)':'Both');
  m.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:6px;flex-wrap:wrap;">'+
      '<div style="display:flex;align-items:center;gap:16px;">'+
        avatarHTML+
        '<div><div style="font-size:20px;font-weight:700;">'+esc(d.emri||'')+'</div>'+
          '<div class="small">'+esc(d.email||'')+'</div>'+
          '<div class="small">Audience: '+tipiTekst+'</div></div>'+
      '</div>'+
      '<button class="btn" onclick="profiliHapEdit()">Edit Profile</button>'+
    '</div>'+
    '<h3 class="h" style="font-size:16px;margin:22px 0 4px;">Given (Balance)</h3>'+
    '<div style="display:flex;gap:10px;margin:8px 0 4px;flex-wrap:wrap;">'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.ngarkime+'</div><div class="small">loads</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.shfaqje+'</div><div class="small">real views</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.klikime+'</div><div class="small">clicks</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.dhene.konvertime+'</div><div class="small">conversions</div></div>'+
    '</div>'+
    '<h3 class="h" style="font-size:16px;margin:22px 0 4px;">Received (Balance)</h3>'+
    '<div style="display:flex;gap:10px;margin:8px 0 4px;flex-wrap:wrap;">'+
      '<div class="miniStat"><div class="mv">'+bal.marra.ngarkime+'</div><div class="small">loads</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.marra.shfaqje+'</div><div class="small">real views</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.marra.klikime+'</div><div class="small">clicks</div></div>'+
      '<div class="miniStat"><div class="mv">'+bal.marra.konvertime+'</div><div class="small">conversions</div></div>'+
    '</div>'+
    '<p class="small mut" style="margin:10px 0 4px;">Balance is measured by real views (at least 50% visible for 1+ second), not mere loads. It aims for real view = real view: what you give is what you get. Numbers stay 0 until the Balance distribution mechanism starts.</p>';
}
