# HOLOGRID — Portfolio Website Specification v2.0
**Owner:** M. Ahsan Zaki Wiryawan (CS undergrad, cybersecurity — UGM)
**Version:** 2.0 · August 2026 · supersedes v1.0 entirely
**Companion artifacts:** `portfolio-prototype-v3.html` (design-approved interactive prototype), `portfolio-prototype-v2.html` (chamber reference)
**Audience:** written to be handed directly to an AI coding agent. Where this document gives a number, use that number. The prototype is the visual source of truth for anything ambiguous — open it in a browser and match it. Known prototype defect to fix (§7.4): homepage cards are too short.

---

## 0. Concept

A white, minimal, engineering-flavored editorial site — a survey document of Ahsan's work. Opening any section steps into a **hologram chamber**: the page inverts to deep blue-black and the section's items materialize as a tight, glowing cluster of cyan wireframe towers on a survey grid (tallest at center — a skyline with a peak). Blocks are orbitable 360°, hover-labeled, and clicking one opens a **floating glass popup card** anchored to that block. A top-left toggle switches to **MOSAIC** view — one connected full-width block of translucent cells in the style of Kage's "03 — Sacred Craft" chapter. The homepage is a continuous scroll journey (Kage pattern) whose content sections use **connected full-bleed card strips** in the style of Kage's "02 — Still Gardens". Everything is content-managed through Payload CMS.

**Two signatures, spent deliberately:**
1. The light↔dark inversion between the white site and the chamber.
2. The **connected-block principle**: cards never float as separate rounded islands. They form one continuous slab — full viewport width, cells separated by shared 1px hairlines, zero gaps, zero border-radius. This applies on both white (homepage strips) and dark (mosaic) surfaces. It is the single most important layout rule in this design.

Explicitly removed from v1: the floating "mist" section title (cut — cleaner without it), the slide-out side detail panel (replaced by popup, §8.3), and the plain editorial list view (replaced by mosaic, §8.5).

---

## 1. Tech stack & architecture *(unchanged from v1 in substance)*

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable) |
| CMS | Payload 3.x embedded in the same app, admin at `/admin` |
| Database | SQLite via Payload adapter (migration path → Postgres) |
| 3D | Vanilla Three.js, trimmed ESM imports, loaded via `next/dynamic` only when a scene will render. **No react-three-fiber. No model files — all geometry procedural.** |
| Styling | Tailwind + CSS variables for tokens |
| Scroll (homepage) | GSAP ScrollTrigger *or* Lenis + IntersectionObserver — one, not both |
| Deploy | Docker on VPS / Railway / Fly.io (Payload needs a persistent Node server) |

Rendering strategy: all public pages SSG with on-demand revalidation (Payload `afterChange`/`afterDelete` hooks → `revalidatePath`). Chamber data serialized at build as minimal JSON (`{id, slug, label, sublabel, weight, year}[]` — never rich text). The MOSAIC markup is the server-rendered default on section pages; the chamber hydrates over it. Crawlers, mobile, reduced-motion, no-WebGL, and chunk-timeout users all get the mosaic.

Repository layout: as v1 §1, with `/components/chamber` (engine), `/components/mosaic`, `/components/strips` (homepage card strips), `/components/cards` (popup), `/components/journey`.

---

## 2. Design tokens

### 2.1 Color

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F6F8F9` | White-page background |
| `--ink` | `#0C1218` | Primary text |
| `--graphite` | `#5B6774` | Secondary text, metadata |
| `--hairline` | `#DDE4E9` | All rules/borders on white, blueprint grid |
| `--holo` | `#3FC6FF` | The only accent, light and dark |
| `--holo-bright` | `#9FE5FF` → `#B6ECFF` | Beacons, hot highlights (dark surfaces only) |
| `--chamber` | `#04070D` | Chamber base black |
| Chamber bg gradient | `radial-gradient(120% 95% at 50% 64%, #10233C 0%, #081426 42%, #04070D 100%)` | CSS background behind a transparent-cleared WebGL canvas — this is what keeps the chamber from feeling empty |

