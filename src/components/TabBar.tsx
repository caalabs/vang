import { AudioLines, History, KeyRound } from 'lucide-react'
import type { TabId } from '../App'

const TABS: { id: TabId; label: string; Icon: typeof AudioLines }[] = [
  { id: 'create', label: 'Tạo', Icon: AudioLines },
  { id: 'history', label: 'Lịch sử', Icon: History },
  { id: 'accounts', label: 'Tài khoản', Icon: KeyRound },
]

export default function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ground"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-xl">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`press flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab === id ? 'text-ink' : 'text-faint'}`}
          >
            <Icon size={22} strokeWidth={tab === id ? 2 : 1.6} className="transition-[stroke-width]" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
