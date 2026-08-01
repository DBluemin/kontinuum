/**
 * Number formatting, German convention throughout (DIN 5008):
 * decimal comma, thousands point, and the euro symbol trailing the amount
 * behind a non-breaking space.
 *
 * `dec` is the single place a displayed figure becomes text. SVG coordinates
 * deliberately keep JavaScript's own `toFixed`, because a decimal comma inside
 * a points list splits one coordinate pair into two and destroys the geometry.
 *
 * This lives outside components so the calculation engines can format their
 * own narrative strings without importing anything from the view layer.
 */

export const dec = (v: number, dp = 2): string =>
  v.toLocaleString('de-DE', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const fmtEur = (v: number, dp = 2): string => {
  const abs = Math.abs(v)
  // Above a thousand billion the German thousands point collides with the
  // English magnitude suffix: "1.043bn" reads as 1.043 billion to anyone
  // expecting a decimal point. Switch to trillions before that can happen.
  if (abs >= 1e12) return `${dec(v / 1e12, dp)}tn €`
  if (abs >= 1e9) return `${dec(v / 1e9, dp)}bn €`
  if (abs >= 1e6) return `${dec(v / 1e6, dp === 2 ? 1 : dp)}m €`
  if (abs >= 1e3) return `${dec(v / 1e3, 0)}k €`
  return `${dec(v, 0)} €`
}

export const fmtPct = (v: number, dp = 1): string => `${dec(v * 100, dp)}%`

export const fmtPp = (v: number, dp = 2): string => `${v >= 0 ? '+' : ''}${dec(v, dp)}pp`

export const fmtShares = (v: number): string => {
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${dec(v / 1e6, 2)}m`
  if (abs >= 1e3) return `${dec(v / 1e3, 0)}k`
  return dec(v, 0)
}

export const fmtNum = (v: number): string => v.toLocaleString('de-DE')
