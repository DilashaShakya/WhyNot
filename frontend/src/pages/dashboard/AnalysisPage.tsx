import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchJobApplications } from '@/api/jobApplications.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationListItem } from '@/api/types'
import { AlignmentRadarChart } from '@/components/visualizations/AlignmentRadarChart'
import { buildRadarFromSummary } from '@/lib/analytics/comparisonAnalytics'
import { OverlapBar } from '@/components/analysis/OverlapBar'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function AnalysisPage() {
  const [applications, setApplications] = useState<JobApplicationListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await fetchJobApplications()
      setApplications(list)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load comparisons.')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Analysis</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          At-a-glance alignment radars for every saved comparison. When sentence-transformer embeddings are enabled on
          the API, cards also surface ML blend cues alongside lexical keyword coverage.
        </p>
        <Link
          to="/app/job"
          className="inline-flex text-sm font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-50"
        >
          New comparison →
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {applications === null ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Spinner className="h-4 w-4" />
          Loading comparisons…
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No data yet.{' '}
          <Link to="/app/job" className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-50">
            Create your first comparison
          </Link>
          .
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {applications.map((app) => {
            const m = app.analysis_summary.matching_skill_count ?? 0
            const miss = app.analysis_summary.missing_skill_count ?? 0
            const overlap = app.analysis_summary.overlap_percent ?? 0
            const align = app.analysis_summary.alignment_score
            const semBlend = app.analysis_summary.semantic_blended_fit_score
            const semDoc = app.analysis_summary.semantic_document_score
            const semOn = app.analysis_summary.semantic_status === 'active'
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link to={`/app/job/${app.id}`}>
                  <Card className="h-full p-5 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {app.job_title?.trim() || 'Untitled role'}
                        </p>
                        {app.company_name?.trim() ? (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{app.company_name}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {app.status.replaceAll('_', ' ')}
                      </span>
                    </div>

                    {app.analysis_summary.state === 'failed' ? (
                      <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
                        {app.analysis_summary.error_message ?? 'Waiting on parsed resume text.'}
                      </p>
                    ) : app.analysis_summary.state === 'none' ? (
                      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                        No analysis on file—open the job to generate one.
                      </p>
                    ) : (
                      <>
                        <p className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-50">{m}</span> matching
                          skills ·{' '}
                          <span className="font-semibold text-neutral-900 dark:text-neutral-50">{miss}</span> gaps
                        </p>
                        {semOn && typeof semBlend === 'number' ? (
                          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                            Semantic blend{' '}
                            <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                              {semBlend}
                            </span>
                            {typeof semDoc === 'number' ? (
                              <>
                                {' '}
                                · Doc match{' '}
                                <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                                  {semDoc}
                                </span>
                              </>
                            ) : null}
                          </p>
                        ) : null}
                        <div className="mt-3 min-h-[200px]">
                          <AlignmentRadarChart
                            compact
                            data={buildRadarFromSummary({
                              matching: m,
                              missing: miss,
                              overlapPercent: overlap,
                              alignment: align,
                            })}
                          />
                        </div>
                        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                          <OverlapBar label="Keyword coverage (job)" valuePercent={overlap} />
                          {typeof align === 'number' ? (
                            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                              Experience heuristic:{' '}
                              <span className="font-medium text-neutral-800 dark:text-neutral-100">{align}</span>/100
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
