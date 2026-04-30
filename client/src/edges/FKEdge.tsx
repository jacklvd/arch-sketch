import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

export function FKEdge({
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
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  // Parse "1:N", "N:M", "1:1" etc.
  const parts = typeof label === 'string' ? label.split(':') : []
  const sourceCard = parts[0]?.trim()
  const targetCard = parts[1]?.trim()

  // Place cardinality labels 12% from each endpoint
  const offset = 0.12
  const srcLabelX = sourceX + (targetX - sourceX) * offset
  const srcLabelY = sourceY + (targetY - sourceY) * offset
  const tgtLabelX = sourceX + (targetX - sourceX) * (1 - offset)
  const tgtLabelY = sourceY + (targetY - sourceY) * (1 - offset)

  const strokeColor = selected ? '#8b5cf6' : '#9ca3af'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: 1.5 }}
      />
      <EdgeLabelRenderer>
        {sourceCard && (
          <div
            className="absolute text-[10px] font-bold text-gray-500 bg-white px-1 rounded pointer-events-none leading-none"
            style={{ transform: `translate(-50%, -50%) translate(${srcLabelX}px,${srcLabelY}px)` }}
          >
            {sourceCard}
          </div>
        )}
        {targetCard && (
          <div
            className="absolute text-[10px] font-bold text-gray-500 bg-white px-1 rounded pointer-events-none leading-none"
            style={{ transform: `translate(-50%, -50%) translate(${tgtLabelX}px,${tgtLabelY}px)` }}
          >
            {targetCard}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
