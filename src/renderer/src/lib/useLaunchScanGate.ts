import { useEffect, useState } from 'react'
import type { ScanEvent } from '../../../shared/ipc/events'
import { trpc } from './trpc'

function isBootReady(status: { phase: ScanEvent['phase']; scanOnLaunch: boolean }) {
  if (!status.scanOnLaunch) {
    return true
  }

  return status.phase === 'completed' || status.phase === 'failed'
}

export function useLaunchScanGate() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | void

    void (async () => {
      const status = await trpc.launchScanStatus.query()
      if (isBootReady(status)) {
        setReady(true)
        return
      }

      unsubscribe = window.dialoglingoScan?.subscribe((event) => {
        if (event.phase === 'completed' || event.phase === 'failed') {
          setReady(true)
        }
      })

      const latest = await trpc.launchScanStatus.query()
      if (isBootReady(latest)) {
        setReady(true)
      }
    })()

    return () => {
      unsubscribe?.()
    }
  }, [])

  return ready
}
