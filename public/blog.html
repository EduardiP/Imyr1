// blog.js — blogu i PhronexusAI.
// Artikujt jane skedare .md te thjeshte ne dosjen content/blog/. Faqja e merr vetem ata qe jane gati.
//
// Formati i nje skedari:
//   ---
//   title: Titulli i artikullit
//   description: 1-2 fjali per Google (rreth 150 karaktere)
//   date: 2026-10-07            <- data e publikimit (YYYY-MM-DD). Nese eshte ne te ardhmen, artikulli del vetem atehere.
//   updated: 2026-10-20         <- opsionale
//   slug: adresa-e-artikullit   <- opsionale; ndryshe merret nga emri i skedarit
//   draft: true                 <- true = i fshehur. Hiqe ose vendose false kur je gati ta publikosh.
//   ---
//   Trupi ne Markdown: ## nenkrere, paragrafe, - lista, 1. lista, **te trasha**, *pjerrta*, [lidhje](https://...)
//
// Nese dosja nuk ekziston ose s'ka asnje artikull te publikuar, /blog shfaq blog.html statik si me pare.
const fs = require('fs');
const path = require('path');

const BAZA = 'https://phronexusai.com';
// Ftesa ne fund te cdo artikulli. Perputhet me faqen kryesore; ndryshoje ketu nese ndryshon oferta.
const CTA_TITULLI = 'Try PhronexusAI free for 3 months';
const CTA_TEKSTI = 'PhronexusAI is a cross-promotion network for SaaS: your ad appears on complementary SaaS sites, shown to their existing visitors, and businesses in your own category are excluded automatically. Card required, charged only after the trial.';
const CTA_LIDHJA = '/app';

const config = { publicDir: path.join(__dirname, 'public'), contentDir: path.join(__dirname, 'content', 'blog') };
let cache = null;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---------- Markdown i vogel (pa biblioteka), me ikasim te sigurt te HTML-se ----------
// Fillimisht nxirren kodi dhe lidhjet (qe te mos preken nga pjesa tjeter), pastaj ikasohet gjithcka tjeter.
function inline(raw, brendaLidhjes) {
  const mban = [];
  const ruaj = html => { mban.push(html); return '\u0001' + (mban.length - 1) + '\u0001'; };
  let s = String(raw).replace(/\u0001/g, '');
  s = s.replace(/`([^`]+)`/g, (m, k) => ruaj('<code>' + esc(k) + '</code>'));
  if (!brendaLidhjes) {
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, tekst, url) => {
      if (!/^(https?:\/\/|\/)/i.test(url)) return tekst; // vetem http(s) dhe lidhje te brendshme; "javascript:" etj. hidhen
      const jashtme = /^https?:\/\//i.test(url);
      return ruaj('<a href="' + esc(url) + '"' + (jashtme ? ' rel="noopener"' : '') + '>' + inline(tekst, true) + '</a>');
    });
  }
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>');
  return s.replace(/\u0001(\d+)\u0001/g, (m, i) => mban[Number(i)]);
}

function slugjifiko(tekst) {
  return String(tekst).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'seksion';
}

function markdownNeHtml(md) {
  const rreshta = String(md).replace(/\r\n?/g, '\n').split('\n');
  const n = rreshta.length, dalja = [], idPerdorur = {};
  const bosh = l => /^\s*$/.test(l);
  const ulRe = /^\s*[-*]\s+/, olRe = /^\s*\d+\.\s+/;
  let i = 0;
  while (i < n) {
    const l = rreshta[i];
    if (bosh(l)) { i++; continue; }
    if (/^```/.test(l)) {
      const kod = []; i++;
      while (i < n && !/^```/.test(rreshta[i])) { kod.push(rreshta[i]); i++; }
      i++;
      dalja.push('<pre><code>' + esc(kod.join('\n')) + '</code></pre>');
      continue;
    }
    let m = l.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const nivel = m[1].length === 1 ? 2 : m[1].length; // H1 eshte titulli i artikullit; ne trup "#" behet H2
      const baza = slugjifiko(m[2]); idPerdorur[baza] = (idPerdorur[baza] || 0) + 1;
      const id = idPerdorur[baza] > 1 ? baza + '-' + idPerdorur[baza] : baza;
      dalja.push('<h' + nivel + ' id="' + id + '">' + inline(m[2].trim()) + '</h' + nivel + '>');
      i++; continue;
    }
    if (/^>\s?/.test(l)) {
      const q = [];
      while (i < n && /^>\s?/.test(rreshta[i])) { q.push(rreshta[i].replace(/^>\s?/, '')); i++; }
      dalja.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>');
      continue;
    }
    if (ulRe.test(l) || olRe.test(l)) {
      const renditur = olRe.test(l), re = renditur ? olRe : ulRe, items = [];
      while (i < n && re.test(rreshta[i])) {
        let it = rreshta[i].replace(re, ''); i++;
        while (i < n && /^\s{2,}\S/.test(rreshta[i]) && !ulRe.test(rreshta[i]) && !olRe.test(rreshta[i])) { it += ' ' + rreshta[i].trim(); i++; }
        items.push('<li>' + inline(it) + '</li>');
      }
      dalja.push((renditur ? '<ol>' : '<ul>') + items.join('') + (renditur ? '</ol>' : '</ul>'));
      continue;
    }
    const p = [];
    while (i < n && !bosh(rreshta[i]) && !/^(#{1,4}\s|```|>\s?)/.test(rreshta[i]) && !ulRe.test(rreshta[i]) && !olRe.test(rreshta[i])) { p.push(rreshta[i].trim()); i++; }
    dalja.push('<p>' + inline(p.join(' ')) + '</p>');
  }
  return dalja.join('\n');
}

