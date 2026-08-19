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
  'Generate this as a professional advertisement creative. ' +
  'Design constraints: clean layout with clear visual hierarchy, high resolution, ' +
  'no watermarks, no placeholder text unless explicitly requested, ' +
  'balanced white space, eye-catching but not cluttered, ' +
  'suitable for digital display advertising (banner, social, web). ' +
  'Accept the description in any language. ';

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

// ═══ VIDEO — Wan 2.6 image-to-video (merr imazh + prompt, kthen video MP4) ═══
const QELLIMI_VIDEO =
  'Animate this advertisement image with subtle, professional motion suitable for a video ad. ' +
  'Keep the brand message and layout intact, add eye-catching but tasteful movement. ' +
  'Accept the description in any language. ';

async function gjeneroVideo(imageUrl, pershkrimi) {
  const data = await falThirr('wan/v2.6/image-to-video/flash', {
    image_url: imageUrl,
    prompt: QELLIMI_VIDEO + pershkrimi
  });
  const url = data && data.video && data.video.url;
  if (!url) throw new Error("Fal.ai s'ktheu video.");
  return url;
}

// ═══ HTML5 — Claude (Anthropic API) — gjeneron banner HTML/CSS/JS nga pershkrimi + imazhet ═══
const QELLIMI_HTML5 =
  'You are an expert HTML5 display ad designer. Create a single self-contained HTML file ' +
  '(HTML+CSS+JS in one file, no external dependencies) for an animated banner ad. ' +
  'The ad must be professional, eye-catching, with smooth CSS animations. ' +
  'If image URLs are provided, each is labeled with its intended purpose — use the label ' +
  'to decide how/where each image fits (e.g. a "Logo" label goes in a logo spot, a "Produkti" ' +
  'label is the main product visual, etc). ' +
  'Output ONLY the raw HTML code, no markdown, no explanation, no backticks.';

// imazhetEtiketuara: [{url, emri}] — nje ose disa imazhe, secili me etiketen e vet (mund te jete bosh []).
async function gjeneroHTML5(pershkrimi, imazhetEtiketuara) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY s'është konfiguruar te serveri.");
  let userMsg = pershkrimi;
  const lista = imazhetEtiketuara || [];
  if (lista.length) {
    userMsg += '\n\nImage references:\n' + lista.map(function (x, i) {
      return (i + 1) + '. ' + (x.emri ? ('[' + x.emri + '] ') : '') + x.url;
    }).join('\n');
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: QELLIMI_HTML5,
      messages: [{ role: 'user', content: userMsg }]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data && data.error && data.error.message) || 'Anthropic gabim');
  const teksti = data.content && data.content.map(c => c.text || '').join('');
  if (!teksti || !teksti.includes('<')) throw new Error("Claude s'ktheu HTML të vlefshëm.");
  return teksti;
}

module.exports = { gjeneroImazh, modifikoImazh, gjeneroVideo, gjeneroHTML5 };
