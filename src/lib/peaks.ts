/** Split samples into n buckets and return each bucket's peak, normalised so the loudest is 1. */
export function bucketPeaks(samples: Float32Array, n: number): number[] {
  if (!samples.length || n <= 0) return Array(Math.max(0, n)).fill(0)
  const size = samples.length / n
  const out: number[] = []
  for (let b = 0; b < n; b++) {
    let max = 0
    for (let i = Math.floor(b * size), end = Math.floor((b + 1) * size); i < end; i++) max = Math.max(max, Math.abs(samples[i]))
    out.push(max)
  }
  const top = Math.max(...out)
  return top ? out.map((v) => v / top) : out
}

/** Decode an mp3 blob and return n normalised peaks plus its duration in seconds. */
export async function decodePeaks(blob: Blob, n: number): Promise<{ peaks: number[]; duration: number }> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    return { peaks: bucketPeaks(buf.getChannelData(0), n), duration: buf.duration }
  } finally {
    void ctx.close()
  }
}

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
