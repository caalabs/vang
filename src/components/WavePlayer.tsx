import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { clock, decodePeaks } from '../lib/peaks'

const BARS = 56

/** The take as its own waveform: bars fill with the data hue as it plays; tap a bar to seek. */
export default function WavePlayer({ audio, autoFocus }: { audio: Blob; autoFocus?: boolean }) {
  const el = useRef<HTMLAudioElement>(null)
  const [url, setUrl] = useState('')
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [duration, setDuration] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const u = URL.createObjectURL(audio)
    setUrl(u); setT(0); setPlaying(false); setPeaks(null)
    let live = true
    decodePeaks(audio, BARS).then((r) => { if (live) { setPeaks(r.peaks); setDuration(r.duration) } }, () => live && setPeaks(Array(BARS).fill(0.4)))
    return () => { live = false; URL.revokeObjectURL(u) }
  }, [audio])

  // smooth playhead while playing (timeupdate only fires ~4×/s)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => { if (el.current) setT(el.current.currentTime); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const toggle = () => {
    const a = el.current
    if (!a) return
    if (a.paused) a.play().then(() => setPlaying(true), () => setPlaying(false))
    else { a.pause(); setPlaying(false) }
  }
  const seek = (i: number) => {
    const a = el.current
    if (!a || !duration) return
    a.currentTime = (i / BARS) * duration
    setT(a.currentTime)
  }
  const at = duration ? t / duration : 0

  return (
    <div className="flex items-center gap-3">
      <audio ref={el} src={url || undefined} preload="metadata" onEnded={() => { setPlaying(false); setT(0) }}
        onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d)) setDuration((x) => x || d) }} />
      <button onClick={toggle} autoFocus={autoFocus} aria-label={playing ? 'Tạm dừng' : 'Phát'}
        className="press grid size-12 shrink-0 place-items-center rounded-full bg-ink text-ground">
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex h-12 items-center gap-[2px]" role="slider" aria-label="Vị trí phát" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(t)}>
          {(peaks ?? Array(BARS).fill(0.08)).map((p, i) => (
            <button key={i} tabIndex={-1} aria-hidden onClick={() => seek(i)} className="flex h-full flex-1 items-center">
              <span
                className={`block w-full rounded-full transition-colors duration-150 ${peaks ? 'bar-in' : ''} ${i / BARS < at ? 'bg-accent' : 'bg-control'}`}
                style={{ height: `${Math.max(8, p * 100)}%`, ['--i' as string]: i }}
              />
            </button>
          ))}
        </div>
        <div className="num mt-1 flex justify-between text-xs text-faint"><span>{clock(t)}</span><span>{duration ? clock(duration) : '–:––'}</span></div>
      </div>
    </div>
  )
}
