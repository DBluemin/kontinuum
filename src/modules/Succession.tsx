import { useState } from 'react'
import {
  TARGET_STRUCTURE,
  computeBoth,
  liquidityAtEvent,
  trancheSchedule,
  type StructureNode,
  type TaxResult,
  type TransferInput,
} from '../engines/estate'
import { DE_TAX, MARKET } from '../data/assumptions'
import { G5, MEMBERS, age } from '../data/family'
import { POOLED_SHARES, STEFAN_SHARES } from '../engines/control'
import { DISTRIBUTION } from '../data/assumptions'
import {
  ClauseTag,
  Etch,
  Finding,
  Panel,
  Provenance,
  Row,
  fmtEur,
  fmtPct,
  fmtShares,
} from '../components/primitives'

const PRICE = MARKET.bmwSharePrice.value
const SHARES_IN_ISSUE = MARKET.sharesInIssue.value

function TaxColumn({ r, title, subtitle }: { r: TaxResult; title: string; subtitle: string }) {
  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="etch etch-hi" style={{ letterSpacing: '0.2em' }}>
            {title}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
            {subtitle}
          </div>
        </div>
        <div className="text-right">
          <div
            className="readout text-[24px] leading-none"
            style={{ color: r.tax > 0 ? 'var(--color-m-red)' : 'var(--color-m-blue)' }}
          >
            {fmtEur(r.tax)}
          </div>
          <div className="readout mt-0.5 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
            {fmtPct(r.effectiveRate, 1)} effective
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {r.reliefs
          .filter((x) => x.amount > 0)
          .map((x, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] leading-snug" style={{ color: 'var(--color-ink-dim)' }}>
                {x.label}
                {x.clause && <ClauseTag id={x.clause} className="ml-1.5" />}
              </span>
              <span
                className="readout shrink-0 text-[12px]"
                style={{ color: 'var(--color-m-blue)' }}
              >
                −{fmtEur(x.amount)}
              </span>
            </div>
          ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-rule pt-2">
          <span className="text-[12px]" style={{ color: 'var(--color-ink)' }}>
            Taxable base
          </span>
          <span className="readout text-[12px]" style={{ color: 'var(--color-ink)' }}>
            {fmtEur(r.taxable)} at {fmtPct(r.rate, 0)}
          </span>
        </div>
      </div>

      {r.notes.map((n, i) => (
        <p
          key={i}
          className="mt-3 border-l pl-3 text-[11.5px] leading-relaxed"
          style={{ borderColor: 'var(--color-rule-hi)', color: 'var(--color-ink-mute)' }}
        >
          {n}
        </p>
      ))}
    </div>
  )
}

function StructureTree({ node, depth = 0 }: { node: StructureNode; depth?: number }) {
  const tone: Record<StructureNode['kind'], string> = {
    family: 'var(--color-bone)',
    trust: 'var(--color-bone)',
    holding: 'var(--color-signal)',
    operating: 'var(--color-ink-dim)',
    listed: 'var(--color-m-blue)',
  }
  return (
    <div style={{ marginLeft: depth * 18 }}>
      <div className="flex items-start gap-2 border-l py-1.5 pl-3" style={{ borderColor: 'var(--color-rule)' }}>
        <span
          className="mt-[6px] h-[6px] w-[6px] shrink-0"
          style={{ background: tone[node.kind] }}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[13px]" style={{ color: 'var(--color-ink)' }}>
              {node.label}
            </span>
            <span className="etch">{node.jurisdiction}</span>
            {node.clause && <ClauseTag id={node.clause} />}
          </div>
          {node.note && (
            <p className="mt-0.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              {node.note}
            </p>
          )}
        </div>
      </div>
      {node.children?.map((c) => (
        <StructureTree key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  )
}

export function SuccessionModule() {
  const oneTranche = (STEFAN_SHARES / 3) * PRICE
  const [value, setValue] = useState(Math.round(oneTranche))
  const [acquirers, setAcquirers] = useState(2)
  const [mode, setMode] = useState<'death' | 'gift'>('gift')
  const [yearsSurvived, setYears] = useState(3)
  const [pooling, setPooling] = useState(true)
  const [options, setOptions] = useState(false)
  const [reformOn, setReformOn] = useState(false)

  const input: TransferInput = {
    value,
    acquirers,
    mode,
    yearsSurvived,
    businessProperty: !reformOn,
    poolingRestrictions: pooling,
    optionsverschonung: options,
  }
  const { uk, de } = computeBoth(input)

  const liquidAssets = 200_000_000 + 1_800_000_000 * 0.42
  const liq = liquidityAtEvent(
    de.tax,
    liquidAssets,
    DISTRIBUTION.reserveOpening.value,
    PRICE,
    STEFAN_SHARES,
    POOLED_SHARES,
    SHARES_IN_ISSUE,
  )

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── Dual-jurisdiction engine ────────────────────────────────── */}
      <Panel
        title="Transfer under both regimes"
        clause="Art.7"
        right={
          <span className="etch">
            English law baseline · German overlay
          </span>
        }
      >
        <div className="border-b border-rule p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Etch className="mb-1.5">Transferred value</Etch>
              <input
                type="range"
                min={100_000_000}
                max={Math.round(STEFAN_SHARES * PRICE)}
                step={50_000_000}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-[#0066b1]"
              />
              <div className="readout mt-1 text-[15px]" style={{ color: 'var(--color-ink)' }}>
                {fmtEur(value)}
                <span className="ml-2 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
                  {fmtShares(value / PRICE)} shares
                </span>
              </div>
            </div>

            <div>
              <Etch className="mb-1.5">Acquirers</Etch>
              <input
                type="range"
                min={1}
                max={6}
                value={acquirers}
                onChange={(e) => setAcquirers(Number(e.target.value))}
                className="w-full accent-[#0066b1]"
              />
              <div className="readout mt-1 text-[15px]" style={{ color: 'var(--color-ink)' }}>
                {acquirers}
                <span className="ml-2 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
                  {fmtEur(value / acquirers)} each
                </span>
              </div>
            </div>

            <div>
              <Etch className="mb-1.5">Mode</Etch>
              <div className="flex gap-1">
                {(['gift', 'death'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="flex-1 border px-2 py-1.5 text-[12px] capitalize transition-colors"
                    style={{
                      borderColor: mode === m ? 'var(--color-m-blue)' : 'var(--color-rule)',
                      color: mode === m ? 'var(--color-ink)' : 'var(--color-ink-mute)',
                      background:
                        mode === m ? 'color-mix(in srgb, var(--color-m-blue) 14%, transparent)' : 'transparent',
                    }}
                  >
                    {m === 'gift' ? 'Lifetime gift' : 'On death'}
                  </button>
                ))}
              </div>
              {mode === 'gift' && (
                <>
                  <input
                    type="range"
                    min={0}
                    max={7}
                    value={yearsSurvived}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="mt-2 w-full accent-[#0066b1]"
                  />
                  <div className="readout mt-0.5 text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                    {yearsSurvived} year(s) survived
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Etch className="mb-1.5">Reliefs claimed</Etch>
              {[
                { on: pooling, set: setPooling, label: '§13a(9) pooling restrictions', clause: 'E1' },
                { on: options, set: setOptions, label: '§13a Optionsverschonung (100%)', clause: 'Art.7' },
                { on: reformOn, set: setReformOn, label: 'Reform: relief withdrawn', clause: 'Art.7' },
              ].map((t) => (
                <label key={t.label} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.on}
                    onChange={(e) => t.set(e.target.checked)}
                    className="accent-[#0066b1]"
                  />
                  <span className="text-[12px]" style={{ color: 'var(--color-ink-dim)' }}>
                    {t.label}
                  </span>
                  <ClauseTag id={t.clause} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[var(--color-rule)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <TaxColumn r={uk} title="England & Wales" subtitle="Mandated baseline" />
          <TaxColumn r={de} title="Germany" subtitle="Where the case actually sits" />
        </div>

        <div className="border-t border-rule p-4">
          <Finding
            tone={de.tax > uk.tax ? 'var(--color-m-red)' : 'var(--color-m-blue)'}
            label="Jurisdiction spread"
          >
            The same transfer costs {fmtEur(Math.abs(de.tax - uk.tax))} more under{' '}
            {de.tax > uk.tax ? 'German' : 'English' } law —{' '}
            {fmtPct(Math.abs(de.effectiveRate - uk.effectiveRate), 1)} of the transferred value. The
            two systems fail in different places: England caps business relief at £1m and then
            charges 40% on half of everything above it, while Germany abates business relief to
            nothing above roughly {(DE_TAX.abatementCeiling / 1e6).toFixed(0)}m € per acquirer and
            leaves only the §13a(9) Vorwegabschlag doing real work — a relief the family earns by
            imposing the very pooling restrictions that Article 3 needs anyway.
          </Finding>
        </div>
      </Panel>

      {/* ── Liquidity at the event ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Liquidity at the succession event" clause="Art.7">
          <div>
            <Row label="Tax due, German computation" value={fmtEur(liq.taxDue)} tone="var(--color-m-red)" />
            <Row label="Liquid assets available" value={fmtEur(liq.liquidAssets)} />
            <Row label="Continuity Reserve" value={fmtEur(liq.reserveAvailable)} clause="E5" />
            <Row
              label="Shortfall"
              value={liq.shortfall > 0 ? fmtEur(liq.shortfall) : 'None'}
              tone={liq.shortfall > 0 ? 'var(--color-m-red)' : 'var(--color-m-blue)'}
              emphasis
            />
            {liq.shortfall > 0 && (
              <Row
                label="Shares that must be sold"
                value={`${fmtShares(liq.sharesToSell)}`}
                sub={
                  liq.breachesBlocking
                    ? 'Takes Stefan Quandt below the blocking quarter'
                    : liq.breachesFloor
                      ? 'Breaches the Article 3 pool floor'
                      : 'Both thresholds hold'
                }
                tone={liq.breachesBlocking || liq.breachesFloor ? 'var(--color-m-red)' : undefined}
              />
            )}
            <div className="p-4">
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                {liq.verdict}
              </p>
              <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                This is the asset–liability mismatch the constitution exists to prevent: the
                liability is denominated in cash on a fixed date, the asset is a control position
                that may not be sold. The Reserve is the only bridge, and E5.5 forbids distributing
                it for anything else.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Article 7 tranche schedule" clause="Art.7">
          <div>
            {G5.map((m) => {
              const a = age(m)
              const sched = trancheSchedule(a)
              return (
                <div key={m.id} className="border-b border-rule px-4 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13.5px]" style={{ color: 'var(--color-ink)' }}>
                      {m.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="readout text-[12px]" style={{ color: 'var(--color-ink-dim)' }}>
                        {a === null ? '—' : `age ${a}`}
                      </span>
                      <Provenance kind={m.birthYearProvenance} />
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {sched.map((t) => {
                      const done = t.yearsAway !== null && t.yearsAway <= 0
                      const unknown = t.yearsAway === null
                      return (
                        <div
                          key={t.age}
                          className="flex-1 border px-2 py-1"
                          style={{
                            borderColor: unknown
                              ? 'var(--color-rule)'
                              : done
                                ? 'var(--color-m-blue)'
                                : 'var(--color-rule-hi)',
                            background: done
                              ? 'color-mix(in srgb, var(--color-m-blue) 12%, transparent)'
                              : 'transparent',
                          }}
                        >
                          <div className="readout text-[11px]" style={{ color: 'var(--color-ink-dim)' }}>
                            {t.age}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--color-ink-mute)' }}>
                            {unknown ? 'unknown' : done ? 'due' : `in ${t.yearsAway}y`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="p-4">
              <Finding tone="var(--color-m-red)" label="A model running on placeholders">
                Two of the five G5 members have no documented age, so their tranche dates cannot be
                computed at all. Article 7 stages equity at 25, 35 and 45; for the Stefan branch the
                platform can only show that the schedule exists, not when it triggers. That is a
                governance gap the Owners' Council can close in an afternoon and has not.
              </Finding>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Structure and instruments ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Holding structure" clause="E1">
          <div className="p-4">
            <StructureTree node={TARGET_STRUCTURE} />
            <p className="mt-4 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              Dividends flow operating company → branch holding → pool. Inter-company distributions
              attract the §8b KStG participation exemption at roughly{' '}
              {fmtPct(DE_TAX.interCorporateEffective, 1)} effective, against{' '}
              {fmtPct(DE_TAX.dividendWithholding, 2)} on anything paid out to a member personally.
              The Reserve is held at holding level precisely so it never becomes a personal receipt.
            </p>
          </div>
        </Panel>

        <Panel title="Will and constitution consistency" clause="E1">
          <div>
            {MEMBERS.filter((m) => m.poolMember || m.generation === 'G5').map((m) => {
              const items = [
                { k: 'Prenuptial agreement', v: m.compliance.prenup },
                { k: 'Will consistent with the pool', v: m.compliance.willConsistent },
                { k: 'Standing proxy named', v: m.compliance.standingProxy },
              ]
              return (
                <div key={m.id} className="border-b border-rule px-4 py-2.5 last:border-b-0">
                  <div className="text-[13px]" style={{ color: 'var(--color-ink)' }}>
                    {m.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {items.map((it) => (
                      <span
                        key={it.k}
                        className="flex items-center gap-1.5 text-[11.5px]"
                        style={{
                          color:
                            it.v === true
                              ? 'var(--color-ink-dim)'
                              : it.v === false
                                ? 'var(--color-m-red)'
                                : 'var(--color-ink-mute)',
                        }}
                      >
                        <span
                          className="h-[6px] w-[6px]"
                          style={{
                            background:
                              it.v === true
                                ? 'var(--color-m-blue)'
                                : it.v === false
                                  ? 'var(--color-m-red)'
                                  : 'var(--color-rule)',
                          }}
                        />
                        {it.k}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="p-4">
              <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                A family constitution has no binding force in German law. It acquires force only
                when transcribed into the articles of association, the pooling agreement and
                individual wills. Where those contradict, a court reads the will and ignores the
                constitution — which makes this table the enforcement layer, not a formality.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
