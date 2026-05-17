import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchJobApplications } from '@/api/jobApplications.api'
import { getApiErrors } from '@/api/errors'
import {
  fetchResumeStudio,
  fetchResumeStudioRewrites,
  fetchResumeStudioVersions,
  saveResumeStudioVersion,
  studioBulletRewrite,
  studioImpactScan,
  studioTailoring,
  studioWritingInsights,
  type BulletRewriteResult,
  type ImpactScanResult,
  type ResumeStudioRewrite,
  type ResumeStudioVersion,
  type ResumeWritingInsightsResult,
  type TailoringResult,
} from '@/api/resumeStudio.api'
import { fetchResume, fetchResumes } from '@/api/resumes.api'
import type { JobApplicationListItem, ResumeListItem } from '@/api/types'
import { ResumeWritingInsightsPanel } from '@/components/resume-studio/ResumeWritingInsightsPanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { extractBulletLines, replaceBulletLine } from '@/lib/resumeBullets'
import { cn } from '@/lib/cn'
import { splitResumeIntoSections } from '@/lib/resumePdf'

function StudioCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function ResumeOptimizationStudioPage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [jobs, setJobs] = useState<JobApplicationListItem[]>([])
  const [resumeId, setResumeId] = useState<number | null>(null)
  const [jobId, setJobId] = useState<number | null>(null)
  const [workingText, setWorkingText] = useState('')
  const [sectionIdx, setSectionIdx] = useState(0)
  const [selectedBullet, setSelectedBullet] = useState<string | null>(null)
  const [baselineNotice, setBaselineNotice] = useState<string | null>(null)

  const [bulletResult, setBulletResult] = useState<BulletRewriteResult | null>(null)
  const [writingInsightsResult, setWritingInsightsResult] = useState<ResumeWritingInsightsResult | null>(null)
  const [tailoringResult, setTailoringResult] = useState<TailoringResult | null>(null)
  const [impactResult, setImpactResult] = useState<ImpactScanResult | null>(null)
  const writingInsightsRef = useRef<HTMLDivElement>(null)

  const [versions, setVersions] = useState<ResumeStudioVersion[]>([])
  const [rewrites, setRewrites] = useState<ResumeStudioRewrite[]>([])

  const [loadingBoot, setLoadingBoot] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Auto-fetch insights once per resume + target job; avoids refetch on every keystroke. */
  const insightsFetchKeyRef = useRef<string | null>(null)

  const jobOpt = jobId ?? undefined

  const sections = useMemo(() => splitResumeIntoSections(workingText), [workingText])
  const activeSection = sections[sectionIdx]
  const bulletsInSection = useMemo(
    () => (activeSection ? extractBulletLines(activeSection.body) : []),
    [activeSection],
  )

  const jobsForResume = useMemo(
    () => (resumeId ? jobs.filter((j) => j.resume_id === resumeId) : []),
    [jobs, resumeId],
  )

  const loadLists = useCallback(async () => {
    try {
      const [r, j] = await Promise.all([fetchResumes(), fetchJobApplications()])
      setResumes(r)
      setJobs(j)
      setResumeId((prev) => {
        if (prev && r.some((x) => x.id === prev)) return prev
        return r[0]?.id ?? null
      })
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load data.')
    }
  }, [])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  const hydrateStudio = useCallback(async (id: number) => {
    setLoadingBoot(true)
    setError(null)
    setBaselineNotice(null)
    setWritingInsightsResult(null)
    try {
      const studio = await fetchResumeStudio(id)
      const detail = await fetchResume(id)
      const text =
        studio.latest_version?.body_text ?? studio.baseline_parsed_text ?? detail.parsed_text ?? ''
      setWorkingText(text)
      if (!detail.parsed_text?.trim()) {
        setBaselineNotice('This resume has no parsed text yet. Upload a PDF on the Resume page first.')
      } else if (!studio.latest_version && studio.baseline_parsed_text) {
        setBaselineNotice('Editing a copy of your parsed resume. Save a version anytime to track changes.')
      }
      const [v, rw] = await Promise.all([fetchResumeStudioVersions(id), fetchResumeStudioRewrites(id)])
      setVersions(v)
      setRewrites(rw)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not open studio.')
    } finally {
      setLoadingBoot(false)
    }
  }, [])

  useEffect(() => {
    if (!resumeId) {
      setLoadingBoot(false)
      return
    }
    void hydrateStudio(resumeId)
  }, [resumeId, hydrateStudio])

  useEffect(() => {
    if (!jobId || !resumeId) return
    const ok = jobsForResume.some((j) => j.id === jobId)
    if (!ok) setJobId(null)
  }, [resumeId, jobId, jobsForResume])

  useEffect(() => {
    insightsFetchKeyRef.current = null
  }, [resumeId])

  useEffect(() => {
    if (sectionIdx >= sections.length) {
      setSectionIdx(Math.max(0, sections.length - 1))
    }
  }, [sections.length, sectionIdx])

  const runWritingInsights = useCallback(async () => {
    if (!resumeId) {
      setError('Choose a resume first.')
      return
    }
    const body = workingText.trim()
    if (!body) {
      setError('Add resume text to the working copy first.')
      return
    }
    setBusy('writing')
    setError(null)
    setWritingInsightsResult(null)
    try {
      const r = await studioWritingInsights(resumeId, {
        resume_body: workingText,
        job_application_id: jobOpt,
      })
      setWritingInsightsResult(r)
      const rw = await fetchResumeStudioRewrites(resumeId)
      setRewrites(rw)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Writing insights failed.')
    } finally {
      setBusy(null)
    }
  }, [resumeId, workingText, jobOpt])

  useEffect(() => {
    if (loadingBoot || !resumeId || !workingText.trim()) return
    const key = `${resumeId}:${jobId ?? ''}`
    if (insightsFetchKeyRef.current === key) return
    insightsFetchKeyRef.current = key
    void runWritingInsights()
  }, [loadingBoot, resumeId, jobId, workingText, runWritingInsights])

  const runBulletRewrite = async () => {
    if (!resumeId || !selectedBullet?.trim()) {
      setError('Select a bullet from the list first.')
      return
    }
    setBusy('bullet')
    setError(null)
    try {
      const r = await studioBulletRewrite(resumeId, {
        bullet_text: selectedBullet,
        section_heading: activeSection?.heading,
        job_application_id: jobOpt,
      })
      setBulletResult(r)
      const rw = await fetchResumeStudioRewrites(resumeId)
      setRewrites(rw)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Rewrite failed.')
    } finally {
      setBusy(null)
    }
  }

  const runTailoring = async () => {
    if (!resumeId || !jobId) {
      setError('Select a job posting to tailor against.')
      return
    }
    setBusy('tailor')
    setError(null)
    try {
      const r = await studioTailoring(resumeId, { resume_body: workingText, job_application_id: jobId })
      setTailoringResult(r)
      const rw = await fetchResumeStudioRewrites(resumeId)
      setRewrites(rw)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Tailoring failed.')
    } finally {
      setBusy(null)
    }
  }

  const runImpact = async () => {
    if (!resumeId) return
    setBusy('impact')
    setError(null)
    try {
      const r = await studioImpactScan(resumeId, { resume_body: workingText, job_application_id: jobOpt })
      setImpactResult(r)
      const rw = await fetchResumeStudioRewrites(resumeId)
      setRewrites(rw)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Impact scan failed.')
    } finally {
      setBusy(null)
    }
  }

  const saveVersion = async () => {
    if (!resumeId) return
    setBusy('save')
    setError(null)
    try {
      const v = await saveResumeStudioVersion(resumeId, {
        body_text: workingText,
        label: `Save ${new Date().toLocaleString()}`,
        source: 'manual',
        job_application_id: jobOpt,
      })
      setVersions((prev) => [v, ...prev])
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not save version.')
    } finally {
      setBusy(null)
    }
  }

  const applyBullet = () => {
    if (!selectedBullet || !bulletResult?.improved_bullet) return
    setWorkingText((t) => replaceBulletLine(t, selectedBullet, bulletResult.improved_bullet))
    setBulletResult(null)
  }

  const restoreVersion = (body: string) => {
    insightsFetchKeyRef.current = null
    setWorkingText(body)
  }

  const resetFromBaseline = async () => {
    if (!resumeId) return
    try {
      const d = await fetchResume(resumeId)
      insightsFetchKeyRef.current = null
      setWorkingText(d.parsed_text ?? '')
      setBaselineNotice('Reset to PDF-derived text.')
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not reload resume.')
    }
  }

  if (!loadingBoot && resumes.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Add a resume to use the studio.</p>
        <Link
          to="/app/resume"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Go to resumes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">WhyNot</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Resume Optimization Studio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Requirements-style insights load automatically for your working copy (refresh after big edits). Tailor bullets,
          save versions—grounded suggestions only, no invented metrics.
        </p>
      </header>

      {baselineNotice ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{baselineNotice}</p>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Resume
          <select
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-normal normal-case text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            value={resumeId ?? ''}
            onChange={(e) => setResumeId(Number(e.target.value) || null)}
            disabled={loadingBoot}
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Target job (optional)
          <select
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-normal normal-case text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            value={jobId ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setJobId(v ? Number(v) : null)
            }}
          >
            <option value="">None — general optimization</option>
            {jobsForResume.map((j) => (
              <option key={j.id} value={j.id}>
                {(j.job_title || 'Role').trim()}
                {j.company_name ? ` · ${j.company_name}` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void resetFromBaseline()} disabled={!resumeId}>
            Reset from PDF text
          </Button>
        </div>
      </div>

      {loadingBoot ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spinner className="h-4 w-4" />
          Loading studio…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div ref={writingInsightsRef} className="scroll-mt-24 space-y-4">
              <ResumeWritingInsightsPanel
                loading={busy === 'writing'}
                result={writingInsightsResult}
                hasTargetJob={!!jobId}
                onDismiss={() => setWritingInsightsResult(null)}
              />
            </div>

            <StudioCard>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Working copy</h2>
                <Button type="button" variant="secondary" onClick={() => void saveVersion()} disabled={!!busy}>
                  {busy === 'save' ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Saving
                    </>
                  ) : (
                    'Save version'
                  )}
                </Button>
              </div>
              <textarea
                value={workingText}
                onChange={(e) => setWorkingText(e.target.value)}
                spellCheck
                className="min-h-[220px] w-full resize-y rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-100"
                placeholder="Paste or edit resume text…"
              />
            </StudioCard>

            <StudioCard>
              <h2 className="text-sm font-semibold">Sections & bullets</h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Pick a section, then a bullet, to run a side-by-side rewrite.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sections.map((s, i) => (
                  <button
                    key={`${s.heading}-${i}`}
                    type="button"
                    onClick={() => {
                      setSectionIdx(i)
                      setSelectedBullet(null)
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      i === sectionIdx
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-200',
                    )}
                  >
                    {s.heading.length > 32 ? `${s.heading.slice(0, 30)}…` : s.heading}
                  </button>
                ))}
              </div>
              {activeSection ? (
                <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  {bulletsInSection.length === 0 ? (
                    <li className="text-sm text-neutral-500">No bullet-like lines detected in this section.</li>
                  ) : (
                    bulletsInSection.map((b) => (
                      <li key={b.index}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBullet(b.text)
                            setBulletResult(null)
                          }}
                          className={cn(
                            'w-full rounded-md border px-3 py-2 text-left text-sm leading-snug transition-colors',
                            selectedBullet === b.text
                              ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-900'
                              : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-700',
                          )}
                        >
                          {b.text}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </StudioCard>

            {(selectedBullet || bulletResult) && (
              <StudioCard>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="min-h-[120px] flex-1 rounded-md border border-neutral-200 bg-neutral-50/30 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Before</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {selectedBullet ?? '—'}
                    </p>
                  </div>
                  <div className="min-h-[120px] flex-1 rounded-md border border-neutral-900/20 bg-white p-4 dark:border-neutral-100/20 dark:bg-neutral-950">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">After</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900 dark:text-neutral-50">
                      {bulletResult?.improved_bullet ?? 'Run rewrite to see a suggestion.'}
                    </p>
                    {bulletResult?.rationale ? (
                      <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {bulletResult.rationale}
                      </p>
                    ) : null}
                    {bulletResult?.verification_prompts?.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-400">
                        {bulletResult.verification_prompts.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void runBulletRewrite()} disabled={!!busy || !selectedBullet}>
                    {busy === 'bullet' ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Rewriting
                      </>
                    ) : (
                      'Generate rewrite'
                    )}
                  </Button>
                  {bulletResult ? (
                    <Button type="button" variant="secondary" onClick={applyBullet}>
                      Apply to working copy
                    </Button>
                  ) : null}
                </div>
              </StudioCard>
            )}

          </div>

          <aside className="space-y-4">
            <StudioCard className="p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Actions</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void runWritingInsights()}
                  disabled={!!busy || !workingText.trim()}
                >
                  {busy === 'writing' ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Refreshing…
                    </>
                  ) : (
                    'Refresh insights'
                  )}
                </Button>
                <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                  Insights load automatically when you open the studio or change the target job. Use refresh after large
                  edits to the working copy.
                </p>
                <Button type="button" variant="secondary" onClick={() => void runTailoring()} disabled={!!busy || !jobId}>
                  {busy === 'tailor' ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Tailoring…
                    </>
                  ) : (
                    'Tailor to selected job'
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={() => void runImpact()} disabled={!!busy}>
                  {busy === 'impact' ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Scanning…
                    </>
                  ) : (
                    'Impact & metrics scan'
                  )}
                </Button>
              </div>
            </StudioCard>

            <StudioCard className="p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Guidance</h2>
              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {tailoringResult?.executive_summary_angle ? (
                  <p>
                    <span className="font-medium text-neutral-900 dark:text-neutral-200">Positioning: </span>
                    {tailoringResult.executive_summary_angle}
                  </p>
                ) : null}
                {tailoringResult?.skills_to_emphasize?.length ? (
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">Skills to emphasize</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {tailoringResult.skills_to_emphasize.map((s) => (
                        <li key={s.skill}>
                          {s.skill} — {s.why}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {tailoringResult?.projects_to_raise?.length ? (
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">Projects to raise</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {tailoringResult.projects_to_raise.map((p) => (
                        <li key={p.project_hint}>
                          {p.project_hint} — {p.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {impactResult?.weak_bullets?.length ? (
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">Impact opportunities</p>
                    <ul className="mt-2 space-y-2">
                      {impactResult.weak_bullets.slice(0, 6).map((w) => (
                        <li key={w.excerpt} className="rounded border border-neutral-100 p-2 dark:border-neutral-800">
                          <p className="text-neutral-500">&ldquo;{w.excerpt}&rdquo;</p>
                          <p className="mt-1 text-neutral-700 dark:text-neutral-300">{w.suggested_direction}</p>
                          <p className="mt-1 text-neutral-500">{w.metric_prompt}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {!tailoringResult && !impactResult?.weak_bullets?.length ? (
                  <p className="text-neutral-500">Run tailoring (with a job) or impact scan to populate this panel.</p>
                ) : null}
              </div>
            </StudioCard>

            <details className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 marker:content-none [&::-webkit-details-marker]:hidden">
                Version history ({versions.length})
              </summary>
              <div className="border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-start justify-between gap-2">
                      <span className="text-neutral-600 dark:text-neutral-400">{v.label}</span>
                      <button
                        type="button"
                        className="shrink-0 text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
                        onClick={() => restoreVersion(v.body_text)}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                  {versions.length === 0 ? <li className="text-neutral-500">No saved versions yet.</li> : null}
                </ul>
              </div>
            </details>

            <details className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 marker:content-none [&::-webkit-details-marker]:hidden">
                Rewrite history ({rewrites.length})
              </summary>
              <div className="border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-neutral-600 dark:text-neutral-400">
                  {rewrites.slice(0, 20).map((r) => (
                    <li key={r.id}>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{r.prompt_kind}</span>{' '}
                      · {new Date(r.created_at).toLocaleString()}
                    </li>
                  ))}
                  {rewrites.length === 0 ? <li className="text-neutral-500">No AI rewrites logged yet.</li> : null}
                </ul>
              </div>
            </details>
          </aside>
        </div>
      )}
    </div>
  )
}
