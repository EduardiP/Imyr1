// pxse-alertet.js (PhronexusAI) — Google Alerts per sinjalet: lista e alerteve (CSV) ne databaze, leximi i feed-eve,
// kategorizimi automatik dhe ruajtja e rezultateve.
// Server.js e therret: require('./pxse-alertet')(app, pool, iAdmin);
//
// Si funksionon:
//  1. Kur niset serveri, pxse-alertet-lista.csv (333 alerte: nr, kategoria, B2B/B2C, teksti i alertit) hyn te tabela pxse_alertet_lista.
//  2. Adresat e feed-eve merren nga variabla PXSE_ALERTET_FEEDS (dhe PXSE_ALERTET_FEEDS_2, _3 ... nese nje nuk mjafton):
//     adresat e plota https://www.google.com/alerts/feeds/<llogaria>/<alerti>, te ndara me presje. Lejohet edhe "nr|adresa".
//  3. Cdo 30 minuta (dhe 30 sekonda pas nisjes) lexohet cdo feed. Herën e pare, titulli i feed-it ("Google Alert - <kerkimi>")
//     krahasohet me tekstin e alertit te CSV-se dhe lidhja ruhet te pxse_alertet_feedet: kodi i feed-it -> nr, kategoria, lloji.
//  4. Cdo rezultat i ri ruhet te pxse_alertet_rezultate me kategorine dhe llojin e feed-it (lidhja e vertete, jo ajo e Google).
//  5. Fshirja: rezultatet qe kane ardhur para me shume se 3 javesh fshihen, pervec atyre te kategorive qe i ka te pakten nje klient
//     (tabela pxse_alertet_klientet; mbushet me vone, kur AI t'u caktoje klienteve alertet).
//  Admin: GET /api/admin/pxse/alertet (permbledhja), POST /api/admin/pxse/alertet/lexo (lexim menjehere).
const fs = require('fs');
const path = require('path');
const { pxseFetchKohe, pxseTekstNgaHtml } = require('./pxse-prova');

const PXSA_SKEDARI = path.join(__dirname, 'pxse-alertet-lista.csv');
const PXSA_DITE_RUAJTJE = 21;
const PXSA_URL = /^https:\/\/www\.google\.com\/alerts\/feeds\/(\d{5,30})\/(\d{3,30})\/?$/;

