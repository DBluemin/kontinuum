import { useMemo, useState } from 'react'
import { BODIES, CLAUSES, DECISION_MATRIX, type Role } from '../data/constitution'
import { MEMBERS, age } from '../data/family'
import { powerProfile, resolve, type Voter } from '../engines/governance'
import { useClause } from '../components/ClauseContext'
import { ClauseTag, Etch, Finding, Panel, fmtPct } from '../components/primitives'
import { MiniBar } from '../components/Gauges'

function buildVoters(includeG5: boolean): Voter[] {
  return MEMBERS.filter((m) => {
    const a = age(m)
    if (m.generation === 'G4') return true
    return includeG5 && (a === null || a >= 18)
  }).map((m) => ({
    id: m.id,
    name: m.name,
    shares: m.shares,
    hasHeadVote: true,
    isPoolMember: m.poolMember,
  }))
}

/**
 * Admitting G5 to equity is the transition Gersick calls the move from sibling
 * partnership to cousin consortium — where family firms most often fail. The
 * simulator lets the Owners' Council see the arithmetic before it signs.
 */
function withG5Admitted(voters: Voter[]): Voter[] {
  const g5 = MEMBERS.filter((m) => m.generation === 'G5')
  const stefanShare = 155_500_000
  const susanneShare = 126_200_000
  const perStefanHeir = stefanShare / 3 / 2 // first tranche, split two heirs
  const perSusanneHeir = susanneShare / 3 / 3

  return voters.map((v) => {
    if (v.id === 'stefan') return { ...v, shares: stefanShare - perStefanHeir * 2 }
    if (v.id === 'susanne') return { ...v, shares: susanneShare - perSusanneHeir * 3 }
    const m = g5.find((x) => x.id === v.id)
    if (!m) return v
    return {
      ...v,
      isPoolMember: true,
      shares: m.branch === 'Stefan' ? perStefanHeir : perSusanneHeir,
    }
  })
}

const ROLE_TONE: Record<Role, string> = {
  'A/R': 'var(--color-m-blue)',
  R: 'var(--color-m-blue)',
  A: 'var(--color-signal)',
  C: 'var(--color-ink-dim)',
  I: 'var(--color-ink-mute)',
}

