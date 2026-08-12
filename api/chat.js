// Vercel Edge Function: proxies chat requests to Anthropic or OpenAI and
// re-emits a normalized SSE stream the frontend can consume regardless of
// provider: `data: {"delta":"..."}\n\n` chunks, ending with `data: [DONE]\n\n`.
//
// Required env vars (set in Vercel project settings, never in the client):
//   ANTHROPIC_API_KEY - required to use any claude-* model
//   OPENAI_API_KEY    - required to use any gpt-* model

export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = 'You are Kool AI, a helpful, concise assistant.'

function providerForModel(model) {
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gpt')) return 'openai'
  return null
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { messages, model } = body || {}
  if (!Array.isArray(messages) || messages.length === 0 || typeof model !== 'string') {
    return new Response('Request must include messages[] and model', { status: 400 })
  }

  const provider = providerForModel(model)
  if (!provider) {
    return new Response(`Unrecognized model: ${model}`, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      try {
        if (provider === 'anthropic') {
          await streamAnthropic({ messages, model, send })
        } else {
          await streamOpenAI({ messages, model, send })
        }
      } catch (err) {
        send({ error: err.message || 'Upstream stream error' })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

async function streamAnthropic({ messages, model, send }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server')

  const chatMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: chatMessages,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const text = await safeText(res)
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`)
  }

  await forwardSSE(res.body, (evt) => {
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      send({ delta: evt.delta.text })
    } else if (evt.type === 'error') {
      throw new Error(evt.error?.message || 'Anthropic stream error')
    }
  })
}

async function streamOpenAI({ messages, model, send }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server')

  const chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const text = await safeText(res)
    throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 300)}`)
  }

  await forwardSSE(res.body, (evt) => {
    const delta = evt.choices?.[0]?.delta?.content
    if (delta) send({ delta })
  })
}

async function forwardSSE(body, onEvent) {
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
      if (!data || data === '[DONE]') continue
      let evt
      try {
        evt = JSON.parse(data)
      } catch {
        continue
      }
      onEvent(evt)
    }
  }
}

async function safeText(res) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}
