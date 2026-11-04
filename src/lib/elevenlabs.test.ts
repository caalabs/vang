import { expect, test, vi } from 'vitest'
import { ElevenError, classifyError, generateSpeech } from './elevenlabs'
import { acc } from './test-utils'

const base = { voiceId: 'v', text: 'xin chào', model: 'eleven_v4' as const, settings: { stability: 0.5 as const, speed: 1 }, now: 0 }

test('classify quota (new and legacy)', () => {
  expect(classifyError(402, { detail: { code: 'insufficient_credits' } })).toBe('quota')
  expect(classifyError(401, { detail: { status: 'quota_exceeded' } })).toBe('quota')
})
test('classify banned', () => expect(classifyError(401, { detail: { status: 'detected_unusual_activity', message: 'Unusual activity detected' } })).toBe('banned'))
test('classify invalid key', () => expect(classifyError(401, { detail: { status: 'invalid_api_key' } })).toBe('invalid_key'))
test('classify real invalid key body', () =>
  expect(classifyError(401, { detail: { type: 'authentication_error', code: 'unauthorized', message: 'Invalid API key', status: 'invalid_api_key' } })).toBe('invalid_key'))
test('classify other', () => expect(classifyError(500, {})).toBe('other'))
test('rotates on quota then succeeds', async () => {
  const ttsFn = vi.fn().mockRejectedValueOnce(new ElevenError('quota')).mockResolvedValueOnce(new Blob(['x']))
  const r = await generateSpeech({ ...base, accounts: [acc({ id: 'a1', used: 9000 }), acc({ id: 'a2' })], ttsFn })
  expect(r.accountId).toBe('a2'); expect(r.updates).toEqual({ a1: 'empty' })
})
test('stops when all exhausted', async () => {
  const ttsFn = vi.fn().mockRejectedValue(new ElevenError('quota'))
  await expect(generateSpeech({ ...base, accounts: [acc({ id: 'a1' }), acc({ id: 'a2' })], ttsFn })).rejects.toThrow('Hết credit ở tất cả account')
  expect(ttsFn).toHaveBeenCalledTimes(2)
})
test('all_exhausted error carries updates for every tried account', async () => {
  const ttsFn = vi.fn().mockRejectedValue(new ElevenError('quota'))
  const e = await generateSpeech({ ...base, accounts: [acc({ id: 'a1' }), acc({ id: 'a2' })], ttsFn }).catch((x) => x)
  expect(e.kind).toBe('all_exhausted'); expect(e.updates).toEqual({ a1: 'empty', a2: 'empty' })
})
test('invalid_key marks banned and rotates; rethrow carries updates', async () => {
  const ttsFn = vi.fn().mockRejectedValueOnce(new ElevenError('invalid_key')).mockRejectedValueOnce(new ElevenError('other', 'HTTP 500'))
  const e = await generateSpeech({ ...base, accounts: [acc({ id: 'a1' }), acc({ id: 'a2' })], ttsFn }).catch((x) => x)
  expect(e.message).toBe('HTTP 500'); expect(e.updates).toEqual({ a1: 'banned' })
})
test('banned marks banned; other errors throw', async () => {
  const ttsFn = vi.fn().mockRejectedValueOnce(new ElevenError('banned')).mockRejectedValueOnce(new ElevenError('other'))
  await expect(generateSpeech({ ...base, accounts: [acc({ id: 'a1' }), acc({ id: 'a2' })], ttsFn })).rejects.toThrow()
  expect(ttsFn).toHaveBeenCalledTimes(2)
})
test('flash sends text without tags', async () => {
  const ttsFn = vi.fn().mockResolvedValue(new Blob(['x']))
  await generateSpeech({ ...base, text: '[excited] Xin chào', model: 'eleven_flash_v2_5', accounts: [acc({})], ttsFn })
  expect(ttsFn.mock.calls[0][2]).toBe('Xin chào')
})
