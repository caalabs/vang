import { useRef, useState } from 'react'
import { Check, Pause, Play } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { Meter } from './ui'
import type { Voice } from '../lib/types'

export default function VoiceSheet({ open, onClose, voices, loading, error, hasKey, selectedId, onPick }: {
  open: boolean; onClose: () => void; voices: Voice[] | null; loading: boolean; error: string; hasKey: boolean
  selectedId: string; onPick: (v: Voice) => void
}) {
  const player = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState('')
  const play = (v: Voice) => {
    player.current?.pause()
    if (playing === v.voice_id || !v.preview_url) return setPlaying('')
    const a = new Audio(v.preview_url)
    a.onended = () => setPlaying('')
    player.current = a
    setPlaying(v.voice_id)
    a.play().catch(() => setPlaying(''))
  }
  const close = () => { player.current?.pause(); setPlaying(''); onClose() }
  return (
    <BottomSheet open={open} onClose={close} title="Chọn giọng">
      {!hasKey && <p className="py-2 text-muted">Thêm key ở tab Tài khoản để xem danh sách giọng.</p>}
      {hasKey && loading && <p role="status" className="flex items-center gap-3 py-2 text-muted"><Meter className="text-accent" />Đang tải giọng…</p>}
      {error && <p className="py-2 text-negative">{error}</p>}
      <ul className="-mx-2">
        {voices?.map((v, i) => {
          const [name, desc] = v.name.split(' - ')
          const sel = v.voice_id === selectedId
          return (
            <li key={v.voice_id} className="rise flex items-center gap-1" style={{ ['--i' as string]: Math.min(i, 12) }}>
              <button onClick={() => { onPick(v); close() }} aria-current={sel || undefined}
                className={`press flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 text-left ${sel ? 'bg-raised' : ''}`}>
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ground font-semibold">{name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  {desc && <span className="block truncate text-[13px] text-muted">{desc}</span>}
                </span>
                {sel && <Check size={20} className="shrink-0" />}
              </button>
              {v.preview_url && (
                <button aria-label={`Nghe thử ${name}`} onClick={() => play(v)} className="press grid size-11 shrink-0 place-items-center rounded-full text-muted">
                  {playing === v.voice_id ? <Pause size={18} /> : <Play size={18} />}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}
