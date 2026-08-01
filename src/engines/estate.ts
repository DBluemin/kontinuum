/**
 * Estate engine — English law baseline with a German overlay.
 *
 * The brief mandates English law. The case sits in Germany. Rather than pick
 * one and misrepresent the other, every succession event is computed under
 * both regimes and shown side by side, which turns the conflict into the
 * analysis: at this scale the two systems fail in completely different places.
 *
 * The finding the engine exists to surface: German business relief
 * (§13a ErbStG) abates to nothing above roughly 90m € per acquirer, so at
 * Quandt scale the Verschonungsabschlag the constitution relies on in Art.7
 * does almost no work. What does work is the §13a(9) Vorwegabschlag — up to
 * 30% off the valuation, earned precisely by the pooling restrictions the
 * constitution imposes. The discipline pays for itself, but not the way
 * Article 7 assumes.
 */

import { UK_TAX, DE_TAX, MARKET } from '../data/assumptions'
import { dec } from '../lib/format'

/** UK statutory thresholds are in GBP; every value here is in EUR. */
const gbp = (v: number) => v * MARKET.gbpEur.value

export type Jurisdiction = 'UK' | 'DE'

export interface TransferInput {
  /** Gross value of the transferred interest, EUR. */
  value: number
  /** Number of acquirers the transfer is split across. */
  acquirers: number
  /** Transfer on death, or a lifetime gift. */
  mode: 'death' | 'gift'
  /** Completed years survived after a lifetime gift (UK taper / DE 10-year clock). */
  yearsSurvived: number
  /** Qualifies as relevant business property / begünstigtes Vermögen. */
  businessProperty: boolean
  /** §13a(9) — pooling and transfer restrictions are in force. */
  poolingRestrictions: boolean
  /** §13a — full 100% option rather than the 85% standard. */
  optionsverschonung: boolean
}

export interface TaxResult {
  jurisdiction: Jurisdiction
  gross: number
  reliefs: { label: string; amount: number; clause?: string }[]
  taxable: number
  rate: number
  tax: number
  effectiveRate: number
  notes: string[]
}

/* ── England and Wales ──────────────────────────────────────────────── */

export function computeUK(input: TransferInput): TaxResult {
  const reliefs: TaxResult['reliefs'] = []
  const notes: string[] = []
  let remaining = input.value

  if (input.businessProperty) {
    // From April 2026: 100% BPR within a £1m allowance, 50% above it.
    const allowance = Math.min(remaining, gbp(UK_TAX.bprAllowance) * input.acquirers)
    reliefs.push({
      label: 'Business Property Relief — within allowance (100%)',
      amount: allowance,
    })
    const above = remaining - allowance
    const aboveRelief = above * UK_TAX.bprRateAbove
    if (above > 0) {
      reliefs.push({ label: 'Business Property Relief — above allowance (50%)', amount: aboveRelief })
    }
    remaining = remaining - allowance - aboveRelief
    notes.push(
      'BPR is capped from April 2026: 100% within a £1m allowance per person, then 50%. On a holding of this size the 50% band does the work, so half the value stays exposed — the single largest difference from the German treatment.',
    )
  }

  // Nil-rate bands, converted from GBP
  const nrb =
    (gbp(UK_TAX.nilRateBand) + (input.mode === 'death' ? gbp(UK_TAX.residenceNilRateBand) : 0)) *
    input.acquirers
  const taperThreshold = gbp(2_000_000)
  if (input.value > taperThreshold) {
    notes.push(
      'The residence nil-rate band tapers away entirely on estates above £2m, so it contributes nothing here.',
    )
  }
  const nrbApplied = Math.min(
    remaining,
    input.value > taperThreshold ? gbp(UK_TAX.nilRateBand) * input.acquirers : nrb,
  )
  reliefs.push({ label: 'Nil-rate band', amount: nrbApplied })
  remaining -= nrbApplied

  let rate = UK_TAX.rate
  if (input.mode === 'gift') {
    const taper = UK_TAX.petTaper[Math.min(UK_TAX.petTaper.length - 1, Math.max(0, input.yearsSurvived))]
    rate = UK_TAX.rate * taper
    notes.push(
      taper === 0
        ? 'Seven years survived: the gift falls out of the estate entirely.'
        : `Potentially exempt transfer, ${input.yearsSurvived} year(s) survived — taper leaves ${dec(taper * 100, 0)}% of the 40% charge in point.`,
    )
  }

  const taxable = Math.max(0, remaining)
  const tax = taxable * rate

  return {
    jurisdiction: 'UK',
    gross: input.value,
    reliefs,
    taxable,
    rate,
    tax,
    effectiveRate: input.value > 0 ? tax / input.value : 0,
    notes,
  }
}

