import { useChat } from './hooks/useChat'
import ChatWindow from './components/ChatWindow'
import ChatInput from './components/ChatInput'
import ModelSelector from './components/ModelSelector'
import { PlusIcon, BotIcon } from './components/icons'

export default function App() {
  const {
    messages,
    model,
    setModel,
    isStreaming,
    sendMessage,
    stopStreaming,
    deleteMessage,
    newConversation,
  } = useChat()

  return (
    <div className="flex h-screen flex-col bg-surface-950">
      <header className="flex items-center justify-between border-b border-surface-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white">
            <BotIcon width={16} height={16} />
          </div>
          <span className="text-sm font-semibold text-slate-100">Kool AI</span>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector value={model} onChange={setModel} disabled={isStreaming} />
          <button
            onClick={newConversation}
            disabled={messages.length === 0 && !isStreaming}
            title="New conversation"
            className="flex items-center gap-1.5 rounded-lg border border-surface-700 bg-surface-850 px-3 py-1.5 text-sm text-slate-200 hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon width={14} height={14} />
            New chat
          </button>
        </div>
      </header>

      <ChatWindow messages={messages} onDelete={deleteMessage} />
      <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  )
}
