import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import type { SemanticLayer } from '@/lib/analytics/semanticLayer'
import { Card } from '@/components/ui/Card'
import { SkillRelationshipList } from '@/components/visualizations/SkillRelationshipList'

function CollapsibleSection({
  id,
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)

  return (
    <div className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-800">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
        <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function SemanticIntelligencePanel({ semantic }: { semantic: SemanticLayer }) {
  if (semantic.status !== 'active') {
    return (
      <Card className="border-dashed border-neutral-300 p-5 dark:border-neutral-700">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Semantic matching</p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {semantic.status === 'disabled'
            ? 'Enable sentence-transformer embeddings (see README) for document similarity, transferable skills, and ML blend scoring.'
            : semantic.message ?? 'Semantic layer unavailable. Install Python dependencies under ml/python or check the server logs.'}
        </p>
        {semantic.model_id ? (
          <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">Model: {semantic.model_id}</p>
        ) : null}
      </Card>
    )
  }

  const transferable = semantic.transferable_skill_mappings ?? []
  const synonyms = semantic.synonym_skill_mappings ?? []
  const relatedXp = semantic.related_experience ?? []
  const trueGaps = semantic.semantic_true_gaps ?? []

  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Semantic intelligence
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Sentence-transformer embeddings layered on lexical extraction—separate from generative AI rejection copy.
          </p>
        </div>
        <div className="text-right text-[11px] text-neutral-400 dark:text-neutral-500">
          {semantic.model_id ? <p className="font-mono">{semantic.model_id}</p> : null}
          {typeof semantic.embedding_latency_ms === 'number' ? <p>{semantic.embedding_latency_ms} ms</p> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Document similarity</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {typeof semantic.semantic_document_score === 'number' ? semantic.semantic_document_score : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Whole-resume ↔ posting cosine (0–100)</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">ML blend score</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {typeof semantic.blended_fit_score === 'number' ? semantic.blended_fit_score : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Doc + skills + chunks + keywords + experience</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Skill alignment (semantic)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {typeof semantic.semantic_skill_alignment_score === 'number'
              ? semantic.semantic_skill_alignment_score
              : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Lexical + embedding-covered job skills</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Keyword lift</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {typeof semantic.keyword_semantic_lift === 'number'
              ? `${semantic.keyword_semantic_lift > 0 ? '+' : ''}${semantic.keyword_semantic_lift}`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Semantic doc score minus lexical keyword %</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <CollapsibleSection
          id="sem-synonyms"
          title="Strong semantic skill proximity"
          subtitle="Lexicon gaps where embeddings still align tightly."
          defaultOpen={synonyms.length > 0}
        >
          <SkillRelationshipList
            title=""
            mappings={synonyms}
            description={synonyms.length ? undefined : 'No near-synonym skill pairs detected for this posting.'}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="sem-transfer"
          title="Transferable skill bridges"
          subtitle="Related capabilities that partially cover posting requirements."
          defaultOpen={transferable.length > 0 && synonyms.length === 0}
        >
          <SkillRelationshipList
            title=""
            mappings={transferable}
            description={
              transferable.length ? undefined : 'No transferable bridges above the confidence threshold.'
            }
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="sem-xp"
          title="Related experience (embedding-ranked)"
          subtitle="Resume sections closest to the job narrative."
        >
          {relatedXp.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No excerpts cleared the similarity gate.</p>
          ) : (
            <ul className="space-y-3">
              {relatedXp.map((row, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Resume</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
                    {row.resume_excerpt}
                    …
                  </p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Posting anchor</p>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{row.job_anchor_excerpt}…</p>
                  <p className="mt-2 text-right text-[11px] tabular-nums text-neutral-500">
                    Similarity {(row.similarity * 100).toFixed(0)}%
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="sem-gaps"
          title="True semantic skill gaps"
          subtitle="Requirements neither lexically matched nor covered by embedding similarity."
          defaultOpen={false}
        >
          {trueGaps.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No remaining gaps under the semantic closure—nice alignment on extracted skills.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trueGaps.map((g) => (
                <li
                  key={g.slug}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                >
                  {g.label}
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>
    </Card>
  )
}
