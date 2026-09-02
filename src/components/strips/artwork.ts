import { seededRandom } from '@/lib/random'

/**
 * Wireframe artwork for the homepage strip visual bands (spec §11).
 *
 * Two layers by construction: `main` in --holo at .8, `muted` in #9FB8C6 at .5.
 * Motifs are parametric and seeded from the item slug, so two projects sharing
 * a motif never draw the same structure and every reload draws it identically.
 */

/**
 * The cell's visual band is roughly 1.5:1, and the SVG is drawn with
 * `xMidYMax slice` so it covers rather than letterboxes. That crops the top.
 * The viewBox therefore starts at SKY, not 0, and every motif keeps its
 * geometry inside [SKY, GROUND] so nothing is ever cut off.
 */
const GROUND = 300
const SKY = 78

export const ART_VIEWBOX = { x: 0, y: SKY, w: 340, h: GROUND - SKY } as const

/** Tallest a structure may rise: the top of the safe band, plus a little air. */
const CEILING = SKY + 8

export type ArtworkLayers = { main: string[]; muted: string[] }

const round = (n: number) => Math.round(n * 10) / 10

/** A pitched-roof block with a ridge line and a couple of floor plates. */
const building = (x: number, w: number, h: number, roof: number, floors: number): string[] => {
  const maxBody = GROUND - CEILING - roof
  const body = Math.min(h, maxBody)
  const top = GROUND - body
  const apexX = x + w / 2
  const apexY = top - roof
  const paths = [
    `M${round(x)} ${GROUND} L${round(x)} ${round(top)} L${round(apexX)} ${round(apexY)} L${round(x + w)} ${round(top)} L${round(x + w)} ${GROUND}`,
    `M${round(apexX)} ${round(apexY)} L${round(apexX)} ${round(GROUND - body * 0.18)}`,
  ]
  for (let i = 1; i <= floors; i++) {
    const y = round(top + (body / (floors + 1)) * i)
    paths.push(`M${round(x)} ${y} L${round(x + w)} ${y}`)
  }
  return paths
}

