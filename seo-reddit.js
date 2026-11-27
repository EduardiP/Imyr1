// seo-reddit.js (PhronexusAI) — Admin > SEO > Reddit (Google Alerts).
// Sinjale per vete (jo per klientet): postime Reddit ku dikush mund te kete interes per PhronexusAI, qe Eduardi t'u pergjigjet me dore.
// Server.js e therret: require('./seo-reddit')(app, pool, iAdmin);
//
// Si funksionon:
//  1. Adresat e feed-eve te Google Alerts merren nga variabla SEO_ALERTET_FEEDS (dhe SEO_ALERTET_FEEDS_2, _3 ... nese nje nuk mjafton):
//     adresat e plota https://www.google.com/alerts/feeds/<llogaria>/<alerti>, te ndara me presje, hapesire ose rresht te ri.
//     E ndare plotesisht nga PXSE_ALERTET_FEEDS (sinjalet e klienteve, pxse-alertet.js).
//  2. Cdo 30 minuta (dhe 40 sekonda pas nisjes) lexohet cdo feed. Ruhen VETEM lidhjet nga reddit.com (temat /comments/).
//  3. AI (gpt-5-nano) i jep cdo postimi te ri nje vleresim 0-100: sa ia vlen t'i pergjigjesh, sipas interesit te autorit
//     dhe interesit te atyre qe do ta gjejne temen ne Google / AI me vone. Arsyeja ne shqip (e sheh vetem admin-i).
//  4. Vetem per postimet me vleresim >= SEO_PRAGU (30) AI shkruan nje pergjigje te natyrshme ne anglisht, qe permend PhronexusAI
//     dhe linkun me UTM te Reddit-it. Asgje nuk postohet automatikisht: pergjigjen e kopjon dhe e poston Eduardi vete.
//  5. Kufiri ditor i vleresimeve AI: variabla SEO_AI_KUFI (paracaktim 200). Rreshtat me te vjeter se 90 dite fshihen.
//  Admin: GET /api/admin/seo/reddit, POST /api/admin/seo/reddit/lexo, POST /api/admin/seo/reddit/:id/statusi,
//         POST /api/admin/seo/reddit/:id/rigjenero.
const { pxseFetchKohe, pxseTekstNgaHtml } = require('./pxse-prova');

const SEO_URL_FEED = /^https:\/\/www\.google\.com\/alerts\/feeds\/(\d{5,30})\/(\d{3,30})\/?$/;
const SEO_PRAGU = 30;
const SEO_MODELI = 'gpt-5-nano';
const SEO_LINKU = 'https://phronexusai.com/?utm_source=reddit&utm_medium=comment&utm_campaign=seo_reddit';
const SEO_STATUSET = ['i ri', 'komentova', 'e lashe'];
const SEO_DITE_RUAJTJE = 90;

const seoKufiAI = () => { const n = parseInt(process.env.SEO_AI_KUFI, 10); return Number.isFinite(n) && n >= 0 ? n : 200; };
const seoCelesi = () => String(process.env.OPENAI_API_KEY || '').trim();

// ---------- Variablat ----------
function seoFeedetNgaVariablat() {
  const vlerat = [process.env.SEO_ALERTET_FEEDS || ''];
  for (let i = 2; i <= 30; i++) if (process.env['SEO_ALERTET_FEEDS_' + i]) vlerat.push(process.env['SEO_ALERTET_FEEDS_' + i]);
  const dalja = new Map(), gabime = [];
  vlerat.join(',').split(/[,;\s]+/).map(x => x.trim()).filter(Boolean).forEach(x => {
    const u = x.match(SEO_URL_FEED);
    if (!u) { gabime.push(x.slice(0, 120)); return; }
    const kodi = u[1] + '/' + u[2];
    dalja.set(kodi, { kodi, url: 'https://www.google.com/alerts/feeds/' + kodi });
  });
  return { feedet: Array.from(dalja.values()), gabime };
}

