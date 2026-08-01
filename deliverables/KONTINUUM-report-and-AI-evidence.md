# KONTINUUM: a constitution-driven family office platform

*Showcase report · MGT-5603 · anchor case: the Quandt line and the ownership of BMW AG*

Platform: https://dbluemin.github.io/kontinuum/

Source: https://github.com/DBluemin/kontinuum

---

## Showcase report (1020 words)

### The premise

Most family-office software models wealth as a sum of holdings. That model breaks when the family's position is a controlling stake in a listed company. Appendix B of the underlying constitution records the Quandt line's holding in BMW AG moving from 46.8 per cent to 50.2 per cent and back to 45.7 per cent between 2018 and 2026, with no share ever changing hands. Buybacks retired the denominator; the June 2026 preferred-share conversion restored it. Article 3 draws the conclusion. Family control is a residual: whatever survives the company's own capital decisions. KONTINUUM is built on that.

### What the platform is

KONTINUUM is a functional prototype of a single-family office operating system for the Herbert Quandt line, with a multi-family mode that adds the Harald Quandt branch as a second book. Seven modules run over one data model and a set of pure calculation engines.

What distinguishes it is where the constitution sits. It is the configuration file. Every article and appendix from the Assignment 1 playbook is encoded as a structured clause carrying its verbatim text and its machine-readable parameters together. Every figure in the interface carries a clause tag; clicking one opens the governing text and lists the other modules that clause drives. The traceability the brief asks for is therefore something a marker can click on.

### How it is used

The Bridge is the daily view: an instrument binnacle reporting four vital signs. A central dial shows pooled control against the 27 per cent floor. A speedometer to its left reads the rate at which control is eroding, currently about 111 basis points per quarter. A gauge to its right reports how many years of base distribution the Continuity Reserve can fund. Beneath them runs the platform's signature instrument, a linear gauge showing Stefan Quandt's blocking minority against a hard wall at 25 per cent. Headroom is read out in shares. An Owners' Council can act on 1.55 million shares; 0.25 percentage points tends to get filed and forgotten.

The Constitution module makes Appendix D executable. A member picks a decision from the matrix (sell pooled shares, change the distribution base, admit the fifth generation to equity), and the platform resolves the required threshold against the live cap table. It reports whether the decision carries, who can carry it alone, and who can defeat it alone. A toggle admits the fifth generation to equity and re-runs the arithmetic, so the Council sees the cousin-consortium transition coming before it signs.

Ownership contains a dilution laboratory that replays the 2018 to 2026 record as validation and then runs forward. Succession computes every transfer under English and German law simultaneously and tests whether the resulting bill can be paid without selling shares. Portfolio runs the optimiser twice, unconstrained and constitution-constrained. Financials consolidates the books and projects fifty years of the distribution waterfall under stochastic dividends. Operations runs the office: calendar, decision log, compliance register, conflict ladder.

### What the encoding found

Three findings emerged from making the rules executable that the document itself does not contain.

First, the constitution monitors the wrong threshold. Article 3 instructs the Owners’ Council to test the 27 per cent pool floor quarterly. Encoding both constraints shows the floor sits roughly sixty-nine times further from breach than Stefan Quandt’s individual blocking quarter. A quarterly floor test would have reported no action required throughout the June 2026 conversion, while the veto the family actually relies on lost 2.4 percentage points.

Second, the pool is asymmetric. At 55/45 one holder carries every simple-majority decision alone and the other can only refuse. Class discussion had framed the risk as a 50/50 paralysis; this is a different failure, and Article 10 is what contains it, since amendment must clear the pool by share and the Assembly by head.

Third, and most usefully, the expensive constraint turns out to be something else. The floor implies a minimum BMW weight of about 38 per cent of consolidated wealth; the family holds around 65 per cent. Running the optimiser twice shows the floor costs roughly five basis points a year at the family’s current risk level, while the excess holding above the floor costs about 139. That is some €497 million a year available without selling a single share the constitution protects. The floor does bite hard in one place. It sets a risk floor as well as an ownership one: the lowest volatility reachable while honouring it is 11.2 per cent, against 4.3 per cent if the stake could be sold freely.

### Benefits and intended outcomes

For the Owners' Council the platform converts governance from a document consulted after a dispute into a constraint tested before a decision. For the fifth generation it makes an abstract inheritance legible: the compliance register shows which of the seven required artifacts each member owes, and the projection shows what the base distribution is worth per claimant in real terms once the number of claimants multiplies. For the family office itself it supplies the reporting a stewardship mandate needs, meaning capital under management by class and by entity, returns gross and after tax, and a total cost of ownership stated in basis points.

The intended outcome is a narrow one. No threshold should be crossed without someone having seen it coming.

### Limitations

The platform models a constitution that does not exist. The Quandt family publishes no pooling agreement, council or constitution, and the paper is explicit that every instrument proposed in it is a design, not a description. That caveat carries straight through to the software. Share counts, conversion sizes and governance thresholds come from the paper and its cited sources; the share price, capital-market assumptions, private holding-company valuations and the distribution base are modelling inputs, marked as such throughout the interface.

