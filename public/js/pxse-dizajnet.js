// pxse-dizajnet.js (PhronexusAI) — dizajnet e miratuara te email-it per sherbimin falas te dergimit.
// Vetem kod (pa databaze): cdo dizajn eshte nje funksion qe merr te dhenat e email-it dhe kthen HTML.
// Te gjitha jane te ndertuara si shablloni "Biznes online - outreach": tabela, stile inline, gjeresi 580px,
// pak imazhe, shume tekst — qe te shfaqen njesoj ne Gmail/Outlook dhe te mos duken si reklame.
//
// Te dhenat (v):
//   marka       emri i biznesit dergues (klienti)          domaini    domaini i tij (per lidhjen ne nenshkrim)
//   logo        URL https e logos se klientit (ose bosh: perdoret shkronja e pare e emrit)
//   ngjyra      ngjyra e theksit (#rrggbb)                  paragrafet lista e paragrafeve (tekst i paster, me {company} te zevendesuar)
//   butoni      { tekst, link } ose null                   fundiJo    teksti "Not relevant? Just reply no…"   cregj  teksti "Unsubscribe"
//   sticker     teksti i sticker-it { rreshti1, rreshti2 }
// Globali i vetem: window.pxseDizajnet. Ne server: const dizajnet = require('./public/js/pxse-dizajnet.js');
// Keshtu email-i qe dergohet ndertohet me TE NJEJTIN kod si parapamja: ajo qe sheh klienti eshte ajo qe dergohet.
(function (rrenja) {
  'use strict';
  if (rrenja.pxseDizajnet) return;

  var F = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  var FS = 'font-family:Georgia,\'Times New Roman\',serif;';
  function e(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function https(u) { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function ngjyra(c) { return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : '#3b6ef0'; }
  function rgb(c) { var n = parseInt(ngjyra(c).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mbiNgjyre(c) { var x = rgb(c); return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) > 170 ? '#141625' : '#ffffff'; }
  function zbeh(c, sa) { // perzien ngjyren me te bardhen (sa = 0..1 sa e bardhe)
    var x = rgb(c); return '#' + x.map(function (k) { var v = Math.round(k + (255 - k) * sa); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }

  // ---- pjeset e perbashketa ----
  function logoja(v, madh, rreth, mbiSfond) { // mbiSfond: ngjyra e sfondit kur logoja eshte mbi header me ngjyre
    var l = https(v.logo), m = madh || 28, r = rreth == null ? 7 : rreth;
    if (l) return '<img src="' + e(l) + '" width="' + m + '" height="' + m + '" alt="' + e(v.marka) + '" style="display:block;border-radius:' + r + 'px;border:0;">';
    var ng = ngjyra(v.ngjyra), bg = mbiSfond ? mbiNgjyre(mbiSfond) : ng, tx = mbiSfond ? mbiSfond : mbiNgjyre(ng);
    return '<div style="width:' + m + 'px;height:' + m + 'px;border-radius:' + r + 'px;background:' + bg + ';color:' + tx + ';' + F +
      'font-size:' + Math.round(m / 2) + 'px;font-weight:700;text-align:center;line-height:' + m + 'px;">' + e(String(v.marka || '?').charAt(0).toUpperCase()) + '</div>';
  }
  function teksti(v, ngj, madh) {
    return v.paragrafet.map(function (p) { return '<p style="margin:0 0 14px;' + (ngj || '') + '">' + e(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function butoni(v, ng, rrezja) {
    if (!v.butoni || !https(v.butoni.link)) return '';
    var c = ngjyra(ng || v.ngjyra);
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;"><tr><td style="background:' + c + ';border-radius:' + (rrezja == null ? 7 : rrezja) + 'px;">' +
      '<a href="' + e(https(v.butoni.link)) + '" style="display:inline-block;padding:11px 22px;' + F + 'font-size:14px;font-weight:600;color:' + mbiNgjyre(c) + ';text-decoration:none;">' + e(v.butoni.tekst || 'Visit our website') + '</a></td></tr></table>';
  }
  function nenshkrimi(v, ngjEmri) {
    // Vetem emri i derguesit; lidhja e faqes se tij eshte butoni (qe klienti e ndryshon ose e heq).
    return '<p style="margin:4px 0 0;' + F + 'font-size:14px;line-height:1.6;color:#1c2128;"><b style="' + (ngjEmri ? 'color:' + ngjEmri + ';' : '') + '">' + e(v.marka) + '</b></p>';
  }
  function fundi(v) {
    return '<p style="margin:0;' + F + 'font-size:12px;line-height:1.5;color:#9aa4b2;">' + e(v.fundiJo) + ' &middot; <a href="#" style="color:#9aa4b2;">' + e(v.cregj || 'Unsubscribe') + '</a></p>';
  }
  // Sticker-i i PhronexusAI: logo majtas (sa dy rreshtat), dy rreshta djathtas; i gjithi nje lidhje e vetme.
  function sticker(v) {
    if (v.sticker === false) return ''; // llogari me snippet aktiv: pa sticker
    var s = v.sticker || {};
    return '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:16px auto 0;"><tr><td>' +
      '<a href="https://phronexusai.com/" style="display:block;text-decoration:none;border:1px solid #e3e6ea;border-radius:10px;background:#ffffff;padding:8px 14px 8px 10px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="vertical-align:middle;"><img src="https://phronexusai.com/favicon-192.png" width="32" height="32" alt="PhronexusAI" style="display:block;border:0;border-radius:7px;"></td>' +
      '<td style="vertical-align:middle;padding-left:10px;' + F + 'line-height:1.35;">' +
      '<span style="display:block;font-size:13px;font-weight:700;color:#1c2128;">' + e(s.rreshti1 || 'Powered by PhronexusAI') + '</span>' +
      '<span style="display:block;font-size:12px;color:#5b6472;">' + e(s.rreshti2 || 'Find customers, 100% free') + '</span></td>' +
      '</tr></table></a></td></tr></table>';
  }
  // Mbeshtjellesi i perbashket: sfondi jashte dhe karta 580px
  function korniza(sfondi, karta, permbajtja, pas) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + sfondi + ';"><tr><td align="center" style="padding:28px 12px;">' +
      '<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;' + karta + '">' + permbajtja + '</table>' +
      (pas || '') + '</td></tr></table>';
  }
  var TRUPI = F + 'font-size:15px;line-height:1.65;color:#3d4451;';

  var D = [];

  // 1 — I thjeshte: pa header, si email personal (me i miri per Inbox-in kryesor)
  D.push({ id: '1', nderto: function (v) {
    return '<div style="' + F + 'font-size:15px;line-height:1.6;color:#202124;max-width:580px;">' + teksti(v) + butoni(v) + nenshkrimi(v) +
      '<div style="margin-top:22px;">' + fundi(v) + '</div>' + sticker(v) + '</div>';
  } });

  // 2 — Klasik: shirit me ngjyre ne krye, logo + emri (si shablloni i admin-it)
  D.push({ id: '2', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#eef0f3', 'background:#ffffff;border-radius:14px;overflow:hidden;',
      '<tr><td style="background:' + ng + ';padding:18px 28px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v, 28, 7, ng) + '</td>' +
      '<td style="padding-left:10px;' + F + 'font-size:15px;font-weight:600;color:' + mbiNgjyre(ng) + ';">' + e(v.marka) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:28px 28px 8px;' + TRUPI + '">' + teksti(v) + butoni(v) + '</td></tr>' +
      '<tr><td style="padding:0 28px 24px;">' + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="border-top:1px solid #edeef1;padding:14px 28px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 3 — Minimal: header i bardhe me logo + emri, vije e holle me ngjyre poshte
  D.push({ id: '3', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#f4f5f7', 'background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8ec;',
      '<tr><td style="padding:20px 28px;border-bottom:2px solid ' + ng + ';"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v) + '</td>' +
      '<td style="padding-left:10px;' + F + 'font-size:15px;font-weight:600;color:#1c2128;">' + e(v.marka) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:26px 28px 8px;' + TRUPI + '">' + teksti(v) + butoni(v) + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="padding:18px 28px 20px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 4 — Shirit anesor: vije vertikale me ngjyre ne te majte te kartes
  D.push({ id: '4', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#f4f5f7', 'background:#ffffff;border-radius:10px;overflow:hidden;',
      '<tr><td width="5" style="width:5px;background:' + ng + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="padding:24px 28px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr><td>' + logoja(v, 26) + '</td><td style="padding-left:10px;' + F + 'font-size:14px;font-weight:600;color:#1c2128;">' + e(v.marka) + '</td></tr></table>' +
      '<div style="' + TRUPI + '">' + teksti(v) + butoni(v) + '</div>' + nenshkrimi(v) +
      '<div style="margin-top:18px;padding-top:12px;border-top:1px solid #edeef1;">' + fundi(v) + '</div></td></tr>', sticker(v));
  } });

  // 5 — Vije siper: shirit i holle me ngjyre ne krye te kartes, logo ne qender
  D.push({ id: '5', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#eef0f3', 'background:#ffffff;border-radius:12px;overflow:hidden;border-top:4px solid ' + ng + ';',
      '<tr><td align="center" style="padding:24px 28px 6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v, 40, 10) + '</td></tr></table>' +
      '<p style="margin:8px 0 0;' + F + 'font-size:14px;font-weight:600;color:#1c2128;">' + e(v.marka) + '</p></td></tr>' +
      '<tr><td style="padding:18px 32px 6px;' + TRUPI + '">' + teksti(v) + butoni(v) + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="padding:18px 32px 22px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 6 — Nuance: sfond i lehte me ngjyren e markes, karte e bardhe pa header
  D.push({ id: '6', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza(zbeh(ng, 0.9), 'background:#ffffff;border-radius:14px;overflow:hidden;',
      '<tr><td style="padding:26px 30px 6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v, 30, 15) + '</td>' +
      '<td style="padding-left:10px;' + F + 'font-size:15px;font-weight:600;color:' + ng + ';">' + e(v.marka) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:18px 30px 6px;' + TRUPI + '">' + teksti(v) + butoni(v, null, 999) + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="padding:18px 30px 22px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 7 — Leter zyrtare: emri me germa serif ne krye, vije e holle, tekst klasik
  D.push({ id: '7', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#f6f5f2', 'background:#ffffff;border:1px solid #e7e4dd;',
      '<tr><td style="padding:26px 32px 14px;border-bottom:1px solid #e7e4dd;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="' + FS + 'font-size:20px;color:' + ng + ';">' + e(v.marka) + '</td><td align="right">' + logoja(v, 30, 4) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:26px 32px 6px;' + FS + 'font-size:16px;line-height:1.7;color:#2b2b2b;">' + teksti(v) + butoni(v, null, 3) + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="padding:18px 32px 22px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 8 — Karte nenshkrimi: tekst i thjeshte, nenshkrimi ne nje kuti me logo (pa header)
  D.push({ id: '8', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return '<div style="' + F + 'font-size:15px;line-height:1.6;color:#202124;max-width:580px;">' + teksti(v) + butoni(v) +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px;border-left:3px solid ' + ng + ';"><tr>' +
      '<td style="padding:4px 12px 4px 12px;">' + logoja(v, 36, 8) + '</td>' +
      '<td style="padding:4px 0;' + F + 'font-size:14px;line-height:1.5;color:#1c2128;"><b>' + e(v.marka) + '</b>' +
      '</td></tr></table>' +
      '<div style="margin-top:22px;">' + fundi(v) + '</div>' + sticker(v) + '</div>';
  } });

  // 9 — Kuti e theksuar: butoni dhe nenshkrimi brenda nje kutie me nuance te markes
  D.push({ id: '9', nderto: function (v) {
    var ng = ngjyra(v.ngjyra);
    return korniza('#f4f5f7', 'background:#ffffff;border-radius:12px;overflow:hidden;',
      '<tr><td style="padding:22px 28px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v) + '</td>' +
      '<td style="padding-left:10px;' + F + 'font-size:15px;font-weight:600;color:#1c2128;">' + e(v.marka) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:20px 28px 4px;' + TRUPI + '">' + teksti(v) + '</td></tr>' +
      '<tr><td style="padding:0 28px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + zbeh(ng, 0.92) + ';border-radius:10px;"><tr><td style="padding:16px 18px;">' +
      butoni(v) + nenshkrimi(v) + '</td></tr></table></td></tr>' +
      '<tr><td style="border-top:1px solid #edeef1;padding:14px 28px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  // 10 — E erret: header i erret me logo, karte e bardhe, theks me ngjyren e markes te butoni
  D.push({ id: '10', nderto: function (v) {
    return korniza('#e9ebef', 'background:#ffffff;border-radius:14px;overflow:hidden;',
      '<tr><td style="background:#0f1729;padding:20px 28px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td>' + logoja(v) + '</td>' +
      '<td style="padding-left:10px;' + F + 'font-size:15px;font-weight:600;color:#ffffff;">' + e(v.marka) + '</td></tr></table></td></tr>' +
      '<tr><td style="padding:28px 28px 8px;' + TRUPI + '">' + teksti(v) + butoni(v) + '</td></tr>' +
      '<tr><td style="padding:0 28px 24px;">' + nenshkrimi(v) + '</td></tr>' +
      '<tr><td style="border-top:1px solid #edeef1;padding:14px 28px;">' + fundi(v) + '</td></tr>', sticker(v));
  } });

  rrenja.pxseDizajnet = D;
  // I njejti skedar perdoret edhe ne server (Node) kur te ndertohet dergimi: require('./public/js/pxse-dizajnet.js')
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
