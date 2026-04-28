'use client'

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  durationMs?: number
}

interface LongPressHandlers {
  onPointerDown: () => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
  /** 직전 인터랙션이 long-press였는지 여부. onClick에서 일반 클릭 동작 억제용 */
  firedRef: MutableRefObject<boolean>
}

export function useLongPress({ onLongPress, durationMs = 5000 }: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return clear
  }, [clear])

  const start = useCallback(() => {
    clear()
    firedRef.current = false
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      timerRef.current = null
      onLongPress()
    }, durationMs)
  }, [clear, durationMs, onLongPress])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    firedRef,
  }
}
