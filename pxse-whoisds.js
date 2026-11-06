// pxse-whoisds.js — Domainet e regjistruara ne nje dite te caktuar (lista falas ditore e WhoisDS).
//
// Rrjedha:
//   1. Cdo 2 ore provon te shkarkoje listat e 4 diteve te fundit qe mungojne (WhoisDS jep falas vetem ditet me te fundit).
//      Lista (zip → .txt, nje domain per rresht) ruhet ne databaze sipas dites, vetem TLD-te e biznesit dhe emrat normale.
//   2. Admini zgjedh nje dite (p.sh. 14 dite me pare) → "Studio" (ose Auto: cdo dite vete dita N dite me pare).
//      Filtri falas, me radhe: jo ne Import/Direktori → MX vetem te Google (perndryshe "jo_google", pa hapur faqen dhe pa AI)
//      → faqja hapet dhe nuk eshte e parkuar / "coming soon". Vetem ato qe kalojne te gjitha shkojne te AI.
//   3. Ato qe kalojne shkojne te studimi ekzistues i Importit (AI), ne skedarin "Domaine të reja (WhoisDS)".
//      Kufiri: cdo klikim "Studio" lejon deri ne PXSE_WD_STUDIM_DITORE (300) studime AI; klikimi tjeter jep perseri 300.
//      Auto jep vete 300 ne dite (nje here ne dite); prej andej kalojne vete te Marketingu (B2B, sipas ofruesit). Data e regjistrimit = dita e listes.
//   AUTO (versioni i ri): merr TE GJITHA ditet e shkarkuara qe kane mbushur PXSE_WD_MOSHA (14) dite, PA kufi ditor: filtron dhe
//      studion gjithcka me radhe, ne grupe, dhe vazhdon vete pas cdo nderprerjeje/rinisjeje (gjendja ruhet ne databaze).
//      Rikontroll falas (pa AI): domainet "pa faqe" / "pa MX" / "jo Google" kontrollohen perseri kur dita mbush 30 dhe 50 dite
//      (PXSE_WD_RIKONTROLL, p.sh. "30,50") — shume domaine blihen para se te ndertohet faqja.
//      Bizneset e studiuara (biznes + email + MX + faqe aktive) kalojne VETE ne direktori (pxse_bizneset, burimi='whoisds').
//      Domainet qe jane tashme ne direktori (p.sh. nga Common Crawl) nuk preken. Butoni "Studio" (manual) mbetet me kufirin per klikim.
//
// Railway Variables (opsionale): PXSE_WD_STUDIM_DITORE (300 per klikim / per dite me Auto), PXSE_WD_MOSHA (14), PXSE_WD_MBAJ_DITE (60),
// PXSE_WD_VETEM_GOOGLE (1 = vetem email te Google; 0 = cdo MX), PXSE_WD_TLD (lista), PXSE_WD_URL (formati i lidhjes: {b64} = base64("YYYY-MM-DD.zip"), {data} = YYYY-MM-DD).
const zlib = require('zlib');
const dns = require('dns');
const pxwdDns = new dns.promises.Resolver({ timeout: 4000, tries: 2 });
const { pxseNePlatforme, pxseHostPublik, pxseTekstNgaHtml } = require('./pxse-prova');

// MX i domainit: 'google' | 'tjeter' | 'pa_mx' | null (gabim i perkohshem DNS, provohet perseri me vone)
async function pxwdMx(domaini) {
  try {
    const mx = await pxwdDns.resolveMx(domaini);
    if (!mx || !mx.length) return 'pa_mx';
    return mx.some(m => /(^|\.)(google\.com|googlemail\.com)\.?$/i.test(String(m.exchange || ''))) ? 'google' : 'tjeter';
  } catch (e) {
    if (['ENOTFOUND', 'ENODATA', 'NXDOMAIN', 'ENOTIMP', 'EREFUSED', 'ESERVFAIL'].includes(e.code)) return 'pa_mx';
    return null;
  }
}
const pxwdVetemGoogle = () => process.env.PXSE_WD_VETEM_GOOGLE !== '0';