Dark-surface hairlines: `rgba(160,210,235,.14–.16)`. Glass cell fill: `rgba(8,15,26,.42)` + `backdrop-filter: blur(4px)`. Glass popup fill: `rgba(9,17,29,.82)` + `blur(14px)`.

### 2.2 Type

Space Grotesk 500/600 (display) · IBM Plex Sans 400/500 (body) · IBM Plex Mono 400 (utility — always uppercase, letter-spacing .08–.22em, 10.5–12px). Self-host via `@fontsource`, latin subset, preload display woff2 only. Scale: 12/14/16/20/28/40/64/96. Display headlines tracking −0.02em. Outlined-stroke numerals/words (`-webkit-text-stroke: 1.5px var(--holo)`, transparent fill) are the approved treatment for "authored/secondary" stats and one hero word.

### 2.3 Recurring devices

- **Survey label** (mono): `SEC 02 · PROJECTS · N=14 · UPD 2026-08` — top-right of every section context; numbers always real, computed from CMS.
- **Eyebrow**: 34px cyan tick + mono label, e.g. `02 · PROJECTS · SELECTED · N=14`.
- **Blueprint grid** on white pages: 80px cells, 1px `--hairline`, opacity .42, fixed, CSS-only.
- **Index numerals**: `/01`-style on white, `01`-style ghosted (`rgba(255,255,255,.35)`, tracking .22em) on dark.
- Motion: 200–400ms, `cubic-bezier(.22,1,.36,1)`. One orchestrated moment per surface. `prefers-reduced-motion` kills all choreography (mandatory).

---

## 3. Site map *(unchanged)*

```
/                 scroll journey (7 chapters + footer)
/about            2D only, no chamber
/projects         chamber ⇄ mosaic          /experience, /organizations, /awards — same
/ctf              mosaic-first: SOLVED|AUTHORED toggle → competition cells
/ctf/[slug]       category cells (only non-empty per mode) → challenge rows → popup
/admin            Payload
```

About gets no chamber. CTF is mosaic-first (chamber for CTF = stretch goal M5: blocks = competitions, click navigates to `/ctf/[slug]`).

---

## 4. Payload schema

**Identical to v1 §5** (globals: `profile`; collections: `media`, `projects`, `experiences`, `organizations`, `awards`, `ctf-competitions`, `ctf-challenges`; same fields, hooks, access rules, derivation rules). Two additions:

- `projects.mosaicSpan` — optional select `auto | 2 | 3 | 4` (6-col units). Default `auto`: spans assigned by the pattern algorithm (§8.5). Editors can pin a big cell for flagship work.
- All display collections gain optional `subtag` (text, short) — the mono tag shown beside titles in cells/cards (e.g. `RUST`, `UX`). Defaults to first tag.

---

## 5. Homepage — the scroll journey

Fixed full-viewport canvas, **light world**: white fog, pale `GridHelper` floor, 30–40 procedural wireframe boxes in `--holo` (opacity .34) with a minority in ink (opacity .10), 3–5 cranes (mast + arm), one damped camera orbit driven by scroll progress (prototype: angle = t·0.4 + progress·1.4, radius 62→40, height 16→30, lookAt (0,7,0)). DPR ≤ 1.75, `powerPreference:'low-power'`, pause when tab hidden / idle. v1 §6 parameters apply. *(Owner note: this background is "fine for prototype" — expect one dedicated design pass in M3: more structural variety, chapter-synchronized camera stations à la Kage, possibly foreground WebP cutout layers. Build it data-light and parameterized so that pass is cheap.)*

Chapters and order: `00 HELLO` hero (name huge, one word outlined-stroke, tagline, scroll cue) · `01 ABOUT` · `02 PROJECTS` (card strip, §7) · `03 EXPERIENCE` · `04 ORGANIZATIONS` · `05 CTF` (solid vs outlined stat numerals: SOLVED n / AUTHORED m / PODIUMS k) · `06 AWARDS` · footer (mono: ©, coordinates `07°46′S 110°22′E · UGM`, social links).

