import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardPaste, FileDown, Plus, RefreshCw, Trash2, TriangleAlert, Upload } from 'lucide-react'
import AddKeySheet from '../components/AddKeySheet'
import { GhostButton, IconButton, Notice, Pill, PrimaryButton, ScreenHeader } from '../components/ui'
import BottomSheet from '../components/BottomSheet'
import { runAi } from '../lib/ai'
import { totalCredits } from '../lib/accounts'
import { saveFile } from '../lib/history'
import { maskKey, needsRefresh, refreshAccount, statusDot } from '../lib/keys'
import { type AiKeys, getAccounts, getAiKeys, importBackup, saveAccounts, saveAiKeys } from '../lib/store'
import type { Account } from '../lib/types'

const fmt = (n: number) => n.toLocaleString('vi-VN')
const CHECKING = 'Đang kiểm tra…'
const dm = (t: number) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [ai, setAi] = useState<AiKeys>({ gemini: '', claude: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiCheck, setAiCheck] = useState<Partial<Record<keyof AiKeys, string>>>({})
  const [adding, setAdding] = useState(false)
  const [selId, setSelId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  // Serialised read-modify-write on the stored list, so concurrent add/rename/delete/refresh never clobber each other.
  const aiTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const mutate = useCallback((fn: (latest: Account[]) => Account[]) => {
    const p = queue.current.then(async () => {
      const next = fn(await getAccounts())
      await saveAccounts(next)
      setAccounts(next)
    })
    queue.current = p.catch(() => {})
    return p
  }, [])
  const fail = (e: unknown) => setMsg(`Không lưu được: ${(e as Error).message}`)
  const update = useCallback((fn: (latest: Account[]) => Account[]) => mutate(fn).catch(fail), [mutate])

  const refresh = useCallback(async (list: Account[], only?: string) => {
    setBusy(true)
    try {
      const targets = list.filter((a) => !only || a.id === only)
      const res = await Promise.allSettled(targets.map(refreshAccount))
      const byId = new Map<string, Account>()
      res.forEach((r, i) => { if (r.status === 'fulfilled') byId.set(targets[i].id, r.value) })
      await mutate((latest) => latest.map((a) => {
        const n = byId.get(a.id)
        return n ? { ...a, used: n.used, limit: n.limit, resetAt: n.resetAt, status: n.status, checkedAt: n.checkedAt } : a
      }))
      setMsg(byId.size < targets.length ? 'Không kiểm tra được một số account (lỗi mạng).' : '')
    } catch (e) { fail(e) } finally { setBusy(false) }
  }, [mutate])

  useEffect(() => {
    void (async () => {
      const list = await getAccounts()
      setAccounts(list)
      setAi(await getAiKeys())
      if (list.some((a) => needsRefresh(a, Date.now()))) void refresh(list)
    })()
  }, [refresh])

  if (!accounts) return null
  const sel = accounts.find((a) => a.id === selId)
  const closeSel = () => { setSelId(null); setConfirmDel(false) }
  const total = totalCredits(accounts, Date.now())
  const count = (d: string) => accounts.filter((a) => statusDot(a) === d).length

  // built synchronously from state so navigator.share runs inside the tap's user activation (iOS)
  const share = () => saveFile(new File([JSON.stringify({ version: 1, accounts, aiKeys: ai })], 'vang-keys.json', { type: 'application/json' }))
    .catch((e) => setMsg(`Không xuất được: ${(e as Error).message}`))

  // iOS may skip blur, so persist as the user types (debounced)
  const persistAi = (n: AiKeys) => { clearTimeout(aiTimer.current); aiTimer.current = setTimeout(() => void saveAiKeys(n).catch(fail), 400) }

  const checkAi = async (k: keyof AiKeys) => {
    setAiCheck((c) => ({ ...c, [k]: CHECKING }))
    try {
      await saveAiKeys(ai)
      await runAi(k, 'Trả lời đúng một từ: OK', 'ping')
      setAiCheck((c) => ({ ...c, [k]: '✓ Key hợp lệ' }))
    } catch (e) { setAiCheck((c) => ({ ...c, [k]: (e as Error).message })) }
  }

  const aiField = (k: keyof AiKeys, label: string, hint: string) => (
    <div className="space-y-2">
      <label htmlFor={`ai-${k}`} className="flex items-baseline justify-between text-sm font-medium">{label}<span className="text-xs font-normal text-faint">{hint}</span></label>
      <div className="flex gap-2">
        <input
          id={`ai-${k}`} type="password" placeholder={ai[k] ? '' : 'Chưa có key'} value={ai[k]}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off"
          onChange={(e) => { const n = { ...ai, [k]: e.target.value }; setAi(n); persistAi(n) }}
          className="min-h-12 min-w-0 flex-1 rounded-full bg-ground px-4 text-base outline-none ring-1 ring-control placeholder:text-faint focus:ring-ink"
        />
        <IconButton label={`Dán key ${label}`} className="bg-raised text-ink"
          onClick={() => navigator.clipboard.readText().then((t) => { clearTimeout(aiTimer.current); const n = { ...ai, [k]: t.trim() }; setAi(n); return saveAiKeys(n).catch(fail) }).catch(() => {})}
        ><ClipboardPaste size={18} /></IconButton>
        <GhostButton className="min-h-12" disabled={aiCheck[k] === CHECKING || !ai[k]} onClick={() => void checkAi(k)}>Kiểm tra</GhostButton>
      </div>
      {aiCheck[k] && <p role="status" className={`text-[13px] ${aiCheck[k]!.startsWith('✓') ? 'text-accent' : aiCheck[k] === CHECKING ? 'text-muted' : 'text-negative'}`}>{aiCheck[k]}</p>}
    </div>
  )

  const usable = count('🟢'), empty = count('🟡'), banned = count('🔴')
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Tài khoản">
        <IconButton label="Làm mới tất cả" disabled={busy || !accounts.length} onClick={() => void refresh(accounts)}>
          <RefreshCw size={20} className={busy ? 'spin' : ''} />
        </IconButton>
      </ScreenHeader>

      <section aria-label="Credit còn lại" className="rounded-[20px] bg-surface p-5">
        <p className="num text-[32px] leading-none font-semibold tracking-[-0.02em]">{fmt(total)}</p>
        <p className="mt-1.5 text-sm text-muted">{accounts.length ? `credit còn lại trên ${accounts.length} account` : 'chưa có account nào'}</p>
        {accounts.length > 0 && <Pool accounts={accounts} />}
        {accounts.length > 0 && (
          <p className="num mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-accent" />{usable} dùng được</span>
            {empty > 0 && <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warning" />{empty} hết credit</span>}
            {banned > 0 && <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-negative" />{banned} bị khoá</span>}
          </p>
        )}
        <PrimaryButton className="mt-5 w-full" icon={<Plus size={20} />} onClick={() => setAdding(true)}>Thêm key ElevenLabs</PrimaryButton>
      </section>
      {msg && <Notice tone="warning" onClose={() => setMsg('')}>{msg}</Notice>}

      {accounts.length > 0 && (
        <section aria-label="Danh sách account">
          <h2 className="mb-2 px-1 text-[13px] font-medium text-faint">{accounts.length} account ElevenLabs</h2>
          <ul className="overflow-hidden rounded-[20px] bg-surface">
            {accounts.map((a, i) => (
              <li key={a.id} className="rise flex items-center border-t border-line first:border-t-0" style={{ ['--i' as string]: Math.min(i, 10) }}>
                <button onClick={() => setSelId(a.id)} className="press flex min-h-[68px] min-w-0 flex-1 items-center gap-3 px-4 text-left">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${a.status === 'ok' ? 'bg-accent' : a.status === 'empty' ? 'bg-warning' : 'bg-negative'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.label}</span>
                    <span className="block truncate font-mono text-xs text-faint">{maskKey(a.key)}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {a.status === 'banned' ? <Pill tone="negative">Bị khoá</Pill>
                      : <span className={`num block text-[15px] ${a.status === 'empty' ? 'text-faint' : ''}`}>{fmt(Math.max(0, a.limit - a.used))}</span>}
                    {a.status !== 'banned' && <span className="num block text-xs text-faint">{a.resetAt ? `nạp lại ${dm(a.resetAt)}` : '—'}</span>}
                  </span>
                </button>
                {a.status === 'banned' && (
                  <button onClick={() => void update((l) => l.filter((x) => x.id !== a.id))} aria-label={`Xoá ${a.label}`}
                    className="press mr-2 grid size-11 shrink-0 place-items-center rounded-full text-negative"><Trash2 size={18} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="ai-title" className="rounded-[20px] bg-surface p-5">
        <h2 id="ai-title" className="font-semibold">Key AI</h2>
        <p className="mt-1 mb-4 text-[13px] text-muted">Để sửa kịch bản và tự thêm cảm xúc. Chỉ lưu trên máy này.</p>
        <div className="space-y-5">
          {aiField('gemini', 'Gemini', 'mặc định · miễn phí')}
          {aiField('claude', 'Claude', 'tuỳ chọn')}
        </div>
      </section>

      <section aria-labelledby="backup-title" className="rounded-[20px] bg-surface p-5">
        <h2 id="backup-title" className="font-semibold">Sao lưu</h2>
        <p className="mt-1 mb-4 text-[13px] text-muted">Một file chứa mọi key, để chuyển sang máy khác.</p>
        <div className="grid grid-cols-2 gap-2">
          <GhostButton icon={<FileDown size={18} />} disabled={!accounts.length && !ai.gemini && !ai.claude} onClick={() => void share()}>Xuất file</GhostButton>
          <label className="press flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-raised px-4 text-[15px] font-medium focus-within:outline-2 focus-within:outline-ink">
            <Upload size={18} />Nhập file
            <input
              type="file" accept="application/json,.json" className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                try { const n = await importBackup(f); setAccounts(await getAccounts()); setAi(await getAiKeys()); setMsg(`Đã nhập ${n} account.`) }
                catch (err) { setMsg((err as Error).message) }
              }}
            />
          </label>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[13px] text-warning"><TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />File chứa toàn bộ key — đừng gửi cho ai</p>
      </section>

      <AddKeySheet open={adding} onClose={() => setAdding(false)} accounts={accounts} onAdd={(added) => mutate((l) => [...l, ...added.filter((n) => !l.some((a) => a.key === n.key))])} />

      <BottomSheet open={!!sel} onClose={closeSel} title={sel?.label ?? ''}>
        {sel && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-ground p-4">
              <p className="num text-2xl font-semibold">{fmt(Math.max(0, sel.limit - sel.used))}<span className="text-base font-normal text-faint"> / {fmt(sel.limit)} credit</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                <div className={`h-full rounded-full transition-[width] duration-700 ease-(--ease-out) ${sel.status === 'ok' ? 'bg-accent' : 'bg-control'}`} style={{ width: `${Math.max(0, Math.min(100, ((sel.limit - sel.used) / (sel.limit || 1)) * 100))}%` }} />
              </div>
              <p className="num mt-2 text-[13px] text-muted">
                {sel.status === 'banned' ? 'ElevenLabs đã khoá account này' : sel.resetAt ? `Nạp lại ${dm(sel.resetAt)}` : 'Chưa rõ ngày nạp lại'}
                {' · '}<span className="font-mono">{maskKey(sel.key)}</span>
              </p>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Tên</span>
              <input
                key={sel.id} defaultValue={sel.label}
                onChange={(e) => { const v = e.target.value.trim(); if (v) void update((l) => l.map((a) => (a.id === sel.id ? { ...a, label: v } : a))) }}
                className="min-h-12 w-full rounded-full bg-ground px-4 text-base outline-none ring-1 ring-control focus:ring-ink"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <GhostButton icon={<RefreshCw size={18} className={busy ? 'spin' : ''} />} disabled={busy} onClick={() => void refresh(accounts, sel.id)}>Làm mới</GhostButton>
              {confirmDel
                ? <button className="press min-h-11 rounded-full bg-negative font-medium text-ground" onClick={() => { void update((l) => l.filter((a) => a.id !== sel.id)); closeSel() }}>Xoá thật</button>
                : <GhostButton className="text-negative" icon={<Trash2 size={18} />} onClick={() => setConfirmDel(true)}>Xoá</GhostButton>}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

/** Every account as one segment of the pool, as wide as its monthly limit and filled with what is left. */
function Pool({ accounts }: { accounts: Account[] }) {
  return (
    <div className="mt-5 flex h-3 gap-[3px]" role="img" aria-label="Credit còn lại của từng account">
      {accounts.map((a) => {
        const left = a.status === 'banned' ? 0 : Math.max(0, (a.limit - a.used) / (a.limit || 1))
        return (
          <span key={a.id} className={`relative overflow-hidden rounded-full ${a.status === 'banned' ? 'bg-negative-bg' : 'bg-raised'}`} style={{ flexGrow: a.limit || 1, flexBasis: 0 }}>
            <span className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-700 ease-(--ease-out)" style={{ width: `${left * 100}%` }} />
          </span>
        )
      })}
    </div>
  )
}
