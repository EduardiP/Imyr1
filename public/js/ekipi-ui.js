// ekipi-ui.js — "Teams & Roles": MODAL mbi dashboard (jo view/faqe e re) — "coming soon" + liste pritjeje.

function hapEkipin(){
  if(!document.getElementById('ekModal')){
    var d = document.createElement('div');
    d.id = 'ekModal';
    d.className = 'backdrop';
    d.style.zIndex = '150';
    d.onclick = function(e){ if(e.target.id==='ekModal') mbyllEkipin(); };
    d.innerHTML =
      '<div class="card modal" style="max-width:420px;">'+
        '<button class="x" onclick="mbyllEkipin()">✕</button>'+
        '<h2 class="h" style="margin-top:0;">Teams & Roles</h2>'+
        '<p class="small mut" style="line-height:1.6;">Invite colleagues with custom roles and permissions — full control over who can do what. This feature is coming soon.</p>'+
        '<div id="ekPritjeEmail" style="margin:16px 0 4px;">'+
          '<input id="ekPritjeInput" type="email" placeholder="your@email.com">'+
        '</div>'+
        '<button class="primary" id="ekPritjeBtn" onclick="ekipiRregjistrohuPritje()" style="width:100%;margin-top:8px;">Join the waitlist</button>'+
        '<div class="msg" id="ekPritjeMsg"></div>'+
      '</div>';
    document.body.appendChild(d);
  }
  document.getElementById('ekModal').classList.remove('hide');
  ekipiKontrolloStatusin();
}

function mbyllEkipin(){
  var m = document.getElementById('ekModal');
  if(m) m.classList.add('hide');
}

async function ekipiKontrolloStatusin(){
  var msg = document.getElementById('ekPritjeMsg'); if(msg){ msg.textContent=''; msg.className='msg'; }
  try{
    const r = await (await fetch('/api/ekipi/lista-pritjes/statusi')).json();
    if(r.regjistruar){
      ekipiShfaqTashmeRegjistruar();
    } else {
      var wrap = document.getElementById('ekPritjeEmail'); if(wrap) wrap.style.display='';
      var btn = document.getElementById('ekPritjeBtn');
      if(btn){ btn.disabled = false; btn.textContent = 'Join the waitlist'; }
      if(window.une && window.une.email){
        var inp = document.getElementById('ekPritjeInput');
        if(inp) inp.value = window.une.email;
      }
    }
  }catch(e){}
}

function ekipiShfaqTashmeRegjistruar(){
  var wrap = document.getElementById('ekPritjeEmail'); if(wrap) wrap.style.display='none';
  var btn = document.getElementById('ekPritjeBtn');
  if(btn){ btn.disabled = true; btn.textContent = "You're already on the list"; }
  var msg = document.getElementById('ekPritjeMsg');
  if(msg){ msg.textContent = "You're already registered."; msg.className = 'msg ok'; }
}

async function ekipiRregjistrohuPritje(){
  var btn = document.getElementById('ekPritjeBtn');
  var msg = document.getElementById('ekPritjeMsg');
  var email = (document.getElementById('ekPritjeInput') || {}).value || (window.une && window.une.email) || '';
  email = email.trim();

  if(!email){ msg.textContent = 'Enter your email.'; msg.className = 'msg err'; return; }

  btn.disabled = true;
  try{
    const r = await (await fetch('/api/ekipi/lista-pritjes/regjistrohu', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: email })
    })).json();

    if(r.error){ msg.textContent = r.error; msg.className = 'msg err'; btn.disabled = false; return; }

    if(r.tashme){
      // Ishte tashme regjistruar (rast i rralle, gare kohore) — tregoje, MOS e mbyll automatikisht
      ekipiShfaqTashmeRegjistruar();
      return;
    }

    // Sukses i ri — mbylle automatikisht, pas nje shkendije te shkurter konfirmimi
    msg.textContent = "You're on the list!";
    msg.className = 'msg ok';
    setTimeout(mbyllEkipin, 900);
  }catch(e){
    msg.textContent = 'Error: ' + e.message;
    msg.className = 'msg err';
    btn.disabled = false;
  }
}
