import { MAX_NODES } from './chamberConstants'
import { hashSeed, mulberry32 } from './random'
import type { ChamberNode } from './types'

export type Point3 = [number, number, number]
export interface NeuralNode {
  /** Original record index; layout order must never change click targets. */
  index: number
  position: Point3
  radius: number
  size: number
  phase: number
}

export const nodeTime = (node: ChamberNode): number => {
  const date = node.date ? Date.parse(node.date) : NaN
  return Number.isFinite(date) ? date : Date.UTC(node.year, 0, 1)
}

const distance = (a: Point3, b: Point3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * A volumetric constellation: chronological rank controls distance from origin.
 * Seeded directions fill the entire sphere, including its front and back.
 * Screen-space separation is capped so it cannot flatten the cloud into a disc.
 * Connections form a connected, bounded-degree neighbourhood, not a complete graph.
 */
export const buildNeuralMap = (records: ChamberNode[]) => {
  const ordered = records.slice(0, MAX_NODES).map((record, index) => ({ record, index }))
    .sort((a, b) => nodeTime(a.record) - nodeTime(b.record) || a.record.slug.localeCompare(b.record.slug))
  const nodes: NeuralNode[] = []
  const project = ([x, y, z]: Point3) => [x * Math.cos(0.45) - z * Math.sin(0.45), y * Math.sin(1.2) - (x * Math.sin(0.45) + z * Math.cos(0.45)) * Math.cos(1.2)]

  ordered.forEach(({ record, index }, rank) => {
    const random = mulberry32(hashSeed(record.slug || record.id))
    const radius = rank === 0 ? 0 : 7 + 4.4 * Math.sqrt(rank)
    const spacing = 6.5 + random() * 4.5
    let position: Point3 = [0, 0, 0]
    let best = -Infinity
    for (let attempt = 0; attempt < 48 && rank > 0; attempt++) {
      const angle = rank * 2.399963 + attempt * 2.399963 + random() * 0.25
      const vertical = random() * 2 - 1
      const horizontal = Math.sqrt(1 - vertical * vertical)
      const candidate: Point3 = [Math.cos(angle) * horizontal * radius, vertical * radius, Math.sin(angle) * horizontal * radius]
      const screen = project(candidate)
      const clearance = Math.min(...nodes.map((node) => distance(candidate, node.position)))
      const screenClearance = Math.min(...nodes.map((node) => {
        const other = project(node.position)
        return Math.hypot(screen[0] - other[0], screen[1] - other[1])
      }))
      // Stop rewarding perfect equidistance once a star has breathing room.
      // Different local clearances leave pockets, loose branches and open space.
      const score = Math.min(spacing, clearance) + Math.min(6, screenClearance) * 0.18
      if (score > best) { best = score; position = candidate }
    }
    nodes.push({ index, position, radius, size: (0.85 + Math.max(1, Math.min(5, record.weight)) * 0.13) * (0.84 + random() * 0.32), phase: random() * Math.PI * 2 })
  })

  const pairs = new Set<string>()
  const links: [number, number][] = []
  const connect = (a: number, b: number) => {
    const pair = [Math.min(a, b), Math.max(a, b)] as [number, number]
    const key = pair.join(':')
    if (a === b || pairs.has(key)) return
    pairs.add(key)
    links.push(pair)
  }
  nodes.forEach((node, rank) => {
    const nearest = nodes.filter((other) => other !== node)
      .sort((a, b) => distance(node.position, a.position) - distance(node.position, b.position))
    // Every new node has a path back to the oldest, even across sparse shells.
    if (rank > 0) {
      const older = nodes.slice(0, rank).sort((a, b) => distance(node.position, a.position) - distance(node.position, b.position))[0]
      connect(node.index, older.index)
    }
    nearest.slice(0, 5).forEach((other) => connect(node.index, other.index))
  })

  return { nodes: nodes.sort((a, b) => a.index - b.index), links, extent: Math.max(12, ...nodes.map((node) => node.radius + node.size * 2)) }
}