Chapters 02, 03, 04, 06 each present their top items as a **Still-Gardens card strip** (§7) followed by an `◫ ENTER <SECTION> GRID` button (mono, 1px ink border, hover inverts to ink bg + holo text).

---

## 6. Navbar

56px fixed; white mode `rgba(246,248,249,.82)` + blur(12px) + hairline bottom; chamber mode flips to `rgba(4,7,13,.72)` + `rgba(63,198,255,.14)` border via `data-theme`. Monogram: wireframe cube SVG, holo stroke 1.4 (also favicon + loader mark). Links mono caps; active = holo underline; `[CV]` in holo.

---

## 7. Still-Gardens card strips (homepage section content) — white surface

The connected-block principle on white:

- **Full-bleed**: strip spans the entire viewport width (`width:100vw; margin-left:calc(50% − 50vw)`), breaking out of the 1240px text column. Top and bottom 1px hairline across the whole strip.
- **Uniform cells**: equal columns (3 for projects; adapt count to content, never mixed widths on the homepage — mixed widths belong to the mosaic). Cells share 1px hairline verticals, **gap 0, radius 0**. Mobile: stack full-width, hairlines horizontal.
- **Cell anatomy** (top→bottom): *visual band* — wireframe SVG artwork (holo strokes, opacity .8, plus a second muted layer `#9FB8C6` at .5) on a cool gradient `linear-gradient(160deg,#EEF4F7,#E2EDF3 55%,#D6E7F0)`; *body* — mono corner label (e.g. `SEC · E2E`), display title 23–26px, one-line summary, tag chips; *footer row* — `YEAR · CATEGORY` left, holo index `01 / 03` right.
- **The "slightly 3D" treatment** (approved, keep): container `perspective:1100px`; per-cell pointer-tracked tilt `rotateY(±9°) rotateX(∓7°)`; `transform-style:preserve-3d` with artwork at `translateZ(30px→46px on hover)` and body at `translateZ(24px)`; hover raises `z-index` above siblings, shadow `0 18px 44px rgb(12 18 24 / .14)` + **inset** cyan ring `inset 0 0 0 1px rgba(63,198,255,.55)` (inset, so the connected borders never double); a cyan **scanline** (`linear-gradient` band at 10% alpha) sweeps top→bottom over .8s on hover. Reduced-motion: no tilt, no scanline; keep the inset ring.
- **⚠ Size fix (defect in prototype v3, must be corrected in build):** cells rendered too short — "thin strips". Correct proportions: visual band **min-height 300px desktop / 200px mobile**, body padding **32px 36px 28px**, total cell height target **520–580px desktop**. Title 26px. The strip should feel like Kage's garden cards: image-dominant, roughly 55% visual / 45% text vertically. Never let a strip cell fall under 420px tall on desktop.

Click behavior: cell → that item focused (navigates to section page and opens its popup via `?focus=slug`).

---

## 8. The chamber (section pages)

### 8.1 Page frame

Full-viewport. Canvas cleared transparent (`alpha:true`, clearColor alpha 0) over the CSS radial gradient (§2.1). UI layer: toggle top-left `[ ◫ GRID | ▣ CARDS ]` (mono, glass pill, active = `rgba(63,198,255,.16)` bg + holo text; persist per-section in localStorage); survey label top-right; hint bottom-center `DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A BLOCK` (hidden in CARDS mode). **No mist title.** Loader (§9) covers entry, min 650ms, timeout 4s → CARDS mode.

### 8.2 The cluster — exact recipe (prototype-validated)

Data: items sorted **weight desc** (recency tiebreak) so the heaviest sits at index 0.

