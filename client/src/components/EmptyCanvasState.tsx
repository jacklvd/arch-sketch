interface EmptyCanvasStateProps {
  onOpenPrompt: () => void
  onGenerateExample: () => void
  /** Label of the starter this button will actually generate — passed in so the
   *  copy cannot drift from whichever example App picks. */
  exampleLabel: string
}

export function EmptyCanvasState({ onOpenPrompt, onGenerateExample, exampleLabel }: EmptyCanvasStateProps) {
  return (
    <div className="technical-grid absolute inset-0 flex items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-[620px] text-center">
        <div className="empty-diagram mx-auto mb-8" aria-hidden="true">
          <span className="empty-node empty-node--client">Client</span>
          <span className="empty-node empty-node--gateway">Gateway</span>
          <span className="empty-node empty-node--service">Service</span>
          <span className="empty-node empty-node--data">Data</span>
          {/* Coordinates track .empty-node positions: client 0-104, gateway 183-287,
              service centred on y=34, data on y=146 (all within the 480x180 box). */}
          <svg viewBox="0 0 480 180" fill="none">
            <path d="M104 90h68M231 64V34h127M231 116V146h127" />
            <path d="M166 84l8 6-8 6M352 28l8 6-8 6M352 140l8 6-8 6" />
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
            Generate the {exampleLabel} example
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