/* ── Germany ────────────────────────────────────────────────────────── */

/** §19 ErbStG, Steuerklasse I — the rate applies to the whole acquisition. */
export function germanClassIRate(taxableBase: number): number {
  const bands: [number, number][] = [
    [75_000, 0.07],
    [300_000, 0.11],
    [600_000, 0.15],
    [6_000_000, 0.19],
    [13_000_000, 0.23],
    [26_000_000, 0.27],
    [Infinity, 0.3],
  ]
  for (const [ceiling, rate] of bands) if (taxableBase <= ceiling) return rate
  return DE_TAX.topRate
}

/**
 * §13c Abschmelzmodell: above 26m € per acquirer the exemption percentage
 * falls by one point for every 750,000 € of excess, reaching zero at about 90m €.
 */
export function abatedExemption(perAcquirer: number, baseRate: number): number {
  if (perAcquirer <= DE_TAX.abatementFloor) return baseRate
  const excess = perAcquirer - DE_TAX.abatementFloor
  const reduction = Math.floor(excess / 750_000) / 100
  return Math.max(0, baseRate - reduction)
}

export function computeDE(input: TransferInput): TaxResult {
  const reliefs: TaxResult['reliefs'] = []
  const notes: string[] = []
  let value = input.value

  // §13a(9) Vorwegabschlag — applied to the valuation, before any exemption.
  if (input.poolingRestrictions) {
    const abschlag = value * DE_TAX.vorwegabschlagMax
    reliefs.push({
      label: '§13a(9) Vorwegabschlag — pooling and transfer restrictions',
      amount: abschlag,
      clause: 'E1',
    })
    value -= abschlag
    notes.push(
      'The 30% Vorwegabschlag is earned by the pooling agreement itself: restrictions on disposal, withdrawal and compensation. This is the single largest relief available at this scale, and it exists only because the constitution imposes the restrictions in E1 and E2.',
    )
  }

  const perAcquirer = value / Math.max(1, input.acquirers)

  if (input.businessProperty) {
    const baseRate = input.optionsverschonung ? DE_TAX.optionsverschonung : DE_TAX.regelverschonung
    const applied = abatedExemption(perAcquirer, baseRate)
    const exemption = value * applied
    reliefs.push({
      label: `§13a Verschonungsabschlag (${dec(applied * 100, 0)}% after abatement)`,
      amount: exemption,
      clause: 'Art.7',
    })
    value -= exemption

    if (applied === 0) {
      notes.push(
        `Business relief abates to zero above roughly 90m € per acquirer. At ${dec(perAcquirer / 1e6, 0)}m € each, the Verschonungsabschlag that Art.7 plans around is worth nothing. Only the Verschonungsbedarfsprüfung — a needs test applying 50% of the acquirer's other private assets to the bill — remains, and it is discretionary relief, not an entitlement.`,
      )
    } else if (applied < baseRate) {
      notes.push(
        `Relief abates by one point per 750,000 € above 26m €, leaving ${dec(applied * 100, 0)}% of the standard ${dec(baseRate * 100, 0)}%.`,
      )
    }
  }

  // §16 personal allowance, per acquirer, refreshing every ten years.
  const allowance = DE_TAX.classIAllowance * input.acquirers
  const allowanceApplied = Math.min(value, allowance)
  reliefs.push({ label: '§16 personal allowance (per child, per decade)', amount: allowanceApplied })
  value -= allowanceApplied

  if (input.mode === 'gift') {
    notes.push(
      'Lifetime gifting resets the §16 allowance every ten years, which is why Art.7 stages transfers at 25, 35 and 45 rather than transferring once.',
    )
  }

  const taxable = Math.max(0, value)
  const rate = germanClassIRate(taxable / Math.max(1, input.acquirers))
  const tax = taxable * rate

  return {
    jurisdiction: 'DE',
    gross: input.value,
    reliefs,
    taxable,
    rate,
    tax,
    effectiveRate: input.value > 0 ? tax / input.value : 0,
    notes,
  }
}

export function computeBoth(input: TransferInput): { uk: TaxResult; de: TaxResult } {
  return { uk: computeUK(input), de: computeDE(input) }
}

/* ── Article 7 tranche schedule ─────────────────────────────────────── */

export interface Tranche {
  age: number
  fraction: number
  yearsAway: number | null
  label: string
}

