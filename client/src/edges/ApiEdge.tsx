import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

const METHOD_COLORS: Record<string, string> = {
  GET:     '#10b981',
  POST:    '#3b82f6',
  PUT:     '#f59e0b',
  PATCH:   '#f97316',
  DELETE:  '#ef4444',
  HTTPS:   '#6366f1',
  HTTP:    '#6366f1',
  WSS:     '#8b5cf6',
  WS:      '#8b5cf6',
  GRPC:    '#06b6d4',
  DEFAULT: '#9ca3af',
}

function getMethodColor(label: string): { color: string; method: string; rest: string } {
  const str = typeof label === 'string' ? label.trim() : ''
  const parts = str.split(/\s+/)
  const candidate = parts[0]?.toUpperCase() ?? ''
  const color = METHOD_COLORS[candidate] ?? METHOD_COLORS.DEFAULT
  const method = METHOD_COLORS[candidate] ? candidate : ''
  const rest = method ? parts.slice(1).join(' ') : str
  return { color, method, rest }
}

export function ApiEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const { color, method, rest } = getMethodColor(label as string)
  const strokeColor = selected ? color : `${color}cc`
  const markerId = `api-arrow-${color.replace('#', '')}`

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: selected ? 2.5 : 1.8 }}
        markerEnd={`url(#${markerId})`}
      />

      {(method || rest) && (
        <EdgeLabelRenderer>
          <div
            className="absolute flex items-center gap-1 bg-white rounded-full shadow-sm border border-gray-100 px-2 py-0.5 pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {method && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
                style={{ color, backgroundColor: `${color}18` }}
              >
                {method}
              </span>
            )}
            {rest && (
              <span className="text-[10px] text-gray-500 font-mono leading-none">{rest}</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
