import type { DiagramType } from '../types/diagram'
import { generatedTypes, systemLabel, type SystemEntry } from '../lib/diagramPersistence'

const VIEW_LABELS: Record<DiagramType, string> = {
  high_level: 'High-level',
  database: 'Database',
  api: 'API design',
  low_level: 'Low-level',
}

interface SystemHistoryProps {
  systems: SystemEntry[]
  activeSignature: string
  onSelect: (signature: string) => void
}

export function SystemHistory({ systems, activeSignature, onSelect }: SystemHistoryProps) {
  if (!systems.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">No systems yet</p>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Generate a diagram and it lands here. Every view of the same requirements is
          grouped, so you can jump back to an earlier system without retyping it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <ul className="space-y-2">
        {systems.map((system) => {
          const views = generatedTypes(system)
          const active = system.signature === activeSignature
          return (
            <li key={system.signature}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(system.signature)}
                className={`system-card ${active ? 'system-card--active' : ''}`}
              >
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className={`system-dot ${active ? 'system-dot--active' : ''}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{systemLabel(system)}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">
                      {views.length
                        ? views.map((type) => VIEW_LABELS[type]).join(' · ')
                        : 'No views generated yet'}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 px-1 text-[11px] leading-4 text-[var(--muted)]">
        History is kept for this browser tab only and clears when you close it.
      </p>
    </div>
  )
}
