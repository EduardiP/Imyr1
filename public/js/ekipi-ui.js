// ekipi-ui.js — "Teams & Roles": TANI "COMING SOON" + liste pritjeje (jo funksionalitet i plote ende).

function ekipiNdertoSkeleten(){
  var el = document.getElementById('v-ekipi'); if(!el) return;
  el.innerHTML =
    '<div class="wrap" style="max-width:520px;margin:60px auto;text-align:center;">'+
      '<div class="card" style="padding:36px 28px;">'+
        '<h2 style="margin-top:0;">Teams & Roles</h2>'+
        '<p class="mut" style="line-height:1.6;">Invite colleagues with custom roles and permissions — full control over who can do what. This feature is coming soon.</p>'+
        '<div id="ekPritjeEmail" style="margin:20px 0;">'+
          '<input id="ekPritjeInput" type="email" placeholder="your@email.com" style="width:100%;padding:10px;background:#0e1116;border:1px solid var(--line);border-radius:8px;color:var(--txt);text-align:center;">'+
        '</div>'+
        '<button class="primary" id="ekPritjeBtn" onclick="ekipiRregjistrohuPritje()" style="width:100%;">Join the waitlist</button>'+
        '<p class="small" id="ekPritjeMsg" style="margin-top:12px;"></p>'+
      '</div>'+
    '</div>';

  ekipiKontrolloStatusin();
}

async function ekipiKontrolloStatusin(){
  try{
    const r = await (await fetch('/api/ekipi/lista-pritjes/statusi')).json();
    if(r.regjistruar) ekipiShfaqTashmeRegjistruar();
    else if(window.une && window.une.email) {
      var inp = document.getElementById('ekPritjeInput');
      if(inp) inp.value = window.une.email;
    }
  }catch(e){}
}

function ekipiShfaqTashmeRegjistruar(){
  var wrap = document.getElementById('ekPritjeEmail'); if(wrap) wrap.style.display='none';
  var btn = document.getElementById('ekPritjeBtn');
  if(btn){ btn.disabled = true; btn.textContent = "You're already on the list"; }
}

async function ekipiRregjistrohuPritje(){
  var btn = document.getElementById('ekPritjeBtn');
  var msg = document.getElementById('ekPritjeMsg');
  var email = (document.getElementById('ekPritjeInput') || {}).value || (window.une && window.une.email) || '';
  email = email.trim();

  if(!email){ msg.textContent = 'Enter your email.'; msg.className = 'small err'; return; }

  btn.disabled = true;
  try{
    const r = await (await fetch('/api/ekipi/lista-pritjes/regjistrohu', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: email })
    })).json();

    if(r.error){ msg.textContent = r.error; msg.className = 'small err'; btn.disabled = false; return; }

    if(r.tashme){
      msg.textContent = "You're already registered.";
      msg.className = 'small mut';
    } else {
      msg.textContent = "You're on the list! We'll notify you when it's ready.";
      msg.className = 'small ok';
    }
    ekipiShfaqTashmeRegjistruar();
  }catch(e){
    msg.textContent = 'Error: ' + e.message;
    msg.className = 'small err';
    btn.disabled = false;
  }
}

function hapEkipin(){
  nav({v:'ekipi'});
}
