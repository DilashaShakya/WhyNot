import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchJobApplication, refreshJobAnalysis } from '@/api/jobApplications.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationDetail } from '@/api/types'
import { StructuredComparisonPanel } from '@/components/analysis/StructuredComparisonPanel'
import { isStructuredComparison } from '@/components/analysis/structuredComparison'
import { AiRejectionDashboard } from '@/components/ai/AiRejectionDashboard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { parseSemanticLayer } from '@/lib/analytics/semanticLayer'

function extractSemanticLayer(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const layer = (raw as Record<string, unknown>).semantic_layer
  return parseSemanticLayer(layer)
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  )
}

export function JobComparisonPage() {
  const { jobApplicationId } = useParams<{ jobApplicationId: string }>()
  const id = Number(jobApplicationId)
  const navigate = useNavigate()
  const { error: toastError, success: toastSuccess } = useToast()
  const [detail, setDetail] = useState<JobApplicationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Invalid comparison.')
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const d = await fetchJobApplication(id)
      setDetail(d)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load comparison.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  async function onRefresh() {
    if (!Number.isFinite(id) || id <= 0) return
    setRefreshing(true)
    try {
      await refreshJobAnalysis(id)
      toastSuccess('Analysis refreshed.')
      await load()
    } catch (e) {
      getApiErrors(e).forEach((m) => toastError(m))
    } finally {
      setRefreshing(false)
    }
  }

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Invalid job application.{' '}
        <Link to="/app/job" className="underline underline-offset-2">
          Back to comparisons
        </Link>
      </div>
    )
  }

  const structuredFeedback = detail?.analysis_result?.structured_feedback
  const structuredPayload = isStructuredComparison(structuredFeedback) ? structuredFeedback : null
  const semanticLayer = extractSemanticLayer(structuredFeedback)
  const failed = detail?.analysis_result?.status === 'failed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Link
            to="/app/job"
            className="text-xs font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            ← All comparisons
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {detail?.job_title?.trim() || 'Untitled role'}{' '}
            {detail?.company_name?.trim() ? (
              <span className="text-neutral-500 dark:text-neutral-400">· {detail.company_name}</span>
            ) : null}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Start with <strong>AI resume strategist</strong> feedback for bullet rewrites and a prioritized checklist.
            Structured matching below explains lexicon and keyword gaps.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading || refreshing}>
            Reload
          </Button>
          <Button type="button" onClick={() => void onRefresh()} disabled={loading || refreshing}>
            {refreshing ? (
              <>
                <Spinner className="h-4 w-4" />
                Refreshing
              </>
            ) : (
              'Refresh analysis'
            )}
          </Button>
        </div>
      </div>

      {loading ? <ComparisonSkeleton /> : null}
      {error ? (
        <Card className="border-red-200 bg-red-50/50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
          {error}
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/app/job')}>
              Back
            </Button>
          </div>
        </Card>
      ) : null}

      {!loading && detail ? (
        <>
          {detail.analysis_result?.summary ? (
            <Card className="border-neutral-200 p-5 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
                {detail.analysis_result.summary}
              </p>
            </Card>
          ) : null}

          {failed ? (
            <Card className="border-neutral-200 p-5 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Comparison could not complete</p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {detail.analysis_result?.error_message ??
                  'Ensure your resume finished PDF parsing, then refresh this analysis.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/app/resume/${detail.resume_id}`}
                  className="inline-flex items-center rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-900"
                >
                  Open resume
                </Link>
                <Button type="button" onClick={() => void onRefresh()} disabled={refreshing}>
                  Try again
                </Button>
              </div>
            </Card>
          ) : null}

          {structuredPayload && detail && !failed ? (
            <>
              <AiRejectionDashboard jobApplicationId={id} />
              <StructuredComparisonPanel
                matching={structuredPayload.matching_skills}
                missing={structuredPayload.missing_skills}
                extras={structuredPayload.extra_resume_skills ?? []}
                overlap={structuredPayload.keyword_overlap}
                alignment={structuredPayload.experience_alignment}
                semanticLayer={semanticLayer}
              />
            </>
          ) : null}

          {!failed && !structuredPayload ? (
            <Card className="p-5 text-sm text-neutral-600 dark:text-neutral-400">
              No structured comparison payload yet. Use <strong>Refresh analysis</strong> after saving this job
              application.
            </Card>
          ) : null}
        </>
      ) : null}
    </motion.div>
  )
}
