/** Insert `tag` at `pos`, padding with single spaces where needed; cursor lands after the tag and its trailing space. */
export function insertAt(text: string, pos: number, tag: string): { text: string; cursor: number } {
  const before = text.slice(0, pos)
  const after = text.slice(pos)
  const pre = before && !/\s$/.test(before) ? ' ' : ''
  const post = after && !/^\s/.test(after) ? ' ' : ''
  const head = before + pre + tag
  return { text: head + post + after, cursor: head.length + (post || after ? 1 : 0) }
}
