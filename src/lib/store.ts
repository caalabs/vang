import { get, set, update } from 'idb-keyval'
import { mergeBackup } from './keys'
import type { Account, AccountStatus, HistoryItem, Settings } from './types'

export type AiKeys = { gemini: string; claude: string }

export const getAccounts = async () => (await get<Account[]>('accounts')) ?? []
export const saveAccounts = (a: Account[]) => set('accounts', a)

export async function applyStatusUpdates(updates: Partial<Record<string, AccountStatus>>) {
  const list = await getAccounts()
  await saveAccounts(list.map((a) => (updates[a.id] ? { ...a, status: updates[a.id]! } : a)))
}

export const DEFAULT_SETTINGS: Settings = { voiceId: 'pNInz6obpgDQGcFmaJgB', voiceName: 'Adam', draft: false, voice: { stability: 0.5, speed: 1 }, aiProvider: 'gemini' }
export const getSettings = async (): Promise<Settings> => ({ ...DEFAULT_SETTINGS, ...(await get<Settings>('settings')) })
export const saveSettings = (s: Settings) => set('settings', s)
export const getDraft = async () => (await get<string>('draft')) ?? ''
export const saveDraft = (t: string) => set('draft', t)

// shortcut: whole history in one key (read-modify-write), fine for hundreds of items; split per-item if it grows.
const getHistory = async () => (await get<HistoryItem[]>('history')) ?? []
export const listHistory = async () => (await getHistory()).sort((a, b) => b.createdAt - a.createdAt)
export const addHistory = (h: HistoryItem) => update<HistoryItem[]>('history', (l) => [...(l ?? []), h])
export const deleteHistory = (id: string) => update<HistoryItem[]>('history', (l) => (l ?? []).filter((h) => h.id !== id))

export const getAiKeys = async (): Promise<AiKeys> => ({ gemini: '', claude: '', ...(await get<AiKeys>('aiKeys')) })
export const saveAiKeys = (k: AiKeys) => set('aiKeys', k)

export async function exportBackup() {
  const [accounts, aiKeys] = await Promise.all([getAccounts(), getAiKeys()])
  return new Blob([JSON.stringify({ version: 1, accounts, aiKeys })], { type: 'application/json' })
}

export async function importBackup(file: File): Promise<number> {
  let data: { accounts?: unknown; aiKeys?: Partial<AiKeys> }
  try { data = JSON.parse(await file.text()) } catch { throw new Error('File backup không hợp lệ') }
  if (!data || typeof data !== 'object') throw new Error('File backup không hợp lệ')
  const list = await getAccounts()
  const merged = mergeBackup(list, data.accounts)
  await saveAccounts(merged)
  const cur = await getAiKeys()
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  await saveAiKeys({ gemini: cur.gemini || s(data.aiKeys?.gemini), claude: cur.claude || s(data.aiKeys?.claude) })
  return merged.length - list.length
}
