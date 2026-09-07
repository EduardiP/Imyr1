// email.js — Dergim email-esh reale, permes Google Workspace SMTP (nodemailer).
// Kerkon 2 ndryshore mjedisi (Railway → Variables): GMAIL_USER, GMAIL_APP_PASSWORD.
// GMAIL_USER = info@phronexusai.com (ose email-in qe krijove te Google Workspace)
// GMAIL_APP_PASSWORD = fjalekalimi i APLIKACIONIT (jo fjalekalimi normal i llogarise) —
// gjenerohet te myaccount.google.com/apppasswords, kerkon qe 2FA te jete aktiv fillimisht.

const nodemailer = require('nodemailer');
const inLineCss = require('nodemailer-juice');

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
  // Konverton <style> te HTML-ja jote ne stile "inline" (style="...") direkt te
  // secili element — shumica e klienteve email (Outlook, disa Gmail) IGNORONJNE
  // bllokun <style>, prandaj ngjyra/madhesi/etj s'shfaqeshin pa kete hap.
  transporter.use('compile', inLineCss());
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

// ═══ Shabllonet e 2 njoftimeve specifike (Anglisht — audienca e platformes) ═══
function shablloniSnippet7Dite(emri) {
  return {
    subjekti: 'Your free week is ending — connect your ad space',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#3b6ef0;margin:0 0 12px;">Hi ${emri},</h2>
      <p style="line-height:1.6;">For your first 7 days, your ads have been shown across the network automatically — no setup needed.</p>
      <p style="line-height:1.6;"><b>That grace period is ending.</b></p>
      <p style="line-height:1.6;">Connect your ad space now: your ads keep running, uninterrupted.<br>
      Skip it: your ads stop showing, and you stop getting exposure from other businesses too.</p>
      <p><a href="https://phronexusai.com/app/hapesira" style="display:inline-block;background:#3b6ef0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Connect ad space →</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:28px;">PhronexusAI</p>
    </div>`
  };
}
function shablloniPagesa3Muaj(emri) {
  return {
    subjekti: 'Your free 3 months are over — action needed',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#f59e0b;margin:0 0 12px;">Hi ${emri},</h2>
      <p style="line-height:1.6;">Your first 3 months on PhronexusAI were free — full access, no charge.</p>
      <p style="line-height:1.6;"><b>That period has now ended.</b></p>
      <p style="line-height:1.6;">Activate now ($7/month): your ads go back live immediately.<br>
      Skip it: your ads stay off, and you keep missing exposure from the network.</p>
      <p><a href="https://phronexusai.com/app/plani" style="display:inline-block;background:#f59e0b;color:#1a1200;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Activate now →</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:28px;">PhronexusAI</p>
    </div>`
  };
}

module.exports = { dergo, shablloniSnippet7Dite, shablloniPagesa3Muaj };
