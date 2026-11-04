import { expect, test } from 'vitest'
import { bucketPeaks, clock } from './peaks'

test('bucketPeaks normalises to the loudest bucket', () => {
  expect(bucketPeaks(new Float32Array([0.1, -0.5, 0.25, 0.2]), 2)).toEqual([1, 0.5])
})
test('bucketPeaks on silence and empty input', () => {
  expect(bucketPeaks(new Float32Array([0, 0, 0, 0]), 2)).toEqual([0, 0])
  expect(bucketPeaks(new Float32Array([]), 3)).toEqual([0, 0, 0])
})
test('clock formats seconds', () => {
  expect(clock(4.9)).toBe('0:04')
  expect(clock(75)).toBe('1:15')
})
