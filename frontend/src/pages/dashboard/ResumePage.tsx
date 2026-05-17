import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createResume, fetchResumes } from '@/api/resumes.api'
import { getApiErrors } from '@/api/errors'
import type { ResumeListItem } from '@/api/types'
import { ResumeDropzone, UploadProgressBar } from '@/components/resume/ResumeDropzone'
import { ResumeListSkeleton } from '@/components/resume/ResumeListSkeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { validatePdfFile } from '@/lib/resumePdf'

export function ResumePage() {
  const navigate = useNavigate()
  const { error: toastError, success: toastSuccess } = useToast()
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const list = await fetchResumes()
      setResumes(list)
    } catch (e) {
      setLoadError(getApiErrors(e)[0] ?? 'Could not load resumes.')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const onFile = useCallback((f: File | null) => {
    setFile(f)
    if (!f) {
      setFileError(null)
      return
    }
    const err = validatePdfFile(f)
    setFileError(err)
  }, [])

  const defaultTitle = useMemo(() => {
    if (title.trim()) return title.trim()
    if (file?.name) return file.name.replace(/\.pdf$/i, '') || 'Resume'
    return ''
  }, [title, file])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = defaultTitle
    if (!t) {
      toastError('Add a title or choose a PDF so we can name your resume.')
      return
    }
    if (!file) {
      toastError('Attach a PDF resume.')
      return
    }
    const v = validatePdfFile(file)
    if (v) {
      setFileError(v)
      return
    }

    setSubmitting(true)
    setUploadPct(0)
    try {
      const saved = await createResume({ title: t, file }, (pct) => setUploadPct(pct))
      toastSuccess('Resume uploaded and parsed.')
      setTitle('')
      setFile(null)
      setUploadPct(null)
      await load()
      navigate(`/app/resume/${saved.id}`)
    } catch (err) {
      getApiErrors(err).forEach((m) => toastError(m))
    } finally {
      setSubmitting(false)
      setUploadPct(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-10"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Resumes</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Upload a PDF. We store it securely, extract readable text on the server, and show a calm preview you can
          refine later.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">New upload</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">PDF only · 5 MB max · Parsed on save</p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="resume-title">Title</Label>
            <Input
              id="resume-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file?.name ? file.name.replace(/\.pdf$/i, '') : 'e.g. Product designer — 2025'}
              disabled={submitting}
            />
          </div>
          <ResumeDropzone file={file} onFile={onFile} disabled={submitting} error={fileError} />
          <UploadProgressBar percent={uploadPct} />
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4 border-2 border-white/40 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
                {uploadPct !== null && uploadPct < 100 ? 'Uploading…' : 'Processing…'}
              </span>
            ) : (
              'Upload & parse'
            )}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Your resumes</h2>
        {loadError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{loadError}</p> : null}
        {resumes === null ? (
          <div className="mt-4">
            <ResumeListSkeleton />
          </div>
        ) : resumes.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">No resumes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resumes.map((r) => (
              <li key={r.id}>
                <Link to={`/app/resume/${r.id}`}>
                  <Card className="p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/80">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{r.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {r.file?.filename ?? 'No file'}
                          {r.parsed_at ? ` · Parsed ${new Date(r.parsed_at).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      {r.parse_error ? (
                        <span className="text-xs text-red-600 dark:text-red-400">Parse issue</span>
                      ) : r.parsed_preview ? (
                        <span className="text-xs text-neutral-400">Preview available</span>
                      ) : null}
                    </div>
                    {r.parsed_preview ? (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {r.parsed_preview}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
