// platforma.js — Zbulon me çfarë është ndërtuar faqja e klientit vetëm nga URL-ja.
// Pa AI, pa kosto: bën një fetch, lexon headers + HTML, dhe njeh gjurmët e platformave.
// Server.js e thërret: require('./platforma')(app, pool, iLoguar);
// Endpoint: GET /api/platforma?url=...  → { platforma, siguria, detaje, udhezime }

// Gjurmët e secilës platformë. Secila ka: emrin, si njihet (te HTML ose headers),
// dhe udhëzimet ku shkon secili nga tre kodet (tracking / reklama / konvertim).
const RREGULLAT = [
  {
    id: 'shopify', emri: 'Shopify',
    html: [/cdn\.shopify\.com/i, /\/cdn\/shop\//i, /Shopify\.theme/i, /myshopify\.com/i],
    headers: [['x-shopid', /.*/], ['x-shopify-stage', /.*/], ['powered-by', /shopify/i]],
    udhezime: {
      tracking: 'Online Store → Themes → te tema aktive kliko "..." → Edit code → hap "theme.liquid" → ngjite kodin pak para rreshtit </head>.',
      reklama: 'Te "Edit code", hap seksionin ku do reklamën (p.sh. një "section" .liquid), ose shto një "Custom Liquid" block te faqja përmes Theme Editor, dhe ngjite kodin aty.',
      konvertim_url: 'URL-ja e konvertimit është faqja që hapet pas blerjes/regjistrimit (p.sh. faqja "Thank you" e checkout). Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton (jo faqe e re), na jep kodin e atij butoni dhe të tregojmë saktë ku ta shtosh.'
    }
  },
  {
    id: 'woocommerce', emri: 'WooCommerce (WordPress)',
    html: [/woocommerce/i, /wp-content\/plugins\/woocommerce/i],
    headers: [],
    udhezime: {
      tracking: 'Te WordPress: Appearance → Theme File Editor → hap "header.php" dhe ngjite kodin para </head>. Ose përdor një plugin si "Insert Headers and Footers".',
      reklama: 'Përdor një "Custom HTML" block te faqja/postimi ku do reklamën (Editor → shto bllok "Custom HTML"), dhe ngjite kodin.',
      konvertim_url: 'URL-ja e konvertimit është faqja "Order received / Thank you" pas blerjes. Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton, na jep kodin e butonit dhe të udhëzojmë.'
    }
  },
  {
    id: 'wordpress', emri: 'WordPress',
    html: [/wp-content\//i, /wp-includes\//i, /wp-json/i, /<meta name="generator" content="WordPress/i],
    headers: [['link', /wp\.org/i]],
    udhezime: {
      tracking: 'Appearance → Theme File Editor → "header.php" → ngjite para </head>. Më e thjeshtë: instalo plugin-in "Insert Headers and Footers" (WPCode) dhe ngjite kodin te "Header".',
      reklama: 'Shto një bllok "Custom HTML" te faqja/postimi ku do reklamën dhe ngjite kodin.',
      konvertim_url: 'URL-ja e konvertimit është faqja e faleminderimit pas veprimit (regjistrim/blerje). Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton, na jep kodin e butonit.'
    }
  },
  {
    id: 'wix', emri: 'Wix',
    html: [/static\.wixstatic\.com/i, /wix\.com/i, /_wixCssState/i],
    headers: [['x-wix-request-id', /.*/], ['server', /wix/i]],
    udhezime: {
      tracking: 'Te Wix: Settings → Custom Code → Add Custom Code → ngjite kodin, zgjidh "Head", dhe apliko te të gjitha faqet.',
      reklama: 'Shto një element "Embed → Custom Embeds → Embed HTML" (iframe/HTML) te vendi ku do reklamën.',
      konvertim_url: 'URL-ja e konvertimit është faqja që hapet pas veprimit. Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton, na jep kodin/veprimin e butonit.'
    }
  },
  {
    id: 'squarespace', emri: 'Squarespace',
    html: [/static1\.squarespace\.com/i, /squarespace\.com/i, /Static\.SQUARESPACE_CONTEXT/i],
    headers: [['x-servedby', /squarespace/i], ['server', /squarespace/i]],
    udhezime: {
      tracking: 'Settings → Advanced → Code Injection → ngjite kodin te "Header".',
      reklama: 'Shto një bllok "Code" te faqja ku do reklamën dhe ngjite kodin HTML.',
      konvertim_url: 'URL-ja e konvertimit është faqja pas veprimit. Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton, na jep kodin e butonit.'
    }
  },
  {
    id: 'webflow', emri: 'Webflow',
    html: [/assets\.website-files\.com/i, /assets-global\.website-files\.com/i, /webflow\.com/i, /data-wf-page/i],
    headers: [['server', /webflow/i]],
    udhezime: {
      tracking: 'Project Settings → Custom Code → ngjite kodin te "Head Code" (vlen për të gjithë faqet). Pastaj Publish.',
      reklama: 'Shto një element "Embed" te vendi ku do reklamën dhe ngjite kodin HTML.',
      konvertim_url: 'URL-ja e konvertimit është faqja pas veprimit. Kopjoje atë adresë.',
      konvertim_kod: 'Nëse konvertimi ndodh me buton, na jep kodin e butonit.'
    }
  },
  {
    id: 'nextjs', emri: 'Next.js',
    html: [/\/_next\/static\//i, /__NEXT_DATA__/i],
    headers: [['x-powered-by', /next\.js/i]],
    udhezime: {
      tracking: 'Te kodi: hap skedarin e layout-it kryesor (zakonisht "app/layout.tsx" te App Router, ose "pages/_app.js" / "pages/_document.js" te Pages Router) dhe shto kodin te <head> ose me komponentin <Script>.',
      reklama: 'Vendos një <div> te komponenti/faqja ku do reklamën dhe ngjite kodin aty.',
      konvertim_url: 'URL-ja e konvertimit është rruga (route) që hapet pas veprimit. Kopjoje atë adresë.',
      konvertim_kod: 'Konvertimi me kod: thirre imyr.konvertim() brenda funksionit që trajton suksesin (p.sh. pas fetch-it të pagesës). Na jep atë funksion dhe të udhëzojmë.'
    }
  },
  {
    id: 'react', emri: 'React (i personalizuar)',
    html: [/<div id="root">/i, /\/static\/js\/main\.[a-z0-9]+\.js/i],
    headers: [],
    udhezime: {
      tracking: 'Te kodi: shto kodin te "public/index.html" pak para </body> (aty ngarkohet për të gjithë aplikacionin).',
      reklama: 'Vendos një <div> te komponenti ku do reklamën dhe ngjite kodin.',
      konvertim_url: 'URL-ja e konvertimit është rruga që hapet pas veprimit.',
      konvertim_kod: 'Thirre imyr.konvertim() brenda funksionit që trajton suksesin (p.sh. handleSubmit pas pagesës). Na jep atë funksion.'
    }
  },
  {
    id: 'vue', emri: 'Vue',
    html: [/<div id="app">/i, /\/js\/app\.[a-z0-9]+\.js/i, /__VUE__/i],
    headers: [],
    udhezime: {
      tracking: 'Te kodi: shto kodin te "public/index.html" pak para </body>.',
      reklama: 'Vendos një <div> te komponenti ku do reklamën.',
      konvertim_url: 'URL-ja e konvertimit është rruga që hapet pas veprimit.',
      konvertim_kod: 'Thirre imyr.konvertim() brenda metodës që trajton suksesin. Na jep atë metodë.'
    }
  }
];

// Udhëzim i përgjithshëm kur platforma s'njihet (kod i personalizuar)
const I_PANJOHUR = {
  id: 'i_panjohur', emri: 'Kod i personalizuar (i panjohur)',
  udhezime: {
    tracking: 'Gjej skedarin kryesor që përmban <head> dhe </body> (zakonisht një layout ose template i përbashkët për të gjithë faqet — p.sh. layout.html, base.html, index.php, header.php) dhe shto kodin pak para </body>.',
    reklama: 'Vendos një <div> te vendi ku do reklamën dhe ngjite kodin aty.',
    konvertim_url: 'URL-ja e konvertimit është faqja që hapet pas veprimit (regjistrim/blerje). Kopjoje atë adresë.',
    konvertim_kod: 'Konvertimi me kod: na jep kodin e butonit ose funksionit ku ndodh veprimi, dhe të tregojmë saktë ku ta shtosh imyr.konvertim().'
  }
};

async function zbulo(url) {
  // Normalizo URL-në
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let headers = {};
  let html = '';
  let arritur = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const resp = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' }
    });
    clearTimeout(t);
    resp.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    html = (await resp.text()).slice(0, 200000);  // mjafton koka + fillimi
    arritur = true;
  } catch (e) { arritur = false; }

  if (!arritur) {
    return { arritur: false, platforma: null, siguria: 0,
      mesazh: 'S\'e arritëm dot faqen automatikisht (mund të jetë e mbrojtur ose pas login-it). Do të vazhdojmë me pyetje.' };
  }

  // Provo secilën rregull
  for (const r of RREGULLAT) {
    let pikë = 0, gjurmë = [];
    (r.html || []).forEach(rx => { if (rx.test(html)) { pikë++; gjurmë.push('html'); } });
    (r.headers || []).forEach(([h, rx]) => { if (headers[h] && rx.test(headers[h])) { pikë += 2; gjurmë.push('header:' + h); } });
    if (pikë > 0) {
      const siguria = Math.min(99, 60 + pikë * 15);  // sa më shumë gjurmë, aq më e sigurt
      return { arritur: true, platforma: r.emri, id: r.id, siguria, udhezime: r.udhezime,
        server: headers['server'] || null };
    }
  }

  // S'u njoh
  return { arritur: true, platforma: I_PANJOHUR.emri, id: 'i_panjohur', siguria: 0,
    udhezime: I_PANJOHUR.udhezime, server: headers['server'] || null };
}

