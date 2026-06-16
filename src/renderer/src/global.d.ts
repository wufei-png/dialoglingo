import type { JobEvent, ScanEvent } from '../../shared/ipc/events'

declare global {
  interface Window {
    dialoglingoJobs?: {
      subscribe: (callback: (event: JobEvent) => void) => (() => void) | void
    }
    dialoglingoScan?: {
      subscribe: (callback: (event: ScanEvent) => void) => (() => void) | void
    }
  }
}

export {}
