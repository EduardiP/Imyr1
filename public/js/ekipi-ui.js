// ekipi-ui.js — Seksion KREJT I VEÇANTË për "Ekipi & Rolet", me URL të vetën (/ekipi),
// menu të vetën majtas (7 zëra), pa header-in/sidebar-in e dashboard-it kryesor.
//
// SI LIDHET (3 hapa):
// 1) Shto te index.html, si "vëlla" i <div id="v-profile">, një div i ri bosh:
//      <div class="view" id="v-ekipi"></div>
// 2) Te core.js/app.js, gjej ku menyja e avatarit ka rreshtin "Ekipi & Rolet" (sot thërret
//    nav({v:'profile', nav:'ekipi'})) — zëvendësoje thirrjen me: hapEkipin()
// 3) Te server.js, shto (krah /si-funksionon etj):
//      app.get('/ekipi', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
//    (kthen të njëjtin index.html — vetë JS-ja poshtë e njeh URL-në dhe hap pjesën e duhur)

var EKIPI_TABS = [
  { k: 'permbledhje', l: 'Përmbledhje' },
  { k: 'anetaret', l: 'Anëtarët' },
  { k: 'rolet', l: 'Rolet' },
  { k: 'cakto', l: 'Cakto role' },
  { k: 'ftesat', l: 'Ftesat' },
  { k: 'aktiviteti', l: 'Regjistri i aktivitetit' },
  { k: 'analitika', l: 'Analitika' }
];
var _ekTab = 'permbledhje';

function hapEkipin(tabFillestar) {
  if(tabFillestar) _ekTab = tabFillestar;
  nav({v:'ekipi'});
}
// Kapet Back/Forward i browser-it — nëse largohet nga /ekipi, kthehu te dashboard normal
window.addEventListener('popstate', function () {
  if (location.pathname !== '/ekipi') {
    var v = document.getElementById('v-ekipi'); if (v) v.classList.remove('on');
    var p = document.getElementById('v-profile'); if (p) p.classList.add('on');
  }
});

function ekipiNdertoSkeleten() {
  var v = document.getElementById('v-ekipi');
  v.innerHTML =
    '<div class="appwrap">' +
    '<aside class="sidebar">' +
    '<div class="pcard"></div>' +
    '<nav class="snav" id="ekSnav"></nav>' +
    '</aside>' +
    '<main class="main"><div id="ekBody"></div></main>' +
    '</div>';
  ekipiRenderNav();
  ekipiShkoTek(_ekTab);
}


function ekipiRenderNav() {
  var el = document.getElementById('ekSnav'); if (!el) return;
  el.innerHTML = '';
  EKIPI_TABS.forEach(function (t) {
    var b = document.createElement('button');
    b.textContent = t.l;
    if (t.k === _ekTab) b.className = 'active';
    b.onclick = function () { ekipiShkoTek(t.k); };
    el.appendChild(b);
  });
}

function ekipiShkoTek(tab) {
  _ekTab = tab;
  ekipiRenderNav();
  var body = document.getElementById('ekBody'); if (!body) return;
  body.innerHTML = '<p class="small mut">Po ngarkoj…</p>';
  if (tab === 'permbledhje') return ekipiPermbledhje(body);
  if (tab === 'anetaret') return ekipiAnetaret(body);
  if (tab === 'rolet') return ekipiRolet(body);
  if (tab === 'cakto') return ekipiCaktoRole(body);
  if (tab === 'ftesat') return ekipiFtesat(body);
  if (tab === 'aktiviteti') return ekipiAktiviteti(body);
  if (tab === 'analitika') { body.innerHTML = '<h2 class="h">Analitika</h2><p class="small mut" style="margin-top:8px;">Së shpejti.</p>'; return; }
}

function ekipiEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function ekipiDt(x) { if (!x) return '—'; try { return new Date(x).toLocaleDateString('sq'); } catch (e) { return x; } }

