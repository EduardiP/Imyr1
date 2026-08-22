// analitika.js — Seksioni Analytics (grafik, filtro, date-range). I ndarë nga app.js.
// Presupozon core.js ($, esc) dhe app.js (nav) të ngarkuara para tij.

function mainAnalytics(m){
  _anaSelectedAd=null; _anaDropdownOpen=false;
  _anaKatSelectedAd=null; _anaKatDropdownOpen=false; _anaKatMetrikaAktive='shikime';
  _anaListSelectedAd=null; _anaListDropdownOpen=false;
  m.innerHTML='<h2 class="h">Analytics</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Ecuria e reklamave të tua me ditë.</p>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPreset(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_top" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_top" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNga" style="display:none;">'+
        '<input type="date" id="anaDeri" style="display:none;">'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;margin-top:10px;">'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaRekBtn" class="btn" style="min-width:150px;">Reklamat <span id="anaRekBtnCount"></span> ▾</button>'+
          '<div id="anaRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:240px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
      '</div>'+
      '<div id="anaMetrikaRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;"></div>'+
    '</div>'+
    '<div class="card"><canvas id="anaCanvas" height="90"></canvas></div>'+
    '<div class="card" style="margin-top:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPresetKat(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_kat" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_kat" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaKat" style="display:none;">'+
        '<input type="date" id="anaDeriKat" style="display:none;">'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" style="flex:2;min-width:340px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">'+
          '<h3 class="h" style="font-size:15px;margin:0;">Sipas kategorisë së biznesit</h3>'+
          '<div style="flex:0 0 200px;">'+
            '<div class="small mut" style="font-weight:600;margin-bottom:6px;">Kategoritë e bizneseve ku janë ngarkuar reklamat tuaja.</div>'+
            '<div id="anaKatLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;"></div>'+
          '</div>'+
          '<div style="position:relative;">'+
            '<button type="button" id="anaKatRekBtn" class="btn" style="min-width:140px;">Reklamat <span id="anaKatRekBtnCount"></span> ▾</button>'+
            '<div id="anaKatRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:230px;max-height:260px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
          '</div>'+
        '</div>'+
        '<div id="anaKatMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
        '<canvas id="anaKatCanvas" height="110"></canvas>'+
      '</div>'+
      '<div class="card" style="flex:1;min-width:220px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Kategoritë e bizneseve</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Ku janë ngarkuar reklamat tuaja.</p>'+
        '<div style="position:relative;margin-bottom:14px;">'+
          '<button type="button" id="anaListRekBtn" class="btn" style="width:100%;">Reklamat <span id="anaListRekBtnCount"></span> ▾</button>'+
          '<div id="anaListRekDropdown" class="hide" style="position:absolute;top:110%;left:0;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;max-height:240px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<div id="anaListaKategori" style="max-height:300px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px;">'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">'+
        '<div style="flex:1;min-width:220px;">'+
          '<div style="font-size:40px;font-weight:800;color:var(--acc);" id="anaPikatProfili">–</div>'+
          '<div class="small mut" style="margin-top:4px;">Sa më shumë u jep bizneseve të tjera, aq më shumë rriten pikët — dhe aq më shpesh shfaqet reklama jote te të tjerët.</div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
          '<button class="btn" onclick="anaPresetDhene(7)">7 ditët e fundit</button>'+
          '<button class="btn" onclick="anaPresetDhene(30)">30 ditët e fundit</button>'+
          '<button class="btn" onclick="anaPresetDhene(90)">90 ditët e fundit</button>'+
          '<div style="position:relative;">'+
            '<button type="button" id="anaKalBtn_dhene" class="btn" style="min-width:170px;"></button>'+
            '<div id="anaKalPanel_dhene" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
          '</div>'+
          '<input type="date" id="anaNgaDhene" style="display:none;">'+
          '<input type="date" id="anaDeriDhene" style="display:none;">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" style="flex:1;min-width:260px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Snippet-et e reklamave</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë bizneseve të tjera nëpërmjet snippet-eve tuaja. <span style="color:var(--acc);text-decoration:underline;cursor:pointer;" onclick="snipKrijo()">Shto snippet</span> për t\'u shfaqur edhe ti më shumë tek të tjerët.</p>'+
        '<div id="anaSnipDheneLista" style="max-height:300px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
      '<div class="card" style="flex:2;min-width:340px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Sipas kategorisë së biznesit</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë secilës kategori.</p>'+
        '<div id="anaKatDheneMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>'+
        '<div id="anaKatDheneLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;margin-bottom:10px;"></div>'+
        '<canvas id="anaKatDheneCanvas" height="110"></canvas>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px;">'+
      '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Deficiti — Marrë − Dhënë</h3>'+
      '<p class="small mut" style="margin:0 0 12px;">Diferenca mes sa ke marrë (si reklamues) dhe sa ke dhënë (si host), për dhogarinë aktuale. Pozitiv = ke marrë më shumë; negativ = ke dhënë më shumë.</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'+
        '<button class="btn" onclick="anaPresetDeficit(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDeficit(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDeficit(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_deficit" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_deficit" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaDeficit" style="display:none;">'+
        '<input type="date" id="anaDeriDeficit" style="display:none;">'+
      '</div>'+
      '<div id="anaDeficitMetrikaRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
      '<canvas id="anaDeficitCanvas" height="110"></canvas>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  $('anaNgaKat').value=anaFmt(nga); $('anaDeriKat').value=anaFmt(sot);
  $('anaNgaDhene').value=anaFmt(nga); $('anaDeriDhene').value=anaFmt(sot);
  $('anaNgaDeficit').value=anaFmt(nga); $('anaDeriDeficit').value=anaFmt(sot);
  anaKrijoKalendarRangu({
    id:'top', btnId:'anaKalBtn_top', panelId:'anaKalPanel_top',
    getNga:()=>$('anaNga').value, getDeri:()=>$('anaDeri').value,
    setNga:v=>{ $('anaNga').value=v; }, setDeri:v=>{ $('anaDeri').value=v; },
    onRuaj: ngarkoAnalitika
  });
  anaKrijoKalendarRangu({
    id:'kat', btnId:'anaKalBtn_kat', panelId:'anaKalPanel_kat',
    getNga:()=>$('anaNgaKat').value, getDeri:()=>$('anaDeriKat').value,
    setNga:v=>{ $('anaNgaKat').value=v; }, setDeri:v=>{ $('anaDeriKat').value=v; },
    onRuaj: anaNgarkoKategoriteTeGjitha
  });
  anaKrijoKalendarRangu({
    id:'dhene', btnId:'anaKalBtn_dhene', panelId:'anaKalPanel_dhene',
    getNga:()=>$('anaNgaDhene').value, getDeri:()=>$('anaDeriDhene').value,
    setNga:v=>{ $('anaNgaDhene').value=v; }, setDeri:v=>{ $('anaDeriDhene').value=v; },
    onRuaj: anaNgarkoDheneTeGjitha
  });
  anaKrijoKalendarRangu({
    id:'deficit', btnId:'anaKalBtn_deficit', panelId:'anaKalPanel_deficit',
    getNga:()=>$('anaNgaDeficit').value, getDeri:()=>$('anaDeriDeficit').value,
    setNga:v=>{ $('anaNgaDeficit').value=v; }, setDeri:v=>{ $('anaDeriDeficit').value=v; },
    onRuaj: ngarkoAnaDeficit
  });
  $('anaRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaRekDropdown'); if(!dd) return;
    _anaDropdownOpen=!_anaDropdownOpen;
    dd.classList.toggle('hide', !_anaDropdownOpen);
  });
  $('anaKatRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaKatRekDropdown'); if(!dd) return;
    _anaKatDropdownOpen=!_anaKatDropdownOpen;
    dd.classList.toggle('hide', !_anaKatDropdownOpen);
  });
  $('anaListRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaListRekDropdown'); if(!dd) return;
    _anaListDropdownOpen=!_anaListDropdownOpen;
    dd.classList.toggle('hide', !_anaListDropdownOpen);
  });
  anaRenderMetrika();
  ngarkoAnaReklamatLista();
  anaRenderKategoriMetrika();
  ngarkoAnaKatReklamatLista();
  ngarkoAnaListRekamatLista();
  ngarkoAnalitika();
  ngarkoAnaKategorite();
  ngarkoAnaLista();
  anaRenderKatDheneMetrika();
  ngarkoAnaPikatProfili();
  ngarkoAnaSnipDhene();
  ngarkoAnaKatDhene();
  anaRenderDeficitMetrika();
  ngarkoAnaDeficit();
}

// ═══════════════════════════════════════════════════════════════════
// FAQE TE VECANTA — secila nen-kategori Analytics ka TASHME permbajtjen
// e VET (si Hapësira e reklamave), jo me te gjitha bashke ne nje faqe.
// mainAnalytics() (lart) mbetet e paprekur, thjesht s'thirret me nga
// asnje click normal — vetem funksionet e reja poshte perdoren tani.
// ═══════════════════════════════════════════════════════════════════

function mainAnaTrafiku(m){
  _anaSelectedAd=null; _anaDropdownOpen=false;
  _anaDetAktiv='pesha'; // Pesha e zgjedhur si parazgjedhje, jo asnje
  m.innerHTML='<h2 class="h">Trafiku</h2>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Detajet e pjesëmarrjeve në Ankand</h3>'+
      '<p class="small mut" style="margin:0 0 12px;">Data vlen për të gjitha filtrat poshtë. Kliko një kategori filtri për ta hapur.</p>'+
      '<div id="anaDetKryesoriRow" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'+
        '<button class="btn" onclick="anaDetPreset(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaDetPreset(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaDetPreset(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaDetRekBtn" class="btn" style="min-width:150px;">Reklamat <span id="anaDetRekBtnCount"></span> ▾</button>'+
          '<div id="anaDetRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:240px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_det" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_det" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaDet" style="display:none;">'+
        '<input type="date" id="anaDeriDet" style="display:none;">'+
      '</div>'+
      '<div id="anaDetNenPanel" style="margin-bottom:14px;"></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:4px;">'+
        '<div id="anaDetRezultati" style="flex:2;min-width:280px;"></div>'+
        '<div style="flex:1;min-width:200px;max-width:280px;">'+
          '<div id="anaDetTabela1" style="max-height:330px;overflow-y:auto;border:1px solid var(--line);border-radius:8px;"><p class="small" style="padding:10px;">Po ngarkoj…</p></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" style="flex:2;min-width:340px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:4px;">'+
          '<h3 class="h" style="font-size:15px;margin:0;">Sipas orës së ditës</h3>'+
          '<div style="position:relative;">'+
            '<button type="button" id="anaKalBtn_ore" class="btn" style="min-width:170px;"></button>'+
            '<div id="anaKalPanel_ore" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
          '</div>'+
          '<input type="date" id="anaNgaOre" style="display:none;">'+
          '<input type="date" id="anaDeriOre" style="display:none;">'+
        '</div>'+
        '<p class="small mut" style="margin:0 0 12px;">Zgjidh 1 ditë (ose interval) — shtyllat tregojnë shumën në secilën orë. Vetëm 1 metrikë njëherë.</p>'+
        '<div id="anaOreMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
        '<canvas id="anaOreCanvas" height="110"></canvas>'+
      '</div>'+
      '<div class="card" style="flex:1;min-width:260px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Ankand — pjesëmarrje vs fitore</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Zgjidh maksimum 1 kategori biznesi (nga ku ke marrë pjesë), për periudhën e zgjedhur më lart.</p>'+
        '<div id="anaAnkandRezultati" style="margin-bottom:14px;padding:12px;background:#0e1116;border-radius:8px;border:1px solid var(--line);">'+
          '<p class="small mut" style="margin:0;">Zgjidh kategori nga lista poshtë.</p>'+
        '</div>'+
        '<div id="anaAnkandKarusel" style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;padding-right:4px;"></div>'+
      '</div>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  window.__anaKalendaret = window.__anaKalendaret || {};

  // ─── Ora e ditës + Ankand (rreshti i ri, poshtë grafikut kryesor) ───
  $('anaNgaOre').value=anaFmt(nga); $('anaDeriOre').value=anaFmt(sot);
  anaKrijoKalendarRangu({
    id:'ore', btnId:'anaKalBtn_ore', panelId:'anaKalPanel_ore',
    getNga:()=>$('anaNgaOre').value, getDeri:()=>$('anaDeriOre').value,
    setNga:v=>{ $('anaNgaOre').value=v; }, setDeri:v=>{ $('anaDeriOre').value=v; },
    onRuaj: anaNgarkoOreDheAnkand
  });
  anaRenderOreMetrika();
  ngarkoAnaOre();
  ngarkoAnaAnkandKategorite();

  // ─── Detajet e Ankandit (seksioni i ri, ne fillim fare te faqes) ───
  $('anaNgaDet').value=anaFmt(nga); $('anaDeriDet').value=anaFmt(sot);
  anaKrijoKalendarRangu({
    id:'det', btnId:'anaKalBtn_det', panelId:'anaKalPanel_det',
    getNga:()=>$('anaNgaDet').value, getDeri:()=>$('anaDeriDet').value,
    setNga:v=>{ $('anaNgaDet').value=v; }, setDeri:v=>{ $('anaDeriDet').value=v; },
    onRuaj: ngarkoAnaDetaje
  });
  $('anaDetRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaDetRekDropdown'); if(!dd) return;
    _anaDetRekDropdownOpen=!_anaDetRekDropdownOpen;
    dd.classList.toggle('hide', !_anaDetRekDropdownOpen);
  });
  anaRenderDetKryesori();
  anaRenderDetNenPanel();
  ngarkoAnaDetaje();
}

