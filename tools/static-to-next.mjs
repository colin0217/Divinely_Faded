#!/usr/bin/env node
// Static site -> Next.js App Router (Bunny Baristas 2026-10-17 pattern, rebuilt as a committed, re-runnable tool).
// Each built page becomes app/(site-<id>)/<route>/page.jsx + layout.jsx (one route group per page so every page owns
// its <head>). Text nodes are emitted as exact string literals so inline whitespace survives JSX. Inline body scripts
// are written to public/legacy/ and loaded in their original DOM order after hydration by components/legacy-scripts.jsx.
// Usage: node tools/static-to-next.mjs <out-dir>     (reads the built static site in this repo; writes only <out-dir>)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.resolve(process.argv[2] || "");
if (!process.argv[2]) { console.error("usage: node tools/static-to-next.mjs <out-dir>"); process.exit(2); }
const require = createRequire(path.join(OUT, "package.json"));
const { parse } = require("parse5");

const SKIP = new Set(["node_modules", ".git", ".github", ".vercel", "assets", "content", "tools", "seo", "i18n", "reference", "docs", "blog-drafts"]);
const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name); }
    else if (e.name === "index.html") pages.push(rel);
  }
})(ROOT, "");
pages.sort();

// ---------- JSX emit ----------
const ATTR = { class: "className", for: "htmlFor", tabindex: "tabIndex", srcset: "srcSet", crossorigin: "crossOrigin", hreflang: "hrefLang", fetchpriority: "fetchPriority", imagesrcset: "imageSrcSet", imagesizes: "imageSizes", playsinline: "playsInline", autoplay: "autoPlay", allowfullscreen: "allowFullScreen", frameborder: "frameBorder", colspan: "colSpan", rowspan: "rowSpan", datetime: "dateTime", readonly: "readOnly", maxlength: "maxLength", referrerpolicy: "referrerPolicy", "accept-charset": "acceptCharset", "http-equiv": "httpEquiv", "xlink:href": "xlinkHref", "xml:space": "xmlSpace", enctype: "encType", novalidate: "noValidate", spellcheck: "spellCheck", contenteditable: "contentEditable", itemprop: "itemProp", itemscope: "itemScope", itemtype: "itemType", usemap: "useMap" };
const BOOL = new Set(["hidden", "muted", "loop", "controls", "open", "playsinline", "autoplay", "disabled", "checked", "required", "defer", "async", "allowfullscreen", "novalidate", "readonly", "selected", "multiple", "itemscope", "reversed", "default", "inert"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const camelSvg = (n) => (n.includes("-") && !n.startsWith("data-") && !n.startsWith("aria-") ? n.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) : n);
const lit = (s) => JSON.stringify(s);
function styleObj(css) {
  const o = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":"); if (i < 0) continue;
    const k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim(); if (!k) continue;
    o[k.startsWith("--") ? k : k.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return `{${lit(o)}}`;
}
function attrs(node, inSvg) {
  return node.attrs.map(({ name, value }) => {
    if (name === "style") return ` style=${styleObj(value)}`;
    if (/^on[a-z]+$/.test(name)) throw new Error(`inline handler ${name} on <${node.tagName}> needs a manual port`);
    const n = ATTR[name] || (inSvg ? camelSvg(name) : name);
    if (BOOL.has(name) && (value === "" || value === name)) return ` ${n}`;
    return ` ${n}=${lit(value)}`;
  }).join("");
}
const scripts = [];
function emit(node, ctx) {
  if (node.nodeName === "#text") return node.value ? `{${lit(node.value)}}` : "";
  if (node.nodeName === "#comment") return "";
  const tag = node.tagName;
  if (tag === "script") {
    const src = node.attrs.find((a) => a.name === "src")?.value;
    const type = node.attrs.find((a) => a.name === "type")?.value;
    const text = node.childNodes.map((c) => c.value || "").join("");
    if (type === "application/ld+json") return `<script type="application/ld+json" dangerouslySetInnerHTML={{__html:${lit(text)}}} />`;
    if (src) { scripts.push({ src: src.startsWith("/") || /^https?:/.test(src) ? src : `/${src}`, ...(type ? { type } : {}) }); return ""; }
    const file = `/legacy/${ctx.group}-${scripts.length + 1}.js`;
    fs.mkdirSync(path.join(OUT, "public/legacy"), { recursive: true });
    fs.writeFileSync(path.join(OUT, "public", file), text);
    scripts.push({ src: file, ...(type && type !== "text/javascript" ? { type } : {}) });
    return "";
  }
  if (tag === "style") return `<style dangerouslySetInnerHTML={{__html:${lit(node.childNodes.map((c) => c.value || "").join(""))}}} />`;
  const inSvg = ctx.svg || tag === "svg";
  const open = `<${tag}${attrs(node, inSvg)}`;
  if (VOID.has(tag)) return `${open} />`;
  const kids = (tag === "template" ? node.content.childNodes : node.childNodes).map((c) => emit(c, { ...ctx, svg: inSvg })).join("");
  return `${open}>${kids}</${tag}>`;
}

// ---------- head -> metadata + raw head elements ----------
function headParts(head) {
  const md = { openGraph: {}, twitter: {}, alternates: { languages: {} } }; const raw = []; let themeColor;
  for (const n of head.childNodes) {
    if (!n.tagName) continue;
    const a = Object.fromEntries(n.attrs.map((x) => [x.name, x.value]));
    if (n.tagName === "title") md.title = n.childNodes.map((c) => c.value).join("");
    else if (n.tagName === "meta" && (a.charset || a.name === "viewport")) continue;
    else if (n.tagName === "meta" && a.name === "description") md.description = a.content;
    else if (n.tagName === "meta" && a.name === "robots") md.robots = a.content;
    else if (n.tagName === "meta" && a.name === "theme-color") themeColor = a.content;
    else if (n.tagName === "meta" && a.property?.startsWith("og:")) {
      const k = a.property.slice(3);
      if (k === "image") md.openGraph.images = [{ url: a.content }]; else md.openGraph[{ locale: "locale", type: "type", title: "title", description: "description", url: "url" }[k] || k] = a.content;
    } else if (n.tagName === "meta" && a.name?.startsWith("twitter:")) md.twitter[a.name.slice(8)] = a.content;
    else if (n.tagName === "link" && a.rel === "canonical") md.alternates.canonical = a.href;
    else if (n.tagName === "link" && a.rel === "alternate" && a.hreflang) md.alternates.languages[a.hreflang] = a.href;
    else raw.push(n);
  }
  if (!Object.keys(md.alternates.languages).length) delete md.alternates.languages;
  if (!md.alternates.canonical && !md.alternates.languages) delete md.alternates;
  if (!Object.keys(md.openGraph).length) delete md.openGraph;
  if (!Object.keys(md.twitter).length) delete md.twitter; else if (md.openGraph?.images) md.twitter.images = md.openGraph.images.map((i) => i.url);
  return { md, raw, themeColor };
}

// ---------- write ----------
const routes = [];
const layoutsDir = path.join(OUT, "app");
fs.rmSync(layoutsDir, { recursive: true, force: true });
fs.rmSync(path.join(OUT, "public/legacy"), { recursive: true, force: true });
for (const rel of pages) {
  const html = fs.readFileSync(path.join(ROOT, rel, "index.html"), "utf8");
  const doc = parse(html);
  const htmlEl = doc.childNodes.find((n) => n.tagName === "html");
  const head = htmlEl.childNodes.find((n) => n.tagName === "head"), body = htmlEl.childNodes.find((n) => n.tagName === "body");
  const lang = htmlEl.attrs.find((a) => a.name === "lang")?.value || "en";
  const route = `/${rel}${rel ? "/" : ""}`;
  const group = `site-${rel ? rel.replace(/\//g, "-") : "index"}`;
  scripts.length = 0;
  scripts.push({ src: "/legacy/video-muted.js" }); // React can't render the `muted` attribute; autoplay needs it before Colin's scripts run
  const bodyJsx = body.childNodes.map((c) => emit(c, { group })).join("");
  const { md, raw, themeColor } = headParts(head);
  const headJsx = raw.map((c) => emit(c, { group })).join("\n");
  const bodyAttrs = attrs(body, false);
  const dir = path.join(OUT, "app", `(${group})`, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "page.jsx"), `// Generated by tools/static-to-next.mjs from ${rel || "."}/index.html. Edit here once the static generator is retired.\nexport default function Page() {\n  return (<>${bodyJsx}</>);\n}\n`);
  const depth = rel ? rel.split("/").length + 1 : 1;
  fs.writeFileSync(path.join(OUT, "app", `(${group})`, "layout.jsx"),
    `import LegacyScripts from '${"../".repeat(2)}components/legacy-scripts';\n\nexport const metadata = ${JSON.stringify(md, null, 2)};\nexport const viewport = ${JSON.stringify({ width: "device-width", initialScale: 1, ...(themeColor ? { themeColor } : {}) }, null, 2)};\n\nexport default function Layout({children}) {\n  return (\n    <html lang=${lit(lang)}>\n      <head>${headJsx}</head>\n      <body${bodyAttrs}>{children}<LegacyScripts scripts={${JSON.stringify(scripts)}} /></body>\n    </html>\n  );\n}\n`);
  routes.push({ route, source: `${rel ? rel + "/" : ""}index.html`, lang, h1: (html.match(/<h1[\s>]/g) || []).length, component: path.relative(OUT, path.join(dir, "page.jsx")) });
  void depth;
}
fs.mkdirSync(path.join(OUT, "public/legacy"), { recursive: true });
fs.writeFileSync(path.join(OUT, "public/legacy/video-muted.js"), "document.querySelectorAll('video[autoplay]').forEach(function(v){v.muted=true;v.setAttribute('muted','');});\n");
fs.mkdirSync(path.join(OUT, "scripts"), { recursive: true });
fs.writeFileSync(path.join(OUT, "scripts/site-routes.json"), JSON.stringify(routes, null, 2) + "\n");
console.log(`static-to-next: ${routes.length} routes -> ${OUT}/app`);
