interface EmptyCanvasStateProps {
  onOpenPrompt: () => void
  onGenerateExample: () => void
}

export function EmptyCanvasState({ onOpenPrompt, onGenerateExample }: EmptyCanvasStateProps) {
  return (
    <div className="technical-grid absolute inset-0 flex items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-[620px] text-center">
        <div className="empty-diagram mx-auto mb-8" aria-hidden="true">
          <span className="empty-node empty-node--client">Client</span>
          <span className="empty-node empty-node--gateway">Gateway</span>
          <span className="empty-node empty-node--service">Service</span>
          <span className="empty-node empty-node--data">Data</span>
          <svg viewBox="0 0 480 180" fill="none">
            <path d="M104 90h68M286 90h72M231 64V34h127" />
            <path d="m166 84 8 6-8 6m186-12 8 6-8 6m0-68 8 6-8 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)] md:text-3xl">
          Start with a system, shape the architecture.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
          Describe the workload and constraints. ArchSketch turns them into connected, editable system views.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onGenerateExample} className="primary-button">
            Generate a video platform
          </button>
          <button type="button" onClick={onOpenPrompt} className="secondary-button md:hidden">
            Describe your system
          </button>
        </div>
        <p className="mt-5 hidden text-xs text-[var(--muted)] md:block">Or choose a starter in the prompt rail and tailor its constraints.</p>
      </div>
    </div>
  )
}
