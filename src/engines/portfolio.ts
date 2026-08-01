/**
 * Portfolio engine.
 *
 * The family holds roughly two thirds of its wealth in one listed security.
 * An unconstrained optimiser answers that situation with "sell down to about a
 * tenth". The constitution answers it with "you may not go below the floor".
 * Both frontiers are therefore computed, and the vertical gap between them —
 * measured in basis points of forgone return at equal risk — is the annual
 * price the family pays to remain a family business.
 *
 * Optimisation is an active-set method: solve the equality-constrained problem
 * in closed form, clamp the worst bound violation, re-solve on the free set.
 * For seven assets this converges in a handful of passes and is exact.
 */

import { ASSET_CLASSES, CORRELATION, MARKET, VALUES_SCREEN } from '../data/assumptions'
import { POOL_FLOOR, BLOCKING_MINORITY, STEFAN_SHARES, POOLED_SHARES } from './control'

export const N = ASSET_CLASSES.length

export function covariance(volAdjust = 0): number[][] {
  return CORRELATION.map((row, i) =>
    row.map((rho, j) => {
      const vi = ASSET_CLASSES[i].vol + volAdjust
      const vj = ASSET_CLASSES[j].vol + volAdjust
      return rho * vi * vj
    }),
  )
}

export function expectedReturns(screenOn = false): number[] {
  return ASSET_CLASSES.map((a) =>
    screenOn ? a.er - VALUES_SCREEN.dragBp / 10_000 : a.er,
  )
}

export function portfolioReturn(w: number[], mu: number[]): number {
  return w.reduce((s, wi, i) => s + wi * mu[i], 0)
}

export function portfolioVol(w: number[], cov: number[][]): number {
  let v = 0
  for (let i = 0; i < w.length; i++)
    for (let j = 0; j < w.length; j++) v += w[i] * w[j] * cov[i][j]
  return Math.sqrt(Math.max(0, v))
}

export function sharpe(er: number, vol: number, rf = MARKET.riskFreeRate.value): number {
  return vol > 0 ? (er - rf) / vol : 0
}

/* ── Linear algebra ─────────────────────────────────────────────────── */

/**
 * Euclidean projection onto {w : Σw = 1, lower ≤ w ≤ upper}.
 *
 * Bisection on the offset τ: as τ rises every clipped coordinate falls, so the
 * sum is monotone in τ and a unique τ satisfies the budget exactly.
 */
function projectToBudget(v: number[], lower: number[], upper: number[]): number[] {
  let lo = Math.min(...v.map((x, i) => x - upper[i])) - 1
  let hi = Math.max(...v.map((x, i) => x - lower[i])) + 1
  const sumAt = (t: number) =>
    v.reduce((acc, x, i) => acc + Math.min(upper[i], Math.max(lower[i], x - t)), 0)
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2
    if (sumAt(mid) > 1) lo = mid
    else hi = mid
  }
  const tau = (lo + hi) / 2
  return v.map((x, i) => Math.min(upper[i], Math.max(lower[i], x - tau)))
}

/** Gershgorin bound on the spectral norm — sets a safe gradient step. */
function normBound(cov: number[][]): number {
  return Math.max(...cov.map((row) => row.reduce((s, x) => s + Math.abs(x), 0)))
}

/**
 * Maximise μ'w − λ·w'Σw subject to the budget and box constraints, by
 * projected gradient ascent.
 *
 * This replaces an active-set solver that clamped variables to their bounds
 * but never released them, and consequently failed at the high-return end of
 * the frontier — reporting a maximum of 8.36% where the true maximum is 8.85%.
 * The problem is concave and the feasible set convex, so projected gradient
 * converges from any feasible start and cannot get stuck at a vertex.
 */
function maxUtility(lambda: number, mu: number[], cov: number[][], bounds: Bounds): number[] {
  const L = 2 * lambda * normBound(cov) + 1e-6
  const eta = 1 / L
  let w = projectToBudget(
    bounds.lower.map((lo, i) => lo + (bounds.upper[i] - lo) / 2),
    bounds.lower,
    bounds.upper,
  )
  for (let it = 0; it < 600; it++) {
    const grad = mu.map((m, i) => m - 2 * lambda * cov[i].reduce((s, cij, j) => s + cij * w[j], 0))
    const next = projectToBudget(
      w.map((x, i) => x + eta * grad[i]),
      bounds.lower,
      bounds.upper,
    )
    let delta = 0
    for (let i = 0; i < w.length; i++) delta += Math.abs(next[i] - w[i])
    w = next
    if (delta < 1e-11) break
  }
  return w
}

