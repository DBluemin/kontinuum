/**
 * Consolidation engine — the family's books.
 *
 * Rolls the entity register up into a balance sheet, an income statement and a
 * cash-flow statement, and derives capital under management by asset class and
 * by entity. The Art.9 memorial commitment is capitalised as a perpetuity and
 * carried as a liability rather than shown as discretionary giving: it is
 * terminable only by unanimous vote, which makes it a claim on the estate.
 */

import { ASSET_CLASSES, DISTRIBUTION, COSTS, MARKET, DE_TAX } from '../data/assumptions'
import { ENTITIES, LIABILITIES, entityValue } from '../data/holdings'
import { POOLED_SHARES } from './control'

export interface AumSlice {
  id: string
  label: string
  value: number
  weight: number
  liquid: boolean
}

export interface Consolidated {
  totalAssets: number
  totalLiabilities: number
  netWealth: number
  byAssetClass: AumSlice[]
  byEntity: { id: string; name: string; kind: string; branch: string; value: number; weight: number }[]
  liquidShare: number
  bmwConcentration: number
  weights: number[]
}

export function consolidate(sharePrice = MARKET.bmwSharePrice.value): Consolidated {
  const entityValues = ENTITIES.map((e) => ({ e, v: entityValue(e, sharePrice) }))
  const totalAssets = entityValues.reduce((s, x) => s + x.v, 0)

  const byClass = new Map<string, number>()
  for (const { e, v } of entityValues) {
    for (const [cls, w] of Object.entries(e.allocation)) {
      byClass.set(cls, (byClass.get(cls) ?? 0) + v * w)
    }
  }

  const byAssetClass: AumSlice[] = ASSET_CLASSES.map((a) => {
    const value = byClass.get(a.id) ?? 0
    return { id: a.id, label: a.label, value, weight: value / totalAssets, liquid: a.liquid }
  }).sort((x, y) => y.value - x.value)

  const weights = ASSET_CLASSES.map((a) => (byClass.get(a.id) ?? 0) / totalAssets)

  const memorialCapitalised = capitalisedMemorial(sharePrice)
  const totalLiabilities =
    LIABILITIES.reduce((s, l) => s + l.value, 0) + memorialCapitalised

  return {
    totalAssets,
    totalLiabilities,
    netWealth: totalAssets - totalLiabilities,
    byAssetClass,
    byEntity: entityValues
      .map(({ e, v }) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        branch: e.branch,
        value: v,
        weight: v / totalAssets,
      }))
      .sort((a, b) => b.value - a.value),
    liquidShare: byAssetClass.filter((s) => s.liquid).reduce((s, x) => s + x.weight, 0),
    bmwConcentration: (byClass.get('bmw') ?? 0) / totalAssets,
    weights,
  }
}

/** Art.9 — 0.5% of pooled dividend income, in perpetuity, capitalised. */
export function capitalisedMemorial(
  sharePrice = MARKET.bmwSharePrice.value,
  dps = DISTRIBUTION.basePerShare.value,
  discount = 0.038,
): number {
  void sharePrice
  const annual = POOLED_SHARES * dps * DISTRIBUTION.memorialShare.value
  return annual / discount
}

/* ── Income and cash flow ───────────────────────────────────────────── */

export interface IncomeStatement {
  bmwDividend: number
  operatingCompanyEarnings: number
  portfolioIncome: number
  grossIncome: number
  familyOfficeOpex: number
  managerFees: number
  custody: number
  advisory: number
  totalCosts: number
  netBeforeTax: number
  dividendTax: number
  netAfterTax: number
  /** Total cost of ownership as a share of gross income. */
  tcoRatio: number
  /** Costs plus tax as basis points of assets. */
  dragBp: number
}

