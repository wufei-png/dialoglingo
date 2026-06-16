export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

export function parseLogLevel(value: string | undefined): LogLevel {
  const normalized = value?.trim().toLowerCase()

  if (
    normalized === 'debug' ||
    normalized === 'info' ||
    normalized === 'warn' ||
    normalized === 'error'
  ) {
    return normalized
  }

  return 'info'
}

function formatPayload(payload: unknown) {
  if (payload instanceof Error) {
    return payload.stack ?? payload.message
  }

  if (typeof payload === 'string') {
    return payload
  }

  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}

export function createLogger(minLevel: LogLevel) {
  const minRank = LEVEL_RANK[minLevel]

  function write(level: LogLevel, scope: string, message: string, payload?: unknown) {
    if (LEVEL_RANK[level] < minRank) {
      return
    }

    const prefix = `[dialoglingo:${level}] [${scope}]`
    const line = payload === undefined ? `${prefix} ${message}` : `${prefix} ${message} ${formatPayload(payload)}`
    const writer =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    writer(line)
  }

  return {
    debug(scope: string, message: string, payload?: unknown) {
      write('debug', scope, message, payload)
    },
    info(scope: string, message: string, payload?: unknown) {
      write('info', scope, message, payload)
    },
    warn(scope: string, message: string, payload?: unknown) {
      write('warn', scope, message, payload)
    },
    error(scope: string, message: string, payload?: unknown) {
      write('error', scope, message, payload)
    }
  }
}

export const logger = createLogger(parseLogLevel(process.env.DIALOGLINGO_LOG_LEVEL))
