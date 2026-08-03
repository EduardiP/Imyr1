// suporti.js — Asistent suporti i pergjithshem (FAQ) me nje model te lire.
// Ndryshe nga asistenti.js (Claude Opus per kod), ky eshte per pyetje te pergjithshme.
// Shfaqet para dhe pas login. Server.js: require('./suporti')(app, pool);

const MODEL = process.env.OPENAI_MODEL_SUPORT || 'gpt-4o-mini';
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Njohuria baze per PhronexusAI (FAQ). Kete e pasuron me kohe.
const NJOHURIA = `
PhronexusAI eshte nje rrjet cross-promocioni (jep-e-merr) ku bizneset PLOTESUESE promovojne njeri-tjetrin.

SI FUNKSIONON:
- Biznesi regjistrohet dhe pershkruan cfare ofron.
- Algoritmi yne e cifteon automatikisht me biznese plotesuese (JO konkurrente).
- Biznesi vendos nje kod te vogel te faqja e vet dhe shfaq reklamat e bizneseve plotesuese.
- Ne kembim, reklama e tij shfaqet te faqet e te tjereve.
- Sa me shume ekspozime jep, aq me shume shfaqet edhe reklama e tij.

TRE GJERAT QE VENDOS BIZNESI:
1. Hapesira e reklames (kodi qe shfaq reklamat e te tjereve).
2. Konvertimet (mat kur nje vizitor kryen nje veprim me vlere — blerje/regjistrim).
3. Reklama e vet (creatives) qe shfaqet te te tjeret.

KONVERTIMET: sa me shume konvertime te sjelle nje biznes, aq me lart del ne renditje dhe aq me shume shfaqet reklama e tij.

CROSS-PROMOCIONI: te faqja e nje biznesi shfaqen VETEM biznese plotesuese, kurre konkurrenca. Kete e siguron algoritmi i ciftimit.

CMIMI: Bizneset paguajne nje plan mujor per te perdorur platformen. (Detajet e planeve jane duke u finalizuar.)

Ky eshte nje mjet software (SaaS) — gjithcka ndodh automatikisht permes algoritmit, jo me pune manuale.
`;

function ndertoSystem(iLoguar) {
  return `Ti je asistenti i suportit i PhronexusAI (phronexusai.com).
Detyra: ndihmo perdoruesit me pyetje te pergjithshme per platformen — si funksionon, cmimet, si te regjistrohen, cfare eshte cross-promocioni.

RREGULLA:
- Pergjigju GJITHMONE ne gjuhen qe perdor perdoruesi.
- Shkruaj tekst te thjeshte, PA Markdown (pa yje, pa # tituj).
- Ji i shkurter dhe i qarte: 1-4 fjali zakonisht.
- Referoju platformes GJITHMONE si "PhronexusAI".
- Mos kerko te dhena te ndjeshme.
- Nese s'e di pergjigjen ose eshte teknike (vendosje kodi), thuaj qe per ndihme teknike me kodin ka nje asistent te vecante te seksioni i hapesires se reklames ose konvertimeve.
- ${iLoguar ? 'Perdoruesi eshte i loguar (ka nje llogari).' : 'Perdoruesi NUK eshte i loguar ende (vizitor). Nx ic-e te regjistrohet nese ka kuptim.'}

NJOHURIA PER PLATFORMEN:
${NJOHURIA}`;
}

async function pyet(apiKey, system, mesazhet) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'system', content: system }, ...mesazhet]
    })
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error('OpenAI ' + resp.status + ': ' + t.slice(0, 200));
  }
  const data = await resp.json();
  return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
}

module.exports = function (app, pool) {
  // Endpoint publik (para DHE pas login) — s'kerkon iLoguar
  app.post('/api/suport', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI s\'eshte konfiguruar.' });
    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) return res.status(400).json({ error: 'Mungojne mesazhet.' });
    const iLoguar = !!(req.cookies && req.cookies.imyr_session);  // shenje nese eshte i loguar
    try {
      const system = ndertoSystem(iLoguar);
      const hist = mesazhet.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
      }));
      const pergjigje = await pyet(apiKey, system, hist);
      res.json({ pergjigje });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
