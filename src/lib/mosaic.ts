import type { MosaicSpan } from './types'

/**
 * Sacred-Craft mosaic layout (spec §8.5).
 *
 * The grid is 6 columns with zero gap. Two rules govern everything here:
 *
 *   1. Every row MUST sum to exactly 6. A short row leaves the connected block
 *      with a ragged edge, which is the one thing this layout cannot have.
 *   2. Editor-pinned spans are honoured wherever geometry allows. The repeating
 *      pattern fills around the pins, not the other way round.
 *
 * When the two rules collide — three items pinned to 2 in a two-cell tail, say —
 * rule 1 wins and the closing pass widens whatever it must.
 */

/** `[4,2] → [2,2,2] → [3,3] → [2,4] → [2,2,2] → [3,3] → repeat` */
const PATTERN: readonly (readonly number[])[] = [
  [4, 2],
  [2, 2, 2],
  [3, 3],
  [2, 4],
  [2, 2, 2],
  [3, 3],
]

/**
 * With six items or fewer there aren't enough rows for the pattern to read, so
 * spans bias upward and the block still commands the screen.
 */
const SMALL_LAYOUTS: Record<number, readonly (readonly number[])[]> = {
  1: [[6]],
  2: [[3, 3]],
  3: [[4, 2], [6]],
  4: [[3, 3], [4, 2]],
  5: [[4, 2], [3, 3], [6]],
  6: [[4, 2], [2, 2, 2], [6]],
}

/** Narrowest cell we will ever emit — a 1/6 cell is too thin to hold a title. */
const MIN_SPAN = 2

const COLUMNS = 6

export interface MosaicPlacement {
  /** Column span, 1–6. */
  span: number
  /** Row index, used for the alternating min-height. */
  row: number
  /** `true` for the taller of the two alternating row heights. */
  tall: boolean
}

const pinnedSpan = (value: MosaicSpan): number | null => (value === 'auto' ? null : Number(value))

const sumOf = (row: number[]) => row.reduce((a, b) => a + b, 0)

/**
 * Frees `needed` columns by narrowing the un-pinned cells already in this row,
 * so a wide pin can join it instead of being banished to a row of its own.
 * Returns false and changes nothing when the room isn't there.
 */
const makeRoom = (row: number[], pinned: boolean[], needed: number): boolean => {
  const slack = row.reduce(
    (total, span, i) => total + (pinned[i] ? 0 : Math.max(0, span - MIN_SPAN)),
    0,
  )
  if (slack < needed) return false

  let remaining = needed
  for (let i = row.length - 1; i >= 0 && remaining > 0; i--) {
    if (pinned[i]) continue
    const give = Math.min(remaining, row[i] - MIN_SPAN)
    row[i] -= give
    remaining -= give
  }
  return true
}

/** Last resort: grow cells until the row closes, touching pins only if forced. */
const widenRow = (row: number[], pinned: boolean[], deficit: number): void => {
  let remaining = deficit
  for (const allowPinned of [false, true]) {
    let cursor = row.length - 1
    let guard = 0
    while (remaining > 0 && guard < 64) {
      if (cursor < 0) cursor = row.length - 1
      if ((allowPinned || !pinned[cursor]) && row[cursor] < COLUMNS) {
        row[cursor] += 1
        remaining -= 1
      }
      cursor -= 1
      guard += 1
    }
    if (remaining === 0) break
  }
}

/** Shrink an over-wide row (only reachable when pins overflow a template). */
const shrinkRow = (row: number[], excess: number): void => {
  let over = excess
  for (let i = row.length - 1; i >= 0 && over > 0; i--) {
    const give = Math.min(over, row[i] - 1)
    row[i] -= give
    over -= give
  }
}

/**
 * Builds one row from a template, honouring pins, then closes it to exactly 6.
 * Returns the spans and how many items it consumed.
 */
const buildRow = (
  template: readonly number[],
  pins: (number | null)[],
  start: number,
  count: number,
): number[] => {
  const row: number[] = []
  const pinned: boolean[] = []
  let sum = 0

  for (const slot of template) {
    const index = start + row.length
    if (index >= count) break
    const pin = pins[index]
    const want = pin ?? slot

    if (sum + want > COLUMNS) {
      // A pin wider than the slot left for it: narrow the free cells already
      // placed rather than pushing the pin onto a row of its own.
      if (pin === null || !makeRoom(row, pinned, sum + want - COLUMNS)) break
      sum = sumOf(row)
    }

    row.push(want)
    pinned.push(pin !== null)
    sum += want
  }

  if (row.length === 0) {
    // Only reachable when a pin is wider than an entire row.
    row.push(Math.min(COLUMNS, pins[start] ?? COLUMNS))
    pinned.push(true)
    sum = row[0]
  }

  if (sum > COLUMNS) {
    shrinkRow(row, sum - COLUMNS)
    return row
  }

  // A row of pinned cells can fall short — the template said [3,3] but both
  // items are pinned to 2. Pull in another item rather than inflating a pin.
  while (sum < COLUMNS && start + row.length < count) {
    const pin = pins[start + row.length]
    const gap = COLUMNS - sum

    if (pin === null) {
      if (gap < MIN_SPAN) break
      row.push(gap)
      pinned.push(false)
      sum = COLUMNS
      break
    }

    const leftover = gap - pin
    if (leftover < 0 || (leftover > 0 && leftover < MIN_SPAN)) break
    row.push(pin)
    pinned.push(true)
    sum += pin
  }

  if (sum < COLUMNS) widenRow(row, pinned, COLUMNS - sum)

  return row
}

export const buildMosaicLayout = (spans: MosaicSpan[]): MosaicPlacement[] => {
  const count = spans.length
  if (count === 0) return []

  const pins = spans.map(pinnedSpan)
  const placements: MosaicPlacement[] = []

  const templates: readonly (readonly number[])[] | undefined = SMALL_LAYOUTS[count]

  let item = 0
  let rowIndex = 0
  let guard = 0

  while (item < count && guard < 500) {
    guard += 1

    const remaining = count - item
    let template: readonly number[]

    if (templates) {
      template = templates[Math.min(rowIndex, templates.length - 1)]
    } else if (remaining <= 2) {
      // Tail: close the block with one or two wide cells rather than a stub.
      template = remaining === 1 ? [COLUMNS] : [3, 3]
    } else {
      template = PATTERN[rowIndex % PATTERN.length]
    }

    const row = buildRow(template, pins, item, count)

    row.forEach((span, offset) => {
      placements[item + offset] = { span, row: rowIndex, tall: rowIndex % 2 === 0 }
    })

    item += row.length
    rowIndex += 1
  }

  return placements
}

/** Row min-heights alternate so the block never reads as a plain table. */
export const ROW_HEIGHT_TALL = 270
export const ROW_HEIGHT_MID = 235
