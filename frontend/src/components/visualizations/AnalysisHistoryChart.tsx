import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrendPoint } from '@/lib/analytics/comparisonAnalytics'

export function AnalysisHistoryChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Not enough comparisons to chart yet.
      </p>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    t: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="h-[220px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="#e5e5e5"
            strokeDasharray="4 6"
            className="dark:stroke-neutral-800"
            vertical={false}
          />
          <XAxis dataKey="t" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#a3a3a3', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              fontSize: 12,
              background: 'var(--color-surface, #fff)',
            }}
            labelStyle={{ color: '#525252' }}
          />
          <Line
            type="monotone"
            dataKey="overlap"
            name="Keyword overlap %"
            stroke="#171717"
            strokeWidth={2}
            dot={{ r: 3, fill: '#171717' }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Blended confidence"
            stroke="#737373"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
