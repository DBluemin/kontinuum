/**
 * Responsible-AI evidence pack.
 *
 * The brief requires a list of tools, a full prompt log, and a justification
 * per prompt covering why it was chosen, what it produced and how it was
 * iterated. This file is the record. It is deliberately honest about the
 * prompts that produced poor output and had to be corrected, because a log
 * that shows only successful prompts evidences nothing.
 */

export interface Tool {
  name: string
  vendor: string
  role: string
  verification: string
}

export const TOOLS: Tool[] = [
  {
    name: 'Claude Opus 5 (Claude Code)',
    vendor: 'Anthropic',
    role: 'Design direction, TypeScript implementation of the calculation engines, React interface, and drafting of this evidence pack.',
    verification:
      'Every governance parameter was checked line by line against the Assignment 1 constitution. Every share count was reconciled arithmetically: 155,5m + 126,2m = 281,7m reproduces 25,83% / 20,9% at the February 2018 denominator and 27,7% / 22,4% at June 2025, which is the test that the model matches the paper rather than the prompt.',
  },
  {
    name: 'Vite + React + TypeScript',
    vendor: 'Open source',
    role: 'Build toolchain and interface framework.',
    verification: 'TypeScript compilation in strict mode; no runtime type assertions in the engines.',
  },
  {
    name: 'Tailwind CSS v4',
    vendor: 'Open source',
    role: 'Design tokens and layout. The palette and type scale are declared once in a theme block and consumed everywhere.',
    verification: 'Contrast checked against the dark ground; every text element sets its own colour rather than inheriting.',
  },
  {
    name: 'Archivo / IBM Plex Mono / Source Serif 4',
    vendor: 'Open source typefaces',
    role: 'Instrument labelling, tabular numeric readouts, and the archive layer respectively.',
    verification: 'Self-hosted through Fontsource so the platform renders identically offline and on a marker\'s machine.',
  },
]

export interface PromptEntry {
  n: number
  author: 'Author' | 'Author (correction)' | 'Author (extension)'
  prompt: string
  why: string
  produced: string
  iteration: string
}

