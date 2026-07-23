import assert from 'node:assert/strict'
import test from 'node:test'
import type { Edge, Node } from '@xyflow/react'
import { applyLayoutWithGroups, getNodeDimensions } from './layoutEngine.ts'

function regularNode(
  id: string,
  type: string,
  metadata: Record<string, unknown> = {},
): Node {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, color: '#5b5ce2', metadata },
  }
}

function groupNode(id: string, memberIds: string[]): Node {
  return {
    id,
    type: 'groupNode',
    position: { x: 0, y: 0 },
    data: { label: id, color: '#5b5ce2', memberIds },
  }
}

function intersections(nodes: Node[]) {
  const regular = nodes.filter((node) => node.type !== 'groupNode')
  const hits: string[] = []

  for (let i = 0; i < regular.length; i += 1) {
    for (let j = i + 1; j < regular.length; j += 1) {
      const a = regular[i]
      const b = regular[j]
      const aSize = getNodeDimensions(a)
      const bSize = getNodeDimensions(b)
      const separated =
        a.position.x + aSize.width <= b.position.x ||
        b.position.x + bSize.width <= a.position.x ||
        a.position.y + aSize.height <= b.position.y ||
        b.position.y + bSize.height <= a.position.y

      if (!separated) hits.push(`${a.id}:${b.id}`)
    }
  }

  return hits
}

const tallClassMetadata = {
  attributes: Array.from({ length: 6 }, (_, i) => ({ visibility: '-', name: `field${i}`, type: 'string' })),
  methods: Array.from({ length: 6 }, (_, i) => ({ visibility: '+', name: `method${i}`, returnType: 'void' })),
  stereotype: '<<controller>>',
  pattern: 'Facade',
}

test('low-level layout uses real node geometry without intersections', async () => {
  const nodes = [
    groupNode('application', ['controller', 'validator', 'service']),
    groupNode('data', ['repository', 'events']),
    regularNode('controller', 'classNode', tallClassMetadata),
    regularNode('validator', 'classNode', tallClassMetadata),
    regularNode('service', 'componentNode', { tech: ['TypeScript', 'S3 SDK'], pattern: 'Builder' }),
    regularNode('repository', 'componentNode', { tech: ['PostgreSQL'], pattern: 'Repository' }),
    regularNode('events', 'componentNode', { tech: ['Kafka'], pattern: 'Observer' }),
  ]
  const edges: Edge[] = [
    { id: 'e1', source: 'controller', target: 'validator' },
    { id: 'e2', source: 'controller', target: 'service' },
    { id: 'e3', source: 'validator', target: 'service' },
    { id: 'e4', source: 'service', target: 'repository' },
    { id: 'e5', source: 'service', target: 'events' },
  ]

  const result = await applyLayoutWithGroups(nodes, edges, {
    direction: 'TB',
    nodeSep: 64,
    rankSep: 110,
  })

  assert.deepEqual(intersections(result.nodes), [])
  assert.ok(getNodeDimensions(result.nodes.find((node) => node.id === 'controller')!).height > 250)
  assert.equal(result.edges[0].sourceHandle, 'bottom-s')
  assert.equal(result.edges[0].targetHandle, 'top-t')

  const application = result.nodes.find((node) => node.id === 'application')!
  const controller = result.nodes.find((node) => node.id === 'controller')!
  const groupWidth = Number(application.style?.width)
  const groupHeight = Number(application.style?.height)
  assert.ok(groupWidth > getNodeDimensions(controller).width)
  assert.ok(groupHeight > getNodeDimensions(controller).height)
})

test('left-to-right layout binds horizontal ports and is stable', async () => {
  const nodes = [
    regularNode('client', 'architectureNode'),
    regularNode('gateway', 'architectureNode'),
    regularNode('service', 'architectureNode'),
  ]
  const edges: Edge[] = [
    { id: 'e1', source: 'client', target: 'gateway' },
    { id: 'e2', source: 'gateway', target: 'service' },
  ]

  const first = await applyLayoutWithGroups(nodes, edges, { direction: 'LR' })
  const second = await applyLayoutWithGroups(nodes, edges, { direction: 'LR' })

  assert.deepEqual(
    first.nodes.map(({ id, position }) => ({ id, position })),
    second.nodes.map(({ id, position }) => ({ id, position })),
  )
  assert.equal(first.edges[0].sourceHandle, 'right-s')
  assert.equal(first.edges[0].targetHandle, 'left-t')
  assert.ok(first.nodes[0].position.x < first.nodes[1].position.x)
})

test('interleaved cross-group edges keep group regions separate', async () => {
  const nodes = [
    groupNode('group-a', ['a1', 'a2']),
    groupNode('group-b', ['b1', 'b2']),
    regularNode('a1', 'architectureNode'),
    regularNode('a2', 'architectureNode'),
    regularNode('b1', 'architectureNode'),
    regularNode('b2', 'architectureNode'),
  ]
  const edges: Edge[] = [
    { id: 'e1', source: 'a1', target: 'b1' },
    { id: 'e2', source: 'b1', target: 'a2' },
    { id: 'e3', source: 'a2', target: 'b2' },
  ]

  const result = await applyLayoutWithGroups(nodes, edges, { direction: 'LR' })
  const a = result.nodes.find((node) => node.id === 'group-a')!
  const b = result.nodes.find((node) => node.id === 'group-b')!
  const aSize = getNodeDimensions(a)
  const bSize = getNodeDimensions(b)
  const separated =
    a.position.x + aSize.width <= b.position.x ||
    b.position.x + bSize.width <= a.position.x ||
    a.position.y + aSize.height <= b.position.y ||
    b.position.y + bSize.height <= a.position.y

  assert.equal(separated, true)
})
