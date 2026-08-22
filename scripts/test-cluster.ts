/**
 * Cluster geometry invariant: no two towers may overlap on the floor plan.
 *
 * The chamber places towers by phyllotaxis, so spacing and footprint are set
 * independently and it is easy to widen one without the other and end up with
 * buildings growing through each other. This checks the two agree, using the
 * same seeded values the engine uses.
 */
import { hashSeed, mulberry32 } from '../src/lib/random'

const GOLDEN = 2.39996
const RING_BASE = 3.0
const RING_COEFFICIENT = 5.6

const footprintOf = (weight: number, slug: string) =>
  3.5 + weight * 0.5 + mulberry32(hashSeed(slug))() * 0.6

const place = (weights: number[], slugs: string[]) =>
  weights.map((weight, i) => {
    const r = i === 0 ? 0 : RING_BASE + RING_COEFFICIENT * Math.sqrt(i)
    return {
      x: Math.cos(i * GOLDEN) * r,
      z: Math.sin(i * GOLDEN) * r,
      footprint: footprintOf(weight, slugs[i]),
    }
  })

let failures = 0
let worst = Infinity

// Worst case for collisions: every record at maximum weight, so every footprint
// is at its widest.
for (const count of [4, 8, 14, 24, 40, 48]) {
  const weights = Array.from({ length: count }, () => 5)
  const slugs = Array.from({ length: count }, (_, i) => `record-${i}`)
  const towers = place(weights, slugs)

  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const distance = Math.hypot(towers[i].x - towers[j].x, towers[i].z - towers[j].z)
      const gap = distance - (towers[i].footprint + towers[j].footprint) / 2
      worst = Math.min(worst, gap)
      if (gap < 0) {
        console.error(`FAIL n=${count}: towers ${i} and ${j} overlap by ${(-gap).toFixed(2)}`)
        failures++
      }
    }
  }
}

console.log(`cluster spacing: closest gap ${worst.toFixed(2)} units${failures === 0 ? ' ✓' : ''}`)
if (worst < 0.75) {
  console.error('FAIL: towers are touching — widen RING_COEFFICIENT or narrow the footprint')
  failures++
}
process.exit(failures === 0 ? 0 : 1)
