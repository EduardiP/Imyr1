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
      '<button id="suportBtn" aria-label="Help" title="Help">'+
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
            '<div><div style="font-weight:600;font-size:14px;">PhronexusAI Assistant</div>'+
            '<div style="font-size:11px;opacity:.8;">Here to help</div></div>'+
          '</div>'+
          '<div style="display:flex;gap:4px;">'+
            '<button id="suportUl" title="Minimize" aria-label="Minimize">⌄</button>'+
            '<button id="suportX" title="Close" aria-label="Close">✕</button>'+
          '</div>'+
        '</div>'+
        '<div id="suportChat"></div>'+
        '<div id="suportInputRow">'+
          '<input id="suportInput" placeholder="Type your question..." autocomplete="off">'+
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
    var msg = "Hi! I'm the PhronexusAI assistant. How can I help? Ask me how the platform works, about pricing, or how to get started.";
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
    // Krijo bulen e pergjigjes (bosh, mbushet fjale-per-fjale)
    var botId = 'suportBot'+Date.now();
    chat.innerHTML += '<div class="suportMsg bot" id="'+botId+'"><span class="suportDots">•••</span></div>';
    chat.scrollTop = chat.scrollHeight;
    var bula = el(botId);
    try{
      var resp = await fetch('/api/suport',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mesazhet:hist})});
      if(!resp.ok || !resp.body){
        var er = await resp.json().catch(function(){return {};});
        if(bula) bula.innerHTML = '<span class="err">'+esc(er.error||'Error.')+'</span>';
        return;
      }
      // Lexo stream-in cope-cope
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var plot = '';
      if(bula) bula.textContent = '';  // hiq pikat
      while(true){
        var r = await reader.read();
        if(r.done) break;
        plot += decoder.decode(r.value, {stream:true});
        if(bula){ bula.textContent = plot; chat.scrollTop = chat.scrollHeight; }
      }
     // Zbulo shenjen [[KONTAKTO_EKIPIN]]: dergo shqetesimin te ekipi + fshihe nga teksti
      if (plot.indexOf('[[KONTAKTO_EKIPIN]]') !== -1) {
        var plotPastruar = plot.replace(/\s*\[\[KONTAKTO_EKIPIN\]\]\s*$/, '').trim();
        if (bula) bula.textContent = plotPastruar;
        // Merr shqetesimin: mesazhi i fundit i klientit para kesaj pergjigjeje
        var shqetesimi = '';
        for (var i = hist.length - 1; i >= 0; i--) {
          if (hist[i].role === 'user') { shqetesimi = hist[i].content; break; }
        }
        // Dergo kerkesen te backend
        try {
          var rr = await fetch('/api/suport/kontakto-ekipin', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({shqetesimi: shqetesimi})
          });
          var jj = await rr.json();
          if (jj.ok) {
            chat.innerHTML += '<div class="suportMsg bot" style="background:#0e2a1a;border-left:3px solid #10b981;">✓ Your request has been sent to the team. We will contact you as soon as possible.</div>';
          } else {
            chat.innerHTML += '<div class="suportMsg bot"><span class="err">Failed to send: ' + esc(jj.error || 'error') + '</span></div>';
          }
        } catch (e) {
          chat.innerHTML += '<div class="suportMsg bot"><span class="err">Error sending.</span></div>';
        }
        chat.scrollTop = chat.scrollHeight;
        hist.push({role: 'assistant', content: plotPastruar});
      } else {
        hist.push({role: 'assistant', content: plot});
      }
    }catch(e){
      if(bula) bula.innerHTML = '<span class="err">Connection error.</span>';
    }
    chat.scrollTop = chat.scrollHeight;
  }

  // Ndertoje sapo ngarkohet faqja
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ndertoWidget);
  else ndertoWidget();
})();
