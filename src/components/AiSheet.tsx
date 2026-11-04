import { useEffect, useState } from 'react'
import { ArrowUp, Check, ChevronRight, RotateCcw } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { GhostButton, Meter, Notice, PrimaryButton, Segmented, TaggedText } from './ui'
import { editScript } from '../lib/ai'
import type { AiAction, AiProvider } from '../lib/prompts'
import { TAG_SET } from '../lib/tags'
import { filterUnknownTags, sameWords, tagsIn } from '../lib/tagcheck'

const ACTIONS: [AiAction, string, string][] = [
  ['fix', 'Sửa lỗi', 'Chính tả, dấu câu, ngữ pháp'],
  ['speakable', 'Dễ đọc thành tiếng', 'Số, ngày, viết tắt thành chữ; câu ngắn'],
  ['shorter', 'Ngắn hơn', 'Gọn khoảng 30%'],
  ['longer', 'Dài hơn', 'Thêm khoảng 30%'],
]

type Props = {
  open: boolean; onClose: () => void; text: string; provider: AiProvider
  onProvider: (p: AiProvider) => void; onApply: (t: string) => void
  /** set when opened by the emotion chip: runs immediately */
  autoEmotion: boolean
}

export default function AiSheet({ open, onClose, text, provider, onProvider, onApply, autoEmotion }: Props) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<{ original: string; text: string; blocked: boolean } | null>(null)
  const [instruction, setInstruction] = useState('')
  const [last, setLast] = useState<[AiAction, string?] | null>(null)

  const run = async (action: AiAction, ins?: string) => {
    if (busy) return
    setLast([action, ins])
    setBusy(true); setErr(''); setResult(null)
    try {
      let out = await editScript(provider, action, text, ins)
      let blocked = false
      if (action === 'emotion') {
        out = filterUnknownTags(out, new Set([...TAG_SET, ...tagsIn(text)]))
        if (!sameWords(text, out)) { blocked = true; setErr('AI đã sửa chữ, thử lại') }
      }
      setResult({ original: text, text: out, blocked })
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  useEffect(() => {
    if (open) { setResult(null); setErr(''); setLast(null); if (autoEmotion) void run('emotion') }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per open
  }, [open])

  const name = provider === 'gemini' ? 'Gemini' : 'Claude'
  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose} title={autoEmotion ? 'Tự thêm cảm xúc' : 'Sửa bằng AI'}>
      <div className="space-y-4">
        <Segmented label="Mô hình AI" disabled={busy} value={provider} onChange={onProvider}
          options={[{ v: 'gemini', label: 'Gemini' }, { v: 'claude', label: 'Claude' }]} />
        {!autoEmotion && !result && !busy && (
          <>
            <ul className="-mx-1">
              {ACTIONS.map(([a, l, d], i) => (
                <li key={a} className="rise" style={{ ['--i' as string]: i }}>
                  <button disabled={!text.trim()} onClick={() => void run(a)}
                    className="press flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 text-left disabled:opacity-50">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{l}</span>
                      <span className="block text-[13px] text-muted">{d}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-faint" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={instruction} onChange={(e) => setInstruction(e.target.value)} aria-label="Yêu cầu riêng" placeholder="Yêu cầu riêng, vd: viết vui hơn"
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && instruction.trim() && text.trim() && void run('custom', instruction)}
                className="min-h-12 min-w-0 flex-1 rounded-full bg-ground px-4 text-base outline-none ring-1 ring-control focus:ring-ink" />
              <button aria-label="Gửi yêu cầu" className="press grid size-12 shrink-0 place-items-center rounded-full bg-ink text-ground disabled:bg-raised disabled:text-faint"
                disabled={!instruction.trim() || !text.trim()} onClick={() => void run('custom', instruction)}><ArrowUp size={20} /></button>
            </div>
          </>
        )}
        {busy && (
          <div role="status" className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl bg-ground text-muted">
            <Meter className="text-accent" />
            {name} đang {autoEmotion ? 'đặt tag cảm xúc' : 'viết lại'}…
          </div>
        )}
        {err && <Notice>{err}</Notice>}
        {!busy && last && (err || result?.blocked) && (
          <GhostButton className="w-full" icon={<RotateCcw size={18} />} onClick={() => void run(last[0], last[1])}>Thử lại với {name}</GhostButton>
        )}
        {result && (
          <div className="rise space-y-3">
            <section className="rounded-2xl bg-ground p-4">
              <h3 className="mb-1 text-[13px] font-medium text-faint">Bản gốc</h3>
              <p className="line-clamp-4 whitespace-pre-wrap text-[15px] text-muted">{result.original}</p>
            </section>
            <section className="rounded-2xl bg-raised p-4">
              <h3 className="mb-1 text-[13px] font-medium text-muted">Bản mới</h3>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed"><TaggedText text={result.text} /></p>
            </section>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <PrimaryButton disabled={result.blocked} onClick={() => onApply(result.text)} icon={<Check size={20} />}>Dùng bản này</PrimaryButton>
              <GhostButton className="min-h-13 px-5" onClick={onClose}>Huỷ</GhostButton>
            </div>
          </div>
        )}
        {autoEmotion && !busy && !result && <GhostButton className="w-full" onClick={onClose}>Đóng</GhostButton>}
      </div>
    </BottomSheet>
  )
}
