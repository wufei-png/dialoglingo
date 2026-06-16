import { performance } from 'node:perf_hooks'
import { createSourceRegistry } from '../src/main/sources/index.ts'

async function main() {
  const registry = createSourceRegistry()
  const filters = {
    query: '',
    timeRange: null,
    projects: [],
    platforms: [],
    includeArchived: false
  }

  for (const name of ['codex', 'claude', 'opencode'] as const) {
    const t0 = performance.now()
    const sessions = await registry[name].listSessions(filters)
    console.log(
      `${name} listSessions: ${sessions.length} sessions in ${Math.round(performance.now() - t0)} ms`
    )
  }

  const codex = await registry.codex.listSessions(filters)
  const claude = await registry.claude.listSessions(filters)
  const opencode = await registry.opencode.listSessions(filters)

  for (const [name, sessions, adapter] of [
    ['codex', codex, registry.codex],
    ['claude', claude, registry.claude],
    ['opencode', opencode, registry.opencode]
  ] as const) {
    if (!sessions.length) continue
    const t0 = performance.now()
    await adapter.readSession(sessions[0].id, { locator: sessions[0].locator })
    console.log(`${name} readSession(1, with locator): ${Math.round(performance.now() - t0)} ms`)
  }

  let total = 0
  const sampleCount = Math.min(10, codex.length)
  for (let i = 0; i < sampleCount; i++) {
    const t0 = performance.now()
    await registry.codex.readSession(codex[i].id, { locator: codex[i].locator })
    total += performance.now() - t0
  }
  const avg = total / sampleCount
  console.log(`codex readSession avg with locator (${sampleCount} samples): ${Math.round(avg)} ms`)
  console.log(
    `estimated codex read all (fixed): ${Math.round((avg * codex.length) / 1000)} sec for ${codex.length} sessions`
  )

  total = 0
  for (let i = 0; i < sampleCount; i++) {
    const t0 = performance.now()
    await registry.codex.readSession(codex[i].id)
    total += performance.now() - t0
  }
  console.log(`codex readSession avg without locator (${sampleCount} samples): ${Math.round(total / sampleCount)} ms`)

  total = 0
  const claudeSample = Math.min(10, claude.length)
  for (let i = 0; i < claudeSample; i++) {
    const t0 = performance.now()
    await registry.claude.readSession(claude[i].id)
    total += performance.now() - t0
  }
  const claudeAvg = total / claudeSample
  console.log(`claude readSession avg (${claudeSample} samples): ${Math.round(claudeAvg)} ms`)
  console.log(
    `estimated claude read all: ${Math.round((claudeAvg * claude.length) / 1000)} sec for ${claude.length} sessions`
  )

  total = 0
  const opencodeSample = Math.min(10, opencode.length)
  for (let i = 0; i < opencodeSample; i++) {
    const t0 = performance.now()
    await registry.opencode.readSession(opencode[i].id)
    total += performance.now() - t0
  }
  if (opencodeSample > 0) {
    const opencodeAvg = total / opencodeSample
    console.log(`opencode readSession avg (${opencodeSample} samples): ${Math.round(opencodeAvg)} ms`)
    console.log(
      `estimated opencode read all: ${Math.round((opencodeAvg * opencode.length) / 1000)} sec for ${opencode.length} sessions`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
