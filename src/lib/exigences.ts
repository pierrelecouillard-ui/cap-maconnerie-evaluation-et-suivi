// src/lib/exigences.ts
export type ExigencesDb = Record<string, string[]>

const SEP_COMP_SUB = '::'
const SEP_NORMALIZED = ' II '

/** Doit matcher la logique du middleware */
export function normalizeKey(raw: string): string {
  if (!raw) return raw
  let compAndSub = raw

  // Si jamais une clé contient "T7 …||", on coupe à droite (robuste)
  const i = compAndSub.indexOf('||')
  if (i >= 0) compAndSub = compAndSub.slice(i + 2)

  let comp = compAndSub
  let sub = ''
  const j = compAndSub.indexOf(SEP_COMP_SUB)
  if (j >= 0) {
    comp = compAndSub.slice(0, j)
    sub  = compAndSub.slice(j + SEP_COMP_SUB.length)
  }

  comp = comp.trim().replace(/\s+/g, ' ')
  sub  = sub.trim().replace(/\s+/g, ' ')
  return sub ? `${comp} ${SEP_NORMALIZED} ${sub}` : comp
}

export async function fetchExigencesDb(): Promise<ExigencesDb> {
  const r = await fetch('/api/exigences')
  if (!r.ok) throw new Error('fetch_failed')
  const json = await r.json()
  return (json?.data ?? {}) as ExigencesDb
}

/** Ajoute (merge) une liste de critères pour une clé comp+sub (format libre) */
export async function saveCustomCriteria(
  compLabel: string,
  subLabel: string,
  criteria: string[]
): Promise<void> {
  const key = normalizeKey(`${compLabel}::${subLabel}`)
  const payload: ExigencesDb = { [key]: criteria }
  const r = await fetch('/api/exigences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error('save_failed')
}
