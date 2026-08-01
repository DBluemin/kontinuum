import { Dial } from '../components/Dial'
import { LinearGauge } from '../components/Gauges'
import {
  ClauseTag,
  Finding,
  Panel,
  Row,
  fmtEur,
  fmtNum,
  fmtPct,
  fmtShares,
} from '../components/primitives'
import {
  CONTROL_HISTORY,
  CURRENT_DRIFT,
  POOL_FLOOR,
  BLOCKING_MINORITY,
  computeControl,
} from '../engines/control'
import { consolidate } from '../engines/consolidation'
import { DISTRIBUTION, MARKET } from '../data/assumptions'
import { MEMBERS, G5 } from '../data/family'
import { POOLED_SHARES } from '../engines/control'

/** Fraction of the governance artifacts Art.7, E1 and E4 require that exist. */
export function continuityReadiness(): { score: number; missing: number; total: number } {
  let have = 0
  let total = 0
  for (const m of MEMBERS) {
    const flags = [
      m.compliance.prenup,
      m.compliance.willConsistent,
      m.compliance.standingProxy,
      m.compliance.conflictsDeclared,
      m.education.seminar16,
      m.education.literacy18,
      m.education.mentorship21,
    ]
    for (const f of flags) {
      total++
      if (f === true) have++
    }
  }
  return { score: have / total, missing: total - have, total }
}

export interface Advisory {
  level: 'alarm' | 'advisory'
  text: string
  clause: string
}

export function advisories(): Advisory[] {
  const c = computeControl(MARKET.sharesInIssue.value)
  const cons = consolidate()
  const readiness = continuityReadiness()
  const reserveYears =
    DISTRIBUTION.reserveOpening.value / (POOLED_SHARES * DISTRIBUTION.basePerShare.value)
  const undocumented = G5.filter((m) => m.birthYearProvenance === 'undisclosed').length
  const noProxy = MEMBERS.filter((m) => m.poolMember && m.compliance.standingProxy !== true)

  const out: Advisory[] = []

  out.push({
    level: 'alarm',
    text: `Blocking quarter holds on ${fmtShares(c.issuanceHeadroomShares)} shares of issuance headroom — ${fmtPct(c.issuanceHeadroomShares / c.sharesInIssue, 2)} of capital. The Art.3 pool floor is ${c.bindingMultiple.toFixed(0)}× further away and is not the binding constraint.`,
    clause: 'App.B',
  })

  out.push({
    level: 'advisory',
    text: `Control drifting at ${CURRENT_DRIFT.toFixed(0)} bp per quarter since the June 2026 conversion. No shares were traded in the period.`,
    clause: 'Art.3',
  })

  if (undocumented > 0) {
    out.push({
      level: 'alarm',
      text: `${undocumented} of ${G5.length} G5 members are not documented. Succession modelling for the Stefan branch runs on placeholders and cannot be relied on until the Owners' Council holds real data.`,
      clause: 'Art.7',
    })
  }

  if (noProxy.length > 0) {
    out.push({
      level: 'alarm',
      text: `${noProxy.map((m) => m.name).join(', ')} has no standing proxy named. Art.7 requires one for every pooled holding, exercisable on death or incapacity — the single omission that ended the Harald branch.`,
      clause: 'Art.7',
    })
  }

  out.push({
    level: reserveYears < 2 ? 'advisory' : 'advisory',
    text: `Continuity Reserve covers ${reserveYears.toFixed(2)} years of base distribution. A repeat of 2020 (1.90 € per share) draws it down by roughly ${fmtEur(POOLED_SHARES * (DISTRIBUTION.basePerShare.value - 1.9))} in one year.`,
    clause: 'E5',
  })

  out.push({
    level: 'advisory',
    text: `BMW is ${fmtPct(cons.bmwConcentration)} of consolidated wealth. Sale below the floor is prohibited, so the concentration is a governance position rather than an allocation decision.`,
    clause: 'Art.2',
  })

  out.push({
    level: 'advisory',
    text: `Governance readiness at ${fmtPct(readiness.score)} — ${readiness.missing} of ${readiness.total} required artifacts (prenuptial agreements, consistent wills, standing proxies, conflicts declarations, education milestones) are not in place.`,
    clause: 'E1',
  })

  return out
}

