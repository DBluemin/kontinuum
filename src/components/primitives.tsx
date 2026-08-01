import type { CSSProperties, ReactNode } from 'react'
import { useClause } from './ClauseContext'

/* ── Formatting ─────────────────────────────────────────────────────── */

/** Continental convention: the symbol trails the amount, joined by a
    non-breaking space so it never wraps away from its figure. */
export const fmtEur = (v: number, dp = 2): string => {
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${(v / 1e9).toFixed(dp)}bn €`
  if (abs >= 1e6) return `${(v / 1e6).toFixed(dp === 2 ? 1 : dp)}m €`
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}k €`
  return `${v.toFixed(0)} €`
}

export const fmtPct = (v: number, dp = 1): string => `${(v * 100).toFixed(dp)}%`
export const fmtPp = (v: number, dp = 2): string => `${v >= 0 ? '+' : ''}${v.toFixed(dp)}pp`
export const fmtShares = (v: number): string => {
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}m`
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}k`
  return v.toFixed(0)
}
export const fmtNum = (v: number): string => v.toLocaleString('en-GB')

/* ── Text ───────────────────────────────────────────────────────────── */

export function Etch({
  children,
  className = '',
  bright = false,
  style,
}: {
  children: ReactNode
  className?: string
  bright?: boolean
  style?: CSSProperties
}) {
  return (
    <div className={`etch ${bright ? 'etch-hi' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

/**
 * The clause tag. A scrap of the archive pinned to an instrument.
 * Every figure in the platform that a clause governs carries one.
 */
export function ClauseTag({ id, className = '' }: { id: string; className?: string }) {
  const { open } = useClause()
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        open(id)
      }}
      title={`Open ${id} in the constitution`}
      className={`readout inline-flex shrink-0 items-center border px-1.5 py-[1px] align-middle text-[9.5px] leading-[1.35] tracking-tight transition-colors ${className}`}
      style={{
        borderColor: 'color-mix(in srgb, var(--color-bone) 28%, transparent)',
        color: 'var(--color-bone)',
        backgroundColor: 'color-mix(in srgb, var(--color-bone) 7%, transparent)',
      }}
    >
      §{id}
    </button>
  )
}

export function Panel({
  children,
  className = '',
  title,
  clause,
  right,
}: {
  children: ReactNode
  className?: string
  title?: string
  clause?: string
  right?: ReactNode
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
          <div className="flex items-center gap-2">
            {title && <Etch bright>{title}</Etch>}
            {clause && <ClauseTag id={clause} />}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

/** Data provenance. Nothing invented is allowed to look like a fact. */
export type ProvenanceKind =
  | 'paper'
  | 'published'
  | 'assumption'
  | 'undisclosed'
  | 'sourced'
  | 'estimated'

export function Provenance({ kind }: { kind: ProvenanceKind }) {
  const map = {
    paper: { label: 'Cited', color: 'var(--color-m-blue)' },
    sourced: { label: 'Cited', color: 'var(--color-m-blue)' },
    published: { label: 'Published', color: 'var(--color-ink-mute)' },
    assumption: { label: 'Assumption', color: 'var(--color-amber)' },
    estimated: { label: 'Estimated', color: 'var(--color-amber)' },
    undisclosed: { label: 'Not disclosed', color: 'var(--color-m-red)' },
  }[kind]
  return (
    <span
      className="readout inline-block text-[9px] uppercase tracking-[0.12em]"
      style={{ color: map.color }}
    >
      {map.label}
    </span>
  )
}

/* ── Tables ─────────────────────────────────────────────────────────── */

export function Row({
  label,
  value,
  clause,
  emphasis = false,
  tone,
  sub,
}: {
  label: ReactNode
  value: ReactNode
  clause?: string
  emphasis?: boolean
  tone?: string
  sub?: ReactNode
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-rule px-4 py-2.5 ${
        emphasis ? 'bg-panel-hi' : ''
      }`}
    >
      <div className="min-w-0">
        <div
          className="text-[13px] leading-snug"
          style={{ color: emphasis ? 'var(--color-ink)' : 'var(--color-ink-dim)' }}
        >
          {label}
          {clause && <ClauseTag id={clause} className="ml-2" />}
        </div>
        {sub && (
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
            {sub}
          </div>
        )}
      </div>
      <div
        className={`readout shrink-0 text-right ${emphasis ? 'text-[15px] font-medium' : 'text-[13.5px]'}`}
        style={{ color: tone ?? 'var(--color-ink)' }}
      >
        {value}
      </div>
    </div>
  )
}

export function Bar({
  value,
  tone = 'var(--color-m-blue)',
  track = 'var(--color-rule)',
  height = 4,
}: {
  value: number
  tone?: string
  track?: string
  height?: number
}) {
  return (
    <div style={{ background: track, height }} className="w-full overflow-hidden">
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          background: tone,
          height: '100%',
        }}
      />
    </div>
  )
}

/** A framed statement — used where a number needs a sentence, not a label. */
export function Finding({
  children,
  tone = 'var(--color-m-blue)',
  label = 'Finding',
}: {
  children: ReactNode
  tone?: string
  label?: string
}) {
  return (
    <div className="border-l-2 py-1 pl-4" style={{ borderColor: tone }}>
      <Etch className="mb-1">{label}</Etch>
      <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--color-ink)' }}>
        {children}
      </p>
    </div>
  )
}