export const PROMPT_LOG: PromptEntry[] = [
  {
    n: 1,
    author: 'Author',
    prompt:
      'Build a wealth management platform supporting a single-family office, covering the six mandated pillars, based on the attached assignment brief and my class notes on holding structures, dividend policy, the Blackstone/Hilton case, the three capitals framework, IHT thresholds and trust structures.',
    why: 'The opening prompt deliberately supplied the full brief and the raw class notes rather than a summary. Summarising first would have let the model infer generic family-office features; supplying the source material meant the platform had to be built against the actual assessment criteria and the specific concepts taught, including ones a generic tool would omit — the 50/50 deadlock problem, the takeover threshold ladder, and inter-company dividend treatment.',
    produced:
      'A proposed seven-module architecture and, critically, a question the author had not anticipated: which family constitution the platform should encode.',
    iteration:
      'The model located "Two Inheritances", the author\'s own Assignment 1 on the Quandt family and BMW, in the local file system and read it in full rather than asking the author to summarise it. This mattered: the paper\'s appendices contain quantified rules — a 27% pool floor, a decision matrix with four distinct voting thresholds, a distribution waterfall, a buy-sell formula — that a summary would have flattened into prose.',
  },
  {
    n: 2,
    author: 'Author',
    prompt:
      'Four structured decisions: confirm Quandt/BMW as the anchor case; resolve English law (mandated) against German law (where the case sits); choose SFO or MFO; choose the delivery format.',
    why: 'These four choices change the work materially and none of them can be inferred from the brief. Asking them as explicit multiple-choice decisions with a stated recommendation forced the trade-offs into the open rather than letting a default be adopted silently. The jurisdiction question in particular is a genuine conflict between the brief and the case, and resolving it by assumption would have been an academic error.',
    produced:
      'A dual-jurisdiction estate engine computing every transfer under both regimes side by side, rather than either ignoring the mandate or misrepresenting the case.',
    iteration:
      'The dual approach turned a compliance problem into an analytical finding: the two systems fail in completely different places, and the comparison is now the most substantive part of the succession module.',
  },
  {
    n: 3,
    author: 'Author',
    prompt: 'Invoke the frontend-design process for the visual identity.',
    why: 'A family-office dashboard has a strong default look — dark background, one bright accent, four equal stat cards — that signals a template rather than a design. Invoking an explicit design process forced a palette and typographic system derived from the subject rather than from convention.',
    produced:
      'The instrument-binnacle direction: analogue dials rather than stat tiles, on the argument that a needle encodes proximity to a limit better than a digit, and this platform is entirely about proximity to limits. Ground colour taken from the Pritzwalk cloth-mill indigo where the fortune began; the constitution rendered as a separate paper material.',
    iteration:
      'The first build painted a blue progress arc at the same radius as the red limit sector, so the value indicator covered the limit — destroying the one thing the instrument existed to show. The arc was removed entirely: real tachometers use a coloured zone band for the limit and a needle for the value, and nothing else.',
  },
  {
    n: 4,
    author: 'Author (extension)',
    prompt:
      'Include BMW branding, Quandt holding colours, and make it read like a speed dashboard — a cockpit — while staying clean.',
    why: 'A late instruction that risked pushing the design into pastiche. The useful question was whether BMW\'s visual language could carry meaning rather than decoration.',
    produced:
      'The M tricolour used as a semantic risk scale — light blue holding, violet advisory, red breach — so the stripe on the Sperrminorität gauge is simultaneously the branding and the legend. The "speed" requirement was satisfied by making the left dial a genuine speedometer of control drift in basis points per quarter, a real quantity the paper documents at roughly −111 bp per quarter since the June 2026 conversion.',
    iteration:
      'The alternative — decorative speed lines or a fake velocity readout — was rejected because it would have added an instrument that measured nothing. Every dial on the Bridge reads a quantity the constitution names.',
  },
  {
    n: 5,
    author: 'Author (correction)',
    prompt:
      'Encode Appendix D as an executable matrix and resolve any proposed decision against the live cap table, reporting who can pass it alone and who can block it alone.',
    why: 'Pillar 2 requires traceability from constitution to tool. A static table of voting thresholds would satisfy that requirement only nominally. Making the thresholds executable tests whether the constitution actually does what it claims.',
    produced:
      'A finding neither the paper nor the prompt anticipated: at 55/45 of the pool, one holder carries every simple-majority decision alone while the other holds a veto over everything requiring 75%. Class discussion had framed the danger as a 50/50 deadlock; the arithmetic here produces a different pathology.',
    iteration:
      'The first implementation reported only pass or fail. It was extended to compute solo passers, solo blockers and minimal winning coalitions, because "does it carry" is a less useful question for an Owners\' Council than "who decides".',
  },
  {
    n: 6,
    author: 'Author',
    prompt:
      'Run the portfolio optimiser twice — once unconstrained, once with the constitutional floor as a hard lower bound on the BMW weight — and report the gap.',
    why: 'The standard portfolio-theory answer to a two-thirds single-stock concentration is to diversify, which the constitution forbids. Running both frontiers quantifies the cost of the prohibition instead of arguing about it, which is what the brief means by portfolio maximisation against stated constraints.',
    produced:
      'Initially, a result that was impossible: the constrained frontier appeared to beat the unconstrained one. Because the constrained feasible set is a strict subset, that could not be true, and the contradiction exposed two separate defects.',
    iteration:
      'The first defect was comparison by nearest sampled point, which matched portfolios at different volatilities; it was replaced with interpolation at an identical volatility. The second was the optimiser itself — an active-set method that clamped variables to their bounds but never released them, truncating the unconstrained frontier at 8,36 per cent when the true maximum is 8,85 per cent. It was replaced with projected gradient ascent, which cannot stall at a vertex, and verified by checking dominance at forty-one points along the shared range. The corrected result reframed the finding: the floor costs about five basis points at the family\'s current risk level, while the excess holding above the floor costs 139, and the floor\'s real effect is to raise the minimum reachable volatility from 4,3 to 11,2 per cent. The original framing — that continuity is expensive — was wrong, and only the arithmetic showed it.',
  },
  {
    n: 7,
    author: 'Author (correction)',
    prompt:
      'Test the 27% pool floor and the 25% blocking minority separately and report which binds first.',
    why: 'The constitution instructs the Owners\' Council to test the pool floor quarterly. Encoding it revealed the instruction may be misdirected, which is exactly the kind of error a tool can find and a document cannot.',
    produced:
      'The floor sits roughly sixty-nine times further from being breached than the blocking quarter does. A quarterly floor test would have reported no action required throughout the June 2026 conversion, while the veto the family relies on lost about 2,4 percentage points.',
    iteration:
      'This finding was promoted from a footnote to the headline advisory on the Bridge, and drove the decision to make the Sperrminorität gauge the platform\'s signature instrument rather than the pooled-control dial.',
  },
  {
    n: 8,
    author: 'Author',
    prompt:
      'Attach provenance to every figure and distinguish cited, published and assumed values throughout.',
    why: 'The single greatest risk in an AI-assisted financial model is invented precision — a plausible number with no source, rendered in the same typeface as a sourced one. Making provenance a first-class property of the data model prevents the interface from laundering assumptions into facts.',
    produced:
      'Three provenance states surfaced in the interface, and explicit placeholders where data does not exist: two of the five G5 members are not publicly documented, so the platform reports that the succession model runs on placeholders instead of quietly inventing ages.',
    iteration:
      'An earlier draft assigned estimated birth years to the undocumented heirs without flagging them. This was corrected: the gap is a governance finding the Owners\' Council should close, and hiding it would have been the more serious error.',
  },
]

export const REPORT_TITLE = 'KONTINUUM: a constitution-driven family office platform'
