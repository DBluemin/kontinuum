/**
 * Capital under management, by entity and by asset class.
 *
 * The entity layer mirrors the structure discussed in class: a holding company
 * above the verticals, dividends flowing operating company → holding →
 * subsidiary, with the Continuity Reserve (E5.2) held at holding-company level
 * so it is never a personal distribution.
 */

import { MARKET } from './assumptions'

export type EntityKind = 'listed' | 'holding' | 'operating' | 'reserve' | 'managed' | 'trust'

export interface Entity {
  id: string
  name: string
  kind: EntityKind
  branch: 'Stefan' | 'Susanne' | 'Joint'
  jurisdiction: string
  /** Beneficial owners, by member id → share of the entity. */
  owners: Record<string, number>
  /** Book value in EUR. BMW is marked to market from MARKET.bmwSharePrice. */
  value: number | 'mark-to-market'
  /** Allocation of this entity's value across ASSET_CLASSES ids. */
  allocation: Record<string, number>
  note?: string
}

export const ENTITIES: Entity[] = [
  {
    id: 'bmw-stefan',
    name: 'BMW AG — Stefan Quandt holding',
    kind: 'listed',
    branch: 'Stefan',
    jurisdiction: 'Germany',
    owners: { stefan: 1 },
    value: 'mark-to-market',
    allocation: { bmw: 1 },
    note: '155,500,000 ordinary shares. Carries the Sperrminorität.',
  },
  {
    id: 'bmw-susanne',
    name: 'BMW AG — Susanne Klatten holding',
    kind: 'listed',
    branch: 'Susanne',
    jurisdiction: 'Germany',
    owners: { susanne: 1 },
    value: 'mark-to-market',
    allocation: { bmw: 1 },
    note: '126,200,000 ordinary shares. Retained personally on the July 2024 SKion transfer.',
  },
  {
    id: 'skion',
    name: 'SKion GmbH → Altana AG',
    kind: 'holding',
    branch: 'Susanne',
    jurisdiction: 'Germany',
    owners: { felix: 1 / 3, alexander: 1 / 3, johanna: 1 / 3 },
    value: 5_800_000_000,
    allocation: { poc: 0.86, geq: 0.06, cash: 0.08 },
    note: 'Transferred one third each to the three Klatten children, July 2024. Susanne retains management appointment rights until 2031.',
  },
  {
    id: 'delton',
    name: 'Delton AG',
    kind: 'holding',
    branch: 'Stefan',
    jurisdiction: 'Germany',
    owners: { stefan: 1 },
    value: 2_100_000_000,
    allocation: { poc: 0.72, pe: 0.18, cash: 0.1 },
  },
  {
    id: 'reserve',
    name: 'Continuity Reserve',
    kind: 'reserve',
    branch: 'Joint',
    jurisdiction: 'Germany',
    owners: { stefan: 0.552, susanne: 0.448 },
    value: 1_400_000_000,
    allocation: { fi: 0.52, geq: 0.18, cash: 0.3 },
    note: 'E5.2 — held at holding-company level. May not be distributed to members (E5.5).',
  },
  {
    id: 'securities',
    name: 'Diversified securities mandate',
    kind: 'managed',
    branch: 'Joint',
    jurisdiction: 'Germany / Luxembourg',
    owners: { stefan: 0.552, susanne: 0.448 },
    value: 1_800_000_000,
    allocation: { geq: 0.58, fi: 0.3, cash: 0.12 },
  },
  {
    id: 'realassets',
    name: 'Real assets & property',
    kind: 'operating',
    branch: 'Joint',
    jurisdiction: 'Germany / Austria',
    owners: { stefan: 0.5, susanne: 0.5 },
    value: 800_000_000,
    allocation: { ra: 1 },
  },
  {
    id: 'coinvest',
    name: 'Private equity & co-investment',
    kind: 'managed',
    branch: 'Joint',
    jurisdiction: 'Luxembourg',
    owners: { stefan: 0.552, susanne: 0.448 },
    value: 400_000_000,
    allocation: { pe: 1 },
  },
  {
    id: 'operating-cash',
    name: 'Family office operating cash',
    kind: 'reserve',
    branch: 'Joint',
    jurisdiction: 'Germany',
    owners: { stefan: 0.5, susanne: 0.5 },
    value: 200_000_000,
    allocation: { cash: 1 },
  },
]

export function entityValue(e: Entity, sharePrice = MARKET.bmwSharePrice.value): number {
  if (e.value !== 'mark-to-market') return e.value
  if (e.id === 'bmw-stefan') return 155_500_000 * sharePrice
  if (e.id === 'bmw-susanne') return 126_200_000 * sharePrice
  return 0
}

/* ── Liabilities ─────────────────────────────────────────────────────── */

export interface Liability {
  id: string
  label: string
  value: number
  kind: 'debt' | 'commitment' | 'contingent'
  clause?: string
  note?: string
}

export const LIABILITIES: Liability[] = [
  {
    id: 'holdco-debt',
    label: 'Holding-company facilities',
    value: 620_000_000,
    kind: 'debt',
    note: 'Base rate plus margin, drawn against the diversified sleeves rather than BMW stock.',
  },
  {
    id: 'memorial',
    label: 'Memorial and restitution commitment',
    value: 0, // capitalised at runtime — a perpetuity on pooled dividend income
    kind: 'commitment',
    clause: 'Art.9',
    note: '0.5% of pooled dividend income in perpetuity, terminable only by unanimous vote. Modelled as a permanent claim on cash flow, not a discretionary grant.',
  },
  {
    id: 'succession-tax',
    label: 'Projected succession tax on next tranche',
    value: 0, // computed by the estate engine
    kind: 'contingent',
    clause: 'Art.7',
  },
  {
    id: 'pe-undrawn',
    label: 'Undrawn private-market commitments',
    value: 340_000_000,
    kind: 'commitment',
  },
]

/* ── Multi-family office book (MFO mode) ─────────────────────────────── */

export const MFO_CLIENTS = [
  {
    id: 'quandt',
    name: 'Quandt line — Herbert branch',
    aum: 0, // computed
    mandate: 'Single-family office. Concentrated control position under a pooling agreement.',
    constitution: 'Two Inheritances (2026)',
    primary: true,
  },
  {
    id: 'hq',
    name: 'Harald Quandt branch',
    aum: 6_200_000_000,
    mandate: 'Multi-family office. Post-exit liquidity, no operating control position.',
    constitution: 'HQ Trust partnership terms',
    primary: false,
    note: 'The comparator: a branch that exited industry and now manages proceeds rather than control. Different constitution, different constraint set, same platform.',
  },
]
