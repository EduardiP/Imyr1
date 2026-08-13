// balanca.js — Logjika e shperndarjes BALANCE + regjistrimi i vendimeve per analitike.
//
// RREGULLI:
// 1) Fiton biznesi me DEFICITIN me te madh — dhene (burimi='barazi') minus marre.
//    Nese vetem NJE kandidat ka deficitin maksimal → fiton menjehere, pa llogaritje tjeter.
// 2) Barazim (dy ose me shume me te njejtin deficit):
//    - Merren piket AI reklamues→host, fiton ai me pikat me te larta.
// 3) Barazim edhe ne AI (rast shume i rralle): rastesisht mes te barabarteve.
//
// REGJISTRIMI:
// - Cdo vendim regjistrohet te tabela `balancet` me nje `vendim_id` unik (sekuencë).
// - Rast "fitues i vetem" → nje rresht i vetem me me_barazim=false.
// - Rast "barazim" → nje rresht per SECILIN kandidat te barabartë ne deficit,
//   me me_barazim=true, dhe fitoi=true vetem per fituesin.
//
// THIRRJET:
//   const balanca = require('./balanca')(pool);
//   await balanca.init();  // nje here ne fillim (nga server.js)
//   balanca.zgjidhFituesinBalance([id1, id2, ...], hostId, snippetId) → kthen ID-ne fituese

module.exports = function (pool) {

  // Migrimi i tabelave — thirret nje here nga server.js
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

  // Deficitet (dhene - marre, burimi='barazi') per nje liste bizneshesh
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

  // Regjistron nje vendim ne tabelen `balancet`
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
    } catch (e) { console.error('regjistroVendim DESHTOI:', e.message); }
  }

  // FUNKSIONI KRYESOR
  async function zgjidhFituesinBalance(kandidatIds, hostId, snippetId) {
    if (!kandidatIds || !kandidatIds.length) return null;

    // Rast me nje kandidat te vetem — regjistrim minimal, fiton menjehere
    if (kandidatIds.length === 1) {
      const deficitet = await merrDeficitet(kandidatIds);
      regjistroVendim(hostId, snippetId, kandidatIds, kandidatIds[0], false, deficitet, {}).catch(()=>{});
      return kandidatIds[0];
    }

    // HAPI 1 — Llogarit deficitet dhe gjej maksimumin
    const deficitet = await merrDeficitet(kandidatIds);
    let maksDeficit = -Infinity;
    kandidatIds.forEach(id => {
      const d = deficitet[id] ? deficitet[id].deficit : 0;
      if (d > maksDeficit) maksDeficit = d;
    });

    // HAPI 2 — Kush ka deficitin maksimal
    const teBarabarte = kandidatIds.filter(id => (deficitet[id] ? deficitet[id].deficit : 0) === maksDeficit);

    // Fitues i vetem (rasti me i shpeshte)
    if (teBarabarte.length === 1) {
      regjistroVendim(hostId, snippetId, teBarabarte, teBarabarte[0], false, deficitet, {}).catch(()=>{});
      return teBarabarte[0];
    }

    // HAPI 3 — Barazim ne deficit: perdor piket AI reklamues→host
    const piketAI = await merrPiketAI(teBarabarte, hostId);
    let maksAI = -Infinity;
    teBarabarte.forEach(id => { if (piketAI[id] > maksAI) maksAI = piketAI[id]; });
    const teBarabarteAI = teBarabarte.filter(id => piketAI[id] === maksAI);

    // Nese vetem nje ka piken me te larte AI — fiton
    let fitues;
    if (teBarabarteAI.length === 1) {
      fitues = teBarabarteAI[0];
    } else {
      // HAPI 4 — Edhe piket AI jane te barabarta (rast shume i rralle) → rastesisht
      fitues = teBarabarteAI[Math.floor(Math.random() * teBarabarteAI.length)];
    }

    // Regjistrim: te gjithe te barabartet ne deficit, me AI dhe shenjen e fituesit
    regjistroVendim(hostId, snippetId, teBarabarte, fitues, true, deficitet, piketAI).catch(()=>{});
    return fitues;
  }

  return { init, zgjidhFituesinBalance, merrDeficitet, merrPiketAI };
};
