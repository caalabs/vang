import { expect, it } from 'vitest'
import { firstLine, formatTime, historyFileName, dayLabel } from './history'

const ts = new Date(2026, 9, 5, 7, 3).getTime()
it('formats', () => {
  expect(formatTime(ts)).toBe('07:03 05/10')
  expect(historyFileName(ts)).toBe('vang-20261005-0703')
  expect(firstLine('\n  Xin chào \nB')).toBe('Xin chào')
})

it('dayLabel uses calendar days, not 24h windows', () => {
  const now = new Date(2026, 9, 27, 0, 30).getTime()
  expect(dayLabel(new Date(2026, 9, 27, 0, 5).getTime(), now)).toBe('Hôm nay')
  expect(dayLabel(new Date(2026, 9, 26, 23, 50).getTime(), now)).toBe('Hôm qua')
  expect(dayLabel(new Date(2026, 9, 23, 12, 0).getTime(), now)).toBe('23/10')
})
