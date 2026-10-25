#!/usr/bin/env node
// Divinely Faded static generator. content/<locale>/*.json (+ content/blog/<locale>/*.json) -> /<slug>/index.html
// Renders ONLY Colin's components (experience/intro, services/section-heading, service-list, feature, review)
// and stamps the shared header/menu/footer into every page, including Colin's homepage (between its own tags).
// No dependencies. Usage: node tools/build.mjs [--today YYYY-MM-DD]   (blog posts dated after today are not built)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const facts = read("content/facts.json");
const SITE = (process.env.SITE_URL || facts.site_url).replace(/\/$/, "");
const argToday = process.argv.includes("--today") ? process.argv[process.argv.indexOf("--today") + 1] : null;
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
    bookThis: "Book this service", learnMore: "SEE THE STYLE", varies: "Varies", min: "min", hr: "hr", crumbHome: "Home", footerPhotoAlt: "Tim seated in his barbershop",
  },
  es: {
    lang: "es", home: "/es/", book: "RESERVAR CITA", menuOpen: "Abrir navegación", skip: "Ir al contenido",
    nav: [["services", "Servicios"], ["styles", "Estilos"], ["about", "Sobre mí"], ["/es/#gallery", "Galería"], ["blog", "Blog"], ["visit", "Visítanos"], ["faq", "Preguntas"]],
    bookAppt: "Reservar una cita", city: "CARLSBAD, NUEVO MÉXICO", toggle: "EN", toggleLabel: "View this page in English",
    madeIn: "Hecho en<br>Carlsbad.", fAbout: "Sobre mí", fServices: "Servicios", fStyles: "Estilos", fBlog: "Blog", fVisit: "Visítanos", fBook: "Reservar", fReviews: "Reseñas", fFaq: "Preguntas",
    policies: "Políticas de reserva y cancelación", directions: "Cómo llegar", text: "Mensaje", call: "Llamar",
    hours: "Lun, mar, jue, vie 9–12 y 12:30–5 · Sáb 8–2 · Cerrado miér y dom",
    designed: "Diseñado por", powered: "Desarrollado por", ctaEyebrow: "CUANDO ESTÉS LISTO", ctaHead: "Toma asiento.", ctaBook: "RESERVA EN BOOKSY", ctaText: "MENSAJE A TIM", ctaCall: "LLAMAR",
    bookThis: "Reservar este servicio", learnMore: "VER EL ESTILO", varies: "Varía", min: "min", hr: "h", crumbHome: "Inicio", footerPhotoAlt: "Tim sentado en su barbería",
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
const esc = (s) => String(s ?? "").replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z]+);)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const html = (s) => String(s ?? ""); // trusted copy may contain <br> / <a> / <strong>
const svc = (id) => facts.services.find((s) => s.id === id) || (() => { throw new Error(`unknown service id ${id}`); })();
function minutes(n, t) { return n >= 60 ? `${Math.floor(n / 60)}${n % 60 ? `.${Math.round((n % 60) / 6)}` : ""} ${t.hr}`.replace(".5 ", ".5 ") : `${n} ${t.min}`; }
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
  if (h === "booksy") return facts.booksy;
  if (h === "sms") return `sms:${facts.phone.e164}`;
  if (h === "tel") return `tel:${facts.phone.e164}`;
  if (h === "directions") return facts.directions;
  if (h === "reviews") return facts.booksy_reviews;
  if (h.startsWith("page:")) { const p = byKey.get(`${loc}:${h.slice(5)}`) || byKey.get(`en:${h.slice(5)}`); if (!p) { MISSING.add(h); return "#missing-" + h.slice(5); } return p.slug; }
  if (/^(services|styles|about|visit|faq|blog)$/.test(h)) { const p = byKey.get(`${loc}:${h}`); return p ? p.slug : (loc === "es" ? `/es/${h}/` : `/${h}/`); }
  return h;
}
const ext = (u) => /^(https?:|sms:|tel:)/.test(u);
const aAttrs = (u) => (/^https?:/.test(u) ? ` target="_blank" rel="noopener"` : "");
function img(name, alt, { eager = false, sizes = "(min-width:701px) 50vw, 100vw" } = {}) {
  if (/^https?:/.test(name)) return `<img src="${esc(name)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
  const m = photosMan[name];
  if (!m) throw new Error(`photo not in manifest: ${name} (run python3 tools/photos.py)`);
  const w = Math.min(1200, m.w), h = Math.round(m.h * w / m.w);
  return `<img src="/assets/photos/${name}-1200.webp" srcset="/assets/photos/${name}-640.webp 640w, /assets/photos/${name}-1200.webp 1200w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
}
const altOf = (p, name, b) => (b && b.alt && typeof b.alt === "object" ? b.alt[name] : "") || (p.photo_alt || {})[name] || (p.alt_text || p.alts || {})[name] || (p.alt && typeof p.alt === "object" ? p.alt[name] : "") || "";
// The other-language URL, only once that page is actually built (no hreflang/toggle to a 404).
const altSlug = (p) => byKey.get(`${p.locale === "en" ? "es" : "en"}:${p.id}`)?.slug;

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
        const book = it.book ? `<a class="pill" href="${facts.booksy}" target="_blank" rel="noopener">${t.bookThis}</a>` : "";
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
  return `<a class="skip" href="#main">${t.skip}</a><header><a class="logo" href="${t.home}" aria-label="Divinely Faded home">DIVINELY FADED<small>ELEVATE YOUR STANDARD</small></a><nav class="header-links">${alt ? `<a class="df-lang" href="${alt}" hreflang="${p.locale === "en" ? "es" : "en"}" lang="${p.locale === "en" ? "es" : "en"}" aria-label="${t.toggleLabel}">${t.toggle}</a>` : ""}<a class="pill" href="${facts.booksy}" target="_blank" rel="noopener">${t.book}</a><button id="menu-toggle" aria-expanded="false" aria-controls="menu" aria-label="${t.menuOpen}"><span></span><span></span><span></span></button></nav></header>`;
}
function menu(p, t) {
  const alt = altSlug(p);
  return `<nav id="menu" hidden>${t.nav.map(([k, label]) => `<a href="${k.startsWith("/") ? k : href(k, p.locale)}">${label}</a>`).join("")}<a href="${facts.booksy}" target="_blank" rel="noopener">${t.bookAppt}</a>${alt ? `<a href="${alt}" lang="${p.locale === "en" ? "es" : "en"}">${p.locale === "en" ? "Español" : "English"}</a>` : ""}<p>${t.city}</p></nav>`;
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
    .map(([k, n]) => `<a href="${facts.social[k]}" target="_blank" rel="noopener" aria-label="Divinely Faded on ${n}" title="${n}">${SOCIAL[k]}</a>`).join("");
  return `<footer id="location" class="df-new-footer" aria-label="Divinely Faded footer">
  <div class="df-footer-left">
    <h2>${t.madeIn}</h2>
    <div class="df-footer-nav">
      <div class="df-footer-links"><a href="${P("about")}">${t.fAbout}</a><a href="${P("services")}">${t.fServices}</a><a href="${P("styles")}">${t.fStyles}</a><a href="${P("blog")}">${t.fBlog}</a></div>
      <div class="df-footer-links"><a href="${P("visit")}">${t.fVisit}</a><a href="${facts.booksy}" target="_blank" rel="noopener">${t.fBook}</a><a href="${facts.booksy_reviews}" target="_blank" rel="noopener">${t.fReviews}</a><a href="${P("faq")}">${t.fFaq}</a></div>
    </div>
    <div class="df-footer-social" aria-label="Social media">${soc}</div>
    <p class="df-footer-address">${esc(facts.address.street)}, ${facts.address.city}, ${facts.address.region} ${facts.address.postal}<br><a href="sms:${facts.phone.e164}">${t.text} ${facts.phone.display}</a> · <a href="tel:${facts.phone.e164}">${t.call}</a><span class="df-footer-hours">${t.hours}</span></p>
    <p class="df-footer-copyright">© ${TODAY.slice(0, 4)} Divinely Faded</p>
    <div class="df-footer-credits"><span>${t.designed} <a href="https://permianmedia.com/?utm_source=divinely-faded&amp;utm_medium=footer-credit&amp;utm_campaign=designed-by" target="_blank" rel="noopener"><img src="/assets/brand/permian-media.png" alt="" width="25" height="18"> Permian Media</a></span><span>${t.powered} <a href="https://digitalgravitystudio.com/?utm_source=divinely-faded&amp;utm_medium=footer-credit&amp;utm_campaign=powered-by" target="_blank" rel="noopener"><img src="/assets/brand/digital-gravity.png" alt="" width="18" height="18"> Digital Gravity</a></span></div>
    <div class="df-footer-bottom-links"><a href="${facts.booksy}" target="_blank" rel="noopener">${t.policies}</a><a href="${facts.directions}" target="_blank" rel="noopener">${t.directions}</a></div>
  </div>
  <div class="df-footer-photo">
    <img src="https://kfn00ghfuedoecga.public.blob.vercel-storage.com/divinely%20fadeed%20pic%20of%20tim.jpg" alt="${t.footerPhotoAlt}" loading="lazy">
    <div class="df-footer-photo-logo" aria-label="Divinely Faded — Elevate Your Standard"><strong>DIVINELY FADED</strong><small>ELEVATE YOUR STANDARD</small></div>
  </div>
</footer><dialog id="lightbox" aria-label="Portfolio photo"><button id="close-photo" aria-label="Close photo">CLOSE ✕</button><img alt="Enlarged Divinely Faded portfolio photo"></dialog>`;
}
function cta(t) {
  return `<section class="review df-cta" data-df-reveal-group><span class="eyebrow" data-df-reveal>${t.ctaEyebrow}</span><h2 data-df-reveal>${t.ctaHead}</h2><div class="df-cta-actions" data-df-reveal><a class="pill" href="${facts.booksy}" target="_blank" rel="noopener">${t.ctaBook}</a><a class="pill" href="sms:${facts.phone.e164}">${t.ctaText}</a><a class="pill" href="tel:${facts.phone.e164}">${t.ctaCall}</a></div></section>`;
}

