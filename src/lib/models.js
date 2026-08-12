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
]

export const DEFAULT_MODEL_ID = MODELS[0].id

export function getModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0]
}

export function providerForModel(id) {
  return getModel(id).provider
}
