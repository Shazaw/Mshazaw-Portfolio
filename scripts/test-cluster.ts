import assert from 'node:assert/strict'
import { buildNeuralMap, nodeTime } from '../src/lib/neuralMap'
import { MAX_NODES } from '../src/lib/chamberConstants'
import type { ChamberNode } from '../src/lib/types'

for (const count of [0, 1, 2, 4, 14, 24, 48, 60]) {
  const records: ChamberNode[] = Array.from({ length: count }, (_, index) => ({
    id: String(index), slug: `record-${index}`, label: `Record ${index}`, sublabel: '',
    weight: 5, year: 2026 - index % 5,
    date: index % 3 ? `${2026 - index % 5}-${String(index % 12 + 1).padStart(2, '0')}-01` : undefined,
  }))
  const before = structuredClone(records)
  const { nodes, links } = buildNeuralMap(records)
  assert.deepEqual(records, before, 'Layout must not reorder source records')
  assert.deepEqual(buildNeuralMap(records), buildNeuralMap(records), 'Layout must be deterministic')
  assert.equal(nodes.length, Math.min(count, MAX_NODES))
  const chronological = [...nodes].sort((a, b) => nodeTime(records[a.index]) - nodeTime(records[b.index]))
  for (let i = 1; i < chronological.length; i++) {
    if (nodeTime(records[chronological[i].index]) > nodeTime(records[chronological[i - 1].index])) {
      assert(chronological[i].radius > chronological[i - 1].radius, 'Newer records must sit farther from the origin')
    }
  }
  for (const node of nodes) {
    assert(node.position.every(Number.isFinite))
    assert(Math.abs(Math.hypot(...node.position) - node.radius) < 0.00001, 'Chronology must use actual 3D distance')
    for (const other of nodes) {
      if (node.index === other.index) continue
      const distance = Math.hypot(...node.position.map((value, axis) => value - other.position[axis]))
      assert(distance > (node.size + other.size) * 1.2, 'Interactive star hit areas must not overlap in 3D')
    }
  }
  const reached = new Set(nodes.length ? [0] : [])
  for (let step = 0; step < nodes.length; step++) {
    for (const [a, b] of links) {
      assert(a !== b && nodes[a] && nodes[b], 'Connections must reference two actual records')
      if (reached.has(a) || reached.has(b)) { reached.add(a); reached.add(b) }
    }
  }
  assert.equal(reached.size, nodes.length, 'Every node needs a path through the network')
  assert.equal(new Set(links.map(pair => [...pair].sort().join(':'))).size, links.length)
  assert(links.length <= nodes.length * 4, 'Link budget must scale linearly')
  console.log(`neural map: ${count} records → ${nodes.length} stars, ${links.length} connections ✓`)
}

const dated = { id: 'date', slug: 'date', label: '', sublabel: '', weight: 1, year: 2024 }
assert(nodeTime({ ...dated, date: '2024-11-02' }) > nodeTime({ ...dated, date: '2024-02-03' }))
assert.equal(nodeTime({ ...dated, date: 'invalid' }), Date.UTC(2024, 0, 1))
console.log('Same-year ordering and missing-date fallback ✓')
