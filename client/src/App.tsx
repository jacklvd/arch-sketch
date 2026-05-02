import { useCallback, useEffect, useState } from 'react'
import { generateDiagram, checkOllamaHealth } from './api/generate'
import { InputForm } from './components/InputForm'
import { DiagramCanvas } from './components/DiagramCanvas'
import { DiagramTabs } from './components/DiagramTabs'
import { mapToReactFlow } from './lib/diagramMapper'
import { applyLayoutWithGroups } from './lib/layoutEngine'
import { useDiagramStore } from './store/diagramStore'
import type { DiagramType, GenerateRequest } from './types/diagram'

function getLayoutOptions(dt: DiagramType) {
  return {
    direction: (dt === 'database' || dt === 'low_level' ? 'TB' : 'LR') as 'LR' | 'TB',
    nodeWidth:  dt === 'database' ? 220 : dt === 'api' ? 240 : dt === 'low_level' ? 220 : 160,
    nodeHeight: dt === 'database' ? 200 : dt === 'api' ? 160 : dt === 'low_level' ? 200 : 90,
    nodeSep:    dt === 'database' ? 60  : dt === 'api' ? 60  : dt === 'low_level' ? 60  : 80,
    rankSep:    dt === 'database' ? 100 : dt === 'api' ? 180 : dt === 'low_level' ? 120 : 140,
  }
}

export default function App() {
  const {
    nodes, edges, isLoading, error,
    activeDiagramType, diagrams, diagramKey,
    lastRequests,
    setLoading, setError, setDiagram, setNodes, setEdges,
    setLastRequest, bumpKey, setActiveDiagramType,
  } = useDiagramStore()

  const [ollamaStatus, setOllamaStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')

  useEffect(() => {
    checkOllamaHealth().then((r) => setOllamaStatus(r.status))
  }, [])

  const renderDiagram = useCallback((diagram: NonNullable<typeof diagrams[DiagramType]>) => {
    const { nodes: rfNodes, edges: rfEdges } = mapToReactFlow(diagram)
    const layoutedNodes = applyLayoutWithGroups(rfNodes, rfEdges, getLayoutOptions(diagram.diagramType))
    setNodes(layoutedNodes)
    setEdges(rfEdges)
  }, [setNodes, setEdges])

  const handleGenerate = async (req: GenerateRequest) => {
    setLastRequest(req.diagram_type, req)
    setLoading(true)
    setError(null)
    try {
      const diagram = await generateDiagram(req)
      setDiagram(req.diagram_type, diagram)
      renderDiagram(diagram)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchTab = useCallback((type: DiagramType) => {
    const diagram = diagrams[type]
    setActiveDiagramType(type)
    bumpKey()
    if (!diagram) {
      setNodes([])
      setEdges([])
      return
    }
    renderDiagram(diagram)
  }, [diagrams, setActiveDiagramType, bumpKey, setNodes, setEdges, renderDiagram])

  const handleRegenerate = () => {
    const req = lastRequests[activeDiagramType]
    if (req) handleGenerate(req)
  }

  const currentDiagram = diagrams[activeDiagramType]
  const canRegenerate = Boolean(lastRequests[activeDiagramType]) && !isLoading

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-80 min-w-[320px] flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⬡</span>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">ArchSketch</h1>
                <p className="text-[11px] text-gray-400">AI System Design Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'offline' ? '#ef4444' : '#d1d5db' }}
              />
              <span className="text-[10px] text-gray-400">
                {ollamaStatus === 'online' ? 'Ollama' : ollamaStatus === 'offline' ? 'Ollama offline' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 px-5 py-4">
          <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0 gap-3">
          <DiagramTabs
            activeType={activeDiagramType}
            diagrams={diagrams}
            onSwitch={handleSwitchTab}
          />

          <div className="flex items-center gap-2 shrink-0">
            {error && (
              <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full max-w-xs truncate">
                {error}
              </span>
            )}
            {canRegenerate && (
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13.5 8A5.5 5.5 0 112.5 5M2.5 2v3h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-violet-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Generating diagram...</p>
              </div>
            </div>
          )}

          {!isLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">⬡</div>
                <p className="text-gray-400 text-sm">Select a diagram type and click Generate Diagram</p>
              </div>
            </div>
          )}

          {nodes.length > 0 && (
            <DiagramCanvas
              key={diagramKey}
              nodes={nodes}
              edges={edges}
              title={currentDiagram?.title ?? ''}
            />
          )}
        </div>
      </main>
    </div>
  )
}
