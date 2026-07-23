import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/iconRegistry'
import type { ApiEndpoint } from '../types/diagram'

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-green-100 text-green-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

const MAX_ENDPOINTS = 5

interface ServiceNodeData {
  label: string
  icon: string
  color: string
  metadata?: { endpoints?: ApiEndpoint[] }
}

const handleStyle = { background: '#d1d5db', width: 8, height: 8, border: 'none' }

export function ServiceNode({ data }: { data: ServiceNodeData }) {
  const endpoints = data.metadata?.endpoints ?? []
  const shown = endpoints.slice(0, MAX_ENDPOINTS)
  const overflow = endpoints.length - MAX_ENDPOINTS

  const icon = getIcon(data.icon)

  return (
    <div
      className="h-full w-full rounded-xl border bg-white shadow-sm overflow-hidden select-none"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left}   style={handleStyle} id="left-t" />
      <Handle type="target" position={Position.Top}    style={handleStyle} id="top-t" />
      <Handle type="source" position={Position.Right}  style={handleStyle} id="right-s" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-s" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{ backgroundColor: `${data.color}18` }}
        >
          {icon.src ? (
            <img src={icon.src} className="w-5 h-5 object-contain" alt="" />
          ) : (
            <span className="text-sm leading-none">{icon.emoji}</span>
          )}
        </div>
        <span className="text-xs font-bold text-gray-800 leading-tight">{data.label}</span>
      </div>

      {/* Endpoints */}
      {shown.length > 0 && (
        <div className="divide-y divide-gray-50">
          {shown.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 ${
                  METHOD_COLORS[ep.method] ?? 'bg-gray-100 text-gray-500'
                }`}
              >
                {ep.method}
              </span>
              <span className="text-[10px] text-gray-600 font-mono truncate flex-1">{ep.path}</span>
              <span className="text-[9px] text-gray-400 shrink-0 tabular-nums">
                {ep.response.split(' ')[0]}
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <div className="px-3 py-1 text-[9px] text-gray-400 text-center">
              +{overflow} more endpoint{overflow > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
