import type { JobEvent } from '../../shared/ipc/events'

declare global {
  interface Window {
    dialoglingoJobs?: {
      subscribe: (callback: (event: JobEvent) => void) => (() => void) | void
    }
  }
}

export {}