// ---------- CSV ----------
function pxsaLexoCsv(tekst) {
  const rreshta = []; let rr = [], f = '', ne = false;
  tekst = String(tekst || '').replace(/^﻿/, '');
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (ne) {
      if (c === '"') { if (tekst[i + 1] === '"') { f += '"'; i++; } else ne = false; }
      else f += c;
    } else if (c === '"') ne = true;
    else if (c === ',') { rr.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && tekst[i + 1] === '\n') i++; rr.push(f); f = ''; if (rr.some(x => x !== '')) rreshta.push(rr); rr = []; }
    else f += c;
  }
  if (f !== '' || rr.length) { rr.push(f); if (rr.some(x => x !== '')) rreshta.push(rr); }
  return rreshta;
}
// Teksti i nje kerkimi ne forme te krahasueshme: pa "Google Alert - ", thonjeza te drejta, shkronja te vogla, hapesira te njetrajtshme.
function pxsaNormalizo(t) {
  return pxseTekstNgaHtml(String(t || '')).replace(/^\s*google alert\s*[-–—:]\s*/i, '')
    .replace(/[“”„«»]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}
const pxsaPaShenja = t => pxsaNormalizo(t).replace(/"/g, '').replace(/\s+or\s+/g, ' | ').replace(/[^\w|' ]+/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- Variablat ----------
function pxsaFeedetNgaVariablat() {
  const vlerat = [process.env.PXSE_ALERTET_FEEDS || ''];
  for (let i = 2; i <= 30; i++) if (process.env['PXSE_ALERTET_FEEDS_' + i]) vlerat.push(process.env['PXSE_ALERTET_FEEDS_' + i]);
  const dalja = new Map(), gabime = [];
  vlerat.join(',').split(/[,\s]+/).map(x => x.trim()).filter(Boolean).forEach(x => {
    let nr = null, url = x;
    const m = x.match(/^(\d{1,4})\|(.+)$/); if (m) { nr = Number(m[1]); url = m[2]; }
    const u = url.match(PXSA_URL);
    if (!u) { gabime.push(x.slice(0, 120)); return; }
    const kodi = u[1] + '/' + u[2];
    dalja.set(kodi, { kodi, url: 'https://www.google.com/alerts/feeds/' + kodi, nr });
  });
  return { feedet: Array.from(dalja.values()), gabime };
}

// ---------- Leximi i feed-it (Atom i Google Alerts) ----------
function pxsaEtiketa(xml, emri) {
  const m = xml.match(new RegExp('<' + emri + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + emri + '>', 'i'));
  return m ? m[1] : '';
}
// Google e jep tekstin si HTML te koduar (&lt;b&gt;...): dekodohet dy here dhe hiqen etiketat.
// Etiketat e theksimit (<b> rreth fjaleve te gjetura) hiqen pa lene hapesire.
const pxsaTekst = s => pxseTekstNgaHtml(pxseTekstNgaHtml(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
  .replace(/<\/?(b|i|em|strong)>/gi, '')).replace(/\s+([?.,!:;])/g, '$1');
function pxsaLidhjaEVertete(href) {
  const h = String(href || '').replace(/&amp;/g, '&');
  try {
    const u = new URL(h);
    if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === '/url') { const v = u.searchParams.get('url') || u.searchParams.get('q'); if (v && /^https?:\/\//i.test(v)) return v; }
    return /^https?:\/\//i.test(h) ? h : null;
  } catch (e) { return null; }
}
function pxsaLexoAtom(xml) {
  const koka = xml.split(/<entry[\s>]/i)[0];
  const titulli = pxsaTekst(pxsaEtiketa(koka, 'title'));
  const hyrjet = [];
  const re = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi; let m;
  while ((m = re.exec(xml))) {
    const e = m[1];
    const lk = e.match(/<link[^>]*href="([^"]+)"/i);
    const url = pxsaLidhjaEVertete(lk && lk[1]);
    if (!url) continue;
    const pub = Date.parse(pxsaEtiketa(e, 'published') || pxsaEtiketa(e, 'updated'));
    hyrjet.push({ url: url.slice(0, 1000), titulli: pxsaTekst(pxsaEtiketa(e, 'title')).slice(0, 300),
      teksti: pxsaTekst(pxsaEtiketa(e, 'content')).slice(0, 1500), publikuar: Number.isFinite(pub) ? new Date(pub).toISOString() : null });
  }
  return { titulli, hyrjet };
}

module.exports = function (app, pool, iAdmin) {
  let lista = []; // rreshtat e CSV-se ne kujtese, per krahasimin e titujve
  const gati = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_alertet_lista (
      nr INT PRIMARY KEY,
      alerti TEXT NOT NULL,
      kategoria TEXT NOT NULL,
      lloji TEXT NOT NULL,           -- 'b2b' | 'b2c'
      perditesuar TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_alertet_feedet (
      kodi TEXT PRIMARY KEY,         -- <llogaria>/<alerti> nga adresa e feed-it
      url TEXT NOT NULL,
      nr INT,                        -- rreshti i CSV-se (NULL = pa kategori: titulli nuk u gjet ne liste)
      kategoria TEXT,
      lloji TEXT,
      titulli TEXT,                  -- titulli qe jep Google ("Google Alert - ...")
      aktiv BOOLEAN NOT NULL DEFAULT true,
      lexuar_at TIMESTAMPTZ,
      gabimi TEXT,
      shtuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_alertet_rezultate (
      id SERIAL PRIMARY KEY,
      kodi TEXT NOT NULL,
      nr INT,
      kategoria TEXT,
      lloji TEXT,
      url TEXT NOT NULL,
      titulli TEXT,
      teksti TEXT,
      publikuar TIMESTAMPTZ,
      marre_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (kodi, url)
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxse_alr_kat ON pxse_alertet_rezultate (kategoria, marre_at DESC)');
    // Kategorite qe i ka nje klient (prove falas ose llogari). Mbushet me vone, kur AI t'u caktoje klienteve alertet.
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_alertet_klientet (
      klienti TEXT NOT NULL,          -- p.sh. 'seanca:<kodi>' ose 'biznes:<id>'
      kategoria TEXT NOT NULL,
      shtuar_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (klienti, kategoria)
    )`);
    // CSV -> databaze (perditesohet sa here niset serveri, qe ndryshimet ne CSV te hyjne vete)
    let rreshta = [];
    try { rreshta = pxsaLexoCsv(fs.readFileSync(PXSA_SKEDARI, 'utf8')); } catch (e) { console.error('pxse-alertet: nuk u lexua ' + PXSA_SKEDARI + ': ' + e.message); }
    const koka = (rreshta.shift() || []).map(x => x.toLowerCase());
    const iNr = koka.findIndex(x => x === 'nr'), iKat = koka.findIndex(x => x.startsWith('kategoria')), iLl = koka.findIndex(x => x.startsWith('lloji')), iAl = koka.findIndex(x => x.startsWith('alerti'));
    lista = rreshta.map(r => ({ nr: parseInt(r[iNr], 10), alerti: String(r[iAl] || '').trim(), kategoria: String(r[iKat] || '').trim(), lloji: /b2c/i.test(r[iLl]) ? 'b2c' : 'b2b' }))
      .filter(x => x.nr > 0 && x.alerti && x.kategoria);
    for (const x of lista) {
      await pool.query(`INSERT INTO pxse_alertet_lista (nr, alerti, kategoria, lloji) VALUES ($1,$2,$3,$4)
        ON CONFLICT (nr) DO UPDATE SET alerti=EXCLUDED.alerti, kategoria=EXCLUDED.kategoria, lloji=EXCLUDED.lloji, perditesuar=now()`, [x.nr, x.alerti, x.kategoria, x.lloji]);
    }
    lista.forEach(x => { x.n1 = pxsaNormalizo(x.alerti); x.n2 = pxsaPaShenja(x.alerti); });
    // Feed-et e variablave: te rinjte shtohen, ata qe u hoqen nga variabla behen jo-aktive (rezultatet e tyre mbeten sipas rregullit 3 javesh).
    const { feedet, gabime } = pxsaFeedetNgaVariablat();
    if (gabime.length) console.error('pxse-alertet: adresa te pavlefshme te PXSE_ALERTET_FEEDS: ' + gabime.join(' , '));
    await pool.query('UPDATE pxse_alertet_feedet SET aktiv=false');
    for (const f of feedet) {
      await pool.query(`INSERT INTO pxse_alertet_feedet (kodi, url, aktiv) VALUES ($1,$2,true) ON CONFLICT (kodi) DO UPDATE SET aktiv=true, url=EXCLUDED.url`, [f.kodi, f.url]);
      if (f.nr) { // "nr|adresa": lidhja jepet nga ti, pa pritur titullin
        const x = lista.find(y => y.nr === f.nr);
        if (x) await pool.query('UPDATE pxse_alertet_feedet SET nr=$2, kategoria=$3, lloji=$4 WHERE kodi=$1', [f.kodi, x.nr, x.kategoria, x.lloji]);
      }
    }
    return true;
  })().catch(e => { console.error('pxse-alertet migrim:', e.message); return false; });

  function pxsaGjejRreshtin(titulli) {
    const n1 = pxsaNormalizo(titulli), n2 = pxsaPaShenja(titulli);
    if (!n1) return null;
    return lista.find(x => x.n1 === n1) || lista.find(x => x.n2 === n2) || null;
  }

  async function pxsaLexoFeed(f) {
    try {
      const r = await pxseFetchKohe(f.url, { headers: { accept: 'application/atom+xml, application/xml, text/xml', 'user-agent': 'Mozilla/5.0 (compatible; PhronexusAI/1.0)' } }, 20000);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const xml = (await r.text()).slice(0, 2000000);
      if (!/<feed[\s>]/i.test(xml)) throw new Error('not a Google Alerts feed');
      const a = pxsaLexoAtom(xml);
      // Lidhja kodi -> kategori behet ne leximin e pare (titulli ekziston edhe kur feed-i eshte bosh); ruhet dhe nuk ndryshon me pas.
      if (!f.nr) {
        const x = pxsaGjejRreshtin(a.titulli);
        if (x) { f.nr = x.nr; f.kategoria = x.kategoria; f.lloji = x.lloji; }
      }
      await pool.query('UPDATE pxse_alertet_feedet SET titulli=$2, nr=$3, kategoria=$4, lloji=$5, lexuar_at=now(), gabimi=NULL WHERE kodi=$1',
        [f.kodi, a.titulli.slice(0, 500), f.nr || null, f.kategoria || null, f.lloji || null]);
      let te_reja = 0;
      for (const h of a.hyrjet) {
        const q = await pool.query(`INSERT INTO pxse_alertet_rezultate (kodi, nr, kategoria, lloji, url, titulli, teksti, publikuar)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (kodi, url) DO NOTHING RETURNING id`,
          [f.kodi, f.nr || null, f.kategoria || null, f.lloji || null, h.url, h.titulli, h.teksti, h.publikuar]);
        te_reja += q.rowCount;
      }
      // Rezultatet e marra para se feed-i te kishte kategori e marrin tani
      if (f.nr) await pool.query('UPDATE pxse_alertet_rezultate SET nr=$2, kategoria=$3, lloji=$4 WHERE kodi=$1 AND nr IS NULL', [f.kodi, f.nr, f.kategoria, f.lloji]);
      return te_reja;
    } catch (e) {
      await pool.query('UPDATE pxse_alertet_feedet SET lexuar_at=now(), gabimi=$2 WHERE kodi=$1', [f.kodi, String(e.message || e).slice(0, 300)]).catch(() => {});
      return 0;
    }
  }

  let duke = false;
  async function pxsaLexoTeGjitha() {
    if (duke || !(await gati)) return { duke: true };
    duke = true;
    try {
      const feedet = (await pool.query('SELECT kodi, url, nr, kategoria, lloji FROM pxse_alertet_feedet WHERE aktiv ORDER BY lexuar_at NULLS FIRST')).rows;
      let te_reja = 0, i = 0;
      // 3 njekohesisht, me nje pushim te shkurter, qe Google te mos e shohe si ngarkese
      await Promise.all(Array.from({ length: Math.min(3, feedet.length) }, async () => {
        while (i < feedet.length) { const f = feedet[i++]; te_reja += await pxsaLexoFeed(f); await new Promise(r => setTimeout(r, 400)); }
      }));
      return { feedet: feedet.length, te_reja };
    } finally { duke = false; }
  }
  async function pxsaFshi() {
    if (!(await gati)) return;
    await pool.query(`DELETE FROM pxse_alertet_rezultate r WHERE r.marre_at < now() - interval '${PXSA_DITE_RUAJTJE} days'
      AND NOT EXISTS (SELECT 1 FROM pxse_alertet_klientet k WHERE k.kategoria = r.kategoria)`).catch(e => console.error('pxse-alertet fshirja:', e.message));
  }
  setTimeout(() => pxsaLexoTeGjitha().catch(e => console.error('pxse-alertet:', e.message)), 30000).unref();
  setInterval(() => pxsaLexoTeGjitha().catch(e => console.error('pxse-alertet:', e.message)), 30 * 60 * 1000).unref();
  setInterval(pxsaFshi, 6 * 60 * 60 * 1000).unref();
  setTimeout(pxsaFshi, 60000).unref();

  // ---------- Admin ----------
  app.get('/api/admin/pxse/alertet', iAdmin, async (req, res) => {
    try {
      if (!(await gati)) return res.status(503).json({ error: 'Tabelat e alerteve nuk u krijuan (shih logjet).' });
      const { gabime } = pxsaFeedetNgaVariablat();
      const feedet = (await pool.query(`SELECT f.kodi, f.nr, f.kategoria, f.lloji, f.titulli, f.aktiv, f.lexuar_at, f.gabimi,
          (SELECT COUNT(*)::int FROM pxse_alertet_rezultate r WHERE r.kodi=f.kodi) rezultate,
          (SELECT MAX(marre_at) FROM pxse_alertet_rezultate r WHERE r.kodi=f.kodi) e_fundit
        FROM pxse_alertet_feedet f ORDER BY f.aktiv DESC, f.nr NULLS FIRST, f.kodi`)).rows;
      const kategorite = (await pool.query(`SELECT kategoria, lloji, COUNT(*)::int rezultate FROM pxse_alertet_rezultate WHERE kategoria IS NOT NULL GROUP BY 1,2 ORDER BY 1`)).rows;
      res.json({ ok: true, lista_csv: lista.length, feed_aktive: feedet.filter(f => f.aktiv).length,
        pa_kategori: feedet.filter(f => f.aktiv && f.lexuar_at && !f.nr).map(f => ({ kodi: f.kodi, titulli: f.titulli })),
        me_gabim: feedet.filter(f => f.aktiv && f.gabimi).map(f => ({ kodi: f.kodi, gabimi: f.gabimi })),
        adresa_te_pavlefshme: gabime, kategorite, feedet });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/alertet/lexo', iAdmin, async (req, res) => {
    try { res.json(Object.assign({ ok: true }, await pxsaLexoTeGjitha())); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
};
