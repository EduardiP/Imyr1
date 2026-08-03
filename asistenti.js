// asistenti.js — Asistent me Claude qE ndihmon klientin tE vendosE kodin (snippet/konvertim).
// Perdor tE dhEnat e platformEs (nga studimi i URL-sE) pEr tE udhEzuar saktE.
// Ruajtja: vetEm kodi i vendosur + ku u vendos (jo gjithE biseda) — pEr heqje tE mEvonshme.
// Server.js: require('./asistenti')(app, pool, iLoguar);

const MODELI = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';

// Ndertimi i udhezimit te sistemit — njohuria per Imyr + platforma e klientit
function ndertoSystem(biz, konteksti) {
  const detaje = [];
  if (biz.platforma && biz.platforma !== 'Kod i personalizuar (i panjohur)') detaje.push('Platforma: ' + biz.platforma);
  try {
    const d = JSON.parse(biz.platforma_detaje || '[]');
    d.forEach(x => detaje.push(x.etiketa + ': ' + x.vlera));
  } catch (e) {}
  const platTekst = detaje.length ? detaje.join('\n') : 'E panjohur (kod i personalizuar).';

  let kontekstTekst = '';
  if (konteksti === 'reklama') {
    kontekstTekst = '\n\nKONTEKSTI TANI: Klienti eshte te seksioni i HAPESIRES SE REKLAMES — po perpiqet te vendose kodin qe SHFAQ reklamat te nje vend specifik i faqes. Fokusohu te kodi i reklames (imyr.js), pervec nese klienti pyet ndryshe.';
  } else if (konteksti === 'konvertim') {
    kontekstTekst = '\n\nKONTEKSTI TANI: Klienti eshte te seksioni i KONVERTIMEVE. Ketu ka tri gjera: (1) snippet-i i gjurmimit (imyr-track.js) qe shkon para </body> te skedari kryesor; (2) gjurmim me URL (adresa e faqes se suksesit); (3) gjurmim me kod (window.imyr && imyr.konvertim). Fokusohu ketu, jo te reklama.';
    // Nese klienti ka vendosur me pare kodin e reklames, perdore si referencE (i njejti skedar shpesh)
    if (biz.kodi_vendi) {
      kontekstTekst += '\n\nREFERENCE: Heren e fundit klienti e vendosi kodin ketu: "' + String(biz.kodi_vendi).slice(0,500) + '". Snippet-i i gjurmimit shpesh shkon te i njejti skedar — perdore kete si pikenisje per ta udhezuar.';
    }
  }

  return `Ti je asistenti i Imyr (phronexusai.com), nje rrjet cross-promocioni ku bizneset shfaqin reklamat e njeri-tjetrit.
Detyra jote: ndihmo klientin te vendose kodin e Imyr te faqja e vet, hap-pas-hapi.

RREGULLA TE RENDESISHME:
- Pergjigju GJITHMONE ne te njejten gjuhe qe perdor klienti (anglisht, shqip, etj.). Shkruaj drejt e sakte ne ate gjuhe.
- Shkruaj tekst te thjeshte, PA Markdown: pa yje (**), pa # tituj, pa numerim me formatim te rende.
- BISEDO GRADUALISHT, si nje person real: JEP NJE HAP OSE NJE IDE NE NJE MESAZH, jo gjithcka pernjehere. Prit pergjigjen para se te vazhdosh me hapin tjeter.
- Ji i SHKURTER: 1-3 fjali per mesazh. Mos e mbush klientin me tekst te gjate.
- Mos kerko te dhena te ndjeshme (fjalekalime, te dhena kartash).
- Nese klienti te jep nje cope kodi (buton, <head>), analizoje dhe thuaj sakte ku ta shtoje.

HISTORIA:
Bisedes i eshte bere tashme nje pyetje hyrese ne anglisht: cfare e pengon klientin ose me cfare ka nevoje per ndihme (p.sh. s'di cilin skedar te ndryshoje, s'di ku ne kod shkon, s'ka akses, ose dicka tjeter). MERRE PARASYSH kete pyetje kur lexon pergjigjen e klientit — pergjigja e tij i pergjigjet asaj. Mos e perserit pyetjen. Vazhdo prej andej. Pergjigju ne gjuhen e klientit.

TRE LLOJET E KODIT (per referencen tende):
1. Kodi i gjurmimit (imyr-track.js) — shkon te skedari kryesor para </body>, ne cdo faqe.
2. Kodi i reklamave (imyr.js) — shkon aty ku klienti do te shfaqet reklama (nje vend specifik).
3. Kodi i konvertimit — ose me URL (faqja e suksesit) ose me kod: window.imyr && imyr.konvertim('emri') te butoni.

TE DHENAT E FAQES SE KETIJ KLIENTI (nga studimi automatik):
${platTekst}${kontekstTekst}

Perdor keto te dhena per te dhene udhezim specifik. Nese di platformen, mos e pyet perseri per te.`;
}