// ═══ Seksioni "Detajet e pjesëmarrjeve në Ankand" — 4 butona kryesorë, secili hap panelin e vet ═══
var _anaDetAktiv=null; // 'pesha'|'pozicioni'|'reklama'|'kategoria'|null
var _anaDetPeshaMode='te_gjitha', _anaDetPeshaFiks=null, _anaDetPeshaMin=null, _anaDetPeshaMax=null;
var _anaDetPozicioni='te_gjitha';
var _anaDetReklamaId='', _anaDetReklamat=[];
var _anaDetKategoria='', _anaDetKategorite=[];

function anaDetPreset(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNgaDet').value=anaFmt(nga); $('anaDeriDet').value=anaFmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret.det) window.__anaKalendaret.det.refreshLabel();
  ngarkoAnaDetaje();
}

function anaDetEmriFiltri(lloji){
  if(lloji==='pesha') return _anaDetPeshaMode==='te_gjitha' ? 'Pesha' : (_anaDetPeshaMode==='fiks' ? 'Pesha: '+_anaDetPeshaFiks : 'Pesha: '+_anaDetPeshaMin+'–'+_anaDetPeshaMax);
  if(lloji==='pozicioni') return _anaDetPozicioni==='te_gjitha' ? 'Pozicioni' : 'Pozicioni: #'+_anaDetPozicioni;
  if(lloji==='reklama') return _anaDetReklamaId ? 'Reklama: '+((_anaDetReklamat.find(r=>r.id==_anaDetReklamaId)||{}).emri||'') : 'Reklama';
  if(lloji==='kategoria') return _anaDetKategoria ? 'Kategoria: '+_anaDetKategoria : 'Kategoria';
}

function anaRenderDetKryesori(){
  const el=$('anaDetKryesoriRow'); if(!el) return;
  const llojet=[
    {k:'pesha', aktiv: _anaDetPeshaMode!=='te_gjitha'},
    {k:'pozicioni', aktiv: _anaDetPozicioni!=='te_gjitha'},
    {k:'reklama', aktiv: !!_anaDetReklamaId},
    {k:'kategoria', aktiv: !!_anaDetKategoria}
  ];
  el.innerHTML='';
  llojet.forEach(function(x){
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=anaDetEmriFiltri(x.k);
    const eshteHapur=_anaDetAktiv===x.k;
    btn.style.cssText = eshteHapur
      ? 'padding:11px 22px;border-radius:10px;border:2px solid var(--acc);background:var(--acc);color:#06121f;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;'
      : (x.aktiv
        ? 'padding:11px 22px;border-radius:10px;border:2px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;'
        : 'padding:11px 22px;border-radius:10px;border:2px solid var(--line);background:transparent;color:var(--txt);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;');
    btn.addEventListener('click', function(){ _anaDetAktiv = (_anaDetAktiv===x.k) ? null : x.k; anaRenderDetKryesori(); anaRenderDetNenPanel(); anaRenderDetRezultati(); });
    el.appendChild(btn);
  });
}

