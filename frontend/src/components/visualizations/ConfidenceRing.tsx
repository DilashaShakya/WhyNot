import { motion } from 'framer-motion'

export function ConfidenceRing({
  value,
  label,
  sublabel,
}: {
  value: number
  label: string
  sublabel?: string
}) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (v / 100) * c

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0 text-neutral-900 dark:text-neutral-100">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          className="stroke-neutral-200 dark:stroke-neutral-800"
          strokeWidth="6"
        />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="48"
          textAnchor="middle"
          className="fill-neutral-900 dark:fill-neutral-50"
          style={{ fontSize: 15, fontWeight: 600 }}
        >
          {v}
        </text>
      </svg>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</p>
        {sublabel ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sublabel}</p> : null}
      </div>
    </motion.div>
  )
}
