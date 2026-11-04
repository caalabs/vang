import { type Ref } from 'react'
import { TaggedText } from './ui'

/**
 * A textarea whose audio tags show highlighted: a mirror div with identical metrics sits under a
 * transparent textarea. The mirror sets the height, so the textarea never scrolls on its own.
 */
export default function ScriptEditor({ value, onChange, inputRef, placeholder }: {
  value: string; onChange: (v: string) => void; inputRef: Ref<HTMLTextAreaElement>; placeholder: string
}) {
  const metrics = 'whitespace-pre-wrap break-words px-5 pt-5 pb-4 text-[17px] leading-[1.65]'
  return (
    <div className="relative">
      <div aria-hidden className={`${metrics} script-mirror min-h-[38dvh] text-ink`}><TaggedText text={value} />{'\n\u200b'}</div>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Kịch bản"
        spellCheck={false}
        className={`${metrics} absolute inset-0 resize-none overflow-hidden bg-transparent text-transparent caret-ink outline-none placeholder:text-faint`}
      />
    </div>
  )
}