// ═══ PËRMBLEDHJE ═══
async function ekipiPermbledhje(body) {
  body.innerHTML = '<h2 class="h">Përmbledhje</h2>';
  try {
    var [anetaretR, ftesatR] = await Promise.all([
      fetch('/api/ekipi/anetaret').then(r => r.json()),
      fetch('/api/ekipi/ftesat').then(r => r.json())
    ]);
    var anetaret = anetaretR.anetaret || [];
    var aktive = anetaret.filter(a => a.statusi === 'aktiv').length;
    var pezulluar = anetaret.filter(a => a.statusi === 'pezulluar').length;
    var nePritje = (ftesatR.ftesat || []).filter(f => !f.pranuar).length;
    body.innerHTML +=
      '<div class="stats" style="margin:16px 0 20px;">' +
      '<div class="stat"><div class="v">' + aktive + '</div><div class="l">Anëtarë aktivë</div></div>' +
      '<div class="stat"><div class="v">' + pezulluar + '</div><div class="l">Të pezulluar</div></div>' +
      '<div class="stat"><div class="v">' + nePritje + '</div><div class="l">Ftesa në pritje</div></div>' +
      '</div>' +
      '<button class="btn cta" onclick="ekipiShkoTek(\'ftesat\')">+ Fto dikë të ri</button>';
  } catch (e) { body.innerHTML += '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}

// ═══ ANËTARËT ═══
async function ekipiAnetaret(body) {
  body.innerHTML = '<h2 class="h">Anëtarët</h2>';
  try {
    var r = await (await fetch('/api/ekipi/anetaret')).json();
    var lista = r.anetaret || [];
    if (!lista.length) { body.innerHTML += '<p class="small mut">Ende s\'ka anëtarë.</p>'; return; }
    var h = '<div class="ktabela" style="margin-top:14px;">' +
      '<div class="krow khead"><span class="kc1">Emri / Email</span><span class="kc3">Roli</span><span class="kc3">Statusi</span><span class="kc3"></span></div>';
    lista.forEach(function (a) {
      var statusEtiketa = a.statusi === 'aktiv' ? '<span style="color:var(--good);">● Aktiv</span>'
        : a.statusi === 'pezulluar' ? '<span style="color:var(--err);">● Pezulluar</span>'
        : '<span class="mut">○ Ftesë në pritje</span>';
      var veprime = a.eshte_pronar ? '<span class="small mut">Pronar</span>' :
        (a.statusi === 'aktiv'
          ? '<button class="btn" onclick="ekipiPezullo(' + a.id + ')">Pezullo</button> <button class="btn" onclick="ekipiHiq(' + a.id + ')">Hiq</button>'
          : a.statusi === 'pezulluar'
            ? '<button class="btn" onclick="ekipiAktivizo(' + a.id + ')">Aktivizo</button> <button class="btn" onclick="ekipiHiq(' + a.id + ')">Hiq</button>'
            : '');
      h += '<div class="krow"><span class="kc1">' + ekipiEsc(a.emri || a.email) + '<br><span class="small mut">' + ekipiEsc(a.email) + '</span></span>' +
        '<span class="kc3">' + ekipiEsc(a.roli || '—') + '</span>' +
        '<span class="kc3">' + statusEtiketa + '</span>' +
        '<span class="kc3">' + veprime + '</span></div>';
    });
    body.innerHTML += h + '</div>';
  } catch (e) { body.innerHTML += '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function ekipiPezullo(id) { await fetch('/api/ekipi/anetaret/' + id + '/pezullo', { method: 'POST' }); ekipiShkoTek('anetaret'); }
async function ekipiAktivizo(id) { await fetch('/api/ekipi/anetaret/' + id + '/aktivizo', { method: 'POST' }); ekipiShkoTek('anetaret'); }
async function ekipiHiq(id) { if (!confirm('Ta heqësh këtë anëtar?')) return; await fetch('/api/ekipi/anetaret/' + id, { method: 'DELETE' }); ekipiShkoTek('anetaret'); }

// ═══ ROLET (liste kartash — jo me matrice; secili rol zgjerohet vete per te ndryshuar lejet) ═══
var EKIPI_LEJE_ETIKETA = {
  creative_krijo: 'Krijo Creative', creative_shiko: 'Shiko Creative',
  snippet_ndrysho: 'Ndrysho Ad Space', faturimi_shiko: 'Shiko Faturimin',
  ekipi_menaxho: 'Menaxho Ekipin', analytics_shiko: 'Shiko Analytics',
  konvertimet_shiko: 'Shiko Konvertimet'
};
var _ekRolHapur = null; // id-ja e rolit aktualisht te zgjeruar (per te ndryshuar lejet), ose null

async function ekipiRolet(body) {
  body.innerHTML = '<h2 class="h">Rolet</h2>' +
    '<p class="small mut" style="margin:4px 0 14px;">Krijo role dhe përcakto çka lejon secili. Kliko një rol për t\'i ndryshuar lejet.</p>' +
    '<button class="btn cta" style="margin-bottom:16px;" onclick="ekipiHapKrijoRol()">+ Krijo rol</button>' +
    '<div id="ekKrijoRolForma"></div>' +
    '<div id="ekRoletLista"><p class="small mut">Po ngarkoj…</p></div>';
  await ekipiNgarkoRoletListen();
}

async function ekipiNgarkoRoletListen() {
  var el = document.getElementById('ekRoletLista'); if (!el) return;
  try {
    var [roletR, anetaretR] = await Promise.all([
      fetch('/api/ekipi/rolet').then(r => r.json()),
      fetch('/api/ekipi/anetaret').then(r => r.json())
    ]);
    var rolet = roletR.rolet || [];
    var anetaret = anetaretR.anetaret || [];
    if (!rolet.length) { el.innerHTML = '<p class="small mut">Ende s\'ke role. Krijo të parin lart.</p>'; return; }
    var h = '';
    rolet.forEach(function (ro) {
      var nrAnetare = anetaret.filter(function (a) { return a.roli === ro.emri; }).length;
      var hapur = (_ekRolHapur === ro.id);
      h += '<div style="border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden;">' +
        '<button type="button" onclick="ekipiToggloRolin(' + ro.id + ')" style="width:100%;text-align:left;padding:14px 16px;background:' + (hapur ? 'rgba(74,158,255,.1)' : 'transparent') + ';border:none;color:var(--txt);cursor:pointer;font-family:inherit;display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-weight:600;font-size:14px;">' + ekipiEsc(ro.emri) + '</span>' +
        '<span class="small mut">' + nrAnetare + ' anëtar' + (nrAnetare === 1 ? '' : 'ë') + ' ' + (hapur ? '▲' : '▼') + '</span>' +
        '</button>' +
        '<div id="ekRolLejet_' + ro.id + '" style="' + (hapur ? '' : 'display:none;') + 'padding:4px 16px 16px;">' +
        ekipiRenderLejetForRol(ro) +
        '</div></div>';
    });
    el.innerHTML = h;
  } catch (e) { el.innerHTML = '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}

function ekipiRenderLejetForRol(roli) {
  var kolonat = Object.keys(EKIPI_LEJE_ETIKETA);
  return kolonat.map(function (k) {
    var aktive = roli.leje && roli.leje[k];
    return '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;">' +
      '<input type="checkbox" ' + (aktive ? 'checked' : '') + ' onchange="ekipiNdryshoLeje(' + roli.id + ',\'' + k + '\',this.checked)">' +
      EKIPI_LEJE_ETIKETA[k] + '</label>';
  }).join('');
}

async function ekipiToggloRolin(rolId) {
  _ekRolHapur = (_ekRolHapur === rolId) ? null : rolId;
  await ekipiNgarkoRoletListen();
}

function ekipiHapKrijoRol() {
  var el = document.getElementById('ekKrijoRolForma'); if (!el) return;
  el.innerHTML = '<div class="card" style="margin-bottom:16px;">' +
    '<label>Emri i rolit</label>' +
    '<input id="ekRolEmriRiInp" placeholder="p.sh. Menaxher">' +
    '<button class="primary" style="margin-top:10px;" onclick="ekipiKrijoRolTani()">Krijo</button> ' +
    '<button class="btn" style="margin-top:10px;" onclick="document.getElementById(\'ekKrijoRolForma\').innerHTML=\'\'">Anulo</button>' +
    '<span class="small" id="ekRolKrijoStat" style="margin-left:8px;"></span>' +
    '</div>';
}
async function ekipiKrijoRolTani() {
  var inp = document.getElementById('ekRolEmriRiInp');
  var emri = (inp || {}).value || '';
  var stat = document.getElementById('ekRolKrijoStat');
  if (!emri.trim()) { if (stat) stat.textContent = 'Vendos emrin.'; return; }
  try {
    var r = await (await fetch('/api/ekipi/rolet', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emri: emri, leje: {} })
    })).json();
    if (r.error) { if (stat) stat.textContent = r.error; return; }
    document.getElementById('ekKrijoRolForma').innerHTML = '';
    _ekRolHapur = r.id; // hape menjehere rolin e ri per te vendosur lejet
    await ekipiNgarkoRoletListen();
  } catch (e) { if (stat) stat.textContent = 'Gabim: ' + e.message; }
}

async function ekipiNdryshoLeje(rolId, celesi, vlera) {
  var r = await (await fetch('/api/ekipi/rolet')).json();
  var roli = (r.rolet || []).find(x => x.id === rolId);
  if (!roli) return;
  var lejeReja = Object.assign({}, roli.leje); lejeReja[celesi] = vlera;
  await fetch('/api/ekipi/rolet/' + rolId, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leje: lejeReja })
  });
}