function anaRenderDetNenPanel(){
  const el=$('anaDetNenPanel'); if(!el) return;
  if(!_anaDetAktiv){ el.innerHTML=''; return; }

  if(_anaDetAktiv==='pesha'){
    const modBtn=function(mode,lbl){
      return '<button type="button" onclick="anaDetPeshaSet(\''+mode+'\')" style="'+(_anaDetPeshaMode===mode?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">'+lbl+'</button>';
    };
    el.innerHTML =
      '<div style="padding:12px;background:#0e1116;border:1px solid var(--line);border-radius:8px;">'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:'+(_anaDetPeshaMode==='te_gjitha'?'0':'10px')+';">'+
          modBtn('te_gjitha','Të gjitha')+modBtn('fiks','Numër fiks')+modBtn('interval','Interval')+
        '</div>'+
        (_anaDetPeshaMode==='fiks'
          ? '<div style="display:flex;align-items:center;gap:8px;">Numër fiks: <input type="number" id="anaDetPeshaFiksInp" min="0" max="1500" value="'+(_anaDetPeshaFiks!=null?_anaDetPeshaFiks:'')+'" style="width:90px;" oninput="anaDetPeshaFiksChange(this.value)"><span class="small mut">(0-1500)</span></div>'
          : '')+
        (_anaDetPeshaMode==='interval'
          ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">Nga <input type="number" id="anaDetPeshaMinInp" min="0" max="1500" value="'+(_anaDetPeshaMin!=null?_anaDetPeshaMin:'')+'" style="width:80px;" oninput="anaDetPeshaIntervalChange()"> deri <input type="number" id="anaDetPeshaMaxInp" min="0" max="1500" value="'+(_anaDetPeshaMax!=null?_anaDetPeshaMax:'')+'" style="width:80px;" oninput="anaDetPeshaIntervalChange()"> <span class="small mut">(maksimumi 1500)</span></div>'
          : '')+
      '</div>';
  } else if(_anaDetAktiv==='pozicioni'){
    el.innerHTML =
      '<div style="padding:12px;background:#0e1116;border:1px solid var(--line);border-radius:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">'+
        '<button type="button" onclick="anaDetPozicioniSet(\'te_gjitha\')" style="'+(_anaDetPozicioni==='te_gjitha'?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">Të gjitha</button>'+
        [1,2,3,4,5].map(function(p){
          return '<button type="button" onclick="anaDetPozicioniSet('+p+')" style="'+(_anaDetPozicioni==p?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">#'+p+'</button>';
        }).join('')+
        '<input type="number" id="anaDetPozicioniTjeter" placeholder="tjetër…" min="1" style="width:70px;" onkeydown="if(event.key===\'Enter\')anaDetPozicioniSet(parseInt(this.value,10))">'+
      '</div>';
  } else if(_anaDetAktiv==='reklama'){
    el.innerHTML =
      '<div style="padding:12px;background:#0e1116;border:1px solid var(--line);border-radius:8px;display:flex;flex-wrap:wrap;gap:6px;">'+
        '<button type="button" onclick="anaDetReklamaSet(\'\')" style="'+(!_anaDetReklamaId?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">Të gjitha</button>'+
        (_anaDetReklamat.length ? _anaDetReklamat.map(function(r){
          return '<button type="button" onclick="anaDetReklamaSet('+r.id+')" style="'+(_anaDetReklamaId==r.id?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">'+esc(r.emri||('#'+r.id))+'</button>';
        }).join('') : '<span class="small mut">Asnjë reklamë ka fituar ende në këtë periudhë.</span>')+
      '</div>';
  } else if(_anaDetAktiv==='kategoria'){
    el.innerHTML =
      '<div style="padding:12px;background:#0e1116;border:1px solid var(--line);border-radius:8px;display:flex;flex-wrap:wrap;gap:6px;">'+
        '<button type="button" onclick="anaDetKategoriaSet(\'\')" style="'+(!_anaDetKategoria?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">Të gjitha</button>'+
        (_anaDetKategorite.length ? _anaDetKategorite.map(function(k){
          return '<button type="button" onclick="anaDetKategoriaSet(\''+esc(k)+'\')" style="'+(_anaDetKategoria===k?'background:var(--acc);color:#06121f;':'background:transparent;color:var(--txt);')+'padding:6px 12px;border-radius:6px;border:1px solid var(--line);cursor:pointer;font-family:inherit;">'+esc(k)+'</button>';
        }).join('') : '<span class="small mut">Asnjë kategori në këtë periudhë.</span>')+
      '</div>';
  }
}

function anaDetPeshaSet(mode){ _anaDetPeshaMode=mode; if(mode==='te_gjitha'){ _anaDetPeshaFiks=null; _anaDetPeshaMin=null; _anaDetPeshaMax=null; } anaRenderDetKryesori(); anaRenderDetNenPanel(); ngarkoAnaDetaje(); }
function anaDetPeshaFiksChange(v){ _anaDetPeshaFiks = v===''?null:Math.max(0,Math.min(1500,parseFloat(v))); anaRenderDetKryesori(); ngarkoAnaDetaje(); }
function anaDetPeshaIntervalChange(){
  const mi=$('anaDetPeshaMinInp'), ma=$('anaDetPeshaMaxInp');
  _anaDetPeshaMin = mi.value===''?null:Math.max(0,Math.min(1500,parseFloat(mi.value)));
  _anaDetPeshaMax = ma.value===''?null:Math.max(0,Math.min(1500,parseFloat(ma.value)));
  anaRenderDetKryesori(); ngarkoAnaDetaje();
}
function anaDetPozicioniSet(p){ _anaDetPozicioni = (p==='te_gjitha'||isNaN(p)) ? 'te_gjitha' : p; anaRenderDetKryesori(); anaRenderDetNenPanel(); ngarkoAnaDetaje(); }
function anaDetReklamaSet(id){ _anaDetReklamaId = id; anaRenderDetKryesori(); anaRenderDetNenPanel(); anaDetRenderRekDropdown(); ngarkoAnaDetaje(); }
function anaDetKategoriaSet(kat){ _anaDetKategoria = kat; anaRenderDetKryesori(); anaRenderDetNenPanel(); ngarkoAnaDetaje(); }

// ═══ Dropdown UNIVERSAL i reklamave — punon PAVARESISHT cilën kategori (Pesha/
// Pozicioni/Reklama/Kategoria) ke aktive, gjithmone i paracaktuar "Të gjitha" ═══
var _anaDetRekDropdownOpen=false;
function anaDetRenderRekDropdown(){
  const dd=$('anaDetRekDropdown'); if(!dd) return;
  dd.innerHTML='';
  dd.appendChild(anaRekRresht('Të gjitha', !_anaDetReklamaId, true, function(){ anaDetReklamaSet(''); anaDetMbyllRekDropdown(); }));
  if(!_anaDetReklamat.length){ const p=document.createElement('p'); p.className='small mut'; p.style.padding='6px'; p.textContent="S'ke ende reklama fituese në këtë periudhë."; dd.appendChild(p); anaDetUpdateRekBtnLabel(); return; }
  const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:4px 2px;'; dd.appendChild(hr);
  _anaDetReklamat.forEach(function(r){
    dd.appendChild(anaRekRresht(esc(r.emri||('#'+r.id)), _anaDetReklamaId==r.id, false, function(){ anaDetReklamaSet(r.id); anaDetMbyllRekDropdown(); }));
  });
  anaDetUpdateRekBtnLabel();
}
function anaDetMbyllRekDropdown(){ const dd=$('anaDetRekDropdown'); if(dd) dd.classList.add('hide'); _anaDetRekDropdownOpen=false; }
function anaDetUpdateRekBtnLabel(){
  const el=$('anaDetRekBtnCount'); if(!el) return;
  el.textContent = _anaDetReklamaId ? '(1)' : '';
}

async function ngarkoAnaDetaje(){
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let url='/api/analytics/ankand-detaje?nga='+ngaEl.value+'&deri='+deriEl.value+'&pesha_mode='+_anaDetPeshaMode;
  if(_anaDetPeshaMode==='fiks' && _anaDetPeshaFiks!=null) url+='&pesha_fiks='+_anaDetPeshaFiks;
  if(_anaDetPeshaMode==='interval' && _anaDetPeshaMin!=null && _anaDetPeshaMax!=null) url+='&pesha_min='+_anaDetPeshaMin+'&pesha_max='+_anaDetPeshaMax;
  if(_anaDetPozicioni!=='te_gjitha') url+='&pozicioni='+_anaDetPozicioni;
  if(_anaDetReklamaId) url+='&reklama_id='+_anaDetReklamaId;
  if(_anaDetKategoria) url+='&kategoria='+encodeURIComponent(_anaDetKategoria);
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }

  _anaDetKategorite = d.kategorite_disponueshme || [];
  _anaDetReklamat = d.reklamat_disponueshme || [];
  if(_anaDetAktiv==='reklama' || _anaDetAktiv==='kategoria') anaRenderDetNenPanel();
  anaDetRenderRekDropdown();

  const rreshtat = d.rreshtat || [];
  const t1=$('anaDetTabela1');
  if(t1){
    t1.innerHTML = !rreshtat.length ? '<p class="small mut" style="padding:10px;">Asnjë pjesëmarrje në këtë filtër.</p>' :
      '<table style="width:100%;border-collapse:collapse;font-size:12px;">'+
        '<thead><tr style="position:sticky;top:0;background:var(--card);border-bottom:1px solid var(--line);">'+
          '<th style="text-align:left;padding:7px 8px;font-weight:600;">Data</th>'+
          '<th style="text-align:left;padding:7px 8px;font-weight:600;">Kategoria</th>'+
          '<th style="text-align:center;padding:7px 4px;font-weight:600;">Poz.</th>'+
          '<th style="text-align:right;padding:7px 8px;font-weight:600;">Pesha</th>'+
          '<th style="text-align:right;padding:7px 8px;font-weight:600;">Rezultati</th>'+
        '</tr></thead><tbody>'+
        rreshtat.map(function(r){
          return '<tr style="border-bottom:1px solid #20262f;">'+
            '<td style="padding:7px 8px;white-space:nowrap;">'+esc(r.data)+'</td>'+
            '<td style="padding:7px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;">'+esc(r.kategoria||'—')+'</td>'+
            '<td style="text-align:center;padding:7px 4px;">'+(r.pozicioni!=null?r.pozicioni:'—')+'</td>'+
            '<td style="text-align:right;padding:7px 8px;">'+r.pesha+'</td>'+
            '<td style="text-align:right;padding:7px 8px;font-weight:600;color:'+(r.fitoi?'var(--good)':'var(--mut)')+';">'+(r.fitoi?'Fituar':'Humbur')+'</td>'+
          '</tr>';
        }).join('')+
        '</tbody></table>';
  }
  anaRenderDetRezultati();
}

// ═══ Kontejneri i rezultateve — ndryshon sipas filtrit AKTIV (_anaDetAktiv) ═══
var _anaDetPeshaHistChart=null, _anaDetPozicionetLista=[], _anaDetPozicioniHapur=null;
var _anaDetReklamaChart=null, _anaDetKategoriaChart=null;

function anaRenderDetRezultati(){
  const el=$('anaDetRezultati'); if(!el) return;
  if(!_anaDetAktiv){ el.innerHTML=''; return; }
  if(_anaDetAktiv==='pesha') return anaDetRezPesha(el);
  if(_anaDetAktiv==='pozicioni') return anaDetRezPozicioni(el);
  if(_anaDetAktiv==='reklama') return anaDetRezReklama(el);
  if(_anaDetAktiv==='kategoria') return anaDetRezKategoria(el);
}

// ── Rasti "Pesha" — histogram (qirinj): X=intervale peshe 0-1500, Y=sa here fituar ──
async function anaDetRezPesha(el){
  el.innerHTML = '<h4 class="small" style="font-weight:600;margin:0 0 8px;">Fitoret sipas peshës</h4><canvas id="anaDetPeshaHistCanvas" height="100"></canvas>';
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let d;
  try{ d=await(await fetch('/api/analytics/ankand-pesha-histogram?nga='+ngaEl.value+'&deri='+deriEl.value)).json(); }catch(e){ return; }
  const canvas=$('anaDetPeshaHistCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaDetPeshaHistChart){ _anaDetPeshaHistChart.destroy(); _anaDetPeshaHistChart=null; }
  const ctx=canvas.getContext('2d');
  _anaDetPeshaHistChart=new Chart(ctx,{type:'bar',data:{labels:d.etiketa,datasets:[{data:d.koshat,backgroundColor:'#4a9eff',borderRadius:3,maxBarThickness:26}]},
    options:{responsive:true,
      scales:{x:{ticks:{color:'#8b949e'},grid:{display:false}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}}
  });
}

// ── Rasti "Pozicioni" — liste akordeon: vetem nivelet qe kane fituar, klik = zgjeron/mbyll ──
async function anaDetRezPozicioni(el){
  el.innerHTML = '<h4 class="small" style="font-weight:600;margin:0 0 8px;">Nivelet e pozicionit që kanë fituar</h4><div id="anaDetPozicioniLista"></div>';
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let d;
  try{ d=await(await fetch('/api/analytics/ankand-pozicionet-fituara?nga='+ngaEl.value+'&deri='+deriEl.value)).json(); }catch(e){ return; }
  _anaDetPozicionetLista = d.pozicionet || [];
  _anaDetPozicioniHapur = null;
  anaDetRenderPozicionetLista();
}

function anaDetRenderPozicionetLista(){
  const el=$('anaDetPozicioniLista'); if(!el) return;
  if(!_anaDetPozicionetLista.length){ el.innerHTML='<p class="small mut">Ende s\'ka nivele fituese në këtë periudhë.</p>'; return; }
  el.innerHTML = _anaDetPozicionetLista.map(function(p){
    const hapur = _anaDetPozicioniHapur===p.pozicioni;
    return '<div style="border:1px solid var(--line);border-radius:8px;margin-bottom:8px;overflow:hidden;">'+
      '<button type="button" onclick="anaDetToggloPozicionin('+p.pozicioni+')" style="width:100%;text-align:left;padding:10px 14px;background:'+(hapur?'rgba(74,158,255,.1)':'transparent')+';border:none;color:var(--txt);cursor:pointer;font-family:inherit;font-size:13px;display:flex;align-items:center;gap:10px;">'+
        '<span style="flex:0 0 28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(74,158,255,.15);border:1px solid var(--acc);border-radius:6px;font-weight:700;color:var(--acc);">'+p.pozicioni+'</span>'+
        '<span style="flex:1;">'+p.n+' fitore</span><span class="mut">'+(hapur?'▲':'▼')+'</span>'+
      '</button>'+
      '<div id="anaDetPozicioniDetaje_'+p.pozicioni+'" style="'+(hapur?'':'display:none;')+'padding:0 14px 12px;"></div>'+
    '</div>';
  }).join('');
  if(_anaDetPozicioniHapur!=null) anaDetNgarkoPozicioniDetaje(_anaDetPozicioniHapur);
}

async function anaDetToggloPozicionin(p){
  _anaDetPozicioniHapur = (_anaDetPozicioniHapur===p) ? null : p;
  anaDetRenderPozicionetLista();
}

async function anaDetNgarkoPozicioniDetaje(p){
  const el=$('anaDetPozicioniDetaje_'+p); if(!el) return;
  el.innerHTML='<p class="small mut">Po ngarkoj…</p>';
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  let d;
  try{ d=await(await fetch('/api/analytics/ankand-pozicion-detaje?nga='+ngaEl.value+'&deri='+deriEl.value+'&pozicioni='+p)).json(); }catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; return; }
  const fitoret=d.fitoret||[];
  el.innerHTML = !fitoret.length ? '<p class="small mut">Asnjë detaj.</p>' :
    '<table style="width:100%;font-size:12px;border-collapse:collapse;">'+
      '<thead><tr style="color:var(--mut);text-align:left;"><th style="padding:4px 6px;">Data</th><th style="padding:4px 6px;">Reklama</th><th style="padding:4px 6px;">Kategoria</th><th style="padding:4px 6px;">Pesha</th><th style="padding:4px 6px;">AI</th></tr></thead>'+
      '<tbody>'+fitoret.map(function(f){
        return '<tr style="border-top:1px solid #20262f;">'+
          '<td style="padding:4px 6px;">'+esc(f.data)+'</td>'+
          '<td style="padding:4px 6px;">'+esc(f.reklama)+'</td>'+
          '<td style="padding:4px 6px;">'+esc(f.kategoria||'—')+'</td>'+
          '<td style="padding:4px 6px;">'+f.pesha+'</td>'+
          '<td style="padding:4px 6px;">'+f.ai+'</td>'+
        '</tr>';
      }).join('')+
    '</tbody></table>';
}

// ── Rasti "Reklama" — ripërdor grafikun kryesor (Trafiku), filtruar te reklama e zgjedhur ──
async function anaDetRezReklama(el){
  el.innerHTML = '<h4 class="small" style="font-weight:600;margin:0 0 8px;">Ecuria e reklamës</h4>'+
    '<div id="anaDetReklamaMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>'+
    '<canvas id="anaDetReklamaCanvas" height="100"></canvas>';
  anaDetRenderReklamaMetrika();
  await anaDetNgarkoReklamaChart();
}
var _anaDetRekMetrikaAktive={shfaqje:true,shikime:true,klikime:true,konvertime:true};
function anaDetRenderReklamaMetrika(){
  const el=$('anaDetReklamaMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaDetRekMetrikaAktive[x.k];
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){ _anaDetRekMetrikaAktive[x.k]=!_anaDetRekMetrikaAktive[x.k]; anaDetRenderReklamaMetrika(); anaDetNgarkoReklamaChart(); });
    el.appendChild(btn);
  });
}
async function anaDetNgarkoReklamaChart(){
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let url='/api/analytics/reklamat?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  if(_anaDetReklamaId) url+='&reklama_ids='+_anaDetReklamaId;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  const rows=d.rows||[]; const labels=rows.map(r=>r.data);
  const datasets=[];
  ANA_METRIKA.forEach(x=>{ if(_anaDetRekMetrikaAktive[x.k]) datasets.push({label:x.l, data:rows.map(r=>r[x.k]), borderColor:x.c, backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:x.c}); });
  const canvas=$('anaDetReklamaCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaDetReklamaChart){ _anaDetReklamaChart.destroy(); _anaDetReklamaChart=null; }
  const ctx=canvas.getContext('2d');
  _anaDetReklamaChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{labels:{color:'#e6edf3'}}}},
    plugins:[anaMultiColorLinePlugin]
  });
}

// ── Rasti "Kategoria" — ripërdor grafikun "Sipas kategorisë" (nje vije per kategori) ──
async function anaDetRezKategoria(el){
  el.innerHTML = '<h4 class="small" style="font-weight:600;margin:0 0 8px;">Sipas kategorisë së biznesit</h4>'+
    '<div id="anaDetKatMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>'+
    '<div style="display:flex;gap:14px;align-items:stretch;">'+
      '<div style="flex:1;min-width:0;"><canvas id="anaDetKategoriaCanvas" height="100"></canvas></div>'+
      '<div style="flex:0 0 150px;">'+
        '<div id="anaDetKatLegend" style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;padding-right:2px;"></div>'+
      '</div>'+
    '</div>';
  anaDetRenderKatMetrika();
  await anaDetNgarkoKategoriaChart();
}
var _anaDetKatMetrikaAktive='shikime';
function anaDetRenderKatMetrika(){
  const el=$('anaDetKatMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaDetKatMetrikaAktive===x.k;
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:var(--acc);color:#06121f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){ _anaDetKatMetrikaAktive=x.k; anaDetRenderKatMetrika(); anaDetNgarkoKategoriaChart(); });
    el.appendChild(btn);
  });
}
var _anaDetKategoriaChartRef=null;
async function anaDetNgarkoKategoriaChart(){
  const ngaEl=$('anaNgaDet'), deriEl=$('anaDeriDet');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let url='/api/analytics/kategorite?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  const kategorite=(d.kategorite||[]).filter(k=>k.pikat.some(p=>p[_anaDetKatMetrikaAktive]>0));
  const legEl=$('anaDetKatLegend');
  if(legEl) legEl.innerHTML = !kategorite.length ? '<p class="small mut" style="margin:0;">Asnjë kategori.</p>' :
    kategorite.map((k,i)=>'<div style="display:flex;align-items:center;gap:7px;font-size:12px;"><span style="width:10px;height:10px;border-radius:50%;background:'+anaKatPaleta(i)+';"></span>'+esc(k.emri)+'</div>').join('');
  const canvas=$('anaDetKategoriaCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaDetKategoriaChartRef){ _anaDetKategoriaChartRef.destroy(); _anaDetKategoriaChartRef=null; }
  if(!kategorite.length){ const ctx0=canvas.getContext('2d'); ctx0.clearRect(0,0,canvas.width,canvas.height); return; }
  const labels=kategorite[0].pikat.map(p=>p.data);
  const datasets=kategorite.map((k,i)=>({label:k.emri, data:k.pikat.map(p=>p[_anaDetKatMetrikaAktive]), borderColor:anaKatPaleta(i), backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:anaKatPaleta(i)}));
  const ctx=canvas.getContext('2d');
  _anaDetKategoriaChartRef=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}},
    plugins:[anaMultiColorLinePlugin]
  });
}


