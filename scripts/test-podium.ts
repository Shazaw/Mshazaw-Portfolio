/** Placement strings the derivation must classify correctly. */
const PODIUM = /\b(1st|2nd|3rd|first|second|third|champion|winner|gold|silver|bronze)\b/i
const FINAL = /\bgrand[\s-]?final\b|\bfinals?\b|\bfinalist\b/i
const NOT_FINAL = /\b(semi|quarter)[\s-]?final/i
const isPodiumOrFinal = (p?: string | null) =>
  !p ? false : PODIUM.test(p) ? true : FINAL.test(p) && !NOT_FINAL.test(p)

const cases: [string | null, boolean][] = [
  ['1ST / 412 TEAMS', true],
  ['3rd place', true],
  ['GRAND FINAL · 4TH / 312 TEAMS', true],
  ['Finalist', true],
  ['National Finals', true],
  ['Gold medal', true],
  ['SEMIFINALIST', false],
  ['Semi-final', false],
  ['Quarterfinal', false],
  ['4TH / 312 TEAMS', false],
  ['11TH / 486 TEAMS', false],
  ['Participant', false],
  [null, false],
  ['', false],
]

let failed = 0
for (const [input, expected] of cases) {
  const got = isPodiumOrFinal(input)
  if (got !== expected) {
    console.error(`FAIL ${JSON.stringify(input)} → ${got}, expected ${expected}`)
    failed++
  }
}
console.log(failed === 0 ? `podium derivation: ${cases.length}/${cases.length} ✓` : `${failed} failures`)
process.exit(failed ? 1 : 0)
