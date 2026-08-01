import { useState } from 'react'
import { PROMPT_LOG, TOOLS } from '../data/evidence'
import { Etch, Panel } from '../components/primitives'
import { REPORT } from '../data/report'

type Tab = 'report' | 'prompts' | 'tools'

export function EvidenceModule() {
  const [tab, setTab] = useState<Tab>('report')

  const tabs: { id: Tab; label: string; caption: string }[] = [
    { id: 'report', label: 'Showcase report', caption: `${REPORT.wordCount} words` },
    { id: 'prompts', label: 'Prompt log', caption: `${PROMPT_LOG.length} prompts` },
    { id: 'tools', label: 'AI tools', caption: `${TOOLS.length} listed` },
  ]

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="border px-3 py-2 text-left transition-colors"
            style={{
              borderColor: tab === t.id ? 'var(--color-m-blue)' : 'var(--color-rule)',
              background: tab === t.id ? 'var(--color-panel)' : 'transparent',
            }}
          >
            <span
              className="block text-[13px]"
              style={{ color: tab === t.id ? 'var(--color-ink)' : 'var(--color-ink-dim)' }}
            >
              {t.label}
            </span>
            <span className="etch">{t.caption}</span>
          </button>
        ))}
      </div>

      {tab === 'report' && (
        /* The report is a document, so it is set as one: bone paper, serif,
           measured column — the same archive material as the clause drawer. */
        <article className="bg-bone px-6 py-10 sm:px-12 lg:px-16">
          <div className="m-stripe mb-8 h-[3px] w-16" />
          <h1
            className="font-serif text-[30px] leading-[1.2]"
            style={{ color: 'var(--color-bone-ink)' }}
          >
            {REPORT.title}
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--color-bone-dim)' }}>
            {REPORT.subtitle}
          </p>

          <div className="mt-8 max-w-[62ch]">
            {REPORT.sections.map((s) => (
              <section key={s.heading} className="mb-7">
                <h2
                  className="font-display text-[12px]"
                  style={{
                    color: 'var(--color-bone-dim)',
                    fontVariationSettings: "'wdth' 112, 'wght' 600",
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.heading}
                </h2>
                {s.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="mt-3 font-serif text-[16.5px] leading-[1.68]"
                    style={{ color: 'var(--color-bone-ink)' }}
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <footer
            className="mt-10 max-w-[62ch] border-t pt-4 text-[11.5px] leading-relaxed"
            style={{ borderColor: 'var(--color-bone-deep)', color: 'var(--color-bone-dim)' }}
          >
            {REPORT.footer}
          </footer>
        </article>
      )}

      {tab === 'prompts' && (
        <div className="space-y-3">
          <Panel>
            <div className="p-4">
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                Prompts are recorded in the order given, including the ones that produced poor
                output and had to be corrected. Entries marked <em>correction</em> are where the
                first result was wrong or incomplete; entries marked <em>extension</em> changed the
                requirements mid-build. A log showing only successful prompts would evidence
                nothing about critical use.
              </p>
            </div>
          </Panel>

          {PROMPT_LOG.map((p) => (
            <Panel key={p.n}>
              <div className="border-b border-rule px-4 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="readout text-[12px]" style={{ color: 'var(--color-bone)' }}>
                    Prompt {String(p.n).padStart(2, '0')}
                  </span>
                  <span
                    className="etch"
                    style={{
                      color: p.author.includes('correction')
                        ? 'var(--color-m-red)'
                        : p.author.includes('extension')
                          ? 'var(--color-amber)'
                          : 'var(--color-ink-mute)',
                    }}
                  >
                    {p.author}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3">
                <blockquote
                  className="border-l-2 pl-4 font-serif text-[15px] leading-relaxed"
                  style={{ borderColor: 'var(--color-m-blue)', color: 'var(--color-ink)' }}
                >
                  {p.prompt}
                </blockquote>

                <dl className="mt-4 space-y-3">
                  {[
                    { k: 'Why this prompt', v: p.why },
                    { k: 'What it produced', v: p.produced },
                    { k: 'How it was iterated', v: p.iteration },
                  ].map((row) => (
                    <div key={row.k}>
                      <dt className="etch">{row.k}</dt>
                      <dd
                        className="mt-1 text-[13px] leading-relaxed"
                        style={{ color: 'var(--color-ink-dim)' }}
                      >
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'tools' && (
        <div className="space-y-3">
          {TOOLS.map((t) => (
            <Panel key={t.name}>
              <div className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[14px]" style={{ color: 'var(--color-ink)' }}>
                    {t.name}
                  </span>
                  <span className="etch">{t.vendor}</span>
                </div>
                <div className="mt-3">
                  <Etch>Role</Etch>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                    {t.role}
                  </p>
                </div>
                <div className="mt-3">
                  <Etch>How the output was verified</Etch>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-dim)' }}>
                    {t.verification}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
