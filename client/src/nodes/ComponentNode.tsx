import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/iconRegistry'

const ROLE_MAP: Array<[RegExp, string, string]> = [
  [/controller/i,            'Controller', 'bg-sky-100 text-sky-700'],
  [/service/i,               'Service',    'bg-teal-100 text-teal-700'],
  [/repositor|repo/i,        'Repository', 'bg-green-100 text-green-700'],
  [/facade/i,                'Facade',     'bg-pink-100 text-pink-700'],
  [/publisher|producer/i,    'Publisher',  'bg-orange-100 text-orange-700'],
  [/consumer|subscriber/i,   'Consumer',   'bg-red-100 text-red-700'],
  [/handler/i,               'Handler',    'bg-blue-100 text-blue-700'],
  [/middleware/i,            'Middleware', 'bg-amber-100 text-amber-700'],
  [/gateway/i,               'Gateway',   'bg-purple-100 text-purple-700'],
  [/validator/i,             'Validator', 'bg-yellow-100 text-yellow-700'],
  [/usecase|use.?case/i,     'UseCase',   'bg-violet-100 text-violet-700'],
  [/event.*bus|eventbus/i,   'EventBus',  'bg-rose-100 text-rose-700'],
]

function inferRole(label: string): [string, string] | null {
  for (const [re, role, cls] of ROLE_MAP) {
    if (re.test(label)) return [role, cls]
  }
  return null
}

const PATTERN_BADGE: Record<string, string> = {
  Observer:   'bg-purple-100 text-purple-700',
  Factory:    'bg-blue-100 text-blue-700',
  Singleton:  'bg-amber-100 text-amber-700',
  Strategy:   'bg-cyan-100 text-cyan-700',
  Decorator:  'bg-orange-100 text-orange-700',
  Builder:    'bg-indigo-100 text-indigo-700',
}

interface ComponentNodeData {
  label: string
  icon: string
  color: string
  metadata?: {
    tech?: string[]
    pattern?: string
  }
}

const handleStyle = { background: '#d1d5db', width: 8, height: 8, border: 'none' }

export function ComponentNode({ data }: { data: ComponentNodeData }) {
  const icon = getIcon(data.icon)
  const role = inferRole(data.label)
  const tech = data.metadata?.tech ?? []
  const pattern = data.metadata?.pattern
  const patternClass = pattern ? (PATTERN_BADGE[pattern] ?? 'bg-gray-100 text-gray-500') : null
  const hasBadges = tech.length > 0 || pattern

  return (
    <div
      className="rounded-xl border-2 bg-white shadow-sm overflow-hidden min-w-48 max-w-60 select-none"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left}   style={handleStyle} id="left-t" />
      <Handle type="target" position={Position.Top}    style={handleStyle} id="top-t" />
      <Handle type="source" position={Position.Right}  style={handleStyle} id="right-s" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bot-s" />

      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: hasBadges ? '1px solid #f3f4f6' : undefined }}>
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
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-800 leading-tight truncate">{data.label}</div>
          {role && (
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none mt-0.5 inline-block ${role[1]}`}>
              {role[0]}
            </span>
          )}
        </div>
      </div>

      {hasBadges && (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          {patternClass && pattern && (
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${patternClass}`}>
              {pattern}
            </span>
          )}
          {tech.slice(0, 3).map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 leading-none">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
