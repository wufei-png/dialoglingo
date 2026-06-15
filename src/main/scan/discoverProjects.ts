import path from 'node:path'
import type { SessionSummary } from '../sources/types'

export type DiscoveredProject = {
  id: string
  name: string
  localPath: string
  sourcePlatforms: string[]
}

export function discoverProjects(summaries: SessionSummary[]): DiscoveredProject[] {
  const seen = new Map<string, DiscoveredProject>()

  for (const summary of summaries) {
    if (!summary.projectPath) {
      continue
    }

    const current = seen.get(summary.projectPath)
    if (current) {
      if (!current.sourcePlatforms.includes(summary.sourceType)) {
        current.sourcePlatforms.push(summary.sourceType)
      }
      continue
    }

    seen.set(summary.projectPath, {
      id: summary.projectPath,
      name: path.basename(summary.projectPath) || summary.projectPath,
      localPath: summary.projectPath,
      sourcePlatforms: [summary.sourceType]
    })
  }

  return [...seen.values()]
}
