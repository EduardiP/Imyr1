// selector.js — LOGJIKA E SHPERNDARJES SE REKLAMAVE
// pesha = vleresimi_AI(reklamues→host) + piket_e_profilit(reklamues) + ndihma_neto
//   ndihma jepet vetem nese cifti eshte nder 3 kombinimet me te mira te reklamuesit,
//   AI brenda 20-320, dhe zbritet nga piket e profilit (nje-per-nje). Pa learning phase.
// Filtri i tipit: b2b me b2b, b2c me b2c, b2b2c me te dyja.
// Probabiliteti = pesha ÷ shuma (weighted-random). Regjistron ankandin te `garat`.

const pesha = require('./pesha');
const pikeRekl = require('./pike-reklama');
const balanca = require('./balanca');
const automatik = require('./automatik');

function tipetPerputhen(rTipi, hTipi) {
  if (rTipi === 'b2b2c' || hTipi === 'b2b2c') return true;
  return rTipi === hTipi;
}

// Piket e profilit — nga shfaqjet/konvertimet qe biznesi OFRON si host. Gjithmone aktive.
async function pikeProfiliBiznesi(pool, bizId, tipi) {
  const r = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE lloji='view')::int      AS shfaqje,
            COUNT(*) FILTER (WHERE lloji='konvertim')::int AS konvertime
     FROM ngjarjet WHERE biznes_id=$1`, [bizId]);
  const shfaqje = r.rows[0].shfaqje, konvertime = r.rows[0].konvertime;
  const rate = pesha.PARAM.RATE[tipi] || pesha.PARAM.RATE.b2c;
  return (shfaqje / rate) + konvertime;
}

// A eshte host-i nder 3 kombinimet me te mira (AI) te reklamuesit?
async function eshteNderTop3(pool, reklamuesId, hostId) {
  const r = await pool.query(
    `SELECT host_id FROM perputhjet
     WHERE reklamues_id=$1 AND skori IS NOT NULL
     ORDER BY skori DESC LIMIT $2`, [reklamuesId, pesha.PARAM.TOP_KOMBINIME]);
  return r.rows.some(x => x.host_id === hostId);
}

async function initGarat(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS garat (
      id SERIAL PRIMARY KEY,
      host_id      INTEGER NOT NULL,
      reklamues_id INTEGER NOT NULL,
      pesha        NUMERIC,
      ai           NUMERIC,
      profili      NUMERIC,
      ndihma       NUMERIC,
      ndihma_bruto NUMERIC,
      fitoi        BOOLEAN DEFAULT false,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_garat_host ON garat(host_id)`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ai NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS profili NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ndihma NUMERIC`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS snippet_id INTEGER`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS ndihma_bruto NUMERIC`);
  // vendim_id — identifikues i perbashket per te gjithe kandidatet e TE NJEJTIT vendim
  // (per te llogaritur POZICIONIN e sakte brenda atij vendimi specifik).
  await pool.query(`CREATE SEQUENCE IF NOT EXISTS garat_vendim_seq`);
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS vendim_id BIGINT`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_garat_vendim ON garat(vendim_id)`);
  // reklama_id — VETEM per rreshtin FITUES (humbesit s'kane reklame specifike te percaktuar,
  // sepse Ankandi zgjedh fillimisht biznesin, e vetem PASTAJ zgjedh reklamen e tij specifike —
  // kjo faze e dyte s'ndodh fare per humbesit).
  await pool.query(`ALTER TABLE garat ADD COLUMN IF NOT EXISTS reklama_id INTEGER`);
}

async function zgjidhReklame(pool, hostId, pare, snippetId) {
  pare = Array.isArray(pare) ? pare : [];
  const h = await pool.query('SELECT tipi, barazi_perqindje, hosting_menyra, hosting_mode FROM bizneset WHERE id=$1', [hostId]);
  const hTipi = h.rows[0] && h.rows[0].tipi;
  const hostingMode = (h.rows[0] && h.rows[0].hosting_mode) || 'automatik';
  const hostingMenyra = (h.rows[0] && h.rows[0].hosting_menyra) || 'te-gjitha';
  let baraziPerqindje = (h.rows[0] && h.rows[0].barazi_perqindje != null) ? h.rows[0].barazi_perqindje : 50;

  // ═══ VENDOS PISHINEN (Ankand ose Balance) ═══
  // Nese hosting_mode='automatik' → moduli automatik vendos (algoritmi i ri)
  // Nese hosting_mode='manual'    → sistemi i vjeter me barazi_perqindje (i paprekur)
  let logjikaKerkuar;
  let modAutomatik = null;
  let hostTipiAutomatik = null;
  let rezultatAutomatik = null; // { pishina, uKonkurrua, topAnkand, topBarazi } — per regjistrimin historik

  if (hostingMode === 'automatik') {
    modAutomatik = automatik(pool);
    hostTipiAutomatik = await modAutomatik.tipiHostit(hostId);
    rezultatAutomatik = await modAutomatik.vendosLogjikenDetajuar(hostId, hTipi);
    logjikaKerkuar = rezultatAutomatik.pishina;
    if (!logjikaKerkuar) return null;
  } else {
    // SISTEMI EKZISTUES MANUAL — i paprekur
    // VETEM menyra AKTUALE zbatohet — kurre te dyja njekohesisht.
    // 'vecmas': perdor VETEM vleren e ketij snippet-i specifik (jo vleren e biznesit, edhe nese snippet-i s'ka te veten ende).
    // 'te-gjitha': perdor VETEM vleren e biznesit — injoro plotesisht cdo vlere e vjeter individuale e snippet-eve.
    if (hostingMenyra === 'vecmas' && snippetId) {
      try {
        const sn = await pool.query('SELECT barazi_perqindje FROM snippetet WHERE id=$1', [snippetId]);
        baraziPerqindje = (sn.rows.length && sn.rows[0].barazi_perqindje != null) ? sn.rows[0].barazi_perqindje : 50;
      } catch (e) { baraziPerqindje = 50; }
    }
    logjikaKerkuar = ((Math.random() * 100) < baraziPerqindje) ? 'barazi' : 'ankand';
  }

  // Cache boolean per pjesen e ulet te kodit (i paprekur)
  const shkoTeBarazi = (logjikaKerkuar === 'barazi');

  // ANKANDI KRYESOR: kandidatet jane BIZNESE (jo cdo reklame), FILTRUAR sipas pishines se zgjedhur.
  const kand = await pool.query(
    `SELECT DISTINCT b.id AS biznes_id, b.tipi
     FROM promovimet p JOIN bizneset b ON b.id = p.biznes_id
     WHERE p.biznes_id <> $1 AND p.aktiv = true AND COALESCE(p.pauzuar,false) = false
       AND COALESCE(p.logjika_shperndarjes,'ankand') = $2
       AND (p.teksti IS NOT NULL OR p.imazh_url IS NOT NULL OR p.video_url IS NOT NULL OR p.html5_url IS NOT NULL)
       AND EXISTS (SELECT 1 FROM snippetet s WHERE s.biznes_id = b.id AND s.snippet_active = true AND COALESCE(s.pauzuar,false) = false)`,
    [hostId, logjikaKerkuar]);

  // ═══ KUFIZIMET E KATEGORIVE — perjashtim DYANSHEM, vlen per te dyja pishinat ═══
  // (a) HOST-i s'do kandidate nga kategorite qe VETE i ka perjashtuar.
  // (b) Kandidatet qe VETE e kane perjashtuar kategorine e HOST-it, s'marrin pjese.
  if (kand.rows.length) {
    try {
      const hostKatQ = await pool.query('SELECT kategoria_kryesore FROM bizneset WHERE id=$1', [hostId]);
      const hostKat = hostKatQ.rows[0] && hostKatQ.rows[0].kategoria_kryesore;

      const hostPerjashtimetQ = await pool.query(
        'SELECT kategoria FROM kategori_perjashtime WHERE biznes_id=$1', [hostId]);
      const hostPerjashton = new Set(hostPerjashtimetQ.rows.map(r => r.kategoria));

      const kandIds = kand.rows.map(k => k.biznes_id);
      const kandKatQ = await pool.query(
        'SELECT id, kategoria_kryesore FROM bizneset WHERE id = ANY($1)', [kandIds]);
      const kandKatMap = {};
      kandKatQ.rows.forEach(r => { kandKatMap[r.id] = r.kategoria_kryesore; });

      let kandidatetQePerjashtojneHostin = new Set();
      if (hostKat) {
        const q = await pool.query(
          'SELECT biznes_id FROM kategori_perjashtime WHERE kategoria=$1 AND biznes_id = ANY($2)',
          [hostKat, kandIds]);
        kandidatetQePerjashtojneHostin = new Set(q.rows.map(r => r.biznes_id));
      }

      kand.rows = kand.rows.filter(k => {
        const katKandidati = kandKatMap[k.biznes_id];
        if (katKandidati && hostPerjashton.has(katKandidati)) return false;       // (a)
        if (kandidatetQePerjashtojneHostin.has(k.biznes_id)) return false;        // (b)
        return true;
      });
    } catch (e) { /* nese kufizimet deshtojne, vazhdo pa filtrin — mos e ndal Ankand-in fare */ }
  }

  // Filtri i tipit — VETEM per Ankand (i paprekur). Per Balance, filtri i tipit
  // NUK zbatohet ketu — balanca.js pranon te gjitha tipet dhe ben vete
  // "perjashtimin e konkurrenteve" (AI=0 + e njejta kategori) brenda vetes.
  let biznesetKand = shkoTeBarazi
    ? kand.rows
    : kand.rows.filter(k => !(hTipi && k.tipi && !tipetPerputhen(k.tipi, hTipi)));
  if (!biznesetKand.length) return null;

  let fituesBizId, listaAnkand = null, fituesiAnkand = null;

  if (shkoTeBarazi) {
    // ═══ PISHINA BALANCE: fiton biznesi me deficitin me te madh (jo weighted-random) ═══
    const modBalanca = balanca(pool);
    fituesBizId = await modBalanca.zgjidhFituesinBalance(biznesetKand.map(k => k.biznes_id), hostId);
    if (!fituesBizId) return null;
  } else {
    // ═══ PISHINA ANKAND: pikerisht logjika ekzistuese, e paprekur ═══
    const lista = [];
    for (const k of biznesetKand) {
      let skorAI = 0;
      try {
        const s = await pool.query(
          'SELECT skori FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2', [k.biznes_id, hostId]);
        if (s.rows.length && s.rows[0].skori != null) skorAI = s.rows[0].skori;
      } catch (e) {}
      const pikeProf = await pikeProfiliBiznesi(pool, k.biznes_id, k.tipi || hTipi);
      let nderTop3 = false;
      try { nderTop3 = await eshteNderTop3(pool, k.biznes_id, hostId); } catch (e) {}
      const ndihBruto = nderTop3 ? pesha.ndihma(skorAI) : 0;
      const ndih = pesha.ndihmaNeto(skorAI, pikeProf, nderTop3);
      const w = skorAI + pikeProf + ndih;
      lista.push({ k, pesha: w, ai: skorAI, profili: pikeProf, ndihma: ndih, ndihmaBruto: ndihBruto });
    }
    if (!lista.length) return null;

    const shuma = lista.reduce((a, x) => a + x.pesha, 0);
    let fituesi;
    if (shuma <= 0) {
      fituesi = lista[Math.floor(Math.random() * lista.length)];
    } else {
      let pike = Math.random() * shuma;
      for (const x of lista) { pike -= x.pesha; if (pike <= 0) { fituesi = x; break; } }
      if (!fituesi) fituesi = lista[lista.length - 1];
    }
    fituesBizId = fituesi.k.biznes_id;
    listaAnkand = lista; fituesiAnkand = fituesi;
  }

  // ANKANDI I DYTE: cila reklame e biznesit fitues shfaqet — FILTRUAR sipas te njejtes pishine.
  // Weighted-random I PASTER sipas pikeve te reklamave (PA frequency capping), si me pare.
  const rekQ = await pool.query(
    `SELECT id FROM promovimet WHERE biznes_id=$1 AND aktiv=true AND COALESCE(pauzuar,false)=false
       AND COALESCE(logjika_shperndarjes,'ankand')=$2
       AND (teksti IS NOT NULL OR imazh_url IS NOT NULL OR video_url IS NOT NULL OR html5_url IS NOT NULL)`,
    [fituesBizId, logjikaKerkuar]);
  const rekIds = rekQ.rows.map(r => r.id);
  if (!rekIds.length) return null;
  const rekId = await zgjedhNgaLista(pool, fituesBizId, rekIds);
  if (!rekId) return null;

  // Merr te dhenat e plota te reklames se zgjedhur
  const rd = await pool.query(
    'SELECT id, biznes_id, teksti, imazh_url, video_url, html5_url, link FROM promovimet WHERE id=$1', [rekId]);
  if (!rd.rows.length) return null;

  if (!shkoTeBarazi) regjistroAnkandin(pool, hostId, listaAnkand, fituesiAnkand, snippetId, rekId).catch(()=>{});

  // Regjistro efektin ne borxhin global — VETEM nese kishte konkurrence te vertete
  // mes te dyja pishinave (jo rruge direkte, jo tip host-i)
  if (modAutomatik && rezultatAutomatik) {
    modAutomatik.regjistroShfaqjen(rezultatAutomatik.uKonkurrua, logjikaKerkuar).catch(()=>{});
  }
  // Regjistro vendimin e plote (finalistet + fituesi) — per historikun ne admin panel
  if (modAutomatik && rezultatAutomatik) {
    modAutomatik.regjistroVendimDetajuar(hostId, rezultatAutomatik, fituesBizId).catch(()=>{});
  }

  return Object.assign({}, rd.rows[0], { cikel_ri: false, burimi: logjikaKerkuar });
}

// Ankandi i dyte i kufizuar ne nje nenlliste id-sh (per capping)
async function zgjedhNgaLista(pool, bizId, idet) {
  if (idet.length === 1) return idet[0];
  const stat = await pikeRekl.statPerReklama(pool, idet);
  // Faza fillestare: nese ndonje ka < 5 shikime, zgjedh me radhe ate me me pak
  const SHF = 5;
  const mePak = idet.map(id => ({ id, shikime: (stat[id] && stat[id].shikime) || 0 })).filter(x => x.shikime < SHF);
  if (mePak.length) {
    const min = Math.min.apply(null, mePak.map(x => x.shikime));
    const kand = mePak.filter(x => x.shikime === min);
    return kand[Math.floor(Math.random() * kand.length)].id;
  }
  // Weighted-random sipas pikeve
  const l = idet.map(id => ({ id, pike: Math.max(0, pikeRekl.pikeReklame(stat[id])) }));
  const sh = l.reduce((a, x) => a + x.pike, 0);
  if (sh <= 0) return l[Math.floor(Math.random() * l.length)].id;
  let p = Math.random() * sh;
  for (const x of l) { p -= x.pike; if (p <= 0) return x.id; }
  return l[l.length - 1].id;
}

async function regjistroAnkandin(pool, hostId, lista, fituesi, snippetId, reklamaFituese) {
  try {
    const vendimQ = await pool.query(`SELECT nextval('garat_vendim_seq') AS id`);
    const vendimId = vendimQ.rows[0].id;
    for (const x of lista) {
      await pool.query(
        `INSERT INTO garat (host_id, reklamues_id, pesha, ai, profili, ndihma, ndihma_bruto, fitoi, snippet_id, vendim_id, reklama_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [hostId, x.k.biznes_id,
         rr(x.pesha), rr(x.ai), rr(x.profili), rr(x.ndihma), rr(x.ndihmaBruto), x === fituesi, snippetId || null,
         vendimId, (x === fituesi) ? (reklamaFituese || null) : null]);
    }
  } catch (e) {}
}
function rr(n){ return Math.round(n * 10) / 10; }

module.exports = { zgjidhReklame, initGarat, tipetPerputhen };
