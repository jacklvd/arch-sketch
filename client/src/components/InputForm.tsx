import { useState } from 'react'
import type { GenerateRequest, DiagramType } from '../types/diagram'

interface InputFormProps {
  onSubmit: (req: GenerateRequest) => void
  isLoading: boolean
}

const DIAGRAM_TYPES: { value: DiagramType; label: string; desc: string }[] = [
  { value: 'high_level', label: 'High-Level', desc: 'Services & connections' },
  { value: 'database', label: 'Database', desc: 'Tables & relations' },
  { value: 'api', label: 'API Design', desc: 'Endpoints & HTTP flows' },
  { value: 'low_level', label: 'Low-Level', desc: 'Classes & patterns' },
]

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [form, setForm] = useState<GenerateRequest>({
    quest: '',
    functional_reqs: '',
    non_functional_reqs: '',
    design_description: '',
    diagram_type: 'high_level',
  })

  const update =
    (field: keyof GenerateRequest) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const textareaClass =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-300 bg-white'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Diagram Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DIAGRAM_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, diagram_type: dt.value }))}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                form.diagram_type === dt.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold">{dt.label}</div>
              <div className="text-gray-400 mt-0.5">{dt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          System Quest
        </label>
        <textarea
          value={form.quest}
          onChange={update('quest')}
          placeholder="e.g. Build a video streaming platform like YouTube"
          className={textareaClass}
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Functional Requirements
        </label>
        <textarea
          value={form.functional_reqs}
          onChange={update('functional_reqs')}
          placeholder="e.g. User auth, video upload, real-time comments, recommendations"
          className={textareaClass}
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Non-Functional Requirements
        </label>
        <textarea
          value={form.non_functional_reqs}
          onChange={update('non_functional_reqs')}
          placeholder="e.g. 10M DAU, 99.9% uptime, &lt;200ms latency, GDPR compliant"
          className={textareaClass}
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Design Description
        </label>
        <textarea
          value={form.design_description}
          onChange={update('design_description')}
          placeholder="Describe the overall approach, key tech choices, and design decisions..."
          className={textareaClass}
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Diagram'
        )}
      </button>
    </form>
  )
}
