// suport.js — Widget-i i asistentit te suportit: ikone roboti poshte-majtas,
// fikse, qe hap chat-in. Shfaqet para dhe pas login. X mbyll, ⌄ ul poshte pa humbur biseden.
(function(){
  var hist = [];          // historiku i bisedes (ruhet edhe kur ulet)
  var hapur = false;

  function el(id){ return document.getElementById(id); }

  function ndertoWidget(){
    if(el('suportWrap')) return;
    var wrap = document.createElement('div');
    wrap.id = 'suportWrap';
    wrap.innerHTML =
      // Butoni-robot (poshte majtas)
      '<button id="suportBtn" aria-label="Ndihmë" title="Ndihmë">'+
        '<svg width="30" height="30" viewBox="0 0 48 48" fill="none">'+
          '<rect x="10" y="16" width="28" height="20" rx="6" fill="#fff"/>'+
          '<circle cx="19" cy="26" r="3" fill="#3552d6"/>'+
          '<circle cx="29" cy="26" r="3" fill="#3552d6"/>'+
          '<rect x="21" y="8" width="6" height="6" rx="3" fill="#fff"/>'+
          '<line x1="24" y1="14" x2="24" y2="16" stroke="#fff" stroke-width="2"/>'+
          '<line x1="10" y1="24" x2="6" y2="24" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'+
          '<line x1="38" y1="24" x2="42" y2="24" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'+
          '<rect x="20" y="31" width="8" height="2" rx="1" fill="#3552d6"/>'+
        '</svg>'+
      '</button>'+
      // Paneli i chat-it
      '<div id="suportPanel" class="hide">'+
        '<div id="suportHead">'+
          '<div style="display:flex;align-items:center;gap:8px;">'+
            '<span style="font-size:18px;">🤖</span>'+
            '<div><div style="font-weight:600;font-size:14px;">Asistenti i PhronexusAI</div>'+
            '<div style="font-size:11px;opacity:.8;">Këtu për të ndihmuar</div></div>'+
          '</div>'+
          '<div style="display:flex;gap:4px;">'+
            '<button id="suportUl" title="Ul poshtë" aria-label="Ul poshtë">⌄</button>'+
            '<button id="suportX" title="Mbyll" aria-label="Mbyll">✕</button>'+
          '</div>'+
        '</div>'+
        '<div id="suportChat"></div>'+
        '<div id="suportInputRow">'+
          '<input id="suportInput" placeholder="Shkruaj pyetjen tënde..." autocomplete="off">'+
          '<button id="suportSend">➤</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(wrap);

    el('suportBtn').onclick = hap;
    el('suportX').onclick = mbyll;
    el('suportUl').onclick = ul;
    el('suportSend').onclick = dergo;
    el('suportInput').onkeydown = function(e){ if(e.key==='Enter') dergo(); };
  }

  function pershendetja(){
    if(hist.length) return;  // vetem heren e pare
    var chat = el('suportChat'); if(!chat) return;
    var msg = "Përshëndetje! Jam asistenti i PhronexusAI. Si mund të të ndihmoj? Mund të më pyesësh si funksionon platforma, për çmimet, ose si të fillosh.";
    chat.innerHTML = '<div class="suportMsg bot">'+esc(msg)+'</div>';
  }

  function hap(){
    ndertoWidget();
    el('suportPanel').classList.remove('hide');
    el('suportBtn').classList.add('hide');
    hapur = true;
    pershendetja();
    setTimeout(function(){ var i=el('suportInput'); if(i) i.focus(); }, 100);
  }
  function mbyll(){
    // Mbyll dhe HARRO biseden
    hist = [];
    var chat = el('suportChat'); if(chat) chat.innerHTML='';
    el('suportPanel').classList.add('hide');
    el('suportBtn').classList.remove('hide');
    hapur = false;
  }
  function ul(){
    // Ul poshte POR ruaj biseden
    el('suportPanel').classList.add('hide');
    el('suportBtn').classList.remove('hide');
    hapur = false;
  }

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function dergo(){
    var inp = el('suportInput'), chat = el('suportChat');
    if(!inp || !chat) return;
    var teksti = (inp.value||'').trim(); if(!teksti) return;
    chat.innerHTML += '<div class="suportMsg user">'+esc(teksti)+'</div>';
    hist.push({role:'user', content:teksti});
    inp.value='';
    var pritId = 'suportPrit'+Date.now();
    chat.innerHTML += '<div class="suportMsg bot" id="'+pritId+'"><span class="suportDots">•••</span></div>';
    chat.scrollTop = chat.scrollHeight;
    try{
      var r = await (await fetch('/api/suport',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mesazhet:hist})})).json();
      var p = el(pritId); if(p) p.remove();
      if(r.pergjigje){
        hist.push({role:'assistant', content:r.pergjigje});
        chat.innerHTML += '<div class="suportMsg bot">'+esc(r.pergjigje)+'</div>';
      } else {
        chat.innerHTML += '<div class="suportMsg bot err">'+esc(r.error||'Gabim.')+'</div>';
      }
    }catch(e){
      var p2 = el(pritId); if(p2) p2.remove();
      chat.innerHTML += '<div class="suportMsg bot err">Gabim në lidhje.</div>';
    }
    chat.scrollTop = chat.scrollHeight;
  }

  // Ndertoje sapo ngarkohet faqja
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ndertoWidget);
  else ndertoWidget();
})();
