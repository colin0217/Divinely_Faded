# Spanish glossary: Divinely Faded (locked 2026-10-24, before translation)

Phase C1 of the build (`planning/BUILD-STATUS.md`), following `translation-qa-gate` and the Bunny Baristas precedent (`bunny-baristas-site/i18n/glossary-es.md`). **Every ES translator uses this file word for word. Breaking the glossary is an automatic segment failure in C3.** If a term you need is missing, coin it once, add it under "Additions" at the bottom with the date, and reuse it everywhere.

Sources used: `content/facts.json` (the only business facts), `content/en/*.json` (22 pages), `seo/keyword-map.md` (US-es and Eddy County Spanish planner volumes, 2026-10-24), `tools/build.mjs` (`T.es`), `tools/check.js` (the never_claim regexes the ES pages must pass), and Tim's Booksy Spanish page (`booksy.com/es-us/1113769_…`, read 2026-10-24: Spanish interface with the **"Agendar"** button, service names and descriptions still in English).

---

## 1. Register and formats

### Who is talking, and to whom
- **Locale:** es-US, Mexican Spanish as spoken in southeastern New Mexico (Carlsbad, Eddy County). Use Mexican words where Mexico and Spain differ: *fleco* (not *flequillo*), *pelo chino* (not *pelo rizado*, which is the second choice), *lacio*, *rayitos*, *papás* (meaning parents), *agendar*, *platicar*, *máquina* (clippers).
- **Address the reader as tú, always.** Never *usted*, and never mix the two on one page. Why: Tim's English voice is casual and short ("text me", "grab a time"). The house precedent (Bunny Baristas) uses tú. Booksy and the keyword data are informal too ("barbería cerca de mí"). In Mexican-American barbershop talk, tú is the normal form between barber and client. Address a parent plus child as *ustedes* only when the English clearly means both.
- **First person singular, as Tim:** *mi silla, mi barbería, corto, atiendo, te recomiendo*. Tim works alone, so never use *nosotros*, except in the existing chrome label "Visítanos", which mirrors the English "Visit us".
- **Voice rules carry over from `content/README.md`:** warm, short and specific. No emoji. **No exclamation marks** in Tim's copy (¡…! is allowed only inside the quoted Booksy review). Faith shows in one line at most.
- **Gender:** use the masculine generic for the client (*listo, bienvenido*). Kids are *niños*, and parents are *papás*.
- **Spanish punctuation is required:** opening ¿ on every question. Keep accents on capital letters (*CÓMO AGENDARLO*, *A QUIÉN LE QUEDA*). Headings end with a period exactly where the English ones do ("Haircuts." → "Cortes."). Eyebrows keep the `NN / TEXTO` pattern in capitals with no final period.
- **Quotation marks:** curly double quotes “ ”, matching Colin's homepage. Don't use «» on this site.
- **Pelo vs cabello:** write *pelo* in body copy, since it's warmer and the data favors it ("cortes de pelo para hombres" 90,500/mo vs "cortes de cabello para hombre" 74,000/mo US-es). Use *cabello* only where a locked slug or keyword-map term needs it (`/es/servicios/cortes-de-cabello/`, "estilos de corte de cabello para hombre").