// Nxjerr VETEM kodin e vendosur + vendin nga biseda (nje thirrje e shkurter Claude).
// Biseda vete NUK ruhet — vetem esenca.
async function nxirrKodinVendin(apiKey, biseda) {
  const teksti = biseda.map(m => (m.role === 'user' ? 'Klienti: ' : 'Asistenti: ') + m.content).join('\n');
  const system = `Nga biseda mE poshtE, nxirr VETEM: (1) kodin qE klienti vendosi te faqja, (2) vendin ku e vendosi (skedari/paneli + pozicioni).
Kthe VETEM njE objekt JSON, pa asgjE tjetEr, ne formEn: {"kodi":"...","vendi":"..."}
Nese s'ka informacion tE mjaftueshEm, kthe {"kodi":"","vendi":""}.`;
  try {
    const p = await pyetClaude(apiKey, system, [{ role: 'user', content: teksti.slice(0, 8000) }]);
    const m = p.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (e) {}
  return { kodi: '', vendi: '' };
}

async function pyetClaude(apiKey, system, mesazhet) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODELI,
      max_tokens: 1024,
      system: system,
      messages: mesazhet
    })
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('Claude API ' + resp.status + ': ' + txt.slice(0, 300));
  }
  const data = await resp.json();
  return (data.content || []).map(c => c.type === 'text' ? c.text : '').join('\n').trim();
}

module.exports = function (app, pool, iLoguar) {
  // Migrim: ruaj vetem kodin e vendosur + ku u vendos (per heqje te mevonshme)
  (async () => {
    try {
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendosur TEXT`);
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendi TEXT`);
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendosur_at TIMESTAMPTZ`);
    } catch (e) {}
  })();

  // Bisedё me asistentin
  app.post('/api/asistenti', iLoguar, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY s\'eshte vendosur te serveri.' });

    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) return res.status(400).json({ error: 'Mungojne mesazhet.' });

    try {
      const b = await pool.query(
        'SELECT platforma, platforma_detaje, website, kodi_vendi FROM bizneset WHERE id=$1', [req.biznesId]);
      const biz = b.rows[0] || {};
      const konteksti = (req.body && req.body.konteksti) || 'reklama';
      const system = ndertoSystem(biz, konteksti);
      // Kufizo historikun ne 12 mesazhet e fundit (kosto)
      const hist = mesazhet.slice(-12).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 4000)
      }));
      const pergjigje = await pyetClaude(apiKey, system, hist);
      res.json({ pergjigje });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Kur lidhja konfirmohet e suksesshme: nxirr kodin+vendin NGA biseda, ruaj VETEM ato.
  app.post('/api/asistenti/ruaj-vendin', iLoguar, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const biseda = (req.body && req.body.mesazhet) || [];
    try {
      let kodi = '', vendi = '';
      if (apiKey && Array.isArray(biseda) && biseda.length) {
        const nx = await nxirrKodinVendin(apiKey, biseda);
        kodi = (nx.kodi || '').slice(0, 2000);
        vendi = (nx.vendi || '').slice(0, 1000);
      }
      // fallback: nese u dha direkt
      if (!kodi && req.body && req.body.kodi) kodi = String(req.body.kodi).slice(0, 2000);
      if (!vendi && req.body && req.body.vendi) vendi = String(req.body.vendi).slice(0, 1000);

      await pool.query(
        'UPDATE bizneset SET kodi_vendosur=$1, kodi_vendi=$2, kodi_vendosur_at=now() WHERE id=$3',
        [kodi, vendi, req.biznesId]);
      res.json({ ok: true, kodi, vendi });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
