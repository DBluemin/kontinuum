import { useState } from 'react'
import {
  BLOCKING_MINORITY,
  CONTROL_HISTORY,
  POOL_FLOOR,
  PRESET_ACTIONS,
  STEFAN_SHARES,
  SUSANNE_SHARES,
  TAKEOVER_LADDER,
  applyAction,
  computeControl,
  freeFloat,
} from '../engines/control'
import { MARKET } from '../data/assumptions'
import {
  dec,
  ClauseTag,
  Etch,
  Finding,
  Panel,
  Row,
  fmtEur,
  fmtNum,
  fmtPct,
  fmtShares,
} from '../components/primitives'
import { MiniBar } from '../components/Gauges'

const BASE_SHARES = MARKET.sharesInIssue.value

/** Control as a function of the denominator — the curve Article 3 describes. */
function DilutionCurve({ current }: { current: number }) {
  const w = 640
  const h = 190
  const pad = { l: 44, r: 12, t: 12, b: 26 }
  const min = 500_000_000
  const max = 950_000_000

  const x = (s: number) => pad.l + ((s - min) / (max - min)) * (w - pad.l - pad.r)
  const y = (p: number) => pad.t + (1 - (p - 0.15) / (0.55 - 0.15)) * (h - pad.t - pad.b)

  const pooled: string[] = []
  const stefan: string[] = []
  for (let s = min; s <= max; s += 5_000_000) {
    const c = computeControl(s)
    pooled.push(`${x(s).toFixed(1)},${y(c.pooledPct).toFixed(1)}`)
    stefan.push(`${x(s).toFixed(1)},${y(c.stefanPct).toFixed(1)}`)
  }

  const cur = computeControl(current)
  const blockingBreak = STEFAN_SHARES / BLOCKING_MINORITY
  const floorBreak = (STEFAN_SHARES + SUSANNE_SHARES) / POOL_FLOOR

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Control against shares in issue">
      {/* Threshold lines */}
      {[
        { p: POOL_FLOOR, label: '27% pool floor', tone: 'var(--color-amber)' },
        { p: BLOCKING_MINORITY, label: '25% blocking quarter', tone: 'var(--color-m-red)' },
        { p: 0.5, label: '50% majority', tone: 'var(--color-rule-hi)' },
      ].map((t) => (
        <g key={t.label}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={y(t.p)}
            y2={y(t.p)}
            stroke={t.tone}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.75}
          />
          <text
            x={w - pad.r}
            y={y(t.p) - 4}
            textAnchor="end"
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill={t.tone}
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Where each threshold breaks */}
      {blockingBreak <= max && (
        <line
          x1={x(blockingBreak)}
          x2={x(blockingBreak)}
          y1={pad.t}
          y2={h - pad.b}
          stroke="var(--color-m-red)"
          strokeWidth={1}
          opacity={0.5}
        />
      )}
      {floorBreak <= max && (
        <line
          x1={x(floorBreak)}
          x2={x(floorBreak)}
          y1={pad.t}
          y2={h - pad.b}
          stroke="var(--color-amber)"
          strokeWidth={1}
          opacity={0.5}
        />
      )}

      <polyline points={pooled.join(' ')} fill="none" stroke="var(--color-signal)" strokeWidth={1.8} />
      <polyline points={stefan.join(' ')} fill="none" stroke="var(--color-bone)" strokeWidth={1.4} />

      {/* Observed record */}
      {CONTROL_HISTORY.map((o) => {
        const c = computeControl(o.sharesInIssue)
        return (
          <g key={o.label}>
            <circle cx={x(o.sharesInIssue)} cy={y(c.pooledPct)} r={3} fill="var(--color-m-blue)" />
            <text
              x={x(o.sharesInIssue)}
              y={y(c.pooledPct) - 8}
              textAnchor="middle"
              fontSize={8}
              fontFamily="var(--font-mono)"
              fill="var(--color-ink-dim)"
            >
              {o.label}
            </text>
          </g>
        )
      })}

      {/* Live position */}
      <line
        x1={x(current)}
        x2={x(current)}
        y1={pad.t}
        y2={h - pad.b}
        stroke="var(--color-ink)"
        strokeWidth={1.5}
      />
      <circle cx={x(current)} cy={y(cur.pooledPct)} r={4} fill="var(--color-ink)" />
      <circle cx={x(current)} cy={y(cur.stefanPct)} r={3} fill="var(--color-bone)" />

      {/* Axis */}
      {[500, 600, 700, 800, 900].map((m) => (
        <text
          key={m}
          x={x(m * 1_000_000)}
          y={h - 8}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-mute)"
        >
          {m}m
        </text>
      ))}
      {[0.2, 0.3, 0.4, 0.5].map((p) => (
        <text
          key={p}
          x={pad.l - 6}
          y={y(p) + 3}
          textAnchor="end"
          fontSize={8}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-mute)"
        >
          {dec(p * 100, 0)}%
        </text>
      ))}
    </svg>
  )
}

