# Divinely Faded: JSON-LD plan

Every page carries one `<script type="application/ld+json">` with a single `@graph`, written by `tools/build.mjs` (`business()` and `jsonld()`). This plan documents what the generator emits today (checked against the pages built by commit 18f6666 on 2026-10-24), what each page type adds, and the gaps to close. `tools/check.js` enforces the rules marked **(gate)**.

All values come from `content/facts.json`. `SITE` = `facts.site_url` (`https://www.divinelyfaded.com` until the move to divinelyfaded.com; the switch is one value plus a 301).

## 1. Nodes on every page

| Node | `@id` | What it holds today | Source |
|---|---|---|---|
| `HairSalon` | `SITE/#business` | name, url, telephone (E.164), image (`team-tim-portrait`), priceRange `$5–$120`, slogan, PostalAddress (303 S Halagueno St, 88220), GeoCoordinates, `openingHoursSpecification` (3 entries: Mo/Tu/Th/Fr 09:00–12:00, Mo/Tu/Th/Fr 12:30–17:00, Sa 08:00–14:00), paymentAccepted, currenciesAccepted USD, founder → `#tim`, sameAs (Instagram, TikTok, YouTube, Facebook, Google Business Profile cid, Booksy), `potentialAction` ReserveAction → Booksy | facts |
| `Person` | `SITE/#tim` | name Timothy Murillo, jobTitle (EN "Barber and owner" / ES "Barbero y dueño"), worksFor → `#business` | facts |
| `WebSite` | `SITE/#website` | url, name, inLanguage [en-US, es-US], publisher → `#business` | facts |
| page node | `<url>#webpage` | `@type` by page: `AboutPage` (about), `ContactPage` (visit), `CollectionPage` (services, styles, blog hubs), else `WebPage` (including /faq/, whose questions live in the `#faq` node); name = `<title>`, description = meta description, inLanguage, isPartOf → `#website`, about → `#business`, breadcrumb → `#breadcrumb`, primaryImageOfPage = og photo | content `seo` |
| `BreadcrumbList` | `<url>#breadcrumb` | ListItems from the content file's `breadcrumb` (localized names, absolute URLs) | content |

