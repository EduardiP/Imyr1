// balanca.js — Logjika e shperndarjes BALANCE + regjistrimi i vendimeve per analitike.
//
// ═══════════════════════════════════════════════════════════════════════════
// RREGULLI I RI (peshe + probabilitet — NUK eshte me fitore absolute e deficitit)
// ═══════════════════════════════════════════════════════════════════════════
//
// 1) FILTRI I TIPIT: ky modul PRANON kandidate te te gjitha tipeve (b2b, b2c,
//    b2b2c) pa filtrim paraprak — ndryshe nga Ankandi. Filtrimi i vetem qe
//    ndodh ketu eshte "PERJASHTIMI I KONKURRENTEVE" (shih hapin 2).
//
// 2) PERJASHTIMI I KONKURRENTEVE: nje kandidat perjashtohet plotesisht nga
//    gara nese PLOTESON TE DYJA keto kushte njekohesisht:
//      a) AI (reklamues→host) === 0
//      b) eshte "e njejta kategori" sipas rregullit ekzistues tipetPerputhen
//         (b2b me b2b, b2c me b2c, ose njeri prej tyre eshte b2b2c)
//    Nese AI=0 por kategorite jane te ndryshme (b2b me b2c, pa b2b2c) →
//    NUK perjashtohet, konsiderohet thjesht nje AI=0 normal (jo konkurrent).
//
// 3) PIKA E DEFICITIT: per secilin kandidat qe mbijetoi filtrin, llogaritet
//    nje "pike deficiti" qe i shtohet ose i zbritet pikes AI, sipas shenjes
//    se deficitit (dhene - marre, burimi='barazi'):
//      - deficit = 0        → pika mbetet thjesht AI (pa ndryshim)
//      - deficit < 0 (ka marre me shume) → FORMULA A (shtohet te AI)
//          P(x) = 16.9525 * e^(-0.196794*x) - 5.6395   (x = deficiti, negativ)
//          x=-1→15, x=-2→19.49, x=-6→49.57, x=-18→580 ... (rritet pa kufi)
//      - deficit > 0 (ka dhene me shume) → FORMULA B (zbritet nga AI, min 0)
//          P(x) = -(1529/1938)x² + (79/38)x - (6095/969)  (x = deficiti, pozitiv)
//          x=1→-5, x=5→-15.62, x=30→-653.98 ... (zbritje qe rritet pa kufi)
//
// 4) PIKA PERFUNDIMTARE = max(0, AI + pikaDeficitit(deficit))
//
// 5) FITUESI: weighted-random (probabilitet) mbi shumen e pikeve perfundimtare
//    te te gjithe kandidateve qe mbijetuan filtrin — JO me fitore absolute.
//    Kush ka pike me te larta ka shanse me te medha, por askush s'eshte i
//    garantuar. (Kjo eshte nje perzgjedhje e VETME, e izoluar brenda ketij
//    moduli — s'ka lidhje me perzgjedhjet e tjera me probabilitet ne sistem:
//    as me weighted-random-in e Ankandit (selector.js), as me perzgjedhjen e
//    reklames brenda biznesit fitues (zgjedhNgaLista), as me perzgjedhjen e
//    pishines Ankand/Balance (automatik.js, Faza 3.)
//
// REGJISTRIMI (i paprekur strukturalisht):
// - Cdo vendim regjistrohet te tabela `balancet` me nje `vendim_id` unik.
// - Rast "nje kandidat i vetem (pas filtrit)" → nje rresht, me_barazim=false.
// - Rast "disa kandidate ne gare" → nje rresht per secilin, me_barazim=true,
//   fitoi=true vetem per fituesin e zgjedhur me probabilitet.
//   (Emri "me_barazim" mbetet per pajtueshmeri me admin panel-in ekzistues —
//   tani do te thote "kishte gare/konkurrence", jo domosdoshmerisht "barazim
//   deficiti" si me pare.)
//
// THIRRJET (te njejta si me pare — pa ndryshim ne firme):
//   const balanca = require('./balanca')(pool);
//   await balanca.init();
//   balanca.zgjidhFituesinBalance([id1, id2, ...], hostId, snippetId) → ID fituese

