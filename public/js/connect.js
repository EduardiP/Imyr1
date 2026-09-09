// connect.js — mekanizmi i lidhjes së snippet-it (i ndarë; thirret nga wizard-i dhe kudo tjetër)
// Tani: snippet fleksibël (auto). Formati fiks do të kthehet kur të shtohet imazh/video/.zip.

function snippetKod(){
  return '<script src="'+location.origin+'/imyr.js" data-key="'+((une&&une.celes)||'')+'"></'+'script>';
}

function connectUI(el){
  el.innerHTML=
    '<p class="small" style="margin:0 0 8px;">Place this line <b>exactly where you want the ad to appear</b> on your site. The ad shows up right at that spot.</p>'+
    '<div style="position:relative;">'+
      '<textarea class="kod" id="kodBox" readonly>'+snippetKod().replace(/</g,'&lt;')+'</textarea>'+
      '<button class="btn" id="cbtn" onclick="kopjo()" style="position:absolute;top:8px;right:8px;padding:4px 10px;font-size:12px;line-height:1;">Copy</button>'+
    '</div>'+
    '<div id="afterCopy" class="hide">'+
      '<div class="small" style="margin-top:12px;">Once you\'ve saved it on your site, enter the URL where you placed it and open it to confirm the connection.</div>'+
      '<label>Page URL</label><input id="hapUrl" value="'+(((une&&une.website)||'')).replace(/"/g,"&quot;")+'" placeholder="https://my-website.com">'+
      '<button class="primary" id="hbtn" onclick="hapDheVerifiko()">Open the page and confirm →</button>'+
      '<div class="status wait hide" id="statusLine"></div>'+
    '</div>';
  if(prog && prog.lidhja){
    $('afterCopy').classList.remove('hide');
    $('statusLine').classList.remove('hide'); $('statusLine').textContent='✓ Connected.';
  }
}

function kopjo(){
  const t=$('kodBox'); t.select(); t.setSelectionRange(0,99999);
  try{document.execCommand('copy');}catch(e){}
  $('cbtn').textContent='Copied ✓'; setTimeout(()=>$('cbtn').textContent='Copy',1500);
  $('afterCopy').classList.remove('hide');
}
function hapDheVerifiko(){
  let url=($('hapUrl').value||'').trim(); if(!url){ $('hapUrl').focus(); return; }
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  window.open(url,'_blank');
  $('statusLine').classList.remove('hide'); $('statusLine').innerHTML='⏳ Waiting for the connection signal…';
  startPolling(window.__onLidhur);
}
function startPolling(onLidhur){
  if(pollTimer) clearInterval(pollTimer);
  const tick=async()=>{
    try{
      const st=await(await fetch('/api/kontrollo')).json();
      if(st.active){
        clearInterval(pollTimer); pollTimer=null;
        if($('statusLine')){ $('statusLine').className='status'; $('statusLine').innerHTML='✓ Connected successfully!'; }
        await refreshProg();
        if(typeof onLidhur==='function') onLidhur();
      }
    }catch(e){}
  };
  tick(); pollTimer=setInterval(tick,6000);
}
