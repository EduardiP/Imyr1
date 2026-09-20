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

ANKANDI I DYTE (nese ke ME SHUME se 1 reklame aktive te njekohesisht):
- Kur biznesi yt fiton hapesiren, dhe ke +2 reklama aktive, sistemi vendos VETE cilen prej reklamave te tua te shfaqe — jo ti manualisht.
- Faza fillestare: secila reklame merr radhe deri sa te ket 5 shikime REALE — pastaj fillon vleresimi.
- Formula: 1000 + (klikime×90) + (konvertime×25) − 0.6746×(shikime_pa_klikim)^1.9 [klikime/konvertime brenda 30-ditesh; shikimet_pa_klikim jane VETEM QE NGA klikimi i fundit i saj — PA kufi kohor, RIFILLON NE ZERO menjehere pas cdo klikim te ri].
- Praktikisht: nese nje reklame e jote shihet shume por s'klikohet asnjehere, pikët e saj bien gradualisht (jo-lineare, gjithnje e me shpejt) — por sapo merr edhe 1 klikim te vetem, kjo zbritje fshihet plotesisht, fillon nga zero.

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
- Kur borxhi eshte nen limit: sistemi merr 5 kandidatet me te mire (sipas peshes) nga secila pishine, i kalon nepermjet nje formule qe thellon dallimin mes te fortëve dhe te dobëtve (pa eliminuar plotesisht asnjeri), i mbledh ne 2 shuma (1 per Ankand, 1 per Balance).
- KORRIGJIM FLEKSIBEL (shtesë mbi limitin fiks): bizneset Ankand marrin pjese GJITHMONE me avantazh strukturor — u shtohen Piket e Profilit dhe Ndihma, kurre s'u zbritet asgje. Per ta balancuar, nese borxhi tregon qe Ankandi i detyrohet Balances, para short-it final zbritet nje korrigjim nga shuma e Ankandit — sa me i madh borxhi, aq me shpejt rritet zbritja (jo-lineare): p.sh. borxh=10 → zbritje 50 pike; borxh=20 → zbritje 180 pike. Kurre s'shkon nen zero (nese zbritja do ta bente negative, thjesht behet 0).
- Pastaj zgjidhet mes 2 shumave (Ankand pas korrigjimit, Balance pa ndryshim) me short te peshuar (jo mes bizneseve individuale drejtperdrejt).

CMIMI: Bizneset paguajne nje plan mujor per te perdorur platformen.

Ky eshte nje mjet software (SaaS) — gjithcka ndodh automatikisht permes algoritmit, jo me pune manuale.

═══ HARTA E NAVIGIMIT — KU TE SHKOJ PER CDO GJE ═══
Kjo eshte lista E PLOTE e cdo seksioni ne platforme. Perdore GJITHMONE per te drejtuar klientin drejt vendit te sakte, ME EMER TE SAKTE (p.sh. "shko te Settings → Category Limits"), PARA se te sugjerosh kontaktin me ekipin.

MENUJA KRYESORE (majtas):
- Dashboard: pamje e pergjithshme, statusi i llogarise, statistika te shpejta.
- Ad Space → "My spaces": kodi (snippet) qe biznesi vendos ne faqen e vet per te shfaqur reklamat e te tjereve; statusi i lidhjes. → "Set the size": percakton madhesite/dimensionet e hapesires se reklames.
- Creative → "Create": krijon materiale reklamash te reja (imazh/video/HTML5, me AI ose te ngarkuara). → "My creatives": lista e krijimeve ekzistuese, per t'i riperdorur ne reklama.
- My Ads → "Create": krijon nje reklame te re (perdor nje creative + link destinacioni). → "Ads": lista e reklamave aktive/pauzuara te biznesit, me shikime/klikime/konvertime dhe statusin "Health" (Learning/Failed/pike). → "Performance": analiza e detajuar per secilen reklame.
- Conversions: lidh/menaxhon gjurmimin e konvertimeve (URL-te e "faleminderit"/blerjes, ose zona te faqes).
- Analytics → "Traffic": grafikë te shfaqjeve/klikimeve/konvertimeve, ndare Received/Given. → "Pool selections": historiku i vendimeve Ankand-vs-Balance. → "Deficit"/"Balance": bilanci i dhene-kunder-marre (vetem per llogari Balance).
- Insights: rekomandime/analiza shtese te gjeneruara nga platforma.