function anaNgarkoOreDheAnkand(){ ngarkoAnaOre(); ngarkoAnaAnkandKategorite(); }

// ═══ "Sipas orës së ditës" — VETEM 1 metrikë (radio), qirinj (bare), 24 shtylla ═══
var _anaOreMetrikaAktive='shfaqje', _anaOreChart=null;

function anaRenderOreMetrika(){
  const el=$('anaOreMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaOreMetrikaAktive===x.k;
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:var(--acc);color:#06121f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaOreMetrikaAktive=x.k;
      anaRenderOreMetrika();
      ngarkoAnaOre();
    });
    el.appendChild(btn);
  });
}

async function ngarkoAnaOre(){
  const ngaEl=$('anaNgaOre'), deriEl=$('anaDeriOre');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  const url='/api/analytics/ore?nga='+ngaEl.value+'&deri='+deriEl.value+'&metrika='+_anaOreMetrikaAktive+'&logjika='+(window.__llogariaModaliteti||'ankand');
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  const oret=d.oret||new Array(24).fill(0);
  const labels=oret.map((_,i)=>i+':00');
  const ngjyra=(ANA_METRIKA.find(x=>x.k===_anaOreMetrikaAktive)||{}).c||'#4a9eff';
  const canvas=$('anaOreCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaOreChart){ _anaOreChart.destroy(); _anaOreChart=null; }
  const ctx=canvas.getContext('2d');
  _anaOreChart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data:oret,backgroundColor:ngjyra,borderRadius:3,maxBarThickness:22}]},
    options:{responsive:true,
      scales:{x:{ticks:{color:'#8b949e'},grid:{display:false}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}}
  });
}

// ═══ "Ankand — pjesëmarrje vs fitore" — karusel vertikal kategorish, max 1 e zgjedhur ═══
var _anaAnkandKategorite=[], _anaAnkandZgjedhur=null;

async function ngarkoAnaAnkandKategorite(){
  const ngaEl=$('anaNgaOre'), deriEl=$('anaDeriOre');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  const url='/api/analytics/ankand-kategorite?nga='+ngaEl.value+'&deri='+deriEl.value;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  _anaAnkandKategorite=d.kategorite||[];
  if(_anaAnkandZgjedhur && !_anaAnkandKategorite.some(k=>k.kategoria===_anaAnkandZgjedhur)) _anaAnkandZgjedhur=null;
  anaRenderAnkandKarusel();
  anaRenderAnkandRezultati();
}

function anaRenderAnkandKarusel(){
  const el=$('anaAnkandKarusel'); if(!el) return;
  if(!_anaAnkandKategorite.length){ el.innerHTML='<p class="small mut" style="margin:0;">Asnjë pjesëmarrje Ankand në këtë periudhë.</p>'; return; }
  el.innerHTML = _anaAnkandKategorite.map(function(k, i){
    const on = _anaAnkandZgjedhur===k.kategoria;
    return '<button type="button" onclick="anaZgjidhAnkandKategori('+i+')" style="text-align:left;padding:9px 12px;border-radius:8px;border:1px solid '+(on?'var(--acc)':'var(--line)')+';background:'+(on?'rgba(74,158,255,.15)':'transparent')+';color:'+(on?'var(--acc)':'var(--txt)')+';cursor:pointer;font-family:inherit;font-size:13px;">'+
      esc(k.kategoria)+' <span style="opacity:.6;font-size:11px;">('+k.pjesemarrje+')</span>'+
    '</button>';
  }).join('');
}

function anaZgjidhAnkandKategori(i){
  const k=_anaAnkandKategorite[i]; if(!k) return;
  _anaAnkandZgjedhur = (_anaAnkandZgjedhur===k.kategoria) ? null : k.kategoria; // klik i dyte = shfuqizo zgjedhjen
  anaRenderAnkandKarusel();
  anaRenderAnkandRezultati();
}

function anaRenderAnkandRezultati(){
  const el=$('anaAnkandRezultati'); if(!el) return;
  if(!_anaAnkandZgjedhur){
    // Pa zgjedhje — trego totalin e pergjithshem (te gjitha kategorite bashke)
    const tot = _anaAnkandKategorite.reduce((acc,k)=>({pjesemarrje:acc.pjesemarrje+k.pjesemarrje, fitore:acc.fitore+k.fitore}), {pjesemarrje:0,fitore:0});
    el.innerHTML = '<div class="small mut" style="margin-bottom:4px;">Total (të gjitha kategoritë)</div>'+
      '<div style="font-size:13px;">Pjesëmarrje: <b style="color:var(--txt);">'+tot.pjesemarrje+'</b> &nbsp; Fitore: <b style="color:var(--good);">'+tot.fitore+'</b></div>';
    return;
  }
  const k = _anaAnkandKategorite.find(x=>x.kategoria===_anaAnkandZgjedhur);
  if(!k){ el.innerHTML='<p class="small mut" style="margin:0;">S\'u gjet.</p>'; return; }
  const perc = k.pjesemarrje ? Math.round(k.fitore/k.pjesemarrje*100) : 0;
  el.innerHTML = '<div class="small mut" style="margin-bottom:4px;">'+esc(k.kategoria)+'</div>'+
    '<div style="font-size:13px;">Pjesëmarrje: <b style="color:var(--txt);">'+k.pjesemarrje+'</b> &nbsp; Fitore: <b style="color:var(--good);">'+k.fitore+'</b> &nbsp; ('+perc+'%)</div>';
}



function mainAnaDeficiti(m){
  m.innerHTML='<h2 class="h">Deficiti</h2>'+
    '<div class="card">'+
      '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Deficiti — Marrë − Dhënë</h3>'+
      '<p class="small mut" style="margin:0 0 12px;">Diferenca mes sa ke marrë (si reklamues) dhe sa ke dhënë (si host), për dhogarinë aktuale. Pozitiv = ke marrë më shumë; negativ = ke dhënë më shumë.</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'+
        '<button class="btn" onclick="anaPresetDeficit(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDeficit(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDeficit(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_deficit" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_deficit" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaDeficit" style="display:none;">'+
        '<input type="date" id="anaDeriDeficit" style="display:none;">'+
      '</div>'+
      '<div id="anaDeficitMetrikaRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
      '<canvas id="anaDeficitCanvas" height="110"></canvas>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;margin-top:16px;">'+
      '<div class="card" style="flex:1;min-width:300px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 12px;">Vetëm Dhënë</h3>'+
        '<div id="anaDhenNgaMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
        '<canvas id="anaDhenNgaCanvas" height="110"></canvas>'+
      '</div>'+
      '<div class="card" style="flex:1;min-width:300px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 12px;">Vetëm Marrë</h3>'+
        '<div id="anaMarrjaMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
        '<canvas id="anaMarrjaCanvas" height="110"></canvas>'+
      '</div>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNgaDeficit').value=anaFmt(nga); $('anaDeriDeficit').value=anaFmt(sot);
  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'deficit', btnId:'anaKalBtn_deficit', panelId:'anaKalPanel_deficit',
    getNga:()=>$('anaNgaDeficit').value, getDeri:()=>$('anaDeriDeficit').value,
    setNga:v=>{ $('anaNgaDeficit').value=v; }, setDeri:v=>{ $('anaDeriDeficit').value=v; },
    onRuaj: anaNgarkoDeficitinTeGjithe
  });
  anaRenderDeficitMetrika();
  ngarkoAnaDeficit();
  anaRenderDhenNgaMetrika();
  anaRenderMarrjaMetrika();
  ngarkoAnaDhenNga();
  ngarkoAnaMarrja();
}

function mainAnaReklamat(m){
  _anaKatSelectedAd=null; _anaKatDropdownOpen=false; _anaKatMetrikaAktive='shikime';
  _anaListSelectedAd=null; _anaListDropdownOpen=false;
  m.innerHTML='<h2 class="h">Reklamat — Sipas kategorisë</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Ku janë shfaqur reklamat tuaja, sipas kategorisë së biznesit.</p>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPresetKat(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_kat" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_kat" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaKat" style="display:none;">'+
        '<input type="date" id="anaDeriKat" style="display:none;">'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;">'+
      '<div class="card" style="flex:2;min-width:340px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">'+
          '<h3 class="h" style="font-size:15px;margin:0;">Sipas kategorisë së biznesit</h3>'+
          '<div style="flex:0 0 200px;">'+
            '<div class="small mut" style="font-weight:600;margin-bottom:6px;">Kategoritë e bizneseve ku janë ngarkuar reklamat tuaja.</div>'+
            '<div id="anaKatLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;"></div>'+
          '</div>'+
          '<div style="position:relative;">'+
            '<button type="button" id="anaKatRekBtn" class="btn" style="min-width:140px;">Reklamat <span id="anaKatRekBtnCount"></span> ▾</button>'+
            '<div id="anaKatRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:230px;max-height:260px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
          '</div>'+
        '</div>'+
        '<div id="anaKatMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
        '<canvas id="anaKatCanvas" height="110"></canvas>'+
      '</div>'+
      '<div class="card" style="flex:1;min-width:220px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Kategoritë e bizneseve</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Ku janë ngarkuar reklamat tuaja.</p>'+
        '<div style="position:relative;margin-bottom:14px;">'+
          '<button type="button" id="anaListRekBtn" class="btn" style="width:100%;">Reklamat <span id="anaListRekBtnCount"></span> ▾</button>'+
          '<div id="anaListRekDropdown" class="hide" style="position:absolute;top:110%;left:0;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;max-height:240px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<div id="anaListaKategori" style="max-height:300px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNgaKat').value=anaFmt(nga); $('anaDeriKat').value=anaFmt(sot);
  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'kat', btnId:'anaKalBtn_kat', panelId:'anaKalPanel_kat',
    getNga:()=>$('anaNgaKat').value, getDeri:()=>$('anaDeriKat').value,
    setNga:v=>{ $('anaNgaKat').value=v; }, setDeri:v=>{ $('anaDeriKat').value=v; },
    onRuaj: anaNgarkoKategoriteTeGjitha
  });
  $('anaKatRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaKatRekDropdown'); if(!dd) return;
    _anaKatDropdownOpen=!_anaKatDropdownOpen;
    dd.classList.toggle('hide', !_anaKatDropdownOpen);
  });
  $('anaListRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaListRekDropdown'); if(!dd) return;
    _anaListDropdownOpen=!_anaListDropdownOpen;
    dd.classList.toggle('hide', !_anaListDropdownOpen);
  });
  anaRenderKategoriMetrika();
  ngarkoAnaKatReklamatLista();
  ngarkoAnaListRekamatLista();
  ngarkoAnaKategorite();
  ngarkoAnaLista();
}

function mainAnaSnippetet(m){
  m.innerHTML='<h2 class="h">Snippet-et e reklamave</h2>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPresetDhene(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDhene(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetDhene(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_dhene" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_dhene" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaDhene" style="display:none;">'+
        '<input type="date" id="anaDeriDhene" style="display:none;">'+
      '</div>'+
    '</div>'+
    '<div class="card">'+
      '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë bizneseve të tjera nëpërmjet snippet-eve tuaja. <span style="color:var(--acc);text-decoration:underline;cursor:pointer;" onclick="snipKrijo()">Shto snippet</span> për t\'u shfaqur edhe ti më shumë tek të tjerët.</p>'+
      '<div id="anaSnipDheneLista" style="max-height:400px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNgaDhene').value=anaFmt(nga); $('anaDeriDhene').value=anaFmt(sot);
  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'dhene', btnId:'anaKalBtn_dhene', panelId:'anaKalPanel_dhene',
    getNga:()=>$('anaNgaDhene').value, getDeri:()=>$('anaDeriDhene').value,
    setNga:v=>{ $('anaNgaDhene').value=v; }, setDeri:v=>{ $('anaDeriDhene').value=v; },
    onRuaj: ngarkoAnaSnipDhene
  });
  ngarkoAnaSnipDhene();
}

