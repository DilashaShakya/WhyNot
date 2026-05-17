import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

export function ResumeListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
        >
          <Card className="h-20 border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60" />
        </motion.div>
      ))}
    </div>
  )
}
