// pxse-burimet-reja.js (PhronexusAI) — postimet e REJA nga Hacker News, Stack Exchange dhe Indie Hackers pas login.
// Tani eshte vetem MATJE: postimet kalojne nga filtri i lire (pxse-vektoret.js) dhe ruhen per admin-in;
// asgje nuk shkon te AI-ja nano dhe asgje nuk i shtohet sinjaleve te klientit.
// Server.js e therret PAS pxse-vektoret.js: require('./pxse-burimet-reja')(app, pool, iAdmin);
//
// Rregullat:
//  - Hacker News: cdo 2 ore, TE GJITHA postimet e reja (Ask HN + komente) qe nga kontrolli i fundit, NJE here per te gjitha
//    llogarite; pastaj filtri i lire per secilen llogari. Falas.
//  - Stack Exchange: 1 here ne dite (pas ores 07:00, ora e Berlinit), per llogari: 7 termat ne seksionet qe AI zgjodhi
//    (1-3; kur s'ka, lista baze), vetem pyetjet e reja qe nga kontrolli i fundit. Falas (STACKEXCHANGE_KEY rrit kuoten).
//  - Indie Hackers: 1 here ne dite, vetem llogarite B2B, 1 kerkim Serper: (termi 1) OR (termi 2), nga kontrolli i fundit. 1 kredit.
//  - Vetem llogarite me email te PXSE_SINJALET_VETEM (pxse-vektoret.js). Pa variabel: nuk kerkohet asgje.
// Admin: GET /api/admin/pxse/burimet-reja (gjendja), POST /api/admin/pxse/burimet-reja/kontrollo {burimi:'hn'|'se'|'ih'} (menjehere).

const PXBR_HN_ORE = 2;
const PXBR_ORA_DITORE = 7;        // ora (Berlin) pas se ciles behen kerkimet ditore
const PXBR_HN_MAKS = 6000;        // kufi sigurie per nje kontroll te HN

