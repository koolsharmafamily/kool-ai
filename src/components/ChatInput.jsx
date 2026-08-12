import { useEffect, useRef, useState } from 'react'
import { SendIcon, StopIcon } from './icons'

export default function ChatInput({ onSend, onStop, isStreaming }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const submit = () => {
    if (!value.trim() || isStreaming) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-surface-800 bg-surface-950 px-4 py-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-surface-700 bg-surface-850 px-3 py-2 focus-within:border-accent-500">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Kool AI..."
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            title="Stop generating"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-700 text-slate-200 hover:bg-surface-600"
          >
            <StopIcon width={14} height={14} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim()}
            title="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-slate-500"
          >
            <SendIcon width={14} height={14} />
          </button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-600">
        Kool AI can make mistakes. Enter to send, Shift+Enter for a new line.
      </p>
    </div>
  )
}
