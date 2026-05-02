import { Handle, Position } from '@xyflow/react'
import type { ClassAttribute, ClassMethod } from '../types/diagram'

const VISIBILITY_COLOR: Record<string, string> = {
  '+': 'text-green-500',
  '-': 'text-red-400',
  '#': 'text-amber-500',
}

const PATTERN_BADGE: Record<string, string> = {
  Observer:   'bg-purple-100 text-purple-700',
  Factory:    'bg-blue-100 text-blue-700',
  Singleton:  'bg-amber-100 text-amber-700',
  Repository: 'bg-green-100 text-green-700',
  Facade:     'bg-pink-100 text-pink-700',
  Strategy:   'bg-cyan-100 text-cyan-700',
  Decorator:  'bg-orange-100 text-orange-700',
  Builder:    'bg-indigo-100 text-indigo-700',
  Service:    'bg-teal-100 text-teal-700',
  Controller: 'bg-sky-100 text-sky-700',
}

const MAX_ATTRS = 6
const MAX_METHODS = 6

interface ClassNodeData {
  label: string
  color: string
  metadata?: {
    attributes?: ClassAttribute[]
    methods?: ClassMethod[]
    pattern?: string
    stereotype?: string
  }
}

const handleStyle = { background: '#d1d5db', width: 8, height: 8, border: 'none' }

export function ClassNode({ data }: { data: ClassNodeData }) {
  const attrs = data.metadata?.attributes ?? []
  const methods = data.metadata?.methods ?? []
  const shownAttrs = attrs.slice(0, MAX_ATTRS)
  const shownMethods = methods.slice(0, MAX_METHODS)
  const pattern = data.metadata?.pattern
  const stereotype = data.metadata?.stereotype
  const badgeClass = pattern ? (PATTERN_BADGE[pattern] ?? 'bg-gray-100 text-gray-500') : null

  return (
    <div
      className="rounded-xl border-2 bg-white shadow-sm overflow-hidden min-w-52 max-w-72 select-none"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left}   style={handleStyle} id="left-t" />
      <Handle type="target" position={Position.Top}    style={handleStyle} id="top-t" />
      <Handle type="source" position={Position.Right}  style={handleStyle} id="right-s" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bot-s" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100" style={{ backgroundColor: `${data.color}12` }}>
        {stereotype && (
          <div className="text-[9px] italic text-center text-gray-400 leading-none mb-0.5">{stereotype}</div>
        )}
        <div className="text-xs font-bold text-center text-gray-800">{data.label}</div>
        {badgeClass && pattern && (
          <div className="flex justify-center mt-1">
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${badgeClass}`}>
              {pattern}
            </span>
          </div>
        )}
      </div>

      {/* Attributes */}
      {shownAttrs.length > 0 && (
        <div className="px-3 py-1.5 border-b border-gray-100">
          {shownAttrs.map((a, i) => (
            <div key={i} className="flex items-baseline gap-1 py-0.5">
              <span className={`text-[10px] font-bold leading-none shrink-0 w-3 ${VISIBILITY_COLOR[a.visibility] ?? 'text-gray-400'}`}>
                {a.visibility}
              </span>
              <span className="text-[10px] text-gray-700 font-mono">{a.name}</span>
              <span className="text-[9px] text-gray-400 font-mono">: {a.type}</span>
            </div>
          ))}
          {attrs.length > MAX_ATTRS && (
            <div className="text-[9px] text-gray-400 mt-0.5">+{attrs.length - MAX_ATTRS} more</div>
          )}
        </div>
      )}

      {/* Methods */}
      {shownMethods.length > 0 && (
        <div className="px-3 py-1.5">
          {shownMethods.map((m, i) => (
            <div key={i} className="flex items-baseline gap-0.5 py-0.5 flex-wrap">
              <span className={`text-[10px] font-bold leading-none shrink-0 w-3 ${VISIBILITY_COLOR[m.visibility] ?? 'text-gray-400'}`}>
                {m.visibility}
              </span>
              <span className="text-[10px] text-gray-700 font-mono">{m.name}({m.params ?? ''})</span>
              {m.returnType && (
                <span className="text-[9px] text-gray-400 font-mono">: {m.returnType}</span>
              )}
            </div>
          ))}
          {methods.length > MAX_METHODS && (
            <div className="text-[9px] text-gray-400 mt-0.5">+{methods.length - MAX_METHODS} more</div>
          )}
        </div>
      )}
    </div>
  )
}
