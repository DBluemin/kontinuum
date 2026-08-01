/**
 * Governance engine — Appendix D made executable.
 *
 * The constitution splits two currencies deliberately: money votes in the
 * Owners' Council, people vote in the Assembly, and amendment needs both. This
 * resolver takes a proposed decision and the live cap table and returns not
 * just whether it carries, but who can carry it alone and who can stop it.
 * That second question is the one the family actually needs answered.
 */

import type { DecisionRight, ThresholdKind } from '../data/constitution'
import { dec } from '../lib/format'

export interface Voter {
  id: string
  name: string
  shares: number
  /** Assembly vote by head — all adult descendants, not only pool members. */
  hasHeadVote: boolean
  /** Owners' Council vote by share — pool members only. */
  isPoolMember: boolean
}

export interface Verdict {
  carries: boolean
  requiredLabel: string
  /** Share support as a fraction of pooled shares. */
  shareSupport: number
  shareRequired: number
  /** Head support as a fraction of Assembly members. */
  headSupport: number | null
  headRequired: number | null
  /** Members who can pass this unilaterally. */
  soloPassers: string[]
  /** Members who can defeat it unilaterally. */
  soloBlockers: string[]
  /** Smallest coalitions that carry the decision. */
  minimalCoalitions: string[][]
  reason: string
}

const FAMILY_COUNCIL_SEATS = 5

function shareRequirement(kind: ThresholdKind): number {
  switch (kind) {
    case 'share-majority':
      return 0.5
    case 'share-75':
    case 'dual':
      return 0.75
    case 'unanimity':
      return 1
    case 'council-majority':
      return 0
  }
}

/** A simple majority of n heads needs strictly more than half. */
function headMajority(n: number): number {
  return Math.floor(n / 2) + 1
}

