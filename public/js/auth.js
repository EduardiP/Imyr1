// auth.js — PARA LOGIN: hero, modal-i i login/register
function hapModal(k){ $('modal').classList.remove('hide'); shfaq(k); }
function mbyllModal(){ $('modal').classList.add('hide'); $('msg').textContent=''; }
document.getElementById('modal').addEventListener('click', e=>{ if(e.target.id==='modal') mbyllModal(); });

function shfaq(k){
  $('formHyr').classList.toggle('hide', k!=='hyr');
  $('formReg').classList.toggle('hide', k!=='reg');
  $('tabHyr').classList.toggle('active', k==='hyr');
  $('tabReg').classList.toggle('active', k==='reg');
  $('msg').textContent='';
}
function msg(t,ok){ const m=$('msg'); m.textContent=t; m.className='msg '+(ok?'ok':'err'); }

async function hyr(){
  $('btnHyr').disabled=true;
  try{
    const r=await(await fetch('/api/hyr',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:$('h_email').value.trim(),fjalekalimi:$('h_pass').value})})).json();
    if(r.error){ msg(r.error); $('btnHyr').disabled=false; return; }
    mbyllModal(); await loadMe(); nav(pasHyrjes());
  }catch(e){ msg('Error: '+e.message); }
  $('btnHyr').disabled=false;
}
function hyrGoogle(){
  // Regjistrimi i ri kalon nga pranimi; per hyrje te perseritur rreshti mjafton.
  location.href='/auth/google';
}
async function regjistrohu(){
  $('btnReg').disabled=true;
  try{
    if(!$('r_kushte').checked){ msg('Please accept the Terms and Privacy Policy to continue.'); $('btnReg').disabled=false; return; }
    const body={emri:$('r_emri').value.trim(),email:$('r_email').value.trim(),fjalekalimi:$('r_pass').value,
      kushtet:true, oferta:$('r_oferta').checked, lejonPromovim:$('r_promovim').checked};
    if(!body.emri||!body.email||!body.fjalekalimi){ msg('Please fill in your name, email, and password.'); $('btnReg').disabled=false; return; }
    const r=await(await fetch('/api/regjistrohu',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
    if(r.error){ msg(r.error); $('btnReg').disabled=false; return; }
    mbyllModal(); await loadMe(); nav(pasHyrjes());
  }catch(e){ msg('Error: '+e.message); }
  $('btnReg').disabled=false;
}
// Kushtet per hyrjen e PARE me Google
async function hapKushteGoogle(){
  try{
    const p=await(await fetch('/api/google-pending')).json();
    if(!p.pending) return false;
    $('gk_pershND').innerHTML='Welcome, <b>'+esc(p.emri||p.email)+'</b>. To finish, please accept the terms.';
    $('modalKushte').classList.remove('hide');
    return true;
  }catch(e){ return false; }
}
async function pranoGoogle(){
  if(!$('gk_kushte').checked){ const m=$('gk_msg'); m.className='msg err'; m.textContent='You must accept the Terms and Privacy Policy.'; return; }
  $('gk_btn').disabled=true;
  try{
    const r=await(await fetch('/api/google-prano',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kushtet:true, oferta:$('gk_oferta').checked, lejonPromovim:$('gk_promovim').checked})})).json();
    if(r.error){ const m=$('gk_msg'); m.className='msg err'; m.textContent=r.error; $('gk_btn').disabled=false; return; }
    $('modalKushte').classList.add('hide');
    await loadMe(); nav(pasHyrjes());
  }catch(e){ const m=$('gk_msg'); m.className='msg err'; m.textContent='Error: '+e.message; $('gk_btn').disabled=false; }
}
async function dil(){ await fetch('/api/dil',{method:'POST'}); une=null; location.href='/'; }
