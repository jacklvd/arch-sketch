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
  const icon = getIcon(data.icon)

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl border bg-white px-3 py-2.5 shadow-sm cursor-default select-none"
      style={{ borderColor: data.color }}
    >
      <Handle id="left-t" type="target" position={Position.Left} style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid white' }} />
      <Handle id="top-t" type="target" position={Position.Top} style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid white' }} />

      <div className="mb-1.5 flex items-center justify-center w-9 h-9">
        {icon.src ? (
          <img src={icon.src} alt={data.label} className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-2xl leading-none">{icon.emoji}</span>
        )}
      </div>

      <div className="text-[11px] font-semibold text-center text-gray-800 leading-tight">{data.label}</div>

      {data.metadata?.tech && data.metadata.tech.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
          {data.metadata.tech.slice(0, 2).map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 leading-none">
              {t}
            </span>
          ))}
        </div>
      )}

      <Handle id="right-s" type="source" position={Position.Right} style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid white' }} />
      <Handle id="bottom-s" type="source" position={Position.Bottom} style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid white' }} />
    </div>
  )
}
