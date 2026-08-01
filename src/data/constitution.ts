/**
 * The constitution, encoded.
 *
 * Source: Blümin, D. (2026) "Two Inheritances: A Family Constitution Playbook
 * for the Quandt Family and the Ownership of BMW AG", ENT-0301, Hult
 * International Business School.
 *
 * Every clause below carries (a) its verbatim text, so the platform can quote
 * rather than paraphrase, and (b) `params` — the machine-readable values that
 * actually drive the engines. `drives` records which modules consume the
 * clause, which is what makes traceability navigable in both directions.
 */

export type ModuleId =
  | 'bridge'
  | 'constitution'
  | 'ownership'
  | 'succession'
  | 'portfolio'
  | 'financials'
  | 'operations'

export interface ClauseParam {
  key: string
  label: string
  value: string | number
  unit?: string
}

export interface Clause {
  id: string
  ref: string
  group: string
  title: string
  text: string
  params: ClauseParam[]
  drives: ModuleId[]
}

export const CLAUSES: Clause[] = [
  {
    id: 'Art.1',
    ref: 'Article 1',
    group: 'Preamble',
    title: 'Preamble: Two Inheritances',
    text: 'This family has two founding stories and they contradict each other. A constitution that tells only the flattering one will not survive contact with the family\'s own archive. […] The governing lesson is not which story is true. Both are. It is that the family met the first with silence for sixty years, and a journalist broke that silence rather than the family. A constitution removes silence from the menu.',
    params: [
      { key: 'disclosureDefault', label: 'Disclosure default', value: 'Silence not permitted' },
      { key: 'scholtyseckYear', label: 'Independent study', value: 2011 },
    ],
    drives: ['constitution', 'operations'],
  },
  {
    id: 'Art.2',
    ref: 'Article 2',
    group: 'Purpose',
    title: 'Purpose, Vision and Values',
    text: 'By 2050 a single voting bloc of Herbert Quandt\'s descendants should hold at least a quarter of BMW\'s voting capital, exercise oversight without executive power, and fund a memorial programme no member may quietly discontinue. Four values follow, each traceable to an event rather than an aspiration. Patience across the cycle: Herbert did not sell in 1959, Johanna did not dilute during the Rover crisis. Restraint from executive power: no family member has sat on BMW\'s Board of Management since 1959, a rule and not an accident. Memory as obligation: the 2011 study came under public pressure, and Article 9 removes the pressure requirement. Privacy as security, not concealment: the 1978 kidnapping attempt on Johanna and Susanne, and the 2009 Sgarbi extortion conviction, make discretion protective.',
    params: [
      { key: 'targetYear', label: 'Horizon', value: 2050 },
      { key: 'minVotingCapital', label: 'Minimum voting capital', value: 25, unit: '%' },
      { key: 'executivePower', label: 'Executive power', value: 'Oversight only' },
    ],
    drives: ['bridge', 'ownership', 'portfolio'],
  },
  {
    id: 'Art.3',
    ref: 'Article 3',
    group: 'Ownership',
    title: 'Ownership: The Present Architecture',
    text: 'Family control here is a residual: whatever survives the company\'s own capital decisions. Buybacks help them, issuance hurts them, and neither is theirs to decide. […] This family\'s influence rests on economic ownership alone, which makes pooling that ownership the most urgent clause in the document.',
    params: [
      { key: 'poolFloor', label: 'Pool floor', value: 27, unit: '%' },
      { key: 'floorTestCadence', label: 'Floor test', value: 'Quarterly' },
      { key: 'blockingMinority', label: 'Sperrminorität', value: 25, unit: '%' },
      { key: 'familyShares', label: 'Pooled shares (fixed)', value: 281_700_000, unit: 'shares' },
    ],
    drives: ['bridge', 'ownership', 'succession', 'portfolio'],
  },
  {
    id: 'Art.4',
    ref: 'Article 4',
    group: 'Governance',
    title: 'Governance Bodies and Decision Rights',
    text: 'The design splits two currencies: money votes in the Owners\' Council, people vote in the Assembly, and amendment needs both, so a large holder blocks change but cannot impose it. […] That arithmetic is the most under-appreciated constraint on this family: even at half the voting capital they elect ten of twenty seats. They cannot govern BMW alone, and a constitution promising the fifth generation control would be lying to it.',
    params: [
      { key: 'supervisoryTotal', label: 'Supervisory Board seats', value: 20 },
      { key: 'shareholderBench', label: 'Shareholder-elected seats', value: 10 },
      { key: 'familySeats', label: 'Family seats', value: 2 },
      { key: 'councilCadence', label: 'Owners\' Council', value: 'Quarterly' },
    ],
    drives: ['constitution', 'operations', 'ownership'],
  },
  {
    id: 'Art.5',
    ref: 'Article 5',
    group: 'Boundary',
    title: 'The Family–Business Boundary',
    text: 'No descendant may serve on BMW\'s Board of Management. This codifies sixty-five years of unbroken practice. […] In-laws hold no voting equity, ever: a seat at the Assembly, an observer seat on the Council, full access to education. Voice without vote.',
    params: [
      { key: 'boardOfManagement', label: 'Family on Vorstand', value: 'Prohibited' },
      { key: 'inLawEquity', label: 'In-law voting equity', value: 'Never' },
    ],
    drives: ['succession', 'operations', 'constitution'],
  },
  {
    id: 'Art.6',
    ref: 'Article 6',
    group: 'Distribution',
    title: 'Distribution and Reinvestment',
    text: 'Family income varied more than fourfold in seven years on an unchanged shareholding, and the siblings received roughly 2€ billion in 2024 (Surplus, 2025). […] For a fifth generation of four or more owners it will not be, and the payout ratio driving it is set by a board the family does not control alone. The Owners\' Council therefore distributes a smoothed base per pooled share, with the surplus funding a Continuity Reserve that covers the base in weak years, buys shares when the pool nears the floor, and finances exits.',
    params: [
      { key: 'mechanism', label: 'Mechanism', value: 'Smoothed base + Continuity Reserve' },
      { key: 'volatility', label: 'Observed dividend range', value: '1.90 € to 8.50 €' },
    ],
    drives: ['financials', 'bridge'],
  },
  {
    id: 'Art.7',
    ref: 'Article 7',
    group: 'Succession',
    title: 'Continuity and the Fifth Generation',
    text: 'Equity transfers in three tranches, at 25, 35 and 45, as gifts against the ErbStG Verschonungsabschlag. That carries a known risk: relief above 90€ million already requires a needs test, a constitutional challenge is pending, and a proposal exists to replace business relief with a 5€ million allowance, so the Owners\' Council reviews the schedule annually. […] This constitution therefore requires a named standing proxy for every pooled holding, exercisable on death or incapacity.',
    params: [
      { key: 'tranche1', label: 'Tranche 1', value: 25, unit: 'years' },
      { key: 'tranche2', label: 'Tranche 2', value: 35, unit: 'years' },
      { key: 'tranche3', label: 'Tranche 3', value: 45, unit: 'years' },
      { key: 'reliefNeedsTest', label: 'ErbStG needs test above', value: 90_000_000, unit: 'EUR' },
      { key: 'reformAllowance', label: 'Proposed replacement allowance', value: 5_000_000, unit: 'EUR' },
      { key: 'standingProxy', label: 'Standing proxy', value: 'Required for every holding' },
    ],
    drives: ['succession', 'bridge', 'operations'],
  },
  {
    id: 'Art.8',
    ref: 'Article 8',
    group: 'Conflict',
    title: 'Conflict, Conduct and Communication',
    text: 'Strategy disputes go to the Owners\' Council and end in a vote. Disputes between people climb a ladder: the Council chair mediates within thirty days, then an external mediator named annually by the Assembly, then binding arbitration under DIS rules seated in Munich. The pooling agreement carries the arbitration clause, making the ladder enforceable rather than advisory.',
    params: [
      { key: 'step1', label: 'Step 1 — Council chair', value: 30, unit: 'days' },
      { key: 'step2', label: 'Step 2', value: 'External mediator' },
      { key: 'step3', label: 'Step 3', value: 'DIS arbitration, Munich' },
      { key: 'infoTiers', label: 'Information tiers', value: 3 },
    ],
    drives: ['operations', 'constitution'],
  },
  {
    id: 'Art.9',
    ref: 'Article 9',
    group: 'Legacy',
    title: 'Philanthropy, Memory and Legacy Stewardship',
    text: 'Half a per cent of pooled dividend income is committed in perpetuity to forced-labour documentation and education, disbursed by the Family Council and terminable only by unanimous vote. Every descendant attends a family-history seminar at sixteen covering the Scholtyseck findings and visits the documentation centre at Berlin-Schöneweide, on the former Pertrix site. Financial-statement literacy follows at eighteen and mentorship by a non-family executive at twenty-one, on the Haniel Academy model. Philanthropy is discretionary. Restitution is not.',
    params: [
      { key: 'memorialShare', label: 'Memorial commitment', value: 0.5, unit: '% of pooled dividend' },
      { key: 'termination', label: 'Terminable by', value: 'Unanimity only' },
      { key: 'edu16', label: 'Age 16', value: 'Family-history seminar' },
      { key: 'edu18', label: 'Age 18', value: 'Financial-statement literacy' },
      { key: 'edu21', label: 'Age 21', value: 'Non-family mentorship' },
    ],
    drives: ['financials', 'operations', 'bridge'],
  },
  {
    id: 'Art.10',
    ref: 'Article 10',
    group: 'Amendment',
    title: 'Ratification, Review and Amendment',
    text: 'Amendment requires seventy-five per cent of pooled shares and a simple majority of the Assembly by head. Neither alone suffices. The document sunsets after thirty years, following Freudenberg\'s practice of renewing its partnership agreement for a defined term rather than presuming perpetuity.',
    params: [
      { key: 'amendShare', label: 'Amendment — by share', value: 75, unit: '%' },
      { key: 'amendHead', label: 'Amendment — by head', value: 50, unit: '%' },
      { key: 'sunset', label: 'Sunset', value: 30, unit: 'years' },
    ],
    drives: ['constitution', 'operations'],
  },
  {
    id: 'App.B',
    ref: 'Appendix B',
    group: 'Ownership',
    title: 'Ownership Arithmetic: Why the Percentage Moves Without a Trade',
    text: 'The family\'s holding in ordinary shares has been fixed at approximately 281.7 million since the February 2018 division of Johanna Quandt\'s estate. The reported percentage has nonetheless changed twice because the denominator changed. […] At 615.8 million shares in issue, the 25 per cent threshold sits at approximately 153.95 million shares against his approximately 155.5 million. The headroom is on the order of 1.5 to 2 million shares.',
    params: [
      { key: 'sharesInIssue', label: 'Ordinary shares in issue', value: 615_810_431, unit: 'shares' },
      { key: 'conversionSize', label: 'Preferred converted 30 Jun 2026', value: 54_675_505, unit: 'shares' },
      { key: 'stefanShares', label: 'Stefan Quandt', value: 155_500_000, unit: 'shares' },
      { key: 'susanneShares', label: 'Susanne Klatten', value: 126_200_000, unit: 'shares' },
    ],
    drives: ['bridge', 'ownership'],
  },
  {
    id: 'E1',
    ref: 'Appendix E1',
    group: 'Eligibility',
    title: 'Eligibility and Share Transfer',
    text: '1. Voting equity in BMW AG may be held only by (a) descendants of Herbert Quandt by blood or adoption, and (b) trusts or holding companies wholly beneficially owned by such descendants. 2. Spouses and registered partners are not eligible to hold voting equity at any time, including by testamentary disposition. 3. Any transfer to a non-eligible person is void as against the pool and triggers the buy-out in E2. 4. Continued membership is conditional on a prenuptial agreement providing for separation of property, and on a will consistent with the pooling agreement.',
    params: [
      { key: 'eligibleClass', label: 'Eligible holders', value: 'Herbert Quandt descendants + wholly-owned vehicles' },
      { key: 'spouses', label: 'Spouses', value: 'Ineligible, including by will' },
      { key: 'prenupRequired', label: 'Prenuptial agreement', value: 'Condition of membership' },
      { key: 'willConsistency', label: 'Will consistency', value: 'Condition of membership' },
    ],
    drives: ['succession', 'operations'],
  },
  {
    id: 'E2',
    ref: 'Appendix E2',
    group: 'Valuation',
    title: 'Valuation and Buy-Sell',
    text: 'A member may exit at any time on ninety days\' notice. 2. The pool has a right of first refusal, exercisable within sixty days, at the volume-weighted average price of the BMW ordinary share over the preceding ninety trading days, less a 20 per cent discount reflecting illiquidity and the transfer restrictions. 3. The purchase is funded from the Continuity Reserve, where the Reserve is insufficient, the pool may pay in three annual instalments with interest at the ECB main refinancing rate plus 200 basis points. 4. Unlisted family assets are valued triennially by an independent firm appointed by the Owners\' Council, on the IDW S1 standard.',
    params: [
      { key: 'noticeDays', label: 'Exit notice', value: 90, unit: 'days' },
      { key: 'rofrDays', label: 'Right of first refusal', value: 60, unit: 'days' },
      { key: 'vwapWindow', label: 'VWAP window', value: 90, unit: 'trading days' },
      { key: 'discount', label: 'Transfer discount', value: 20, unit: '%' },
      { key: 'instalments', label: 'Instalments', value: 3, unit: 'years' },
      { key: 'instalmentSpread', label: 'Instalment spread', value: 200, unit: 'bp over ECB MRO' },
      { key: 'valuationStandard', label: 'Unlisted valuation', value: 'IDW S1, triennial' },
    ],
    drives: ['succession', 'financials', 'operations'],
  },
  {
    id: 'E3',
    ref: 'Appendix E3',
    group: 'Employment',
    title: 'Family Employment',
    text: 'No descendant may serve on the Board of Management of BMW AG. 2. Eligibility for employment in a family holding company requires a completed degree, a minimum of five years of employment outside the family\'s companies, and documented profit-and-loss responsibility. 3. Applications are assessed by the relevant company\'s own process, not by the Family Council. 4. Remuneration is benchmarked externally by the Family Council against comparable non-family roles. Neither a family discount nor a family premium is permitted.',
    params: [
      { key: 'degree', label: 'Degree', value: 'Required' },
      { key: 'outsideYears', label: 'Outside experience', value: 5, unit: 'years' },
      { key: 'pnl', label: 'P&L responsibility', value: 'Documented' },
      { key: 'remuneration', label: 'Remuneration', value: 'Externally benchmarked' },
    ],
    drives: ['succession', 'operations'],
  },
  {
    id: 'E4',
    ref: 'Appendix E4',
    group: 'Conduct',
    title: 'Code of Conduct',
    text: 'No member may trade, pledge or hedge BMW shares outside a window approved by the Owners\' Council. 2. No member may speak publicly for the family without a mandate from the Family Council. 3. Every member files an annual declaration of directorships, material investments and conflicts. 4. No member may disclose the address, movements or non-pooled holdings of another member.',
    params: [
      { key: 'tradingWindow', label: 'Trading', value: 'Approved windows only' },
      { key: 'publicVoice', label: 'Public statements', value: 'Council mandate required' },
      { key: 'declaration', label: 'Conflicts declaration', value: 'Annual' },
      { key: 'privacy', label: 'Member privacy', value: 'Addresses and holdings not circulated' },
    ],
    drives: ['operations'],
  },
  {
    id: 'E5',
    ref: 'Appendix E5',
    group: 'Distribution',
    title: 'Distribution Policy',
    text: '1. The Owners\' Council sets a base distribution per pooled share, reset every three years by reference to German CPI. 2. Dividend receipts above the base are transferred to the Continuity Reserve, held at holding-company level. 3. The Reserve is applied, in order of priority, to: funding the base in years when BMW\'s dividend falls below it, purchasing ordinary shares when the pooled percentage approaches the 27 per cent floor, and funding buy-outs under E2. 4. A distribution below the base requires 75 per cent of pooled shares. 5. The Reserve may not be distributed to members.',
    params: [
      { key: 'baseReset', label: 'Base reset', value: 3, unit: 'years, German CPI' },
      { key: 'waterfall1', label: 'Reserve priority 1', value: 'Fund base in weak years' },
      { key: 'waterfall2', label: 'Reserve priority 2', value: 'Buy shares near the 27% floor' },
      { key: 'waterfall3', label: 'Reserve priority 3', value: 'Fund E2 buy-outs' },
      { key: 'belowBase', label: 'Distribution below base', value: 75, unit: '% by share' },
      { key: 'reserveLocked', label: 'Reserve distribution', value: 'Prohibited' },
    ],
    drives: ['financials', 'bridge', 'portfolio'],
  },
]

