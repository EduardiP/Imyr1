// ndryshime.js — Widget-i "Çfarë të re": ikonë fikse poshtë-djathtas, SIPËR widget-it
// të suportit (i njëjti dizajn/madhësi si suport.js, vetëm ikona dhe përmbajtja ndryshojnë).
// X mbyll. Pika e kuqe shfaqet vetëm nëse ka ndryshime më të reja se ato të fundit të parat.
(function(){
  var lista = [];

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function ndertoWidget(){
    if(el('ndrWrap')) return;
    var wrap = document.createElement('div');
    wrap.id = 'ndrWrap';
    wrap.innerHTML =
      '<button id="ndrBtn" aria-label="Çfarë të re" title="Çfarë të re">'+
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
          '<path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"/>'+
          '<path d="M19 15l.9 2.6L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.4L19 15z"/>'+
        '</svg>'+
        '<span id="ndrBadge" class="hide"></span>'+
      '</button>'+
      '<div id="ndrPanel" class="hide">'+
        '<div id="ndrHead"><span>Çfarë të re</span>'+
          '<button id="ndrX" title="Mbyll" aria-label="Mbyll">✕</button>'+
        '</div>'+
        '<div id="ndrLista"></div>'+
      '</div>';
    document.body.appendChild(wrap);
    el('ndrBtn').onclick = hap;
    el('ndrX').onclick = mbyll;
  }

  function hap(){
    ndertoWidget();
    el('ndrPanel').classList.remove('hide');
    el('ndrBtn').classList.add('hide');
    ngarko();
  }
  function mbyll(){
    el('ndrPanel').classList.add('hide');
    el('ndrBtn').classList.remove('hide');
  }

  async function ngarko(){
    var box = el('ndrLista'); if(!box) return;
    box.innerHTML = '<p class="small mut" style="padding:14px;">Po ngarkoj…</p>';
    try{
      var r = await (await fetch('/api/ndryshimet')).json();
      lista = r.ndryshimet || [];
      if(!lista.length){ box.innerHTML='<p class="small mut" style="padding:14px;">S\'ka ende përditësime.</p>'; return; }
      box.innerHTML = lista.map(function(x){
        return '<div class="ndrItem"><div class="ndrT">'+esc(x.titull)+'</div>'+
          '<div class="ndrX">'+esc(x.teksti)+'</div>'+
          '<div class="ndrD">'+esc(x.data)+'</div></div>';
      }).join('');
      if(lista[0] && lista[0].data){ try{ localStorage.setItem('ndrPare', lista[0].data); }catch(e){} }
      var badge = el('ndrBadge'); if(badge) badge.classList.add('hide');
    }catch(e){ box.innerHTML = '<p class="small mut" style="padding:14px;">Gabim në ngarkim.</p>'; }
  }

  // Kontrollon nese ka ndryshime me te reja se ato te fundit te para (per pikën e kuqe),
  // pa hapur panelin — nje thirrje e lehte kur ngarkon faqja.
  async function kontrolloBadge(){
    try{
      var r = await (await fetch('/api/ndryshimet')).json();
      var l = r.ndryshimet || [];
      if(!l.length) return;
      var pareData = null; try{ pareData = localStorage.getItem('ndrPare'); }catch(e){}
      var badge = el('ndrBadge');
      if(badge && (!pareData || String(l[0].data) > pareData)){ badge.classList.remove('hide'); }
    }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ ndertoWidget(); kontrolloBadge(); });
  else { ndertoWidget(); kontrolloBadge(); }
})();