function mainAnaDhenie(m){
  m.innerHTML='<h2 class="h">Dhënie</h2>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">'+
        '<div style="flex:1;min-width:220px;">'+
          '<div style="font-size:40px;font-weight:800;color:var(--acc);" id="anaPikatProfili">–</div>'+
          '<div class="small mut" style="margin-top:4px;">Sa më shumë u jep bizneseve të tjera, aq më shumë rriten pikët — dhe aq më shpesh shfaqet reklama jote te të tjerët.</div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
          '<button class="btn" onclick="anaPresetDhene(7)">7 ditët e fundit</button>'+
          '<button class="btn" onclick="anaPresetDhene(30)">30 ditët e fundit</button>'+
          '<button class="btn" onclick="anaPresetDhene(90)">90 ditët e fundit</button>'+
          '<div style="position:relative;">'+
            '<button type="button" id="anaKalBtn_dhene" class="btn" style="min-width:170px;"></button>'+
            '<div id="anaKalPanel_dhene" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
          '</div>'+
          '<input type="date" id="anaNgaDhene" style="display:none;">'+
          '<input type="date" id="anaDeriDhene" style="display:none;">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card">'+
      '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Sipas kategorisë së biznesit</h3>'+
      '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë secilës kategori.</p>'+
      '<div id="anaKatDheneMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>'+
      '<div id="anaKatDheneLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;margin-bottom:10px;"></div>'+
      '<canvas id="anaKatDheneCanvas" height="110"></canvas>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNgaDhene').value=anaFmt(nga); $('anaDeriDhene').value=anaFmt(sot);
  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'dhene', btnId:'anaKalBtn_dhene', panelId:'anaKalPanel_dhene',
    getNga:()=>$('anaNgaDhene').value, getDeri:()=>$('anaDeriDhene').value,
    setNga:v=>{ $('anaNgaDhene').value=v; }, setDeri:v=>{ $('anaDeriDhene').value=v; },
    onRuaj: ngarkoAnaKatDhene
  });
  anaRenderKatDheneMetrika();
  ngarkoAnaPikatProfili();
  ngarkoAnaKatDhene();
}

// "Marrje" — S'KA ENDE PËRMBAJTJE TË PËRCAKTUAR (thjesht etiketë, si Deficiti
// para se te percaktohej). Placeholder derisa te thuhet çfarë duhet të tregojë.
function mainAnaMarrje(m){
  m.innerHTML='<h2 class="h">Marrje</h2>'+
    '<div class="card"><p class="small mut">🚧 Kjo faqe s\'ka ende përmbajtje të përcaktuar.</p></div>';
}

function anaNgarkoTeGjitha(){ ngarkoAnalitika(); }
function anaNgarkoKategoriteTeGjitha(){ ngarkoAnaKategorite(); ngarkoAnaLista(); }
function anaNgarkoDheneTeGjitha(){ ngarkoAnaSnipDhene(); ngarkoAnaKatDhene(); }

var _anaDeficitMetrikaAktive={shfaqje:true,shikime:true,klikime:true,konvertime:true};
var _anaDeficitChart=null;

function anaPresetDeficit(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNgaDeficit').value=anaFmt(nga); $('anaDeriDeficit').value=anaFmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret.deficit) window.__anaKalendaret.deficit.refreshLabel();
  anaNgarkoDeficitinTeGjithe();
}
function anaNgarkoDeficitinTeGjithe(){
  ngarkoAnaDeficit();
  ngarkoAnaDhenNga();
  ngarkoAnaMarrja();
}

function anaRenderDeficitMetrika(){
  const el=$('anaDeficitMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaDeficitMetrikaAktive[x.k];
    btn.style.cssText = on
      ? 'padding:7px 14px;border-radius:20px;border:1px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:7px 14px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:13px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaDeficitMetrikaAktive[x.k]=!_anaDeficitMetrikaAktive[x.k];
      anaRenderDeficitMetrika();
      ngarkoAnaDeficit();
    });
    el.appendChild(btn);
  });
}

async function ngarkoAnaDeficit(){
  const ngaEl=$('anaNgaDeficit'), deriEl=$('anaDeriDeficit');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  const url='/api/analytics/deficiti?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  const rows=d.rows||[];
  const labels=rows.map(r=>r.data);
  const canvas=$('anaDeficitCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaDeficitChart){ _anaDeficitChart.destroy(); _anaDeficitChart=null; }

  const datasets=[];
  ANA_METRIKA.forEach(x=>{
    if(_anaDeficitMetrikaAktive[x.k]) datasets.push({label:x.l, data:rows.map(r=>r[x.k]), borderColor:x.c, backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:x.c});
  });

  // Rang SIMETRIK rreth zeros — llogarit vleren maksimale absolute (pozitive ose
  // negative) mes te dhenave aktualisht te shfaqura, dhe vendos min/max te barabarta
  // (-maks/+maks), qe zero te bjere GJITHMONE saktesisht ne MES te grafikut, sado
  // qe te dhenat te priren nga njera ane. Nese s'ka fare te dhena (te gjitha 0),
  // perdor nje rang minimal fiks qe grafiku te mos rrudhet ne nje vije te sheshte.
  let maksAbs=0;
  datasets.forEach(ds=>{ ds.data.forEach(v=>{ const a=Math.abs(v||0); if(a>maksAbs) maksAbs=a; }); });
  const jastek = maksAbs>0 ? maksAbs*1.15 : 5; // 15% hapesire shtese siper/poshte majes, per lexueshmeri

  const ctx=canvas.getContext('2d');
  _anaDeficitChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{
        x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}},
        // Rang simetrik (-jastek..+jastek) — zero gjithmone saktesisht ne mes, jo vetem "lejohet negative"
        y:{min:-jastek, max:jastek, ticks:{color:'#8b949e',precision:0}, grid:{color:function(ctx){ return ctx.tick.value===0 ? 'rgba(230,237,243,.35)' : '#2a313c'; }}}
      },
      plugins:{legend:{labels:{color:'#e6edf3', generateLabels:function(chart){
        const items=Chart.defaults.plugins.legend.labels.generateLabels(chart);
        items.forEach(it=>{ it.lineDash=[]; it.lineWidth=2; });
        return items;
      }}, onClick:function(){}}}},
    plugins:[anaMultiColorLinePluginDivergjent]
  });
}

// ═══ Grafiket "Vetem Dhene" / "Vetem Marre" — te dyja perdorin te njejtin endpoint
// (/api/analytics/deficiti) qe tashme kthen edhe vlerat e papërpunuara per secilen
// metrike (jo vetem diferencen). Keto jane GJITHMONE >=0, prandaj perdorin plugin-in
// normal (jo variantin divergjent) dhe beginAtZero standarde. ═══
var _anaDhenNgaMetrikaAktive={shfaqje:true,shikime:true,klikime:true,konvertime:true};
var _anaMarrjaMetrikaAktive={shfaqje:true,shikime:true,klikime:true,konvertime:true};
var _anaDhenNgaChart=null, _anaMarrjaChart=null;
var _anaDeficitDhenieRows=[]; // cache-i i fundit i /api/analytics/deficiti — ripërdorur nga te dyja grafiket, pa thirrje shtese

function anaRenderDhenNgaMetrika(){
  const el=$('anaDhenNgaMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaDhenNgaMetrikaAktive[x.k];
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaDhenNgaMetrikaAktive[x.k]=!_anaDhenNgaMetrikaAktive[x.k];
      anaRenderDhenNgaMetrika();
      anaVizatoDhenNga();
    });
    el.appendChild(btn);
  });
}
function anaRenderMarrjaMetrika(){
  const el=$('anaMarrjaMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaMarrjaMetrikaAktive[x.k];
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaMarrjaMetrikaAktive[x.k]=!_anaMarrjaMetrikaAktive[x.k];
      anaRenderMarrjaMetrika();
      anaVizatoMarrja();
    });
    el.appendChild(btn);
  });
}

// Marrin te dhenat NJE HERE (nga i njejti endpoint qe perdor edhe Deficiti) dhe i
// ndajne mes te dy grafikeve — shmang 2 thirrje shtese API per te njejtat dite.
async function ngarkoAnaDhenNga(){
  await anaSigurohuDeficitDhenie();
  anaVizatoDhenNga();
}
async function ngarkoAnaMarrja(){
  await anaSigurohuDeficitDhenie();
  anaVizatoMarrja();
}
async function anaSigurohuDeficitDhenie(){
  const ngaEl=$('anaNgaDeficit'), deriEl=$('anaDeriDeficit');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  const url='/api/analytics/deficiti?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  try{ const d=await(await fetch(url)).json(); _anaDeficitDhenieRows=d.rows||[]; }catch(e){ _anaDeficitDhenieRows=[]; }
}
function anaVizatoDhenNga(){
  const canvas=$('anaDhenNgaCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaDhenNgaChart){ _anaDhenNgaChart.destroy(); _anaDhenNgaChart=null; }
  const labels=_anaDeficitDhenieRows.map(r=>r.data);
  const datasets=[];
  ANA_METRIKA.forEach(x=>{
    if(_anaDhenNgaMetrikaAktive[x.k]) datasets.push({label:x.l, data:_anaDeficitDhenieRows.map(r=>r[x.k+'_dhene']), borderColor:x.c, backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:x.c});
  });
  const ctx=canvas.getContext('2d');
  _anaDhenNgaChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{labels:{color:'#e6edf3', generateLabels:function(chart){
        const items=Chart.defaults.plugins.legend.labels.generateLabels(chart);
        items.forEach(it=>{ it.lineDash=[]; it.lineWidth=2; });
        return items;
      }}, onClick:function(){}}}},
    plugins:[anaMultiColorLinePlugin]
  });
}
function anaVizatoMarrja(){
  const canvas=$('anaMarrjaCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaMarrjaChart){ _anaMarrjaChart.destroy(); _anaMarrjaChart=null; }
  const labels=_anaDeficitDhenieRows.map(r=>r.data);
  const datasets=[];
  ANA_METRIKA.forEach(x=>{
    if(_anaMarrjaMetrikaAktive[x.k]) datasets.push({label:x.l, data:_anaDeficitDhenieRows.map(r=>r[x.k+'_marre']), borderColor:x.c, backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:x.c});
  });
  const ctx=canvas.getContext('2d');
  _anaMarrjaChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{labels:{color:'#e6edf3', generateLabels:function(chart){
        const items=Chart.defaults.plugins.legend.labels.generateLabels(chart);
        items.forEach(it=>{ it.lineDash=[]; it.lineWidth=2; });
        return items;
      }}, onClick:function(){}}}},
    plugins:[anaMultiColorLinePlugin]
  });
}