// ---------- Leximi i artikujve ----------
function dataEVlefshme(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false;
  const x = new Date(d + 'T00:00:00Z');
  return !isNaN(x) && x.toISOString().slice(0, 10) === d;
}

function lexoSkedarin(tekst, emriSkedarit) {
  const t = String(tekst).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/);
  if (!m) return { gabim: 'pa front matter (---)' };
  const meta = {};
  m[1].split('\n').forEach(r => {
    const k = r.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (k) meta[k[1].toLowerCase()] = k[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  });
  const trupi = (m[2] || '').trim();
  const slug = String(meta.slug || path.basename(emriSkedarit, '.md')).trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { gabim: 'slug i pavlefshem: ' + slug };
  if (!meta.title) return { gabim: 'mungon title' };
  if (!dataEVlefshme(meta.date)) return { gabim: 'date e pavlefshme ose mungon (duhet YYYY-MM-DD)' };
  const html = markdownNeHtml(trupi);
  const tekstiPlote = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const fjale = tekstiPlote ? tekstiPlote.split(' ').length : 0;
  return {
    slug,
    titulli: meta.title,
    pershkrimi: (meta.description || tekstiPlote.slice(0, 155)).trim(),
    data: meta.date,
    perditesuar: dataEVlefshme(meta.updated) ? meta.updated : meta.date,
    draft: /^(true|yes|po|1)$/i.test(meta.draft || ''),
    html,
    minuta: Math.max(1, Math.round(fjale / 200))
  };
}

function ngarko() {
  if (cache) return cache;
  let skedaret;
  try { skedaret = fs.readdirSync(config.contentDir).filter(f => /\.md$/i.test(f) && !f.startsWith('_')).sort(); }
  catch (e) { cache = []; return cache; } // dosja nuk ekziston: blog bosh
  const lista = [], pare = new Set();
  for (const f of skedaret) {
    try {
      const r = lexoSkedarin(fs.readFileSync(path.join(config.contentDir, f), 'utf8'), f);
      if (r.gabim) { console.error('blog: ' + f + ' u anashkalua (' + r.gabim + ')'); continue; }
      if (pare.has(r.slug)) { console.error('blog: ' + f + ' u anashkalua (slug i dyfishte: ' + r.slug + ')'); continue; }
      pare.add(r.slug); lista.push(r);
    } catch (e) { console.error('blog: ' + f + ' nuk u lexua:', e.message); }
  }
  lista.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : a.slug.localeCompare(b.slug)));
  cache = lista;
  return cache;
}