export const CLAUSE_INDEX: Record<string, Clause> = Object.fromEntries(
  CLAUSES.map((c) => [c.id, c]),
)

/* ── Appendix D, as an executable matrix ──────────────────────────────
   The threshold column is what the Decision Simulator resolves against
   the live cap table. R = responsible, A = accountable, C = consulted,
   I = informed.                                                        */

export type Role = 'A/R' | 'R' | 'A' | 'C' | 'I'
export type ThresholdKind =
  | 'share-majority'
  | 'share-75'
  | 'unanimity'
  | 'dual'
  | 'council-majority'

export interface DecisionRight {
  id: string
  decision: string
  assembly: Role
  familyCouncil: Role
  ownersCouncil: Role
  boardSeats: Role
  threshold: ThresholdKind
  thresholdLabel: string
  clause: string
}

export const DECISION_MATRIX: DecisionRight[] = [
  {
    id: 'agm-instruction',
    decision: 'Instruction for the BMW annual general meeting',
    assembly: 'I', familyCouncil: 'I', ownersCouncil: 'A/R', boardSeats: 'C',
    threshold: 'share-majority', thresholdLabel: 'Simple majority by share', clause: 'App.D',
  },
  {
    id: 'sell-shares',
    decision: 'Sale of any pooled BMW share',
    assembly: 'I', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'share-75', thresholdLabel: '75% by share', clause: 'App.D',
  },
  {
    id: 'abandon-floor',
    decision: 'Abandoning the 27% floor',
    assembly: 'C', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'C',
    threshold: 'share-75', thresholdLabel: '75% by share', clause: 'Art.3',
  },
  {
    id: 'change-base',
    decision: 'Change to the distribution base',
    assembly: 'C', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'share-75', thresholdLabel: '75% by share', clause: 'E5',
  },
  {
    id: 'dissolve-pool',
    decision: 'Dissolution of the pool',
    assembly: 'C', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'unanimity', thresholdLabel: 'Unanimity', clause: 'App.D',
  },
  {
    id: 'nominate-board',
    decision: 'Nomination of a family board candidate',
    assembly: 'I', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'C',
    threshold: 'share-majority', thresholdLabel: 'Simple majority by share', clause: 'Art.7',
  },
  {
    id: 'admit-g5',
    decision: 'Admission of a G5 member to equity',
    assembly: 'I', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'share-majority', thresholdLabel: 'Simple majority by share', clause: 'E1',
  },
  {
    id: 'approve-exit',
    decision: 'Approval of an exit and buy-out price',
    assembly: 'I', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'share-majority', thresholdLabel: 'Simple majority by share', clause: 'E2',
  },
  {
    id: 'education',
    decision: 'Education and memorial programme',
    assembly: 'C', familyCouncil: 'A/R', ownersCouncil: 'I', boardSeats: 'I',
    threshold: 'council-majority', thresholdLabel: 'Council majority', clause: 'Art.9',
  },
  {
    id: 'terminate-memorial',
    decision: 'Termination of the memorial commitment',
    assembly: 'C', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'unanimity', thresholdLabel: 'Unanimity', clause: 'Art.9',
  },
  {
    id: 'escalate-mediation',
    decision: 'Escalation to external mediation',
    assembly: 'I', familyCouncil: 'A/R', ownersCouncil: 'C', boardSeats: 'I',
    threshold: 'council-majority', thresholdLabel: 'Council majority', clause: 'Art.8',
  },
  {
    id: 'amend',
    decision: 'Amendment of this constitution',
    assembly: 'A/R', familyCouncil: 'C', ownersCouncil: 'A/R', boardSeats: 'I',
    threshold: 'dual', thresholdLabel: '75% by share AND majority by head', clause: 'Art.10',
  },
]

