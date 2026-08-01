# KONTINUUM

A constitution-driven family office platform for the Quandt line and the ownership of BMW AG.

Built for ENT-0301 (Hult International Business School) as the Assignment 2 deliverable. The
anchor case is the author's own Assignment 1: *Two Inheritances — A Family Constitution Playbook
for the Quandt Family and the Ownership of BMW AG*.

## The premise

Family-office software models wealth as a sum of holdings. For a family whose position is a
controlling stake in a listed company, that is the wrong model. Appendix B of the underlying
constitution records the family's holding moving from 46.8% → 50.2% → 45.7% between 2018 and 2026
**without a single share changing hands**. Buybacks retired the denominator; a preferred-share
conversion restored it.

So this platform models control as a residual of someone else's capital decisions, and treats the
constitution as executable configuration rather than documentation.

## What makes it different

Every figure in the interface carries a clause tag (`§E5.3`, `§App.B`). Clicking it opens the
verbatim constitutional text plus every other module that clause drives. Traceability from
constitution to tool is a property of the software, not a claim in a report.

## Modules

| Module | Covers |
|---|---|
| **Bridge** | Instrument binnacle: pooled control, drift, reserve coverage, the *Sperrminorität* gauge |
| **Constitution** | Clause library + Appendix D as an executable decision resolver |
| **Ownership** | Cap table and dilution laboratory; takeover threshold ladder |
| **Succession** | Dual English/German estate engine, tranche schedule, liquidity-at-death |
| **Portfolio** | Constrained vs unconstrained frontiers, risk metrics, values screen |
| **Financials** | Consolidated books, AUM, returns, use of capital, Monte Carlo projection |
| **Operations** | Governance calendar, decision log, compliance register, MFO mode |
| **Evidence & report** | AI tools list, full prompt log, 1,000-word showcase report |

## Three findings the encoding produced

1. **The constitution monitors the wrong threshold.** Article 3 requires a quarterly test of the
   27% pool floor. The floor sits ~69× further from breach than Stefan Quandt's individual 25%
   blocking minority — a quarterly floor test would have reported "no action required" throughout
   the June 2026 conversion.
2. **The pool is asymmetric, not deadlocked.** At 55/45 one holder carries every simple-majority
   decision alone while the other holds only a veto.
3. **Continuity is cheap; inertia is not.** The floor costs ~5bp a year at current risk. The
   excess BMW holding *above* the floor costs ~139bp — roughly €497m a year.

## Data provenance

Nothing invented is presented as fact. Three states are surfaced throughout the interface:

- **Cited** — appears in the Assignment 1 constitution with a source
- **Published** — company or statutory figure, to verify at source
- **Assumption** — a modelling input chosen for this platform

Share counts, conversion sizes and governance thresholds are cited. Share price, capital-market
assumptions, private holding-company valuations and the distribution base are assumptions. Two of
the five G5 members are not publicly documented; the platform reports that gap rather than
inventing ages to fill it.

## Running it

```bash
npm install
npm run dev
```

## Verification

`scripts/check-frontier.ts` verifies that the constrained efficient frontier never dominates the
unconstrained one — the property that exposed two optimiser defects during development.

```bash
npx tsx scripts/check-frontier.ts
```

## Caveat

The Quandt family publishes no constitution, family council or pooling agreement. Every governance
instrument modelled here is a **design, not a description**.
