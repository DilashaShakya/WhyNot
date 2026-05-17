import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createJobApplication, fetchJobApplications } from '@/api/jobApplications.api'
import { fetchResumes } from '@/api/resumes.api'
import { getApiErrors } from '@/api/errors'
import type { JobApplicationListItem, ResumeListItem } from '@/api/types'
import { OverlapBar } from '@/components/analysis/OverlapBar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'

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
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

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
      toastSuccess('Comparison saved. Opening dashboard.')
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
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Job description</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Pair a parsed resume with the full posting. WhyNot extracts skills and keywords, compares overlap, and keeps
          a structured record you can revisit or refresh anytime.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">New comparison</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            PDF text must be available on the resume record—upload on the Resume tab if needed.
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
                  placeholder="Staff Backend Engineer"
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
                placeholder="Paste the complete posting—requirements, stack, and responsibilities."
                rows={12}
                className="min-h-[220px] resize-y font-mono text-[13px] leading-relaxed"
              />
            </div>

            <Button type="submit" disabled={submitting || !resumes?.length}>
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Saving
                </>
              ) : (
                'Save & compare'
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">How it works</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-neutral-600 dark:text-neutral-400">
              <li>Lexicon-based skill extraction from the posting and resume text.</li>
              <li>Keyword overlap with conservative stopword filtering.</li>
              <li>Experience heuristics for years and seniority language.</li>
              <li>Everything persists under your account for iterative edits.</li>
            </ol>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Want aggregate metrics? Visit{' '}
              <Link
                to="/app/analysis"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-50"
              >
                Analysis
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Saved comparisons</h2>
          {applications === null ? <Spinner className="h-4 w-4" /> : null}
        </div>
        {listError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>
        ) : null}
        {applications && applications.length === 0 ? (
          <Card className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No comparisons yet. Submit your first posting on the left.
          </Card>
        ) : null}
        <div className="grid gap-3">
          {applications?.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Link to={`/app/job/${app.id}`}>
                <Card className="p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                      <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {app.job_description_preview || '—'}
                      </p>
                    </div>
                    <div className="w-full shrink-0 sm:w-44">
                      {app.analysis_summary.state === 'none' ? (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">No analysis</p>
                      ) : app.analysis_summary.state === 'failed' ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">Needs resume text</p>
                      ) : typeof app.analysis_summary.overlap_percent === 'number' ? (
                        <OverlapBar label="Keyword cover" valuePercent={app.analysis_summary.overlap_percent} />
                      ) : (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">—</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
