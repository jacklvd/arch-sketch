import { generateDiagram } from './api/generate'
import { InputForm } from './components/InputForm'
import { DiagramCanvas } from './components/DiagramCanvas'
import { mapToReactFlow } from './lib/diagramMapper'
import { applyLayoutWithGroups } from './lib/layoutEngine'
import { useDiagramStore } from './store/diagramStore'
import type { GenerateRequest } from './types/diagram'

export default function App() {
  const {
    nodes,
    edges,
    isLoading,
    error,
    activeDiagramType,
    diagrams,
    diagramKey,
    setLoading,
    setError,
    setDiagram,
    setNodes,
    setEdges,
  } = useDiagramStore()

  const handleGenerate = async (req: GenerateRequest) => {
    setLoading(true)
    setError(null)
    try {
      const diagram = await generateDiagram(req)
      setDiagram(req.diagram_type, diagram)
      const { nodes: rfNodes, edges: rfEdges } = mapToReactFlow(diagram)
      const layoutedNodes = applyLayoutWithGroups(rfNodes, rfEdges)
      setNodes(layoutedNodes)
      setEdges(rfEdges)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const currentDiagram = diagrams[activeDiagramType]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-80 min-w-[320px] flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">⬡</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">ArchSketch</h1>
              <p className="text-[11px] text-gray-400">AI System Design Generator</p>
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
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0 min-h-[46px]">
          <span className="text-sm text-gray-500 truncate">
            {currentDiagram ? currentDiagram.title : 'No diagram yet'}
          </span>
          {error && (
            <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full shrink-0 ml-3 max-w-xs truncate">
              {error}
            </span>
          )}
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
                <p className="text-gray-400 text-sm">Fill in the form and click Generate Diagram</p>
              </div>
            </div>
          )}

          {nodes.length > 0 && (
            <DiagramCanvas key={diagramKey} nodes={nodes} edges={edges} />
          )}
        </div>
      </main>
    </div>
  )
}
