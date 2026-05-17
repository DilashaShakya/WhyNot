import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  createAiRejectionAnalysis,
  fetchAiRejectionAnalyses,
  fetchAiRejectionAnalysis,
  type AiRejectionAnalysisDetail,
  type AiRejectionAnalysisSummary,
} from '@/api/aiRejection.api'
import { getApiErrors } from '@/api/errors'
import { AiRejectionDetailCard } from '@/components/ai/AiRejectionDetailCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'

export function AiRejectionDashboard({ jobApplicationId }: { jobApplicationId: number }) {
  const { error: toastError, success: toastSuccess } = useToast()
  const [list, setList] = useState<AiRejectionAnalysisSummary[] | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AiRejectionAnalysisDetail | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListError(null)
    try {
      const rows = await fetchAiRejectionAnalyses(jobApplicationId)
      setList(rows)
      setSelectedId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev
        return rows[0]?.id ?? null
      })
    } catch (e) {
      setListError(getApiErrors(e)[0] ?? 'Could not load AI history.')
    }
  }, [jobApplicationId])

  useEffect(() => {
    const t = window.setTimeout(() => void loadList(), 0)
    return () => window.clearTimeout(t)
  }, [loadList])

  const loadDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true)
      try {
        const d = await fetchAiRejectionAnalysis(jobApplicationId, id)
        setDetail(d)
      } catch (e) {
        toastError(getApiErrors(e)[0] ?? 'Could not load AI run.')
      } finally {
        setDetailLoading(false)
      }
    },
    [jobApplicationId, toastError],
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!selectedId) {
        setDetail(null)
        return
      }
      void loadDetail(selectedId)
    }, 0)
    return () => window.clearTimeout(t)
  }, [selectedId, loadDetail])

  async function onGenerate() {
    setGenerating(true)
    try {
      const row = await createAiRejectionAnalysis(jobApplicationId)
      setSelectedId(row.id)
      setDetail(row)
      await loadList()
      if (row.status === 'failed') {
        toastError(row.error_message ?? 'AI feedback could not be generated. Try again.')
        return
      }
      toastSuccess('AI feedback generated.')
    } catch (e) {
      getApiErrors(e).forEach((m) => toastError(m))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            AI recruiter feedback
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Honest recruiter-style feedback: strengths, rejection risks, missing keywords, bullet rewrites, and a
            prioritized action checklist. Each run is saved so you can compare iterations.
          </p>
        </div>
        <Button type="button" onClick={() => void onGenerate()} disabled={generating}>
          {generating ? (
            <>
              <Spinner className="h-4 w-4" />
              Generating…
            </>
          ) : (
            'Generate feedback'
          )}
        </Button>
      </div>

      {listError ? <p className="text-sm text-red-600 dark:text-red-400">{listError}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit p-3">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            History
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {list === null ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-neutral-500">
                <Spinner className="h-4 w-4" />
                Loading…
              </div>
            ) : list.length === 0 ? (
              <p className="px-2 py-3 text-sm text-neutral-500 dark:text-neutral-400">No AI runs yet.</p>
            ) : (
              list.map((row) => {
                const active = row.id === selectedId
                const label = new Date(row.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <span className="block">{label}</span>
                    <span className="mt-0.5 block text-[11px] capitalize text-neutral-400 dark:text-neutral-500">
                      {row.status.replaceAll('_', ' ')}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <div>
          {detailLoading && !detail ? (
            <Card className="p-6">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Spinner className="h-4 w-4" />
                Loading analysis…
              </div>
            </Card>
          ) : !detail ? (
            <Card className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Select a history entry or generate a new AI analysis.
            </Card>
          ) : (
            <AiRejectionDetailCard detail={detail} />
          )}
        </div>
      </div>
    </motion.section>
  )
}
