import { useState } from 'react'
import { Share, X } from 'lucide-react'

export default function InstallBanner() {
  const [closed, setClosed] = useState(false)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  if (closed || standalone) return null
  return (
    <div className="rise mt-3 flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
      <Share size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden />
      <p className="flex-1 text-muted">
        <span className="text-ink">Cài Vang lên màn hình chính:</span> bấm Chia sẻ → Thêm vào MH chính rồi mở từ icon. Dữ liệu trong Safari và trong app là riêng.
      </p>
      <button onClick={() => setClosed(true)} aria-label="Đóng" className="press -m-2 grid size-11 shrink-0 place-items-center rounded-full text-muted"><X size={18} /></button>
    </div>
  )
}
