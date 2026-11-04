import { ElevenError, getSubscription } from './elevenlabs'
import type { Account, AccountStatus } from './types'

export function parseKeys(input: string, existing: Account[]): { fresh: string[]; duplicates: string[] } {
  const have = new Set(existing.map((a) => a.key))
  const fresh: string[] = []
  const duplicates: string[] = []
  for (const k of new Set(input.split('\n').map((s) => s.trim()).filter(Boolean))) (have.has(k) ? duplicates : fresh).push(k)
  return { fresh, duplicates }
}

export const nextLabel = (existing: Account[]) =>
  `Acc ${Math.max(0, ...existing.map((a) => Number(/^Acc (\d+)$/.exec(a.label)?.[1] ?? 0))) + 1}`

export const needsRefresh = (a: Account, now: number) => now - a.checkedAt > 10 * 60_000

export const maskKey = (k: string) => `${k.slice(0, 3)}…${k.slice(-4)}`

/** Throws on network/other errors so the caller can keep the old account and tell the user. */
export async function refreshAccount(a: Account): Promise<Account> {
  try {
    return { ...a, ...(await getSubscription(a.key)), checkedAt: Date.now() }
  } catch (e) {
    if (e instanceof ElevenError && (e.kind === 'invalid_key' || e.kind === 'banned')) return { ...a, status: 'banned', checkedAt: Date.now() }
    throw e
  }
}

export const statusDot = (a: Account): '🟢' | '🟡' | '🔴' => (a.status === 'ok' ? '🟢' : a.status === 'empty' ? '🟡' : '🔴')

const STATUSES: AccountStatus[] = ['ok', 'empty', 'banned']

/** Merge backup accounts into existing: normalise fields, drop keys already present (also within the batch). */
export function mergeBackup(existing: Account[], incoming: unknown): Account[] {
  if (!Array.isArray(incoming)) throw new Error('File backup không hợp lệ')
  const out = [...existing]
  const keys = new Set(existing.map((a) => a.key))
  const ids = new Set(existing.map((a) => a.id))
  for (const raw of incoming) {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const key = typeof r.key === 'string' ? r.key.trim() : ''
    if (!key || keys.has(key)) continue
    const id = typeof r.id === 'string' && r.id && !ids.has(r.id) ? r.id : crypto.randomUUID()
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
    out.push({
      id, key,
      label: typeof r.label === 'string' && r.label.trim() ? r.label : nextLabel(out),
      used: num(r.used, 0), limit: num(r.limit, 10000),
      resetAt: typeof r.resetAt === 'number' && Number.isFinite(r.resetAt) ? r.resetAt : null,
      status: STATUSES.includes(r.status as AccountStatus) ? (r.status as AccountStatus) : 'ok',
      checkedAt: 0,
    })
    keys.add(key); ids.add(id)
  }
  return out
}
