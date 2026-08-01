/* Diagnostic: is the unconstrained frontier actually dominating? */
import {
  constitutionalFloorWeight,
  covariance,
  efficientFrontier,
  expectedReturns,
  frontierReturnAt,
  portfolioVol,
  portfolioReturn,
  type Bounds,
} from '../src/engines/portfolio'
import { ASSET_CLASSES } from '../src/data/assumptions'
import { consolidate } from '../src/engines/consolidation'

const caps: Record<string, number> = { bmw: 1, geq: 1, poc: 0.4, fi: 1, pe: 0.25, ra: 0.25, cash: 0.2 }
const b: Bounds = {
  lower: ASSET_CLASSES.map(() => 0),
  upper: ASSET_CLASSES.map((a) => caps[a.id] ?? 1),
}

const cons = consolidate()
const mu = expectedReturns(false)
const cov = covariance(0)
const floor = constitutionalFloorWeight(cons.totalAssets)

const cb: Bounds = { lower: [...b.lower], upper: [...b.upper] }
cb.lower[0] = floor

const u = efficientFrontier(mu, cov, b)
const c = efficientFrontier(mu, cov, cb)

const curVol = portfolioVol(cons.weights, cov)
const curEr = portfolioReturn(cons.weights, mu)

console.log('floor weight        ', floor.toFixed(4))
console.log('current vol / er    ', curVol.toFixed(4), curEr.toFixed(4))
console.log('unconstrained points', u.length, 'vol range', u[0]?.vol.toFixed(4), '→', u[u.length - 1]?.vol.toFixed(4))
console.log('  er range          ', u[0]?.er.toFixed(4), '→', u[u.length - 1]?.er.toFixed(4))
console.log('constrained points  ', c.length, 'vol range', c[0]?.vol.toFixed(4), '→', c[c.length - 1]?.vol.toFixed(4))
console.log('  er range          ', c[0]?.er.toFixed(4), '→', c[c.length - 1]?.er.toFixed(4))
console.log()
console.log('at current vol: u =', frontierReturnAt(u, curVol)?.toFixed(4), ' c =', frontierReturnAt(c, curVol)?.toFixed(4))
console.log()
console.log('--- dominance check across the shared range ---')
const lo = Math.max(u[0].vol, c[0].vol)
const hi = Math.min(u[u.length - 1].vol, c[c.length - 1].vol)
console.log('shared vol range', lo.toFixed(4), '→', hi.toFixed(4))
let violations = 0
for (let i = 0; i <= 20; i++) {
  const v = lo + ((hi - lo) * i) / 20
  const ru = frontierReturnAt(u, v)!
  const rc = frontierReturnAt(c, v)!
  if (rc > ru + 1e-9) {
    violations++
    if (violations <= 5) console.log(`  VIOLATION vol=${v.toFixed(4)} u=${ru.toFixed(5)} c=${rc.toFixed(5)}`)
  }
}
console.log('violations:', violations, 'of 21')
console.log()
console.log('--- unconstrained tail ---')
for (const p of u.slice(-6)) {
  console.log('  vol', p.vol.toFixed(4), 'er', p.er.toFixed(5), 'w', p.weights.map((x) => x.toFixed(2)).join(' '))
}
console.log('--- constrained tail ---')
for (const p of c.slice(-6)) {
  console.log('  vol', p.vol.toFixed(4), 'er', p.er.toFixed(5), 'w', p.weights.map((x) => x.toFixed(2)).join(' '))
}
