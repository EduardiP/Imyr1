// kreative-chat.js — Chat AI sqarues, para gjenerimit real (Imazh/Video/HTML5).
// Qellimi: klienti shkruan si mendon vet (cdo gjuhe), AI-ja bën pyetje sqaruese
// (ne te njejten gjuhe), dhe ne fund kthen nje pershkrim te DETAJUAR ne ANGLISHT,
// gati per t'u derguar te modeli gjenerues (Flux/Wan/Claude-HTML5).
//
// Model: DeepSeek (deepseek-klient.js) — shume i lire, i mjaftueshem per bisede
// te strukturuar. Nese cilesia del e dobet (p.sh. me shqip), ndryshohet lehte
// vetem duke zevendesuar require('./deepseek-klient') me nje klient tjeter.
//
// Server.js e therret: require('./kreative-chat')(app, iLoguar);
// Endpoint: POST /api/kreative/chat  { mesazhet: [{role,content}], lloji }

const deepseek = require('./deepseek-klient');

function sistemiPrompt(lloji) {
  const llojiEtiketa = { imazh: 'an image', video: 'a video', html5: 'an HTML5 banner' }[lloji] || 'an advertisement';
  return 'You are a helpful assistant that helps a business owner clarify what advertisement ' +
    '(' + llojiEtiketa + ') they want an AI to generate. ' +
    'If the user\'s message is exactly "[FILLIMI]", this means the conversation is just starting and ' +
    'the user has not written anything yet — YOU must start: greet briefly and ask what they would like ' +
    'to advertise. Default to ALBANIAN for this opening message, since this is an Albanian-language platform. ' +
    'ALWAYS respond in the SAME LANGUAGE the user is writing in from then on (they may switch to any language) ' +
    'while you ask your clarifying questions — never switch language on your own once the user has picked one. ' +
    'Ask SHORT clarifying questions, ONE AT A TIME, about anything essential that is missing: ' +
    'what product/service, target audience, key message or offer, must-include text or call-to-action, ' +
    'preferred colors/style/mood, anything visual that matters. ' +
    'Do not ask more than 4 questions total — once you have enough to work with, stop asking. ' +
    'When you have enough detail (usually after 2-4 exchanges), respond with ONLY a raw JSON object, ' +
    'nothing else, no markdown, no backticks: {"gati": true, "pershkrim_anglisht": "<a detailed, vivid, ' +
    'complete description in ENGLISH for an AI image/video generator, including every important detail ' +
    'the user mentioned, even if the user wrote to you in another language>"}. ' +
    'Before that point, respond with ONLY plain text — your next question, nothing else, no JSON, no preamble.';
}

module.exports = function (app, iLoguar) {

  app.post('/api/kreative/chat', iLoguar, async (req, res) => {
    const lloji = ((req.body && req.body.lloji) || 'imazh').trim();
    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) {
      return res.status(400).json({ error: 'Duhet të dërgohet të paktën një mesazh.' });
    }
    try {
      const teksti = await deepseek.pyetDeepSeek(mesazhet, sistemiPrompt(lloji));

      // Provo ta lexojme si JSON perfundimtar {gati:true, pershkrim_anglisht:...}
      let ejashtme = null;
      if (teksti.startsWith('{')) {
        try { ejashtme = JSON.parse(teksti); } catch (e) { ejashtme = null; }
      }
      if (ejashtme && ejashtme.gati && ejashtme.pershkrim_anglisht) {
        return res.json({ gati: true, pershkrim_anglisht: ejashtme.pershkrim_anglisht });
      }
      // Perndryshe, eshte pyetje e re sqaruese (tekst i thjeshte)
      return res.json({ gati: false, pyetje: teksti });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

};
