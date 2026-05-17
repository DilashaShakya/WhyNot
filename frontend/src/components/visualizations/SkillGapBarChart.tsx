import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { SkillRow } from '@/api/types'

type Row = { name: string; value: number }

export function SkillGapBarChart({ matching, missing }: { matching: SkillRow[]; missing: SkillRow[] }) {
  const data: Row[] = [
    { name: 'Matched to posting', value: matching.length },
    { name: 'Gaps vs posting', value: missing.length },
  ]

  const max = Math.max(4, ...data.map((d) => d.value), 1)

  const fills = ['#171717', 'rgba(115,115,115,0.45)']

  return (
    <motion.div
      className="h-[140px] w-full min-w-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, max]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={124}
            tick={{ fill: '#737373', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={fills[i] ?? '#171717'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