// ---------- JSON-LD ----------
const DAYS = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };
function business() {
  return {
    "@type": "BarberShop", "@id": `${SITE}/#business`, name: facts.name, url: `${SITE}/`, telephone: facts.phone.e164,
    image: `${SITE}/assets/photos/team-tim-portrait-1200.webp`, priceRange: "$5–$120", slogan: facts.tagline,
    address: { "@type": "PostalAddress", streetAddress: facts.address.street, addressLocality: facts.address.city, addressRegion: facts.address.region, postalCode: facts.address.postal, addressCountry: facts.address.country },
    geo: { "@type": "GeoCoordinates", latitude: facts.address.lat, longitude: facts.address.lng },
    openingHoursSpecification: facts.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days.map((d) => DAYS[d]), opens: h.open, closes: h.close })),
    paymentAccepted: facts.payment.join(", "), currenciesAccepted: "USD", founder: { "@id": `${SITE}/#tim` },
    sameAs: [...Object.values(facts.social), facts.gbp, facts.booksy],
    potentialAction: { "@type": "ReserveAction", target: { "@type": "EntryPoint", urlTemplate: facts.booksy, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] }, result: { "@type": "Reservation", name: "Barber appointment" } },
  };
}
function jsonld(p) {
  const url = SITE + p.slug, L = p.locale === "es" ? "es-US" : "en-US";
  const g = [business(),
    { "@type": "Person", "@id": `${SITE}/#tim`, name: "Timothy Murillo", jobTitle: p.locale === "es" ? "Barbero y dueño" : "Barber and owner", worksFor: { "@id": `${SITE}/#business` } },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: facts.name, inLanguage: ["en-US", "es-US"], publisher: { "@id": `${SITE}/#business` } },
    { "@type": p._post ? "WebPage" : ({ about: "AboutPage", visit: "ContactPage" }[p.id] || (/^(services|styles|blog)$/.test(p.id) ? "CollectionPage" : "WebPage")), "@id": `${url}#webpage`, url, name: p.seo?.title, description: p.seo?.description, inLanguage: L, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#business` }, breadcrumb: { "@id": `${url}#breadcrumb` }, ...(p.seo?.og_photo ? { primaryImageOfPage: `${SITE}/assets/photos/${p.seo.og_photo}-1200.webp` } : {}) },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: (p.breadcrumb || [[T[p.locale].crumbHome, T[p.locale].home]]).map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + u })) }];
  const serviceNode = (key, name, price) => ({ "@type": "Service", "@id": `${url}#service-${key}`, name, serviceType: p.schema.service_type || name, provider: { "@id": `${SITE}/#business` }, areaServed: { "@type": "City", name: "Carlsbad, NM" }, ...(price != null ? { offers: { "@type": "Offer", price, priceCurrency: "USD", url: facts.booksy } } : {}) });
  for (const id of p.schema?.service_ids || []) { const s = svc(id); g.push(serviceNode(id, s.name, s.price)); }
  for (const name of p.schema?.addons || []) { const a = facts.addons.find((x) => x.name === name); if (!a) throw new Error(`${p._file}: unknown addon ${name}`); g.push(serviceNode(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), a.name, a.price)); }
  // A service page with no single Booksy line (kids book the regular haircuts) still declares its Service, without an offer.
  if (p.schema?.type === "Service" && !p.schema.service_ids?.length && !p.schema.addons?.length && p.schema.name) g.push(serviceNode("main", p.schema.name, null));
  const faqs = (p.blocks || []).filter((b) => b.type === "faq").flatMap((b) => b.items);
  if (faqs.length) g.push({ "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((f) => ({ "@type": "Question", name: fill(f.q || f.title, T[p.locale]).replace(/<[^>]+>/g, ""), acceptedAnswer: { "@type": "Answer", text: fill(f.a || f.body, T[p.locale]).replace(/<[^>]+>/g, "") } })) });
  if (p._post) g.push({ "@type": "BlogPosting", "@id": `${url}#post`, headline: p.title, description: p.seo?.description, datePublished: p.date, dateModified: p.updated || p.date, inLanguage: L, author: { "@id": `${SITE}/#tim` }, publisher: { "@id": `${SITE}/#business` }, mainEntityOfPage: { "@id": `${url}#webpage` }, ...(p.hero ? { image: p.hero.startsWith("http") ? p.hero : `${SITE}/assets/photos/${p.hero}-1200.webp` } : {}) });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": g }).replace(/</g, "\\u003c");
}

function head(p) {
  const url = SITE + p.slug, alt = altSlug(p), en = p.locale === "en" ? p.slug : alt, es = p.locale === "es" ? p.slug : alt;
  const og = p.seo?.og_photo ? `${SITE}/assets/photos/${p.seo.og_photo}-1200.webp` : (p.hero && !p.hero.startsWith("http") ? `${SITE}/assets/photos/${p.hero}-1200.webp` : `${SITE}/assets/photos/team-tim-portrait-1200.webp`);
  return `<!doctype html><html lang="${p.locale === "es" ? "es" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.seo.title)}</title><meta name="description" content="${esc(p.seo.description)}"><link rel="canonical" href="${url}">${en ? `<link rel="alternate" hreflang="en" href="${SITE}${en}">` : ""}${es ? `<link rel="alternate" hreflang="es" href="${SITE}${es}">` : ""}${en ? `<link rel="alternate" hreflang="x-default" href="${SITE}${en}">` : ""}<meta property="og:type" content="${p._post ? "article" : "website"}"><meta property="og:title" content="${esc(p.seo.title)}"><meta property="og:description" content="${esc(p.seo.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:locale" content="${p.locale === "es" ? "es_US" : "en_US"}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#080808"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&amp;family=DM+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/df-extras.css"><script type="application/ld+json">${jsonld(p)}</script></head>`;
}
function crumbs(p) {
  const bc = p.breadcrumb; if (!bc || bc.length < 2) return "";
  return `<nav class="df-crumbs" aria-label="Breadcrumb">${bc.map(([n, u], i) => (i === bc.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${u}">${esc(n)}</a>`)).join(" / ")}</nav>`;
}
function related(p, t) {
  const r = (p.related || []).map((id) => byKey.get(`${p.locale}:${id}`)).filter(Boolean);
  if (!r.length) return "";
  return `<section class="services df-section" data-df-reveal-group><div class="section-heading"><span class="eyebrow" data-df-reveal>${p.locale === "es" ? "SIGUE EXPLORANDO" : "KEEP EXPLORING"}</span></div><div class="df-cards">${r.map((q) => `<a class="df-card" data-df-reveal href="${q.slug}"><h3>${esc(q.nav_label || q.title)}</h3><p>${esc(q.card_text || q.seo?.description || "")}</p></a>`).join("")}</div></section>`;
}
function renderPage(p) {
  const t = T[p.locale];
  const body = p._post ? renderPost(p, t) : (p.blocks || []).map((b, i) => blockHTML(b, p, t, i === 0)).join("");
  return `${head(p)}<body class="df-page df-${p.locale}">${header(p, t)}${menu(p, t)}<main id="main">${crumbs(p)}${body}${related(p, t)}${cta(t)}</main>${footer(p.locale)}<script src="/script.js"></script></body></html>\n`;
}
function renderPost(p, t) {
  const hero = p.hero ? `<div class="photo-pair df-post-hero">${img(p.hero, p.hero_alt || "", { eager: true, sizes: "100vw" })}</div>` : "";
  const blocks = (p.blocks || []).map((b, i) => blockHTML(b, p, t, false)).join("");
  const date = new Date(p.date + "T12:00:00Z").toLocaleDateString(p.locale === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const by = p.locale === "es" ? "Por Tim Murillo" : "By Tim Murillo";
  return `<article class="df-post"><section class="experience df-no-photos" data-df-reveal-group><div class="intro"><span class="eyebrow" data-df-reveal>${esc(p.eyebrow || "BLOG")} · <time datetime="${p.date}">${date}</time></span><h1 data-df-reveal>${html(p.title)}</h1><div class="intro-copy" data-df-reveal-group>${(p.lede || []).map((x) => `<p data-df-reveal>${html(fill(x, t))}</p>`).join("")}<p class="df-byline" data-df-reveal>${by}</p></div></div></section>${hero}${blocks}</article>`;
}

// ---------- write ----------
let n = 0;
const LEAKS = [];
for (const p of all) {
  if (p.id === "home" && p.locale === "en") continue; // Colin's homepage is hand-maintained; chrome stamped below
  const out = path.join(ROOT, p.slug === "/" ? "index.html" : p.slug.replace(/^\//, "") + "index.html");
  const page = renderPage(p);
  for (const [re, what] of [[/\[TIM\?\]/, "[TIM?] marker"], [/\{\{[^}]*\}\}/, "unfilled {{token}}"], [/#missing-/, "#missing- link"]]) if (re.test(page)) LEAKS.push(`${p._file}: ${what}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  n++;
}
// Remove built posts that are not live yet (date-gate), so a rebuild never leaks a future post.
for (const p of posts.filter((x) => !live(x))) {
  const out = path.join(ROOT, p.slug.replace(/^\//, ""), "index.html");
  if (fs.existsSync(out)) fs.rmSync(out);
}

// Stamp shared chrome into Colin's homepage between its own tags (allowed edits only).
const homePath = path.join(ROOT, "index.html");
let home = fs.readFileSync(homePath, "utf8");
const homeP = { locale: "en", slug: "/", alt: byKey.has("es:home") ? "/es/" : undefined, id: "home" };
home = home.replace(/<nav class="header-links">[\s\S]*?<\/nav><\/header><nav id="menu" hidden>[\s\S]*?<\/nav>/, header(homeP, T.en).replace(/^[\s\S]*?<nav class="header-links">/, '<nav class="header-links">') + menu(homeP, T.en))
  .replace(/<a class="logo" href="#"/, '<a class="logo" href="/"')
  .replace(/<footer id="location"[\s\S]*?<\/dialog>/, footer("en"))
  .replace(/(<link rel="stylesheet" href="style.css">)(?!<link rel="stylesheet" href="\/df-extras.css">)/, '$1<link rel="stylesheet" href="/df-extras.css">');
fs.writeFileSync(homePath, home);

if (MISSING.size) console.warn(`links to pages not written yet: ${[...MISSING].join(", ")}`);
if (LEAKS.length) { console.error(`build: unpublishable output (pages were written; fix the content and rebuild):\n  ${LEAKS.join("\n  ")}`); process.exitCode = 1; }
console.log(`built ${n} pages (${posts.filter(live).length}/${posts.length} posts live as of ${TODAY}); homepage chrome stamped; SITE=${SITE}`);