// Vetem artikujt qe nuk jane draft dhe qe data e tyre ka ardhur (artikujt me date te ardhshme "planifikohen" vete).
function publikuar() {
  try {
    const sot = new Date().toISOString().slice(0, 10);
    return ngarko().filter(a => !a.draft && a.data <= sot);
  } catch (e) { console.error('blog:', e.message); return []; }
}

function sitemapRreshta() {
  return publikuar().map(a => '  <url><loc>' + BAZA + '/blog/' + a.slug + '</loc><lastmod>' + a.perditesuar + '</lastmod></url>');
}

// ---------- Faqet ----------
const MUAJT = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function formatoData(d) { const [v, m, dt] = d.split('-').map(Number); return MUAJT[m - 1] + ' ' + dt + ', ' + v; }

const CSS_BLOG = '.nav .links a.btn.cta{color:#06121f}.nav .links a.btn{white-space:nowrap}.legal h1{line-height:1.2}.legal h2,.legal h3{line-height:1.3}.legal h3{font-size:18px;margin:26px 0 8px}.legal ul,.legal ol{padding-left:22px}.legal li{margin:6px 0}' +
  '.legal blockquote{border-left:3px solid var(--acc);margin:20px 0;padding:2px 18px}.legal code{background:#161b22;padding:2px 6px;border-radius:5px;font-size:14px}' +
  '.legal pre{background:#161b22;padding:16px;border-radius:10px;overflow:auto}.legal pre code{padding:0;background:none}' +
  '.legal .eyebrow a{color:var(--acc)}.bcta{margin-top:48px}.bcta h2{margin-top:0}.bcta p{max-width:560px;margin:0 auto 22px}' +
  '.bmore{margin-top:40px}.bmore h2{font-size:18px}.bpost{display:block;color:inherit}.bpost h3{margin:6px 0 8px;font-size:20px}' +
  '.bpost .bm{font-size:13px;margin:0}.bpost .br{display:inline-block;margin-top:12px;color:var(--acc-d);font-weight:600}';

function faqe(o) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(o.titulli) + '</title>\n' +
    '<meta name="description" content="' + esc(o.pershkrimi) + '">\n' +
    '<meta name="robots" content="' + (o.noindex ? 'noindex' : 'index,follow') + '">\n' +
    (o.canonical ? '<link rel="canonical" href="' + esc(o.canonical) + '">\n' : '') +
    (o.meta || '') +
    '<link rel="stylesheet" href="/css/site.css"><style>' + CSS_BLOG + '</style>' +
    (o.jsonld ? '\n<script type="application/ld+json">' + o.jsonld + '</script>' : '') +
    '</head><body>\n' +
    '<div class="nav"><div class="container row"><a class="brand" href="/">PhronexusAI</a><div class="links"><a class="hidem" href="/">Home</a><a href="/blog">Blog</a><a class="btn cta" href="/app">Try Free</a></div></div></div>\n' +
    o.trupi +
    '\n<footer><div class="container"><div class="fbottom"><span>© ' + new Date().getUTCFullYear() + ' PhronexusAI. All rights reserved.</span><span><a href="/privacy" style="color:var(--mut)">Privacy</a> · <a href="/terms" style="color:var(--mut)">Terms</a> · <a href="/contact" style="color:var(--mut)">Contact</a></span></div></div></footer>\n</body></html>';
}

function renderListe(lista) {
  const kartat = lista.map(a =>
    '<a class="tile bpost" href="/blog/' + esc(a.slug) + '"><p class="bm mut">' + esc(formatoData(a.data)) + ' · ' + a.minuta + ' min read</p><h3>' + esc(a.titulli) +
    '</h3><p class="mut">' + esc(a.pershkrimi) + '</p><span class="br">Read article →</span></a>').join('\n');
  return faqe({
    titulli: 'Blog — PhronexusAI',
    pershkrimi: 'Thoughts on SaaS growth, cross-promotion, and building PhronexusAI in public.',
    canonical: BAZA + '/blog',
    trupi: '<section class="sec dark"><div class="container center"><p class="eyebrow">Blog</p><h1 style="font-size:36px;margin:0 0 16px;letter-spacing:-.02em;">PhronexusAI Blog</h1>' +
      '<p class="lead mut" style="max-width:600px;margin:0 auto;">Practical notes on SaaS growth without ad spend, cross-promotion strategy, and building PhronexusAI in public.</p></div></section>\n' +
      '<section class="sec light"><div class="container"><div class="grid g3">' + kartat + '</div></div></section>'
  });
}