// ---------- Leximi i feed-it (Atom i Google Alerts) ----------
function seoEtiketa(xml, emri) {
  const m = xml.match(new RegExp('<' + emri + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + emri + '>', 'i'));
  return m ? m[1] : '';
}
// Google e jep tekstin si HTML te koduar: dekodohet dy here dhe hiqen etiketat e theksimit.
const seoTekst = s => pxseTekstNgaHtml(pxseTekstNgaHtml(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
  .replace(/<\/?(b|i|em|strong)>/gi, '')).replace(/\s+([?.,!:;])/g, '$1').replace(/\s+/g, ' ').trim();
function seoLidhjaEVertete(href) {
  const h = String(href || '').replace(/&amp;/g, '&');
  try {
    const u = new URL(h);
    if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === '/url') { const v = u.searchParams.get('url') || u.searchParams.get('q'); if (v && /^https?:\/\//i.test(v)) return v; }
    return /^https?:\/\//i.test(h) ? h : null;
  } catch (e) { return null; }
}
// Vetem temat e Reddit-it: kthen adresen e pastruar (https://www.reddit.com/r/<sub>/comments/<id>/...) dhe nenreddit-in, ose null.
function seoTemaReddit(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)reddit\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/r\/([^/]+)\/comments\/([a-z0-9]+)(\/[^/]*)?/i);
    if (!m) return null;
    return { url: 'https://www.reddit.com/r/' + m[1] + '/comments/' + m[2] + (m[3] || '/'), nenreddit: m[1], idja: m[2].toLowerCase() };
  } catch (e) { return null; }
}
function seoLexoAtom(xml) {
  const koka = xml.split(/<entry[\s>]/i)[0];
  const titulli = seoTekst(seoEtiketa(koka, 'title')).replace(/^\s*google alert\s*[-–—:]\s*/i, '');
  const hyrjet = [];
  const re = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi; let m;
  while ((m = re.exec(xml))) {
    const e = m[1];
    const lk = e.match(/<link[^>]*href="([^"]+)"/i);
    const tema = seoTemaReddit(seoLidhjaEVertete(lk && lk[1]));
    if (!tema) continue;
    const pub = Date.parse(seoEtiketa(e, 'published') || seoEtiketa(e, 'updated'));
    hyrjet.push(Object.assign(tema, {
      titulli: seoTekst(seoEtiketa(e, 'title')).replace(/\s*[-:|]\s*r\/[^\s]+\s*$/i, '').replace(/\s*:\s*reddit\s*$/i, '').slice(0, 300),
      teksti: seoTekst(seoEtiketa(e, 'content')).slice(0, 1500),
      publikuar: Number.isFinite(pub) ? new Date(pub).toISOString() : null
    }));
  }
  return { titulli, hyrjet };
}

// ---------- AI ----------
// Heq gjysmat e emoji-ve dhe karakteret e kontrollit (OpenAI i refuzon ne JSON)
const seoPastro = t => String(t == null ? '' : t).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
async function seoPyetAI(prompt) {
  if (!seoCelesi()) throw new Error('mungon OPENAI_API_KEY');
  prompt = seoPastro(prompt);
  const thirr = async meNivel => {
    const trupi = { model: SEO_MODELI, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } };
    if (meNivel) trupi.reasoning_effort = 'low';
    const r = await pxseFetchKohe('https://api.openai.com/v1/chat/completions', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + seoCelesi() }, body: JSON.stringify(trupi) }, 90000);
    let data = {}; try { data = await r.json(); } catch (e) {}
    return { r, data };
  };
  let { r, data } = await thirr(true);
  if (r.status === 400 && /reasoning/i.test(JSON.stringify(data))) ({ r, data } = await thirr(false));
  if (!r.ok) throw new Error('OpenAI: ' + ((data.error && data.error.message) || r.status));
  const t = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i < 0 || j <= i) throw new Error('AI nuk ktheu JSON');
  return JSON.parse(t.slice(i, j + 1));
}

const SEO_PRODUKTI = 'PhronexusAI (phronexusai.com) is a free cross-promotion network for SaaS and online businesses. ' +
  'Businesses show ads from complementary, non-competing businesses on their own website and get their own ads shown on partner websites, ' +
  'so they reach new customers without paying for ads. AI matches partners by audience fit, competitors are never matched, and every ad must be approved by the site owner. ' +
  'Free plan with no credit card; setup is one script tag (or a WordPress plugin).';

