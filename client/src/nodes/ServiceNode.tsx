import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/iconRegistry'
import type { ApiEndpoint } from '../types/diagram'

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

interface ServiceNodeData {
  label: string
  icon: string
  color: string
  metadata?: { endpoints?: ApiEndpoint[] }
}

export function ServiceNode({ data }: { data: ServiceNodeData }) {
  const endpoints = data.metadata?.endpoints ?? []

  return (
    <div
      className="rounded-xl border-2 bg-white shadow-sm overflow-hidden min-w-[200px] max-w-[240px]"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#9ca3af', width: 8, height: 8 }} />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <span className="text-base">{getIcon(data.icon)}</span>
        <span className="text-xs font-bold text-gray-800">{data.label}</span>
      </div>
      {endpoints.length > 0 && (
        <div className="divide-y divide-gray-50">
          {endpoints.slice(0, 4).map((ep, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {ep.method}
              </span>
              <span className="text-[10px] text-gray-600 font-mono truncate flex-1">{ep.path}</span>
              <span className="text-[9px] text-gray-400 shrink-0">{ep.response.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#9ca3af', width: 8, height: 8 }} />
    </div>
  )
}
