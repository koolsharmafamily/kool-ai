# Kool AI

A functional AI chat interface — React + Vite + Tailwind on the frontend, a
serverless proxy that streams from the Anthropic, OpenAI, or Google API.

## Features

- Chat input + message list with auto-scroll
- Message history persisted to `localStorage` (survives reloads)
- Model selector: 3 Claude models, 3 GPT models, 2 Gemini models (free tier)
- Token-by-token streaming with a blinking cursor while generating
- New conversation / clear chat
- Copy message, delete message
- Stop-generating button while a response is streaming
- **Demo mode**: if no backend/API key is configured, the app falls back to a
  simulated stream so the UI is fully testable without any setup

## Project structure

```
api/chat.js            Vercel Edge Function — proxies to Anthropic/OpenAI/Google, normalizes SSE
src/
  App.jsx              Layout: header, chat window, input
  hooks/useChat.js      Message state, localStorage persistence, streaming lifecycle
  lib/api.js            Client-side SSE consumer + demo-mode fallback
  lib/models.js         Model list (id, label, provider)
  lib/markdown.jsx       Minimal renderer for **bold**, `code`, ```code fences```
  components/
    ChatWindow.jsx       Message list + empty state
    MessageBubble.jsx     Single message: avatar, content, copy/delete actions
    ChatInput.jsx         Autosizing textarea + send/stop button
    ModelSelector.jsx     Dropdown model picker
    icons.jsx             Inline SVG icons (no icon library dependency)
```

## Required API keys

| Key | Used for | Get it from | Cost |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet 5 / Opus 5 / Haiku 4.5 | https://console.anthropic.com/ | Pay-as-you-go |
| `OPENAI_API_KEY` | GPT-4o / GPT-4 Turbo / GPT-3.5 Turbo | https://platform.openai.com/api-keys | Pay-as-you-go |
| `GOOGLE_API_KEY` | Gemini Flash / Flash-Lite (latest) | https://aistudio.google.com/apikey | Free tier (rate-limited) |

The Gemini models use Google's rolling `-latest` aliases
(`gemini-flash-latest`, `gemini-flash-lite-latest`) rather than dated model
IDs, so they keep working automatically as Google retires older versions.

You only need the key(s) for the provider(s) you actually want to use — the
app works in demo mode with none set. If you want real responses at zero
cost, Google AI Studio's free tier (`GOOGLE_API_KEY`) is the one to grab —
no payment method required, just rate-limited. Keys are read **server-side
only** inside `api/chat.js` and are never sent to the browser.

## Local development

Requires [Node.js](https://nodejs.org/) 18+ (not currently installed in this
environment — install it first).

```bash
npm install
npm run dev
```

This runs the Vite dev server only (`http://localhost:5173`). There's no
`api/chat.js` backing it, so every request automatically falls back to demo
mode — enough to exercise the whole UI (streaming animation, model switch,
copy/delete, new chat) without any keys.

To test real streaming locally, install the Vercel CLI and run both the
static site and the serverless function together:

```bash
npm install -g vercel
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY, OPENAI_API_KEY, and/or GOOGLE_API_KEY
vercel dev
```

## Deploying to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo (or run `vercel` from
   the project root to deploy directly from your machine).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo. It
   auto-detects the Vite framework via `vercel.json`.
3. Under **Project Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your Anthropic key (skip if you won't use Claude models)
   - `OPENAI_API_KEY` — your OpenAI key (skip if you won't use GPT models)
   - `GOOGLE_API_KEY` — your Google AI Studio key (skip if you won't use Gemini models; this is the free-tier option)
4. Deploy. Vercel builds the Vite app to `dist/` and automatically deploys
   `api/chat.js` as an Edge Function at `/api/chat` — no extra config needed.
5. Open the deployed URL, pick a model, and chat. If a key for the selected
   model's provider is missing, the chat bubble shows the specific error
   (e.g. "ANTHROPIC_API_KEY is not configured on the server") instead of
   silently failing.

### CLI alternative

```bash
npm install -g vercel
vercel login
vercel            # deploy a preview
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_API_KEY
vercel --prod     # deploy to production
```

## Notes on the streaming protocol

`api/chat.js` normalizes all three providers into the same wire format so the
frontend never needs to know which provider is behind a given model:

```
data: {"delta":"Hel"}

data: {"delta":"lo"}

data: [DONE]

```

Anthropic's `content_block_delta` text events, OpenAI's
`choices[0].delta.content` chunks, and Gemini's
`candidates[0].content.parts[0].text` chunks are all translated into
`{"delta": "..."}` before being forwarded, so swapping models never changes
frontend code.
