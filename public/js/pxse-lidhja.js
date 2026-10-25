// pxse-lidhja.js (PhronexusAI) — lidh seksionin publik <px-sinjale-email> me hyrjen/regjistrimin ekzistues.
// Ngarkohet PAS core.js, auth.js dhe app.js. Nuk ndryshon asnje prej tyre: vetem mbeshtjell dy funksione
// ekzistuese (loadMe dhe renderZgjedhja) dhe therret funksionet qe ato skedare kane tashme
// (hapModal, zgjVazhdoAutomatik, nav).
//
// Rrjedha:
//  1. Klienti klikon "Sign in for unlimited use" (email-et) ose "Sign in to get the latest interest signals" (sinjalet).
//     Seksioni dergon ngjarjen px-veprim { veprimi:'hyr', nga, domaini, seanca }.
//  2. Ruajme { domaini, nga, seanca } ne localStorage ('pxse_hyrje'), qe te mbijetojne edhe kalimin te Google,
//     dhe hapim modalin ekzistues te regjistrimit.
//  3. Pas hyrjes (loadMe): seanca e proves i lidhet llogarise (POST /api/pxse/lidh), qe te dhenat e proves te mos fshihen.
//  4. Llogari E RE (asnje hap i plotesuar) => core.js e con te ekrani i zgjedhjes. Ketu, ne vend qe klienti te zgjedhe,
//     plotesojme domainin te fusha ekzistuese 'zgjAutoUrl' dhe nisim studimin ekzistues me modalitetin 'ankand'.
//     Ekrani ekzistues i pritjes e con vete ne dashboard-in Ankand.
//     Llogari EKZISTUESE => asnje ristudim; vetem lidhja e seances, pastaj vazhdon normalisht.
(function () {
  'use strict';
  if (window.__pxseLidhjaGati) return;
  window.__pxseLidhjaGati = true;

  var CELESI_HYRJES = 'pxse_hyrje';
  var CELESI_SEANCES = 'pxse_seanca';
  var JETEGJATESIA_MS = 24 * 3600 * 1000; // hyrja e nisur nga prova vlen 24 ore

  function pxseLexoHyrjen() {
    try {
      var p = JSON.parse(localStorage.getItem(CELESI_HYRJES) || 'null');
      if (!p || typeof p !== 'object' || !p.koha || Date.now() - p.koha > JETEGJATESIA_MS) return null;
      return p;
    } catch (e) { return null; }
  }
  function pxseRuajHyrjen(p) { try { localStorage.setItem(CELESI_HYRJES, JSON.stringify(p)); } catch (e) {} }
  function pxseFshiHyrjen() { try { localStorage.removeItem(CELESI_HYRJES); } catch (e) {} }
  function pxseSeancaRuajtur() {
    try { var v = localStorage.getItem(CELESI_SEANCES) || ''; return /^[a-f0-9]{32}$/.test(v) ? v : ''; } catch (e) { return ''; }
  }
  function pxsePastroDomainin(d) {
    return String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '').replace(/^www\./, '').slice(0, 253);
  }
  function pxseEshteLlogariERe() {
    // E njejta kusht qe core.js -> pasHyrjes() perdor per te shfaqur ekranin e zgjedhjes.
    var pr = (typeof prog !== 'undefined') ? prog : null;
    return !!(pr && !pr.llogaria && !pr.pershkrimi && !pr.lidhja);
  }

  // --- 3. Lidhja e seances me llogarine ---
  var pxseDukeLidhur = false;
  async function pxseLidhSeancen() {
    var seanca = pxseSeancaRuajtur(); if (!seanca || pxseDukeLidhur) return;
    var p = pxseLexoHyrjen() || {};
    pxseDukeLidhur = true;
    try {
      var r = await fetch('/api/pxse/lidh', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seanca: seanca, domaini: p.domaini || '', nga: p.nga || '' }) });
      if (r.ok) { try { localStorage.removeItem(CELESI_SEANCES); } catch (e) {} } // seanca u lidh: nje prove e re do te kete kod te ri
    } catch (e) {}
    pxseDukeLidhur = false;
  }

  // --- 1/2. Klikimi i butonave te hyrjes ne seksion ---
  document.addEventListener('px-veprim', function (ev) {
    var d = (ev && ev.detail) || {};
    if (d.veprimi !== 'hyr') return;
    pxseRuajHyrjen({ domaini: pxsePastroDomainin(d.domaini), nga: d.nga === 'sinjale' ? 'sinjale' : 'email',
      seanca: pxseSeancaRuajtur(), koha: Date.now(), nisur: false });
    try { sessionStorage.setItem('preferuarModaliteti', 'ankand'); } catch (e) {}
    if (typeof une !== 'undefined' && une) {
      // Tashme i loguar ne kete shfletues: vetem lidh seancen dhe hap dashboard-in.
      pxseLidhSeancen(); pxseFshiHyrjen();
      if (typeof nav === 'function') nav({ v: 'profile', nav: 'dashboard' });
      return;
    }
    if (typeof hapModal === 'function') hapModal('reg');
  });

  // --- 3. Pas cdo hyrjeje (email, Google, refresh) ---
  if (typeof window.loadMe === 'function') {
    var pxseLoadMeOrigjinal = window.loadMe;
    window.loadMe = async function () {
      var ok = await pxseLoadMeOrigjinal.apply(this, arguments);
      if (ok && (pxseLexoHyrjen() || pxseSeancaRuajtur())) {
        await pxseLidhSeancen();
        // Llogari ekzistuese: nuk ristudiohet; hyrja e proves mbaron ketu.
        if (!pxseEshteLlogariERe()) pxseFshiHyrjen();
      }
      return ok;
    };
  }

  // --- 4. Llogari e re: studimi automatik i domainit, direkt ne Ankand ---
  if (typeof window.renderZgjedhja === 'function') {
    var pxseZgjedhjaOrigjinale = window.renderZgjedhja;
    window.renderZgjedhja = function () {
      pxseZgjedhjaOrigjinale.apply(this, arguments);
      var p = pxseLexoHyrjen();
      if (!p || p.nisur) return;
      p.nisur = true; pxseRuajHyrjen(p); // vetem nje here (zgjSetTab e rivizaton ekranin)
      try { sessionStorage.setItem('preferuarModaliteti', 'ankand'); } catch (e) {}
      var fusha = document.getElementById('zgjAutoUrl');
      if (!p.domaini || !fusha || typeof zgjVazhdoAutomatik !== 'function') return; // pa domain: ekrani normal i zgjedhjes
      fusha.value = p.domaini;
      zgjVazhdoAutomatik();
      pxseFshiHyrjen();
    };
  }

  // --- Sinjali "jam ende ketu" per proven pa hyrje (fshirja behet vetem pas pasivitetit) ---
  setInterval(function () {
    if (document.hidden || (typeof une !== 'undefined' && une)) return;
    var seanca = pxseSeancaRuajtur(); if (!seanca) return;
    fetch('/api/pxse/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seanca: seanca }) }).catch(function () {});
  }, 4 * 60 * 1000);
})();