export function ConstitutionModule() {
  const { open } = useClause()
  const [decisionId, setDecisionId] = useState(DECISION_MATRIX[1].id)
  const [g5Admitted, setG5Admitted] = useState(false)
  const [supporters, setSupporters] = useState<Set<string>>(new Set(['stefan']))

  const voters = useMemo(() => {
    const base = buildVoters(g5Admitted)
    return g5Admitted ? withG5Admitted(base) : base
  }, [g5Admitted])

  const decision = DECISION_MATRIX.find((d) => d.id === decisionId)!
  const verdict = resolve(decision, voters, supporters)
  const profiles = useMemo(() => powerProfile(voters, DECISION_MATRIX), [voters])

  const toggle = (id: string) => {
    setSupporters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grouped = useMemo(() => {
    const g = new Map<string, typeof CLAUSES>()
    for (const c of CLAUSES) {
      if (!g.has(c.group)) g.set(c.group, [])
      g.get(c.group)!.push(c)
    }
    return [...g.entries()]
  }, [])

  const poolTotal = voters.filter((v) => v.isPoolMember).reduce((s, v) => s + v.shares, 0)

  return (
    <div className="animate-fade-up space-y-4">
      {/* ── Decision simulator ──────────────────────────────────────── */}
      <Panel
        title="Decision simulator"
        clause="Art.4"
        right={
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={g5Admitted}
              onChange={(e) => {
                setG5Admitted(e.target.checked)
                setSupporters(new Set(['stefan']))
              }}
              className="accent-[#0066b1]"
            />
            <span className="etch etch-hi">Admit G5 to equity</span>
          </label>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Choose the decision and the votes */}
          <div className="border-b border-rule p-4 lg:border-b-0 lg:border-r">
            <Etch className="mb-2">Proposed decision</Etch>
            <select
              value={decisionId}
              onChange={(e) => setDecisionId(e.target.value)}
              className="w-full border border-rule bg-dial px-3 py-2 text-[13px]"
              style={{ color: 'var(--color-ink)' }}
            >
              {DECISION_MATRIX.map((d) => (
                <option key={d.id} value={d.id} style={{ background: '#0a0e19' }}>
                  {d.decision}
                </option>
              ))}
            </select>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Etch>Threshold</Etch>
              <span className="readout text-[12px]" style={{ color: 'var(--color-bone)' }}>
                {decision.thresholdLabel}
              </span>
              <ClauseTag id={decision.clause} />
            </div>

            <Etch className="mb-2 mt-6">Votes in favour</Etch>
            <div className="space-y-1.5">
              {voters
                .filter((v) => v.isPoolMember)
                .map((v) => {
                  const on = supporters.has(v.id)
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(v.id)}
                      className="flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors"
                      style={{
                        borderColor: on ? 'var(--color-m-blue)' : 'var(--color-rule)',
                        background: on
                          ? 'color-mix(in srgb, var(--color-m-blue) 14%, transparent)'
                          : 'transparent',
                      }}
                    >
                      <span
                        className="text-[13px]"
                        style={{ color: on ? 'var(--color-ink)' : 'var(--color-ink-dim)' }}
                      >
                        {v.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <MiniBar
                          value={poolTotal ? v.shares / poolTotal : 0}
                          tone={on ? 'var(--color-m-blue)' : 'var(--color-rule-hi)'}
                          width={52}
                        />
                        <span
                          className="readout w-[46px] text-right text-[12px]"
                          style={{ color: on ? 'var(--color-ink)' : 'var(--color-ink-mute)' }}
                        >
                          {fmtPct(poolTotal ? v.shares / poolTotal : 0)}
                        </span>
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* The verdict */}
          <div className="p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span
                className="font-display text-[26px] leading-none"
                style={{
                  color: verdict.carries ? 'var(--color-m-blue)' : 'var(--color-m-red)',
                  fontVariationSettings: "'wdth' 115, 'wght' 700",
                  letterSpacing: '0.08em',
                }}
              >
                {verdict.carries ? 'CARRIES' : 'BLOCKED'}
              </span>
              <span className="readout text-[13px]" style={{ color: 'var(--color-ink-dim)' }}>
                {fmtPct(verdict.shareSupport)} of {fmtPct(verdict.shareRequired, 0)} required
              </span>
            </div>

            <div className="relative mt-4 h-[22px] w-full bg-dial">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${verdict.shareSupport * 100}%`,
                  background: verdict.carries ? 'var(--color-m-blue)' : 'var(--color-m-violet)',
                  transition: 'width 320ms ease',
                }}
              />
              <div
                className="absolute inset-y-0 w-[2px]"
                style={{ left: `${verdict.shareRequired * 100}%`, background: 'var(--color-ink)' }}
              />
            </div>

            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
              {verdict.reason}
            </p>

            <dl className="mt-5 space-y-2 border-t border-rule pt-4">
              <div className="flex justify-between gap-4">
                <dt className="etch">Can pass alone</dt>
                <dd className="text-right text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                  {verdict.soloPassers.length ? verdict.soloPassers.join(', ') : 'Nobody'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="etch">Can block alone</dt>
                <dd
                  className="text-right text-[12.5px]"
                  style={{
                    color: verdict.soloBlockers.length ? 'var(--color-m-red)' : 'var(--color-ink)',
                  }}
                >
                  {verdict.soloBlockers.length ? verdict.soloBlockers.join(', ') : 'Nobody'}
                </dd>
              </div>
              {verdict.headSupport !== null && (
                <div className="flex justify-between gap-4">
                  <dt className="etch">Assembly, by head</dt>
                  <dd className="readout text-right text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
                    {fmtPct(verdict.headSupport)} of {fmtPct(verdict.headRequired ?? 0)}
                  </dd>
                </div>
              )}
              {verdict.minimalCoalitions.length > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="etch">Smallest winning coalition</dt>
                  <dd className="text-right text-[12.5px]" style={{ color: 'var(--color-ink-dim)' }}>
                    {verdict.minimalCoalitions[0].join(' + ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </Panel>

      {/* ── Power profile ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Where power actually sits" clause="App.D">
          <div className="p-4">
            {profiles.map((p) => (
              <div key={p.name} className="mb-4 last:mb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px]" style={{ color: 'var(--color-ink)' }}>
                    {p.name}
                  </span>
                  <span className="readout text-[12px]" style={{ color: 'var(--color-ink-dim)' }}>
                    {fmtPct(p.sharePct)} of the pool
                  </span>
                </div>
                <div className="mt-2 flex h-[6px] w-full overflow-hidden">
                  <div
                    style={{
                      width: `${(p.carriesAlone.length / DECISION_MATRIX.length) * 100}%`,
                      background: 'var(--color-m-blue)',
                    }}
                  />
                  <div
                    style={{
                      width: `${(p.vetoes.length / DECISION_MATRIX.length) * 100}%`,
                      background: 'var(--color-m-violet)',
                    }}
                  />
                  <div
                    style={{
                      width: `${(p.powerless.length / DECISION_MATRIX.length) * 100}%`,
                      background: 'var(--color-rule)',
                    }}
                  />
                </div>
                <div
                  className="mt-1.5 flex flex-wrap gap-4 text-[11px]"
                  style={{ color: 'var(--color-ink-mute)' }}
                >
                  <span>{p.carriesAlone.length} carried alone</span>
                  <span>{p.vetoes.length} veto only</span>
                  <span>{p.powerless.length} no influence</span>
                </div>
              </div>
            ))}
            <div className="mt-5 border-t border-rule pt-4">
              <Finding label="Asymmetry, not deadlock">
                Class framed the danger as a 50/50 split that paralyses. This pool is 55/45, which
                produces a different failure: one holder decides every ordinary question alone, the
                other can only ever say no. Article 10 is the answer — amendment needs the Assembly
                by head as well as the pool by share, so the larger holder blocks change but cannot
                impose it.
              </Finding>
            </div>
          </div>
        </Panel>

        <Panel title="Governance bodies" clause="Art.4">
          <div>
            {BODIES.map((b) => (
              <div key={b.name} className="border-b border-rule px-4 py-3 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px]" style={{ color: 'var(--color-ink)' }}>
                    {b.name}
                  </span>
                  <span className="etch shrink-0">{b.cadence}</span>
                </div>
                <p
                  className="mt-1 text-[12px] leading-relaxed"
                  style={{ color: 'var(--color-ink-dim)' }}
                >
                  {b.mandate}
                </p>
                <p
                  className="mt-1 text-[11.5px] leading-relaxed"
                  style={{ color: 'var(--color-m-red)' }}
                >
                  Cannot: {b.cannot}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Appendix D matrix ───────────────────────────────────────── */}
      <Panel title="Decision rights matrix" clause="App.D">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Decision', 'Assembly', 'Family Council', "Owners' Council", 'Board seats', 'Threshold'].map(
                  (h) => (
                    <th
                      key={h}
                      className="etch whitespace-nowrap border-b border-rule px-3 py-2 text-left"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {DECISION_MATRIX.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer transition-colors hover:bg-panel-hi"
                  onClick={() => setDecisionId(d.id)}
                >
                  <td
                    className="border-b border-rule px-3 py-2"
                    style={{
                      color: d.id === decisionId ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                    }}
                  >
                    {d.decision}
                  </td>
                  {([d.assembly, d.familyCouncil, d.ownersCouncil, d.boardSeats] as Role[]).map(
                    (r, i) => (
                      <td key={i} className="border-b border-rule px-3 py-2">
                        <span className="readout text-[11.5px]" style={{ color: ROLE_TONE[r] }}>
                          {r}
                        </span>
                      </td>
                    ),
                  )}
                  <td className="border-b border-rule px-3 py-2">
                    <span
                      className="readout whitespace-nowrap text-[11.5px]"
                      style={{
                        color:
                          d.threshold === 'unanimity'
                            ? 'var(--color-m-red)'
                            : d.threshold === 'share-75' || d.threshold === 'dual'
                              ? 'var(--color-amber)'
                              : 'var(--color-ink-dim)',
                      }}
                    >
                      {d.thresholdLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
            R responsible · A accountable · C consulted · I informed. Select a row to load it into
            the simulator.
          </p>
        </div>
      </Panel>

      {/* ── Clause library ──────────────────────────────────────────── */}
      <Panel title="Clause library" clause="Art.10">
        <div className="p-4">
          {grouped.map(([group, clauses]) => (
            <div key={group} className="mb-5 last:mb-0">
              <Etch className="mb-2">{group}</Etch>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {clauses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => open(c.id)}
                    className="border border-rule px-3 py-2.5 text-left transition-colors hover:border-rule-hi hover:bg-panel-hi"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] leading-snug" style={{ color: 'var(--color-ink)' }}>
                        {c.title}
                      </span>
                      <span
                        className="readout shrink-0 text-[10px]"
                        style={{ color: 'var(--color-bone)' }}
                      >
                        §{c.id}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px]" style={{ color: 'var(--color-ink-mute)' }}>
                      {c.params.length} parameter{c.params.length === 1 ? '' : 's'} · drives{' '}
                      {c.drives.length} module{c.drives.length === 1 ? '' : 's'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
