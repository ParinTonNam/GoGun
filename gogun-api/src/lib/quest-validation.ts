export function questDraft(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (typeof b.title !== 'string' || !b.title.trim() || b.title.trim().length > 100) return null
  if (typeof b.description !== 'string' || b.description.length > 1000) return null
  if (!Array.isArray(b.targets) || b.targets.length < 1 || b.targets.length > 12) return null
  if (b.targets.some(t => typeof t !== 'string' || !t.trim() || t.trim().length > 80)) return null
  const targets = b.targets.map(t => (t as string).trim())
  if (new Set(targets.map(t => t.toLocaleLowerCase())).size !== targets.length) return null
  return { title: b.title.trim(), description: b.description.trim(), targets }
}
export function validCompleted(value: unknown, targetCount: number): value is number[] {
  return Array.isArray(value) && value.length <= targetCount && new Set(value).size === value.length && value.every(n => Number.isInteger(n) && n >= 0 && n < targetCount)
}