module.exports = function (pool) {

  // Migrimi i tabelave — thirret nje here nga server.js (i paprekur)
  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS balancet (
        id SERIAL PRIMARY KEY,
        vendim_id   BIGINT NOT NULL,
        host_id     INTEGER NOT NULL,
        reklamues_id INTEGER NOT NULL,
        deficit     INTEGER,
        ai_skori    NUMERIC,
        fitoi       BOOLEAN DEFAULT false,
        me_barazim  BOOLEAN DEFAULT false,
        snippet_id  INTEGER,
        created_at  TIMESTAMPTZ DEFAULT now()
      )`);
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS balancet_vendim_seq`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_balancet_reklamues ON balancet(reklamues_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_balancet_vendim ON balancet(vendim_id)`);
  }

  // ══════════════════════════════════════════════════════════════════
  // FORMULAT E PIKES SE DEFICITIT
  // ══════════════════════════════════════════════════════════════════

  // FORMULA A — deficit negativ (biznesi ka marre me shume se ka dhene,
  // meriton bonus per t'u balancuar). x = deficiti (numer negativ, p.sh. -3).
  //   x=-1 → 15.00   x=-6  → 49.57   x=-12 → 174.18   x=-18 → 580.00
  // Rritet pa kufi ndersa deficiti bëhet me negativ.
  function pikaNegative(x) {
    return 16.9525 * Math.exp(-0.196794 * x) - 5.6395;
  }

  // FORMULA B — deficit pozitiv (biznesi ka dhene me shume se ka marre,
  // "eshte ne rregull", duhet te japi ende, jo te marri). x = deficiti (pozitiv).
  // Rezultati eshte NEGATIV (eshte zbritje) — mbledhet direkt me AI.
  //   x=1 → -5.00   x=5 → -15.62   x=15 → -152.62   x=30 → -653.98
  // Zbritja rritet pa kufi; floor-i prej 0 aplikohet me vone mbi shumen AI+P(x).
  function pikaPozitive(x) {
    return -(1529 / 1938) * x * x + (79 / 38) * x - (6095 / 969);
  }

  // Pika e deficitit — zgjedh formulen e duhur sipas shenjes; 0 nese deficit=0.
  function pikaDeficitit(deficit) {
    if (deficit === 0) return 0;
    if (deficit < 0) return pikaNegative(deficit);
    return pikaPozitive(deficit);
  }

  // ══════════════════════════════════════════════════════════════════
  // FILTRI I "KONKURRENTIT" — identik konceptualisht me tipetPerputhen
  // (selector.js / pesha.js): b2b2c konsiderohet "e njejta kategori" me
  // gjithcka; perndryshe duhet perputhje e sakte b2b=b2b ose b2c=b2c.
  // ══════════════════════════════════════════════════════════════════
  function eshteENjejtaKategori(tipiKandidat, tipiHost) {
    if (!tipiKandidat || !tipiHost) return false;
    if (tipiKandidat === 'b2b2c' || tipiHost === 'b2b2c') return true;
    return tipiKandidat === tipiHost;
  }

  // Deficitet (dhene - marre, burimi='barazi') per nje liste bizneshesh (i paprekur)
  async function merrDeficitet(kandidatIds) {
    if (!kandidatIds || !kandidatIds.length) return {};
    const r = await pool.query(`
      SELECT b.id,
        COALESCE(dhene.n,0)::int AS dhene,
        COALESCE(marra.n,0)::int AS marra
      FROM bizneset b
      LEFT JOIN (
        SELECT biznes_id, COUNT(*)::int AS n FROM ngjarjet
        WHERE lloji='view' AND burimi='barazi' AND biznes_id = ANY($1::int[])
        GROUP BY biznes_id
      ) dhene ON dhene.biznes_id = b.id
      LEFT JOIN (
        SELECT reklamues_id, COUNT(*)::int AS n FROM ngjarjet
        WHERE lloji='view' AND burimi='barazi' AND reklamues_id = ANY($1::int[])
        GROUP BY reklamues_id
      ) marra ON marra.reklamues_id = b.id
      WHERE b.id = ANY($1::int[])`, [kandidatIds]);
    const rez = {};
    r.rows.forEach(x => { rez[x.id] = { dhene: x.dhene, marra: x.marra, deficit: x.dhene - x.marra }; });
    return rez;
  }

  // Piket AI reklamues→host per nje liste reklamuesish kundrejt te njejtit host. (i paprekur)
  async function merrPiketAI(kandidatIds, hostId) {
    if (!kandidatIds || !kandidatIds.length || !hostId) return {};
    const r = await pool.query(`
      SELECT reklamues_id, skori FROM perputhjet
      WHERE host_id = $1 AND reklamues_id = ANY($2::int[]) AND skori IS NOT NULL`,
      [hostId, kandidatIds]);
    const rez = {};
    kandidatIds.forEach(id => { rez[id] = 0; }); // parazgjedhje 0 nese s'ka skor
    r.rows.forEach(x => { rez[x.reklamues_id] = x.skori; });
    return rez;
  }

  // Tipet (b2b/b2c/b2b2c) per nje liste bizneshesh + host, ne nje query te vetem.
  async function merrTipet(idListe) {
    if (!idListe || !idListe.length) return {};
    const r = await pool.query(
      `SELECT id, tipi FROM bizneset WHERE id = ANY($1::int[])`, [idListe]);
    const rez = {};
    r.rows.forEach(x => { rez[x.id] = x.tipi; });
    return rez;
  }

  // Regjistron nje vendim ne tabelen `balancet` (i paprekur strukturalisht)
  async function regjistroVendim(hostId, snippetId, kandidatet, fituesId, meBarazim, deficitet, piketAI) {
    try {
      const vRes = await pool.query("SELECT nextval('balancet_vendim_seq') AS v");
      const vendimId = vRes.rows[0].v;
      for (const id of kandidatet) {
        const deficit = deficitet[id] ? deficitet[id].deficit : 0;
        const aiSkori = (piketAI && piketAI[id] != null) ? piketAI[id] : null;
        await pool.query(
          `INSERT INTO balancet (vendim_id, host_id, reklamues_id, deficit, ai_skori, fitoi, me_barazim, snippet_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [vendimId, hostId, id, deficit, aiSkori, id === fituesId, meBarazim, snippetId || null]);
      }
    } catch (e) { /* mos e ndal vendimin nese regjistrimi deshton */ }
  }

  // ══════════════════════════════════════════════════════════════════
  // PERZGJEDHJE ME PROBABILITET — E IZOLUAR BRENDA KETIJ MODULI.
  // Emer i qarte per te mos u ngaterruar me perzgjedhjet e tjera me
  // probabilitet qe ekzistojne diku tjeter ne sistem (Ankand, Automatik,
  // zgjedhNgaLista). Kjo funksionon VETEM mbi pikatFund te ketij vendimi.
  // ══════════════════════════════════════════════════════════════════
  function perzgjedhjaMeProbabilitetBalance(kandidatIds, pikatFund) {
    const shuma = kandidatIds.reduce((s, id) => s + pikatFund[id], 0);
    if (shuma <= 0) {
      // Te gjithe me 0 pike — zgjidh rastesisht ne menyre te barabarte
      return kandidatIds[Math.floor(Math.random() * kandidatIds.length)];
    }
    let rastesor = Math.random() * shuma;
    for (const id of kandidatIds) {
      rastesor -= pikatFund[id];
      if (rastesor <= 0) return id;
    }
    return kandidatIds[kandidatIds.length - 1]; // siguri per gabime rrumbullakimi
  }

  // ══════════════════════════════════════════════════════════════════
  // FUNKSIONI KRYESOR
  // ══════════════════════════════════════════════════════════════════
  async function zgjidhFituesinBalance(kandidatIds, hostId, snippetId) {
    if (!kandidatIds || !kandidatIds.length) return null;

    // HAPI 0 — Merr AI dhe tipet (per host + te gjithe kandidatet) njeheresh
    const piketAI = await merrPiketAI(kandidatIds, hostId);
    const tipet = await merrTipet([...kandidatIds, hostId]);
    const hostTipi = tipet[hostId];

    // HAPI 1 — Perjashto konkurrentet: AI=0 DHE e njejta kategori me host-in
    const mbetur = kandidatIds.filter(id => {
      const ai = piketAI[id] || 0;
      if (ai === 0 && eshteENjejtaKategori(tipet[id], hostTipi)) return false;
      return true;
    });
    if (!mbetur.length) return null;

    // HAPI 2 — Nje kandidat i vetem mbetur — fiton menjehere, pa gare
    if (mbetur.length === 1) {
      const deficitet = await merrDeficitet(mbetur);
      regjistroVendim(hostId, snippetId, mbetur, mbetur[0], false, deficitet, piketAI).catch(() => {});
      return mbetur[0];
    }

    // HAPI 3 — Llogarit piken perfundimtare (AI + pike deficiti, min 0) per secilin
    const deficitet = await merrDeficitet(mbetur);
    const pikatFund = {};
    mbetur.forEach(id => {
      const ai = piketAI[id] || 0;
      const deficit = deficitet[id] ? deficitet[id].deficit : 0;
      pikatFund[id] = Math.max(0, ai + pikaDeficitit(deficit));
    });

    // HAPI 4 — Perzgjedhje me probabilitet (e izoluar, shih funksionin lart)
    const fitues = perzgjedhjaMeProbabilitetBalance(mbetur, pikatFund);

    // Regjistrim: te gjithe kandidatet qe hyne ne gare (pas filtrit), me fituesin e shenjuar
    regjistroVendim(hostId, snippetId, mbetur, fitues, true, deficitet, piketAI).catch(() => {});
    return fitues;
  }

  return {
    init,
    zgjidhFituesinBalance,
    merrDeficitet,
    merrPiketAI,
    // te ekspozuara per testim/debug te formulave, jo per perdorim jashte modulit
    pikaNegative,
    pikaPozitive,
    pikaDeficitit,
    eshteENjejtaKategori
  };
};