function seoPromptVleresimi(p, meDetyrimPergjigjeje) {
  return 'You help the founder of PhronexusAI decide which Reddit posts are worth a helpful reply.\n' +
    'PRODUCT: ' + SEO_PRODUKTI + '\n\n' +
    'REDDIT POST (from a Google Alert):\n' +
    'Subreddit: r/' + p.nenreddit + '\nTitle: ' + (p.titulli || '') + '\nSnippet: ' + (p.teksti || '') + '\n\n' +
    'Give a score from 0 to 100 for how worth it is to reply, combining two things:\n' +
    '1) The poster\'s interest: how much the poster needs what PhronexusAI offers (looking for ways to promote a SaaS or online business, ' +
    'frustrated with expensive paid ads, looking for partners / cross-promotion / co-marketing, launched but has no users).\n' +
    '2) The search value: how likely other people are to find this thread later on Google or in AI answers when they search for the same problem ' +
    '(a general, lasting question that many founders ask scores high; a very personal or one-off situation, news, hiring, selling something, or self-promotion scores low).\n' +
    'Score low (under 20) if the post is unrelated, B2C/consumer only, a job post, a "for sale" post, spam, or a place where a product mention would clearly be unwelcome.\n\n' +
    'Return JSON: {"pike": <integer 0-100>, "arsyeja": "<one short sentence IN ALBANIAN explaining the score>"' +
    (meDetyrimPergjigjeje ? ', "pergjigja": "<the reply, see rules>"' : ', "pergjigja": "<ONLY if pike >= ' + SEO_PRAGU + ', otherwise an empty string>"') + '}\n\n' +
    'RULES FOR THE REPLY (English, written as a Reddit comment by the founder):\n' +
    '- Sound like a real person: natural, warm, plain words, short sentences, no marketing language, no hype, no emojis, no hashtags, no bullet lists unless very short.\n' +
    '- First actually help with the poster\'s problem (1-3 concrete, practical tips that work even without PhronexusAI).\n' +
    '- Then mention PhronexusAI briefly and honestly as one option, saying you are building it (for example "I\'m building something for this..."), ' +
    'explain in one sentence how it fits their case, and add this exact link once: ' + SEO_LINKU + '\n' +
    '- 60 to 130 words. Do not invent numbers, results, customers or personal stories. Do not start with "Great question".\n';
}

