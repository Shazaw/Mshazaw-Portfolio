# HOLOGRID

Portfolio site for **M. Ahsan Zaki Wiryawan** — a white, minimal, engineering-flavoured
survey document. Opening any section steps into a **3D neural map**: the page inverts to
deep blue-black and each record becomes a glowing star connected by curved electric pathways.
Older records sit near the core; newer records extend outward. A toggle switches to **CARDS** — one connected slab of translucent
cells. Everything is content-managed through Payload.

Built to `docs/portfolio-spec-v2.md`; `docs/portfolio-prototype-v3.html` is the visual
reference the chamber was ported from.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| CMS | Payload 3 embedded in the same app, admin at `/admin` |
| Database | SQLite via `@payloadcms/db-sqlite` (migration path → Postgres) |
| 3D | Vanilla Three.js, named imports, loaded via dynamic `import()` only when a scene will render |
| Styling | Tailwind v4 for utilities + CSS Modules for the bespoke surfaces; all tokens in `src/styles/tokens.css` |
| Scroll | Lenis + IntersectionObserver (one scroll system, never two) |
| Deploy | Docker — Payload needs a persistent Node server |

Every public page is statically generated. Content changes fan out through Payload
`afterChange` / `afterDelete` hooks calling `revalidatePath`, with an hourly ISR floor as a
safety net for out-of-band changes (a restored backup, a seed run).

---

## Quick start

```bash
npm install
cp .env.example .env          # then set PAYLOAD_SECRET (openssl rand -hex 32)
npm run seed                  # placeholder content + the first admin user
npm run dev                   # http://localhost:3000, admin at /admin
```

`npm run seed` is idempotent — it matches documents by slug and updates in place.
`npm run seed -- --fresh` wipes the survey collections first.

> **Projects, experience, organizations and awards are real** — projects from
> github.com/Shazaw with screenshots captured from the running builds (see `seed-assets/`),
> the rest transcribed from the owner's LinkedIn. **The CTF competitions and challenges are
> still placeholder** and should be rewritten at `/admin` before the site is published.

### Environment

| Variable | Purpose |
|---|---|
| `PAYLOAD_SECRET` | Signs Payload auth tokens. Required. |
| `DATABASE_URI` | libsql URL, e.g. `file:./data/holo-grid.db`. |
| `NEXT_PUBLIC_SERVER_URL` | Public origin — canonical URLs, sitemap, OG images. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Only used to create the first admin user. |

---

## Card images

`seed-assets/` holds the images the seed uploads into Payload media on first run. They include
project screenshots, repository views, event listings, certificates and presentation covers:

| Source | Projects |
|---|---|
| Screenshots the repo already published | NetGuard, AutoSIEM, BHOB |
| Cloned and run locally, then captured | AeroRoute (Vite dev server), RedOps Collab (prototype, driven through its demo login), CloudLibrary (static front end — the droplet is offline) |
| Live site | BEM UGM, 180DC UGM |
| Owner-supplied images | Repository screenshots, CrediWise's Garuda Hacks presentation, the DCSE certificate, CTF events, and organization profiles |

CrediWise and its Garuda Hacks award share the presentation cover. Projects, experience,
organizations and awards reuse existing media when they share an image. Records without an
image, including CTF Library, fall back to wireframe artwork.

To add or replace one, use **Card image** on the record in `/admin`. The optional upload appears
on the homepage card and in the expanded record.

## Content model

Four **survey collections** share one shape and one set of controls:
`projects`, `experiences`, `organizations`, `awards`.

| Field | What it drives |
|---|---|
| `weight` (1–5) | Star size in the neural map, card ordering, and which items surface first. |
| Date / start date, falling back to `year` | Radial chronology in the neural map: oldest at the core, newest at the edges. |
| `mosaicSpan` | `auto` lets the pattern algorithm decide; `2` / `3` / `4` pins a cell width for flagship work. |
| `featured` + `featuredOrder` | Membership and order in that section's homepage card strip. |
| `subtag` | The short mono tag beside the title. Defaults to the first tag. |
| `summary` | The one line shown in mosaic cells and strip bodies. |
| `description` | Rich text, fetched lazily when a popup opens — it never ships with the page. |
| `published` | Unpublished documents are invisible to the public site. |
| `stripArtwork` *(projects)* | Which wireframe motif draws when there is no screenshot. `auto` picks one from the slug. |
| `screenshot` *(projects)* / `logo` *(experience, organizations)* / `media` *(awards)* | **Optional** upload, labelled **Card image** in the admin. Shown on the homepage card and in the expanded mosaic cell; otherwise generated wireframe artwork is used. |
| `repoUrl` / `liveUrl` *(projects)* | Drive the GITHUB and LIVE buttons. Anything else goes in `links`. |
| `role` *(projects)* | Your part in it, when it needs saying — e.g. Security engineer, IT manager. |

