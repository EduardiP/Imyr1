// suporti.js — Asistent suporti i pergjithshem (FAQ) me nje model te lire.
// Ndryshe nga asistenti.js (Claude Opus per kod), ky eshte per pyetje te pergjithshme.
// Shfaqet para dhe pas login. Server.js: require('./suporti')(app, pool);

const MODEL = process.env.OPENAI_MODEL_SUPORT || 'gpt-4o-mini';
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Njohuria baze per PhronexusAI (FAQ). Kete e pasuron me kohe.
const NJOHURIA = `
PhronexusAI eshte nje rrjet cross-promocioni (jep-e-merr) ku bizneset PLOTESUESE promovojne njeri-tjetrin.

PARIMI JEP-E-MERR (per hapesiren e reklames):
- Per te shfaqur reklamat e te tjereve, biznesi vendos nje kod te faqja e vet.
- DUKE lejuar qe te shfaqen reklamat e te tjereve te faqja e tij, ai fiton te drejten qe edhe reklama e TIJ te shfaqet te faqet e te tjereve.
- Pra: lejon te tjeret te shfaqen tek ti → ti shfaqesh tek ata. Eshte i ndersjelle.

KOMBINIMI (ne fillim, automatik):
- Kur nje biznes regjistrohet, PhronexusAI ben automatikisht nje kombinim te tij me CDO biznes tjeter ne platforme.
- Ky kombinim nxjerr sa PLOTESUES eshte secili biznes per tjetrin (jo konkurrent).
- Rezultati: te faqja e nje biznesi shfaqen VETEM biznese plotesuese, kurre konkurrenca.

PIKET E PROFILIT:
- Shfaqjet (ekspozimet) qe jep biznesi DHE konvertimet qe sjell → rrisin piket e profilit te tij.
- Sa me shume shfaqje jep dhe sa me shume konvertime sjell, aq me te larta piket e tij.

ANKANDI (si renditet kush shfaqet ku):
- Algoritmi i shfaqjes eshte nje ANKAND. Kur duhet vendosur cila reklame shfaqet ne nje hapesire, bizneset "konkurrojne" me piket e tyre te profilit.
- Sa me te larta piket e profilit (nga shfaqjet qe jep + konvertimet qe sjell), aq me lart dhe me shpesh shfaqet reklama e atij biznesi.
- Pra: jep me shume ekspozime + sjell me shume konvertime → me shume pike → fiton ankandin me shpesh → reklama jote shfaqet me shume.

TRE GJERAT QE VENDOS BIZNESI:
1. Hapesira e reklames — kodi qe shfaq reklamat e te tjereve (dhe keshtu ti shfaqesh tek ata).
2. Konvertimet — mat kur nje vizitor kryen nje veprim me vlere (blerje/regjistrim). Rrisin piket.
3. Reklama e vet (creatives) qe shfaqet te te tjeret.

CMIMI: Bizneset paguajne nje plan mujor per te perdorur platformen.

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
- KONTAKTI ME EKIPIN: nese perdoruesi kerkon te flase me nje NJERI, nje agjent human, ekipin, ose te dergoje nje ankese/problem te ekipi (jo thjesht pyetje qe mund t'i pergjigjesh vete), atehere: (1) pyete shkurt cfare deshiron t'i thote ekipit; (2) kur ai e shkruan shqetesimin, mbylle pergjigjen tende me kete shenje EKZAKTE ne fund, ne nje rresht te vetem: [[KONTAKTO_EKIPIN]] — dhe asgje pas saj. Kete shenje shkruaje VETEM kur ke marre tashme shqetesimin e sakte qe do t'i cohet ekipit, jo me pare. Mos e permend shenjen me fjale; thjesht vendose ne fund.
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
  // Endpoint publik (para DHE pas login) — streaming fjale-per-fjale
  app.post('/api/suport', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI s\'eshte konfiguruar.' });
    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) return res.status(400).json({ error: 'Mungojne mesazhet.' });
    const iLoguar = !!(req.cookies && req.cookies.imyr_session);
    try {
      const system = ndertoSystem(iLoguar);
      const hist = mesazhet.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
      }));
      // Kerko streaming nga OpenAI
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: MODEL, max_tokens: 500, stream: true,
          messages: [{ role: 'system', content: system }, ...hist]
        })
      });
      if (!resp.ok) {
        const t = await resp.text();
        return res.status(500).json({ error: 'OpenAI ' + resp.status + ': ' + t.slice(0, 200) });
      }
      // Dergo copezat te klienti si text/event-stream
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const rreshtat = buf.split('\n');
        buf = rreshtat.pop();
        for (const rr of rreshtat) {
          const l = rr.trim();
          if (!l.startsWith('data:')) continue;
          const data = l.slice(5).trim();
          if (data === '[DONE]') { res.end(); return; }
          try {
            const j = JSON.parse(data);
            const copa = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (copa) res.write(copa);
          } catch (e) {}
        }
      }
      res.end();
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: e.message });
      else res.end();
    }
  });
};
