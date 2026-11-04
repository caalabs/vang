export type Tag = { tag: string; vi: string; group: 'Cảm xúc' | 'Cách nói' | 'Âm thanh' | 'Ngắt nghỉ' }

const t = (group: Tag['group'], list: [string, string][]): Tag[] => list.map(([tag, vi]) => ({ tag: `[${tag}]`, vi, group }))

// ElevenLabs has no tag-listing API; these are examples from their v3 audio-tag docs.
export const AUDIO_TAGS: Tag[] = [
  ...t('Cảm xúc', [
    ['excited', 'Hào hứng'], ['happy', 'Vui'], ['sad', 'Buồn'], ['angry', 'Giận'], ['curious', 'Tò mò'],
    ['sarcastic', 'Mỉa mai'], ['nervous', 'Lo lắng'], ['calm', 'Bình tĩnh'], ['surprised', 'Ngạc nhiên'],
  ]),
  ...t('Cách nói', [
    ['whispers', 'Thì thầm'], ['shouts', 'Hét'], ['dramatic', 'Kịch tính'], ['mischievously', 'Tinh nghịch'], ['softly', 'Nhẹ nhàng'],
  ]),
  ...t('Âm thanh', [
    ['laughs', 'Cười'], ['chuckles', 'Cười khẽ'], ['giggles', 'Khúc khích'], ['crying', 'Khóc'], ['sighs', 'Thở dài'],
    ['clears throat', 'Hắng giọng'], ['gasps', 'Há hốc'], ['exhales', 'Thở ra'], ['sniffs', 'Sụt sịt'],
  ]),
  ...t('Ngắt nghỉ', [['short pause', 'Nghỉ ngắn'], ['long pause', 'Nghỉ dài']]),
]

export const TAG_SET = new Set(AUDIO_TAGS.map((x) => x.tag))
