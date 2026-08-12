export const MODELS = [
  {
    id: 'gemini-flash-latest',
    label: 'Gemini Flash (latest)',
    provider: 'google',
    description: 'Free tier available — auto-updates to the current Flash model',
  },
  {
    id: 'gemini-flash-lite-latest',
    label: 'Gemini Flash-Lite (latest)',
    provider: 'google',
    description: 'Free tier available — auto-updates to the current Flash-Lite model',
  },
]

export const DEFAULT_MODEL_ID = MODELS[0].id

const PROVIDER_COLORS = {
  anthropic: 'bg-accent-500',
  openai: 'bg-emerald-500',
  google: 'bg-sky-500',
}

export function getModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0]
}

export function providerForModel(id) {
  return getModel(id).provider
}

export function providerColor(provider) {
  return PROVIDER_COLORS[provider] || 'bg-slate-500'
}
