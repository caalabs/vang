import { useEffect, useRef, useState } from 'react'
import AiSheet from '../components/AiSheet'
import ScriptEditor from '../components/ScriptEditor'
import WavePlayer from '../components/WavePlayer'
import { GhostButton, IconButton, Meter, Notice, PrimaryButton, ScreenHeader, Segmented } from '../components/ui'
import { AudioLines, ChevronDown, ClipboardPaste, Download, Drama, Eraser, KeyRound, RotateCcw, SlidersHorizontal, Sparkles, WandSparkles } from 'lucide-react'
import SettingsSheet from '../components/SettingsSheet'
import TagSheet from '../components/TagSheet'
import VoiceSheet from '../components/VoiceSheet'
import { MODEL_DRAFT, MODEL_FULL, estimateCredits, isUsable, pickAccount, totalCredits } from '../lib/accounts'
import { ElevenError, generateSpeech, listVoices } from '../lib/elevenlabs'
import { insertAt } from '../lib/cursor'
import { historyFileName, saveAudioFile } from '../lib/history'
import { refreshAccount } from '../lib/keys'
import { DEFAULT_SETTINGS, addHistory, applyStatusUpdates, getAccounts, getDraft, getSettings, saveAccounts, saveDraft, saveSettings } from '../lib/store'
import type { Account, Settings, Voice } from '../lib/types'

const MAX = 5000
const fmt = (n: number) => n.toLocaleString('vi-VN')

/** Refresh the given accounts and merge only the usage fields into the latest stored list. */
async function refreshAndMerge(ids: string[]) {
  const fresh = await Promise.all(
    (await getAccounts()).filter((a) => ids.includes(a.id)).map((a) => refreshAccount(a).catch(() => null)),
  )
  const byId = new Map(fresh.filter((a): a is Account => !!a).map((a) => [a.id, a]))
  const latest = await getAccounts()
  await saveAccounts(latest.map((a) => {
    const f = byId.get(a.id)
    return f ? { ...a, used: f.used, limit: f.limit, resetAt: f.resetAt, status: f.status, checkedAt: f.checkedAt } : a
  }))
}

