import { useCallback, useEffect, useRef, useState } from 'react'
import { checkOllamaHealth, generateDiagram } from './api/generate'
import { DiagramCanvas } from './components/DiagramCanvas'
import type { DiagramCanvasHandle } from './components/DiagramCanvas'
import { EmptyCanvasState } from './components/EmptyCanvasState'
import { PromptComposer, STARTER_EXAMPLES } from './components/PromptComposer'
import { WorkspaceShell } from './components/WorkspaceShell'
import { WorkspaceToolbar } from './components/WorkspaceToolbar'
import { mapToReactFlow } from './lib/diagramMapper'
import { applyLayoutWithGroups } from './lib/layoutEngine'
import { useDiagramStore } from './store/diagramStore'
import type { DiagramData, DiagramType, GenerateRequest } from './types/diagram'

function getLayoutOptions(diagramType: DiagramType) {
  return {
    direction: (diagramType === 'database' || diagramType === 'low_level' ? 'TB' : 'LR') as 'LR' | 'TB',
    nodeSep: diagramType === 'high_level' ? 84 : 64,
    rankSep: diagramType === 'api' ? 180 : diagramType === 'high_level' ? 150 : 112,
  }
}

function setViewQuery(type: DiagramType) {
  const url = new URL(window.location.href)
  url.searchParams.set('view', type)
  window.history.replaceState(null, '', url)
}

function getViewQuery(): DiagramType | null {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'high_level' || view === 'database' || view === 'api' || view === 'low_level' ? view : null
}

export default function App() {
  const {
    nodes, edges, isLoading, error,
    activeDiagramType, diagrams, diagramKey,
    lastRequests,
    setLoading, setError, setDiagram, setNodes, setEdges,
    setLastRequest, bumpKey, setActiveDiagramType,
  } = useDiagramStore()
  const [providerStatus, setProviderStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')
  const [promptOpen, setPromptOpen] = useState(false)
  const canvasRef = useRef<DiagramCanvasHandle>(null)

  useEffect(() => {
    checkOllamaHealth().then((result) => setProviderStatus(result.status))
  }, [])

  useEffect(() => {
    const requestedView = getViewQuery()
    if (requestedView && requestedView !== activeDiagramType) {
      setActiveDiagramType(requestedView)
      setNodes([])
      setEdges([])
    }
  }, [activeDiagramType, setActiveDiagramType, setEdges, setNodes])

  const renderDiagram = useCallback(async (diagram: DiagramData) => {
    const mapped = mapToReactFlow(diagram)
    const layout = await applyLayoutWithGroups(
      mapped.nodes,
      mapped.edges,
      getLayoutOptions(diagram.diagramType),
    )
    setNodes(layout.nodes)
    setEdges(layout.edges)
  }, [setEdges, setNodes])

  const handleGenerate = async (request: GenerateRequest) => {
    setLastRequest(request.diagram_type, request)
    setLoading(true)
    setError(null)
    try {
      const diagram = await generateDiagram(request)
      setDiagram(request.diagram_type, diagram)
      setViewQuery(request.diagram_type)
      await renderDiagram(diagram)
      setPromptOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchView = useCallback((type: DiagramType) => {
    const diagram = diagrams[type]
    setActiveDiagramType(type)
    setViewQuery(type)
    bumpKey()
    if (!diagram) {
      setNodes([])
      setEdges([])
      return
    }
    void renderDiagram(diagram)
  }, [bumpKey, diagrams, renderDiagram, setActiveDiagramType, setEdges, setNodes])

  const handleRelayout = () => {
    const diagram = diagrams[activeDiagramType]
    if (!diagram) return
    bumpKey()
    void renderDiagram(diagram)
  }

  const currentDiagram = diagrams[activeDiagramType]
  const canRegenerate = Boolean(lastRequests[activeDiagramType]) && !isLoading
  const prompt = <PromptComposer onSubmit={handleGenerate} isLoading={isLoading} />
  const visibleNodes = nodes.filter((node) => node.type !== 'groupNode')
  const nodeLabels = new Map(visibleNodes.map((node) => [node.id, String(node.data.label ?? node.id)]))
  const relationships = edges.map((edge) => {
    const source = nodeLabels.get(edge.source) ?? edge.source
    const target = nodeLabels.get(edge.target) ?? edge.target
    const relationship = edge.label ? ` (${String(edge.label)})` : ''
    return `${source} to ${target}${relationship}`
  })
  const canvasSummary = visibleNodes.length
    ? `${currentDiagram?.title ?? 'Architecture diagram'}. Nodes: ${visibleNodes.map((node) => nodeLabels.get(node.id)).join(', ')}. Relationships: ${relationships.join('; ') || 'none'}.`
    : 'No diagram generated yet.'

  return (
    <WorkspaceShell
      prompt={prompt}
      promptOpen={promptOpen}
      onOpenPrompt={() => setPromptOpen(true)}
      onClosePrompt={() => setPromptOpen(false)}
      toolbar={(
        <WorkspaceToolbar
          activeType={activeDiagramType}
          diagrams={diagrams}
          title={currentDiagram?.title ?? 'Architecture workspace'}
          nodeCount={visibleNodes.length}
          edgeCount={edges.length}
          canvasSummary={canvasSummary}
          providerStatus={providerStatus}
          error={error}
          canRegenerate={canRegenerate}
          onSwitch={handleSwitchView}
          onRelayout={handleRelayout}
          onFit={() => canvasRef.current?.fit()}
          onExport={() => { void canvasRef.current?.exportPng() }}
          onRegenerate={() => {
            const request = lastRequests[activeDiagramType]
            if (request) void handleGenerate(request)
          }}
        />
      )}
      canvas={(
        <>
          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--paper)]/80 backdrop-blur-[2px]">
              <div className="rounded-xl border border-[var(--border)] bg-white px-5 py-4 shadow-lg">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span className="loading-dot" aria-hidden="true" />
                  Generating {activeDiagramType.replace('_', ' ')} view…
                </div>
                <p className="mt-1 pl-6 text-xs text-[var(--muted)]">Mapping services, relationships, and constraints.</p>
              </div>
            </div>
          ) : null}

          {!isLoading && nodes.length === 0 ? (
            <EmptyCanvasState
              onOpenPrompt={() => setPromptOpen(true)}
              onGenerateExample={() => { void handleGenerate(STARTER_EXAMPLES[0].request) }}
            />
          ) : null}

          {nodes.length > 0 ? (
            <DiagramCanvas
              ref={canvasRef}
              key={diagramKey}
              nodes={nodes}
              edges={edges}
              title={currentDiagram?.title ?? ''}
            />
          ) : null}
        </>
      )}
    />
  )
}
