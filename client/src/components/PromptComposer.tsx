import { useEffect, useRef, useState } from 'react'
import type { DiagramType, GenerateRequest } from '../types/diagram'
import { loadPromptDraft, savePromptDraft } from '../lib/promptPersistence'

interface PromptComposerProps {
  onSubmit: (request: GenerateRequest) => void
  isLoading: boolean
  /** Requirements of the system being revisited. App remounts this component
   *  (keyed on the active system) so revisiting refills the form; when absent
   *  the saved draft is restored instead. */
  initialRequest?: GenerateRequest
}

const DIAGRAM_TYPES: { value: DiagramType; label: string; description: string }[] = [
  { value: 'high_level', label: 'High-level', description: 'Services and system boundaries' },
  { value: 'database', label: 'Database', description: 'Tables and relationships' },
  { value: 'api', label: 'API design', description: 'Endpoints and service calls' },
  { value: 'low_level', label: 'Low-level', description: 'Classes and implementation patterns' },
]

const STARTER_EXAMPLES: { label: string; request: GenerateRequest }[] = [
  {
    label: 'Video platform',
    request: {
      quest: 'Design a resilient video streaming platform',
      functional_reqs: 'Upload video, transcode media, manage playback, comments, and recommendations',
      non_functional_reqs: '10M daily users, 99.9% availability, global delivery, uploads must resume',
      design_description: 'Use asynchronous media processing, object storage, a CDN, and event-driven services',
      diagram_type: 'high_level',
    },
  },
  {
    label: 'Commerce platform',
    request: {
      quest: 'Design a multi-region commerce platform',
      functional_reqs: 'Catalog, search, cart, checkout, inventory, orders, and notifications',
      non_functional_reqs: 'Black Friday traffic, strong payment consistency, resilient inventory reservations',
      design_description: 'Use domain services, transactional outbox events, cache, and regional read replicas',
      diagram_type: 'high_level',
    },
  },
  {
    label: 'Realtime chat',
    request: {
      quest: 'Design a realtime collaboration and chat system',
      functional_reqs: 'Rooms, direct messages, presence, typing, attachments, and message search',
      non_functional_reqs: 'Low latency, ordered room messages, offline delivery, and horizontal scale',
      design_description: 'Use WebSockets, partitioned event streams, durable storage, and presence caching',
      diagram_type: 'api',
    },
  },
]

export function PromptComposer({ onSubmit, isLoading, initialRequest }: PromptComposerProps) {
  const [form, setForm] = useState<GenerateRequest>(() => initialRequest ?? loadPromptDraft())
  const [constraintsOpen, setConstraintsOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const questRef = useRef<HTMLTextAreaElement>(null)
  const functionalRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    savePromptDraft(form)
  }, [form])

  const update = (field: keyof GenerateRequest) => (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const selectExample = (request: GenerateRequest) => {
    setForm(request)
  }

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!form.quest.trim()) {
          setValidationError('Describe what you are designing before generating the diagram.')
          questRef.current?.focus()
          return
        }
        if (!form.functional_reqs.trim() || !form.non_functional_reqs.trim() || !form.design_description.trim()) {
          setConstraintsOpen(true)
          setValidationError('Complete all three constraints before generating the diagram.')
          window.requestAnimationFrame(() => functionalRef.current?.focus())
          return
        }
        setValidationError(null)
        onSubmit(form)
      }}
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <fieldset>
          <legend className="workspace-label">Diagram type</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DIAGRAM_TYPES.map((type) => {
              const selected = form.diagram_type === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setForm((current) => ({ ...current, diagram_type: type.value }))}
                  className={`diagram-type-button ${selected ? 'diagram-type-button--active' : ''}`}
                >
                  <span className="font-semibold">{type.label}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">{type.description}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="system-prompt" className="workspace-label">
            What are you designing?
          </label>
          <textarea
            ref={questRef}
            id="system-prompt"
            required
            aria-invalid={validationError && !form.quest.trim() ? true : undefined}
            rows={4}
            value={form.quest}
            onChange={update('quest')}
            placeholder="Describe the product, workflow, or system you want to design…"
            className="workspace-textarea mt-2"
          />
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Starter examples">
            {STARTER_EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                className="starter-button"
                onClick={() => selectExample(example.request)}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <details
          className="constraints-disclosure"
          open={constraintsOpen}
          onToggle={(event) => setConstraintsOpen(event.currentTarget.open)}
        >
          <summary>Add constraints</summary>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="functional-requirements" className="workspace-label">Functional requirements</label>
              <textarea
                ref={functionalRef}
                id="functional-requirements"
                required
                rows={3}
                value={form.functional_reqs}
                onChange={update('functional_reqs')}
                placeholder="Capabilities, user flows, and integrations"
                className="workspace-textarea mt-2"
              />
            </div>
            <div>
              <label htmlFor="quality-requirements" className="workspace-label">Scale and quality</label>
              <textarea
                id="quality-requirements"
                required
                rows={3}
                value={form.non_functional_reqs}
                onChange={update('non_functional_reqs')}
                placeholder="Traffic, latency, availability, security, and compliance"
                className="workspace-textarea mt-2"
              />
            </div>
            <div>
              <label htmlFor="design-guidance" className="workspace-label">Design guidance</label>
              <textarea
                id="design-guidance"
                required
                rows={3}
                value={form.design_description}
                onChange={update('design_description')}
                placeholder="Preferred technologies, patterns, and trade-offs"
                className="workspace-textarea mt-2"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="border-t border-[var(--border)] bg-white p-5">
        {validationError ? <p role="alert" className="mb-3 text-xs leading-5 text-red-700">{validationError}</p> : null}
        <button type="submit" disabled={isLoading} className="primary-button w-full">
          {isLoading ? (
            <>
              <span className="loading-dot" aria-hidden="true" />
              Generating diagram…
            </>
          ) : 'Generate diagram'}
        </button>
      </div>
    </form>
  )
}

export { STARTER_EXAMPLES }
