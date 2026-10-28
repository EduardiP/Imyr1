// pxse-vektoret.js (PhronexusAI) — filtri i lire me "embeddings" (OpenAI text-embedding-3-small): a ka lidhje nje postim
// me ate qe ofron klienti. Tani eshte vetem MATJE: asgje nuk shkon te AI-ja nano dhe asgje nuk i shtohet sinjaleve te klientit.
// Server.js e therret PAS pxse-reddit-ditore.js: require('./pxse-vektoret')(app, pool, iAdmin);
//
// Si funksionon:
//  - Profili i llogarise = pershkrimi i biznesit + 7 termat e studimit te pare (8 vektore, ne kujtese).
//  - Cdo postim kthehet ne vektor NJE here (edhe kur vlen per disa llogari). Pikët (0-100) = ngjashmeria me e larte
//    me profilin (kosinus x 100). "Pranuar" kur pikët >= pragu.
//  - Ruhen TE GJITHA postimet (te pranuara dhe te refuzuara) per 7 dite, qe admin-i te shohe ku duhet vendosur pragu.
//  - Vetem per llogarite qe kane email-in te PXSE_SINJALET_VETEM (pa variabel: per askend).
// Admin: GET /api/admin/pxse/vektoret (JSON) dhe GET /api/admin/pxse/vektoret/pamja (faqe me tabele).
// Variabla: OPENAI_API_KEY (ekziston). Opsionale: PXSE_VEKTORET_PRAGU (paracaktim 35).
const crypto = require('crypto');
const { pxseFetchKohe } = require('./pxse-prova');

const PXVK_MODELI = 'text-embedding-3-small';
const PXVK_PRAGU_BAZE = 35;
const PXVK_NE_THIRRJE = 200;     // tekste ne nje thirrje te OpenAI
const PXVK_GJATESIA = 800;       // karaktere nga cdo postim per vektorin (~150-200 token)
const PXVK_DITE = 7;             // sa dite ruhen postimet e matura

