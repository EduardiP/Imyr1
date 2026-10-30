// pxse-portali.js (PhronexusAI) — faqja /outreach: direktoria publike (e fshehur) + dashboard-i i klientit me kod.
// Backend: pxse-portali.js (/api/portal/...). Gjithcka ne anglisht. Klienti NUK dergon dhe NUK planifikon: kete e ben admin-i.
(function () {
  'use strict';
  var app = document.getElementById('app');
  var G = { une: null, pamja: 'dashboard', dir: { kategoria: '', lloji: '', vendi: '', kerko: '', faqe: 0 }, ndryshoDergues: false };

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function nr(n) { return Number(n || 0).toLocaleString('en-US'); }
  function data(d) { var t = Date.parse(d); return t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }
  function dita(d) { if (!d) return ''; var t = Date.parse(d + 'T12:00:00Z'); return t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : d; }
  async function api(rruga, metoda, trupi) {
    var o = { method: metoda || 'GET', headers: {}, credentials: 'same-origin' };
    if (trupi !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(trupi); }
    var r = await fetch('/api/portal' + rruga, o), j = {};
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var g = new Error(j.error || 'Please try again in a few minutes.'); g.te = j; g.kodi = r.status; throw g; }
    return j;
  }
  var EMRAT_LLOJI = { b2b: 'B2B', b2c: 'B2C', both: 'B2B & B2C' };
  var VENDET = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', DE: 'Germany', FR: 'France', AU: 'Australia', NL: 'Netherlands', ES: 'Spain', IT: 'Italy', IE: 'Ireland',
    SE: 'Sweden', IN: 'India', IL: 'Israel', SG: 'Singapore', CH: 'Switzerland', BE: 'Belgium', DK: 'Denmark', NO: 'Norway', FI: 'Finland', PL: 'Poland', PT: 'Portugal', EE: 'Estonia', BR: 'Brazil', JP: 'Japan', AT: 'Austria', NZ: 'New Zealand' };
  var emriVendit = function (k) { return VENDET[k] || k; };

  // ---------- Hyrja ----------
  var modal = $('modal');
  $('btnSignIn').onclick = function () { modal.classList.remove('hide'); $('inpCode').focus(); };
  $('btnCancel').onclick = function () { modal.classList.add('hide'); };
  $('formCode').onsubmit = async function (ev) {
    ev.preventDefault();
    var err = $('codeErr'); err.classList.add('hide');
    try { await api('/hyr', 'POST', { kodi: $('inpCode').value }); modal.classList.add('hide'); $('inpCode').value = ''; await nis(); }
    catch (e) { err.textContent = e.message; err.classList.remove('hide'); }
  };
  $('btnSignOut').onclick = async function () { try { await api('/dil', 'POST', {}); } catch (e) {} G.une = null; G.pamja = 'dashboard'; await nis(); };

  async function nis() {
    // Lidhja me kod: /outreach?k=KODI (kodi hiqet menjehere nga adresa)
    var k = new URLSearchParams(location.search).get('k');
    if (k) { history.replaceState(null, '', '/outreach'); try { await api('/hyr', 'POST', { kodi: k }); } catch (e) { alertMsg(e.message); } }
    try { G.une = await api('/une'); } catch (e) { G.une = null; }
    $('btnSignIn').classList.toggle('hide', !!G.une);
    $('btnSignOut').classList.toggle('hide', !G.une);
    vizato();
  }
  function alertMsg(t) { G.mesazhHyrje = t; }

  function vizato() {
    if (!G.une) { app.innerHTML = '<div id="dir"></div>'; direktoria($('dir'), true); return; }
    var u = G.une;
    app.innerHTML = '<div class="tabs"><button class="tab' + (G.pamja === 'dashboard' ? ' on' : '') + '" data-p="dashboard">My dashboard</button>' +
      '<button class="tab' + (G.pamja === 'dir' ? ' on' : '') + '" data-p="dir">Directory</button></div><div id="pamja"></div>';
    app.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { G.pamja = b.getAttribute('data-p'); vizato(); }; });
    if (G.pamja === 'dir') { direktoria($('pamja'), false); return; }
    if (!u.klienti.gati) { profili($('pamja')); return; }
    dashboard($('pamja'));
  }

  // ---------- Direktoria ----------
  async function direktoria(w, publike) {
    var f = G.dir;
    w.innerHTML = (publike ? '<h1>Business directory</h1><p class="sub">Verified business emails, grouped by category. Contact details are partly hidden. ' +
      (G.mesazhHyrje ? '<br><span style="color:var(--err)">' + h(G.mesazhHyrje) + '</span>' : '') + '</p>' : '') +
      '<div class="filters"><select id="fKat"><option value="">All categories</option></select>' +
      '<select id="fLloji"><option value="">B2B and B2C</option><option value="b2b">B2B</option><option value="b2c">B2C</option></select>' +
      '<select id="fVendi"><option value="">All countries</option></select>' +
      '<input id="fKerko" placeholder="Search in descriptions" value="' + h(f.kerko) + '"></div><p class="count" id="dCount"></p><div class="list" id="dList"><p class="empty">Loading…</p></div><div class="pager" id="dPager"></div>';
    var q = new URLSearchParams({ kategoria: f.kategoria, lloji: f.lloji, vendi: f.vendi, kerko: f.kerko, faqe: f.faqe });
    var d; try { d = await api('/direktoria?' + q.toString()); } catch (e) { $('dList').innerHTML = '<p class="empty">' + h(e.message) + '</p>'; return; }
    $('fKat').innerHTML = '<option value="">All categories</option>' + d.kategorite.map(function (x) { return '<option value="' + h(x.v) + '"' + (x.v === f.kategoria ? ' selected' : '') + '>' + h(x.v) + ' (' + nr(x.n) + ')</option>'; }).join('');
    $('fVendi').innerHTML = '<option value="">All countries</option>' + d.vendet.map(function (x) { return '<option value="' + h(x.v) + '"' + (x.v === f.vendi ? ' selected' : '') + '>' + h(emriVendit(x.v)) + ' (' + nr(x.n) + ')</option>'; }).join('');
    $('fLloji').value = f.lloji;
    $('dCount').textContent = nr(d.total) + (d.total === 1 ? ' business' : ' businesses');
    $('dList').innerHTML = d.bizneset.length ? d.bizneset.map(function (x) {
      return '<div class="biz"><div class="d">' + h(x.domaini) + '</div><div class="e">' + h(x.email) + '</div><div class="chips">' +
        (x.kategoria ? '<span class="chip k">' + h(x.kategoria) + '</span>' : '') + (x.lloji ? '<span class="chip">' + h(EMRAT_LLOJI[x.lloji] || x.lloji) + '</span>' : '') +
        (x.vendi ? '<span class="chip">' + h(emriVendit(x.vendi)) + '</span>' : '') + (x.viti ? '<span class="chip">Since ' + h(x.viti) + '</span>' : '') + '</div>' +
        (x.pershkrimi ? '<p>' + h(x.pershkrimi) + '</p>' : '') + '</div>';
    }).join('') : '<p class="empty">No businesses match these filters.</p>';
    var faqet = Math.max(1, Math.ceil(d.total / d.neFaqe));
    $('dPager').innerHTML = '<button class="btn" id="pPrev"' + (f.faqe ? '' : ' disabled') + '>‹ Previous</button> Page ' + (f.faqe + 1) + ' of ' + faqet + ' <button class="btn" id="pNext"' + (f.faqe + 1 < faqet ? '' : ' disabled') + '>Next ›</button>';
    var ri = function () { direktoria(w, publike); };
    $('fKat').onchange = function () { f.kategoria = this.value; f.faqe = 0; ri(); };
    $('fLloji').onchange = function () { f.lloji = this.value; f.faqe = 0; ri(); };
    $('fVendi').onchange = function () { f.vendi = this.value; f.faqe = 0; ri(); };
    $('fKerko').onkeydown = function (ev) { if (ev.key === 'Enter') { f.kerko = this.value.trim(); f.faqe = 0; ri(); } };
    $('pPrev').onclick = function () { if (f.faqe) { f.faqe--; ri(); } };
    $('pNext').onclick = function () { f.faqe++; ri(); };
  }

  // ---------- Hera e pare: profili ----------
  function profili(w) {
    var k = G.une.klienti;
    w.innerHTML = '<div class="card" style="max-width:560px"><h2>Set up your account</h2><p class="sub">Tell us about your company. You only do this once.</p>' +
      '<form id="fProf"><label for="pEmri">Company name</label><input id="pEmri" value="' + h(k.emri || '') + '" placeholder="Your Company">' +
      '<label for="pDom">Website</label><input id="pDom" value="' + h(k.domaini || '') + '" placeholder="yourcompany.com">' +
      '<p class="msg err hide" id="pErr"></p><div class="acts"><button class="btn pri" type="submit">Continue</button></div></form></div>';
    $('fProf').onsubmit = async function (ev) {
      ev.preventDefault();
      try { await api('/profili', 'POST', { emri: $('pEmri').value, domaini: $('pDom').value }); await nis(); }
      catch (e) { $('pErr').textContent = e.message; $('pErr').classList.remove('hide'); }
    };
  }

  // ---------- Dashboard ----------
  function dashboard(w) {
    var u = G.une, k = u.klienti;
    w.innerHTML = '<h1>' + h(k.emri) + '</h1><p class="sub">' + h(k.domaini) + '</p>' +
      (k.aktiv ? '<div class="banner ok">Your outreach is active' + (k.aktiv_deri ? ' until ' + h(dita(k.aktiv_deri)) : '') + '. Up to ' + nr(k.ditore) + ' emails a day.</div>'
        : '<div class="banner off">Your outreach is paused' + (k.aktiv_deri ? ' (ended on ' + h(dita(k.aktiv_deri)) + ')' : '') + '. Scheduled emails will not be sent. Contact us to continue.</div>') +
      '<div class="card" id="cDergues"></div><div class="card" id="cEmail"></div><div class="card" id="cRez"></div>';
    kartaDergues($('cDergues')); kartaEmail($('cEmail')); kartaRezultate($('cRez'));
  }

  function kartaDergues(w) {
    var u = G.une, g = u.derguesi;
    if (g && !G.ndryshoDergues) {
      w.innerHTML = '<h2>Your sending email</h2><p class="sub">We send your emails from this address. Replies come straight to your inbox.</p>' +
        '<div class="conn"><span class="dot' + (g.gabimi ? ' bad' : '') + '"></span><b>' + h(g.email) + '</b>' + (g.emri ? '<span style="color:var(--mut)">as “' + h(g.emri) + '”</span>' : '') + '</div>' +
        (g.gabimi ? '<p class="msg err">' + h(g.gabimi) + '</p>' : '') +
        '<div class="acts"><button class="btn" id="gNdrysho">Change</button><button class="btn" id="gShkep">Disconnect</button></div><p class="msg err hide" id="gErr"></p>';
      $('gNdrysho').onclick = function () { G.ndryshoDergues = true; kartaDergues(w); };
      $('gShkep').onclick = async function () { try { await api('/derguesi', 'DELETE'); G.une.derguesi = null; kartaDergues(w); } catch (e) { $('gErr').textContent = e.message; $('gErr').classList.remove('hide'); } };
      return;
    }
    var p = g || {};
    w.innerHTML = '<h2>Connect your business email</h2><p class="sub">Use your email on ' + h(G.une.klienti.domaini) + '. Your password is encrypted and is only used to send the emails we schedule for you.</p>' +
      (u.celesi ? '' : '<p class="msg warn">Connecting a mailbox is not available yet. Please try again later.</p>') +
      '<form id="fG"><div class="row"><div><label for="gEmail">Business email</label><input id="gEmail" type="email" value="' + h(p.email || '') + '" placeholder="name@' + h(G.une.klienti.domaini) + '"></div>' +
      '<div><label for="gEmri">Sender name</label><input id="gEmri" value="' + h(p.emri || '') + '" placeholder="Your Name from ' + h(G.une.klienti.emri) + '"></div></div>' +
      '<label for="gPass">Password or app password</label><input id="gPass" type="password" autocomplete="new-password">' +
      '<p class="help" id="gHelp">If your email uses 2-step verification, create an app password in your email account settings and paste it here.</p>' +
      '<details id="gAdv"><summary>Server settings (filled in automatically)</summary><div class="row"><div><label for="gHost">SMTP server</label><input id="gHost" value="' + h(p.host || '') + '" placeholder="smtp.yourprovider.com"></div>' +
      '<div><label for="gPort">Port</label><input id="gPort" value="' + h(p.port || '') + '" placeholder="587"></div></div><label for="gUser">Username</label><input id="gUser" placeholder="Usually your email address"></details>' +
      '<p class="msg err hide" id="gErr"></p><div class="acts"><button class="btn pri" type="submit">Connect</button>' + (g ? '<button class="btn" type="button" id="gAnulo">Cancel</button>' : '') + '</div></form>';
    var em = $('gEmail');
    em.onchange = async function () {
      try {
        var s = await api('/derguesi/sugjerim?email=' + encodeURIComponent(em.value.trim()));
        if (s.host && !$('gHost').value) $('gHost').value = s.host;
        if (s.port && !$('gPort').value) $('gPort').value = s.port;
        var l = { 'Google Workspace': 'https://myaccount.google.com/apppasswords', 'Microsoft 365': 'https://account.microsoft.com/security', 'Zoho Mail': 'https://accounts.zoho.com/home#security/app_password' }[s.ofruesi];
        if (s.ofruesi) $('gHelp').innerHTML = 'Your email is on <b>' + h(s.ofruesi) + '</b>. With 2-step verification, create an app password' + (l ? ' <a href="' + l + '" target="_blank" rel="noopener">here</a>' : '') + ' and paste it above.';
        else { $('gHelp').textContent = 'We could not detect your provider. Open “Server settings” and enter your SMTP server.'; $('gAdv').open = true; }
      } catch (e) {}
    };
    if ($('gAnulo')) $('gAnulo').onclick = function () { G.ndryshoDergues = false; kartaDergues(w); };
    $('fG').onsubmit = async function (ev) {
      ev.preventDefault();
      var b = this.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Checking…';
      try {
        var r = await api('/derguesi', 'POST', { email: em.value, emri: $('gEmri').value, fjalekalimi: $('gPass').value, host: $('gHost').value, port: $('gPort').value, perdoruesi: $('gUser').value });
        G.une.derguesi = r.derguesi; G.ndryshoDergues = false; kartaDergues(w);
      } catch (e) { $('gErr').textContent = e.message; $('gErr').classList.remove('hide'); b.disabled = false; b.textContent = 'Connect'; }
    };
  }

  function kartaEmail(w) {
    var u = G.une, e = u.emaili || {}, d = e.dizajn || {};
    w.innerHTML = '<h2>Your email</h2><p class="sub">Write the email you want businesses to receive, or let AI write it from your website. Use {company} for the name of each business. ' +
      'Our team reviews it and schedules the sending for you.</p>' +
      '<label for="eSub">Subject</label><input id="eSub" style="width:100%" value="' + h(e.subjekti || '') + '" placeholder="Quick idea for {company}">' +
      '<label for="eTrupi">Message</label><textarea id="eTrupi" placeholder="Hi {company} team,…">' + h(e.trupi || '') + '</textarea>' +
      '<div class="row"><div><label for="eMarka">Signature (your company)</label><input id="eMarka" value="' + h(e.marka || u.klienti.emri || '') + '"></div>' +
      '<div><label for="eDiz">Design</label><select id="eDiz">' + u.dizajnet.map(function (x) { return '<option value="' + h(x) + '"' + (String(d.id || '2') === x ? ' selected' : '') + '>Design ' + h(x) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row"><div><label for="eNgj">Accent color</label><input id="eNgj" type="color" value="' + h(d.ngjyra || '#3b6ef0') + '" style="width:80px;height:40px;padding:3px"></div>' +
      '<div><label><input type="checkbox" id="eBut"' + (d.meButon ? ' checked' : '') + ' style="width:auto;margin-right:6px">Add a button to your website</label>' +
      '<input id="eButT" placeholder="Visit our website" value="' + h(d.butoniTekst || '') + '"></div></div>' +
      '<p class="msg hide" id="eMsg"></p>' +
      '<div class="acts"><button class="btn" id="eAI">✦ Write it with AI</button><button class="btn" id="ePrev">Preview</button><button class="btn pri" id="eRuaj">Save email</button></div>' +
      (e.perditesuar_at ? '<p class="help">Last saved ' + h(data(e.perditesuar_at)) + (e.nga === 'admin' ? ' by our team' : '') + '.</p>' : '') +
      '<iframe class="prev hide" id="eFrame" sandbox title="Email preview"></iframe>';
    var mbledh = function () {
      return { subjekti: $('eSub').value, trupi: $('eTrupi').value, marka: $('eMarka').value,
        dizajn: { id: $('eDiz').value, ngjyra: $('eNgj').value, meButon: $('eBut').checked, butoniTekst: $('eButT').value, butoniLink: 'https://' + G.une.klienti.domaini } };
    };
    var msg = function (t, kl) { var m = $('eMsg'); m.className = 'msg ' + (kl || ''); m.innerHTML = t; m.classList.toggle('hide', !t); };
    $('ePrev').onclick = async function () {
      try { var r = await api('/parapamje', 'POST', mbledh()); var f = $('eFrame'); f.srcdoc = r.html; f.classList.remove('hide'); f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      catch (x) { msg(h(x.message), 'err'); }
    };
    $('eRuaj').onclick = async function () {
      try {
        var r = await api('/email', 'POST', mbledh());
        G.une.emaili = Object.assign({}, mbledh(), { perditesuar_at: new Date().toISOString(), nga: 'klienti' });
        msg((r.paralajmerime && r.paralajmerime.length ? 'Saved. A few things could hurt delivery: ' + h(r.paralajmerime.join('; ')) + '.' : 'Saved. Our team will review it and schedule the sending.'), r.paralajmerime && r.paralajmerime.length ? 'warn' : 'ok');
      } catch (x) { msg(h(x.message), 'err'); }
    };
    $('eAI').onclick = async function () {
      var b = this; b.disabled = true; b.textContent = 'Writing… (about a minute)';
      try {
        var r = await api('/email/ai', 'POST', {});
        $('eSub').value = r.subjekti || ''; $('eTrupi').value = r.trupi || ''; if (r.marka) $('eMarka').value = r.marka;
        if (r.butoniTekst) $('eButT').value = r.butoniTekst; if (/^#[0-9a-f]{6}$/i.test(r.ngjyra || '')) $('eNgj').value = r.ngjyra;
        msg('AI wrote a draft from your website. Edit it if you want, then click “Save email”.', 'ok');
      } catch (x) { msg(h(x.message), 'err'); }
      b.disabled = false; b.textContent = '✦ Write it with AI';
    };
  }

  function kartaRezultate(w) {
    var u = G.une, t = u.totalet || {}, kub = function (k, v) { return '<div class="cube"><b>' + nr(v) + '</b><span>' + k + '</span></div>'; };
    w.innerHTML = '<h2>Results</h2><p class="sub">Every email we sent for you, and what happened to it.</p><div class="cubes">' +
      kub('Scheduled', t.planifikuar) + kub('Sent', t.derguar) + kub('Opened', t.hapur) + kub('Clicked', t.klikuar) + kub('Unsubscribed', t.cregj) + '</div>' +
      (u.dergimet.length ? '<div class="tbl"><table><thead><tr><th>Business</th><th>Category</th><th>Subject</th><th>Sent</th><th>Opened</th><th>Clicks</th></tr></thead><tbody>' +
        u.dergimet.map(function (x) {
          return '<tr><td>' + h(x.marresi) + '</td><td>' + h(x.kategoria || '') + '</td><td>' + h(x.subjekti) + '</td><td>' + (x.statusi === 'deshtoi' ? '<span class="no">Not delivered</span>' : h(data(x.derguar_at))) + '</td>' +
            '<td>' + (x.hapur ? '<span class="yes">Yes' + (x.hapje > 1 ? ' (' + x.hapje + '×)' : '') + '</span>' : '<span class="no">—</span>') + '</td>' +
            '<td>' + (x.klikime ? '<span class="yes">' + x.klikime + '</span>' : '<span class="no">—</span>') + (x.cregj ? ' <span class="no">· unsubscribed</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="empty">No emails sent yet. Once your email is ready and approved, we start sending.</p>') +
      '<p class="help">Opens are estimated: some email apps block tracking images, so real opens can be higher.</p>';
  }

  nis();
})();
