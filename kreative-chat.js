// kreative-chat.js — Chat AI sqarues, para gjenerimit real (Imazh/Video/HTML5).
// Qellimi: klienti shkruan si mendon vet (cdo gjuhe), AI-ja bën pyetje sqaruese
// (ne te njejten gjuhe), dhe ne fund kthen nje pershkrim te DETAJUAR ne ANGLISHT,
// gati per t'u derguar te modeli gjenerues (Flux/Wan/Claude-HTML5).
//
// Model: DeepSeek (deepseek-klient.js) — shume i lire, i mjaftueshem per bisede
// te strukturuar. Nese cilesia del e dobet (p.sh. me shqip), ndryshohet lehte
// vetem duke zevendesuar require('./deepseek-klient') me nje klient tjeter.
//
// Server.js e therret: require('./kreative-chat')(app, pool, iLoguar);
// Endpoint: POST /api/kreative/chat  { mesazhet: [{role,content}], lloji }

const deepseek = require('./deepseek-klient');

function sistemiPrompt(lloji, biznesi) {
  const llojiEtiketa = { imazh: 'an image', video: 'a video', html5: 'an HTML5 banner' }[lloji] || 'an advertisement';

  let kontekstiBiznesit = '';
  if (biznesi) {
    kontekstiBiznesit = '\n\nIMPORTANT — WHO YOU ARE HELPING: you are assisting "' + (biznesi.emri || 'this business') +
      '"' + (biznesi.website ? (' (' + biznesi.website + ')') : '') + '. ' +
      (biznesi.permbledhje ? ('Here is what this business offers: ' + biznesi.permbledhje + '. ') : '') +
      (biznesi.kategoria_kryesore ? ('Category: ' + biznesi.kategoria_kryesore + '. ') : '') +
      (biznesi.tipi ? ('Audience type: ' + (biznesi.tipi === 'b2b' ? 'B2B (businesses)' : biznesi.tipi === 'b2c' ? 'B2C (consumers)' : 'both B2B and B2C') + '. ') : '') +
      'USE this context proactively — you already know what they sell and to whom, so do NOT ask basic questions ' +
      'like "what does your business do" or "who is your target audience" unless the user\'s request genuinely ' +
      'contradicts or goes beyond this profile. Jump straight to more useful, specific clarifying questions ' +
      '(offer/promotion details, visual style, must-include text) since the business context is already known.';
  }

  return 'You are a helpful assistant that helps a business owner clarify what advertisement ' +
    '(' + llojiEtiketa + ') they want an AI to generate.' + kontekstiBiznesit + ' ' +
    'If the user\'s message is exactly "[FILLIMI]", this means the conversation is just starting and ' +
    'the user has not written anything yet — YOU must start: greet briefly and ask what they would like ' +
    'to advertise. Default to ALBANIAN for this opening message, since this is an Albanian-language platform. ' +
    'ALWAYS respond in the SAME LANGUAGE the user is writing in from then on (they may switch to any language) ' +
    'while you ask your clarifying questions — never switch language on your own once the user has picked one. ' +
    '\n\nNEVER ask about pixel dimensions, banner size, or width/height (e.g. "300x250", "728x90"). ' +
    'The exact size is ALREADY configured separately by the user in a dedicated size-picker elsewhere in the ' +
    'form — it is completely outside this conversation and none of your concern. Do not mention it, do not ' +
    'ask about it, do not include size/dimensions in your final description.' +
    '\n\nNEVER ask whether a CTA text/button should be "clickable". In this system, the ENTIRE banner is ' +
    'always wrapped by a single external click-through link added outside the generated HTML/image — nothing ' +
    'inside the creative itself is ever its own separate clickable element. Any CTA (e.g. "Shop Now") is purely ' +
    'VISUAL styling (looks like a button), never an actual link/button with its own click behavior. Do not ' +
    'ask about this, and do not describe any element as "clickable" in your final description.' +
    '\n\nIMPORTANT — REFERENCE MATERIALS: the user can upload/select image, video, or code files as reference ' +
    'material for the ad. Each one is ALWAYS labeled with a code in the exact format "mtN" (mt1, mt2, mt3, ...). ' +
    'You will NOT see the actual file (no vision access) — but whenever the user mentions an identifier like ' +
    '"mt1" or "mt2", or you see a system note like "[Klienti sapo shtoi një material referues, i identifikuar ' +
    'si \'mtN\'...]", treat it as a REAL uploaded file that genuinely exists — never say you don\'t have access ' +
    'to it or that you don\'t recognize it. If it would help, briefly ask the user what mtN shows/represents ' +
    '(e.g. "product photo", "logo", "background"). In your final English description, reference these materials ' +
    'by their exact code (e.g. "use mt1 as the main product image, mt2 as the logo in the corner") whenever relevant.' +
    '\n\nAsk SHORT clarifying questions, ONE AT A TIME, about anything essential that is missing: ' +
    'what product/service, target audience, key message or offer, must-include text or call-to-action, ' +
    'preferred colors/style/mood, anything visual that matters. ' +
    'Do not ask more than 4 questions total — once you have enough to work with, stop asking. ' +
    'When you have enough detail (usually after 2-4 exchanges), respond with ONLY a raw JSON object, ' +
    'nothing else, no markdown, no backticks, NO explanation before or after it — the ENTIRE response must ' +
    'be parseable JSON and nothing else: {"gati": true, "pershkrim_anglisht": "<a detailed, vivid, ' +
    'complete description in ENGLISH for an AI image/video generator, including every important detail ' +
    'the user mentioned, even if the user wrote to you in another language>"}. ' +
    'Before that point, respond with ONLY plain text — your next question, nothing else, no JSON, no preamble. ' +
    '\n\nIMPORTANT: this system automatically sends your final description to the actual image/video/HTML ' +
    'generator the moment the user clicks the "Generate" button — the user does NOT need to copy anything, ' +
    'does NOT need an external tool, and you must NEVER suggest they use DALL-E, Midjourney, or any other ' +
    'external service themselves. If the user asks "can you send it yourself" or "what do I do now" after ' +
    'you\'ve already provided the description, simply reassure them the system handles delivery automatically ' +
    'once they click the Generate button in the app — do not explain how AI image generators work in general.';
}