const PXWD_EMRI_IMPORTIT = 'Domaine të reja (WhoisDS)';
const PXWD_URLET = (process.env.PXSE_WD_URL ? [process.env.PXSE_WD_URL] : [
  'https://www.whoisds.com//whois-database/newly-registered-domains/{b64}/nrd',
  'https://www.whoisds.com/whois-database/newly-registered-domains/{data}.zip/nrd'
]);
const PXWD_TLD = (process.env.PXSE_WD_TLD || 'com,io,ai,co,app,dev,tech,net,de,ca,co.uk,com.au').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const PXWD_SUFIKSE_2 = ['co.uk', 'org.uk', 'ltd.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br', 'co.za', 'co.jp', 'com.mx', 'com.tr', 'co.in', 'com.sg', 'com.hk', 'co.il', 'com.ar', 'com.co'];
const PXWD_UA = 'Mozilla/5.0 (compatible; PhronexusAI-directory/1.0; +https://phronexusai.com)';
const PXWD_PARKUAR = /(domain (name )?(is )?for sale|buy this domain|this domain (may be|is) for sale|parked (free|domain)|domain parking|sedoparking|parkingcrew|bodis\.com|dan\.com|afternic|hugedomains|godaddy\.com\/domainsearch|this site can.t be reached|coming soon|under construction|launching soon|website is under|future home of|default web page|welcome to nginx|apache2 (ubuntu|debian) default|it works!|index of \/|account suspended|hostinger|site not found|domain has been registered|registered at namecheap|this domain was recently registered)/i;
const nr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };

// ---------- Zip: nxjerr skedaret (vetem "stored" dhe "deflate") ----------
function pxwdZip(buf) {
  const dalja = [];
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) { if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('zip i pavlefshem');
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const metoda = buf.readUInt16LE(p + 10), madhC = buf.readUInt32LE(p + 20), emriL = buf.readUInt16LE(p + 28), extraL = buf.readUInt16LE(p + 30), komL = buf.readUInt16LE(p + 32), lokal = buf.readUInt32LE(p + 42);
    const emri = buf.subarray(p + 46, p + 46 + emriL).toString('utf8');
    p += 46 + emriL + extraL + komL;
    if (buf.readUInt32LE(lokal) !== 0x04034b50) continue;
    const fillim = lokal + 30 + buf.readUInt16LE(lokal + 26) + buf.readUInt16LE(lokal + 28);
    const data = buf.subarray(fillim, fillim + madhC);
    if (metoda === 0) dalja.push({ emri, te: data });
    else if (metoda === 8) dalja.push({ emri, te: zlib.inflateRawSync(data) });
  }
  return dalja;
}

function pxwdBaza(d) {
  const p = d.split('.');
  if (p.length < 2) return null;
  if (PXWD_SUFIKSE_2.includes(p.slice(-2).join('.'))) return p.length === 3 ? d : null;
  return p.length === 2 ? d : null;
}
function pxwdTld(d) { const p = d.split('.'); return PXWD_SUFIKSE_2.includes(p.slice(-2).join('.')) ? p.slice(-2).join('.') : p[p.length - 1]; }
// Lista e papercaktuar → domainet qe ia vlen te kontrollohen (TLD biznesi, emra normale, pa platforma)
function pxwdFiltroListen(tekst) {
  const dalja = new Set();
  for (let r of String(tekst).split(/\r?\n/)) {
    r = r.trim().toLowerCase().replace(/\.$/, '');
    if (!r || r.length > 63 || !/^[a-z0-9.-]+$/.test(r) || !pxwdBaza(r)) continue;
    if (!PXWD_TLD.includes(pxwdTld(r))) continue;
    const em = r.split('.')[0];
    if (em.length < 3 || /^..--/.test(em) || /\d{4,}/.test(em) || (em.match(/-/g) || []).length > 2 || /^-|-$/.test(em)) continue;
    if (pxseNePlatforme(r)) continue;
    dalja.add(r);
  }
  return [...dalja];
}