const pxvkPragu = () => { const n = parseInt(process.env.PXSE_VEKTORET_PRAGU, 10); return n > 0 && n < 100 ? n : PXVK_PRAGU_BAZE; };
const pxvkLejuarit = () => String(process.env.PXSE_SINJALET_VETEM || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const pxvkCelesi = () => String(process.env.OPENAI_API_KEY || '').trim();

// Vektoret nga OpenAI (te normalizuar: ngjashmeria = prodhimi skalar)
async function pxvkVektoret(tekste) {
  const dalja = [];
  for (let i = 0; i < tekste.length; i += PXVK_NE_THIRRJE) {
    const pjesa = tekste.slice(i, i + PXVK_NE_THIRRJE).map(t => String(t || ' ').replace(/\s+/g, ' ').trim().slice(0, PXVK_GJATESIA) || ' ');
    let d = null;
    for (let prove = 0; prove < 2 && !d; prove++) {
      const r = await pxseFetchKohe('https://api.openai.com/v1/embeddings', { method: 'POST',
        headers: { Authorization: 'Bearer ' + pxvkCelesi(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: PXVK_MODELI, input: pjesa }) }, 60000);
      const j = await r.json().catch(() => null);
      if (r.ok && j && Array.isArray(j.data)) d = j;
      else if (r.status === 429 && prove === 0) await new Promise(f => setTimeout(f, 5000));
      else throw new Error('OpenAI embeddings: ' + ((j && j.error && j.error.message) || ('HTTP ' + r.status)));
    }
    d.data.sort((a, b) => a.index - b.index).forEach(x => dalja.push(x.embedding));
  }
  return dalja;
}
function pxvkPiket(v, profili) {
  let m = -1;
  for (const p of profili) { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * p[i]; if (s > m) m = s; }
  return Math.max(0, Math.min(100, Math.round(m * 100)));
}

module.exports = function (app, pool, iAdmin) {
  (async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS pxse_vektoret_matje (
      id BIGSERIAL PRIMARY KEY,
      biznes_id INT NOT NULL,
      burimi TEXT NOT NULL,              -- hn | se | ih | reddit | alerts
      url TEXT NOT NULL,
      titulli TEXT,
      teksti TEXT,
      vendi TEXT,
      publikuar TIMESTAMPTZ,
      pike INT NOT NULL,                 -- 0-100 nga filtri i lire
      prag INT NOT NULL,                 -- pragu ne momentin e matjes
      pranuar BOOLEAN NOT NULL,          -- pike >= prag
      ai_pranuar BOOLEAN,                -- vetem Reddit: a e pranoi AI-ja nano (per krahasim); null per te tjeret
      ardhur_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (biznes_id, url)
    )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxvk_biz_pike ON pxse_vektoret_matje (biznes_id, burimi, pike DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pxvk_ardhur ON pxse_vektoret_matje (ardhur_at)');
  })().catch(e => console.error('pxse-vektoret migrim:', e.message));

  // Fshirja pas 7 ditesh
  const pxvkPastro = () => pool.query(`DELETE FROM pxse_vektoret_matje WHERE ardhur_at < now() - interval '${PXVK_DITE} days'`).catch(() => {});
  setTimeout(pxvkPastro, 5 * 60000).unref();
  setInterval(pxvkPastro, 3600000).unref();

  // Llogarite qe maten: email-i te PXSE_SINJALET_VETEM dhe kane studimin e pare (termat)
  async function pxvkLlogarite() {
    const l = pxvkLejuarit(); if (!l.length) return [];
    const r = await pool.query(`SELECT DISTINCT ON (r.biznes_id) r.biznes_id, r.te_dhenat, r.krijuar_at FROM pxse_prova_rezultate r
      JOIN bizneset b ON b.id = r.biznes_id
      WHERE r.biznes_id IS NOT NULL AND r.sherbimi='sinjale' AND lower(b.email) = ANY($1::text[]) ORDER BY r.biznes_id, r.id DESC`, [l]);
    return r.rows.filter(x => x.te_dhenat && Array.isArray(x.te_dhenat.termat) && x.te_dhenat.termat.length);
  }
  async function pxvkMatet(biznesId) {
    const l = pxvkLejuarit(); if (!l.length || !biznesId) return false;
    try { const r = await pool.query('SELECT lower(email) e FROM bizneset WHERE id=$1', [biznesId]); return !!(r.rows[0] && l.includes(r.rows[0].e)); }
    catch (e) { return false; }
  }

  // Profili (8 vektore) i nje llogarie, ne kujtese; rillogaritet kur ndryshon pershkrimi ose termat
  const pxvkProfilet = new Map();
  async function pxvkProfili(biznesId, td) {
    const tekste = [String(td.pershkrimi || '')].concat((td.termat || []).slice(0, 7)).map(x => String(x || '').trim()).filter(Boolean);
    const h = crypto.createHash('sha256').update(tekste.join('\n')).digest('hex');
    const k = pxvkProfilet.get(biznesId);
    if (k && k.h === h) return k.v;
    const v = await pxvkVektoret(tekste);
    pxvkProfilet.set(biznesId, { h, v });
    return v;
  }

  // Mat postimet per llogarite e dhena dhe i ruan te gjitha. aiPranuar: Set me URL-te qe AI-ja nano i pranoi (vetem Reddit) ose null.
  // Kthen { postime, te_reja, pranuar } per cdo llogari.
  async function pxvkRegjistro(llogarite, burimi, postimet, aiPranuar) {
    if (!pxvkCelesi() || !llogarite.length || !postimet.length) return {};
    const unike = new Map(); postimet.forEach(x => { if (x && x.url && !unike.has(x.url)) unike.set(x.url, x); });
    const urlet = Array.from(unike.keys());
    // Cilat postime i duhen cdo llogarie (ato qe s'jane matur me pare)
    const nevoja = new Map(), teGjitha = new Set();
    for (const ll of llogarite) {
      const ek = await pool.query('SELECT url FROM pxse_vektoret_matje WHERE biznes_id=$1 AND url = ANY($2::text[])', [ll.biznes_id, urlet]);
      const ka = new Set(ek.rows.map(x => x.url));
      const duhen = urlet.filter(u => !ka.has(u)); nevoja.set(ll.biznes_id, duhen); duhen.forEach(u => teGjitha.add(u));
    }
    const lista = Array.from(teGjitha);
    if (!lista.length) return {};
    const vek = await pxvkVektoret(lista.map(u => { const x = unike.get(u); return (x.titulli || '') + ' — ' + (x.teksti || ''); }));
    const sipasUrl = new Map(lista.map((u, i) => [u, vek[i]]));
    const prag = pxvkPragu(), dalja = {};
    for (const ll of llogarite) {
      const duhen = nevoja.get(ll.biznes_id); if (!duhen.length) continue;
      const profili = await pxvkProfili(ll.biznes_id, ll.te_dhenat || {});
      const rreshta = duhen.map(u => {
        const x = unike.get(u), pike = pxvkPiket(sipasUrl.get(u), profili);
        return { url: u, titulli: String(x.titulli || '').slice(0, 300), teksti: String(x.teksti || '').slice(0, 400), vendi: String(x.vendi || '').slice(0, 80),
          publikuar: x.publikuar || null, pike, pranuar: pike >= prag, ai: aiPranuar ? aiPranuar.has(u) : null };
      });
      for (let i = 0; i < rreshta.length; i += 500) {
        await pool.query(`INSERT INTO pxse_vektoret_matje (biznes_id, burimi, url, titulli, teksti, vendi, publikuar, pike, prag, pranuar, ai_pranuar)
          SELECT $1, $2, x.url, x.titulli, x.teksti, x.vendi, x.publikuar, x.pike, $3, x.pranuar, x.ai
          FROM jsonb_to_recordset($4::jsonb) AS x(url text, titulli text, teksti text, vendi text, publikuar timestamptz, pike int, pranuar boolean, ai boolean)
          ON CONFLICT (biznes_id, url) DO NOTHING`, [ll.biznes_id, burimi, prag, JSON.stringify(rreshta.slice(i, i + 500))]);
      }
      dalja[ll.biznes_id] = { postime: urlet.length, te_reja: rreshta.length, pranuar: rreshta.filter(x => x.pranuar).length };
    }
    return dalja;
  }

  app.locals.pxseVektoret = { aktiv: () => !!pxvkCelesi(), llogarite: pxvkLlogarite, matet: pxvkMatet, regjistro: pxvkRegjistro, pragu: pxvkPragu };

  // ---------- Admin ----------
  app.get('/api/admin/pxse/vektoret', iAdmin, async (req, res) => {
    try {
      const burimi = String(req.query.burimi || ''), pr = String(req.query.pranuar || ''), faqe = Math.max(0, parseInt(req.query.faqe, 10) || 0);
      const biz = parseInt(req.query.biznes_id, 10) || 0;
      const tot = await pool.query(`SELECT burimi, COUNT(*)::int total, COUNT(*) FILTER (WHERE pranuar)::int pranuar, COUNT(*) FILTER (WHERE NOT pranuar)::int refuzuar,
          COUNT(*) FILTER (WHERE ai_pranuar)::int ai_pranuar, COUNT(*) FILTER (WHERE ai_pranuar AND pranuar)::int ai_dhe_filtri,
          MIN(ardhur_at) nga, MAX(ardhur_at) deri FROM pxse_vektoret_matje WHERE ($1 = 0 OR biznes_id = $1) GROUP BY burimi ORDER BY burimi`, [biz]);
      const kushti = `($1 = 0 OR biznes_id = $1) AND ($2 = '' OR burimi = $2) AND ($3 = '' OR pranuar = ($3 = 'po'))`;
      const n = await pool.query('SELECT COUNT(*)::int n FROM pxse_vektoret_matje WHERE ' + kushti, [biz, burimi, pr]);
      const r = await pool.query(`SELECT biznes_id, burimi, url, titulli, teksti, vendi, publikuar, pike, prag, pranuar, ai_pranuar, ardhur_at FROM pxse_vektoret_matje
        WHERE ${kushti} ORDER BY pike DESC, id DESC LIMIT 100 OFFSET $4`, [biz, burimi, pr, faqe * 100]);
      res.json({ ok: true, pragu: pxvkPragu(), llogarite: pxvkLejuarit().length, totalet: tot.rows, total: n.rows[0].n, faqe, postimet: r.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Faqe e thjeshte per admin-in (shqip): numrat dhe te gjitha postimet nga pikët me te larta
  app.get('/api/admin/pxse/vektoret/pamja', iAdmin, (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Filtri i lire – matja</title><style>
:root{--bg:#f6f7fb;--k:#fff;--t:#161a26;--z:#5b6472;--v:#dfe3ea;--ok:#127a3a;--jo:#b42318;--th:#4f46e5}
@media (prefers-color-scheme:dark){:root{--bg:#0f1220;--k:#171b2e;--t:#e8eaf2;--z:#9aa3b5;--v:#2a3048;--ok:#4ade80;--jo:#f87171;--th:#818cf8}}
body{margin:0;background:var(--bg);color:var(--t);font:14px/1.45 system-ui,sans-serif}main{max-width:1200px;margin:0 auto;padding:20px 16px}
h1{font-size:20px;margin:0 0 4px}p.z{color:var(--z);margin:0 0 16px}.kubet{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-bottom:16px}
.kub{background:var(--k);border:1px solid var(--v);border-radius:10px;padding:10px 12px}.kub b{font-size:15px}.kub div{color:var(--z);font-size:12px}
.filtrat{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}select,button{font:inherit;padding:6px 10px;border-radius:8px;border:1px solid var(--v);background:var(--k);color:var(--t)}
.tab{width:100%;border-collapse:collapse;background:var(--k);border:1px solid var(--v);border-radius:10px;overflow:hidden}.tab td,.tab th{padding:8px 10px;border-bottom:1px solid var(--v);vertical-align:top;text-align:left}
.tab th{font-size:12px;color:var(--z)}.p{font-weight:700;font-size:16px}.ok{color:var(--ok)}.jo{color:var(--jo)}a{color:var(--th)}.tx{color:var(--z);font-size:12px;margin-top:2px;overflow-wrap:anywhere}
.wrap{overflow-x:auto}</style></head><body><main>
<h1>Filtri i lirë – matja</h1><p class="z" id="info">Duke ngarkuar…</p><div class="kubet" id="kubet"></div>
<div class="filtrat"><select id="fb"><option value="">Të gjitha burimet</option><option value="hn">Hacker News</option><option value="se">Stack Exchange</option><option value="ih">Indie Hackers</option><option value="reddit">Reddit</option><option value="alerts">Google Alerts</option></select>
<select id="fp"><option value="">Pranuar + refuzuar</option><option value="po">Vetëm të pranuarat</option><option value="jo">Vetëm të refuzuarat</option></select>
<button id="mb">‹ Mbrapa</button><button id="pa">Para ›</button><span id="fq" class="z"></span></div>
<div class="wrap"><table class="tab"><thead><tr><th>Pikët</th><th>Filtri</th><th>AI nano</th><th>Burimi</th><th>Postimi</th><th>Ardhur</th></tr></thead><tbody id="tb"></tbody></table></div>
<script>
var faqe=0, EM={hn:'Hacker News',se:'Stack Exchange',ih:'Indie Hackers',reddit:'Reddit',alerts:'Google Alerts'};
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function d(x){return x?new Date(x).toLocaleString('sq-AL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';}
function ngarko(){var b=document.getElementById('fb').value,p=document.getElementById('fp').value;
fetch('/api/admin/pxse/vektoret?burimi='+encodeURIComponent(b)+'&pranuar='+encodeURIComponent(p)+'&faqe='+faqe).then(function(r){return r.json();}).then(function(j){
if(j.error){document.getElementById('info').textContent=j.error;return;}
document.getElementById('info').textContent='Pragu: '+j.pragu+' pikë (pranohen ato me '+j.pragu+' ose më shumë). Postimet ruhen 7 ditë. Gjithsej në këtë filtër: '+j.total+'.';
document.getElementById('kubet').innerHTML=j.totalet.map(function(t){return '<div class="kub"><b>'+h(EM[t.burimi]||t.burimi)+'</b><div>Gjithsej '+t.total+' · <span class="ok">pranuar '+t.pranuar+'</span> · <span class="jo">refuzuar '+t.refuzuar+'</span></div>'+(t.burimi==='reddit'?'<div>AI nano pranoi '+t.ai_pranuar+' (nga to filtri pranoi '+t.ai_dhe_filtri+')</div>':'')+'<div>'+d(t.nga)+' – '+d(t.deri)+'</div></div>';}).join('')||'<div class="kub">Ende pa të dhëna.</div>';
document.getElementById('fq').textContent='Faqja '+(faqe+1)+' nga '+Math.max(1,Math.ceil(j.total/100));
document.getElementById('tb').innerHTML=j.postimet.map(function(x){return '<tr><td class="p">'+x.pike+'</td><td class="'+(x.pranuar?'ok">Pranuar':'jo">Refuzuar')+'</td><td>'+(x.ai_pranuar===null?'–':(x.ai_pranuar?'<span class="ok">Po</span>':'<span class="jo">Jo</span>'))+'</td><td>'+h(EM[x.burimi]||x.burimi)+'<div class="tx">'+h(x.vendi)+'</div></td><td><a href="'+h(x.url)+'" target="_blank" rel="noopener noreferrer">'+h(x.titulli||x.url)+'</a><div class="tx">'+h(x.teksti)+'</div></td><td class="tx">'+d(x.ardhur_at)+'</td></tr>';}).join('');
});}
document.getElementById('fb').onchange=document.getElementById('fp').onchange=function(){faqe=0;ngarko();};
document.getElementById('mb').onclick=function(){if(faqe>0){faqe--;ngarko();}};document.getElementById('pa').onclick=function(){faqe++;ngarko();};
ngarko();
</script></main></body></html>`);
  });
};
