# Kool AI

A functional AI chat interface — React + Vite + Tailwind on the frontend, a
serverless proxy that streams from Google's Gemini API.

## Features

- Chat input + message list with auto-scroll
- Message history persisted to `localStorage` (survives reloads)
- Model selector: Gemini Flash and Flash-Lite (free tier, both live)
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
| `GOOGLE_API_KEY` | Gemini Flash / Flash-Lite (latest) | https://aistudio.google.com/apikey | Free tier (rate-limited) |

The Gemini models use Google's rolling `-latest` aliases
(`gemini-flash-latest`, `gemini-flash-lite-latest`) rather than dated model
IDs, so they keep working automatically as Google retires older versions.
Without `GOOGLE_API_KEY` set, the app falls back to demo mode. Keys are read
**server-side only** inside `api/chat.js` and are never sent to the browser.

### Re-enabling Claude or GPT models

The backend proxy still supports Anthropic and OpenAI (`streamAnthropic` /
`streamOpenAI` in [api/chat.js](api/chat.js)) — they were removed from the
model picker only because no `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` was
configured, so those options just errored or fell back to demo mode. To bring
either back: add the corresponding entry to `MODELS` in
[src/lib/models.js](src/lib/models.js) and set the matching key in Vercel's
Environment Variables.

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
cp .env.example .env.local   # fill in GOOGLE_API_KEY
vercel dev
```

## Deploying to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo (or run `vercel` from
   the project root to deploy directly from your machine).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo. It
   auto-detects the Vite framework via `vercel.json`.
3. Under **Project Settings → Environment Variables**, add `GOOGLE_API_KEY`
   with your Google AI Studio key (the **Key** field must be exactly
   `GOOGLE_API_KEY` — no spaces, all caps).
4. Deploy. Vercel builds the Vite app to `dist/` and automatically deploys
   `api/chat.js` as an Edge Function at `/api/chat` — no extra config needed.
5. Open the deployed URL, pick a model, and chat. If the key is missing, the
   chat bubble shows the specific error ("GOOGLE_API_KEY is not configured
   on the server") instead of silently failing.

### CLI alternative

```bash
npm install -g vercel
vercel login
vercel            # deploy a preview
vercel env add GOOGLE_API_KEY
vercel --prod     # deploy to production
```

## Notes on the streaming protocol

`api/chat.js` normalizes the provider's response into a wire format the
frontend can consume regardless of which provider is behind a given model
(useful if you re-enable Claude or GPT later):

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
