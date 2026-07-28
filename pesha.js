// pesha.js — MATEMATIKA E PESHES (pa databaze, plotesisht e testueshme)
// Ndryshoji parametrat ketu; asgje tjeter nuk preket.

const PARAM = {
  // Pike profili: sa shfaqje = 1 pike (1 konvertim = 1 pike gjithmone)
  RATE: { b2b: 58, b2c: 111, b2b2c: 80 },   // 80 = ende per t'u vendosur

  // Kurba e pikeve ndihmese: 160/(1+e^(0.028*(ai-120)))
  NDIHMA_MAX: 160,
  NDIHMA_QENDER: 120,
  NDIHMA_PJERRESI: 0.028,
  NDIHMA_KUFI_LART: 320,    // mbi kete -> 0 pike
  NDIHMA_KUFI_POSHT: 20,    // nen kete -> 0 pike

  // Sa i hiqet ndihmes per cdo pike profili (1.0 = nje-per-nje)
  KOEF_ZBRITJE: 1.0,

  // Faza e mesimit: para kesaj dite, vetem pike AI
  DITE_MESIMI: 7,

  // Ndihma jepet vetem per kaq kombinimet me te mira te biznesit
  TOP_KOMBINIME: 3
};

function pikeProfili(tipi, shfaqje, konvertime) {
  const rate = PARAM.RATE[tipi] || PARAM.RATE.b2c;
  return shfaqje / rate + (konvertime || 0);
}

function ndihma(ai) {
  if (ai > PARAM.NDIHMA_KUFI_LART || ai < PARAM.NDIHMA_KUFI_POSHT) return 0;
  return PARAM.NDIHMA_MAX / (1 + Math.exp(PARAM.NDIHMA_PJERRESI * (ai - PARAM.NDIHMA_QENDER)));
}

// ndihma neto = kurba − piket e profilit (zbritje nje-per-nje), jo nen zero.
// nderTop3 = a eshte ky cift nder 3 kombinimet me te mira te reklamuesit.
// PA learning phase — zbritja e ben vete punen.
function ndihmaNeto(ai, pikeProf, nderTop3) {
  if (!nderTop3) return 0;
  return Math.max(0, ndihma(ai) - PARAM.KOEF_ZBRITJE * pikeProf);
}

// k = { ai, pikeProfili, nderTop3 }
function pesha(k) {
  return k.ai + k.pikeProfili + ndihmaNeto(k.ai, k.pikeProfili, !!k.nderTop3);
}

// A perputhen tipet? b2b2c hyn kudo.
function tipetPerputhen(tipiReklamues, tipiHost) {
  if (!tipiReklamues || !tipiHost) return false;
  return tipiReklamues === tipiHost || tipiReklamues === 'b2b2c' || tipiHost === 'b2b2c';
}

// Weighted random: kandidatet = [{ ..., peshe }]
function zgjidhMePeshe(kandidatet, rnd) {
  const total = kandidatet.reduce((s, k) => s + k.peshe, 0);
  if (total <= 0) return null;
  let r = (rnd || Math.random)() * total;
  for (const k of kandidatet) { r -= k.peshe; if (r <= 0) return k; }
  return kandidatet[kandidatet.length - 1];
}

module.exports = { PARAM, pikeProfili, ndihma, ndihmaNeto, pesha, tipetPerputhen, zgjidhMePeshe };
