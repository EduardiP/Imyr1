// pxse-te-rejat.js — Biznese online të reja nga certifikatat SSL (Certificate Transparency).
//
// Rrjedha (cdo gje automatike, pa API-key; regjistrat CT, RDAP dhe DNS jane publike dhe falas):
//   1. Lexon certifikatat e reja nga 2-3 regjistra publike CT (cdo minute) dhe nxjerr domainet baze (pa nen-domaine teknike,
//      pa platforma si vercel.app / wordpress.com, vetem TLD-te e biznesit).
//   2. RDAP: mban vetem domainet e regjistruara se fundmi (paracaktim 120 dite) — rinovimet e faqeve te vjetra hidhen.
//   3. Pret disa dite (faqja mbushet), kontrollon MX, pastaj e kalon te studimi ekzistues i Importit (faqja e gjalle + AI nano +
//      email), ne skedarin e perhershem "Biznese të reja (SSL)". Prej andej kalon vete te Marketingu (B2B, sipas ofruesit).
//
// Admini (Marketingu → Biznese të reja): numrat, Nis / Ndalo. Nis vetem kur klikohet "Nis" (paracaktim: i ndalur).
// Kufijte ditore (Railway Variables, opsionale): PXSE_TR_RDAP_DITORE (3000), PXSE_TR_STUDIM_DITORE (300), PXSE_TR_DITE (120),
// PXSE_TR_PRITJA_DITE (3), PXSE_TR_TLD (lista). PXSE_TR_LOGJET = URL-te e regjistrave CT (vetem per teste).
const crypto = require('crypto');
const { pxseNePlatforme } = require('./pxse-prova');
const { pximMerr, pximDataDomainit, pximKaMx } = require('./pxse-importi');

const PXTR_EMRI_IMPORTIT = 'Biznese të reja (SSL)';
const PXTR_LOG_LISTA = 'https://www.gstatic.com/ct/log_list/v3/log_list.json';
const PXTR_TLD = (process.env.PXSE_TR_TLD || 'com,io,ai,co,app,dev,tech,net,de,ca,co.uk,com.au').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const PXTR_SUFIKSE_2 = ['co.uk', 'org.uk', 'ltd.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br', 'co.za', 'co.jp', 'com.mx', 'com.tr', 'co.in', 'com.sg', 'com.hk', 'co.il', 'com.ar', 'com.co'];
// nen-domaine teknike / sherbimi qe nuk jane faqja e biznesit
const PXTR_TEKNIKE = /^(mail|webmail|smtp|imap|pop|mx|autodiscover|autoconfig|cpanel|whm|webdisk|cpcalendars|cpcontacts|ftp|ns\d*|vpn|remote|owa|api|cdn|static|dev|staging|test|admin|portal|app|dashboard|status|shop|store|blog|m)\./;
const nr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };

// Domaini baze (eTLD+1) me nje liste te vogel sufiksesh me dy pjese
function pxtrBaza(emer) {
  const p = String(emer || '').toLowerCase().replace(/\.$/, '').split('.');
  if (p.length < 2) return null;
  const dy = p.slice(-2).join('.');
  if (PXTR_SUFIKSE_2.includes(dy)) return p.length >= 3 ? p.slice(-3).join('.') : null;
  return dy;
}
function pxtrTld(baza) { const p = baza.split('.'); return PXTR_SUFIKSE_2.includes(p.slice(-2).join('.')) ? p.slice(-2).join('.') : p[p.length - 1]; }

