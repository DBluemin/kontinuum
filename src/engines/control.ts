/**
 * Control engine.
 *
 * The premise of Article 3: family control is a residual of the company's own
 * capital decisions. Buybacks lift the percentage, issuance cuts it, and the
 * family decides neither. Everything here therefore treats *shares in issue*
 * as the independent variable and the family's percentage as the output.
 */

export const POOL_FLOOR = 0.27 // Art.3 — Owners' Council tests quarterly
export const BLOCKING_MINORITY = 0.25 // Appendix B — Sperrminorität

export const STEFAN_SHARES = 155_500_000
export const SUSANNE_SHARES = 126_200_000
export const POOLED_SHARES = STEFAN_SHARES + SUSANNE_SHARES // 281,700,000

export interface ControlState {
  sharesInIssue: number
  pooledShares: number
  stefanShares: number
  susanneShares: number

  pooledPct: number
  stefanPct: number
  susannePct: number

  /** Distance to the Art.3 pool floor, in percentage points. */
  floorHeadroomPp: number
  /** Distance to Stefan's blocking quarter, in percentage points. */
  blockingHeadroomPp: number
  /** Shares Stefan could sell before losing the blocking quarter. */
  blockingHeadroomShares: number
  /** New shares BMW could issue before the blocking quarter breaks. */
  issuanceHeadroomShares: number
  /** New shares BMW could issue before the pool floor breaks. */
  floorIssuanceHeadroomShares: number

  floorBreached: boolean
  blockingBreached: boolean

  /** Which constraint binds first, and by how much. */
  bindingConstraint: 'blocking' | 'floor'
  bindingMultiple: number
}

export function computeControl(
  sharesInIssue: number,
  stefanShares = STEFAN_SHARES,
  susanneShares = SUSANNE_SHARES,
): ControlState {
  const pooledShares = stefanShares + susanneShares
  const pooledPct = pooledShares / sharesInIssue
  const stefanPct = stefanShares / sharesInIssue
  const susannePct = susanneShares / sharesInIssue

  // Share count at which the blocking quarter sits, given the denominator.
  const blockingShareCount = BLOCKING_MINORITY * sharesInIssue

  // Denominators at which each threshold breaks, given fixed holdings.
  const issuanceLimitBlocking = stefanShares / BLOCKING_MINORITY
  const issuanceLimitFloor = pooledShares / POOL_FLOOR

  const issuanceHeadroomShares = issuanceLimitBlocking - sharesInIssue
  const floorIssuanceHeadroomShares = issuanceLimitFloor - sharesInIssue

  const bindingConstraint =
    issuanceHeadroomShares <= floorIssuanceHeadroomShares ? 'blocking' : 'floor'
  const bindingMultiple =
    Math.max(issuanceHeadroomShares, floorIssuanceHeadroomShares) /
    Math.max(1, Math.min(issuanceHeadroomShares, floorIssuanceHeadroomShares))

  return {
    sharesInIssue,
    pooledShares,
    stefanShares,
    susanneShares,
    pooledPct,
    stefanPct,
    susannePct,
    floorHeadroomPp: (pooledPct - POOL_FLOOR) * 100,
    blockingHeadroomPp: (stefanPct - BLOCKING_MINORITY) * 100,
    blockingHeadroomShares: stefanShares - blockingShareCount,
    issuanceHeadroomShares,
    floorIssuanceHeadroomShares,
    floorBreached: pooledPct < POOL_FLOOR,
    blockingBreached: stefanPct < BLOCKING_MINORITY,
    bindingConstraint,
    bindingMultiple,
  }
}

/* ── The record (Appendix B) ──────────────────────────────────────────
   Three observations, two denominator changes, no trades.             */

export interface ControlObservation {
  label: string
  date: string
  sharesInIssue: number
  cause: string
  sourced: boolean
}

