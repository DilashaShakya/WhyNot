import { motion } from 'framer-motion'
import { useCallback, useId, useState } from 'react'
import { cn } from '@/lib/cn'

type ResumeDropzoneProps = {
  file: File | null
  onFile: (file: File | null) => void
  disabled?: boolean
  error?: string | null
}

export function ResumeDropzone({ file, onFile, disabled, error }: ResumeDropzoneProps) {
  const inputId = useId()
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (disabled) return
      const f = e.dataTransfer.files?.[0]
      if (f) onFile(f)
    },
    [disabled, onFile],
  )

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="sr-only">
        Resume PDF
      </label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            document.getElementById(inputId)?.click()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const { clientX: x, clientY: y } = e
          if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setDragOver(false)
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDrop={onDrop}
        className={cn(
          'relative rounded-lg border border-dashed px-6 py-12 text-center transition-colors',
          dragOver && !disabled
            ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-900'
            : 'border-neutral-300 bg-[var(--color-surface-elevated)] dark:border-neutral-700',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            onFile(f)
          }}
        />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {file ? (
            <>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{file.name}</span>
              <span className="mx-2 text-neutral-400">·</span>
              <span>{(file.size / 1024).toFixed(0)} KB</span>
            </>
          ) : (
            <>
              <button
                type="button"
                className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
                onClick={() => document.getElementById(inputId)?.click()}
              >
                Choose a PDF
              </button>
              <span className="mx-1 text-neutral-500">or drag and drop</span>
              <span className="text-neutral-400">(max 5 MB)</span>
            </>
          )}
        </p>
        {file ? (
          <button
            type="button"
            className="mt-4 text-xs font-medium text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
            onClick={() => onFile(null)}
            disabled={disabled}
          >
            Remove file
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function UploadProgressBar({ percent }: { percent: number | null }) {
  if (percent === null) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5"
    >
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Uploading</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <motion.div
          className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </motion.div>
  )
}
