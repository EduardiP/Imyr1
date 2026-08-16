// automatik.js — SISTEMI I SHPERNDARJES AUTOMATIKE (per host-et me hosting_mode='automatik')
//
// Ky modul aktivizohet vetem kur host-i ka hosting_mode='automatik'.
// Nese host-i ka hosting_mode='manual', selector.js perdor logjiken e vjeter me barazi_perqindje.
//
// PERGJEGJESIA:
// - Vendos VETEM cilen pishine (Ankand ose Balance) do te marre hapesira aktuale.
// - Nuk zgjedh biznesin fitues — kete e bejne logjika Ankand ose Balance ekzistuese.
// - Menaxhon kufirin global te borxhit ne 10 (i ndryshueshem, i ruajtur ne DB).
//
// LOGJIKAT EKZISTUESE NUK PREKEN:
// - Logjika Ankand (weighted-random mbi peshen AI+profili+ndihma) vazhdon si eshte.
// - Logjika Balance (deficit + AI tie-break) vazhdon si eshte — piket e balances qe llogarit
//   ky modul perdoren VETEM per fazen 3 (perzgjedhja e pishines), jo brenda balances.
//
// FLOWCHART:
//   1. Kontrollo tipin e host-it (a ka reklama Ankand, Balance, ose te dyja aktive)
//   2. Kontrollo kufirin 10 → nese arritur, ridrejto direkt te pishina qe duhet te japi
//   3. Merr kandidatet nga secila pishine, filtruar sipas tipit b2b/b2c/b2b2c
//   4. Nese vetem njera pishine ka kandidate → ajo fiton direkt
//   5. Perndryshe: llogarit peshen Ankand dhe piken perfundimtare Balance
//   6. Merr top 5 nga secila (ekualizuar nese njera ka me pak)
//   7. Llogarit pika perzgjedhjeje per secilin dhe mblidhi ne dy shuma
//   8. Weighted-random mbi shumat → cila pishine fiton
//
// FORMULAT:
//   pikaBalance(deficit)              = 100 * 0.8^(6 - |deficit|)
//   pikaPerfundimtareBalance(AI,def)  = AI ± pikaBalance (min 0)
//   pikaPerzgjedhjeje(x)              = (3/40000)x² − (3/200)x + 7/4

const pesha = require('./pesha');

