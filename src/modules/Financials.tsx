import { useMemo, useState } from 'react'
import {
  capitalisedMemorial,
  consolidate,
  incomeStatement,
  useOfCapital,
} from '../engines/consolidation'
import { STRESSES, defaultConfig, runMonteCarlo } from '../engines/montecarlo'
import { covariance, expectedReturns, portfolioReturn, portfolioVol, sharpe } from '../engines/portfolio'
import {
  BENCHMARKS,
  DISTRIBUTION,
  DIVIDEND_HISTORY,
  LIABILITY_NOTE,
  MARKET,
} from '../data/assumptions'
import { LIABILITIES } from '../data/holdings'
import { dec, ClauseTag, Etch, Finding, Panel, Provenance, Row, fmtEur, fmtPct } from '../components/primitives'
import { MiniBar } from '../components/Gauges'

function DividendHistory({ base }: { base: number }) {
  const w = 620
  const h = 130
  const pad = { l: 34, r: 10, t: 10, b: 22 }
  const max = 9
  const x = (i: number) => pad.l + (i / (DIVIDEND_HISTORY.length - 1)) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b)
  const bw = (w - pad.l - pad.r) / DIVIDEND_HISTORY.length - 4

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="BMW dividend per share">
      <line
        x1={pad.l}
        x2={w - pad.r}
        y1={y(base)}
        y2={y(base)}
        stroke="var(--color-bone)"
        strokeWidth={1.4}
        strokeDasharray="4 3"
      />
      <text x={w - pad.r} y={y(base) - 4} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-bone)">
        {dec(base, 2)} € base (E5.1)
      </text>
      {DIVIDEND_HISTORY.map((d, i) => (
        <g key={d.year}>
          <rect
            x={x(i) - bw / 2}
            y={y(d.dps)}
            width={bw}
            height={h - pad.b - y(d.dps)}
            fill={d.dps < base ? 'var(--color-m-red)' : 'var(--color-m-blue)'}
            opacity={d.source === 'paper' ? 1 : 0.55}
          />
          <text
            x={x(i)}
            y={h - 8}
            textAnchor="middle"
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill="var(--color-ink-mute)"
          >
            {`'${String(d.year).slice(2)}`}
          </text>
        </g>
      ))}
      {[0, 3, 6, 9].map((v) => (
        <text key={v} x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={8} fontFamily="var(--font-mono)" fill="var(--color-ink-mute)">
          {v}
        </text>
      ))}
    </svg>
  )
}

