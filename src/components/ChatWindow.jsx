import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { BotIcon } from './icons'

export default function ChatWindow({ messages, onDelete }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600/15 text-accent-400">
          <BotIcon width={28} height={28} />
        </div>
        <h2 className="text-lg font-medium text-slate-200">Kool AI</h2>
        <p className="max-w-sm text-sm text-slate-500">
          Ask anything. Pick a model above, and your reply will stream in as it's generated.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onDelete={onDelete} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
