#!/usr/bin/env node
// Divinely Faded postbuild gate (EN + ES). Ported from the Bunny Baristas check.js; zero dependencies, regex-based.
//
//   node tools/build.mjs && node tools/build-sitemap.js && node tools/check.js            full gate (default)
//   node tools/check.js --en-only     tolerate Spanish pages, sitemap, robots and 404 that are not built yet
//   node tools/check.js --today 2026-11-16   date used for the blog date gate (default: today in America/Denver)
//
// Exits 1 on any failure. Pages are /<slug>/index.html (EN) and /es/<slug>/index.html (ES);
// blog posts are /blog/<slug>/ and /es/blog/<slug>/. Facts come from content/facts.json, so a fact change
// (a new price, a new address) changes what the gate accepts without editing this file.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const EN_ONLY = args.includes('--en-only');
const TODAY = args.includes('--today')
  ? args[args.indexOf('--today') + 1]
  : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date());

const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/facts.json'), 'utf8'));
const SITE_URL = (process.env.SITE_URL || facts.site_url).replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Thresholds (see the uniqueness section for the reasoning)
// ---------------------------------------------------------------------------
const TITLE_MAX = 60;
const DESC_MAX = 155;
const MAX_CLICKS = 3;
const SHINGLE = 5;
const BOILERPLATE_SHARE = 0.5; // a 5-shingle on >= half the pages of a language is template, not copy
const PAIR_FAIL = 0.2; // pairwise Jaccard of authored copy
const PAIR_WARN = 0.1;
const PARA_MIN_WORDS = 12;
const PARA_FAIL = 0.8; // share of a paragraph's 5-shingles found on one other page

const failures = [];
const warnings = [];
const seen = new Set();
const fail = (m) => { if (!seen.has(m)) { seen.add(m); failures.push(m); } };
const warn = (m) => { if (!seen.has(m)) { seen.add(m); warnings.push(m); } };

