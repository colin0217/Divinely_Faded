#!/usr/bin/env node
// Divinely Faded static generator. content/<locale>/*.json (+ content/blog/<locale>/*.json) -> /<slug>/index.html
// Renders ONLY Colin's components (experience/intro, services/section-heading, service-list, feature, review)
// and stamps the shared header/menu/footer into every page, including Colin's homepage (between its own tags).
// No dependencies. Usage: node tools/build.mjs [--today YYYY-MM-DD]   (blog posts dated after today are not built)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const facts = read("content/facts.json");
const SITE = (process.env.SITE_URL || facts.site_url).replace(/\/$/, "");
const argToday = process.argv.includes("--today") ? process.argv[process.argv.indexOf("--today") + 1] : null;
// --blog-only --out <dir>: only blog hubs + posts, written under <dir> (Next.js prebuild serves them as static route handlers).
const BLOG_ONLY = process.argv.includes("--blog-only");
const OUT_ROOT = process.argv.includes("--out") ? path.resolve(process.argv[process.argv.indexOf("--out") + 1]) : ROOT;
const TODAY = argToday || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
const MAN = "assets/photos/manifest.json";
let photosMan = fs.existsSync(path.join(ROOT, MAN)) ? read(MAN) : {};

// ---------- chrome strings ----------
const T = {
  en: {
    lang: "en", home: "/", book: "MAKE A BOOKING", menuOpen: "Open navigation", skip: "Skip to content",
    nav: [["services", "Services"], ["styles", "Styles"], ["about", "About"], ["/#gallery", "Gallery"], ["blog", "Blog"], ["visit", "Visit us"], ["faq", "FAQ"]],
    bookAppt: "Book an appointment", city: "CARLSBAD, NEW MEXICO", toggle: "ES", toggleLabel: "Ver esta página en español",
    madeIn: "Made in<br>Carlsbad.", fAbout: "About", fServices: "Services", fStyles: "Styles", fBlog: "Blog", fVisit: "Visit Us", fBook: "Book Now", fReviews: "Reviews", fFaq: "FAQ",
    policies: "Booking &amp; Cancellation Policies", directions: "Directions", text: "Text", call: "Call",
    hours: "Mon, Tue, Thu, Fri 9–12 &amp; 12:30–5 · Sat 8–2 · Closed Wed &amp; Sun",
    designed: "Designed by", powered: "Powered by", ctaEyebrow: "READY WHEN YOU ARE", ctaHead: "Take a seat.", ctaBook: "BOOK ON BOOKSY", ctaText: "TEXT TIM", ctaCall: "CALL",
    bookThis: "Book this service", learnMore: "LEARN MORE", varies: "Varies", min: "min", hr: "hr", crumbHome: "Home", footerPhotoAlt: "Tim seated in his barbershop",
    rvEyebrow: "FROM THE CHAIR / GOOGLE & BOOKSY", rvOn: "on", rvReviews: "reviews", rvAsOf: "As of", rvPrev: "Previous review", rvNext: "Next review", rvMore: "READ MORE ON GOOGLE", rvPause: "PAUSE", rvPlay: "PLAY", rvLabel: "Client reviews", rvStars: "5 stars", rvOrig: "",
    ariaHome: "Divinely Faded home", ariaFooter: "Divinely Faded footer", ariaSocial: "Social media", ariaOn: "Divinely Faded on", ariaCrumbs: "Breadcrumb",
    lbLabel: "Portfolio photo", lbClose: "Close photo", lbCloseText: "CLOSE ✕", lbAlt: "Enlarged Divinely Faded portfolio photo", reserveName: "Barber appointment",
  },
  es: {
    lang: "es", home: "/es/", book: "AGENDA TU CITA", menuOpen: "Abrir menú", skip: "Ir al contenido",
    nav: [["services", "Servicios"], ["styles", "Estilos"], ["about", "Sobre mí"], ["/es/#gallery", "Galería"], ["blog", "Blog"], ["visit", "Visítanos"], ["faq", "Preguntas"]],
    bookAppt: "Agendar una cita", city: "CARLSBAD, NUEVO MÉXICO", toggle: "EN", toggleLabel: "View this page in English",
    madeIn: "Hecho en<br>Carlsbad.", fAbout: "Sobre mí", fServices: "Servicios", fStyles: "Estilos", fBlog: "Blog", fVisit: "Visítanos", fBook: "Agendar", fReviews: "Reseñas", fFaq: "Preguntas",
    policies: "Políticas de citas y cancelación", directions: "Cómo llegar", text: "Mensaje de texto", call: "Llamar",
    hours: "Lun, mar, jue, vie 9–12 y 12:30–5 · Sáb 8–2 · Cerrado mié y dom",
    designed: "Diseñado por", powered: "Con tecnología de", ctaEyebrow: "LISTO CUANDO TÚ LO ESTÉS", ctaHead: "Toma asiento.", ctaBook: "AGENDA EN BOOKSY", ctaText: "MENSAJE A TIM", ctaCall: "LLAMAR",
    bookThis: "Agenda este servicio", learnMore: "VER MÁS", varies: "Varía", min: "min", hr: "h", crumbHome: "Inicio", footerPhotoAlt: "Tim sentado en su barbería",
    rvEyebrow: "DESDE LA SILLA / GOOGLE Y BOOKSY", rvOn: "en", rvReviews: "reseñas", rvAsOf: "Al", rvPrev: "Reseña anterior", rvNext: "Reseña siguiente", rvMore: "LEER MÁS EN GOOGLE", rvPause: "PAUSAR", rvPlay: "REPRODUCIR", rvLabel: "Reseñas de clientes", rvStars: "5 estrellas", rvOrig: "Reseñas originales en inglés.",
    ariaHome: "Inicio de Divinely Faded", ariaFooter: "Pie de página de Divinely Faded", ariaSocial: "Redes sociales", ariaOn: "Divinely Faded en", ariaCrumbs: "Ruta de navegación",
    lbLabel: "Foto del portafolio", lbClose: "Cerrar foto", lbCloseText: "CERRAR ✕", lbAlt: "Foto ampliada del portafolio de Divinely Faded", reserveName: "Cita en la barbería",
  },
};

// ---------- load pages ----------
function loadDir(dir) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => ({ ...read(path.join(dir, f)), _file: path.join(dir, f) }));
}
const pages = [...loadDir("content/en"), ...loadDir("content/es")];
const posts = [...loadDir("content/blog/en"), ...loadDir("content/blog/es")].map((p) => ({ ...p, _post: true }));
const live = (p) => !p._post || (p.date && p.date <= TODAY);
const all = [...pages, ...posts.filter(live)];
const byKey = new Map(all.map((p) => [`${p.locale}:${p.id}`, p]));

// Tokens in titles, cards and SEO fields too (posts state times/prices in headlines).
const fillMeta = () => { for (const p of all) { const t = T[p.locale]; for (const k of ["title", "card_text"]) if (p[k]) p[k] = fill(p[k], t); if (p.seo) for (const k of ["title", "description"]) if (p.seo[k]) p.seo[k] = fill(p.seo[k], t); } };