function renderArtikull(a, lista) {
  const url = BAZA + '/blog/' + a.slug;
  const tjera = lista.filter(x => x.slug !== a.slug).slice(0, 2);
  const lidhje = tjera.length
    ? '<div class="bmore"><h2>More from the blog</h2><ul>' + tjera.map(x => '<li><a href="/blog/' + esc(x.slug) + '">' + esc(x.titulli) + '</a></li>').join('') + '</ul></div>'
    : '';
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.titulli, description: a.pershkrimi,
    datePublished: a.data, dateModified: a.perditesuar, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'PhronexusAI', url: BAZA }, publisher: { '@type': 'Organization', name: 'PhronexusAI', url: BAZA }
  }).replace(/</g, '\\u003c');
  return faqe({
    titulli: a.titulli + ' — PhronexusAI', pershkrimi: a.pershkrimi, canonical: url, jsonld,
    meta: '<meta property="og:type" content="article"><meta property="og:site_name" content="PhronexusAI"><meta property="og:title" content="' + esc(a.titulli) +
      '"><meta property="og:description" content="' + esc(a.pershkrimi) + '"><meta property="og:url" content="' + esc(url) + '"><meta property="article:published_time" content="' + esc(a.data) +
      '"><meta name="twitter:card" content="summary">\n',
    trupi: '<article class="legal"><p class="eyebrow"><a href="/blog">Blog</a></p><h1>' + esc(a.titulli) + '</h1><p class="upd">' + esc(formatoData(a.data)) + ' · ' + a.minuta + ' min read</p>\n' +
      a.html + '\n<div class="strip bcta center"><h2>' + esc(CTA_TITULLI) + '</h2><p class="mut">' + esc(CTA_TEKSTI) + '</p><a class="btn cta lg" href="' + esc(CTA_LIDHJA) + '">Start free</a></div>' + lidhje + '</article>'
  });
}

function render404() {
  return faqe({
    titulli: 'Article not found — PhronexusAI', pershkrimi: 'This article does not exist.', noindex: true,
    trupi: '<section class="sec dark"><div class="container center"><p class="eyebrow">404</p><h1 style="font-size:36px;margin:0 0 16px;">Article not found</h1><p class="lead mut">It may have moved or not been published yet.</p><a class="btn cta lg" href="/blog">Back to the blog</a></div></section>'
  });
}

// ---------- Montimi ne Express ----------
module.exports = function montoBlogun(app, opsione) {
  const o = opsione || {};
  if (o.publicDir) config.publicDir = o.publicDir;
  if (o.contentDir) config.contentDir = o.contentDir;
  cache = null;
  app.get('/blog', (req, res) => {
    const lista = publikuar();
    if (!lista.length) return res.sendFile(path.join(config.publicDir, 'blog.html'));
    res.type('html').send(renderListe(lista));
  });
  app.get('/blog/:slug', (req, res) => {
    const lista = publikuar();
    const a = lista.find(x => x.slug === req.params.slug);
    if (!a) return res.status(404).type('html').send(render404());
    res.type('html').send(renderArtikull(a, lista));
  });
};
module.exports.publikuar = publikuar;
module.exports.sitemapRreshta = sitemapRreshta;
module.exports._test = { esc, inline, markdownNeHtml, lexoSkedarin, renderArtikull, renderListe, render404, formatoData, rivendos(o) { cache = null; if (o && o.contentDir) config.contentDir = o.contentDir; if (o && o.publicDir) config.publicDir = o.publicDir; } };