/* ── Constrained minimum-variance at a target return ────────────────── */

export interface Bounds {
  lower: number[]
  upper: number[]
}

export function defaultBounds(): Bounds {
  return { lower: new Array(N).fill(0), upper: new Array(N).fill(1) }
}

/**
 * Minimum BMW weight implied by the constitution, expressed as a fraction of
 * total family wealth. Art.3 sets a 27% pool floor; Appendix B shows Stefan's
 * individual blocking quarter binds far earlier. The engine takes whichever is
 * larger in share terms.
 */
export function constitutionalFloorWeight(totalWealth: number, sharePrice = MARKET.bmwSharePrice.value): number {
  const sharesInIssue = MARKET.sharesInIssue.value
  const poolMinimum = POOL_FLOOR * sharesInIssue
  const stefanMinimum = BLOCKING_MINORITY * sharesInIssue
  // Stefan must hold his blocking quarter; the pool must clear its floor.
  const requiredShares = Math.max(poolMinimum, stefanMinimum + (POOLED_SHARES - STEFAN_SHARES) * 0)
  return Math.min(1, (requiredShares * sharePrice) / totalWealth)
}

export interface FrontierPoint {
  er: number
  vol: number
  sharpe: number
  weights: number[]
}

export function efficientFrontier(
  mu: number[],
  cov: number[][],
  bounds: Bounds,
  points = 56,
): FrontierPoint[] {
  if (1 - bounds.lower.reduce((s, v) => s + v, 0) < -1e-9) return []

  const out: FrontierPoint[] = []

  // Sweep risk aversion from near-zero (maximum return) to very high
  // (minimum variance). Log spacing keeps the sample density even along the
  // curve rather than bunching at one end.
  for (let p = 0; p < points; p++) {
    const lambda = Math.exp(Math.log(0.02) + (Math.log(400) - Math.log(0.02)) * (p / (points - 1)))
    const w = maxUtility(lambda, mu, cov, bounds)
    const er = portfolioReturn(w, mu)
    const vol = portfolioVol(w, cov)
    out.push({ er, vol, sharpe: sharpe(er, vol), weights: w })
  }

  // The maximum-return vertex, computed exactly, so the high end of the
  // frontier is never truncated by the sweep.
  const slack = 1 - bounds.lower.reduce((s, v) => s + v, 0)
  const wMax = [...bounds.lower]
  let rem = slack
  for (const { i } of mu.map((m, i) => ({ m, i })).sort((a, b) => b.m - a.m)) {
    const room = Math.min(bounds.upper[i] - wMax[i], rem)
    wMax[i] += room
    rem -= room
    if (rem <= 1e-12) break
  }
  const erMax = portfolioReturn(wMax, mu)
  const volMax = portfolioVol(wMax, cov)
  out.push({ er: erMax, vol: volMax, sharpe: sharpe(erMax, volMax), weights: wMax })

  // Keep the efficient upper branch: sorted by volatility, strictly increasing
  // return.
  const efficient: FrontierPoint[] = []
  for (const pt of [...out].sort((a, b) => a.vol - b.vol)) {
    if (efficient.length === 0 || pt.er > efficient[efficient.length - 1].er + 1e-9) {
      efficient.push(pt)
    }
  }
  return efficient
}

/**
 * The price of control: at the family's current risk level, how much return
 * does the floor cost per year?
 */
export interface PriceOfControl {
  targetVol: number
  unconstrainedEr: number
  constrainedEr: number
  costBp: number
  costEurPerYear: number
  floorWeight: number
  /** Lowest volatility reachable with and without the floor. */
  minVolUnconstrained: number
  minVolConstrained: number
  /** Largest return gap across the range both frontiers span, and where. */
  maxCostBp: number
  maxCostAtVol: number
  /** Return available on the compliant frontier at the family's current risk,
      against what the family actually earns. Inefficiency, not governance. */
  compliantErAtCurrentVol: number
  inefficiencyBp: number
}

