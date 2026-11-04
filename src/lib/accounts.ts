import type { Account, ModelId } from './types'

export const MODEL_FULL: ModelId = 'eleven_v4'
export const MODEL_DRAFT = 'eleven_flash_v2_5'
export const FLASH_RATE = 0.5

export const stripTags = (text: string) => text.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()

export const textForModel = (text: string, model: ModelId) => (model === MODEL_DRAFT ? stripTags(text) : text)

export const estimateCredits = (text: string, model: ModelId) =>
  Math.ceil(textForModel(text, model).length * (model === MODEL_DRAFT ? FLASH_RATE : 1))

export const remaining = (a: Account) => a.limit - a.used

const pastReset = (a: Account, now: number) => a.status === 'empty' && a.resetAt !== null && a.resetAt <= now

export const isUsable = (a: Account, now: number) => a.status === 'ok' || pastReset(a, now)

export function pickAccount(accounts: Account[], needed: number, now: number, exclude: Set<string>): Account | null {
  let best: Account | null = null
  let bestRem = Infinity
  for (const a of accounts) {
    if (exclude.has(a.id) || !isUsable(a, now)) continue
    const rem = pastReset(a, now) ? a.limit : remaining(a)
    if (rem >= needed && rem < bestRem) { best = a; bestRem = rem }
  }
  return best
}

/** Total spendable credit; an empty account past its reset counts as its full limit (same rule as pickAccount). */
export const totalCredits = (accounts: Account[], now: number) =>
  accounts.reduce((s, a) => (isUsable(a, now) ? s + (pastReset(a, now) ? a.limit : remaining(a)) : s), 0)
