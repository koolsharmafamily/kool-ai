import { useCallback, useEffect, useRef, useState } from 'react'
import { streamChat } from '../lib/api'
import { DEFAULT_MODEL_ID } from '../lib/models'

const MESSAGES_KEY = 'kool-ai-messages'
const MODEL_KEY = 'kool-ai-model'

function loadMessages() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadModel() {
  return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL_ID
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useChat() {
  const [messages, setMessages] = useState(loadMessages)
  const [model, setModel] = useState(loadModel)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem(MODEL_KEY, model)
  }, [model])

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const userMessage = { id: makeId(), role: 'user', content: trimmed, model, createdAt: Date.now() }
      const assistantId = makeId()
      const assistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        model,
        createdAt: Date.now(),
        streaming: true,
        error: null,
      }

      const history = [...messages, userMessage]
      setMessages([...history, assistantMessage])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      const updateAssistant = (patch) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch(m) } : m)))
      }

      await streamChat({
        messages: history.map(({ role, content }) => ({ role, content })),
        model,
        signal: controller.signal,
        onDelta: (delta) => {
          updateAssistant((m) => ({ content: m.content + delta }))
        },
        onDone: () => {
          updateAssistant(() => ({ streaming: false }))
          setIsStreaming(false)
          abortRef.current = null
        },
        onError: (message) => {
          updateAssistant((m) => ({
            streaming: false,
            error: message,
            content: m.content || 'Something went wrong generating this response.',
          }))
          setIsStreaming(false)
          abortRef.current = null
        },
      })
    },
    [messages, model, isStreaming]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const deleteMessage = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const newConversation = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages([])
  }, [])

  return {
    messages,
    model,
    setModel,
    isStreaming,
    sendMessage,
    stopStreaming,
    deleteMessage,
    newConversation,
  }
}