/* ── Governance bodies (Appendix C) ──────────────────────────────────── */

export interface Body {
  name: string
  composition: string
  cadence: string
  mandate: string
  cannot: string
}

export const BODIES: Body[] = [
  {
    name: 'Family Assembly',
    composition: 'All descendants of Herbert Quandt aged 18+. Spouses attend without a vote.',
    cadence: 'Annual',
    mandate: 'Elects the Family Council; ratifies amendments by head; receives audited summaries; names the mediation panel.',
    cannot: 'Instruct the AGM vote; access price-sensitive information.',
  },
  {
    name: 'Family Council',
    composition: 'Five members, three-year terms, including one spouse observer without a vote.',
    cadence: 'Quarterly',
    mandate: 'Education programme; memorial disbursements; first-tier mediation; remuneration benchmarking.',
    cannot: 'Trade or pledge pooled shares.',
  },
  {
    name: "Owners' Council",
    composition: 'Pool members only. Votes by share.',
    cadence: 'Quarterly',
    mandate: 'Issues the binding AGM instruction; monitors the 27% floor; administers the Continuity Reserve; nominates board candidates.',
    cannot: 'Amend the constitution alone (needs the Assembly).',
  },
  {
    name: 'Supervisory Board seats',
    composition: 'Two family seats out of 20 (10 shareholder, 10 employee).',
    cadence: "Per BMW's calendar",
    mandate: 'Oversight of the Board of Management within German company law.',
    cannot: "Direct management; act on family instruction contrary to the company's interest.",
  },
]