// Nga nje hyrje CT (RFC 6962 get-entries) → lista e emrave DNS te certifikates
function pxtrEmratNgaHyrja(h) {
  try {
    const leaf = Buffer.from(h.leaf_input, 'base64');
    if (leaf.length < 15 || leaf[0] !== 0 || leaf[1] !== 0) return [];
    const lloji = leaf.readUInt16BE(10);
    let der = null;
    if (lloji === 0) { const n = leaf.readUIntBE(12, 3); der = leaf.subarray(15, 15 + n); }                     // x509_entry
    else if (lloji === 1) { const ex = Buffer.from(h.extra_data || '', 'base64'); const n = ex.readUIntBE(0, 3); der = ex.subarray(3, 3 + n); } // precert: certifikata paraprake e plote
    if (!der || !der.length) return [];
    const c = new crypto.X509Certificate(der);
    const san = String(c.subjectAltName || '');
    const emrat = san.split(',').map(x => x.trim()).filter(x => /^DNS:/i.test(x)).map(x => x.slice(4).trim().toLowerCase());
    return emrat;
  } catch (e) { return []; }
}
// Emrat e certifikates → domainet baze qe i takojne faqes se biznesit
function pxtrDomenet(emrat) {
  const dalja = new Set();
  for (const e of emrat) {
    if (!e || e.startsWith('*.') || e.length > 100 || !/^[a-z0-9.-]+$/.test(e)) continue;
    const baza = pxtrBaza(e);
    if (!baza) continue;
    if (e !== baza && e !== 'www.' + baza) continue;             // vetem vete faqja (jo mail., cpanel., app., ...)
    if (PXTR_TEKNIKE.test(e) && e !== 'www.' + baza) continue;
    if (!PXTR_TLD.includes(pxtrTld(baza))) continue;
    if (/^xn--/.test(baza) || /\d{5,}/.test(baza) || baza.split('.')[0].length < 3) continue; // punycode, numra te gjate, shume te shkurtra
    if (pxseNePlatforme(baza)) continue;
    dalja.add(baza);
  }
  return [...dalja];
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_tr_domenet (
      domaini TEXT PRIMARY KEY,
      pare_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      gjendja TEXT NOT NULL DEFAULT 'ri',          -- ri | pret | kaluar | vjeter | pa_rdap | pa_mx
      data_domainit DATE,
      gati_pas TIMESTAMPTZ,
      perpunuar_at TIMESTAMPTZ
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxtr_dom_gj ON pxse_tr_domenet (gjendja, gati_pas)');
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_tr_logjet (url TEXT PRIMARY KEY, emri TEXT, pozicioni BIGINT, madhesia BIGINT, gabimi TEXT, perditesuar_at TIMESTAMPTZ)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_tr_dite (
      dita DATE PRIMARY KEY, certifikata INT NOT NULL DEFAULT 0, domene INT NOT NULL DEFAULT 0, rdap INT NOT NULL DEFAULT 0,
      te_reja INT NOT NULL DEFAULT 0, kaluar INT NOT NULL DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_tr_cilesimet (celesi TEXT PRIMARY KEY, vlera TEXT)`);
  })().catch(e => console.error('pxse-te-rejat migrim:', e.message));

  const dita = () => new Date().toISOString().slice(0, 10);
  async function shto(fusha, n) {
    if (!n) return;
    await pool.query(`INSERT INTO pxse_tr_dite (dita, ${fusha}) VALUES ($1, $2) ON CONFLICT (dita) DO UPDATE SET ${fusha} = pxse_tr_dite.${fusha} + $2`, [dita(), n]);
  }
  async function cilesimi(k, d) { try { const r = await pool.query('SELECT vlera FROM pxse_tr_cilesimet WHERE celesi=$1', [k]); return r.rows.length ? r.rows[0].vlera : d; } catch (e) { return d; } }
  async function vendos(k, v) { await pool.query('INSERT INTO pxse_tr_cilesimet (celesi, vlera) VALUES ($1,$2) ON CONFLICT (celesi) DO UPDATE SET vlera=$2', [k, String(v)]); }
  const aktiv = async () => (await cilesimi('aktiv', '0')) === '1';

  // ---------- 1. Regjistrat CT ----------
  let logjet = null, logjetAt = 0;
  async function zgjidhLogjet() {
    if (process.env.PXSE_TR_LOGJET) return process.env.PXSE_TR_LOGJET.split(',').map(u => ({ url: u.trim().replace(/\/?$/, '/'), emri: u.trim() }));
    if (logjet && Date.now() - logjetAt < 24 * 3600 * 1000) return logjet;
    const r = await pximMerr(PXTR_LOG_LISTA, {}, 20000, 'json').catch(() => null);
    if (!r || !r.ok || !r.trupi) return logjet || [];
    const tani = Date.now(), lista = [];
    for (const op of r.trupi.operators || []) {
      for (const l of op.logs || []) {
        const ti = l.temporal_interval || {};
        const brenda = (!ti.start_inclusive || Date.parse(ti.start_inclusive) <= tani) && (!ti.end_exclusive || Date.parse(ti.end_exclusive) > tani);
        if (l.state && l.state.usable && brenda && l.url) lista.push({ url: l.url.replace(/\/?$/, '/'), emri: (op.name || '') + ' · ' + (l.description || '') });
      }
    }
    // 3 regjistra nga operatore te ndryshem mjaftojne (shumica e certifikatave shkruhen ne disa regjistra njekohesisht)
    const parapelqyer = ['Google', 'Let', 'Cloudflare', 'DigiCert', 'Sectigo'];
    lista.sort((a, b) => { const ia = parapelqyer.findIndex(p => a.emri.includes(p)), ib = parapelqyer.findIndex(p => b.emri.includes(p)); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    const operatoret = new Set(), zgjedhur = [];
    for (const l of lista) { const op = l.emri.split(' · ')[0]; if (operatoret.has(op)) continue; operatoret.add(op); zgjedhur.push(l); if (zgjedhur.length >= 3) break; }
    logjet = zgjedhur; logjetAt = Date.now();
    return logjet;
  }

  let leximDuke = false;
  async function lexoCT() {
    if (leximDuke || !(await aktiv())) return; leximDuke = true;
    try {
      const kufiri = nr(process.env.PXSE_TR_RDAP_DITORE, 3000) * 2;          // sa domaine te reja ruhen ne dite (per t'i kontrolluar me RDAP)
      const sot = (await pool.query('SELECT domene FROM pxse_tr_dite WHERE dita=$1', [dita()])).rows[0];
      if (sot && sot.domene >= kufiri) return;
      for (const l of await zgjidhLogjet()) {
        try {
          const sth = await pximMerr(l.url + 'ct/v1/get-sth', {}, 15000, 'json');
          if (!sth || !sth.ok || !sth.trupi || !sth.trupi.tree_size) throw new Error('get-sth ' + (sth && sth.status));
          const madhesia = Number(sth.trupi.tree_size);
          const r0 = (await pool.query('SELECT pozicioni FROM pxse_tr_logjet WHERE url=$1', [l.url])).rows[0];
          let poz = r0 && r0.pozicioni != null ? Number(r0.pozicioni) : madhesia - 256;
          // regjistrat rriten me qindra certifikata ne sekonde: kur ngelet shume mbrapa, kercen te me te rejat (mjafton nje mostër e fresket)
          if (madhesia - poz > 5000) poz = madhesia - 256;
          poz = Math.max(0, poz);
          let lexuar = 0, domene = [];
          for (let b = 0; b < 4 && poz < madhesia; b++) {
            const fund = Math.min(poz + 255, madhesia - 1);
            const e = await pximMerr(l.url + 'ct/v1/get-entries?start=' + poz + '&end=' + fund, {}, 20000, 'json');
            const hyrjet = e && e.ok && e.trupi && Array.isArray(e.trupi.entries) ? e.trupi.entries : [];
            if (!hyrjet.length) break;
            for (const h of hyrjet) domene = domene.concat(pxtrDomenet(pxtrEmratNgaHyrja(h)));
            poz += hyrjet.length; lexuar += hyrjet.length;
          }
          await pool.query(`INSERT INTO pxse_tr_logjet (url, emri, pozicioni, madhesia, gabimi, perditesuar_at) VALUES ($1,$2,$3,$4,NULL,now())
            ON CONFLICT (url) DO UPDATE SET emri=$2, pozicioni=$3, madhesia=$4, gabimi=NULL, perditesuar_at=now()`, [l.url, l.emri, poz, madhesia]);
          await shto('certifikata', lexuar);
          const unike = [...new Set(domene)];
          if (unike.length) {
            const ins = await pool.query(`INSERT INTO pxse_tr_domenet (domaini) SELECT x FROM unnest($1::text[]) x
                WHERE NOT EXISTS (SELECT 1 FROM pxse_import_rreshtat r WHERE r.domaini = x) AND NOT EXISTS (SELECT 1 FROM pxse_bizneset b WHERE b.domaini = x)
                ON CONFLICT (domaini) DO NOTHING RETURNING domaini`, [unike]);
            await shto('domene', ins.rows.length);
          }
        } catch (err) {
          await pool.query(`INSERT INTO pxse_tr_logjet (url, emri, gabimi, perditesuar_at) VALUES ($1,$2,$3,now())
            ON CONFLICT (url) DO UPDATE SET gabimi=$3, perditesuar_at=now()`, [l.url, l.emri, String(err.message).slice(0, 200)]).catch(() => {});
        }
      }
    } catch (e) { console.error('pxse te-rejat CT:', e.message); }
    finally { leximDuke = false; }
  }

  // ---------- 2. RDAP: vetem domainet e regjistruara se fundmi ----------
  let rdapDuke = false;
  async function kontrolloRdap() {
    if (rdapDuke || !(await aktiv())) return; rdapDuke = true;
    try {
      const kufiri = nr(process.env.PXSE_TR_RDAP_DITORE, 3000), diteTeReja = nr(process.env.PXSE_TR_DITE, 120), pritja = nr(process.env.PXSE_TR_PRITJA_DITE, 3);
      for (;;) {
        const sot = (await pool.query('SELECT rdap FROM pxse_tr_dite WHERE dita=$1', [dita()])).rows[0];
        if ((sot ? sot.rdap : 0) >= kufiri || !(await aktiv())) break;
        const gr = (await pool.query("SELECT domaini FROM pxse_tr_domenet WHERE gjendja='ri' ORDER BY pare_at DESC LIMIT 20")).rows;
        if (!gr.length) break;
        for (const x of gr) {
          const data = await pximDataDomainit(x.domaini).catch(() => null);
          const mosha = data ? (Date.now() - Date.parse(data + 'T00:00:00Z')) / 86400000 : null;
          const gj = data == null ? 'pa_rdap' : (mosha <= diteTeReja ? 'pret' : 'vjeter');
          await pool.query(`UPDATE pxse_tr_domenet SET gjendja=$2, data_domainit=$3, gati_pas = CASE WHEN $2='pret' THEN now() + ($4 || ' days')::interval END, perpunuar_at=now() WHERE domaini=$1`,
            [x.domaini, gj, data, String(pritja)]);
          await shto('rdap', 1);
          if (gj === 'pret') await shto('te_reja', 1);
        }
      }
    } catch (e) { console.error('pxse te-rejat RDAP:', e.message); }
    finally { rdapDuke = false; }
  }

  // ---------- 3. Pas pritjes: MX, pastaj te studimi i Importit ----------
  async function importiId() {
    const r = await pool.query("SELECT id FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1", [PXTR_EMRI_IMPORTIT]);
    if (r.rows.length) return r.rows[0].id;
    return (await pool.query("INSERT INTO pxse_importet (emri, gjendja, total) VALUES ($1, 'gati', 0) RETURNING id", [PXTR_EMRI_IMPORTIT])).rows[0].id;
  }
  let kalimDuke = false;
  async function kaloNeStudim() {
    if (kalimDuke || !(await aktiv())) return; kalimDuke = true;
    try {
      const kufiri = nr(process.env.PXSE_TR_STUDIM_DITORE, 300);
      const sot = (await pool.query('SELECT kaluar FROM pxse_tr_dite WHERE dita=$1', [dita()])).rows[0];
      const mbetur = kufiri - (sot ? sot.kaluar : 0);
      if (mbetur <= 0) return;
      const gr = (await pool.query("SELECT domaini, to_char(data_domainit, 'YYYY-MM-DD') AS data FROM pxse_tr_domenet WHERE gjendja='pret' AND gati_pas <= now() ORDER BY gati_pas LIMIT $1", [Math.min(mbetur, 100)])).rows;
      if (!gr.length) return;
      const kalojne = [];
      for (const x of gr) {
        const mx = await pximKaMx(x.domaini);
        if (!mx) { await pool.query("UPDATE pxse_tr_domenet SET gjendja='pa_mx', perpunuar_at=now() WHERE domaini=$1", [x.domaini]); continue; }
        kalojne.push(x);
      }
      if (kalojne.length) {
        const im = await importiId();
        const ins = await pool.query(`INSERT INTO pxse_import_rreshtat (import_id, domaini, url, gjendja, data_domainit, perpunuar_at)
            SELECT $1, d, 'https://' || d || '/', 'bere', NULLIF(dt, '')::date, now() FROM unnest($2::text[], $3::text[]) AS t(d, dt)
            ON CONFLICT (import_id, domaini) DO NOTHING RETURNING domaini`, [im, kalojne.map(x => x.domaini), kalojne.map(x => x.data || '')]);
        await pool.query("UPDATE pxse_importet SET total = total + $2, gjendja = CASE WHEN gjendja='gati' THEN 'duke' ELSE gjendja END, perfunduar_at = CASE WHEN gjendja='gati' THEN NULL ELSE perfunduar_at END WHERE id=$1", [im, ins.rows.length]);
        await shto('kaluar', ins.rows.length);
        if (app.locals.pxseImportiNis) app.locals.pxseImportiNis();
      }
      await pool.query("UPDATE pxse_tr_domenet SET gjendja='kaluar', perpunuar_at=now() WHERE domaini = ANY($1::text[])", [kalojne.map(x => x.domaini)]);
    } catch (e) { console.error('pxse te-rejat studimi:', e.message); }
    finally { kalimDuke = false; }
  }

  // Pastrimi: domainet e hedhura mbahen 60 dite (qe te mos kontrollohen perseri), pastaj fshihen
  async function pastro() {
    await pool.query("DELETE FROM pxse_tr_domenet WHERE gjendja IN ('vjeter','pa_rdap','pa_mx') AND perpunuar_at < now() - interval '60 days'").catch(() => {});
    await pool.query("DELETE FROM pxse_tr_dite WHERE dita < now() - interval '120 days'").catch(() => {});
  }

  setTimeout(() => {
    setInterval(lexoCT, 60 * 1000).unref();
    setInterval(kontrolloRdap, 2 * 60 * 1000).unref();
    setInterval(kaloNeStudim, 10 * 60 * 1000).unref();
    setInterval(pastro, 24 * 3600 * 1000).unref();
  }, 45000).unref();
  app.locals.pxseTeRejat = { lexoCT, kontrolloRdap, kaloNeStudim, pxtrDomenet, pxtrEmratNgaHyrja };

  // ---------- Admin API ----------
  app.get('/api/admin/pxse/te-rejat', iAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const sot = (await pool.query('SELECT * FROM pxse_tr_dite WHERE dita=$1', [dita()])).rows[0] || {};
      const gjithsej = (await pool.query(`SELECT COALESCE(SUM(certifikata),0)::bigint certifikata, COALESCE(SUM(domene),0)::int domene, COALESCE(SUM(rdap),0)::int rdap,
          COALESCE(SUM(te_reja),0)::int te_reja, COALESCE(SUM(kaluar),0)::int kaluar FROM pxse_tr_dite`)).rows[0];
      const gj = Object.fromEntries((await pool.query('SELECT gjendja, COUNT(*)::int n FROM pxse_tr_domenet GROUP BY gjendja')).rows.map(x => [x.gjendja, x.n]));
      const logjetDb = (await pool.query('SELECT url, emri, pozicioni, madhesia, gabimi, perditesuar_at FROM pxse_tr_logjet ORDER BY url')).rows;
      const imR = (await pool.query("SELECT id, gjendja, total, gabimi FROM pxse_importet WHERE emri=$1 ORDER BY id DESC LIMIT 1", [PXTR_EMRI_IMPORTIT])).rows[0] || null;
      let importi = null, teFundit = [];
      if (imR) {
        const t = (await pool.query(`SELECT COUNT(*) FILTER (WHERE studim2 IS NOT NULL)::int studiuar, COUNT(*) FILTER (WHERE statusi='biznes')::int biznese,
            COUNT(*) FILTER (WHERE email IS NOT NULL)::int me_email, COUNT(*) FILTER (WHERE statusi='biznes' AND email IS NOT NULL AND ka_mx AND aktiv IS NOT FALSE)::int gati,
            COUNT(*) FILTER (WHERE statusi='biznes' AND lloji IN ('b2b','both') AND email IS NOT NULL AND ka_mx AND aktiv IS NOT FALSE)::int gati_b2b
          FROM pxse_import_rreshtat WHERE import_id=$1`, [imR.id])).rows[0];
        importi = Object.assign({ id: imR.id, gjendja: imR.gjendja, total: imR.total, gabimi: imR.gabimi }, t);
        teFundit = (await pool.query(`SELECT domaini, emri, kategoria, lloji, shteti, email, email_ofruesi, to_char(data_domainit, 'YYYY-MM-DD') data_domainit, pershkrimi
            FROM pxse_import_rreshtat WHERE import_id=$1 AND statusi='biznes' AND studim2 IS NOT NULL ORDER BY studim2_at DESC NULLS LAST LIMIT 25`, [imR.id])).rows;
      }
      res.json({ ok: true, aktiv: await aktiv(), emri: PXTR_EMRI_IMPORTIT, sot, gjithsej, gjendjet: gj, logjet: logjetDb, importi, te_fundit: teFundit,
        kufijte: { rdap: nr(process.env.PXSE_TR_RDAP_DITORE, 3000), studim: nr(process.env.PXSE_TR_STUDIM_DITORE, 300), dite: nr(process.env.PXSE_TR_DITE, 120), pritja: nr(process.env.PXSE_TR_PRITJA_DITE, 3) } });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/te-rejat/nis', iAdmin, async (req, res) => {
    try { await vendos('aktiv', '1'); lexoCT(); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/admin/pxse/te-rejat/ndalo', iAdmin, async (req, res) => {
    try { await vendos('aktiv', '0'); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
module.exports.pxtrDomenet = pxtrDomenet;
module.exports.pxtrEmratNgaHyrja = pxtrEmratNgaHyrja;
module.exports.pxtrBaza = pxtrBaza;
