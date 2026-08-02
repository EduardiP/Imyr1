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
    html = (await resp.text()).slice(0, 300000);
    arritur = true;
  } catch (e) { arritur = false; }

  if (!arritur) {
    return { arritur: false, platforma: null, siguria: 0, detaje: [],
      mesazh: 'S\'e arritEm dot faqen automatikisht (mund tE jetE e mbrojtur ose pas login-it). Do tE vazhdojmE me pyetje.' };
  }

  const setCookie = headers['set-cookie'] || '';

  // ── Identifiko platformEn kryesore (per emrin + udhezimet) ──
  let platEmri = I_PANJOHUR.emri, platId = 'i_panjohur', siguria = 0, udhezime = I_PANJOHUR.udhezime;
  for (const r of RREGULLAT) {
    let pikE = 0;
    (r.html || []).forEach(rx => { if (rx.test(html)) pikE++; });
    (r.headers || []).forEach(([h, rx]) => { if (headers[h] && rx.test(headers[h])) pikE += 2; });
    if (pikE > 0) { platEmri = r.emri; platId = r.id; siguria = Math.min(99, 60 + pikE * 15); udhezime = r.udhezime; break; }
  }

  // ── Mblidh DETAJE teknike (aq sa mundet; nese s'ofrohet → nuk shtohet) ──
  const detaje = [];
  const shto = (etiketa, vlera) => { if (vlera) detaje.push({ etiketa, vlera }); };

  // 1. Platforma (gjithmone)
  shto('Platforma', platEmri === I_PANJOHUR.emri ? null : platEmri);

  // 2. Versioni / Generator (CMS + versioni)
  let mg = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
  if (mg) shto('Generator/Versioni', mg[1]);

  // 3. Tema/template aktive (WordPress lE rrugEn e temEs)
  let tema = html.match(/\/wp-content\/themes\/([a-z0-9_-]+)/i);
  if (tema) shto('Tema aktive (WordPress)', tema[1]);
  // Shopify tema (nga Shopify.theme)
  let shTema = html.match(/Shopify\.theme\s*=\s*{[^}]*"name":"([^"]+)"/i);
  if (shTema) shto('Tema aktive (Shopify)', shTema[1]);

  // 4. Framework
  let framework = null;
  if (/\/_next\//i.test(html) || headers['x-powered-by'] && /next/i.test(headers['x-powered-by'])) framework = 'Next.js (React)';
  else if (/nuxt/i.test(html)) framework = 'Nuxt (Vue)';
  else if (/ng-version/i.test(html)) framework = 'Angular';
  else if (/data-svelte|__SVELTEKIT/i.test(html)) framework = 'Svelte/SvelteKit';
  else if (/data-reactroot|<div id=["']root["']|\/static\/js\/main\.[a-z0-9]+\.js/i.test(html)) framework = 'React';
  else if (/<div id=["']app["']|__VUE__|data-v-app/i.test(html)) framework = 'Vue';
  else if (/_astro\//i.test(html)) framework = 'Astro';
  shto('Framework', framework);

  // 5. Gjuha
  let gjuha = null;
  if (/PHPSESSID/i.test(setCookie) || /\.php(\?|["'\s>])/i.test(html)) gjuha = 'PHP';
  else if (headers['x-powered-by'] && /express|next/i.test(headers['x-powered-by'])) gjuha = 'Node.js';
  else if (/csrftoken|django/i.test(setCookie)) gjuha = 'Python (Django)';
  else if (/laravel_session/i.test(setCookie)) gjuha = 'PHP (Laravel)';
  else if (/_rails|rack\.session/i.test(setCookie)) gjuha = 'Ruby on Rails';
  else if (/asp\.net|ASPXAUTH/i.test(setCookie) || headers['x-powered-by'] && /asp\.net/i.test(headers['x-powered-by'])) gjuha = 'ASP.NET (C#)';
  shto('Gjuha/Backend', gjuha);

  // 6. Serveri
  shto('Server', headers['server']);
  shto('Powered-By', headers['x-powered-by']);

  // 7. Hosting / ku eshte ruajtur
  let hosting = null;
  if (headers['x-vercel-id'] || /vercel/i.test(headers['server'] || '')) hosting = 'Vercel';
  else if (headers['x-nf-request-id']) hosting = 'Netlify';
  else if (/railway/i.test(headers['server'] || '')) hosting = 'Railway';
  else if (headers['x-render-origin-server']) hosting = 'Render';
  else if (/heroku/i.test(headers['via'] || '')) hosting = 'Heroku';
  else if (headers['x-served-by'] && /fastly/i.test(headers['x-served-by'])) hosting = 'Fastly CDN';
  shto('Hosting', hosting);

  // 8. CDN
  let cdn = null;
  if (headers['cf-ray'] || /cloudflare/i.test(headers['server'] || '')) cdn = 'Cloudflare';
  else if (headers['x-served-by'] && /fastly/i.test(headers['x-served-by'])) cdn = 'Fastly';
  else if (/akamai/i.test(headers['server'] || '')) cdn = 'Akamai';
  shto('CDN', cdn);

  // 9. Tipi (SPA apo HTML klasik)
  const spa = /<div id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(html) || /\/_next\//i.test(html) || framework === 'React' || framework === 'Vue' || framework === 'Angular';
  shto('Tipi', spa ? 'SPA (ndErtohet me JavaScript)' : 'HTML klasik (serveri jep pErmbajtjen)');

  // 10. E-commerce (dyqan?)
  let ecom = null;
  if (/woocommerce/i.test(html)) ecom = 'WooCommerce';
  else if (platId === 'shopify') ecom = 'Shopify checkout';
  else if (/magento/i.test(html)) ecom = 'Magento';
  else if (/bigcommerce/i.test(html)) ecom = 'BigCommerce';
  shto('E-commerce', ecom);

  // 11. Ka Google Tag Manager (vendi me i lehte per snippet-in)
  if (/googletagmanager\.com\/gtm/i.test(html)) shto('Google Tag Manager', 'PO — snippet-i mund tE vendoset kEtu lehtE');

  // 12. Ka Google Analytics
  if (/google-analytics\.com|gtag\/js|googletagmanager\.com\/gtag/i.test(html)) shto('Google Analytics', 'PO');

  // 13. Ku vendoset kodi (nga platforma)
  const kuKodi = {
    shopify: 'theme.liquid (Edit code)',
    wordpress: 'header.php i temEs, ose plugin GTM/WPCode',
    woocommerce: 'header.php i temEs, ose plugin',
    wix: 'Settings → Custom Code (panel)',
    squarespace: 'Settings → Code Injection (panel)',
    webflow: 'Project Settings → Custom Code (panel)',
    nextjs: 'app/layout.tsx ose pages/_app.js',
    react: 'public/index.html',
    vue: 'public/index.html'
  };
  shto('Ku vendoset kodi', kuKodi[platId] || null);

  // 14. Ka <head> / </body>
  shto('Ka <head>', /<head[\s>]/i.test(html) ? 'po' : 'jo');
  shto('Ka </body>', /<\/body>/i.test(html) ? 'po' : 'jo');

  return { arritur: true, platforma: platEmri, id: platId, siguria, udhezime, detaje,
    server: headers['server'] || null };
}

// Ruan rezultatin e zbulimit te bizneset (qe te mos ristudiohet çdo here)
async function ruajPlatformen(pool, bizId, url) {
  try {
    const r = await zbulo(url);
    await pool.query(
      `UPDATE bizneset SET platforma=$1, platforma_siguria=$2, platforma_detaje=$3, platforma_at=now() WHERE id=$4`,
      [r.platforma || null, r.siguria || 0, JSON.stringify(r.detaje || []), bizId]);
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
        // Merr website-in nga biznesi (ose url direkt)
        let faqja = url;
        if (!faqja && bizId) {
          const b = await pool.query('SELECT website FROM bizneset WHERE id=$1', [bizId]);
          if (b.rows.length) faqja = b.rows[0].website;
        }
        if (!faqja) return res.status(400).json({ error: 'Mungon website/url.' });
        // Studjo LIVE (qe te shohesh menjehere te dhenat e freskEta) dhe ruaj nese ka bizId
        const r = await zbulo(faqja);
        if (bizId) {
          await pool.query(
            `UPDATE bizneset SET platforma=$1, platforma_siguria=$2, platforma_detaje=$3, platforma_at=now() WHERE id=$4`,
            [r.platforma || null, r.siguria || 0, JSON.stringify(r.detaje || []), bizId]);
        }
        res.json(r);
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
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS platforma_detaje TEXT`);
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
