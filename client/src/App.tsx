import { useCallback, useEffect, useRef, useState } from 'react'
import { checkOllamaHealth, generateDiagram } from './api/generate'
import { DiagramCanvas } from './components/DiagramCanvas'
import type { DiagramCanvasHandle } from './components/DiagramCanvas'
import { EmptyCanvasState } from './components/EmptyCanvasState'
import { PromptComposer, STARTER_EXAMPLES } from './components/PromptComposer'
import { WorkspaceShell } from './components/WorkspaceShell'
import { WorkspaceToolbar } from './components/WorkspaceToolbar'
import { SystemHistory } from './components/SystemHistory'
import { mapToReactFlow } from './lib/diagramMapper'
import { DIAGRAM_TYPES } from './lib/diagramPersistence'
import { applyLayoutWithGroups } from './lib/layoutEngine'
import { activeDiagrams, activeSystem, useDiagramStore } from './store/diagramStore'
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
    activeDiagramType, diagramKey,
    systems, activeSignature,
    setLoading, setError, setDiagram, setNodes, setEdges,
    startSystem, selectSystem, bumpKey, setActiveDiagramType,
  } = useDiagramStore()
  const diagrams = useDiagramStore(activeDiagrams)
  const currentSystem = useDiagramStore(activeSystem)
  const [providerStatus, setProviderStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')
  const [promptOpen, setPromptOpen] = useState(false)
  const [railTab, setRailTab] = useState<'describe' | 'history'>('describe')
  // Rotate which starter the empty state offers so a fresh workspace does not
  // always pitch the same system. Picked once per mount, never per render.
  const [starterExample] = useState(() => STARTER_EXAMPLES[Math.floor(Math.random() * STARTER_EXAMPLES.length)])
  const canvasRef = useRef<DiagramCanvasHandle>(null)

  useEffect(() => {
    checkOllamaHealth().then((result) => setProviderStatus(result.status))
  }, [])

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

  // Mount only: pick the view from ?view= and repaint it from the session cache
  // if it survived a refresh. Every later switch renders via handleSwitchView.
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const view = getViewQuery() ?? activeDiagramType
    if (view !== activeDiagramType) setActiveDiagramType(view)
    const cached = diagrams[view]
    if (cached) void renderDiagram(cached)
  }, [activeDiagramType, diagrams, renderDiagram, setActiveDiagramType])

  const handleGenerate = async (request: GenerateRequest) => {
    startSystem(request)
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

  const handleSelectSystem = useCallback((signature: string) => {
    const entry = systems.find((system) => system.signature === signature)
    if (!entry) return
    selectSystem(signature)
    // Land on a view this system actually has, so revisiting never shows a
    // blank canvas just because the last system used a different view.
    const type = entry.diagrams[activeDiagramType]
      ? activeDiagramType
      : DIAGRAM_TYPES.find((candidate) => entry.diagrams[candidate]) ?? activeDiagramType
    setActiveDiagramType(type)
    setViewQuery(type)
    bumpKey()
    const diagram = entry.diagrams[type]
    if (diagram) {
      void renderDiagram(diagram)
      return
    }
    setNodes([])
    setEdges([])
  }, [activeDiagramType, bumpKey, renderDiagram, selectSystem, setActiveDiagramType, setEdges, setNodes, systems])

  const handleRelayout = () => {
    const diagram = diagrams[activeDiagramType]
    if (!diagram) return
    bumpKey()
    void renderDiagram(diagram)
  }

  const currentDiagram = diagrams[activeDiagramType]
  const canRegenerate = Boolean(currentDiagram) && !isLoading
  const prompt = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Workspace rail" className="flex shrink-0 border-b border-[var(--border)]">
        <button
          type="button" role="tab" id="rail-tab-describe"
          aria-selected={railTab === 'describe'} aria-controls="rail-panel-describe"
          onClick={() => setRailTab('describe')} className="rail-tab"
        >
          Describe
        </button>
        <button
          type="button" role="tab" id="rail-tab-history"
          aria-selected={railTab === 'history'} aria-controls="rail-panel-history"
          onClick={() => setRailTab('history')} className="rail-tab"
        >
          History
          {systems.length ? <span className="rail-tab-count">{systems.length}</span> : null}
        </button>
      </div>
      {railTab === 'describe' ? (
        <div id="rail-panel-describe" role="tabpanel" aria-labelledby="rail-tab-describe" className="flex min-h-0 flex-1 flex-col">
          {/* Keyed on the active system so revisiting one refills the form. */}
          <PromptComposer
            key={activeSignature || 'new'}
            initialRequest={currentSystem?.request}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div id="rail-panel-history" role="tabpanel" aria-labelledby="rail-tab-history" className="flex min-h-0 flex-1 flex-col">
          <SystemHistory systems={systems} activeSignature={activeSignature} onSelect={handleSelectSystem} />
        </div>
      )}
    </div>
  )
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
            const request = currentSystem?.request
            if (request) void handleGenerate({ ...request, diagram_type: activeDiagramType })
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
              exampleLabel={starterExample.label}
              onGenerateExample={() => { void handleGenerate(starterExample.request) }}
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
