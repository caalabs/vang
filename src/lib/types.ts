export type ModelId = 'eleven_v4' | 'eleven_v3' | 'eleven_flash_v2_5'
export type AccountStatus = 'ok' | 'empty' | 'banned'
export type Account = { id: string; label: string; key: string; used: number; limit: number; resetAt: number | null; status: AccountStatus; checkedAt: number }
export type Voice = { voice_id: string; name: string; preview_url: string | null }
export type VoiceSettings = { stability: 0 | 0.5 | 1; speed: number }
export type HistoryItem = { id: string; createdAt: number; text: string; voiceId: string; voiceName: string; model: ModelId; accountId: string; audio: Blob }
export type Settings = { voiceId: string; voiceName: string; draft: boolean; voice: VoiceSettings; aiProvider: 'gemini' | 'claude' }
