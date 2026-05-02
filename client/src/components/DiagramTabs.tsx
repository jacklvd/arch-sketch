import type { DiagramData, DiagramType } from '../types/diagram'

const TABS: { value: DiagramType; label: string; color: string }[] = [
  { value: 'high_level', label: 'High-Level', color: '#3b82f6' },
  { value: 'database',   label: 'Database',   color: '#8b5cf6' },
  { value: 'api',        label: 'API Design',  color: '#f59e0b' },
  { value: 'low_level',  label: 'Low-Level',   color: '#10b981' },
]

interface DiagramTabsProps {
  activeType: DiagramType
  diagrams: Record<DiagramType, DiagramData | null>
  onSwitch: (type: DiagramType) => void
}

export function DiagramTabs({ activeType, diagrams, onSwitch }: DiagramTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {TABS.map((tab) => {
        const isActive = activeType === tab.value
        const hasData = diagrams[tab.value] !== null

        return (
          <button
            key={tab.value}
            onClick={() => onSwitch(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-white shadow-sm border'
                : hasData
                ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                : 'text-gray-300 cursor-default'
            }`}
            style={isActive ? { borderColor: tab.color, color: tab.color } : undefined}
            disabled={!hasData && !isActive}
          >
            {hasData && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