Two of the five fifth-generation members are not publicly documented, so their tranche schedule cannot be computed. The platform says so on screen instead of filling the gap with invented ages. A family constitution also has no binding force in German law until it is transcribed into the articles of association, the pooling agreement and individual wills. Where those contradict, a court reads the will. That is why the will-consistency register exists, and why it is treated as the enforcement layer.

---

Built on Blümin, D. (2026) “Two Inheritances: A Family Constitution Playbook for the Quandt Family and the Ownership of BMW AG”, MGT-5603, Hult International Business School. Ownership arithmetic follows Appendix B of that paper, which derives from BMW Group (2026a, 2026b), Handelsblatt (2018), Börsen-Zeitung (2025) and t-online (2026). AI tools, the full prompt log and per-prompt justifications are recorded in the adjacent tabs.

---

## AI tools used

### Claude Opus 5 (Claude Code) — Anthropic

**Role.** Design direction, TypeScript implementation of the calculation engines, React interface, and drafting of this evidence pack.

**How the output was verified.** Every governance parameter was checked line by line against the Assignment 1 constitution. Every share count was reconciled arithmetically: 155.5m + 126.2m = 281.7m reproduces 25.83% / 20.9% at the February 2018 denominator and 27.7% / 22.4% at June 2025, which is the test that the model matches the paper rather than the prompt.

### Vite + React + TypeScript — Open source

**Role.** Build toolchain and interface framework.

**How the output was verified.** TypeScript compilation in strict mode; no runtime type assertions in the engines.

### Tailwind CSS v4 — Open source

**Role.** Design tokens and layout. The palette and type scale are declared once in a theme block and consumed everywhere.

**How the output was verified.** Contrast checked against the dark ground; every text element sets its own colour rather than inheriting.

### Archivo / IBM Plex Mono / Source Serif 4 — Open source typefaces

**Role.** Instrument labelling, tabular numeric readouts, and the archive layer respectively.

**How the output was verified.** Self-hosted through Fontsource so the platform renders identically offline and on a marker's machine.

---

## Prompt log and justifications

Prompts are recorded in the order given, including the ones that produced poor output and had to be corrected. Entries marked *correction* are where the first result was wrong or incomplete; entries marked *extension* changed the requirements mid-build. A log showing only successful prompts would evidence nothing about critical use.

### Prompt 01 — Author

> Build a wealth management platform supporting a single-family office, covering the six mandated pillars, based on the attached assignment brief and my class notes on holding structures, dividend policy, the Blackstone/Hilton case, the three capitals framework, IHT thresholds and trust structures.

**Why this prompt was chosen.** The opening prompt deliberately supplied the full brief and the raw class notes rather than a summary. Summarising first would have let the model infer generic family-office features; supplying the source material meant the platform had to be built against the actual assessment criteria and the specific concepts taught, including ones a generic tool would omit — the 50/50 deadlock problem, the takeover threshold ladder, and inter-company dividend treatment.

**What it produced.** A proposed seven-module architecture and, critically, a question the author had not anticipated: which family constitution the platform should encode.

**How it was iterated.** The model located "Two Inheritances", the author's own Assignment 1 on the Quandt family and BMW, in the local file system and read it in full rather than asking the author to summarise it. This mattered: the paper's appendices contain quantified rules — a 27% pool floor, a decision matrix with four distinct voting thresholds, a distribution waterfall, a buy-sell formula — that a summary would have flattened into prose.

### Prompt 02 — Author

> Four structured decisions: confirm Quandt/BMW as the anchor case; resolve English law (mandated) against German law (where the case sits); choose SFO or MFO; choose the delivery format.

**Why this prompt was chosen.** These four choices change the work materially and none of them can be inferred from the brief. Asking them as explicit multiple-choice decisions with a stated recommendation forced the trade-offs into the open rather than letting a default be adopted silently. The jurisdiction question in particular is a genuine conflict between the brief and the case, and resolving it by assumption would have been an academic error.

**What it produced.** A dual-jurisdiction estate engine computing every transfer under both regimes side by side, rather than either ignoring the mandate or misrepresenting the case.

**How it was iterated.** The dual approach turned a compliance problem into an analytical finding: the two systems fail in completely different places, and the comparison is now the most substantive part of the succession module.

### Prompt 03 — Author

> Invoke the frontend-design process for the visual identity.

**Why this prompt was chosen.** A family-office dashboard has a strong default look — dark background, one bright accent, four equal stat cards — that signals a template rather than a design. Invoking an explicit design process forced a palette and typographic system derived from the subject rather than from convention.

**What it produced.** The instrument-binnacle direction: analogue dials rather than stat tiles, on the argument that a needle encodes proximity to a limit better than a digit, and this platform is entirely about proximity to limits. Ground colour taken from the Pritzwalk cloth-mill indigo where the fortune began; the constitution rendered as a separate paper material.

