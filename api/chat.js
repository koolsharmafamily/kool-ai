// Vercel Edge Function: proxies chat requests to Anthropic or OpenAI and
// re-emits a normalized SSE stream the frontend can consume regardless of
// provider: `data: {"delta":"..."}\n\n` chunks, ending with `data: [DONE]\n\n`.
//
// Required env vars (set in Vercel project settings, never in the client):
//   ANTHROPIC_API_KEY - required to use any claude-* model
//   OPENAI_API_KEY    - required to use any gpt-* model
//   GOOGLE_API_KEY    - required to use any gemini-* model (free tier available)

export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = 'You are Kool AI, a helpful, concise assistant.'

function providerForModel(model) {
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gpt')) return 'openai'
  if (model.startsWith('gemini')) return 'google'
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
        } else if (provider === 'openai') {
          await streamOpenAI({ messages, model, send })
        } else {
          await streamGoogle({ messages, model, send })
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

async function streamGoogle({ messages, model, send }) {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not configured on the server')

  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      }),
    }
  )

  if (!res.ok || !res.body) {
    const text = await safeText(res)
    throw new Error(`Google API error ${res.status}: ${text.slice(0, 300)}`)
  }

  let sawDelta = false
  let finishReason = null

  await forwardSSE(res.body, (evt) => {
    if (evt.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${evt.promptFeedback.blockReason}`)
    }
    const candidate = evt.candidates?.[0]
    if (candidate?.finishReason) finishReason = candidate.finishReason
    const delta = candidate?.content?.parts?.[0]?.text
    if (delta) {
      sawDelta = true
      send({ delta })
    }
  })

  if (!sawDelta) {
    throw new Error(
      finishReason
        ? `Gemini returned no text (finishReason: ${finishReason})`
        : 'Gemini returned an empty response stream'
    )
  }
}

async function forwardSSE(body, onEvent) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const decoded = decoder.decode(value, { stream: true })
    // Normalize CRLF to LF — Gemini's SSE stream separates events with
    // "\r\n\r\n", which a plain "\n\n" split never matches, silently
    // dropping every event. Anthropic/OpenAI already use bare "\n", so
    // this is a no-op for them.
    buffer += decoded.replace(/\r\n/g, '\n')

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop()

    for (const chunk of chunks) {
      // Per the SSE spec a single event's data can span multiple physical
      // lines, each prefixed with "data:" — join them all before parsing.
      // (Gemini's JSON payloads can be large enough to get wrapped this way;
      // Anthropic/OpenAI always send one line, so this is a no-op for them.)
      const dataLines = chunk.split('\n').filter((l) => l.startsWith('data:'))
      if (dataLines.length === 0) continue
      const data = dataLines
        .map((l) => l.slice(5).trimStart())
        .join('\n')
        .trim()
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
