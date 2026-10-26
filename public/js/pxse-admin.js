// pxse-admin.js (PhronexusAI) — seksioni "Shërbimet falas" ne admin.html: menuja Email-et (analitika) dhe Sinjalet (me vone).
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
    '.pxad-tbl{border:1px solid var(--line);border-radius:10px;overflow:auto;max-height:440px}',
    '.pxad-tbl table{width:100%;border-collapse:collapse;font-size:13px;min-width:1080px}',
    '.pxad-tbl th{position:sticky;top:0;background:#161b22;color:#8b949e;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-align:right;padding:10px;border-bottom:1px solid var(--line);white-space:normal;vertical-align:bottom}',
    '.pxad-tbl th:first-child,.pxad-tbl td:first-child{text-align:left;white-space:nowrap}',
    '.pxad-tbl td{padding:9px 10px;border-bottom:1px solid #1c2230;text-align:right;font-variant-numeric:tabular-nums}',
    '.pxad-tbl tr.pxad-tot td{font-weight:700;background:#0e1116;position:sticky;bottom:0;border-top:1px solid var(--line)}',
    '.pxad-tbl td.pxad-zero{color:#4b5563}',
    '.pxad-kubat{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0 22px}',
    '.pxad-kub{background:#0e1116;border:1px solid var(--line);border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;color:var(--txt);font-family:inherit;transition:.15s}',
    '.pxad-kub:hover{border-color:#3b82f6;background:#131820}',
    '.pxad-kub b{display:block;font-size:26px;color:var(--acc)}',
    '.pxad-kub span{font-size:12px;color:var(--mut)}',
    '.pxad-kub small{display:block;font-size:11px;color:#4b5563;margin-top:6px}',
    '.pxad-biz{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}',
    '@media (max-width:1400px){.pxad-biz{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '@media (max-width:700px){.pxad-biz{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.pxad-bk{background:#0e1116;border:1px solid var(--line);border-radius:10px;padding:10px;cursor:pointer;min-width:0;text-align:left;color:var(--txt);font-family:inherit}',
    '.pxad-bk:hover{border-color:#3b82f6}',
    '.pxad-bk .pxad-av{width:32px;height:32px;border-radius:8px;background:#1c2430;color:#7aa2ff;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:8px}',
    '.pxad-bk b,.pxad-bk span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pxad-bk b{font-size:13px}.pxad-bk span{font-size:11px;color:var(--mut);margin-top:2px}',
    '.pxad-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}',
    '.pxad-mk{background:#0d1117;border:1px solid var(--line);border-radius:14px;width:min(860px,100%);max-height:90vh;overflow:auto;padding:18px 20px}',
    '.pxad-mk-koka{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}',
    '.pxad-mk-koka h3{margin:0;font-size:16px}',
    '.pxad-graf{position:relative}',
    '.pxad-graf svg{width:100%;height:auto;display:block}',
    '.pxad-tip{position:absolute;pointer-events:none;background:#161b22;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:12px;white-space:nowrap;transform:translate(-50%,-115%);display:none}',
    '.pxad-rr{display:grid;grid-template-columns:200px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #20262f;font-size:13px}',
    '.pxad-rr span:first-child{color:var(--mut)}',
    '.pxad-shenim{font-size:12px;color:var(--mut);margin:6px 0 0}'
  ].join('\n');

  var KOLONAT = [
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
  var KUBAT = [
    ['hyrje', 'Hyrje në faqe', 'të gjitha hapjet e faqes (të reja + përsëri pas 30 min)'],
    ['hyrje_e_re', 'Hyrje të reja', 'hera e parë e një shfletuesi'],
    ['login', 'Regjistrime / login reale', 'nga seksioni falas (email + sinjale)'],
    ['rikthim', 'Rikthime', 'dhanë përsëri një domain që e kishin përdorur']
  ];
  var MUAJT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gus', 'sht', 'tet', 'nën', 'dhj'];

  var gj = { sub: 'email', nga: '', deri: '', te_dhenat: null };
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sot() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function shtoDite(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function dataBukur(d) { var p = d.split('-'); return Number(p[2]) + ' ' + MUAJT[Number(p[1]) - 1] + ' ' + p[0]; }
  function el(id) { return document.getElementById(id); }

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
  function kryesore() {
    var m = el('pxadMain');
    if (gj.sub === 'sinjale') {
      m.innerHTML = '<h2 class="h">Sinjalet</h2><p class="small" style="margin-top:8px;">Së shpejti. Menuja e Sinjaleve do përshkruhet dhe ndërtohet më vonë.</p>';
      return;
    }
    var periudha = function (k, l) { return '<button class="pxad-btn" data-p="' + k + '">' + l + '</button>'; };
    m.innerHTML = '<div class="pxad-wrap"><h2 class="h">Shërbimet falas · Email-et</h2>' +
      '<p class="small" style="margin:2px 0 12px;">Analitika e provës falas të dërgimit të email-eve në faqen publike. Ditët sipas orës së Berlinit. Numërimi i klikimeve dhe i hyrjeve fillon nga dita e publikimit të këtij seksioni.</p>' +
      '<div class="pxad-toolbar">' +
      '<label class="small">Nga <input type="date" id="pxadNga" value="' + gj.nga + '"></label>' +
      '<label class="small">Deri <input type="date" id="pxadDeri" value="' + gj.deri + '"></label>' +
      periudha('sot', 'Sot') + periudha('dje', 'Dje') + periudha('7', '7 ditë') + periudha('30', '30 ditë') + periudha('90', '90 ditë') +
      '</div>' +
      '<div id="pxadTabela"><p class="small">Po ngarkoj…</p></div>' +
      '<div class="pxad-kubat" id="pxadKubat"></div>' +
      '<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:8px 0 10px;">Bizneset e regjistruara nga shërbimet falas</h3>' +
      '<div id="pxadBizneset"><p class="small">Po ngarkoj…</p></div></div>';
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
    ngarko(); ngarkoBizneset();
  }

  function ngarko() {
    el('pxadTabela').innerHTML = '<p class="small">Po ngarkoj…</p>';
    fetch('/api/admin/pxse/analitika/email?nga=' + gj.nga + '&deri=' + gj.deri).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) { el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim gjatë ngarkimit.') + '</p>'; return; }
      gj.te_dhenat = d; gj.nga = d.nga; gj.deri = d.deri;
      tabela(d); kubat(d);
    }).catch(function () { el('pxadTabela').innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }
  function qeliza(v, titull) {
    if (v === null || v === undefined) return '<td class="pxad-zero" title="' + e(titull || '') + '">—</td>';
    return '<td' + (v ? '' : ' class="pxad-zero"') + '>' + v + '</td>';
  }
  function tabela(d) {
    var rr = d.ditet.slice().reverse(); // dita me e re lart
    var html = '<div class="pxad-tbl"><table><thead><tr><th>Dita</th>' + KOLONAT.map(function (k) { return '<th>' + e(k[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rr.map(function (x) {
        return '<tr><td>' + e(dataBukur(x.dita)) + '</td>' + KOLONAT.map(function (k) { return qeliza(x[k[0]], k[0] === 'email_dergues' ? 'Lidhja e email-it dërgues në dashboard nuk është ndërtuar ende' : ''); }).join('') + '</tr>';
      }).join('') +
      (rr.length > 1 ? '<tr class="pxad-tot"><td>Gjithsej</td>' + KOLONAT.map(function (k) { return qeliza(d.gjithsej[k[0]], k[0] === 'email_dergues' ? 'Nuk është ndërtuar ende' : ''); }).join('') + '</tr>' : '') +
      '</tbody></table></div>' +
      '<p class="pxad-shenim">"Email-e të krijuara me AI": çdo herë që AI e përfundoi email-in; secila përdor provën falas të një domaini (kthimi me të njëjtin domain nuk numërohet, sepse AI nuk punon përsëri). "Snippet i lidhur pas login": llogaritë që erdhën nga prova e email-eve atë ditë dhe sot kanë snippet aktiv (jo të pauzuar). "Email dërgues": shfaqet kur të ndërtohet lidhja e email-it në dashboard.</p>';
    el('pxadTabela').innerHTML = html;
  }
  function kubat(d) {
    var periudha = d.nga === d.deri ? dataBukur(d.nga) : dataBukur(d.nga) + ' – ' + dataBukur(d.deri);
    el('pxadKubat').innerHTML = KUBAT.map(function (k) {
      return '<button class="pxad-kub" data-k="' + k[0] + '"><b>' + (d.kubat[k[0]] || 0) + '</b><span>' + e(k[1]) + '</span><small>' + e(periudha) + ' · ' + e(k[2]) + '</small></button>';
    }).join('');
    el('pxadKubat').querySelectorAll('[data-k]').forEach(function (b) {
      b.onclick = function () { var k = KUBAT.filter(function (x) { return x[0] === b.getAttribute('data-k'); })[0]; grafik(k, d); };
    });
  }

  // ---------- Dritarja (modal) ----------
  function modal(titulli, trupi) {
    var v = document.querySelector('.pxad-modal'); if (v) v.remove();
    var m = document.createElement('div'); m.className = 'pxad-modal';
    m.innerHTML = '<div class="pxad-mk" role="dialog" aria-modal="true"><div class="pxad-mk-koka"><h3>' + e(titulli) + '</h3><button class="pxad-btn" data-mbyll>Mbyll</button></div>' + trupi + '</div>';
    document.body.appendChild(m);
    var mbyll = function () { m.remove(); document.removeEventListener('keydown', esc_); };
    var esc_ = function (ev) { if (ev.key === 'Escape') mbyll(); };
    document.addEventListener('keydown', esc_);
    m.addEventListener('click', function (ev) { if (ev.target === m || ev.target.hasAttribute('data-mbyll')) mbyll(); });
    return m;
  }

  // Grafiku: vleren e kubit sipas dites (ose sipas ores kur eshte zgjedhur nje dite), me date/ore dhe vlere kur kalon mausi
  function grafik(k, d) {
    var seri = d.seri[k[0]] || [], oret = d.ndarje === 'ora';
    var W = 820, H = 280, mL = 40, mR = 16, mT = 16, mB = 34;
    var max = Math.max(1, Math.max.apply(null, seri.map(function (p) { return p.vlera; })));
    var hap = Math.max(1, Math.ceil(max / 4)); max = hap * 4;
    var x = function (i) { return mL + (seri.length > 1 ? i * (W - mL - mR) / (seri.length - 1) : (W - mL - mR) / 2); };
    var y = function (v) { return mT + (H - mT - mB) * (1 - v / max); };
    var rrjeta = '';
    for (var g = 0; g <= 4; g++) { var vv = hap * g; rrjeta += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="#20262f"/><text x="' + (mL - 6) + '" y="' + (y(vv) + 4) + '" fill="#8b949e" font-size="11" text-anchor="end">' + vv + '</text>'; }
    var cdo = Math.max(1, Math.ceil(seri.length / 10)), etiketa = '';
    seri.forEach(function (p, i) {
      if (i % cdo) return;
      var t = oret ? p.pika + ':00' : (function (s) { var q = s.split('-'); return Number(q[2]) + ' ' + MUAJT[Number(q[1]) - 1]; })(p.pika);
      etiketa += '<text x="' + x(i) + '" y="' + (H - 10) + '" fill="#8b949e" font-size="11" text-anchor="middle">' + t + '</text>';
    });
    var vija = seri.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.vlera).toFixed(1); }).join(' ');
    var zona = seri.length ? 'M' + x(0) + ',' + y(0) + ' L' + vija.split(' ').join(' L') + ' L' + x(seri.length - 1) + ',' + y(0) + ' Z' : '';
    var pikat = seri.map(function (p, i) { return '<circle cx="' + x(i) + '" cy="' + y(p.vlera) + '" r="4" fill="#3b82f6" stroke="#0d1117" stroke-width="2" data-i="' + i + '"/><rect x="' + (x(i) - 12) + '" y="' + mT + '" width="24" height="' + (H - mT - mB) + '" fill="transparent" data-i="' + i + '"/>'; }).join('');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(k[1]) + '">' + rrjeta +
      '<path d="' + zona + '" fill="#3b82f622"/><polyline points="' + vija + '" fill="none" stroke="#3b82f6" stroke-width="2"/>' + etiketa + pikat + '</svg>';
    var periudha = d.nga === d.deri ? dataBukur(d.nga) + ' (sipas orës)' : dataBukur(d.nga) + ' – ' + dataBukur(d.deri);
    var m = modal(k[1] + ' · ' + periudha, '<p class="pxad-shenim" style="margin:0 0 10px">Gjithsej: <b style="color:var(--txt)">' + (d.kubat[k[0]] || 0) + '</b> · ' + e(k[2]) + '</p><div class="pxad-graf">' + svg + '<div class="pxad-tip"></div></div>');
    var graf = m.querySelector('.pxad-graf'), tip = m.querySelector('.pxad-tip'), s = m.querySelector('svg');
    var shfaq = function (i) {
      var p = seri[i]; if (!p) return;
      var kur = oret ? dataBukur(d.nga) + ', ora ' + p.pika + ':00–' + p.pika + ':59' : dataBukur(p.pika);
      tip.innerHTML = '<b>' + p.vlera + '</b> · ' + e(kur);
      var r = s.getBoundingClientRect(), shk = r.width / W;
      tip.style.left = (x(i) * shk) + 'px'; tip.style.top = (y(p.vlera) * shk) + 'px'; tip.style.display = 'block';
      // afer skajeve tooltip-i zhvendoset brenda grafikut, qe te mos pritet
      tip.style.transform = i > seri.length * 0.75 ? 'translate(-100%,-115%)' : (i < seri.length * 0.15 ? 'translate(0,-115%)' : 'translate(-50%,-115%)');
    };
    s.addEventListener('mousemove', function (ev) { var t = ev.target.getAttribute && ev.target.getAttribute('data-i'); if (t !== null && t !== undefined) shfaq(Number(t)); });
    s.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    void graf;
  }

  // ---------- Bizneset ----------
  function ngarkoBizneset() {
    fetch('/api/admin/pxse/analitika/bizneset').then(function (r) { return r.json(); }).then(function (d) {
      var w = el('pxadBizneset'); if (!w) return;
      if (!d || !d.ok) { w.innerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim.') + '</p>'; return; }
      if (!d.bizneset.length) { w.innerHTML = '<p class="small mut">Ende asnjë biznes i regjistruar nga shërbimet falas.</p>'; return; }
      w.innerHTML = '<div class="pxad-biz">' + d.bizneset.map(function (b) {
        return '<button class="pxad-bk" data-id="' + b.id + '" title="' + e(b.emri + ' · ' + b.email) + '"><div class="pxad-av">' + e(String(b.emri || '?').charAt(0).toUpperCase()) + '</div><b>' + e(b.emri) + '</b><span>' + e(b.email) + '</span></button>';
      }).join('') + '</div>';
      w.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { detajet(b.getAttribute('data-id')); }; });
    }).catch(function () { var w = el('pxadBizneset'); if (w) w.innerHTML = '<p class="small" style="color:#e5484d;">Gabim gjatë ngarkimit.</p>'; });
  }
  function detajet(id) {
    var m = modal('Biznesi', '<p class="small">Po ngarkoj…</p>');
    fetch('/api/admin/pxse/analitika/biznes/' + encodeURIComponent(id)).then(function (r) { return r.json(); }).then(function (d) {
      var t = m.querySelector('.pxad-mk'); if (!t) return;
      if (!d || !d.ok) { t.lastChild.outerHTML = '<p class="small" style="color:#e5484d;">' + e((d && d.error) || 'Gabim.') + '</p>'; return; }
      var b = d.biznesi, n = d.ngjarjet || {}, rr = function (k, v) { return '<div class="pxad-rr"><span>' + e(k) + '</span><span>' + v + '</span></div>'; };
      var derg = (d.dergimet || []).map(function (x) { return x.n + ' ' + ({ ne_radhe: 'në radhë', duke: 'në radhë', derguar: 'të dërguara', deshtoi: 'të dështuara' }[x.statusi] || x.statusi); }).join(', ');
      t.querySelector('h3').textContent = b.emri;
      t.lastChild.outerHTML = '<div>' +
        rr('Email', e(b.email)) +
        rr('Llogaria u krijua', e(new Date(b.created_at).toLocaleString())) +
        (d.provat || []).map(function (p) { return rr('Erdhi nga', e((p.nga === 'sinjale' ? 'Sinjalet' : 'Email-et') + ' · ' + (p.domaini || '—') + ' · ' + new Date(p.lidhur_at).toLocaleString())); }).join('') +
        rr('Email-e të planifikuara në provë', String(n.email_planifikuar || 0)) +
        rr('Email-e të dërguara në provë', String(n.email_derguar || 0)) +
        rr('Statusi i email-eve (7 ditët e ruajtura)', e(derg || '—')) +
        rr('Klikime ✕ / "Sign in"', (n.klik_x || 0) + ' / ' + (n.klik_hyr || 0)) +
        rr('Snippet', d.snippet ? (d.snippet.aktiv ? 'aktiv' : (d.snippet.numri ? 'i lidhur, por jo aktiv (ose i pauzuar)' : 'nuk është lidhur')) : '—') +
        rr('Email-e të krijuara / aktive (schedule) në dashboard', '— <span class="small mut">(plotësohet kur të ndërtohet shërbimi në dashboard)</span>') +
        '</div>';
    }).catch(function () {});
  }
})();
