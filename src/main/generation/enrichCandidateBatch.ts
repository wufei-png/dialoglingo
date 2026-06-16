import type { Settings } from '../../shared/schemas/settings'
import { enrichCliCandidateBatch, type CliBackendKind } from './cliClient'
import { enrichOpenAiCompatibleCandidateBatch } from './openAiCompatibleClient'

export async function enrichCandidateBatch(input: {
  provider: Settings['provider']
  modelBackend: Settings['modelBackend']
  prompt: string
}) {
  if (input.modelBackend.kind === 'openai-compatible') {
    return await enrichOpenAiCompatibleCandidateBatch({
      baseUrl: input.provider.baseUrl,
      apiKey: input.provider.apiKey,
      model: input.provider.defaultModel,
      prompt: input.prompt
    })
  }

  return await enrichCliCandidateBatch({
    kind: input.modelBackend.kind as CliBackendKind,
    cli: input.modelBackend.cli,
    prompt: input.prompt
  })
}
