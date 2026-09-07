// email.js — Dergim email-esh reale, permes Google Workspace SMTP (nodemailer).
// Kerkon 2 ndryshore mjedisi (Railway → Variables): GMAIL_USER, GMAIL_APP_PASSWORD.
// GMAIL_USER = info@phronexusai.com (ose email-in qe krijove te Google Workspace)
// GMAIL_APP_PASSWORD = fjalekalimi i APLIKACIONIT (jo fjalekalimi normal i llogarise) —
// gjenerohet te myaccount.google.com/apppasswords, kerkon qe 2FA te jete aktiv fillimisht.

const nodemailer = require('nodemailer');

let transporter = null;
function merrTransporter() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('email.js: GMAIL_USER / GMAIL_APP_PASSWORD s\'jane vendosur — dergimi i email-eve eshte i çaktivizuar.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // port 587 perdor STARTTLS, jo TLS direkte si 465
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    connectionTimeout: 10000, // 10s per te lidhur me serverin
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  return transporter;
}

async function dergo({ te, subjekti, html }) {
  const t = merrTransporter();
  if (!t) return { ok: false, error: 'Email-i s\'eshte konfiguruar (mungojne ndryshoret e mjedisit).' };
  try {
    await t.sendMail({
      from: '"PhronexusAI" <' + process.env.GMAIL_USER + '>',
      to: te, subject: subjekti, html
    });
    return { ok: true };
  } catch (e) {
    console.error('email.js dergo():', e.message);
    return { ok: false, error: e.message };
  }
}

// ═══ Shabllonet e 2 njoftimeve specifike ═══
function shablloniSnippet7Dite(emri) {
  return {
    subjekti: 'Lidh hapësirën e reklamave — 7 ditët e para po skadojnë',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#3b6ef0;">Përshëndetje, ${emri}!</h2>
      <p>Reklama jote ka qenë aktive te rrjeti i PhronexusAI gjatë 7 ditëve të para, pa nevojë snippet-i.</p>
      <p><b>Kjo periudhë po përfundon.</b> Për t'i vazhduar shfaqjet, lidh hapësirën tënde të reklamave tani.</p>
      <p><a href="https://phronexusai.com/app/hapesira" style="display:inline-block;background:#3b6ef0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Lidh hapësirën tani →</a></p>
      <p style="color:#888;font-size:13px;margin-top:24px;">PhronexusAI</p>
    </div>`
  };
}
function shablloniPagesa3Muaj(emri) {
  return {
    subjekti: 'Periudha jote falas ka përfunduar',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#f59e0b;">Përshëndetje, ${emri}!</h2>
      <p>3 muajt e parë falas te PhronexusAI kanë përfunduar. Reklamat e tua janë ndaluar përkohësisht.</p>
      <p>Aktivizo planin ($7/muaj) për t'i rikthyer shërbimit menjëherë.</p>
      <p><a href="https://phronexusai.com/app/plani" style="display:inline-block;background:#f59e0b;color:#1a1200;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Aktivizo tani →</a></p>
      <p style="color:#888;font-size:13px;margin-top:24px;">PhronexusAI</p>
    </div>`
  };
}

module.exports = { dergo, shablloniSnippet7Dite, shablloniPagesa3Muaj };
