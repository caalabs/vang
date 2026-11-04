import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('./store', () => ({ getAiKeys: async () => ({ gemini: 'g', claude: 'c' }) }))
import { runAi } from './ai'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const fail = (status: number) => new Response(JSON.stringify({ error: { message: 'boom' } }), { status })
const gem = (text: string, finishReason = 'STOP') => ok({ candidates: [{ finishReason, content: { parts: [{ text }] } }] })
const stub = (...rs: (Response | Error)[]) => {
  const f = vi.fn(async () => { const r = rs.shift()!; if (r instanceof Error) throw r; return r })
  vi.stubGlobal('fetch', f)
  return f
}
const urlOf = (f: ReturnType<typeof stub>, i: number) => String((f.mock.calls[i] as unknown[])[0])
beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

test('gemini falls back on 503', async () => {
  const f = stub(fail(503), gem('xin chào'))
  expect(await runAi('gemini', 's', 't')).toBe('xin chào')
  expect(urlOf(f, 0)).toContain('gemini-2.5-flash')
  expect(urlOf(f, 1)).toContain('gemini-flash-latest')
})
test('gemini falls back on timeout', async () => {
  stub(new DOMException('t', 'TimeoutError'), gem('ok'))
  expect(await runAi('gemini', 's', 't')).toBe('ok')
})
test('gemini does not fall back on 400', async () => {
  const f = stub(fail(400))
  await expect(runAi('gemini', 's', 't')).rejects.toThrow('Lỗi Gemini: boom')
  expect(f).toHaveBeenCalledTimes(1)
})
test('timeout on last model maps to Vietnamese', async () => {
  stub(fail(503), new DOMException('t', 'TimeoutError'))
  await expect(runAi('gemini', 's', 't')).rejects.toThrow('AI phản hồi quá lâu, thử lại')
})
test('gemini MAX_TOKENS is truncation', async () => {
  stub(gem('x', 'MAX_TOKENS'))
  await expect(runAi('gemini', 's', 't')).rejects.toThrow('AI trả về chưa đủ, thử lại')
})
test('claude max_tokens is truncation', async () => {
  stub(ok({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'x' }] }))
  await expect(runAi('claude', 's', 't')).rejects.toThrow('AI trả về chưa đủ, thử lại')
})
test('claude joins text blocks', async () => {
  stub(ok({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }))
  expect(await runAi('claude', 's', 't')).toBe('ab')
})
test('network failure is Vietnamese', async () => {
  stub(new TypeError('Failed to fetch'))
  await expect(runAi('claude', 's', 't')).rejects.toThrow('Không kết nối được tới Claude')
})
test('rejects over 5000 chars before fetching', async () => {
  const f = stub()
  await expect(runAi('claude', 's', 'a'.repeat(5001))).rejects.toThrow('Tối đa 5.000 ký tự')
  expect(f).not.toHaveBeenCalled()
})
