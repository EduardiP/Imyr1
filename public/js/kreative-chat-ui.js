// kreative-chat-ui.js — Chat AI sqarues (UI), per Creative (Imazh/Video/HTML5).
// Skedar i VEÇANTË, i ndare qellimisht nga app.js, per te mos e mbingarkuar.
// Eksporton VETEM disa funksione globale minimale qe app.js i therret:
//   krChatLinkHTML()  — HTML i butonit "Fillo bisedë me AI" (per formaKreative)
//   krChatReset()     — pastron gjendjen (per t'u thirrur kur hapet forma nga e para)
//
// SJELLJA: biseda zevendeson VEND-N-VEND fushen "Përshkrimi" (jo dritare/popup e
// vecante) — dhe VLEN VETEM per krijimin FILLESTAR te pershkrimit. Modifikimi i
// nje krijimi ekzistues (butoni "✏️ Modifiko" te "Krijimet e mia") mbetet PLOTESISHT
// manual, pa AI-chat, siç eshte tashme — kjo veçori s'e prek fare ate rrjedhe.

var _kcLloji = null;
var _kcHistoriku = [];      // [{role, content}] — dergohet i plote ne cdo thirrje
var _kcGati = false;
var _kcAktiv = false;

function krChatLinkHTML(){
  return '<button type="button" class="btn" onclick="krChatHap()" style="margin-top:6px;">💬 Fillo bisedë me AI</button>'+
    '<span id="krChatStatus" class="small mut" style="margin-left:8px;"></span>';
}

function krChatReset(){
  _kcHistoriku = []; _kcGati = false; _kcAktiv = false;
  var st = document.getElementById('krChatStatus');
  if(st) st.textContent = '';
  var inl = document.getElementById('krChatInline');
  if(inl) inl.remove();
  var per = document.getElementById('krPer');
  if(per) per.style.display = '';
}

// ═══ HAPJA E BISEDES — ZEVENDESON VEND-N-VEND FUSHEN "Përshkrimi" ═══
function krChatHap(){
  if(_kcAktiv) return;
  _kcAktiv = true;
  _kcLloji = (window._formaKreativeLloji) || 'imazh';
  _kcHistoriku = [];

  var per = document.getElementById('krPer'); if(!per) return;
  per.style.display = 'none';

  var inl = document.createElement('div');
  inl.id = 'krChatInline';
  inl.style.cssText = 'border:1px solid var(--line);border-radius:8px;background:#0e1116;'+
    'display:flex;flex-direction:column;height:220px;overflow:hidden;';
  inl.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line);flex:0 0 auto;">'+
      '<span class="small" style="font-weight:600;">💬 Bisedë me AI</span>'+
      '<button type="button" onclick="krChatMbyll()" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:15px;padding:2px 6px;">✕</button>'+
    '</div>'+
    '<div id="krChatMesazhet" style="flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;"></div>'+
    '<div style="flex:0 0 auto;padding:8px 10px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:stretch;">'+
      '<input id="krChatInput" placeholder="Shkruaj përgjigjen…" '+
        'style="flex:1 1 auto;min-width:0;background:#12151b;border:1px solid var(--line);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px;" '+
        'onkeydown="if(event.key===\'Enter\')krChatDergo()">'+
      '<button type="button" onclick="krChatDergo()" '+
        'style="flex:0 0 auto;width:38px;background:var(--acc);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:15px;">➤</button>'+
    '</div>';
  per.parentNode.insertBefore(inl, per);

  krChatShtoBulle('ai', 'Duke shkruar…', true);
  krChatThirr(true);
}

function krChatMbyll(){
  _kcAktiv = false;
  var inl = document.getElementById('krChatInline');
  if(inl) inl.remove();
  var per = document.getElementById('krPer');
  if(per) per.style.display = '';
}

// ═══ MESAZHET (bullat e bisedes) ═══
function krChatShtoBulle(kush, teksti, ephemer){
  var wrap = document.getElementById('krChatMesazhet'); if(!wrap) return null;
  var b = document.createElement('div');
  b.style.cssText = 'max-width:85%;padding:7px 11px;border-radius:10px;font-size:13px;line-height:1.4;'+
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
  krChatThirr(false, teksti);
}

// ═══ THIRRJA E BACKEND-IT (dergon historikun e plote cdo here) ═══
async function krChatThirr(eshteFillimi, tekstiRiJetiRi){
  _kcHistoriku.push({ role:'user', content: eshteFillimi ? '[FILLIMI]' : tekstiRiJetiRi });

  var input = document.getElementById('krChatInput');
  if(input) input.disabled = true;
  krChatHiqEphemeret();
  krChatShtoBulle('ai', 'Duke shkruar…', true);

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
      krChatShtoBulle('ai', '✓ U qartësua! Po e mbyll bisedën…');
      var per = document.getElementById('krPer');
      if(per) per.value = r.pershkrim_anglisht;
      var st = document.getElementById('krChatStatus');
      if(st) st.textContent = '✓ Përshkrimi u përgatit nga biseda.';
      setTimeout(krChatMbyll, 1200);
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
