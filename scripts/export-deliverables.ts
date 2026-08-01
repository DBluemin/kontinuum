/**
 * Emits the showcase report and the AI evidence pack as markdown, generated
 * from the same data the platform renders so the document and the tool can
 * never drift apart.
 */
import { writeFileSync } from 'node:fs'
import { REPORT } from '../src/data/report'
import { PROMPT_LOG, TOOLS } from '../src/data/evidence'

const lines: string[] = []

lines.push(`# ${REPORT.title}`)
lines.push('')
lines.push(`*${REPORT.subtitle}*`)
lines.push('')
lines.push(`Platform: https://dbluemin.github.io/kontinuum/`)
lines.push('')
lines.push(`Source: https://github.com/DBluemin/kontinuum`)
lines.push('')
lines.push('---')
lines.push('')
lines.push(`## Showcase report (${REPORT.wordCount} words)`)
lines.push('')

for (const s of REPORT.sections) {
  lines.push(`### ${s.heading}`)
  lines.push('')
  for (const p of s.paragraphs) {
    lines.push(p)
    lines.push('')
  }
}

lines.push('---')
lines.push('')
lines.push(REPORT.footer)
lines.push('')
lines.push('---')
lines.push('')
lines.push('## AI tools used')
lines.push('')

for (const t of TOOLS) {
  lines.push(`### ${t.name} — ${t.vendor}`)
  lines.push('')
  lines.push(`**Role.** ${t.role}`)
  lines.push('')
  lines.push(`**How the output was verified.** ${t.verification}`)
  lines.push('')
}

lines.push('---')
lines.push('')
lines.push('## Prompt log and justifications')
lines.push('')
lines.push(
  'Prompts are recorded in the order given, including the ones that produced poor output and had to be corrected. Entries marked *correction* are where the first result was wrong or incomplete; entries marked *extension* changed the requirements mid-build. A log showing only successful prompts would evidence nothing about critical use.',
)
lines.push('')

for (const p of PROMPT_LOG) {
  lines.push(`### Prompt ${String(p.n).padStart(2, '0')} — ${p.author}`)
  lines.push('')
  lines.push(`> ${p.prompt}`)
  lines.push('')
  lines.push(`**Why this prompt was chosen.** ${p.why}`)
  lines.push('')
  lines.push(`**What it produced.** ${p.produced}`)
  lines.push('')
  lines.push(`**How it was iterated.** ${p.iteration}`)
  lines.push('')
}

const out = lines.join('\n')
writeFileSync(new URL('../deliverables/KONTINUUM-report-and-AI-evidence.md', import.meta.url), out)
console.log('written:', out.split(/\s+/).filter(Boolean).length, 'words total')
console.log('report section:', REPORT.wordCount, 'words')
