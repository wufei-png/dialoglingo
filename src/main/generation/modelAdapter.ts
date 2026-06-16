import { z } from 'zod'

export type ModelAdapterFailureReason =
  | 'provider-timeout'
  | 'model-request-failure'
  | 'invalid-structured-payload'

const learningItemDraftSchema = z.object({
  itemType: z.enum(['Expression', 'Sentence']),
  sourceText: z.string(),
  targetText: z.string(),
  gloss: z.string(),
  contextText: z.string(),
  explanation: z.string(),
  quizPrompt: z.string(),
  quizAnswer: z.string(),
  tags: z.array(z.string())
})

const responsePayloadSchema = z.union([
  z.array(learningItemDraftSchema),
  z.object({ items: z.array(learningItemDraftSchema) }).transform((value) => value.items)
])

export type LearningItemDraft = z.infer<typeof learningItemDraftSchema>

export class ModelAdapterError extends Error {
  constructor(
    message: string,
    readonly reason: ModelAdapterFailureReason
  ) {
    super(message)
    this.name = 'ModelAdapterError'
  }
}

export function learningItemJsonSchema() {
  const itemProperties = {
    itemType: { type: 'string', enum: ['Expression', 'Sentence'] },
    sourceText: { type: 'string' },
    targetText: { type: 'string' },
    gloss: { type: 'string' },
    contextText: { type: 'string' },
    explanation: { type: 'string' },
    quizPrompt: { type: 'string' },
    quizAnswer: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } }
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: itemProperties,
          required: Object.keys(itemProperties)
        }
      }
    },
    required: ['items']
  }
}

export function parseLearningItemPayload(payload: unknown) {
  try {
    return responsePayloadSchema.parse(payload)
  } catch (error) {
    throw new ModelAdapterError(
      error instanceof Error ? error.message : 'Invalid structured payload.',
      'invalid-structured-payload'
    )
  }
}

export function parseLearningItemContent(content: string) {
  try {
    return parseLearningItemPayload(JSON.parse(content))
  } catch (error) {
    if (error instanceof ModelAdapterError) {
      throw error
    }

    throw new ModelAdapterError(
      error instanceof Error ? error.message : 'Invalid structured payload.',
      'invalid-structured-payload'
    )
  }
}