/**
 * Return achievable on a frontier at exactly this volatility.
 *
 * Nearest-point matching is wrong here: the two frontiers are sampled at
 * different volatilities, so comparing each one's closest point can report the
 * constrained frontier beating the unconstrained one — impossible, since the
 * constrained feasible set is a strict subset. Interpolating both at the same
 * volatility is the only like-for-like read.
 */
export function frontierReturnAt(f: FrontierPoint[], vol: number): number | null {
  if (f.length === 0) return null
  const sorted = [...f].sort((a, b) => a.vol - b.vol)
  if (vol <= sorted[0].vol) return sorted[0].er
  if (vol >= sorted[sorted.length - 1].vol) return sorted[sorted.length - 1].er
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].vol >= vol) {
      const a = sorted[i - 1]
      const b = sorted[i]
      const t = b.vol === a.vol ? 0 : (vol - a.vol) / (b.vol - a.vol)
      return a.er + t * (b.er - a.er)
    }
  }
  return null
}

export function priceOfControl(
  unconstrained: FrontierPoint[],
  constrained: FrontierPoint[],
  targetVol: number,
  totalWealth: number,
  floorWeight: number,
  currentEr: number,
): PriceOfControl | null {
  const u = frontierReturnAt(unconstrained, targetVol)
  const c = frontierReturnAt(constrained, targetVol)
  if (u === null || c === null || unconstrained.length === 0 || constrained.length === 0) return null

  const gap = Math.max(0, u - c)

  // Where the constraint bites hardest, across the range both frontiers span.
  const lo = Math.max(unconstrained[0].vol, constrained[0].vol)
  const hi = Math.min(
    unconstrained[unconstrained.length - 1].vol,
    constrained[constrained.length - 1].vol,
  )
  let maxCost = 0
  let maxCostAt = lo
  for (let i = 0; i <= 40; i++) {
    const v = lo + ((hi - lo) * i) / 40
    const du = frontierReturnAt(unconstrained, v)
    const dc = frontierReturnAt(constrained, v)
    if (du === null || dc === null) continue
    const d = du - dc
    if (d > maxCost) {
      maxCost = d
      maxCostAt = v
    }
  }

  return {
    targetVol,
    unconstrainedEr: u,
    constrainedEr: c,
    costBp: gap * 10_000,
    costEurPerYear: gap * totalWealth,
    floorWeight,
    minVolUnconstrained: unconstrained[0].vol,
    minVolConstrained: constrained[0].vol,
    maxCostBp: maxCost * 10_000,
    maxCostAtVol: maxCostAt,
    compliantErAtCurrentVol: c,
    inefficiencyBp: Math.max(0, c - currentEr) * 10_000,
  }
}

/* ── Risk metrics ───────────────────────────────────────────────────── */

/** Parametric one-year value at risk, as a positive fraction of wealth. */
export function valueAtRisk(er: number, vol: number, confidence: 0.95 | 0.99): number {
  const z = confidence === 0.95 ? 1.6449 : 2.3263
  return Math.max(0, z * vol - er)
}

/** Conditional VaR (expected shortfall) under normality. */
export function conditionalVaR(er: number, vol: number, confidence: 0.95 | 0.99): number {
  const z = confidence === 0.95 ? 1.6449 : 2.3263
  const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
  return Math.max(0, (phi / (1 - confidence)) * vol - er)
}

/** Herfindahl concentration and the effective number of independent bets. */
export function concentration(weights: number[]): { hhi: number; effectiveBets: number } {
  const hhi = weights.reduce((s, w) => s + w * w, 0)
  return { hhi, effectiveBets: hhi > 0 ? 1 / hhi : 0 }
}

/** Marginal contribution to risk, per asset. */
export function riskContribution(w: number[], cov: number[][]): number[] {
  const vol = portfolioVol(w, cov)
  if (vol === 0) return w.map(() => 0)
  return w.map((wi, i) => {
    const mc = cov[i].reduce((s, cij, j) => s + cij * w[j], 0) / vol
    return (wi * mc) / vol
  })
}

/** Performance attribution against a benchmark weight vector. */
export function attribution(
  w: number[],
  wb: number[],
  assetReturns: number[],
  benchmarkReturn: number,
): { allocation: number[]; selection: number[]; total: number } {
  const allocation = w.map((wi, i) => (wi - wb[i]) * (assetReturns[i] - benchmarkReturn))
  const selection = w.map(() => 0)
  const total = allocation.reduce((s, x) => s + x, 0)
  return { allocation, selection, total }
}
