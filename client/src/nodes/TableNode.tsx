import { Handle, Position } from '@xyflow/react'
import type { DbColumn } from '../types/diagram'

interface TableNodeData {
  label: string
  color: string
  metadata?: { columns?: DbColumn[] }
}

export function TableNode({ data }: { data: TableNodeData }) {
  const columns = data.metadata?.columns ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden min-w-[200px]">
      <Handle type="target" position={Position.Left} style={{ background: '#9ca3af', width: 8, height: 8 }} />
      <div
        className="px-3 py-2 text-white text-xs font-bold tracking-wide"
        style={{ backgroundColor: data.color }}
      >
        {data.label}
      </div>
      <div className="divide-y divide-gray-100">
        {columns.map((col) => (
          <div key={col.name} className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-[10px] w-3 text-center">
              {col.pk ? '🔑' : col.fk ? '🔗' : '·'}
            </span>
            <span className="text-[11px] text-gray-800 font-medium flex-1">{col.name}</span>
            <span className="text-[10px] text-gray-400">{col.type}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#9ca3af', width: 8, height: 8 }} />
    </div>
  )
}
