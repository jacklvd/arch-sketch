import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

const DEFAULT_NODE_WIDTH = 160
const DEFAULT_NODE_HEIGHT = 90
const GROUP_PADDING = 40
const GROUP_LABEL_HEIGHT = 36

export interface LayoutOptions {
  direction?: 'LR' | 'TB'
  nodeWidth?: number
  nodeHeight?: number
  nodeSep?: number
  rankSep?: number
}

export function applyLayout(nodes: Node[], edges: Edge[], options: LayoutOptions = {}): Node[] {
  const {
    direction = 'LR',
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeHeight = DEFAULT_NODE_HEIGHT,
    nodeSep = 70,
    rankSep = 120,
  } = options

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep, marginx: 50, marginy: 50 })

  nodes.forEach((node) => g.setNode(node.id, { width: nodeWidth, height: nodeHeight }))
  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    return { ...node, position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 } }
  })
}

export function applyLayoutWithGroups(nodes: Node[], edges: Edge[], options: LayoutOptions = {}): Node[] {
  const {
    direction = 'LR',
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeHeight = DEFAULT_NODE_HEIGHT,
    nodeSep = 80,
    rankSep = 140,
  } = options

  const groupNodes = nodes.filter((n) => n.type === 'groupNode')
  const regularNodes = nodes.filter((n) => n.type !== 'groupNode')

  const groupMemberMap = new Map<string, string[]>(
    groupNodes.map((gn) => [gn.id, (gn.data as { memberIds: string[] }).memberIds])
  )

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep, marginx: 80, marginy: 80 })

  regularNodes.forEach((node) => g.setNode(node.id, { width: nodeWidth, height: nodeHeight }))
  edges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(g)

  const positionedRegular = regularNodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    return { ...node, position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 } }
  })

  const posMap = new Map(positionedRegular.map((n) => [n.id, n.position]))

  const positionedGroups = groupNodes.map((groupNode) => {
    const memberIds = groupMemberMap.get(groupNode.id) ?? []
    const memberPos = memberIds
      .map((id) => posMap.get(id))
      .filter((p): p is { x: number; y: number } => Boolean(p))

    if (memberPos.length === 0) return groupNode

    const minX = Math.min(...memberPos.map((p) => p.x)) - GROUP_PADDING
    const minY = Math.min(...memberPos.map((p) => p.y)) - GROUP_PADDING - GROUP_LABEL_HEIGHT
    const maxX = Math.max(...memberPos.map((p) => p.x + nodeWidth)) + GROUP_PADDING
    const maxY = Math.max(...memberPos.map((p) => p.y + nodeHeight)) + GROUP_PADDING

    return {
      ...groupNode,
      position: { x: minX, y: minY },
      style: { width: maxX - minX, height: maxY - minY },
    }
  })

  return [...positionedGroups, ...positionedRegular]
}
