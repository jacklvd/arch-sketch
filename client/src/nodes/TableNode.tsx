import { Handle, Position } from '@xyflow/react'
import type { DbColumn } from '../types/diagram'

interface TableNodeData {
  label: string
  color: string
  metadata?: { columns?: DbColumn[] }
}

const handleStyle = { background: '#d1d5db', width: 7, height: 7, border: 'none' }

export function TableNode({ data }: { data: TableNodeData }) {
  const columns = data.metadata?.columns ?? []

  return (
    <div className="h-full w-full rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden select-none">
      <Handle type="source" position={Position.Top}    style={handleStyle} id="top-s" />
      <Handle type="target" position={Position.Top}    style={handleStyle} id="top-t" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-s" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-t" />
      <Handle type="source" position={Position.Left}   style={handleStyle} id="left-s" />
      <Handle type="target" position={Position.Left}   style={handleStyle} id="left-t" />
      <Handle type="source" position={Position.Right}  style={handleStyle} id="right-s" />
      <Handle type="target" position={Position.Right}  style={handleStyle} id="right-t" />

      {/* Header */}
      <div
        className="px-3 py-2 text-white text-xs font-bold tracking-wide flex items-center gap-1.5"
        style={{ backgroundColor: data.color }}
      >
        <svg viewBox="0 0 16 16" className="w-3 h-3 opacity-70 shrink-0" fill="currentColor">
          <rect x="1" y="1" width="14" height="4" rx="1" />
          <rect x="1" y="7" width="6" height="3" rx="0.5" />
          <rect x="9" y="7" width="6" height="3" rx="0.5" />
          <rect x="1" y="12" width="6" height="3" rx="0.5" />
          <rect x="9" y="12" width="6" height="3" rx="0.5" />
        </svg>
        <span>{data.label}</span>
      </div>

      {/* Column list */}
      <div className="divide-y divide-gray-50">
        {columns.map((col) => (
          <div
            key={col.name}
            className={`flex items-center gap-2 px-2.5 py-1.5 ${col.pk ? 'bg-amber-50/60' : ''}`}
          >
            {col.pk ? (
              <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 py-0.5 rounded leading-none shrink-0 tracking-wide">
                PK
              </span>
            ) : col.fk ? (
              <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1 py-0.5 rounded leading-none shrink-0 tracking-wide">
                FK
              </span>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span
              className={`text-[11px] flex-1 leading-tight ${
                col.pk ? 'font-bold text-gray-900 underline decoration-dotted' : 'text-gray-700'
              }`}
            >
              {col.name}
            </span>
            <span className="text-[10px] text-gray-400 font-mono shrink-0">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
