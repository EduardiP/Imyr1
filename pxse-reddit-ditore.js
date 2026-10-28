// pxse-reddit-ditore.js (PhronexusAI) — sinjalet e REJA nga Reddit pas login (vetem llogarite; prova falas nuk preket).
// Server.js e therret PAS pxse-sinjalet.js: require('./pxse-reddit-ditore')(app, pool, iAdmin);
//
// Rregullat:
//  - Kerkimi me Serper, per llogari: B2B 1 here ne jave (cdo 7 dite), B2C 2 here ne jave (cdo 3.5 dite). "te-dyja" = B2B.
//    Kerkimi i pare (studimi) numerohet si kerkimi i fundit, keshtu i pari i ri vjen pas intervalit.
//  - Para cdo kerkimi numerohen sinjalet e Google Alerts te KATEGORIVE QE AI I CAKTOI llogarise, qe jane postime Reddit,
//    ardhur ne 7 ditet e fundit. B2B 12 ose me shume / B2C 14 ose me shume => ky kerkim ANULOHET (pa kosto) dhe pritet i radhes.
//  - 2 kerkime Serper: (termi 1) OR (termi 2) site:reddit.com, dhe termat 3-7 me OR site:reddit.com,
//    vetem postimet qe nga kerkimi i fundit i llogarise. Termat jane ata qe AI shkroi te studimi i pare.
//  - Lidhjet qe llogaria i ka marre (ose qe AI i ka refuzuar me pare) nuk vleresohen me. AI vlereson vetem te rejat;
//    40+ i shtohen listes se llogarise me "ardhur_at" => dalin te "New" (2 muaj), pastaj kalojne vete te "History".
// Admin: GET /api/admin/pxse/reddit-ditore (gjendja e cdo llogarie dhe totalet). Numrat ditore te Reddit (kerkime, rezultate,
//   kredite) shtohen te pxse_burimet_ditore, pra dalin te kubi Reddit i admin-it.