// Ruan rezultatin e zbulimit te bizneset (qe te mos ristudiohet çdo here)
async function ruajPlatformen(pool, bizId, url) {
  try {
    const r = await zbulo(url);
    await pool.query(
      `UPDATE bizneset SET platforma=$1, platforma_siguria=$2, platforma_at=now() WHERE id=$3`,
      [r.platforma || null, r.siguria || 0, bizId]);
    return r;
  } catch (e) { return null; }
}

module.exports = function (app, pool, iLoguar, iAdmin) {
  app.get('/api/platforma', iLoguar, async (req, res) => {
    const url = (req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Mungon url.' });
    try {
      const r = await zbulo(url);
      res.json(r);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Version admin: shfaq te ruajturin nga databaza (ristudion vetem nese s'eshte studiuar ende)
  if (iAdmin) {
    app.get('/api/admin/platforma', iAdmin, async (req, res) => {
      const bizId = req.query.bizId;
      const url = (req.query.url || '').trim();
      try {
        if (bizId) {
          const b = await pool.query('SELECT website, platforma, platforma_siguria, platforma_at FROM bizneset WHERE id=$1', [bizId]);
          if (b.rows.length) {
            const row = b.rows[0];
            // E studiuar tashme → ktheje te ruajturin
            if (row.platforma_at) {
              const udh = udhezimetPer(row.platforma);
              return res.json({ arritur: true, platforma: row.platforma, siguria: row.platforma_siguria || 0,
                udhezime: udh, ekantshem: true, at: row.platforma_at });
            }
            // S'eshte studiuar → studjo tani, ruaj, ktheje
            if (row.website) {
              const r = await ruajPlatformen(pool, bizId, row.website);
              if (r) return res.json(r);
            }
          }
        }
        // Fallback: studim direkt nga url (pa ruajtur)
        if (url) { const r = await zbulo(url); return res.json(r); }
        res.status(400).json({ error: 'Mungon bizId ose url.' });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });
  }
};

// Kthen udhezimet per nje platforme te ruajtur (sipas emrit)
function udhezimetPer(emri) {
  const r = RREGULLAT.find(x => x.emri === emri);
  if (r) return r.udhezime;
  return I_PANJOHUR.udhezime;
}

module.exports.zbulo = zbulo;  // që ta përdorë edhe asistenti AI më vonë
module.exports.ruajPlatformen = ruajPlatformen;

// Migrim + studim i bizneseve ekzistuese (nje here, ne radhe, jo paralel).
module.exports.init = async function (pool) {
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS platforma TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS platforma_siguria INTEGER`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS platforma_at TIMESTAMPTZ`);

  // Studjo ne radhe bizneset qe kane URL (website) POR s'jane studiuar ende (platforma_at NULL).
  // Ne radhe (nje nga nje) qe te mos ngarkohet serveri me fetch paralel.
  try {
    const r = await pool.query(
      `SELECT id, website FROM bizneset
       WHERE website IS NOT NULL AND website <> '' AND platforma_at IS NULL`);
    for (const b of r.rows) {
      await ruajPlatformen(pool, b.id, b.website);
      await new Promise(res => setTimeout(res, 1500));  // pauze e vogel mes studimeve
    }
  } catch (e) {}
};
