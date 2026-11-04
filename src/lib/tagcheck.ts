import { stripTags } from './accounts'

const TAG_RE = /\[[^\]]*\]/g
export const tagsIn = (text: string) => text.match(TAG_RE) ?? []

/** Remove every [tag] not in `allowed`, then tidy the spaces it leaves. */
export const filterUnknownTags = (text: string, allowed: Set<string>) =>
  text.replace(TAG_RE, (t) => (allowed.has(t) ? t : '')).replace(/[ \t]{2,}/g, ' ').replace(/ +([.,!?…])/g, '$1').trim()

const norm = (s: string) => stripTags(s).normalize('NFC')
export const sameWords = (a: string, b: string) => norm(a) === norm(b)
