import { useState } from 'react'
import { BODIES, CLAUSE_INDEX } from '../data/constitution'
import { COMPARATOR_BRANCH, MEMBERS, age } from '../data/family'
import { MFO_CLIENTS } from '../data/holdings'
import { consolidate } from '../engines/consolidation'
import { ClauseTag, Etch, Finding, Panel, Row, fmtEur, fmtPct } from '../components/primitives'

interface CalendarItem {
  month: string
  body: string
  business: string
  clause: string
}

const CALENDAR: CalendarItem[] = [
  { month: 'January', body: "Owners' Council", business: 'Quarterly floor test; Reserve position; trading-window resolution', clause: 'Art.3' },
  { month: 'February', body: 'Family Council', business: 'Education programme review; memorial disbursement', clause: 'Art.9' },
  { month: 'March', body: "Owners' Council", business: 'AGM voting instruction drafted; conflicts declarations collected', clause: 'E4' },
  { month: 'April', body: "Owners' Council", business: 'Quarterly floor test; binding AGM instruction issued', clause: 'Art.4' },
  { month: 'May', body: 'BMW AGM', business: 'Pool votes as one bloc under the Poolvertrag', clause: 'Art.4' },
  { month: 'June', body: 'Family Assembly', business: 'Elects the Family Council; ratifies amendments by head; names the mediation panel', clause: 'Art.10' },
  { month: 'July', body: "Owners' Council", business: 'Quarterly floor test; Art.7 tranche schedule review against ErbStG reform', clause: 'Art.7' },
  { month: 'September', body: 'Family Council', business: 'Remuneration benchmarking; next-generation mentorship placements', clause: 'E3' },
  { month: 'October', body: "Owners' Council", business: 'Quarterly floor test; distribution base set for the coming year', clause: 'E5' },
  { month: 'November', body: 'Family Council', business: 'Berlin-Schöneweide visit; family-history seminar cohort', clause: 'Art.9' },
  { month: 'December', body: 'Triennial', business: 'IDW S1 valuation of unlisted family assets; CPI reset of the base', clause: 'E2' },
]

interface LogEntry {
  date: string
  decision: string
  outcome: 'carried' | 'blocked' | 'noted'
  threshold: string
  clause: string
}

const DECISION_LOG: LogEntry[] = [
  { date: '2026-07-14', decision: 'Reserve mandate extended to defend the blocking quarter, not only the pool floor', outcome: 'blocked', threshold: '75% by share', clause: 'E5' },
  { date: '2026-07-02', decision: 'Emergency floor test following the preferred-share conversion', outcome: 'noted', threshold: 'Quarterly test', clause: 'Art.3' },
  { date: '2026-06-18', decision: 'AGM instruction: approve conversion of preferred shares', outcome: 'carried', threshold: 'Simple majority by share', clause: 'Art.4' },
  { date: '2026-05-05', decision: 'Trading window opened for the period to 30 June', outcome: 'carried', threshold: "Owners' Council", clause: 'E4' },
  { date: '2026-03-11', decision: 'Distribution base held at €4.00 per pooled share', outcome: 'carried', threshold: '75% by share', clause: 'E5' },
  { date: '2026-02-20', decision: 'Standing proxy nomination for the Stefan branch deferred', outcome: 'noted', threshold: "Owners' Council", clause: 'Art.7' },
]

const LADDER = [
  { step: 'Council chair mediates', window: 'Within 30 days', tone: 'var(--color-m-blue)' },
  { step: 'External mediator, named annually by the Assembly', window: 'On referral', tone: 'var(--color-m-violet)' },
  { step: 'Binding arbitration under DIS rules, seated in Munich', window: 'Final', tone: 'var(--color-m-red)' },
]