**CTF** is two collections. `ctf-competitions` holds the events; `ctf-challenges` attach to
them and carry a `mode` of `solved` or `authored`. That single field drives the whole CTF
area: `/ctf` lists only competitions with at least one challenge in the active mode, and
`/ctf/[slug]` shows only the categories that are non-empty for that competition **and** mode.

`profile` is a global: identity, hero lines, about copy, focus areas, skills, education,
socials, CV link, and SEO defaults.

### Blog

`posts` is the **Blog posts** collection under **Writing** in `/admin`. Each article has
an excerpt, category, event, tags, optional cover, and sections composed of rich text,
syntax-highlighted source excerpts and captioned images. Section headings generate the
table of contents, and reading time is recalculated when the article is saved.

New posts start unpublished. Publishing updates `/blog`, the article, the homepage preview
and the sitemap. Renaming a slug also invalidates the old article URL.

The original JOINTS CTF setter notes live in `src/seed/posts.ts`. Run `npm run seed:blog`
to upload their screenshots and populate those two articles in the local CMS. The full
seed includes them as well. The blog uses the existing paper palette, with a dedicated
reading layout and server-rendered syntax highlighting.

The homepage previews the two latest posts above Toolkit, under “Behind the challenge”.
Homepage previews use smaller cover images and a narrower card group than the blog listing.

---

## Parked sections

The CTF area is finished but switched off while the rest of the site is built, because its
content is still placeholder. Its routes live in `src/parked/ctf-routes`; the schema, views,
queries and seed all stay in the tree untouched, so any data already entered survives and
`/admin` still edits it. `CTF_ENABLED` in `src/lib/features.ts` controls the navbar entry,
the homepage chapter and the sitemap. `src/parked/README.md` has the restore steps.

## The homepage journey

One procedural Three.js scene, three acts, driven entirely by scroll:

1. **The door.** A circuit-board portal fills the hero — instrument rings around a blank
   disc, routed traces running out both sides. The rings' rotation is proportional to
   scroll (clockwise down, counter-clockwise back up). At the end of the hero the wall
   splits down the middle and the camera passes through. The split uses per-half clipping
   planes: each half holds the *full* wall geometry cut at the moving split line, so the
   seam is invisible while closed and the rings keep spinning across the cut while open.
2. **The network.** Through the opening the camera veers right into a greyscale plexus
   constellation — ink nodes in three print sizes, hairline links, dense to the right,
   soft out-of-focus motes behind.
3. **The survey.** Further down, the wireframe blueprint city fades in and the camera
   settles into its slow orbit for the remaining chapters.

The camera runs on keyframed stations interpolated over the damped scroll position; acts
fade in scroll bands and toggle `visible` so only the current act renders; fog tightens
for the white acts and opens up with the city.

## The neural map

`src/lib/neuralMap.ts` builds a deterministic, chronological 3D layout and a connected
neighbourhood graph. It preserves original record indices so labels, panel buttons and
raycasting all open the same record. The map renders up to 48 records; cards show the rest.

Soft additive sprites make borderless stars with white cores, cyan halos and diffraction
rays. Curved filaments carry shader-driven signals, with particle trails following those
same curves and a brief glow at the receiving node. A distant, faint web gives the map depth.

The map is pushed into the right of the frame by a frustum offset
(`camera.setViewOffset`) rather than by moving the scene — the orbit maths stays
centred on the map and `project()` still returns correct screen positions, so the
hover chip and the popup keep tracking.

The **record panel** highlights five records and explains the radial chronology. Hovering
a row lights its star; selecting it frames the star and opens its card. Projected labels
also act as keyboard-accessible record buttons. Popups stay clear of the panel and navbar.
Drag to orbit in any direction; scroll, pinch or use the zoom buttons to move closer.
Reset restores the opening view. Background motion pauses while the tab is hidden.

Below 1180px the panel would crowd the map, so it hides, the map recentres, and
the visually-hidden list takes over again.

## The two detail surfaces

