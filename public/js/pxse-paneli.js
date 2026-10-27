// pxse-paneli.js (PhronexusAI) — "Find Customers" ne dashboard (pas login): Interest Signals + Email Outreach.
// Ngarkohet PAS core.js, app.js dhe pxse-dizajnet.js (para boot()). Nuk ndryshon asnje skedar ekzistues:
//  - shton menune "Find Customers" (me 2 nenmenu) menjehere pas "Dashboard" te NAV2 (app.js)
//  - mbeshtjell renderMain (faqet e reja), renderNav2 (klikimi i menuse), mainDashboard (seksioni me numrat)
//    dhe stateToUrl/urlToState (adresat /app/find-customers/signals dhe /emails)
// Backend: pxse-llogaria.js (/api/pxse/llogaria/...). Tekstet per klientin jane ne anglisht.
(function () {
  'use strict';
  if (window.__pxsePaneliGati) return;
  window.__pxsePaneliGati = true;

  var PXP_API = '/api/pxse/llogaria';
  var PXP_FAQET = { pxseSinjalet: 'sinjale', pxseEmailet: 'email' };
  var PXP_BURIMET = { reddit: 'Reddit', hn: 'Hacker News', se: 'Stack Exchange', ih: 'Indie Hackers', alerts: 'Google Alerts' };
  var PXP_STATUSET = [['all', 'All'], ['new', 'New'], ['saved', 'Saved'], ['replied', 'Replied'], ['rejected', 'Rejected']];

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pxpNr(n) { return Number(n || 0).toLocaleString('en-US'); }
  function pxpKoha(d) {
    var t = Date.parse(d); if (!t) return '';
    var s = Math.round((Date.now() - t) / 1000);
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    if (s < 86400 * 60) return Math.round(s / 86400) + ' days ago';
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function pxpData(d) { var t = Date.parse(d); return t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }
  async function pxpThirr(rruga, metoda, trupi) {
    var o = { method: metoda || 'GET', headers: {} };
    if (trupi !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(trupi); }
    var r = await fetch(PXP_API + rruga, o), j = {};
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var g = new Error(j.error || 'Try again in a few minutes.'); g.te = j; g.kodi = r.status; throw g; }
    return j;
  }
  function pxpShko(s) { if (typeof nav === 'function') nav(s); }

  // ---------- Stilet (perdorin ndryshoret e dashboard-it: --card, --line, --txt, --acc ...) ----------
  function pxpStilet() {
    if (document.getElementById('pxp-css')) return;
    var st = document.createElement('style'); st.id = 'pxp-css';
    st.textContent = [
      '.pxp{max-width:1180px}',
      '.pxp-koka{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:18px}',
      '.pxp-eyebrow{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--acc2);background:rgba(34,211,238,.1);padding:3px 9px;border-radius:999px;margin-bottom:6px}',
      '.pxp-koka p{margin:4px 0 0;max-width:70ch}',
      '.pxp-tabs{display:flex;gap:4px;background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:4px}',
      '.pxp-tabs button{background:none;border:0;color:var(--mut);padding:8px 14px;border-radius:9px;cursor:pointer;font:600 13px var(--f-body)}',
      '.pxp-tabs button.on{background:var(--card);color:var(--txt);box-shadow:0 1px 2px rgba(0,0,0,.2)}',
      '.pxp-kubet{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px}',
      '.pxp-kub{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}',
      '.pxp-kub b{display:block;font:700 24px var(--f-head);color:var(--txt);line-height:1.1}',
      '.pxp-kub span{font-size:12px;color:var(--mut)}',
      '.pxp-karte{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:14px}',
      '.pxp-karte h3{font:700 16px var(--f-head);margin:0 0 4px;display:flex;align-items:center;gap:8px}',
      '.pxp-hapi{display:inline-flex;width:22px;height:22px;border-radius:50%;background:var(--acc);color:#fff;font:700 12px var(--f-body);align-items:center;justify-content:center}',
      '.pxp-nen{font-size:13px;color:var(--mut);margin:0 0 12px}',
      '.pxp-rresht{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}',
      '.pxp-fushe{display:flex;flex-direction:column;gap:4px;flex:1 1 200px;min-width:0}',
      '.pxp-fushe label{margin:0;font-size:12px}',
      '.pxp input,.pxp select,.pxp textarea{font-size:14px}',
      '.pxp textarea{min-height:200px;line-height:1.55;overflow:hidden;resize:vertical}',
      '.pxp-buton{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 16px;border-radius:10px;border:0;background:var(--grad);color:#fff;font:600 13px var(--f-body);cursor:pointer;white-space:nowrap}',
      '.pxp-buton:disabled{opacity:.5;cursor:default}',
      '.pxp-buton2{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--txt);font:500 13px var(--f-body);cursor:pointer;white-space:nowrap}',
      '.pxp-buton2:hover{border-color:var(--mut2)}',
      '.pxp-gabim{margin-top:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(248,81,73,.45);background:rgba(248,81,73,.1);color:#ff8b84;font-size:13px}',
      '.pxp-ok{margin-top:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(63,185,80,.4);background:rgba(63,185,80,.1);color:#56d364;font-size:13px}',
      '.pxp-info{padding:10px 12px;border-radius:10px;background:var(--card2);border:1px solid var(--line);font-size:13px;color:var(--mut);margin-bottom:14px}',
      '.pxp-info b{color:var(--txt)}',
      '.pxp-cipat{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
      '.pxp-cip{padding:6px 11px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--mut);font:500 12px var(--f-body);cursor:pointer}',
      '.pxp-cip.on{border-color:var(--acc);color:var(--txt);background:rgba(59,110,240,.14)}',
      '.pxp-cip i{font-style:normal;opacity:.7;margin-left:4px}',
      '.pxp-lista{display:grid;grid-template-columns:1fr;gap:12px;align-items:start}',
      '@media(min-width:1100px){.pxp-lista{grid-template-columns:1fr 1fr}}',
      '.pxp-sj{position:relative;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px 52px;cursor:pointer;transition:border-color .15s}',
      '.pxp-sj:hover{border-color:var(--mut2)}',
      '.pxp-sj.rejected{opacity:.55}',
      '.pxp-sj-koka{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--mut);margin-bottom:6px}',
      '.pxp-pike{font:700 12px var(--f-body);padding:2px 8px;border-radius:999px;background:rgba(63,185,80,.15);color:#56d364}',
      '.pxp-pike.mes{background:rgba(245,158,11,.15);color:#fbbf24}',
      '.pxp-sj h4{margin:0 0 6px;font:600 15px var(--f-body);line-height:1.35;color:var(--txt)}',
      '.pxp-sj p{margin:0 0 8px;font-size:13px;color:var(--mut);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}',
      '.pxp-arsye{font-size:12px;color:var(--acc2);margin-bottom:6px}',
      '.pxp-st{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--mut)}',
      '.pxp-veprime{position:absolute;left:12px;bottom:12px;display:flex;flex-wrap:wrap;gap:6px}',
      '.pxp-veprime button{padding:5px 11px;border-radius:999px;border:1px solid var(--line);background:var(--card2);color:var(--txt);font:500 12px var(--f-body);cursor:pointer}',
      '.pxp-veprime button.on{border-color:var(--acc);background:rgba(59,110,240,.18)}',
      '.pxp-veprime button[data-ai]{border-color:rgba(34,211,238,.4);color:var(--acc2)}',
      '.pxp-pergjigje{margin:4px 0 6px;cursor:default}',
      '.pxp-pergjigje textarea{min-height:90px;font-size:13px}',
      '.pxp-pergjigje .pxp-rresht{margin-top:6px}',
      '.pxp-spin{display:inline-block;width:15px;height:15px;border:2px solid var(--line);border-top-color:var(--acc);border-radius:50%;animation:sp .8s linear infinite;vertical-align:middle}',
      '.pxp-dizajnet{display:flex;flex-wrap:wrap;gap:6px}',
      '.pxp-dizajnet button{width:34px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--card2);color:var(--txt);cursor:pointer;font:600 12px var(--f-body)}',
      '.pxp-dizajnet button.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}',
      '.pxp-pamja{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}',
      '.pxp-pamja-koka{background:#f6f7f9;color:#202124;padding:10px 14px;font:13px Arial,sans-serif;border-bottom:1px solid #e3e6ea}',
      '.pxp-pamja iframe{display:block;width:100%;height:520px;border:0;background:#fff}',
      '.pxp-grid2{display:grid;grid-template-columns:1fr;gap:14px}',
      '@media(min-width:1100px){.pxp-grid2{grid-template-columns:1fr 1fr}}',
      '.pxp-biz{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid var(--line2);font-size:13px;cursor:pointer}',
      '.pxp-biz input{width:auto}',
      '.pxp-biz span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pxp-biz small{color:var(--mut2)}',
      '.pxp-bizlista{max-height:360px;overflow-y:auto;border:1px solid var(--line);border-radius:10px;padding:0 8px;margin:8px 0}',
      '.pxp-tab{width:100%;border-collapse:collapse;font-size:13px}',
      '.pxp-tab th{text-align:left;color:var(--mut);font-weight:500;font-size:12px;padding:8px;border-bottom:1px solid var(--line)}',
      '.pxp-tab td{padding:8px;border-bottom:1px solid var(--line2)}',
      '.pxp-tabwrap{overflow-x:auto}',
      '.pxp-mini{font-size:11px;padding:1px 7px;border-radius:999px;background:var(--card2);border:1px solid var(--line);color:var(--mut);margin-left:6px}',
      '.pxp-sticker{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border:1px dashed var(--line);border-radius:10px;font-size:13px;color:var(--mut)}',
      '.pxp-sticker button.x{margin-left:auto;width:26px;height:26px;border-radius:50%;border:1px solid var(--line);background:var(--card2);color:var(--txt);cursor:pointer}',
      '.pxp-njoftim{margin-top:10px;padding:12px 14px;border-radius:10px;border:1px solid rgba(59,110,240,.4);background:rgba(59,110,240,.1);font-size:13px}',
      '.pxp-dash{margin-top:16px}',
      '.pxp-oret{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto}',
      '.pxp-ora-rresht{display:flex;align-items:center;gap:10px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--card2)}',
      '.pxp-ora-rresht input{width:150px;flex:0 0 auto}',
      '.pxp-ora-nr{width:22px;color:var(--mut);font-size:12px}',
      '.pxp-ora-biz{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}',
      '.pxp-kar-lista{max-height:360px;overflow-y:auto;scroll-snap-type:y mandatory;display:flex;flex-direction:column;gap:6px}',
      '.pxp-kar-rresht{scroll-snap-align:start;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card2);min-height:62px}',
      '.pxp-kar-info{flex:1;min-width:0;font-size:13px}',
      '.pxp-kar-info .small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.pxp-k-nr{width:64px;text-align:center}',
      '.pxp-k-nr b{display:block;font:700 18px var(--f-head);color:var(--txt)}',
      '.pxp-k-nr span{font-size:11px;color:var(--mut)}',
      '.pxp-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}',
      '.pxp-modal-kuti{max-width:440px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;color:var(--txt);box-shadow:0 20px 50px rgba(0,0,0,.5)}',
      '.pxp-modal-kuti h3{margin:0 0 8px;font:700 18px var(--f-head)}',
      '.pxp-modal-kuti p{margin:0 0 8px;font-size:14px;color:var(--mut);line-height:1.55}',
      '.pxp-dash-kartat{display:grid;grid-template-columns:1fr;gap:16px}',
      '@media(min-width:900px){.pxp-dash-kartat{grid-template-columns:1fr 1fr}}',
      '.pxp-dash .card{cursor:pointer}',
      '.pxp-dash-nr{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:8px;margin:10px 0 12px}',
      '.pxp-dash-nr div{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 10px}',
      '.pxp-dash-nr b{display:block;font:700 20px var(--f-head);color:var(--txt)}',
      '.pxp-dash-nr span{font-size:11px;color:var(--mut)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // =====================================================================
  //  Korniza e faqes (koka + skedat)
  // =====================================================================
  function pxpKorniza(m, faqja) {
    pxpStilet();
    var s = faqja === 'email';
    m.innerHTML = '<div class="pxp">' +
      '<div class="pxp-koka"><div><span class="pxp-eyebrow">Find Customers</span>' +
      '<h2 class="h">' + (s ? 'Email Outreach' : 'Interest Signals') + '</h2>' +
      '<p class="small">' + (s
        ? 'Email businesses from our directory from your own business email. No contact list needed, no limit, on your schedule. You see who opened and who clicked.'
        : 'People who post questions, requests and complaints online that show real interest in what you sell. AI scores each one and writes a reply you can post yourself.') + '</p></div>' +
      '<div class="pxp-tabs"><button type="button" data-pxp-tab="pxseEmailet"' + (s ? ' class="on"' : '') + '>Email Outreach</button>' +
      '<button type="button" data-pxp-tab="pxseSinjalet"' + (s ? '' : ' class="on"') + '>Interest Signals</button></div></div>' +
      '<div id="pxpTrup"><p class="small"><span class="pxp-spin"></span> Loading…</p></div></div>';
    Array.prototype.forEach.call(m.querySelectorAll('[data-pxp-tab]'), function (b) {
      b.addEventListener('click', function () { pxpShko({ v: 'profile', nav: b.getAttribute('data-pxp-tab') }); });
    });
    return m.querySelector('#pxpTrup');
  }

  // =====================================================================
  //  INTEREST SIGNALS
  // =====================================================================
  var SJ = null; // gjendja e faqes se sinjaleve
  function pxpSinjalet(trup) {
    SJ = { trup: trup, d: null, filtri: 'all', burimi: 'all', hapur: {}, duke: {}, timer: null };
    pxpSjNgarko();
  }
  async function pxpSjNgarko() {
    var g = SJ; if (!g || !document.body.contains(g.trup)) return;
    try { g.d = await pxpThirr('/sinjale'); } catch (e) { g.trup.innerHTML = '<div class="pxp-gabim">' + h(e.message) + '</div>'; return; }
    pxpSjVizato();
    clearTimeout(g.timer);
    if (['analiza', 'kerkim', 'vleresim'].indexOf(g.d.gjendja) >= 0) g.timer = setTimeout(pxpSjNgarko, 2500);
  }
  function pxpSjVizato() {
    var g = SJ, d = g.d, t = g.trup;
    if (d.gjendja === 'gati') return pxpSjLista();
    if (['analiza', 'kerkim', 'vleresim'].indexOf(d.gjendja) >= 0) {
      t.innerHTML = '<div class="pxp-karte"><h3><span class="pxp-spin"></span> Finding your signals</h3><p class="pxp-nen">' + h(d.hapi || 'Working…') + ' This takes about a minute. You can leave this page and come back.</p></div>';
      return;
    }
    if (d.gjendja === 'konfirmo') {
      t.innerHTML = '<div class="pxp-karte"><h3>One quick question</h3><p class="pxp-nen">We think your customers are businesses (B2B). Correct?</p>' +
        '<div class="pxp-rresht"><button class="pxp-buton" data-lloji="b2b">Yes, businesses</button><button class="pxp-buton2" data-lloji="b2c">No, they are individuals</button></div></div>';
      Array.prototype.forEach.call(t.querySelectorAll('[data-lloji]'), function (b) {
        b.addEventListener('click', async function () {
          b.disabled = true;
          try { g.d = await pxpThirr('/sinjale/konfirmo', 'POST', { lloji: b.getAttribute('data-lloji') }); pxpSjVizato(); g.timer = setTimeout(pxpSjNgarko, 2500); }
          catch (e) { b.disabled = false; t.insertAdjacentHTML('beforeend', '<div class="pxp-gabim">' + h(e.message) + '</div>'); }
        });
      });
      return;
    }
    // asnje / gabim: 1 kerkim per domainin e llogarise
    var dom = d.llogariaDomaini || d.domaini;
    t.innerHTML = '<div class="pxp-karte"><h3>Find people who are asking for what you sell</h3>' +
      (dom
        ? '<p class="pxp-nen">We search Reddit, Hacker News, Stack Exchange, Indie Hackers and news sites for <b>' + h(dom) + '</b> (last 5 months). AI keeps only the posts that show real interest.</p>' +
          '<button class="pxp-buton" id="pxpSjKerko">✦ Find my signals</button>'
        : '<p class="pxp-nen">Add your website to your business profile first: we use it to know what you sell.</p><button class="pxp-buton" id="pxpSjBiznesi">Add your website</button>') +
      (d.gjendja === 'gabim' && d.error ? '<div class="pxp-gabim">' + h(d.error) + '</div>' : '') + '</div>';
    var k = t.querySelector('#pxpSjKerko');
    if (k) k.addEventListener('click', async function () {
      k.disabled = true;
      try { g.d = await pxpThirr('/sinjale/kerko', 'POST', {}); pxpSjVizato(); clearTimeout(g.timer); g.timer = setTimeout(pxpSjNgarko, 2500); }
      catch (e) { k.disabled = false; if (e.te && e.te.lidhur) return pxpSjNgarko(); t.querySelector('.pxp-karte').insertAdjacentHTML('beforeend', '<div class="pxp-gabim">' + h(e.message) + '</div>'); }
    });
    var bz = t.querySelector('#pxpSjBiznesi');
    if (bz) bz.addEventListener('click', function () { pxpShko({ v: 'profile', nav: 'biznesi' }); });
  }
  function pxpSjStatusi(url) { return (SJ.d.statuset && SJ.d.statuset[url]) || 'new'; }
  function pxpSjLista() {
    var g = SJ, d = g.d, t = g.trup, lista = d.rezultatet || [];
    var nr = {}; PXP_STATUSET.forEach(function (x) { nr[x[0]] = 0; });
    lista.forEach(function (x) { nr.all++; nr[pxpSjStatusi(x.url)]++; });
    var burimet = {}; lista.forEach(function (x) { burimet[x.burimi] = (burimet[x.burimi] || 0) + 1; });
    var shfaq = lista.filter(function (x) {
      return (g.filtri === 'all' || pxpSjStatusi(x.url) === g.filtri) && (g.burimi === 'all' || x.burimi === g.burimi);
    });
    var ngaProva = d.domaini && d.llogariaDomaini && d.domaini !== d.llogariaDomaini;
    t.innerHTML =
      '<div class="pxp-kubet">' +
        '<div class="pxp-kub"><b>' + pxpNr(nr.all) + '</b><span>Signals</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(nr['new']) + '</b><span>New</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(nr.saved) + '</b><span>Saved</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(nr.replied) + '</b><span>Replied</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(d.numri) + '</b><span>Posts checked by AI</span></div>' +
      '</div>' +
      '<div class="pxp-info">Signals for <b>' + h(d.domaini) + '</b>' + (ngaProva ? ' (from your free try)' : '') +
        ' · found ' + h(pxpKoha(d.krijuar_at)) + '. Your signals are connected to your account. New signals every day are coming soon.</div>' +
      '<div class="pxp-cipat" data-grup="statusi">' + PXP_STATUSET.map(function (x) {
        return '<button class="pxp-cip' + (g.filtri === x[0] ? ' on' : '') + '" data-f="' + x[0] + '">' + x[1] + '<i>' + nr[x[0]] + '</i></button>';
      }).join('') + '</div>' +
      (Object.keys(burimet).length > 1 ? '<div class="pxp-cipat" data-grup="burimi"><button class="pxp-cip' + (g.burimi === 'all' ? ' on' : '') + '" data-b="all">All sources</button>' +
        Object.keys(burimet).map(function (b) { return '<button class="pxp-cip' + (g.burimi === b ? ' on' : '') + '" data-b="' + h(b) + '">' + h(PXP_BURIMET[b] || b) + '<i>' + burimet[b] + '</i></button>'; }).join('') + '</div>' : '') +
      '<p class="small" style="margin:4px 0 10px">Showing ' + shfaq.length + ' signal' + (shfaq.length === 1 ? '' : 's') + '</p>' +
      (shfaq.length ? '<div class="pxp-lista">' + shfaq.map(pxpSjKarta).join('') + '</div>' : '<div class="pxp-info">No signals match these filters.</div>');
    pxpSjLidh();
  }
  function pxpSjKarta(x) {
    var st = pxpSjStatusi(x.url), p = Number(x.pike || 0), pg = SJ.d.pergjigjet || {}, kaP = Object.prototype.hasOwnProperty.call(pg, x.url);
    var hapur = SJ.hapur[x.url] && kaP, duke = SJ.duke[x.url];
    var btn = function (k, l) { return '<button type="button" data-st="' + k + '"' + (st === k ? ' class="on"' : '') + '>' + (st === k ? '✓ ' : '') + l + '</button>'; };
    return '<article class="pxp-sj ' + st + '" data-url="' + h(x.url) + '">' +
      '<div class="pxp-sj-koka"><span>' + h(PXP_BURIMET[x.burimi] || x.burimi) + (x.vendi ? ' · ' + h(x.vendi) : '') + '</span>' +
        '<span><span class="pxp-pike' + (p < 65 ? ' mes' : '') + '">' + p + '</span></span></div>' +
      '<h4>' + h(x.titulli) + '</h4>' +
      (x.teksti ? '<p>' + h(x.teksti) + '</p>' : '') +
      (x.arsye ? '<div class="pxp-arsye">Why it fits: ' + h(x.arsye) + '</div>' : '') +
      '<div class="small">' + (x.autori ? h(x.autori) + ' · ' : '') + h(pxpKoha(x.publikuar)) + (st !== 'new' ? ' <span class="pxp-st">' + h(st.charAt(0).toUpperCase() + st.slice(1)) + '</span>' : '') + '</div>' +
      (hapur ? '<div class="pxp-pergjigje"><textarea data-ai-tekst>' + h(pg[x.url]) + '</textarea>' +
        '<div class="pxp-rresht"><button type="button" class="pxp-buton2" data-kopjo>Copy</button><span class="small">Edit it if you like, then post it yourself. We never post for you.</span></div></div>' : '') +
      '<div class="pxp-veprime">' + btn('saved', 'Save') + btn('replied', 'Replied') + btn('rejected', 'Reject') +
        '<button type="button" data-ai>' + (duke ? '<span class="pxp-spin"></span> Writing…' : (kaP ? (hapur ? 'Hide reply' : '✦ Show AI reply') : '✦ AI reply')) + '</button></div>' +
      '</article>';
  }
  function pxpSjLidh() {
    var g = SJ, t = g.trup;
    Array.prototype.forEach.call(t.querySelectorAll('[data-f]'), function (b) { b.addEventListener('click', function () { g.filtri = b.getAttribute('data-f'); pxpSjLista(); }); });
    Array.prototype.forEach.call(t.querySelectorAll('[data-b]'), function (b) { b.addEventListener('click', function () { g.burimi = b.getAttribute('data-b'); pxpSjLista(); }); });
    Array.prototype.forEach.call(t.querySelectorAll('article.pxp-sj'), function (k) {
      var url = k.getAttribute('data-url');
      k.addEventListener('click', async function (ev) {
        var el = ev.target;
        if (el.closest('.pxp-pergjigje')) {
          if (el.closest('[data-kopjo]')) {
            var f = k.querySelector('[data-ai-tekst]'), v = f ? f.value : '';
            try { await navigator.clipboard.writeText(v); } catch (e) { f.select(); try { document.execCommand('copy'); } catch (e2) {} }
            el.textContent = 'Copied'; setTimeout(function () { el.textContent = 'Copy'; }, 1500);
          }
          return;
        }
        var stb = el.closest('[data-st]');
        if (stb) {
          var s = stb.getAttribute('data-st'); if (pxpSjStatusi(url) === s) s = 'new';
          try { await pxpThirr('/sinjale/statusi', 'POST', { url: url, statusi: s }); g.d.statuset = g.d.statuset || {}; g.d.statuset[url] = s; pxpSjLista(); }
          catch (e) { alertPxp(e.message); }
          return;
        }
        if (el.closest('[data-ai]')) {
          var pg = g.d.pergjigjet || {};
          if (Object.prototype.hasOwnProperty.call(pg, url)) { g.hapur[url] = !g.hapur[url]; pxpSjLista(); return; }
          if (g.duke[url]) return;
          g.duke[url] = true; pxpSjLista();
          try { var r = await pxpThirr('/sinjale/pergjigje', 'POST', { url: url }); g.d.pergjigjet = pg; pg[url] = r.pergjigja; g.hapur[url] = true; }
          catch (e) { alertPxp(e.message); }
          g.duke[url] = false; pxpSjLista();
          return;
        }
        window.open(url, '_blank', 'noopener');
      });
      var f = k.querySelector('[data-ai-tekst]');
      if (f) {
        var lart = function () { f.style.height = 'auto'; f.style.height = (f.scrollHeight + 2) + 'px'; };
        lart(); var tm = null;
        f.addEventListener('input', function () {
          lart(); g.d.pergjigjet[url] = f.value; clearTimeout(tm);
          tm = setTimeout(function () { pxpThirr('/sinjale/pergjigje-ndrysho', 'POST', { url: url, tekst: f.value }).catch(function () {}); }, 700);
        });
      }
    });
  }
  function alertPxp(msg) {
    var t = [SJ && SJ.trup, EM && EM.trup].filter(function (x) { return x && document.body.contains(x); })[0]; if (!t) return;
    var v = t.querySelector('.pxp-gabim-lart'); if (v) v.remove();
    t.insertAdjacentHTML('afterbegin', '<div class="pxp-gabim pxp-gabim-lart" style="margin:0 0 12px">' + h(msg) + '</div>');
  }

  // =====================================================================
  //  EMAIL OUTREACH
  // =====================================================================
  var EM = null;
  function pxpEmailet(trup) {
    EM = { trup: trup, d: null, kat: '', bizneset: [], total: 0, faqe: 0, zgjedhur: {}, njoftim: '', gabim: '', dukeStudio: false, dukeDergim: false,
      ditet: {}, numri: 0, numriDore: false, oret: [], kategorite: [], sticker: false };
    pxpEmNgarko(true);
  }
  async function pxpEmNgarko(heraPare) {
    var g = EM;
    try { g.d = await pxpThirr('/email'); } catch (e) { g.trup.innerHTML = '<div class="pxp-gabim">' + h(e.message) + '</div>'; return; }
    if (heraPare) {
      var burim = g.d.fundit || g.d.studimi || {};
      var dz = burim.dizajn || {};
      g.em = {
        subjekti: burim.subjekti || 'Quick idea for {company}',
        trupi: burim.trupi || 'Hi {company} team,\n\nWrite your message here, or let AI write it from your website.',
        marka: burim.marka || burim.emri || (g.d.derguesi && g.d.derguesi.emri) || g.d.emri || '',
        dizajn: { id: dz.id || '2', ngjyra: dz.ngjyra || (g.d.studimi && g.d.studimi.ngjyra) || '#3b6ef0', logo: dz.logo || (g.d.studimi && g.d.studimi.ikona) || '',
          meButon: dz.meButon != null ? !!dz.meButon : true, butoniTekst: dz.butoniTekst || (g.d.studimi && g.d.studimi.butoniTekst) || 'Visit our website',
          butoniLink: dz.butoniLink || (g.d.domaini ? 'https://' + g.d.domaini : '') }
      };
      g.sticker = !!(dz.paSticker && g.d.snippetAktiv);
      var rek = (g.d.studimi && g.d.studimi.kategorite) || [];
      g.kat = rek[0] || '';
      try { var k = await (await fetch('/api/pxse/kategorite')).json(); g.kategorite = k.kategorite || []; } catch (e) { g.kategorite = []; }
      await pxpEmBizneset(true);
    }
    pxpEmVizato();
  }
  async function pxpEmBizneset(rifillo) {
    var g = EM;
    if (rifillo) { g.faqe = 0; g.bizneset = []; }
    try {
      var r = await pxpThirr('/bizneset?kategoria=' + encodeURIComponent(g.kat) + '&faqe=' + g.faqe);
      g.total = r.total; g.bizneset = g.bizneset.concat(r.bizneset || []);
    } catch (e) { g.gabim = e.message; }
  }
  function pxpEmNrZgjedhur() { return Object.keys(EM.zgjedhur).length; }
  function pxpEmVizato() {
    var g = EM, d = g.d, t = g.trup, tt = d.totalet || {}, em = g.em, dz = em.dizajn;
    var rek = (d.studimi && d.studimi.kategorite) || [];
    var n = pxpEmNrZgjedhur();
    t.innerHTML =
      '<div class="pxp-kubet">' +
        '<div class="pxp-kub"><b>' + pxpNr(tt.aktive) + '</b><span>Active (scheduled)</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(tt.derguar) + '</b><span>Sent</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(tt.pare) + '</b><span>Seen (total views)</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(tt.hapur) + '</b><span>Opened</span></div>' +
        '<div class="pxp-kub"><b>' + pxpNr(tt.klikime) + '</b><span>Clicks on the button</span></div>' +
      '</div>' +
      pxpEmKarusel() +
      pxpEmDerguesiHtml() +
      '<div class="pxp-grid2">' +
        '<div class="pxp-karte"><h3><span class="pxp-hapi">2</span> Your email</h3>' +
          '<p class="pxp-nen">{company} is replaced with each business name. AI can write it from ' + h(d.domaini || 'your website') + '.</p>' +
          '<div class="pxp-fushe"><label>Subject</label><input data-e="subjekti" value="' + h(em.subjekti) + '"></div>' +
          '<div class="pxp-fushe" style="margin-top:10px"><label>Message</label><textarea data-e="trupi">' + h(em.trupi) + '</textarea></div>' +
          '<div class="pxp-rresht" style="margin-top:10px"><button class="pxp-buton2" data-fut>Insert {company}</button>' +
            '<button class="pxp-buton" data-studio' + (g.dukeStudio ? ' disabled' : '') + '>' + (g.dukeStudio ? '<span class="pxp-spin"></span> AI is writing…' : '✦ Write my email with AI') + '</button></div>' +
          '<div class="pxp-rresht" style="margin-top:14px">' +
            '<div class="pxp-fushe"><label>Sender name</label><input data-e="marka" value="' + h(em.marka) + '" placeholder="Your company"></div>' +
            '<div class="pxp-fushe" style="flex:0 0 110px"><label>Color</label><input type="color" data-d="ngjyra" value="' + h(dz.ngjyra) + '" style="height:40px;padding:3px"></div></div>' +
          '<div class="pxp-fushe" style="margin-top:10px"><label>Logo URL (https://…)</label><input data-d="logo" value="' + h(dz.logo) + '"></div>' +
          '<div style="margin-top:12px"><label style="margin:0 0 6px">Design</label><div class="pxp-dizajnet">' +
            ((window.pxseDizajnet || []).map(function (x) { return '<button type="button" data-dizajni="' + h(x.id) + '"' + (x.id === dz.id ? ' class="on"' : '') + '>' + h(x.id) + '</button>'; }).join('')) + '</div></div>' +
          '<label class="chk"><input type="checkbox" data-d="meButon"' + (dz.meButon ? ' checked' : '') + '> Add a button to your website</label>' +
          (dz.meButon ? '<div class="pxp-rresht" style="margin-top:6px"><div class="pxp-fushe"><label>Button text</label><input data-d="butoniTekst" value="' + h(dz.butoniTekst) + '"></div>' +
            '<div class="pxp-fushe"><label>Button link</label><input data-d="butoniLink" value="' + h(dz.butoniLink) + '"></div></div>' : '') +
        '</div>' +
        '<div class="pxp-karte"><h3>How it will look</h3><p class="pxp-nen">Example with the first selected business.</p>' +
          '<div class="pxp-pamja"><div class="pxp-pamja-koka"><b>' + h(pxpZevendeso(em.subjekti)) + '</b><br>From: ' + h(em.marka || d.emri) + ' &lt;' + h((d.derguesi && d.derguesi.email) || ('you@' + (d.domaini || 'yourcompany.com'))) + '&gt;</div>' +
          '<iframe title="Email preview" sandbox="allow-same-origin"></iframe></div>' +
          (g.sticker ? '<p class="small" style="margin:8px 0 0">✓ The PhronexusAI footer is removed from your emails. <a href="#" data-sticker-kthe style="color:var(--acc2)">Show it again</a></p>'
            : '<p class="small" style="margin:8px 0 0">Click ✕ on the PhronexusAI footer to remove it.</p>') + '</div>' +
      '</div>' +
      '<div class="pxp-karte"><h3><span class="pxp-hapi">3</span> Recipients</h3><p class="pxp-nen">Businesses from our directory with a verified email. Businesses you already emailed are not shown.</p>' +
        '<div class="pxp-rresht"><div class="pxp-fushe" style="flex:0 1 320px"><label>Category</label><select data-kat><option value="">All categories</option>' +
          g.kategorite.map(function (k) { return '<option value="' + h(k.v) + '"' + (k.v === g.kat ? ' selected' : '') + '>' + h(k.emri) + (rek.indexOf(k.v) >= 0 ? ' (recommended)' : '') + '</option>'; }).join('') + '</select></div>' +
          '<button class="pxp-buton2" data-te-gjitha>Select all shown</button><button class="pxp-buton2" data-asnje>Clear</button>' +
          '<span class="small">' + n + ' selected · ' + pxpNr(g.total) + ' available</span></div>' +
        '<div class="pxp-bizlista">' + (g.bizneset.length ? g.bizneset.map(function (b) {
          return '<label class="pxp-biz"><input type="checkbox" data-biz="' + h(b.id) + '"' + (g.zgjedhur[b.id] ? ' checked' : '') + '><span>' + h(b.emri) + ' <small>' + h(b.domaini) + '</small></span><small>' + h(b.kat || '') + '</small></label>';
        }).join('') : '<p class="small" style="padding:10px 4px">No businesses to email in this category. Choose another category.</p>') + '</div>' +
        (g.bizneset.length < g.total ? '<button class="pxp-buton2" data-me-shume>Load more</button>' : '') +
      '</div>' +
      pxpEmOrariHtml();
    pxpEmPamja();
    pxpEmLidh();
  }
  function pxpZevendeso(s) {
    var b = pxpEmShembull();
    return String(s || '').replace(/\{company\}/g, b.emri);
  }
  function pxpEmShembull() {
    var g = EM, id = pxpEmRenditja()[0], b = null;
    if (id) b = g.bizneset.filter(function (x) { return x.id === id; })[0] || g.zgjedhur[id];
    return b && b.emri ? b : (g.bizneset[0] || { emri: 'Example Company', domaini: 'example.com' });
  }
  function pxpEmPamja() {
    var g = EM, em = g.em, dz = em.dizajn, lista = window.pxseDizajnet || [], f = g.trup.querySelector('iframe');
    if (!f) return;
    var dzn = lista.filter(function (x) { return x.id === dz.id; })[0] || lista[0];
    var b = pxpEmShembull(), dom = g.d.domaini || '';
    var v = {
      marka: em.marka || g.d.emri || 'Your company', domaini: dom, logo: /^https:\/\//i.test(dz.logo) ? dz.logo : '', ngjyra: /^#[0-9a-f]{6}$/i.test(dz.ngjyra) ? dz.ngjyra : '#3b6ef0',
      paragrafet: String(em.trupi || '').replace(/\{company\}/g, b.emri).split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean),
      butoni: dz.meButon ? { tekst: dz.butoniTekst || 'Visit our website', link: dz.butoniLink || ('https://' + dom) } : null,
      fundiJo: 'Not relevant? Just reply "no" and you will not hear from us again.', cregj: 'Unsubscribe',
      sticker: g.sticker ? false : { rreshti1: 'Powered by PhronexusAI', rreshti2: 'Find customers, 100% free' }
    };
    f.onload = function () {
      var doc; try { doc = f.contentDocument; } catch (e) { return; } if (!doc) return;
      // Parapamja: asnje lidhje nuk hapet
      doc.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a'); if (a) e.preventDefault(); });
      var st = doc.querySelector('a[href="https://phronexusai.com/"]');
      if (!st) return;
      st.style.position = 'relative'; st.style.cursor = 'default';
      var x = doc.createElement('span'); x.textContent = '✕'; x.title = 'Remove the PhronexusAI footer';
      x.setAttribute('style', 'position:absolute;top:-10px;right:-10px;width:22px;height:22px;border-radius:50%;background:#1c2128;color:#fff;font:bold 12px/22px Arial,sans-serif;text-align:center;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.3);');
      x.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); pxpEmSticker(); });
      st.appendChild(x);
    };
    f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f4f5f7}a{cursor:default}</style></head><body>' + (dzn ? dzn.nderto(v) : h(v.paragrafet.join('\n\n'))) + '</body></html>';
  }
  function pxpEmDerguesiHtml() {
    var g = EM, d = g.d, dr = d.derguesi;
    if (dr && !dr.gabimi && !g.ndryshoDerguesin) {
      return '<div class="pxp-karte"><h3><span class="pxp-hapi">1</span> Your sending email</h3>' +
        '<div class="pxp-rresht" style="align-items:center"><span style="color:#56d364">✓ Connected:</span> <b>' + h(dr.emri ? dr.emri + ' <' + dr.email + '>' : dr.email) + '</b>' +
        '<span class="small">' + h(dr.host) + '</span><span style="flex:1"></span><button class="pxp-buton2" data-ndrysho-dergues>Change</button><button class="pxp-buton2" data-shkep>Disconnect</button></div></div>';
    }
    var f = g.formaD || {};
    return '<div class="pxp-karte"><h3><span class="pxp-hapi">1</span> Connect your business email</h3>' +
      '<p class="pxp-nen">Emails are sent from your own business address, so replies come back to you. Only an email on <b>@' + h(d.domaini || 'your website domain') + '</b> is accepted (not Gmail, Outlook or similar). ' +
      'Google Workspace or Microsoft 365 with 2-step verification: use an <b>app password</b>.</p>' +
      (dr && dr.gabimi ? '<div class="pxp-gabim" style="margin:0 0 10px">' + h(dr.gabimi) + '</div>' : '') +
      (!d.celesi ? '<div class="pxp-info">Connecting a mailbox is not available yet. Please try again later.</div>' : '') +
      '<div class="pxp-rresht">' +
        '<div class="pxp-fushe"><label>Business email</label><input data-f="email" type="email" autocomplete="off" placeholder="you@' + h(d.domaini || 'yourcompany.com') + '" value="' + h(f.email || (dr && dr.email) || '') + '"></div>' +
        '<div class="pxp-fushe"><label>Sender name</label><input data-f="emri" placeholder="Your name or company" value="' + h(f.emri || (dr && dr.emri) || '') + '"></div>' +
        '<div class="pxp-fushe"><label>Password or app password</label><input data-f="fjalekalimi" type="password" autocomplete="new-password" value=""></div></div>' +
      '<details style="margin-top:10px"' + (f.hapur ? ' open' : '') + '><summary class="small" style="cursor:pointer">Advanced: SMTP server' + (f.ofruesi ? ' (' + h(f.ofruesi) + ' detected)' : '') + '</summary>' +
        '<div class="pxp-rresht" style="margin-top:8px"><div class="pxp-fushe"><label>SMTP server</label><input data-f="host" placeholder="smtp.yourprovider.com" value="' + h(f.host || '') + '"></div>' +
        '<div class="pxp-fushe" style="flex:0 1 120px"><label>Port</label><input data-f="port" type="number" value="' + h(f.port || 587) + '"></div>' +
        '<div class="pxp-fushe"><label>Username (if different)</label><input data-f="perdoruesi" value="' + h(f.perdoruesi || '') + '"></div></div></details>' +
      '<div class="pxp-rresht" style="margin-top:12px"><button class="pxp-buton" data-lidh' + (g.dukeLidhur || !d.celesi ? ' disabled' : '') + '>' + (g.dukeLidhur ? '<span class="pxp-spin"></span> Checking…' : 'Connect email') + '</button>' +
        (g.ndryshoDerguesin ? '<button class="pxp-buton2" data-anulo-ndryshim>Cancel</button>' : '') + '</div>' +
      (g.gabimD ? '<div class="pxp-gabim">' + h(g.gabimD) + '</div>' : '') + '</div>';
  }
  // ---------- Orari: dite -> numri -> ore te barazlarguara (me dore me pas) ----------
  var PXP_DITE_PERPARA = 21;
  function pxpDitaKey(t) { var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function pxpDitaNgaKey(k) { var x = k.split('-'); return new Date(+x[0], +x[1] - 1, +x[2]).getTime(); }
  function pxpDitaEmer(k) { return new Date(pxpDitaNgaKey(k)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function pxpOraTekst(t) { var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getHours()) + ':' + p(d.getMinutes()); }
  function pxpEmRenditja() { var g = EM; g.renditja = (g.renditja || []).filter(function (id) { return g.zgjedhur[id]; }); return g.renditja; }
  // Numri ne dite i ndare njetrajtesisht; brenda dites, oret ne mes te pjeseve te barabarta te 24 oreve (sot: nga tani).
  function pxpEmGjeneroOret() {
    var g = EM, ditet = Object.keys(g.ditet).filter(function (k) { return g.ditet[k]; }).sort(), n = g.numri, out = [];
    if (!ditet.length || !n) { g.oret = []; return; }
    var baze = Math.floor(n / ditet.length), mbetje = n % ditet.length;
    ditet.forEach(function (k, i) {
      var sa = baze + (i < mbetje ? 1 : 0); if (!sa) return;
      var fillimi = pxpDitaNgaKey(k), fundi = fillimi + 86400000;
      var tani = Date.now() + 10 * 60000; if (tani > fillimi) fillimi = Math.ceil(tani / 300000) * 300000;
      if (fillimi >= fundi) return;
      var hapi = (fundi - fillimi) / sa;
      for (var j = 0; j < sa; j++) out.push(Math.round((fillimi + hapi * (j + 0.5)) / 60000) * 60000);
    });
    g.oret = out;
  }
  // Kontrollet para dergimit (te njejtat i ben edhe serveri)
  function pxpEmKontrollo() {
    var g = EM, d = g.d, nZ = pxpEmRenditja().length, ditet = Object.keys(g.ditet).filter(function (k) { return g.ditet[k]; });
    var max = d.ditore || 15, hap = (d.hapesiraMin || 5) * 60000;
    if (!nZ) return 'Select the businesses you want to email first.';
    if (!ditet.length) return 'Choose one or more days.';
    if (!g.numri) return 'Enter how many emails to send.';
    if (g.numri > nZ) return 'You selected ' + nZ + ' business' + (nZ === 1 ? '' : 'es') + '. To send ' + g.numri + ' emails, select ' + (g.numri - nZ) + ' more above.';
    if (g.numri > ditet.length * max) return 'You can send up to ' + max + ' emails a day. ' + g.numri + ' emails need at least ' + Math.ceil(g.numri / max) + ' days: choose more days.';
    if (g.oret.length !== g.numri) return 'There is not enough time left today for these emails. Choose another day.';
    if (g.oret.some(function (t) { return t < Date.now(); })) return 'One of the times is in the past. Change it.';
    var zena = (d.oretZena || []).map(function (x) { return Date.parse(x); });
    var ngaDita = {};
    g.oret.concat(zena).forEach(function (t) { var k = pxpDitaKey(t); ngaDita[k] = (ngaDita[k] || 0) + 1; });
    var plot = g.oret.map(pxpDitaKey).filter(function (k, i, a) { return a.indexOf(k) === i && ngaDita[k] > max; });
    if (plot.length) return 'You can send up to ' + max + ' emails a day (including the ones already scheduled). ' + plot.map(pxpDitaEmer).join(', ') + ' would have more.';
    var te = g.oret.map(function (t) { return { t: t, iri: 1 }; }).concat(zena.map(function (t) { return { t: t }; })).sort(function (a, b) { return a.t - b.t; });
    for (var i = 1; i < te.length; i++) if ((te[i].iri || te[i - 1].iri) && te[i].t - te[i - 1].t < hap)
      return 'Two emails are less than ' + (d.hapesiraMin || 5) + ' minutes apart (' + pxpOraTekst(te[i - 1].t) + ' and ' + pxpOraTekst(te[i].t) + ' on ' + pxpDitaEmer(pxpDitaKey(te[i].t)) + '). Emails sent close together are more likely to land in spam, so this is not allowed.';
    return '';
  }
  function pxpEmOrariHtml() {
    var g = EM, rend = pxpEmRenditja(), nZ = rend.length, d = g.d;
    if (!g.numriDore) g.numri = nZ;
    var chips = '';
    for (var i = 0; i < PXP_DITE_PERPARA; i++) {
      var k = pxpDitaKey(Date.now() + i * 86400000);
      chips += '<button type="button" class="pxp-cip' + (g.ditet[k] ? ' on' : '') + '" data-dita="' + k + '">' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : h(pxpDitaEmer(k))) + '</button>';
    }
    var gab = pxpEmKontrollo();
    var lista = g.oret.map(function (t, i) {
      var b = g.zgjedhur[rend[i]] || {};
      return '<div class="pxp-ora-rresht"><span class="pxp-ora-nr">' + (i + 1) + '</span><span class="pxp-ora-biz">' + h(b.emri || '') + ' <small>' + h(b.domaini || '') + '</small></span>' +
        '<span class="small">' + h(pxpDitaEmer(pxpDitaKey(t))) + '</span><input type="time" data-ora="' + i + '" value="' + pxpOraTekst(t) + '"></div>';
    }).join('');
    return '<div class="pxp-karte"><h3><span class="pxp-hapi">4</span> Schedule</h3>' +
      '<p class="pxp-nen">Choose one or more days, then how many emails to send. Up to ' + (d.ditore || 15) + ' emails a day, at least ' + (d.hapesiraMin || 5) + ' minutes apart.</p>' +
      '<label style="margin:0 0 6px">Days</label><div class="pxp-cipat">' + chips + '</div>' +
      '<div class="pxp-rresht"><div class="pxp-fushe" style="flex:0 1 220px"><label>Number of emails</label><input type="number" min="1" data-numri value="' + (g.numri || '') + '"></div>' +
        '<span class="small">' + nZ + ' business' + (nZ === 1 ? '' : 'es') + ' selected' + (g.numri && g.numri < nZ ? ' · the first ' + g.numri + ' get these times' : '') + '</span></div>' +
      (g.oret.length ? '<div class="pxp-info" style="margin:12px 0 8px">The times are spread evenly through each day. This helps your emails stay out of spam: many emails sent close together look like bulk mail. ' +
        'You can change any time, but we recommend not putting them close to each other.</div><div class="pxp-oret">' + lista + '</div>' : '') +
      (gab && g.provoi ? '<div class="pxp-gabim">' + h(gab) + '</div>' : '') +
      (g.gabim ? '<div class="pxp-gabim">' + h(g.gabim) + '</div>' : '') + (g.njoftim ? '<div class="pxp-ok">' + h(g.njoftim) + '</div>' : '') +
      '<div class="pxp-rresht" style="margin-top:12px"><button class="pxp-buton" data-dergo' + (g.dukeDergim ? ' disabled' : '') + '>' + (g.dukeDergim ? '<span class="pxp-spin"></span> Sending…' : 'Send ' + (g.numri || 0) + ' email' + (g.numri === 1 ? '' : 's')) + '</button>' +
        '<span class="small">The design, times and businesses shown here are exactly what is sent.</span></div>' +
      '<p class="small" style="margin:10px 0 0">One-click unsubscribe and a shared do-not-contact list are included in every email.</p></div>';
  }
  // ---------- Lista vertikale e email-eve (pas dergimit te pare) ----------
  function pxpEmKarusel() {
    var l = EM.d.dergimet || [];
    if (!l.some(function (x) { return x.statusi === 'derguar'; })) return '';
    var st = function (x) { return x.statusi === 'derguar' ? 'Sent ' + pxpData(x.derguar_at || x.ora) : x.statusi === 'deshtoi' ? 'Not sent' : (x.vonuar ? 'Delayed' : 'Scheduled ' + pxpData(x.ora)); };
    var nr = function (v, l2) { return '<div class="pxp-k-nr"><b>' + pxpNr(v) + '</b><span>' + l2 + '</span></div>'; };
    return '<div class="pxp-karte pxp-karusel"><div class="pxp-rresht" style="justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0">Your emails <span class="pxp-mini">' + l.length + '</span></h3>' +
      '<div class="pxp-rresht"><button class="pxp-buton2" data-kar="-1" aria-label="Up">▲</button><button class="pxp-buton2" data-kar="1" aria-label="Down">▼</button></div></div>' +
      '<div class="pxp-kar-lista">' + l.map(function (x) {
        return '<div class="pxp-kar-rresht"><div class="pxp-kar-info"><b>' + h(x.marresi) + '</b> <span class="small">' + h(x.domaini) + '</span>' + (x.ngaProva ? '<span class="pxp-mini">Free try</span>' : '') +
          '<div class="small">' + h(x.subjekti) + ' · ' + h(st(x)) + (x.cregj ? ' · Unsubscribed' : '') + '</div></div>' +
          nr(x.statusi === 'derguar' ? 1 : 0, 'Sent') + nr(x.hapje || 0, 'Opened') + nr(x.klikime || 0, 'Clicks') +
          '<div style="width:74px;text-align:right">' + (x.statusi === 'ne_radhe' && !x.ngaProva ? '<button class="pxp-buton2" data-anulo="' + x.id + '" style="padding:4px 9px;font-size:12px">Cancel</button>' : '') + '</div></div>';
      }).join('') + '</div></div>';
  }
  // ---------- Sticker-i: dritarja kur nuk ka snippet aktiv ----------
  function pxpEmSticker() {
    var g = EM;
    if (g.d.snippetAktiv) { g.sticker = true; pxpEmVizato(); return; }
    var v = document.getElementById('pxpModal'); if (v) v.remove();
    var m = document.createElement('div'); m.id = 'pxpModal'; m.className = 'pxp-modal';
    m.innerHTML = '<div class="pxp-modal-kuti" role="dialog" aria-modal="true"><h3>Remove the PhronexusAI footer</h3>' +
      '<p>The footer can be removed only when the PhronexusAI ad snippet is connected to your website and is active.</p>' +
      '<p>The snippet shows partner ads on your website and brings you real views. As soon as it is active, you can send your emails without the footer.</p>' +
      '<div class="pxp-rresht" style="margin-top:14px"><button class="pxp-buton" data-m="lidh">Connect the ad snippet</button><button class="pxp-buton2" data-m="mbyll">Not now</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]');
      if (e.target === m || (b && b.getAttribute('data-m') === 'mbyll')) { m.remove(); return; }
      if (b && b.getAttribute('data-m') === 'lidh') { m.remove(); pxpShko({ v: 'profile', nav: 'snippetet' }); }
    });
  }
  function pxpEmPasZgjedhjes() { var g = EM; if (!g.numriDore) g.numri = pxpEmRenditja().length; pxpEmGjeneroOret(); pxpEmVizato(); }
  function pxpEmAlarm(msg) {
    var v = document.getElementById('pxpModal'); if (v) v.remove();
    var m = document.createElement('div'); m.id = 'pxpModal'; m.className = 'pxp-modal';
    m.innerHTML = '<div class="pxp-modal-kuti" role="alertdialog" aria-modal="true"><h3>This is not allowed</h3><p>' + h(msg) + '</p>' +
      '<div class="pxp-rresht" style="margin-top:14px"><button class="pxp-buton" data-m="mbyll">OK</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-m]')) m.remove(); });
  }
  function pxpEmLidh() {
    var g = EM, t = g.trup, em = g.em;
    var on = function (sel, ev, fn) { Array.prototype.forEach.call(t.querySelectorAll(sel), function (el) { el.addEventListener(ev, function (e) { fn(el, e); }); }); };
    var ta = t.querySelector('textarea[data-e="trupi"]');
    var lart = function () { if (!ta) return; ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; };
    lart();
    on('[data-e]', 'input', function (el) { em[el.getAttribute('data-e')] = el.value; if (el === ta) lart(); pxpEmPamja(); var k = t.querySelector('.pxp-pamja-koka b'); if (k) k.textContent = pxpZevendeso(em.subjekti); });
    on('[data-d]', 'input', function (el) { var k = el.getAttribute('data-d'); if (k === 'meButon') return; em.dizajn[k] = el.value; pxpEmPamja(); });
    on('[data-d="meButon"]', 'change', function (el) { em.dizajn.meButon = el.checked; pxpEmVizato(); });
    on('[data-dizajni]', 'click', function (el) { em.dizajn.id = el.getAttribute('data-dizajni'); pxpEmVizato(); });
    on('[data-fut]', 'click', function () {
      if (!ta) return; var a = ta.selectionStart || ta.value.length;
      ta.value = ta.value.slice(0, a) + '{company}' + ta.value.slice(ta.selectionEnd || a); em.trupi = ta.value; lart(); pxpEmPamja(); ta.focus();
    });
    on('[data-sticker-kthe]', 'click', function (el, e) { e.preventDefault(); g.sticker = false; pxpEmVizato(); });
    on('[data-studio]', 'click', async function () {
      g.dukeStudio = true; g.gabim = ''; pxpEmVizato();
      try {
        var r = await pxpThirr('/email/studio', 'POST', {});
        em.subjekti = r.subjekti || em.subjekti; em.trupi = r.trupi || em.trupi; if (r.emri && !em.marka) em.marka = r.emri;
        if (r.ngjyra) em.dizajn.ngjyra = r.ngjyra; if (r.ikona && !em.dizajn.logo) em.dizajn.logo = r.ikona; if (r.butoniTekst) em.dizajn.butoniTekst = r.butoniTekst;
        g.d.studimi = r;
        if (r.kategorite && r.kategorite[0] && !Object.keys(g.zgjedhur).length) { g.kat = r.kategorite[0]; await pxpEmBizneset(true); }
        g.njoftim = 'AI wrote your subject and message. You can edit everything.';
      } catch (e) { g.gabim = e.message; }
      g.dukeStudio = false; pxpEmVizato();
    });
    on('[data-kat]', 'change', async function (el) { g.kat = el.value; await pxpEmBizneset(true); pxpEmVizato(); });
    on('[data-me-shume]', 'click', async function () { g.faqe++; await pxpEmBizneset(false); pxpEmVizato(); });
    on('[data-biz]', 'change', function (el) {
      var id = el.getAttribute('data-biz');
      if (el.checked) { g.zgjedhur[id] = g.bizneset.filter(function (x) { return x.id === id; })[0] || { id: id }; g.renditja = (g.renditja || []).concat([id]); } else delete g.zgjedhur[id];
      pxpEmPasZgjedhjes();
    });
    on('[data-te-gjitha]', 'click', function () { g.bizneset.forEach(function (b) { if (!g.zgjedhur[b.id]) { g.zgjedhur[b.id] = b; g.renditja = (g.renditja || []).concat([b.id]); } }); pxpEmPasZgjedhjes(); });
    on('[data-asnje]', 'click', function () { g.zgjedhur = {}; g.renditja = []; pxpEmPasZgjedhjes(); });
    on('[data-dita]', 'click', function (el) { var k = el.getAttribute('data-dita'); g.ditet[k] = !g.ditet[k]; g.provoi = false; pxpEmGjeneroOret(); pxpEmVizato(); });
    on('[data-numri]', 'change', function (el) { g.numri = Math.max(0, parseInt(el.value, 10) || 0); g.numriDore = true; g.provoi = true; pxpEmGjeneroOret(); pxpEmVizato(); });
    on('[data-ora]', 'change', function (el) {
      var i = +el.getAttribute('data-ora'), p = String(el.value || '').split(':'); if (p.length < 2) return;
      var dt = new Date(g.oret[i]); dt.setHours(+p[0], +p[1], 0, 0); g.oret[i] = dt.getTime(); g.provoi = true; pxpEmVizato();
    });
    on('[data-kar]', 'click', function (el) { var l = t.querySelector('.pxp-kar-lista'); if (l) l.scrollBy({ top: +el.getAttribute('data-kar') * 72 * 3, behavior: 'smooth' }); });
    on('[data-dergo]', 'click', async function () {
      g.provoi = true; g.gabim = ''; g.njoftim = '';
      var gab = pxpEmKontrollo();
      if (gab) { pxpEmVizato(); pxpEmAlarm(gab); return; }
      // Ajo qe dergohet = ajo qe shihet tani: dizajni, oret dhe bizneset e zgjedhura ne kete moment
      var rend = pxpEmRenditja().slice(0, g.numri);
      g.dukeDergim = true; pxpEmVizato();
      try {
        var zona = ''; try { zona = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (x) {}
        var r = await pxpThirr('/email/dergo', 'POST', { subjekti: em.subjekti, trupi: em.trupi, marka: em.marka, dizajn: em.dizajn, paSticker: g.sticker,
          marresit: rend, oret: g.oret.map(function (x) { return new Date(x).toISOString(); }), zona: zona });
        g.njoftim = 'Done: ' + r.planifikuar + ' email' + (r.planifikuar === 1 ? '' : 's') + ' scheduled. Each one goes out at its time from your email.';
        rend.forEach(function (id) { delete g.zgjedhur[id]; }); g.renditja = pxpEmRenditja(); g.ditet = {}; g.oret = []; g.numriDore = false; g.provoi = false;
        await pxpEmBizneset(true);
        g.dukeDergim = false;
        await pxpEmNgarko(false);
        return;
      } catch (e) {
        g.gabim = e.message;
        if (e.te && e.te.snippet) { g.sticker = false; pxpEmSticker(); }
      }
      g.dukeDergim = false; pxpEmVizato();
    });
    on('[data-anulo]', 'click', async function (el) {
      try { await pxpThirr('/email/anulo', 'POST', { id: el.getAttribute('data-anulo') }); await pxpEmNgarko(false); } catch (e) { g.gabim = e.message; pxpEmVizato(); }
    });
    // Email-i dergues (vlerat mbahen ne kujtese, qe rivizatimi te mos i fshije)
    on('[data-f]', 'input', function (el) { var f = g.formaD = g.formaD || {}, k = el.getAttribute('data-f'); if (k === 'fjalekalimi') g.pwD = el.value; else f[k] = el.value; });
    var pwF = t.querySelector('[data-f="fjalekalimi"]'); if (pwF && g.pwD) pwF.value = g.pwD;
    var lexoForma = function () {
      var f = g.formaD = g.formaD || {};
      Array.prototype.forEach.call(t.querySelectorAll('[data-f]'), function (el) { if (el.getAttribute('data-f') !== 'fjalekalimi') f[el.getAttribute('data-f')] = el.value; });
      var d = t.querySelector('details'); f.hapur = !!(d && d.open);
      return f;
    };
    var emailF = t.querySelector('[data-f="email"]');
    if (emailF) emailF.addEventListener('change', async function () {
      var f = lexoForma();
      try {
        var r = await pxpThirr('/derguesi/sugjerim?email=' + encodeURIComponent(f.email));
        if (r.host) { f.host = r.host; f.port = r.port; f.ofruesi = r.ofruesi; } else if (r.ofruesi === '') { f.hapur = true; f.ofruesi = ''; }
        var hf = t.querySelector('[data-f="host"]'), pf = t.querySelector('[data-f="port"]');
        if (hf && r.host) hf.value = r.host; if (pf && r.port) pf.value = r.port;
        var sm = t.querySelector('details summary'); if (sm) sm.textContent = 'Advanced: SMTP server' + (f.ofruesi ? ' (' + f.ofruesi + ' detected)' : '');
        if (r.ofruesi === '' && !r.host) { var dd = t.querySelector('details'); if (dd) dd.open = true; }
      } catch (e) {}
    });
    on('[data-lidh]', 'click', async function () {
      var f = lexoForma(), pw = t.querySelector('[data-f="fjalekalimi"]');
      g.dukeLidhur = true; g.gabimD = ''; pxpEmVizato();
      try {
        var r = await pxpThirr('/derguesi', 'POST', { email: f.email, emri: f.emri, fjalekalimi: pw ? pw.value : '', host: f.host, port: f.port, perdoruesi: f.perdoruesi });
        g.d.derguesi = r.derguesi; g.ndryshoDerguesin = false; g.formaD = null; g.pwD = '';
        if (!em.marka && r.derguesi.emri) em.marka = r.derguesi.emri;
      } catch (e) { g.gabimD = e.message; if (e.te && (e.te.fusha === 'host' || e.te.fusha === 'port')) f.hapur = true; }
      g.dukeLidhur = false; pxpEmVizato();
    });
    on('[data-shkep]', 'click', async function () {
      try { await pxpThirr('/derguesi', 'DELETE'); g.d.derguesi = null; } catch (e) { g.gabimD = e.message; }
      pxpEmVizato();
    });
    on('[data-ndrysho-dergues]', 'click', function () { g.ndryshoDerguesin = true; g.formaD = { email: g.d.derguesi.email, emri: g.d.derguesi.emri, host: g.d.derguesi.host, port: g.d.derguesi.port }; pxpEmVizato(); });
    on('[data-anulo-ndryshim]', 'click', function () { g.ndryshoDerguesin = false; g.gabimD = ''; pxpEmVizato(); });
  }

  // =====================================================================
  //  DASHBOARD: nje seksion me dy kuti
  // =====================================================================
  async function pxpDashboard(m) {
    pxpStilet();
    if (!m || m.querySelector('#pxpDash')) return;
    var s = document.createElement('div'); s.id = 'pxpDash'; s.className = 'pxp-dash';
    s.innerHTML = '<h2 class="h" style="font-size:18px;margin:0 0 4px">Find Customers</h2><p class="small" style="margin:0 0 12px">Email outreach and interest signals.</p>' +
      '<div class="pxp-dash-kartat"><div class="card" data-pxp-shko="pxseEmailet"><p class="small"><span class="pxp-spin"></span> Loading…</p></div>' +
      '<div class="card" data-pxp-shko="pxseSinjalet"><p class="small"><span class="pxp-spin"></span> Loading…</p></div></div>';
    var vs = m.querySelector('#vstep'), rreshti = vs && vs.parentElement && vs.parentElement.parentElement;
    if (rreshti && rreshti.parentElement === m) rreshti.insertAdjacentElement('afterend', s);
    else if (m.firstElementChild) m.firstElementChild.insertAdjacentElement('afterend', s);
    else m.appendChild(s);
    Array.prototype.forEach.call(s.querySelectorAll('[data-pxp-shko]'), function (c) { c.addEventListener('click', function () { pxpShko({ v: 'profile', nav: c.getAttribute('data-pxp-shko') }); }); });
    var d; try { d = await pxpThirr('/permbledhje'); } catch (e) { s.querySelectorAll('.card').forEach(function (c) { c.innerHTML = '<p class="small">' + h(e.message) + '</p>'; }); return; }
    var sj = d.sinjale || {}, em = d.email || {};
    var kutia = function (k, v) { return '<div><b>' + pxpNr(v) + '</b><span>' + k + '</span></div>'; };
    s.querySelector('[data-pxp-shko="pxseSinjalet"]').innerHTML = '<h3 class="h" style="font-size:15px;margin:0">Interest Signals</h3>' +
      (sj.ka ? '<div class="pxp-dash-nr">' + kutia('Signals', sj.total) + kutia('New', sj.te_reja) + kutia('Saved', sj.ruajtur) + kutia('Replied', sj.pergjigjur) + '</div>'
        : '<p class="small" style="margin:8px 0 12px">Find people who are already asking for what you sell' + (d.domaini ? ' (' + h(d.domaini) + ')' : '') + '.</p>') +
      '<button class="btn cta">' + (sj.ka ? 'Open signals →' : '✦ Find my signals →') + '</button>';
    s.querySelector('[data-pxp-shko="pxseEmailet"]').innerHTML = '<h3 class="h" style="font-size:15px;margin:0">Email Outreach</h3>' +
      '<div class="pxp-dash-nr">' + kutia('Active', em.aktive) + kutia('Sent', em.derguar) + kutia('Seen', em.pare) + kutia('Opened', em.hapur) + kutia('Clicks', em.klikime) + '</div>' +
      (em.gabimi ? '<p class="small" style="color:var(--err);margin:0 0 10px">' + h(em.gabimi) + '</p>'
        : (!em.derguesi ? '<p class="small" style="margin:0 0 10px">Connect your business email to send with no limit.</p>' : '<p class="small" style="margin:0 0 10px">Sending from ' + h(em.derguesi) + '</p>')) +
      '<button class="btn cta">Open emails →</button>';
  }

  // =====================================================================
  //  Lidhja me app.js / core.js (pa i ndryshuar)
  // =====================================================================
  function pxpShtoMenune() {
    try {
      if (typeof NAV_ICONS !== 'undefined') NAV_ICONS.pxseGjej = '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11h6M11 8v6"/>';
      if (typeof NAV2 !== 'undefined' && !NAV2.some(function (n) { return n.k === 'pxseGjej'; })) {
        var i = NAV2.findIndex(function (n) { return n.k === 'dashboard'; });
        NAV2.splice(i + 1, 0, { k: 'pxseGjej', l: 'Find Customers', subs: [{ l: 'Email Outreach', nav: 'pxseEmailet' }, { l: 'Interest Signals', nav: 'pxseSinjalet' }] });
      }
    } catch (e) {}
  }
  pxpShtoMenune();

  if (typeof window.renderNav2 === 'function') {
    var pxpNav2Origjinal = window.renderNav2;
    window.renderNav2 = function () {
      try { if (typeof curNav !== 'undefined' && PXP_FAQET[curNav] && typeof _nav2OpenKey !== 'undefined' && !_nav2OpenKey) _nav2OpenKey = 'pxseGjej'; } catch (e) {}
      var r = pxpNav2Origjinal.apply(this, arguments);
      // Klikimi te "Find Customers" hap direkt Interest Signals (dhe nenmenute)
      var w = document.getElementById('snav');
      if (w) Array.prototype.forEach.call(w.querySelectorAll('.snItem'), function (b) {
        var l = b.querySelector('.snLbl');
        if (l && l.textContent === 'Find Customers') b.onclick = function (e) {
          e.stopPropagation();
          try { _nav2OpenKey = 'pxseGjej'; } catch (x) {}
          if (typeof curNav !== 'undefined' && PXP_FAQET[curNav]) { window.renderNav2(); return; }
          pxpShko({ v: 'profile', nav: 'pxseEmailet' });
        };
      });
      return r;
    };
  }
  if (typeof window.renderMain === 'function') {
    var pxpMainOrigjinal = window.renderMain;
    window.renderMain = function (s) {
      var k = (s && s.nav) || (typeof curNav !== 'undefined' ? curNav : '');
      if (k === 'pxseGjej') k = 'pxseEmailet';
      if (PXP_FAQET[k]) {
        var m = document.getElementById('mainPanel'); if (!m) return;
        if (SJ) clearTimeout(SJ.timer);
        var trup = pxpKorniza(m, PXP_FAQET[k]);
        if (PXP_FAQET[k] === 'email') pxpEmailet(trup); else pxpSinjalet(trup);
        return;
      }
      return pxpMainOrigjinal.apply(this, arguments);
    };
  }
  ['mainDashboard', 'mainDashboardBalance'].forEach(function (emri) {
    if (typeof window[emri] !== 'function') return;
    var o = window[emri];
    window[emri] = function (m) {
      var r = o.apply(this, arguments);
      var vazhdo = function () { pxpDashboard(m || document.getElementById('mainPanel')); };
      if (r && typeof r.then === 'function') r.then(vazhdo, vazhdo); else vazhdo();
      return r;
    };
  });
  if (typeof window.stateToUrl === 'function') {
    var pxpUrlOrigjinal = window.stateToUrl;
    window.stateToUrl = function (s) {
      if (s && s.v === 'profile' && s.nav === 'pxseSinjalet') return '/app/find-customers/signals';
      if (s && s.v === 'profile' && s.nav === 'pxseEmailet') return '/app/find-customers/emails';
      return pxpUrlOrigjinal.apply(this, arguments);
    };
  }
  if (typeof window.urlToState === 'function') {
    var pxpGjendjaOrigjinale = window.urlToState;
    window.urlToState = function (p) {
      var x = String(p || '').replace(/\/+$/, '');
      if (x === '/app/find-customers' || x === '/app/find-customers/signals') return { v: 'profile', nav: 'pxseSinjalet' };
      if (x === '/app/find-customers/emails') return { v: 'profile', nav: 'pxseEmailet' };
      return pxpGjendjaOrigjinale.apply(this, arguments);
    };
  }
})();