export default function CreateTab({ active, scriptText, setScriptText, onGoAccounts }: { active: boolean; scriptText: string; setScriptText: (s: string) => void; onGoAccounts: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [voices, setVoices] = useState<Voice[] | null>(null)
  const [voicesLoading, setVoicesLoading] = useState(false)
  const [voicesError, setVoicesError] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [ai, setAi] = useState<'' | 'edit' | 'emotion'>('')
  const caret = useRef(0)
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [result, setResult] = useState<{ audio: Blob; name: string } | null>(null)
  const loaded = useRef(false)
  const inFlight = useRef(false)

  const reload = async () => setAccounts(await getAccounts())

  useEffect(() => {
    void (async () => {
      const [s, d] = await Promise.all([getSettings(), getDraft()])
      setSettings(s)
      if (!scriptText) setScriptText(d)
      loaded.current = true
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  useEffect(() => { if (active) void reload() }, [active]) // counter/voices may have changed on another tab

  useEffect(() => {
    if (!loaded.current) return
    const t = setTimeout(() => void saveDraft(scriptText), 500)
    return () => clearTimeout(t)
  }, [scriptText])

  const update = (s: Settings) => { setSettings(s); void saveSettings(s) }
  const model = settings.draft ? MODEL_DRAFT : MODEL_FULL
  const now = Date.now()
  const needed = estimateCredits(scriptText, model)
  const total = totalCredits(accounts, now)
  const enough = pickAccount(accounts, needed, now, new Set()) !== null
  const tooLong = scriptText.length > MAX
  const firstUsable = accounts.find((a) => isUsable(a, now))

  const openVoices = () => {
    setVoiceOpen(true)
    if (voices || voicesLoading || !firstUsable) return
    setVoicesLoading(true)
    setVoicesError('')
    listVoices(firstUsable.key)
      .then(setVoices)
      .catch((e) => setVoicesError(`Lỗi ElevenLabs: ${e.message}`))
      .finally(() => setVoicesLoading(false))
  }

  const generate = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setToast('')
    setBusy('Đang tạo giọng…')
    try {
      const r = await generateSpeech({
        accounts: await getAccounts(), voiceId: settings.voiceId, text: scriptText, model, settings: settings.voice, now: Date.now(),
        onTry: (a) => setBusy(`Đang tạo · ${a.label}`),
      })
      await applyStatusUpdates(r.updates)
      await refreshAndMerge([r.accountId]).catch(() => {})
      await addHistory({ id: crypto.randomUUID(), createdAt: Date.now(), text: scriptText, voiceId: settings.voiceId, voiceName: settings.voiceName, model, accountId: r.accountId, audio: r.audio })
      setResult({ audio: r.audio, name: historyFileName(Date.now()) })
    } catch (e) {
      const updates = (e as ElevenError).updates
      if (updates) await applyStatusUpdates(updates).catch(() => {})
      setToast(e instanceof ElevenError && e.kind === 'all_exhausted' ? 'Hết credit ở tất cả account' : `Lỗi ElevenLabs: ${(e as Error).message}`)
    } finally {
      inFlight.current = false
      setBusy('')
      await reload()
    }
  }

  const openTags = () => { caret.current = ref.current?.selectionStart ?? scriptText.length; setTagOpen(true) } // saved before the sheet blurs the textarea
  const pickTag = (tag: string) => {
    const r = insertAt(scriptText, Math.min(caret.current, scriptText.length), tag)
    setTagOpen(false)
    setScriptText(r.text)
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(r.cursor, r.cursor) })
  }

  const noKey = accounts.length === 0
  const blocked = !!busy || tooLong || !scriptText.trim()
  const payer = scriptText.trim() ? pickAccount(accounts, needed, now, new Set()) : null
  const level = { 0: 'Sáng tạo', 0.5: 'Tự nhiên', 1: 'Ổn định' }[settings.voice.stability]
  const tool = 'press flex min-h-[72px] flex-col items-center justify-start gap-1.5 pt-3.5 rounded-2xl bg-raised px-2 py-2 text-[13px] leading-tight font-medium text-balance disabled:text-faint'

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      {/* a hidden screen has no title: the h1 belongs to whichever tab is showing */}
      <ScreenHeader title="Kịch bản" level={active ? 1 : 2}>
        <span className={`num mr-1 text-sm ${tooLong ? 'text-negative' : 'text-faint'}`}>{fmt(scriptText.length)}/{fmt(MAX)}</span>
        <IconButton label="Dán từ bộ nhớ" onClick={() => navigator.clipboard.readText().then((t) => t && setScriptText(scriptText ? `${scriptText}\n${t}` : t)).catch(() => {})}><ClipboardPaste size={20} /></IconButton>
        <IconButton label="Xoá kịch bản" disabled={!scriptText} onClick={() => { setScriptText(''); ref.current?.focus() }}><Eraser size={20} /></IconButton>
      </ScreenHeader>

      <section aria-label="Giọng đọc" className="rounded-[20px] bg-surface p-2">
        <div className="flex items-center gap-1">
          <button onClick={openVoices} className="press flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 text-left">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-raised text-[15px] font-semibold">{settings.voiceName.slice(0, 1)}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-medium">{settings.voiceName.split(' - ')[0]}<ChevronDown size={16} className="text-faint" /></span>
              <span className="num block truncate text-[13px] text-muted">{settings.draft ? 'Flash, bỏ tag' : 'Eleven v4'} · {level} · {settings.voice.speed.toFixed(2).replace('.', ',')}×</span>
            </span>
          </button>
          <IconButton label="Cài đặt giọng" onClick={() => setSettingsOpen(true)}><SlidersHorizontal size={20} /></IconButton>
        </div>
        <Segmented label="Chất lượng" value={settings.draft ? 'draft' : 'full'} onChange={(v) => update({ ...settings, draft: v === 'draft' })}
          options={[{ v: 'full', label: 'Chuẩn · có cảm xúc' }, { v: 'draft', label: 'Nháp · ½ credit' }]} />
      </section>

      <section aria-label="Kịch bản" className="overflow-hidden rounded-[20px] bg-surface transition-colors focus-within:bg-[#141414]">
        <ScriptEditor value={scriptText} onChange={setScriptText} inputRef={ref} placeholder="Dán hoặc gõ kịch bản tiếng Việt…" />
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          <button className={tool} onClick={openTags}><Drama size={20} />Cảm xúc</button>
          <button className={tool} disabled={!scriptText.trim()} onClick={() => setAi('edit')}><Sparkles size={20} />Sửa bằng AI</button>
          <button className={tool} disabled={!scriptText.trim()} onClick={() => setAi('emotion')}><WandSparkles size={20} />Tự thêm cảm xúc</button>
        </div>
      </section>

      {toast && <Notice onClose={() => setToast('')}>{toast}</Notice>}

      {result && (
        <section aria-label="Bản vừa tạo" className="rise rounded-[20px] bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Bản vừa tạo</h2>
            <span className="text-[13px] text-faint">{settings.voiceName.split(' - ')[0]} · đã lưu vào lịch sử</span>
          </div>
          <WavePlayer audio={result.audio} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <GhostButton icon={<Download size={18} />} onClick={() => saveAudioFile(result.audio, result.name).catch(() => {})}>Lưu file</GhostButton>
            <GhostButton icon={<RotateCcw size={18} />} disabled={blocked} onClick={generate}>Tạo lại</GhostButton>
          </div>
        </section>
      )}

      <div className="sticky z-10 -mx-4 bg-ground px-4 pt-2 pb-3" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
        {!noKey && (
          <p aria-live="polite" className={`num mb-2 text-center text-[13px] ${!scriptText.trim() || enough ? 'text-muted' : 'text-negative'}`}>
            {tooLong ? 'Tối đa 5.000 ký tự'
              : !scriptText.trim() ? <>Còn <span className="text-ink">{fmt(total)}</span> credit trên các account</>
              : enough ? <><i aria-hidden className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle" />≈ <span className="text-ink">{fmt(needed)}</span> credit từ {payer?.label} · còn {fmt(total)}{settings.draft && ' · bỏ tag'}</>
              : <>Cần {fmt(needed)} credit, không account nào đủ</>}
          </p>
        )}
        {noKey ? (
          <PrimaryButton className="w-full" icon={<KeyRound size={20} />} onClick={onGoAccounts}>Thêm key ElevenLabs</PrimaryButton>
        ) : (
          <PrimaryButton className="w-full" aria-live="polite" aria-busy={!!busy} disabled={!busy && blocked} onClick={generate}
            icon={busy ? <Meter /> : <AudioLines size={20} />}>
            {busy || 'Tạo giọng đọc'}
          </PrimaryButton>
        )}
      </div>
      <VoiceSheet
        open={voiceOpen} onClose={() => setVoiceOpen(false)} voices={voices} loading={voicesLoading} error={voicesError}
        hasKey={!!firstUsable} selectedId={settings.voiceId}
        onPick={(v) => update({ ...settings, voiceId: v.voice_id, voiceName: v.name })}
      />
      <AiSheet
        open={!!ai} autoEmotion={ai === 'emotion'} onClose={() => setAi('')} text={scriptText} provider={settings.aiProvider}
        onProvider={(p) => update({ ...settings, aiProvider: p })} onApply={(t) => { setScriptText(t); setAi('') }}
      />
      <TagSheet open={tagOpen} onClose={() => setTagOpen(false)} onPick={pickTag} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} value={settings.voice} onChange={(v) => update({ ...settings, voice: v })} />
    </div>
  )
}
