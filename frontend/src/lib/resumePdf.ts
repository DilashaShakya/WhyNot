const MAX_BYTES = 5 * 1024 * 1024

export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf') {
    return 'Please choose a PDF file.'
  }
  if (file.size > MAX_BYTES) {
    return 'PDF must be 5 MB or smaller.'
  }
  return null
}

export function splitResumeIntoSections(text: string): Array<{ heading: string; body: string }> {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((l) => l.trim())
    const first = lines[0] ?? ''
    const rest = lines.slice(1).join('\n').trim()
    const shortTitle = first.length > 0 && first.length <= 88
    const hasBodyBelow = rest.length > 0
    const looksLikeHeading =
      shortTitle && hasBodyBelow && !first.endsWith('.') && first.split(/\s+/).length <= 12

    if (looksLikeHeading) {
      return { heading: first, body: rest }
    }

    return { heading: `Section ${index + 1}`, body: block }
  })
}

/** Re-serialize sections into plain text after edits (best-effort round-trip). */
export function joinResumeSections(parts: Array<{ heading: string; body: string }>): string {
  return parts
    .map((p) => (p.heading.startsWith('Section ') && p.heading.match(/^Section \d+$/) ? p.body : `${p.heading}\n${p.body}`))
    .join('\n\n')
}

export function replaceSectionBody(fullText: string, sectionIndex: number, newBody: string): string {
  const parts = splitResumeIntoSections(fullText)
  if (!parts[sectionIndex]) return fullText
  const next = parts.map((p, i) => (i === sectionIndex ? { ...p, body: newBody } : p))
  return joinResumeSections(next)
}
