import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createJobApplication, deleteJobApplication, fetchJobApplications } from '@/api/jobApplications.api'
import { fetchResumes } from '@/api/resumes.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationListItem, ResumeListItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { confirmDelete } from '@/stores/confirmStore'

export function JobDescriptionPage() {
  const navigate = useNavigate()
  const { error: toastError, success: toastSuccess } = useToast()
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null)
  const [applications, setApplications] = useState<JobApplicationListItem[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const [resumeId, setResumeId] = useState<number | ''>('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setListError(null)
    try {
      const [r, j] = await Promise.all([fetchResumes(), fetchJobApplications()])
      setResumes(r)
      setApplications(j)
      setResumeId((prev) => {
        if (prev !== '') return prev
        if (!r.length) return ''
        const parsed = r.find((x) => x.parsed_at && !x.parse_error)
        return (parsed ?? r[0]).id
      })
    } catch (e) {
      setListError(getApiErrors(e)[0] ?? 'Could not load data.')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  async function onDeleteReview(app: JobApplicationListItem, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const label = [app.job_title, app.company_name].filter(Boolean).join(' · ') || 'Untitled role'
    if (!(await confirmDelete(label, 'job review'))) return
    setDeletingId(app.id)
    try {
      await deleteJobApplication(app.id)
      toastSuccess('Job review deleted.')
      await load()
    } catch (err) {
      getApiErrors(err).forEach((m) => toastError(m))
    } finally {
      setDeletingId(null)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (resumeId === '' || typeof resumeId !== 'number') {
      toastError('Select a resume.')
      return
    }
    const jd = jobDescription.trim()
    if (!jd) {
      toastError('Paste the full job description.')
      return
    }

    setSubmitting(true)
    try {
      const saved = await createJobApplication({
        resume_id: resumeId,
        job_title: jobTitle.trim() || undefined,
        company_name: companyName.trim() || undefined,
        job_description: jd,
      })
      toastSuccess('Saved. Opening review page.')
      setJobTitle('')
      setCompanyName('')
      setJobDescription('')
      await load()
      navigate(`/app/job/${saved.id}`)
    } catch (err) {
      getApiErrors(err).forEach((m) => toastError(m))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Job review</h1>
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Pair your resume with a job description, then generate honest recruiter-style AI feedback.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">New job description</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Your resume needs parsed text—upload a PDF on the Resume page first.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="resume">Resume</Label>
              <select
                id="resume"
                className="w-full rounded-md border border-neutral-200 bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900 focus-visible:border-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:text-neutral-100"
                value={resumeId === '' ? '' : String(resumeId)}
                onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : '')}
                disabled={!resumes?.length}
              >
                {!resumes?.length ? <option value="">No resumes yet</option> : null}
                {resumes?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                    {r.parse_error ? ' (parse error)' : !r.parsed_at ? ' (pending parse)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job_title">Role title</Label>
                <Input
                  id="job_title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Backend Engineer"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Labs"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job description</Label>
              <Textarea
                id="job_description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting—requirements, stack, and responsibilities."
                rows={12}
                className="min-h-[220px] resize-y font-mono text-[13px] leading-relaxed"
              />
            </div>

            <Button type="submit" disabled={submitting || !resumes?.length}>
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Saving…
                </>
              ) : (
                'Save & open review'
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">How it works</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-neutral-600 dark:text-neutral-400">
              <li>Paste a job description and pair it with your resume.</li>
              <li>Click "Generate feedback" on the review page.</li>
              <li>Get recruiter-style insights: strengths, gaps, bullet rewrites.</li>
              <li>Open the studio to apply rewrites and download your improved resume.</li>
            </ol>
          </Card>
          {!resumes?.length ? (
            <Card className="border-amber-200 bg-amber-50/50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="font-medium text-amber-900 dark:text-amber-100">No resume yet</p>
              <p className="mt-1 text-amber-800 dark:text-amber-200/80">
                <Link to="/app/resume" className="underline underline-offset-2">
                  Upload a PDF resume
                </Link>{' '}
                before adding a job.
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Saved comparisons list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Saved job reviews</h2>
          {applications === null ? <Spinner className="h-4 w-4" /> : null}
        </div>
        {listError ? <p className="text-sm text-red-600 dark:text-red-400">{listError}</p> : null}
        {applications?.length === 0 ? (
          <Card className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No job reviews yet. Save your first posting above.
          </Card>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {applications?.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600">
                <div className="flex items-start gap-3">
                  <Link to={`/app/job/${app.id}`} className="min-w-0 flex-1">
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
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => void onDeleteReview(app, e)}
                    disabled={deletingId === app.id}
                    className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {deletingId === app.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
