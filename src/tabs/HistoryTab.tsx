import { useEffect, useRef, useState } from 'react'
import { AudioLines, Download, Pause, Play, RotateCcw, Trash2 } from 'lucide-react'
import BottomSheet from '../components/BottomSheet'
import WavePlayer from '../components/WavePlayer'
import { GhostButton, Notice, PrimaryButton, ScreenHeader, TaggedText } from '../components/ui'
import { deleteHistory, listHistory } from '../lib/store'
import { dayLabel, firstLine, formatTime, historyFileName, saveAudioFile } from '../lib/history'
import type { HistoryItem } from '../lib/types'

export default function HistoryTab({ setScriptText, onReuse }: { setScriptText: (s: string) => void; onReuse: () => void }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [sel, setSel] = useState<HistoryItem | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const urlRef = useRef('')

  useEffect(() => {
    listHistory().then(setItems, () => { setItems([]); setError('Không đọc được lịch sử.') })
    const a = audio.current
    return () => { a?.pause(); if (urlRef.current) URL.revokeObjectURL(urlRef.current) }
  }, [])

  const stop = () => { audio.current?.pause(); setPlaying(null); setProgress(0) }
  const play = (h: HistoryItem) => {
    const a = audio.current!
    if (playing === h.id) return stop()
    setError('')
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = URL.createObjectURL(h.audio)
    a.src = urlRef.current
    setPlaying(h.id); setProgress(0)
    a.play().catch((e) => { if ((e as Error).name !== 'AbortError') { setPlaying(null); setError('Không phát được audio.') } })
  }
  const download = (h: HistoryItem) => saveAudioFile(h.audio, historyFileName(h.createdAt)).catch(() => setError('Không lưu được file.'))
  const open = (h: HistoryItem) => { stop(); setSel(h) }
  const close = () => { setSel(null); setConfirmDel(false) }
  const remove = async () => {
    if (!sel) return
    try {
      await deleteHistory(sel.id)
      if (playing === sel.id) stop()
      setItems((l) => l?.filter((h) => h.id !== sel.id) ?? null)
      close()
    } catch { setError('Không xoá được.') }
  }

  // group by calendar day, newest first (listHistory is already sorted)
  const groups: [string, HistoryItem[]][] = []
  for (const h of items ?? []) {
    const d = dayLabel(h.createdAt, Date.now())
    const g = groups.at(-1)
    if (g?.[0] === d) g[1].push(h)
    else groups.push([d, [h]])
  }
  let row = 0

  return (
    <div className="flex flex-col gap-4">
      <audio ref={audio} onEnded={() => { setPlaying(null); setProgress(0) }} onError={() => playing && setError('Không phát được audio.')}
        onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setProgress(a.currentTime / a.duration) }} />
      <ScreenHeader title="Lịch sử">
        {!!items?.length && <span className="num text-sm text-faint">{items.length} bản</span>}
      </ScreenHeader>
      {error && <Notice onClose={() => setError('')}>{error}</Notice>}

      {items?.length === 0 && !error && (
        <div className="rise flex flex-col items-center gap-4 rounded-[20px] bg-surface px-6 py-12 text-center">
          <AudioLines size={28} className="text-faint" aria-hidden />
          <p className="text-muted">Chưa có audio nào. Tạo ở tab Tạo.</p>
          <GhostButton onClick={onReuse}>Viết kịch bản đầu tiên</GhostButton>
        </div>
      )}

      {groups.map(([label, list]) => (
        <section key={label} aria-label={label}>
          <h2 className="mb-2 px-1 text-[13px] font-medium text-faint">{label}</h2>
          <ul className="overflow-hidden rounded-[20px] bg-surface">
            {list.map((h) => (
              <li key={h.id} className="rise relative flex items-center gap-1 border-t border-line pr-1 pl-3 first:border-t-0" style={{ ['--i' as string]: Math.min(row++, 10) }}>
                <button className={`press grid size-11 shrink-0 place-items-center rounded-full ${playing === h.id ? 'bg-ink text-ground' : 'bg-raised'}`}
                  aria-label={playing === h.id ? 'Tạm dừng' : `Phát: ${firstLine(h.text)}`} onClick={() => play(h)}>
                  {playing === h.id ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-px" />}
                </button>
                <button className="min-h-[72px] min-w-0 flex-1 px-2 text-left" onClick={() => open(h)}>
                  <span className="block truncate text-[15px]">{firstLine(h.text).replace(/\[[^\]\n]{1,40}\]\s*/g, '')}</span>
                  <span className="num block truncate text-[13px] text-muted">
                    {h.voiceName.split(' - ')[0]} · {h.model === 'eleven_flash_v2_5' ? 'Nháp' : 'Chuẩn'} · {formatTime(h.createdAt).slice(0, 5)}
                  </span>
                </button>
                <button className="press grid size-11 shrink-0 place-items-center rounded-full text-muted" aria-label="Lưu file" onClick={() => download(h)}><Download size={20} /></button>
                {playing === h.id && (
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-200 ease-linear" style={{ transform: `scaleX(${progress})` }} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <BottomSheet open={!!sel} onClose={close} title={sel ? `${dayLabel(sel.createdAt, Date.now())}, ${formatTime(sel.createdAt).slice(0, 5)}` : ''}>
        {sel && (
          <div className="space-y-4">
            <WavePlayer audio={sel.audio} />
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-ground p-4 text-[15px] leading-relaxed text-muted"><TaggedText text={sel.text} /></p>
            <PrimaryButton className="w-full" icon={<RotateCcw size={20} />} onClick={() => { setScriptText(sel.text); close(); onReuse() }}>Dùng lại kịch bản</PrimaryButton>
            <div className="grid grid-cols-2 gap-2">
              <GhostButton icon={<Download size={18} />} onClick={() => download(sel)}>Lưu file</GhostButton>
              {confirmDel
                ? <button className="press min-h-11 rounded-full bg-negative font-medium text-ground" onClick={remove}>Xoá thật</button>
                : <GhostButton className="text-negative" icon={<Trash2 size={18} />} onClick={() => setConfirmDel(true)}>Xoá</GhostButton>}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
