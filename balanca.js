// balanca.js — Logjika e shperndarjes BALANCE (jo Ankand): zgjedh CILIT BIZNES i shkon
// shfaqja e ardhshme, mes disa kandidatesh te pershtatshem per te njejtin snippet/host.
//
// RREGULLI (siç u percaktua):
// 1) Fiton biznesi me DEFICITIN me te madh — dhene (burimi='barazi') minus marre (burimi='barazi').
//    Deficit pozitiv = ka dhene me shume se ka marre = "i eshte borxh" nga rrjeti.
//    Nese vetem NJE kandidat ka deficitin maksimal → fiton menjehere, pa asnje llogaritje tjeter.
// 2) Barazim (dy ose me shume kandidate me te njejtin deficit maksimal):
//    - Merren piket AI reklamues→host (nga tabela perputhjet) per secilin.
//    - Fiton ai me piket me te larta AI — statistikisht do te konvertoje me mire per kete host.
// 3) Barazim edhe ne pikat AI (rast shume i rralle, shkalla 0-1000):
//    - Zgjidhet RASTESISHT mes te barabarteve, si mase sigurie.
//
// Server.js e therret: const balanca = require('./balanca')(pool);
// balanca.zgjidhFituesinBalance(kandidatIds, hostId) → kthen ID-ne fituese (ose null).
//
// SHENIM: ky modul eshte VETEM zgjedhja e biznesit fitues (niveli i pare, njesoj si ankandi
// kryesor). Niveli i dyte (cila reklame konkrete e biznesit fitues shfaqet, mes atyre te
// etiketuara 'barazi') mbetet pergjegjesi e pike-reklama.js ekzistues — ripërdoret, jo i ri.

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

  // Piket AI reklamues→host per nje liste reklamuesish kundrejt te njejtit host.
  // Perdoret VETEM per tie-break kur >1 kandidat ka te njejtin deficit maksimal.
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

  // FUNKSIONI KRYESOR: nga nje liste kandidatesh (biznes_id te pershtatshem per kete host),
  // zgjidh fituesin sipas deficitit → tie-break me AI → tie-break rastesor.
  async function zgjidhFituesinBalance(kandidatIds, hostId) {
    if (!kandidatIds || !kandidatIds.length) return null;
    if (kandidatIds.length === 1) return kandidatIds[0];

    // HAPI 1 — Llogarit deficitet dhe gjej maksimumin
    const deficitet = await merrDeficitet(kandidatIds);
    let maksDeficit = -Infinity;
    kandidatIds.forEach(id => {
      const d = deficitet[id] ? deficitet[id].deficit : 0;
      if (d > maksDeficit) maksDeficit = d;
    });

    // HAPI 2 — Kush ka deficitin maksimal
    const teBarabarte = kandidatIds.filter(id => (deficitet[id] ? deficitet[id].deficit : 0) === maksDeficit);

    // Nese vetem nje — fiton menjehere, pa llogaritje tjeter
    if (teBarabarte.length === 1) return teBarabarte[0];

    // HAPI 3 — Barazim ne deficit: perdor piket AI reklamues→host
    const piketAI = await merrPiketAI(teBarabarte, hostId);
    let maksAI = -Infinity;
    teBarabarte.forEach(id => { if (piketAI[id] > maksAI) maksAI = piketAI[id]; });
    const teBarabarteAI = teBarabarte.filter(id => piketAI[id] === maksAI);

    // Nese vetem nje ka piken me te larte AI — fiton
    if (teBarabarteAI.length === 1) return teBarabarteAI[0];

    // HAPI 4 — Edhe piket AI jane te barabarta (rast shume i rralle) → rastesisht
    return teBarabarteAI[Math.floor(Math.random() * teBarabarteAI.length)];
  }

  return { zgjidhFituesinBalance, merrDeficitet, merrPiketAI };
};
