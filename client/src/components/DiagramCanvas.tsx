import { useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArchitectureNode } from '../nodes/ArchitectureNode'
import { TableNode } from '../nodes/TableNode'
import { ServiceNode } from '../nodes/ServiceNode'
import { GroupNode } from '../nodes/GroupNode'

const nodeTypes = {
  architectureNode: ArchitectureNode,
  tableNode: TableNode,
  serviceNode: ServiceNode,
  groupNode: GroupNode,
}

interface DiagramCanvasProps {
  nodes: Node[]
  edges: Edge[]
}

export function DiagramCanvas({ nodes: propNodes, edges: propEdges }: DiagramCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges)
  const prevKeyRef = useRef(JSON.stringify(propNodes.map((n) => n.id)))

  useEffect(() => {
    const key = JSON.stringify(propNodes.map((n) => n.id))
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      setNodes(propNodes)
      setEdges(propEdges)
    }
  }, [propNodes, propEdges, setNodes, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => (n.data as { color?: string }).color ?? '#6b7280'}
        maskColor="rgba(255,255,255,0.7)"
        style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
      />
    </ReactFlow>
  )
}