MENUJA E PROFILIT (ikona lart djathtas):
- Profile: te dhenat baze te biznesit (emri, email, logo).
- Team & Roles: fton anetare te tjere ne ekip, cakton role/leje.
- Billing & Plan: statusi i planit (Falas/Premium), dite te mbetura ne periudhen falas, aktivizimi i Premium, anulimi i abonimit.
- Settings → "Account": te dhena llogarie, fjalekalimi, "Platform promotion" (lejo PhronexusAI te shfaqe promovimin e vet ne hapesiren tende). → "Ad Delivery": zgjedh menyren e shperndarjes (automatike apo manuale) per reklamat e biznesit. → "Category Limits": ZGJEDH SAKTESISHT cilat KATEGORI biznesesh LEJOHEN te shfaqin reklama ne hapesiren TENDE — KETU shkon klienti kur do te NDALOJE nje ose disa kategori specifike (thjesht CHEKBOX per te hequr nje kategori nga lista e lejuar).
- Help & Support: kjo faqe e chat-it, plus mundesia per te kontaktuar ekipin njerezor.

RREGULL KRITIK: nese pyetja e klientit ka NJE PERGJIGJE VETE-SHERBIMI ketu siper (nje faqe/buton/toggle qe VETE mund ta perdore), DREJTOJE ATJE DIREKT, me emrin e sakte te seksionit — MOS sugjero kontaktin me ekipin per gjera qe klienti mund t'i beje vete. Kontakto ekipin VETEM kur ceshtja eshte VERTETE teknike (instalim kodi qe s'funksionon), specifike per llogarine (qe kerkon nderhyrje manuale nga stafi), ose kur asnje faqe e listes siper s'e mbulon kerkesen.
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
- Nese pyetja ka pergjigje ne "HARTA E NAVIGIMIT" me poshte (nje faqe/cilesim qe klienti VETE mund ta ndryshoje), DREJTOJE ATJE, me emrin e sakte te seksionit — kjo eshte PERGJIGJA E PARE qe duhet dhene, PARA cdo mendimi per kontaktin me ekipin.
- Nese s'e di pergjigjen ose eshte teknike (vendosje kodi qe s'funksionon), thuaj qe per ndihme teknike me kodin ka nje asistent te vecante te seksioni i hapesires se reklames ose konvertimeve.
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

const kreativeModul = require('./kreative');
const MESAZHE_FALAS_MUAJ = 70;

module.exports = function (app, pool) {
  // Endpoint publik (para DHE pas login) — streaming fjale-per-fjale
  app.post('/api/suport', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI s\'eshte konfiguruar.' });
    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) return res.status(400).json({ error: 'Mungojne mesazhet.' });

    // Resolvo biznesId nga sesioni, NESE eshte i loguar — VIZITORET PUBLIK (pa cookie)
    // MBETEN GJITHMONE pa limit fare (vlere e madhe, e njohur per konvertim klientesh te rinj).
    let biznesId = null;
    const token = req.cookies && req.cookies.imyr_session;
    if (token) {
      try {
        const r = await pool.query('SELECT biznes_id FROM seancat WHERE token=$1', [token]);
        if (r.rows.length) {
          const idLogimi = r.rows[0].biznes_id;
          const bizR = await pool.query(
            'SELECT pronari_biznes_id, eshte_anetar_ekipi FROM bizneset WHERE id=$1', [idLogimi]);
          const eshteAnetar = bizR.rows.length && bizR.rows[0].eshte_anetar_ekipi && bizR.rows[0].pronari_biznes_id;
          biznesId = eshteAnetar ? bizR.rows[0].pronari_biznes_id : idLogimi;
        }
      } catch (e) {}
    }
    const iLoguar = !!biznesId;

    // Limiti (VETEM per te loguarit, jo publikun) — nese arrihet, kthe automatikisht
    // nje mesazh "upgrade" ne vend te thirrjes OpenAI (kursen edhe koston e API-t).
    if (biznesId) {
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS chat_perdorimi (
          id SERIAL PRIMARY KEY, biznes_id INTEGER NOT NULL REFERENCES bizneset(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
        const premium = await kreativeModul.eshtePremium(pool, biznesId);
        if (!premium) {
          const rr = await pool.query(
            `SELECT COUNT(*)::int AS n FROM chat_perdorimi
             WHERE biznes_id=$1 AND created_at > now() - interval '30 days'`, [biznesId]);
          if (rr.rows[0].n >= MESAZHE_FALAS_MUAJ) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.write("You've reached this month's free support-chat limit. Upgrade to Premium for unlimited AI support — go to Billing & Plan in your profile menu, or visit phronexusai.com/app/plan");
            return res.end();
          }
          await pool.query('INSERT INTO chat_perdorimi (biznes_id) VALUES ($1)', [biznesId]);
        }
      } catch (e) { /* nese kontrolli deshton, vazhdo normalisht — mos e ndal shërbimin */ }
    }

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