export function OwnershipModule() {
  const [shares, setShares] = useState(BASE_SHARES)
  const c = computeControl(shares)
  const base = computeControl(BASE_SHARES)
  const price = MARKET.bmwSharePrice.value
  const ff = freeFloat(c)

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── Dilution lab ────────────────────────────────────────────── */}
      <Panel
        title="Dilution lab"
        clause="Art.3"
        right={
          <button
            onClick={() => setShares(BASE_SHARES)}
            className="etch etch-hi border border-rule px-2 py-1 transition-colors hover:bg-panel-hi"
          >
            Reset to today
          </button>
        }
      >
        <div className="p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Etch>Ordinary shares in issue</Etch>
              <div className="readout mt-1 text-[26px] leading-none" style={{ color: 'var(--color-ink)' }}>
                {fmtNum(shares)}
              </div>
              <div className="mt-1 text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
                {shares === BASE_SHARES
                  ? 'As registered 30 June 2026'
                  : `${shares > BASE_SHARES ? '+' : ''}${fmtShares(shares - BASE_SHARES)} against today`}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <Etch>Pooled</Etch>
                <div
                  className="readout text-[20px]"
                  style={{ color: c.floorBreached ? 'var(--color-m-red)' : 'var(--color-signal)' }}
                >
                  {fmtPct(c.pooledPct, 2)}
                </div>
              </div>
              <div>
                <Etch>Stefan Quandt</Etch>
                <div
                  className="readout text-[20px]"
                  style={{ color: c.blockingBreached ? 'var(--color-m-red)' : 'var(--color-bone)' }}
                >
                  {fmtPct(c.stefanPct, 2)}
                </div>
              </div>
              <div>
                <Etch>Free float</Etch>
                <div className="readout text-[20px]" style={{ color: 'var(--color-ink-dim)' }}>
                  {fmtPct(ff, 1)}
                </div>
              </div>
            </div>
          </div>

          <input
            type="range"
            min={500_000_000}
            max={950_000_000}
            step={1_000_000}
            value={shares}
            onChange={(e) => setShares(Number(e.target.value))}
            className="mt-5 w-full accent-[#0066b1]"
            aria-label="Shares in issue"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setShares(applyAction(shares, a))}
                className="border border-rule px-2.5 py-1 text-[11.5px] transition-colors hover:border-rule-hi hover:bg-panel-hi"
                style={{ color: 'var(--color-ink-dim)' }}
              >
                {a.label}
                {a.clauseNote && <ClauseTag id={a.clauseNote} className="ml-1.5" />}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <DilutionCurve current={shares} />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
            <span>
              <span style={{ color: 'var(--color-signal)' }}>———</span> pooled control
            </span>
            <span>
              <span style={{ color: 'var(--color-bone)' }}>———</span> Stefan Quandt alone
            </span>
            <span>vertical rules mark where each threshold breaks</span>
          </div>
        </div>
      </Panel>

      {/* ── Binding constraint ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Which constraint binds" clause="App.B">
          <div>
            <Row
              label="Blocking quarter breaks at"
              value={`${fmtNum(Math.round(STEFAN_SHARES / BLOCKING_MINORITY))} shares`}
              sub={`${fmtShares(base.issuanceHeadroomShares)} of issuance headroom — ${fmtPct(base.issuanceHeadroomShares / BASE_SHARES, 2)} of capital`}
              tone="var(--color-m-red)"
              clause="App.B"
              emphasis
            />
            <Row
              label="Pool floor breaks at"
              value={`${fmtNum(Math.round((STEFAN_SHARES + SUSANNE_SHARES) / POOL_FLOOR))} shares`}
              sub={`${fmtShares(base.floorIssuanceHeadroomShares)} of issuance headroom`}
              tone="var(--color-amber)"
              clause="Art.3"
            />
            <Row
              label="Distance between them"
              value={`${dec(base.bindingMultiple, 0)}×`}
              sub="The floor is not the binding constraint and never has been"
            />
            <div className="p-4">
              <Finding tone="var(--color-m-red)" label="The constitution monitors the wrong number">
                Article 3 asks the Owners' Council to test a 27% pool floor quarterly. Encoding both
                thresholds shows the floor sits {dec(base.bindingMultiple, 0)}× further away than
                Stefan Quandt's individual blocking quarter. A quarterly test against the floor would
                have reported "no action required" through the entire June 2026 conversion, while the
                veto the family actually relies on lost{' '}
                {dec(
                  Math.abs(
                    computeControl(CONTROL_HISTORY[1].sharesInIssue).stefanPct * 100 -
                      base.stefanPct * 100,
                  ),
                  2,
                )}{' '}
                percentage points. The platform tests both.
              </Finding>
            </div>
          </div>
        </Panel>

        <Panel title="Cap table" clause="E1">
          <div>
            <Row
              label="Stefan Quandt"
              sub="Deputy Chairman, Supervisory Board · carries the Sperrminorität"
              value={
                <>
                  {fmtNum(STEFAN_SHARES)}
                  <div style={{ color: 'var(--color-ink-mute)' }}>
                    {fmtPct(c.stefanPct, 2)} · {fmtEur(STEFAN_SHARES * price)}
                  </div>
                </>
              }
            />
            <Row
              label="Susanne Klatten"
              sub="Supervisory Board member since 1997"
              value={
                <>
                  {fmtNum(SUSANNE_SHARES)}
                  <div style={{ color: 'var(--color-ink-mute)' }}>
                    {fmtPct(c.susannePct, 2)} · {fmtEur(SUSANNE_SHARES * price)}
                  </div>
                </>
              }
            />
            <Row
              label="Pooled total"
              value={
                <>
                  {fmtNum(c.pooledShares)}
                  <div style={{ color: 'var(--color-ink-mute)' }}>
                    {fmtPct(c.pooledPct, 2)} · {fmtEur(c.pooledShares * price)}
                  </div>
                </>
              }
              emphasis
            />
            <Row label="Free float" value={fmtPct(ff, 2)} sub="Where an accumulator operates" />
            <Row
              label="Family seats on the Supervisory Board"
              value="2 of 20"
              sub="Half the seats are employee-elected under the Mitbestimmungsgesetz — the family elects at most 10 even at a majority of capital"
              clause="Art.4"
            />
          </div>
        </Panel>
      </div>

      {/* ── Takeover ladder ─────────────────────────────────────────── */}
      <Panel title="Threshold ladder against the free float" clause="Art.3">
        <div>
          {TAKEOVER_LADDER.map((t) => {
            const reachable = t.pct <= ff
            return (
              <div
                key={t.label}
                className="flex items-start gap-4 border-b border-rule px-4 py-2.5 last:border-b-0"
              >
                <span
                  className="readout w-[42px] shrink-0 text-[13px]"
                  style={{ color: reachable ? 'var(--color-ink)' : 'var(--color-ink-mute)' }}
                >
                  {fmtPct(t.pct, 0)}
                </span>
                <MiniBar
                  value={Math.min(1, t.pct / ff)}
                  tone={reachable ? 'var(--color-m-violet)' : 'var(--color-rule)'}
                  width={70}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[13px]"
                    style={{ color: reachable ? 'var(--color-ink)' : 'var(--color-ink-mute)' }}
                  >
                    {t.label}
                  </span>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                    {t.consequence}
                  </p>
                </div>
              </div>
            )
          })}
          <div className="px-4 py-3">
            <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              A single accumulator would need {fmtPct(0.25 / ff)} of the entire free float to match
              the family's blocking quarter. The bars show each threshold as a share of the float
              available to buy.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
