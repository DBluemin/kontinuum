import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CLAUSE_INDEX, type Clause } from '../data/constitution'

interface ClauseCtx {
  open: (id: string) => void
  close: () => void
  active: Clause | null
}

const Ctx = createContext<ClauseCtx>({ open: () => {}, close: () => {}, active: null })

export function useClause() {
  return useContext(Ctx)
}

export function ClauseProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const open = useCallback((id: string) => setActiveId(id), [])
  const close = useCallback(() => setActiveId(null), [])
  const active = activeId ? (CLAUSE_INDEX[activeId] ?? null) : null
  const value = useMemo(() => ({ open, close, active }), [open, close, active])

  return (
    <Ctx.Provider value={value}>
      {children}
      <ClauseDrawer />
    </Ctx.Provider>
  )
}

const MODULE_NAMES: Record<string, string> = {
  bridge: 'Bridge',
  constitution: 'Constitution',
  ownership: 'Ownership & Control',
  succession: 'Succession & Estate',
  portfolio: 'Portfolio',
  financials: 'Financials',
  operations: 'Operations',
}

/**
 * The archive layer. Live figures are instruments; the constitution is paper.
 * Clicking a clause tag anywhere in the platform brings the paper forward.
 */
function ClauseDrawer() {
  const { active, close } = useClause()
  if (!active) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close clause"
        onClick={close}
        className="absolute inset-0 bg-ground/80 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-label={`${active.ref} — ${active.title}`}
        className="animate-drawer-in relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-bone shadow-2xl"
      >
        <div className="m-stripe h-[3px] w-full shrink-0" />

        <header className="flex items-start justify-between gap-4 border-b border-bone-deep px-7 pb-5 pt-6">
          <div>
            <div
              className="etch"
              style={{ color: 'var(--color-bone-dim)', letterSpacing: '0.2em' }}
            >
              Family Constitution · {active.group}
            </div>
            <h2
              className="mt-2 font-serif text-[25px] leading-[1.2]"
              style={{ color: 'var(--color-bone-ink)' }}
            >
              {active.title}
            </h2>
            <div
              className="readout mt-1 text-[12px]"
              style={{ color: 'var(--color-bone-dim)' }}
            >
              {active.ref}
            </div>
          </div>
          <button
            onClick={close}
            className="shrink-0 border border-bone-deep px-2.5 py-1 text-[11px] transition-colors hover:bg-bone-deep"
            style={{ color: 'var(--color-bone-ink)' }}
          >
            Close
          </button>
        </header>

        <div className="px-7 py-6">
          <blockquote
            className="border-l-2 pl-5 font-serif text-[17px] leading-[1.68]"
            style={{ borderColor: 'var(--color-m-blue)', color: 'var(--color-bone-ink)' }}
          >
            {active.text}
          </blockquote>

          {active.params.length > 0 && (
            <section className="mt-8">
              <div className="etch" style={{ color: 'var(--color-bone-dim)' }}>
                Parameters in force
              </div>
              <dl className="mt-3">
                {active.params.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-baseline justify-between gap-4 border-b border-bone-deep py-2.5"
                  >
                    <dt className="text-[13px]" style={{ color: 'var(--color-bone-dim)' }}>
                      {p.label}
                    </dt>
                    <dd
                      className="readout text-right text-[13px] font-medium"
                      style={{ color: 'var(--color-bone-ink)' }}
                    >
                      {typeof p.value === 'number' ? p.value.toLocaleString('en-GB') : p.value}
                      {p.unit ? (
                        <span style={{ color: 'var(--color-bone-dim)' }}> {p.unit}</span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-8">
            <div className="etch" style={{ color: 'var(--color-bone-dim)' }}>
              Drives
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.drives.map((m) => (
                <span
                  key={m}
                  className="border px-2.5 py-1 text-[11px]"
                  style={{
                    borderColor: 'var(--color-bone-deep)',
                    color: 'var(--color-bone-ink)',
                  }}
                >
                  {MODULE_NAMES[m] ?? m}
                </span>
              ))}
            </div>
          </section>

          <p
            className="mt-9 border-t border-bone-deep pt-4 text-[11.5px] leading-relaxed"
            style={{ color: 'var(--color-bone-dim)' }}
          >
            Blümin, D. (2026) <em>Two Inheritances: A Family Constitution Playbook for the
            Quandt Family and the Ownership of BMW AG</em>. MGT-5603, Hult International
            Business School. Every parameter above is read directly by the platform — change
            the clause and the instruments move.
          </p>
        </div>
      </aside>
    </div>
  )
}