// ---------------------------------------------------------------------------
// never_claim sweep patterns (facts.never_claim, EN + ES)
// ---------------------------------------------------------------------------
const NEVER = [
  [/\bwalk[\s-]?ins?\b/i, 'walk-in (appointments only)'],
  [/\bwalkins?\b/i, 'walk-in (appointments only)'],
  [/\b(llegue|llega|ven|venga|pase|pasa)\s+sin\s+cita\b/i, 'walk-in, ES ("llegue sin cita")'],
  [/\bsin\s+cita(\s+previa)?\b/i, 'walk-in, ES ("sin cita")'],
  [/\bsin\s+reservaci[oó]n\b/i, 'walk-in, ES ("sin reservación")'],
  [/\bbest\b/i, 'ranking claim ("best")'],
  [/(^|[^&\w])#\s?1\b/, 'ranking claim ("#1")'],
  [/\bnumber\s+one\b/i, 'ranking claim ("number one")'],
  [/\b(top|highest|best)[\s-]rated\b/i, 'ranking claim ("top-rated")'],
  [/\b(el|la|los|las)\s+mejor(es)?\b/i, 'ranking claim, ES ("el mejor")'],
  [/\bn[uú]mero\s+(uno|1)\b/i, 'ranking claim, ES ("número uno")'],
  [/\bmejor\s+(calificad|valorad)/i, 'ranking claim, ES ("mejor calificado")'],
  [/\bse\s+habla\s+espa[nñ]ol\b/i, 'Spanish-language service ("se habla español") is unconfirmed'],
  [/\bhabl(o|amos)\s+espa[nñ]ol\b/i, 'Spanish-language service ("hablo español") is unconfirmed'],
  [/\bspanish[\s-]speaking\b/i, 'Spanish-language service is unconfirmed'],
  [/\b(speaks?|speak)\s+spanish\b/i, 'Spanish-language service is unconfirmed'],
  [/\ben\s+espa[nñ]ol\b.*\b(atenci[oó]n|servicio|atendemos)\b|\b(atenci[oó]n|servicio|atendemos)\b.*\ben\s+espa[nñ]ol\b/i, 'Spanish-language service is unconfirmed'],
  [/\b301\b/, 'wrong street number (301); the shop is 303 S Halagueno St'],
  [/\bcanyon\b/i, '117 S Canyon St is unpublished until the new shop opens'],
  [/\bmargaret\b/i, '114 N Margaret St is private'],
  [/\b(discount|coupon|promo\s?code|special\s+offer|\d+\s?%\s?off)\b/i, 'discount or offer'],
  [/\b(descuento|cup[oó]n|promoci[oó]n|oferta\s+especial)\b/i, 'discount or offer, ES'],
  [/\b\d+(\.\d)?\s?(-|\s)?stars?\b/i, 'review rating claim'],
  [/\b\d[\d,]*\+?\s+(reviews|reseñas|opiniones)\b/i, 'review count'],
  [/\b\d+\+?\s+years?\s+(of\s+)?(experience|in\s+the\s+chair|cutting)\b/i, 'years of experience (only "cutting since 2023")'],
  [/\b\d+\s+años\s+de\s+experiencia\b/i, 'years of experience, ES'],
  [/\b(award(-winning)?|certified|licensed|premiad[oa]|certificad[oa]|licenciad[oa])\b/i, 'award, certification or license'],
  [/\b(parking|estacionamiento|aparcamiento)\b/i, 'parking details are unknown'],
];
// Competitor names seen in the Carlsbad Maps results (keyword research, 2026-10-24). Generic words excluded.
const COMPETITORS = ["Los Chavos", "Barber Bus", "El Cholo", "Great Clips", "Great Cuts", "Victor's Styling", "Gentlemen's Parlor",
  'Cavern Barbershop', 'Cavern Barber', 'Hair Teez', 'Melvin Cuts', "Sancho's", 'Shades&Fades', 'Shades & Fades', 'The Straight Edge',
  'SmartStyle', 'Danny Enloe', 'Shear Perfection', 'The Mobile Barber', 'Image Kutz', 'Tempers Cutz', "Ernie's", 'Cinda Fades',
  'La Chic Coiffures', 'Barbershop 5.0', 'Que Suave', 'Mane Twenties', 'Jordancutss', 'Cutzby'];
const sinceYear = Number(facts.cutting_since);

// Every dollar figure the site may show: service prices, add-ons, the holiday fee.
const ALLOWED_DOLLARS = new Set([
  ...facts.services.map((s) => s.price).filter((p) => p != null),
  ...facts.addons.map((a) => a.price),
  ...(facts.holiday_fee != null ? [facts.holiday_fee] : []),
].map(Number));

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------
function parseAttrs(tag) {
  const out = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag)) !== null) out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  return out;
}
const findTags = (html, tag) => html.match(new RegExp('<' + tag + '\\b[^>]*>', 'gi')) || [];
function elements(html, tag) {
  const re = new RegExp('<' + tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + tag + '>', 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push({ attrs: parseAttrs('<x ' + m[1] + '>'), inner: m[2], full: m[0] });
  return out;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '\u2014', ndash: '\u2013', middot: '\u00b7', hellip: '\u2026', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d' };
const decode = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&([a-z]+);/gi, (m, n) => (ENT[n.toLowerCase()] !== undefined ? ENT[n.toLowerCase()] : m));
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const stripNonVisible = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
const textLines = (html) => stripNonVisible(html).replace(/<[^>]+>/g, '\n').split('\n').map((l) => squash(decode(l))).filter(Boolean);
const idExists = (html, id) => new RegExp('\\bid\\s*=\\s*["\']' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']').test(html);

// ---------------------------------------------------------------------------
// Discover built pages
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'assets', 'content', 'tools', 'reference', 'seo', 'i18n', 'docs']);
function walk(dir, rel) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      out = out.concat(walk(path.join(dir, e.name), rel ? rel + '/' + e.name : e.name));
    } else if (e.isFile() && e.name.endsWith('.html')) out.push(rel ? rel + '/' + e.name : e.name);
  }
  return out;
}
const FILES = walk(ROOT, '').sort();
const html = {};
FILES.forEach((f) => { html[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); });

const urlPathOf = (file) => (file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, ''));
const langOf = (file) => (file.startsWith('es/') ? 'es' : 'en');
const is404 = (file) => file === '404.html';
const isPost = (file) => /^(es\/)?blog\/[^/]+\/index\.html$/.test(file);
const isHub = (file) => /^(es\/)?(services|servicios|styles|estilos|blog)\/index\.html$/.test(file) || file === 'index.html' || file === 'es/index.html';
const isEsTarget = (p) => /^\/es(\/|$)/.test(p);
const PAGES = FILES.filter((f) => !is404(f));
const FILE_BY_PATH = Object.fromEntries(FILES.map((f) => [urlPathOf(f), f]));

