import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import type { DiagramData } from '../types/diagram'
import { getGroupColor } from './iconRegistry'

const CLIENT_ICONS = new Set(['browser', 'mobile', 'client'])
const CLIENT_GROUPS = new Set(['client', 'clients', 'frontend'])

function resolveNodeType(n: { type?: string; icon?: string; group?: string }, diagramType: string): string {
  if (diagramType === 'database' || n.type === 'db_table') return 'tableNode'

  if (diagramType === 'api') {
    if (CLIENT_GROUPS.has(n.group?.toLowerCase() ?? '') || CLIENT_ICONS.has(n.icon ?? ''))
      return 'clientNode'
    if (n.type === 'api_service' || n.type === 'api_gateway') return 'serviceNode'
    return 'architectureNode'
  }

  if (diagramType === 'low_level') {
    if (n.type === 'class_node') return 'classNode'
    if (n.type === 'component_node') return 'componentNode'
    return 'architectureNode'
  }

  if (n.type === 'api_service') return 'serviceNode'
  return 'architectureNode'
}

export function mapToReactFlow(diagram: DiagramData): { nodes: Node[]; edges: Edge[] } {
  const { diagramType } = diagram
  const isDatabase = diagramType === 'database'
  const isApi = diagramType === 'api'

  const groupNodes: Node[] = (diagram.groups ?? []).map((g) => {
    const firstMember = diagram.nodes.find((n) => g.nodeIds.includes(n.id))
    const color = getGroupColor(firstMember?.group)
    return {
      id: g.id,
      type: 'groupNode',
      position: { x: 0, y: 0 },
      style: { width: 300, height: 200 },
      zIndex: -1,
      draggable: false,
      selectable: false,
      data: { label: g.label, color, memberIds: g.nodeIds },
    }
  })

  const nodes: Node[] = diagram.nodes.map((n) => ({
    id: n.id,
    type: resolveNodeType(n, diagramType),
    position: n.position,
    data: {
      label: n.label,
      icon: n.icon,
      group: n.group,
      metadata: n.metadata,
      color: getGroupColor(n.group),
    },
  }))

  const edges: Edge[] = diagram.edges.map((e) => {
    if (isDatabase) {
      return { id: e.id, source: e.source, target: e.target, type: 'fkEdge', label: e.label, data: {} }
    }

    if (isApi) {
      return { id: e.id, source: e.source, target: e.target, type: 'apiEdge', label: e.label, data: {} }
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      animated: e.style === 'animated',
      style: e.style === 'dashed'
        ? { strokeDasharray: '6,4', stroke: '#d1d5db', strokeWidth: 1.5 }
        : { stroke: '#d1d5db', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 12, height: 12 },
      labelStyle: { fontSize: 10, fill: '#6b7280' },
      labelBgStyle: { fill: 'rgba(255,255,255,0.9)', borderRadius: 4 },
      labelBgPadding: [4, 2] as [number, number],
    }
  })

  return { nodes: [...groupNodes, ...nodes], edges }
}
