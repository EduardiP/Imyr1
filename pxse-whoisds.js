// pxse-whoisds.js — Domainet e regjistruara ne nje dite te caktuar (lista falas ditore e WhoisDS).
//
// Rrjedha:
//   1. Cdo 2 ore provon te shkarkoje listat e 4 diteve te fundit qe mungojne (WhoisDS jep falas vetem ditet me te fundit).
//      Lista (zip → .txt, nje domain per rresht) ruhet ne databaze sipas dites, vetem TLD-te e biznesit dhe emrat normale.
//   2. Admini zgjedh nje dite (p.sh. 14 dite me pare) → "Studio" (ose Auto: cdo dite vete dita N dite me pare).
//      Filtri falas: jo ne Import/Direktori, ka MX, faqja hapet dhe nuk eshte e parkuar / "coming soon".
//   3. Ato qe kalojne shkojne te studimi ekzistues i Importit (AI), ne skedarin "Domaine të reja (WhoisDS)",
//      me kufi ditor; prej andej kalojne vete te Marketingu (B2B, sipas ofruesit). Data e regjistrimit = dita e listes.
//
// Railway Variables (opsionale): PXSE_WD_STUDIM_DITORE (300), PXSE_WD_MOSHA (14), PXSE_WD_MBAJ_DITE (60),
// PXSE_WD_TLD (lista), PXSE_WD_URL (formati i lidhjes: {b64} = base64("YYYY-MM-DD.zip"), {data} = YYYY-MM-DD).
const zlib = require('zlib');
const { pxseNePlatforme, pxseHostPublik, pxseTekstNgaHtml } = require('./pxse-prova');
const { pximKaMx } = require('./pxse-importi');

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
      gjendja TEXT NOT NULL DEFAULT 'ri',         -- ri | ekziston | pa_mx | pa_faqe | gati | kaluar
      perpunuar_at TIMESTAMPTZ, PRIMARY KEY (dita, domaini))`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxwd_dom_gj ON pxse_wd_domenet (gjendja, dita)');
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
  async function filtro() {
    if (filDuke) return; filDuke = true;
    try {
      const kufiri = nr(process.env.PXSE_WD_STUDIM_DITORE, 300);
      for (;;) {
        // mjaftojne 2 dite rezerve "gati" — pjesa tjeter filtrohet kur te nevojitet
        const gati = (await pool.query("SELECT COUNT(*)::int n FROM pxse_wd_domenet WHERE gjendja='gati'")).rows[0].n;
        if (gati >= kufiri * 2) break;
        const d = (await pool.query("SELECT to_char(dita,'YYYY-MM-DD') dita FROM pxse_wd_dite WHERE gjendja='duke' ORDER BY dita DESC LIMIT 1")).rows[0];
        if (!d) break;
        await pool.query(`UPDATE pxse_wd_domenet w SET gjendja='ekziston', perpunuar_at=now() WHERE w.dita=$1 AND w.gjendja='ri' AND (
            EXISTS (SELECT 1 FROM pxse_import_rreshtat r WHERE r.domaini = w.domaini) OR EXISTS (SELECT 1 FROM pxse_bizneset b WHERE b.domaini = w.domaini))`, [d.dita]);
        const gr = (await pool.query("SELECT domaini FROM pxse_wd_domenet WHERE dita=$1 AND gjendja='ri' ORDER BY domaini LIMIT 100", [d.dita])).rows.map(x => x.domaini);
        if (!gr.length) { await pool.query("UPDATE pxse_wd_dite SET gjendja='perfunduar' WHERE dita=$1 AND gjendja='duke'", [d.dita]); continue; }
        let i = 0;
        await Promise.all(Array.from({ length: 10 }, async () => {
          while (i < gr.length) {
            const dom = gr[i++];
            let gj = 'gati';
            if (!(await pximKaMx(dom).catch(() => false))) gj = 'pa_mx';
            else if (!(await pxwdFaqja(dom))) gj = 'pa_faqe';
            await pool.query('UPDATE pxse_wd_domenet SET gjendja=$3, perpunuar_at=now() WHERE dita=$1 AND domaini=$2', [d.dita, dom, gj]);
          }
        }));
      }
    } catch (e) { console.error('pxse whoisds filtri:', e.message); }
    finally { filDuke = false; }
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
  async function kalo() {
    if (kalDuke) return; kalDuke = true;
    try {
      const mbetur = nr(process.env.PXSE_WD_STUDIM_DITORE, 300) - await kaluarSot();
      if (mbetur <= 0) return;
      const gr = (await pool.query(`SELECT w.domaini, to_char(w.dita,'YYYY-MM-DD') dita FROM pxse_wd_domenet w JOIN pxse_wd_dite d ON d.dita=w.dita
          WHERE w.gjendja='gati' AND d.gjendja IN ('duke','perfunduar') ORDER BY w.dita DESC, w.domaini LIMIT $1`, [Math.min(mbetur, 100)])).rows;
      if (!gr.length) return;
      const im = await importiId();
      const ins = await pool.query(`INSERT INTO pxse_import_rreshtat (import_id, domaini, url, gjendja, data_domainit, perpunuar_at)
          SELECT $1, d, 'https://' || d || '/', 'bere', dt::date, now() FROM unnest($2::text[], $3::text[]) AS t(d, dt)
          ON CONFLICT (import_id, domaini) DO NOTHING RETURNING domaini`, [im, gr.map(x => x.domaini), gr.map(x => x.dita)]);
      await pool.query("UPDATE pxse_importet SET total = total + $2, gjendja = CASE WHEN gjendja='gati' THEN 'duke' ELSE gjendja END, perfunduar_at = CASE WHEN gjendja='gati' THEN NULL ELSE perfunduar_at END WHERE id=$1", [im, ins.rows.length]);
      for (const x of gr) await pool.query("UPDATE pxse_wd_domenet SET gjendja='kaluar', perpunuar_at=now() WHERE dita=$1 AND domaini=$2", [x.dita, x.domaini]);
      if (app.locals.pxseImportiNis) app.locals.pxseImportiNis();
    } catch (e) { console.error('pxse whoisds kalimi:', e.message); }
    finally { kalDuke = false; }
  }

  // ---------- Auto: cdo dite dita N dite me pare ----------
  async function auto() {
    try {
      if ((await cilesimi('auto', '0')) !== '1') return;
      const dita = diteMeParë(nr(process.env.PXSE_WD_MOSHA, 14));
      await pool.query("UPDATE pxse_wd_dite SET gjendja='duke' WHERE dita=$1 AND gjendja='ruajtur'", [dita]);
    } catch (e) {}
  }
  async function pastro() {
    const mbaj = nr(process.env.PXSE_WD_MBAJ_DITE, 60);
    await pool.query(`DELETE FROM pxse_wd_domenet WHERE dita < current_date - $1::int`, [mbaj]).catch(() => {});
    await pool.query(`DELETE FROM pxse_wd_dite WHERE dita < current_date - $1::int`, [mbaj]).catch(() => {});
  }

  setTimeout(() => {
    shkarko(); auto();
    setInterval(shkarko, 2 * 3600 * 1000).unref();
    setInterval(() => { auto().then(filtro); }, 5 * 60 * 1000).unref();
    setInterval(kalo, 10 * 60 * 1000).unref();
    setInterval(pastro, 24 * 3600 * 1000).unref();
  }, 50000).unref();
  app.locals.pxseWhoisds = { shkarko, shkarkoDiten, filtro, kalo, auto, pxwdFiltroListen, pxwdZip };

  // ---------- Admin API ----------
  app.get('/api/admin/pxse/whoisds', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const ditet = (await pool.query(`SELECT to_char(d.dita,'YYYY-MM-DD') dita, d.gjendja, d.total, d.ruajtur, d.gabimi, d.shkarkuar_at, d.provuar_at,
          COALESCE(c.ri,0) ri, COALESCE(c.ekziston,0) ekziston, COALESCE(c.pa_mx,0) pa_mx, COALESCE(c.pa_faqe,0) pa_faqe, COALESCE(c.gati,0) gati, COALESCE(c.kaluar,0) kaluar
        FROM pxse_wd_dite d LEFT JOIN (SELECT dita, COUNT(*) FILTER (WHERE gjendja='ri')::int ri, COUNT(*) FILTER (WHERE gjendja='ekziston')::int ekziston,
          COUNT(*) FILTER (WHERE gjendja='pa_mx')::int pa_mx, COUNT(*) FILTER (WHERE gjendja='pa_faqe')::int pa_faqe, COUNT(*) FILTER (WHERE gjendja='gati')::int gati,
          COUNT(*) FILTER (WHERE gjendja='kaluar')::int kaluar FROM pxse_wd_domenet GROUP BY dita) c ON c.dita=d.dita ORDER BY d.dita DESC LIMIT 90`)).rows;
      const imR = (await pool.query('SELECT id, gjendja, total, gabimi FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1', [PXWD_EMRI_IMPORTIT])).rows[0] || null;
      let importi = null, teFundit = [];
      if (imR) {
        const t = (await pool.query(`SELECT COUNT(*) FILTER (WHERE studim2 IS NOT NULL)::int studiuar, COUNT(*) FILTER (WHERE statusi='biznes')::int biznese,
            COUNT(*) FILTER (WHERE email IS NOT NULL)::int me_email,
            COUNT(*) FILTER (WHERE statusi='biznes' AND lloji IN ('b2b','both') AND email IS NOT NULL AND ka_mx AND aktiv IS NOT FALSE)::int gati_b2b
          FROM pxse_import_rreshtat WHERE import_id=$1`, [imR.id])).rows[0];
        importi = Object.assign({ id: imR.id, gjendja: imR.gjendja, total: imR.total, gabimi: imR.gabimi }, t);
        teFundit = (await pool.query(`SELECT domaini, emri, kategoria, lloji, shteti, email, email_ofruesi, to_char(data_domainit, 'YYYY-MM-DD') data_domainit, pershkrimi
            FROM pxse_import_rreshtat WHERE import_id=$1 AND statusi='biznes' AND studim2 IS NOT NULL ORDER BY studim2_at DESC NULLS LAST LIMIT 25`, [imR.id])).rows;
      }
      res.json({ ok: true, auto: (await cilesimi('auto', '0')) === '1', emri: PXWD_EMRI_IMPORTIT, ditet, importi, te_fundit: teFundit, kaluar_sot: await kaluarSot(),
        kufijte: { studim: nr(process.env.PXSE_WD_STUDIM_DITORE, 300), mosha: nr(process.env.PXSE_WD_MOSHA, 14), mbaj: nr(process.env.PXSE_WD_MBAJ_DITE, 60) } });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  app.post('/api/admin/pxse/whoisds/studio', iAdmin, async (req, res) => {
    const d = (req.body || {}).dita; if (!dataOk(d)) return res.status(400).json({ error: 'Data e pavlefshme' });
    try {
      const r = await pool.query("UPDATE pxse_wd_dite SET gjendja='duke' WHERE dita=$1 AND shkarkuar_at IS NOT NULL RETURNING dita", [d]);
      if (!r.rows.length) return res.status(404).json({ error: 'Kjo ditë nuk është shkarkuar' });
      filtro(); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/ndalo', iAdmin, async (req, res) => {
    const d = (req.body || {}).dita; if (!dataOk(d)) return res.status(400).json({ error: 'Data e pavlefshme' });
    try { await pool.query("UPDATE pxse_wd_dite SET gjendja='ndalur' WHERE dita=$1 AND gjendja='duke'", [d]); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/shkarko', iAdmin, async (req, res) => {
    try { await shkarko(); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/whoisds/auto', iAdmin, async (req, res) => {
    try { await vendos('auto', (req.body || {}).aktiv ? '1' : '0'); if ((req.body || {}).aktiv) auto().then(filtro); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
module.exports.pxwdFiltroListen = pxwdFiltroListen;
module.exports.pxwdZip = pxwdZip;
