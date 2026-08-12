// Streams a chat completion from the /api/chat backend proxy (SSE, normalized
// to `{"delta": "..."}` events terminated by a `[DONE]` sentinel). If the
// proxy is unreachable (e.g. running `vite dev` without `vercel dev`, or no
// API key configured yet) it transparently falls back to a simulated local
// stream so the UI remains testable end to end.
export async function streamChat({ messages, model, signal, onDelta, onDone, onError }) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
      signal,
    })

    if (!res.ok || !res.body) {
      throw new Error(`backend unavailable (status ${res.status})`)
    }

    await consumeSSE(res.body, { onDelta, onDone, onError })
  } catch (err) {
    if (err?.name === 'AbortError') {
      onDone()
      return
    }
    if (err?.name === 'BackendStreamError') {
      onError(err.message)
      return
    }
    // No backend / no API key configured yet — demo mode keeps the UI usable.
    await simulateStream({ messages, model, signal, onDelta, onDone })
  }
}

async function consumeSSE(body, { onDelta, onDone, onError }) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop()

    for (const chunk of chunks) {
      const line = chunk.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      const data = line.slice(5).trim()
      if (!data) continue
      if (data === '[DONE]') {
        onDone()
        return
      }
      try {
        const parsed = JSON.parse(data)
        if (parsed.delta) onDelta(parsed.delta)
        if (parsed.error) {
          const err = new Error(parsed.error)
          err.name = 'BackendStreamError'
          throw err
        }
      } catch (e) {
        if (e?.name === 'BackendStreamError') throw e
        // ignore malformed partial chunks
      }
    }
  }
  onDone()
}

async function simulateStream({ messages, model, signal, onDelta, onDone }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const reply = buildDemoReply(lastUser, model)
  const tokens = reply.split(/(\s+)/)

  for (const token of tokens) {
    if (signal?.aborted) {
      onDone()
      return
    }
    await sleep(15 + Math.random() * 35)
    onDelta(token)
  }
  onDone()
}

function buildDemoReply(prompt, model) {
  const trimmed = prompt.trim().slice(0, 160)
  return (
    `**[Demo mode]** No backend is connected, so this is a simulated streaming reply.\n\n` +
    `You asked (via **${model}**): "${trimmed || '...'}"\n\n` +
    `To get real answers, deploy the included \`/api/chat\` proxy and set ` +
    `\`ANTHROPIC_API_KEY\` or \`OPENAI_API_KEY\` — see the README for setup. ` +
    `Everything else here (streaming animation, history, copy/delete, model switching) ` +
    `is fully functional already.`
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
