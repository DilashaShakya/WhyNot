import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchJobApplications } from '@/api/jobApplications.api'
import { fetchResumes } from '@/api/resumes.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationListItem } from '@/api/types'
import { buildApplicationsTrend } from '@/lib/analytics/comparisonAnalytics'
import { AnalysisHistoryChart } from '@/components/visualizations/AnalysisHistoryChart'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{hint}</p> : null}
    </Card>
  )
}

export function DashboardHomePage() {
  const [applications, setApplications] = useState<JobApplicationListItem[] | null>(null)
  const [resumeCount, setResumeCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [apps, resumes] = await Promise.all([fetchJobApplications(), fetchResumes()])
      setApplications(apps)
      setResumeCount(resumes.length)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load overview.')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const trend = useMemo(
    () => (applications ? buildApplicationsTrend(applications) : []),
    [applications],
  )

  const usableCount = useMemo(
    () =>
      applications?.filter(
        (a) => a.analysis_summary.state !== 'failed' && a.analysis_summary.state !== 'none',
      ).length ?? 0,
    [applications],
  )

  const portfolioConfidence = useMemo(() => {
    if (trend.length === 0) return null
    return Math.round(trend.reduce((s, p) => s + p.confidence, 0) / trend.length)
  }, [trend])

  const latestOverlap = trend.length ? trend[trend.length - 1]?.overlap : null

  const loading = applications === null || resumeCount === null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Overview</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          A quiet snapshot of your resume library and how your saved role comparisons are trending—built for the same
          structured signals you see on each job card.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Spinner className="h-4 w-4" />
          Loading your workspace…
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Resume health"
              value={resumeCount === 0 ? 'Add a resume' : `${resumeCount} on file`}
              hint={
                resumeCount === 0
                  ? 'Upload a PDF to unlock parsing and comparisons.'
                  : 'Keep one primary resume updated for the cleanest overlap signals.'
              }
            />
            <StatCard
              label="Tracked applications"
              value={applications?.length ?? 0}
              hint={`${usableCount} with completed comparisons.`}
            />
            <StatCard
              label="Portfolio confidence"
              value={portfolioConfidence === null ? '—' : `${portfolioConfidence}`}
              hint={
                portfolioConfidence === null
                  ? 'Run comparisons to blend skill, keyword, and experience signals.'
                  : 'Average blended index across completed comparisons (0–100).'
              }
            />
            <StatCard
              label="Latest keyword overlap"
              value={latestOverlap === null ? '—' : `${latestOverlap}%`}
              hint={latestOverlap === null ? 'Open a comparison after analysis completes.' : 'Most recent completed row.'}
            />
          </div>

          {trend.length >= 2 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <Card className="p-6">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Historical comparisons
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Keyword overlap and blended confidence over time.
                    </p>
                  </div>
                  <Link
                    to="/app/analysis"
                    className="text-xs font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-50"
                  >
                    Open analysis hub →
                  </Link>
                </div>
                <AnalysisHistoryChart data={trend} />
              </Card>
            </motion.div>
          ) : null}

          <Card className="border-dashed border-neutral-300 p-5 dark:border-neutral-700">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Career intelligence</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Use the Analysis hub for card-level radars, then open any row for the full visual dashboard, recruiter
              attention map, and AI rejection brief.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/app/resume"
                className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
              >
                Resumes
              </Link>
              <Link
                to="/app/job"
                className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
              >
                New comparison
              </Link>
              <Link
                to="/app/analysis"
                className="rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                Analysis
              </Link>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  )
}