**How it was iterated.** The first build painted a blue progress arc at the same radius as the red limit sector, so the value indicator covered the limit — destroying the one thing the instrument existed to show. The arc was removed entirely: real tachometers use a coloured zone band for the limit and a needle for the value, and nothing else.

### Prompt 04 — Author (extension)

> Include BMW branding, Quandt holding colours, and make it read like a speed dashboard — a cockpit — while staying clean.

**Why this prompt was chosen.** A late instruction that risked pushing the design into pastiche. The useful question was whether BMW's visual language could carry meaning rather than decoration.

**What it produced.** The M tricolour used as a semantic risk scale — light blue holding, violet advisory, red breach — so the stripe on the Sperrminorität gauge is simultaneously the branding and the legend. The "speed" requirement was satisfied by making the left dial a genuine speedometer of control drift in basis points per quarter, a real quantity the paper documents at roughly −111 bp per quarter since the June 2026 conversion.

**How it was iterated.** The alternative — decorative speed lines or a fake velocity readout — was rejected because it would have added an instrument that measured nothing. Every dial on the Bridge reads a quantity the constitution names.

### Prompt 05 — Author (correction)

> Encode Appendix D as an executable matrix and resolve any proposed decision against the live cap table, reporting who can pass it alone and who can block it alone.

**Why this prompt was chosen.** Pillar 2 requires traceability from constitution to tool. A static table of voting thresholds would satisfy that requirement only nominally. Making the thresholds executable tests whether the constitution actually does what it claims.

**What it produced.** A finding neither the paper nor the prompt anticipated: at 55/45 of the pool, one holder carries every simple-majority decision alone while the other holds a veto over everything requiring 75%. Class discussion had framed the danger as a 50/50 deadlock; the arithmetic here produces a different pathology.

**How it was iterated.** The first implementation reported only pass or fail. It was extended to compute solo passers, solo blockers and minimal winning coalitions, because "does it carry" is a less useful question for an Owners' Council than "who decides".

### Prompt 06 — Author

> Run the portfolio optimiser twice — once unconstrained, once with the constitutional floor as a hard lower bound on the BMW weight — and report the gap.

**Why this prompt was chosen.** The standard portfolio-theory answer to a two-thirds single-stock concentration is to diversify, which the constitution forbids. Running both frontiers quantifies the cost of the prohibition instead of arguing about it, which is what the brief means by portfolio maximisation against stated constraints.

**What it produced.** Initially, a result that was impossible: the constrained frontier appeared to beat the unconstrained one. Because the constrained feasible set is a strict subset, that could not be true, and the contradiction exposed two separate defects.

**How it was iterated.** The first defect was comparison by nearest sampled point, which matched portfolios at different volatilities; it was replaced with interpolation at an identical volatility. The second was the optimiser itself — an active-set method that clamped variables to their bounds but never released them, truncating the unconstrained frontier at 8.36 per cent when the true maximum is 8.85 per cent. It was replaced with projected gradient ascent, which cannot stall at a vertex, and verified by checking dominance at forty-one points along the shared range. The corrected result reframed the finding: the floor costs about five basis points at the family's current risk level, while the excess holding above the floor costs 139, and the floor's real effect is to raise the minimum reachable volatility from 4.3 to 11.2 per cent. The original framing — that continuity is expensive — was wrong, and only the arithmetic showed it.

### Prompt 07 — Author (correction)

> Test the 27% pool floor and the 25% blocking minority separately and report which binds first.

**Why this prompt was chosen.** The constitution instructs the Owners' Council to test the pool floor quarterly. Encoding it revealed the instruction may be misdirected, which is exactly the kind of error a tool can find and a document cannot.

**What it produced.** The floor sits roughly sixty-nine times further from being breached than the blocking quarter does. A quarterly floor test would have reported no action required throughout the June 2026 conversion, while the veto the family relies on lost about 2.4 percentage points.

**How it was iterated.** This finding was promoted from a footnote to the headline advisory on the Bridge, and drove the decision to make the Sperrminorität gauge the platform's signature instrument rather than the pooled-control dial.

### Prompt 08 — Author

> Attach provenance to every figure and distinguish cited, published and assumed values throughout.

**Why this prompt was chosen.** The single greatest risk in an AI-assisted financial model is invented precision — a plausible number with no source, rendered in the same typeface as a sourced one. Making provenance a first-class property of the data model prevents the interface from laundering assumptions into facts.

**What it produced.** Three provenance states surfaced in the interface, and explicit placeholders where data does not exist: two of the five G5 members are not publicly documented, so the platform reports that the succession model runs on placeholders instead of quietly inventing ages.

**How it was iterated.** An earlier draft assigned estimated birth years to the undocumented heirs without flagging them. This was corrected: the gap is a governance finding the Owners' Council should close, and hiding it would have been the more serious error.