### Numbers, prices, durations
| Thing | Locked ES form | Never |
|---|---|---|
| Price | `$50` (sign first, no decimals), identical to EN | "50 dólares", "50 $", "USD 50", "$50.00" |
| Price · time line | `$50 · 40 min` (the `{{price}} · {{minutes}}` tokens are unchanged) | rewriting the tokens |
| Minutes | `40 min` | "40 minutos" inside the meta line (prose may say "40 minutos") |
| Hours | `2 h`, `4 h` (the generator's `T.es.hr = "h"`) | "2 hrs", "2 horas" in the meta line |
| 90 minutes | see §6, note 3: the generator prints `1.5 h`; recommend `90 min` or `1 h 30 min` | |
| Decimal / thousands | US and Mexican convention: `1.5`, `1,300` | `1,5`, `1.300` |
| Distances | `millas` (Visit table column "Millas"; values from facts) | converting to km |

Prices and times always come from the tokens (`{{price:…}}`, `{{minutes:…}}`, `{{addon:…}}`, `{{holiday_fee}}`, `{{phone}}`, `{{address}}`). Translators copy tokens exactly and never type a number the tokens provide.

### Times of day: **`9:00 AM` / `5:00 PM`** (decision)
Use the same form as the English: `9:00 AM`, `12:30 PM`, `5:00 PM`, with no periods or spaces inside "AM".
Why:
1. Booksy and Google show these same customers "AM/PM". The site's job is to match what they see when they book.
2. US Spanish-language media and signage in NM use AM/PM widely, and the house precedent locked "3 AM".
3. RAE's "9:00 a. m." is correct but longer, and it would put two time formats on one site (the footer `hours` string is shared).
4. It removes a source of segment failures in C3.

- Noon: write **mediodía** in prose ("de 9:00 AM a mediodía"). Tables use `12:00 PM`.
- Ranges: "de 9:00 AM a 12:00 PM" in prose. Tables use an en dash, "9:00 AM–12:00 PM".
- Visit-page hours table (locked): `Lunes | 9:00 AM–12:00 PM, 12:30–5:00 PM` … `Miércoles | Cerrado` … `Sábado | 8:00 AM–2:00 PM` … `Domingo | Cerrado`. Columns: `Día | Horario`.

### Days and dates
- Days are lowercase in prose (*lunes, martes, miércoles, jueves, viernes, sábado, domingo*) and capitalized only as the first word in a table cell.
- Abbreviations (footer only): `Lun, mar, mié, jue, vie, sáb, dom`. Never "miér".
- Dates: **`24 de octubre de 2026`**, with the month in lowercase. This is exactly what `toLocaleDateString("es-US", {month:"long"})` prints, so the blog cards and post bylines already match. Never "octubre 24, 2026" or "24/10/2026".
- "Cutting since 2023" → **"Corto pelo desde 2023"** (first person). Never "X años de experiencia" (`check.js` rejects it).

### Places and brand strings (never translated)
| EN | ES | Note |
|---|---|---|
| Divinely Faded | Divinely Faded | brand |
| Tim / Timothy "Tim" Murillo | Tim / Timothy Murillo | "La mayoría me dice Tim" for "Most people call me Tim" |
| 303 S Halagueno St, Carlsbad, NM 88220 | identical (comes from `{{address}}`) | never put a translated state name in front of the ZIP |
| Carlsbad, New Mexico (prose) | Carlsbad, Nuevo México | "Carlsbad, NM" in titles and meta |
| Eddy County | el condado de Eddy | |
| La Huerta, Happy Valley, Otis, Loving, Malaga, Whites City, Artesia | unchanged | Visit table columns: `Pueblo · Millas · En auto` |
| Booksy, Zelle, Cash App, Google Maps, Instagram, TikTok, YouTube, Facebook | unchanged | "en Booksy", "por Zelle" |
| Elevate Your Standard. (tagline) | **Kept in English** in the logo lockup and wherever the copy quotes it as "my tagline". In a heading that uses it as ordinary copy (homepage 01), write **"Eleva tu estándar."** | About: "Elevate Your Standard. Ese es mi lema…" |
| Cut Different. (homepage hero type) | **Kept in English**: it's Colin's display lettering (design frozen), and the slogan doesn't survive translation ("Un corte diferente" back-translates to a different claim) | the lead may overrule |
| The Booksy review on the homepage: “Always a great cut & beard line up!” · MATT · SIGNATURE CUT | **“¡Siempre un gran corte y delineado de barba!”** · MATT · SIGNATURE CUT | one rendering everywhere. The ¡! belong to the reviewer. Use no other review text. |

---

## 2. Locked ES slugs

These are ASCII only, with no accents, *ñ → n*, lowercase, a trailing slash, and Spanish word order. They are final: the BUILD-STATUS inventory plus the two keyword-map changes. Every `content/es/<id>.json` uses `"slug"` = the ES column and `"alt"` = the EN column.

| Page id | EN | **ES (locked)** | Why this slug |
|---|---|---|---|
| home | / | `/es/` | |
| services | /services/ | `/es/servicios/` | |
| services-haircuts | /services/haircuts/ | `/es/servicios/cortes-de-cabello/` | kept from inventory; the H1/title carry the primary "cortes de pelo para hombres" |
| services-kids | /services/kids-haircuts/ | `/es/servicios/cortes-para-ninos/` | "cortes para niños" 1,000 US-es |
| services-beard-shaves | /services/beard-and-shaves/ | `/es/servicios/barba-y-afeitado/` | |
| services-facials | /services/mens-facials/ | `/es/servicios/faciales-para-hombres/` | "faciales para hombres" 170 |
| services-braids | /services/braids/ | `/es/servicios/trenzas/` | |
| services-designs | /services/hair-designs/ | `/es/servicios/disenos-de-cabello/` | kept; copy says *diseños en el pelo* |
| services-color | /services/color-and-perm/ | `/es/servicios/color-y-permanente/` | |
| styles | /styles/ | `/es/estilos/` | |
| styles-skin-fade | /styles/skin-fade/ | `/es/estilos/skin-fade/` | no Spanish rendering has volume |
| styles-low-taper-fade | /styles/low-taper-fade/ | `/es/estilos/low-taper-fade/` | Spanish searchers keep "taper" |
| styles-burst-fade | /styles/burst-fade/ | `/es/estilos/burst-fade/` | "corte burst fade" 480 |
| styles-modern-mullet | /styles/modern-mullet/ | `/es/estilos/mullet-moderno/` | "mullet moderno" 1,300 |
| styles-textured-fringe | /styles/textured-fringe/ | `/es/estilos/fleco-texturizado/` | *fleco* is the Mexican word |
| styles-buzz-cut | /styles/buzz-cut/ | `/es/estilos/buzz-cut/` | "corte buzz cut" 720 vs "corte rapado" 110 |
| styles-slick-back | /styles/slick-back/ | `/es/estilos/peinado-hacia-atras/` | 260 + 110 vs "corte slick back" 170 |
| styles-curly-top-fade | /styles/curly-top-fade/ | `/es/estilos/curly-top-fade/` | **changed** from fade-con-rizos (10/mo); "curly top" 3,600 US-es |
| styles-hard-part | /styles/hard-part/ | `/es/estilos/corte-con-raya/` | **changed** from raya-marcada; "corte de pelo con raya" 480 |
| styles-textured-crop | /styles/textured-crop/ | `/es/estilos/crop-texturizado/` | 390 |
| about | /about/ | `/es/sobre-mi/` | first person, matches the "Sobre mí" nav |
| visit | /visit/ | `/es/visitanos/` | |
| faq | /faq/ | `/es/preguntas-frecuentes/` | |
| blog (hub) | /blog/ | `/es/blog/` | Spanish uses "blog" |
| blog posts | /blog/<slug>/ | `/es/blog/<slug-es>/` | built from the post's **ES keyword** in `planning/BLOG-PLAN.md` (e.g. "cuanto dura un fade" → `/es/blog/cuanto-dura-un-fade/`); ASCII and hyphens only; no dates, no stopword-only slugs |
| 404 | /404.html | one bilingual 404 (see §6, note 6) | |

**Two EN files still point at the old drafts (checked 2026-10-24).** `content/en/styles-curly-top-fade.json` has `"alt": "/es/estilos/fade-con-rizos/"` and must change to `/es/estilos/curly-top-fade/`. `styles-hard-part.json` has `"alt": "/es/estilos/raya-marcada/"` and must change to `/es/estilos/corte-con-raya/`. Both are lead-owned edits; until they're made, hreflang parity fails in C4.

### Titles and descriptions
- Title pattern: `<Tema> en Carlsbad, NM | Divinely Faded`, ≤ 60 characters after translation. Rewrite to fit; never truncate. Use the page's ES primary from the keyword map in the title or H1. Homepage: `Divinely Faded | Barbería en Carlsbad, NM`.
- Meta description: ≤ 155 characters. It contains the ES primary and "Carlsbad", and closes with "Agenda en Booksy." when it fits.

---

## 3. Term table

Key: **Keep EN?** Y = the English word is the locked term. "Y + gloss" = English name with a Spanish gloss in parentheses on its first use on each page. N = Spanish only.

### Fades and cuts
| EN | **Locked ES** | Keep EN? | Rationale (data / usage) | Do not use |
|---|---|---|---|---|
| fade (generic noun) | **desvanecido** (*un desvanecido bajo*). First mention per page: "desvanecido (fade)" | N | "desvanecido bajo" 2,900/mo US-es vs "fade bajo" 880 vs "degradado bajo" 590; Eddy Co. Spanish searches use *desvanecido* | *degradado* except once as the assigned secondary on skin-fade; *difuminado* as the noun; *fade* alone in prose outside a style name |
| low / mid / high fade | **desvanecido bajo / medio / alto** | N | "desvanecido alto" is in the blog map; consistent adjectives | *fade bajo* in page copy (the blog may target "fade medio" as a keyword only where BLOG-PLAN assigns it) |
| fade height | **la altura del desvanecido** | N | | *nivel* |
| taper | **taper** (*el taper*; *taper bajo*, *taper medio*) | Y | Spanish searchers keep it: "taper bajo" 1,300, "corte taper fade" 2,400 | *cónico*, *afilado*, *degradado suave* |
| low taper fade (style name) | **low taper fade**; prose: *taper bajo* | Y | slug and H1 keep the name | |
| skin fade | **skin fade** (name); description: *desvanecido hasta la piel* | Y + gloss | no Spanish rendering has volume ('degradado a piel' 0) | *fade a cero*, *rapado a cero* (a different cut) |
| burst fade | **burst fade** | Y | "corte burst fade" 480; no Spanish name exists | *fade de explosión*, *desvanecido en abanico* |
| drop fade | **drop fade** | Y | BLOG-PLAN S7 keeps "drop fade" in ES | *fade caído* |
| curly top fade | **curly top fade** (name); copy says **pelo chino** | Y | "curly top" 3,600; "pelo chino hombre" 720 | *fade con rizos* |
| burst fade mullet | **burst fade mullet** | Y | | |
| line-up / edge-up / shape-up | **delineado** (*el delineado*, *delinear*). First mention per page: "delineado (line-up)" | Y + gloss on first use | the usual Mexican barber word for squaring the hairline and beard edges; "line-up" is heard in the chair, hence the gloss | *perfilado* (Spain), *alineación*, *contorno* as the service name, *marcado* |
| beard line-up | **delineado de barba** | N | matches the locked review rendering | |
| hard part | **raya marcada** (shaved part line); page H1/name: **Corte con raya.** | N | "corte de pelo con raya" 480, "raya en el pelo hombre" 170; "hard part" 2,400 may appear once as a secondary | *raya dura*, *parte dura*, *raya rasurada* |
| part / side part | **raya / raya de lado** | N | Mexican *raya* | *partidura*, *crencha* |
| comb-over | **peinado de lado (comb-over)** | gloss | | |
| textured crop | **crop texturizado** | N | 390 US-es | *corte cultivado* |
| French crop | **French crop** | Y | "corte french crop" 390 | *corte francés* |
| textured fringe | **fleco texturizado** | N | slug; *fleco* is Mexican; "flequillo texturizado hombre" 30 may appear once as the primary in title/meta per the keyword map | *flequillo* in body copy |
| fringe | **fleco** | N | | *flequillo* (body), *pollina* |
| edgar haircut | **corte Edgar** | Y | widely known name in Mexican-American usage | |
| mullet / modern mullet | **mullet / mullet moderno** | Y (mullet) | "mullet moderno" 1,300, "corte mullet" 6,600 | *greña*, *corte de los 80* as the name |
| buzz cut | **buzz cut** (name); description: *corte rapado* | Y + gloss | "corte buzz cut" 720 vs "corte rapado" 110 | *pelón* |
| crew cut | **crew cut** | Y | no settled Spanish name with volume | *corte de tripulación* |
| high and tight | **high and tight (estilo militar)** | Y + gloss | BLOG-PLAN S40 owns "corte militar" | |
| slick back | page H1/name: **Peinado hacia atrás.**; "slick back" in parentheses on first use | N + gloss | 260 + 110 vs 170 | *engominado* as the name, *relamido* |
| undercut | **undercut** | Y | | |
| faux hawk | **faux hawk (cresta)** | Y + gloss | | *mohicano falso* |
| shaved head / head shave | **cabeza rapada / afeitado de cabeza** | N | | *pelón* |
| blend (noun / verb) | **transición / difuminar** | N | | *mezcla* |
| scissor cut | **corte a tijera** | N | | |
| clippers / guard numbers | **máquina / números** | N | BLOG-PLAN S13 "numeros de corte de pelo" | *maquinilla* (Spain), *rapadora* |

### Head and hair vocabulary
| EN | Locked ES | Do not use |
|---|---|---|
| top / sides / back | arriba (la parte de arriba) / los lados / atrás (la parte de atrás) | *la corona* for top |
| crown | coronilla | |
| nape / neckline | nuca / contorno de la nuca | *cogote* |
| sideburns | patillas | |
| temple | sien | |
| hairline | nacimiento del pelo | |
| cowlick | remolino | |
| curly / coily / wavy / straight | **chino** / muy chino / ondulado / **lacio** | *rizado* only as the assigned secondary ("corte de pelo rizado hombre"); *liso* (Spain) |
| thick / thin, fine / coarse | grueso / delgado, fino / duro | *áspero* |
| texture / textured / volume / movement | textura / texturizado / volumen / movimiento | |
| regrowth / grow out | el pelo que vuelve a crecer / dejar crecer | |
| cape | capa | |

### Beard, shave, skin
| EN | **Locked ES** | Keep EN? | Rationale | Do not use |
|---|---|---|---|---|
| beard trim | **corte de barba** (verb: *recortar la barba*) | N | "corte de barba" 3,600 US-es, the services-beard-shaves primary | *perfilado de barba*, *arreglo de barba* (70/mo; secondary only, once) |
| beard sculpt | **modelado de barba** | N | natural Mexican usage | *escultura de barba* |
| straight razor | **navaja** (*navaja de barbero* on first use) | N | Mexican standard; "afeitado con navaja" is the mapped secondary | *cuchilla*, *rastrillo* (a disposable razor), *rasuradora* (electric) |
| straight razor neck cleanup | **limpieza de la nuca con navaja** | N | | |
| straight razor detailing | **detalles con navaja** | N | | *detallado* |
| shave / to shave | **afeitado / afeitar** | N | consistent with the slug *barba-y-afeitado* | mixing in *rasurado/rasurar* on the same site |
| wet shave / traditional shave | **afeitado tradicional** | N | BLOG-PLAN M8 ES keyword | *afeitado en húmedo* |
| hot towel / dual hot towels | **toalla caliente / dos toallas calientes** | N | BLOG-PLAN M9 "afeitado con toalla caliente" | *toalla tibia* |
| shaving cream (premium) | **crema de afeitar premium** | N | | brand names (never_claim) |
| aftershave / aftershave balm | **aftershave / bálsamo aftershave** (*calmante* = soothing) | Y | the common word in Mexico | *loción para después del afeitado* (too long; fine once if a line needs it) |
| facial (service) | **facial** (*un facial*, *los faciales*) | N | "facial para hombres" 170 US-es | *tratamiento facial* as the service noun |
| warm steam / facial steam | **vapor tibio / vapor facial** | N | *tibio* = warm. Don't strengthen warm into hot. | *vapor caliente* |
| facial massage / scalp massage | **masaje facial / masaje en el cuero cabelludo** | N | | |
| deep cleanse | **limpieza profunda** | N | | |
| gentle exfoliation | **exfoliación suave** | N | | |
| hydrating moisturizer | **crema hidratante** | N | | |
| advanced skin treatments | **tratamientos avanzados para la piel** | N | | |
| anti-aging serum | **sérum antiedad** | N | common Mexican beauty usage | *suero antienvejecimiento* |
| wash | **lavado** | N | | *champú* as the service |
| ear and nose waxing | **depilación con cera de nariz y orejas** | N | BLOG-PLAN M15 "depilacion de nariz" | |
| eyebrows | **cejas** | N | | |
| fragrance finish | **toque final de fragancia** | N | no brand names | *perfume* |
| consultation | **consulta** | N | | |
| styling / finished style | **peinado / peinado final** | N | | *estilizado* |

### Braids, designs, color
| EN | **Locked ES** | Keep EN? | Rationale | Do not use |
|---|---|---|---|---|
| braids | **trenzas** | N | "trenzas para hombre" 14,800 US-es | |
| cornrows | **trenzas pegadas** | N | "trenzas pegadas hombre" 260 | *cornrows* alone, *trenzas africanas* |
| box braids | **box braids** | Y | BLOG-PLAN B2 keeps it | |
| braids with a fade | **trenzas con fade**. This is the one place "fade" stands alone (the BLOG-PLAN B4 keyword). Pages say *trenzas con desvanecido*. | | | |
| gold cuffs (on braid ends) | **anillos dorados** (*anillos para trenzas*) | N | the usual Spanish term for braid cuffs | *esposas*, *puños* |
| set (of braids) | **peinado de trenzas** | N | | *set* |
| hair design | **diseño en el pelo** (plural: *diseños en el pelo*); search phrase: *corte con diseño* | N | "corte de pelo con diseño" 2,900, "corte con diseño" 480 | *tatuaje de pelo*, *rayas* (except BLOG-PLAN S38's keyword) |
| freestyle (design) | **diseño libre (freestyle)** on first use, then *libre* | gloss | | *estilo libre* |
| lines (cut in) | **líneas** | N | | |
| color / hair dye | **color / tinte** | N | "tinte de pelo para hombre" 320 | |
| bleach / bleaching | **decoloración / decolorar** | N | BLOG-PLAN C1 "decoloracion" | *blanquear*, *cloro* |
| tone / toning | **matizar / matizado** | N | the Mexican salon term | *tonificar*, *tonalizar* |
| shade | **tono** | N | | |
| brassy | **amarillento** | N | | *cobrizo* (a color name) |
| blonde / platinum | **rubio / platinado** | N | "pelo platinado hombre" 140 | *güero* in copy (fine when spoken; reads informal for a page) |
| highlights | **rayitos** | N | "rayitos para hombre" 720 vs "mechas hombre" 90 | *mechas*, *luces* |
| perm | **permanente** (*la permanente*) | N | "permanente para hombre" 320 | *ondulado permanente* |
| beard dyeing (not offered) | **teñido de barba** | N | | |
| capillary treatment (not offered) | **tratamiento capilar** | N | | |
| toupee services (coming soon) | **servicios de peluquín** (*próximamente*) | N | *peluquín* is Mexican; *tupé* means a quiff in much of the Spanish world | *tupé*, *bisoñé* |

### Booking, policy, money
| EN | **Locked ES** | Rationale | Do not use |
|---|---|---|---|
| book (verb) | **agendar** (*agenda tu cita*) | the word on Tim's own Booksy Spanish button ("Agendar"), and everyday Mexican usage. The customer's next screen matches. | *reservar* in new copy (see §6 for chrome), *apartar*, *sacar turno* |
| appointment | **cita** | | *turno* (Southern Cone), *reservación* as a synonym for appointment |
| Appointments only. / appointment only | **Solo con cita.** / *atiendo solo con cita* | positive phrasing only | see the walk-in row |
| booking (noun) | **cita** (*tu cita*); a "Booksy booking" is *una cita en Booksy* | | *booking* |
| open slot / time | **horario disponible** / *un horario* | | *slot* |
| rebook / come back | **agendar tu próxima cita** / *volver* | | |
| no-show | **no llegar a tu cita** (*si no llegas a tu cita*) | | *no-show*, *plantón* |
| late cancellation | **cancelación de último momento** | | *cancelación tardía* (stiff) |
| cancellation fee | **cargo por cancelación** | | *multa*, *penalización*, *tarifa de cancelación* |
| "may be charged" (policy hedge) | **puede cobrar / se puede cobrar** | keep the hedge exactly; the English never says "will" | *se cobrará* (strengthens the claim) |
| holiday / holiday fee | **día festivo / cargo por día festivo** ({{holiday_fee}}) | | *feriado* (South American), *recargo navideño* |
| "on the holiday itself" | **el mismo día festivo** | | |
| payment due after service | **pagas el total al terminar el servicio** | | *pago por adelantado* |
| cash, card, Zelle, Cash App | **efectivo, tarjeta, Zelle y Cash App** | | *crédito/débito* (the facts say only "card") |
| add-on | **extra** (*los extras*; eyebrow "05 / EXTRAS") | short, and common on Mexican service menus | *complemento*, *add-on* in copy |
| price varies | **Varía** (meta) / *el precio varía según el estilo* | | *precio a consultar* |
| text me / text (verb) | **mándame un mensaje** / *mensaje de texto* | | *textéame* (Spanglish), *escríbeme por WhatsApp* (not a fact), *DM* |
| call me | **llámame** | | |
| kids welcome | **niños bienvenidos** / *los niños son bienvenidos* | | *se aceptan niños* |
| parents | **papás** | | *padres de familia* |
| barbershop / barber | **barbería / barbero** | "barbería cerca de mí" 165,000 US-es | *peluquería* (a salon, a different place; BLOG-PLAN E4 contrasts them) |
| shop (Tim's) | **mi barbería** | | *el local*, *el negocio* |
| chair | **silla** (*mi silla*) | | *sillón* (fine when spoken; lock one) |

### WALK-IN: forbidden in both languages
The English word "walk-in" never appears. `tools/check.js` fails the build on any of these patterns, **including negated sentences** ("no atiendo sin cita" still matches `sin cita`):

| Never write (ES) | Write instead |
|---|---|
| sin cita · sin cita previa · sin previa cita | **Solo con cita.** |
| llegue / llega / ven / venga / pase / pasa **sin cita** | *Agenda primero en Booksy.* |
| sin reservación · sin reserva | *Atiendo solo con cita.* |
| se aceptan clientes sin cita · sin necesidad de cita | — |
| por orden de llegada · atención inmediata | — |
| llega cuando quieras · pásate cuando quieras · date una vuelta | — |
| walk-in, walk-ins, walkin (in either language) | — |

Locked rendering of the haircuts FAQ "Can I just stop by for a cut?": **"¿Puedo llegar nada más a cortarme el pelo?" / "Atiendo solo con cita, así que primero agenda un horario en Booksy. Si no encuentras uno que te funcione, mándame un mensaje."**

### Lines that repeat across pages (identical EN, identical ES)
| EN | Locked ES |
|---|---|
| BOOK NOW | AGENDA AHORA |
| BOOK THIS CUT | AGENDA ESTE CORTE |
| BOOK IT AS (eyebrow) | CÓMO AGENDARLO |
| QUESTIONS (eyebrow) | PREGUNTAS |
| Good to know. | Lo que debes saber. |
| UPKEEP | MANTENIMIENTO |
| WHO IT SUITS | A QUIÉN LE QUEDA |
| THE CUT | EL CORTE |
| THE MENU | EL MENÚ |
| SEE THE STYLES / BROWSE THE STYLES | VER LOS ESTILOS |
| TEXT ME | MÁNDAME UN MENSAJE |
| GET DIRECTIONS | CÓMO LLEGAR |
| Kids welcome (meta) | Niños bienvenidos |
| in my chair / from my chair | en mi silla / de mi silla |
| Bring a photo / A photo helps | Trae una foto / Una foto ayuda |
| Pick your service. | Elige tu servicio. |
| KEEP EXPLORING (generator) | SIGUE EXPLORANDO |

---

## 4. Service names: **kept in English** (decision)

**Decision:** the ten official service names stay in English, exactly as Booksy writes them. The first time a name appears in body copy on a page, add a literal Spanish gloss in parentheses. After that, use the English name alone. List-item titles, meta lines and headings carry the English name with no gloss.

**Why:**
1. People book on Booksy, and Tim's Spanish Booksy page (`/es-us/`, checked 2026-10-24) still shows **Essential Haircut, Signature Cut, Luxury Grooming Experience…** in English. Booksy translates its own buttons but never the names a business types. A Spanish reader who sees "Corte esencial" on the site would not find it on Booksy.
2. The names act like product names (capitalized and priced), the same treatment as Bunny's drink names.
3. Claim parity: a literal gloss adds no information, so it survives back-translation.

| Booksy name (keep) | Gloss on first use | Gender in ES prose |
|---|---|---|
| Essential Haircut | (corte esencial) | el Essential Haircut |
| Signature Cut | (corte distintivo) | el Signature Cut |
| Luxury Grooming Experience | (experiencia de arreglo de lujo) | la Luxury Grooming Experience |
| Straight Razor Beard Shave | (afeitado de barba con navaja) | el Straight Razor Beard Shave |
| Head & Beard Shave | (afeitado de cabeza y barba) | el Head & Beard Shave |
| Express Facial | (facial exprés) | el Express Facial |
| Deluxe Facial | (facial deluxe) | el Deluxe Facial. Not *de lujo*, which collides with Luxury. |
| Braids | in prose say **trenzas**; name it only to point at Booksy: *"en Booksy aparece como Braids"* | |
| Color Transformation | (transformación de color) | la Color Transformation |
| Perm | in prose say **la permanente**; *"en Booksy aparece como Perm"* | |

Short references the English uses ("the Essential", "the Signature", "the Luxury", "the Express", "the Deluxe") become *el Essential*, *el Signature*, *la Luxury*, *el Express*, *el Deluxe*.

**Add-ons are translated.** They are generic words, not product names. The add-on list lead says once: *"En Booksy aparecen en inglés."*
| Booksy add-on | ES label |
|---|---|
| Hair design | Diseño en el pelo |
| Wash & scalp massage | Lavado y masaje en el cuero cabelludo |
| Luxury fragrance | Fragancia de lujo |
| Eyebrows | Cejas |
| Nose / ear wax | Depilación con cera de nariz y orejas |

**Booksy link (lead decision, recommended):** ES pages can send customers to the Spanish Booksy interface, `https://booksy.com/es-us/1113769_divinely-faded-timothy-murillo_barber-shop_28967_carlsbad` (same listing and services; its button reads "Agendar"). That means adding `booksy_es` to `facts.json` and having `href("booksy", "es")` use it. Note the page shows a review count and rating, which this site must never quote.

---

## 5. Never claim (Spanish mirror of `facts.never_claim`)

A translation makes exactly the claims the English makes. Nothing below appears on any ES page, in meta, alt text or JSON-LD. Lines marked † are also enforced by `tools/check.js` regexes.

| never_claim | Forbidden ES forms | Note |
|---|---|---|
| walk-in (any form) | see the WALK-IN table in §3 † | |
| Spanish-language service | †*se habla español*, †*hablo / hablamos español*, †*atendemos / atención / servicio en español*, *bilingüe*, *te atiendo en tu idioma*, *personal que habla español*, *barbero bilingüe* | unconfirmed (needs_tim "Does Tim speak Spanish?"). Having a Spanish page is not a claim that Tim speaks Spanish; never say it is. |
| best / #1 / rankings | †*el / la / los / las mejor(es)*, †*número uno*, †*#1*, †*mejor calificado / valorado*, *top*, *líder*, *insuperable*, *inigualable*, *el más …* (superlative claims), *de primera* | **Caution:** the regex also catches harmless phrases like "la mejor forma". Rephrase: *lo más fácil*, *te conviene*, *vale más que* ("A screenshot beats a description" → *"Una captura de pantalla vale más que una descripción."*) |
| discounts or offers | †*descuento*, †*cupón*, †*promoción*, †*oferta especial*, also *oferta*, *promo*, *2x1*, *gratis*, *precio especial*, *rebaja*, *barato* | the verb *ofrezco* ("I offer") is fine |
| review quotes or counts beyond the homepage | †*N reseñas / opiniones*, *5 estrellas*, *5.0* | only the one locked homepage review |
| years of experience | †*N años de experiencia*, *años en la silla* | only *corto pelo desde 2023* |
| awards, certifications, licenses | †*premiado*, †*certificado*, †*licenciado*, *con licencia*, *galardonado*, *acreditado* | |
| parking | †*estacionamiento*, *aparcamiento*, *dónde estacionarse* | unknown |
| fragrance or product brand names | any brand | |
| addresses | †*301*, †*Canyon*, †*Margaret* | only 303 S Halagueno St |
| prices/times not from tokens | any typed number | |
| promises the English lacks | *garantizado*, *satisfacción garantizada*, *el mejor precio*, *rápido* when the EN doesn't say so | |

---

## 6. Review of the `T.es` chrome strings (`tools/build.mjs` lines 31–40)

The lead applies these; I did not edit `build.mjs`. "Booking" verbs follow §3: **pills and buttons use the tú imperative of *agendar***, while nav and footer links are nouns or infinitives.

| Key | Current | Verdict | Corrected |
|---|---|---|---|
| lang | es | OK | |
| home | /es/ | OK | |
| book (header pill) | RESERVAR CITA | change | **AGENDA TU CITA** |
| menuOpen | Abrir navegación | change | **Abrir menú** (Bunny precedent; natural) |
| skip | Ir al contenido | OK | (WordPress es-MX standard) |
| nav | Servicios · Estilos · Sobre mí · Galería · Blog · Visítanos · Preguntas | OK | |
| bookAppt (menu item) | Reservar una cita | change | **Agendar una cita** |
| city | CARLSBAD, NUEVO MÉXICO | OK | |
| toggle / toggleLabel | EN / View this page in English | OK | each written in its own language |
| madeIn | Hecho en<br>Carlsbad. | OK | |
| fAbout / fServices / fStyles / fBlog | Sobre mí / Servicios / Estilos / Blog | OK | |
| fVisit | Visítanos | OK | mirrors "Visit Us" |
| fBook | Reservar | change | **Agendar** |
| fReviews | Reseñas | OK | |
| fFaq | Preguntas | OK | page title is "Preguntas frecuentes"; short label fits the footer and menu |
| policies | Políticas de reserva y cancelación | change | **Políticas de citas y cancelación** (*reserva* is Spain-flavored; matches *cita*) |
| directions | Cómo llegar | OK | |
| text | Mensaje | change | **Mensaje de texto** ("Mensaje" alone reads like any chat or DM; footer renders "Mensaje de texto (575) 706-3095 · Llamar") |
| call | Llamar | OK | |
| hours | Lun, mar, jue, vie 9–12 y 12:30–5 · Sáb 8–2 · Cerrado miér y dom | change | **Lun, mar, jue, vie 9–12 y 12:30–5 · Sáb 8–2 · Cerrado mié y dom** ("miér" is not a standard abbreviation) |
| designed | Diseñado por | OK | |
| powered | Desarrollado por | change | **Con tecnología de** ("Desarrollado por" back-translates to "Developed by", which changes the credit; "Con tecnología de" is the standard rendering of "Powered by", the form Google uses) |
| ctaEyebrow | CUANDO ESTÉS LISTO | change | **LISTO CUANDO TÚ LO ESTÉS** (EN "READY WHEN YOU ARE" means Tim is ready; the current string drops the subject) |
| ctaHead | Toma asiento. | OK | |
| ctaBook | RESERVA EN BOOKSY | change | **AGENDA EN BOOKSY** |
| ctaText | MENSAJE A TIM | OK | (keep short for the pill) |
| ctaCall | LLAMAR | OK | |
| bookThis (list pill) | Reservar este servicio | change | **Agenda este servicio** |
| learnMore | VER EL ESTILO | OK as a translation, but see note 1 | |
| varies | Varía | OK | |
| min / hr | min / h | OK | see note 3 |
| crumbHome | Inicio | OK | |
| footerPhotoAlt | Tim sentado en su barbería | OK | |

**Strings hard-coded in English that will show on ES pages** (add them to `T`):
| Where in build.mjs | EN | ES |
|---|---|---|
| header logo aria-label | Divinely Faded home | Inicio de Divinely Faded |
| footer aria-label | Divinely Faded footer | Pie de página de Divinely Faded |
| footer social aria-label | Social media | Redes sociales |
| social link aria-label | Divinely Faded on {Instagram…} | Divinely Faded en {Instagram…} |
| footer photo logo aria-label | Divinely Faded — Elevate Your Standard | unchanged (brand lockup) |
| crumbs aria-label | Breadcrumb | Ruta de navegación |
| lightbox dialog aria-label | Portfolio photo | Foto del portafolio |
| close button aria-label / text | Close photo / CLOSE ✕ | Cerrar foto / CERRAR ✕ |
| lightbox img alt | Enlarged Divinely Faded portfolio photo | Foto ampliada del portafolio de Divinely Faded |
| JSON-LD ReserveAction result name | Barber appointment | Cita en la barbería |
| blog byline / related eyebrow | Por Tim Murillo / SIGUE EXPLORANDO | already correct |

**Notes for the lead:**
1. **EN bug:** `learnMore` ("SEE THE STYLE") is the default label for every list item with an `href`. On `/services/` it renders under *Essential Haircut* and links to the haircuts *service* page. Suggest a neutral default (EN "LEARN MORE" / ES **"VER MÁS"**), or set `link_label` per item.
2. **ES Booksy URL:** see §4 (`booksy_es`).
3. **Durations:** `minutes()` prints `1.5 hr` / `1.5 h` for the 90-minute Perm, while Colin's homepage prints `90 min`. Suggest printing minutes under 120 as `90 min` in both languages. Otherwise the ES meta reads `1.5 h`, which is understood but clumsy.
4. **Header pill width:** "AGENDA TU CITA" is 14 characters, the same as "MAKE A BOOKING", so the layout risk is unchanged. "LISTO CUANDO TÚ LO ESTÉS" (24) is longer than the EN eyebrow (18); check it at 320–375px in D2.
5. `<html lang="es">` and `hreflang="es"` are correct for this audience. Don't narrow to es-MX.
6. **404:** BUILD-STATUS says "(bilingual)", but the generator writes an EN-only 404 (`T.en`). Suggest a second line: *"Esta página no existe."* + **"Volver al inicio"** → `/es/`.

---

## 7. Open questions (for Tim, via Colin)
1. **Does Tim speak Spanish?** (already on needs_tim). Until he answers, ES copy keeps "mándame un mensaje" as written in the English, but must not add any line inviting messages in Spanish or promising Spanish service.
2. Should ES pages link to Booksy `/es-us/` (§4)? Recommended yes; it's a facts.json change, so it's the lead's call.
3. "Cut Different." and the tagline stay in English (§1). Colin or Tim may prefer a Spanish line on `/es/`. If so, lock it here first.

## Additions (translators: append here, dated, then reuse verbatim)
| EN | Locked ES | Added by / date |
|---|---|---|
