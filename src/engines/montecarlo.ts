/**
 * Multi-generational projection.
 *
 * Runs the Appendix E5 waterfall forward across G5 and G6 under stochastic
 * dividends, stochastic markets and a drifting share count. The question it
 * answers is not "how rich will they be" but the two the constitution actually
 * poses: can the base distribution be paid every year, and does the pool stay
 * above its floor while the number of claimants multiplies.
 *
 * Seeded so results are reproducible — an academic model that returns a
 * different answer every run cannot be marked.
 */

import { DISTRIBUTION, MARKET } from '../data/assumptions'
import { POOL_FLOOR, BLOCKING_MINORITY, POOLED_SHARES, STEFAN_SHARES } from './control'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rng: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export interface MonteCarloConfig {
  paths: number
  years: number
  seed: number
  /** Portfolio expected return and volatility (from the portfolio engine). */
  portfolioEr: number
  portfolioVol: number
  /** Mean and volatility of BMW dividend per share. */
  dpsMean: number
  dpsVol: number
  /** Opening Continuity Reserve, EUR. */
  reserveOpening: number
  /** Base distribution per pooled share, indexed triennially by CPI. */
  basePerShare: number
  /** Opening wealth outside the BMW stake. */
  otherWealth: number
  sharePrice: number
  sharesInIssue: number
  /** Annual drift and volatility of shares in issue. */
  issuanceDrift: number
  issuanceVol: number
  /** Claimants on the base distribution, by year. */
  claimantsStart: number
  claimantsEnd: number
  /** BMW's own expected return and volatility, distinct from the portfolio's. */
  bmwEr: number
  bmwVol: number
}

export function defaultConfig(portfolioEr: number, portfolioVol: number): MonteCarloConfig {
  return {
    paths: 2000,
    years: 50,
    seed: 20260801,
    portfolioEr,
    portfolioVol,
    dpsMean: 4.6,
    dpsVol: 0.42,
    reserveOpening: DISTRIBUTION.reserveOpening.value,
    basePerShare: DISTRIBUTION.basePerShare.value,
    otherWealth: 12_500_000_000,
    sharePrice: MARKET.bmwSharePrice.value,
    sharesInIssue: MARKET.sharesInIssue.value,
    issuanceDrift: -0.004,
    issuanceVol: 0.028,
    claimantsStart: 2,
    claimantsEnd: 14,
    bmwEr: 0.075,
    bmwVol: 0.28,
  }
}

export interface PathResult {
  wealth: number[]
  reserve: number[]
  pooledPct: number[]
  baseFailedYear: number | null
  floorBreachYear: number | null
  blockingBreachYear: number | null
  maxDrawdown: number
}

