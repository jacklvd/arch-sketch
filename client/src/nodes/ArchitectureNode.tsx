import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/iconRegistry'

interface ArchitectureNodeData {
  label: string
  icon: string
  color: string
  group?: string
  metadata?: { tech?: string[] }
}

export function ArchitectureNode({ data }: { data: ArchitectureNodeData }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border-2 bg-white shadow-sm px-3 py-2.5 min-w-[140px] max-w-[160px] cursor-default"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#9ca3af', width: 8, height: 8 }} />
      <div className="text-xl mb-1 leading-none">{getIcon(data.icon)}</div>
      <div className="text-[11px] font-semibold text-center text-gray-800 leading-tight">{data.label}</div>
      {data.metadata?.tech && data.metadata.tech.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
          {data.metadata.tech.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 leading-none"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#9ca3af', width: 8, height: 8 }} />
    </div>
  )
}
