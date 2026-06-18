import { describe, expect, it } from 'vitest'
import { buildWorkbookExportRows } from '../../../src/main/export/workbookRows'

describe('buildWorkbookExportRows', () => {
  it('maps workbook current snapshots and source refs into export rows', () => {
    const rows = buildWorkbookExportRows(
      [
        {
          id: 'expr-1',
          itemType: 'Expression',
          state: 'active',
          currentSnapshot: {
            sourceText: 'break down',
            targetText: '拆解',
            gloss: 'analyze',
            contextText: 'Break down the task.',
            explanation: 'Use explicit steps.',
            quizPrompt: 'What does break down mean?',
            quizAnswer: 'Analyze step by step.',
            tags: ['agent chat'],
            flagged: true
          },
          sourceRefs: [
            {
              sessionId: 's1',
              sourceSpanRef: 'fixture:1',
              excerpt: 'Break down the task.'
            }
          ]
        },
        {
          id: 'sent-1',
          itemType: 'Sentence',
          state: 'active',
          currentSnapshot: {
            sourceText: 'Ship it, then verify.',
            targetText: '先发布，然后验证。',
            gloss: 'ship it',
            contextText: 'Ship it, then verify.',
            explanation: 'Release workflow.',
            quizPrompt: 'What follows shipping?',
            quizAnswer: 'Verification.',
            tags: ['release']
          },
          sourceRefs: [
            {
              sessionId: 's2',
              sourceSpanRef: 'fixture:2',
              excerpt: 'Ship it, then verify.'
            }
          ]
        }
      ],
      (sessionId) => (sessionId === 's1' ? 'codex' : 'claude')
    )

    expect(rows.expressions[0]).toMatchObject({
      expression: 'break down',
      translation: '拆解',
      gloss: 'analyze',
      context: 'Break down the task.',
      explanation: 'Use explicit steps.',
      quizPrompt: 'What does break down mean?',
      quizAnswer: 'Analyze step by step.',
      tags: ['agent chat'],
      flagged: true,
      sourceRefs: [
        {
          sessionId: 's1',
          sourceSpanRef: 'fixture:1',
          sourceType: 'codex'
        }
      ]
    })
    expect(rows.sentences[0]).toMatchObject({
      sentence: 'Ship it, then verify.',
      translation: '先发布，然后验证。',
      focus: 'ship it',
      context: 'Ship it, then verify.',
      note: 'Release workflow.',
      quizPrompt: 'What follows shipping?',
      quizAnswer: 'Verification.',
      tags: ['release'],
      sourceRefs: [
        {
          sessionId: 's2',
          sourceSpanRef: 'fixture:2',
          sourceType: 'claude'
        }
      ]
    })
  })
})