function FanChart({ mc }: { mc: ReturnType<typeof runMonteCarlo> }) {
  const w = 660
  const h = 260
  const pad = { l: 52, r: 12, t: 12, b: 26 }
  const yrs = mc.years
  const max = Math.max(...mc.p95) * 1.05

  const x = (t: number) => pad.l + (t / yrs) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b)

  const band = (lo: number[], hi: number[]) =>
    [
      ...lo.map((v, t) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`),
      ...hi.map((_, t) => `${x(yrs - t).toFixed(1)},${y(hi[yrs - t]).toFixed(1)}`),
    ].join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Multi-generational wealth projection">
      <polygon points={band(mc.p05, mc.p95)} fill="var(--color-m-blue)" opacity={0.13} />
      <polygon points={band(mc.p25, mc.p75)} fill="var(--color-m-blue)" opacity={0.22} />
      <polyline
        points={mc.p50.map((v, t) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--color-signal)"
        strokeWidth={2}
      />

      {[15, 30, 45].map((g, i) => (
        <g key={g}>
          <line x1={x(g)} x2={x(g)} y1={pad.t} y2={h - pad.b} stroke="var(--color-rule-hi)" strokeWidth={0.8} strokeDasharray="2 3" />
          <text x={x(g) + 4} y={pad.t + 10} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-mute)">
            G{5 + i}
          </text>
        </g>
      ))}

      {[0, 10, 20, 30, 40, 50].map((t) => (
        <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-mute)">
          {t}y
        </text>
      ))}
      {[0, max / 2, max].map((v, i) => (
        <text key={i} x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-mute)">
          {fmtEur(v, 0)}
        </text>
      ))}
    </svg>
  )
}

export function FinancialsModule() {
  const [dps, setDps] = useState(DIVIDEND_HISTORY[DIVIDEND_HISTORY.length - 1].dps)
  const [stressId, setStressId] = useState('base')

  const cons = useMemo(() => consolidate(), [])
  const inc = useMemo(() => incomeStatement(dps), [dps])
  const uses = useMemo(() => useOfCapital(dps), [dps])
  const memorial = capitalisedMemorial()

  const mu = expectedReturns(false)
  const cov = covariance(0)
  const er = portfolioReturn(cons.weights, mu)
  const vol = portfolioVol(cons.weights, cov)

  const stress = STRESSES.find((s) => s.id === stressId)!
  const mc = useMemo(() => {
    const cfg = defaultConfig(er, vol)
    return runMonteCarlo({
      ...cfg,
      dpsMean: cfg.dpsMean * (1 + stress.dividendShock),
      sharePrice: cfg.sharePrice * (1 + stress.sharePriceShock),
      sharesInIssue: cfg.sharesInIssue + stress.issuanceShock,
      paths: 1500,
    })
  }, [er, vol, stress])

  const target = BENCHMARKS[0].er
  const totalUses = uses.reduce((s, u) => s + u.amount, 0)

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── Balance sheet and AUM ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Consolidated balance sheet">
          <div>
            <Row label="Capital under management" value={fmtEur(cons.totalAssets)} emphasis />
            {cons.byAssetClass.slice(0, 4).map((s) => (
              <Row key={s.id} label={s.label} value={fmtEur(s.value)} sub={fmtPct(s.weight, 1)} />
            ))}
            <Row label="Other classes" value={fmtEur(cons.byAssetClass.slice(4).reduce((a, b) => a + b.value, 0))} />
            <Row
              label="Holding-company facilities"
              value={`(${fmtEur(LIABILITIES[0].value)})`}
              tone="var(--color-m-red)"
            />
            <Row
              label="Memorial commitment, capitalised"
              value={`(${fmtEur(memorial)})`}
              clause="Art.9"
              tone="var(--color-m-red)"
              sub="A perpetuity terminable only by unanimity — a claim, not a grant"
            />
            <Row
              label="Undrawn private-market commitments"
              value={`(${fmtEur(LIABILITIES[3].value)})`}
              tone="var(--color-m-red)"
            />
            <Row label="Net family wealth" value={fmtEur(cons.netWealth)} emphasis />
          </div>
        </Panel>

        <Panel title="AUM by entity">
          <div>
            {cons.byEntity.map((e) => (
              <div key={e.id} className="border-b border-rule px-4 py-2 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] leading-snug" style={{ color: 'var(--color-ink-dim)' }}>
                    {e.name}
                  </span>
                  <span className="readout shrink-0 text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                    {fmtEur(e.value)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <MiniBar
                    value={e.weight}
                    tone={e.kind === 'listed' ? 'var(--color-m-red)' : 'var(--color-m-blue)'}
                    width={100}
                  />
                  <span className="etch">
                    {e.branch} · {e.kind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Income and total cost of ownership">
          <div>
            <Row label="BMW dividend receipts" value={fmtEur(inc.bmwDividend)} sub={`${dec(dps, 2)} € per share`} />
            <Row label="Operating company earnings" value={fmtEur(inc.operatingCompanyEarnings)} />
            <Row label="Portfolio income" value={fmtEur(inc.portfolioIncome)} />
            <Row label="Gross income" value={fmtEur(inc.grossIncome)} emphasis />
            <Row label="Family office running cost" value={`(${fmtEur(inc.familyOfficeOpex)})`} />
            <Row label="External manager fees" value={`(${fmtEur(inc.managerFees)})`} />
            <Row label="Custody, admin, advisory" value={`(${fmtEur(inc.custody + inc.advisory)})`} />
            <Row label="Tax on distributions" value={`(${fmtEur(inc.dividendTax)})`} tone="var(--color-m-red)" />
            <Row label="Net after tax and cost" value={fmtEur(inc.netAfterTax)} emphasis />
            <Row
              label="Total drag"
              value={`${dec(inc.dragBp, 0)} bp`}
              sub={`${fmtPct(inc.tcoRatio, 1)} of gross income`}
              tone="var(--color-amber)"
            />
          </div>
        </Panel>
      </div>

      {/* ── Dividend volatility and use of capital ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel
          title="Why the base exists"
          clause="Art.6"
          right={
            <div className="flex items-center gap-2">
              <Etch>Modelled DPS</Etch>
              <input
                type="range"
                min={1.5}
                max={9}
                step={0.1}
                value={dps}
                onChange={(e) => setDps(Number(e.target.value))}
                className="w-24 accent-[#0066b1]"
              />
              <span className="readout text-[12px]" style={{ color: 'var(--color-ink)' }}>
                {dec(dps, 2)} €
              </span>
            </div>
          }
        >
          <div className="p-4">
            <DividendHistory base={DISTRIBUTION.basePerShare.value} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
              <span>Solid bars are figures cited in the constitution</span>
              <span>
                <span style={{ color: 'var(--color-m-red)' }}>■</span> years the Reserve must fund the base
              </span>
            </div>
            <div className="mt-4">
              <Finding label="Fourfold income variation on an unchanged holding">
                The dividend ran from 1.90 € to 8.50 € in seven years while the family's shareholding
                did not move once. For two billionaires that is an inconvenience; for a fifth
                generation of five or more owners drawing a living from it, it is the problem the
                smoothed base and the Continuity Reserve exist to solve.
              </Finding>
            </div>
          </div>
        </Panel>

        <Panel title="Use of capital" clause="E5">
          <div>
            {uses.map((u) => (
              <div key={u.label} className="border-b border-rule px-4 py-2.5 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px]" style={{ color: 'var(--color-ink-dim)' }}>
                    {u.label}
                    {u.clause && <ClauseTag id={u.clause} className="ml-1.5" />}
                  </span>
                  <span className="readout shrink-0 text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                    {fmtEur(u.amount)}
                  </span>
                </div>
                <div className="mt-1">
                  <MiniBar
                    value={totalUses > 0 ? u.amount / totalUses : 0}
                    tone={
                      u.kind === 'philanthropy'
                        ? 'var(--color-bone)'
                        : u.kind === 'cost'
                          ? 'var(--color-m-red)'
                          : u.kind === 'reserve'
                            ? 'var(--color-m-violet)'
                            : 'var(--color-m-blue)'
                    }
                    width={140}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Returns ─────────────────────────────────────────────────── */}
      <Panel title="Returns against the required rate" clause="Art.2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Measure', 'Nominal', 'Real', 'After tax and cost', 'Volatility', 'Sharpe'].map((h) => (
                  <th key={h} className="etch whitespace-nowrap border-b border-rule px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Consolidated portfolio', n: er, v: vol },
                { label: 'Required return (Art.2 horizon)', n: target, v: undefined },
                ...BENCHMARKS.slice(1).map((b) => ({ label: b.label, n: b.er, v: b.vol })),
              ].map((r) => {
                const real = (1 + r.n) / (1 + MARKET.germanCPI.value) - 1
                const afterTax = r.n - inc.dragBp / 10_000
                return (
                  <tr key={r.label}>
                    <td className="border-b border-rule px-3 py-2" style={{ color: 'var(--color-ink-dim)' }}>
                      {r.label}
                    </td>
                    <td className="readout border-b border-rule px-3 py-2" style={{ color: 'var(--color-ink)' }}>
                      {fmtPct(r.n, 2)}
                    </td>
                    <td className="readout border-b border-rule px-3 py-2" style={{ color: 'var(--color-ink-dim)' }}>
                      {fmtPct(real, 2)}
                    </td>
                    <td
                      className="readout border-b border-rule px-3 py-2"
                      style={{ color: afterTax < target ? 'var(--color-m-red)' : 'var(--color-ink-dim)' }}
                    >
                      {fmtPct(afterTax, 2)}
                    </td>
                    <td className="readout border-b border-rule px-3 py-2" style={{ color: 'var(--color-ink-dim)' }}>
                      {r.v ? fmtPct(r.v, 1) : '—'}
                    </td>
                    <td className="readout border-b border-rule px-3 py-2" style={{ color: 'var(--color-ink-dim)' }}>
                      {r.v ? dec(sharpe(r.n, r.v), 2) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
            After tax and total cost of ownership the consolidated portfolio returns{' '}
            {fmtPct(er - inc.dragBp / 10_000, 2)} against a required{' '}
            {fmtPct(target, 2)}. Gross-of-fee comparisons flatter every family office; this table
            reports the number the family can actually spend.
          </p>
        </div>
      </Panel>

      {/* ── Monte Carlo ─────────────────────────────────────────────── */}
      <Panel
        title="Multi-generational projection"
        clause="E5"
        right={
          <div className="flex flex-wrap gap-1">
            {STRESSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStressId(s.id)}
                className="border px-2 py-0.5 text-[11px] transition-colors"
                style={{
                  borderColor: s.id === stressId ? 'var(--color-m-blue)' : 'var(--color-rule)',
                  color: s.id === stressId ? 'var(--color-ink)' : 'var(--color-ink-mute)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-rule p-4 xl:border-b-0 xl:border-r">
            <FanChart mc={mc} />
            <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              {stress.description} 1,500 paths over 50 years, seeded for reproducibility. Bands are
              the 5–95 and 25–75 percentiles; the line is the median. Each path runs the full E5
              waterfall — memorial first, then the base, then the Reserve.
            </p>
          </div>

          <div>
            <Row
              label="Base distribution fails at least once"
              value={fmtPct(mc.probBaseFails, 1)}
              tone={mc.probBaseFails > 0.2 ? 'var(--color-m-red)' : 'var(--color-amber)'}
              clause="E5"
              emphasis
            />
            <Row
              label="Pool falls below the 27% floor"
              value={fmtPct(mc.probFloorBreach, 1)}
              tone={mc.probFloorBreach > 0.2 ? 'var(--color-m-red)' : undefined}
              clause="Art.3"
            />
            <Row
              label="Blocking quarter lost"
              value={fmtPct(mc.probBlockingBreach, 1)}
              tone={mc.probBlockingBreach > 0.2 ? 'var(--color-m-red)' : undefined}
              clause="App.B"
            />
            <Row label="Continuity Reserve exhausted" value={fmtPct(mc.probReserveExhausted, 1)} clause="E5" />
            <Row
              label="Median terminal wealth, real"
              value={fmtEur(mc.medianTerminalWealth)}
              sub="Today's money, after 50 years of distributions"
            />
            <Row
              label="Median real wealth per claimant"
              value={fmtEur(mc.medianRealTerminalPerClaimant)}
              sub="Across 14 assumed G6 claimants"
            />
            <Row label="Median maximum drawdown" value={fmtPct(mc.medianMaxDrawdown, 1)} />
            <Row label="Worst-percentile drawdown" value={fmtPct(mc.worstMaxDrawdown, 1)} tone="var(--color-m-red)" />
            <div className="p-4">
              <Finding
                tone={mc.probBlockingBreach > mc.probFloorBreach ? 'var(--color-m-red)' : 'var(--color-amber)'}
                label="Which promise breaks first"
              >
                Across the simulated paths the blocking quarter is lost{' '}
                {mc.probBlockingBreach > mc.probFloorBreach ? 'more' : 'less'} often than the pool
                floor is breached, and the Reserve's share-buying mandate under E5.3 defends the
                floor rather than the veto. The waterfall protects the constraint the constitution
                names, not the one the family relies on.
              </Finding>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Provenance">
        <div className="p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { k: 'paper' as const, t: 'Cited in the Assignment 1 constitution' },
              { k: 'published' as const, t: 'Company or statutory figure — verify at source' },
              { k: 'assumption' as const, t: 'Modelling input chosen for this platform' },
            ].map((p) => (
              <span key={p.k} className="flex items-center gap-2">
                <Provenance kind={p.k} />
                <span className="text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                  {p.t}
                </span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
            {LIABILITY_NOTE}
          </p>
        </div>
      </Panel>
    </div>
  )
}
