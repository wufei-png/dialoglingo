import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger, parseLogLevel } from '../../src/main/logging'

describe('parseLogLevel', () => {
  it('defaults to info for unknown values', () => {
    expect(parseLogLevel(undefined)).toBe('info')
    expect(parseLogLevel('verbose')).toBe('info')
  })

  it('accepts supported levels', () => {
    expect(parseLogLevel('DEBUG')).toBe('debug')
    expect(parseLogLevel('error')).toBe('error')
  })
})

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters messages below the configured level', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const log = createLogger('warn')

    log.debug('scan', 'hidden')
    log.info('scan', 'hidden')
    log.warn('scan', 'visible')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledOnce()
  })
})
