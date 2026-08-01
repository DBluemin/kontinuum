/** The 1,000-word showcase report required by the brief. */

interface Section {
  heading: string
  paragraphs: string[]
}

const SECTIONS: Section[] = [
  {
    heading: 'The premise',
    paragraphs: [
      "Most family-office software models wealth as a sum of holdings. That model breaks when the family's position is a controlling stake in a listed company. Appendix B of the underlying constitution records the Quandt line's holding in BMW AG moving from 46.8 per cent to 50.2 per cent and back to 45.7 per cent between 2018 and 2026, with no share ever changing hands. Buybacks retired the denominator; the June 2026 preferred-share conversion restored it. Article 3 draws the conclusion. Family control is a residual: whatever survives the company's own capital decisions. KONTINUUM is built on that.",
    ],
  },
  {
    heading: 'What the platform is',
    paragraphs: [
      'KONTINUUM is a functional prototype of a single-family office operating system for the Herbert Quandt line, with a multi-family mode that adds the Harald Quandt branch as a second book. Seven modules run over one data model and a set of pure calculation engines.',
      'What distinguishes it is where the constitution sits. It is the configuration file. Every article and appendix from the Assignment 1 playbook is encoded as a structured clause carrying its verbatim text and its machine-readable parameters together. Every figure in the interface carries a clause tag; clicking one opens the governing text and lists the other modules that clause drives. The traceability the brief asks for is therefore something a marker can click on.',
    ],
  },
  {
    heading: 'How it is used',
    paragraphs: [
      "The Bridge is the daily view: an instrument binnacle reporting four vital signs. A central dial shows pooled control against the 27 per cent floor. A speedometer to its left reads the rate at which control is eroding, currently about 111 basis points per quarter. A gauge to its right reports how many years of base distribution the Continuity Reserve can fund. Beneath them runs the platform's signature instrument, a linear gauge showing Stefan Quandt's blocking minority against a hard wall at 25 per cent. Headroom is read out in shares. An Owners' Council can act on 1.55 million shares; 0.25 percentage points tends to get filed and forgotten.",
      "The Constitution module makes Appendix D executable. A member picks a decision from the matrix (sell pooled shares, change the distribution base, admit the fifth generation to equity), and the platform resolves the required threshold against the live cap table. It reports whether the decision carries, who can carry it alone, and who can defeat it alone. A toggle admits the fifth generation to equity and re-runs the arithmetic, so the Council sees the cousin-consortium transition coming before it signs.",
      'Ownership contains a dilution laboratory that replays the 2018 to 2026 record as validation and then runs forward. Succession computes every transfer under English and German law simultaneously and tests whether the resulting bill can be paid without selling shares. Portfolio runs the optimiser twice, unconstrained and constitution-constrained. Financials consolidates the books and projects fifty years of the distribution waterfall under stochastic dividends. Operations runs the office: calendar, decision log, compliance register, conflict ladder.',
    ],
  },
  {
    heading: 'What the encoding found',
    paragraphs: [
      'Three findings emerged from making the rules executable that the document itself does not contain.',
      'First, the constitution monitors the wrong threshold. Article 3 instructs the Owners’ Council to test the 27 per cent pool floor quarterly. Encoding both constraints shows the floor sits roughly sixty-nine times further from breach than Stefan Quandt’s individual blocking quarter. A quarterly floor test would have reported no action required throughout the June 2026 conversion, while the veto the family actually relies on lost 2.4 percentage points.',
      'Second, the pool is asymmetric. At 55/45 one holder carries every simple-majority decision alone and the other can only refuse. Class discussion had framed the risk as a 50/50 paralysis; this is a different failure, and Article 10 is what contains it, since amendment must clear the pool by share and the Assembly by head.',
      'Third, and most usefully, the expensive constraint turns out to be something else. The floor implies a minimum BMW weight of about 38 per cent of consolidated wealth; the family holds around 65 per cent. Running the optimiser twice shows the floor costs roughly five basis points a year at the family’s current risk level, while the excess holding above the floor costs about 139. That is some €497 million a year available without selling a single share the constitution protects. The floor does bite hard in one place. It sets a risk floor as well as an ownership one: the lowest volatility reachable while honouring it is 11.2 per cent, against 4.3 per cent if the stake could be sold freely.',
    ],
  },
  {
    heading: 'Benefits and intended outcomes',
    paragraphs: [
      "For the Owners' Council the platform converts governance from a document consulted after a dispute into a constraint tested before a decision. For the fifth generation it makes an abstract inheritance legible: the compliance register shows which of the seven required artifacts each member owes, and the projection shows what the base distribution is worth per claimant in real terms once the number of claimants multiplies. For the family office itself it supplies the reporting a stewardship mandate needs, meaning capital under management by class and by entity, returns gross and after tax, and a total cost of ownership stated in basis points.",
      'The intended outcome is a narrow one. No threshold should be crossed without someone having seen it coming.',
    ],
  },
  {
    heading: 'Limitations',
    paragraphs: [
      'The platform models a constitution that does not exist. The Quandt family publishes no pooling agreement, council or constitution, and the paper is explicit that every instrument proposed in it is a design, not a description. That caveat carries straight through to the software. Share counts, conversion sizes and governance thresholds come from the paper and its cited sources; the share price, capital-market assumptions, private holding-company valuations and the distribution base are modelling inputs, marked as such throughout the interface.',
      'Two of the five fifth-generation members are not publicly documented, so their tranche schedule cannot be computed. The platform says so on screen instead of filling the gap with invented ages. A family constitution also has no binding force in German law until it is transcribed into the articles of association, the pooling agreement and individual wills. Where those contradict, a court reads the will. That is why the will-consistency register exists, and why it is treated as the enforcement layer.',
    ],
  },
]

const wordCount = SECTIONS.flatMap((s) => s.paragraphs)
  .join(' ')
  .split(/\s+/)
  .filter(Boolean).length

export const REPORT = {
  title: 'KONTINUUM: a constitution-driven family office platform',
  subtitle:
    'Showcase report · ENT-0301 · anchor case: the Quandt line and the ownership of BMW AG',
  sections: SECTIONS,
  wordCount,
  footer:
    'Built on Blümin, D. (2026) “Two Inheritances: A Family Constitution Playbook for the Quandt Family and the Ownership of BMW AG”, ENT-0301, Hult International Business School. Ownership arithmetic follows Appendix B of that paper, which derives from BMW Group (2026a, 2026b), Handelsblatt (2018), Börsen-Zeitung (2025) and t-online (2026). AI tools, the full prompt log and per-prompt justifications are recorded in the adjacent tabs.',
}