The same record answers a different question depending on where you open it, so it is
deliberately shown two different ways:

| | NEURAL MAP | CARDS (mosaic) |
|---|---|---|
| Form | Glass popup anchored to the star | Cell expanded inline at full block width |
| Content | Summary, tech stack, links | Screenshot, full write-up, tech stack, links |
| Fetches rich text | No | Yes, once per record |
| Dismiss | ✕, Escape, or click empty space | ✕ or Escape |

The chamber is for orbiting and sampling; the mosaic is for reading. Loading the long write-up
into a popup that floats over a 3D scene would be the wrong shape for both.

## Architecture notes

```
src/
  app/(payload)/         admin mount + REST/GraphQL
  app/(site)/            <html>, fonts, metadata
    (light)/             homepage, /about — blueprint grid, paper navbar, footer
    (dark)/              /projects /experience /organizations /awards /ctf — chamber palette
    detail/[c]/[slug]/   lazily fetched popup bodies (rich text → HTML)
  collections/           Payload schema
  components/
    chamber/             SectionView orchestrator + the Three.js engine
    mosaic/ strips/      the two connected-block surfaces
    cards/               the one detail popup
    journey/ ctf/        homepage scene + CTF views
  lib/                   data access, mosaic algorithm, formatting, hooks
  seed/                  placeholder dataset
```

**Route groups carry the theme.** `(light)` and `(dark)` each render their own navbar, so the
server markup is already correct — there is no white flash on the way into a chamber.

**The mosaic is the product; the chamber is the fireworks.** Section pages server-render the
mosaic and hydrate the chamber over it. Mobile, `prefers-reduced-motion`, no-WebGL and
loader-timeout visitors keep the mosaic as their only view, over the static CSS gradient.

**Nothing reads `searchParams`,** so every page stays statically generated. `?focus=<slug>`
and `?mode=` are read and written on the client via `history.replaceState`.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run seed [-- --fresh]` | Placeholder content, idempotent |
| `npm run seed:blog` | Seed the two JOINTS CTF author posts and their screenshots |
| `npm run migrate` | Apply migrations (required in production — schema push is dev-only) |
| `npm run migrate:create <name>` | Generate a migration after a schema change |
| `npm run generate:types` | Regenerate `src/payload-types.ts` and the admin import map |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Mosaic layout, podium derivation, and neural-map invariants |
| `npm run test:e2e` | Browser behaviour suite (needs a server on `$BASE`) |
| `npm run budget` | Measures the spec §10 performance budgets against a running build |

### After a schema change

```bash
npm run generate:types
npm run migrate:create <describe-the-change>
```

Commit the generated migration — production applies it on container start.

---

## Testing

`npm run test:unit` proves the pure logic with real invariants:

- **Mosaic layout** — 4,000+ randomised cases assert every row sums to exactly 6 (a short
  row gives the connected block a ragged edge, the one thing this layout cannot have) and
  that editor pins survive at realistic density.
- **Placement derivation** — a semifinal is not a final; 4th place is not a podium.
- **Neural map** — chronological 3D distances, non-overlapping star hit areas, graph
  connectivity, deterministic positions, stable source indices, valid links and the node
  budget, including empty/single-record maps and missing dates.

`npm run test:e2e` drives a real browser over the built site: mode toggle and its
persistence, orbit and zoom controls, `?focus=` deep links, popup clamping, homepage spacing
and blog placement, the reduced-motion and mobile fallbacks, markup semantics, and
`dispose()` across ten chamber navigations.

```bash
npm run build && npm start &
BASE=http://localhost:3000 npm run test:e2e
BASE=http://localhost:3000 npm run budget
```

Current measurements (transferred, compressed):

| Route | Route JS | 3D chunk | Page total |
|---|---|---|---|
| `/` | 178.8 KB | 132.3 KB | 458.7 KB |
| `/projects` | 176.1 KB | 132.3 KB | 423.8 KB |

Budgets: route JS ≤ 180 KB, 3D chunk ≤ 200 KB, first visit ≤ 1.2 MB.

---

## Deployment

Payload needs a persistent Node server, so this deploys as a long-running container.

```bash
export PAYLOAD_SECRET=$(openssl rand -hex 32)
export NEXT_PUBLIC_SERVER_URL=https://your-domain
docker compose up -d --build
```

The image applies migrations on start, so a fresh volume gets its schema on first boot and
an existing one is brought up to date. Two volumes hold the state that matters:

- `holo-data` → `/app/data` (SQLite)
- `holo-media` → `/app/public/media` (uploads)

The `backup` service takes a nightly `sqlite3 .backup` (safe on a live database — a plain
file copy is not), gzips it, and prunes anything older than `RETAIN_DAYS`.

**Restore:**

```bash
docker compose stop holo-grid
docker run --rm -v holo-backups:/b -v holo-data:/d alpine:3.20 \
  sh -c 'gunzip -c /b/holo-grid-<stamp>.db.gz > /d/holo-grid.db'
