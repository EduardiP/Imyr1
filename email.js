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
module.exports = { dergo };