const MOTIFS: Record<string, (rnd: () => number) => ArtworkLayers> = {
  /* A cluster of pitched blocks — the default survey motif. */
  skyline: (rnd) => {
    const main: string[] = []
    let x = 24 + rnd() * 18
    let index = 0
    while (x < 300 && index < 5) {
      const w = 52 + rnd() * 46
      const h = 70 + rnd() * 110
      main.push(...building(x, Math.min(w, 306 - x), h, 16 + rnd() * 26, 1 + Math.floor(rnd() * 3)))
      x += w + 18 + rnd() * 26
      index += 1
    }
    return {
      main,
      muted: [
        `M0 ${GROUND - 34} L340 ${GROUND - 34}`,
        `M0 ${GROUND - 62} L340 ${GROUND - 62}`,
        `M18 ${GROUND} L18 ${GROUND - 62}`,
        `M312 ${GROUND} L312 ${GROUND - 86} L332 ${GROUND - 100}`,
      ],
    }
  },

  /* One dominant shaft with a mast — flagship, single-idea projects. */
  tower: (rnd) => {
    const w = 82 + rnd() * 26
    const x = 170 - w / 2 + (rnd() - 0.5) * 22
    const h = 132 + rnd() * 30
    const top = GROUND - h
    const main = [
      `M${round(x)} ${GROUND} L${round(x)} ${round(top)} L${round(x + w)} ${round(top)} L${round(x + w)} ${GROUND}`,
      `M${round(x + w / 2)} ${round(top)} L${round(x + w / 2)} ${round(top - 34)}`,
      `M${round(x + w / 2 - 13)} ${round(top - 34)} L${round(x + w / 2 + 13)} ${round(top - 34)}`,
    ]
    const decks = 5 + Math.floor(rnd() * 3)
    for (let i = 1; i <= decks; i++) {
      const y = round(top + (h / (decks + 1)) * i)
      main.push(`M${round(x - 9)} ${y} L${round(x + w + 9)} ${y}`)
    }
    return {
      main,
      muted: [
        `M0 ${GROUND - 28} L340 ${GROUND - 28}`,
        `M40 ${GROUND} L40 ${GROUND - 96}`,
        `M300 ${GROUND} L300 ${GROUND - 112} L318 ${GROUND - 124}`,
        `M0 ${GROUND - 150} L64 ${GROUND - 150}`,
      ],
    }
  },

  /* A spanning deck on pylons — platforms, pipelines, anything connective. */
  bridge: (rnd) => {
    const deck = GROUND - 92 - rnd() * 22
    const pylonA = 84 + rnd() * 16
    const pylonB = 244 + rnd() * 16
    const mastTop = Math.max(CEILING, deck - 58 - rnd() * 16)
    return {
      main: [
        `M0 ${round(deck)} L340 ${round(deck)}`,
        `M0 ${round(deck + 14)} L340 ${round(deck + 14)}`,
        `M${round(pylonA)} ${GROUND} L${round(pylonA)} ${round(mastTop)}`,
        `M${round(pylonB)} ${GROUND} L${round(pylonB)} ${round(mastTop)}`,
        `M${round(pylonA)} ${round(mastTop)} L0 ${round(deck)}`,
        `M${round(pylonA)} ${round(mastTop)} L${round((pylonA + pylonB) / 2)} ${round(deck)}`,
        `M${round(pylonB)} ${round(mastTop)} L${round((pylonA + pylonB) / 2)} ${round(deck)}`,
        `M${round(pylonB)} ${round(mastTop)} L340 ${round(deck)}`,
      ],
      muted: [
        `M0 ${GROUND - 26} L340 ${GROUND - 26}`,
        `M${round(pylonA)} ${GROUND - 26} L${round(pylonA)} ${GROUND}`,
        `M${round(pylonB)} ${GROUND - 26} L${round(pylonB)} ${GROUND}`,
        `M20 ${GROUND} L20 ${GROUND - 58}`,
      ],
    }
  },

  /* Cross-braced truss — systems, tooling, infrastructure. */
  lattice: (rnd) => {
    const cols = 4
    const rows = 3
    const x0 = 34
    const x1 = 306
    const y0 = GROUND - 168 - rnd() * 16
    const y1 = GROUND - 26
    const colW = (x1 - x0) / cols
    const rowH = (y1 - y0) / rows

    const main: string[] = []
    for (let r = 0; r <= rows; r++) {
      const y = round(y0 + rowH * r)
      main.push(`M${x0} ${y} L${x1} ${y}`)
    }
    for (let c = 0; c <= cols; c++) {
      const x = round(x0 + colW * c)
      main.push(`M${x} ${round(y0)} L${x} ${round(y1)}`)
    }
    // One diagonal per panel, alternating direction — a braced frame reads as
    // structure; a single full-height zigzag reads as a broken chart.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xa = round(x0 + colW * c)
        const xb = round(x0 + colW * (c + 1))
        const ya = round(y0 + rowH * r)
        const yb = round(y0 + rowH * (r + 1))
        main.push((r + c) % 2 === 0 ? `M${xa} ${yb} L${xb} ${ya}` : `M${xa} ${ya} L${xb} ${yb}`)
      }
    }
    // Feet.
    main.push(`M${x0} ${round(y1)} L${round(x0 - 12)} ${GROUND}`)
    main.push(`M${x1} ${round(y1)} L${round(x1 + 12)} ${GROUND}`)

    return {
      main,
      muted: [
        `M0 ${GROUND - 26} L340 ${GROUND - 26}`,
        `M0 ${GROUND - 8} L340 ${GROUND - 8}`,
        `M22 ${GROUND} L22 ${GROUND - 64} L40 ${GROUND - 74}`,
        `M316 ${GROUND} L316 ${GROUND - 48}`,
      ],
    }
  },

  /* Dish and sweep arcs — research, detection, anything that listens. */
  radar: (rnd) => {
    const cx = 170 + (rnd() - 0.5) * 26
    const cy = GROUND - 78
    const r = 54 + rnd() * 10
    const arc = (radius: number) =>
      `M${round(cx - radius)} ${round(cy)} A${round(radius)} ${round(radius)} 0 0 1 ${round(cx + radius)} ${round(cy)}`
    return {
      main: [
        arc(r),
        arc(r * 0.66),
        arc(r * 0.33),
        `M${round(cx - r)} ${round(cy)} L${round(cx + r)} ${round(cy)}`,
        `M${round(cx)} ${round(cy)} L${round(cx)} ${GROUND - 18}`,
        `M${round(cx - 26)} ${GROUND - 18} L${round(cx + 26)} ${GROUND - 18}`,
        `M${round(cx - 26)} ${GROUND - 18} L${round(cx - 40)} ${GROUND}`,
        `M${round(cx + 26)} ${GROUND - 18} L${round(cx + 40)} ${GROUND}`,
        `M${round(cx)} ${round(cy)} L${round(cx + r * 0.72)} ${round(cy - r * 0.72)}`,
      ],
      muted: [
        `M0 ${GROUND - 18} L340 ${GROUND - 18}`,
        `M28 ${GROUND} L28 ${GROUND - 66} L46 ${GROUND - 76}`,
        `M310 ${GROUND} L310 ${GROUND - 52}`,
      ],
    }
  },

  /* An isometric strongbox — crypto, storage, anything sealed. */
  vault: (rnd) => {
    const w = 150 + rnd() * 16
    const h = 118 + rnd() * 12
    const depth = 34
    const x = 170 - w / 2 - depth / 2
    const yBottom = GROUND - 34
    const yTop = yBottom - h
    const cx = x + w / 2
    const cy = yTop + h / 2

    const main = [
      // Front face.
      `M${round(x)} ${round(yTop)} L${round(x + w)} ${round(yTop)} L${round(x + w)} ${round(yBottom)} L${round(x)} ${round(yBottom)} Z`,
      // Top and right faces, offset to read as a solid volume.
      `M${round(x)} ${round(yTop)} L${round(x + depth)} ${round(yTop - depth * 0.55)} L${round(x + w + depth)} ${round(yTop - depth * 0.55)} L${round(x + w)} ${round(yTop)}`,
      `M${round(x + w)} ${round(yBottom)} L${round(x + w + depth)} ${round(yBottom - depth * 0.55)} L${round(x + w + depth)} ${round(yTop - depth * 0.55)}`,
      // Door seam and dial.
      `M${round(x + 14)} ${round(yTop + 12)} L${round(x + w - 14)} ${round(yTop + 12)} L${round(x + w - 14)} ${round(yBottom - 12)} L${round(x + 14)} ${round(yBottom - 12)} Z`,
      `M${round(cx - 26)} ${round(cy)} A26 26 0 1 1 ${round(cx + 26)} ${round(cy)} A26 26 0 1 1 ${round(cx - 26)} ${round(cy)}`,
      `M${round(cx - 13)} ${round(cy)} A13 13 0 1 1 ${round(cx + 13)} ${round(cy)} A13 13 0 1 1 ${round(cx - 13)} ${round(cy)}`,
      `M${round(cx)} ${round(cy - 26)} L${round(cx)} ${round(cy - 38)}`,
      `M${round(cx)} ${round(cy)} L${round(cx + 18)} ${round(cy - 18)}`,
      // Hinges.
      `M${round(x)} ${round(yTop + 26)} L${round(x - 9)} ${round(yTop + 26)}`,
      `M${round(x)} ${round(yBottom - 26)} L${round(x - 9)} ${round(yBottom - 26)}`,
    ]

    return {
      main,
      muted: [
        `M0 ${round(yBottom)} L340 ${round(yBottom)}`,
        `M0 ${GROUND - 14} L340 ${GROUND - 14}`,
        `M${round(x)} ${round(yBottom)} L${round(x)} ${GROUND}`,
        `M${round(x + w + depth)} ${round(yBottom - depth * 0.55)} L${round(x + w + depth)} ${GROUND - 14}`,
      ],
    }
  },
}

