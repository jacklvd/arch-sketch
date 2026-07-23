import type { DiagramData, DiagramType } from '../types/diagram'

const VIEW_LABELS: Record<DiagramType, string> = {
  high_level: 'High-level',
  database: 'Database',
  api: 'API design',
  low_level: 'Low-level',
}

interface WorkspaceToolbarProps {
  activeType: DiagramType
  diagrams: Record<DiagramType, DiagramData | null>
  title: string
  nodeCount: number
  edgeCount: number
  canvasSummary: string
  providerStatus: 'online' | 'offline' | 'unknown'
  error: string | null
  canRegenerate: boolean
  onSwitch: (type: DiagramType) => void
  onRelayout: () => void
  onFit: () => void
  onExport: () => void
  onRegenerate: () => void
}

export function WorkspaceToolbar(props: WorkspaceToolbarProps) {
  const availableViews = (Object.keys(VIEW_LABELS) as DiagramType[])
    .filter((type) => props.diagrams[type] || type === props.activeType)

  return (
    <div className="shrink-0 overflow-x-auto border-b border-[var(--border)] bg-white">
      <p className="sr-only" aria-live="polite">{props.canvasSummary}</p>
      <div className="flex h-[58px] min-w-max items-center gap-3 px-3 md:px-5">
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{props.title || 'Untitled architecture'}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--muted)]">
              <span className={`status-dot status-dot--${props.providerStatus}`} />
              {props.providerStatus === 'online' ? 'Local model available' : props.providerStatus === 'offline' ? 'Cloud generation available' : 'Checking providers'}
              {props.nodeCount ? <span>{props.nodeCount} nodes · {props.edgeCount} connections</span> : null}
            </div>
          </div>
        </div>

        <nav aria-label="Generated views" className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1">
          {availableViews.map((type) => (
            <button
              key={type}
              type="button"
              aria-current={type === props.activeType ? 'page' : undefined}
              onClick={() => props.onSwitch(type)}
              className={`view-button ${type === props.activeType ? 'view-button--active' : ''}`}
            >
              {VIEW_LABELS[type]}
            </button>
          ))}
        </nav>

        {props.nodeCount ? (
          <span aria-hidden="true" className="whitespace-nowrap text-[10px] text-[var(--muted)] lg:hidden">
            {props.nodeCount}n · {props.edgeCount}e
          </span>
        ) : null}

        <div className="flex items-center gap-1.5">
          {props.canRegenerate ? <ToolbarButton label="Regenerate" onClick={props.onRegenerate}><RefreshIcon /></ToolbarButton> : null}
          <ToolbarButton label="Layout" onClick={props.onRelayout}><LayoutIcon /></ToolbarButton>
          <ToolbarButton label="Fit" onClick={props.onFit}><FitIcon /></ToolbarButton>
          <ToolbarButton label="Export" onClick={props.onExport}><ExportIcon /></ToolbarButton>
        </div>
      </div>
      {props.error ? <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{props.error}</div> : null}
    </div>
  )
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="toolbar-button" aria-label={label}>{children}<span>{label}</span></button>
}

function LayoutIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/><path d="M8 5.5h4.5V12"/></svg> }
function FitIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 3H3v4M13 3h4v4M17 13v4h-4M7 17H3v-4"/></svg> }
function ExportIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3v9m-3-3 3 3 3-3M4 14v3h12v-3"/></svg> }
function RefreshIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 7a6 6 0 1 0 .2 5M16 3v4h-4"/></svg> }
