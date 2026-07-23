import { useEffect, useRef, useState } from 'react'

interface WorkspaceShellProps {
  prompt: React.ReactNode
  toolbar: React.ReactNode
  canvas: React.ReactNode
  promptOpen: boolean
  onOpenPrompt: () => void
  onClosePrompt: () => void
}

export function WorkspaceShell({
  prompt,
  toolbar,
  canvas,
  promptOpen,
  onOpenPrompt,
  onClosePrompt,
}: WorkspaceShellProps) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const dialogRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!promptOpen || !isMobile) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const main = mainRef.current
    main?.setAttribute('inert', '')
    const focusableSelector = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    const focusFirst = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClosePrompt()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFirst)
      window.removeEventListener('keydown', onKeyDown)
      main?.removeAttribute('inert')
      previouslyFocused?.focus()
    }
  }, [isMobile, onClosePrompt, promptOpen])

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      {!isMobile ? (
        <aside className="flex w-[336px] shrink-0 flex-col border-r border-[var(--border)] bg-white">
          <BrandHeader />
          {prompt}
        </aside>
      ) : null}

      <main ref={mainRef} className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-white px-4 md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-lg font-semibold tracking-[-0.02em]">ArchSketch</span>
          </div>
          <button type="button" onClick={onOpenPrompt} className="primary-button px-4 py-2">
            <EditIcon />
            Describe
          </button>
        </div>
        {toolbar}
        <div className="relative min-h-0 flex-1">{canvas}</div>
      </main>

      {promptOpen && isMobile ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close prompt"
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"
            onClick={onClosePrompt}
          />
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Describe your system"
            className="absolute inset-y-0 left-0 flex w-[min(92vw,380px)] flex-col bg-white shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
              <div>
                <h2 className="font-semibold">Describe your system</h2>
                <p className="text-xs text-[var(--muted)]">Shape the view before generating.</p>
              </div>
              <button type="button" onClick={onClosePrompt} className="icon-button" aria-label="Close prompt panel">
                <CloseIcon />
              </button>
            </div>
            {prompt}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function BrandHeader() {
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[var(--border)] px-5">
      <BrandMark />
      <div>
        <div className="text-lg font-semibold tracking-[-0.02em]">ArchSketch</div>
        <div className="text-[11px] text-[var(--muted)]">Architecture drafting workspace</div>
      </div>
    </header>
  )
}

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-8 w-8 text-[var(--accent)]" fill="none">
      <path d="M6 25V9l10-6 10 6v16l-10 5L6 25Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m6 9 10 7 10-7M16 16v14" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m13.8 3.2 3 3L7 16H4v-3L13.8 3.2Z" /><path d="m12 5 3 3" /></svg>
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 5 10 10M15 5 5 15" /></svg>
}
