// analitika.js — Seksioni Analytics (grafik, filtro, date-range). I ndarë nga app.js.
// Presupozon core.js ($, esc) dhe app.js (nav) të ngarkuara para tij.

function mainAnalytics(m){
  _anaSelectedAd=null; _anaDropdownOpen=false;
  m.innerHTML='<h2 class="h">Analytics</h2>'+
    '<p class="small" style="margin:2px 0 16px;">Ecuria e reklamave të tua me ditë.</p>'+
    '<div class="card" style="margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
        '<button class="btn" onclick="anaPreset(7)">7 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(30)">30 ditët e fundit</button>'+
        '<button class="btn" onclick="anaPreset(90)">90 ditët e fundit</button>'+
        '<span style="flex:1"></span>'+
        '<input type="date" id="anaNga" style="width:auto;" onchange="ngarkoAnalitika()">'+
        '<span class="small">deri</span>'+
        '<input type="date" id="anaDeri" style="width:auto;" onchange="ngarkoAnalitika()">'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;margin-top:10px;">'+
        '<div style="position:relative;">'+
          '<button type="button" id="anaRekBtn" class="btn" style="min-width:150px;">Reklamat <span id="anaRekBtnCount"></span> ▾</button>'+
          '<div id="anaRekDropdown" class="hide" style="position:absolute;top:110%;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px;min-width:240px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.4);"></div>'+
        '</div>'+
      '</div>'+
      '<div id="anaMetrikaRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;"></div>'+
    '</div>'+
    '<div class="card"><canvas id="anaCanvas" height="90"></canvas></div>';
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-29);
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  $('anaRekBtn').addEventListener('click', function(e){
    e.stopPropagation();
    const dd=$('anaRekDropdown'); if(!dd) return;
    _anaDropdownOpen=!_anaDropdownOpen;
    dd.classList.toggle('hide', !_anaDropdownOpen);
  });
  anaRenderMetrika();
  ngarkoAnaReklamatLista();
  ngarkoAnalitika();
}
document.addEventListener('click', function(){
  const dd=$('anaRekDropdown');
  if(dd && _anaDropdownOpen){ dd.classList.add('hide'); _anaDropdownOpen=false; }
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
function anaZgjidhTeGjitha(){ _anaSelectedAd=null; anaRenderRekDropdown(); ngarkoAnalitika(); }
function anaZgjidhReklam(id){ _anaSelectedAd=id; anaRenderRekDropdown(); ngarkoAnalitika(); }
function anaUpdateRekBtnLabel(){
  const el=$('anaRekBtnCount'); if(!el) return;
  el.textContent = _anaSelectedAd ? '(1)' : '';
}
function anaFmt(d){ return d.toISOString().slice(0,10); }
function anaPreset(dite){
  const sot=new Date(), nga=new Date(); nga.setDate(sot.getDate()-(dite-1));
  $('anaNga').value=anaFmt(nga); $('anaDeri').value=anaFmt(sot);
  ngarkoAnalitika();
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
      scales:{x:{ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}, y:{beginAtZero:true,ticks:{color:'#8b949e'},grid:{color:'#2a313c'}}},
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
      if(pt.y>zeroY) pt.y=zeroY;   // mos kalo kurre poshte 0 (kanavaca rritet poshte)
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
