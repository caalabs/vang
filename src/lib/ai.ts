import { type AiAction, type AiProvider, systemPrompt } from './prompts'
import { getAiKeys } from './store'

export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest']
export const CLAUDE_MODEL = 'claude-sonnet-5-5'
const MAX_CHARS = 5000

class Retryable extends Error {}
const TIMEOUT_MSG = 'AI phản hồi quá lâu, thử lại'
const TRUNC_MSG = 'AI trả về chưa đủ, thử lại'

async function call(url: string, headers: Record<string, string>, body: unknown, name: string, timeoutMs: number) {
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) })
  } catch (e) {
    const n = (e as Error).name
    if (n === 'TimeoutError' || n === 'AbortError') throw new Retryable(TIMEOUT_MSG)
    throw new Error(`Không kết nối được tới ${name}`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Lỗi ${name}: ${data?.error?.message ?? `HTTP ${res.status}`}`)
    throw res.status === 503 || res.status === 429 ? new Retryable(err.message) : err
  }
  return data
}

export async function runAi(provider: AiProvider, system: string, text: string): Promise<string> {
  if (text.length > MAX_CHARS) throw new Error('Tối đa 5.000 ký tự')
  const keys = await getAiKeys()
  let out = ''
  if (provider === 'gemini') {
    if (!keys.gemini) throw new Error('Chưa nhập key Gemini')
    let d: any
    for (const [i, m] of GEMINI_MODELS.entries()) {
      try {
        d = await call(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
          { 'x-goog-api-key': keys.gemini },
          { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text }] }] },
          'Gemini', 30000,
        )
        break
      } catch (e) {
        if (!(e instanceof Retryable) || i === GEMINI_MODELS.length - 1) throw e
      }
    }
    if (d.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new Error(TRUNC_MSG)
    out = (d.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('')
  } else {
    if (!keys.claude) throw new Error('Chưa nhập key Claude')
    const d = await call(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': keys.claude, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      { model: CLAUDE_MODEL, max_tokens: 16000, output_config: { effort: 'low' }, system, messages: [{ role: 'user', content: text }] },
      'Claude', 60000,
    )
    if (d.stop_reason === 'max_tokens') throw new Error(TRUNC_MSG)
    if (d.stop_reason === 'refusal') throw new Error('AI từ chối yêu cầu')
    out = (d.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('')
  }
  if (!out.trim()) throw new Error('AI không trả về nội dung')
  return out
}

export const editScript = async (provider: AiProvider, action: AiAction, text: string, instruction?: string) =>
  (await runAi(provider, systemPrompt(action, instruction), text)).trim()