// ---------- photo preflight: fetch any library photo the content uses but the manifest lacks ----------
{
  const used = new Set();
  const walk = (v, k) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, k));
    if (v && typeof v === "object") return Object.entries(v).forEach(([kk, x]) => walk(x, kk));
    if (typeof v === "string" && ["photos", "photo", "og_photo", "hero", "card_photo"].includes(k) && /^[a-z0-9-]+$/.test(v)) used.add(v);
  };
  all.forEach((p) => walk(p));
  const lacking = () => [...used].filter((n) => !photosMan[n] || !fs.existsSync(path.join(ROOT, `assets/photos/${n}-1200.webp`)));
  if (lacking().length) {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("python3", [path.join(ROOT, "tools/photos.py"), ...lacking()], { stdio: "inherit" });
    photosMan = fs.existsSync(path.join(ROOT, MAN)) ? read(MAN) : {};
    if (r.status !== 0 || lacking().length) {
      console.error(`build: photos missing from ${MAN}: ${lacking().join(", ")}\n  run: python3 tools/photos.py ${lacking().join(" ")}  (needs network + Pillow)`);
      process.exit(1);
    }
  }
}

// ---------- helpers ----------
const MISSING = new Set();
const OG_NEEDED = new Set(); // og photos used by pages, turned into 1200x630 cards after the build
const esc = (s) => String(s ?? "").replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z]+);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const html = (s) => String(s ?? ""); // trusted copy may contain <br> / <a> / <strong>
const svc = (id) => facts.services.find((s) => s.id === id) || (() => { throw new Error(`unknown service id ${id}`); })();
// Colin's homepage format: whole hours as "2 hr", anything else in minutes ("90 min").
function minutes(n, t) { return n >= 60 && n % 60 === 0 ? `${n / 60} ${t.hr}` : `${n} ${t.min}`; }
function fill(s, t) {
  return String(s ?? "")
    .replace(/\{\{price:([a-z0-9-]+)\}\}/g, (_, id) => (svc(id).price == null ? t.varies : `$${svc(id).price}`))
    .replace(/\{\{minutes:([a-z0-9-]+)\}\}/g, (_, id) => minutes(svc(id).minutes, t))
    .replace(/\{\{addon:([a-z0-9-]+)\}\}/g, (_, id) => { const a = facts.addons.find((x) => x.name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === id); if (!a) throw new Error(`unknown addon ${id}`); return `$${a.price}`; })
    .replace(/\{\{holiday_fee\}\}/g, `$${facts.holiday_fee}`)
    .replace(/\{\{phone\}\}/g, facts.phone.display)
    .replace(/\{\{address\}\}/g, `${facts.address.street}, ${facts.address.city}, ${facts.address.region} ${facts.address.postal}`);
}
function href(h, loc) {
  if (!h) return "#";
  if (h === "booksy") return bk(loc);
  if (h === "sms") return `sms:${facts.phone.e164}`;
  if (h === "tel") return `tel:${facts.phone.e164}`;
  if (h === "directions") return facts.directions;
  if (h === "reviews") return facts.booksy_reviews;
  if (h.startsWith("page:")) { const p = byKey.get(`${loc}:${h.slice(5)}`) || byKey.get(`en:${h.slice(5)}`); if (!p) { MISSING.add(h); return "#missing-" + h.slice(5); } return p.slug; }
  if (/^(services|styles|about|visit|faq|blog)$/.test(h)) { const p = byKey.get(`${loc}:${h}`); return p ? p.slug : (loc === "es" ? `/es/${h}/` : `/${h}/`); }
  return h;
}
const bk = (loc) => (loc === "es" && facts.booksy_es) || facts.booksy; // Tim's Spanish Booksy page on /es/
const ext = (u) => /^(https?:|sms:|tel:)/.test(u);
const aAttrs = (u) => (/^https?:/.test(u) ? ` target="_blank" rel="noopener"` : "");
function img(name, alt, { eager = false, sizes = "(min-width:701px) 50vw, 100vw" } = {}) {
  if (/^https?:/.test(name)) return `<img src="${esc(name)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
  const m = photosMan[name];
  if (!m) throw new Error(`photo not in manifest: ${name} (run python3 tools/photos.py)`);
  const w = Math.min(1200, m.w), h = Math.round(m.h * w / m.w);
  return `<img src="/assets/photos/${name}-1200.webp" srcset="/assets/photos/${name}-640.webp 640w, /assets/photos/${name}-1200.webp 1200w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}"${eager ? ' fetchpriority="high"' : ""} decoding="async">`;
}
const altOf = (p, name, b) => (b && b.alt && typeof b.alt === "object" ? b.alt[name] : "") || (p.photo_alt || {})[name] || (p.alt_text || p.alts || {})[name] || (p.alt && typeof p.alt === "object" ? p.alt[name] : "") || "";
// The other-language URL, only once that page is actually built (no hreflang/toggle to a 404).
const altSlug = (p) => (p.id === "home" ? (p.locale === "en" ? (byKey.has("es:home") ? "/es/" : undefined) : "/") : byKey.get(`${p.locale === "en" ? "es" : "en"}:${p.id}`)?.slug);

// ---------- blocks ----------
function blockHTML(b, p, t, first) {
  const L = p.locale;
  const paras = (b.paragraphs || []).map((x) => `<p data-df-reveal>${html(fill(x, t))}</p>`).join("");
  const photos = (b.photos || []).slice(0, 2);
  const pair = photos.length ? `<div class="photo-pair">${photos.map((n, i) => img(n, altOf(p, n, b), { eager: first && i === 0 })).join("")}</div>` : "";
  const H = first ? "h1" : "h2";
  switch (b.type) {
    case "intro":
      return `<section class="experience${pair ? "" : " df-no-photos"}" data-df-reveal-group>${pair}<div class="intro"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.h1 || b.heading)}</${H}><div class="intro-copy" data-df-reveal-group>${paras}${b.link ? `<a class="text-link" data-df-reveal href="${esc(href(b.link.href, L))}"${aAttrs(href(b.link.href, L))}>${esc(b.link.label)}</a>` : ""}</div></div></section>`;
    case "section":
      return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div><div class="df-prose" data-df-reveal-group>${paras}${(b.subsections || []).map((s) => `<h3 data-df-reveal>${html(s.heading)}</h3>${(s.paragraphs || []).map((x) => `<p data-df-reveal>${html(fill(x, t))}</p>`).join("")}`).join("")}${b.bullets ? `<ul data-df-reveal>${b.bullets.map((x) => `<li>${html(fill(x, t))}</li>`).join("")}</ul>` : ""}${b.link ? `<a class="text-link" data-df-reveal href="${esc(href(b.link.href, L))}"${aAttrs(href(b.link.href, L))}>${esc(b.link.label)}</a>` : ""}</div>${pair}</section>`;
    case "list":
    case "faq": {
      const items = (b.items || []).map((it) => {
        const title = it.title || it.q, body = it.body || it.a;
        const meta = it.meta ? `<span class="price">${html(fill(it.meta, t))}</span>` : "";
        // Per-service Booksy link when facts has one (service id from it.service or the row's {{price:id}} token); else the profile.
        const sid = it.service || (String(it.meta || "").match(/\{\{price:([a-z0-9-]+)\}\}/) || [])[1];
        const sv = sid && facts.services.find((x) => x.id === sid);
        const bookHref = (sv && (L === "es" ? sv.booksy_url_es || sv.booksy_url : sv.booksy_url)) || bk(L);
        const book = it.book ? `<a class="pill" href="${esc(bookHref)}" target="_blank" rel="noopener">${esc(it.book_label || t.bookThis)}</a>` : "";
        const more = it.href ? `<a class="text-link" href="${esc(href(it.href, L))}"${aAttrs(href(it.href, L))}>${esc(it.link_label || t.learnMore)}</a>` : "";
        return `<details><summary><span>${html(fill(title, t))}</span>${meta}<span class="plus">+</span></summary><div class="service-detail"><p>${html(fill(body, t))}</p>${more}${book}</div></details>`;
      }).join("");
      return `<section class="services df-section${b.type === "faq" ? " df-faq" : ""}" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div><div class="service-list">${items}</div></section>`;
    }
    case "feature":
      return `<section class="feature${b.photo ? "" : " df-feature-text"}">${b.photo ? img(b.photo, altOf(p, b.photo, b), { sizes: "100vw" }) : ""}<div><span class="eyebrow">${esc(b.eyebrow)}</span><h2>${html(b.heading)}</h2>${b.button ? `<a class="pill" href="${esc(href(b.button.href, L))}"${aAttrs(href(b.button.href, L))}>${esc(b.button.label)}</a>` : ""}</div></section>`;
    case "table": {
      const rows = b.rows === "nearby" ? facts.nearby.map((r) => [r.town, `${r.mi} mi`, `${r.min} min`]) : b.rows;
      return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div><table class="df-table" data-df-reveal><thead><tr>${b.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>${paras ? `<div class="df-prose">${paras}</div>` : ""}</section>`;
    }
    case "cards": {
      // items: page ids, or { id, text } to override the card line
      const items = (b.items || b.pages || []).map((it) => (typeof it === "string" ? { id: it } : it)).map((it) => {
        const q = byKey.get(`${L}:${it.id}`);
        if (!q) { MISSING.add(`page:${it.id}`); return null; }
        return { q, text: it.text };
      }).filter(Boolean);
      return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div><div class="df-cards">${items.map(({ q, text }) => { const ph = q.card_photo || q.seo?.og_photo || q.hero; return `<a class="df-card" data-df-reveal href="${q.slug}">${ph ? img(ph, altOf(q, ph) || q.nav_label || "", { sizes: "(min-width:701px) 33vw, 100vw" }) : ""}<h3>${esc(q.nav_label || q.title)}</h3><p>${esc(text || q.card_text || q.seo?.description || "")}</p></a>`; }).join("")}</div></section>`;
    }
    case "map": {
      // Google Maps embed by street address (the pin reads 303; the Business Profile card still says 301), grayscale, lazy.
      const q = encodeURIComponent(`${facts.address.street}, ${facts.address.city}, ${facts.address.region} ${facts.address.postal}`);
      return `<section class="services df-section df-map-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div><div class="df-map"><iframe src="https://maps.google.com/maps?q=${q}&amp;z=16&amp;hl=${L}&amp;output=embed" title="${esc(b.title || "Map")}" loading="lazy" allowfullscreen></iframe></div><a class="text-link" data-df-reveal href="${esc(facts.directions)}" target="_blank" rel="noopener">${esc(b.link_label || t.directions)}</a></section>`;
    }
    case "posts": {
      // Live posts in this locale, newest first (the date gate already dropped future posts from `all`).
      const list = all.filter((q) => q._post && q.locale === L).sort((a, z) => (z.date > a.date ? 1 : z.date < a.date ? -1 : 0)).slice(0, b.limit || Infinity);
      const fmt = (d) => new Date(d + "T12:00:00Z").toLocaleDateString(L === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
      return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${esc(b.eyebrow)}</span><${H} data-df-reveal>${html(b.heading)}</${H}>${b.lead ? `<p data-df-reveal>${html(fill(b.lead, t))}</p>` : ""}</div>${list.length ? `<div class="df-cards">${list.map((q) => `<a class="df-card" data-df-reveal href="${q.slug}">${q.hero ? img(q.hero, q.hero_alt || "", { sizes: "(min-width:701px) 33vw, 100vw" }) : ""}<span class="df-card-date">${fmt(q.date)}</span><h3>${esc(q.title)}</h3><p>${esc(q.card_text || q.seo?.description || "")}</p></a>`).join("")}</div>` : `<div class="df-prose"><p data-df-reveal>${esc(b.empty || "")}</p></div>`}</section>`;
    }
    default:
      throw new Error(`${p._file}: unknown block type ${b.type}`);
  }
}

// ---------- chrome ----------
function header(p, t) {
  const alt = altSlug(p);
  return `<a class="skip" href="#main">${t.skip}</a><header><a class="logo" href="${t.home}">DIVINELY FADED<small>ELEVATE YOUR STANDARD</small></a><nav class="header-links">${alt ? `<a class="df-lang" href="${alt}" hreflang="${p.locale === "en" ? "es" : "en"}" lang="${p.locale === "en" ? "es" : "en"}" aria-label="${t.toggle}: ${t.toggleLabel}">${t.toggle}</a>` : ""}<a class="pill" href="${bk(p.locale)}" target="_blank" rel="noopener">${t.book}</a><button id="menu-toggle" aria-expanded="false" aria-controls="menu" aria-label="${t.menuOpen}"><span></span><span></span><span></span></button></nav></header>`;
}
function menu(p, t) {
  const alt = altSlug(p);
  return `<nav id="menu" hidden>${t.nav.map(([k, label]) => `<a href="${k.startsWith("/") ? k : href(k, p.locale)}">${label}</a>`).join("")}<a href="${bk(p.locale)}" target="_blank" rel="noopener">${t.bookAppt}</a>${alt ? `<a href="${alt}" lang="${p.locale === "en" ? "es" : "en"}">${p.locale === "en" ? "Español" : "English"}</a>` : ""}<p>${t.city}</p></nav>`;
}
const SOCIAL = {
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.98H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.77-3.9 1.1 0 2.25.2 2.25.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.9h-2.34v6.98A10 10 0 0 0 22 12z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.7 2h-3.2v13.3a3.25 3.25 0 1 1-2.8-3.22V8.82a6.5 6.5 0 1 0 6 6.48V8.56A8.4 8.4 0 0 0 22 10V6.78A5.2 5.2 0 0 1 16.7 2Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.6-.46-5.33a2.78 2.78 0 0 0-1.95-1.97C18.88 4.24 12 4.24 12 4.24s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.67C1 8.4 1 12 1 12s0 3.6.46 5.33a2.78 2.78 0 0 0 1.95 1.97c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.97C23 15.6 23 12 23 12zM9.75 15.27V8.73L15.5 12l-5.75 3.27z"/></svg>`,
};
function footer(loc) {
  const t = T[loc], P = (k) => href(k, loc);
  const soc = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]]
    .map(([k, n]) => `<a href="${facts.social[k]}" target="_blank" rel="noopener" aria-label="${t.ariaOn} ${n}" title="${n}">${SOCIAL[k]}</a>`).join("");
  return `<footer id="location" class="df-new-footer" aria-label="${t.ariaFooter}">
  <div class="df-footer-left">
    <h2>${t.madeIn}</h2>
    <div class="df-footer-nav">
      <div class="df-footer-links"><a href="${P("about")}">${t.fAbout}</a><a href="${P("services")}">${t.fServices}</a><a href="${P("styles")}">${t.fStyles}</a><a href="${P("blog")}">${t.fBlog}</a></div>
      <div class="df-footer-links"><a href="${P("visit")}">${t.fVisit}</a><a href="${bk(loc)}" target="_blank" rel="noopener">${t.fBook}</a><a href="${facts.booksy_reviews}" target="_blank" rel="noopener">${t.fReviews}</a><a href="${P("faq")}">${t.fFaq}</a></div>
    </div>
    <div class="df-footer-social" aria-label="${t.ariaSocial}">${soc}</div>
    <p class="df-footer-address">${esc(facts.address.street)}, ${facts.address.city}, ${facts.address.region} ${facts.address.postal}<br><a href="sms:${facts.phone.e164}">${t.text} ${facts.phone.display}</a> · <a href="tel:${facts.phone.e164}">${t.call}</a><span class="df-footer-hours">${t.hours}</span></p>
    <p class="df-footer-copyright">© ${TODAY.slice(0, 4)} Divinely Faded</p>
    <div class="df-footer-credits"><span>${t.designed} <a href="https://permianmedia.com/?utm_source=divinely-faded&amp;utm_medium=footer-credit&amp;utm_campaign=designed-by" target="_blank" rel="noopener"><img src="/assets/brand/permian-media.png" alt="" width="25" height="18"> Permian Media</a></span><span>${t.powered} <a href="https://digitalgravitystudio.com/?utm_source=divinely-faded&amp;utm_medium=footer-credit&amp;utm_campaign=powered-by" target="_blank" rel="noopener"><img src="/assets/brand/digital-gravity.png" alt="" width="18" height="18"> Digital Gravity</a></span></div>
    <div class="df-footer-bottom-links"><a href="${bk(loc)}" target="_blank" rel="noopener">${t.policies}</a><a href="${facts.directions}" target="_blank" rel="noopener">${t.directions}</a></div>
  </div>
  <div class="df-footer-photo">
    <img src="https://kfn00ghfuedoecga.public.blob.vercel-storage.com/divinely%20fadeed%20pic%20of%20tim.jpg" alt="${t.footerPhotoAlt}" width="1912" height="1912" loading="lazy" decoding="async">
    <div class="df-footer-photo-logo" aria-label="Divinely Faded — Elevate Your Standard"><strong>DIVINELY FADED</strong><small>ELEVATE YOUR STANDARD</small></div>
  </div>
</footer><dialog id="lightbox" aria-label="${t.lbLabel}"><button id="close-photo" aria-label="${t.lbClose}">${t.lbCloseText}</button><img alt="${t.lbAlt}"></dialog>`;
}
// Reviews (content/reviews.json): Colin's .review component as a carousel. Visible ratings with an "as of" date;
// quotes verbatim in English (lang="en"); no rating schema (self-serving LocalBusiness ratings are ineligible).
const REVIEWS = fs.existsSync(path.join(ROOT, "content/reviews.json")) ? read("content/reviews.json") : null;
const REVIEW_PAGES = new Set(["services", "about", "visit"]);
function reviewsHTML(loc) {
  if (!REVIEWS) return "";
  const t = T[loc], R = REVIEWS;
  const asOf = new Date(R.as_of + "T12:00:00Z").toLocaleDateString(loc === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const rating = (k) => { const x = R.sources[k]; return `<a href="${esc(k === "booksy" && loc === "es" ? x.url.replace("/en-us/", "/es-us/") : x.url)}" target="_blank" rel="noopener" data-count="${k}:${x.count}"><span aria-hidden="true">★</span> ${x.rating.toFixed(1)} ${t.rvOn} ${x.label} · ${x.count} ${t.rvReviews}</a>`; };
  const slides = R.quotes.map((q, i) => `<figure class="df-review-slide${i ? "" : " is-active"}"${i ? ' aria-hidden="true"' : ""}><p class="stars" aria-label="${t.rvStars}">★★★★★</p><blockquote lang="en">“${esc(q.text)}”</blockquote><figcaption>${esc(q.author.toUpperCase())} · ${esc(R.sources[q.source].label.toUpperCase())}${q.service ? ` · ${esc(q.service.toUpperCase())}` : ""}</figcaption></figure>`).join("");
  return `<section class="review df-reviews" data-df-reviews aria-roledescription="carousel" aria-label="${t.rvLabel}"><span class="eyebrow">${t.rvEyebrow}</span><p class="df-ratings">${rating("google")}${rating("booksy")}<small>${t.rvAsOf} ${asOf}${t.rvOrig ? ` · ${t.rvOrig}` : ""}</small></p><div class="df-review-slides" aria-live="off">${slides}</div><div class="df-review-nav" hidden><button type="button" class="df-review-prev" aria-label="${t.rvPrev}">‹</button><span class="df-review-pos">1 / ${R.quotes.length}</span><button type="button" class="df-review-next" aria-label="${t.rvNext}">›</button><button type="button" class="df-review-pause" aria-pressed="false" data-pause="${t.rvPause}" data-play="${t.rvPlay}">${t.rvPause}</button></div><a class="text-link" href="${esc(R.sources.google.url)}" target="_blank" rel="noopener">${t.rvMore}</a></section>`;
}
function cta(t) {
  return `<section class="review df-cta" data-df-reveal-group><span class="eyebrow" data-df-reveal>${t.ctaEyebrow}</span><h2 data-df-reveal>${t.ctaHead}</h2><div class="df-cta-actions" data-df-reveal><a class="pill" href="${bk(t.lang)}" target="_blank" rel="noopener">${t.ctaBook}</a><a class="pill" href="sms:${facts.phone.e164}">${t.ctaText}</a><a class="pill" href="tel:${facts.phone.e164}">${t.ctaCall}</a></div></section>`;
}

// Last commit date of a page's content file (for WebPage.dateModified); null outside git.
const GIT_DATES = new Map();
function gitDate(file) {
  if (!file) return null;
  if (!GIT_DATES.has(file)) {
    let d = null;
    try { d = (execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }) || "").trim() || null; } catch { d = null; }
    GIT_DATES.set(file, /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : null);
  }
  return GIT_DATES.get(file);
}
// ---------- JSON-LD ----------
const DAYS = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };
const SERVICE_TYPE = {
  "essential-haircut": { en: "Men's haircut", es: "Corte de pelo para hombre" }, "signature-cut": { en: "Men's haircut and beard trim", es: "Corte de pelo y corte de barba" },
  "luxury-grooming": { en: "Men's grooming package", es: "Paquete de arreglo personal para hombre" }, "straight-razor-beard-shave": { en: "Straight razor shave", es: "Afeitado con navaja" },
  "head-beard-shave": { en: "Head and beard shave", es: "Afeitado de cabeza y barba" }, "express-facial": { en: "Men's facial", es: "Facial para hombre" }, "deluxe-facial": { en: "Men's facial", es: "Facial para hombre" },
  braids: { en: "Braids", es: "Trenzas" }, "color-transformation": { en: "Hair coloring", es: "Coloración del cabello" }, perm: { en: "Perm", es: "Permanente" },
};
function business(loc = "en") {
  return {
    "@type": "HairSalon", "@id": `${SITE}/#business`, name: facts.name, url: `${SITE}/`, telephone: facts.phone.e164,
    image: `${SITE}/assets/photos/team-tim-portrait-1200.webp`, priceRange: "$5–$120", slogan: facts.tagline,
    address: { "@type": "PostalAddress", streetAddress: facts.address.street, addressLocality: facts.address.city, addressRegion: facts.address.region, postalCode: facts.address.postal, addressCountry: facts.address.country },
    geo: { "@type": "GeoCoordinates", latitude: facts.address.lat, longitude: facts.address.lng },
    openingHoursSpecification: facts.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days.map((d) => DAYS[d]), opens: h.open, closes: h.close })),
    paymentAccepted: facts.payment.join(", "), currenciesAccepted: "USD", founder: { "@id": `${SITE}/#tim` },
    sameAs: [...Object.values(facts.social), facts.gbp, facts.booksy],
    hasMap: facts.gbp,
    areaServed: [{ "@type": "City", name: "Carlsbad", containedInPlace: { "@type": "State", name: "New Mexico" } }, ...facts.nearby.map((n) => ({ "@type": "Place", name: `${n.town}, NM` }))],
    hasOfferCatalog: { "@type": "OfferCatalog", name: loc === "es" ? "Servicios" : "Services", itemListElement: facts.services.filter((sv) => sv.price != null).map((sv) => ({ "@type": "Offer", price: sv.price, priceCurrency: "USD", itemOffered: { "@type": "Service", "@id": `${SITE}/#service-${sv.id}`, name: sv.name, serviceType: (SERVICE_TYPE[sv.id] || {})[loc] || sv.name } })) },
    potentialAction: { "@type": "ReserveAction", target: { "@type": "EntryPoint", urlTemplate: bk(loc), actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] }, result: { "@type": "Reservation", name: T[loc].reserveName } },
  };
}
function jsonld(p) {
  const url = SITE + p.slug, L = p.locale === "es" ? "es-US" : "en-US";
  const g = [business(p.locale),
    { "@type": "Person", "@id": `${SITE}/#tim`, name: "Timothy Murillo", alternateName: "Tim Murillo", url: `${SITE}${p.locale === "es" ? "/es/sobre-mi/" : "/about/"}`, image: `${SITE}/assets/photos/team-tim-portrait-1200.webp`, jobTitle: p.locale === "es" ? "Barbero y dueño" : "Barber and owner", worksFor: { "@id": `${SITE}/#business` } },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: facts.name, inLanguage: pages.some((x) => x.locale === "es") ? ["en-US", "es-US"] : "en-US", publisher: { "@id": `${SITE}/#business` } },
    { "@type": p._post ? "WebPage" : ({ about: "AboutPage", visit: "ContactPage" }[p.id] || (/^(services|styles|blog)$/.test(p.id) ? "CollectionPage" : "WebPage")), "@id": `${url}#webpage`, url, name: p.seo?.title, description: p.seo?.description, inLanguage: L, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#business` }, breadcrumb: { "@id": `${url}#breadcrumb` }, ...(gitDate(p._file) ? { dateModified: gitDate(p._file) } : {}), ...(/^(services|styles|blog)$/.test(p.id) && !p._post ? { hasPart: all.filter((q) => q.locale === p.locale && q.id !== p.id && (p.id === "blog" ? q._post : q.id.startsWith(p.id + "-"))).map((q) => ({ "@type": q._post ? "BlogPosting" : "WebPage", "@id": `${SITE}${q.slug}#${q._post ? "post" : "webpage"}`, url: `${SITE}${q.slug}`, name: q.title || q.nav_label || q.seo?.title })) } : {}), ...(p.seo?.og_photo ? { primaryImageOfPage: `${SITE}/assets/photos/${p.seo.og_photo}-1200.webp` } : {}) },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: (p.breadcrumb || [[T[p.locale].crumbHome, T[p.locale].home]]).map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + u })) }];
  // One Service entity per service site-wide (@id on the site root), a generic service type per language, the locale's Booksy link.
  const serviceNode = (key, name, price) => ({ "@type": "Service", "@id": `${SITE}/#service-${key}`, name, serviceType: (SERVICE_TYPE[key] || {})[p.locale] || p.schema.service_type || name, provider: { "@id": `${SITE}/#business` }, areaServed: { "@type": "City", name: "Carlsbad, NM" }, ...(price != null ? { offers: { "@type": "Offer", price, priceCurrency: "USD", url: bk(p.locale) } } : {}) });
  for (const id of p.schema?.service_ids || []) { const s = svc(id); g.push(serviceNode(id, s.name, s.price)); }
  for (const name of p.schema?.addons || []) { const a = facts.addons.find((x) => x.name === name); if (!a) throw new Error(`${p._file}: unknown addon ${name}`); g.push(serviceNode(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), a.name, a.price)); }
  // A service page with no single Booksy line (kids book the regular haircuts) still declares its Service, without an offer.
  if (p.schema?.type === "Service" && !p.schema.service_ids?.length && !p.schema.addons?.length && p.schema.name) g.push(serviceNode("main", p.schema.name, null));
  // The homepage TikToks (facts.videos): names/descriptions describe only what each poster shows; dates from the video ids.
  if (p.id === "home") for (const v of facts.videos || []) g.push({ "@type": "VideoObject", "@id": `${SITE}${p.slug}#video-${v.id}`, name: v.name[p.locale], description: v.description[p.locale], thumbnailUrl: `${SITE}${v.poster}`, uploadDate: v.upload, embedUrl: `https://www.tiktok.com/player/v1/${v.id}`, url: `https://www.tiktok.com/@divinelyfaded/video/${v.id}`, ...(v.duration ? { duration: v.duration } : {}), inLanguage: L, publisher: { "@id": `${SITE}/#business` } });
  const faqs = (p.blocks || []).filter((b) => b.type === "faq").flatMap((b) => b.items);
  if (faqs.length) g.push({ "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((f) => ({ "@type": "Question", name: fill(f.q || f.title, T[p.locale]).replace(/<[^>]+>/g, ""), acceptedAnswer: { "@type": "Answer", text: fill(f.a || f.body, T[p.locale]).replace(/<[^>]+>/g, "") } })) });
  if (p._post) g.push({ "@type": "BlogPosting", "@id": `${url}#post`, headline: p.title, description: p.seo?.description, datePublished: p.date, dateModified: p.updated || p.date, inLanguage: L, author: { "@id": `${SITE}/#tim` }, publisher: { "@id": `${SITE}/#business` }, mainEntityOfPage: { "@id": `${url}#webpage` }, image: p.hero ? (p.hero.startsWith("http") ? p.hero : `${SITE}/assets/photos/${p.hero}-1200.webp`) : `${SITE}/assets/photos/${p.seo?.og_photo || "team-tim-portrait"}-1200.webp` });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": g }).replace(/</g, "\\u003c");
}

function head(p) {
  const url = SITE + p.slug, alt = altSlug(p), en = p.locale === "en" ? p.slug : alt, es = p.locale === "es" ? p.slug : alt;
  const ogName = p.seo?.og_photo || (p.hero && !p.hero.startsWith("http") ? p.hero : "team-tim-portrait");
  OG_NEEDED.add(ogName);
  // 1200x630 card when it exists (made by tools/og.py after a local build), else the photo itself, so CI never fails on it.
  const og = fs.existsSync(path.join(ROOT, `assets/og/${ogName}.jpg`)) ? `${SITE}/assets/og/${ogName}.jpg` : `${SITE}/assets/photos/${ogName}-1200.webp`;
  const ogAlt = (p.photo_alt || {})[ogName] || (p.hero === ogName && p.hero_alt) || `${p.seo?.title || facts.name}`;
  return `<!doctype html><html lang="${p.locale === "es" ? "es" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.seo.title)}</title><meta name="description" content="${esc(p.seo.description)}"><link rel="canonical" href="${url}">${en ? `<link rel="alternate" hreflang="en" href="${SITE}${en}">` : ""}${es ? `<link rel="alternate" hreflang="es" href="${SITE}${es}">` : ""}${en ? `<link rel="alternate" hreflang="x-default" href="${SITE}${en}">` : ""}<meta property="og:type" content="${p._post ? "article" : "website"}"><meta property="og:title" content="${esc(p.seo.title)}"><meta property="og:description" content="${esc(p.seo.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(ogAlt)}"><meta property="og:site_name" content="${esc(facts.name)}">${alt ? `<meta property="og:locale:alternate" content="${p.locale === "es" ? "en_US" : "es_US"}">` : ""}<meta property="og:locale" content="${p.locale === "es" ? "es_US" : "en_US"}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#080808"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" as="font" type="font/woff2" href="https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&amp;family=DM+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/df-extras.css"><script type="application/ld+json">${jsonld(p)}</script></head>`;
}
function crumbs(p) {
  const bc = p.breadcrumb; if (!bc || bc.length < 2) return "";
  return `<nav class="df-crumbs" aria-label="${T[p.locale].ariaCrumbs}">${bc.map(([n, u], i) => (i === bc.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${u}">${esc(n)}</a>`)).join(" / ")}</nav>`;
}
function related(p, t) {
  const r = (p.related || []).map((id) => byKey.get(`${p.locale}:${id}`)).filter(Boolean);
  if (!r.length) return "";
  return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${p.locale === "es" ? "SIGUE EXPLORANDO" : "KEEP EXPLORING"}</span></div><div class="df-cards">${r.map((q) => `<a class="df-card" data-df-reveal href="${q.slug}"><h3>${esc(q.nav_label || q.title)}</h3><p>${esc(q.card_text || q.seo?.description || "")}</p></a>`).join("")}</div></section>`;
}
function renderPage(p) {
  const t = T[p.locale];
  const body = p._post ? renderPost(p, t) : (p.blocks || []).map((b, i) => blockHTML(b, p, t, i === 0)).join("");
  const rv = !p._post && REVIEW_PAGES.has(p.id) ? reviewsHTML(p.locale) : "";
  return `${head(p)}<body class="df-page df-${p.locale}">${header(p, t)}${menu(p, t)}<main id="main">${crumbs(p)}${body}${rv}${related(p, t)}${cta(t)}</main>${footer(p.locale)}<script src="/script.js"></script>${rv ? '<script src="/df-reviews.js" defer></script>' : ""}</body></html>\n`;
}
function renderPost(p, t) {
  const hero = p.hero ? `<div class="photo-pair df-post-hero">${img(p.hero, p.hero_alt || "", { eager: true, sizes: "100vw" })}</div>` : "";
  const blocks = (p.blocks || []).map((b, i) => blockHTML(b, p, t, false)).join("");
  const date = new Date(p.date + "T12:00:00Z").toLocaleDateString(p.locale === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const aboutSlug = (byKey.get(`${p.locale}:about`) || {}).slug || "/about/";
  const by = `${p.locale === "es" ? "Por" : "By"} <a href="${aboutSlug}" rel="author">Tim Murillo</a>`;
  return `<article class="df-post"><section class="experience df-no-photos" data-df-reveal-group><div class="intro"><span class="eyebrow" data-df-reveal>${esc(p.eyebrow || "BLOG")} · <time datetime="${p.date}">${date}</time></span><h1 data-df-reveal>${html(p.title)}</h1><div class="intro-copy" data-df-reveal-group>${(p.lede || []).map((x) => `<p data-df-reveal>${html(fill(x, t))}</p>`).join("")}<p class="df-byline" data-df-reveal>${by}</p></div></div></section>${hero}${blocks}</article>`;
}

fillMeta();
// ---------- write ----------
let n = 0;
const LEAKS = [];
for (const p of all) {
  if (p.id === "home") continue; // Colin's homepage is hand-maintained (chrome stamped below); /es/ is generated from it
  if (BLOG_ONLY && !(p._post || p.id === "blog")) continue;
  const out = path.join(OUT_ROOT, p.slug === "/" ? "index.html" : p.slug.replace(/^\//, "") + "index.html");
  const page = renderPage(p);
  for (const [re, what] of [[/\[TIM\?\]/, "[TIM?] marker"], [/\{\{[^}]*\}\}/, "unfilled {{token}}"], [/#missing-/, "#missing- link"]]) if (re.test(page)) LEAKS.push(`${p._file}: ${what}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  n++;
}
// Remove built posts that are not live yet (date-gate), so a rebuild never leaks a future post.
for (const p of posts.filter((x) => !live(x))) {
  const out = path.join(OUT_ROOT, p.slug.replace(/^\//, ""), "index.html");
  if (fs.existsSync(out)) fs.rmSync(out);
  if (fs.existsSync(path.dirname(out)) && !fs.readdirSync(path.dirname(out)).length) fs.rmdirSync(path.dirname(out)); // no empty folders left behind
}

if (BLOG_ONLY) {
  if (LEAKS.length) { console.error(`build: unpublishable output:\n  ${LEAKS.join("\n  ")}`); process.exit(1); }
  console.log(`built blog only: ${n} pages (${posts.filter(live).length}/${posts.length} posts live as of ${TODAY}) -> ${OUT_ROOT}`);
  process.exit(0);
}

// Bilingual 404 (Vercel serves /404.html): Colin's chrome, noindex, no canonical, no JSON-LD.
{
  const p404 = { locale: "en", slug: "/404.html", id: "404" };
  const hd = head({ ...p404, seo: { title: "Page not found | Divinely Faded", description: "This page doesn't exist. Head back to Divinely Faded in Carlsbad, NM." } })
    .replace(/<link rel="canonical"[^>]*>/, "").replace(/<link rel="alternate"[^>]*>/g, "").replace(/<meta property="og:[^>]*>/g, "").replace(/<meta name="twitter:card"[^>]*>/, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "").replace("<title>", '<meta name="robots" content="noindex"><title>');
  const body = `<section class="experience df-no-photos" data-df-reveal-group><div class="intro"><span class="eyebrow" data-df-reveal>404</span><h1 data-df-reveal>Wrong turn.</h1><div class="intro-copy" data-df-reveal-group><p data-df-reveal>That page doesn't exist. Start from the homepage, see the services, or book your next cut.</p><p data-df-reveal lang="es">Esta página no existe. Vuelve al inicio o reserva tu próxima cita.</p><a class="text-link" data-df-reveal href="/">HOME</a> <a class="text-link" data-df-reveal href="/services/">SERVICES</a></div></div></section>`;
  fs.writeFileSync(path.join(ROOT, "404.html"), `${hd}<body class="df-page df-en">${header(p404, T.en)}${menu(p404, T.en)}<main id="main">${body}${cta(T.en)}</main>${footer("en")}<script src="/script.js"></script></body></html>\n`);
}

// Stamp shared chrome into Colin's homepage between its own tags (allowed edits only).
const HOME_SERVICE_PAGE = { "Essential Haircut": "services-haircuts", "Signature Cut": "services-haircuts", "Luxury Grooming Experience": "services-haircuts", "Straight Razor Beard Shave": "services-beard-shaves", "Head & Beard Shave": "services-beard-shaves", "Express Facial": "services-facials", "Deluxe Facial": "services-facials", "Braids": "services-braids", "Color Transformation": "services-color", "Perm": "services-color" };
const decodeEnt = (x) => x.replace(/&amp;/g, "&").trim();
const homePath = path.join(ROOT, "index.html");
let home = fs.readFileSync(homePath, "utf8");
const homeP = { locale: "en", slug: "/", alt: byKey.has("es:home") ? "/es/" : undefined, id: "home" };
home = home.replace(/<nav class="header-links">[\s\S]*?<\/nav><\/header><nav id="menu" hidden>[\s\S]*?<\/nav>/, header(homeP, T.en).replace(/^[\s\S]*?<nav class="header-links">/, '<nav class="header-links">') + menu(homeP, T.en))
  .replace(/<a class="logo" href="#"/, '<a class="logo" href="/"')
  .replace(/<a class="logo" href="\/" aria-label="[^"]*">/, '<a class="logo" href="/">')
  .replace(/<footer id="location"[\s\S]*?<\/dialog>/, footer("en"))
  .replace(/(<link rel="stylesheet" href="style.css">)(?!<link rel="stylesheet" href="\/df-extras.css">)/, '$1<link rel="stylesheet" href="/df-extras.css">')
  // Each homepage accordion item links to its service page (internal links from the strongest page; audit #6, Peyton 2026-10-24).
  .replace(/<a class="text-link df-learn" href="[^"]*">[^<]*<\/a>/g, "") // strip, then add exactly one per service (idempotent)
  .replace(/<details><summary><span>([^<]+)<\/span>((?:(?!<details>)[\s\S])*?)<div class="service-detail"><p>([^<]*)<\/p>/g, (m, name, mid, body) => {
    const id = HOME_SERVICE_PAGE[decodeEnt(name)];
    const page = id && byKey.get(`en:${id}`);
    return page ? `<details><summary><span>${name}</span>${mid}<div class="service-detail"><p>${body}</p><a class="text-link df-learn" href="${page.slug}">${T.en.learnMore}</a>` : m;
  })
  // Reviews carousel replaces Colin's single Booksy quote (his quote stays slide 1; Peyton 2026-10-24).
  .replace(/<section class="review(?: df-reviews)?"[\s\S]*?<\/section>/, () => reviewsHTML("en"))
  .replace(/(<\/body>)/, (m) => (home.includes('src="/df-reviews.js"') ? m : '<script src="/df-reviews.js" defer></script>' + m))
  // In-site TikTok playback (Peyton 2026-10-24): one deferred script after Colin's, added once.
  .replace(/(<\/body>)/, (m) => (home.includes('src="/df-video.js"') ? m : '<script src="/df-video.js" defer></script>' + m));
// Head tags (allowed list): description trimmed to <=155 ("New Mexico" -> "NM", Colin's words otherwise),
// then canonical, hreflang, OG, favicons and JSON-LD between markers so every rebuild replaces them in place.
homeP.seo = { title: "Divinely Faded | Barber Shop in Carlsbad, NM", description: "Elevate your standard. Precision haircuts, signature cuts, straight razor shaves and luxury grooming with Timothy Murillo in Carlsbad, NM. Book online." };
homeP.breadcrumb = [[T.en.crumbHome, "/"]];
homeP._file = "index.html";
home = home.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(homeP.seo.description)}">`);
const homeHead = head(homeP);
const homeTags = homeHead.slice(homeHead.indexOf('<link rel="canonical"'), homeHead.indexOf('<meta name="theme-color"')) + homeHead.slice(homeHead.indexOf('<link rel="icon"'), homeHead.indexOf('<link rel="preconnect"')) + homeHead.slice(homeHead.indexOf('<script type="application/ld+json">'), homeHead.indexOf("</head>"));
home = home.replace(/<!--df-head-->[\s\S]*?<!--\/df-head-->/, "").replace("</head>", `<!--df-head-->${homeTags}<!--/df-head--></head>`);
fs.writeFileSync(homePath, home);

// Spanish homepage: generated from Colin's stamped homepage by exact string swaps (content/es/home.json),
// so it follows every change he makes. Scripts/styles are never touched; unlisted English text is reported.
{
  const esHome = byKey.get("es:home");
  if (esHome) {
    const dec = (x) => x.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    const S = new Map(esHome.strings), A = new Map(esHome.attrs), KEEP = new Set(esHome.keep || []);
    const chrome = header(esHome, T.es) + menu(esHome, T.es) + footer("es");
    const left = new Set();
    let es = fs.readFileSync(homePath, "utf8")
      .replace(/<nav class="header-links">[\s\S]*?<\/nav><\/header><nav id="menu" hidden>[\s\S]*?<\/nav>/, () => header(esHome, T.es).replace(/^[\s\S]*?<nav class="header-links">/, '<nav class="header-links">') + menu(esHome, T.es))
      .replace(/<a class="logo" href="\/"/, '<a class="logo" href="/es/"')
      .replace(/<footer id="location"[\s\S]*?<\/dialog>/, () => footer("es"))
      .replace('<html lang="en"', '<html lang="es"')
      .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(esHome.seo.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(esHome.seo.description)}">`)
      .replace(/<!--df-head-->[\s\S]*?<!--\/df-head-->/, "")
      .replace('href="style.css"', 'href="/style.css"').replace('src="script.js"', 'src="/script.js"').replace("video.src='hero-desktop.mp4'", "video.src='/hero-desktop.mp4'")
      .split(facts.booksy).join(bk("es"))
      .replace(/<section class="review df-reviews"[\s\S]*?<\/section>/, () => reviewsHTML("es"))
      .replace(/<a class="text-link df-learn" href="([^"]+)">[^<]*<\/a>/g, (m, h) => { const en = all.find((x) => x.locale === "en" && x.slug === h); const es = en && byKey.get(`es:${en.id}`); return `<a class="text-link df-learn" href="${es ? es.slug : h}">${T.es.learnMore}</a>`; });
    const esHead = head(esHome);
    const esTags = esHead.slice(esHead.indexOf('<link rel="canonical"'), esHead.indexOf('<meta name="theme-color"')) + esHead.slice(esHead.indexOf('<link rel="icon"'), esHead.indexOf('<link rel="preconnect"')) + esHead.slice(esHead.indexOf('<script type="application/ld+json">'), esHead.indexOf("</head>"));
    es = es.replace("</head>", `<!--df-head-->${esTags}<!--/df-head--></head>`);
    const [pre, body] = [es.slice(0, es.indexOf("<body")), es.slice(es.indexOf("<body"))];
    const swapped = body.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<section class="review df-reviews"[\s\S]*?<\/section>)/).map((seg, i) => (i % 2 ? seg : seg
      .replace(/>([^<>]+)</g, (m, txt) => {
        const k = dec(txt).trim();
        if (!k) return m;
        if (S.has(k)) return ">" + txt.replace(txt.trim(), () => esc(S.get(k))) + "<";
        if (/[A-Za-z]{2}/.test(k) && !KEEP.has(k) && !chrome.includes(txt.trim())) left.add(k);
        return m;
      })
      .replace(/\b(alt|aria-label|title)="([^"]+)"/g, (m, a, v) => (A.has(dec(v)) ? `${a}="${esc(A.get(dec(v)))}"` : m)))).join("");
    fs.mkdirSync(path.join(ROOT, "es"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "es/index.html"), pre + swapped);
    if (left.size) console.warn(`es/index.html: English text not in content/es/home.json (add to strings or keep): ${[...left].map((x) => JSON.stringify(x)).join(", ")}`);
  }
}

// Share cards (1200x630) for every og photo used; generated once, then committed.
{
  const missing = [...OG_NEEDED].filter((n) => !fs.existsSync(path.join(ROOT, `assets/og/${n}.jpg`)));
  if (missing.length) {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("python3", [path.join(ROOT, "tools/og.py"), ...missing], { stdio: "inherit" });
    if (r.status !== 0) console.warn(`build: share cards not generated here (pages use the photo): python3 tools/og.py ${missing.join(" ")}`);
  }
}

// llms.txt for AI answer engines, generated from facts + the page list every build (EN + ES URLs, live posts).
{
  const A = (sl) => `${SITE}${sl}`;
  const pg = (loc, id) => byKey.get(`${loc}:${id}`);
  const hrs = facts.hours.map((h) => `${h.days.map((d) => ({ Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" })[d]).join(", ")} ${h.open}–${h.close}`).join("; ");
  const line = (loc, id, note) => { const q = pg(loc, id); return q ? `- [${q.nav_label || q.seo?.title}](${A(q.slug)})${note ? `: ${note}` : ""}` : null; };
  const styles = all.filter((q) => q.locale === "en" && /^styles-/.test(q.id));
  const livePosts = (loc) => all.filter((q) => q._post && q.locale === loc).sort((a, b) => (a.date < b.date ? 1 : -1));
  const L = [
    `# ${facts.name}`, "",
    `> ${facts.name} is a one-barber shop in ${facts.address.city}, New Mexico, run by owner and barber Timothy "Tim" Murillo, cutting since ${facts.cutting_since || 2023}. Appointments only, booked on Booksy. Tagline: "${facts.tagline}"`, "",
    `Last updated: ${TODAY}. Canonical site: ${SITE}/ (English) and ${SITE}/es/ (Spanish).`, "",
    "## Visit and book", "",
    `- Address: ${facts.address.street}, ${facts.address.city}, ${facts.address.region} ${facts.address.postal}`,
    `- Phone: ${facts.phone.display} (texting preferred)`,
    `- Booking (appointments only): ${facts.booksy}`,
    `- Directions: ${facts.directions}`, `- Google Business Profile: ${facts.gbp}`,
    `- Hours: ${hrs}. Closed Wed and Sun.`, `- Holidays: ${facts.holidays}`,
    `- Payment: ${facts.payment.join(", ")}`, "",
    "## Services (price, appointment length)", "",
    ...facts.services.map((sv) => `- ${sv.name}: ${sv.price == null ? "Varies" : `$${sv.price}`}, ${minutes(sv.minutes, T.en)}. ${sv.desc || ""}`.trim()),
    `- Add-ons: ${facts.addons.map((x) => `${x.name.toLowerCase()} $${x.price}`).join(", ")}`, "",
    "## Pages", "",
    ...["services", "services-haircuts", "services-kids", "services-beard-shaves", "services-facials", "services-braids", "services-designs", "services-color", "styles", "about", "visit", "faq", "blog"].map((id) => line("en", id)).filter(Boolean), "",
    "## Haircut style guides", "", ...styles.map((q) => line("en", q.id)).filter(Boolean), "",
    "## En español", "", ...["home", "services", "styles", "about", "visit", "faq", "blog"].map((id) => (id === "home" ? `- [Inicio](${A("/es/")})` : line("es", id))).filter(Boolean), "",
    "## Nearby towns (driving distance from the shop)", "", ...facts.nearby.map((n) => `- ${n.town}: ${n.mi} mi, about ${n.min} min`), "",
    ...(livePosts("en").length ? ["## Blog", "", ...livePosts("en").map((q) => `- [${q.title}](${A(q.slug)})`), ""] : []),
  ];
  fs.writeFileSync(path.join(ROOT, "llms.txt"), L.join("\n").replace(/\n{3,}/g, "\n\n"));
}

// sitemap.xml follows every build (alternates only for built twins; future posts left out).
{ const { spawnSync } = await import("node:child_process"); const r = spawnSync(process.execPath, [path.join(ROOT, "tools/build-sitemap.js"), "--today", TODAY], { stdio: "inherit" }); if (r.status) process.exitCode = 1; }
if (MISSING.size) console.warn(`links to pages not written yet: ${[...MISSING].join(", ")}`);
if (LEAKS.length) { console.error(`build: unpublishable output (pages were written; fix the content and rebuild):\n  ${LEAKS.join("\n  ")}`); process.exitCode = 1; }
console.log(`built ${n} pages (${posts.filter(live).length}/${posts.length} posts live as of ${TODAY}); homepage chrome stamped; SITE=${SITE}`);
