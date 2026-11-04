import BottomSheet from './BottomSheet'
import { Segmented } from './ui'
import type { VoiceSettings } from '../lib/types'

const LEVELS: { label: string; v: VoiceSettings['stability'] }[] = [
  { label: 'Sáng tạo', v: 0 },
  { label: 'Tự nhiên', v: 0.5 },
  { label: 'Ổn định', v: 1 },
]
const HINT = { 0: 'Biểu cảm mạnh, mỗi lần đọc một khác', 0.5: 'Cân bằng, hợp với hầu hết kịch bản', 1: 'Đều giọng, ít theo tag cảm xúc' }

export default function SettingsSheet({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: VoiceSettings; onChange: (v: VoiceSettings) => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Cài đặt giọng">
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Độ ổn định</h3>
        <Segmented label="Độ ổn định" value={value.stability} options={LEVELS} onChange={(v) => onChange({ ...value, stability: v })} />
        <p className="text-[13px] text-muted">{HINT[value.stability]}</p>
      </section>
      <section className="mt-6 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium"><label htmlFor="speed">Tốc độ</label></h3>
          <span className="num text-sm">{value.speed.toFixed(2).replace('.', ',')}×</span>
        </div>
        <input id="speed" type="range" min={0.7} max={1.2} step={0.05} value={value.speed}
          onChange={(e) => onChange({ ...value, speed: Number(e.target.value) })} className="h-11 w-full accent-white" />
        <div className="num flex justify-between text-xs text-faint"><span>0,70× chậm</span><span>1,20× nhanh</span></div>
      </section>
    </BottomSheet>
  )
}
