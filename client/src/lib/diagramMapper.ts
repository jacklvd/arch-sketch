import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import type { DiagramData } from '../types/diagram'
import { getGroupColor } from './iconRegistry'

export function mapToReactFlow(diagram: DiagramData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = diagram.nodes.map((n) => ({
    id: n.id,
    type: n.type === 'db_table' ? 'tableNode' : 'architectureNode',
    position: n.position,
    data: {
      label: n.label,
      icon: n.icon,
      group: n.group,
      metadata: n.metadata,
      color: getGroupColor(n.group),
    },
  }))

  const edges: Edge[] = diagram.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.style === 'animated',
    style: e.style === 'dashed' ? { strokeDasharray: '5,5', stroke: '#9ca3af' } : { stroke: '#9ca3af' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
    labelStyle: { fontSize: 10, fill: '#6b7280' },
    labelBgStyle: { fill: 'rgba(255,255,255,0.85)', borderRadius: 4 },
    labelBgPadding: [4, 2] as [number, number],
  }))

  return { nodes, edges }
}