function pxbrDitaBerlin(t) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t)); }
function pxbrOraBerlin(t) { return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(t)), 10); }

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_burimet_reja (
      celesi TEXT PRIMARY KEY,           -- 'hn' | 'se:<biznes_id>' | 'ih:<biznes_id>'
      koha TIMESTAMPTZ,                  -- deri kur u kerkua (kontrolli tjeter nis nga kjo kohe)
      bere INT NOT NULL DEFAULT 0,
      postime INT NOT NULL DEFAULT 0,    -- postime te marra gjithsej
      kredite INT NOT NULL DEFAULT 0,
      fundit TEXT,                       -- 'bere' | 'gabim'
      gabimi TEXT,
      perditesuar TIMESTAMPTZ DEFAULT now()
    )`);
  })().catch(e => console.error('pxse-burimet-reja migrim:', e.message));

  const pxbrGjendja = async celesi => (await pool.query('SELECT * FROM pxse_burimet_reja WHERE celesi=$1', [celesi])).rows[0] || null;
  const pxbrRuaj = (celesi, koha, postime, kredite) => pool.query(`INSERT INTO pxse_burimet_reja (celesi, koha, bere, postime, kredite, fundit, gabimi, perditesuar)
      VALUES ($1,$2,1,$3,$4,'bere',NULL,now()) ON CONFLICT (celesi) DO UPDATE SET koha=EXCLUDED.koha, bere=pxse_burimet_reja.bere+1,
      postime=pxse_burimet_reja.postime+EXCLUDED.postime, kredite=pxse_burimet_reja.kredite+EXCLUDED.kredite, fundit='bere', gabimi=NULL, perditesuar=now()`,
    [celesi, koha, postime, kredite]);
  const pxbrGabim = (celesi, e) => {
    console.error('pxse burimet e reja (' + celesi + '):', e && e.message);
    return pool.query(`INSERT INTO pxse_burimet_reja (celesi, fundit, gabimi, perditesuar) VALUES ($1,'gabim',$2,now())
      ON CONFLICT (celesi) DO UPDATE SET fundit='gabim', gabimi=EXCLUDED.gabimi, perditesuar=now()`, [celesi, String((e && e.message) || e).slice(0, 300)]).catch(() => {});
  };
  const pxbrMjetet = () => {
    const S = app.locals.pxseSinjalet, V = app.locals.pxseVektoret;
    return S && S.burimet && V && V.aktiv() ? { B: S.burimet, V } : null;
  };

  // ---------- Hacker News (cdo 2 ore, nje here per te gjitha llogarite) ----------
  async function pxbrHN(detyrim) {
    const m = pxbrMjetet(); if (!m) return;
    const gj = await pxbrGjendja('hn'), tani = Date.now();
    if (!detyrim && gj && gj.koha && tani - new Date(gj.koha).getTime() < PXBR_HN_ORE * 3600000) return;
    const llogarite = await m.V.llogarite(); if (!llogarite.length) return;
    const nga = gj && gj.koha ? new Date(gj.koha).getTime() : tani - PXBR_HN_ORE * 3600000;
    try {
      const lista = await m.B.hn(Math.floor(nga / 1000), PXBR_HN_MAKS);
      await m.V.regjistro(llogarite, 'hn', lista, null);
      await pxbrRuaj('hn', new Date(tani), lista.length, 0);
    } catch (e) { await pxbrGabim('hn', e); }
  }

  // ---------- Stack Exchange dhe Indie Hackers (1 here ne dite, per llogari) ----------
  const pxbrDuhetSot = gj => !gj || !gj.koha || pxbrDitaBerlin(gj.koha) < pxbrDitaBerlin(Date.now());
  async function pxbrDitore(burimi, detyrim) {
    const m = pxbrMjetet(); if (!m) return;
    if (!detyrim && pxbrOraBerlin(Date.now()) < PXBR_ORA_DITORE) return;
    const llogarite = await m.V.llogarite();
    for (const ll of llogarite) {
      const td = ll.te_dhenat || {}, b2b = td.lloji !== 'b2c', celesi = burimi + ':' + ll.biznes_id;
      if (burimi === 'ih' && !b2b) continue;
      const gj = await pxbrGjendja(celesi);
      if (!detyrim && !pxbrDuhetSot(gj)) continue;
      const tani = Date.now(), nga = gj && gj.koha ? new Date(gj.koha).getTime() : tani - 86400000;
      try {
        let lista = [], kredite = 0;
        if (burimi === 'se') {
          let seksionet = Array.isArray(td.se_faqet) ? td.se_faqet.slice(0, 3) : [];
          if (!seksionet.length) seksionet = await m.B.seksionetBaze(b2b);
          const termat = (td.termat || []).slice(0, 7), pare = new Set(); let ok = 0, gabimi = null;
          for (const s of seksionet) for (const t of termat) {
            try { (await m.B.se(t, s, Math.floor(nga / 1000))).forEach(x => { if (!pare.has(x.url)) { pare.add(x.url); lista.push(x); } }); ok++; }
            catch (e) { gabimi = e; }
          }
          if (!ok && gabimi) throw gabimi;
        } else {
          const k = await m.B.ih(td.termat || [], nga); lista = k.lista; kredite = k.kredite;
        }
        await m.V.regjistro([ll], burimi, lista, null);
        await pxbrRuaj(celesi, new Date(tani), lista.length, kredite);
      } catch (e) { await pxbrGabim(celesi, e); }
    }
  }

  let pxbrDukePunuar = false;
  async function pxbrKontrollo(vetem) {
    if (pxbrDukePunuar) return false;
    pxbrDukePunuar = true;
    try {
      if (!vetem || vetem === 'hn') await pxbrHN(!!vetem);
      if (!vetem || vetem === 'se') await pxbrDitore('se', !!vetem);
      if (!vetem || vetem === 'ih') await pxbrDitore('ih', !!vetem);
    } catch (e) { console.error('pxse burimet e reja:', e.message); }
    pxbrDukePunuar = false;
    return true;
  }
  setTimeout(() => pxbrKontrollo(), 3 * 60000).unref();
  setInterval(() => pxbrKontrollo(), 10 * 60000).unref();

  // ---------- Admin ----------
  app.get('/api/admin/pxse/burimet-reja', iAdmin, async (req, res) => {
    try { res.json({ ok: true, gjendjet: (await pool.query('SELECT * FROM pxse_burimet_reja ORDER BY celesi')).rows }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Kontroll menjehere (edhe me GET, qe te hapet nga shfletuesi: ...?burimi=hn)
  const pxbrMenjehere = async (req, res) => {
    const b = String((req.body || {}).burimi || req.query.burimi || '');
    if (!['hn', 'se', 'ih'].includes(b)) return res.status(400).json({ error: "burimi duhet te jete 'hn', 'se' ose 'ih'." });
    const u = await pxbrKontrollo(b);
    res.json({ ok: true, nisur: u, mesazh: u ? 'U krye.' : 'Nje kontroll eshte duke punuar; provo pas pak.' });
  };
  app.post('/api/admin/pxse/burimet-reja/kontrollo', iAdmin, pxbrMenjehere);
  app.get('/api/admin/pxse/burimet-reja/kontrollo', iAdmin, pxbrMenjehere);
};