- **Placement**: phyllotaxis, golden angle 2.39996 rad; `r(0)=0`, `r(i)=2.2 + 2.05·√i`. This is the approved density — tight, towers nearly shoulder-to-shoulder.
- **Towers**: footprint `3.4 + rnd()·2.0` (seeded per slug); height `(7 + weight·4.6)·(1 − 0.028·i) + rnd()·1.5` — weight drives height, the falloff term guarantees the skyline peaks at center.
- **Per-tower parts**:
  - solid core `MeshBasicMaterial #0A1B2E` (opaque — occlusion + raycast target);
  - edge wireframe `LineBasicMaterial(holo, opacity .70, AdditiveBlending)`;
  - **interior floor lines** every 3.4 units of height (plane edges, `#1E7FAE`, opacity .35, additive) — these make towers read as lit, occupied buildings;
  - beacon cap (small box edges, `#B6ECFF`, opacity .95) pulsing `.5 + .45·|sin(t·.002 + i)|`;
  - **body glow sprite** (shared 128px radial canvas texture: white→holo→transparent), holo tint, opacity .16 idle / .34 hover-selected / .05 dimmed, scale `(fp·4.2, h·1.5)`, additive, `depthWrite:false`;
  - **beacon halo sprite**, `#9FE5FF`, opacity `.25 + .35·pulse`, scale 3.2.
- **Atmosphere** (all mandatory — this is what fixed the "depressing empty grid"): dual GridHelpers (44 divs `#11577A/#0B3A54` op .55; 11 divs `#2596C9` op .40, y+.02); **ground light pool** — the radial glow texture on a flat plane, scale 85, opacity .22, additive; **240 drifting particles** (cyan points, size .35, opacity .5, additive, cylinder r 8–56 × h 1–35, whole field rotating .00002 rad/ms); fog `#04070D` from 60 to 190 (far enough to never eat the cluster).
- **Materialize-in**: `scale.y .001→1` at +.045/frame, stagger 45ms per index.
- **Camera/orbit**: spherical orbit, damping .08 on θ/φ/radius/target; φ clamped [.55, 1.42] rad; radius clamped [16, 66]; pan disabled; auto-rotate +.0012 rad/frame after 6s idle (suspended while a selection is open); wheel zoom `Δ·.03`.
- **Hover**: raycast solids; cursor pointer; edges→1.0, glow→.34; mono chip above tower top (`TITLE · YEAR`, glass, holo border), projected each frame; hidden while a selection is open.
- **Budgets**: ≤48 towers (aggregate beyond), DPR ≤1.75, no postprocessing ever — the additive-on-gradient recipe *is* the bloom. Full `dispose()` on route leave; verify no memory growth across 10 navigations.

### 8.3 Selection → floating popup card (replaces v1's side panel)

- Anchored glass card, `min(400px, 88vw)` wide: `rgba(9,17,29,.82)`, `blur(14px)`, 1px `rgba(63,198,255,.35)` border, radius 12px, shadow `0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(63,198,255,.08)`, plus a 9px **stem line** centered below (`::after`, cyan .6) pointing at the block.
- Content: mono index `/07 · PROJECT`, display title 24px, mono meta line (`YEAR · WEIGHT n/5 · SUMMARY`), body ≤ ~60 words, tag chips (cyan-tinted), link buttons (`GITHUB ↗` etc.), close ✕. Rich text from CMS is fetched lazily on first open per item (the chamber JSON stays minimal).
- Behavior: on select, camera target eases to `(x·.6, h·.4, z·.6)` and radius tightens ×.8 (min 24); non-selected towers dim (edges .2, glow .05, pulses ×.3). The popup **tracks the tower's projected top every frame**, clamped to the viewport (x ∈ [220, w−220], y ∈ [300, h−40]); transform `translate(−50%,−100%)`, enter animation scale .92→1 + fade, 300ms. Dismiss: ✕, Esc, or clicking empty space — camera target returns to `(0,7,0)`.
- Never a full-height panel. Never obscures more than ~30% of the viewport.

### 8.4 GRID ⇄ CARDS transition

