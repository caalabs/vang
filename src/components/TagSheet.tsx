import { useState } from 'react'
import { CornerDownLeft } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { AUDIO_TAGS } from '../lib/tags'

const GROUPS = ['Cảm xúc', 'Cách nói', 'Âm thanh', 'Ngắt nghỉ'] as const

export default function TagSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (tag: string) => void }) {
  const [custom, setCustom] = useState('')
  const addCustom = () => {
    const s = custom.trim().toLowerCase().replace(/^\[+|\]+$/g, '').trim()
    if (!s) return
    setCustom('')
    onPick(`[${s}]`)
  }
  return (
    <BottomSheet open={open} onClose={onClose} title="Chèn cảm xúc">
      <p className="-mt-1 mb-4 text-[13px] text-muted">Tag được chèn vào vị trí con trỏ. Chỉ model Chuẩn đọc được tag.</p>
      {GROUPS.map((g) => (
        <section key={g} className="mb-5">
          <h3 className="mb-2 text-sm font-medium text-muted">{g}</h3>
          <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
            {AUDIO_TAGS.filter((x) => x.group === g).map((x) => (
              <button key={x.tag} className="press min-h-14 rounded-2xl bg-raised px-3 py-2 text-left" onClick={() => onPick(x.tag)}>
                <span className="block text-[15px] font-medium leading-tight">{x.vi}</span>
                <span className="block truncate text-xs text-accent">{x.tag}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h3 className="mb-2 text-sm font-medium text-muted"><label htmlFor="custom-tag">Tag riêng</label></h3>
        <div className="flex gap-2">
          <input
            id="custom-tag"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addCustom()}
            placeholder="vd: hét to, giọng kể chuyện"
            className="min-h-12 min-w-0 flex-1 rounded-full bg-ground px-4 text-base outline-none ring-1 ring-control focus:ring-ink"
          />
          <button aria-label="Chèn tag riêng" disabled={!custom.trim()} className="press grid size-12 shrink-0 place-items-center rounded-full bg-ink text-ground disabled:bg-raised disabled:text-faint" onClick={addCustom}><CornerDownLeft size={20} /></button>
        </div>
      </section>
    </BottomSheet>
  )
}