module.exports = function (app, pool, iLoguar) {

  app.post('/api/kreative/chat', iLoguar, async (req, res) => {
    const lloji = ((req.body && req.body.lloji) || 'imazh').trim();
    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) {
      return res.status(400).json({ error: 'Duhet të dërgohet të paktën një mesazh.' });
    }
    try {
      // Merr profilin e biznesit PARA se te thirret AI — ashtu qe AI-ja ta njohe klientin
      // qe nga fillimi, pa kerkuar klientit te shpjegoje vete cfare ofron biznesi i tij.
      let biznesi = null;
      try {
        const bizRow = await pool.query(
          'SELECT emri, website, permbledhje, pershkrimi, kategoria_kryesore, tipi FROM bizneset WHERE id=$1',
          [req.biznesId]);
        if (bizRow.rows.length) {
          const b = bizRow.rows[0];
          biznesi = { emri: b.emri, website: b.website, permbledhje: b.permbledhje || b.pershkrimi,
            kategoria_kryesore: b.kategoria_kryesore, tipi: b.tipi };
        }
      } catch (e) { /* fail-open — nese s'gjendet dot profili, vazhdo pa te, mos e ndal biseden */ }

      const teksti = await deepseek.pyetDeepSeek(mesazhet, sistemiPrompt(lloji, biznesi));

      // Provo ta lexojme si JSON perfundimtar {gati:true, pershkrim_anglisht:...} — KUDO
      // ne tekst (jo vetem ne fillim), sepse DeepSeek ndonjehere shton fjali shpjeguese
      // para/pas JSON-it, edhe pse i thame "VETEM JSON". startsWith('{') deshtonte ne ate rast.
      let ejashtme = null;
      const jsonMatch = teksti.match(/\{[\s\S]*"gati"[\s\S]*\}/);
      if (jsonMatch) {
        try { ejashtme = JSON.parse(jsonMatch[0]); } catch (e) { ejashtme = null; }
      }
      if (ejashtme && ejashtme.gati && ejashtme.pershkrim_anglisht) {
        return res.json({ gati: true, pershkrim_anglisht: ejashtme.pershkrim_anglisht });
      }
      // Perndryshe, eshte pyetje e re sqaruese (tekst i thjeshte)
      return res.json({ gati: false, pyetje: teksti });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};
