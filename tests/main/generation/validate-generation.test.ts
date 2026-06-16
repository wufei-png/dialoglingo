import { describe, expect, it } from 'vitest'
import { validateGenerationRequest } from '../../../src/main/generation/validateGeneration'

describe('validateGenerationRequest', () => {
  it('rejects empty selections and missing API provider config before a job starts', () => {
    expect(() =>
      validateGenerationRequest({
        sessionIds: [],
        settings: {
          provider: {
            baseUrl: 'http://localhost:4000',
            apiKey: 'sk-test',
            defaultModel: 'gpt-4o-mini'
          },
          modelBackend: {
            kind: 'openai-compatible',
            cli: {
              codex: { executablePath: '', model: '' },
              claude: { executablePath: '', model: '' },
              opencode: { executablePath: '', model: '' },
              timeoutMs: 120000
            }
          }
        }
      })
    ).toThrow('Select at least one session')

    expect(() =>
      validateGenerationRequest({
        sessionIds: ['s1'],
        settings: {
          provider: {
            baseUrl: '',
            apiKey: '',
            defaultModel: ''
          },
          modelBackend: {
            kind: 'openai-compatible',
            cli: {
              codex: { executablePath: '', model: '' },
              claude: { executablePath: '', model: '' },
              opencode: { executablePath: '', model: '' },
              timeoutMs: 120000
            }
          }
        }
      })
    ).toThrow('Configure OpenAI-compatible')
  })

  it('does not require API provider config for CLI backends', () => {
    expect(() =>
      validateGenerationRequest({
        sessionIds: ['s1'],
        settings: {
          provider: {
            baseUrl: '',
            apiKey: '',
            defaultModel: ''
          },
          modelBackend: {
            kind: 'codex-cli',
            cli: {
              codex: { executablePath: '', model: '' },
              claude: { executablePath: '', model: '' },
              opencode: { executablePath: '', model: '' },
              timeoutMs: 120000
            }
          }
        }
      })
    ).not.toThrow()
  })
})