module.exports = function (app, pool, iAdmin) {
  const gati = (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS seo_reddit_feedet (
      kodi TEXT PRIMARY KEY,         -- <llogaria>/<alerti> nga adresa e feed-it
      url TEXT NOT NULL,
      titulli TEXT,                  -- kerkimi i alertit (pa "Google Alert - ")
      aktiv BOOLEAN NOT NULL DEFAULT true,
      lexuar_at TIMESTAMPTZ,
      gabimi TEXT,
      shtuar_at TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS seo_reddit_sinjalet (
      id SERIAL PRIMARY KEY,
      idja TEXT UNIQUE NOT NULL,     -- id e temes ne Reddit (nje teme = nje rresht, edhe nese e gjejne disa alerte)
      url TEXT NOT NULL,
      nenreddit TEXT,
      titulli TEXT,
      teksti TEXT,
      alerti TEXT,                   -- kerkimi i alertit qe e gjeti i pari
      publikuar TIMESTAMPTZ,
      marre_at TIMESTAMPTZ DEFAULT now(),
      pike INT,                      -- NULL = ende pa vleresim AI
      arsyeja TEXT,
      pergjigja TEXT,
      vleresuar_at TIMESTAMPTZ,
      gabimi_ai TEXT,
      statusi TEXT NOT NULL DEFAULT 'i ri',
      statusi_at TIMESTAMPTZ
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS seo_reddit_sinjalet_pike ON seo_reddit_sinjalet (pike DESC, marre_at DESC)');
    // Feed-et nga variablat: te rinjte shtohen, ata qe s'jane me ne variabla caktivizohen (rreshtat e tyre mbeten)
    const { feedet, gabime } = seoFeedetNgaVariablat();
    if (gabime.length) console.error('seo-reddit: adresa te pavlefshme te SEO_ALERTET_FEEDS: ' + gabime.join(' , '));
    for (const f of feedet) await pool.query(`INSERT INTO seo_reddit_feedet (kodi, url, aktiv) VALUES ($1,$2,true)
      ON CONFLICT (kodi) DO UPDATE SET url=EXCLUDED.url, aktiv=true`, [f.kodi, f.url]);
    await pool.query('UPDATE seo_reddit_feedet SET aktiv=false WHERE NOT (kodi = ANY($1::text[]))', [feedet.map(f => f.kodi)]);
    return { gabime };
  })().catch(e => { console.error('seo-reddit migrim:', e.message); return null; });

  async function seoLexoFeed(f) {
    try {
      const r = await pxseFetchKohe(f.url, { headers: { accept: 'application/atom+xml, application/xml, text/xml', 'user-agent': 'Mozilla/5.0 (compatible; PhronexusAI/1.0)' } }, 20000);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const xml = (await r.text()).slice(0, 2000000);
      if (!/<feed[\s>]/i.test(xml)) throw new Error('nuk eshte feed i Google Alerts');
      const a = seoLexoAtom(xml);
      await pool.query('UPDATE seo_reddit_feedet SET titulli=$2, lexuar_at=now(), gabimi=NULL WHERE kodi=$1', [f.kodi, a.titulli.slice(0, 500)]);
      let te_reja = 0;
      for (const h of a.hyrjet) {
        const q = await pool.query(`INSERT INTO seo_reddit_sinjalet (idja, url, nenreddit, titulli, teksti, alerti, publikuar)
          VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idja) DO NOTHING RETURNING id`,
          [h.idja, h.url, h.nenreddit, h.titulli, h.teksti, a.titulli.slice(0, 500), h.publikuar]);
        te_reja += q.rowCount;
      }
      return te_reja;
    } catch (e) {
      await pool.query('UPDATE seo_reddit_feedet SET lexuar_at=now(), gabimi=$2 WHERE kodi=$1', [f.kodi, String(e.message || e).slice(0, 300)]).catch(() => {});
      return 0;
    }
  }

  // Vleresimi i nje postimi (dhe pergjigja nese kalon pragun). meDetyrim = rigjenerim nga admin-i: pergjigja shkruhet gjithmone.
  async function seoVlereso(p, meDetyrim) {
    try {
      const x = await seoPyetAI(seoPromptVleresimi(p, meDetyrim));
      let pike = parseInt(x.pike, 10); if (!Number.isFinite(pike)) pike = 0; pike = Math.max(0, Math.min(100, pike));
      const pergjigja = (meDetyrim || pike >= SEO_PRAGU) ? String(x.pergjigja || '').trim().slice(0, 2000) : '';
      await pool.query('UPDATE seo_reddit_sinjalet SET pike=$2, arsyeja=$3, pergjigja=$4, vleresuar_at=now(), gabimi_ai=NULL WHERE id=$1',
        [p.id, pike, String(x.arsyeja || '').slice(0, 400), pergjigja || null]);
      return true;
    } catch (e) {
      await pool.query('UPDATE seo_reddit_sinjalet SET gabimi_ai=$2 WHERE id=$1', [p.id, String(e.message || e).slice(0, 300)]).catch(() => {});
      console.error('seo-reddit AI:', e.message);
      return false;
    }
  }
  async function seoVleresoTeRejat() {
    const sot = await pool.query(`SELECT count(*)::int AS n FROM seo_reddit_sinjalet
      WHERE vleresuar_at >= date_trunc('day', now() AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'Europe/Berlin'`);
    const mbetur = Math.max(0, seoKufiAI() - sot.rows[0].n);
    if (!mbetur || !seoCelesi()) return 0;
    const lista = (await pool.query(`SELECT id, nenreddit, titulli, teksti FROM seo_reddit_sinjalet
      WHERE pike IS NULL AND (gabimi_ai IS NULL OR marre_at > now() - interval '2 days') ORDER BY marre_at LIMIT $1`, [Math.min(mbetur, 60)])).rows;
    let n = 0;
    for (const p of lista) { if (await seoVlereso(p, false)) n++; }
    return n;
  }

  let duke = false;
  async function seoLexoTeGjitha() {
    if (duke || !(await gati)) return { duke: true };
    duke = true;
    try {
      const feedet = (await pool.query('SELECT kodi, url FROM seo_reddit_feedet WHERE aktiv ORDER BY lexuar_at NULLS FIRST')).rows;
      let te_reja = 0, i = 0;
      // 3 njekohesisht, me nje pushim te shkurter, qe Google te mos e shohe si ngarkese
      await Promise.all(Array.from({ length: Math.min(3, feedet.length) }, async () => {
        while (i < feedet.length) { const f = feedet[i++]; te_reja += await seoLexoFeed(f); await new Promise(r => setTimeout(r, 400)); }
      }));
      const vleresuar = await seoVleresoTeRejat();
      return { feedet: feedet.length, te_reja, vleresuar };
    } finally { duke = false; }
  }
  async function seoFshi() {
    if (!(await gati)) return;
    await pool.query(`DELETE FROM seo_reddit_sinjalet WHERE marre_at < now() - interval '${SEO_DITE_RUAJTJE} days'`).catch(e => console.error('seo-reddit fshirja:', e.message));
  }
  setTimeout(() => seoLexoTeGjitha().catch(e => console.error('seo-reddit:', e.message)), 40000).unref();
  setInterval(() => seoLexoTeGjitha().catch(e => console.error('seo-reddit:', e.message)), 30 * 60 * 1000).unref();
  setInterval(seoFshi, 12 * 60 * 60 * 1000).unref();

  // ---------- Admin ----------
  app.get('/api/admin/seo/reddit', iAdmin, async (req, res) => {
    try {
      const g = await gati;
      if (!g) return res.status(500).json({ ok: false, error: 'Tabelat e SEO nuk u krijuan. Shih log-et e serverit.' });
      const min = Math.max(0, Math.min(100, parseInt(req.query.min, 10) || 0));
      const statusi = SEO_STATUSET.includes(req.query.statusi) ? req.query.statusi : '';
      const faqe = Math.max(0, parseInt(req.query.faqe, 10) || 0);
      const kushte = ['pike IS NOT NULL', 'pike >= $1'], vlerat = [min];
      if (statusi) { vlerat.push(statusi); kushte.push('statusi = $' + vlerat.length); }
      const ku = 'WHERE ' + kushte.join(' AND ');
      const [rreshtat, numri, feedet, permbledhje] = await Promise.all([
        pool.query(`SELECT id, url, nenreddit, titulli, teksti, alerti, publikuar, marre_at, pike, arsyeja, pergjigja, statusi
          FROM seo_reddit_sinjalet ${ku} ORDER BY pike DESC, marre_at DESC LIMIT 50 OFFSET ${faqe * 50}`, vlerat),
        pool.query(`SELECT count(*)::int AS n FROM seo_reddit_sinjalet ${ku}`, vlerat),
        pool.query('SELECT kodi, titulli, aktiv, lexuar_at, gabimi FROM seo_reddit_feedet WHERE aktiv ORDER BY titulli NULLS LAST'),
        pool.query(`SELECT count(*)::int AS gjithsej,
            count(*) FILTER (WHERE pike IS NULL)::int AS pa_vleresim,
            count(*) FILTER (WHERE pike >= ${SEO_PRAGU} AND statusi = 'i ri')::int AS per_pergjigje,
            count(*) FILTER (WHERE statusi = 'komentova')::int AS komentova,
            count(*) FILTER (WHERE marre_at > now() - interval '24 hours')::int AS sot
          FROM seo_reddit_sinjalet`)
      ]);
      res.json({ ok: true, pragu: SEO_PRAGU, kufi_ai: seoKufiAI(), ka_celes: !!seoCelesi(), gabime_variablash: g.gabime || [],
        rreshtat: rreshtat.rows, numri: numri.rows[0].n, feedet: feedet.rows, permbledhje: permbledhje.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });
  app.post('/api/admin/seo/reddit/lexo', iAdmin, async (req, res) => {
    try {
      const r = await seoLexoTeGjitha();
      if (r.duke) return res.json({ ok: true, duke: true });
      res.json(Object.assign({ ok: true }, r));
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });
  app.post('/api/admin/seo/reddit/:id/statusi', iAdmin, async (req, res) => {
    try {
      const statusi = String((req.body && req.body.statusi) || '');
      if (!SEO_STATUSET.includes(statusi)) return res.status(400).json({ ok: false, error: 'Status i pavlefshëm.' });
      const q = await pool.query('UPDATE seo_reddit_sinjalet SET statusi=$2, statusi_at=now() WHERE id=$1', [parseInt(req.params.id, 10) || 0, statusi]);
      res.json({ ok: q.rowCount > 0 });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });
  app.post('/api/admin/seo/reddit/:id/rigjenero', iAdmin, async (req, res) => {
    try {
      const q = await pool.query('SELECT id, nenreddit, titulli, teksti FROM seo_reddit_sinjalet WHERE id=$1', [parseInt(req.params.id, 10) || 0]);
      if (!q.rows.length) return res.status(404).json({ ok: false, error: 'Nuk u gjet.' });
      if (!seoCelesi()) return res.status(500).json({ ok: false, error: 'Mungon OPENAI_API_KEY.' });
      const ok = await seoVlereso(q.rows[0], true);
      const r = await pool.query('SELECT id, pike, arsyeja, pergjigja, gabimi_ai FROM seo_reddit_sinjalet WHERE id=$1', [q.rows[0].id]);
      res.json(Object.assign({ ok }, r.rows[0]));
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });
};

module.exports._test = { seoLexoAtom, seoTemaReddit, seoFeedetNgaVariablat, seoPromptVleresimi };
