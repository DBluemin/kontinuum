/**
 * Modelling assumptions.
 *
 * Everything here is editable in the Assumptions panel and every figure
 * carries provenance. Nothing invented is presented as fact: `paper` means it
 * appears in the Assignment 1 constitution with a citation, `published` means
 * a company or statutory figure to verify at source, `assumption` means a
 * modelling input chosen for the platform.
 */

export type Source = 'paper' | 'published' | 'assumption'

export interface Sourced<T> {
  value: T
  source: Source
  note?: string
}

/* ── Market ─────────────────────────────────────────────────────────── */

export const MARKET = {
  bmwSharePrice: {
    value: 82.5,
    source: 'assumption' as Source,
    note: 'BMW ordinary share, EUR. Editable — drives every valuation in the platform.',
  },
  sharesInIssue: {
    value: 615_810_431,
    source: 'paper' as Source,
    note: '561,134,926 ordinary + 54,675,505 converted preferred, registered 30 June 2026 (Appendix B).',
  },
  germanCPI: { value: 0.021, source: 'assumption' as Source, note: 'Long-run German CPI for the E5 base reset.' },
  ecbMRO: { value: 0.0215, source: 'assumption' as Source, note: 'ECB main refinancing rate — E2 instalment pricing.' },
  riskFreeRate: { value: 0.024, source: 'assumption' as Source },
  /** Every value in the platform is denominated in EUR; UK statutory
      thresholds are stated in GBP and must be converted before use. */
  gbpEur: { value: 1.17, source: 'assumption' as Source, note: 'GBP/EUR, for converting UK statutory thresholds.' },
}

/** Dividend per ordinary share, EUR. Five points are cited in the paper. */
export interface DividendPoint {
  year: number
  dps: number
  source: Source
}

export const DIVIDEND_HISTORY: DividendPoint[] = [
  { year: 2015, dps: 3.2, source: 'paper' },
  { year: 2016, dps: 3.2, source: 'published' },
  { year: 2017, dps: 4.0, source: 'published' },
  { year: 2018, dps: 3.5, source: 'published' },
  { year: 2019, dps: 2.5, source: 'published' },
  { year: 2020, dps: 1.9, source: 'paper' },
  { year: 2021, dps: 5.8, source: 'published' },
  { year: 2022, dps: 8.5, source: 'paper' },
  { year: 2023, dps: 6.0, source: 'published' },
  { year: 2024, dps: 4.3, source: 'paper' },
  { year: 2025, dps: 4.4, source: 'paper' },
]

/* ── Asset classes ──────────────────────────────────────────────────── */

export interface AssetClass {
  id: string
  label: string
  short: string
  /** Expected nominal total return, annual. */
  er: number
  /** Annualised volatility. */
  vol: number
  /** Illiquid sleeves cannot be sold to meet a succession liability. */
  liquid: boolean
  /** Fails a values-based screen carried over from Art.2 / Art.9. */
  screenedOut?: boolean
}

export const ASSET_CLASSES: AssetClass[] = [
  { id: 'bmw', label: 'BMW AG ordinary shares', short: 'BMW', er: 0.075, vol: 0.28, liquid: true },
  { id: 'geq', label: 'Global equity ex-auto', short: 'GEQ', er: 0.07, vol: 0.16, liquid: true },
  { id: 'poc', label: 'Private operating companies', short: 'POC', er: 0.09, vol: 0.22, liquid: false },
  { id: 'fi', label: 'Fixed income (EUR IG)', short: 'FI', er: 0.032, vol: 0.055, liquid: true },
  { id: 'pe', label: 'Private equity & co-investment', short: 'PE', er: 0.105, vol: 0.24, liquid: false },
  { id: 'ra', label: 'Real assets & property', short: 'RA', er: 0.058, vol: 0.12, liquid: false },
  { id: 'cash', label: 'Cash & near-cash', short: 'CASH', er: 0.024, vol: 0.008, liquid: true },
]

/** Correlation matrix, ordered as ASSET_CLASSES. */
export const CORRELATION: number[][] = [
  //        BMW   GEQ   POC    FI    PE    RA  CASH
  /* BMW  */ [1.0, 0.72, 0.55, 0.1, 0.58, 0.35, 0.0],
  /* GEQ  */ [0.72, 1.0, 0.62, 0.15, 0.74, 0.45, 0.0],
  /* POC  */ [0.55, 0.62, 1.0, 0.1, 0.6, 0.38, 0.0],
  /* FI   */ [0.1, 0.15, 0.1, 1.0, 0.12, 0.25, 0.2],
  /* PE   */ [0.58, 0.74, 0.6, 0.12, 1.0, 0.42, 0.0],
  /* RA   */ [0.35, 0.45, 0.38, 0.25, 0.42, 1.0, 0.05],
  /* CASH */ [0.0, 0.0, 0.0, 0.2, 0.0, 0.05, 1.0],
]

