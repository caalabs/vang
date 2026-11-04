import { TAG_SET } from './tags'

export type AiAction = 'fix' | 'speakable' | 'shorter' | 'longer' | 'custom' | 'emotion'
export type AiProvider = 'gemini' | 'claude'

const BASE = 'Chỉ trả về kịch bản đã sửa, không giải thích, không markdown.'

// NOTE: faithful equivalent of ElevenLabs "Enhancing input" prompt (page could not be fetched verbatim).
const EMOTION = `# Instructions

## 1. Role and Goal

You are an AI assistant specializing in enhancing dialogue text for speech generation.

Your PRIMARY GOAL is to dynamically integrate **audio tags** (e.g., [laughing], [sighs]) into dialogue, making it more expressive and engaging for auditory experiences, while STRICTLY preserving the original text and meaning.

## 2. Core Directives

- Add audio tags that describe the speaker's voice or vocal delivery, placed directly before or after the line or phrase they modify.
- The tags must match the emotion and meaning of the dialogue and must never contradict it.
- Preserve the original words exactly: do not add, remove, reorder or change any word. Never place original text inside brackets.
- Do not use tags for music, sound effects or stage directions; only voice and vocal delivery.
- Only audio tags may be added. Every other character (letters, capitalization, punctuation, ellipses, spaces) must stay identical to the input.
- Do not invent dialogue. Avoid sensitive topics such as politics, religion, profanity or NSFW content.
- Return ONLY the enhanced text, nothing else.`

const TASKS: Record<Exclude<AiAction, 'custom' | 'emotion'>, string> = {
  fix: 'Sửa lỗi chính tả, ngữ pháp và dấu câu của kịch bản tiếng Việt, giữ nguyên ý và giọng văn.',
  speakable: 'Viết lại kịch bản để dễ đọc thành tiếng: viết số, ngày, đơn vị, viết tắt thành chữ tiếng Việt; dùng câu ngắn; bỏ emoji và ký hiệu.',
  shorter: 'Rút gọn kịch bản khoảng 30% độ dài, giữ ý chính.',
  longer: 'Mở rộng kịch bản thêm khoảng 30% độ dài, giữ ý và giọng văn.',
}

export function systemPrompt(action: AiAction, instruction = ''): string {
  if (action === 'emotion')
    return `${EMOTION}\n\nChỉ dùng các tag sau: ${[...TAG_SET].join(' ')}. Không thay đổi, thêm hay xoá bất kỳ chữ nào.`
  const task = action === 'custom' ? instruction.trim() : TASKS[action]
  return `${task}\n${BASE}`
}