Entering CARDS: the live canvas stays mounted but gets `filter: blur(7px) brightness(.55)` (CSS, .4s) and the render loop drops to ~10fps (or pauses after the blur settles); any open popup closes. Exiting restores. The glow of the scene visibly leaking through the mosaic cells is intentional.

### 8.5 CARDS mode — the Sacred-Craft mosaic (replaces the flat list; also the universal 2D fallback)

**One connected block, full viewport width.** Not a list, not floating panels.

- Container: CSS grid, `repeat(6, 1fr)`, **gap 0**, 1px top hairline `rgba(160,210,235,.16)`; every cell carries right+bottom hairline `rgba(160,210,235,.14)`. Radius 0 everywhere.
- **Span pattern** (6-col units), assigned by algorithm, repeating row templates: `[4,2] → [2,2,2] → [3,3] → [2,4] → [2,2,2] → [3,3] → repeat`. Rows must always sum to 6 — when the item count doesn't fit the pattern's tail, the algorithm widens the final row's cells to close the row (never leave a ragged edge). `mosaicSpan` pinned values are honored first, the pattern fills around them. Row heights alternate `min-height 270px / 235px`. Fewer items = fewer rows; with ≤6 items bias spans upward (3s and 4s) so the block still commands the screen.
- **Cell anatomy**: ghost number `01` (mono, .35 white, tracking .22em) → display title `clamp(20px,1.8vw,27px)` with inline mono subtag in cyan .7 → description ≤2 lines `.6` white → meta pinned to bottom via `margin-top:auto` (`2026 · W 5/5`, the weight in cyan). Padding `30px 32px 24px`.
- **Fill**: `rgba(8,15,26,.42)` + `blur(4px)` — translucent so the chamber glows through.
- **Hover** (per-cell, block stays whole): bg → `rgba(24,46,72,.55)`; inset ring `inset 0 0 0 1px rgba(63,198,255,.55)` + inner glow `inset 0 0 44px rgba(63,198,255,.07)` (inset only — shared hairlines must never double); ghost number → holo. No translate, no scale — cells are welded in.
- Click: switch to GRID and open that item's popup (120ms delay for the mode swap). In fallback contexts (below) click opens the popup directly over the mosaic.
- Mobile (<860px): every cell spans 6 (single column), min-heights released.
- **As universal fallback**: mobile, `prefers-reduced-motion`, no-WebGL, and loader-timeout users get the mosaic as the *only* view — rendered over the static CSS chamber gradient (no canvas, no blur filter). This is also the SSR default markup. The popup works standalone there (centered, no stem, no tracking).

### 8.6 CTF pages

Same mosaic language on the chamber gradient (no 3D scene in v1 scope):

- `/ctf`: `[ SOLVED | AUTHORED ]` segmented toggle (state in `?mode=`, default solved) + header stats (solid vs outlined numerals). Below: **competition mosaic** — one cell per competition having ≥1 challenge of the active mode; cell meta row = per-category mono count chips (`WEB 3 · CRYPTO 2 · FOREN 1`), plus placement if any.
- `/ctf/[slug]`: header (name, date, organizer, team, placement) → **category mosaic** — exactly the categories with ≥1 challenge for this competition+mode; a category cell expands in place (accordion row spanning 6 cols, same glass, sliding open 300ms) revealing challenge rows: title · difficulty · points · (authored: solves count). Challenge click → popup with write-up rich text / external link / attachments.
- Empty states in-voice: `NO AUTHORED CHALLENGES LOGGED FOR THIS EVENT.`
- Derivations exactly as v1 §5 (distinct-competitions / distinct-categories queries).

---

## 9. Loader

Unchanged from v1 §8 and validated in prototype: chamber-gradient full-screen; wireframe cube of 5 SVG paths, holo stroke 1.6, `stroke-dasharray:60` draw-in loop 1.6s staggered ×.12s; caption `CONSTRUCTING GRID…` mono .22em tracking cyan .7. Min display 650ms, fade .4s, hard timeout 4s → CARDS fallback with a quiet mono notice. Static cube = monogram/favicon. Shown only for 3D boots, never for 2D pages.