function resolveInternal(href) {
  // returns { file, pathname, hash } or { missing }
  const [rawPath, hash] = href.split('#');
  const pathname = rawPath.split('?')[0] || '/';
  if (/\.[a-z0-9]+$/i.test(pathname)) return fs.existsSync(path.join(ROOT, pathname)) ? { asset: pathname, hash } : { missing: pathname };
  const withSlash = pathname.endsWith('/') ? pathname : pathname + '/';
  const file = FILE_BY_PATH[withSlash];
  if (file) return { file, pathname: withSlash, hash, noSlash: !pathname.endsWith('/') };
  return { missing: withSlash };
}

// ---------------------------------------------------------------------------
// JSON-LD helpers
// ---------------------------------------------------------------------------
function jsonLdBlocks(src) {
  return elements(src, 'script').filter((s) => (s.attrs.type || '').toLowerCase() === 'application/ld+json').map((s) => s.inner);
}
function walkJson(node, fn, key) {
  if (Array.isArray(node)) node.forEach((n) => walkJson(n, fn, key));
  else if (node && typeof node === 'object') { fn(node); Object.entries(node).forEach(([k, v]) => walkJson(v, fn, k)); }
}
const typesOf = (n) => [].concat(n['@type'] || []);

// ---------------------------------------------------------------------------
// Per-page checks
// ---------------------------------------------------------------------------
const titles = {};
const descs = {};
const hreflang = {};
const photoUse = {}; // photo -> Set(page group)
const postDates = {};
const summary = [];