export function resolve(
  decision: DecisionRight,
  voters: Voter[],
  supporters: Set<string>,
): Verdict {
  const pool = voters.filter((v) => v.isPoolMember)
  const totalShares = pool.reduce((s, v) => s + v.shares, 0)
  const supportShares = pool
    .filter((v) => supporters.has(v.id))
    .reduce((s, v) => s + v.shares, 0)

  const assembly = voters.filter((v) => v.hasHeadVote)
  const supportHeads = assembly.filter((v) => supporters.has(v.id)).length

  const shareReq = shareRequirement(decision.threshold)
  const shareSupport = totalShares > 0 ? supportShares / totalShares : 0

  if (decision.threshold === 'council-majority') {
    const need = headMajority(FAMILY_COUNCIL_SEATS)
    const carries = supportHeads >= need
    return {
      carries,
      requiredLabel: decision.thresholdLabel,
      shareSupport,
      shareRequired: 0,
      headSupport: supportHeads / FAMILY_COUNCIL_SEATS,
      headRequired: need / FAMILY_COUNCIL_SEATS,
      soloPassers: [],
      soloBlockers: [],
      minimalCoalitions: [],
      reason: carries
        ? `${supportHeads} of ${FAMILY_COUNCIL_SEATS} Family Council seats. Carries.`
        : `${supportHeads} of ${FAMILY_COUNCIL_SEATS} Family Council seats. ${need} needed.`,
    }
  }

  // Share test
  const shareTest =
    decision.threshold === 'unanimity'
      ? pool.every((v) => supporters.has(v.id))
      : shareSupport >= shareReq - 1e-9

  // Head test, only for dual-threshold amendments
  let headTest = true
  let headRequired: number | null = null
  let headSupportPct: number | null = null
  if (decision.threshold === 'dual') {
    const need = headMajority(assembly.length)
    headRequired = need / Math.max(1, assembly.length)
    headSupportPct = supportHeads / Math.max(1, assembly.length)
    headTest = supportHeads >= need
  }

  // Who can act alone?
  const soloPassers = pool
    .filter((v) => {
      if (decision.threshold === 'unanimity') return pool.length === 1
      const solo = v.shares / totalShares >= shareReq - 1e-9
      if (decision.threshold !== 'dual') return solo
      return solo && headMajority(assembly.length) <= 1
    })
    .map((v) => v.name)

  const soloBlockers = pool
    .filter((v) => {
      if (decision.threshold === 'unanimity') return true
      const withoutV = (totalShares - v.shares) / totalShares
      return withoutV < shareReq - 1e-9
    })
    .map((v) => v.name)

  // Minimal winning coalitions by share, smallest first.
  const minimalCoalitions: string[][] = []
  if (decision.threshold !== 'unanimity' && pool.length <= 12) {
    const n = pool.length
    const found: { names: string[]; size: number }[] = []
    for (let mask = 1; mask < 1 << n; mask++) {
      let s = 0
      const names: string[] = []
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          s += pool[i].shares
          names.push(pool[i].name)
        }
      }
      if (s / totalShares >= shareReq - 1e-9) {
        // minimal if dropping any member breaks it
        const minimal = names.every((_, j) => {
          const reduced = names.filter((_, k) => k !== j)
          const rs = pool
            .filter((p) => reduced.includes(p.name))
            .reduce((acc, p) => acc + p.shares, 0)
          return rs / totalShares < shareReq - 1e-9
        })
        if (minimal) found.push({ names, size: names.length })
      }
    }
    found.sort((a, b) => a.size - b.size)
    minimalCoalitions.push(...found.slice(0, 4).map((f) => f.names))
  }

  const carries = shareTest && headTest
  const pct = (x: number) => `${dec(x * 100, 1)}%`

  let reason: string
  if (decision.threshold === 'dual') {
    reason = carries
      ? `${pct(shareSupport)} by share and ${supportHeads} of ${assembly.length} by head. Both tests met.`
      : !shareTest
        ? `${pct(shareSupport)} by share against ${pct(shareReq)} required. Fails the share test.`
        : `${supportHeads} of ${assembly.length} by head. Fails the Assembly test — a large holder blocks change but cannot impose it.`
  } else if (decision.threshold === 'unanimity') {
    const dissent = pool.filter((v) => !supporters.has(v.id)).map((v) => v.name)
    reason = carries
      ? 'Every pool member consents.'
      : `Unanimity required. Withheld by ${dissent.join(', ')}.`
  } else {
    reason = carries
      ? `${pct(shareSupport)} by share against ${pct(shareReq)} required. Carries.`
      : `${pct(shareSupport)} by share against ${pct(shareReq)} required. Falls short by ${pct(shareReq - shareSupport)}.`
  }

  return {
    carries,
    requiredLabel: decision.thresholdLabel,
    shareSupport,
    shareRequired: shareReq,
    headSupport: headSupportPct,
    headRequired,
    soloPassers,
    soloBlockers,
    minimalCoalitions,
    reason,
  }
}

/**
 * Structural read of the pool, independent of any particular vote.
 * This is what surfaces the asymmetry: at 55/45 one holder carries every
 * ordinary resolution alone while the other holds a veto over everything
 * that matters. Neither is a deadlock, and neither is control.
 */
export interface PowerProfile {
  name: string
  sharePct: number
  carriesAlone: string[]
  vetoes: string[]
  powerless: string[]
}

export function powerProfile(
  voters: Voter[],
  decisions: DecisionRight[],
): PowerProfile[] {
  const pool = voters.filter((v) => v.isPoolMember)
  const total = pool.reduce((s, v) => s + v.shares, 0)

  return pool.map((v) => {
    const carriesAlone: string[] = []
    const vetoes: string[] = []
    const powerless: string[] = []
    for (const d of decisions) {
      if (d.threshold === 'council-majority') continue
      const req = shareRequirement(d.threshold)
      const own = v.shares / total
      const rest = (total - v.shares) / total
      const canPass = d.threshold === 'unanimity' ? pool.length === 1 : own >= req - 1e-9
      const canBlock = d.threshold === 'unanimity' ? true : rest < req - 1e-9
      if (canPass) carriesAlone.push(d.decision)
      else if (canBlock) vetoes.push(d.decision)
      else powerless.push(d.decision)
    }
    return { name: v.name, sharePct: v.shares / total, carriesAlone, vetoes, powerless }
  })
}
