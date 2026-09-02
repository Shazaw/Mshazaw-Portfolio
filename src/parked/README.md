# Parked

Code that is finished and working but deliberately not part of the built site,
kept here rather than deleted so it can be switched back on without rewriting it.

## CTF

The CTF area is parked while the rest of the site is finished. Its content is
still placeholder, and the real competition data has not landed yet.

**What is parked:** the routes only. `ctf-routes/` holds `/ctf` and
`/ctf/[slug]` exactly as they were. Next only builds routes under `src/app`, so
moving the folder here takes them off the site.

**What is still live and untouched:**

- `src/components/ctf/` — the index and competition views
- `src/collections/CtfCompetitions.ts`, `src/collections/CtfChallenges.ts` — the
  schema, so any data already entered survives and `/admin` still edits it
- `src/lib/ctf.ts` — the shared taxonomy
- `src/seed/ctf.ts` — the seed dataset
- `src/lib/data.ts` — the CTF queries

### Restoring it

1. `mv src/parked/ctf-routes "src/app/(site)/(dark)/ctf"`
2. Set `CTF_ENABLED = true` in `src/lib/features.ts`. That brings back the
   navbar link, the homepage chapter and the sitemap entries.
3. Renumber the chapters: CTF takes `05`, awards goes back to `06` in
   `src/lib/sections.ts`, and the toolkit becomes `07` on the homepage.
