#!/usr/bin/env node
// Phase G: turn this static site into the Next.js 16.4.3 App Router app Gantry edits (Bunny Baristas pattern).
// Deterministic and one-way. Run it on a clean checkout of the finished static site:
//   node tools/migrate-to-next.mjs            (then: npm install && npm run build)
// What it does:
//   1. builds the static site one last time (tools/build.mjs)
//   2. converts every page to app/(site-<id>)/<route>/page.jsx + layout.jsx (tools/static-to-next.mjs, parse5)
//   3. moves the built HTML into reference/ (the retained HTML reference) and the served files into public/
//   4. writes package.json, next.config.mjs, vercel.json, .gitignore, .nvmrc, components/legacy-scripts.jsx,
//      scripts/check-pages.mjs, and switches the blog drip to the "pulse" model (Vercel rebuilds main daily)
// After migration, pages are edited as JSX; the blog stays JSON (content/blog/**) and is rendered at build time by
// `node tools/build.mjs --blog-only --out .blog-html` (prebuild), served by static route handlers.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TOOLS = path.join(ROOT, "tools");
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
const mv = (from, to) => { if (!fs.existsSync(path.join(ROOT, from))) return; fs.mkdirSync(path.dirname(path.join(ROOT, to)), { recursive: true }); fs.renameSync(path.join(ROOT, from), path.join(ROOT, to)); };
const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.writeFileSync(path.join(ROOT, rel), text); };
if (fs.existsSync(path.join(ROOT, "app"))) { console.error("migrate-to-next: app/ already exists; this checkout is already migrated."); process.exit(1); }

// 1. final static build
run(process.execPath, [path.join(TOOLS, "build.mjs")]);

// 2. package + converter dependency, then convert (parse5 is resolved from this repo's node_modules)
write("package.json", JSON.stringify({
  name: "divinely-faded", private: true,
  scripts: {
    prebuild: "node tools/build.mjs --blog-only --out .blog-html && node tools/build-sitemap.js --html-roots reference,.blog-html --out public/sitemap.xml",
    build: "next build && node scripts/check-pages.mjs",
    dev: "next dev", start: "next start",
    "check:pages": "node scripts/check-pages.mjs",
  },
  engines: { node: ">=22.18 <23" },
  dependencies: { next: "16.4.3", react: "19.3.1", "react-dom": "19.3.1" },
  devDependencies: { parse5: "8.0.0" },
}, null, 2) + "\n");
run("npm", ["install", "--no-fund", "--no-audit"]);
run(process.execPath, [path.join(TOOLS, "static-to-next.mjs"), ROOT]);

// 3. served files -> public/, built HTML -> reference/
const SERVED = ["style.css", "site.css", "df-extras.css", "df-reviews.js", "df-video.js", "script.js", "assets", "favicon.ico", "favicon.svg", "apple-touch-icon.png", "hero-desktop.mp4", "robots.txt", "site.webmanifest", "llms.txt"];
for (const f of fs.readdirSync(ROOT)) if (/^tiktok-\d+\.jpg$/.test(f)) SERVED.push(f);
for (const f of SERVED) mv(f, `public/${f}`);
const HTML = ["index.html", "404.html", "es", "services", "styles", "about", "visit", "faq", "sitemap.xml"];
for (const f of HTML) mv(f, `reference/${f}`);
// The blog is rendered by the prebuild into .blog-html, never kept in reference/ (it changes daily with the drip).
for (const d of ["blog", "reference/es/blog"]) if (fs.existsSync(path.join(ROOT, d))) fs.rmSync(path.join(ROOT, d), { recursive: true });

// 4. Next config, Vercel, ignore files, legacy script loader, page checker, drip
write("next.config.mjs", `/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
};
export default config;
`);
write("vercel.json", JSON.stringify({ framework: "nextjs", buildCommand: "npm run build", installCommand: "npm ci", trailingSlash: true }, null, 2) + "\n");
write(".gitignore", ["node_modules/", ".next/", ".blog-html/", ".qa-html/", ".vercel/", ""].join("\n"));
write(".nvmrc", "22\n");
// Only public/ is served by Next; content/, tools/ and reference/ are needed at build time (blog + sitemap), so they stay.
write(".vercelignore", ["seo", "i18n", "README.md", "SOURCE-CHECKSUMS.json", ""].join("\n"));
for (const d of ["components", "scripts", ".github/workflows"]) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
fs.copyFileSync(path.join(TOOLS, "next-templates", "legacy-scripts.jsx"), path.join(ROOT, "components", "legacy-scripts.jsx"));
fs.copyFileSync(path.join(TOOLS, "next-templates", "check-pages.mjs"), path.join(ROOT, "scripts", "check-pages.mjs"));
fs.copyFileSync(path.join(TOOLS, "next-templates", "daily-drip.yml"), path.join(ROOT, ".github", "workflows", "daily-drip.yml"));
console.log("migrate-to-next: done. Next: npm run build (prebuild renders the blog + sitemap), then the parity proof.");