export interface MonteCarloResult {
  years: number
  /** Percentile bands of total wealth, EUR. */
  p05: number[]
  p25: number[]
  p50: number[]
  p75: number[]
  p95: number[]
  /** Percentile bands of pooled control, as a fraction. */
  control50: number[]
  control05: number[]
  probBaseFails: number
  probFloorBreach: number
  probBlockingBreach: number
  probReserveExhausted: number
  medianTerminalWealth: number
  medianRealTerminalPerClaimant: number
  medianMaxDrawdown: number
  worstMaxDrawdown: number
  firstFailureYearP50: number | null
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

export function runMonteCarlo(cfg: MonteCarloConfig): MonteCarloResult {
  const rng = mulberry32(cfg.seed)
  const wealthByYear: number[][] = Array.from({ length: cfg.years + 1 }, () => [])
  const controlByYear: number[][] = Array.from({ length: cfg.years + 1 }, () => [])

  let baseFails = 0
  let floorBreaches = 0
  let blockingBreaches = 0
  let reserveExhausted = 0
  const terminal: number[] = []
  const drawdowns: number[] = []
  const failureYears: number[] = []

  const cpi = MARKET.germanCPI.value

  for (let p = 0; p < cfg.paths; p++) {
    let reserve = cfg.reserveOpening
    let other = cfg.otherWealth
    let sharesInIssue = cfg.sharesInIssue
    let pooled = POOLED_SHARES
    let stefan = STEFAN_SHARES
    let price = cfg.sharePrice
    let base = cfg.basePerShare

    let failed: number | null = null
    let floorYear: number | null = null
    let blockingYear: number | null = null
    let peak = pooled * price + other + reserve
    let maxDd = 0

    wealthByYear[0].push(peak)
    controlByYear[0].push(pooled / sharesInIssue)

    for (let t = 1; t <= cfg.years; t++) {
      // Markets. Lognormal, not arithmetic: over fifty years an arithmetic
      // normal draw at 28% volatility puts a meaningful mass of paths below
      // -100%, which is not a price path but an artefact.
      other *= Math.exp(
        cfg.portfolioEr - 0.5 * cfg.portfolioVol ** 2 + cfg.portfolioVol * normal(rng),
      )
      price *= Math.exp(cfg.bmwEr - 0.5 * cfg.bmwVol ** 2 + cfg.bmwVol * normal(rng))
      reserve *= 1 + DISTRIBUTION.reserveReturn.value

      // Shares in issue drift — the denominator the family does not control.
      sharesInIssue = Math.max(
        1,
        Math.round(sharesInIssue * (1 + cfg.issuanceDrift + cfg.issuanceVol * normal(rng))),
      )

      // Dividend per share: lognormal around a mean that grows with inflation.
      // Escalating the base (E5.1) without escalating the dividend would make
      // the policy fail by construction rather than by risk.
      const dpsMeanNow = cfg.dpsMean * Math.pow(1 + cpi, t)
      const dps = Math.max(
        0,
        dpsMeanNow * Math.exp(cfg.dpsVol * normal(rng) - 0.5 * cfg.dpsVol * cfg.dpsVol),
      )

      // E5.1 — base resets every three years by German CPI.
      if (t % 3 === 0) base *= Math.pow(1 + cpi, 3)

      const receipts = pooled * dps
      const memorial = receipts * DISTRIBUTION.memorialShare.value // Art.9, before anything else
      const required = pooled * base

      let available = receipts - memorial
      if (available < required) {
        // E5.3 priority 1 — the Reserve funds the base in weak years.
        const draw = Math.min(reserve, required - available)
        reserve -= draw
        available += draw
        if (available < required - 1) {
          if (failed === null) failed = t
        }
      } else {
        reserve += available - required
      }

      // E5.3 priority 2 — buy shares as the pool approaches the floor.
      const pct = pooled / sharesInIssue
      if (pct < POOL_FLOOR + 0.015 && reserve > 0) {
        const targetShares = (POOL_FLOOR + 0.02) * sharesInIssue - pooled
        const affordable = Math.min(targetShares, reserve / price)
        if (affordable > 0) {
          pooled += affordable
          stefan += affordable * 0.552
          reserve -= affordable * price
        }
      }

      if (pooled / sharesInIssue < POOL_FLOOR && floorYear === null) floorYear = t
      if (stefan / sharesInIssue < BLOCKING_MINORITY && blockingYear === null) blockingYear = t

      // Reported in today's money. A fifty-year nominal series is dominated by
      // inflation and tells the family nothing about what it can spend.
      const total = (pooled * price + other + reserve) / Math.pow(1 + cpi, t)
      peak = Math.max(peak, total)
      maxDd = Math.max(maxDd, (peak - total) / peak)

      wealthByYear[t].push(total)
      controlByYear[t].push(pooled / sharesInIssue)
    }

    if (failed !== null) {
      baseFails++
      failureYears.push(failed)
    }
    if (floorYear !== null) floorBreaches++
    if (blockingYear !== null) blockingBreaches++
    if (reserve <= 0) reserveExhausted++
    terminal.push(wealthByYear[cfg.years][wealthByYear[cfg.years].length - 1])
    drawdowns.push(maxDd)
  }

  const band = (p: number) => wealthByYear.map((ys) => percentile([...ys].sort((a, b) => a - b), p))
  const cband = (p: number) => controlByYear.map((ys) => percentile([...ys].sort((a, b) => a - b), p))

  const sortedTerminal = [...terminal].sort((a, b) => a - b)
  const sortedDd = [...drawdowns].sort((a, b) => a - b)

  return {
    years: cfg.years,
    p05: band(0.05),
    p25: band(0.25),
    p50: band(0.5),
    p75: band(0.75),
    p95: band(0.95),
    control50: cband(0.5),
    control05: cband(0.05),
    probBaseFails: baseFails / cfg.paths,
    probFloorBreach: floorBreaches / cfg.paths,
    probBlockingBreach: blockingBreaches / cfg.paths,
    probReserveExhausted: reserveExhausted / cfg.paths,
    medianTerminalWealth: percentile(sortedTerminal, 0.5),
    medianRealTerminalPerClaimant: percentile(sortedTerminal, 0.5) / cfg.claimantsEnd,
    medianMaxDrawdown: percentile(sortedDd, 0.5),
    worstMaxDrawdown: percentile(sortedDd, 0.99),
    firstFailureYearP50:
      failureYears.length > 0 ? percentile([...failureYears].sort((a, b) => a - b), 0.5) : null,
  }
}

/* ── Deterministic stress scenarios ─────────────────────────────────── */

export interface Stress {
  id: string
  label: string
  description: string
  sharePriceShock: number
  dividendShock: number
  issuanceShock: number
  clause?: string
}

export const STRESSES: Stress[] = [
  {
    id: 'base',
    label: 'Base case',
    description: 'Assumptions as configured.',
    sharePriceShock: 0,
    dividendShock: 0,
    issuanceShock: 0,
  },
  {
    id: 'conversion',
    label: 'Second conversion event',
    description: 'A further 54.7m shares enter issue, repeating June 2026.',
    sharePriceShock: -0.03,
    dividendShock: 0,
    issuanceShock: 54_675_505,
    clause: 'App.B',
  },
  {
    id: 'dividend-cut',
    label: 'Dividend cut to 2020 levels',
    description: 'Dividend falls to €1.90, as it did in 2020. The base is funded from the Reserve.',
    sharePriceShock: -0.18,
    dividendShock: -0.57,
    issuanceShock: 0,
    clause: 'E5',
  },
  {
    id: 'capital-raise',
    label: 'Emergency capital raise',
    description: 'BMW issues 15% new equity. Neither the timing nor the size is the family\'s decision.',
    sharePriceShock: -0.22,
    dividendShock: -0.5,
    issuanceShock: 92_371_565,
    clause: 'Art.3',
  },
  {
    id: 'succession',
    label: 'Unplanned succession',
    description: 'A G4 death with no standing proxy named, triggering a tax event against illiquid assets.',
    sharePriceShock: -0.08,
    dividendShock: 0,
    issuanceShock: 0,
    clause: 'Art.7',
  },
]
