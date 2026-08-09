// kerkimi.js — Kerkim global: NAV2 (kategori/nenkategori) + Creative + Snippetet + Konvertimet/Zonat.
// Hapet nga ikona e re ne header (krah zilja) ose Ctrl/Cmd+K. Rezultatet me ikone/miniature
// sipas llojit — Creative ripërdor krThumbHTML() qe tashme ekziston, jo ikona te reja.
(function(){
  var eHapur = false;
  var cache = null; // { kreative, snippetet, konvertimet, zonat }

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function ndertoWidget(){
    if(el('kerkWrap')) return;
    var wrap = document.createElement('div');
    wrap.id = 'kerkWrap';
    wrap.className = 'hide';
    wrap.innerHTML =
      '<div id="kerkPanel">'+
        '<div id="kerkInputRow">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;color:var(--mut);"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'+
          '<input id="kerkInput" placeholder="Kërko…" autocomplete="off">'+
          '<button id="kerkX" title="Mbyll" aria-label="Mbyll">✕</button>'+
        '</div>'+
        '<div id="kerkRez"></div>'+
      '</div>';
    document.body.appendChild(wrap);
    el('kerkX').onclick = mbyllKerkimi;
    el('kerkInput').oninput = function(){ kerkoRun(this.value); };
    wrap.addEventListener('mousedown', function(e){ if(e.target===wrap) mbyllKerkimi(); });
  }

  function hapKerkimi(){
    ndertoWidget();
    el('kerkWrap').classList.remove('hide');
    eHapur = true;
    el('kerkInput').value='';
    el('kerkRez').innerHTML='';
    ngarkoCache();
    setTimeout(function(){ var i=el('kerkInput'); if(i) i.focus(); }, 30);
  }
  function mbyllKerkimi(){
    var w=el('kerkWrap'); if(w) w.classList.add('hide');
    eHapur = false;
  }

  async function ngarkoCache(){
    if(cache) return;
    cache = { kreative:[], snippetet:[], konvertimet:[], zonat:[] };
    try{ cache.kreative = ((await (await fetch('/api/kreative')).json()).kreative)||[]; }catch(e){}
    try{ cache.snippetet = ((await (await fetch('/api/snippetet')).json()).snippetet)||[]; }catch(e){}
    try{ cache.konvertimet = ((await (await fetch('/api/konvertimet')).json()).konvertimet)||[]; }catch(e){}
    try{ cache.zonat = ((await (await fetch('/api/zonat')).json()).zonat)||[]; }catch(e){}
  }

  // I njëjti mekanizëm ikonash si krThumbHTML() (mainKreative_NEW) — jo i rishpikur.
  function krIkonaKerkimi(k){
    if(k.lloji==='imazh' && (k.output_url||k.skedari_url)) return '<img src="'+esc(k.output_url||k.skedari_url)+'" style="width:100%;height:100%;object-fit:cover;">';
    if(k.lloji==='video') return '<span style="font-size:13px;color:var(--mut);">▶</span>';
    if(k.lloji==='html5') return '<span style="font-size:11px;color:var(--mut);">&lt;/&gt;</span>';
    return '';
  }

  function rreshti(ikonaHTML, titulli, nenTitull, onClick){
    var r = document.createElement('div');
    r.className = 'kerkItem';
    r.innerHTML =
      '<span class="kerkIco">'+ikonaHTML+'</span>'+
      '<span class="kerkTxt"><span class="kerkT"></span>'+
      (nenTitull ? '<span class="kerkS"></span>' : '')+'</span>';
    r.querySelector('.kerkT').textContent = titulli || '';
    if(nenTitull) r.querySelector('.kerkS').textContent = nenTitull;
    r.onclick = onClick;
    return r;
  }

  function kerkoRun(q){
    q = (q||'').toLowerCase().trim();
    var box = el('kerkRez'); if(!box) return;
    box.innerHTML='';
    if(!q) return;
    var rezultate = [];

    // 1) NAV2 — kategori + nenkategori (struktura ekzistuese, jo hamendje)
    (typeof NAV2!=='undefined' ? NAV2 : []).forEach(function(n){
      var listaSub = (n.subs && n.subs.length) ? n.subs : [{l:n.l, nav:n.k}];
      listaSub.forEach(function(s){
        var etiketa = (n.l===s.l) ? s.l : (n.l+' '+s.l);
        if(etiketa.toLowerCase().indexOf(q)!==-1){
          rezultate.push(rreshti('<span style="color:var(--mut);">▸</span>', s.l, n.l, function(){
            mbyllKerkimi();
            if(n.k==='analytics') nav({v:'analitika-full'});
            else nav({v:'profile', nav:s.nav||n.k, tab:s.tab});
          }));
        }
      });
    });

    // 2) Creative
    (cache.kreative||[]).forEach(function(k){
      var teksti = (k.emri||'')+' '+(k.pershkrimi||'');
      if(teksti.toLowerCase().indexOf(q)!==-1){
        rezultate.push(rreshti(krIkonaKerkimi(k), k.emri||'(pa emër)', 'Creative · '+(k.lloji||''), function(){
          mbyllKerkimi(); nav({v:'profile', nav:'kreative', tab:'lista'});
        }));
      }
    });

    // 3) Snippetet (Hapësira e reklamave)
    (cache.snippetet||[]).forEach(function(sn){
      if((sn.emri||'').toLowerCase().indexOf(q)!==-1){
        rezultate.push(rreshti('📍', sn.emri||('Hapësira '+sn.id), 'Hapësira e reklamave', function(){
          mbyllKerkimi(); nav({v:'profile', nav:'snippetet', sub:'detail', id:sn.id});
        }));
      }
    });

    // 4) Konvertimet — URL
    (cache.konvertimet||[]).forEach(function(kv){
      if((kv.url||'').toLowerCase().indexOf(q)!==-1){
        rezultate.push(rreshti('🔗', kv.url, 'Konvertim · URL', function(){
          mbyllKerkimi(); nav({v:'profile', nav:'konvertimet'});
        }));
      }
    });

    // 5) Zonat — kod
    (cache.zonat||[]).forEach(function(z){
      if((z.emri||'').toLowerCase().indexOf(q)!==-1){
        rezultate.push(rreshti('🎯', z.emri, 'Konvertim · Zonë me kod', function(){
          mbyllKerkimi(); nav({v:'profile', nav:'konvertimet'});
        }));
      }
    });

    if(!rezultate.length){
      box.innerHTML='<p class="small mut" style="padding:12px 14px;">Asnjë rezultat.</p>';
      return;
    }
    rezultate.slice(0,20).forEach(function(r){ box.appendChild(r); });
  }

  document.addEventListener('keydown', function(e){
    if((e.metaKey||e.ctrlKey) && (e.key==='k'||e.key==='K')){
      e.preventDefault();
      if(eHapur) mbyllKerkimi(); else hapKerkimi();
    }
    if(e.key==='Escape' && eHapur) mbyllKerkimi();
  });

  window.hapKerkimi = hapKerkimi;
})();
