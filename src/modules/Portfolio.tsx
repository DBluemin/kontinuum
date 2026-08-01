import { useMemo, useState } from 'react'
import {
  concentration,
  conditionalVaR,
  constitutionalFloorWeight,
  covariance,
  efficientFrontier,
  expectedReturns,
  frontierReturnAt,
  portfolioReturn,
  portfolioVol,
  priceOfControl,
  riskContribution,
  sharpe,
  valueAtRisk,
  type Bounds,
  type FrontierPoint,
} from '../engines/portfolio'
import { consolidate } from '../engines/consolidation'
import { ASSET_CLASSES, BENCHMARKS, CORRELATION, MARKET, VALUES_SCREEN } from '../data/assumptions'
import { ClauseTag, Etch, Finding, Panel, Row, fmtEur, fmtPct } from '../components/primitives'
import { MiniBar } from '../components/Gauges'

/** Realistic construction limits, applied to both frontiers so the comparison
    isolates the constitutional constraint rather than confounding it. */
function baseBounds(): Bounds {
  const caps: Record<string, number> = { bmw: 1, geq: 1, poc: 0.4, fi: 1, pe: 0.25, ra: 0.25, cash: 0.2 }
  return {
    lower: ASSET_CLASSES.map(() => 0),
    upper: ASSET_CLASSES.map((a) => caps[a.id] ?? 1),
  }
}

function FrontierChart({
  unconstrained,
  constrained,
  current,
  targetVol,
}: {
  unconstrained: FrontierPoint[]
  constrained: FrontierPoint[]
  current: { er: number; vol: number }
  /** Volatility at which the constraint bites hardest — where the gap is drawn. */
  targetVol: number
}) {
  const w = 660
  const h = 370
  const pad = { l: 48, r: 16, t: 16, b: 34 }
  const xMax = 0.3
  const yMin = 0.03
  const yMax = 0.11

  const x = (v: number) => pad.l + (v / xMax) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b)

  const line = (pts: FrontierPoint[]) =>
    pts.map((p) => `${x(p.vol).toFixed(1)},${y(p.er).toFixed(1)}`).join(' ')

  const uAtVol = frontierReturnAt(unconstrained, targetVol)
  const cAtVol = frontierReturnAt(constrained, targetVol)
  const gapBp = uAtVol !== null && cAtVol !== null ? (uAtVol - cAtVol) * 10_000 : null

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Efficient frontiers">
      {/* Graticule */}
      {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((v) => (
        <line key={v} x1={x(v)} x2={x(v)} y1={pad.t} y2={h - pad.b} stroke="var(--color-rule)" strokeWidth={0.6} />
      ))}
      {[0.04, 0.06, 0.08, 0.1].map((v) => (
        <line key={v} x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-rule)" strokeWidth={0.6} />
      ))}

      {/* The cost of the floor, drawn at the volatility where it bites hardest */}
      {uAtVol !== null && cAtVol !== null && gapBp !== null && (
        <>
          <line
            x1={x(targetVol)}
            x2={x(targetVol)}
            y1={y(cAtVol)}
            y2={y(uAtVol)}
            stroke="var(--color-m-red)"
            strokeWidth={2.5}
          />
          {[uAtVol, cAtVol].map((v, i) => (
            <line
              key={i}
              x1={x(targetVol) - 4}
              x2={x(targetVol) + 4}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-m-red)"
              strokeWidth={1.5}
            />
          ))}
          <text
            x={x(targetVol) + 9}
            y={(y(cAtVol) + y(uAtVol)) / 2}
            fontSize={10.5}
            fontFamily="var(--font-mono)"
            fill="var(--color-m-red)"
            dominantBaseline="middle"
          >
            {gapBp.toFixed(0)} bp — the floor
          </text>
        </>
      )}

      <polyline points={line(unconstrained)} fill="none" stroke="var(--color-signal)" strokeWidth={2} />
      <polyline
        points={line(constrained)}
        fill="none"
        stroke="var(--color-m-violet)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />

      {/* Benchmarks. Labels sit below the marker so they clear the frontier
          lines and the family's own position. */}
      {BENCHMARKS.filter((b) => 'vol' in b && b.vol).map((b) => (
        <g key={b.id}>
          <circle cx={x(b.vol as number)} cy={y(b.er)} r={2.5} fill="var(--color-ink-mute)" />
          <text
            x={x(b.vol as number)}
            y={y(b.er) + 14}
            textAnchor="middle"
            fontSize={8.5}
            fontFamily="var(--font-mono)"
            fill="var(--color-ink-mute)"
          >
            {b.label.replace(' (EUR)', '').replace(' EUR balanced', '')}
          </text>
        </g>
      ))}

      {/* Where the family actually sits */}
      <circle cx={x(current.vol)} cy={y(current.er)} r={5} fill="var(--color-m-red)" />
      <text
        x={x(current.vol) + 9}
        y={y(current.er) + 3.5}
        fontSize={10.5}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink)"
      >
        the family today
      </text>

      {/* Axes */}
      {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((v) => (
        <text
          key={v}
          x={x(v)}
          y={h - 12}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-mute)"
        >
          {(v * 100).toFixed(0)}%
        </text>
      ))}
      {[0.04, 0.06, 0.08, 0.1].map((v) => (
        <text
          key={v}
          x={pad.l - 8}
          y={y(v) + 3}
          textAnchor="end"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-mute)"
        >
          {(v * 100).toFixed(0)}%
        </text>
      ))}
      <text x={w / 2} y={h - 1} textAnchor="middle" fontSize={9} className="etch" fill="var(--color-ink-mute)">
        volatility
      </text>
    </svg>
  )
}