export function Bridge() {
  const c = computeControl(MARKET.sharesInIssue.value)
  const cons = consolidate()
  const readiness = continuityReadiness()
  const adv = advisories()
  const reserveYears =
    DISTRIBUTION.reserveOpening.value / (POOLED_SHARES * DISTRIBUTION.basePerShare.value)

  const prev = computeControl(CONTROL_HISTORY[1].sharesInIssue)

  return (
    <div className="animate-fade-up">
      {/* ── The binnacle ────────────────────────────────────────────── */}
      <section className="panel px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.5fr_1fr]">
          {/* Drift — a speedometer for the erosion of control */}
          <div className="flex justify-center">
            <Dial
              value={CURRENT_DRIFT}
              min={-150}
              max={150}
              label="Control drift"
              sublabel="basis points per quarter, no shares traded"
              format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
              redline={{ from: -150, to: -75 }}
              advisory={{ from: -75, to: -25 }}
              markers={[{ value: 0, label: 'nil', tone: 'var(--color-bone)' }]}
              size={210}
              majors={7}
              clause="Art.3"
              delay={120}
            />
          </div>

          {/* Control — the dominant instrument */}
          <div className="flex justify-center">
            <Dial
              value={c.pooledPct * 100}
              min={10}
              max={60}
              label="Pooled control"
              sublabel={`per cent of voting capital · ${fmtNum(c.pooledShares)} of ${fmtNum(c.sharesInIssue)} shares`}
              format={(v) => `${v.toFixed(2)}%`}
              redline={{ from: 10, to: POOL_FLOOR * 100 }}
              advisory={{ from: POOL_FLOOR * 100, to: POOL_FLOOR * 100 + 3 }}
              markers={[
                { value: POOL_FLOOR * 100, label: 'floor', tone: 'var(--color-bone)' },
                { value: 50, label: 'majority', tone: 'var(--color-bone)' },
              ]}
              size={296}
              majors={6}
              clause="Art.3"
              tone="var(--color-signal)"
            />
          </div>

          {/* Reserve — the fuel gauge */}
          <div className="flex justify-center">
            <Dial
              value={reserveYears}
              min={0}
              max={6}
              label="Reserve coverage"
              sublabel={`years of base distribution · ${fmtEur(DISTRIBUTION.reserveOpening.value)} held`}
              format={(v) => `${v.toFixed(2)}`}
              redline={{ from: 0, to: 1 }}
              advisory={{ from: 1, to: 2 }}
              size={210}
              majors={7}
              clause="E5"
              delay={240}
            />
          </div>
        </div>

        {/* ── The signature: a hard wall, read in shares ────────────── */}
        <div className="mt-4 border-t border-rule">
          <LinearGauge
            value={c.stefanPct * 100}
            min={20}
            max={30}
            wall={{ value: BLOCKING_MINORITY * 100, label: '25.00% — veto lost' }}
            advisoryWidth={1}
            label="Sperrminorität — Stefan Quandt"
            clause="App.B"
            format={(v) => `${v.toFixed(v % 1 === 0 ? 0 : 2)}%`}
            tickStep={2}
            breached={c.blockingBreached}
            headroom={
              <>
                <span style={{ color: 'var(--color-ink)' }} className="readout">
                  {fmtShares(c.blockingHeadroomShares)}
                </span>{' '}
                shares of headroom before the blocking quarter is lost —{' '}
                <span style={{ color: 'var(--color-ink)' }} className="readout">
                  {fmtShares(c.issuanceHeadroomShares)}
                </span>{' '}
                if BMW issues rather than he sells
              </>
            }
          />
        </div>
      </section>

      {/* ── Secondary instruments ───────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Concentration" clause="Art.2">
          <div className="px-4 py-4">
            <div className="flex items-baseline gap-2">
              <span className="readout text-[34px] leading-none" style={{ color: 'var(--color-ink)' }}>
                {fmtPct(cons.bmwConcentration)}
              </span>
              <span className="etch">in one security</span>
            </div>
            <div className="mt-4 flex h-2 w-full overflow-hidden">
              {cons.byAssetClass.map((s) => (
                <div
                  key={s.id}
                  title={`${s.label} — ${fmtPct(s.weight)}`}
                  style={{
                    width: `${s.weight * 100}%`,
                    background:
                      s.id === 'bmw' ? 'var(--color-m-red)' : 'var(--color-rule-hi)',
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              {fmtEur(cons.totalAssets)} of capital under management. Liquid share{' '}
              {fmtPct(cons.liquidShare)}.
            </p>
          </div>
        </Panel>

        <Panel title="Continuity readiness" clause="Art.7">
          <div className="px-4 py-4">
            <div className="flex items-baseline gap-2">
              <span
                className="readout text-[34px] leading-none"
                style={{ color: readiness.score < 0.6 ? 'var(--color-m-red)' : 'var(--color-ink)' }}
              >
                {fmtPct(readiness.score, 0)}
              </span>
              <span className="etch">artifacts in place</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-[3px]">
              {MEMBERS.flatMap((m) =>
                [
                  m.compliance.prenup,
                  m.compliance.willConsistent,
                  m.compliance.standingProxy,
                  m.compliance.conflictsDeclared,
                  m.education.seminar16,
                  m.education.literacy18,
                  m.education.mentorship21,
                ].map((f, i) => (
                  <div
                    key={`${m.id}-${i}`}
                    className="h-[9px]"
                    title={m.name}
                    style={{
                      background:
                        f === true
                          ? 'var(--color-m-blue)'
                          : f === false
                            ? 'var(--color-m-red)'
                            : 'var(--color-rule)',
                    }}
                  />
                )),
              )}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
              Seven artifacts across {MEMBERS.length} members. Grey is undisclosed, not compliant.
            </p>
          </div>
        </Panel>

        <Panel title="The record" clause="App.B">
          <div>
            {CONTROL_HISTORY.map((o, i) => {
              const s = computeControl(o.sharesInIssue)
              return (
                <Row
                  key={o.label}
                  label={o.label}
                  sub={o.cause}
                  value={fmtPct(s.pooledPct, 2)}
                  emphasis={i === CONTROL_HISTORY.length - 1}
                  tone={
                    s.pooledPct >= 0.5
                      ? 'var(--color-m-blue)'
                      : i === CONTROL_HISTORY.length - 1
                        ? 'var(--color-amber)'
                        : undefined
                  }
                />
              )
            })}
            <div className="px-4 py-3">
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-mute)' }}>
                Holdings unchanged at {fmtNum(POOLED_SHARES)} shares throughout. The percentage
                moved {fmtPct(Math.abs(prev.pooledPct - c.pooledPct), 2)} because the denominator
                moved.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Advisories ──────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Advisories">
          <div>
            {adv.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-rule px-4 py-3 last:border-b-0"
              >
                <span
                  className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{
                    background:
                      a.level === 'alarm' ? 'var(--color-m-red)' : 'var(--color-amber)',
                  }}
                />
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: 'var(--color-ink-dim)' }}
                >
                  {a.text}
                  <ClauseTag id={a.clause} className="ml-2" />
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="What the encoding found">
          <div className="space-y-5 px-4 py-5">
            <Finding tone="var(--color-m-red)" label="The floor is the wrong alarm">
              The constitution asks the Owners' Council to test a 27% pool floor quarterly.
              Encoding both thresholds shows the floor is {c.bindingMultiple.toFixed(0)}× further
              away than Stefan Quandt's individual blocking quarter. The document monitors the
              constraint that is not binding.
            </Finding>
            <Finding label="Two currencies, one holder">
              At {fmtPct(c.stefanShares / c.pooledShares)} of the pool, Stefan Quandt carries every
              simple-majority decision alone while Susanne Klatten holds a veto over everything
              requiring 75%. Each of them can stop the other on the questions that matter, and
              neither can govern. The Decision Simulator resolves any specific case.
            </Finding>
          </div>
        </Panel>
      </div>
    </div>
  )
}
