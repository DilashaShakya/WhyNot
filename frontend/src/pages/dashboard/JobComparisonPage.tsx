import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { deleteJobApplication, fetchJobApplication, updateJobApplication } from '@/api/jobApplications.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationDetail } from '@/api/types'
import { AiRejectionDashboard } from '@/components/ai/AiRejectionDashboard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { confirmDelete } from '@/stores/confirmStore'

function JobDescriptionBody({
  detail,
  editingJd,
  jdDraft,
  savingJd,
  onJdChange,
  onEdit,
  onSave,
  onCancel,
}: {
  detail: JobApplicationDetail
  editingJd: boolean
  jdDraft: string
  savingJd: boolean
  onJdChange: (value: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  if (editingJd) {
    return (
      <div className="space-y-3">
        <textarea
          value={jdDraft}
          onChange={(e) => onJdChange(e.target.value)}
          rows={14}
          className="max-h-[min(70vh,520px)] w-full resize-y rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 font-mono text-xs leading-relaxed focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onSave} disabled={savingJd}>
            {savingJd ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="max-h-[min(70vh,520px)] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        {detail.job_description}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        Edit description
      </button>
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
  const [deleting, setDeleting] = useState(false)
  const [editingJd, setEditingJd] = useState(false)
  const [jdDraft, setJdDraft] = useState('')
  const [savingJd, setSavingJd] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Invalid review.')
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const d = await fetchJobApplication(id)
      setDetail(d)
      setJdDraft(d.job_description)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load review.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  async function onDelete() {
    const label =
      [detail?.job_title, detail?.company_name].filter(Boolean).join(' · ') || 'Untitled role'
    if (!(await confirmDelete(label, 'job review'))) return
    setDeleting(true)
    try {
      await deleteJobApplication(id)
      toastSuccess('Deleted.')
      navigate('/app/job')
    } catch (e) {
      getApiErrors(e).forEach((m) => toastError(m))
    } finally {
      setDeleting(false)
    }
  }

  async function onSaveJd() {
    if (!detail) return
    setSavingJd(true)
    try {
      const updated = await updateJobApplication(id, { job_description: jdDraft })
      setDetail(updated)
      setEditingJd(false)
      toastSuccess('Job description updated.')
    } catch (e) {
      getApiErrors(e).forEach((m) => toastError(m))
    } finally {
      setSavingJd(false)
    }
  }

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Invalid job review.{' '}
        <Link to="/app/job" className="underline underline-offset-2">
          Back
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            to="/app/job"
            className="text-xs font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            ← All reviews
          </Link>
          {loading ? (
            <div className="flex items-center gap-2 pt-1">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-neutral-500">Loading…</span>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {detail?.job_title?.trim() || 'Untitled role'}
              {detail?.company_name?.trim() ? (
                <span className="text-neutral-500 dark:text-neutral-400"> · {detail.company_name}</span>
              ) : null}
            </h1>
          )}
        </div>
        {detail && !loading ? (
          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/studio"
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              Open studio
            </Link>
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={deleting}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : null}
      </div>

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

      {detail && !loading ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start">
          {/* AI feedback — main column (left) */}
          <div className="min-w-0 w-full">
            <AiRejectionDashboard jobApplicationId={id} />
          </div>

          {/* Job posting — right sidebar */}
          <aside className="min-w-0">
            <details className="rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 lg:hidden">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-neutral-900 marker:content-none dark:text-neutral-50 [&::-webkit-details-marker]:hidden">
                Job description
                <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                  (tap to expand)
                </span>
              </summary>
              <div className="border-t border-neutral-100 p-5 dark:border-neutral-800">
                <JobDescriptionBody
                  detail={detail}
                  editingJd={editingJd}
                  jdDraft={jdDraft}
                  savingJd={savingJd}
                  onJdChange={setJdDraft}
                  onEdit={() => setEditingJd(true)}
                  onSave={() => void onSaveJd()}
                  onCancel={() => {
                    setEditingJd(false)
                    setJdDraft(detail.job_description)
                  }}
                />
              </div>
            </details>

            <Card className="sticky top-6 hidden border-slate-200/80 bg-slate-50/30 p-5 dark:border-slate-800/60 dark:bg-slate-950/25 lg:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job posting</p>
              <div className="mt-4">
                <JobDescriptionBody
                  detail={detail}
                  editingJd={editingJd}
                  jdDraft={jdDraft}
                  savingJd={savingJd}
                  onJdChange={setJdDraft}
                  onEdit={() => setEditingJd(true)}
                  onSave={() => void onSaveJd()}
                  onCancel={() => {
                    setEditingJd(false)
                    setJdDraft(detail.job_description)
                  }}
                />
              </div>
            </Card>
          </aside>
        </div>
      ) : null}
    </motion.div>
  )
}