export function OperationsModule() {
  const [mfo, setMfo] = useState(false)
  const cons = consolidate()

  const clients = MFO_CLIENTS.map((c) => ({
    ...c,
    aum: c.primary ? cons.totalAssets : c.aum,
  }))
  const totalAum = clients.reduce((s, c) => s + (mfo || c.primary ? c.aum : 0), 0)

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── Operating model ─────────────────────────────────────────── */}
      <Panel
        title="Operating model"
        clause="Art.4"
        right={
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={mfo}
              onChange={(e) => setMfo(e.target.checked)}
              className="accent-[#0066b1]"
            />
            <span className="etch etch-hi">Multi-family mode</span>
          </label>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
          <div className="border-b border-rule lg:border-b-0 lg:border-r">
            <Row label="Books under administration" value={mfo ? clients.length : 1} emphasis />
            <Row label="Total assets overseen" value={fmtEur(totalAum)} />
            {clients
              .filter((c) => mfo || c.primary)
              .map((c) => (
                <div key={c.id} className="border-b border-rule px-4 py-3 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px]" style={{ color: 'var(--color-ink)' }}>
                      {c.name}
                    </span>
                    <span className="readout shrink-0 text-[13px]" style={{ color: 'var(--color-ink)' }}>
                      {fmtEur(c.aum)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                    {c.mandate} · governed by {c.constitution}
                  </p>
                  {c.note && (
                    <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                      {c.note}
                    </p>
                  )}
                </div>
              ))}
          </div>

          <div className="p-4">
            {mfo ? (
              <Finding label="Two constitutions, one platform">
                In multi-family mode the second book has no operating control position, so its floor
                and blocking-minority instruments read nil and its constraint set collapses to
                spending sustainability and tax. That is the whole difference between an SFO built
                around a controlled asset and an MFO managing proceeds — and it is why the Harald
                branch, which sold out of industry within two decades of an unplanned death, is the
                comparator this family should keep on screen.
              </Finding>
            ) : (
              <Finding label="Single-family office">
                One book, one constitution, one control position. Every instrument on the Bridge is
                specific to a family that owns a controlling stake it may not sell. Switch to
                multi-family mode to see the same platform run a book with no control position at
                all.
              </Finding>
            )}

            <div className="mt-5 border-t border-rule pt-4">
              <Etch className="mb-2">Comparator: {COMPARATOR_BRANCH.name}</Etch>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                {COMPARATOR_BRANCH.lesson}
              </p>
              <p className="mt-2 text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                Vehicle: {COMPARATOR_BRANCH.vehicle} · BMW equity held:{' '}
                {fmtPct(COMPARATOR_BRANCH.bmwEquity, 0)}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Calendar and log ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Governance calendar" clause="Art.4">
          <div>
            {CALENDAR.map((c) => (
              <div key={c.month} className="flex gap-3 border-b border-rule px-4 py-2 last:border-b-0">
                <span className="etch w-[70px] shrink-0 pt-[3px]">{c.month}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                      {c.body}
                    </span>
                    <ClauseTag id={c.clause} />
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                    {c.business}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Decision log" clause="App.D">
            <div>
              {DECISION_LOG.map((l) => (
                <div key={l.date} className="border-b border-rule px-4 py-2.5 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12.5px] leading-snug" style={{ color: 'var(--color-ink-dim)' }}>
                      {l.decision}
                      <ClauseTag id={l.clause} className="ml-1.5" />
                    </span>
                    <span
                      className="readout shrink-0 text-[10.5px] uppercase"
                      style={{
                        color:
                          l.outcome === 'carried'
                            ? 'var(--color-m-blue)'
                            : l.outcome === 'blocked'
                              ? 'var(--color-m-red)'
                              : 'var(--color-ink-mute)',
                      }}
                    >
                      {l.outcome}
                    </span>
                  </div>
                  <div className="readout mt-0.5 text-[10.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                    {l.date} · {l.threshold}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Conflict ladder" clause="Art.8">
            <div className="p-4">
              {LADDER.map((s, i) => (
                <div key={s.step} className="flex items-start gap-3 pb-3 last:pb-0">
                  <span
                    className="readout mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[10px]"
                    style={{ border: `1px solid ${s.tone}`, color: s.tone }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                      {s.step}
                    </div>
                    <div className="etch mt-0.5">{s.window}</div>
                  </div>
                </div>
              ))}
              <p className="mt-2 border-t border-rule pt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                A member who litigates outside this ladder is deemed to have served exit notice, and
                the E2 discount rises to 20 per cent plus costs. The pooling agreement carries the
                arbitration clause, which is what makes the ladder enforceable rather than advisory.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Compliance register ─────────────────────────────────────── */}
      <Panel title="Compliance register" clause="E4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                {[
                  'Member',
                  'Gen',
                  'Age',
                  'Prenup (E1.4)',
                  'Will (E1.4)',
                  'Proxy (Art.7)',
                  'Conflicts (E4.3)',
                  'Age 16',
                  'Age 18',
                  'Age 21',
                ].map((h) => (
                  <th key={h} className="etch whitespace-nowrap border-b border-rule px-2.5 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((m) => {
                const cells = [
                  m.compliance.prenup,
                  m.compliance.willConsistent,
                  m.compliance.standingProxy,
                  m.compliance.conflictsDeclared,
                  m.education.seminar16,
                  m.education.literacy18,
                  m.education.mentorship21,
                ]
                return (
                  <tr key={m.id}>
                    <td className="border-b border-rule px-2.5 py-2" style={{ color: 'var(--color-ink)' }}>
                      {m.name}
                    </td>
                    <td className="readout border-b border-rule px-2.5 py-2" style={{ color: 'var(--color-ink-mute)' }}>
                      {m.generation}
                    </td>
                    <td className="readout border-b border-rule px-2.5 py-2" style={{ color: 'var(--color-ink-mute)' }}>
                      {age(m) ?? '—'}
                    </td>
                    {cells.map((v, i) => (
                      <td key={i} className="border-b border-rule px-2.5 py-2">
                        <span
                          className="readout text-[11px]"
                          style={{
                            color:
                              v === true
                                ? 'var(--color-m-blue)'
                                : v === false
                                  ? 'var(--color-m-red)'
                                  : 'var(--color-ink-mute)',
                          }}
                        >
                          {v === true ? 'yes' : v === false ? 'no' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
            A dash is undisclosed, not compliant. Continued membership of the pool is conditional on
            a prenuptial agreement providing separation of property and a will consistent with the
            pooling agreement — so every dash in those columns is an unenforced condition, and every
            missing proxy is the Harald branch waiting to happen.
          </p>
        </div>
      </Panel>

      {/* ── Bodies ──────────────────────────────────────────────────── */}
      <Panel title="Reporting lines" clause="Art.4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {BODIES.map((b) => (
            <div key={b.name} className="border-b border-rule p-4 last:border-b-0 md:border-r md:last:border-r-0">
              <div className="text-[13px]" style={{ color: 'var(--color-ink)' }}>
                {b.name}
              </div>
              <div className="etch mt-1">{b.cadence}</div>
              <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                {b.composition}
              </p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
            {CLAUSE_INDEX['Art.4'].text.split('[…]')[1]?.trim() ?? ''}
          </p>
        </div>
      </Panel>
    </div>
  )
}
