import type { ELK as ElkApi, ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api.js'
import type { Edge, Node } from '@xyflow/react'

let elkPromise: Promise<ElkApi> | undefined

function getElk() {
  elkPromise ??= import('elkjs/lib/elk.bundled.js').then(({ default: ElkConstructor }) => new ElkConstructor())
  return elkPromise
}
const GROUP_PADDING_X = 32
const GROUP_PADDING_TOP = 52
const GROUP_PADDING_BOTTOM = 28

export interface LayoutOptions {
  direction?: 'LR' | 'TB'
  nodeSep?: number
  rankSep?: number
}

interface NodeMetadata {
  columns?: unknown[]
  endpoints?: unknown[]
  attributes?: unknown[]
  methods?: unknown[]
  tech?: unknown[]
  pattern?: string
  stereotype?: string
}

function metadataFor(node: Node): NodeMetadata {
  return ((node.data as { metadata?: NodeMetadata }).metadata ?? {})
}

export function getNodeDimensions(node: Node): { width: number; height: number } {
  if (node.type === 'groupNode') {
    return {
      width: Number(node.style?.width ?? node.width ?? 320),
      height: Number(node.style?.height ?? node.height ?? 220),
    }
  }

  const metadata = metadataFor(node)

  switch (node.type) {
    case 'tableNode':
      return { width: 240, height: Math.max(112, 44 + (metadata.columns?.length ?? 0) * 30) }
    case 'serviceNode': {
      const endpointCount = Math.min(metadata.endpoints?.length ?? 0, 5)
      return { width: 272, height: Math.max(112, 52 + endpointCount * 31 + (endpointCount === 5 ? 22 : 0)) }
    }
    case 'classNode': {
      const attributeCount = Math.min(metadata.attributes?.length ?? 0, 6)
      const methodCount = Math.min(metadata.methods?.length ?? 0, 6)
      const header = 48 + (metadata.stereotype ? 14 : 0) + (metadata.pattern ? 18 : 0)
      const compartments = (attributeCount ? 14 : 0) + (methodCount ? 14 : 0)
      return {
        width: 288,
        height: Math.max(150, header + compartments + attributeCount * 20 + methodCount * 24),
      }
    }
    case 'componentNode':
      return {
        width: 240,
        height: metadata.tech?.length || metadata.pattern ? 104 : 72,
      }
    case 'clientNode':
      return { width: 152, height: 118 }
    default:
      return { width: 168, height: metadata.tech?.length ? 112 : 96 }
  }
}

function leafFor(node: Node): ElkNode {
  const { width, height } = getNodeDimensions(node)
  return { id: node.id, width, height }
}

function directionHandles(direction: 'LR' | 'TB') {
  return direction === 'TB'
    ? { sourceHandle: 'bottom-s', targetHandle: 'top-t' }
    : { sourceHandle: 'right-s', targetHandle: 'left-t' }
}

function groupLayoutOptions(direction: 'LR' | 'TB', nodeSep: number, rankSep: number) {
  return {
    'elk.algorithm': 'layered',
    'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.spacing.nodeNode': String(nodeSep),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(rankSep),
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.padding': `[top=${GROUP_PADDING_TOP},left=${GROUP_PADDING_X},bottom=${GROUP_PADDING_BOTTOM},right=${GROUP_PADDING_X}]`,
  }
}

export async function applyLayoutWithGroups(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const direction = options.direction ?? 'LR'
  const nodeSep = options.nodeSep ?? 64
  const rankSep = options.rankSep ?? 120
  const sourceNodes = new Map(nodes.map((node) => [node.id, node]))
  const regularNodes = nodes.filter((node) => node.type !== 'groupNode')
  const groupNodes = nodes.filter((node) => node.type === 'groupNode')
  const elk = await getElk()
  const ownerByMember = new Map<string, string>()
  for (const group of groupNodes) {
    const memberIds = (group.data as { memberIds?: string[] }).memberIds ?? []
    for (const memberId of memberIds) {
      if (sourceNodes.get(memberId)?.type !== 'groupNode') ownerByMember.set(memberId, group.id)
    }
  }

  const groupLayouts = new Map<string, ElkNode>()
  for (const group of groupNodes) {
    const members = regularNodes.filter((node) => ownerByMember.get(node.id) === group.id)
    const memberIds = new Set(members.map((node) => node.id))
    const internalEdges: ElkExtendedEdge[] = edges
      .filter((edge) => memberIds.has(edge.source) && memberIds.has(edge.target))
      .map((edge) => ({ id: `${group.id}-${edge.id}`, sources: [edge.source], targets: [edge.target] }))
    const fallback = getNodeDimensions(group)

    if (!members.length) {
      groupLayouts.set(group.id, { id: group.id, width: fallback.width, height: fallback.height, children: [] })
      continue
    }

    groupLayouts.set(group.id, await elk.layout({
      id: `members-${group.id}`,
      children: members.map(leafFor),
      edges: internalEdges,
      layoutOptions: groupLayoutOptions(direction, nodeSep, rankSep),
    }))
  }

  const ungroupedNodes = regularNodes.filter((node) => !ownerByMember.has(node.id))
  const macroChildren: ElkNode[] = [
    ...groupNodes.map((group) => {
      const layout = groupLayouts.get(group.id)
      const fallback = getNodeDimensions(group)
      return { id: group.id, width: layout?.width ?? fallback.width, height: layout?.height ?? fallback.height }
    }),
    ...ungroupedNodes.map(leafFor),
  ]
  const macroNodeIds = new Set(macroChildren.map((node) => node.id))
  const macroEdgeKeys = new Set<string>()
  const macroEdges: ElkExtendedEdge[] = []

  for (const edge of edges) {
    const source = ownerByMember.get(edge.source) ?? edge.source
    const target = ownerByMember.get(edge.target) ?? edge.target
    const key = `${source}->${target}`
    if (source === target || !macroNodeIds.has(source) || !macroNodeIds.has(target) || macroEdgeKeys.has(key)) continue
    macroEdgeKeys.add(key)
    macroEdges.push({ id: `macro-${edge.id}`, sources: [source], targets: [target] })
  }

  const macroLayout = await elk.layout({
    id: 'root',
    children: macroChildren,
    edges: macroEdges,
    layoutOptions: {
      ...groupLayoutOptions(direction, nodeSep, rankSep),
      'elk.padding': '[top=48,left=48,bottom=48,right=48]',
    },
  })
  const macroById = new Map((macroLayout.children ?? []).map((node) => [node.id, node]))

  const positionedGroups = groupNodes.flatMap((group) => {
    const macro = macroById.get(group.id)
    const inner = groupLayouts.get(group.id)
    if (!macro || !inner) return []
    const width = inner.width ?? getNodeDimensions(group).width
    const height = inner.height ?? getNodeDimensions(group).height
    return [{
      ...group,
      position: { x: macro.x ?? 0, y: macro.y ?? 0 },
      width,
      height,
      style: { ...group.style, width, height },
      zIndex: -1,
    }]
  })

  const positionedRegular = regularNodes.flatMap((source) => {
    const ownerId = ownerByMember.get(source.id)
    const parent = ownerId ? macroById.get(ownerId) : undefined
    const inner = ownerId ? groupLayouts.get(ownerId)?.children?.find((child) => child.id === source.id) : undefined
    const positioned = inner ?? macroById.get(source.id)
    if (!positioned) return []
    const width = positioned.width ?? getNodeDimensions(source).width
    const height = positioned.height ?? getNodeDimensions(source).height
    return [{
      ...source,
      position: {
        x: (parent?.x ?? 0) + (positioned.x ?? 0),
        y: (parent?.y ?? 0) + (positioned.y ?? 0),
      },
      width,
      height,
      style: { ...source.style, width, height },
    }]
  })
  const positioned = [...positionedGroups, ...positionedRegular]

  const handles = directionHandles(direction)
  const positionedEdges = edges.map((edge) => ({ ...edge, ...handles }))

  return { nodes: positioned, edges: positionedEdges }
}

export async function applyLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
) {
  return applyLayoutWithGroups(nodes, edges, options)
}
