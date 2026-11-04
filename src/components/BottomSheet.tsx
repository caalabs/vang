import { type ReactNode, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  // drag the grabber/header down to dismiss, like an iOS sheet
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef(0)
  const onDown = (e: React.PointerEvent) => { start.current = e.clientY; setDragging(true) }
  const onMove = (e: React.PointerEvent) => { if (dragging) setDy(Math.max(0, e.clientY - start.current)) }
  const onUp = () => { if (!dragging) return; setDragging(false); if (dy > 90) onClose(); setDy(0) }

  // portalled: an animating ancestor (transform) would otherwise become the containing block of this fixed layer
  return createPortal(
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-xl flex-col rounded-t-[28px] bg-surface ${dragging ? '' : 'transition-transform duration-[420ms] ease-(--ease-sheet)'}`}
        style={{ transform: open ? `translateY(${dy}px)` : 'translateY(100%)' }}
      >
        <div className="shrink-0 touch-none select-none px-5 pt-2" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="mx-auto h-1 w-9 rounded-full bg-control" />
          <div className="flex min-h-12 items-center gap-2">
            <h2 className="flex-1 text-[17px] font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Đóng" className="press -mr-2 grid size-11 place-items-center rounded-full text-muted"><X size={20} /></button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