export function incomeStatement(
  dps: number,
  sharePrice = MARKET.bmwSharePrice.value,
): IncomeStatement {
  const c = consolidate(sharePrice)
  const bmwDividend = POOLED_SHARES * dps

  // Operating companies distribute a portion of earnings up to the holdings.
  const pocValue = c.byAssetClass.find((s) => s.id === 'poc')?.value ?? 0
  const operatingCompanyEarnings = pocValue * 0.055

  const income = c.byAssetClass
    .filter((s) => s.id === 'fi' || s.id === 'cash' || s.id === 'ra' || s.id === 'geq')
    .reduce((s, x) => {
      const yieldBy: Record<string, number> = { fi: 0.034, cash: 0.022, ra: 0.041, geq: 0.021 }
      return s + x.value * (yieldBy[x.id] ?? 0)
    }, 0)

  const grossIncome = bmwDividend + operatingCompanyEarnings + income

  const managedBase = c.totalAssets - (c.byAssetClass.find((s) => s.id === 'bmw')?.value ?? 0)
  const managerFees = managedBase * COSTS.externalManagerFees.value
  const custody = c.totalAssets * COSTS.custodyAndAdmin.value
  const totalCosts = COSTS.familyOfficeOpex.value + managerFees + custody + COSTS.advisoryAndLegal.value
  const netBeforeTax = grossIncome - totalCosts

  // Dividends routed through the holding companies attract the §8b KStG
  // treatment rather than the 26.375% personal rate; only the distributed
  // base reaches members personally.
  const distributedToMembers = POOLED_SHARES * DISTRIBUTION.basePerShare.value
  const retained = Math.max(0, grossIncome - distributedToMembers)
  const dividendTax =
    distributedToMembers * DE_TAX.dividendWithholding + retained * DE_TAX.interCorporateEffective

  const netAfterTax = netBeforeTax - dividendTax

  return {
    bmwDividend,
    operatingCompanyEarnings,
    portfolioIncome: income,
    grossIncome,
    familyOfficeOpex: COSTS.familyOfficeOpex.value,
    managerFees,
    custody,
    advisory: COSTS.advisoryAndLegal.value,
    totalCosts,
    netBeforeTax,
    dividendTax,
    netAfterTax,
    tcoRatio: grossIncome > 0 ? (totalCosts + dividendTax) / grossIncome : 0,
    dragBp: ((totalCosts + dividendTax) / c.totalAssets) * 10_000,
  }
}

/* ── Use of capital (E5 waterfall) ──────────────────────────────────── */

export interface UseOfCapital {
  label: string
  amount: number
  clause?: string
  kind: 'distribution' | 'reserve' | 'philanthropy' | 'venture' | 'liquidity' | 'cost'
}

export function useOfCapital(dps: number, sharePrice = MARKET.bmwSharePrice.value): UseOfCapital[] {
  const inc = incomeStatement(dps, sharePrice)
  const base = POOLED_SHARES * DISTRIBUTION.basePerShare.value
  const memorial = POOLED_SHARES * dps * DISTRIBUTION.memorialShare.value
  const surplus = Math.max(0, inc.netAfterTax - base - memorial)

  return [
    { label: 'Base distribution to members', amount: base, clause: 'E5', kind: 'distribution' },
    { label: 'Memorial and restitution commitment', amount: memorial, clause: 'Art.9', kind: 'philanthropy' },
    { label: 'Family office and advisory costs', amount: inc.totalCosts, kind: 'cost' },
    { label: 'Transfer to Continuity Reserve', amount: surplus * 0.7, clause: 'E5', kind: 'reserve' },
    { label: 'Next-generation ventures', amount: surplus * 0.12, clause: 'E3', kind: 'venture' },
    { label: 'Liquidity reserved for succession events', amount: surplus * 0.18, clause: 'Art.7', kind: 'liquidity' },
  ]
}

/* ── Returns ────────────────────────────────────────────────────────── */

export interface ReturnRow {
  label: string
  nominal: number
  real: number
  afterTax: number
  vol?: number
  sharpe?: number
}

export function returnsTable(
  realisedNominal: number,
  vol: number,
  inflation = MARKET.germanCPI.value,
  rf = MARKET.riskFreeRate.value,
  taxDrag = 0,
): ReturnRow[] {
  const mk = (label: string, nominal: number, v?: number): ReturnRow => ({
    label,
    nominal,
    real: (1 + nominal) / (1 + inflation) - 1,
    afterTax: nominal - taxDrag,
    vol: v,
    sharpe: v ? (nominal - rf) / v : undefined,
  })
  return [mk('Realised — consolidated', realisedNominal, vol)]
}
