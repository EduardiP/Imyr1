// kreative-chat-ui.js — "Përshkruaj te AI" (UI), per Creative (Imazh/Video/HTML5).
// Skedar i VEÇANTË, i ndare qellimisht nga app.js, per te mos e mbingarkuar.
//
// SJELLJA (rishkruar plotesisht):
// - S'ka BUTON qe e "aktivizon" — chat-i eshte GJITHMONE i hapur, ZEVENDESON
//   TERESISHT fushen e vjeter "Përshkrimi" (label + textarea), ne te njejtin vend.
// - Pyetja e PARE (nga ne, jo nga API — fikse, pa kosto) eshte GJITHMONE ne ANGLISHT.
// - Pyetjet pasuese (nese nevojiten) vijne nga DeepSeek, ne gjuhen qe perdor klienti.
// - Ne FUND, para se te aktivizohet gjenerimi, i TREGOHET klientit SAKTESISHT
//   kerkesa e formuluar qe do t'i dergohet gjeneruesit — jo e fshehur.
// - VLEN VETEM per krijimin FILLESTAR. Modifikimi ("✏️ Modifiko" te "Krijimet e
//   mia") mbetet plotesisht manual, pa AI-chat — s'e prek fare kjo veçori.
//
// Eksporton VETEM:
//   krChatEmbedHTML()       — HTML i kontejnerit te chat-it (per formaKreative,
//                              ne vend te label+textarea "Përshkrimi")
//   krChatAutoHap()         — thirret PAS insertimit ne DOM, nis chat-in automatikisht
//   krChatReset()           — pastron gjendjen (per t'u thirrur kur hapet forma nga e para)
//   krChatMerrPershkrimin() — kthen pershkrimin FINAL (anglisht) — null nese s'ka perfunduar ende

const KR_CHAT_PYETJA_FILLIM =
  "Please give a description of what you'd like the ad to look like. " +
  "I'm here to help formulate your request as precisely as possible before it's sent to the generator.";

var _kcLloji = null;
var _kcHistoriku = [];      // [{role, content}] — dergohet i plote ne cdo thirrje te backend-it
var _kcGati = false;
var _kcPershkrimFinal = null;

function krChatEmbedHTML(){
  return '<label style="margin-top:12px;">Përshkruaj te AI</label>'+
    '<div id="krChatInline" style="border:1px solid var(--line);border-radius:8px;background:#0e1116;'+
      'display:flex;flex-direction:column;height:230px;overflow:hidden;margin-top:8px;">'+
      '<div id="krChatMesazhet" style="flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;"></div>'+
      '<div style="flex:0 0 auto;padding:8px 10px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:stretch;">'+
        '<input id="krChatInput" placeholder="Shkruaj përgjigjen…" '+
          'style="flex:1 1 auto;min-width:0;background:#12151b;border:1px solid var(--line);border-radius:6px;color:var(--txt);padding:7px 10px;font-size:13px;" '+
          'onkeydown="if(event.key===\'Enter\')krChatDergo()">'+
        '<button type="button" onclick="krChatDergo()" '+
          'style="flex:0 0 auto;width:38px;background:var(--acc);border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:15px;">➤</button>'+
      '</div>'+
    '</div>';
}

function krChatReset(){
  _kcHistoriku = []; _kcGati = false; _kcPershkrimFinal = null;
}

// Thirret PAS se HTML-ja e krChatEmbedHTML() eshte tashme ne DOM (p.sh. brenda
// krNgarkoKufirin() ne app.js) — nis biseden automatikisht, PA thirrje API
// (pyetja e pare eshte fikse, jo e gjeneruar).
function krChatAutoHap(){
  var wrap = document.getElementById('krChatMesazhet'); if(!wrap) return;
  _kcLloji = (window._formaKreativeLloji) || 'imazh';
  _kcHistoriku = [{ role:'assistant', content: KR_CHAT_PYETJA_FILLIM }];
  wrap.innerHTML = '';
  krChatShtoBulle('ai', KR_CHAT_PYETJA_FILLIM);
}

// ═══ MESAZHET (bullat e bisedes) ═══
function krChatShtoBulle(kush, teksti, ephemer){
  var wrap = document.getElementById('krChatMesazhet'); if(!wrap) return null;
  var b = document.createElement('div');
  b.style.cssText = 'max-width:88%;padding:7px 11px;border-radius:10px;font-size:13px;line-height:1.4;white-space:pre-wrap;'+
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
  krChatThirr(teksti);
}

// ═══ THIRRJA E BACKEND-IT (dergon historikun e plote cdo here, pyetja fillestare eshte tashme ne historik) ═══
async function krChatThirr(tekstiRiJetiRi){
  _kcHistoriku.push({ role:'user', content: tekstiRiJetiRi });

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
      _kcPershkrimFinal = r.pershkrim_anglisht;
      krChatShtoBulle('ai', '📋 Kjo është kërkesa që do t\'i dërgohet gjeneruesit:\n\n'+r.pershkrim_anglisht);
      krChatShtoBulle('ai', '✓ Gati! Kliko "✨ Gjenero me AI" poshtë kur të jesh gati.');
      if(input){ input.disabled = true; input.placeholder = 'Biseda ka përfunduar.'; }
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

// ═══ NJOFTIM KUR SHTOHET NJE IMAZH JASHTE CHAT-IT (nga "Ngarko skedarë" ose
// "Nga imazhet e mia", poshte chat-it) — shfaq nje shenim te vogel brenda bisedes
// dhe e informon AI-n automatikisht, qe te mund te pyesi cfare eshte nese nevojitet. ═══
function krChatShtoReferencaImazhi(emri){
  if(_kcGati) return; // biseda ka perfunduar tashme — s'ka kuptim ta rihapim per kete
  var wrap = document.getElementById('krChatMesazhet');
  if(!wrap) return; // chat-i s'eshte hapur/render-uar ende (rast i rralle)
  var shenim = document.createElement('div');
  shenim.style.cssText = 'align-self:center;font-size:11px;color:var(--mut);background:#1c2230;padding:3px 10px;border-radius:20px;';
  shenim.textContent = '📎 U shtua: ' + emri;
  wrap.appendChild(shenim);
  wrap.scrollTop = wrap.scrollHeight;
  krChatThirr('[Klienti sapo shtoi një material referues, i identifikuar si "'+emri+'". '+
    'Nëse është e rëndësishme të dish çfarë përfaqëson (p.sh. logo, produkt, sfond, video baze, kod ekzistues), '+
    'pyete shkurt; përndryshe vazhdo normalisht.]');
}

// Thirret nga krGjenero() ne app.js, ne vend te leximit te nje textarea — kthen
// null nese biseda s'ka perfunduar ende (klienti duhet ta paralajmerojme).
function krChatMerrPershkrimin(){
  return _kcGati ? _kcPershkrimFinal : null;
}