function anaPresetDhene(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNgaDhene').value=anaFmt(nga); $('anaDeriDhene').value=anaFmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret.dhene) window.__anaKalendaret.dhene.refreshLabel();
  anaNgarkoDheneTeGjitha();
}
function anaPresetKat(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNgaKat').value=anaFmt(nga); $('anaDeriKat').value=anaFmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret.kat) window.__anaKalendaret.kat.refreshLabel();
  anaNgarkoKategoriteTeGjitha();
}
document.addEventListener('click', function(){
  const dd=$('anaRekDropdown');
  if(dd && _anaDropdownOpen){ dd.classList.add('hide'); _anaDropdownOpen=false; }
  const dd2=$('anaKatRekDropdown');
  if(dd2 && _anaKatDropdownOpen){ dd2.classList.add('hide'); _anaKatDropdownOpen=false; }
  const dd3=$('anaListRekDropdown');
  if(dd3 && _anaListDropdownOpen){ dd3.classList.add('hide'); _anaListDropdownOpen=false; }
  const dd4=$('anaDetRekDropdown');
  if(dd4 && _anaDetRekDropdownOpen){ dd4.classList.add('hide'); _anaDetRekDropdownOpen=false; }
});
var _anaSelectedAd=null, _anaRekAll=[], _anaDropdownOpen=false;
var ANA_METRIKA=[
  {k:'shfaqje',    l:'Shfaqje',    c:'#f0883e'},
  {k:'shikime',    l:'Shikime',    c:'#4a9eff'},
  {k:'klikime',    l:'Klikime',    c:'#3fb950'},
  {k:'konvertime', l:'Konvertime', c:'#f85149'}
];
var _anaMetrikaAktive={shfaqje:true,shikime:true,klikime:true,konvertime:true};
function anaStilBtnMetrike(btn,x){
  const on=_anaMetrikaAktive[x.k];
  btn.style.cssText = on
    ? 'padding:7px 14px;border-radius:20px;border:1px solid var(--acc);background:rgba(74,158,255,.15);color:var(--acc);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;'
    : 'padding:7px 14px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:13px;cursor:pointer;font-family:inherit;';
}
function anaRenderMetrika(){
  const el=$('anaMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    anaStilBtnMetrike(btn,x);
    btn.addEventListener('click', function(){
      _anaMetrikaAktive[x.k]=!_anaMetrikaAktive[x.k];
      anaStilBtnMetrike(btn,x);
      ngarkoAnalitika();
    });
    el.appendChild(btn);
  });
}
function anaRekThumbHTML(r){
  const wrap='width:26px;height:26px;border-radius:6px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0e1116;border:1px solid var(--line);';
  if(r.imazh_url) return '<div style="'+wrap+'"><img src="'+esc(r.imazh_url)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
  if(r.video_url) return '<div style="'+wrap+'font-size:12px;color:var(--mut);">▶</div>';
  if(r.html5_url) return '<div style="'+wrap+'font-size:10px;color:var(--mut);">&lt;/&gt;</div>';
  return '<div style="'+wrap+'"></div>';
}
async function ngarkoAnaReklamatLista(){
  try{ _anaRekAll=await(await fetch('/api/reklamat')).json(); }catch(e){ _anaRekAll=[]; }
  anaRenderRekDropdown();
}
function anaRekRresht(innerHTML, checked, bold, onClickFn){
  const lab=document.createElement('label');
  lab.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 8px;cursor:pointer;border-radius:6px;'+(bold?'font-weight:600;':'');
  const chk=document.createElement('input');
  chk.type='radio'; chk.name='anaRekRadio'; chk.checked=checked;
  chk.style.cssText='pointer-events:none;width:16px;height:16px;min-width:16px;padding:0;margin:0;flex:0 0 auto;background:none;border-radius:50%;accent-color:var(--acc);';
  lab.appendChild(chk);
  if(innerHTML){ const t=document.createElement('span'); t.innerHTML=innerHTML; t.style.cssText='display:flex;align-items:center;gap:8px;flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'; lab.appendChild(t); }
  lab.addEventListener('click', function(e){ e.stopPropagation(); onClickFn(); });
  return lab;
}
function anaRenderRekDropdown(){
  const dd=$('anaRekDropdown'); if(!dd) return;
  dd.innerHTML='';
  dd.appendChild(anaRekRresht('Të gjitha', !_anaSelectedAd, true, anaZgjidhTeGjitha));
  if(!_anaRekAll.length){ const p=document.createElement('p'); p.className='small mut'; p.style.padding='6px'; p.textContent="S'ke ende reklama."; dd.appendChild(p); anaUpdateRekBtnLabel(); return; }
  const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:4px 2px;'; dd.appendChild(hr);
  _anaRekAll.forEach(r=>{
    const thumb=anaRekThumbHTML(r);
    const html=thumb+'<span style="overflow:hidden;text-overflow:ellipsis;">'+esc(r.emri||('#'+r.id))+'</span>';
    dd.appendChild(anaRekRresht(html, _anaSelectedAd===r.id, false, function(){ anaZgjidhReklam(r.id); }));
  });
  anaUpdateRekBtnLabel();
}
function anaZgjidhTeGjitha(){ _anaSelectedAd=null; anaRenderRekDropdown(); ngarkoAnalitika(); anaMbyllDropdown('anaRekDropdown','_anaDropdownOpen'); }
function anaZgjidhReklam(id){ _anaSelectedAd=id; anaRenderRekDropdown(); ngarkoAnalitika(); anaMbyllDropdown('anaRekDropdown','_anaDropdownOpen'); }
function anaUpdateRekBtnLabel(){
  const el=$('anaRekBtnCount'); if(!el) return;
  el.textContent = _anaSelectedAd ? '(1)' : '';
}
function anaFmt(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+dd; }
function anaMbyllDropdown(ddId, stateVarSetter){
  const dd=$(ddId); if(dd) dd.classList.add('hide');
  if(stateVarSetter==='_anaDropdownOpen') _anaDropdownOpen=false;
  else if(stateVarSetter==='_anaKatDropdownOpen') _anaKatDropdownOpen=false;
  else if(stateVarSetter==='_anaListDropdownOpen') _anaListDropdownOpen=false;
}
function anaPreset(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret.top) window.__anaKalendaret.top.refreshLabel();
  anaNgarkoTeGjitha();
}
var _anaChart=null;
async function ngarkoAnalitika(){
  const ngaEl=$('anaNga'), deriEl=$('anaDeri');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let url='/api/analytics/reklamat?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  if(_anaSelectedAd) url+='&reklama_ids='+_anaSelectedAd;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  const rows=d.rows||[];
  const labels=rows.map(r=>r.data);
  const datasets=[];
  ANA_METRIKA.forEach(x=>{
    if(_anaMetrikaAktive[x.k]) datasets.push({label:x.l, data:rows.map(r=>r[x.k]), borderColor:x.c, backgroundColor:'transparent', tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:x.c});
  });
  const canvas=$('anaCanvas'); if(!canvas||typeof Chart==='undefined') return;
  const ctx=canvas.getContext('2d');
  if(_anaChart) _anaChart.destroy();
  _anaChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{labels:{color:'#e6edf3', generateLabels:function(chart){
        const items=Chart.defaults.plugins.legend.labels.generateLabels(chart);
        items.forEach(it=>{ it.lineDash=[]; it.lineWidth=2; });
        return items;
      }}, onClick:function(){}}}},
    plugins:[anaMultiColorLinePlugin]
  });
}
// Kur disa linja ndjekin te njejten rruge (vlera te barabarta), ndan trashesine e linjes
// ne shirita paralele te lakuar (Catmull-Rom), nje per secilen ngjyre, ne vend qe njera te fshehe tjetren.
var anaMultiColorLinePlugin={
  id:'anaMultiColorLine',
  afterDatasetsDraw:function(chart){
    const ctx=chart.ctx;
    const active=[];
    for(let i=0;i<chart.data.datasets.length;i++){
      const meta=chart.getDatasetMeta(i);
      if(!meta.hidden) active.push({meta, color:chart.data.datasets[i].borderColor, data:chart.data.datasets[i].data});
    }
    if(!active.length) return;
    const n=active[0].data.length, totalWidth=2, STEPS=12;
    const zeroY=chart.scales.y.getPixelForValue(0);
    function catmull(p0,p1,p2,p3,t){
      const t2=t*t, t3=t2*t;
      const pt={
        x:0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      };
      if(pt.y>zeroY) pt.y=zeroY;
      return pt;
    }
    for(let p=0;p<n-1;p++){
      const groups={};
      active.forEach(a=>{
        const key=a.data[p]+'_'+a.data[p+1];
        (groups[key]=groups[key]||[]).push(a);
      });
      Object.values(groups).forEach(function(group){
        const g=group.length;
        const pref=group[0].meta.data;
        const P1=pref[p], P2=pref[p+1];
        if(!P1||!P2) return;
        const P0=pref[p-1]||P1, P3=pref[p+2]||P2;
        const pts=[];
        for(let s=0;s<=STEPS;s++){ pts.push(catmull(P0,P1,P2,P3,s/STEPS)); }
        const bandW=totalWidth/g;
        group.forEach(function(a,gi){
          const off=(gi-(g-1)/2)*bandW;
          ctx.save();
          ctx.strokeStyle=a.color; ctx.lineWidth=bandW; ctx.lineCap='round'; ctx.lineJoin='round';
          ctx.beginPath();
          for(let s=0;s<pts.length;s++){
            const cur=pts[s], nxt=pts[s+1]||pts[s], prv=pts[s-1]||pts[s];
            const dx=nxt.x-prv.x, dy=nxt.y-prv.y, len=Math.sqrt(dx*dx+dy*dy)||1;
            const nx=-dy/len, ny=dx/len;
            const px=cur.x+nx*off, py=cur.y+ny*off;
            if(s===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
          }
          ctx.stroke();
          ctx.restore();
        });
      });
    }
  }
};

// Version DIVERGJENT — SAKTESISHT si me lart, POR PA kufizimin "mos shko nen zero"
// (i cili ishte i menduar per metrika qe kurre s'jane negative — shfaqje/klikime etj.
// Per grafikun e Deficitit (marre-dhene), vlerat DUHET te shkojne nen zero realisht,
// prandaj perdor kete version, jo anaMultiColorLinePlugin te zakonshem.
var anaMultiColorLinePluginDivergjent={
  id:'anaMultiColorLineDiv',
  afterDatasetsDraw:function(chart){
    const ctx=chart.ctx;
    const active=[];
    for(let i=0;i<chart.data.datasets.length;i++){
      const meta=chart.getDatasetMeta(i);
      if(!meta.hidden) active.push({meta, color:chart.data.datasets[i].borderColor, data:chart.data.datasets[i].data});
    }
    if(!active.length) return;
    const n=active[0].data.length, totalWidth=2, STEPS=12;
    function catmull(p0,p1,p2,p3,t){
      const t2=t*t, t3=t2*t;
      return {
        x:0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      };
    }
    for(let p=0;p<n-1;p++){
      const groups={};
      active.forEach(a=>{
        const key=a.data[p]+'_'+a.data[p+1];
        (groups[key]=groups[key]||[]).push(a);
      });
      Object.values(groups).forEach(function(group){
        const g=group.length;
        const pref=group[0].meta.data;
        const P1=pref[p], P2=pref[p+1];
        if(!P1||!P2) return;
        const P0=pref[p-1]||P1, P3=pref[p+2]||P2;
        const pts=[];
        for(let s=0;s<=STEPS;s++){ pts.push(catmull(P0,P1,P2,P3,s/STEPS)); }
        const bandW=totalWidth/g;
        group.forEach(function(a,gi){
          const off=(gi-(g-1)/2)*bandW;
          ctx.save();
          ctx.strokeStyle=a.color; ctx.lineWidth=bandW; ctx.lineCap='round'; ctx.lineJoin='round';
          ctx.beginPath();
          for(let s=0;s<pts.length;s++){
            const cur=pts[s], nxt=pts[s+1]||pts[s], prv=pts[s-1]||pts[s];
            const dx=nxt.x-prv.x, dy=nxt.y-prv.y, len=Math.sqrt(dx*dx+dy*dy)||1;
            const nx=-dy/len, ny=dx/len;
            const px=cur.x+nx*off, py=cur.y+ny*off;
            if(s===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
          }
          ctx.stroke();
          ctx.restore();
        });
      });
    }
  }
};

// ================= GRAFIKU I DYTE: sipas kategorise se biznesit qe e shfaqi reklamen =================
var _anaKatSelectedAd=null, _anaKatRekAll=[], _anaKatDropdownOpen=false;
var _anaKatMetrikaAktive='shikime';
var _anaKatChart=null;

function anaKatPaleta(i){
  const hue=(i*137.508)%360;   // kend i artë — ngjyra te dallueshme per cdo numer kategorish
  return 'hsl('+hue.toFixed(0)+',65%,55%)';
}
function anaRenderKategoriMetrika(){
  const el=$('anaKatMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaKatMetrikaAktive===x.k;
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:var(--acc);color:#06121f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaKatMetrikaAktive=x.k;
      anaRenderKategoriMetrika();
      ngarkoAnaKategorite();
    });
    el.appendChild(btn);
  });
}
async function ngarkoAnaKatReklamatLista(){
  try{ _anaKatRekAll = await(await fetch('/api/reklamat')).json(); }catch(e){ _anaKatRekAll=[]; }
  anaRenderKatRekDropdown();
}
function anaRenderKatRekDropdown(){
  const dd=$('anaKatRekDropdown'); if(!dd) return;
  dd.innerHTML='';
  dd.appendChild(anaRekRresht('Të gjitha', !_anaKatSelectedAd, true, anaKatZgjidhTeGjitha));
  if(!_anaKatRekAll.length){ const p=document.createElement('p'); p.className='small mut'; p.style.padding='6px'; p.textContent="S'ke ende reklama."; dd.appendChild(p); anaKatUpdateBtnLabel(); return; }
  const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:4px 2px;'; dd.appendChild(hr);
  _anaKatRekAll.forEach(r=>{
    const thumb=anaRekThumbHTML(r);
    const html=thumb+'<span style="overflow:hidden;text-overflow:ellipsis;">'+esc(r.emri||('#'+r.id))+'</span>';
    dd.appendChild(anaRekRresht(html, _anaKatSelectedAd===r.id, false, function(){ anaKatZgjidhReklam(r.id); }));
  });
  anaKatUpdateBtnLabel();
}
function anaKatZgjidhTeGjitha(){ _anaKatSelectedAd=null; anaRenderKatRekDropdown(); ngarkoAnaKategorite(); anaMbyllDropdown('anaKatRekDropdown','_anaKatDropdownOpen'); }
function anaKatZgjidhReklam(id){ _anaKatSelectedAd=id; anaRenderKatRekDropdown(); ngarkoAnaKategorite(); anaMbyllDropdown('anaKatRekDropdown','_anaKatDropdownOpen'); }
function anaKatUpdateBtnLabel(){
  const el=$('anaKatRekBtnCount'); if(!el) return;
  el.textContent = _anaKatSelectedAd ? '(1)' : '';
}
function anaRenderKatLegend(kategorite){
  const el=$('anaKatLegend'); if(!el) return;
  if(!kategorite.length){ el.innerHTML='<p class="small mut" style="margin:0;">Asnjë kategori me të dhëna.</p>'; return; }
  el.innerHTML = kategorite.map((k,i)=>
    '<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--txt);">'+
      '<span style="width:10px;height:10px;border-radius:50%;background:'+anaKatPaleta(i)+';flex:0 0 auto;"></span>'+
      '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(k.emri)+'</span>'+
    '</div>'
  ).join('');
}
async function ngarkoAnaKategorite(){
  const ngaEl=$('anaNgaKat'), deriEl=$('anaDeriKat');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let url='/api/analytics/kategorite?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  if(_anaKatSelectedAd) url+='&reklama_ids='+_anaKatSelectedAd;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ return; }
  // Vetem kategorite me te pakten 1 tek METRIKA aktualisht e zgjedhur, ne kete periudhe
  const kategorite=(d.kategorite||[]).filter(k=>k.pikat.some(p=>p[_anaKatMetrikaAktive]>0));
  anaRenderKatLegend(kategorite);
  const canvas=$('anaKatCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaKatChart){ _anaKatChart.destroy(); _anaKatChart=null; }
  if(!kategorite.length){
    const ctx0=canvas.getContext('2d'); ctx0.clearRect(0,0,canvas.width,canvas.height);
    return;
  }
  const labels=kategorite[0].pikat.map(p=>p.data);
  const datasets=kategorite.map((k,i)=>({
    label:k.emri, data:k.pikat.map(p=>p[_anaKatMetrikaAktive]),
    borderColor:anaKatPaleta(i), backgroundColor:'transparent',
    tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:anaKatPaleta(i)
  }));
  const ctx=canvas.getContext('2d');
  _anaKatChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}},
    plugins:[anaMultiColorLinePlugin]
  });
}

