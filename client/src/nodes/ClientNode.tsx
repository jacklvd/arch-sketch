import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/iconRegistry'

interface ClientNodeData {
  label: string
  icon: string
  color: string
  group?: string
}

const handleStyle = { background: '#d1d5db', width: 8, height: 8, border: 'none' }

export function ClientNode({ data }: { data: ClientNodeData }) {
  const icon = getIcon(data.icon)

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-2xl border bg-white shadow-sm px-4 py-3 select-none cursor-default"
      style={{ borderColor: `${data.color}60`, backgroundColor: `${data.color}06` }}
    >
      <Handle id="left-t" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="top-t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="right-s" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="bottom-s" type="source" position={Position.Bottom} style={handleStyle} />

      <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-2" style={{ backgroundColor: `${data.color}15` }}>
        {icon.src ? (
          <img src={icon.src} alt={data.label} className="w-7 h-7 object-contain" />
        ) : (
          <span className="text-2xl leading-none">{icon.emoji}</span>
        )}
      </div>

      <div className="text-[11px] font-semibold text-gray-700 text-center leading-tight">{data.label}</div>
    </div>
  )
}
