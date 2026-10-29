// pxse-importi-admin.js (PhronexusAI) — menuja "Importi i domaineve" te "Shërbimet falas" ne admin.html.
// Ngarkohet PAS /js/pxse-admin.js. Nuk ndryshon pxse-admin.js: mbeshtjell window.pxseRenderAdmin dhe shton butonin e menuse.
// Backend: pxse-importi.js (/api/admin/pxse/importi/...). Tekstet jane shqip (vetem admin).
(function () {
  'use strict';
  if (window.__pxseImportiGati) return;
  window.__pxseImportiGati = true;

  var API = '/api/admin/pxse/importi';
  var IM = { aktiv: false, id: null, filtri: {}, faqe: 0, zgjedhur: {}, timer: null, kategorite: [], fshi: null };
  var STATUSET = [['biznes', 'Biznes'], ['jo_biznes', 'Jo biznes'], ['i_paqarte', 'I paqartë']];
  var LLOJET = [['b2b', 'B2B'], ['b2c', 'B2C'], ['both', 'Të dyja']];
  var VENDIMET = { rregull: 'Rregull', vektor: 'Filtri i lirë', ai: 'AI nano', admin: 'Admin' };

  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(id) { return document.getElementById(id); }
  function dek(s) { try { return decodeURIComponent(s); } catch (x) { return String(s || ''); } }
  function nr(n) { return Number(n || 0).toLocaleString('sq-AL'); }
  function data(d) { if (!d) return ''; var t = new Date(d); return isNaN(t) ? '' : t.toLocaleString('sq-AL', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  async function thirr(rruga, metoda, trupi, koka) {
    var o = { method: metoda || 'GET', headers: koka || {} };
    if (trupi !== undefined) { if (typeof trupi === 'string') o.body = trupi; else { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(trupi); } }
    var r = await fetch(API + rruga, o), j = {};
    try { j = await r.json(); } catch (x) {}
    if (!r.ok) throw new Error(j.error || ('Gabim ' + r.status));
    return j;
  }

  function stili() {
    if (el('pxim-stili')) return;
    var s = document.createElement('style'); s.id = 'pxim-stili';
    s.textContent = [
      '.pxim-karte{background:#0e1116;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 16px}',
      '.pxim-karte h3{margin:0 0 8px;font-size:15px}',
      '.pxim-rr{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.pxim-rr select,.pxim-rr input[type=text],.pxim-rr input[type=number]{width:auto;margin:0;padding:6px 8px;background:#0b0e13;border:1px solid var(--line);border-radius:8px;color:var(--txt);font:inherit;font-size:13px}',
      '.pxim-rr input[type=number]{width:150px}',
      '.pxim-shirit{height:6px;background:#1c2230;border-radius:4px;overflow:hidden;min-width:120px}',
      '.pxim-shirit i{display:block;height:100%;background:#3b82f6}',
      '.pxim-tbl{border:1px solid var(--line);border-radius:10px;overflow:auto;max-height:70vh}',
      '.pxim-tbl table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:1300px}',
      '.pxim-tbl th{position:sticky;top:0;background:#161b22;color:#8b949e;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);z-index:1}',
      '.pxim-tbl td{padding:8px;border-bottom:1px solid #1c2230;vertical-align:top}',
      '.pxim-tbl td select,.pxim-tbl td input{margin:0;padding:3px 5px;background:#0b0e13;border:1px solid var(--line);border-radius:6px;color:var(--txt);font:inherit;font-size:12px;width:auto;max-width:170px}',
      '.pxim-tbl td input.pxim-sh{width:44px;text-transform:uppercase}',
      '.pxim-nen{color:var(--mut);font-size:11.5px;margin-top:2px;max-width:420px}',
      '.pxim-ok{color:#3fb950}.pxim-jo{color:#f85149}.pxim-gri{color:#d29922}',
      '.pxim-etik{display:inline-block;font-size:10.5px;padding:1px 6px;border-radius:999px;border:1px solid var(--line);color:var(--mut);margin-left:4px}',
      '.pxim-kubat{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:0 0 14px}',
      '.pxim-kub{background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;text-align:left;color:var(--txt);font:inherit}',
      '.pxim-kub:hover,.pxim-kub.on{border-color:#3b82f6}',
      '.pxim-kub b{display:block;font-size:20px;color:var(--acc)}.pxim-kub span{font-size:11.5px;color:var(--mut)}',
      '.pxim-mesazh{font-size:13px;margin:8px 0 0}',
      '.pxim-tbl a{color:#7aa2ff;text-decoration:none}.pxim-tbl a:hover{text-decoration:underline}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---------- Menuja ----------
  function shtoButonin() {
    var n = el('pxadNav'); if (!n || n.querySelector('[data-pxim]')) return;
    var b = document.createElement('button');
    b.className = 'subnav' + (IM.aktiv ? ' active' : ''); b.textContent = 'Importi i domaineve'; b.setAttribute('data-pxim', '1');
    b.onclick = function () {
      IM.aktiv = true;
      Array.prototype.forEach.call(n.querySelectorAll('.subnav'), function (x) { x.classList.toggle('active', x === b); });
      faqja();
    };
    // butonat e tjere (Email-et, Sinjalet) e mbyllin kete faqe
    Array.prototype.forEach.call(n.querySelectorAll('.subnav:not([data-pxim])'), function (x) {
      x.addEventListener('click', function () { IM.aktiv = false; clearTimeout(IM.timer); }, true);
    });
    n.appendChild(b);
    if (IM.aktiv) { Array.prototype.forEach.call(n.querySelectorAll('.subnav:not([data-pxim])'), function (x) { x.classList.remove('active'); }); }
  }
  if (typeof window.pxseRenderAdmin === 'function') {
    var origjinali = window.pxseRenderAdmin;
    window.pxseRenderAdmin = function (c) {
      var r = origjinali.apply(this, arguments);
      stili();
      var n = el('pxadNav');
      if (n) {
        shtoButonin();
        // pxse-admin.js e rindërton menunë pas çdo klikimi: butoni shtohet përsëri
        new MutationObserver(function () { shtoButonin(); }).observe(n, { childList: true });
      }
      if (IM.aktiv) faqja();
      return r;
    };
  }

  // ---------- Faqja ----------
  function faqja() {
    var m = el('pxadMain'); if (!m) return;
    clearTimeout(IM.timer);
    m.innerHTML = '<div class="pxad-wrap"><h2 class="h">Shërbimet falas · Importi i domaineve</h2>' +
      '<p class="small mut" style="margin:0 0 14px">Ngarko CSV-në e domaineve nga Common Crawl. Serveri merr faqet e arkivuara, nxjerr email-in, përshkrimin, shtetin dhe datën e domainit, ' +
      'dhe i klasifikon me rregulla falas dhe filtrin e lirë. AI nano përdoret vetëm për rastet e paqarta. Asgjë nuk shkon te direktoria e email-eve pa butonin “Kalo në direktori”.</p>' +
      '<div class="pxim-karte"><h3>Ngarko skedarin</h3><div class="pxim-rr"><input type="file" id="piSkedari" accept=".csv,text/csv">' +
      '<button class="pxad-btn on" id="piNgarko">Ngarko dhe nis</button><span class="small mut">Kolonat: domaini, url, warc_filename, warc_record_offset, warc_record_length (pike_saas opsionale)</span></div>' +
      '<p class="pxim-mesazh" id="piMesazh"></p></div>' +
      '<div class="pxim-karte"><h3>Importet</h3><div id="piLista"><p class="small mut">Po ngarkoj…</p></div></div>' +
      '<div id="piDetaje"></div></div>';
    el('piNgarko').onclick = ngarko;
    lista();
  }

  async function ngarko() {
    var f = el('piSkedari').files[0], ms = el('piMesazh');
    if (!f) { ms.innerHTML = '<span class="pxim-jo">Zgjidh një skedar CSV.</span>'; return; }
    ms.textContent = 'Po ngarkoj…'; el('piNgarko').disabled = true;
    try {
      var t = await f.text();
      var j = await thirr('', 'POST', t, { 'Content-Type': 'text/csv', 'X-Emri-Skedarit': encodeURIComponent(f.name).slice(0, 120) });
      ms.innerHTML = '<span class="pxim-ok">U ngarkua: ' + nr(j.total) + ' domaine. Përpunimi nisi në sfond.</span>';
      IM.id = j.id; IM.filtri = {}; IM.faqe = 0; IM.zgjedhur = {};
      el('piSkedari').value = '';
      lista();
    } catch (x) { ms.innerHTML = '<span class="pxim-jo">' + e(x.message) + '</span>'; }
    el('piNgarko').disabled = false;
  }

  async function lista() {
    var w = el('piLista'); if (!w) return;
    var d; try { d = await thirr(''); } catch (x) { w.innerHTML = '<p class="pxim-jo small">' + e(x.message) + '</p>'; return; }
    IM.kategorite = d.kategorite || [];
    if (!d.importet.length) { w.innerHTML = '<p class="small mut">Ende asnjë import.</p>'; el('piDetaje').innerHTML = ''; return; }
    if (!IM.id || !d.importet.some(function (x) { return x.id === IM.id; })) IM.id = d.importet[0].id;
    var gjendja = { duke: '<span class="pxim-gri">Duke punuar</span>', ndalur: '<span class="pxim-jo">Ndalur</span>', gati: '<span class="pxim-ok">Gati</span>' };
    w.innerHTML = '<div class="pxim-tbl" style="max-height:260px"><table style="min-width:900px"><thead><tr><th>Skedari</th><th>Ngarkuar</th><th>Progresi</th><th>Gjendja</th><th>Thirrje AI</th><th></th></tr></thead><tbody>' +
      d.importet.map(function (x) {
        var p = x.total ? Math.round(100 * x.bere / x.total) : 0;
        return '<tr' + (x.id === IM.id ? ' style="background:#131a26"' : '') + '><td>' + e(dek(x.emri || '')) + '</td><td>' + e(data(x.krijuar_at)) + '</td>' +
          '<td><div class="pxim-shirit"><i style="width:' + p + '%"></i></div><div class="pxim-nen">' + nr(x.bere) + ' / ' + nr(x.total) + ' (' + p + '%)' + (x.gabime ? ' · ' + nr(x.gabime) + ' gabime' : '') + '</div></td>' +
          '<td>' + (gjendja[x.gjendja] || e(x.gjendja)) + (x.gabimi ? '<div class="pxim-nen pxim-jo">' + e(x.gabimi) + '</div>' : '') + '</td><td>' + nr(x.ai_thirrje) + '</td>' +
          '<td style="white-space:nowrap"><button class="pxad-btn" data-hap="' + x.id + '">Hap</button> ' +
          (x.gjendja === 'duke' ? '<button class="pxad-btn" data-ndalo="' + x.id + '">Ndalo</button> ' : '<button class="pxad-btn" data-vazhdo="' + x.id + '">' + (x.gjendja === 'gati' ? 'Riprovo gabimet' : 'Vazhdo') + '</button> ') +
          '<button class="pxad-btn" data-fshi="' + x.id + '">' + (IM.fshi === x.id ? 'Kliko sërish për ta fshirë' : 'Fshi') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    w.querySelectorAll('[data-hap]').forEach(function (b) { b.onclick = function () { IM.id = Number(b.getAttribute('data-hap')); IM.filtri = {}; IM.faqe = 0; IM.zgjedhur = {}; lista(); }; });
    w.querySelectorAll('[data-ndalo]').forEach(function (b) { b.onclick = async function () { await thirr('/' + b.getAttribute('data-ndalo') + '/ndalo', 'POST', {}); lista(); }; });
    w.querySelectorAll('[data-vazhdo]').forEach(function (b) { b.onclick = async function () { await thirr('/' + b.getAttribute('data-vazhdo') + '/vazhdo', 'POST', { gabimet: true }); lista(); }; });
    w.querySelectorAll('[data-fshi]').forEach(function (b) {
      b.onclick = async function () {
        var id = Number(b.getAttribute('data-fshi'));
        if (IM.fshi !== id) { IM.fshi = id; lista(); setTimeout(function () { if (IM.fshi === id) { IM.fshi = null; lista(); } }, 4000); return; }
        IM.fshi = null; await thirr('/' + id, 'DELETE'); if (IM.id === id) IM.id = null; lista();
      };
    });
    detajet();
    // Rifreskim kur ka import ne pune
    clearTimeout(IM.timer);
    if (d.importet.some(function (x) { return x.gjendja === 'duke'; })) IM.timer = setTimeout(function () { if (IM.aktiv && el('piLista')) lista(); }, 6000);
  }

  function opsione(lista, vlera, bosh) {
    return (bosh ? '<option value="">' + e(bosh) + '</option>' : '') + lista.map(function (x) {
      var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x;
      return '<option value="' + e(v) + '"' + (String(vlera || '') === String(v) ? ' selected' : '') + '>' + e(l) + '</option>';
    }).join('');
  }

  async function detajet() {
    var w = el('piDetaje'); if (!w || !IM.id) return;
    var q = new URLSearchParams(Object.assign({}, IM.filtri, { faqe: IM.faqe }));
    var d; try { d = await thirr('/' + IM.id + '/rreshtat?' + q.toString()); } catch (x) { w.innerHTML = '<p class="pxim-jo small">' + e(x.message) + '</p>'; return; }
    var t = d.totalet || {}, f = IM.filtri;
    var kub = function (k, v, filtri) {
      var on = filtri && Object.keys(filtri).every(function (z) { return f[z] === filtri[z]; }) && Object.keys(f).length === Object.keys(filtri).length;
      return '<button class="pxim-kub' + (on ? ' on' : '') + '" data-kub=\'' + e(JSON.stringify(filtri || {})) + '\'><b>' + nr(v) + '</b><span>' + e(k) + '</span></button>';
    };
    var faqet = Math.max(1, Math.ceil(d.total / 100));
    w.innerHTML = '<div class="pxim-kubat">' +
      kub('Biznese', t.biznes, { statusi: 'biznes' }) + kub('Jo biznese', t.jo_biznes, { statusi: 'jo_biznes' }) + kub('Të paqarta', t.i_paqarte, { statusi: 'i_paqarte' }) +
      kub('Me email', t.me_email, { email: 'po' }) + kub('Gati për direktori', t.gati, { statusi: 'biznes', email: 'po' }) + kub('Në direktori', t.ne_direktori, { direktori: 'po' }) +
      kub('Vendosur nga AI', t.nga_ai, { vendimi: 'ai' }) + kub('Në pritje', t.pritje, { statusi: 'pritje' }) + kub('Gabime', t.gabim, { statusi: 'gabim' }) + kub('Të gjitha', (t.biznes || 0) + (t.jo_biznes || 0) + (t.i_paqarte || 0) + (t.pritje || 0) + (t.gabim || 0), {}) + '</div>' +
      '<div class="pxim-karte"><div class="pxim-rr">' +
      '<select data-f="statusi">' + opsione(STATUSET.concat([['pritje', 'Në pritje'], ['gabim', 'Gabim']]), f.statusi, 'Statusi: të gjitha') + '</select>' +
      '<select data-f="kategoria">' + opsione(d.kategorite || IM.kategorite, f.kategoria, 'Kategoria: të gjitha') + '</select>' +
      '<select data-f="lloji">' + opsione(LLOJET, f.lloji, 'B2B/B2C: të gjitha') + '</select>' +
      '<select data-f="shteti">' + opsione([['-', 'Pa shtet']].concat((d.shtetet || []).map(function (x) { return [x.shteti, x.shteti + ' (' + x.n + ')']; })), f.shteti, 'Shteti: të gjitha') + '</select>' +
      '<select data-f="email">' + opsione([['po', 'Me email'], ['jo', 'Pa email']], f.email, 'Email: të gjitha') + '</select>' +
      '<select data-f="email_lloji">' + opsione([['personal', 'Personal'], ['i_pergjithshem', 'I përgjithshëm (info@…)']], f.email_lloji, 'Lloji i email-it') + '</select>' +
      '<select data-f="saas">' + opsione([['5', 'SaaS 5'], ['4', 'SaaS 4'], ['3', 'SaaS 3']], f.saas, 'Pikët SaaS') + '</select>' +
      '<select data-f="vendimi">' + opsione([['rregull', 'Rregull'], ['vektor', 'Filtri i lirë'], ['ai', 'AI nano'], ['admin', 'Admin']], f.vendimi, 'Vendosur nga') + '</select>' +
      '<select data-f="direktori">' + opsione([['po', 'Në direktori'], ['jo', 'Jo në direktori']], f.direktori, 'Direktoria') + '</select>' +
      '<input type="number" data-f="vitiNga" placeholder="Domaini nga viti" value="' + e(f.vitiNga || '') + '">' +
      '<input type="number" data-f="vitiDeri" placeholder="deri në vitin" value="' + e(f.vitiDeri || '') + '">' +
      '<input type="text" data-f="kerko" placeholder="Kërko domain, emër, përshkrim" value="' + e(f.kerko || '') + '">' +
      '<select data-f="renditja">' + opsione([['domaini', 'Rendit: domaini'], ['data', 'Rendit: data e domainit'], ['piket', 'Rendit: pikët e biznesit'], ['saas', 'Rendit: pikët SaaS']], f.renditja, 'Rendit: radha e skedarit') + '</select>' +
      '</div><div class="pxim-rr" style="margin-top:10px">' +
      '<button class="pxad-btn on" id="piKaloZgj">Kalo në direktori të zgjedhurat (' + Object.keys(IM.zgjedhur).length + ')</button>' +
      '<button class="pxad-btn" id="piKaloFil">Kalo në direktori të gjitha sipas filtrit</button>' +
      '<span class="small mut">Kalojnë vetëm bizneset me email të domainit dhe MX.</span></div><p class="pxim-mesazh" id="piKaloMs">' + (IM.kaloMs || '') + '</p></div>' +
      '<p class="small mut" style="margin:0 0 6px">' + nr(d.total) + ' rreshta · faqja ' + (IM.faqe + 1) + ' nga ' + faqet + ' ' +
      '<button class="pxad-btn" id="piMbrapa"' + (IM.faqe ? '' : ' disabled') + '>‹</button> <button class="pxad-btn" id="piPara"' + (IM.faqe + 1 < faqet ? '' : ' disabled') + '>›</button></p>' +
      '<div class="pxim-tbl"><table><thead><tr><th><input type="checkbox" id="piTeGjitha"></th><th>Domaini</th><th>Emri · përshkrimi</th><th>Statusi</th><th>Kategoria</th><th>B2B/B2C</th><th>Shteti</th><th>Email</th><th>Domaini nga · ©</th><th>SaaS</th><th>Pikë biznesi</th><th>Vendosur nga</th><th>Direktoria</th></tr></thead><tbody>' +
      (d.rreshtat.length ? d.rreshtat.map(rreshti).join('') : '<tr><td colspan="13" class="small mut">Asnjë rresht me këta filtra.</td></tr>') + '</tbody></table></div>';

    // ngjarjet
    w.querySelectorAll('[data-kub]').forEach(function (b) { b.onclick = function () { IM.filtri = JSON.parse(b.getAttribute('data-kub')); IM.faqe = 0; detajet(); }; });
    w.querySelectorAll('[data-f]').forEach(function (x) {
      var ndrysho = function () { IM.kaloMs = ''; var k = x.getAttribute('data-f'); if (x.value) IM.filtri[k] = x.value; else delete IM.filtri[k]; IM.faqe = 0; detajet(); };
      if (x.tagName === 'INPUT') x.onkeydown = function (ev) { if (ev.key === 'Enter') ndrysho(); }, x.onchange = ndrysho; else x.onchange = ndrysho;
    });
    el('piMbrapa').onclick = function () { if (IM.faqe) { IM.faqe--; detajet(); } };
    el('piPara').onclick = function () { IM.faqe++; detajet(); };
    el('piTeGjitha').onchange = function () {
      var on = this.checked;
      w.querySelectorAll('[data-zgj]').forEach(function (c) { c.checked = on; var id = c.getAttribute('data-zgj'); if (on) IM.zgjedhur[id] = true; else delete IM.zgjedhur[id]; });
      el('piKaloZgj').textContent = 'Kalo në direktori të zgjedhurat (' + Object.keys(IM.zgjedhur).length + ')';
    };
    w.querySelectorAll('[data-zgj]').forEach(function (c) {
      c.onchange = function () { var id = c.getAttribute('data-zgj'); if (c.checked) IM.zgjedhur[id] = true; else delete IM.zgjedhur[id]; el('piKaloZgj').textContent = 'Kalo në direktori të zgjedhurat (' + Object.keys(IM.zgjedhur).length + ')'; };
    });
    w.querySelectorAll('[data-ndr]').forEach(function (x) {
      x.onchange = async function () {
        var b = {}; b[x.getAttribute('data-ndr')] = x.value;
        try { await thirr('/' + IM.id + '/rreshti/' + x.getAttribute('data-id'), 'POST', b); x.style.borderColor = '#3fb950'; }
        catch (er) { x.style.borderColor = '#f85149'; x.title = er.message; }
      };
    });
    var kalo = async function (trupi) {
      var ms = el('piKaloMs'); ms.textContent = 'Po kaloj…';
      try { var j = await thirr('/' + IM.id + '/ne-direktori', 'POST', trupi); IM.kaloMs = '<span class="pxim-ok">U kaluan në direktori: ' + nr(j.kaluan) + '.</span>'; ms.innerHTML = IM.kaloMs; IM.zgjedhur = {}; setTimeout(detajet, 800); }
      catch (er) { ms.innerHTML = '<span class="pxim-jo">' + e(er.message) + '</span>'; }
    };
    el('piKaloZgj').onclick = function () { var ids = Object.keys(IM.zgjedhur); if (!ids.length) { el('piKaloMs').innerHTML = '<span class="pxim-jo">Zgjidh të paktën një rresht.</span>'; return; } kalo({ ids: ids }); };
    el('piKaloFil').onclick = function () { kalo({ filtri: IM.filtri }); };
  }

  function rreshti(x) {
    var st = x.gjendja === 'pritje' ? '<span class="pxim-gri">Në pritje</span>' : x.gjendja === 'gabim' ? '<span class="pxim-jo">Gabim</span><div class="pxim-nen">' + e(x.gabimi) + '</div>' :
      '<select data-ndr="statusi" data-id="' + x.id + '">' + opsione(STATUSET, x.statusi) + '</select>';
    var gati = x.gjendja === 'bere';
    var link = x.url && /^https?:\/\//.test(x.url) ? x.url : 'https://' + x.domaini;
    return '<tr><td><input type="checkbox" data-zgj="' + x.id + '"' + (IM.zgjedhur[x.id] ? ' checked' : '') + '></td>' +
      '<td><a href="' + e(link) + '" target="_blank" rel="noopener noreferrer">' + e(x.domaini) + '</a>' + (x.ishte_ne_direktori ? '<div class="pxim-nen">ishte në direktori</div>' : '') + '</td>' +
      '<td><b>' + e(x.emri || '') + '</b>' + (x.pershkrimi ? '<div class="pxim-nen">' + e(x.pershkrimi) + (x.pershkrimi_ai ? '<span class="pxim-etik">AI</span>' : '') + '</div>' : (x.titulli ? '<div class="pxim-nen">' + e(x.titulli) + '</div>' : '')) + '</td>' +
      '<td>' + st + '</td>' +
      '<td>' + (gati ? '<select data-ndr="kategoria" data-id="' + x.id + '">' + opsione(IM.kategorite, x.kategoria) + '</select>' : '') + '</td>' +
      '<td>' + (gati ? '<select data-ndr="lloji" data-id="' + x.id + '">' + opsione(LLOJET, x.lloji, '—') + '</select>' : '') + '</td>' +
      '<td>' + (gati ? '<input class="pxim-sh" maxlength="2" data-ndr="shteti" data-id="' + x.id + '" value="' + e(x.shteti || '') + '"><div class="pxim-nen">' + e(x.shteti_burimi || '') + '</div>' : '') + '</td>' +
      '<td>' + (x.email ? e(x.email) + '<div class="pxim-nen">' + (x.email_lloji === 'personal' ? 'personal' : 'i përgjithshëm') + ' · ' + (x.ka_mx ? '<span class="pxim-ok">MX ✓</span>' : '<span class="pxim-jo">pa MX</span>') +
        ((x.emailet || []).length > 1 ? ' · +' + ((x.emailet || []).length - 1) + ' të tjerë' : '') + '</div>' : (gati ? '<span class="pxim-nen">—</span>' : '')) + '</td>' +
      '<td>' + e(x.data_domainit ? String(x.data_domainit).slice(0, 10) : '—') + (x.viti_kopi ? '<div class="pxim-nen">© ' + e(x.viti_kopi) + '</div>' : '') + '</td>' +
      '<td>' + e(x.pike_saas == null ? '' : x.pike_saas) + '</td><td>' + e(x.piket_biznes == null ? '' : x.piket_biznes) + '</td>' +
      '<td>' + e(VENDIMET[x.vendimi] || '') + '</td><td>' + (x.ne_direktori ? '<span class="pxim-ok">✓</span>' : '') + '</td></tr>';
  }
})();