**(gate)** exactly one `HairSalon` node per page; every `{"@id"}` reference resolves to a node in the same graph; no `AggregateRating` or `Review` anywhere (self-served stars break Google's guidelines); the 404 page carries no JSON-LD.

## 2. Nodes by page type

| Page type | Extra nodes | Notes |
|---|---|---|
| Service pages (`schema.service_ids`, `schema.addons`, or `schema.name` alone) | one `Service` per id or add-on (Hair design carries the $10 add-on Offer; Kids' haircuts has no Offer because kids book the regular haircuts): `<url>#service-<id>`, name, serviceType, provider → `#business`, areaServed, `offers` Offer {price, USD, url Booksy} when the price is not null (Braids has no Offer: price varies) | **(gate)** every Offer price must be a price in facts |
| Style pages | the same `Service` nodes for the services the style is booked as (Essential, Signature, and Head & Beard Shave / Perm / Color where listed) | |
| Any page with a `faq` block | `FAQPage` `<url>#faq` with Question/Answer pairs, text identical to the visible accordion | FAQ rich results are limited to government and health sites since 2023; the markup still states the answers plainly for search and AI parsers |
| `/services/` | Service nodes for all ten services | |
| `/faq/` | `FAQPage` `#faq` (14 questions) | one FAQPage only (fixed in 18f6666) |
| Blog post | `BlogPosting` `<url>#post`: headline, description, datePublished, dateModified, inLanguage, author → `#tim`, publisher → `#business`, mainEntityOfPage → `#webpage`, image (hero) | **(gate)** headline, datePublished, author and image present; datePublished ≤ today |
| Homepage `/` | **none today** (see gap 2) | |

## 3. Gaps to close (in order)

1. ~~**`/faq/` declared two FAQPage entities**~~ Fixed in 18f6666: the page node is now `WebPage` and `#faq` is the only FAQPage. `check.js` fails any page with more than one.
2. **The homepage has no JSON-LD, canonical or hreflang.** Head tags are on the allowed-edits list. Stamp the same graph into Colin's `<head>`: BarberShop, Person, WebSite, a `WebPage` for `/` (about → `#business`), BreadcrumbList with one item; plus `<link rel="canonical" href="SITE/">` and the hreflang trio once `/es/` exists. Its meta description is 159 characters; trim to ≤155. `check.js` fails these today.
3. **One `@id` per service across the site.** Today the Essential Haircut is a different entity on every page (`/styles/burst-fade/#service-essential-haircut`, `/services/#service-essential-haircut`, ...). Use one id everywhere, `SITE/services/#service-<id>`, still fully described on each page. Same id = same thing to a parser; no new pages or references needed.
4. **Spanish pages need Spanish service names.** `Service.name`/`serviceType` come from `facts.services[].name` (English) on ES pages too. Add `name_es` to each service in facts (the glossary step decides the words; the Booksy names may stay as brand names, e.g. "Signature Cut", with `serviceType` in Spanish such as "Corte de cabello") and pick by locale.
5. ~~**Kids and hair-design pages emitted no Service.**~~ Fixed in 18f6666 (`schema.addons` and `schema.name`).
6. **`areaServed`** is `{"@type":"City","name":"Carlsbad, NM"}`. Use `{"@type":"City","name":"Carlsbad","containedInPlace":{"@type":"State","name":"New Mexico"}}`. The nearby-towns table could also be listed as `areaServed` on the BarberShop (each a `City`), since the distances are published on /visit/.
7. **Person `#tim`** has no `image` or `url`. Add `image` = the `team-tim-portrait` photo and `url` = `SITE/about/`. Do not add `sameAs` (the socials are the shop's) or `knowsLanguage` (Spanish service is unconfirmed).
8. **BarberShop extras** that are facts already: `hasMap` = the Google Business Profile URL; `knowsAbout` is unnecessary. Do **not** add `foundingDate` (opening month is a Needs-Tim item), `logo` (no logo file), `email` (none), parking or amenity features (unknown).
9. **Blog posts:** add `about` → the `Service` ids of the post's internal-link targets (e.g. a perm post is about `#service-perm`), and give the blog hub (`/blog/`, `/es/blog/`) a `CollectionPage` page node with `hasPart` listing live posts. A post without a hero image fails the gate, so every post needs a real `hero` (library photo, Pexels or a logged AI image).
10. **Weekday hours** are published from the Booksy calendar and still marked `confirmed: false` in facts. They match the footer, so the markup is consistent; confirm with Tim before launch.

## 4. What stays out

- `AggregateRating`, `Review`, review counts or stars (homepage review text stays as visible copy only).
- `knowsLanguage: es` or any Spanish-service claim until Tim confirms.
- the future downtown shop address (unpublished until it opens), a private registered-agent address (never published), 301 (wrong number).
- `SearchAction` (no site search), `Event` markup for Christmas on the Pecos (not Tim's event).

## 5. Validation

- `node tools/check.js` (gate) on every build: parse, references, BarberShop count, FAQPage count, Offer prices, review markup, BlogPosting fields, breadcrumb URLs.
- Before the PR: Rich Results Test on `/`, `/faq/`, `/styles/burst-fade/` and one post (LocalBusiness, Breadcrumb detected, zero errors), and validator.schema.org on one page of each type (Google's tool does not report `Service`).

**Correction 2026-10-24 (validator.schema.org):** `BarberShop` is not a schema.org type: it produced INVALID_ITEMTYPE plus cascading INVALID_OBJECT errors on worksFor/publisher/about/provider (8–20 errors per page). `["HairSalon","BarberShop"]` still errors. The business node is `HairSalon` (LocalBusiness > HealthAndBeautyBusiness > HairSalon): 0 errors, 0 warnings.
