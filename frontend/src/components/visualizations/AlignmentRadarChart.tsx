import { motion } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { RadarAxisRow } from '@/lib/analytics/comparisonAnalytics'

const tickPrimary = { fill: '#525252', fontSize: 11 }
const tickMuted = { fill: '#a3a3a3', fontSize: 10 }

export function AlignmentRadarChart({ data, compact }: { data: RadarAxisRow[]; compact?: boolean }) {
  return (
    <motion.div
      className={`w-full min-w-0 [&_.dark_&]:[&_text]:fill-neutral-300 ${compact ? 'h-[200px]' : 'h-[260px]'}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="52%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#e5e5e5" strokeDasharray="3 6" className="dark:stroke-neutral-700" />
          <PolarAngleAxis dataKey="subject" tick={tickPrimary} tickLine={false} className="dark:[&_text]:fill-neutral-300" />
          <PolarRadiusAxis angle={45} domain={[0, 100]} tick={tickMuted} tickCount={5} className="dark:[&_text]:fill-neutral-500" />
          <Radar
            name="Alignment"
            dataKey="A"
            stroke="#171717"
            fill="#171717"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={{ r: 2, fill: '#171717' }}
            className="dark:stroke-neutral-100 dark:fill-neutral-100 [&_.recharts-radar-dot]:dark:fill-neutral-100"
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
