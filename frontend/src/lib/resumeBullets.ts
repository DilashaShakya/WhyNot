/** Lines that commonly appear as resume bullets (markdown or plain list markers). */
export function lineLooksLikeBullet(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  return (
    /^(\u2022|[-*•◦]|\u00B7)\s/.test(t) ||
    /^\d+[.)]\s/.test(t) ||
    (t.length > 20 && !t.endsWith(':') && /^[A-Z]/.test(t) && t.includes(' '))
  )
}

export function extractBulletLines(body: string): { text: string; index: number }[] {
  const lines = body.split('\n')
  const out: { text: string; index: number }[] = []
  lines.forEach((line, index) => {
    if (lineLooksLikeBullet(line)) {
      out.push({ text: line.trimEnd(), index })
    }
  })
  return out
}

/** Replace the first line matching `originalLine` (trim-aware). */
export function replaceBulletLine(fullText: string, originalLine: string, improvedLine: string): string {
  const lines = fullText.split('\n')
  const idx = lines.findIndex((l) => l.trimEnd() === originalLine.trimEnd())
  if (idx === -1) return fullText
  const next = [...lines]
  next[idx] = improvedLine
  return next.join('\n')
}
