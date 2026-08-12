// balanca.js — Logjika e shperndarjes BALANCE (jo Ankand): zgjedh CILIT BIZNES i shkon
// shfaqja e ardhshme, mes disa kandidatesh te pershtatshem per te njejtin snippet/host.
//
// RREGULLI (siç u percaktua):
// 1) Fiton biznesi me DEFICITIN me te madh — dhene (burimi='barazi') minus marre (burimi='barazi').
//    Deficit pozitiv = ka dhene me shume se ka marre = "i eshte borxh" nga rrjeti.
// 2) Barazim (disa kandidate me te njejtin deficit maksimal):
//    - Nese ka te dhena historike (30 dite) te "dhenies" per te pakten njerin prej tyre,
//      fiton ai me historikun me te larte te dhenies ne ate periudhe.
//    - Nese s'ka fare te dhena historike per asnjerin, zgjidhet RASTESISHT mes te barabarteve.
//
// Server.js e therret: const balanca = require('./balanca')(pool);
// balanca.zgjidhFituesinBalance([id1, id2, id3, ...]) → kthen ID-ne fituese (ose null).
//
// SHENIM: ky modul eshte VETEM zgjedhja e biznesit fitues (niveli i pare, njesoj si ankandi
// kryesor). Niveli i dyte (cila reklame konkrete e biznesit fitues shfaqet, mes atyre te
// etiketuara 'barazi') mbetet pergjegjesi e pike-reklama.js ekzistues — ripërdoret, jo i ri.
//
// PENDING (hapi tjeter, s'eshte ndertuar ende): VETE lidhja brenda /ad — pra si vendoset
// nese nje kerkese konkrete i shkon fare ketij moduli (Balance) apo mekanizmit te Ankandit.
// Kjo varet nga cilesimet e "Hosting" (perqindja Ankand/Balance per snippet), qe sot ende
// s'ka funksion real backend (vetem UI). Duhet ndertuar para se ky modul te therritet realisht.

module.exports = function (pool) {

  // Deficitet (dhene - marre, VETEM burimi='barazi') per nje liste bizneshesh
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

  // Historiku i "dhenies" ne 30 ditet e fundit, per tie-break
  async function merrHistorikun1Mujor(kandidatIds) {
    if (!kandidatIds || !kandidatIds.length) return {};
    const r = await pool.query(`
      SELECT biznes_id, COUNT(*)::int AS n FROM ngjarjet
      WHERE lloji='view' AND burimi='barazi' AND biznes_id = ANY($1::int[])
        AND created_at > now() - interval '30 days'
      GROUP BY biznes_id`, [kandidatIds]);
    const rez = {};
    kandidatIds.forEach(id => { rez[id] = 0; });
    r.rows.forEach(x => { rez[x.biznes_id] = x.n; });
    return rez;
  }

  // FUNKSIONI KRYESOR: nga nje liste kandidatesh (biznes_id te pershtatshem per kete host),
  // zgjidh fituesin sipas defiçitit + tie-break historik/rastesi.
  async function zgjidhFituesinBalance(kandidatIds) {
    if (!kandidatIds || !kandidatIds.length) return null;
    if (kandidatIds.length === 1) return kandidatIds[0];

    const deficitet = await merrDeficitet(kandidatIds);
    let maksDeficit = -Infinity;
    kandidatIds.forEach(id => {
      const d = deficitet[id] ? deficitet[id].deficit : 0;
      if (d > maksDeficit) maksDeficit = d;
    });

    const teBarabarte = kandidatIds.filter(id => (deficitet[id] ? deficitet[id].deficit : 0) === maksDeficit);
    if (teBarabarte.length === 1) return teBarabarte[0];

    // Barazim mes disa kandidatesh — kontrollo historikun 1-mujor te dhenies
    const historiku = await merrHistorikun1Mujor(teBarabarte);
    const kaHistorik = teBarabarte.some(id => historiku[id] > 0);
    if (!kaHistorik) {
      // Asnje te dhene historike per asnjerin — rastesisht mes te barabarteve
      return teBarabarte[Math.floor(Math.random() * teBarabarte.length)];
    }
    // Fiton ai me historikun me te larte te dhenies ne 30 dite
    let fitues = teBarabarte[0];
    teBarabarte.forEach(id => { if (historiku[id] > historiku[fitues]) fitues = id; });
    return fitues;
  }

  return { zgjidhFituesinBalance, merrDeficitet, merrHistorikun1Mujor };
};
