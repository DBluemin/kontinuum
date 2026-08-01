import { useState, type ReactNode } from 'react'
import { ClauseProvider } from './components/ClauseContext'
import { Telltale, type TelltaleState } from './components/Gauges'
import { Etch } from './components/primitives'
import { Bridge, advisories } from './modules/Bridge'
import { ConstitutionModule } from './modules/Constitution'
import { OwnershipModule } from './modules/Ownership'
import { SuccessionModule } from './modules/Succession'
import { PortfolioModule } from './modules/Portfolio'
import { FinancialsModule } from './modules/Financials'
import { OperationsModule } from './modules/Operations'
import { EvidenceModule } from './modules/Evidence'

interface Nav {
  id: string
  label: string
  caption: string
  render: () => ReactNode
}

const MODULES: Nav[] = [
  { id: 'bridge', label: 'Bridge', caption: 'Vital signs', render: () => <Bridge /> },
  { id: 'constitution', label: 'Constitution', caption: 'Clauses & decision rights', render: () => <ConstitutionModule /> },
  { id: 'ownership', label: 'Ownership', caption: 'Control & dilution', render: () => <OwnershipModule /> },
  { id: 'succession', label: 'Succession', caption: 'Estate & transfer', render: () => <SuccessionModule /> },
  { id: 'portfolio', label: 'Portfolio', caption: 'Allocation & risk', render: () => <PortfolioModule /> },
  { id: 'financials', label: 'Financials', caption: 'AUM, returns, projection', render: () => <FinancialsModule /> },
  { id: 'operations', label: 'Operations', caption: 'Running the office', render: () => <OperationsModule /> },
  { id: 'evidence', label: 'Evidence & report', caption: 'AI log, showcase report', render: () => <EvidenceModule /> },
]

export default function App() {
  const [active, setActive] = useState('bridge')
  const adv = advisories()

  const telltales: { label: string; state: TelltaleState; title: string }[] = [
    { label: 'Veto', state: 'alarm', title: 'Blocking quarter headroom below 2m shares (Appendix B)' },
    { label: 'Floor', state: 'off', title: 'Pool above the 27% floor (Article 3)' },
    { label: 'Reserve', state: 'advisory', title: 'Reserve covers under 2 years of base distribution (E5)' },
    { label: 'Proxy', state: 'alarm', title: 'A pooled holding has no standing proxy (Article 7)' },
    { label: 'G5', state: 'alarm', title: 'Undocumented next-generation members (Article 7)' },
    { label: 'Window', state: 'off', title: 'Trading window closed (E4.1)' },
    { label: 'Screen', state: 'off', title: 'Values screen not applied (Article 9)' },
  ]

  const current = MODULES.find((m) => m.id === active) ?? MODULES[0]

  return (
    <ClauseProvider>
      <div className="min-h-screen bg-ground">
        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-rule bg-ground/95 backdrop-blur">
          <div className="m-stripe h-[3px] w-full" />
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-baseline gap-4">
              <h1
                className="font-display text-[19px] leading-none"
                style={{
                  color: 'var(--color-ink)',
                  fontVariationSettings: "'wdth' 118, 'wght' 700",
                  letterSpacing: '0.19em',
                }}
              >
                KONTINUUM
              </h1>
              <span
                className="hidden text-[11.5px] sm:inline"
                style={{ color: 'var(--color-ink-mute)' }}
              >
                Quandt line · BMW AG · single-family office
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {telltales.map((t, i) => (
                <Telltale key={t.label} label={t.label} state={t.state} title={t.title} index={i} />
              ))}
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row">
          {/* ── Nav rail ───────────────────────────────────────────── */}
          <nav className="shrink-0 border-b border-rule lg:sticky lg:top-[55px] lg:h-[calc(100vh-55px)] lg:w-[212px] lg:border-b-0 lg:border-r">
            <ul className="flex overflow-x-auto lg:block">
              {MODULES.map((m) => {
                const isActive = m.id === active
                const alarms = m.id === 'bridge' ? adv.filter((a) => a.level === 'alarm').length : 0
                return (
                  <li key={m.id} className="shrink-0">
                    <button
                      onClick={() => setActive(m.id)}
                      className="relative w-full px-4 py-3 text-left transition-colors lg:px-5"
                      style={{ background: isActive ? 'var(--color-panel)' : 'transparent' }}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-0 left-0 w-[2px]"
                          style={{ background: 'var(--color-m-blue)' }}
                        />
                      )}
                      <span className="flex items-center gap-2">
                        <span
                          className="whitespace-nowrap text-[13.5px]"
                          style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-ink-dim)' }}
                        >
                          {m.label}
                        </span>
                        {alarms > 0 && (
                          <span
                            className="h-[6px] w-[6px] rounded-full"
                            style={{ background: 'var(--color-m-red)' }}
                            title={`${alarms} alarms`}
                          />
                        )}
                      </span>
                      <span
                        className="hidden whitespace-nowrap text-[11px] lg:block"
                        style={{ color: 'var(--color-ink-mute)' }}
                      >
                        {m.caption}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="hidden border-t border-rule px-5 py-4 lg:block">
              <Etch>Source</Etch>
              <p
                className="mt-2 text-[11px] leading-relaxed"
                style={{ color: 'var(--color-ink-mute)' }}
              >
                Every parameter is read from the Assignment&nbsp;1 constitution. Clause tags open
                the verbatim text.
              </p>
            </div>
          </nav>

          {/* ── Module ─────────────────────────────────────────────── */}
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="mb-5 flex items-baseline gap-3">
              <h2
                className="font-display text-[15px]"
                style={{
                  color: 'var(--color-ink)',
                  fontVariationSettings: "'wdth' 112, 'wght' 600",
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {current.label}
              </h2>
              <span className="text-[12px]" style={{ color: 'var(--color-ink-mute)' }}>
                {current.caption}
              </span>
            </div>
            <div key={active}>{current.render()}</div>
          </main>
        </div>
      </div>
    </ClauseProvider>
  )
}