const PXRD_DITE_B2B = 7;          // 1 here ne jave
const PXRD_DITE_B2C = 3.5;        // 2 here ne jave
const PXRD_KUFI_ALERTS_B2B = 12;  // sinjale Reddit nga Google Alerts (7 dite) qe e anulojne kerkimin
const PXRD_KUFI_ALERTS_B2C = 14;
const PXRD_PARE_MAKS = 3000;      // sa lidhje te refuzuara mbahen mend per llogari (qe te mos vleresohen perseri)
const PXRD_PER_RRETH = 20;        // sa llogari ne nje kontroll (cdo 30 minuta)

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_reddit_ditore (
      biznes_id INT PRIMARY KEY,
      lloji TEXT,
      kerkuar_at TIMESTAMPTZ,            -- kerkimi i fundit (ose studimi i pare)
      radha_at TIMESTAMPTZ,              -- kur eshte kerkimi i radhes
      bere INT NOT NULL DEFAULT 0,       -- kerkime te bera
      anuluar INT NOT NULL DEFAULT 0,    -- kerkime te anuluara nga Google Alerts
      te_reja INT NOT NULL DEFAULT 0,    -- sinjale te reja (40+) te shtuara gjithsej
      kredite INT NOT NULL DEFAULT 0,
      fundit TEXT,                       -- 'bere' | 'anuluar' | 'gabim'
      gabimi TEXT,
      perditesuar TIMESTAMPTZ DEFAULT now()
    )`);
  })().catch(e => console.error('pxse-reddit-ditore migrim:', e.message));

  const intervali = lloji => (lloji === 'b2c' ? PXRD_DITE_B2C : PXRD_DITE_B2B) * 86400000;
  const kufiri = lloji => lloji === 'b2c' ? PXRD_KUFI_ALERTS_B2C : PXRD_KUFI_ALERTS_B2B;

  // Sa sinjale Reddit ka sjelle Google Alerts ne 7 ditet e fundit per kategorite e kesaj llogarie
  async function pxrdNgaAlerts(kategorite) {
    if (!kategorite.length) return 0;
    try {
      const r = await pool.query(`SELECT COUNT(*)::int n FROM pxse_alertet_rezultate WHERE kategoria = ANY($1::text[])
        AND url ~* '^https?://([a-z0-9-]+\\.)?reddit\\.com/' AND marre_at > now() - interval '7 days'`, [kategorite]);
      return r.rows[0].n;
    } catch (e) { return 0; }
  }
  function pxrdRegjistroBurimin(lloji, kerkime, rezultate, kredite) {
    pool.query(`INSERT INTO pxse_burimet_ditore (dita, burimi, tipi, kategoria, kerkime, rezultate, kredite) VALUES ((now() AT TIME ZONE 'Europe/Berlin')::date, 'reddit', $1, '', $2, $3, $4)
      ON CONFLICT (dita, burimi, tipi, kategoria) DO UPDATE SET kerkime = pxse_burimet_ditore.kerkime + EXCLUDED.kerkime,
        rezultate = pxse_burimet_ditore.rezultate + EXCLUDED.rezultate, kredite = pxse_burimet_ditore.kredite + EXCLUDED.kredite`,
      [lloji, kerkime, rezultate, kredite]).catch(() => {});
  }

  // Nje llogari: anulim ose kerkim + vleresim + shtim te lista
  async function pxrdLlogaria(rr, gj) {
    const R = app.locals.pxseSinjalet && app.locals.pxseSinjalet.reddit;
    const t = rr.te_dhenat || {}, lloji = t.lloji === 'b2c' ? 'b2c' : 'b2b', tani = Date.now();
    const kategorite = Array.isArray(t.alertet_kategorite) ? t.alertet_kategorite : [];
    const nga = gj.kerkuar_at ? new Date(gj.kerkuar_at).getTime() : new Date(rr.krijuar_at).getTime();
    // Google Alerts e ka plotesuar: ky kerkim anulohet, pritet i radhes
    const nA = await pxrdNgaAlerts(kategorite);
    if (nA >= kufiri(lloji)) {
      await pool.query(`UPDATE pxse_reddit_ditore SET lloji=$2, radha_at=$3, anuluar=anuluar+1, fundit='anuluar', gabimi=NULL, perditesuar=now() WHERE biznes_id=$1`,
        [rr.biznes_id, lloji, new Date(tani + intervali(lloji))]);
      pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, biznes_id, tipi, burimi, n) VALUES ($1,$2,$3,$4,$5,$6)', ['reddit_anuluar', 'sinjale', rr.biznes_id, lloji, 'reddit', nA]).catch(() => {});
      return;
    }
    if (!R || !R.aktiv()) return; // pa SERPER_API_KEY / OPENAI_API_KEY: provohet ne kontrollin tjeter
    try {
      const k = await R.kerko(t.termat || [], nga);
      // Pa perseritje: as ato qe llogaria i ka, as ato qe AI i refuzoi me pare
      const kaURL = new Set((t.rezultatet || []).map(x => x.url).concat(Array.isArray(t.reddit_pare) ? t.reddit_pare : []));
      const reja = k.lista.filter(x => !kaURL.has(x.url));
      const kaluan = reja.length ? await R.vlereso(reja, t.pershkrimi, lloji !== 'b2c') : [];
      const ardhur = new Date().toISOString();
      const shto = kaluan.map(x => Object.assign(x, { ardhur_at: ardhur }));
      const refuzuar = reja.filter(x => !shto.some(y => y.url === x.url)).map(x => x.url);
      // Shtimi ne te njejten transaksion me leximin, qe te mos humbase asnje status/pergjigje e ndryshuar nga klienti ndermjet
      const kl = await pool.connect();
      try {
        await kl.query('BEGIN');
        const a = await kl.query('SELECT te_dhenat FROM pxse_prova_rezultate WHERE id=$1 FOR UPDATE', [rr.id]);
        const td = (a.rows[0] && a.rows[0].te_dhenat) || {};
        const ekz = new Set((td.rezultatet || []).map(x => x.url));
        const vertet = shto.filter(x => !ekz.has(x.url));
        td.rezultatet = vertet.concat(td.rezultatet || []);
        td.burimet = Object.assign({}, td.burimet || {}); td.burimet.reddit = (td.burimet.reddit || 0) + reja.length;
        td.numri = (td.numri || 0) + reja.length;
        td.reddit_pare = (Array.isArray(td.reddit_pare) ? td.reddit_pare : []).concat(refuzuar).slice(-PXRD_PARE_MAKS);
        await kl.query('UPDATE pxse_prova_rezultate SET te_dhenat=$2 WHERE id=$1', [rr.id, JSON.stringify(td)]);
        await kl.query(`UPDATE pxse_reddit_ditore SET lloji=$2, kerkuar_at=now(), radha_at=$3, bere=bere+1, te_reja=te_reja+$4, kredite=kredite+$5,
            fundit='bere', gabimi=NULL, perditesuar=now() WHERE biznes_id=$1`, [rr.biznes_id, lloji, new Date(tani + intervali(lloji)), vertet.length, k.kredite]);
        await kl.query('COMMIT');
        pxrdRegjistroBurimin(lloji, k.kerkime, reja.length, k.kredite);
        if (vertet.length) pool.query('INSERT INTO pxse_ngjarjet (lloji, nga, biznes_id, tipi, burimi, n) VALUES ($1,$2,$3,$4,$5,$6)', ['sinjale_te_reja', 'sinjale', rr.biznes_id, lloji, 'reddit', vertet.length]).catch(() => {});
      } catch (e) { await kl.query('ROLLBACK').catch(() => {}); throw e; } finally { kl.release(); }
    } catch (e) {
      // Gabim (Serper/AI): provohet perseri pas 6 oresh, pa humbur asgje
      await pool.query(`UPDATE pxse_reddit_ditore SET radha_at=$2, fundit='gabim', gabimi=$3, perditesuar=now() WHERE biznes_id=$1`,
        [rr.biznes_id, new Date(Date.now() + 6 * 3600000), String((e && e.message) || e).slice(0, 300)]).catch(() => {});
      console.error('pxse reddit ditore (' + rr.biznes_id + '):', e && e.message);
    }
  }

  let pxrdDukePunuar = false;
  async function pxrdKontrollo() {
    if (pxrdDukePunuar) return;
    pxrdDukePunuar = true;
    try {
      // Lista e sinjaleve e cdo llogarie (rreshti i fundit), me termat e studimit te pare
      const lista = (await pool.query(`SELECT DISTINCT ON (biznes_id) id, biznes_id, te_dhenat, krijuar_at FROM pxse_prova_rezultate
        WHERE biznes_id IS NOT NULL AND sherbimi='sinjale' ORDER BY biznes_id, id DESC`)).rows;
      const gjendjet = {};
      (await pool.query('SELECT * FROM pxse_reddit_ditore')).rows.forEach(x => { gjendjet[x.biznes_id] = x; });
      let n = 0;
      for (const rr of lista) {
        const t = rr.te_dhenat || {}; if (!Array.isArray(t.termat) || !t.termat.length) continue;
        const lloji = t.lloji === 'b2c' ? 'b2c' : 'b2b';
        let gj = gjendjet[rr.biznes_id];
        if (!gj) {
          // Herën e pare: studimi i pare numerohet si kerkimi i fundit
          const baza = new Date(rr.krijuar_at).getTime();
          await pool.query(`INSERT INTO pxse_reddit_ditore (biznes_id, lloji, kerkuar_at, radha_at) VALUES ($1,$2,$3,$4) ON CONFLICT (biznes_id) DO NOTHING`,
            [rr.biznes_id, lloji, new Date(baza), new Date(baza + intervali(lloji))]);
          gj = { biznes_id: rr.biznes_id, kerkuar_at: new Date(baza), radha_at: new Date(baza + intervali(lloji)) };
        }
        if (new Date(gj.radha_at).getTime() > Date.now()) continue;
        await pxrdLlogaria(rr, gj);
        if (++n >= PXRD_PER_RRETH) break; // te tjerat ne kontrollin tjeter
      }
    } catch (e) { console.error('pxse reddit ditore:', e.message); }
    pxrdDukePunuar = false;
  }
  setTimeout(pxrdKontrollo, 2 * 60000).unref();
  setInterval(pxrdKontrollo, 30 * 60000).unref();

  // ---------- Admin ----------
  app.get('/api/admin/pxse/reddit-ditore', iAdmin, async (req, res) => {
    try {
      const r = await pool.query(`SELECT d.*, b.emri FROM pxse_reddit_ditore d LEFT JOIN bizneset b ON b.id = d.biznes_id ORDER BY d.radha_at`);
      const tot = r.rows.reduce((a, x) => ({ bere: a.bere + x.bere, anuluar: a.anuluar + x.anuluar, te_reja: a.te_reja + x.te_reja, kredite: a.kredite + x.kredite }), { bere: 0, anuluar: 0, te_reja: 0, kredite: 0 });
      res.json({ ok: true, totalet: tot, rregullat: { b2b: { dite: PXRD_DITE_B2B, kufiAlerts: PXRD_KUFI_ALERTS_B2B }, b2c: { dite: PXRD_DITE_B2C, kufiAlerts: PXRD_KUFI_ALERTS_B2C } }, llogarite: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Per testim: kontroll menjehere
  app.post('/api/admin/pxse/reddit-ditore/kontrollo', iAdmin, async (req, res) => { await pxrdKontrollo(); res.json({ ok: true }); });
};