export const CONTROL_HISTORY: ControlObservation[] = [
  {
    label: 'Feb 2018',
    date: '2018-02-20',
    sharesInIssue: 602_000_000,
    cause: "Division of Johanna Quandt's estate. Holdings fixed from here.",
    sourced: true,
  },
  {
    label: 'Jun 2025',
    date: '2025-06-30',
    sharesInIssue: 561_134_926,
    cause: 'Buyback programme retired ordinary shares. Family crossed an absolute majority without buying.',
    sourced: true,
  },
  {
    label: 'Jul 2026',
    date: '2026-07-01',
    sharesInIssue: 615_810_431,
    cause: '54,675,505 preferred shares converted one-for-one. Majority lost without selling.',
    sourced: true,
  },
]

/** Rate of change of pooled control, in basis points per quarter. */
export function driftBpPerQuarter(
  from: ControlObservation,
  to: ControlObservation,
): number {
  const a = computeControl(from.sharesInIssue).pooledPct
  const b = computeControl(to.sharesInIssue).pooledPct
  const quarters =
    (new Date(to.date).getTime() - new Date(from.date).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25 / 4)
  return ((b - a) * 10_000) / quarters
}

export const CURRENT_DRIFT = driftBpPerQuarter(CONTROL_HISTORY[1], CONTROL_HISTORY[2])

/* ── Corporate action simulator ───────────────────────────────────────
   The Dilution Lab replays the record, then runs forward.              */

export interface CorporateAction {
  id: string
  label: string
  /** Positive issues shares, negative retires them. */
  deltaShares: number
  clauseNote?: string
}

export const PRESET_ACTIONS: CorporateAction[] = [
  { id: 'buyback-1', label: '1% buyback', deltaShares: -0.01 },
  { id: 'buyback-3', label: '3% buyback', deltaShares: -0.03 },
  { id: 'issue-1', label: '1% share issue', deltaShares: 0.01 },
  { id: 'issue-5', label: '5% capital raise', deltaShares: 0.05 },
  {
    id: 'conversion',
    label: 'Repeat of the 2026 conversion',
    deltaShares: 54_675_505,
    clauseNote: 'App.B',
  },
]

export function applyAction(sharesInIssue: number, a: CorporateAction): number {
  return Math.abs(a.deltaShares) < 1
    ? Math.round(sharesInIssue * (1 + a.deltaShares))
    : sharesInIssue + a.deltaShares
}

/**
 * Shares the pool must buy to restore a target percentage at a given
 * denominator — priority 2 of the E5.3 Reserve waterfall.
 */
export function sharesToRestore(
  sharesInIssue: number,
  currentShares: number,
  targetPct: number,
): number {
  // (currentShares + x) / (sharesInIssue) >= targetPct, buying from the float
  const needed = targetPct * sharesInIssue - currentShares
  return Math.max(0, needed)
}

/**
 * Takeover-threshold ladder discussed in class: the free float is the
 * territory a hostile accumulator operates in.
 */
export const TAKEOVER_LADDER = [
  { pct: 0.03, label: 'Disclosure threshold', consequence: 'Voting-rights notification (WpHG §33).' },
  { pct: 0.05, label: 'Monitoring', consequence: 'Position becomes visible and strategic intent is questioned.' },
  { pct: 0.15, label: 'Board pressure', consequence: 'Credible demand for supervisory representation.' },
  { pct: 0.25, label: 'Blocking minority', consequence: 'Vetoes any three-quarters resolution. The family currently holds this.' },
  { pct: 0.3, label: 'Mandatory offer', consequence: 'Obligation to bid for the whole company (WpÜG §35).' },
  { pct: 0.5, label: 'Simple control', consequence: 'Ordinary resolutions carry.' },
  { pct: 0.75, label: 'Structural control', consequence: 'Charter amendments, domination agreements.' },
]

export function freeFloat(c: ControlState): number {
  return 1 - c.pooledPct
}
