import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchResume } from '@/api/resumes.api'
import { getApiErrors } from '@/api/errors'
import type { ResumeDetail } from '@/api/types'
import { ParsedResumePreview } from '@/components/resume/ParsedResumePreview'
import { ResumeListSkeleton } from '@/components/resume/ResumeListSkeleton'
import { Card } from '@/components/ui/Card'

export function ResumeDetailPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const id = Number(resumeId)
  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Invalid resume.')
      return
    }
    setError(null)
    try {
      const data = await fetchResume(id)
      setResume(data)
    } catch (e) {
      setError(getApiErrors(e)[0] ?? 'Could not load resume.')
    }
  }, [id])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  if (!Number.isFinite(id)) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Invalid link. <Link to="/app/resume">Back to resumes</Link>
      </p>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/resume"
          className="text-xs font-medium text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
        >
          ← Resumes
        </Link>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <ResumeListSkeleton />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div>
        <Link
          to="/app/resume"
          className="text-xs font-medium text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
        >
          ← Resumes
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {resume.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          {resume.file ? (
            <>
              <span>{resume.file.filename}</span>
              <span>{(resume.file.byte_size / 1024).toFixed(0)} KB</span>
            </>
          ) : (
            <span>No file</span>
          )}
          {resume.parsed_at ? <span>Parsed {new Date(resume.parsed_at).toLocaleString()}</span> : null}
        </div>
      </div>

      {resume.parse_error ? (
        <Card className="border-red-200 bg-red-50/50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-red-300">
            Could not parse PDF
          </p>
          <p className="mt-2 text-sm text-red-900 dark:text-red-200">{resume.parse_error}</p>
        </Card>
      ) : null}

      <Card className="p-6 md:p-8">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Extracted content</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Automatically split into sections from paragraph breaks. Edit flow can come later.
        </p>
        <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <ParsedResumePreview text={resume.parsed_text} />
        </div>
      </Card>
    </motion.div>
  )
}