docker compose start holo-grid
```

After restoring — or after any change that bypasses the admin — pages refresh on the hourly
ISR floor. To see it immediately, save any document in `/admin`, which fires the
revalidation hooks.

`/healthz` reports liveness and database reachability, and backs the container healthcheck.

---

## Design system

Tokens live in `src/styles/tokens.css`; nothing hard-codes a colour.

- One accent: `--holo` `#3FC6FF`, on both light and dark surfaces.
- Type: Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (utility, always
  uppercase, wide tracking). Self-hosted, latin subset, display face preloaded.
- Motion: 200–400 ms on `cubic-bezier(.22,1,.36,1)`, one orchestrated moment per surface,
  and `prefers-reduced-motion` kills all choreography.

### Two card languages

They are not the same thing, and the difference is deliberate — both follow
[Kage](https://mengto.github.io/kage/).

**Homepage — "02 Still Gardens".** Separate cards with real gaps and a soft radius. Each
section arranges its three differently, set by `stripLayout` in the section registry, so
scrolling the page does not read as the same block four times: a wide lead beside a narrow
stack, the same mirrored, three equal columns, and a wide lead above a pair. Motifs are
chosen per section as well as per card, so no two sections land on the same trio. Artwork fills each card with the title laid over its bottom edge
and the mono meta sitting outside beneath it. Card groups cap at 1120px, with generous
36–72px gutters and compact landscape media. Hover tilts the media only, so the small type below stays crisp.

**Sections and CTF — "03 Sacred Craft".** One connected block. Cells share 1px hairlines with
**zero gaps and zero border-radius**, and hover states are always **inset** — an inset ring
plus an inner glow — so shared hairlines never double. Adding a `gap`, a `border-radius`, or a
per-cell `transform: translate` here is wrong.

Opening a record in the mosaic expands it **where it sits**: the cells before it and the cells
after it are laid out as two independent runs, so each run still closes every row to exactly
six columns and the slab stays welded. The whole cell is the hit target — the trigger lives in
the heading and stretches over the slab, which means nothing between it and `.cell` may be
positioned or the hit area collapses back to that element's box.

**Both blocks sit in the page shell** — inset ~3.3% from each viewport edge and capped at
1760px. The section mosaic fills that shell; homepage groups are deliberately narrower,
leaving open space around their smaller images. The mirrored group aligns to the right.

```css
--edge: clamp(22px, 3.3vw, 64px);        /* viewport inset */
--shell: min(1760px, 100% - 2 * var(--edge));
```

---

## Deliberate deviations from spec v2.0

The neural map replaces the original tower scene. Camera distance is derived from its
actual extent and the available viewport, with full spherical orbit and a proportional
zoom range. Date controls radial placement; weight controls star size. The original city
remains part of the separate, scroll-driven homepage background.

**Popup viewport clamp** (§8.3 gives `x ∈ [220, w−220]`, `y ∈ [300, h−40]`). Those assume a
   ~400×300 card; a long record grows taller and the fixed floor pushed its top off-screen. The
   clamp is now driven by the card's measured box plus navbar clearance, which is what the
   fixed numbers were approximating.

**Card layout (§7).** The spec applies the connected-block rule to the homepage strips as well:
full viewport width, uniform columns, zero gaps, zero radius. Checked against the Kage
reference the spec cites, that is the Sacred Craft pattern, not Still Gardens — Still Gardens
is an inset lead-plus-stack of separate cards with gaps and a radius. The homepage now follows
the reference. The mosaic keeps the connected-block rule, but sits in the page shell rather
than running edge to edge, which is also how Sacred Craft sits on the page.

Two additions: `mosaicSpan` exists on all four survey collections rather than `projects` alone
(the mosaic renders every section), and particle points carry the shared radial texture —
untextured points draw as hard squares, and one drifting near the camera became a solid cyan
block.
