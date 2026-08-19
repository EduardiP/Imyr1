// kreative-chat-ui.js — Chat AI sqarues (UI), per Creative (Imazh/Video/HTML5).
// Skedar i VEÇANTË, i ndare qellimisht nga app.js, per te mos e mbingarkuar.
// Eksporton VETEM disa funksione globale minimale qe app.js i therret:
//   krChatLinkHTML()  — HTML i butonit "Fillo bisedë me AI" (per formaKreative)
//   krChatReset()     — pastron gjendjen (per t'u thirrur kur hapet forma nga e para)

var _kcLloji = null;
var _kcHistoriku = [];      // [{role, content}] — dergohet i plote ne cdo thirrje
var _kcGati = false;
var _kcPershkrimAnglisht = null;

function krChatLinkHTML(){
  return '<button type="button" class="btn" onclick="krChatHap()" style="margin-top:6px;">💬 Fillo bisedë me AI</button>'+
    '<span id="krChatStatus" class="small mut" style="margin-left:8px;"></span>';
}

function krChatReset(){
  _kcHistoriku = []; _kcGati = false; _kcPershkrimAnglisht = null;
  var st = document.getElementById('krChatStatus');
  if(st) st.textContent = '';
  var ov = document.getElementById('krChatOverlay');
  if(ov) ov.remove();
}

// ═══ HAPJA E BISEDES ═══
function krChatHap(){
  _kcLloji = (window._formaKreativeLloji) || 'imazh'; // vendoset nga formaKreative() ne app.js
  _kcHistoriku = [];
  var overlay = document.createElement('div');
  overlay.id = 'krChatOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10003;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="width:min(480px,92vw);height:min(560px,85vh);background:#12151b;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--line);">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);">'+
        '<span style="font-weight:600;">💬 Bisedë me AI</span>'+
        '<button class="btn" onclick="krChatMbyll()">✕</button>'+
      '</div>'+
      '<div id="krChatMesazhet" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;"></div>'+
      '<div id="krChatFundi" style="padding:12px 14px;border-top:1px solid var(--line);display:flex;gap:8px;">'+
        '<input id="krChatInput" placeholder="Shkruaj përgjigjen…" style="flex:1;" onkeydown="if(event.key===\'Enter\')krChatDergo()">'+
        '<button class="btn primary" onclick="krChatDergo()">➤</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(overlay);
  krChatShtoBulle('ai', 'Duke shkruar…', true);
  krChatThirr('[FILLIMI]', /*fshehur=*/true);
}

function krChatMbyll(){
  var ov = document.getElementById('krChatOverlay');
  if(ov) ov.remove();
}

// ═══ MESAZHET (bullat e bisedes) ═══
function krChatShtoBulle(kush, teksti, ephemer){
  var wrap = document.getElementById('krChatMesazhet'); if(!wrap) return null;
  var b = document.createElement('div');
  b.style.cssText = 'max-width:85%;padding:9px 13px;border-radius:12px;font-size:14px;line-height:1.4;'+
    (kush==='ai'
      ? 'align-self:flex-start;background:#1c2230;color:var(--txt);'
      : 'align-self:flex-end;background:var(--acc);color:#fff;');
  b.textContent = teksti;
  if(ephemer) b.setAttribute('data-ephemer', '1');
  wrap.appendChild(b);
  wrap.scrollTop = wrap.scrollHeight;
  return b;
}
function krChatHiqEphemeret(){
  var wrap = document.getElementById('krChatMesazhet'); if(!wrap) return;
  wrap.querySelectorAll('[data-ephemer]').forEach(function(e){ e.remove(); });
}

// ═══ DERGIMI I NJE MESAZHI TE KLIENTIT ═══
function krChatDergo(){
  var inp = document.getElementById('krChatInput'); if(!inp) return;
  var teksti = inp.value.trim();
  if(!teksti || _kcGati) return;
  inp.value = '';
  krChatShtoBulle('klient', teksti);
  krChatThirr(teksti, false);
}

// ═══ THIRRJA E BACKEND-IT (dergon historikun e plote cdo here) ═══
async function krChatThirr(tekstiRiJetiRi, eshteFshehur){
  if(!eshteFshehur){
    _kcHistoriku.push({ role:'user', content: tekstiRiJetiRi });
  } else {
    _kcHistoriku.push({ role:'user', content: '[FILLIMI]' });
  }
  var input = document.getElementById('krChatInput');
  if(input) input.disabled = true;
  krChatHiqEphemeret();
  var duke = krChatShtoBulle('ai', 'Duke shkruar…', true);

  try{
    const r = await (await fetch('/api/kreative/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lloji: _kcLloji, mesazhet: _kcHistoriku })
    })).json();

    krChatHiqEphemeret();
    if(r.error){
      krChatShtoBulle('ai', 'Gabim: '+r.error);
      if(input) input.disabled = false;
      return;
    }
    if(r.gati){
      _kcGati = true;
      _kcPershkrimAnglisht = r.pershkrim_anglisht;
      krChatShtoBulle('ai', '✓ U qartësua! Po e mbyll bisedën — kliko "✨ Gjenero me AI" kur të jesh gati.');
      var per = document.getElementById('krPer');
      if(per) per.value = r.pershkrim_anglisht; // klienti mund ta shohi/ndryshoje edhe vete nese do
      var st = document.getElementById('krChatStatus');
      if(st) st.textContent = '✓ Përshkrimi u përgatit nga biseda.';
      setTimeout(krChatMbyll, 1600);
      return;
    }
    _kcHistoriku.push({ role:'assistant', content: r.pyetje });
    krChatShtoBulle('ai', r.pyetje);
    if(input){ input.disabled = false; input.focus(); }
  }catch(e){
    krChatHiqEphemeret();
    krChatShtoBulle('ai', 'Gabim: '+e.message);
    if(input) input.disabled = false;
  }
}
