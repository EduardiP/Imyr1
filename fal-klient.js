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

// Prompt "qellimi" — kombinohet me pershkrimin e klientit, per te dhene rezultate te natyres reklame.
// KRITIKE: reklama pa tekst/mesazh te qarte s'konverton — kerkojme eksplicit titull te shkurter,
// impaktues, DHE sfond qe lidhet LOGJIKISHT me ate qe ofron biznesi (jo abstrakt/dekorativ pa qellim).
const QELLIMI_IMAZH =
  'Generate this as a professional, HIGH-CONVERTING advertisement creative — not just a pretty background, ' +
  'an ad that makes someone want to click. Two things are NON-NEGOTIABLE: ' +
  '(1) TEXT: include a short, punchy headline (3-7 words) in LARGE, highly readable typography, ' +
  'that instantly communicates the core offer or the exact problem it solves — think in the style of ' +
  '"Not just exposure. Real conversion." or a bold side-by-side price/value comparison (e.g. one number ' +
  'crossed out or shown as expensive, a much smaller number as the alternative). Pick whichever angle — ' +
  'benefit-led headline, or comparison — best fits the business description below. The headline must be the ' +
  'visual focal point, not an afterthought squeezed into a corner. ' +
  '(2) BACKGROUND & IMAGERY: everything visual must connect LOGICALLY to what this specific business actually ' +
  'offers — no generic abstract gradients or unrelated stock-photo filler chosen just because it looks nice. ' +
  'If unsure what imagery fits, default to something that visually represents the outcome or industry context ' +
  'described below, not decoration for its own sake. ' +
  'Design constraints: clean layout with clear visual hierarchy, high resolution, no watermarks, ' +
  'no placeholder/lorem-ipsum text, balanced composition, suitable for digital display advertising ' +
  '(banner, social, web). Accept the business description in any language. ';

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

// ═══ HAPI 1 i ri — Claude si COPYWRITER: shkruan titullin konkret, kompelues, PARA se
// t'i kalohet modelit te imazhit. Modelet e imazhit (edhe Ideogram) jane te mira te
// RENDERING i tekstit, POR JO aq te mira te SHKRIMI KRIJUES i vete tekstit — prandaj
// i ndajme: Claude shkruan kopjen, Ideogram e rikrijon vizualisht SAKTESISHT ate. ═══
async function shkruajTitullinReklames(pershkrimiBiznesit) {
  const key = process.env.ANTHROPIC_API_KEY;
  const fallback = null; // nese deshton, gjeneroImazh() vazhdon pa titull te detyruar
  if (!key || !pershkrimiBiznesit) return fallback;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: 'You are a world-class advertising copywriter. Given a business description, write ONE short, ' +
          'punchy ad headline (3-7 words) that instantly communicates the core value or the exact problem it ' +
          'solves — in the style of "Not just exposure. Real conversion." or a bold price/value contrast. ' +
          'Be concrete and specific to THIS business, not generic. Output ONLY the headline text itself, ' +
          'nothing else — no quotes, no explanation, no preamble.',
        messages: [{ role: 'user', content: pershkrimiBiznesit }]
      })
    });
    const data = await r.json();
    const titulli = data.content && data.content.map(c => c.text || '').join('').trim();
    return titulli || fallback;
  } catch (e) { return fallback; } // fail-open — gjenerimi i imazhit vazhdon edhe pa titull
}

