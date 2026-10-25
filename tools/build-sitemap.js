#!/usr/bin/env node
// Writes sitemap.xml from the BUILT pages (run after tools/build.mjs). Zero dependencies.
//
//   node tools/build-sitemap.js [--today YYYY-MM-DD]
//
// - One <url> per indexable page: /<slug>/index.html, /es/<slug>/index.html, blog posts at /blog/<slug>/ and /es/blog/<slug>/.
// - xhtml:link alternates (en, es, x-default) come from each page's own hreflang tags, and are written only when
//   BOTH language versions are built, so the sitemap never points at a Spanish page that does not exist yet.
// - Blog posts dated after today (America/Denver) are left out even if a stale build left their HTML behind.
// - Pages with <meta name="robots" content="noindex"> and the 404 page are left out.
// - lastmod: a post's dateModified/datePublished; for other pages the content file's "updated" field, else its last git commit date (file date only outside git).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const TODAY = args.includes('--today')
  ? args[args.indexOf('--today') + 1]
  : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date());
const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/facts.json'), 'utf8'));
const SITE_URL = (process.env.SITE_URL || facts.site_url).replace(/\/$/, '');

const SKIP = new Set(['node_modules', '.git', '.vercel', 'assets', 'content', 'tools', 'reference', 'seo', 'i18n', 'docs']);
function walk(dir, rel) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) out = out.concat(walk(path.join(dir, e.name), rel ? rel + '/' + e.name : e.name)); }
    else if (e.name === 'index.html') out.push(rel ? rel + '/' + e.name : e.name);
  }
  return out;
}
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)].map((m) => [m[1].toLowerCase(), m[2]]));
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const localDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(d);
const urlPathOf = (file) => (file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, ''));
// --html-roots a,b: where built pages live (default: the repo root; after the Next.js migration: reference,.blog-html).
const HTML_ROOTS = args.includes('--html-roots') ? args[args.indexOf('--html-roots') + 1].split(',').map((d) => path.resolve(ROOT, d)) : [ROOT];
const OUT_FILE = args.includes('--out') ? path.resolve(ROOT, args[args.indexOf('--out') + 1]) : path.join(ROOT, 'sitemap.xml');
const builtPath = (p) => HTML_ROOTS.some((r) => fs.existsSync(path.join(r, p.replace(/^\//, ''), 'index.html')));

// Last commit date of a content file (mtime is checkout time in CI, which would stamp every page with today on each drip build).
function gitDate(file) {
  try {
    const out = require('child_process').execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch { return null; }
}
// content files by slug, for lastmod
const bySlug = {};
for (const dir of ['content/en', 'content/es', 'content/blog/en', 'content/blog/es']) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
    try { const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); if (j.slug) bySlug[j.slug] = { json: j, file: path.join(d, f) }; } catch (e) { /* the build reports bad JSON */ }
  }
}

const entries = [];
let futureSkipped = 0;
let pendingAlternates = 0;
const FILES = HTML_ROOTS.flatMap((r) => (fs.existsSync(r) ? walk(r, '').map((f) => [r, f]) : []));
for (const [root, file] of FILES.sort((a, b) => (a[1] < b[1] ? -1 : 1))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || ['', ''])[1];
  const robots = (head.match(/<meta\s+name="robots"[^>]*>/i) || [''])[0];
  if (/noindex/i.test(robots)) continue;
  const urlPath = urlPathOf(file);
  const canon = (head.match(/<link\s+rel="canonical"[^>]*>/i) || [''])[0];
  const canonHref = attrs(canon).href;
  if (canonHref && canonHref !== SITE_URL + urlPath) continue; // a page that canonicalizes elsewhere does not belong in the sitemap

  let lastmod = null;
  const posted = html.match(/"datePublished":"(\d{4}-\d{2}-\d{2})/);
  if (posted) {
    if (posted[1] > TODAY) { futureSkipped++; continue; }
    const mod = html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})/);
    lastmod = mod && mod[1] <= TODAY ? mod[1] : posted[1];
  } else if (bySlug[urlPath]) {
    const c = bySlug[urlPath];
    lastmod = c.json.updated || gitDate(c.file) || localDate(fs.statSync(c.file).mtime);
  }

  const alts = {};
  for (const tag of head.match(/<link\s+rel="alternate"[^>]*>/gi) || []) {
    const a = attrs(tag);
    if (a.hreflang && a.href && a.href.startsWith(SITE_URL)) alts[a.hreflang.toLowerCase()] = a.href;
  }
  const both = alts.en && alts.es && builtPath(alts.en.slice(SITE_URL.length)) && builtPath(alts.es.slice(SITE_URL.length));
  if (alts.es && !both) pendingAlternates++;
  if (entries.some((e) => e.loc === SITE_URL + urlPath)) continue; // same page found under two roots
  entries.push({ loc: SITE_URL + urlPath, lastmod, alternates: both ? ['en', 'es', 'x-default'].filter((k) => alts[k]).map((k) => [k, alts[k]]) : [] });
}

const body = entries.map((e) => [
  '  <url>',
  `    <loc>${xml(e.loc)}</loc>`,
  ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
  ...e.alternates.map(([k, h]) => `    <xhtml:link rel="alternate" hreflang="${k}" href="${xml(h)}"/>`),
  '  </url>',
].join('\n')).join('\n');
fs.writeFileSync(OUT_FILE, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`);
console.log(`sitemap.xml: ${entries.length} URL(s), ${entries.filter((e) => e.alternates.length).length} with hreflang alternates; ${futureSkipped} future-dated post(s) left out (today ${TODAY}); ${pendingAlternates} page(s) whose Spanish twin is not built yet (no alternates written).`);
