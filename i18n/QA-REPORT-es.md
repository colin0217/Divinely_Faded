# Spanish translation QA report: Divinely Faded (2026-10-24)

Phase C3 · blind back-translation QA (translation-qa-gate) · adjudicator: es-qa agent

## Verdict: **FAIL** (one fix pass on the homepage clears it)

| Gate | Bar | Result |
|---|---|---|
| Overall segment score | ≥ 98% | **99.58%** (946 / 950) ✔ |
| MAJOR segments | 0 | **4** ✘ (all four in `content/es/home.json`, the frozen-homepage string swaps) |
| Per-page ≥ 98% (skill hard rule) | every page | 23 / 24 pages at 100%; **home 92.7%** ✘ |

Every page except the homepage passes. The four failures are Spanish strings on Colin's homepage that don't use the glossary terms. One of them also changes a service description. If the four corrected strings below are applied, the homepage reaches 55/55 and the site reaches 950/950 with no MAJORs. Only the changed segments need a new back-translation.

**NATIVE REVIEW RECOMMENDED before customer-facing cutover.** The score measures how faithfully the meaning survives the round trip. It does not measure how natural the Spanish sounds to a Carlsbad reader. The precedent rule still applies: never call the pages "native-verified" unless a human native speaker has reviewed them.

## Method

1. **Blind back-translation first.** Inputs were `content/es/*.json` (24 files) and `i18n/glossary-es.md` only. For `home.json`, only the right-hand (ES) value of each `strings`/`attrs` pair was extracted by script, so the English left side was never displayed. All 950 rendered segments were back-translated into plain English and saved to `i18n/qa/backtranslation-es.json` before any EN source was opened.
2. **Adjudication.** Each segment was then aligned to its EN source by JSON path. Sources were `content/en/<page>.json`, the left side of `home.json`, and the `<title>`/meta description of root `index.html` for the homepage SEO pair. Each segment got a verdict: MATCH, MINOR (wording differs, same meaning) or MAJOR. Differences the glossary requires were not counted as errors. These include English service names with a gloss, the `(fade)`/`(line-up)` glosses, "En Booksy aparece como …", English style names, *Agendar*, the locked review rendering, "Cut Different." and "Elevate Your Standard." kept in English, *Sobre mí*/*Visítanos*/*Preguntas* chrome, *Corte con raya* and *Peinado hacia atrás* as page names, and "(estilo militar)". Per-segment verdicts and notes are in `i18n/qa/adjudication-es.json`.
3. **Glossary-breach rule.** `glossary-es.md` says that breaking the glossary is an automatic segment failure, and the skill says the same. A segment fails, and counts as MAJOR, when it uses a term from a glossary "Do not use / Never" column or replaces a locked label with a different content word. Function-word variants such as "masaje *de* cuero cabelludo" vs the locked "masaje *en el* cuero cabelludo" are logged as MINOR.
4. **Score** = (MATCH + MINOR) / all segments.
5. **Scope.** Rendered text only: eyebrow, h1, heading, lead, paragraphs, list/FAQ items, table cells, link/button labels, card_text, nav_label, alt texts, seo.title, seo.description, and the home string and attribute swaps. Excluded: slugs, hrefs, keyword fields, schema ids, breadcrumbs (built from nav labels), the `keep` list on home, meta lines made only of tokens, and the data key `rows: "nearby"`.

## Scores per page

| Page | Segments | MATCH | MINOR | MAJOR | Score |
|---|---|---|---|---|---|
| home (`/es/`) | 55 | 29 | 22 | **4** | **92.7%** |
| services | 65 | 51 | 14 | 0 | 100% |
| services-haircuts | 42 | 29 | 13 | 0 | 100% |
| services-kids | 33 | 16 | 17 | 0 | 100% |
| services-beard-shaves | 41 | 24 | 17 | 0 | 100% |
| services-facials | 33 | 16 | 17 | 0 | 100% |
| services-braids | 34 | 21 | 13 | 0 | 100% |
| services-designs | 33 | 17 | 16 | 0 | 100% |
| services-color | 38 | 26 | 12 | 0 | 100% |
| styles | 27 | 14 | 13 | 0 | 100% |
| styles-skin-fade | 42 | 25 | 17 | 0 | 100% |
| styles-low-taper-fade | 42 | 19 | 23 | 0 | 100% |
| styles-burst-fade | 39 | 20 | 19 | 0 | 100% |
| styles-modern-mullet | 47 | 23 | 24 | 0 | 100% |
| styles-textured-fringe | 38 | 19 | 19 | 0 | 100% |
| styles-buzz-cut | 39 | 19 | 20 | 0 | 100% |
| styles-slick-back | 40 | 21 | 19 | 0 | 100% |
| styles-curly-top-fade | 40 | 24 | 16 | 0 | 100% |
| styles-hard-part | 41 | 24 | 17 | 0 | 100% |
| styles-textured-crop | 40 | 21 | 19 | 0 | 100% |
| about | 23 | 16 | 7 | 0 | 100% |
| visit | 57 | 40 | 17 | 0 | 100% |
| faq | 45 | 27 | 18 | 0 | 100% |
| blog | 16 | 8 | 8 | 0 | 100% |
| **Total** | **950** | **549** | **397** | **4** | **99.58%** |