---

## 10. Performance & degradation

Budgets (unchanged, CI-checked): route JS ≤180KB gz (excl. 3D chunk); Three chunk ≤200KB gz lazy; LCP ≤1.5s Fast-4G (2D content); chamber interactive ≤800ms after chunk; homepage first visit ≤1.2MB total; CLS ≤.02; Lighthouse ≥95 on 2D pages. Notes specific to v2: glow sprites/particles/floor-lines add negligible weight (one shared 128px canvas texture, ≤~3k extra vertices) — the atmosphere recipe is cheap by construction; the mosaic and card strips are pure CSS. `backdrop-filter` on many mosaic cells can be expensive on weak GPUs — if profiling shows jank, drop cell blur to 0 (keep the popup's) and raise fill alpha to .55; visual intent survives.

Degradation matrix: as v1 §11, with "LIST" replaced by "MOSAIC" everywhere. Keyboard: toggle, mosaic cells, popup focus-trap, Esc; chamber mirrored by a visually-hidden list; canvas `aria-hidden`.

---

## 11. Assets

As v1 §9 (fonts ×3 subsets; in-repo SVG monogram cube; loader; owner-provided portrait, project covers, org/competition logos; OG template on paper+grid; lucide icons ~10). Additions: per-project **wireframe SVG artworks** for homepage strip visual bands — hand-authored in-repo (2 layers: holo + muted), 3–6 needed for pinned items, simple skyline/structure motifs ~15 lines each; the shared radial glow texture is generated at runtime (canvas), not an asset. Still zero 3D model files, zero Lottie, zero sounds.

---

## 12. Build plan

**M0 — Scaffold** (unchanged). ✓ dev server, tokens, fonts, `/admin`.
**M1 — Schema & seed** (+ `mosaicSpan`, `subtag`). Seed with uneven CTF categories across both modes. ✓ CRUD + revalidation.
**M2 — Mosaic everything**: all section pages + full CTF drill-down in mosaic form over the static gradient; popup (standalone mode); homepage in white with card strips (**at §7.5 corrected sizes**) minus the canvas; About; footer; OG. *Site is complete and shippable here.* ✓ budgets, keyboard, CTF filtering both modes, span algorithm closes every row.
**M3 — Homepage journey**: light world + scroll choreography + loader; includes the promised background design pass. ✓ 60fps desktop, clean mobile fallback.
**M4 — Chamber**: engine per §8.2–8.4 (cluster recipe, popup tracking, GRID⇄CARDS blur transition), wired to projects → experience → orgs → awards. ✓ 60fps @ 40 towers on integrated GPU, popup clamps correctly at all orbit angles, dispose verified.
**M5 — Polish/stretch**: CTF chamber (blocks = competitions → navigate), micro-interactions, Lighthouse ≥95, Docker deploy + nightly SQLite backup.

---

## 13. Notes for the agent

1. MengTo's kage/towers are **technique references only — no license for code or artwork reuse**. Reimplement everything; the prototypes in this repo are original and are your visual target.
2. The connected-block principle is non-negotiable: if you find yourself adding `gap`, `border-radius`, or per-cell `transform: translate` to mosaic/strip cells, stop — it's wrong.
3. All randomness seeded from slugs (mulberry32); layouts identical across reloads.
4. Hover glow on connected cells is always **inset** (ring + inner glow) so shared hairlines never double.
5. Popup rich text loads lazily per item; chamber JSON stays `{id, slug, label, sublabel, weight, year}`.
6. OrbitControls not needed — the chamber uses the custom damped spherical orbit from the prototype (~30 lines); port it as-is.
7. Fix the strip-height defect (§7.5) — do not copy the v3 prototype's card heights.
8. When in doubt between fancy and fast: fast. The mosaic is the product; the chamber is the fireworks.