// ================= DIVI I DYTE: LISTE me kategorite + 4 metrikat totale (jo grafik) =================
var _anaListSelectedAd=null, _anaListRekAll=[], _anaListDropdownOpen=false;

async function ngarkoAnaListRekamatLista(){
  try{ _anaListRekAll = await(await fetch('/api/reklamat')).json(); }catch(e){ _anaListRekAll=[]; }
  anaRenderListRekDropdown();
}
function anaRenderListRekDropdown(){
  const dd=$('anaListRekDropdown'); if(!dd) return;
  dd.innerHTML='';
  dd.appendChild(anaRekRresht('Të gjitha', !_anaListSelectedAd, true, anaListZgjidhTeGjitha));
  if(!_anaListRekAll.length){ const p=document.createElement('p'); p.className='small mut'; p.style.padding='6px'; p.textContent="S'ke ende reklama."; dd.appendChild(p); anaListUpdateBtnLabel(); return; }
  const hr=document.createElement('div'); hr.style.cssText='height:1px;background:var(--line);margin:4px 2px;'; dd.appendChild(hr);
  _anaListRekAll.forEach(r=>{
    const thumb=anaRekThumbHTML(r);
    const html=thumb+'<span style="overflow:hidden;text-overflow:ellipsis;">'+esc(r.emri||('#'+r.id))+'</span>';
    dd.appendChild(anaRekRresht(html, _anaListSelectedAd===r.id, false, function(){ anaListZgjidhReklam(r.id); }));
  });
  anaListUpdateBtnLabel();
}
function anaListZgjidhTeGjitha(){ _anaListSelectedAd=null; anaRenderListRekDropdown(); ngarkoAnaLista(); anaMbyllDropdown('anaListRekDropdown','_anaListDropdownOpen'); }
function anaListZgjidhReklam(id){ _anaListSelectedAd=id; anaRenderListRekDropdown(); ngarkoAnaLista(); anaMbyllDropdown('anaListRekDropdown','_anaListDropdownOpen'); }
function anaListUpdateBtnLabel(){
  const el=$('anaListRekBtnCount'); if(!el) return;
  el.textContent = _anaListSelectedAd ? '(1)' : '';
}
async function ngarkoAnaLista(){
  const ngaEl=$('anaNgaKat'), deriEl=$('anaDeriKat'), el=$('anaListaKategori');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value||!el) return;
  let url='/api/analytics/kategorite?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand');
  if(_anaListSelectedAd) url+='&reklama_ids='+_anaListSelectedAd;
  let d;
  try{ d=await(await fetch(url)).json(); }catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; return; }
  const kategorite=d.kategorite||[];
  if(!kategorite.length){ el.innerHTML='<p class="small mut">Asnjë kategori me të dhëna në këtë periudhë.</p>'; return; }
  el.innerHTML = kategorite.map(k=>{
    const tot={shfaqje:0,shikime:0,klikime:0,konvertime:0};
    k.pikat.forEach(p=>{ tot.shfaqje+=p.shfaqje; tot.shikime+=p.shikime; tot.klikime+=p.klikime; tot.konvertime+=p.konvertime; });
    return '<div style="padding:10px 0;border-bottom:1px solid #20262f;">'+
      '<div style="font-weight:600;font-size:13px;margin-bottom:6px;">'+esc(k.emri)+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--mut);">'+
        '<span>Shfaqje: <b style="color:var(--txt);">'+tot.shfaqje+'</b></span>'+
        '<span>Shikime: <b style="color:var(--txt);">'+tot.shikime+'</b></span>'+
        '<span>Klikime: <b style="color:var(--txt);">'+tot.klikime+'</b></span>'+
        '<span>Konvertime: <b style="color:var(--txt);">'+tot.konvertime+'</b></span>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ================= KALENDAR RANGU (si Google Analytics): 1 kalendar, klik-fillim, klik-mbarim, Ruaj =================
window.__anaKalendaret = window.__anaKalendaret || {};
function anaKrijoKalendarRangu(cfg){
  let vm=new Date(); vm.setDate(1);
  let selStart=null, selEnd=null;

  function fmt(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+dd; }
  function parse(s){ const p=s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function fmtShkurt(d){ return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
  function emriMuajit(d){
    const emrat=['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
    return emrat[d.getMonth()]+' '+d.getFullYear();
  }
  function refreshLabel(){
    const btn=$(cfg.btnId); if(!btn) return;
    const ng=parse(cfg.getNga()), dr=parse(cfg.getDeri());
    btn.textContent = fmtShkurt(ng)+' – '+fmtShkurt(dr)+' 📅';
  }
  function hapPanelin(){
    selStart=parse(cfg.getNga()); selEnd=parse(cfg.getDeri());
    vm=new Date(selStart.getFullYear(), selStart.getMonth(), 1);
    renderPanel();
    $(cfg.panelId).classList.remove('hide');
  }
  function mbyllPanelin(){ const p=$(cfg.panelId); if(p) p.classList.add('hide'); }
  function ndryshoMuaj(delta){ vm=new Date(vm.getFullYear(), vm.getMonth()+delta, 1); renderPanel(); }
  function brendaRangut(d){ return selStart && selEnd && d>=selStart && d<=selEnd; }
  function klikDita(dnr){
    const d=new Date(vm.getFullYear(), vm.getMonth(), dnr);
    if(!selStart || (selStart && selEnd)){ selStart=d; selEnd=null; }
    else if(d<selStart){ selEnd=selStart; selStart=d; }
    else { selEnd=d; }
    renderPanel();
  }
  function ruaj(){
    if(!selStart) return;
    const fund=selEnd||selStart;
    cfg.setNga(fmt(selStart)); cfg.setDeri(fmt(fund));
    refreshLabel(); mbyllPanelin(); cfg.onRuaj();
  }
  function renderPanel(){
    const panel=$(cfg.panelId); if(!panel) return;
    const y=vm.getFullYear(), m=vm.getMonth();
    const pareDite=new Date(y,m,1).getDay();
    const zhvend=(pareDite+6)%7;
    const diteNeMuaj=new Date(y,m+1,0).getDate();
    let h='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<button type="button" class="btn" style="padding:4px 10px;" onclick="event.stopPropagation();__anaKalNav(\''+cfg.id+'\',-1)">‹</button>'+
      '<div style="font-weight:600;font-size:13px;">'+emriMuajit(vm)+'</div>'+
      '<button type="button" class="btn" style="padding:4px 10px;" onclick="event.stopPropagation();__anaKalNav(\''+cfg.id+'\',1)">›</button>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:11px;color:var(--mut);text-align:center;margin-bottom:4px;">'+
      ['Hë','Ma','Më','En','Pr','Sh','Di'].map(x=>'<div>'+x+'</div>').join('')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">';
    for(let i=0;i<zhvend;i++) h+='<div></div>';
    for(let dnr=1; dnr<=diteNeMuaj; dnr++){
      const d=new Date(y,m,dnr);
      const eshteFillim = selStart && d.getTime()===selStart.getTime();
      const eshteMbarim = selEnd && d.getTime()===selEnd.getTime();
      const embrenda = brendaRangut(d);
      let st='padding:6px 0;text-align:center;font-size:12px;cursor:pointer;border-radius:6px;';
      if(eshteFillim||eshteMbarim) st+='background:var(--acc);color:#06121f;font-weight:700;';
      else if(embrenda) st+='background:rgba(74,158,255,.18);color:var(--txt);';
      else st+='color:var(--txt);';
      h+='<div style="'+st+'" onclick="event.stopPropagation();__anaKalKlik(\''+cfg.id+'\','+dnr+')">'+dnr+'</div>';
    }
    h+='</div>'+
    '<div style="display:flex;gap:8px;margin-top:12px;">'+
      '<button type="button" class="btn" style="flex:1;" onclick="event.stopPropagation();__anaKalMbyll(\''+cfg.id+'\')">Anulo</button>'+
      '<button type="button" class="btn" style="flex:1;background:var(--acc);color:#06121f;border-color:var(--acc);font-weight:600;" onclick="event.stopPropagation();__anaKalRuaj(\''+cfg.id+'\')">Ruaj</button>'+
    '</div>';
    panel.innerHTML=h;
  }

  window.__anaKalendaret[cfg.id] = { nav:ndryshoMuaj, klik:klikDita, ruaj:ruaj, mbyll:mbyllPanelin, refreshLabel:refreshLabel };

  $(cfg.btnId).addEventListener('click', function(e){
    e.stopPropagation();
    const panel=$(cfg.panelId);
    if(panel.classList.contains('hide')) hapPanelin(); else mbyllPanelin();
  });
  refreshLabel();
}
function __anaKalNav(id,delta){ window.__anaKalendaret[id].nav(delta); }
function __anaKalKlik(id,dnr){ window.__anaKalendaret[id].klik(dnr); }
function __anaKalRuaj(id){ window.__anaKalendaret[id].ruaj(); }
function __anaKalMbyll(id){ window.__anaKalendaret[id].mbyll(); }
document.addEventListener('click', function(){
  if(!window.__anaKalendaret) return;
  Object.keys(window.__anaKalendaret).forEach(function(id){
    const p=$('anaKalPanel_'+id);
    if(p && !p.classList.contains('hide')) p.classList.add('hide');
  });
});

// ================= RRESHTI I RI: pikët e profilit + "çfarë u ke dhënë" (snippet-et + kategoritë) =================
async function ngarkoAnaPikatProfili(){
  const el=$('anaPikatProfili'); if(!el) return;
  try{
    const d=await(await fetch('/api/profili')).json();
    el.textContent = (d.pike_profili!=null ? d.pike_profili : 0);
  }catch(e){ el.textContent='–'; }
}
async function ngarkoAnaSnipDhene(){
  const el=$('anaSnipDheneLista'), ngaEl=$('anaNgaDhene'), deriEl=$('anaDeriDhene');
  if(!el||!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let d;
  try{ d=await(await fetch('/api/analytics/snippetet-dhene?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand'))).json(); }
  catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; return; }
  const rows=d.snippetet||[];
  if(!rows.length){ el.innerHTML='<button class="btn cta" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'lidhjaSnippet\'})">Lidh një snippet →</button>'; return; }
  el.innerHTML = rows.map(s=>{
    let statusTxt, statusCol;
    if(s.pauzuar){ statusTxt='Pezulluar'; statusCol='var(--mut)'; }
    else if(s.snippet_active){ statusTxt='Aktive'; statusCol='var(--good)'; }
    else { statusTxt='Palidhur'; statusCol='var(--mut)'; }
    return '<div style="padding:10px 0;border-bottom:1px solid #20262f;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'+
        '<span style="font-weight:600;font-size:13px;">'+esc(s.emri||('Hapësira '+s.id))+'</span>'+
        '<span style="font-size:11px;color:'+statusCol+';">'+statusTxt+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--mut);">'+
        '<span>Shfaqje: <b style="color:var(--txt);">'+s.shfaqje+'</b></span>'+
        '<span>Shikime: <b style="color:var(--txt);">'+s.shikime+'</b></span>'+
        '<span>Klikime: <b style="color:var(--txt);">'+s.klikime+'</b></span>'+
        '<span>Konvertime: <b style="color:var(--txt);">'+s.konvertime+'</b></span>'+
      '</div>'+
    '</div>';
  }).join('');
}
var _anaKatDheneMetrikaAktive='shikime', _anaKatDheneChart=null;
function anaRenderKatDheneMetrika(){
  const el=$('anaKatDheneMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_anaKatDheneMetrikaAktive===x.k;
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:var(--acc);color:#06121f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _anaKatDheneMetrikaAktive=x.k;
      anaRenderKatDheneMetrika();
      ngarkoAnaKatDhene();
    });
    el.appendChild(btn);
  });
}
function anaRenderKatDheneLegend(kategorite){
  const el=$('anaKatDheneLegend'); if(!el) return;
  if(!kategorite.length){ el.innerHTML='<p class="small mut" style="margin:0;">Asnjë kategori me të dhëna.</p>'; return; }
  el.innerHTML = kategorite.map((k,i)=>
    '<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--txt);">'+
      '<span style="width:10px;height:10px;border-radius:50%;background:'+anaKatPaleta(i)+';flex:0 0 auto;"></span>'+
      '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(k.emri)+'</span>'+
    '</div>'
  ).join('');
}
async function ngarkoAnaKatDhene(){
  const ngaEl=$('anaNgaDhene'), deriEl=$('anaDeriDhene');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let d;
  try{ d=await(await fetch('/api/analytics/kategorite-dhene?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand'))).json(); }catch(e){ return; }
  const kategorite=(d.kategorite||[]).filter(k=>k.pikat.some(p=>p[_anaKatDheneMetrikaAktive]>0));
  anaRenderKatDheneLegend(kategorite);
  const canvas=$('anaKatDheneCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_anaKatDheneChart){ _anaKatDheneChart.destroy(); _anaKatDheneChart=null; }
  if(!kategorite.length){
    const ctx0=canvas.getContext('2d'); ctx0.clearRect(0,0,canvas.width,canvas.height);
    return;
  }
  const labels=kategorite[0].pikat.map(p=>p.data);
  const datasets=kategorite.map((k,i)=>({
    label:k.emri, data:k.pikat.map(p=>p[_anaKatDheneMetrikaAktive]),
    borderColor:anaKatPaleta(i), backgroundColor:'transparent',
    tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:anaKatPaleta(i)
  }));
  const ctx=canvas.getContext('2d');
  _anaKatDheneChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}},
    plugins:[anaMultiColorLinePlugin]
  });
}

