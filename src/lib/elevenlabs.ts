import { estimateCredits, pickAccount, textForModel } from './accounts'
import type { Account, AccountStatus, ModelId, Voice, VoiceSettings } from './types'

const BASE = 'https://api.elevenlabs.io'
const ADAM = 'pNInz6obpgDQGcFmaJgB'

export class ElevenError extends Error {
  kind: string
  updates?: Partial<Record<string, AccountStatus>>
  constructor(kind: string, message?: string) {
    super(message ?? (kind === 'all_exhausted' ? 'Hết credit ở tất cả account' : kind))
    this.kind = kind
  }
}

export function classifyError(status: number, body: unknown): 'quota' | 'banned' | 'invalid_key' | 'other' {
  const d = (body as { detail?: Record<string, unknown> | string } | null)?.detail
  const s = (typeof d === 'string' ? d : [d?.code, d?.status, d?.message].join(' ')).toLowerCase()
  if (/insufficient_credits|quota_exceeded/.test(s)) return 'quota'
  if (/unusual_activity|unusual activity/.test(s)) return 'banned'
  if (/invalid_api_key/.test(s) || status === 401) return 'invalid_key'
  return 'other'
}

async function fail(r: Response): Promise<never> {
  const body = await r.json().catch(() => null)
  const d = (body as { detail?: { message?: string } | string } | null)?.detail
  throw new ElevenError(classifyError(r.status, body), (typeof d === 'string' ? d : d?.message) || `HTTP ${r.status}`)
}

export async function getSubscription(key: string): Promise<{ used: number; limit: number; resetAt: number | null; status: AccountStatus }> {
  const r = await fetch(`${BASE}/v1/user/subscription`, { headers: { 'xi-api-key': key } })
  if (!r.ok) return fail(r)
  const j = await r.json()
  const used: number = j.character_count
  const limit: number = j.character_limit
  const reset = j.next_character_count_reset_unix
  return {
    used, limit,
    resetAt: reset ? reset * 1000 : null,
    status: j.status === 'free_disabled' ? 'banned' : used >= limit ? 'empty' : 'ok',
  }
}

export async function listVoices(key: string): Promise<Voice[]> {
  const r = await fetch(`${BASE}/v1/voices`, { headers: { 'xi-api-key': key } })
  if (!r.ok) return fail(r)
  const voices: Voice[] = ((await r.json()).voices as Voice[]).map((v) => ({ voice_id: v.voice_id, name: v.name, preview_url: v.preview_url ?? null }))
  return [...voices.filter((v) => v.voice_id === ADAM), ...voices.filter((v) => v.voice_id !== ADAM)]
}

export async function tts(key: string, voiceId: string, text: string, model: ModelId, settings: VoiceSettings): Promise<Blob> {
  const r = await fetch(`${BASE}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: model, voice_settings: settings }),
  })
  if (!r.ok) return fail(r)
  return r.blob()
}

export async function generateSpeech(args: {
  accounts: Account[]; voiceId: string; text: string; model: ModelId; settings: VoiceSettings; now: number
  onTry?: (a: Account) => void; ttsFn?: typeof tts
}): Promise<{ audio: Blob; accountId: string; updates: Partial<Record<string, AccountStatus>> }> {
  const { accounts, voiceId, text, model, settings, now, onTry, ttsFn = tts } = args
  const needed = estimateCredits(text, model)
  const tried = new Set<string>()
  const updates: Partial<Record<string, AccountStatus>> = {}
  try {
    for (;;) {
      const a = pickAccount(accounts, needed, now, tried)
      if (!a) throw new ElevenError('all_exhausted')
      tried.add(a.id)
      onTry?.(a)
      try {
        const audio = await ttsFn(a.key, voiceId, textForModel(text, model), model, settings)
        return { audio, accountId: a.id, updates }
      } catch (e) {
        const kind = e instanceof ElevenError ? e.kind : ''
        if (kind === 'quota') updates[a.id] = 'empty'
        else if (kind === 'banned' || kind === 'invalid_key') updates[a.id] = 'banned'
        else throw e
      }
    }
  } catch (e) {
    // callers need the statuses learned before the throw
    if (e && typeof e === 'object') (e as ElevenError).updates = updates
    throw e
  }
}
