import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  enrichOpenAiCompatibleCandidateBatch,
  normalizeOpenAiChatCompletionsUrl
} from '../../../src/main/generation/openAiCompatibleClient'
import { ModelAdapterError } from '../../../src/main/generation/modelAdapter'

describe('normalizeOpenAiChatCompletionsUrl', () => {
  it('accepts proxy root, v1 base, and full chat completions URLs', () => {
    expect(normalizeOpenAiChatCompletionsUrl('http://localhost:4000')).toBe(
      'http://localhost:4000/v1/chat/completions'
    )
    expect(normalizeOpenAiChatCompletionsUrl('http://localhost:4000/v1')).toBe(
      'http://localhost:4000/v1/chat/completions'
    )
    expect(
      normalizeOpenAiChatCompletionsUrl(
        'http://localhost:4000/v1/chat/completions'
      )
    ).toBe('http://localhost:4000/v1/chat/completions')
  })
})

describe('enrichOpenAiCompatibleCandidateBatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses structured OpenAI-compatible JSON responses', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      itemType: 'Expression',
                      sourceText: 'ship it',
                      targetText: '发布它',
                      gloss: 'ship',
                      contextText: 'We can ship it today.',
                      explanation: 'A common product phrase.',
                      quizPrompt: 'Translate: ship it',
                      quizAnswer: '发布它',
                      tags: ['product']
                    }
                  ]
                })
              }
            }
          ]
        }),
        { status: 200 }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const items = await enrichOpenAiCompatibleCandidateBatch({
      baseUrl: 'http://localhost:4000',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      prompt: 'candidate'
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/chat/completions',
      expect.any(Object)
    )
    expect(items).toHaveLength(1)
    expect(items[0].itemType).toBe('Expression')
  })

  it('classifies invalid structured payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"items":[{"itemType":"Expression"}]}' } }]
          }),
          { status: 200 }
        )
      )
    )

    await expect(
      enrichOpenAiCompatibleCandidateBatch({
        baseUrl: 'http://localhost:4000',
        apiKey: 'sk-test',
        model: 'gpt-4o-mini',
        prompt: 'candidate'
      })
    ).rejects.toMatchObject({
      reason: 'invalid-structured-payload'
    } satisfies Partial<ModelAdapterError>)
  })
})
