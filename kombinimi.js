// kombinimi.js — Logjika e kombinimit me AI (e ndare nga server.js)
// Server.js e therret: const kombinimi = require('./kombinimi'); kombinimi.init(pool);
// dhe: kombinimi.kombinoBiznesin(bizId)  — kur nje biznes kalon piken e 3-te.
//
// Cfare mat: vleresim 0-1000 = sa gati jane klientet/vizitoret e njerit biznes
// per te perdorur sherbimin e tjetrit (potenciali i konvertimit). Nje cift jep
// DY vleresime (A→B dhe B→A). Ruhet nje here te tabela `perputhjet`, s'rillogaritet.
//
// Rregulli i tipit: b2b vetem me b2b, b2c vetem me b2c, b2b2c me te gjitha.

let _pool = null;

function init(pool) {
  _pool = pool;
  return krijoTabelen();
}

async function krijoTabelen() {
  await _pool.query(`
    CREATE TABLE IF NOT EXISTS perputhjet (
      reklamues_id INTEGER NOT NULL,
      host_id      INTEGER NOT NULL,
      skori        INTEGER,
      created_at   TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (reklamues_id, host_id)
    )`);
  await _pool.query(`CREATE INDEX IF NOT EXISTS idx_perputhjet_host ON perputhjet(host_id)`);
}

// A perputhen dy tipe per t'u kombinuar
function tipetPerputhen(a, b) {
  if (a === 'b2b2c' || b === 'b2b2c') return true;   // b2b2c me te gjitha
  return a === b;                                     // b2b↔b2b, b2c↔b2c
}

// --- Thirrja te AI per nje cift: kthen {ab, ba} ose null nese deshton ---
async function skoroCiftin(a, b) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL_SKORI || 'gpt-5.6-sol';

  const sys =
    'Je nje sistem qe vlereson potencialin e konvertimit mes dy sherbimeve per nje rrjet cross-promotion. ' +
    'Kthe VETEM JSON, pa asnje tekst tjeter.';

  const user =
    'Ke dy biznese. Per secilin, logjiko KUSH jane klientet/vizitoret e tij nga pershkrimi dhe audienca, ' +
    'dhe vlereso sa GATI do te ishin ata per te perdorur sherbimin e biznesit tjeter (potenciali i konvertimit).\n\n' +
    'BIZNESI A:\n' + pershkrimBiznesi(a) + '\n\n' +
    'BIZNESI B:\n' + pershkrimBiznesi(b) + '\n\n' +
    'Mendo keshtu: kur nje biznes eshte B2B, klientet e tij jane BIZNESE. Nese biznesi tjeter gjithashtu ' +
    'i sherben bizneseve me dicka qe atyre mund t\'u duhet, potenciali eshte i LARTE — mos e nenvleroso. ' +
    'Nje pronar biznesi qe perdor nje mjet, shpesh ka nevoje edhe per mjete te tjera plotesuese.\n\n' +
    'SHKALLA (perdore te gjithe, mos u mbaj poshte pa arsye):\n' +
    '- 800-1000: perputhje shume e forte — audienca e njerit ka gati gjithmone nevoje per tjetrin.\n' +
    '- 550-799: perputhje e mire — shume nga audienca do ta perdornin.\n' +
    '- 300-549: perputhje e moderuar — disa do ta perdornin.\n' +
    '- 100-299: perputhje e dobet — pak gjasa.\n' +
    '- 0-99: pa lidhje, ose konkurrente (i njejti sherbim → ul deri ne zero).\n\n' +
    'Jep DY vleresime 0-1000:\n' +
    '- "ab": sa gati jane klientet/vizitoret e B per te perdorur sherbimin e A.\n' +
    '- "ba": sa gati jane klientet/vizitoret e A per te perdorur sherbimin e B.\n\n' +
    'Vetem konkurrentet direkte (i njejti sherbim) marrin pike shume te ulet. ' +
    'Sherbime te ndryshme por qe i sherbejne te njejtes audience jane KOMPLEMENTARE — pike te larta.\n\n' +
    'Kthe JSON: {"ab": numer 0-1000, "ba": numer 0-1000}';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
      })
    });
    const data = await r.json();
    if (data.error) { console.error('Skori AI gabim:', data.error.message); return null; }
    const p = JSON.parse(data.choices[0].message.content);
    const ab = kufizo(p.ab), ba = kufizo(p.ba);
    if (ab === null || ba === null) return null;
    return { ab, ba };
  } catch (e) {
    console.error('Skori AI deshtoi:', e.message);
    return null;
  }
}

function kufizo(n) {
  n = parseInt(n, 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(1000, n));
}

function pershkrimBiznesi(b) {
  const p = b.permbledhje || b.pershkrimi || '(pa pershkrim)';
  const audienca = b.tipi === 'b2b' ? 'Biznese (klientet jane kompani/biznese)'
                 : b.tipi === 'b2c' ? 'Individe (klientet jane konsumatore/individe)'
                 : b.tipi === 'b2b2c' ? 'Te dyja (biznese dhe individe)'
                 : '(e papercaktuar)';
  const kat = b.kategoria_kryesore ? ('\nKategoria: ' + b.kategoria_kryesore) : '';
  const nk = b.nenkategorite ? ('\nNenkategorite: ' + b.nenkategorite) : '';
  return p + '\nAudienca/klientet: ' + audienca + kat + nk;
}

