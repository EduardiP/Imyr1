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

// ═══ PËRKTHIM AUTOMATIK (shqip → anglisht) — VETEM per modelet e imazhit/videos (Flux/Wan),
// te cilat kuptojne shume me mire anglishten se gjuhet "me pak burime" si shqipja. Claude
// (HTML5) s'ka nevoje per kete — kupton shqipen mire vete. ═══
async function perkthejNeAnglisht(teksti) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !teksti) return teksti; // fail-open: nese s'ka çelës, dergo origjinalin pa u ndalur
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: 'Translate the following advertisement description into natural, vivid English suitable ' +
          'for an AI image-generation prompt. Keep all concrete visual details. Output ONLY the ' +
          'translated text, nothing else — no preamble, no quotes, no explanation.',
        messages: [{ role: 'user', content: teksti }]
      })
    });
    const data = await r.json();
    const perkthimi = data.content && data.content.map(c => c.text || '').join('').trim();
    return perkthimi || teksti; // fail-open nese perkthimi deshton
  } catch (e) { return teksti; } // fail-open — mos e ndal gjenerimin per shkak te perkthimit
}

// Gjenerim i PARE (tekst → imazh) — Flux Schnell (jo me Ideogram).
// Flux PRANON REALISHT permasa custom {width,height} — rezultati eshte FIKS,
// pikerisht ai qe kerkohet, pa nevoje per prerje/ripermasim shtese pas gjenerimit.
async function gjeneroImazh(pershkrimi, width, height) {
  const imageSize = (width && height) ? { width: width, height: height } : 'square_hd';
  const pershkrimiAnglisht = await perkthejNeAnglisht(pershkrimi);
  const data = await falThirr('fal-ai/flux/schnell', {
    prompt: QELLIMI_IMAZH + pershkrimiAnglisht,
    image_size: imageSize
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
  const pershkrimiAnglisht = await perkthejNeAnglisht(pershkrimi);
  const data = await falThirr('wan/v2.6/image-to-video/flash', {
    image_url: imageUrl,
    prompt: QELLIMI_VIDEO + pershkrimiAnglisht
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
// width/height (opsionale): permasa e sakte piksel qe Claude duhet ta ndertoje si kontejner fiks.
async function gjeneroHTML5(pershkrimi, imazhetEtiketuara, width, height) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY s'është konfiguruar te serveri.");
  let userMsg = pershkrimi;
  const lista = imazhetEtiketuara || [];
  if (lista.length) {
    userMsg += '\n\nImage references:\n' + lista.map(function (x, i) {
      return (i + 1) + '. ' + (x.emri ? ('[' + x.emri + '] ') : '') + x.url;
    }).join('\n');
  }
  if (width && height) {
    userMsg += '\n\nExact target size: the outer container MUST be exactly ' + width + 'x' + height +
      ' pixels (set this as a fixed width/height on the root element, with overflow:hidden — ' +
      'do not let content overflow or leave the canvas smaller than this).';
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
