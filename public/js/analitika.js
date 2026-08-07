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
        '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë bizneseve të tjera nëpërmjet snippet-eve tuaja. <span style="color:var(--acc);text-decoration:underline;cursor:pointer;" onclick="nav({v:\'profile\',nav:\'snippetet\'})">Shto snippet</span> për t\'u shfaqur edhe ti më shumë tek të tjerët.</p>'+
        '<div id="anaSnipDheneLista" style="max-height:300px;overflow-y:auto;padding-right:4px;"><p class="small">Po ngarkoj…</p></div>'+
      '</div>'+
      '<div class="card" style="flex:2;min-width:340px;">'+
        '<h3 class="h" style="font-size:15px;margin:0 0 4px;">Sipas kategorisë së biznesit</h3>'+
        '<p class="small mut" style="margin:0 0 12px;">Çfarë u ke dhënë secilës kategori.</p>'+
        '<div id="anaKatDheneMetrikaRow" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>'+
        '<div id="anaKatDheneLegend" style="display:flex;flex-direction:column;gap:6px;max-height:80px;overflow-y:auto;padding-right:4px;margin-bottom:10px;"></div>'+
        '<canvas id="anaKatDheneCanvas" height="110"></canvas>'+
      '</div>'+
    '</div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  $('anaNgaKat').value=anaFmt(nga); $('anaDeriKat').value=anaFmt(sot);
  $('anaNgaDhene').value=anaFmt(nga); $('anaDeriDhene').value=anaFmt(sot);
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
}
function anaNgarkoTeGjitha(){ ngarkoAnalitika(); }
function anaNgarkoKategoriteTeGjitha(){ ngarkoAnaKategorite(); ngarkoAnaLista(); }
function anaNgarkoDheneTeGjitha(){ ngarkoAnaSnipDhene(); ngarkoAnaKatDhene(); }
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
  let url='/api/analytics/reklamat?nga='+ngaEl.value+'&deri='+deriEl.value;
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
  let url='/api/analytics/kategorite?nga='+ngaEl.value+'&deri='+deriEl.value;
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
  let url='/api/analytics/kategorite?nga='+ngaEl.value+'&deri='+deriEl.value;
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
  try{ d=await(await fetch('/api/analytics/snippetet-dhene?nga='+ngaEl.value+'&deri='+deriEl.value)).json(); }
  catch(e){ el.innerHTML='<p class="small">Gabim.</p>'; return; }
  const rows=d.snippetet||[];
  if(!rows.length){ el.innerHTML='<button class="btn cta" onclick="event.stopPropagation();nav({v:\'profile\',nav:\'lidhjaSnippet\'})">Lidh një snippet →</button>'; return; }
  el.innerHTML = rows.map(s=>
    '<div style="padding:10px 0;border-bottom:1px solid #20262f;">'+
      '<div style="font-weight:600;font-size:13px;margin-bottom:6px;">'+esc(s.emri||('Hapësira '+s.id))+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--mut);">'+
        '<span>Shfaqje: <b style="color:var(--txt);">'+s.shfaqje+'</b></span>'+
        '<span>Shikime: <b style="color:var(--txt);">'+s.shikime+'</b></span>'+
        '<span>Klikime: <b style="color:var(--txt);">'+s.klikime+'</b></span>'+
        '<span>Konvertime: <b style="color:var(--txt);">'+s.konvertime+'</b></span>'+
      '</div>'+
    '</div>'
  ).join('');
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
  try{ d=await(await fetch('/api/analytics/kategorite-dhene?nga='+ngaEl.value+'&deri='+deriEl.value)).json(); }catch(e){ return; }
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
