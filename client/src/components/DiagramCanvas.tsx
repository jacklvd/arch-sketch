import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  getNodesBounds,
  getViewportForBounds,
  BackgroundVariant,
} from '@xyflow/react'
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react'
import { toPng } from 'html-to-image'
import '@xyflow/react/dist/style.css'
import { ArchitectureNode } from '../nodes/ArchitectureNode'
import { TableNode } from '../nodes/TableNode'
import { ServiceNode } from '../nodes/ServiceNode'
import { ClientNode } from '../nodes/ClientNode'
import { GroupNode } from '../nodes/GroupNode'
import { ClassNode } from '../nodes/ClassNode'
import { ComponentNode } from '../nodes/ComponentNode'
import { FKEdge } from '../edges/FKEdge'
import { ApiEdge } from '../edges/ApiEdge'

const nodeTypes = {
  architectureNode: ArchitectureNode,
  tableNode: TableNode,
  serviceNode: ServiceNode,
  clientNode: ClientNode,
  groupNode: GroupNode,
  classNode: ClassNode,
  componentNode: ComponentNode,
}

const edgeTypes = {
  fkEdge: FKEdge,
  apiEdge: ApiEdge,
}

interface DiagramCanvasProps {
  nodes: Node[]
  edges: Edge[]
  title?: string
}

export interface DiagramCanvasHandle {
  fit: () => void
  exportPng: () => Promise<void>
}

async function exportDiagram(instance: ReactFlowInstance | null, title: string) {
    const nodes = instance?.getNodes() ?? []
    if (!nodes.length) return

    const bounds = getNodesBounds(nodes)
    const W = 2400
    const H = 1600
    const viewport = getViewportForBounds(bounds, W, H, 0.4, 2, 0.12)

    const el = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!el) return

    const dataUrl = await toPng(el, {
        backgroundColor: '#f7f9fc',
        width: W,
        height: H,
        style: {
          width: `${W}px`,
          height: `${H}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${(title || 'diagram').replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
}

export const DiagramCanvas = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(function DiagramCanvas(
  { nodes: propNodes, edges: propEdges, title = '' },
  ref,
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges)
  const instanceRef = useRef<ReactFlowInstance | null>(null)
  const prevKeyRef = useRef(JSON.stringify(propNodes.map((n) => n.id)))

  useImperativeHandle(ref, () => ({
    fit: () => instanceRef.current?.fitView({ padding: 0.2, minZoom: 0.35, maxZoom: 1.1, duration: 240 }),
    exportPng: () => exportDiagram(instanceRef.current, title),
  }), [title])

  useEffect(() => {
    const key = JSON.stringify(propNodes.map((n) => n.id))
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      setNodes(propNodes)
      setEdges(propEdges)
    }
  }, [propNodes, propEdges, setNodes, setEdges])

  const focusReadableRegion = (instance: ReactFlowInstance) => {
    const regularNodes = propNodes.filter((node) => node.type !== 'groupNode')
    const anchor = regularNodes[0]
    if (!anchor) return
    window.setTimeout(() => {
      const currentZoom = instance.getZoom()
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      if (!isMobile && currentZoom >= 0.6) return
      const width = anchor.width ?? Number(anchor.style?.width ?? 168)
      const height = anchor.height ?? Number(anchor.style?.height ?? 96)
      const neighbor = regularNodes[1]
      const neighborWidth = neighbor?.width ?? Number(neighbor?.style?.width ?? 168)
      const neighborHeight = neighbor?.height ?? Number(neighbor?.style?.height ?? 96)
      const anchorCenter = { x: anchor.position.x + width / 2, y: anchor.position.y + height / 2 }
      const neighborCenter = neighbor
        ? { x: neighbor.position.x + neighborWidth / 2, y: neighbor.position.y + neighborHeight / 2 }
        : anchorCenter
      void instance.setCenter(
        isMobile ? (anchorCenter.x + neighborCenter.x) / 2 : anchorCenter.x,
        isMobile ? (anchorCenter.y + neighborCenter.y) / 2 : anchorCenter.y,
        { zoom: isMobile ? 0.75 : 0.65, duration: 280 },
      )
    }, 120)
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={(instance) => {
        instanceRef.current = instance
        focusReadableRegion(instance)
      }}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.35, maxZoom: 1.1 }}
      minZoom={0.35}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="#dce4ef" />
      <Controls showInteractive={false} />
      <MiniMap
        className="hidden md:block"
        nodeColor={(n) => (n.data as { color?: string }).color ?? '#6b7280'}
        maskColor="rgba(255,255,255,0.7)"
        style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
      />
    </ReactFlow>
  )
})