/**
 * Values-based screen carried over from the constitution. Art.2 commits the
 * family to oversight without executive power and Art.9 to restitution as a
 * permanent obligation; the screen excludes sectors the Family Council judged
 * irreconcilable with a memorial commitment funded in perpetuity.
 */
export const VALUES_SCREEN = {
  clause: 'Art.9',
  excluded: ['Defence primes and munitions', 'Forced-labour supply-chain flags', 'Thermal coal extraction'],
  /** Return drag applied to screened sleeves, in basis points per annum. */
  dragBp: 18,
  /** Volatility effect — a narrower universe is slightly less diversified. */
  volAddBp: 25,
}

/* ── Distribution policy (E5) ───────────────────────────────────────── */

export const DISTRIBUTION = {
  basePerShare: { value: 4.0, source: 'assumption' as Source, note: 'E5.1 base per pooled share, reset triennially by German CPI.' },
  memorialShare: { value: 0.005, source: 'paper' as Source, note: 'Art.9 — 0.5% of pooled dividend income, in perpetuity.' },
  reserveOpening: { value: 1_400_000_000, source: 'assumption' as Source, note: 'Opening Continuity Reserve, EUR.' },
  reserveReturn: { value: 0.038, source: 'assumption' as Source, note: 'Reserve is held conservatively at holding-company level.' },
}

/* ── Tax ────────────────────────────────────────────────────────────── */

export const UK_TAX = {
  nilRateBand: 325_000,
  residenceNilRateBand: 175_000,
  rate: 0.4,
  /** Business Property Relief. From April 2026 a £1m allowance at 100%, then 50%. */
  bprAllowance: 1_000_000,
  bprRateWithinAllowance: 1.0,
  bprRateAbove: 0.5,
  /** Potentially exempt transfer taper, by completed years survived. */
  petTaper: [1.0, 1.0, 1.0, 0.8, 0.6, 0.4, 0.2, 0.0],
  /** Relevant property regime — ten-year anniversary charge. */
  decennialCharge: 0.06,
  note: 'English law baseline as mandated by the brief.',
}

export const DE_TAX = {
  /** §16 ErbStG allowance, Class I child, per 10 years. */
  classIAllowance: 400_000,
  /** §19 ErbStG top marginal rate, Class I. */
  topRate: 0.3,
  /** §13a Regelverschonung / Optionsverschonung. */
  regelverschonung: 0.85,
  optionsverschonung: 1.0,
  /** §13c — relief begins to abate above this per acquirer. */
  abatementFloor: 26_000_000,
  /** Relief reaches zero here; above it a needs test applies (Art.7). */
  abatementCeiling: 90_000_000,
  /** §13a(9) Vorwegabschlag for pooling and transfer restrictions. */
  vorwegabschlagMax: 0.3,
  /** Reform risk flagged in Art.7: business relief replaced by a flat allowance. */
  reformAllowance: 5_000_000,
  /** Kapitalertragsteuer + Solidaritätszuschlag on distributed dividends. */
  dividendWithholding: 0.26375,
  /** §8b KStG — 95% participation exemption, 5% deemed non-deductible. */
  interCorporateEffective: 0.015,
  note: 'German overlay: the jurisdiction the case actually sits in.',
}

/* ── Fees and total cost of ownership ───────────────────────────────── */

export const COSTS = {
  familyOfficeOpex: { value: 24_000_000, source: 'assumption' as Source, note: 'SFO running cost, EUR p.a.' },
  externalManagerFees: { value: 0.0042, source: 'assumption' as Source, note: 'Blended, on managed sleeves.' },
  custodyAndAdmin: { value: 0.0009, source: 'assumption' as Source },
  advisoryAndLegal: { value: 6_500_000, source: 'assumption' as Source, note: 'EUR p.a., including IDW S1 triennial valuations.' },
}

export const LIABILITY_NOTE =
  'BMW share price, portfolio capital-market assumptions, the distribution base and the opening Continuity Reserve are modelling inputs, not reported figures. Share counts, the conversion size, the dividend points marked as cited, and every governance threshold come from the Assignment 1 constitution and its sources. Susanne Klatten\'s and Stefan Quandt\'s private holding-company valuations are estimates: neither files public accounts at group level.'

/* ── Benchmarks ─────────────────────────────────────────────────────── */

export const BENCHMARKS = [
  { id: 'target', label: 'Family required return (Art.2 horizon)', er: 0.062 },
  { id: 'msci', label: 'MSCI World (EUR)', er: 0.07, vol: 0.155 },
  { id: 'dax', label: 'DAX 40', er: 0.072, vol: 0.19 },
  { id: 'balanced', label: '60/40 EUR balanced', er: 0.052, vol: 0.101 },
]