for (const file of FILES) {
  const src = html[file];
  const lang = langOf(file);
  const urlPath = urlPathOf(file);
  const indexable = !is404(file);
  const where = file;

  // leaks the generator should never let through
  if (/\{\{[^}]*\}\}/.test(src)) fail(`${where}: unfilled {{token}} "${src.match(/\{\{[^}]*\}\}/)[0]}"`);
  if (/#missing-/.test(src)) fail(`${where}: "#missing-" link (content points at a page id that does not exist)`);
  if (/\[TIM\?\]/.test(src)) fail(`${where}: [TIM?] marker in built HTML`);

  // <html lang>
  const htmlTag = (src.match(/<html\b[^>]*>/i) || [''])[0];
  const declared = (parseAttrs(htmlTag).lang || '').toLowerCase();
  if (indexable && declared.split('-')[0] !== lang) fail(`${where}: <html lang="${declared}">, expected "${lang}"`);

  // one <h1>
  const h1s = elements(src, 'h1');
  if (h1s.length !== 1) fail(`${where}: expected exactly one <h1>, found ${h1s.length}`);

  // title + description
  const tm = src.match(/<title>([\s\S]*?)<\/title>/i);
  const title = tm ? squash(decode(tm[1])) : '';
  const descTag = findTags(src, 'meta').find((t) => (parseAttrs(t).name || '').toLowerCase() === 'description');
  const desc = descTag ? squash(decode(parseAttrs(descTag).content || '')) : '';
  if (!title) fail(`${where}: missing <title>`);
  else if (title.length > TITLE_MAX) fail(`${where}: <title> is ${title.length} characters (max ${TITLE_MAX}): "${title}"`);
  if (indexable) {
    if (!desc) fail(`${where}: missing meta description`);
    else if (desc.length > DESC_MAX) fail(`${where}: meta description is ${desc.length} characters (max ${DESC_MAX})`);
    else if (desc.length < 70) warn(`${where}: meta description is only ${desc.length} characters`);
    (titles[title] = titles[title] || []).push(file);
    if (desc) (descs[desc] = descs[desc] || []).push(file);
  }

  // canonical
  const canon = findTags(src, 'link').filter((t) => (parseAttrs(t).rel || '').toLowerCase() === 'canonical');
  const robotsTag = findTags(src, 'meta').find((t) => (parseAttrs(t).name || '').toLowerCase() === 'robots');
  const robots = robotsTag ? parseAttrs(robotsTag).content || '' : '';
  if (indexable) {
    if (canon.length !== 1) fail(`${where}: expected exactly one canonical, found ${canon.length}`);
    else {
      const href = parseAttrs(canon[0]).href || '';
      if (href !== SITE_URL + urlPath) fail(`${where}: canonical "${href}" is not its own URL "${SITE_URL + urlPath}"`);
    }
    if (/noindex/i.test(robots)) fail(`${where}: indexable page carries noindex`);
  } else {
    if (canon.length) fail(`${where}: 404 page must not have a canonical`);
    if (!/noindex/i.test(robots)) fail(`${where}: 404 page needs <meta name="robots" content="noindex">`);
  }

  // hreflang trio
  if (indexable) {
    const trio = {};
    findTags(src, 'link').filter((t) => (parseAttrs(t).rel || '').toLowerCase() === 'alternate' && parseAttrs(t).hreflang)
      .forEach((t) => { const a = parseAttrs(t); trio[a.hreflang.toLowerCase()] = a.href; });
    hreflang[file] = trio;
  }

  // images: width, height, alt; photo reuse
  const imgs = findTags(src, 'img');
  const footStart = src.indexOf('<footer'), footEnd = src.indexOf('</footer>');
  const lbStart = src.indexOf('<dialog id="lightbox"'), lbEnd = src.indexOf('</dialog>', lbStart);
  let cursor = 0;
  imgs.forEach((tag) => {
    const at = src.indexOf(tag, cursor); cursor = at + tag.length;
    const inFooter = footStart >= 0 && at > footStart && at < footEnd;
    if (lbStart >= 0 && at > lbStart && at < lbEnd) return; // Colin's lightbox <img> is filled by script.js when a photo opens
    const a = parseAttrs(tag);
    const miss = ['width', 'height'].filter((k) => !a[k]).concat(a.alt === undefined ? ['alt'] : []);
    if (miss.length) {
      const msg = `${where}: <img> missing ${miss.join(', ')}: ${(a.src || '').slice(0, 90)}`;
      // Colin's frozen homepage markup is reported, not failed: it is outside the allowed-edits list.
      if (file === 'index.html' && !inFooter) warn(msg + ' (frozen homepage markup)');
      else fail(msg);
    }
  });
  if (indexable && !isPost(file) && !isHub(file)) {
    const body = findTags(src.replace(/<head>[\s\S]*?<\/head>/i, '').replace(/<a class="df-card"[\s\S]*?<\/a>/g, ''), 'img').join(' '); // body <img> only; cards show other pages' photos by design
    const group = lang === 'es' && hreflangTarget(src, 'en') ? hreflangTarget(src, 'en') : urlPath;
    for (const m of body.matchAll(/\/assets\/photos\/([a-z0-9-]+?)-(?:640|1200)\.webp/g)) {
      (photoUse[m[1]] = photoUse[m[1]] || new Set()).add(group);
    }
  }

  // JSON-LD
  const blocks = jsonLdBlocks(src);
  if (indexable && !blocks.length) fail(`${where}: no JSON-LD`);
  if (!indexable && blocks.length) fail(`${where}: 404 page must not carry JSON-LD`);
  let ldStrings = [];
  blocks.forEach((raw, i) => {
    let data;
    try { data = JSON.parse(raw); } catch (e) { fail(`${where}: JSON-LD block ${i + 1} does not parse (${e.message})`); return; }
    if (!data['@context']) fail(`${where}: JSON-LD block ${i + 1} has no @context`);
    const defined = new Set();
    const refs = [];
    const typeCount = {};
    walkJson(data, (n) => {
      typesOf(n).forEach((t) => { typeCount[t] = (typeCount[t] || 0) + 1; });
      const keys = Object.keys(n);
      if (n['@id'] && keys.length > 1) defined.add(n['@id']);
      if (n['@id'] && keys.length === 1) refs.push(n['@id']);
      if (typesOf(n).includes('Offer') && n.price !== undefined && !ALLOWED_DOLLARS.has(Number(n.price))) fail(`${where}: JSON-LD Offer price ${n.price} is not a price in facts.json`);
      if (typesOf(n).includes('BlogPosting')) {
        if (n.datePublished) postDates[file] = n.datePublished;
        ['headline', 'datePublished', 'author', 'image'].forEach((k) => { if (!n[k]) fail(`${where}: BlogPosting has no ${k}`); });
      }
      if (typesOf(n).includes('BreadcrumbList')) (n.itemListElement || []).forEach((it) => {
        const u = it.item || '';
        if (u.startsWith(SITE_URL)) { const r = resolveInternal(u.slice(SITE_URL.length) || '/'); if (r.missing && !(EN_ONLY && isEsTarget(r.missing))) fail(`${where}: breadcrumb item ${u} does not resolve`); }
      });
    });
    ['AggregateRating', 'Review'].forEach((t) => { if (typeCount[t]) fail(`${where}: JSON-LD contains ${t} (self-served review markup is against Google's guidelines)`); });
    if ((typeCount.FAQPage || 0) > 1) fail(`${where}: ${typeCount.FAQPage} FAQPage entities in one page (Rich Results reports "Duplicate field FAQPage"); keep one`);
    if (indexable && (typeCount.BarberShop || 0) !== 1) fail(`${where}: expected one BarberShop node, found ${typeCount.BarberShop || 0}`);
    refs.forEach((r) => { if (!defined.has(r)) fail(`${where}: JSON-LD reference ${r} points at no node in the graph`); });
    walkJson(data, (n) => Object.values(n).forEach((v) => { if (typeof v === 'string' && !/^https?:|^\//.test(v)) ldStrings.push(v); }));
  });

  // never_claim + dollar sweep over what a reader or a crawler sees
  {
    const attrText = [];
    findTags(src, '(?:img|a|button|nav|div|section)').forEach((t) => { const a = parseAttrs(t); ['alt', 'aria-label', 'title'].forEach((k) => { if (a[k]) attrText.push(decode(a[k])); }); });
    const lines = textLines(src.replace(/<head>[\s\S]*?<\/head>/i, '')).concat([title, desc], attrText, ldStrings);
    for (const line of lines) {
      for (const [re, why] of NEVER) if (re.test(line)) fail(`${where}: never_claim (${why}): "${line.slice(0, 140)}"`);
      for (const c of COMPETITORS) if (line.toLowerCase().includes(c.toLowerCase())) fail(`${where}: competitor name "${c}": "${line.slice(0, 140)}"`);
      for (const m of line.matchAll(/\b(?:since|desde)\s+((?:19|20)\d\d)\b/gi)) if (Number(m[1]) !== sinceYear) fail(`${where}: "${m[0]}" (only "cutting since ${sinceYear}")`);
      for (const m of line.matchAll(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/g)) {
        const v = Number(m[1].replace(/,/g, ''));
        if (!ALLOWED_DOLLARS.has(v)) fail(`${where}: $${m[1]} is not a price in facts.json: "${line.slice(0, 140)}"`);
      }
    }
  }

  // links: internal targets exist, fragments exist, external links safe
  findTags(src, 'a').forEach((tag) => {
    const a = parseAttrs(tag);
    const href = a.href;
    if (!href) return;
    if (href.startsWith('#')) {
      if (href.length > 1 && !idExists(src, href.slice(1))) fail(`${where}: same-page link "${href}" has no matching id`);
      return;
    }
    if (/^https?:\/\//i.test(href)) {
      if (href.startsWith(SITE_URL)) warn(`${where}: absolute link to own site "${href}" (use a root-relative path)`);
      else if (!/\bnoopener\b/.test(a.rel || '')) fail(`${where}: external link without rel="noopener": ${href.slice(0, 80)}`);
      return;
    }
    if (/^(sms|tel|mailto):/i.test(href)) {
      if (/^(sms|tel):/i.test(href) && href.replace(/^(sms|tel):/i, '') !== facts.phone.e164) fail(`${where}: ${href} is not the shop number ${facts.phone.e164}`);
      return;
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      const r = resolveInternal(href);
      if (r.missing) {
        if (EN_ONLY && isEsTarget(r.missing)) return; // Spanish page not built yet
        fail(`${where}: internal link "${href}" points to a page that does not exist`);
        return;
      }
      if (r.noSlash) warn(`${where}: link "${href}" lacks the trailing slash (Vercel trailingSlash:true will redirect it)`);
      if (r.file && r.hash && !idExists(html[r.file], r.hash)) fail(`${where}: link "${href}" has no id="${r.hash}" on ${r.file}`);
      if (lang === 'es' && r.file && langOf(r.file) === 'en' && r.file !== FILE_BY_PATH[hreflangTarget(src, 'en')]) fail(`${where}: Spanish page links into the English site ("${href}"); only the language toggle may`);
      return;
    }
    if (file !== 'index.html') fail(`${where}: relative link "${href}" (use root-relative paths so nested pages resolve)`);
  });

  // referenced local assets exist
  const refsRe = /(?:src|href|srcset)\s*=\s*"([^"]*)"/gi;
  let rm;
  while ((rm = refsRe.exec(src)) !== null) {
    rm[1].split(',').forEach((part) => {
      const u = part.trim().split(/\s+/)[0];
      if (!u || /^(https?:|\/\/|#|sms:|tel:|mailto:|data:)/.test(u)) return;
      if (!/\.[a-z0-9]{2,5}(\?.*)?$/i.test(u)) return; // page links handled above
      const local = u.startsWith('/') ? u : '/' + path.posix.join(path.posix.dirname(urlPath === '/' ? '/x' : urlPath + 'x'), u);
      if (!fs.existsSync(path.join(ROOT, decodeURI(local.split('?')[0])))) fail(`${where}: references ${u}, which does not exist`);
    });
  }

  summary.push({ file, lang, title: title.length, desc: desc.length, imgs: imgs.length, ld: blocks.length });
}

function hreflangTarget(src, key) {
  const t = findTags(src, 'link').map(parseAttrs).find((a) => (a.rel || '').toLowerCase() === 'alternate' && (a.hreflang || '').toLowerCase() === key);
  return t && t.href && t.href.startsWith(SITE_URL) ? t.href.slice(SITE_URL.length) : null;
}

// duplicate titles / descriptions
Object.entries(titles).forEach(([t, fs_]) => { if (fs_.length > 1) fail(`duplicate <title> "${t}" on ${fs_.join(', ')}`); });
Object.entries(descs).forEach(([d, fs_]) => { if (fs_.length > 1) fail(`duplicate meta description on ${fs_.join(', ')}`); });

// ---------------------------------------------------------------------------
// hreflang: trio present, absolute, self-referencing, targets exist, x-default = EN, twins agree
// ---------------------------------------------------------------------------
let esPending = 0;
for (const file of PAGES) {
  const trio = hreflang[file] || {};
  const self = SITE_URL + urlPathOf(file);
  const lang = langOf(file);
  for (const k of ['en', 'es', 'x-default']) {
    if (!trio[k]) { if (!(EN_ONLY && k !== 'en')) fail(`${file}: missing hreflang="${k}"`); continue; }
    if (!trio[k].startsWith(SITE_URL + '/')) fail(`${file}: hreflang="${k}" is not an absolute ${SITE_URL} URL`);
  }
  if (trio[lang] && trio[lang] !== self) fail(`${file}: hreflang="${lang}" is ${trio[lang]}, not the page itself (${self})`);
  if (trio['x-default'] && trio.en && trio['x-default'] !== trio.en) fail(`${file}: hreflang x-default must equal the EN URL`);
  for (const k of ['en', 'es']) {
    if (!trio[k]) continue;
    const r = resolveInternal(trio[k].slice(SITE_URL.length));
    if (r.missing) {
      if (EN_ONLY && k === 'es') esPending++;
      else fail(`${file}: hreflang="${k}" points to ${trio[k]}, which is not built`);
      continue;
    }
    // parity: the twin must point back with the same trio
    const twin = r.file;
    if (twin && twin !== file) {
      const tt = hreflang[twin] || {};
      ['en', 'es', 'x-default'].forEach((kk) => { if (trio[kk] && tt[kk] !== trio[kk]) fail(`${file} / ${twin}: hreflang="${kk}" differs between twins ("${trio[kk]}" vs "${tt[kk] || 'missing'}")`); });
      if (!new RegExp('class="df-lang"[^>]*href="' + urlPathOf(twin).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(html[file]) && !new RegExp('href="' + urlPathOf(twin).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*class="df-lang"').test(html[file])) fail(`${file}: language toggle (.df-lang) does not point to its twin ${urlPathOf(twin)}`);
    }
  }
}
if (esPending) warn(`${esPending} EN page(s) declare hreflang="es" twins that are not built yet (--en-only). The full gate fails on these.`);

// ---------------------------------------------------------------------------
// Reachability (BFS from each home, <= 3 clicks) and orphans
// ---------------------------------------------------------------------------
const graph = {};
for (const f of FILES) {
  graph[f] = new Set();
  findTags(html[f], 'a').forEach((t) => {
    const h = parseAttrs(t).href;
    if (!h || !h.startsWith('/') || h.startsWith('//')) return;
    const r = resolveInternal(h);
    if (r.file && r.file !== f) graph[f].add(r.file);
  });
}
const inbound = {};
Object.entries(graph).forEach(([f, s]) => s.forEach((t) => { inbound[t] = (inbound[t] || 0) + 1; }));
function bfs(start) {
  const d = { [start]: 0 };
  const q = [start];
  while (q.length) { const c = q.shift(); graph[c].forEach((n) => { if (d[n] === undefined) { d[n] = d[c] + 1; q.push(n); } }); }
  return d;
}
for (const [lang, home] of [['en', 'index.html'], ['es', 'es/index.html']]) {
  const pages = PAGES.filter((f) => langOf(f) === lang);
  if (!pages.length) { if (lang === 'es' && !EN_ONLY) fail('no Spanish pages built'); continue; }
  if (!html[home]) { if (!(EN_ONLY && lang === 'es')) fail(`${home}: missing, cannot measure ${lang.toUpperCase()} reachability`); continue; }
  const d = bfs(home);
  for (const f of pages) {
    if (f === home) continue;
    if (d[f] === undefined) fail(`${f}: unreachable from ${urlPathOf(home)} through links`);
    else if (d[f] > MAX_CLICKS) fail(`${f}: ${d[f]} clicks from ${urlPathOf(home)} (max ${MAX_CLICKS})`);
    if (!inbound[f]) fail(`${f}: orphan (no other page links to it)`);
  }
}

// ---------------------------------------------------------------------------
// Uniqueness: 5-word shingles of authored copy inside <main>
//
// Why these thresholds. Every page shares template text inside <main> (breadcrumbs, the CTA, the
// related-page cards, the "Book this service" pills), so raw <main> overlap mostly measures the
// template. We strip the chrome, then drop any 5-shingle that appears on half or more of the pages
// in that language: what remains is the copy someone wrote for this page.
//   - Pairwise Jaccard >= 0.20 fails: one in five of the distinct 5-word runs across two pages being
//     shared is templated copy with nouns swapped, which is exactly the doorway pattern a style x
//     service matrix risks. >= 0.10 warns.
//   - A paragraph of >= 12 words with >= 80% of its 5-shingles on one other page fails: that is the
//     same paragraph with a word or two changed ("no paragraph may be interchangeable", content/README).
// Bunny's gate used 0.50/0.35 on raw <main> including chrome; these are stricter because the
// template is removed first and this site's risk (a large style library) is higher.
// ---------------------------------------------------------------------------
function authored(src) {
  const m = src.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!m) return { text: '', paras: [] };
  const main = m[1]
    .replace(/<nav class="df-crumbs"[\s\S]*?<\/nav>/g, ' ')
    .replace(/<section class="review df-cta"[\s\S]*?<\/section>/g, ' ')
    .replace(/<a class="df-card"[\s\S]*?<\/a>/g, ' ')
    .replace(/<a class="pill"[\s\S]*?<\/a>/g, ' ');
  const norm = (s) => squash(decode(s.replace(/<[^>]+>/g, ' '))).toLowerCase().replace(/[^\p{L}\p{N}$' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const paras = [...main.matchAll(/<(p|li|h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/g)].map((x) => norm(x[2])).filter((p) => p.split(' ').length >= PARA_MIN_WORDS);
  return { text: norm(main), paras };
}
const shingles = (t) => { const w = t.split(' ').filter(Boolean); const s = new Set(); for (let i = 0; i + SHINGLE <= w.length; i++) s.add(w.slice(i, i + SHINGLE).join(' ')); return s; };
const uniq = { matrix: {} };
for (const lang of ['en', 'es']) {
  const pages = PAGES.filter((f) => langOf(f) === lang && f !== (lang === 'en' ? 'index.html' : 'es/index.html'));
  if (pages.length < 2) continue;
  const A = Object.fromEntries(pages.map((f) => [f, authored(html[f])]));
  const S = Object.fromEntries(pages.map((f) => [f, shingles(A[f].text)]));
  const df = {};
  pages.forEach((f) => S[f].forEach((s) => { df[s] = (df[s] || 0) + 1; }));
  const cut = Math.max(3, Math.ceil(pages.length * BOILERPLATE_SHARE));
  const boiler = new Set(Object.keys(df).filter((s) => df[s] >= cut));
  const C = Object.fromEntries(pages.map((f) => [f, new Set([...S[f]].filter((s) => !boiler.has(s)))]));
  let worst = { v: 0 };
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const a = C[pages[i]], b = C[pages[j]];
    let inter = 0; a.forEach((s) => { if (b.has(s)) inter++; });
    const v = a.size + b.size - inter ? inter / (a.size + b.size - inter) : 0;
    if (v > worst.v) worst = { v, a: pages[i], b: pages[j] };
    if (v >= PAIR_FAIL) fail(`uniqueness ${lang}: ${pages[i]} / ${pages[j]} share ${(v * 100).toFixed(1)}% of authored 5-word runs (fail >= ${PAIR_FAIL * 100}%)`);
    else if (v >= PAIR_WARN) warn(`uniqueness ${lang}: ${pages[i]} / ${pages[j]} share ${(v * 100).toFixed(1)}% of authored 5-word runs`);
  }
  const dup = {}; // "f|g" -> { n, example }
  for (const f of pages) for (const p of A[f].paras) {
    const ps = [...shingles(p)].filter((s) => !boiler.has(s));
    if (ps.length < 4) continue;
    for (const g of pages) {
      if (g === f) continue;
      const hit = ps.filter((s) => S[g].has(s)).length / ps.length;
      if (hit >= PARA_FAIL) { const k = [f, g].sort().join(' / '); dup[k] = dup[k] || { n: 0, example: p, hit }; if (f < g) dup[k].n++; break; }
    }
  }
  Object.entries(dup).forEach(([k, v]) => fail(`uniqueness ${lang}: ${k} share ${Math.max(1, v.n)} near-identical paragraph(s) (>= ${PARA_FAIL * 100}% of 5-word runs), e.g. "${v.example.slice(0, 90)}..."`));
  uniq.matrix[lang] = { pages: pages.length, boilerplate_shingles: boiler.size, worst_pair: worst.a ? `${worst.a} / ${worst.b} ${(worst.v * 100).toFixed(1)}%` : 'n/a' };
}

// ---------------------------------------------------------------------------
// Photo reuse: one library photo per non-hub page (EN page and its ES twin count as one; blogs exempt)
// ---------------------------------------------------------------------------
Object.entries(photoUse).forEach(([photo, groups]) => {
  if (groups.size > 1) fail(`photo "${photo}" is used on ${groups.size} pages: ${[...groups].join(', ')} (one page per photo; hubs and blog posts exempt)`);
});

// ---------------------------------------------------------------------------
// Blog date gate, site files
// ---------------------------------------------------------------------------
Object.entries(postDates).forEach(([f, d]) => { if (d > TODAY) fail(`${f}: post dated ${d} is built before its date (today ${TODAY})`); });
for (const f of FILES.filter(isPost)) if (!postDates[f]) fail(`${f}: blog post without BlogPosting.datePublished`);

const siteFile = (name, why) => {
  if (!fs.existsSync(path.join(ROOT, name))) (EN_ONLY ? warn : fail)(`${name}: missing (${why})`);
  return fs.existsSync(path.join(ROOT, name)) ? fs.readFileSync(path.join(ROOT, name), 'utf8') : null;
};
siteFile('404.html', 'bilingual 404 in the page inventory');
const robots = siteFile('robots.txt', 'allow all + Sitemap line');
if (robots && !new RegExp('^Sitemap:\\s*' + SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/sitemap\\.xml', 'mi').test(robots)) fail(`robots.txt: no "Sitemap: ${SITE_URL}/sitemap.xml" line`);
if (robots && /^Disallow:\s*\/\s*$/mi.test(robots)) fail('robots.txt: disallows the whole site');
siteFile('llms.txt', 'AI-crawler summary from facts');
const sitemap = siteFile('sitemap.xml', 'run node tools/build-sitemap.js');
if (sitemap) {
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1])));
  PAGES.forEach((f) => { const u = SITE_URL + urlPathOf(f); if (!locs.has(u)) fail(`sitemap.xml: missing ${u} (rerun node tools/build-sitemap.js)`); });
  locs.forEach((u) => { const r = resolveInternal(u.slice(SITE_URL.length) || '/'); if (r.missing || !r.file || is404(r.file)) fail(`sitemap.xml: lists ${u}, which is not a built page`); });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`\nDivinely Faded postbuild gate (${EN_ONLY ? 'EN-only mode' : 'full mode'}, today ${TODAY}, SITE_URL ${SITE_URL})\n`);
console.log('File'.padEnd(46) + 'Lang  Title  Desc  Imgs  LD');
summary.forEach((r) => console.log(r.file.padEnd(46) + r.lang.padEnd(6) + String(r.title).padEnd(7) + String(r.desc).padEnd(6) + String(r.imgs).padEnd(6) + r.ld));
Object.entries(uniq.matrix).forEach(([l, m]) => console.log(`\nUniqueness ${l.toUpperCase()}: ${m.pages} pages, ${m.boilerplate_shingles} template shingles removed, highest pair ${m.worst_pair}`));
if (warnings.length) { console.log(`\n${warnings.length} WARNING(S):`); warnings.forEach((w, i) => console.log(`W${i + 1}. ${w}`)); }
if (!failures.length) { console.log(`\nALL CHECKS PASSED: ${FILES.length} HTML file(s), 0 failures.`); process.exit(0); }
console.log(`\n${failures.length} FAILURE(S):`);
failures.forEach((f, i) => console.log(`${i + 1}. ${f}`));
process.exit(1);
