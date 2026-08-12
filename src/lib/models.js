export const MODELS = [
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    provider: 'anthropic',
    description: 'Balanced speed and intelligence',
  },
  {
    id: 'claude-opus-5',
    label: 'Claude Opus 5',
    provider: 'anthropic',
    description: 'Most capable, best for complex tasks',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fastest, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    description: "OpenAI's multimodal flagship",
  },
  {
    id: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'High intelligence, larger context',
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and inexpensive',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Free tier available — fast and capable',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Free tier available — lightweight',
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
