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
    // Nese klienti ka vendosur me pare kode (reklama/rrenja), perdori si referencE
    if (biz._referenca) {
      kontekstTekst += '\n\nREFERENCE nga implementimet e meparshme te ketij klienti:\n' + biz._referenca + '\nSnippet-i i gjurmimit shpesh shkon te i njejti skedar — perdore si pikenisje.';
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

// Nxjerr te dhenat e vlefshme nga biseda (nje thirrje e shkurter Claude).
// Biseda vete NUK ruhet — vetem esenca. Lexon GJITHE biseden (jo vetem hapin e fundit).
async function nxirrTeDhenat(apiKey, biseda, lloji) {
  const teksti = biseda.map(m => (m.role === 'user' ? 'Klienti: ' : 'Asistenti: ') + m.content).join('\n');
  const pershkrimLloji = {
    reklama: 'kodin e reklames (imyr.js) qe shfaq reklamat',
    rrenja: 'snippet-in e gjurmimit (imyr-track.js)',
    url: 'gjurmimin me URL (adresa e faqes se suksesit)',
    kod: 'gjurmimin me kod (imyr.konvertim te butoni/veprimi)'
  }[lloji] || 'kodin';
  const system = `Nga biseda me poshte (klienti + asistenti), nxirr te dhenat e vlefshme per ${pershkrimLloji}.
Lexo GJITHE biseden — klienti mund te kete dhene informacion te vlefshem qe ne fillim, jo vetem ne fund.
Kthe VETEM nje objekt JSON, pa asgje tjeter:
{"skedari":"emri i skedarit ku u vendos kodi (p.sh. theme.liquid, header.php, index.html) ose bosh nese s'dihet",
 "kodi":"kodi ose URL-ja qe u vendos, ose bosh",
 "shtesa":"cdo te dhene tjeter e dobishme per kete implementim (platforma, paneli, pozicioni, si u be) ose bosh"}
Nese s'ka informacion, kthe fusha bosh.`;
  try {
    const p = await pyetClaude(apiKey, system, [{ role: 'user', content: teksti.slice(0, 8000) }]);
    const m = p.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (e) {}
  return { skedari: '', kodi: '', shtesa: '' };
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
  // Migrim: tabela e implementimeve (nje rresht per cdo implementim te biznesit)
  (async () => {
    try {
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendosur TEXT`);
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendi TEXT`);
      await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kodi_vendosur_at TIMESTAMPTZ`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS implementimet (
          id SERIAL PRIMARY KEY,
          biznes_id INTEGER NOT NULL REFERENCES bizneset(id) ON DELETE CASCADE,
          lloji TEXT NOT NULL,          -- reklama | rrenja | url | kod
          skedari TEXT,                 -- emri i skedarit ku u vendos (kryesorja)
          kodi TEXT,                    -- kodi ose URL-ja
          shtesa TEXT,                  -- te dhena te tjera te dobishme
          krijuar_at TIMESTAMPTZ DEFAULT now(),
          perditesuar_at TIMESTAMPTZ DEFAULT now()
        )`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_implementimet_biznes ON implementimet(biznes_id)`);
    } catch (e) {}
  })();

  // Ruaj/perditeso nje implementim (nje per biznes+lloj). Perdoret nga te dyja seksionet.
  async function ruajImplementimin(biznesId, lloji, tedhena) {
    const { skedari, kodi, shtesa } = tedhena;
    // Nje implementim per (biznes, lloj) — perditeso nese ekziston, ndryshe fut
    const ekz = await pool.query('SELECT id FROM implementimet WHERE biznes_id=$1 AND lloji=$2', [biznesId, lloji]);
    if (ekz.rows.length) {
      await pool.query(
        'UPDATE implementimet SET skedari=$1, kodi=$2, shtesa=$3, perditesuar_at=now() WHERE id=$4',
        [skedari || null, kodi || null, shtesa || null, ekz.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO implementimet (biznes_id, lloji, skedari, kodi, shtesa) VALUES ($1,$2,$3,$4,$5)',
        [biznesId, lloji, skedari || null, kodi || null, shtesa || null]);
    }
  }

  // Bisedё me asistentin
  app.post('/api/asistenti', iLoguar, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY s\'eshte vendosur te serveri.' });

    const mesazhet = (req.body && req.body.mesazhet) || [];
    if (!Array.isArray(mesazhet) || !mesazhet.length) return res.status(400).json({ error: 'Mungojne mesazhet.' });

    try {
      const b = await pool.query(
        'SELECT platforma, platforma_detaje, website FROM bizneset WHERE id=$1', [req.biznesId]);
      const biz = b.rows[0] || {};
      const konteksti = (req.body && req.body.konteksti) || 'reklama';
      // Referenca nga implementimet e meparshme (skedari ku vendosi kodet)
      if (konteksti === 'konvertim') {
        const imp = await pool.query(
          "SELECT lloji, skedari FROM implementimet WHERE biznes_id=$1 AND skedari IS NOT NULL AND skedari<>'' ORDER BY perditesuar_at DESC LIMIT 4",
          [req.biznesId]);
        if (imp.rows.length) {
          biz._referenca = imp.rows.map(r => '- ' + r.lloji + ': ' + r.skedari).join('\n');
        }
      }
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

  // Kur lidhja konfirmohet: nxirr te dhenat NGA biseda, ruaji te tabela implementimet (sipas llojit).
  app.post('/api/asistenti/ruaj-vendin', iLoguar, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const biseda = (req.body && req.body.mesazhet) || [];
    const lloji = ((req.body && req.body.lloji) || 'reklama').trim();  // reklama|rrenja|url|kod
    try {
      let td = { skedari: '', kodi: '', shtesa: '' };
      if (apiKey && Array.isArray(biseda) && biseda.length) {
        td = await nxirrTeDhenat(apiKey, biseda, lloji);
      }
      // fallback: nese u dhane direkt
      if (!td.kodi && req.body && req.body.kodi) td.kodi = String(req.body.kodi);
      if (!td.skedari && req.body && req.body.skedari) td.skedari = String(req.body.skedari);
      // pastro gjatesite
      td.skedari = (td.skedari || '').slice(0, 500);
      td.kodi = (td.kodi || '').slice(0, 2000);
      td.shtesa = (td.shtesa || '').slice(0, 1500);

      await ruajImplementimin(req.biznesId, lloji, td);
      res.json({ ok: true, implementim: td });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Merr implementimet e biznesit (per t'i treguar kur klienti kthehet, ose per heqje)
  app.get('/api/asistenti/implementimet', iLoguar, async (req, res) => {
    try {
      const r = await pool.query(
        'SELECT lloji, skedari, kodi, shtesa, perditesuar_at FROM implementimet WHERE biznes_id=$1 ORDER BY perditesuar_at DESC',
        [req.biznesId]);
      res.json({ implementimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