// ═══ CAKTO ROLE (te anëtar specifik) ═══
async function ekipiCaktoRole(body) {
  body.innerHTML = '<h2 class="h">Cakto role</h2><p class="small mut" style="margin:4px 0 14px;">Zgjidh rolin për çdo anëtar.</p>' +
    '<button class="btn cta" style="margin-bottom:16px;" onclick="ekipiHapKrijoRol()">+ Krijo rol</button>' +
    '<div id="ekKrijoRolForma"></div>';
  try {
    var [anetaretR, roletR] = await Promise.all([
      fetch('/api/ekipi/anetaret').then(r => r.json()),
      fetch('/api/ekipi/rolet').then(r => r.json())
    ]);
    var anetaret = (anetaretR.anetaret || []).filter(a => !a.eshte_pronar);
    var rolet = roletR.rolet || [];
    if (!anetaret.length) { body.innerHTML += '<p class="small mut">S\'ka anëtarë ende.</p>'; return; }
    var h = '<div class="ktabela">' + '<div class="krow khead"><span class="kc1">Anëtari</span><span class="kc3">Roli</span></div>';
    anetaret.forEach(function (a) {
      h += '<div class="krow"><span class="kc1">' + ekipiEsc(a.emri || a.email) + '</span>' +
        '<span class="kc3"><select onchange="ekipiCaktoRolTe(' + a.id + ',this.value)" style="background:#0e1116;color:var(--txt);border:1px solid var(--line);border-radius:6px;padding:4px;">' +
        rolet.map(ro => '<option value="' + ro.id + '"' + (a.roli === ro.emri ? ' selected' : '') + '>' + ekipiEsc(ro.emri) + '</option>').join('') +
        '</select></span></div>';
    });
    body.innerHTML += h + '</div>';
  } catch (e) { body.innerHTML += '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function ekipiCaktoRolTe(anetarId, rolId) {
  await fetch('/api/ekipi/anetaret/' + anetarId + '/rol', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rol_id: rolId })
  });
}

