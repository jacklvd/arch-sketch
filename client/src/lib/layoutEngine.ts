import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 160
const NODE_HEIGHT = 90
const GROUP_PADDING = 40
const GROUP_LABEL_HEIGHT = 36

export function applyLayout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'LR'): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 70, ranksep: 120, marginx: 50, marginy: 50 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })
  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    return { ...node, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })
}

export function applyLayoutWithGroups(nodes: Node[], edges: Edge[]): Node[] {
  const groupNodes = nodes.filter((n) => n.type === 'groupNode')
  const regularNodes = nodes.filter((n) => n.type !== 'groupNode')

  // Build memberIds map from group node data
  const groupMemberMap = new Map<string, string[]>(
    groupNodes.map((gn) => [gn.id, (gn.data as { memberIds: string[] }).memberIds])
  )

  // Run dagre on regular nodes only
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 140, marginx: 80, marginy: 80 })

  regularNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })
  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(g)

  const positionedRegular = regularNodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    return { ...node, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })

  const posMap = new Map(positionedRegular.map((n) => [n.id, n.position]))

  // Size and position each group node to wrap its members
  const positionedGroups = groupNodes.map((groupNode) => {
    const memberIds = groupMemberMap.get(groupNode.id) ?? []
    const memberPos = memberIds
      .map((id) => posMap.get(id))
      .filter((p): p is { x: number; y: number } => Boolean(p))

    if (memberPos.length === 0) return groupNode

    const minX = Math.min(...memberPos.map((p) => p.x)) - GROUP_PADDING
    const minY = Math.min(...memberPos.map((p) => p.y)) - GROUP_PADDING - GROUP_LABEL_HEIGHT
    const maxX = Math.max(...memberPos.map((p) => p.x + NODE_WIDTH)) + GROUP_PADDING
    const maxY = Math.max(...memberPos.map((p) => p.y + NODE_HEIGHT)) + GROUP_PADDING

    return {
      ...groupNode,
      position: { x: minX, y: minY },
      style: { width: maxX - minX, height: maxY - minY },
    }
  })

  return [...positionedGroups, ...positionedRegular]
}
