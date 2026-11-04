import { expect, test } from 'vitest'
import { AUDIO_TAGS, TAG_SET } from './tags'
import { insertAt } from './cursor'

test('tags well formed and unique', () => {
  for (const t of AUDIO_TAGS) expect(t.tag).toMatch(/^\[[a-z ]+\]$/)
  expect(TAG_SET.size).toBe(AUDIO_TAGS.length)
  expect(AUDIO_TAGS.length).toBeGreaterThanOrEqual(25)
})
test('insertAt adds spacing', () => expect(insertAt('Xin chào', 3, '[laughs]')).toEqual({ text: 'Xin [laughs] chào', cursor: 13 }))
test('insertAt at start', () => expect(insertAt('Xin', 0, '[sighs]')).toEqual({ text: '[sighs] Xin', cursor: 8 }))
test('insertAt at end', () => expect(insertAt('Xin', 3, '[sighs]')).toEqual({ text: 'Xin [sighs]', cursor: 11 }))
test('insertAt between spaces adds none', () => expect(insertAt('a  b', 2, '[x]')).toEqual({ text: 'a [x] b', cursor: 6 }))
