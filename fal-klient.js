// fal-klient.js — Mbeshtjellës i pastër per thirrjet Fal.ai (imazh: gjenerim + modifikim/Kontext).
// Video (Wan 2.6) shtohet me vone si funksione shtese ketu, kur te vije radha.
//
// Kerkon env var: FAL_KEY

const FAL_BASE = 'https://fal.run';

async function falThirr(endpoint, input) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY s'është konfiguruar te serveri.");
  const r = await fetch(FAL_BASE + '/' + endpoint, {
    method: 'POST',
    headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const data = await r.json();
  if (!r.ok) {
    const msg = (data && (data.detail || data.error || data.message)) || ('Fal.ai gabim (' + r.status + ')');
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// Prompt "qellimi" — kombinohet me pershkrimin e klientit, per te dhene rezultate te natyres reklame
const QELLIMI_IMAZH =
  'Professional advertisement photo, clean composition, high quality commercial product/brand photography, ' +
  'suitable for a display ad. ';

// Gjenerim i PARE (tekst → imazh) — Ideogram V3, teksti/CTA i lexueshem brenda imazhit
async function gjeneroImazh(pershkrimi) {
  const data = await falThirr('fal-ai/ideogram/v3', {
    prompt: QELLIMI_IMAZH + pershkrimi,
    image_size: 'square_hd',
    rendering_speed: 'BALANCED'
  });
  const url = data && data.images && data.images[0] && data.images[0].url;
  if (!url) throw new Error("Fal.ai s'ktheu imazh.");
  return url;
}

// Modifikim (imazh ekzistues + tekst i ri → imazh i korrigjuar) — Flux Kontext
async function modifikoImazh(imageUrl, pershkrimi) {
  const data = await falThirr('fal-ai/flux-pro/kontext', {
    image_url: imageUrl,
    prompt: pershkrimi
  });
  const url = data && data.images && data.images[0] && data.images[0].url;
  if (!url) throw new Error("Fal.ai s'ktheu imazh të korrigjuar.");
  return url;
}

module.exports = { gjeneroImazh, modifikoImazh };
