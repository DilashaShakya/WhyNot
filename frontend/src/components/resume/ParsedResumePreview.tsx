import { motion } from 'framer-motion'
import { splitResumeIntoSections } from '@/lib/resumePdf'

export function ParsedResumePreview({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No extracted text yet. Upload a PDF to parse its contents.
      </p>
    )
  }

  const sections = splitResumeIntoSections(text)

  return (
    <div className="space-y-10">
      {sections.map((section, i) => (
        <motion.section
          key={`${section.heading}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.24) }}
          className="scroll-mt-8"
        >
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
            {section.heading}
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
            {section.body}
          </div>
        </motion.section>
      ))}
    </div>
  )
}
