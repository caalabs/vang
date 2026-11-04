export async function saveFile(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }) } catch (e) { if ((e as Error).name !== 'AbortError') throw e }
    return
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const saveAudioFile = (blob: Blob, name: string) => saveFile(new File([blob], `${name}.mp3`, { type: 'audio/mpeg' }))

export const firstLine = (t: string) => t.split('\n').find((l) => l.trim())?.trim() ?? ''
const p2 = (n: number) => String(n).padStart(2, '0')
export const formatTime = (ts: number) => { const d = new Date(ts); return `${p2(d.getHours())}:${p2(d.getMinutes())} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}` }
export const historyFileName = (ts: number) => { const d = new Date(ts); return `vang-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}` }
/** "Hôm nay", "Hôm qua", or "dd/MM" for a timestamp relative to now (local calendar days). */
export const dayLabel = (ts: number, now: number) => {
  const day = (t: number) => { const d = new Date(t); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000 }
  const diff = day(now) - day(ts)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  const d = new Date(ts)
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`
}
