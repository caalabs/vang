import { expect, test } from 'vitest'
import { FLASH_RATE, estimateCredits, pickAccount, stripTags, totalCredits } from './accounts'
import { acc } from './test-utils'

test('stripTags', () => expect(stripTags('[excited] Xin  chào [laughs]bạn')).toBe('Xin chào bạn'))
test('v4 counts tags', () => expect(estimateCredits('[excited] abc', 'eleven_v4')).toBe(13))
test('flash strips tags before counting', () => expect(estimateCredits('[excited] abc', 'eleven_flash_v2_5')).toBe(Math.ceil(3 * FLASH_RATE)))
test('picks tightest fitting account', () => {
  const r = pickAccount([acc({ id: 'big', used: 0 }), acc({ id: 'small', used: 9000 })], 500, 0, new Set())
  expect(r?.id).toBe('small')
})
test('skips account without enough credit', () => expect(pickAccount([acc({ used: 9800 })], 500, 0, new Set())).toBeNull())
test('empty account past reset is usable again', () => {
  const r = pickAccount([acc({ status: 'empty', used: 10000, resetAt: 1000 })], 500, 2000, new Set())
  expect(r?.id).toBe('a')
})
test('banned never picked', () => expect(pickAccount([acc({ status: 'banned' })], 1, 0, new Set())).toBeNull())
test('exclude respected; ties keep array order', () => {
  expect(pickAccount([acc({ id: 'x' }), acc({ id: 'y' })], 1, 0, new Set(['x']))?.id).toBe('y')
  expect(pickAccount([acc({ id: 'x' }), acc({ id: 'y' })], 1, 0, new Set())?.id).toBe('x')
})
test('totalCredits sums usable, counts past-reset as limit', () => {
  const l = [acc({ id: 'a', used: 4000 }), acc({ id: 'b', status: 'empty', used: 10000, resetAt: 1 }), acc({ id: 'c', status: 'banned' }), acc({ id: 'd', status: 'empty', used: 10000, resetAt: 9e9 })]
  expect(totalCredits(l, 100)).toBe(16000)
})
