// pxse-admin.js (PhronexusAI) — seksioni "Shërbimet falas" ne admin.html: menuja Email-et dhe menuja Sinjalet (analitika).
// admin.html e thërret: if(curSec==='pxse'){ pxseRenderAdmin(c); return; }
// Te dhenat vijne nga pxse-admin-analitika.js (/api/admin/pxse/analitika/...). I vetmi emer global: window.pxseRenderAdmin.
(function () {
  'use strict';
  var CSS = [
    '.pxad-wrap{max-width:1280px}',
    '.pxad-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:4px 0 16px}',
    '.pxad-toolbar input[type=date]{width:auto;margin:0;padding:7px 10px;background:#0e1116;border:1px solid var(--line);border-radius:8px;color:var(--txt);font-family:inherit}',
    '.pxad-btn{padding:7px 12px;border-radius:8px;border:1px solid var(--line);background:#0e1116;color:var(--txt);cursor:pointer;font-size:13px;font-family:inherit}',
    '.pxad-btn.on{background:#3b82f6;border-color:#3b82f6;color:#fff}',
    '.pxad-ndare{display:inline-flex;gap:4px;margin-left:8px;padding-left:12px;border-left:1px solid var(--line)}',
    '.pxad-tbl{border:1px solid var(--line);border-radius:10px;overflow:auto;max-height:440px}',
    '.pxad-tbl table{width:100%;border-collapse:collapse;font-size:13px;min-width:1080px}',
    '.pxad-tbl th{position:sticky;top:0;background:#161b22;color:#8b949e;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-align:right;padding:10px;border-bottom:1px solid var(--line);white-space:normal;vertical-align:bottom}',
    '.pxad-tbl th:first-child,.pxad-tbl td:first-child{text-align:left;white-space:nowrap}',
    '.pxad-tbl td{padding:9px 10px;border-bottom:1px solid #1c2230;text-align:right;font-variant-numeric:tabular-nums}',
    '.pxad-tbl tr.pxad-tot td{font-weight:700;background:#0e1116;position:sticky;bottom:0;border-top:1px solid var(--line)}',
    '.pxad-tbl td.pxad-zero{color:#4b5563}',
    '.pxad-titull{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:22px 0 10px}',
    '.pxad-kubat{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0 22px}',
    '.pxad-kub{background:#0e1116;border:1px solid var(--line);border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;color:var(--txt);font-family:inherit;transition:.15s}',
    '.pxad-kub:hover{border-color:#3b82f6;background:#131820}',
    '.pxad-kub b{display:block;font-size:26px;color:var(--acc)}',
    '.pxad-kub span{font-size:12px;color:var(--mut)}',
    '.pxad-kub small{display:block;font-size:11px;color:#4b5563;margin-top:6px}',
    '.pxad-kub em{display:block;font-style:normal;font-size:12px;color:#d29922;margin-top:4px}',
    '.pxad-biz{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}',
    '@media (max-width:1400px){.pxad-biz{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '@media (max-width:700px){.pxad-biz{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.pxad-bk{background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:10px;cursor:pointer;min-width:0;text-align:left;color:var(--txt);font-family:inherit}',
    '.pxad-bk:hover{border-color:#3b82f6}',
    '.pxad-bk .pxad-av{width:32px;height:32px;border-radius:8px;background:#1c2430;color:#7aa2ff;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:8px}',
    '.pxad-bk b,.pxad-bk span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pxad-bk b{font-size:13px}.pxad-bk span{font-size:11px;color:var(--mut);margin-top:2px}',
    '.pxad-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}',
    '.pxad-mk{background:#0d1117;border:1px solid var(--line);border-radius:14px;width:min(900px,100%);max-height:90vh;overflow:auto;padding:18px 20px}',
    '.pxad-mk-koka{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}',
    '.pxad-mk-koka h3{margin:0;font-size:16px}',
    '.pxad-mk h4{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);margin:16px 0 8px}',
    '.pxad-graf{position:relative}',
    '.pxad-graf svg{width:100%;height:auto;display:block}',
    '.pxad-tip{position:absolute;pointer-events:none;background:#161b22;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:12px;white-space:nowrap;transform:translate(-50%,-115%);display:none}',
    '.pxad-rr{display:grid;grid-template-columns:220px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #20262f;font-size:13px}',
    '.pxad-rr span:first-child{color:var(--mut)}',
    '.pxad-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:6px 0 4px}',
    '.pxad-mini div{background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:10px 12px}',
    '.pxad-mini b{display:block;font-size:20px;color:var(--acc)}.pxad-mini span{font-size:12px;color:var(--mut)}',
    '.pxad-lista{width:100%;border-collapse:collapse;font-size:13px}',
    '.pxad-lista th{text-align:left;color:#8b949e;font-size:11px;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid var(--line)}',
    '.pxad-lista td{padding:7px 8px;border-bottom:1px solid #1c2230}',
    '.pxad-lista td.n{text-align:right;font-variant-numeric:tabular-nums}',
    '.pxad-shenim{font-size:12px;color:var(--mut);margin:6px 0 0}',
    '.pxad-provat{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,3fr);gap:12px;margin-bottom:8px}',
    '@media (max-width:900px){.pxad-provat{grid-template-columns:1fr}}',
    '.pxad-panel{border:1px solid var(--line);border-radius:12px;background:#0e1116;display:flex;flex-direction:column;min-width:0}',
    '.pxad-panel-koka{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line);font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em}',
    '.pxad-panel-koka b{color:var(--txt);font-size:14px}',
    '.pxad-rrotull{max-height:380px;overflow-y:auto;padding:6px}',
    '.pxad-pr{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:1px solid transparent;border-radius:9px;padding:9px 10px;color:var(--txt);cursor:pointer;font-family:inherit}',
    '.pxad-pr:hover{background:#131820;border-color:var(--line)}',
    '.pxad-pr-dom{font-weight:600;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}',
    '.pxad-pr-info{font-size:11px;color:var(--mut);white-space:nowrap}',
    '.pxad-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}',
    '.pxad-badge.po{background:#0f2e1c;color:#3fb950;border:1px solid #1f5130}',
    '.pxad-badge.jo{background:#1c2128;color:#8b949e;border:1px solid #30363d}',
    '.pxad-badge.klik{background:#2d2310;color:#d29922;border:1px solid #4a3a16}',
    '.pxad-sk{display:flex;justify-content:space-between;gap:8px;padding:7px 10px;font-size:12px;color:#6e7681;border-bottom:1px solid #161b22}',
    '.pxad-sk span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  ].join('\n');

  // ---------- Email-et ----------
  var KOLONAT_EMAIL = [
    ['derguar', 'Email-e të dërguara'],
    ['klik_x', 'Klikime ✕ (stickeri)'],
    ['klik_hyr', 'Klikime "Sign in"'],
    ['login', 'Login real'],
    ['snippet', 'Snippet i lidhur pas login'],
    ['email_dergues', 'Email dërgues i lidhur pas login'],
    ['rikthim', 'Rikthime (domain i përdorur, dhënë përsëri)'],
    ['hyrje_e_re', 'Hyrje për herë të parë'],
    ['klik_studio', 'Klikime "✦ Write my email with AI"'],
    ['prova', 'Email-e të krijuara me AI (të përfunduara)']
  ];
  var KUBAT_EMAIL = [
    ['hyrje', 'Hyrje në faqe', 'të gjitha hapjet e faqes (të reja + përsëri pas 30 min)'],
    ['hyrje_e_re', 'Hyrje të reja', 'hera e parë e një shfletuesi'],
    ['login', 'Regjistrime / login reale', 'nga seksioni falas (email + sinjale)'],
    ['rikthim', 'Rikthime', 'dhanë përsëri një domain që e kishin përdorur']
  ];
  // ---------- Sinjalet ----------
  var KOLONAT_SJ = [
    ['klik_sinjale', 'Klikime "✦ Try it free: find signals"'],
    ['studim', 'Kërkime me AI të përfunduara'],
    ['rikthim', 'Rikthime (domain i përdorur, dhënë përsëri)'],
    ['klik_hyr', 'Klikime "Sign in"'],
    ['login', 'Login real'],
    ['snippet', 'Snippet i lidhur pas login'],
    ['sinjale_marre', 'Sinjale të marra në provë (40+)'],
    ['klik_postim', 'Sinjale të klikuara ("Open post")'],
    ['hyrje_e_re', 'Hyrje për herë të parë'],
    ['hyrje', 'Hyrje gjithsej']
  ];
  var BURIMET = [
    ['reddit', 'Reddit', true], ['ih', 'Indie Hackers', true], ['hn', 'Hacker News', false], ['se', 'Stack Exchange', false], ['alerts', 'Google Alerts', false]
  ];
  var MUAJT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gus', 'sht', 'tet', 'nën', 'dhj'];
  var EMRAT_NGJ = {
    hyrje_e_re: 'Hyrje për herë të parë në faqe', vizite_perseri: 'Hapi përsëri faqen', rikthim: 'Hapi përsëri faqen',
    klik_x: 'Klikoi ✕ te stickeri', klik_hyr: 'Klikoi "Sign in"', klik_studio: 'Klikoi "✦ Write my email with AI"', klik_sinjale: 'Klikoi "✦ Find signals"',
    klik_postim: 'Hapi një sinjal', login: 'Login / regjistrim', rikthim_domain: 'Dha përsëri domainin e përdorur',
    studim_email: 'AI i shkroi email-in', studim_sinjale: 'AI kërkoi sinjalet', sinjale_marre: 'Mori sinjale', email_planifikuar: 'Planifikoi një email', email_derguar: 'U dërgua një email'
  };

  var gj = { sub: 'email', nga: '', deri: '', tipi: '' };
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sot() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function shtoDite(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function dataBukur(d) { var p = d.split('-'); return Number(p[2]) + ' ' + MUAJT[Number(p[1]) - 1] + ' ' + p[0]; }
  function dataShkurt(d) { var p = d.split('-'); return Number(p[2]) + ' ' + MUAJT[Number(p[1]) - 1]; }
  function koheBukur(t) { var d = new Date(t); return isNaN(d) ? '' : d.toLocaleString('sq-AL', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function el(id) { return document.getElementById(id); }
  function periudhaTekst(d) { return d.nga === d.deri ? dataBukur(d.nga) : dataBukur(d.nga) + ' – ' + dataBukur(d.deri); }

  function stili() {
    if (el('pxad-stili')) return;
    var s = document.createElement('style'); s.id = 'pxad-stili'; s.textContent = CSS; document.head.appendChild(s);
  }

  window.pxseRenderAdmin = function (c) {
    stili();
    if (!gj.nga) { gj.deri = sot(); gj.nga = shtoDite(gj.deri, -6); }
    c.innerHTML = '<div class="appwrap"><aside class="sidebar"><div id="pxadNav"></div></aside><main class="main" id="pxadMain"></main></div>';
    nav(); kryesore();
  };
  function nav() {
    var n = el('pxadNav'); n.innerHTML = '';
    [['email', 'Email-et'], ['sinjale', 'Sinjalet']].forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'subnav' + (gj.sub === x[0] ? ' active' : ''); b.textContent = x[1];
      b.onclick = function () { gj.sub = x[0]; nav(); kryesore(); };
      n.appendChild(b);
    });
  }

  // Kalendari dhe butonat e periudhes (te perbashket per te dyja menute)
  function toolbar(meTipin) {
    var periudha = function (k, l) { return '<button class="pxad-btn" data-p="' + k + '">' + l + '</button>'; };
    var tipi = function (k, l) { return '<button class="pxad-btn' + (gj.tipi === k ? ' on' : '') + '" data-tipi="' + k + '">' + l + '</button>'; };
    return '<div class="pxad-toolbar">' +
      '<label class="small">Nga <input type="date" id="pxadNga" value="' + gj.nga + '"></label>' +
      '<label class="small">Deri <input type="date" id="pxadDeri" value="' + gj.deri + '"></label>' +
      periudha('sot', 'Sot') + periudha('dje', 'Dje') + periudha('7', '7 ditë') + periudha('30', '30 ditë') + periudha('90', '90 ditë') +
      (meTipin ? '<span class="pxad-ndare">' + tipi('b2b', 'B2B') + tipi('b2c', 'B2C') + tipi('', 'Të gjitha') + '</span>' : '') +
      '</div>';
  }
  function lidhToolbar(m, ngarko) {
    el('pxadNga').onchange = function () { gj.nga = this.value || gj.nga; ngarko(); };
    el('pxadDeri').onchange = function () { gj.deri = this.value || gj.deri; ngarko(); };
    m.querySelectorAll('[data-p]').forEach(function (b) {
      b.onclick = function () {
        var p = b.getAttribute('data-p'), s = sot();
        if (p === 'sot') { gj.nga = gj.deri = s; }
        else if (p === 'dje') { gj.nga = gj.deri = shtoDite(s, -1); }
        else { gj.deri = s; gj.nga = shtoDite(s, -(Number(p) - 1)); }
        el('pxadNga').value = gj.nga; el('pxadDeri').value = gj.deri; ngarko();
      };
    });
    m.querySelectorAll('[data-tipi]').forEach(function (b) {
      b.onclick = function () {
        gj.tipi = b.getAttribute('data-tipi');
        m.querySelectorAll('[data-tipi]').forEach(function (x) { x.classList.toggle('on', x === b); });
        ngarko();
      };
    });
  }

  function kryesore() {
    var m = el('pxadMain');
    if (gj.sub === 'sinjale') { faqjaSinjale(m); return; }
    m.innerHTML = '<div class="pxad-wrap"><h2 class="h">Shërbimet falas · Email-et</h2>' +
      '<p class="small" style="margin:2px 0 12px;">Analitika e provës falas të dërgimit të email-eve në faqen publike. Ditët sipas orës së Berlinit. Numërimi i klikimeve dhe i hyrjeve fillon nga dita e publikimit të këtij seksioni.</p>' +
      toolbar(false) +
      '<div id="pxadTabela"><p class="small">Po ngarkoj…</p></div>' +
      '<div class="pxad-kubat" id="pxadKubat"></div>' +
      '<h3 class="pxad-titull">Domainet që përdorën provën falas</h3><div id="pxadProvat"><p class="small">Po ngarkoj…</p></div>' +
      '<h3 class="pxad-titull">Bizneset e regjistruara nga provat e email-eve</h3>' +
      '<div id="pxadBizneset"><p class="small">Po ngarkoj…</p></div></div>';
    lidhToolbar(m, ngarkoEmail);
    ngarkoEmail(); ngarkoProvat('email'); ngarkoBizneset('email');
  }

  function ngarkoEmail() {
    el('pxadTabela').innerHTML = '<p class="small">Po ngarkoj…</p>';
    fetch('/api/admin/pxse/analitika/email?nga=' + gj.nga + '&deri=' + gj.deri).then(function (r) { return r.json(); }).then(function (d) {
      if (!el('pxadTabela')) return;
      if (!d || !d.ok) { el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim gjatë ngarkimit.') + '</p>'; return; }
      gj.nga = d.nga; gj.deri = d.deri;
      el('pxadTabela').innerHTML = tabela(d, KOLONAT_EMAIL) +
        '<p class="pxad-shenim">"Email-e të krijuara me AI": çdo herë që AI e përfundoi email-in; secila përdor provën falas të një domaini (kthimi me të njëjtin domain nuk numërohet, sepse AI nuk punon përsëri). "Snippet i lidhur pas login": llogaritë që erdhën nga prova e email-eve atë ditë dhe sot kanë snippet aktiv (jo të pauzuar). "Email dërgues": shfaqet kur të ndërtohet lidhja e email-it në dashboard.</p>';
      var pt = periudhaTekst(d);
      el('pxadKubat').innerHTML = KUBAT_EMAIL.map(function (k) {
        return '<button class="pxad-kub" data-k="' + k[0] + '"><b>' + (d.kubat[k[0]] || 0) + '</b><span>' + e(k[1]) + '</span><small>' + e(pt) + ' · ' + e(k[2]) + '</small></button>';
      }).join('');
      el('pxadKubat').querySelectorAll('[data-k]').forEach(function (b) {
        b.onclick = function () {
          var k = KUBAT_EMAIL.filter(function (x) { return x[0] === b.getAttribute('data-k'); })[0];
          var m = modal(k[1] + ' · ' + (d.nga === d.deri ? dataBukur(d.nga) + ' (sipas orës)' : pt),
            '<p class="pxad-shenim" style="margin:0 0 10px">Gjithsej: <b style="color:var(--txt)">' + (d.kubat[k[0]] || 0) + '</b> · ' + e(k[2]) + '</p>' + grafikHtml(k[1]));
          lidhGrafikun(m.querySelector('.pxad-graf'), d.seri[k[0]] || [], d.ndarje === 'ora' ? d.nga : null);
        };
      });
    }).catch(function () { if (el('pxadTabela')) el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }

  function qeliza(v, titull) {
    if (v === null || v === undefined) return '<td class="pxad-zero" title="' + e(titull || '') + '">—</td>';
    return '<td' + (v ? '' : ' class="pxad-zero"') + '>' + v + '</td>';
  }
  function tabela(d, kolonat) {
    var rr = d.ditet.slice().reverse(); // dita me e re lart
    return '<div class="pxad-tbl"><table><thead><tr><th>Dita</th>' + kolonat.map(function (k) { return '<th>' + e(k[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rr.map(function (x) {
        return '<tr><td>' + e(dataBukur(x.dita)) + '</td>' + kolonat.map(function (k) { return qeliza(x[k[0]], k[0] === 'email_dergues' ? 'Lidhja e email-it dërgues në dashboard nuk është ndërtuar ende' : ''); }).join('') + '</tr>';
      }).join('') +
      (rr.length > 1 ? '<tr class="pxad-tot"><td>Gjithsej</td>' + kolonat.map(function (k) { return qeliza(d.gjithsej[k[0]], k[0] === 'email_dergues' ? 'Nuk është ndërtuar ende' : ''); }).join('') + '</tr>' : '') +
      '</tbody></table></div>';
  }

  // ---------- Menuja Sinjalet ----------
  function faqjaSinjale(m) {
    m.innerHTML = '<div class="pxad-wrap"><h2 class="h">Shërbimet falas · Sinjalet</h2>' +
      '<p class="small" style="margin:2px 0 12px;">Analitika e kërkimit falas të sinjaleve. B2B/B2C sipas studimit me AI; hyrjet dhe klikimet para kërkimit marrin llojin e kërkimit që bëri më pas i njëjti vizitor (ata që s\'kërkuan dalin vetëm te "Të gjitha"). Ditët sipas orës së Berlinit.</p>' +
      toolbar(true) +
      '<div id="pxadTabela"><p class="small">Po ngarkoj…</p></div>' +
      '<h3 class="pxad-titull">Shërbimet e jashtme që gjetën sinjale</h3>' +
      '<div class="pxad-kubat" id="pxadKubat"></div>' +
      '<h3 class="pxad-titull">Domainet që përdorën provën falas</h3><div id="pxadProvat"><p class="small">Po ngarkoj…</p></div>' +
      '<h3 class="pxad-titull">Bizneset e regjistruara nga Sinjalet</h3>' +
      '<div id="pxadBizneset"><p class="small">Po ngarkoj…</p></div></div>';
    lidhToolbar(m, ngarkoSinjale);
    ngarkoSinjale(); ngarkoProvat('sinjale'); ngarkoBizneset('sinjale');
  }
  function ngarkoSinjale() {
    el('pxadTabela').innerHTML = '<p class="small">Po ngarkoj…</p>';
    fetch('/api/admin/pxse/analitika/sinjale?nga=' + gj.nga + '&deri=' + gj.deri + '&tipi=' + gj.tipi).then(function (r) { return r.json(); }).then(function (d) {
      if (!el('pxadTabela')) return;
      if (!d || !d.ok) { el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim gjatë ngarkimit.') + '</p>'; return; }
      gj.nga = d.nga; gj.deri = d.deri;
      el('pxadTabela').innerHTML = tabela(d, KOLONAT_SJ) +
        '<p class="pxad-shenim">"Sinjale të marra": sa postime me 40+ pikë iu treguan vizitorëve. "Snippet i lidhur": llogaritë që erdhën nga Sinjalet atë ditë dhe sot kanë snippet aktiv (jo të pauzuar).</p>';
      var pt = periudhaTekst(d);
      el('pxadKubat').innerHTML = BURIMET.map(function (b) {
        var x = d.burimet[b[0]] || { rezultate: 0, kredite: 0 };
        var shtese = b[0] === 'alerts' ? '<em>' + d.alertet.lidhur + ' alerte të lidhura (' + d.alertet.b2b + ' B2B · ' + d.alertet.b2c + ' B2C' + (d.alertet.pa_kategori ? ' · ' + d.alertet.pa_kategori + ' pa kategori' : '') + ')</em>'
          : (b[2] ? '<em>' + x.kredite + ' kredite Serper</em>' : '<em>falas</em>');
        return '<button class="pxad-kub" data-b="' + b[0] + '"><b>' + x.rezultate + '</b><span>' + e(b[1]) + ' · sinjale të gjetura</span>' + shtese + '<small>' + e(pt) + (gj.tipi ? ' · ' + gj.tipi.toUpperCase() : '') + '</small></button>';
      }).join('');
      el('pxadKubat').querySelectorAll('[data-b]').forEach(function (btn) {
        btn.onclick = function () { burimModal(btn.getAttribute('data-b'), d); };
      });
    }).catch(function () { if (el('pxadTabela')) el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }
  function burimModal(k, d) {
    var b = BURIMET.filter(function (x) { return x[0] === k; })[0], x = d.burimet[k];
    var pt = periudhaTekst(d) + (gj.tipi ? ' · ' + gj.tipi.toUpperCase() : '');
    var html = '<div class="pxad-mini"><div><b>' + x.rezultate + '</b><span>sinjale të gjetura</span></div>' +
      (b[2] ? '<div><b>' + x.kredite + '</b><span>kredite Serper</span></div>' : '') +
      (k !== 'alerts' ? '<div><b>' + x.kerkime + '</b><span>kërkime</span></div>' : '<div><b>' + x.kerkime + '</b><span>lexime feed-esh me sinjale të reja</span></div>') + '</div>' +
      '<h4>Sinjale të gjetura sipas ditës</h4>' + grafikHtml('Sinjale', 'g1') +
      (b[2] ? '<h4>Kredite Serper sipas ditës</h4>' + grafikHtml('Kredite', 'g2') : '');
    if (k === 'alerts') {
      var a = d.alertet;
      html += '<h4>Alertet e lidhura</h4><div class="pxad-mini"><div><b>' + a.lidhur + '</b><span>gjithsej</span></div><div><b>' + a.b2b + '</b><span>B2B</span></div><div><b>' + a.b2c + '</b><span>B2C</span></div><div><b>' + a.pa_kategori + '</b><span>pa kategori (titulli s\'u gjet te CSV)</span></div></div>' +
        '<h4>Sipas kategorisë së biznesit</h4>' +
        (a.kategorite.length ? '<table class="pxad-lista"><thead><tr><th>Kategoria</th><th>Lloji</th><th style="text-align:right">Alerte</th><th style="text-align:right">Sinjale në periudhë</th></tr></thead><tbody>' +
          a.kategorite.map(function (c) { return '<tr><td>' + e(c.kategoria) + '</td><td>' + e(String(c.lloji || '').toUpperCase()) + '</td><td class="n">' + c.alerte + '</td><td class="n">' + c.sinjale + '</td></tr>'; }).join('') +
          '</tbody></table>' : '<p class="small mut">Ende asnjë alert i lidhur me kategori.</p>');
    }
    var m = modal(b[1] + ' · ' + pt, html);
    var g = m.querySelectorAll('.pxad-graf');
    lidhGrafikun(g[0], x.seri, null);
    if (b[2] && g[1]) lidhGrafikun(g[1], x.seriKredite, null);
  }

  // ---------- Dritarja (modal) ----------
  function modal(titulli, trupi) {
    var v = document.querySelector('.pxad-modal'); if (v) v.remove();
    var m = document.createElement('div'); m.className = 'pxad-modal';
    m.innerHTML = '<div class="pxad-mk" role="dialog" aria-modal="true"><div class="pxad-mk-koka"><h3>' + e(titulli) + '</h3><button class="pxad-btn" data-mbyll>Mbyll</button></div><div class="pxad-mk-trup">' + trupi + '</div></div>';
    document.body.appendChild(m);
    var mbyll = function () { m.remove(); document.removeEventListener('keydown', esc_); };
    var esc_ = function (ev) { if (ev.key === 'Escape') mbyll(); };
    document.addEventListener('keydown', esc_);
    m.addEventListener('click', function (ev) { if (ev.target === m || ev.target.hasAttribute('data-mbyll')) mbyll(); });
    return m;
  }

  // ---------- Grafiku (SVG): vlera sipas dites ose sipas ores; data/ora dhe vlera kur kalon mausi ----------
  var GW = 820, GH = 260, GL = 40, GR = 16, GT = 16, GB = 34;
  function grafikHtml(etiketa) { return '<div class="pxad-graf" data-etiketa="' + e(etiketa) + '"><svg viewBox="0 0 ' + GW + ' ' + GH + '"></svg><div class="pxad-tip"></div></div>'; }
  // ditaOre = data kur seria eshte sipas ores (nje dite), ose null kur eshte sipas dites
  function lidhGrafikun(graf, seri, ditaOre) {
    if (!graf) return;
    seri = seri || [];
    var max = Math.max(1, Math.max.apply(null, seri.map(function (p) { return p.vlera; }).concat([0])));
    var hap = Math.max(1, Math.ceil(max / 4)); max = hap * 4;
    var x = function (i) { return GL + (seri.length > 1 ? i * (GW - GL - GR) / (seri.length - 1) : (GW - GL - GR) / 2); };
    var y = function (v) { return GT + (GH - GT - GB) * (1 - v / max); };
    var rrjeta = '';
    for (var g = 0; g <= 4; g++) { var vv = hap * g; rrjeta += '<line x1="' + GL + '" x2="' + (GW - GR) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="#20262f"/><text x="' + (GL - 6) + '" y="' + (y(vv) + 4) + '" fill="#8b949e" font-size="11" text-anchor="end">' + vv + '</text>'; }
    var cdo = Math.max(1, Math.ceil(seri.length / 10)), etiketa = '';
    seri.forEach(function (p, i) {
      if (i % cdo) return;
      etiketa += '<text x="' + x(i) + '" y="' + (GH - 10) + '" fill="#8b949e" font-size="11" text-anchor="middle">' + (ditaOre ? p.pika + ':00' : dataShkurt(p.pika)) + '</text>';
    });
    var vija = seri.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.vlera).toFixed(1); }).join(' ');
    var zona = seri.length ? 'M' + x(0) + ',' + y(0) + ' L' + vija.split(' ').join(' L') + ' L' + x(seri.length - 1) + ',' + y(0) + ' Z' : '';
    var pikat = seri.map(function (p, i) { return '<circle cx="' + x(i) + '" cy="' + y(p.vlera) + '" r="4" fill="#3b82f6" stroke="#0d1117" stroke-width="2"/><rect x="' + (x(i) - 12) + '" y="' + GT + '" width="24" height="' + (GH - GT - GB) + '" fill="transparent" data-i="' + i + '"/>'; }).join('');
    var s = graf.querySelector('svg'), tip = graf.querySelector('.pxad-tip');
    s.setAttribute('aria-label', graf.getAttribute('data-etiketa') || '');
    s.innerHTML = rrjeta + '<path d="' + zona + '" fill="#3b82f622"/><polyline points="' + vija + '" fill="none" stroke="#3b82f6" stroke-width="2"/>' + etiketa + pikat;
    s.addEventListener('mousemove', function (ev) {
      var t = ev.target.getAttribute && ev.target.getAttribute('data-i'); if (t === null || t === undefined) return;
      var i = Number(t), p = seri[i]; if (!p) return;
      var kur = ditaOre ? dataBukur(ditaOre) + ', ora ' + p.pika + ':00–' + p.pika + ':59' : dataBukur(p.pika);
      tip.innerHTML = '<b>' + p.vlera + '</b> · ' + e(kur);
      var r = s.getBoundingClientRect(), shk = r.width / GW;
      tip.style.left = (x(i) * shk) + 'px'; tip.style.top = (y(p.vlera) * shk) + 'px'; tip.style.display = 'block';
      // afer skajeve tooltip-i zhvendoset brenda grafikut, qe te mos pritet
      tip.style.transform = i > seri.length * 0.75 ? 'translate(-100%,-115%)' : (i < seri.length * 0.15 ? 'translate(0,-115%)' : 'translate(-50%,-115%)');
    });
    s.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  }

  // ---------- Provat falas: aktive (majtas) dhe te skaduara (djathtas) ----------
  var EMRAT_BURIMEVE = { reddit: 'Reddit', ih: 'Indie Hackers', hn: 'Hacker News', se: 'Stack Exchange', alerts: 'Google Alerts', '?': 'Të tjera' };
  function koheMbetur(iso) {
    var ms = new Date(iso).getTime() - Date.now();
    if (!(ms > 0)) return 'po fshihet';
    var d = Math.floor(ms / 86400000), o = Math.floor((ms % 86400000) / 3600000);
    return d ? d + ' ditë ' + o + ' orë' : (o ? o + ' orë' : 'më pak se 1 orë');
  }
  function ngarkoProvat(sherbimi) {
    fetch('/api/admin/pxse/analitika/provat?sherbimi=' + sherbimi).then(function (r) { return r.json(); }).then(function (d) {
      var w = el('pxadProvat'); if (!w) return;
      if (!d || !d.ok) { w.innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim.') + '</p>'; return; }
      var aktive = d.aktive.map(function (x, i) {
        var badge = x.loguar ? '<span class="pxad-badge po">Logged in</span>' : (x.klik_hyr ? '<span class="pxad-badge klik">Not logged in · klikoi Sign in</span>' : '<span class="pxad-badge jo">Not logged in</span>');
        var info = sherbimi === 'email' ? (x.email.derguar + '/' + x.email.gjithsej + ' email-e të dërguara') : (x.dhene + ' sinjale · ' + x.klik_postim + ' të hapura');
        return '<button class="pxad-pr" data-i="' + i + '"><span class="pxad-pr-dom">' + e(x.domaini) + '</span>' + badge +
          '<span class="pxad-pr-info">' + e(info) + ' · ' + x.hyrje + ' hyrje · ' + (x.loguar ? 'ruhet (llogari)' : 'fshihet pas ' + koheMbetur(x.fshihet)) + '</span></button>';
      }).join('');
      var skaduara = d.skaduara.map(function (x) { return '<div class="pxad-sk"><span>' + e(x.domaini) + '</span><span>' + e(koheBukur(x.perdorur_at)) + '</span></div>'; }).join('');
      w.innerHTML = '<div class="pxad-provat">' +
        '<div class="pxad-panel"><div class="pxad-panel-koka"><span>Provat aktive (të dhënat ruhen)</span><b>' + d.aktive.length + '</b></div>' +
        '<div class="pxad-rrotull">' + (aktive || '<p class="small mut" style="padding:8px">Asnjë provë aktive.</p>') + '</div></div>' +
        '<div class="pxad-panel"><div class="pxad-panel-koka"><span>Të skaduara (vetëm domaini)</span><b>' + d.skaduara.length + '</b></div>' +
        '<div class="pxad-rrotull">' + (skaduara || '<p class="small mut" style="padding:8px">Asnjë.</p>') + '</div></div>' +
        '</div>';
      w.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { detajetProves(d.aktive[Number(b.getAttribute('data-i'))], sherbimi); }; });
    }).catch(function () { var w = el('pxadProvat'); if (w) w.innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }
  function detajetProves(x, sherbimi) {
    var rr = function (k, v) { return '<div class="pxad-rr"><span>' + e(k) + '</span><span>' + v + '</span></div>'; };
    var html = rr('Domaini', e(x.domaini)) +
      rr('Prova u bë', e(koheBukur(x.krijuar_at))) +
      rr('Login', x.loguar ? 'Po · ' + e((x.biznesi && x.biznesi.emri) || '') + ' · ' + e((x.biznesi && x.biznesi.email) || '') + (x.biznesi && x.biznesi.lidhur_at ? ' · ' + e(koheBukur(x.biznesi.lidhur_at)) : '') : (x.klik_hyr ? 'Jo (klikoi "Sign in" ' + x.klik_hyr + ' herë, por s\'e përfundoi)' : 'Jo')) +
      rr('Fshirja e të dhënave', x.loguar ? 'Nuk fshihen (i lidhur me llogari)' : e(koheBukur(x.fshihet)) + ' · pas ' + e(koheMbetur(x.fshihet)) + ' (mbetet vetëm domaini)') +
      rr('Hyrje në faqe gjithsej', String(x.hyrje)) +
      rr('Rikthime me të njëjtin domain', String(x.rikthime));
    if (sherbimi === 'email') {
      var m = x.email;
      html += '<h4>Email-et</h4><div class="pxad-mini"><div><b>' + m.gjithsej + '</b><span>të planifikuara</span></div><div><b>' + m.derguar + '</b><span>të dërguara</span></div><div><b>' + m.ne_radhe + '</b><span>në radhë</span></div>' +
        '<div><b>' + m.hapur + '</b><span>të hapura</span></div><div><b>' + m.klikuar + '</b><span>të klikuara</span></div><div><b>' + m.cregj + '</b><span>çregjistrime</span></div>' + (m.deshtoi ? '<div><b>' + m.deshtoi + '</b><span>të dështuara</span></div>' : '') + '</div>' +
        (x.subjekti ? rr('Subjekti i shkruar nga AI', e(x.subjekti)) : '');
    } else {
      var b = x.burimet || {}, kl = x.klikime_burimi || {};
      html += rr('Lloji (sipas AI)', e(String(x.lloji || '—').toUpperCase())) +
        '<h4>Sipas burimit</h4><table class="pxad-lista"><thead><tr><th>Burimi</th><th style="text-align:right">Postime të gjetura</th><th style="text-align:right">Sinjale të hapura</th></tr></thead><tbody>' +
        ['reddit', 'ih', 'hn', 'se', 'alerts'].map(function (k) { return '<tr><td>' + EMRAT_BURIMEVE[k] + '</td><td class="n">' + (b[k] || 0) + '</td><td class="n">' + (kl[k] || 0) + '</td></tr>'; }).join('') +
        '</tbody></table>' +
        '<div class="pxad-mini" style="margin-top:12px"><div><b>' + x.gjetur + '</b><span>postime të kontrolluara nga AI</span></div><div><b>' + x.dhene + '</b><span>sinjale të treguara (40+)</span></div><div><b>' + x.klik_postim + '</b><span>sinjale të hapura</span></div>' +
        '<div><b>' + x.statuset.saved + '</b><span>Saved</span></div><div><b>' + x.statuset.replied + '</b><span>Replied</span></div><div><b>' + x.statuset.rejected + '</b><span>Rejected</span></div><div><b>' + x.pergjigje_ai + '/3</b><span>përgjigje me AI</span></div></div>' +
        rr('Kategoritë e Google Alerts', x.alertet_kategorite && x.alertet_kategorite.length ? e(x.alertet_kategorite.join(', ')) : '— (asnjë alert i përshtatshëm)');
    }
    modal(x.domaini, html);
  }

  // ---------- Bizneset ----------
  function ngarkoBizneset(nga) {
    fetch('/api/admin/pxse/analitika/bizneset?nga=' + nga).then(function (r) { return r.json(); }).then(function (d) {
      var w = el('pxadBizneset'); if (!w) return;
      if (!d || !d.ok) { w.innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim.') + '</p>'; return; }
      if (!d.bizneset.length) { w.innerHTML = '<p class="small mut">Ende asnjë biznes i regjistruar nga ' + (nga === 'sinjale' ? 'Sinjalet' : 'provat e email-eve') + '.</p>'; return; }
      w.innerHTML = '<div class="pxad-biz">' + d.bizneset.map(function (b) {
        return '<button class="pxad-bk" data-id="' + b.id + '" title="' + e(b.emri + ' · ' + b.email) + '"><div class="pxad-av">' + e(String(b.emri || '?').charAt(0).toUpperCase()) + '</div><b>' + e(b.emri) + '</b><span>' + e(b.email) + '</span></button>';
      }).join('') + '</div>';
      w.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { detajet(b.getAttribute('data-id')); }; });
    }).catch(function () { var w = el('pxadBizneset'); if (w) w.innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }
  function detajet(id) {
    var m = modal('Biznesi', '<p class="small">Po ngarkoj…</p>');
    fetch('/api/admin/pxse/analitika/biznes/' + encodeURIComponent(id)).then(function (r) { return r.json(); }).then(function (d) {
      var trup = m.querySelector('.pxad-mk-trup'); if (!trup) return;
      if (!d || !d.ok) { trup.innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim.') + '</p>'; return; }
      var b = d.biznesi, n = d.ngjarjet || {}, rr = function (k, v) { return '<div class="pxad-rr"><span>' + e(k) + '</span><span>' + v + '</span></div>'; };
      var derg = (d.dergimet || []).map(function (x) { return x.n + ' ' + ({ ne_radhe: 'në radhë', duke: 'në radhë', derguar: 'të dërguara', deshtoi: 'të dështuara' }[x.statusi] || x.statusi); }).join(', ');
      m.querySelector('h3').textContent = b.emri;
      var ngaSinjalet = (d.provat || []).some(function (p) { return p.nga === 'sinjale'; }), ngaEmail = (d.provat || []).some(function (p) { return p.nga !== 'sinjale'; });
      trup.innerHTML =
        rr('Email', e(b.email)) +
        rr('Llogaria u krijua', e(koheBukur(b.created_at))) +
        (d.provat || []).map(function (p) { return rr('Erdhi nga', e((p.nga === 'sinjale' ? 'Sinjalet' : 'Email-et') + ' · ' + (p.domaini || '—') + ' · ' + koheBukur(p.lidhur_at))); }).join('') +
        (d.tipi ? rr('Lloji (sipas AI)', d.tipi.toUpperCase()) : '') +
        (ngaSinjalet ? rr('Sinjale të marra në provë', String(n.sinjale_marre || 0)) + rr('Sinjale të klikuara', String(n.klik_postim || 0)) + rr('Rikthime me të njëjtin domain', String(n.rikthim_domain || 0)) : '') +
        (ngaEmail ? rr('Email-e të planifikuara / të dërguara në provë', (n.email_planifikuar || 0) + ' / ' + (n.email_derguar || 0)) + rr('Statusi i email-eve (7 ditët e ruajtura)', e(derg || '—')) + rr('Klikime ✕', String(n.klik_x || 0)) : '') +
        rr('Klikime "Sign in"', String(n.klik_hyr || 0)) +
        rr('Snippet', d.snippet ? (d.snippet.aktiv ? 'aktiv' : (d.snippet.numri ? 'i lidhur, por jo aktiv (ose i pauzuar)' : 'nuk është lidhur')) : '—') +
        rr('Në dashboard (email-e të krijuara / aktive, sinjale të reja)', '— <span class="small mut">(plotësohet kur të ndërtohet shërbimi në dashboard)</span>') +
        '<h4>Sipas ditës</h4>' +
        ((d.ditore || []).length ? '<table class="pxad-lista"><thead><tr><th>Dita</th><th style="text-align:right">Hyrje në faqe</th><th style="text-align:right">Sinjale të marra</th><th style="text-align:right">Sinjale të klikuara</th></tr></thead><tbody>' +
          d.ditore.map(function (x) { return '<tr><td>' + e(dataBukur(x.dita)) + '</td><td class="n">' + (x.hyrje || 0) + '</td><td class="n">' + (x.sinjale || 0) + '</td><td class="n">' + (x.klikime || 0) + '</td></tr>'; }).join('') +
          '</tbody></table>' : '<p class="small mut">Pa të dhëna.</p>') +
        '<h4>Aktivitetet e fundit</h4>' +
        ((d.aktivitetet || []).length ? '<table class="pxad-lista"><tbody>' +
          d.aktivitetet.map(function (x) {
            var em = EMRAT_NGJ[x.lloji] || x.lloji;
            var shtes = x.lloji === 'sinjale_marre' ? ' (' + x.n + ')' : (x.burimi ? ' · ' + x.burimi : '') + (x.nga && /klik_hyr|login|rikthim_domain/.test(x.lloji) ? ' · ' + (x.nga === 'sinjale' ? 'Sinjalet' : 'Email-et') : '');
            return '<tr><td style="white-space:nowrap;color:var(--mut)">' + e(koheBukur(x.koha)) + '</td><td>' + e(em + shtes) + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="small mut">Pa aktivitete.</p>');
    }).catch(function () {});
  }
})();
