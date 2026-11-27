import { useEffect, useRef, useState } from 'react'

export const useChcStepTiming = (durationMs: number | null, enabled: boolean, onExpire: (elapsedMs: number) => void) => {
  const started = useRef<number | null>(null)
  const fired = useRef(false)
  const callback = useRef(onExpire)
  const [remainingMs, setRemainingMs] = useState<number | null>(durationMs)
  useEffect(() => { callback.current = onExpire }, [onExpire])
  useEffect(() => {
    if (!enabled || durationMs === null) return
    if (started.current === null) started.current = performance.now()
    const deadline = started.current + durationMs
    const tick = () => {
      const remaining = Math.max(0, deadline - performance.now())
      setRemainingMs(remaining)
      if (remaining === 0 && !fired.current) { fired.current = true; callback.current(performance.now() - (started.current ?? deadline)) }
    }
    tick()
    const timer = window.setInterval(tick, Math.min(250, Math.max(25, durationMs)))
    return () => window.clearInterval(timer)
  }, [durationMs, enabled])
  const elapsedMs = () => started.current === null ? 0 : Math.max(0, performance.now() - started.current)
  const stop = () => { fired.current = true }
  return { elapsedMs, remainingMs, stop }
}