## MAJOR segments (all in `content/es/home.json`)

### 1. home · `strings[14][1]` (Luxury Grooming Experience detail): meaning changed + glossary breach
- **ES:** "Consulta, corte, perfilado de barba, lavado y masaje de cuero cabelludo, vapor facial, dos toallas calientes, detallado con navaja, diseño básico, cera en oídos y nariz, peinado y fragancia."
- **Back-translation:** "Consultation, cut, beard edging, wash and scalp massage, facial steam, two hot towels, straight-razor detailing, basic design, ear and nose wax, styling and fragrance."
- **EN source:** "Consultation, haircut, beard sculpt, wash and scalp massage, facial steam, dual hot towels, razor detailing, basic design, ear and nose waxing, styling and fragrance."
- **Why:** *beard sculpt* became *perfilado de barba*, which means beard edging or outlining. That is a different, lesser service, and the glossary bans *perfilado* and locks *modelado de barba*. The segment also uses the banned *detallado* (locked: *detalles con navaja*) and *cera en oídos* where the locked term is *depilación con cera de nariz y orejas*. *Oídos* means the inner ear.
- **Corrected ES:** "Consulta, corte, modelado de barba, lavado y masaje en el cuero cabelludo, vapor facial, dos toallas calientes, detalles con navaja, diseño básico, depilación con cera de nariz y orejas, peinado y fragancia."

### 2. home · `strings[13][1]` (Signature Cut detail): glossary breach
- **ES:** "Corte de precisión, corte de barba o delineado, acabado con toalla caliente y detallado con navaja."
- **Back-translation:** "Precision cut, beard trim or line-up, hot towel finish and straight-razor detailing."
- **EN source:** "Precision haircut, beard trim or lineup, hot towel finish and straight razor detailing."
- **Why:** *detallado* is in the glossary's "Do not use" column for straight razor detailing (locked: *detalles con navaja*). The meaning is otherwise intact.
- **Corrected ES:** "Corte de precisión, corte de barba o delineado, toque final con toalla caliente y detalles con navaja." *Toque final con toalla caliente* matches the services pages. The original *acabado con toalla caliente* is also acceptable.

### 3. home · `strings[30][1]` (add-on label): glossary breach
- **ES:** "· Cera en nariz / oídos"
- **Back-translation:** "· Nose / ear wax"
- **EN source:** "· Nose / ear wax"
- **Why:** The glossary locks this add-on label as *Depilación con cera de nariz y orejas*, and `/es/servicios/` uses that label. *Oídos* refers to the inner ear and ear canal, so the line reads as wax in the ear canal rather than waxing of the ears.
- **Corrected ES:** "· Depilación con cera de nariz y orejas". If the frozen add-on row can't fit that, use the short form "· Cera de nariz / orejas" and record it in the glossary Additions table as the homepage short label.

### 4. home · `attrs[2][1]` (img alt): glossary breach
- **ES:** "Diseño detallado rasurado en el pelo, por Divinely Faded"
- **Back-translation:** "Detailed design shaved into the hair, by Divinely Faded"
- **EN source:** "Detailed shaved hair design by Divinely Faded"
- **Why:** Glossary §3 says shave/to shave is always *afeitado/afeitar*, never mixed with *rasurado/rasurar* on the same site. The glossary addition for a shaved-in line is *marcado*. The meaning is otherwise intact.
- **Corrected ES:** "Diseño detallado marcado en el pelo, por Divinely Faded"

## Never-claim, register and token sweep (all 950 ES segments)

