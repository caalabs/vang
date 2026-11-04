// Dev-only sample data so every screen can be screenshotted full. Loaded by main.tsx on /?demo in dev builds only.
import { set } from 'idb-keyval'
import type { Account, HistoryItem } from '../lib/types'

const day = 86_400_000
const now = Date.now()
const reset = (d: number) => now + d * day
const fake = (i: number) => `sk_demo${String(i).padStart(2, '0')}${'x'.repeat(30)}${(1000 + i * 37).toString(16)}`

// used / limit per account; remaining across 'ok' accounts = 48.034
const rows: [number, Account['status'], number][] = [
  [10000, 'empty', 5], [10000, 'empty', 7], [6214, 'ok', 12], [1880, 'ok', 15], [0, 'ok', 21],
  [342, 'ok', 22], [9120, 'ok', 9], [2600, 'banned', 18], [4410, 'ok', 26], [0, 'ok', 28],
]

const SCRIPT = `[excited] Chào mừng các bạn quay lại kênh! Hôm nay mình kể cho các bạn nghe về một quán phở nhỏ ở phố Hàng Bông, mở cửa từ năm giờ sáng.

[whispers] Bí mật nằm ở nồi nước dùng, ninh suốt mười hai tiếng. [short pause] Các bạn đã sẵn sàng chưa?`

const TAKES: [number, string, 'eleven_v4' | 'eleven_flash_v2_5'][] = [
  [now - 40 * 60_000, SCRIPT, 'eleven_v4'],
  [now - 3 * 3_600_000, 'Xin chào, đây là bản đọc thử tốc độ một phẩy một lần.', 'eleven_flash_v2_5'],
  [now - day - 2 * 3_600_000, '[curious] Bạn có biết vì sao bánh mì Việt Nam lại giòn đến vậy không? Câu trả lời nằm ở bột gạo.', 'eleven_v4'],
  [now - day - 6 * 3_600_000, 'Tập ba: chuyến tàu đêm Hà Nội – Lào Cai. [sighs] Tám tiếng, một toa giường nằm và một ấm trà nóng.', 'eleven_v4'],
  [now - 4 * day, 'Cảm ơn các bạn đã xem hết video. Nhớ bấm theo dõi để không bỏ lỡ tập sau nhé!', 'eleven_v4'],
]

export async function seed() {
  const accounts: Account[] = rows.map(([used, status, d], i) => ({
    id: `demo-${i + 1}`, label: `Acc ${i + 1}`, key: fake(i + 1), used, limit: 10000, resetAt: reset(d), status, checkedAt: now,
  }))
  const audio = await fetch('/scratch-spike/v4.mp3').then((r) => (r.ok ? r.blob() : new Blob()))
  const history: HistoryItem[] = TAKES.map(([t, text, model], i) => ({
    id: `take-${i}`, createdAt: t, text, voiceId: 'pNInz6obpgDQGcFmaJgB', voiceName: 'Adam', model, accountId: 'demo-3', audio,
  }))
  await Promise.all([
    set('accounts', accounts), set('history', history), set('draft', SCRIPT),
    set('aiKeys', { gemini: 'AIzaDemoKeyForScreenshots0000', claude: '' }),
  ])
}
