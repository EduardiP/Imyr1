// pxse-portali-admin.js (PhronexusAI) — menuja "Klientët e Outreach" te "Shërbimet falas" ne admin.html.
// Ngarkohet PAS /js/pxse-admin.js (dhe pxse-importi-admin.js). Nuk ndryshon skedaret e tjere: mbeshtjell window.pxseRenderAdmin.
// Backend: pxse-portali.js (/api/admin/pxse/portali/...). Tekstet jane shqip (vetem admin).
(function () {
  'use strict';
  if (window.__pxsePortaliAdminGati) return;
  window.__pxsePortaliAdminGati = true;

  var API = '/api/admin/pxse/portali';
  var PA = { aktiv: false, id: null, zgjedhur: {}, kategorite: {}, filtri: { lloji: 'b2b', vendi: '' }, faqe: 0, kodiRi: null, fshi: null };
  var ZONAT = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Europe/Tirane', 'Australia/Sydney', 'Asia/Dubai', 'Asia/Singapore'];

  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(id) { return document.getElementById(id); }
  function nr(n) { return Number(n || 0).toLocaleString('sq-AL'); }
  function koha(d) { var t = new Date(d); return d && !isNaN(t) ? t.toLocaleString('sq-AL', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; }
  async function thirr(rruga, metoda, trupi) {
    var o = { method: metoda || 'GET', headers: {} };
    if (trupi !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(trupi); }
    var r = await fetch(API + rruga, o), j = {};
    try { j = await r.json(); } catch (x) {}
    if (!r.ok) throw new Error(j.error || ('Gabim ' + r.status));
    return j;
  }
  function stili() {
    if (el('pxpa-stili')) return;
    var s = document.createElement('style'); s.id = 'pxpa-stili';
    s.textContent = [
      '.pxpa-k{background:#0e1116;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 16px}',
      '.pxpa-k h3{margin:0 0 10px;font-size:15px}',
      '.pxpa-rr{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.pxpa-rr input,.pxpa-rr select,.pxpa-k textarea{margin:0;padding:6px 8px;background:#0b0e13;border:1px solid var(--line);border-radius:8px;color:var(--txt);font:inherit;font-size:13px;width:auto}',
      '.pxpa-k textarea{width:100%;min-height:160px}',
      '.pxpa-tbl{border:1px solid var(--line);border-radius:10px;overflow:auto;max-height:60vh}',
      '.pxpa-tbl table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:900px}',
      '.pxpa-tbl th{position:sticky;top:0;background:#161b22;color:#8b949e;font-size:11px;font-weight:600;text-transform:uppercase;text-align:left;padding:8px;border-bottom:1px solid var(--line)}',
      '.pxpa-tbl td{padding:8px;border-bottom:1px solid #1c2230;vertical-align:top}',
      '.pxpa-tbl tr.on td{background:#131a26}',
      '.pxpa-nen{color:var(--mut);font-size:11.5px}',
      '.pxpa-ok{color:#3fb950}.pxpa-jo{color:#f85149}.pxpa-gri{color:#d29922}',
      '.pxpa-kod{font-family:ui-monospace,Menlo,monospace;font-size:15px;background:#0b0e13;border:1px dashed #3b82f6;border-radius:8px;padding:8px 12px;display:inline-block;margin:6px 0}',
      '.pxpa-kat{display:flex;flex-wrap:wrap;gap:6px}',
      '.pxpa-kat label{display:inline-flex;gap:6px;align-items:center;background:#0b0e13;border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:12.5px;cursor:pointer}',
      '.pxpa-kat label.ai{border-color:#3b82f6}',
      '.pxpa-prev{width:100%;height:520px;border:1px solid var(--line);border-radius:10px;background:#fff}',
      '.pxpa-dy{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:1100px){.pxpa-dy{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---------- Menuja ----------
  function shtoButonin() {
    var n = el('pxadNav'); if (!n || n.querySelector('[data-pxpa]')) return;
    var b = document.createElement('button');
    b.className = 'subnav' + (PA.aktiv ? ' active' : ''); b.textContent = 'Klientët e Outreach'; b.setAttribute('data-pxpa', '1');
    b.onclick = function () { PA.aktiv = true; Array.prototype.forEach.call(n.querySelectorAll('.subnav'), function (x) { x.classList.toggle('active', x === b); }); faqja(); };
    n.appendChild(b);
    if (PA.aktiv) Array.prototype.forEach.call(n.querySelectorAll('.subnav:not([data-pxpa])'), function (x) { x.classList.remove('active'); });
    // klikimi i cdo butoni tjeter e mbyll kete faqe
    if (!n.__pxpaDeg) { n.__pxpaDeg = true; n.addEventListener('click', function (ev) { var t = ev.target.closest('.subnav'); if (t && !t.hasAttribute('data-pxpa')) PA.aktiv = false; }, true); }
  }
  if (typeof window.pxseRenderAdmin === 'function') {
    var origjinali = window.pxseRenderAdmin;
    window.pxseRenderAdmin = function (c) {
      var r = origjinali.apply(this, arguments);
      stili();
      var n = el('pxadNav');
      if (n) { shtoButonin(); new MutationObserver(function () { shtoButonin(); }).observe(n, { childList: true }); }
      if (PA.aktiv) faqja();
      return r;
    };
  }

  // ---------- Faqja ----------
  function faqja() {
    var m = el('pxadMain'); if (!m) return;
    m.innerHTML = '<div class="pxad-wrap"><h2 class="h">Shërbimet falas · Klientët e Outreach</h2>' +
      '<p class="small mut" style="margin:0 0 14px">Klientët me pagesë (Upwork/Fiverr). Secili hyn te <b>phronexusai.com/outreach</b> me kodin e vet: lidh email-in, shkruan ose gjeneron email-in dhe sheh rezultatet. ' +
      'Marrësit dhe orarin i vendos vetëm ti këtu. Pas datës "Aktiv deri" dërgimet ndalen vetë.</p>' +
      '<div class="pxpa-k"><h3>Klient i ri</h3><div class="pxpa-rr">' +
      '<input id="paEmri" placeholder="Emri i kompanisë (opsional)"><input id="paDom" placeholder="domaini.com (opsional)">' +
      '<label class="small">Aktiv deri <input type="date" id="paDeri"></label><label class="small">Në ditë <input type="number" id="paDitore" value="15" min="1" max="50" style="width:70px"></label>' +
      '<select id="paZona">' + ZONAT.map(function (z) { return '<option>' + z + '</option>'; }).join('') + '</select>' +
      '<input id="paShenim" placeholder="Shënim (p.sh. Upwork, kontrata…)" style="min-width:240px"><button class="pxad-btn on" id="paKrijo">Krijo dhe gjenero kodin</button></div>' +
      '<div id="paKodi"></div></div>' +
      '<div class="pxpa-k"><h3>Klientët</h3><div id="paLista"><p class="small mut">Po ngarkoj…</p></div></div><div id="paDetaje"></div></div>';
    var d = new Date(Date.now() + 30 * 86400000); el('paDeri').value = d.toISOString().slice(0, 10);
    el('paKrijo').onclick = async function () {
      try {
        var r = await thirr('', 'POST', { emri: el('paEmri').value, domaini: el('paDom').value, aktiv_deri: el('paDeri').value, ditore: el('paDitore').value, zona: el('paZona').value, shenim: el('paShenim').value });
        PA.kodiRi = { kodi: r.kodi, lidhja: r.lidhja, id: r.id }; PA.id = r.id; faqja();
      } catch (x) { el('paKodi').innerHTML = '<p class="pxpa-jo small">' + e(x.message) + '</p>'; }
    };
    if (PA.kodiRi) el('paKodi').innerHTML = kodiHtml(PA.kodiRi);
    lista();
  }
  function kodiHtml(k) {
    return '<div style="margin-top:12px"><div class="small pxpa-gri">Ruaje tani: kodi shfaqet vetëm një herë.</div><div class="pxpa-kod">' + e(k.kodi) + '</div>' +
      '<div class="small">Lidhja për klientin: <a href="' + e(k.lidhja) + '" target="_blank" rel="noopener">' + e(k.lidhja) + '</a></div></div>';
  }

  async function lista() {
    var w = el('paLista'); if (!w) return;
    var d; try { d = await thirr(''); } catch (x) { w.innerHTML = '<p class="pxpa-jo small">' + e(x.message) + '</p>'; return; }
    if (!d.klientet.length) { w.innerHTML = '<p class="small mut">Ende asnjë klient.</p>'; el('paDetaje').innerHTML = ''; return; }
    var sot = new Date().toISOString().slice(0, 10);
    w.innerHTML = '<div class="pxpa-tbl" style="max-height:300px"><table><thead><tr><th>Klienti</th><th>Email dërgues</th><th>Email-i</th><th>Aktiv deri</th><th>Planifikuar</th><th>Dërguar</th><th>Hapur</th><th>Klikuar</th><th>Hyrja e fundit</th><th></th></tr></thead><tbody>' +
      d.klientet.map(function (k) {
        var aktiv = k.aktiv && (!k.aktiv_deri || k.aktiv_deri >= sot);
        return '<tr' + (k.id === PA.id ? ' class="on"' : '') + '><td><b>' + e(k.emri || '(pa emër)') + '</b><div class="pxpa-nen">' + e(k.domaini || '—') + ' · kodi …' + e(k.kodi_fundi || '') + (k.shenim ? ' · ' + e(k.shenim) : '') + '</div></td>' +
          '<td>' + (k.derguesi ? e(k.derguesi) + (k.derguesi_gabimi ? '<div class="pxpa-jo pxpa-nen">' + e(k.derguesi_gabimi) + '</div>' : '') : '<span class="pxpa-gri">pa lidhur</span>') + '</td>' +
          '<td>' + (k.ka_email ? '<span class="pxpa-ok">gati</span>' : '<span class="pxpa-gri">mungon</span>') + '</td>' +
          '<td>' + (aktiv ? '<span class="pxpa-ok">' : '<span class="pxpa-jo">') + e(k.aktiv_deri || 'pa afat') + (k.aktiv ? '' : ' · ndalur') + '</span></td>' +
          '<td>' + nr(k.planifikuar) + '</td><td>' + nr(k.derguar) + '</td><td>' + nr(k.hapur) + '</td><td>' + nr(k.klikuar) + '</td><td class="pxpa-nen">' + e(koha(k.hyrje_fundit)) + '</td>' +
          '<td><button class="pxad-btn" data-hap="' + k.id + '">Hap</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    w.querySelectorAll('[data-hap]').forEach(function (b) { b.onclick = function () { PA.id = Number(b.getAttribute('data-hap')); PA.zgjedhur = {}; PA.kategorite = {}; PA.faqe = 0; PA.mesazhOrari = ''; lista(); }; });
    if (PA.id && d.klientet.some(function (k) { return k.id === PA.id; })) detajet(); else el('paDetaje').innerHTML = '';
  }

  async function detajet() {
    var w = el('paDetaje'); if (!w || !PA.id) return;
    var d; try { d = await thirr('/' + PA.id); } catch (x) { w.innerHTML = '<p class="pxpa-jo small">' + e(x.message) + '</p>'; return; }
    var k = d.klienti, em = d.emaili || {}, t = d.totalet || {}, st = k.studimi || {};
    var propozuara = (st.kategorite || []);
    if (!Object.keys(PA.kategorite).length) propozuara.forEach(function (x) { PA.kategorite[x] = true; });
    w.innerHTML =
      '<div class="pxpa-k"><h3>' + e(k.emri || '(pa emër)') + ' <span class="pxpa-nen">' + e(k.domaini || '') + '</span></h3><div class="pxpa-rr">' +
      '<input id="pdEmri" value="' + e(k.emri || '') + '" placeholder="Emri"><input id="pdDom" value="' + e(k.domaini || '') + '" placeholder="domaini.com">' +
      '<label class="small"><input type="checkbox" id="pdAktiv"' + (k.aktiv ? ' checked' : '') + '> Aktiv</label>' +
      '<label class="small">Aktiv deri <input type="date" id="pdDeri" value="' + e(k.aktiv_deri || '') + '"></label>' +
      '<label class="small">Në ditë <input type="number" id="pdDitore" value="' + e(k.ditore) + '" min="1" max="50" style="width:70px"></label>' +
      '<select id="pdZona">' + ZONAT.map(function (z) { return '<option' + (z === k.zona ? ' selected' : '') + '>' + z + '</option>'; }).join('') + '</select>' +
      '<input id="pdShenim" value="' + e(k.shenim || '') + '" placeholder="Shënim" style="min-width:200px">' +
      '<button class="pxad-btn on" id="pdRuaj">Ruaj</button><button class="pxad-btn" id="pdKodi">Gjenero kod të ri</button>' +
      '<button class="pxad-btn" id="pdFshi">' + (PA.fshi === k.id ? 'Kliko sërish për ta fshirë' : 'Fshi klientin') + '</button></div>' +
      '<div class="pxpa-nen" style="margin-top:8px">' + (k.aktivTani ? '<span class="pxpa-ok">Dërgimet janë aktive</span>' : '<span class="pxpa-jo">Dërgimet janë të ndalura (jo aktiv ose afati ka mbaruar)</span>') +
      ' · Email dërgues: ' + (d.derguesi ? e(d.derguesi.email) + (d.derguesi.gabimi ? ' <span class="pxpa-jo">(' + e(d.derguesi.gabimi) + ')</span>' : '') : '<span class="pxpa-gri">pa lidhur</span>') +
      ' · Planifikuar ' + nr(t.planifikuar) + ' · Dërguar ' + nr(t.derguar) + ' · Hapur ' + nr(t.hapur) + ' · Klikuar ' + nr(t.klikuar) + ' · Çregjistruar ' + nr(t.cregj) + '</div>' +
      '<p class="small" id="pdMs"></p>' + (PA.kodiRi && PA.kodiRi.id === k.id ? kodiHtml(PA.kodiRi) : '') + '</div>' +

      '<div class="pxpa-dy"><div class="pxpa-k"><h3>Email-i i klientit</h3>' +
      (em.perditesuar_at ? '<div class="pxpa-nen" style="margin-bottom:6px">Ruajtur ' + e(koha(em.perditesuar_at)) + ' nga ' + (em.nga === 'admin' ? 'ti' : 'klienti') + '</div>' : '<div class="pxpa-gri small" style="margin-bottom:6px">Klienti ende s\'e ka shkruar. Mund ta shkruash ti.</div>') +
      '<div class="pxpa-rr" style="margin-bottom:6px"><input id="peSub" value="' + e(em.subjekti || '') + '" placeholder="Subjekti" style="flex:1"><input id="peMarka" value="' + e(em.marka || k.emri || '') + '" placeholder="Nënshkrimi"></div>' +
      '<textarea id="peTrupi" placeholder="Mesazhi ({company} = emri i marrësit)">' + e(em.trupi || '') + '</textarea>' +
      '<div class="pxpa-rr" style="margin-top:8px"><button class="pxad-btn on" id="peRuaj">Ruaj email-in</button><span class="small" id="peMs"></span></div></div>' +
      '<div class="pxpa-k"><h3>Parapamja</h3>' + (d.parapamje ? '<iframe class="pxpa-prev" id="peFrame" sandbox title="Parapamja"></iframe>' : '<p class="small mut">Pa email ende.</p>') + '</div></div>' +

      '<div class="pxpa-k"><h3>Marrësit</h3>' +
      '<div class="pxpa-rr" style="margin-bottom:8px"><button class="pxad-btn" id="pmAI">✦ Propozo kategoritë me AI</button>' +
      (st.pershkrimi ? '<span class="small mut" style="max-width:700px">' + e(st.pershkrimi) + '</span>' : '<span class="small mut">AI studion faqen e klientit dhe zgjedh kategoritë që i përshtaten.</span>') + '</div>' +
      '<div class="pxpa-kat" id="pmKat">' + d.kategorite.map(function (x) {
        return '<label' + (propozuara.indexOf(x.v) >= 0 ? ' class="ai" title="Propozuar nga AI"' : '') + '><input type="checkbox" data-kat="' + e(x.v) + '"' + (PA.kategorite[x.v] ? ' checked' : '') + '> ' + e(x.v) + ' <span class="pxpa-nen">' + nr(x.n) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="pxpa-rr" style="margin:10px 0"><select id="pmLloji"><option value="">B2B dhe B2C</option><option value="b2b"' + (PA.filtri.lloji === 'b2b' ? ' selected' : '') + '>Vetëm B2B</option><option value="b2c"' + (PA.filtri.lloji === 'b2c' ? ' selected' : '') + '>Vetëm B2C</option></select>' +
      '<input id="pmVendi" maxlength="2" placeholder="Shteti (p.sh. US)" value="' + e(PA.filtri.vendi) + '" style="width:130px;text-transform:uppercase">' +
      '<button class="pxad-btn on" id="pmShfaq">Shfaq bizneset</button><span class="small mut">Nuk shfaqen ata që ky klient i ka kontaktuar, as ata në "mos më kontakto".</span></div>' +
      '<div id="pmLista"></div>' +
      '<div class="pxpa-rr" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><b class="small">Orari:</b>' +
      '<label class="small">Nga data <input type="date" id="poNga" value="' + new Date().toISOString().slice(0, 10) + '"></label>' +
      '<label class="small">Në ditë <input type="number" id="poNeDite" value="' + e(k.ditore) + '" min="1" max="' + e(k.ditore) + '" style="width:70px"></label>' +
      '<label class="small">Ora <input type="number" id="poOraNga" value="9" min="0" max="23" style="width:60px"> – <input type="number" id="poOraDeri" value="17" min="1" max="24" style="width:60px"></label>' +
      '<select id="poZona">' + ZONAT.map(function (z) { return '<option' + (z === k.zona ? ' selected' : '') + '>' + z + '</option>'; }).join('') + '</select>' +
      '<label class="small"><input type="checkbox" id="poFundjave" checked> Pa të shtunë/të diel</label>' +
      '<button class="pxad-btn on" id="poPlanifiko">Planifiko të zgjedhurat (' + Object.keys(PA.zgjedhur).length + ')</button></div><p class="small" id="poMs">' + (PA.mesazhOrari ? '<span class="pxpa-ok">' + e(PA.mesazhOrari) + '</span>' : '') + '</p></div>' +

      '<div class="pxpa-k"><h3>Dërgimet</h3><div class="pxpa-rr" style="margin-bottom:8px"><button class="pxad-btn" id="pdAnulo">Anulo të gjitha që janë në radhë</button><span class="small" id="pdAnMs"></span></div>' +
      (d.dergimet.length ? '<div class="pxpa-tbl"><table><thead><tr><th>Ora</th><th>Marrësi</th><th>Kategoria</th><th>Statusi</th><th>Hapur</th><th>Klikime</th><th></th></tr></thead><tbody>' +
        d.dergimet.map(function (x) {
          var s = { ne_radhe: '<span class="pxpa-gri">në radhë</span>', duke: '<span class="pxpa-gri">duke dërguar</span>', derguar: '<span class="pxpa-ok">dërguar</span>', deshtoi: '<span class="pxpa-jo">dështoi</span>' }[x.statusi] || e(x.statusi);
          return '<tr><td>' + e(koha(x.derguar_at || x.ora)) + '</td><td>' + e(x.marres_email) + '<div class="pxpa-nen">' + e(x.marres_domaini || '') + '</div></td><td>' + e(x.marres_kategoria || '') + '</td>' +
            '<td>' + s + (x.gabimi ? '<div class="pxpa-nen pxpa-jo">' + e(x.gabimi) + '</div>' : '') + (x.cregj_at ? '<div class="pxpa-nen">u çregjistrua</div>' : '') + '</td>' +
            '<td>' + (x.hapur_at ? '<span class="pxpa-ok">po (' + x.hapje + ')</span>' : '—') + '</td><td>' + (x.klikime || '—') + '</td>' +
            '<td>' + (x.statusi === 'ne_radhe' ? '<button class="pxad-btn" data-anulo="' + x.id + '">Anulo</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="small mut">Ende asnjë email i planifikuar.</p>') + '</div>';

    if (d.parapamje) el('peFrame').srcdoc = d.parapamje;
    var msg = function (id, t, ok) { var m = el(id); if (m) m.innerHTML = '<span class="' + (ok ? 'pxpa-ok' : 'pxpa-jo') + '">' + e(t) + '</span>'; };
    el('pdRuaj').onclick = async function () {
      try { await thirr('/' + k.id, 'POST', { emri: el('pdEmri').value, domaini: el('pdDom').value, aktiv: el('pdAktiv').checked, aktiv_deri: el('pdDeri').value, ditore: el('pdDitore').value, zona: el('pdZona').value, shenim: el('pdShenim').value }); lista(); }
      catch (x) { msg('pdMs', x.message); }
    };
    el('pdKodi').onclick = async function () {
      try { var r = await thirr('/' + k.id + '/kodi', 'POST', {}); PA.kodiRi = { kodi: r.kodi, lidhja: r.lidhja, id: k.id }; detajet(); } catch (x) { msg('pdMs', x.message); }
    };
    el('pdFshi').onclick = async function () {
      if (PA.fshi !== k.id) { PA.fshi = k.id; detajet(); setTimeout(function () { if (PA.fshi === k.id) { PA.fshi = null; detajet(); } }, 4000); return; }
      PA.fshi = null; try { await thirr('/' + k.id, 'DELETE'); PA.id = null; lista(); } catch (x) { msg('pdMs', x.message); }
    };
    el('peRuaj').onclick = async function () {
      try {
        var r = await thirr('/' + k.id + '/email', 'POST', { subjekti: el('peSub').value, trupi: el('peTrupi').value, marka: el('peMarka').value, dizajn: em.dizajn || {} });
        msg('peMs', r.paralajmerime && r.paralajmerime.length ? 'U ruajt. Kujdes: ' + r.paralajmerime.join('; ') : 'U ruajt.', !(r.paralajmerime && r.paralajmerime.length)); setTimeout(detajet, 900);
      } catch (x) { msg('peMs', x.message); }
    };
    el('pmAI').onclick = async function () {
      var b = this; b.disabled = true; b.textContent = 'AI po studion… (rreth 1 minutë)';
      try { var r = await thirr('/' + k.id + '/studio', 'POST', {}); PA.kategorite = {}; (r.kategorite || []).forEach(function (x) { PA.kategorite[x] = true; }); detajet(); }
      catch (x) { b.disabled = false; b.textContent = '✦ Propozo kategoritë me AI'; alertKat(x.message); }
    };
    function alertKat(t) { el('pmLista').innerHTML = '<p class="pxpa-jo small">' + e(t) + '</p>'; }
    w.querySelectorAll('[data-kat]').forEach(function (c) { c.onchange = function () { var v = c.getAttribute('data-kat'); if (c.checked) PA.kategorite[v] = true; else delete PA.kategorite[v]; }; });
    el('pmLloji').onchange = function () { PA.filtri.lloji = this.value; };
    el('pmVendi').onchange = function () { PA.filtri.vendi = this.value.trim().toUpperCase(); };
    el('pmShfaq').onclick = function () { PA.faqe = 0; PA.mesazhOrari = ''; el('poMs').innerHTML = ''; bizneset(k); };
    el('poPlanifiko').onclick = async function () {
      var ids = Object.keys(PA.zgjedhur);
      if (!ids.length) { msg('poMs', 'Zgjidh të paktën një biznes.'); return; }
      try {
        var r = await thirr('/' + k.id + '/planifiko', 'POST', { marresit: ids, nga: el('poNga').value, neDite: el('poNeDite').value, oraNga: el('poOraNga').value, oraDeri: el('poOraDeri').value, zona: el('poZona').value, paFundjave: el('poFundjave').checked });
        PA.zgjedhur = {}; PA.mesazhOrari = 'U planifikuan ' + r.planifikuar + (r.anashkaluar ? ' (' + r.anashkaluar + ' u anashkaluan: janë kontaktuar ose s\'mund të marrin email)' : '') + (r.ePara ? '. Nga ' + koha(r.ePara) + ' deri ' + koha(r.eFundit) + '.' : '.');
        lista();
      } catch (x) { msg('poMs', x.message); }
    };
    el('pdAnulo').onclick = async function () { try { var r = await thirr('/' + k.id + '/anulo', 'POST', {}); await detajet(); msg('pdAnMs', 'U anuluan ' + r.anuluar + '.', true); } catch (x) { msg('pdAnMs', x.message); } };
    w.querySelectorAll('[data-anulo]').forEach(function (b) { b.onclick = async function () { try { await thirr('/' + k.id + '/anulo', 'POST', { dergimi: b.getAttribute('data-anulo') }); detajet(); } catch (x) {} }; });
  }

  async function bizneset(k) {
    var w = el('pmLista'); if (!w) return;
    var q = new URLSearchParams({ kategorite: Object.keys(PA.kategorite).join('|'), lloji: PA.filtri.lloji, vendi: PA.filtri.vendi, faqe: PA.faqe });
    w.innerHTML = '<p class="small mut">Po ngarkoj…</p>';
    var d; try { d = await thirr('/' + k.id + '/bizneset?' + q.toString()); } catch (x) { w.innerHTML = '<p class="pxpa-jo small">' + e(x.message) + '</p>'; return; }
    var faqet = Math.max(1, Math.ceil(d.total / 200));
    var numri = function () { var b = el('poPlanifiko'); if (b) b.textContent = 'Planifiko të zgjedhurat (' + Object.keys(PA.zgjedhur).length + ')'; };
    w.innerHTML = '<div class="pxpa-rr" style="margin-bottom:6px"><span class="small">' + nr(d.total) + ' biznese · faqja ' + (PA.faqe + 1) + ' nga ' + faqet + '</span>' +
      '<button class="pxad-btn" id="pbMb"' + (PA.faqe ? '' : ' disabled') + '>‹</button><button class="pxad-btn" id="pbPa"' + (PA.faqe + 1 < faqet ? '' : ' disabled') + '>›</button>' +
      '<button class="pxad-btn" id="pbFaqja">Zgjidh këtë faqe</button><button class="pxad-btn" id="pbAsnje">Hiq të gjitha</button></div>' +
      '<div class="pxpa-tbl"><table><thead><tr><th></th><th>Biznesi</th><th>Email</th><th>Kategoria</th><th>Shteti</th><th>Lloji</th><th>Përshkrimi</th></tr></thead><tbody>' +
      d.bizneset.map(function (x) {
        return '<tr><td><input type="checkbox" data-b="' + x.id + '"' + (PA.zgjedhur[x.id] ? ' checked' : '') + '></td><td><b>' + e(x.emri || '') + '</b><div class="pxpa-nen">' + e(x.domaini) + '</div></td><td>' + e(x.email) + '</td>' +
          '<td>' + e(x.kategoria || '') + '</td><td>' + e(x.vendi || '') + '</td><td>' + e(x.lloji || '') + '</td><td class="pxpa-nen" style="max-width:380px">' + e(x.pershkrimi || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    w.querySelectorAll('[data-b]').forEach(function (c) { c.onchange = function () { var id = c.getAttribute('data-b'); if (c.checked) PA.zgjedhur[id] = true; else delete PA.zgjedhur[id]; numri(); }; });
    el('pbFaqja').onclick = function () { w.querySelectorAll('[data-b]').forEach(function (c) { c.checked = true; PA.zgjedhur[c.getAttribute('data-b')] = true; }); numri(); };
    el('pbAsnje').onclick = function () { PA.zgjedhur = {}; w.querySelectorAll('[data-b]').forEach(function (c) { c.checked = false; }); numri(); };
    el('pbMb').onclick = function () { if (PA.faqe) { PA.faqe--; bizneset(k); } };
    el('pbPa').onclick = function () { PA.faqe++; bizneset(k); };
  }
})();
