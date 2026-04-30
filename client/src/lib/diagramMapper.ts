import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import type { DiagramData } from '../types/diagram'
import { getGroupColor } from './iconRegistry'

export function mapToReactFlow(diagram: DiagramData): { nodes: Node[]; edges: Edge[] } {
  // Group container nodes — layoutEngine will compute their position/size
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

  const nodes: Node[] = diagram.nodes.map((n) => {
    let type = 'architectureNode'
    if (n.type === 'db_table') type = 'tableNode'
    else if (n.type === 'api_service') type = 'serviceNode'

    return {
      id: n.id,
      type,
      position: n.position,
      data: {
        label: n.label,
        icon: n.icon,
        group: n.group,
        metadata: n.metadata,
        color: getGroupColor(n.group),
      },
    }
  })

  const edges: Edge[] = diagram.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.style === 'animated',
    style: e.style === 'dashed'
      ? { strokeDasharray: '6,4', stroke: '#d1d5db', strokeWidth: 1.5 }
      : { stroke: '#d1d5db', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 12, height: 12 },
    labelStyle: { fontSize: 10, fill: '#6b7280' },
    labelBgStyle: { fill: 'rgba(255,255,255,0.9)', borderRadius: 4 },
    labelBgPadding: [4, 2] as [number, number],
  }))

  return { nodes: [...groupNodes, ...nodes], edges }
}
