import {
  DEFAULT_MODEL_BACKEND,
  type Settings
} from '../../shared/schemas/settings'

export function validateGenerationRequest(input: {
  sessionIds: string[]
  settings: {
    provider: Settings['provider']
    modelBackend?: Settings['modelBackend']
  }
}) {
  if (input.sessionIds.length === 0) {
    throw new Error('Select at least one session before generating.')
  }

  const backendKind = input.settings.modelBackend?.kind ?? DEFAULT_MODEL_BACKEND.kind
  if (
    backendKind === 'openai-compatible' &&
    (
      !input.settings.provider.baseUrl.trim() ||
      !input.settings.provider.apiKey.trim() ||
      !input.settings.provider.defaultModel.trim()
    )
  ) {
    throw new Error('Configure OpenAI-compatible base URL, API key, and default model first.')
  }
}
