// asistenti.js — Asistent me Claude qE ndihmon klientin tE vendosE kodin (snippet/konvertim).
// Perdor tE dhEnat e platformEs (nga studimi i URL-sE) pEr tE udhEzuar saktE.
// Ruajtja: vetEm kodi i vendosur + ku u vendos (jo gjithE biseda) — pEr heqje tE mEvonshme.
// Server.js: require('./asistenti')(app, pool, iLoguar);

const MODELI = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';

// Ndertimi i udhezimit te sistemit — njohuria per Imyr + platforma e klientit
function ndertoSystem(biz) {
  const detaje = [];
  if (biz.platforma && biz.platforma !== 'Kod i personalizuar (i panjohur)') detaje.push('Platforma: ' + biz.platforma);
  try {
    const d = JSON.parse(biz.platforma_detaje || '[]');
    d.forEach(x => detaje.push(x.etiketa + ': ' + x.vlera));
  } catch (e) {}
  const platTekst = detaje.length ? detaje.join('\n') : 'E panjohur (kod i personalizuar).';

  return `Ti je asistenti i Imyr (phronexusai.com), njE rrjet cross-promocioni ku bizneset shfaqin reklamat e njEri-tjetrit.
Detyra jote: ndihmo klientin tE vendosE kodin e Imyr te faqja e vet, hap-pas-hapi, me gjuhE tE thjeshtE.

RREGULLA:
- Fol shqip, thjeshtE, si pEr dikE qE s'ka njohuri teknike.
- Ji konkret: thuaj SAKTE ku shkon kodi (cili skedar/panel, para/pas cilit rresht).
- Mos kErko tE dhEna tE ndjeshme (fjalEkalime, tE dhEna kartash).
- Nese klienti tE jep njE copE kodi (buton, <head>), analizoje dhe thuaj saktE ku ta shtojE.
- Nese s'je i sigurt, bEj njE pyetje tE thjeshtE jo-teknike (p.sh. "Me cfarE e ke ndErtuar faqen?").
- Mos u zgjat kot — pErgjigje tE shkurtra, tE qarta, hap-pas-hapi.

TRE LLOJET E KODIT:
1. Kodi i gjurmimit (imyr-track.js) — shkon te skedari kryesor para </body>, ne CDO faqe.
2. Kodi i reklamave (imyr.js) — shkon aty ku klienti do tE shfaqet reklama (njE vend specifik).
3. Kodi i konvertimit — ose me URL (faqja e suksesit) ose me kod (window.imyr && imyr.konvertim('emri')) te butoni/veprimi.
   FORMA E SIGURT gjithmonE: window.imyr && imyr.konvertim('emri') — s'e prish butonin nese snippet-i mungon.

TE DHENAT E FAQES SE KETIJ KLIENTI (nga studimi automatik):
${platTekst}

Perdor kEto tE dhEna pEr tE dhEnE udhEzim specifik pEr platformEn e tij.`;
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
        'SELECT platforma, platforma_detaje, website FROM bizneset WHERE id=$1', [req.biznesId]);
      const biz = b.rows[0] || {};
      const system = ndertoSystem(biz);
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

  // Ruaj vetem kodin e vendosur + vendin (nje here, per lidhje). Perdoret per heqje me vone.
  app.post('/api/asistenti/ruaj-vendin', iLoguar, async (req, res) => {
    const kodi = ((req.body && req.body.kodi) || '').slice(0, 2000);
    const vendi = ((req.body && req.body.vendi) || '').slice(0, 1000);
    try {
      await pool.query(
        'UPDATE bizneset SET kodi_vendosur=$1, kodi_vendi=$2, kodi_vendosur_at=now() WHERE id=$3',
        [kodi, vendi, req.biznesId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
