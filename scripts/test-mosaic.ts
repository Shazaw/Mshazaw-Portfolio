import { buildMosaicLayout } from '../src/lib/mosaic'
import type { MosaicSpan } from '../src/lib/types'

const OPTIONS: MosaicSpan[] = ['auto', 'auto', 'auto', 'auto', '2', '3', '4']
let failures = 0

const check = (spans: MosaicSpan[], label: string) => {
  const layout = buildMosaicLayout(spans)
  if (layout.length !== spans.length) {
    console.error(`FAIL ${label}: placed ${layout.length}/${spans.length}`)
    failures++
    return
  }
  const rows = new Map<number, number>()
  for (const p of layout) {
    if (!p) { console.error(`FAIL ${label}: hole in placements`); failures++; return }
    if (p.span < 1 || p.span > 6) { console.error(`FAIL ${label}: span ${p.span}`); failures++; return }
    rows.set(p.row, (rows.get(p.row) ?? 0) + p.span)
  }
  for (const [row, sum] of rows) {
    if (sum !== 6) {
      console.error(`FAIL ${label}: row ${row} sums to ${sum}`)
      failures++
      return
    }
  }
}

for (let n = 1; n <= 60; n++) check(Array(n).fill('auto') as MosaicSpan[], `all-auto n=${n}`)

let seed = 12345
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
for (let trial = 0; trial < 4000; trial++) {
  const n = 1 + Math.floor(rnd() * 40)
  const spans = Array.from({ length: n }, () => OPTIONS[Math.floor(rnd() * OPTIONS.length)])
  check(spans, `trial ${trial} n=${n} [${spans.join(',')}]`)
}

// Pins must survive the layout pass wherever geometry allows.
// A row of cells >= 2 summing to 6 is only ever [6], [2,4], [3,3], [4,2] or
// [2,2,2] — so saturating a section with pins forces some of them to yield
// (rule 1 beats rule 2). Measured at both densities to make that explicit.
const pinRate = (pinChance: number, trials: number) => {
  let honoured = 0
  let total = 0
  for (let trial = 0; trial < trials; trial++) {
    const n = 3 + Math.floor(rnd() * 30)
    const spans = Array.from({ length: n }, () =>
      rnd() < pinChance ? (['2', '3', '4'] as MosaicSpan[])[Math.floor(rnd() * 3)] : 'auto',
    ) as MosaicSpan[]
    const layout = buildMosaicLayout(spans)
    spans.forEach((span, i) => {
      if (span === 'auto') return
      total++
      if (layout[i]?.span === Number(span)) honoured++
    })
  }
  return { rate: honoured / total, honoured, total }
}

const realistic = pinRate(0.15, 1500)
const saturated = pinRate(0.6, 1500)
console.log(
  `pins honoured — realistic density (15%): ${(realistic.rate * 100).toFixed(1)}% ` +
    `(${realistic.honoured}/${realistic.total})`,
)
console.log(
  `pins honoured — saturated (60%): ${(saturated.rate * 100).toFixed(1)}% ` +
    `(${saturated.honoured}/${saturated.total})`,
)
if (realistic.rate < 0.9) {
  console.error('FAIL: pins are being overridden at realistic density')
  failures++
}

console.log(failures === 0 ? 'mosaic layout: all rows sum to 6 ✓' : `${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