module.exports = function (pool) {

  // ══════════════════════════════════════════════════════════════════
  // MIGRIMI I TABELES `borxhi_global` (nje rresht i vetem)
  // ══════════════════════════════════════════════════════════════════
  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS borxhi_global (
        id           INTEGER PRIMARY KEY DEFAULT 1,
        borxhi_neto  INTEGER NOT NULL DEFAULT 0,
        kufiri       INTEGER NOT NULL DEFAULT 10,
        updated_at   TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT borxhi_global_nje_rresht CHECK (id = 1)
      )`);
    await pool.query(`INSERT INTO borxhi_global (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
  }
  // KUJDES: `borxhi_neto`:
  //   > 0  → Ankandi i ka borxh Balances (Ankandi ka marre nga hapesirat Balance)
  //   < 0  → Balanca i ka borxh Ankandit (Balanca ka marre nga hapesirat Ankand)
  //   = 0  → ekuiliber

  // ══════════════════════════════════════════════════════════════════
  // FORMULA 1: PIKA BALANCE (bonus/penalty per deficitin)
  // y = 100 * 0.8^(6 - |x|)
  // ══════════════════════════════════════════════════════════════════
  //   deficit  0  → 26.21
  //   deficit  1  → 32.77
  //   deficit  2  → 40.96
  //   deficit  3  → 51.20
  //   deficit  4  → 64.00
  //   deficit  5  → 80.00
  //   deficit  6  → 100.00
  //   deficit 7+  → vazhdon rritjen (125, 156.25, ...)
  function pikaBalance(deficit) {
    return 100 * Math.pow(0.8, 6 - Math.abs(deficit));
  }

  // ══════════════════════════════════════════════════════════════════
  // FORMULA 2: PIKA PERFUNDIMTARE BALANCE (AI ± pikë balance, min 0)
  // ══════════════════════════════════════════════════════════════════
  //   deficit > 0 → biznesi ka dhene me shume → shtohen piket AI
  //   deficit < 0 → biznesi ka marre me shume → zbriten piket AI (min 0)
  //   deficit = 0 → AI mbetet i njejte
  function pikaPerfundimtareBalance(aiSkori, deficit) {
    const pika = pikaBalance(deficit);
    if (deficit > 0) return aiSkori + pika;
    if (deficit < 0) return Math.max(0, aiSkori - pika);
    return aiSkori;
  }

  // ══════════════════════════════════════════════════════════════════
  // FORMULA 3: PIKA E PERZGJEDHJES (universale per Ankand dhe Balance)
  // y = (3/40000)x² − (3/200)x + 7/4
  // ══════════════════════════════════════════════════════════════════
  //   x=100 →  1
  //   x=300 →  4
  //   x=900 → 49
  // Rrit dallimin mes pikeve te medhaja dhe te vogla, por s'i eliminon te voglat
  // plotesisht → askush s'monopolizon.
  function pikaPerzgjedhjeje(x) {
    return (3 / 40000) * x * x - (3 / 200) * x + 7 / 4;
  }

  // ══════════════════════════════════════════════════════════════════
  // BORXHI GLOBAL
  // ══════════════════════════════════════════════════════════════════
  async function merrBorxhin() {
    const r = await pool.query('SELECT borxhi_neto, kufiri FROM borxhi_global WHERE id=1');
    if (!r.rows.length) return { borxhi_neto: 0, kufiri: 10 };
    return r.rows[0];
  }

  // delta: +1 ose -1 (ose numer tjeter nese nevojitet)
  async function ndryshoBorxhin(delta) {
    await pool.query(
      'UPDATE borxhi_global SET borxhi_neto = borxhi_neto + $1, updated_at = now() WHERE id=1',
      [delta]
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // TIPI I HOST-IT (nga llogarite qe ka aktive)
  // Kthe: 'ankand' | 'barazi' | 'te-dyja' | 'asnje'
  // ══════════════════════════════════════════════════════════════════
  async function tipiHostit(hostId) {
    const r = await pool.query(`
      SELECT
        EXISTS(SELECT 1 FROM promovimet WHERE biznes_id=$1 AND aktiv=true
               AND COALESCE(pauzuar,false)=false AND logjika_shperndarjes='ankand') AS ka_ankand,
        EXISTS(SELECT 1 FROM promovimet WHERE biznes_id=$1 AND aktiv=true
               AND COALESCE(pauzuar,false)=false AND logjika_shperndarjes='barazi') AS ka_barazi`,
      [hostId]);
    const ka_ankand = r.rows[0].ka_ankand;
    const ka_barazi = r.rows[0].ka_barazi;
    if (ka_ankand && ka_barazi) return 'te-dyja';
    if (ka_ankand) return 'ankand';
    if (ka_barazi) return 'barazi';
    return 'asnje';
  }

  // ══════════════════════════════════════════════════════════════════
  // KONTROLLI I KUFIRIT 10 (bllokim direkt kur arrihet)
  // Kthe: 'ankand' | 'barazi' nese duhet ridrejtuar; null nese s'ka bllokim
  // ══════════════════════════════════════════════════════════════════
  //   Host 'ankand'  → nese borxhi_neto <= -kufiri: Balanca ka marre 10 nga Ankandi → shko Ankand
  //   Host 'barazi'  → nese borxhi_neto >= +kufiri: Ankandi ka marre 10 nga Balanca → shko Balance
  //   Host 'te-dyja' → kufiri respektohet ne te dyja drejtimet
  //   Host 'asnje'   → nuk aplikohet (host s'ka reklama vet, s'ndikon te borxhi)
  async function kontrolloKufirin(hostTipi) {
    if (hostTipi === 'asnje') return null;
    const b = await merrBorxhin();
    const bn = b.borxhi_neto;
    const k = b.kufiri;
    if (hostTipi === 'ankand'  && bn <= -k) return 'ankand';
    if (hostTipi === 'barazi'  && bn >=  k) return 'barazi';
    if (hostTipi === 'te-dyja') {
      if (bn >=  k) return 'barazi';
      if (bn <= -k) return 'ankand';
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // FILTRI I TIPIT (b2b/b2c/b2b2c) — identik me selector.js
  // ══════════════════════════════════════════════════════════════════
  function tipetPerputhen(rTipi, hTipi) {
    if (rTipi === 'b2b2c' || hTipi === 'b2b2c') return true;
    return rTipi === hTipi;
  }

  // ══════════════════════════════════════════════════════════════════
  // MERR KANDIDATET nga nje pishine specifike, filtruar sipas tipit
  // ══════════════════════════════════════════════════════════════════
  async function merrKandidatet(hostId, hTipi, logjika) {
    const r = await pool.query(
      `SELECT DISTINCT b.id AS biznes_id, b.tipi
       FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
       WHERE p.biznes_id <> $1 AND p.aktiv = true AND COALESCE(p.pauzuar,false) = false
         AND COALESCE(p.logjika_shperndarjes,'ankand') = $2
         AND (p.teksti IS NOT NULL OR p.imazh_url IS NOT NULL OR p.video_url IS NOT NULL OR p.html5_url IS NOT NULL)
         AND EXISTS (SELECT 1 FROM snippetet s WHERE s.biznes_id = b.id
                     AND s.snippet_active = true AND COALESCE(s.pauzuar,false) = false)`,
      [hostId, logjika]);
    return r.rows.filter(k => !(hTipi && k.tipi && !tipetPerputhen(k.tipi, hTipi)));
  }

  // ══════════════════════════════════════════════════════════════════
  // PESHA ANKAND per nje kandidat (AI + profili + ndihma_neto)
  // Identik me llogaritjen ne selector.js — pa ndryshim ne logjike.
  // ══════════════════════════════════════════════════════════════════
  async function pikeProfili(bizId, tipi) {
    const r = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
              COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
       FROM ngjarjet WHERE biznes_id=$1`, [bizId]);
    const shfaqje = r.rows[0].shfaqje, konvertime = r.rows[0].konvertime;
    const rate = pesha.PARAM.RATE[tipi] || pesha.PARAM.RATE.b2c;
    return (shfaqje / rate) + konvertime;
  }

  async function eshteNderTop3(reklamuesId, hostId) {
    const r = await pool.query(
      `SELECT host_id FROM perputhjet
       WHERE reklamues_id=$1 AND skori IS NOT NULL
       ORDER BY skori DESC LIMIT $2`, [reklamuesId, pesha.PARAM.TOP_KOMBINIME]);
    return r.rows.some(x => x.host_id === hostId);
  }

  async function peshaAnkand(kandidatBizId, kandidatTipi, hostId, hTipi) {
    let skorAI = 0;
    try {
      const s = await pool.query(
        'SELECT skori FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2',
        [kandidatBizId, hostId]);
      if (s.rows.length && s.rows[0].skori != null) skorAI = s.rows[0].skori;
    } catch (e) {}
    const pikeProf = await pikeProfili(kandidatBizId, kandidatTipi || hTipi);
    let nderTop3 = false;
    try { nderTop3 = await eshteNderTop3(kandidatBizId, hostId); } catch (e) {}
    const ndihNeto = pesha.ndihmaNeto(skorAI, pikeProf, nderTop3);
    return skorAI + pikeProf + ndihNeto;
  }

  // ══════════════════════════════════════════════════════════════════
  // PIKA PERFUNDIMTARE BALANCE per nje kandidat (AI ± pikë balance)
  // Perdoret VETEM ne fazen 3 (perzgjedhja e pishines). Brenda logjikes
  // Balance (balanca.js), vazhdon te vlejne vetem deficit + AI tie-break.
  // ══════════════════════════════════════════════════════════════════
  async function merrDeficitin(bizId) {
    const r = await pool.query(`
      SELECT
        COALESCE((SELECT COUNT(*) FROM ngjarjet
                  WHERE lloji='view' AND burimi='barazi' AND biznes_id=$1),0)::int AS dhene,
        COALESCE((SELECT COUNT(*) FROM ngjarjet
                  WHERE lloji='view' AND burimi='barazi' AND reklamues_id=$1),0)::int AS marra`,
      [bizId]);
    return r.rows[0].dhene - r.rows[0].marra;
  }

  async function pikaPerfundimtareBalancePerBiznes(bizId, hostId) {
    let skorAI = 0;
    try {
      const s = await pool.query(
        'SELECT skori FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2',
        [bizId, hostId]);
      if (s.rows.length && s.rows[0].skori != null) skorAI = s.rows[0].skori;
    } catch (e) {}
    const deficit = await merrDeficitin(bizId);
    return pikaPerfundimtareBalance(skorAI, deficit);
  }

  // ══════════════════════════════════════════════════════════════════
  // FUNKSIONI KRYESOR: VENDOS PISHINEN (Ankand ose Balance)
  //
  // Thirret nga selector.js kur host-i ka hosting_mode='automatik'.
  // Kthe: 'ankand' | 'barazi' | null (nese s'ka kandidate fare)
  // ══════════════════════════════════════════════════════════════════
  async function vendosLogjiken(hostId, hTipi) {

    // HAPI 1 — Tipi i host-it
    const hostTipi = await tipiHostit(hostId);

    // HAPI 2 — Kontrolli i kufirit 10 (bllokim direkt kur arrihet)
    const bllokim = await kontrolloKufirin(hostTipi);
    if (bllokim) return bllokim;

    // HAPI 3 — Merr kandidatet nga te dyja pishinat
    const kandAnkand = await merrKandidatet(hostId, hTipi, 'ankand');
    const kandBarazi = await merrKandidatet(hostId, hTipi, 'barazi');

    // HAPI 4 — Rastet e thjeshta (vetem njera pishine ka kandidate)
    if (!kandAnkand.length && !kandBarazi.length) return null;
    if (!kandAnkand.length) return 'barazi';
    if (!kandBarazi.length) return 'ankand';

    // HAPI 5 — Llogarit peshen per te dy pishinat
    const peshatAnkand = [];
    for (const k of kandAnkand) {
      const p = await peshaAnkand(k.biznes_id, k.tipi, hostId, hTipi);
      peshatAnkand.push({ biznes_id: k.biznes_id, pesha: p });
    }
    const peshatBarazi = [];
    for (const k of kandBarazi) {
      const p = await pikaPerfundimtareBalancePerBiznes(k.biznes_id, hostId);
      peshatBarazi.push({ biznes_id: k.biznes_id, pesha: p });
    }

    // HAPI 6 — Top 5 nga secila, ekualizuar
    peshatAnkand.sort((a, b) => b.pesha - a.pesha);
    peshatBarazi.sort((a, b) => b.pesha - a.pesha);
    const n = Math.min(5, Math.min(peshatAnkand.length, peshatBarazi.length));
    const topAnkand = peshatAnkand.slice(0, n);
    const topBarazi = peshatBarazi.slice(0, n);

    // HAPI 7 — Pika perzgjedhjeje per secilin (formula universale)
    const totaliAnkand = topAnkand.reduce((s, x) => s + pikaPerzgjedhjeje(x.pesha), 0);
    const totaliBarazi = topBarazi.reduce((s, x) => s + pikaPerzgjedhjeje(x.pesha), 0);
    const shuma = totaliAnkand + totaliBarazi;

    // HAPI 8 — Weighted-random mbi dy shumat
    if (shuma <= 0) return Math.random() < 0.5 ? 'ankand' : 'barazi';
    const rand = Math.random() * shuma;
    return rand < totaliAnkand ? 'ankand' : 'barazi';
  }

  // ══════════════════════════════════════════════════════════════════
  // REGJISTRO EFEKTIN E SHFAQJES TE BORXHI GLOBAL
  //
  // Thirret nga selector.js pas nje shfaqjeje qe erdhi nga automatik.
  //   hostTipi   : 'ankand' | 'barazi' | 'te-dyja' | 'asnje'
  //   fituesTipi : 'ankand' | 'barazi' (pishina qe fitoi)
  // ══════════════════════════════════════════════════════════════════
  //   Host Ankand + Fitues Balance → Balanca "ka marre hua" nga Ankandi
  //     → borxhi_neto -1  (Balanca i detyrohet Ankandit me shume)
  //
  //   Host Balance + Fitues Ankand → Ankandi "ka marre hua" nga Balanca
  //     → borxhi_neto +1  (Ankandi i detyrohet Balances me shume)
  //
  //   Rastet e tjera (natyrore) → asnje ndryshim.
  //   Host 'te-dyja' ose 'asnje' → asnje borxh (asnjera pishine nuk ka "hua")
  async function regjistroShfaqjen(hostTipi, fituesTipi) {
    if (hostTipi === 'ankand' && fituesTipi === 'barazi') {
      await ndryshoBorxhin(-1);
    } else if (hostTipi === 'barazi' && fituesTipi === 'ankand') {
      await ndryshoBorxhin(+1);
    }
    // Rastet e tjera: asnje veprim.
  }

  return {
    init,
    // formulat
    pikaBalance,
    pikaPerfundimtareBalance,
    pikaPerzgjedhjeje,
    // borxhi
    merrBorxhin,
    ndryshoBorxhin,
    // ndihmese (te dobishme per debug/testim)
    tipiHostit,
    kontrolloKufirin,
    merrDeficitin,
    // kryesoret (thirren nga selector.js)
    vendosLogjiken,
    regjistroShfaqjen
  };
};