export const TRANCHE_AGES = [25, 35, 45]

export function trancheSchedule(currentAge: number | null): Tranche[] {
  return TRANCHE_AGES.map((age, i) => ({
    age,
    fraction: 1 / 3,
    yearsAway: currentAge === null ? null : age - currentAge,
    label: `Tranche ${i + 1} — age ${age}`,
  }))
}

/* ── Liquidity at a succession event ────────────────────────────────── */

export interface LiquidityTest {
  taxDue: number
  liquidAssets: number
  reserveAvailable: number
  shortfall: number
  sharesToSell: number
  /** Does meeting the bill in cash breach a constitutional threshold? */
  breachesFloor: boolean
  breachesBlocking: boolean
  verdict: string
}

export function liquidityAtEvent(
  taxDue: number,
  liquidAssets: number,
  reserveAvailable: number,
  sharePrice: number,
  stefanShares: number,
  pooledShares: number,
  sharesInIssue: number,
): LiquidityTest {
  const covered = liquidAssets + reserveAvailable
  const shortfall = Math.max(0, taxDue - covered)
  const sharesToSell = shortfall / sharePrice

  const stefanAfter = (stefanShares - sharesToSell) / sharesInIssue
  const pooledAfter = (pooledShares - sharesToSell) / sharesInIssue
  const breachesBlocking = stefanAfter < 0.25
  const breachesFloor = pooledAfter < 0.27

  let verdict: string
  if (shortfall === 0) {
    verdict = 'The bill is met from liquid assets and the Continuity Reserve. No shares move.'
  } else if (breachesBlocking) {
    verdict = `Meeting the bill requires selling ${dec(sharesToSell / 1e6, 2)}m shares, which takes Stefan Quandt below the blocking quarter. A death in the family ends the veto that decades of market volatility never touched.`
  } else if (breachesFloor) {
    verdict = `Meeting the bill requires selling ${dec(sharesToSell / 1e6, 2)}m shares and breaches the Art.3 pool floor. Abandoning the floor needs 75% by share.`
  } else {
    verdict = `A shortfall of ${dec(shortfall / 1e9, 2)}bn € requires selling ${dec(sharesToSell / 1e6, 2)}m shares. Both thresholds hold, but the sale must clear an approved trading window under E4.1 and 75% by share under Appendix D.`
  }

  return {
    taxDue,
    liquidAssets,
    reserveAvailable,
    shortfall,
    sharesToSell,
    breachesFloor,
    breachesBlocking,
    verdict,
  }
}

/* ── Structures ─────────────────────────────────────────────────────── */

export interface StructureNode {
  id: string
  label: string
  kind: 'trust' | 'holding' | 'operating' | 'listed' | 'family'
  jurisdiction: string
  children?: StructureNode[]
  clause?: string
  note?: string
}

export const TARGET_STRUCTURE: StructureNode = {
  id: 'pool',
  label: 'Poolvertrag — Herbert Quandt descendants',
  kind: 'family',
  jurisdiction: 'Germany',
  clause: 'E1',
  note: 'Binds all family shares under one voting instruction. Earns the §13a(9) Vorwegabschlag and carries the DIS arbitration clause.',
  children: [
    {
      id: 'stefan-holdco',
      label: 'Stefan branch holding',
      kind: 'holding',
      jurisdiction: 'Germany',
      clause: 'E1',
      children: [
        { id: 'bmw-s', label: 'BMW AG — 155.5m ordinary', kind: 'listed', jurisdiction: 'Germany', clause: 'App.B' },
        { id: 'delton', label: 'Delton AG', kind: 'operating', jurisdiction: 'Germany' },
      ],
    },
    {
      id: 'susanne-holdco',
      label: 'Susanne branch holding',
      kind: 'holding',
      jurisdiction: 'Germany',
      clause: 'E1',
      children: [
        { id: 'bmw-k', label: 'BMW AG — 126.2m ordinary', kind: 'listed', jurisdiction: 'Germany', clause: 'App.B' },
        { id: 'skion', label: 'SKion GmbH → Altana AG', kind: 'operating', jurisdiction: 'Germany', note: 'One third each to the three Klatten children since July 2024.' },
      ],
    },
    {
      id: 'reserve',
      label: 'Continuity Reserve',
      kind: 'holding',
      jurisdiction: 'Germany',
      clause: 'E5',
      note: 'Held at holding-company level. Funds the base in weak years, buys shares near the floor, finances E2 exits. May never be distributed.',
    },
  ],
}
