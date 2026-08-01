/**
 * The population the constitution must govern (Appendix A).
 *
 * Data provenance is tracked explicitly. `sourced` fields come from the
 * paper's cited sources; `estimated` fields are modelling inputs the platform
 * must not present as fact. Two G5 members of the Stefan branch are not
 * publicly documented — that gap is itself a governance finding, not an
 * omission to paper over.
 */

export type Provenance = 'sourced' | 'estimated' | 'undisclosed'

export interface ComplianceFlags {
  /** E1.4 — prenuptial agreement providing separation of property */
  prenup: boolean | null
  /** E1.4 — will consistent with the pooling agreement */
  willConsistent: boolean | null
  /** Art.7 — named standing proxy, exercisable on death or incapacity */
  standingProxy: boolean | null
  /** E4.3 — annual declaration of directorships and conflicts */
  conflictsDeclared: boolean | null
}

export interface EducationTrack {
  /** Art.9 — family-history seminar and Berlin-Schöneweide visit */
  seminar16: boolean | null
  /** Art.9 — financial-statement literacy */
  literacy18: boolean | null
  /** Art.9 — mentorship by a non-family executive */
  mentorship21: boolean | null
}

export interface Member {
  id: string
  name: string
  generation: 'G3' | 'G4' | 'G5'
  branch: 'Stefan' | 'Susanne' | 'Harald'
  birthYear: number | null
  birthYearProvenance: Provenance
  /** Pooled BMW ordinary shares held directly. */
  shares: number
  /** Eligible to hold voting equity under E1. */
  eligible: boolean
  role: string
  poolMember: boolean
  compliance: ComplianceFlags
  education: EducationTrack
  note?: string
}

export const AS_OF_YEAR = 2026

export const MEMBERS: Member[] = [
  {
    id: 'stefan',
    name: 'Stefan Quandt',
    generation: 'G4',
    branch: 'Stefan',
    birthYear: 1966,
    birthYearProvenance: 'sourced',
    shares: 155_500_000,
    eligible: true,
    role: 'Deputy Chairman, BMW Supervisory Board (since 1999)',
    poolMember: true,
    compliance: { prenup: true, willConsistent: true, standingProxy: false, conflictsDeclared: true },
    education: { seminar16: true, literacy18: true, mentorship21: true },
    note: 'Holds the blocking minority. Standing proxy not yet named — Art.7 requires one for every pooled holding.',
  },
  {
    id: 'susanne',
    name: 'Susanne Klatten',
    generation: 'G4',
    branch: 'Susanne',
    birthYear: 1962,
    birthYearProvenance: 'sourced',
    shares: 126_200_000,
    eligible: true,
    role: 'Member, BMW Supervisory Board (since 1997)',
    poolMember: true,
    compliance: { prenup: true, willConsistent: true, standingProxy: true, conflictsDeclared: true },
    education: { seminar16: true, literacy18: true, mentorship21: true },
    note: 'Transferred one third each of SKion GmbH to her three children in July 2024; retained her personal BMW stake.',
  },
  {
    id: 'felix',
    name: 'Felix Klatten',
    generation: 'G5',
    branch: 'Susanne',
    birthYear: 1992,
    birthYearProvenance: 'estimated',
    shares: 0,
    eligible: true,
    role: 'SKion GmbH — one third since July 2024',
    poolMember: false,
    compliance: { prenup: null, willConsistent: false, standingProxy: false, conflictsDeclared: true },
    education: { seminar16: true, literacy18: true, mentorship21: true },
  },
  {
    id: 'alexander',
    name: 'Alexander Klatten',
    generation: 'G5',
    branch: 'Susanne',
    birthYear: 1994,
    birthYearProvenance: 'estimated',
    shares: 0,
    eligible: true,
    role: 'SKion GmbH — one third since July 2024',
    poolMember: false,
    compliance: { prenup: null, willConsistent: false, standingProxy: false, conflictsDeclared: true },
    education: { seminar16: true, literacy18: true, mentorship21: false },
  },
  {
    id: 'johanna',
    name: 'Johanna Klatten',
    generation: 'G5',
    branch: 'Susanne',
    birthYear: 1997,
    birthYearProvenance: 'estimated',
    shares: 0,
    eligible: true,
    role: 'SKion GmbH — one third since July 2024',
    poolMember: false,
    compliance: { prenup: null, willConsistent: false, standingProxy: false, conflictsDeclared: false },
    education: { seminar16: true, literacy18: false, mentorship21: false },
  },
  {
    id: 'sq-child-1',
    name: 'Stefan Quandt — heir 1',
    generation: 'G5',
    branch: 'Stefan',
    birthYear: null,
    birthYearProvenance: 'undisclosed',
    shares: 0,
    eligible: true,
    role: 'Not publicly documented',
    poolMember: false,
    compliance: { prenup: null, willConsistent: null, standingProxy: null, conflictsDeclared: null },
    education: { seminar16: null, literacy18: null, mentorship21: null },
    note: 'Placeholder. Stefan Quandt\'s children are not publicly documented; the succession model for this branch runs on assumed ages and must be re-based once the Owners\' Council holds real data.',
  },
  {
    id: 'sq-child-2',
    name: 'Stefan Quandt — heir 2',
    generation: 'G5',
    branch: 'Stefan',
    birthYear: null,
    birthYearProvenance: 'undisclosed',
    shares: 0,
    eligible: true,
    role: 'Not publicly documented',
    poolMember: false,
    compliance: { prenup: null, willConsistent: null, standingProxy: null, conflictsDeclared: null },
    education: { seminar16: null, literacy18: null, mentorship21: null },
    note: 'Placeholder. See heir 1.',
  },
]

export const G4 = MEMBERS.filter((m) => m.generation === 'G4')
export const G5 = MEMBERS.filter((m) => m.generation === 'G5')
export const POOL_MEMBERS = MEMBERS.filter((m) => m.poolMember)

export function age(m: Member, asOf = AS_OF_YEAR): number | null {
  return m.birthYear === null ? null : asOf - m.birthYear
}

/** The Harald Quandt branch — comparator only, holds no BMW equity (Appendix A). */
export const COMPARATOR_BRANCH = {
  name: 'Harald Quandt branch',
  vehicle: 'HQ Trust / HQ Capital',
  descendants: [
    'Katarina Geller',
    'Gabriele Quandt',
    'Anette May-Thies',
    'Colleen-Bettina Rosenblat-Mo',
    'Patricia Halterman (1967–2005)',
  ],
  bmwEquity: 0,
  lesson:
    'Harald Quandt died in a plane crash in 1967, leaving five daughters and no plan; within two decades his branch had sold out of industry entirely. The branch had successors. It lacked process.',
}
