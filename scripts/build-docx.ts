/**
 * Builds the submission document: showcase report + AI evidence pack.
 * Generated from the same data the platform renders, so the document and the
 * tool cannot drift apart.
 */
import { writeFileSync } from 'node:fs'
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { REPORT } from '../src/data/report'
import { PROMPT_LOG, TOOLS } from '../src/data/evidence'

const body: Paragraph[] = []

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({ text, heading: level, spacing: { before: 320, after: 160 } })

const para = (text: string, opts: { italics?: boolean; size?: number } = {}) =>
  new Paragraph({
    children: [new TextRun({ text, italics: opts.italics, size: opts.size })],
    spacing: { after: 160, line: 300 },
  })

const label = (bold: string, rest: string) =>
  new Paragraph({
    children: [new TextRun({ text: bold, bold: true }), new TextRun({ text: ' ' + rest })],
    spacing: { after: 160, line: 300 },
  })

// ── Title page ──────────────────────────────────────────────────────────
body.push(
  new Paragraph({
    children: [new TextRun({ text: REPORT.title, bold: true, size: 40 })],
    spacing: { after: 160 },
    alignment: AlignmentType.LEFT,
  }),
)
body.push(para(REPORT.subtitle, { italics: true }))
body.push(
  new Paragraph({
    children: [
      new TextRun({ text: 'Platform: ', bold: true }),
      new ExternalHyperlink({
        link: 'https://dbluemin.github.io/kontinuum/',
        children: [new TextRun({ text: 'dbluemin.github.io/kontinuum', style: 'Hyperlink' })],
      }),
    ],
    spacing: { after: 80 },
  }),
)
body.push(
  new Paragraph({
    children: [
      new TextRun({ text: 'Source code: ', bold: true }),
      new ExternalHyperlink({
        link: 'https://github.com/DBluemin/kontinuum',
        children: [new TextRun({ text: 'github.com/DBluemin/kontinuum', style: 'Hyperlink' })],
      }),
    ],
    spacing: { after: 320 },
  }),
)

// ── Report ──────────────────────────────────────────────────────────────
body.push(heading(`Showcase report (${REPORT.wordCount} words)`, HeadingLevel.HEADING_1))
for (const s of REPORT.sections) {
  body.push(heading(s.heading, HeadingLevel.HEADING_2))
  for (const p of s.paragraphs) body.push(para(p))
}
body.push(para(REPORT.footer, { italics: true, size: 18 }))

// ── AI tools ────────────────────────────────────────────────────────────
body.push(heading('AI tools used', HeadingLevel.HEADING_1))
for (const t of TOOLS) {
  body.push(heading(`${t.name} — ${t.vendor}`, HeadingLevel.HEADING_2))
  body.push(label('Role.', t.role))
  body.push(label('How the output was verified.', t.verification))
}

// ── Prompt log ──────────────────────────────────────────────────────────
body.push(heading('Prompt log and justifications', HeadingLevel.HEADING_1))
body.push(
  para(
    'Prompts are recorded in the order given, including the ones that produced poor output and had to be corrected. Entries marked "correction" are where the first result was wrong or incomplete; entries marked "extension" changed the requirements mid-build. A log showing only successful prompts would evidence nothing about critical use.',
    { italics: true },
  ),
)

for (const p of PROMPT_LOG) {
  body.push(heading(`Prompt ${String(p.n).padStart(2, '0')} — ${p.author}`, HeadingLevel.HEADING_2))
  body.push(
    new Paragraph({
      children: [new TextRun({ text: p.prompt, italics: true })],
      indent: { left: 480 },
      spacing: { after: 160, line: 300 },
      border: { left: { style: 'single', size: 12, color: '0066B1', space: 12 } },
    }),
  )
  body.push(label('Why this prompt was chosen.', p.why))
  body.push(label('What it produced.', p.produced))
  body.push(label('How it was iterated.', p.iteration))
}

const doc = new Document({
  creator: 'Daniel Blümin',
  title: REPORT.title,
  description: 'Assignment 2 deliverable — showcase report and responsible-AI evidence pack.',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 300 } } },
      heading1: { run: { font: 'Calibri', size: 30, bold: true, color: '1A1A1A' } },
      heading2: { run: { font: 'Calibri', size: 24, bold: true, color: '333333' } },
    },
  },
  sections: [
    {
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: body,
    },
  ],
})

const buf = await Packer.toBuffer(doc)
writeFileSync(new URL('../deliverables/KONTINUUM-report-and-AI-evidence.docx', import.meta.url), buf)
console.log('docx written —', REPORT.wordCount, 'word report +', PROMPT_LOG.length, 'prompts')