function CorrelationGrid() {
  return (
    <div className="overflow-x-auto p-4">
      <table className="border-collapse">
        <thead>
          <tr>
            <th />
            {ASSET_CLASSES.map((a) => (
              <th key={a.id} className="etch px-1 pb-1 text-center" style={{ fontSize: 9 }}>
                {a.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CORRELATION.map((row, i) => (
            <tr key={i}>
              <td className="etch pr-2 text-right" style={{ fontSize: 9, whiteSpace: 'nowrap' }}>
                {ASSET_CLASSES[i].short}
              </td>
              {row.map((v, j) => (
                <td key={j} className="p-[2px]">
                  <div
                    className="flex h-[30px] w-[42px] items-center justify-center"
                    style={{
                      background:
                        i === j
                          ? 'var(--color-rule)'
                          : `color-mix(in srgb, var(--color-m-blue) ${Math.abs(v) * 78}%, var(--color-dial))`,
                    }}
                    title={`${ASSET_CLASSES[i].short} / ${ASSET_CLASSES[j].short}: ${v.toFixed(2)}`}
                  >
                    <span
                      className="readout text-[10px]"
                      style={{ color: Math.abs(v) > 0.5 ? '#fff' : 'var(--color-ink-mute)' }}
                    >
                      {v.toFixed(2)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PortfolioModule() {
  const [screenOn, setScreenOn] = useState(false)
  const cons = useMemo(() => consolidate(), [])

  const mu = useMemo(() => expectedReturns(screenOn), [screenOn])
  const cov = useMemo(
    () => covariance(screenOn ? VALUES_SCREEN.volAddBp / 10_000 : 0),
    [screenOn],
  )

  const floorWeight = constitutionalFloorWeight(cons.totalAssets)

  const { unconstrained, constrained } = useMemo(() => {
    const b = baseBounds()
    const cb: Bounds = { lower: [...b.lower], upper: [...b.upper] }
    cb.lower[0] = floorWeight // BMW may not fall below the constitutional minimum
    return {
      unconstrained: efficientFrontier(mu, cov, b),
      constrained: efficientFrontier(mu, cov, cb),
    }
  }, [mu, cov, floorWeight])

  const currentEr = portfolioReturn(cons.weights, mu)
  const currentVol = portfolioVol(cons.weights, cov)
  const currentSharpe = sharpe(currentEr, currentVol)

  const poc = priceOfControl(
    unconstrained,
    constrained,
    currentVol,
    cons.totalAssets,
    floorWeight,
    currentEr,
  )
  const conc = concentration(cons.weights)
  const rc = riskContribution(cons.weights, cov)

  // Screen impact, measured rather than asserted
  const muNoScreen = expectedReturns(false)
  const screenCostBp =
    (portfolioReturn(cons.weights, muNoScreen) - portfolioReturn(cons.weights, mu)) * 10_000

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── The price of control ────────────────────────────────────── */}
      <Panel
        title="The price of control"
        clause="Art.3"
        right={
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={screenOn}
              onChange={(e) => setScreenOn(e.target.checked)}
              className="accent-[#0066b1]"
            />
            <span className="etch etch-hi">Apply values screen</span>
            <ClauseTag id="Art.9" />
          </label>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr]">
          <div className="border-b border-rule p-4 xl:border-b-0 xl:border-r">
            <FrontierChart
              unconstrained={unconstrained}
              constrained={constrained}
              current={{ er: currentEr, vol: currentVol }}
              targetVol={poc?.maxCostAtVol ?? currentVol}
            />
            <div
              className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px]"
              style={{ color: 'var(--color-ink-mute)' }}
            >
              <span>
                <span style={{ color: 'var(--color-signal)' }}>———</span> unconstrained frontier
              </span>
              <span>
                <span style={{ color: 'var(--color-m-violet)' }}>– – –</span> constitution-constrained
              </span>
              <span>
                <span style={{ color: 'var(--color-m-red)' }}>●</span> the family today
              </span>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              The constrained frontier starts further right because the floor forbids the
              low-volatility portfolios entirely — it cannot begin below{' '}
              {poc ? fmtPct(poc.minVolConstrained, 1) : '—'}. The red bar marks the volatility at
              which the constraint costs the most return. The family's own position sits below both
              curves, which is a separate problem from the floor.
            </p>
          </div>

          <div className="p-4">
            {poc && (
              <>
                <Etch>The floor is a risk floor</Etch>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="readout text-[38px] leading-none" style={{ color: 'var(--color-m-red)' }}>
                    {fmtPct(poc.minVolConstrained, 1)}
                  </span>
                  <span className="etch">minimum reachable volatility</span>
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-dim)' }}>
                  against {fmtPct(poc.minVolUnconstrained, 1)} if the stake could be sold freely
                </div>

                <div className="mt-5 space-y-1.5 border-t border-rule pt-4">
                  <div className="flex justify-between gap-3">
                    <span className="etch">Minimum BMW weight, from the floor</span>
                    <span className="readout text-[12.5px]" style={{ color: 'var(--color-bone)' }}>
                      {fmtPct(poc.floorWeight, 1)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="etch">Actual BMW weight today</span>
                    <span className="readout text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                      {fmtPct(cons.bmwConcentration, 1)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="etch">Worst return gap, at {fmtPct(poc.maxCostAtVol, 1)} vol</span>
                    <span className="readout text-[12.5px]" style={{ color: 'var(--color-m-red)' }}>
                      {poc.maxCostBp.toFixed(0)} bp
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="etch">Return gap at today's risk</span>
                    <span className="readout text-[12.5px]" style={{ color: 'var(--color-amber)' }}>
                      {poc.costBp.toFixed(0)} bp
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-rule pt-4">
                  <Etch>Available without touching the floor</Etch>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="readout text-[30px] leading-none" style={{ color: 'var(--color-m-blue)' }}>
                      +{poc.inefficiencyBp.toFixed(0)}
                    </span>
                    <span className="etch">basis points per year</span>
                  </div>
                  <div className="readout mt-1 text-[13px]" style={{ color: 'var(--color-ink-dim)' }}>
                    {fmtEur((poc.inefficiencyBp / 10_000) * cons.totalAssets)} per year
                  </div>
                </div>
              </>
            )}

            <div className="mt-5">
              {poc && (
                <Finding tone="var(--color-m-blue)" label="Where the money actually goes">
                  At today's {fmtPct(currentVol, 1)} volatility a fully compliant portfolio, one
                  that never sells a share below the floor, returns{' '}
                  {fmtPct(poc.compliantErAtCurrentVol, 2)} against the {fmtPct(currentEr, 2)} the
                  family actually holds. That is {poc.inefficiencyBp.toFixed(0)} basis points
                  available at no constitutional cost whatever, because the family holds{' '}
                  {fmtPct(cons.bmwConcentration - poc.floorWeight, 1)} more BMW than Article 3
                  requires. The floor itself costs {poc.costBp.toFixed(0)} bp at this risk level.
                  The excess above it costs {poc.inefficiencyBp.toFixed(0)}. Most of what looks like
                  the price of continuity is the price of having left the position alone.
                </Finding>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Risk ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Risk and return" clause="Art.2">
          <div>
            <Row label="Expected return, nominal" value={fmtPct(currentEr, 2)} />
            <Row
              label="Real return"
              value={fmtPct((1 + currentEr) / (1 + MARKET.germanCPI.value) - 1, 2)}
              sub={`German CPI ${fmtPct(MARKET.germanCPI.value, 1)}`}
            />
            <Row label="Volatility" value={fmtPct(currentVol, 1)} />
            <Row
              label="Sharpe ratio"
              value={currentSharpe.toFixed(2)}
              sub={`Risk-free ${fmtPct(MARKET.riskFreeRate.value, 1)}`}
              emphasis
            />
            <Row
              label="Value at risk, 1 year 95%"
              value={fmtPct(valueAtRisk(currentEr, currentVol, 0.95), 1)}
              tone="var(--color-amber)"
            />
            <Row
              label="Value at risk, 1 year 99%"
              value={fmtPct(valueAtRisk(currentEr, currentVol, 0.99), 1)}
              tone="var(--color-m-red)"
            />
            <Row
              label="Expected shortfall, 95%"
              value={fmtPct(conditionalVaR(currentEr, currentVol, 0.95), 1)}
              tone="var(--color-m-red)"
            />
            <Row
              label="Effective number of bets"
              value={conc.effectiveBets.toFixed(2)}
              sub={`Herfindahl ${conc.hhi.toFixed(3)} across ${ASSET_CLASSES.length} classes`}
            />
          </div>
        </Panel>

        <Panel title="Allocation and risk contribution">
          <div className="p-4">
            {ASSET_CLASSES.map((a, i) => {
              const slice = cons.byAssetClass.find((s) => s.id === a.id)
              const weight = slice?.weight ?? 0
              return (
                <div key={a.id} className="mb-3 last:mb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12.5px]" style={{ color: 'var(--color-ink-dim)' }}>
                      {a.label}
                      {!a.liquid && (
                        <span className="ml-1.5 etch inline" style={{ display: 'inline' }}>
                          illiquid
                        </span>
                      )}
                    </span>
                    <span className="readout shrink-0 text-[12px]" style={{ color: 'var(--color-ink)' }}>
                      {fmtPct(weight, 1)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <MiniBar
                      value={weight}
                      tone={a.id === 'bmw' ? 'var(--color-m-red)' : 'var(--color-m-blue)'}
                      width={120}
                    />
                    <span className="readout text-[10.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                      {fmtPct(rc[i], 1)} of risk
                    </span>
                  </div>
                </div>
              )
            })}
            <p className="mt-4 border-t border-rule pt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              BMW carries {fmtPct(cons.bmwConcentration, 0)} of capital and{' '}
              {fmtPct(rc[0], 0)} of total portfolio risk. Concentration and risk are not the same
              number, and the gap between them is what diversification elsewhere is actually buying.
            </p>
          </div>
        </Panel>

        <Panel title="Values screen" clause="Art.9">
          <div className="p-4">
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
              Article 9 commits half a per cent of pooled dividend income to forced-labour
              documentation in perpetuity, terminable only by unanimity. A portfolio that funds that
              commitment from sectors the commitment exists to atone for is incoherent, so the
              screen is carried over from the constitution rather than bolted on.
            </p>
            <ul className="mt-3 space-y-1">
              {VALUES_SCREEN.excluded.map((e) => (
                <li key={e} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-ink-dim)' }}>
                  <span className="h-[5px] w-[5px]" style={{ background: 'var(--color-m-red)' }} />
                  {e}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-rule pt-3">
              <div className="flex justify-between gap-3">
                <span className="etch">Screen status</span>
                <span
                  className="readout text-[12px]"
                  style={{ color: screenOn ? 'var(--color-m-blue)' : 'var(--color-ink-mute)' }}
                >
                  {screenOn ? 'Applied' : 'Not applied'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="etch">Return impact</span>
                <span className="readout text-[12px]" style={{ color: 'var(--color-amber)' }}>
                  {screenOn ? `−${screenCostBp.toFixed(0)} bp` : `−${VALUES_SCREEN.dragBp} bp if applied`}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="etch">Cost per year</span>
                <span className="readout text-[12px]" style={{ color: 'var(--color-amber)' }}>
                  {fmtEur((VALUES_SCREEN.dragBp / 10_000) * cons.totalAssets)}
                </span>
              </div>
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              The screen costs roughly a tenth of what the control floor costs. Whatever the family
              debates about values-based investing, the expensive constraint is governance, not
              ethics.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Correlation matrix">
        <CorrelationGrid />
      </Panel>
    </div>
  )
}