- **Walk-in:** no *sin cita*, *sin reservación*, *orden de llegada*, *cuando quieras* (as an invitation) or *walk-in*. The locked FAQ rendering ("¿Puedo llegar nada más…" / "Atiendo solo con cita…") is used verbatim on the haircuts page.
- **Spanish-language service:** none. No *español*, *bilingüe* or *idioma*, and no invitation to write in Spanish.
- **Rankings:** no *el/la mejor*, *número uno*, *#1*, *top* or *líder*. The comparatives *el más largo de los tres*, *el más relajado*, *el contraste más marcado* and *la forma más rápida de contactarme* each mirror the English comparison ("the longest of the three", "the fastest way to reach me"). They are not business ranking claims, and the `check.js` regex does not match them.
- **Offers:** no *descuento*, *oferta*, *promoción*, *gratis* or *rebaja*.
- **Reviews:** the only review text is the locked homepage rendering. "5 estrellas" is the homepage stars aria-label and mirrors the EN "5 stars" on the same review block. "LEER RESEÑAS DE CLIENTES" mirrors "READ CLIENT REVIEWS" and gives no count.
- **Experience:** only *corto/corta pelo desde 2023*.
- **Awards, licenses, parking, addresses:** none of the forbidden address strings appear.
- **Brand names:** none.
- **Exclamation marks:** "¡…!" appears only inside the locked homepage review.
- **Register:** tú throughout, with no *usted* forms. The *su/sus* hits are third-person possessives ("su forma", "sus papás"). No *nosotros*, except "Nuestro oficio.", which mirrors Colin's frozen EN "Our Craft.", and the chrome *Visítanos*.
- **Tokens:** every `{{…}}` token is identical to EN in every segment.
- **Numbers and times:** every number matches. The only differences are glossary formats ("8:00 AM" for "8 AM"; "años 80" for "1980s").
- **Punctuation:** every question has an opening ¿, and every `<br>` is preserved.

## MINOR list (pass; recommended touch-ups, none blocking)

397 segments are MINOR. Almost all are acceptable rephrasing: plural to singular in SEO keywords, "straight razor" to *navaja*, "booking" to *cita*, "young clients" to *clientes pequeños*, or the dropped "wet" in "wet shave" that the glossary itself requires. Every note is in `adjudication-es.json`. These are the ones worth fixing:

- **about · seo.description:** "trabaja solo y atiende con cita" drops *solo* from "appointment only". Suggest "…trabaja por su cuenta y atiende solo con cita."
- **visit · seo.description:** "escríbele a Tim" means "write to Tim", where EN says "text Tim". Suggest "Agenda en Booksy o mándale un mensaje a Tim."
- **services · seo.description:** drops EN's closing "Book on Booksy." Append "Agenda en Booksy." if it fits within 155 characters.
- **services · seo.title, services-color · seo.title:** drop "| Divinely Faded" (glossary title pattern). services-color also moves the city after a pipe.
- **visit · seo.title:** drops "& Directions".
- **home · strings[11][1]:** *limpieza del cuello con navaja* is a faithful rendering of "neck", but the locked phrase is *limpieza de la nuca con navaja*.
- **home · strings[27][1]:** *masaje de cuero cabelludo* vs the locked *masaje en el cuero cabelludo*.
- **services · lead "Las citas más largas." and braids "Una de las citas más largas…":** EN says "longer". The Spanish reads as "longest", which is still true of the menu.
- **Observation, not a failure:** *Booksy aparta X min* uses *apartar* in the sense "holds or sets aside", not "to book". The glossary bans *apartar* only as a synonym for booking. If the lead prefers zero *apartar* on the site, use *Booksy reserva/separa {{minutes}} para…*.

## Files

- `i18n/qa/backtranslation-es.json`: blind back-translations, `{page_id: [{path, es, back_en}]}`, written before any EN source was opened.
- `i18n/qa/adjudication-es.json`: the same segments plus `en`, `verdict` and `note`.
- `i18n/QA-REPORT-es.md`: this report.

## Addendum 2026-10-24 (lead): MAJORs resolved
All 4 MAJORs in `content/es/home.json` were replaced with the corrected, glossary-compliant strings proposed above (modelado de barba; detalles con navaja; depilación con cera de nariz y orejas, and “Cera de nariz / orejas” for the frozen add-on row, added to the glossary; diseño detallado marcado). Non-blocking meta fixes applied (about: “por su cuenta y solo con cita”; visit: “mándale un mensaje a Tim”; services: “Agenda en Booksy.”). With the 4 segments re-judged MATCH: 950/950, 0 MAJOR → **PASS**.