// Gjenerim i PARE (tekst → imazh) — Flux Schnell (jo me Ideogram).
// Flux PRANON REALISHT permasa custom {width,height} — rezultati eshte FIKS,
// pikerisht ai qe kerkohet, pa nevoje per prerje/ripermasim shtese pas gjenerimit.
// "shkruajTitull" (default false): PERDORET VETEM per rrugen automatike (regjistrimi), ku
// s'ka rafinim klienti. Rruga manuale (kreative.js) e LEN false — klienti tashmë e ka
// rafinuar pershkrimin vete permes chat-it "Përshkruaj te AI", s'duhet mbivendosur.
async function gjeneroImazh(pershkrimi, width, height, shkruajTitull) {
  const imageSize = (width && height) ? { width: width, height: height } : 'square_hd';
  const pershkrimiAnglisht = await perkthejNeAnglisht(pershkrimi);
  // HAPI 1 (VETEM nese kerkohet eksplicit): Claude shkruan titullin konkret.
  const titulliKonkret = shkruajTitull ? await shkruajTitullinReklames(pershkrimiAnglisht) : null;
  // HAPI 2: Ideogram-it i themi SAKTESISHT çfarë teksti te rikrijoje, kur ka titull te dhene.
  const udhezimiTitullit = titulliKonkret
    ? 'The EXACT headline text to render, prominently and legibly, is: "' + titulliKonkret + '" — use this precise wording, do not paraphrase or shorten it further. '
    : '';
  const data = await falThirr('fal-ai/ideogram/v3', {
    prompt: QELLIMI_IMAZH + udhezimiTitullit + 'Business this ad is for: ' + pershkrimiAnglisht,
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
  'CRITICAL — NO CLICKABLE ELEMENTS: this HTML will be embedded inside an OUTER click-through wrapper ' +
  'added by the ad platform (the entire banner becomes one single clickable link, pointing to the ' +
  'advertiser\'s URL). Therefore your generated HTML must NEVER contain its own <a> tags, onclick handlers, ' +
  '<button> elements with functional behavior, or any JS click listeners — this would conflict with the ' +
  'outer wrapper. Any CTA text (e.g. "Shop Now", "Merr ofertën") must be PURELY VISUAL — styled to look ' +
  'like a button (background, padding, border-radius) using a plain <div> or <span>, with zero click ' +
  'functionality of its own. Animation/motion is fine (CSS transitions, keyframes); interactivity/clicks are not. ' +
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

// ═══ HTML5 — MODIFIKIM (jo krijim i ri) — jep kodin EKZISTUES si baze, Claude e ndryshon
// vetem sipas kerkeses, duke ruajtur strukturen/imazhet/permasat ekzistuese ═══
const QELLIMI_HTML5_MODIFIKIM =
  'You are an expert HTML5 display ad designer. You will be given the EXISTING HTML code of a ' +
  'banner ad, followed by an instruction describing what to CHANGE. Modify the existing HTML ' +
  'according to the instruction, while KEEPING everything else (layout, images, structure, exact ' +
  'pixel dimensions, animations not mentioned in the instruction) exactly as it was — this is an ' +
  'edit, not a new design from scratch. ' +
  'CRITICAL — NO CLICKABLE ELEMENTS: this HTML will be embedded inside an OUTER click-through wrapper ' +
  'added by the ad platform (the entire banner becomes one single clickable link). Therefore your ' +
  'output must NEVER contain its own <a> tags, onclick handlers, <button> elements with functional ' +
  'behavior, or any JS click listeners. Any CTA text must be PURELY VISUAL (styled div/span, no ' +
  'click functionality of its own). ' +
  'Output ONLY the complete, updated raw HTML code, no markdown, no explanation, no backticks.';

async function modifikoHTML5(htmlEkzistues, pershkrimi) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY s'është konfiguruar te serveri.");
  const userMsg = 'EXISTING HTML:\n\n' + htmlEkzistues + '\n\nINSTRUCTION — what to change:\n' + pershkrimi;
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
      system: QELLIMI_HTML5_MODIFIKIM,
      messages: [{ role: 'user', content: userMsg }]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data && data.error && data.error.message) || 'Anthropic gabim');
  const tekstiRi = data.content && data.content.map(c => c.text || '').join('');
  if (!tekstiRi || !tekstiRi.includes('<')) throw new Error("Claude s'ktheu HTML të vlefshëm.");
  return tekstiRi;
}

module.exports = { gjeneroImazh, modifikoImazh, gjeneroVideo, gjeneroHTML5, modifikoHTML5 };
