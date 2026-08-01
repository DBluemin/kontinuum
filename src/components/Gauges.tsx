import { useEffect, useState, type ReactNode } from 'react'
import { ClauseTag, Etch } from './primitives'

/**
 * The signature instrument: a linear gauge with a hard wall.
 *
 * The track is the BMW M tricolour, reversed so the scale runs danger → safe
 * left to right. That is branding doing analytical work: the stripe is also
 * the legend. Red is a breached threshold, violet is the advisory band, blue
 * is holding.
 */

export interface Wall {
  value: number
  label: string
}

export function LinearGauge({
  value,
  min,
  max,
  wall,
  advisoryWidth,
  label,
  clause,
  format,
  headroom,
  breached,
  tickStep,
}: {
  value: number
  min: number
  max: number
  wall: Wall
  /** Width of the violet advisory band above the wall, in value units. */
  advisoryWidth: number
  label: string
  clause?: string
  format: (v: number) => string
  headroom?: ReactNode
  breached?: boolean
  tickStep: number
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 620)
    return () => clearTimeout(t)
  }, [])

  const pos = (v: number) => ((v - min) / (max - min)) * 100
  const wallPos = pos(wall.value)
  const advisoryEnd = pos(wall.value + advisoryWidth)
  const valuePos = pos(Math.max(min, Math.min(max, value)))

  const ticks: number[] = []
  for (let v = min; v <= max + 1e-9; v += tickStep) ticks.push(Number(v.toFixed(6)))

  return (
    <div className="px-5 py-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Etch bright style={{ letterSpacing: '0.22em' }}>
            {label}
          </Etch>
          {clause && <ClauseTag id={clause} />}
        </div>
        {headroom && (
          <div className="text-[12.5px]" style={{ color: 'var(--color-ink-dim)' }}>
            {headroom}
          </div>
        )}
      </div>

      <div className="relative">
        {/* Scale numerals */}
        <div className="relative mb-1.5 h-3">
          {ticks.map((t) => (
            <span
              key={t}
              className="readout absolute -translate-x-1/2 text-[9.5px]"
              style={{ left: `${pos(t)}%`, color: 'var(--color-ink-mute)' }}
            >
              {format(t)}
            </span>
          ))}
        </div>

        {/* Track — M tricolour, reversed for a danger→safe scale */}
        <div className="relative h-[18px] w-full overflow-hidden bg-dial">
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${wallPos}%`, background: 'var(--color-m-red)' }}
          />
          <div
            className="absolute inset-y-0"
            style={{
              left: `${wallPos}%`,
              width: `${Math.max(0, advisoryEnd - wallPos)}%`,
              background: 'var(--color-m-violet)',
            }}
          />
          <div
            className="absolute inset-y-0"
            style={{
              left: `${advisoryEnd}%`,
              right: 0,
              background: 'var(--color-m-blue)',
            }}
          />

          {/* Minor graticule */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-y-0 w-px"
              style={{ left: `${pos(t)}%`, background: 'rgba(0,0,0,0.32)' }}
            />
          ))}
        </div>

        {/* The wall */}
        <div
          className="absolute -top-1 bottom-0 w-[2px]"
          style={{ left: `${wallPos}%`, background: 'var(--color-ink)' }}
        />
        <div
          className="absolute -translate-x-1/2 pt-1"
          style={{ left: `${wallPos}%`, top: '100%' }}
        >
          <div className="flex flex-col items-center">
            <span className="readout text-[10px]" style={{ color: 'var(--color-ink)' }}>
              {wall.label}
            </span>
          </div>
        </div>

        {/* Position marker */}
        <div
          className="absolute -translate-x-1/2"
          style={{
            left: ready ? `${valuePos}%` : `${pos(min)}%`,
            top: -2,
            transition: 'left 1300ms cubic-bezier(0.34,1.18,0.42,1)',
          }}
        >
          <svg width="14" height="9" viewBox="0 0 14 9" aria-hidden>
            <polygon
              points="7,9 0,0 14,0"
              fill={breached ? 'var(--color-m-red)' : 'var(--color-ink)'}
            />
          </svg>
        </div>
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{
            left: ready ? `${valuePos}%` : `${pos(min)}%`,
            top: -24,
            transition: 'left 1300ms cubic-bezier(0.34,1.18,0.42,1)',
          }}
        >
          <span
            className="readout text-[13px] font-medium"
            style={{ color: breached ? 'var(--color-m-red)' : 'var(--color-ink)' }}
          >
            {format(value)}
          </span>
        </div>
      </div>

      <div className="mt-7" />
    </div>
  )
}

/* ── Telltales ──────────────────────────────────────────────────────── */

export type TelltaleState = 'off' | 'advisory' | 'alarm'

/**
 * Automotive telltale. On load every lamp illuminates at once for a beat,
 * exactly as a car does on ignition, then extinguishes and only the live
 * warnings come back. One orchestrated moment; everything after it is still.
 */
export function Telltale({
  state,
  label,
  title,
  index = 0,
}: {
  state: TelltaleState
  label: string
  title?: string
  index?: number
}) {
  const tone =
    state === 'alarm'
      ? 'var(--color-m-red)'
      : state === 'advisory'
        ? 'var(--color-amber)'
        : 'var(--color-ink-mute)'

  const rest = state === 'off' ? 0.16 : 1

  return (
    <div
      className="flex items-center gap-1.5"
      title={title ?? label}
      style={{ ['--rest-opacity' as string]: rest }}
    >
      <span
        className="animate-lampcheck inline-block h-[7px] w-[7px] rounded-full"
        style={{ background: tone, animationDelay: `${index * 22}ms` }}
      />
      <span
        className="animate-lampcheck etch"
        style={{
          color: state === 'off' ? 'var(--color-ink-mute)' : tone,
          animationDelay: `${index * 22}ms`,
          fontSize: 9.5,
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** A small horizontal bar used inside tables, with the M scale for tone. */
export function MiniBar({
  value,
  tone = 'var(--color-m-blue)',
  width = 80,
}: {
  value: number
  tone?: string
  width?: number
}) {
  return (
    <span
      className="inline-block h-[3px] align-middle"
      style={{ width, background: 'var(--color-rule)' }}
    >
      <span
        className="block h-full"
        style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: tone }}
      />
    </span>
  )
}
