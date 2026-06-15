import { z } from 'zod'

export const sourceTypeSchema = z.enum(['codex', 'claude', 'opencode'])

export const sessionSummarySchema = z.object({
  id: z.string(),
  sourceType: sourceTypeSchema,
  title: z.string(),
  projectPath: z.string(),
  startedAt: z.string(),
  updatedAt: z.string(),
  preview: z.string(),
  locator: z.string()
})

export type SessionSummaryDto = z.infer<typeof sessionSummarySchema>
