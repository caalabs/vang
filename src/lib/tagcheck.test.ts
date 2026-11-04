import { expect, test } from 'vitest'
import { filterUnknownTags, sameWords } from './tagcheck'

test('accepts tags-only change', () => expect(sameWords('Xin chào bạn', '[excited] Xin chào [laughs] bạn')).toBe(true))
test('rejects changed words', () => expect(sameWords('Xin chào bạn', '[excited] Chào bạn nhé')).toBe(false))
test('NFC vs NFD Vietnamese counts as same', () => expect(sameWords('chào'.normalize('NFD'), 'chào')).toBe(true))
test('drops invented tags', () => expect(filterUnknownTags('[excited] A [dramatic flair] B', new Set(['[excited]']))).toBe('[excited] A B'))
test('pre-existing custom tag survives', () => {
  const orig = '[hét to] A B'
  const allowed = new Set(['[excited]', ...(orig.match(/\[[^\]]*\]/g) ?? [])])
  expect(filterUnknownTags('[hét to] A [excited] B [bịa]', allowed)).toBe('[hét to] A [excited] B')
})
test('sameWords ignores any bracket content', () => expect(sameWords('A B', '[hét to] A [x y z] B')).toBe(true))
