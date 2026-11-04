import { expect, test } from 'vitest'
import { acc } from './test-utils'
import { mergeBackup, needsRefresh, nextLabel, parseKeys, statusDot } from './keys'

test('parseKeys trims, drops blanks and duplicates', () => {
  const r = parseKeys('  sk_a \n\n sk_b\nsk_a\nsk_c ', [acc({ key: 'sk_c' })])
  expect(r.fresh).toEqual(['sk_a', 'sk_b']); expect(r.duplicates).toEqual(['sk_c'])
})
test('nextLabel', () => expect(nextLabel([acc({ label: 'Acc 1' }), acc({ label: 'Acc 7' })])).toBe('Acc 8'))
test('needsRefresh after 10 minutes', () => expect(needsRefresh(acc({ checkedAt: 0 }), 600_001)).toBe(true))

test('statusDot maps ok/empty/banned', () => {
  expect(statusDot(acc({ status: 'ok' }))).toBe('🟢')
  expect(statusDot(acc({ status: 'empty' }))).toBe('🟡')
  expect(statusDot(acc({ status: 'banned' }))).toBe('🔴')
})
test('mergeBackup dedupes within batch and vs existing, normalises, fixes id collisions', () => {
  const ex = [acc({ id: 'x', key: 'k1', label: 'Acc 3' })]
  const r = mergeBackup(ex, [{ key: 'k1' }, { key: 'k2', id: 'x', status: 'weird', used: 'n' }, { key: 'k2' }, { key: ' ' }, 5, { key: 'k3', label: 'Mine', used: 5, limit: 9, status: 'empty' }])
  expect(r.map((a) => a.key)).toEqual(['k1', 'k2', 'k3'])
  expect(r[1]).toMatchObject({ label: 'Acc 4', used: 0, limit: 10000, status: 'ok', checkedAt: 0, resetAt: null })
  expect(r[1].id).not.toBe('x')
  expect(r[2]).toMatchObject({ label: 'Mine', used: 5, limit: 9, status: 'empty' })
})
test('mergeBackup rejects non-array', () => expect(() => mergeBackup([], { a: 1 })).toThrow('File backup không hợp lệ'))
