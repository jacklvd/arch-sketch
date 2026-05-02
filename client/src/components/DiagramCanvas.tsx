import { useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  BackgroundVariant,
} from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
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

function ExportPanel({ title }: { title: string }) {
  const { getNodes } = useReactFlow()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    const nodes = getNodes()
    if (!nodes.length) return
    setExporting(true)

    const bounds = getNodesBounds(nodes)
    const W = 2400
    const H = 1600
    const viewport = getViewportForBounds(bounds, W, H, 0.4, 2, 0.12)

    const el = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!el) { setExporting(false); return }

    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#f9fafb',
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
    } finally {
      setExporting(false)
    }
  }

  return (
    <Panel position="top-right">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all disabled:opacity-50"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M5 7l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export PNG
          </>
        )}
      </button>
    </Panel>
  )
}

export function DiagramCanvas({ nodes: propNodes, edges: propEdges, title = '' }: DiagramCanvasProps) {
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
      edgeTypes={edgeTypes}
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
      <ExportPanel title={title} />
    </ReactFlow>
  )
}
