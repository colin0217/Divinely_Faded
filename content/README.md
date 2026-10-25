# Content format (one JSON file per page per language)

The generator (`tools/build.mjs`) turns `content/<locale>/<id>.json` into static HTML that uses Colin's existing components. Agents write content only. Templates, CSS and JS belong to the lead.

- **Facts:** use only `content/facts.json`. Prices and times on a page are written as tokens (`{{price:signature-cut}}`, `{{minutes:signature-cut}}`) and filled in from the facts file, so a price change happens in one place.
- **Locale:** `en` lives in `content/en/`; `es` lives in `content/es/` with the same `id` and a localized `slug`.

```json
{
  "id": "styles-burst-fade",
  "locale": "en",
  "slug": "/styles/burst-fade/",
  "alt": "/es/estilos/burst-fade/",
  "nav_label": "Burst Fade",
  "breadcrumb": [["Home", "/"], ["Styles", "/styles/"], ["Burst Fade", "/styles/burst-fade/"]],
  "seo": {
    "title": "Burst Fade in Carlsbad, NM | Divinely Faded",
    "description": "≤155 chars, includes the primary term and Carlsbad",
    "primary": "burst fade carlsbad nm",
    "secondary": ["burst fade", "burst fade mullet"],
    "og_photo": "cut-curly-top-burst-fade-beard"
  },
  "schema": { "type": "Service", "service_ids": ["essential-haircut", "signature-cut"] },
  "blocks": [
    { "type": "intro", "eyebrow": "STYLES / BURST FADE", "h1": "Burst fade.", "paragraphs": ["..."], "link": { "label": "BOOK THIS CUT", "href": "booksy" }, "photos": ["cut-curly-top-burst-fade-beard", "cut-curly-top-taper-neckline"] },
    { "type": "section", "eyebrow": "02 / THE CUT", "heading": "What it is.", "lead": "One line.", "paragraphs": ["..."], "photos": [] },
    { "type": "list", "eyebrow": "03 / BOOK IT AS", "heading": "Services.", "lead": "...", "items": [{ "title": "Essential Haircut", "meta": "{{price:essential-haircut}} · {{minutes:essential-haircut}}", "body": "...", "book": true }] },
    { "type": "faq", "eyebrow": "04 / QUESTIONS", "heading": "Good to know.", "items": [{ "q": "...", "a": "..." }] },
    { "type": "feature", "photo": "team-tim-portrait", "eyebrow": "CRAFTED AROUND YOU", "heading": "Your Style.<br>Our Craft.", "button": { "label": "BOOK NOW", "href": "booksy" } },
    { "type": "table", "eyebrow": "...", "heading": "...", "columns": ["Town", "Miles", "Drive"], "rows": "nearby" }
  ],
  "related": ["styles-low-taper-fade", "services-haircuts", "faq"],
  "tim_questions": ["anything unconfirmed you wrote as [TIM?] goes here too"]
}
```

## Block types and the Colin component each one renders as

| Block | Renders as |
|---|---|
| `intro` | `.experience` (photo-pair, eyebrow, h1/h2, intro-copy, text-link). The first block on every page holds the page's only `<h1>`. |
| `section` | `.services .section-heading` with body paragraphs |
| `list` | `.service-list` `<details>` accordion (prices, options) |
| `faq` | the same accordion, plus FAQPage JSON-LD |
| `feature` | `.feature` (photo, eyebrow, heading, pill) |
| `table` | a simple black-and-white table. `rows: "nearby"` pulls from facts. |

`href` values:
- `"booksy"`, `"sms"`, `"tel"` and `"directions"` resolve from the facts file.
- Internal links use page ids: `"page:faq"`.

## Writing rules (hard)

- **Voice:** first person as Tim ("I", "my chair"). Warm, short, specific. Faith may show in one line, never preachy. No emoji. No exclamation marks.
- **No invention:**
  - Use only `facts.json` and what the named photos visibly show.
  - Anything else gets `[TIM?]` in the text and an entry in `tim_questions`.
  - Never invent anecdotes, client stories, years, awards or numbers.
- **Never write:** anything in `facts.never_claim`, the word "walk-in", or competitor names.
- **Photos:**
  - Use names from the `gbp-media` list (`https://divinely-faded.vercel.app/gbp-media/<name>.jpg`).
  - Each photo is used on at most ONE page across the whole site (ES mirrors reuse their EN page's photos).
  - Alt text names the cut, written in `"alt": {"<photo>": "..."}` on the page.
- **Length:** 250–500 words of body copy for service and style pages; hubs 150–300.
- **Uniqueness:** no paragraph may be interchangeable with another page's paragraph. The 5-shingle uniqueness gate checks this.