// ═══ FTESAT ═══
async function ekipiFtesat(body) {
  body.innerHTML = '<h2 class="h">Ftesat</h2>';
  try {
    var [ftesatR, roletR] = await Promise.all([
      fetch('/api/ekipi/ftesat').then(r => r.json()),
      fetch('/api/ekipi/rolet').then(r => r.json())
    ]);
    var ftesat = ftesatR.ftesat || [], rolet = roletR.rolet || [];
    var h = '<div class="card" style="margin:14px 0 20px;">' +
      '<label>Email</label><input id="ekFtEmail" placeholder="kolegu@email.com">' +
      '<label style="margin-top:10px;">Roli</label>' +
      '<select id="ekFtRol" style="width:100%;padding:9px;background:#0e1116;border:1px solid var(--line);border-radius:8px;color:var(--txt);">' +
      rolet.map(ro => '<option value="' + ro.id + '">' + ekipiEsc(ro.emri) + '</option>').join('') +
      '</select>' +
      '<button class="primary" style="margin-top:14px;" onclick="ekipiDergoFtese(this)">Dërgo ftesën</button>' +
      '<span class="small" id="ekFtStat" style="margin-left:10px;"></span>' +
      '</div>';
    h += '<div class="ktabela"><div class="krow khead"><span class="kc1">Email</span><span class="kc3">Roli</span><span class="kc3">Skadon</span><span class="kc3"></span></div>';
    if (!ftesat.length) h += '<div class="krow"><span class="small mut">S\'ka ftesa.</span></div>';
    ftesat.forEach(function (f) {
      h += '<div class="krow"><span class="kc1">' + ekipiEsc(f.email) + '</span>' +
        '<span class="kc3">' + ekipiEsc(f.roli || '—') + '</span>' +
        '<span class="kc3">' + (f.pranuar ? 'U pranua' : ekipiDt(f.skadon_at)) + '</span>' +
        '<span class="kc3">' + (!f.pranuar ? '<button class="btn" onclick="ekipiAnuloFtesen(' + f.id + ')">Anulo</button>' : '') + '</span></div>';
    });
    body.innerHTML += h + '</div>';
  } catch (e) { body.innerHTML += '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
async function ekipiDergoFtese(btn) {
  var email = (document.getElementById('ekFtEmail') || {}).value || '';
  var rolId = (document.getElementById('ekFtRol') || {}).value || '';
  var stat = document.getElementById('ekFtStat');
  if (!email.trim()) { if (stat) stat.textContent = 'Vendos email-in.'; return; }
  btn.disabled = true;
  try {
    var r = await (await fetch('/api/ekipi/ftesat/dergo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, rol_id: rolId })
    })).json();
    if (r.error) { if (stat) stat.textContent = r.error; btn.disabled = false; return; }
    ekipiShkoTek('ftesat');
  } catch (e) { if (stat) stat.textContent = 'Gabim: ' + e.message; btn.disabled = false; }
}
async function ekipiAnuloFtesen(id) { await fetch('/api/ekipi/ftesat/' + id + '/anullo', { method: 'POST' }); ekipiShkoTek('ftesat'); }

// ═══ REGJISTRI I AKTIVITETIT ═══
async function ekipiAktiviteti(body) {
  body.innerHTML = '<h2 class="h">Regjistri i aktivitetit</h2>';
  try {
    var r = await (await fetch('/api/ekipi/aktiviteti')).json();
    var lista = r.aktiviteti || [];
    if (!lista.length) { body.innerHTML += '<p class="small mut">Ende s\'ka aktivitet.</p>'; return; }
    var h = '<div class="ktabela" style="margin-top:14px;">';
    lista.forEach(function (a) {
      h += '<div class="krow"><span class="kc1">' + ekipiEsc(a.aktori_email) + ' — ' + ekipiEsc(a.veprimi) + '</span>' +
        '<span class="kc3 small mut">' + ekipiDt(a.krijuar_at) + '</span></div>';
    });
    body.innerHTML += h + '</div>';
  } catch (e) { body.innerHTML += '<p class="small">Gabim gjatë ngarkimit.</p>'; }
}