// --- Merr te dhenat e nevojshme te nje biznesi ---
async function merrBiznesin(id) {
  const r = await _pool.query(
    `SELECT id, emri, tipi, permbledhje, pershkrimi, kategoria_kryesore, nenkategorite
     FROM bizneset WHERE id=$1`, [id]);
  return r.rows[0] || null;
}

// --- A eshte biznesi "gati" (3 pikat: biznesi + pershkrimi + lidhja) ---
function eshteGati(b) {
  return b && b.tipi && (b.permbledhje || b.pershkrimi);
  // snippet_active kontrollohet nga thirresi (server e di gjendjen)
}

// --- Bizneset e tjera gati te po asaj pishine (per t'u kombinuar) ---
async function biznesetPerKombinim(vetja) {
  const r = await _pool.query(
    `SELECT id, emri, tipi, permbledhje, pershkrimi, kategoria_kryesore, nenkategorite
     FROM bizneset
     WHERE id <> $1
       AND tipi IS NOT NULL
       AND (permbledhje IS NOT NULL OR pershkrimi IS NOT NULL)
       AND snippet_active = true`, [vetja.id]);
  return r.rows.filter(b => tipetPerputhen(vetja.tipi, b.tipi));
}

// --- A ekziston tashme cifti (ne cfaredo drejtimi) ---
async function ekzistonCifti(a, b) {
  const r = await _pool.query(
    'SELECT 1 FROM perputhjet WHERE reklamues_id=$1 AND host_id=$2 LIMIT 1', [a, b]);
  return r.rows.length > 0;
}

// --- Ruaj te dy drejtimet e nje cifti ---
async function ruajCiftin(aId, bId, ab, ba) {
  // ab = sa A plotesues per B  => reklamues=A, host=B
  // ba = sa B plotesues per A  => reklamues=B, host=A
  await _pool.query(
    `INSERT INTO perputhjet (reklamues_id, host_id, skori) VALUES ($1,$2,$3)
     ON CONFLICT (reklamues_id, host_id) DO UPDATE SET skori=EXCLUDED.skori`,
    [aId, bId, ab]);
  await _pool.query(
    `INSERT INTO perputhjet (reklamues_id, host_id, skori) VALUES ($1,$2,$3)
     ON CONFLICT (reklamues_id, host_id) DO UPDATE SET skori=EXCLUDED.skori`,
    [bId, aId, ba]);
}

// --- FUNKSIONI KRYESOR: kombino nje biznes me pishinen e vet ---
// Thirret kur biznesi kalon piken e 3-te. Punon ne sfond (pa e bllokuar pergjigjen).
async function kombinoBiznesin(bizId) {
  if (!_pool) return;
  try {
    const vetja = await merrBiznesin(bizId);
    if (!eshteGati(vetja)) return;
    const tetjeret = await biznesetPerKombinim(vetja);
    if (!tetjeret.length) return;
    for (const tjetri of tetjeret) {
      if (await ekzistonCifti(vetja.id, tjetri.id)) continue;   // llogaritur tashme
      const skor = await skoroCiftin(vetja, tjetri);
      if (skor) await ruajCiftin(vetja.id, tjetri.id, skor.ab, skor.ba);
    }
  } catch (e) {
    console.error('kombinoBiznesin deshtoi:', e.message);
  }
}

// --- FSHI çiftet EKZISTUESE te nje biznesi te vetem (te dyja drejtimet) ---
async function fshiCiftetEBiznesit(bizId) {
  await _pool.query('DELETE FROM perputhjet WHERE reklamues_id=$1 OR host_id=$1', [bizId]);
}

// --- RIKOMBINIM I PLOTE per nje biznes te vetem ---
// Ndryshe nga kombinoBiznesin (qe anashkalon çiftet ekzistuese), kjo i FSHIN çiftet e
// ketij biznesi specifik dhe i rillogarit te GJITHA nga e para (p.sh. pas ndryshimit te
// pershkrimit). S'prek çiftet mes bizneseve te tjera me njeri-tjetrin.
async function rikombinoBiznesin(bizId) {
  if (!_pool) return;
  try {
    await fshiCiftetEBiznesit(bizId);
    const vetja = await merrBiznesin(bizId);
    if (!eshteGati(vetja)) return;
    const tetjeret = await biznesetPerKombinim(vetja);
    if (!tetjeret.length) return;
    for (const tjetri of tetjeret) {
      const skor = await skoroCiftin(vetja, tjetri);
      if (skor) await ruajCiftin(vetja.id, tjetri.id, skor.ab, skor.ba);
    }
  } catch (e) {
    console.error('rikombinoBiznesin deshtoi:', e.message);
  }
}

module.exports = { init, kombinoBiznesin, rikombinoBiznesin, tipetPerputhen };
