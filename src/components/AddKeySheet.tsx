import { useState } from 'react'
import { Check, ClipboardPaste } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { GhostButton, Meter, Pill, PrimaryButton } from './ui'
import { getSubscription } from '../lib/elevenlabs'
import { maskKey, nextLabel, parseKeys } from '../lib/keys'
import type { Account } from '../lib/types'

export default function AddKeySheet({ open, onClose, accounts, onAdd }: {
  open: boolean
  onClose: () => void
  accounts: Account[]
  onAdd: (added: Account[]) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<Row[]>([])

  async function submit() {
    setBusy(true)
    try {
      const { fresh, duplicates } = parseKeys(text, accounts)
      const results = await Promise.allSettled(fresh.map((k) => getSubscription(k)))
      const all = [...accounts]
      const added: Account[] = []
      const out: Row[] = duplicates.map((k) => ({ tone: 'neutral', key: k, text: 'Đã có' }))
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const a: Account = { id: crypto.randomUUID(), label: nextLabel(all), key: fresh[i], ...r.value, checkedAt: Date.now() }
          all.push(a); added.push(a)
          out.push({ tone: 'positive', key: a.key, text: `${a.label} · ${(a.limit - a.used).toLocaleString('vi-VN')} credit` })
        } else out.push({ tone: 'negative', key: fresh[i], text: (r.reason as { kind?: string }).kind === 'invalid_key' ? 'Key sai' : 'Lỗi mạng' })
      })
      if (added.length) { await onAdd(added); setText('') }
      setRows(out)
    } catch (e) {
      setRows([{ tone: 'negative', key: '', text: `Không lưu được: ${(e as Error).message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Thêm key ElevenLabs">
      <p className="-mt-1 mb-3 text-[13px] text-muted">Dán một hoặc nhiều key, mỗi dòng một key. App kiểm tra từng key và chỉ lưu key dùng được.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Key ElevenLabs"
        placeholder={'sk_…\nsk_…'}
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        className="h-36 w-full resize-none rounded-2xl bg-ground p-4 font-mono text-base leading-relaxed outline-none ring-1 ring-control placeholder:text-faint focus:ring-ink"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
        <GhostButton className="min-h-13 px-5" icon={<ClipboardPaste size={18} />}
          onClick={() => navigator.clipboard.readText().then((t) => setText((p) => (p ? p + '\n' : '') + t)).catch(() => {})}>Dán</GhostButton>
        <PrimaryButton disabled={busy || !text.trim()} onClick={submit} icon={busy ? <Meter /> : <Check size={20} />}>
          {busy ? 'Đang kiểm tra…' : 'Kiểm tra & lưu'}
        </PrimaryButton>
      </div>
      {rows.length > 0 && (
        <ul className="mt-4">
          {rows.map((r, i) => (
            <li key={i} className="rise flex min-h-11 items-center justify-between gap-3 border-t border-line" style={{ ['--i' as string]: i }}>
              <span className="truncate font-mono text-[13px] text-muted">{r.key ? maskKey(r.key) : ''}</span>
              <Pill tone={r.tone}>{r.text}</Pill>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}

type Row = { tone: 'positive' | 'negative' | 'neutral'; key: string; text: string }
