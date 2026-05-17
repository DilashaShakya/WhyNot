import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchJobApplications } from '@/api/jobApplications.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationListItem } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function ResumeReviewPage() {
  const [applications, setApplications] = useState<JobApplicationListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await fetchJobApplications()
      setApplications(list)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load reviews.')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Job review</h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Select a saved job review to generate recruiter-style feedback, or add a new one.
          </p>
        </div>
        <Link
          to="/app/job"
          className="shrink-0 rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
        >
          + New
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {applications === null ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spinner className="h-4 w-4" />
          Loading…
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No job reviews yet.{' '}
          <Link
            to="/app/job"
            className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-50"
          >
            Add your first job description →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-2">
          {applications.map((app) => (
            <Link key={app.id} to={`/app/job/${app.id}`}>
              <Card className="p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {app.job_title?.trim() || 'Untitled role'}
                      {app.company_name?.trim() ? (
                        <span className="font-normal text-neutral-500 dark:text-neutral-400">
                          {' '}
                          · {app.company_name}
                        </span>
                      ) : null}
                    </p>
                    <p className="line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {app.job_description_preview || '—'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                    {new Date(app.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}
