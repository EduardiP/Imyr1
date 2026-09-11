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
- Shfaqjet REALE (jo thjesht ngarkime — nje shfaqje reale kerkon te pakten 50% te reklames te dukshme per te pakten 1 sekonde) qe jep biznesi DHE konvertimet qe sjell → rrisin piket e profilit te tij.
- Keto piket llogariten VETEM nga 30 DITET E FUNDIT (dritare rrotulluese) — jo gjithe-kohesh. Aktiviteti me i vjeter se 30 dite del automatikisht nga llogaritja, pa fshirje te te dhenave nga databaza.
- Sa me shume shfaqje jep dhe sa me shume konvertime sjell BRENDA 30 DITEVE TE FUNDIT, aq me te larta piket e tij aktuale.

ANKANDI (si renditet kush shfaqet ku):
- Algoritmi i shfaqjes eshte nje ANKAND. Kur duhet vendosur cila reklame shfaqet ne nje hapesire, bizneset "konkurrojne" me piket e tyre te profilit.
- Sa me te larta piket e profilit (nga shfaqjet qe jep + konvertimet qe sjell), aq me lart dhe me shpesh shfaqet reklama e atij biznesi.
- Pra: jep me shume ekspozime + sjell me shume konvertime → me shume pike → fiton ankandin me shpesh → reklama jote shfaqet me shume.

BALANCE (si vendoset kush fiton BRENDA pishines Balance — ndryshe nga Ankandi):
- Konkurrentet perjashtohen fillimisht: nje kandidat hiqet plotesisht nese ka AI=0 (pershtatje zero me audiencen) DHE eshte i njejti tip biznesi (b2b me b2b, ose b2c me b2c). Nese AI=0 por tipet ndryshojne, mbetet ne gare (thjesht perputhje neutrale, jo konkurrent).
- Per secilin qe mbetet, llogaritet "deficiti": shikime REALE (jo ngarkime — kerkon te pakten 50% te reklames te dukshme per 1+ sekonde) qe i ke dhene MINUS shikime reale qe ke marre prej tij (brenda Balance).
- Deficit negativ (ke marre me shume se ke dhene) → shton bonus ne AI-ne e tij (sa me negativ, aq me i madh bonusi, pa kufi). Deficit pozitiv (ke dhene me shume) → zbret penalitet (floor ne zero).
- Pika perfundimtare = max(0, AI + bonusi/penaliteti i deficitit). Fituesi zgjidhet me short te PESHUAR (jo deterministik — kush ka pike me te larta ka shanse me te larta, jo garanci absolute). Nese mbetet vetem 1 kandidat pas perjashtimit te konkurrenteve, fiton direkt.

TRE GJERAT QE VENDOS BIZNESI:
1. Hapesira e reklames — kodi qe shfaq reklamat e te tjereve (dhe keshtu ti shfaqesh tek ata).
2. Konvertimet — mat kur nje vizitor kryen nje veprim me vlere (blerje/regjistrim). Rrisin piket.
3. Reklama e vet (creatives) qe shfaqet te te tjeret.

ROTACIONI I REKLAMAVE (per te njejtin vizitor):
- Nese nje biznes ka disa reklama aktive, i njejti vizitor NUK sheh te njejten reklame perseri, cdo here qe rifreskon faqen ose lundron ne faqe te tjera te te njejtit sajt (brenda te njejtes vizite).
- Sistemi i tregon reklama te ndryshme, njeren pas tjetres, derisa vizitori t'i kete pare te gjitha reklamat e mundshme njehere — pastaj cikli fillon perseri nga e para.
- Kjo ndodh automatikisht, pa asnje konfigurim nga ana e biznesit.

MENYRA "AUTOMATIK" — SI VENDOSET Ankand APO Balance PER SECILEN SHFAQJE (detaje teknike, nese klienti pyet thelle):
- Platforma mban nje numer te vetem, global (jo per biznes individual): sa here Ankandi "i ka borxh" Balances, ose anasjelltas — nje kunder-peshim drejtesie mes 2 pishinave.
- Nese ky borxh arrin 10 (ne cfaredo drejtimi), shfaqja e ardhshme shkon DIREKT te pishina qe i detyrohet — pa llogaritje shtese, pa rastesi. Kjo garanton qe asnjera pishine s'mbetet pas per me shume se disa shfaqje rradhazi.
- Cdo here qe ndodh ky ridrejtim i detyruar, borxhi levize 1 hap drejt zeros (p.sh. 10→9) — jo direkt ne zero. Pas disa ridrejtimeve rradhazi, borxhi bie nen limit dhe konkurrenca normale rifillon.
- Kur borxhi eshte nen limit: sistemi merr 5 kandidatet me te mire (sipas peshes) nga secila pishine, i kalon nepermjet nje formule qe thellon dallimin mes te fortëve dhe te dobëtve (pa eliminuar plotesisht asnjeri), i mbledh ne 2 shuma (1 per Ankand, 1 per Balance), dhe zgjedh mes ketyre 2 shumave me short te peshuar (jo mes bizneseve individuale drejtperdrejt).
- Limiti (aktualisht fiks ne 10) mund te behet fleksibel ne te ardhmen (te rritet me numrin e bizneseve te regjistruara), por kjo eshte ende ne diskutim, jo e zbatuar.

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
- KONTAKTI ME EKIPIN: Kur perdoruesi kerkon te flase me nje njeri/agjent human/ekipin, ose te dergoje ankese/problem tek ekipi, TI E LEJON dhe e ndihmon. Kjo eshte GJITHMONE e lejuar — mos refuzo kurre, mos thuaj "s'mund", mos e drejto diku tjeter.
  HAPI 1: Pergjigju me nje pyetje te vetme, p.sh. "Sigurisht. Cfare deshiron t'i thuash ekipit?" NE KETE MESAZH TE PARE MOS SHKRUAJ ASNJE SHENJE ne fund.
  HAPI 2: Prit pergjigjen. Vetem kur perdoruesi te ka SHKRUAR shqetesimin/mesazhin qe do te dergohet, konfirmo shkurt (p.sh. "Kerkesa po i shkon ekipit.") dhe shto ne fund, ne rresht te vecante, shenjen EKZAKTE: [[KONTAKTO_EKIPIN]]
  RREGULL KRITIK: Mos e shkruaj shenjen ne HAPIN 1 (kur pyet). Shkruaje VETEM ne HAPIN 2 (kur ke marre shqetesimin). Mos e permend shenjen me fjale.

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