// Faqja kryesore: hapet, eshte HTML, ka tekst te mjaftueshem dhe nuk eshte e parkuar
async function pxwdFaqja(domaini) {
  let url = 'https://' + domaini + '/';
  for (let hap = 0; hap < 5; hap++) {
    let u; try { u = new URL(url); } catch (e) { return false; }
    if (!/^https?:$/.test(u.protocol) || !(await pxseHostPublik(u.hostname).catch(() => false))) return false;
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': PXWD_UA, Accept: 'text/html,application/xhtml+xml' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        url = new URL(r.headers.get('location'), url).toString(); try { await r.body?.cancel(); } catch (e) {}
        // ridrejtim te nje domain tjeter (shpesh parkim / shitje) → jo
        const h2 = new URL(url).hostname.replace(/^www\./, '');
        if (h2 !== domaini && !h2.endsWith('.' + domaini)) return false;
        continue;
      }
      if (!r.ok || !/html/i.test(r.headers.get('content-type') || '')) { try { await r.body?.cancel(); } catch (e) {} return false; }
      const html = Buffer.from(await r.arrayBuffer()).slice(0, 1500000).toString('utf8');
      const tekst = (pxseTekstNgaHtml ? pxseTekstNgaHtml(html) : html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (tekst.length < 250) return false;
      if (PXWD_PARKUAR.test(html.slice(0, 200000))) return false;
      return true;
    } catch (e) { return false; }
    finally { clearTimeout(t); }
  }
  return false;
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_wd_dite (
      dita DATE PRIMARY KEY,
      gjendja TEXT NOT NULL DEFAULT 'mungon',     -- mungon | ruajtur | duke | ndalur | perfunduar
      total INT, ruajtur INT, shkarkuar_at TIMESTAMPTZ, provuar_at TIMESTAMPTZ, gabimi TEXT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_wd_domenet (
      dita DATE NOT NULL, domaini TEXT NOT NULL,
      gjendja TEXT NOT NULL DEFAULT 'ri',         -- ri | ekziston | pa_mx | jo_google | dns_gabim | pa_faqe | gati | kaluar
      perpunuar_at TIMESTAMPTZ, PRIMARY KEY (dita, domaini))`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxwd_dom_gj ON pxse_wd_domenet (gjendja, dita)');
    await pool.query('ALTER TABLE pxse_wd_domenet ADD COLUMN IF NOT EXISTS rikontroll INT NOT NULL DEFAULT 0'); // sa rikontrolle jane bere
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_wd_cilesimet (celesi TEXT PRIMARY KEY, vlera TEXT)`);
  })().catch(e => console.error('pxse-whoisds migrim:', e.message));

  const sotData = () => new Date().toISOString().slice(0, 10);
  const diteMeParë = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  async function cilesimi(k, d) { try { const r = await pool.query('SELECT vlera FROM pxse_wd_cilesimet WHERE celesi=$1', [k]); return r.rows.length ? r.rows[0].vlera : d; } catch (e) { return d; } }
  async function vendos(k, v) { await pool.query('INSERT INTO pxse_wd_cilesimet (celesi, vlera) VALUES ($1,$2) ON CONFLICT (celesi) DO UPDATE SET vlera=$2', [k, String(v)]); }

  // ---------- 1. Shkarkimi ----------
  async function shkarkoDiten(dita) {
    const b64 = Buffer.from(dita + '.zip').toString('base64');
    let gabimi = 'nuk u gjet';
    for (const shabllon of PXWD_URLET) {
      const url = shabllon.replace('{b64}', b64).replace('{data}', dita);
      const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 120000);
      try {
        const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': PXWD_UA } });
        const buf = Buffer.from(await r.arrayBuffer());
        if (!r.ok) { gabimi = 'HTTP ' + r.status; continue; }
        if (buf.length < 4 || buf.readUInt32LE(0) !== 0x04034b50) { gabimi = 'lista s’është falas për këtë ditë (s’erdhi zip)'; continue; }
        const te = pxwdZip(buf), txt = te.filter(x => /\.txt$/i.test(x.emri)), sk = txt.length ? txt : te;
        if (!sk.length) { gabimi = 'zip pa .txt'; continue; }
        const tekst = sk.map(x => x.te.toString('utf8')).join('\n');
        const total = tekst.split(/\r?\n/).filter(x => x.trim()).length;
        const lista = pxwdFiltroListen(tekst);
        for (let i = 0; i < lista.length; i += 5000) {
          await pool.query('INSERT INTO pxse_wd_domenet (dita, domaini) SELECT $1::date, x FROM unnest($2::text[]) x ON CONFLICT DO NOTHING', [dita, lista.slice(i, i + 5000)]);
        }
        await pool.query(`INSERT INTO pxse_wd_dite (dita, gjendja, total, ruajtur, shkarkuar_at, provuar_at, gabimi) VALUES ($1,'ruajtur',$2,$3,now(),now(),NULL)
          ON CONFLICT (dita) DO UPDATE SET gjendja = CASE WHEN pxse_wd_dite.gjendja IN ('mungon') THEN 'ruajtur' ELSE pxse_wd_dite.gjendja END,
            total=$2, ruajtur=$3, shkarkuar_at=now(), provuar_at=now(), gabimi=NULL`, [dita, total, lista.length]);
        return { ok: true, total, ruajtur: lista.length };
      } catch (e) { gabimi = e.name === 'AbortError' ? 'koha mbaroi' : String(e.message).slice(0, 150); }
      finally { clearTimeout(t); }
    }
    await pool.query(`INSERT INTO pxse_wd_dite (dita, gjendja, provuar_at, gabimi) VALUES ($1,'mungon',now(),$2)
      ON CONFLICT (dita) DO UPDATE SET provuar_at=now(), gabimi = CASE WHEN pxse_wd_dite.shkarkuar_at IS NULL THEN $2 ELSE pxse_wd_dite.gabimi END`, [dita, gabimi]);
    return { ok: false, gabimi };
  }
  let shkDuke = false;
  async function shkarko() {
    if (shkDuke) return; shkDuke = true;
    try {
      for (let n = 1; n <= 4; n++) {
        const dita = diteMeParë(n);
        const r = (await pool.query('SELECT shkarkuar_at FROM pxse_wd_dite WHERE dita=$1', [dita])).rows[0];
        if (r && r.shkarkuar_at) continue;
        await shkarkoDiten(dita);
      }
    } catch (e) { console.error('pxse whoisds shkarkimi:', e.message); }
    finally { shkDuke = false; }
  }

  // ---------- 2. Filtri falas per ditet ne studim ----------
  let filDuke = false;
  // Nje grup (deri 100 domaine) i dites ne studim. Kthen sa domaine u kontrolluan (0 = s'ka me / i zene).
  async function filtroGrup() {
    if (filDuke) return -1; filDuke = true;
    try {
      // gabimet e perkohshme te DNS provohen perseri pas 1 ore
      await pool.query("UPDATE pxse_wd_domenet SET gjendja='ri' WHERE gjendja='dns_gabim' AND perpunuar_at < now() - interval '1 hour'");
      for (;;) {
        // dita e klikuar e fundit ka perparesi
        const d = (await pool.query("SELECT to_char(dita,'YYYY-MM-DD') dita FROM pxse_wd_dite WHERE gjendja='duke' ORDER BY (to_char(dita,'YYYY-MM-DD') = $1) DESC, dita DESC LIMIT 1", [await cilesimi('kuota_dita', '')])).rows[0];
        if (!d) return 0;
        const gr = (await pool.query("SELECT domaini FROM pxse_wd_domenet WHERE dita=$1 AND gjendja='ri' ORDER BY domaini LIMIT 100", [d.dita])).rows.map(x => x.domaini);
        if (!gr.length) { await pool.query("UPDATE pxse_wd_dite SET gjendja='perfunduar' WHERE dita=$1 AND gjendja='duke'", [d.dita]); continue; }
        // jo ne Import/Direktori (kontroll vetem per keta 100)
        const ek = new Set((await pool.query(`SELECT domaini FROM pxse_import_rreshtat WHERE domaini = ANY($1::text[])
            UNION SELECT domaini FROM pxse_bizneset WHERE domaini = ANY($1::text[])`, [gr])).rows.map(x => x.domaini));
        let i = 0;
        await Promise.all(Array.from({ length: 10 }, async () => {
          while (i < gr.length) {
            const dom = gr[i++];
            let gj;
            if (ek.has(dom)) gj = 'ekziston';
            else {
              // 1) MX menjehere (falas dhe i shpejte); 2) faqja vetem per ato qe kalojne; AI vetem per "gati"
              const mx = await pxwdMx(dom);
              if (mx === null) gj = 'dns_gabim';
              else if (mx === 'pa_mx') gj = 'pa_mx';
              else if (mx !== 'google' && pxwdVetemGoogle()) gj = 'jo_google';
              else gj = (await pxwdFaqja(dom)) ? 'gati' : 'pa_faqe';
            }
            await pool.query('UPDATE pxse_wd_domenet SET gjendja=$3, perpunuar_at=now() WHERE dita=$1 AND domaini=$2', [d.dita, dom, gj]);
          }
        }));
        return gr.length;
      }
    } catch (e) { console.error('pxse whoisds filtri:', e.message); return 0; }
    finally { filDuke = false; }
  }
  // Ne sfond (pa klikim): mban gati nje rezerve te vogel, pa e zene filtrin gjate
  async function filtro() {
    const kufiri = await perKlik();
    for (let k = 0; k < 20; k++) {
      const gati = (await pool.query("SELECT COUNT(*)::int n FROM pxse_wd_domenet WHERE gjendja='gati'")).rows[0].n;
      if (gati >= kufiri) return;
      if ((await filtroGrup()) <= 0) return;
    }
  }

  // ---------- 3. Te studimi i Importit (AI), me kufi ditor ----------
  async function importiId() {
    const r = await pool.query('SELECT id FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1', [PXWD_EMRI_IMPORTIT]);
    if (r.rows.length) return r.rows[0].id;
    return (await pool.query("INSERT INTO pxse_importet (emri, gjendja, total) VALUES ($1, 'gati', 0) RETURNING id", [PXWD_EMRI_IMPORTIT])).rows[0].id;
  }
  async function kaluarSot() {
    return (await pool.query("SELECT COUNT(*)::int n FROM pxse_wd_domenet WHERE gjendja='kaluar' AND perpunuar_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'")).rows[0].n;
  }
  let kalDuke = false;
  async function kalo(paKufi) {
    if (kalDuke) return; kalDuke = true;
    try {
      // paKufi = Auto: pa kufi ditor. Perndryshe: sa studime AI lejon ende klikimi i fundit "Studio".
      const mbetur = paKufi ? 100 : (parseInt(await cilesimi('kuota', '0'), 10) || 0);
      if (mbetur <= 0) return 0;
      const gr = (await pool.query(`SELECT w.domaini, to_char(w.dita,'YYYY-MM-DD') dita FROM pxse_wd_domenet w JOIN pxse_wd_dite d ON d.dita=w.dita
          WHERE w.gjendja='gati' AND d.gjendja IN ('duke','perfunduar') ORDER BY (to_char(w.dita,'YYYY-MM-DD') = $2) DESC, w.dita DESC, w.domaini LIMIT $1`,
          [Math.min(mbetur, 100), await cilesimi('kuota_dita', '')])).rows;
      if (!gr.length) return 0;
      const im = await importiId();
      const ins = await pool.query(`INSERT INTO pxse_import_rreshtat (import_id, domaini, url, gjendja, data_domainit, perpunuar_at)
          SELECT $1, d, 'https://' || d || '/', 'bere', dt::date, now() FROM unnest($2::text[], $3::text[]) AS t(d, dt)
          ON CONFLICT (import_id, domaini) DO NOTHING RETURNING domaini`, [im, gr.map(x => x.domaini), gr.map(x => x.dita)]);
      if (!paKufi) await pool.query("UPDATE pxse_wd_cilesimet SET vlera = GREATEST(0, vlera::int - $1)::text WHERE celesi='kuota'", [gr.length]);
      await pool.query("UPDATE pxse_importet SET total = total + $2, gjendja = CASE WHEN gjendja='gati' THEN 'duke' ELSE gjendja END, perfunduar_at = CASE WHEN gjendja='gati' THEN NULL ELSE perfunduar_at END WHERE id=$1", [im, ins.rows.length]);
      for (const x of gr) await pool.query("UPDATE pxse_wd_domenet SET gjendja='kaluar', perpunuar_at=now() WHERE dita=$1 AND domaini=$2", [x.dita, x.domaini]);
      if (app.locals.pxseImportiNis) app.locals.pxseImportiNis();
      return gr.length;
    } catch (e) { console.error('pxse whoisds kalimi:', e.message); return 0; }
    finally { kalDuke = false; }
  }
  // Pas klikimit "Studio": filtri + kalimi te AI pa pritur, derisa te mbaroje kuota ose domainet
  let punoDuke = false;
  const fle = ms => new Promise(r => setTimeout(r, ms));
  async function puno() {
    if (punoDuke) return; punoDuke = true;
    const fillimi = Date.now();
    try {
      while (Date.now() - fillimi < 4 * 3600 * 1000) {
        if ((parseInt(await cilesimi('kuota', '0'), 10) || 0) <= 0) break;
        const n = await filtroGrup();
        if (n === -1) { await fle(2000); continue; }   // filtri po punon ne sfond — prit, mos u ndal
        await kalo();                                    // ato me Google te gjetura ne kete grup shkojne menjehere te AI
        if (n === 0) {
          const ka = (await pool.query("SELECT 1 FROM pxse_wd_domenet w JOIN pxse_wd_dite d ON d.dita=w.dita WHERE d.gjendja IN ('duke','perfunduar') AND w.gjendja='gati' LIMIT 1")).rows.length;
          if (!ka) break;
          await fle(1000);
        }
      }
    } catch (e) { console.error('pxse whoisds puna:', e.message); }
    finally { punoDuke = false; }
  }
  // Studime AI per klikim: vlera e ruajtur nga admini; perndryshe PXSE_WD_STUDIM_DITORE; perndryshe 300
  const perKlik = async () => nr(await cilesimi('per_klik', ''), nr(process.env.PXSE_WD_STUDIM_DITORE, 300));

  // ---------- Auto: cdo dite dita N dite me pare ----------
  const rikontrollet = () => String(process.env.PXSE_WD_RIKONTROLL || '30,50').split(',').map(x => parseInt(x, 10)).filter(x => x > 0).sort((a, b) => a - b);
  async function auto() {
    try {
      if ((await cilesimi('auto', '0')) !== '1') return;
      const mosha = nr(process.env.PXSE_WD_MOSHA, 14);
      // 1. Te gjitha ditet e shkarkuara qe kane mbushur moshen (jo vetem nje dite)
      await pool.query("UPDATE pxse_wd_dite SET gjendja='duke' WHERE gjendja='ruajtur' AND shkarkuar_at IS NOT NULL AND dita <= current_date - $1::int", [mosha]);
      // 2. Rikontroll falas: "pa faqe" / "pa MX" / "jo Google" provohen perseri kur dita mbush 30 dhe 50 dite.
      //    Fazat nga e fundit te e para, qe nje domain i vjeter te mos kaloje dy faza njeheresh.
      const rk = rikontrollet();
      for (let k = rk.length - 1; k >= 0; k--) {
        await pool.query(`UPDATE pxse_wd_domenet w SET gjendja='ri', rikontroll=$1
            WHERE w.gjendja IN ('pa_faqe','pa_mx','jo_google') AND w.rikontroll < $1 AND w.dita <= current_date - $2::int
              AND w.dita IN (SELECT dita FROM pxse_wd_dite WHERE gjendja IN ('duke','perfunduar'))`, [k + 1, rk[k]]);
      }
      await pool.query(`UPDATE pxse_wd_dite d SET gjendja='duke' WHERE d.gjendja='perfunduar'
          AND EXISTS (SELECT 1 FROM pxse_wd_domenet w WHERE w.dita=d.dita AND w.gjendja='ri')`);
      punoAuto();
    } catch (e) { console.error('pxse whoisds auto:', e.message); }
  }
  // Auto: filtri + kalimi te AI pa kufi, derisa te mbarojne te gjitha. Gjendja eshte ne databaze, keshtu qe pas
  // rinisjes se serverit vazhdon nga aty ku mbeti (thirret cdo 5 minuta).
  let autoDuke = false;
  async function punoAuto() {
    if (autoDuke) return; autoDuke = true;
    try {
      while ((await cilesimi('auto', '0')) === '1') {
        const n = await filtroGrup();
        if (n === -1) { await fle(2000); continue; }      // filtri po punon diku tjeter — prit
        const k = await kalo(true);
        if (n === 0 && !k) break;                          // s'ka me per filtrim dhe s'ka me "gati"
        await fle(200);
      }
    } catch (e) { console.error('pxse whoisds auto puna:', e.message); }
    finally { autoDuke = false; }
    neDirektori();
  }

  // ---------- 4. Kalimi automatik ne direktori (vetem bizneset e ketij skedari) ----------
  // Kushtet jane te njejta me butonin "Kalo ne direktori": biznes, email i domainit, MX, faqe aktive, studim i perfunduar.
  // Domainet qe jane tashme ne direktori (p.sh. nga Common Crawl) nuk preken.
  let dirDuke = false;
  async function neDirektori() {
    if (dirDuke) return; dirDuke = true;
    try {
      const imR = (await pool.query('SELECT id FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1', [PXWD_EMRI_IMPORTIT])).rows[0];
      if (!imR) return;
      let shtuar = 0;
      for (;;) {
        const r = (await pool.query(`SELECT r.id, r.domaini, r.emri, r.email, r.kategoria, r.shteti, r.pershkrimi, r.lloji, r.email_lloji,
              to_char(r.data_domainit, 'YYYY-MM-DD') data_domainit
            FROM pxse_import_rreshtat r
            WHERE r.import_id=$1 AND NOT r.ne_direktori AND r.studim2 IS NOT NULL AND r.gjendja='bere' AND r.statusi='biznes'
              AND r.email IS NOT NULL AND r.ka_mx AND r.aktiv IS NOT FALSE
              AND NOT EXISTS (SELECT 1 FROM pxse_bizneset b WHERE b.domaini = r.domaini)
            ORDER BY r.id LIMIT 200`, [imR.id])).rows;
        if (!r.length) break;
        const kaluan = [];
        for (const x of r) {
          const ins = await pool.query(`INSERT INTO pxse_bizneset (domaini, emri, email, kategoria, vendi, pershkrimi, email_verifikuar, lloji, data_domainit, email_lloji, burimi, import_id)
              VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8,$9,'whoisds',$10) ON CONFLICT (domaini) DO NOTHING RETURNING id`,
            [x.domaini, x.emri || null, x.email, x.kategoria || 'Other', x.shteti || null, x.pershkrimi || null, x.lloji || null, x.data_domainit || null, x.email_lloji || null, imR.id]);
          if (ins.rows.length) { kaluan.push(x.id); shtuar++; }
        }
        if (kaluan.length) await pool.query('UPDATE pxse_import_rreshtat SET ne_direktori=true WHERE id = ANY($1::bigint[])', [kaluan]);
        if (kaluan.length < r.length) break;   // te tjeret u futen ndermjet nga dikush tjeter — mos u rrotullo
      }
      // vetem bizneset me email te Google mbeten te dukshme (si per butonin)
      if (shtuar && app.locals.pxseDirektoriaGoogle) app.locals.pxseDirektoriaGoogle();
    } catch (e) { console.error('pxse whoisds → direktoria:', e.message); }
    finally { dirDuke = false; }
  }
  async function pastro() {
    const mbaj = nr(process.env.PXSE_WD_MBAJ_DITE, 60);
    await pool.query(`DELETE FROM pxse_wd_domenet WHERE dita < current_date - $1::int`, [mbaj]).catch(() => {});
    await pool.query(`DELETE FROM pxse_wd_dite WHERE dita < current_date - $1::int`, [mbaj]).catch(() => {});
  }

  setTimeout(() => {
    shkarko(); auto();
    setInterval(shkarko, 2 * 3600 * 1000).unref();
    setInterval(async () => { await auto(); if ((await cilesimi('auto', '0')) !== '1') filtro(); }, 5 * 60 * 1000).unref();
    setInterval(() => kalo(), 10 * 60 * 1000).unref();
    setInterval(neDirektori, 10 * 60 * 1000).unref();
    setInterval(pastro, 24 * 3600 * 1000).unref();
  }, 50000).unref();
  app.locals.pxseWhoisds = { shkarko, shkarkoDiten, filtro, filtroGrup, kalo, auto, neDirektori, pxwdFiltroListen, pxwdZip };

  // ---------- Admin API ----------
  app.get('/api/admin/pxse/whoisds', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const ditet = (await pool.query(`SELECT to_char(d.dita,'YYYY-MM-DD') dita, d.gjendja, d.total, d.ruajtur, d.gabimi, d.shkarkuar_at, d.provuar_at,
          COALESCE(c.ri,0) ri, COALESCE(c.ekziston,0) ekziston, COALESCE(c.pa_mx,0) pa_mx, COALESCE(c.jo_google,0) jo_google, COALESCE(c.pa_faqe,0) pa_faqe, COALESCE(c.gati,0) gati, COALESCE(c.kaluar,0) kaluar
        FROM pxse_wd_dite d LEFT JOIN (SELECT dita, COUNT(*) FILTER (WHERE gjendja IN ('ri','dns_gabim'))::int ri, COUNT(*) FILTER (WHERE gjendja='ekziston')::int ekziston,
          COUNT(*) FILTER (WHERE gjendja='pa_mx')::int pa_mx, COUNT(*) FILTER (WHERE gjendja='jo_google')::int jo_google, COUNT(*) FILTER (WHERE gjendja='pa_faqe')::int pa_faqe, COUNT(*) FILTER (WHERE gjendja='gati')::int gati,
          COUNT(*) FILTER (WHERE gjendja='kaluar')::int kaluar FROM pxse_wd_domenet GROUP BY dita) c ON c.dita=d.dita ORDER BY d.dita DESC LIMIT 90`)).rows;
      const imR = (await pool.query('SELECT id, gjendja, total, gabimi FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1', [PXWD_EMRI_IMPORTIT])).rows[0] || null;
      let importi = null, teFundit = [];
      if (imR) {
        const t = (await pool.query(`SELECT COUNT(*) FILTER (WHERE studim2 IS NOT NULL)::int studiuar, COUNT(*) FILTER (WHERE statusi='biznes')::int biznese,
            COUNT(*) FILTER (WHERE email IS NOT NULL)::int me_email,
            COUNT(*) FILTER (WHERE statusi='biznes' AND lloji IN ('b2b','both') AND email IS NOT NULL AND ka_mx AND aktiv IS NOT FALSE)::int gati_b2b,
            COUNT(*) FILTER (WHERE ne_direktori)::int ne_direktori
          FROM pxse_import_rreshtat WHERE import_id=$1`, [imR.id])).rows[0];
        importi = Object.assign({ id: imR.id, gjendja: imR.gjendja, total: imR.total, gabimi: imR.gabimi }, t);
        teFundit = (await pool.query(`SELECT domaini, emri, kategoria, lloji, shteti, email, email_ofruesi, to_char(data_domainit, 'YYYY-MM-DD') data_domainit, pershkrimi
            FROM pxse_import_rreshtat WHERE import_id=$1 AND statusi='biznes' AND studim2 IS NOT NULL ORDER BY studim2_at DESC NULLS LAST LIMIT 25`, [imR.id])).rows;
      }
      res.json({ ok: true, auto: (await cilesimi('auto', '0')) === '1', emri: PXWD_EMRI_IMPORTIT, ditet, importi, te_fundit: teFundit, kaluar_sot: await kaluarSot(),
        kuota: parseInt(await cilesimi('kuota', '0'), 10) || 0, per_klik: await perKlik(), duke_punuar: punoDuke || autoDuke,
        kufijte: { studim: await perKlik(), mosha: nr(process.env.PXSE_WD_MOSHA, 14), rikontroll: rikontrollet(), mbaj: nr(process.env.PXSE_WD_MBAJ_DITE, 60), vetem_google: pxwdVetemGoogle() } });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  app.post('/api/admin/pxse/whoisds/studio', iAdmin, async (req, res) => {
    const d = (req.body || {}).dita; if (!dataOk(d)) return res.status(400).json({ error: 'Data e pavlefshme' });
    try {
      const r = await pool.query("UPDATE pxse_wd_dite SET gjendja='duke' WHERE dita=$1 AND shkarkuar_at IS NOT NULL RETURNING dita", [d]);
      if (!r.rows.length) return res.status(404).json({ error: 'Kjo ditë nuk është shkarkuar' });
      // cdo klikim lejon deri ne 300 studime AI (kuota e mbetur nga klikimi i meparshem zevendesohet, nuk mblidhet)
      const pk = await perKlik();
      await vendos('kuota', pk); await vendos('kuota_dita', d);
      puno(); res.json({ ok: true, kuota: pk });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/ndalo', iAdmin, async (req, res) => {
    const d = (req.body || {}).dita; if (!dataOk(d)) return res.status(400).json({ error: 'Data e pavlefshme' });
    try { await pool.query("UPDATE pxse_wd_dite SET gjendja='ndalur' WHERE dita=$1 AND gjendja='duke'", [d]); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Ndryshimi i kufirit per klikim nga admini (1–10000); vlen menjehere per klikimin e radhes
  app.post('/api/admin/pxse/whoisds/per-klik', iAdmin, async (req, res) => {
    const v = parseInt((req.body || {}).vlera, 10);
    if (!Number.isFinite(v) || v < 1 || v > 10000) return res.status(400).json({ error: 'Vendos një numër nga 1 deri në 10000' });
    try { await vendos('per_klik', v); res.json({ ok: true, per_klik: v }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/shkarko', iAdmin, async (req, res) => {
    try { await shkarko(); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/auto', iAdmin, async (req, res) => {
    try { await vendos('auto', (req.body || {}).aktiv ? '1' : '0'); if ((req.body || {}).aktiv) auto(); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
module.exports.pxwdFiltroListen = pxwdFiltroListen;
module.exports.pxwdZip = pxwdZip;