// ================= FAQE E VEÇANTË: "Performanca" per "My Ads" =================
// Nxjerr SAKTESISHT dy grafiket e para te mainAnalytics() (Trafiku + Sipas kategorise),
// vendosur ne 2 rreshka, PA listen anesore te kategorive dhe PA seksionin "Dhënie".
function mainRekPerformanca(m){
  window.__pamjeVecante=true;
  _anaSelectedAd=null; _anaDropdownOpen=false;
  _anaKatSelectedAd=null; _anaKatDropdownOpen=false; _anaKatMetrikaAktive='shikime';
  m.innerHTML='<h2 class="h">Performanca — Reklamat e mia</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Ecuria e reklamave të tua me ditë.</p>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPreset(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_top" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_top" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNga" style="display:none;">'+
        '<input type="date" id="anaDeri" style="display:none;">'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;margin-top:10px;">'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaRekBtn" class="btn" style="min-width:150px;">Reklamat <span id="anaRekBtnCount"></span> ▾</button>'+
          '<div id="anaRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:240px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
      '</div>'+
      '<div id="anaMetrikaRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;"></div>'+
    '</div>'+
    '<div class="card"><canvas id="anaCanvas" height="90"></canvas></div>'+
    '<div class="card" style="margin-top:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPresetKat(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPresetKat(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_kat" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_kat" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="anaNgaKat" style="display:none;">'+
        '<input type="date" id="anaDeriKat" style="display:none;">'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px;">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">'+
        '<h3 class="h" style="font-size:15px;margin:0;">Sipas kategorisë së biznesit</h3>'+
        '<div style="flex:0 0 200px;">'+
          '<div class="small mut" style="font-weight:600;margin-bottom:6px;">Kategoritë e bizneseve që kanë marrë pjesë.</div>'+
          '<div id="anaKatLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;"></div>'+
        '</div>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKatRekBtn" class="btn" style="min-width:140px;">Reklamat <span id="anaKatRekBtnCount"></span> ▾</button>'+
          '<div id="anaKatRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:230px;max-height:260px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
      '</div>'+
      '<div id="anaKatMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'+
      '<canvas id="anaKatCanvas" height="110"></canvas>'+
    '</div>';

  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  $('anaNgaKat').value=anaFmt(nga); $('anaDeriKat').value=anaFmt(sot);

  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'top', btnId:'anaKalBtn_top', panelId:'anaKalPanel_top',
    getNga:()=>$('anaNga').value, getDeri:()=>$('anaDeri').value,
    setNga:v=>{ $('anaNga').value=v; }, setDeri:v=>{ $('anaDeri').value=v; },
    onRuaj: ngarkoAnalitika
  });
  anaKrijoKalendarRangu({
    id:'kat', btnId:'anaKalBtn_kat', panelId:'anaKalPanel_kat',
    getNga:()=>$('anaNgaKat').value, getDeri:()=>$('anaDeriKat').value,
    setNga:v=>{ $('anaNgaKat').value=v; }, setDeri:v=>{ $('anaDeriKat').value=v; },
    onRuaj: anaNgarkoKategoriteTeGjitha
  });
  $('anaRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaRekDropdown'); if(!dd) return;
    _anaDropdownOpen=!_anaDropdownOpen;
    dd.classList.toggle('hide', !_anaDropdownOpen);
  });
  $('anaKatRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaKatRekDropdown'); if(!dd) return;
    _anaKatDropdownOpen=!_anaKatDropdownOpen;
    dd.classList.toggle('hide', !_anaKatDropdownOpen);
  });
  anaRenderMetrika();
  ngarkoAnaReklamatLista();
  anaRenderKategoriMetrika();
  ngarkoAnaKatReklamatLista();
  ngarkoAnalitika();
  ngarkoAnaKategorite();
}

// ================= FAQE E VEÇANTË: "Statistikat" per "Hapësira e reklamave" =================
// Ripërdor TE NJEJTIN endpoint (kategorite-dhene) dhe TE NJEJTIN pattern grafiku si paneli
// "Dhënie" brenda Analytics — thjesht si faqe e vetme, e pavarur (sipas kategorise se
// bizneseve qe kane marre pjese, JO emer biznesi/reklame specifike).
var _snStatMetrikaAktive='shfaqje', _snStatChart=null;

function mainSnippetStatistikat(m){
  window.__pamjeVecante=true;
  m.innerHTML='<h2 class="h">Statistikat — Hapësira e reklamave</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Shfaqje, shikime, klikime dhe konvertime që u ke dhënë bizneseve të tjera nëpërmjet hapësirave tua, sipas kategorisë së tyre.</p>'+
    '<div class="card">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'+
        '<button class="btn" onclick="snStatPreset(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="snStatPreset(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="snStatPreset(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaKalBtn_snstat" class="btn" style="min-width:170px;"></button>'+
          '<div id="anaKalPanel_snstat" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;width:230px;z-index:30;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
        '<input type="date" id="snStatNga" style="display:none;">'+
        '<input type="date" id="snStatDeri" style="display:none;">'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">'+
        '<div id="snStatMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;"></div>'+
        '<div style="flex:0 0 200px;">'+
          '<div class="small mut" style="font-weight:600;margin-bottom:6px;">Kategoritë që kanë marrë pjesë.</div>'+
          '<div id="snStatLegend" style="display:flex;flex-direction:column;gap:6px;max-height:120px;overflow-y:auto;padding-right:4px;"></div>'+
        '</div>'+
      '</div>'+
      '<canvas id="snStatCanvas" height="110"></canvas>'+
    '</div>';

  anaRenderSnStatMetrika();

  const sot=new Date(), fill=new Date(); fill.setDate(fill.getDate()-29);
  const fmt=d=>{ const y=d.getFullYear(), mo=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+mo+'-'+dd; };
  $('snStatNga').value=fmt(fill); $('snStatDeri').value=fmt(sot);

  window.__anaKalendaret = window.__anaKalendaret || {};
  anaKrijoKalendarRangu({
    id:'snstat', btnId:'anaKalBtn_snstat', panelId:'anaKalPanel_snstat',
    getNga:()=>$('snStatNga').value, getDeri:()=>$('snStatDeri').value,
    setNga:v=>{ $('snStatNga').value=v; }, setDeri:v=>{ $('snStatDeri').value=v; },
    onRuaj: ngarkoSnStatistikat
  });
  ngarkoSnStatistikat();
}

function snStatPreset(dite){
  const sot=new Date(), fill=new Date(); fill.setDate(fill.getDate()-(dite-1));
  const fmt=d=>{ const y=d.getFullYear(), mo=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+mo+'-'+dd; };
  $('snStatNga').value=fmt(fill); $('snStatDeri').value=fmt(sot);
  if(window.__anaKalendaret && window.__anaKalendaret['snstat']) window.__anaKalendaret['snstat'].refreshLabel();
  ngarkoSnStatistikat();
}

function anaRenderSnStatMetrika(){
  const el=$('snStatMetrikaRow'); if(!el) return;
  el.innerHTML='';
  ANA_METRIKA.forEach(x=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.textContent=x.l;
    const on=_snStatMetrikaAktive===x.k;
    btn.style.cssText = on
      ? 'padding:6px 12px;border-radius:20px;border:1px solid var(--acc);background:var(--acc);color:#06121f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;'
      : 'padding:6px 12px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:12px;cursor:pointer;font-family:inherit;';
    btn.addEventListener('click', function(){
      _snStatMetrikaAktive=x.k;
      anaRenderSnStatMetrika();
      ngarkoSnStatistikat();
    });
    el.appendChild(btn);
  });
}

async function ngarkoSnStatistikat(){
  const ngaEl=$('snStatNga'), deriEl=$('snStatDeri');
  if(!ngaEl||!deriEl||!ngaEl.value||!deriEl.value) return;
  let d;
  try{ d=await(await fetch('/api/analytics/kategorite-dhene?nga='+ngaEl.value+'&deri='+deriEl.value+'&logjika='+(window.__llogariaModaliteti||'ankand'))).json(); }catch(e){ return; }
  const kategorite=(d.kategorite||[]).filter(k=>k.pikat.some(p=>p[_snStatMetrikaAktive]>0));
  const legEl=$('snStatLegend');
  if(legEl){
    legEl.innerHTML = !kategorite.length
      ? '<p class="small mut" style="margin:0;">Asnjë kategori me të dhëna.</p>'
      : kategorite.map((k,i)=>
          '<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--txt);">'+
            '<span style="width:10px;height:10px;border-radius:50%;background:'+anaKatPaleta(i)+';flex:0 0 auto;"></span>'+
            '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(k.emri)+'</span>'+
          '</div>'
        ).join('');
  }
  const canvas=$('snStatCanvas'); if(!canvas||typeof Chart==='undefined') return;
  if(_snStatChart){ _snStatChart.destroy(); _snStatChart=null; }
  if(!kategorite.length){
    const ctx0=canvas.getContext('2d'); ctx0.clearRect(0,0,canvas.width,canvas.height);
    return;
  }
  const labels=kategorite[0].pikat.map(p=>p.data);
  const datasets=kategorite.map((k,i)=>({
    label:k.emri, data:k.pikat.map(p=>p[_snStatMetrikaAktive]),
    borderColor:anaKatPaleta(i), backgroundColor:'transparent',
    tension:0, borderWidth:0, pointRadius:2, pointBackgroundColor:anaKatPaleta(i)
  }));
  const ctx=canvas.getContext('2d');
  _snStatChart=new Chart(ctx,{type:'line',data:{labels,datasets},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e',precision:0},grid:{color:'#2a313c'}}},
      plugins:{legend:{display:false}}},
    plugins:[anaMultiColorLinePlugin]
  });
}

// ================= FAQE E PLOTE (pa sidebar), me rifreskim "live" te grafiku kryesor =================
var _anaLiveTimer=null;
function renderAnalyticsFull(){
  const el=$('v-analitika-full'); if(!el) return;
  el.innerHTML='<div style="padding:24px;">'+
    '<div id="analitikaFullContent"></div>'+
  '</div>';
  mainAnalytics($('analitikaFullContent'));
  if(_anaLiveTimer) clearInterval(_anaLiveTimer);
  _anaLiveTimer=setInterval(function(){
    if(!history.state || history.state.v!=='analitika-full'){ clearInterval(_anaLiveTimer); _anaLiveTimer=null; return; }
    ngarkoAnalitika();
  }, 8000);
}
