// kerkimi.js — Kerkim global: hapesira e tekstit eshte NE VETE HEADER-IN (ndertuar nga
// core.js/setHeaderLoggedIn, gjithmone e dukshme). Ky skedar vetem mbush #kerkRez si dropdown
// direkt poshte hapesires, ASNJE panel/modal i ri. NAV2 + Creative + Snippetet + Konvertimet/Zonat.
(function(){
  var cache = null; // { kreative, snippetet, konvertimet, zonat }

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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
    r.onclick = function(){
      var inp=el('kerkInput'); if(inp) inp.value='';
      var box=el('kerkRez'); if(box){ box.classList.add('hide'); box.innerHTML=''; }
      onClick();
    };
    return r;
  }

  // "Fillon me" — jo "përmban diku". q është tashmë lowercase+trim.
  function fillonMe(teksti, q){
    return (teksti||'').toLowerCase().indexOf(q) === 0;
  }

  async function kerkoRun(q){
    q = (q||'').toLowerCase().trim();
    var box = el('kerkRez'); if(!box) return;
    if(!q){ box.classList.add('hide'); box.innerHTML=''; return; }

    await ngarkoCache();

    // Grupe te ndara, bashkuar ne fund NE KETE RADHE FIKSE:
    // kategori -> nenkategori -> reklama (Creative) -> snippet -> gjithcka tjeter
    var gKategori=[], gNenkategori=[], gCreative=[], gSnippet=[], gTjeter=[];

    (typeof NAV2!=='undefined' ? NAV2 : []).forEach(function(n){
      // Vetë kategoria (niveli i pare) — kerkueshme me vete
      if(fillonMe(n.l, q)){
        gKategori.push(rreshti('<span style="color:var(--mut);">▸</span>', n.l, 'Kategori', function(){
          if(n.k==='analytics') nav({v:'analitika-full'});
          else nav({v:'profile', nav:n.k});
        }));
      }
      // Nenkategorite
      (n.subs||[]).forEach(function(s){
        if(fillonMe(s.l, q)){
          gNenkategori.push(rreshti('<span style="color:var(--mut);">▸</span>', s.l, n.l, function(){
            if(n.k==='analytics') nav({v:'analitika-full'});
            else nav({v:'profile', nav:s.nav||n.k, tab:s.tab});
          }));
        }
      });
    });

    // Reklama (Creative — imazh/video/html5)
    (cache.kreative||[]).forEach(function(k){
      if(fillonMe(k.emri, q)){
        gCreative.push(rreshti(krIkonaKerkimi(k), k.emri||'(pa emër)', 'Creative · '+(k.lloji||''), function(){
          nav({v:'profile', nav:'kreative', tab:'lista'});
        }));
      }
    });

    // Snippetet
    (cache.snippetet||[]).forEach(function(sn){
      var emri = sn.emri||('Hapësira '+sn.id);
      if(fillonMe(emri, q)){
        gSnippet.push(rreshti('📍', emri, 'Hapësira e reklamave', function(){
          nav({v:'profile', nav:'snippetet', sub:'detail', id:sn.id});
        }));
      }
    });

    // Gjithçka tjetër — Konvertimet (URL) + Zonat (kod)
    (cache.konvertimet||[]).forEach(function(kv){
      if(fillonMe(kv.url, q)){
        gTjeter.push(rreshti('🔗', kv.url, 'Konvertim · URL', function(){
          nav({v:'profile', nav:'konvertimet'});
        }));
      }
    });
    (cache.zonat||[]).forEach(function(z){
      if(fillonMe(z.emri, q)){
        gTjeter.push(rreshti('🎯', z.emri, 'Konvertim · Zonë me kod', function(){
          nav({v:'profile', nav:'konvertimet'});
        }));
      }
    });

    var rezultate = gKategori.concat(gNenkategori, gCreative, gSnippet, gTjeter);

    box.innerHTML='';
    if(!rezultate.length){
      box.innerHTML='<p class="small mut" style="padding:12px 14px;">Asnjë rezultat.</p>';
    } else {
      rezultate.slice(0,20).forEach(function(r){ box.appendChild(r); });
    }
    box.classList.remove('hide');
  }

  // Ctrl/Cmd+K — fokuson hapesiren ekzistuese, s'hap asgje te re
  document.addEventListener('keydown', function(e){
    if((e.metaKey||e.ctrlKey) && (e.key==='k'||e.key==='K')){
      e.preventDefault();
      var i=el('kerkInput'); if(i) i.focus();
    }
    if(e.key==='Escape'){
      var box=el('kerkRez'); if(box) box.classList.add('hide');
    }
  });
  // Mbyll dropdown-in kur klikon jashte tij/hapesires
  document.addEventListener('click', function(e){
    var box=el('kerkRez'), inp=el('kerkInput');
    if(!box || !inp) return;
    if(e.target!==inp && !box.contains(e.target)) box.classList.add('hide');
  });

  window.kerkoRun = kerkoRun;
})();
