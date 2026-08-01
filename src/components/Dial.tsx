import { useEffect, useState } from 'react'
import { ClauseTag } from './primitives'

/**
 * An instrument, not a stat tile.
 *
 * A needle encodes proximity to a limit better than a digit does — you read
 * "close to the redline" before you read the number. This platform is entirely
 * about proximity to limits, so the dial is the correct encoding rather than a
 * decorative one.
 *
 * House rules, to keep it 2026 and not 2008: flat fills, hairline strokes,
 * no gradients, no bevels, no glass, no drop shadows. Etched, not rendered.
 */

const SWEEP = 270 // degrees, from lower-left through 12 o'clock to lower-right
const START = -135 // degrees from 12 o'clock, negative is anticlockwise

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const p1 = polar(cx, cy, r, a1)
  const p2 = polar(cx, cy, r, a2)
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

export interface DialMarker {
  value: number
  label: string
  tone?: string
}

export interface DialProps {
  value: number
  min: number
  max: number
  label: string
  sublabel?: string
  format: (v: number) => string
  /** Values inside this range are in the red sector. */
  redline?: { from: number; to: number }
  /** Values inside this range are in the advisory sector. */
  advisory?: { from: number; to: number }
  markers?: DialMarker[]
  size?: number
  clause?: string
  /** Colour of the needle and readout. */
  tone?: string
  /** Delay before the needle sweeps, for the load sequence. */
  delay?: number
  /** Number of numbered major ticks. Pick a count that divides the range cleanly. */
  majors?: number
}

export function Dial({
  value,
  min,
  max,
  label,
  sublabel,
  format,
  redline,
  advisory,
  markers = [],
  size = 260,
  clause,
  tone = 'var(--color-signal)',
  delay = 0,
  majors = 6,
}: DialProps) {
  const [swept, setSwept] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSwept(true), 420 + delay)
    return () => clearTimeout(t)
  }, [delay])

  // Zone bands sit on the outer ring; ticks, numerals and the needle sit inside
  // it. Nothing is drawn over the limit sector — reading the limit is the whole
  // job of the instrument.
  const cx = 100
  const cy = 100
  const rArc = 88
  const rTickOuter = 79
  const rTickInner = 69
  const rMinorInner = 74
  const rLabel = 59
  const needleLen = 62

  const toAngle = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
    return START + t * SWEEP
  }

  const clamped = Math.max(min, Math.min(max, value))
  const angle = toAngle(clamped)

  const segments = Math.max(1, majors - 1)
  const ticks: { deg: number; major: boolean; v: number }[] = []
  for (let i = 0; i <= segments * 4; i++) {
    const t = i / (segments * 4)
    ticks.push({ deg: START + t * SWEEP, major: i % 4 === 0, v: min + t * (max - min) })
  }

  const inRed =
    redline && clamped >= Math.min(redline.from, redline.to) && clamped <= Math.max(redline.from, redline.to)
  const inAmber =
    advisory && clamped >= Math.min(advisory.from, advisory.to) && clamped <= Math.max(advisory.from, advisory.to)
  const activeTone = inRed ? 'var(--color-m-red)' : inAmber ? 'var(--color-amber)' : tone

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`${label}: ${format(value)}`}
        className="overflow-visible"
      >
        {/* Instrument face — sits *into* the panel */}
        <circle cx={cx} cy={cy} r={94} fill="var(--color-dial)" />
        <circle cx={cx} cy={cy} r={94} fill="none" stroke="var(--color-rule)" strokeWidth={1} />

        {/* Scale track */}
        <path
          d={arcPath(cx, cy, rArc, START, START + SWEEP)}
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth={1.5}
        />

        {/* Advisory sector */}
        {advisory && (
          <path
            d={arcPath(cx, cy, rArc, toAngle(advisory.from), toAngle(advisory.to))}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={4}
            opacity={0.8}
          />
        )}

        {/* Redline sector — the limit, drawn as a limit and never painted over */}
        {redline && (
          <path
            d={arcPath(cx, cy, rArc, toAngle(redline.from), toAngle(redline.to))}
            fill="none"
            stroke="var(--color-m-red)"
            strokeWidth={4}
          />
        )}

        {/* Ticks */}
        {ticks.map((t, i) => {
          const a = polar(cx, cy, t.major ? rTickOuter : rTickOuter, t.deg)
          const b = polar(cx, cy, t.major ? rTickInner : rMinorInner, t.deg)
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={t.major ? 'var(--color-ink-dim)' : 'var(--color-ink-mute)'}
              strokeWidth={t.major ? 1.4 : 0.7}
              opacity={t.major ? 0.9 : 0.5}
            />
          )
        })}

        {/* Numerals on major ticks */}
        {ticks
          .filter((t) => t.major)
          .map((t, i) => {
            const p = polar(cx, cy, rLabel, t.deg)
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--color-ink-mute)"
                fontSize={7.5}
                fontFamily="var(--font-mono)"
              >
                {Math.abs(t.v) >= 1000 ? `${Math.round(t.v / 1000)}k` : Math.round(t.v * 10) / 10}
              </text>
            )
          })}

        {/* Named thresholds */}
        {markers.map((m, i) => {
          const deg = toAngle(m.value)
          const a = polar(cx, cy, 92, deg)
          const b = polar(cx, cy, 79, deg)
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={m.tone ?? 'var(--color-bone)'}
                strokeWidth={1.6}
              />
            </g>
          )
        })}

        {/* Needle */}
        <g
          className="needle-sweep"
          style={{
            transform: `rotate(${swept ? angle : START}deg)`,
            transformOrigin: '100px 100px',
          }}
        >
          <polygon
            points={`${cx - 2.6},${cy + 8} ${cx + 2.6},${cy + 8} ${cx + 0.9},${cy - needleLen} ${cx - 0.9},${cy - needleLen}`}
            fill={activeTone}
          />
          <circle cx={cx} cy={cy} r={7} fill="var(--color-dial)" stroke={activeTone} strokeWidth={1.4} />
          <circle cx={cx} cy={cy} r={2} fill={activeTone} />
        </g>

        {/* Readout — seated in the open sector at the bottom of the sweep */}
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          fill={activeTone}
          fontSize={18}
          fontFamily="var(--font-mono)"
          fontWeight={500}
          style={{ letterSpacing: '-0.04em' }}
        >
          {format(value)}
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-1.5">
          <span
            className="etch etch-hi"
            style={{ fontSize: 10.5, letterSpacing: '0.2em' }}
          >
            {label}
          </span>
          {clause && <ClauseTag id={clause} />}
        </div>
        {sublabel && (
          <span className="text-[11.5px]" style={{ color: 'var(--color-ink-mute)' }}>
            {sublabel}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
