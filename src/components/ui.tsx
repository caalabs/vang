import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'

/** The Vang mark: a V drawn as a level meter, tall bars at the edges falling to the middle. */
export function Mark({ size = 28 }: { size?: number }) {
  const h = [20, 14, 8, 14, 20]
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#111" />
      {h.map((v, i) => <rect key={i} x={4.5 + i * 4} y={24 - v} width="3" height={v} rx="1.5" fill="var(--color-accent)" />)}
    </svg>
  )
}

export function ScreenHeader({ title, children, level = 1 }: { title: string; children?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2'
  return (
    <header className="flex min-h-14 items-center gap-3">
      <Mark />
      <H className="min-w-0 flex-1 truncate text-xl font-semibold tracking-[-0.01em]">{title}</H>
      {children}
    </header>
  )
}

type Btn = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }

/** The one primary control per view: inverted white pill. */
export function PrimaryButton({ icon, children, className = '', ...p }: Btn) {
  return (
    <button {...p} className={`press flex min-h-13 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-ground disabled:bg-raised disabled:text-faint ${className}`}>
      {icon}{children}
    </button>
  )
}

export function GhostButton({ icon, children, className = '', ...p }: Btn) {
  return (
    <button {...p} className={`press flex min-h-11 items-center justify-center gap-2 rounded-full bg-raised px-4 text-[15px] font-medium disabled:text-faint ${className}`}>
      {icon}{children}
    </button>
  )
}

export function IconButton({ label, children, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...p} aria-label={label} title={label} className={`press grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-ink disabled:text-control ${className}`}>
      {children}
    </button>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange, label, disabled }: {
  value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string; disabled?: boolean
}) {
  const i = Math.max(0, options.findIndex((o) => o.v === value))
  return (
    <div role="radiogroup" aria-label={label} className="relative grid rounded-full bg-ground p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span aria-hidden className="absolute inset-y-1 left-1 rounded-full bg-raised transition-transform duration-300 ease-(--ease-sheet)"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={o.v === value} disabled={disabled} onClick={() => onChange(o.v)}
          className={`press relative min-h-9 rounded-full px-3 text-sm font-medium ${o.v === value ? 'text-ink' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Pill({ tone, children }: { tone: 'positive' | 'warning' | 'negative' | 'neutral'; children: ReactNode }) {
  const c = { positive: 'bg-accent-bg text-accent', warning: 'bg-warning-bg text-warning', negative: 'bg-negative-bg text-negative', neutral: 'bg-raised text-ink' }[tone]
  return <span className={`inline-flex h-6 flex-none items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${c}`}>{children}</span>
}

/** Three bars bouncing: shown while audio or AI is being produced. */
export function Meter({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`meter inline-flex h-4 items-end gap-[3px] ${className}`}><span className="h-4" /><span className="h-4" /><span className="h-4" /><span className="h-4" /></span>
}

export function Notice({ tone = 'negative', children, onClose }: { tone?: 'negative' | 'warning'; children: ReactNode; onClose?: () => void }) {
  const c = tone === 'negative' ? 'bg-negative-bg text-negative' : 'bg-warning-bg text-warning'
  return (
    <div role="alert" className={`rise flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${c}`}>
      <p className="flex-1 py-0.5">{children}</p>
      {onClose && <button onClick={onClose} aria-label="Đóng" className="press -my-2 -mr-2 grid size-9 place-items-center rounded-full"><X size={16} /></button>}
    </div>
  )
}

const TAG = /(\[[^\]\n]{1,40}\])/

/** Text with its audio tags highlighted in the data hue. */
export function TaggedText({ text }: { text: string }) {
  return <>{text.split(TAG).map((p, i) => (i % 2 ? <mark key={i} className="tag-hl">{p}</mark> : p))}</>
}