export const MOTIF_KEYS = Object.keys(MOTIFS)

/** The motif a key resolves to, without building the geometry. */
export const motifFor = (key: string): string => {
  if (!key.startsWith('auto:')) return key
  const slug = key.slice(5)
  const rnd = seededRandom(slug || 'holo-grid')
  return MOTIF_KEYS[Math.floor(rnd() * MOTIF_KEYS.length) % MOTIF_KEYS.length]
}

/**
 * Picks motifs for a set of cards shown side by side, so no two repeat.
 *
 * Each card's motif is seeded from its own slug, which is stable but says
 * nothing about its neighbours — three cards in a strip could all land on the
 * same one, and a row of identical drawings is tiring to look at. Collisions
 * step to the next unused motif, deterministically and in order.
 */
export const distinctMotifs = (keys: string[], seed?: string): string[] => {
  const used = new Set<string>()
  // Rotating the catalogue by the section keeps two sections from landing on
  // the same trio, which would undo the point of varying them at all.
  const shift = seed ? Math.floor(seededRandom(seed)() * MOTIF_KEYS.length) : 0

  return keys.map((key) => {
    const base = MOTIF_KEYS.indexOf(motifFor(key))
    const start = (base + shift + MOTIF_KEYS.length) % MOTIF_KEYS.length
    for (let step = 0; step < MOTIF_KEYS.length; step++) {
      const candidate = MOTIF_KEYS[(start + step) % MOTIF_KEYS.length]
      if (!used.has(candidate)) {
        used.add(candidate)
        return candidate
      }
    }
    return MOTIF_KEYS[start]
  })
}

/**
 * `key` is either an explicit motif name or `auto:<slug>`, in which case the
 * motif itself is chosen deterministically from the slug. Pass `motif` to
 * override that choice while keeping the slug as the geometry seed.
 */
export const buildArtwork = (key: string, motif?: string): ArtworkLayers => {
  const auto = key.startsWith('auto:')
  const seedSource = auto ? key.slice(5) : key
  const chosen = motif ?? motifFor(key)
  const build = MOTIFS[chosen] ?? MOTIFS.skyline
  // Re-seed so the chosen motif always starts from the same stream position.
  return build(seededRandom(`${seedSource}:${chosen}`))
}
