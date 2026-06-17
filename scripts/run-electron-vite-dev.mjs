import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

function resolveElectronExecPath() {
  const base = path.resolve('node_modules', 'electron', 'dist')

  if (process.platform === 'darwin') {
    return path.join(base, 'Electron.app', 'Contents', 'MacOS', 'Electron')
  }

  if (process.platform === 'win32') {
    return path.join(base, 'electron.exe')
  }

  return path.join(base, 'electron')
}

function resolveElectronBetterSqliteBindingPath() {
  return path.resolve(
    'node_modules',
    'better-sqlite3',
    'build',
    'Release',
    'better_sqlite3.electron.node'
  )
}

const debugMode = process.argv.includes('--debug')
const mockLlmMode =
  process.argv.includes('--mock-llm') || process.env.DIALOGLINGO_MOCK_LLM === '1'
const logLevel = process.env.DIALOGLINGO_LOG_LEVEL || (debugMode ? 'debug' : 'info')

const electronExecPath = process.env.ELECTRON_EXEC_PATH || resolveElectronExecPath()
const electronBetterSqliteBindingPath =
  process.env.DIALOGLINGO_BETTER_SQLITE3_BINDING ||
  resolveElectronBetterSqliteBindingPath()

if (!existsSync(electronExecPath)) {
  console.error(`Electron executable not found at ${electronExecPath}`)
  process.exit(1)
}

if (!existsSync(electronBetterSqliteBindingPath)) {
  console.error(
    `Electron better-sqlite3 binding not found at ${electronBetterSqliteBindingPath}`
  )
  process.exit(1)
}

console.log(
  `[dialoglingo:dev] log level=${logLevel}${debugMode ? ' (debug mode)' : ''}${mockLlmMode ? ' mock-llm=on' : ''}`
)

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['electron-vite', 'dev'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DIALOGLINGO_LOG_LEVEL: logLevel,
      ELECTRON_EXEC_PATH: electronExecPath,
      DIALOGLINGO_BETTER_SQLITE3_BINDING: electronBetterSqliteBindingPath,
      ...(mockLlmMode
        ? {
            DIALOGLINGO_MOCK_LLM: '1'
          }
        : {}),
      ...(debugMode
        ? {
            ELECTRON_ENABLE_LOGGING: '1',
            DIALOGLINGO_OPEN_DEVTOOLS: '1'
          }
        : {})
    }
  }
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
