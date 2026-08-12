import { useState } from 'react'
import { BotIcon, UserIcon, CopyIcon, CheckIcon, TrashIcon, AlertIcon } from './icons'
import { renderLite } from '../lib/markdown'
import { getModel } from '../lib/models'

export default function MessageBubble({ message, onDelete }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard permission denied — silently ignore
    }
  }

  return (
    <div className={`group flex gap-3 px-4 py-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-surface-700 text-slate-300' : 'bg-accent-600 text-white'
        }`}
      >
        {isUser ? <UserIcon width={16} height={16} /> : <BotIcon width={16} height={16} />}
      </div>

      <div className={`flex min-w-0 max-w-[75%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <span className="mb-1 text-xs font-medium text-slate-500">{getModel(message.model).label}</span>
        )}
        <div
          className={`prose-chat rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser ? 'bg-accent-600 text-white' : 'bg-surface-850 text-slate-100'
          } ${message.error ? 'border border-red-500/40' : ''}`}
        >
          {message.content ? (
            renderLite(message.content)
          ) : message.streaming ? (
            <span className="inline-block h-4 w-1.5 animate-blink bg-slate-400 align-middle" />
          ) : null}
          {message.content && message.streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-slate-400 align-middle" />
          )}
          {message.error && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
              <AlertIcon width={13} height={13} />
              {message.error}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleCopy}
            title="Copy message"
            className="rounded-md p-1 text-slate-500 hover:bg-surface-800 hover:text-slate-200"
          >
            {copied ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
          </button>
          <button
            onClick={() => onDelete(message.id)}
            title="Delete message"
            className="rounded-md p-1 text-slate-500 hover:bg-surface-800 hover:text-red-400"
          >
            <TrashIcon width={13} height={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
