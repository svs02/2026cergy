'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollDirectionState {
  isHidden: boolean
  scrollY: number
}

const THRESHOLD = 5

export function useScrollDirection(): ScrollDirectionState {
  const [state, setState] = useState<ScrollDirectionState>({
    isHidden: false,
    scrollY: 0,
  })
  const prevScrollY = useRef(0)
  const rafId = useRef(0)

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY

      if (currentScrollY < 10) {
        setState({ isHidden: false, scrollY: currentScrollY })
        prevScrollY.current = currentScrollY
        return
      }

      const delta = currentScrollY - prevScrollY.current

      if (Math.abs(delta) < THRESHOLD) {
        setState((previous) => ({ ...previous, scrollY: currentScrollY }))
        return
      }

      const isHidden = delta > 0
      setState({ isHidden, scrollY: currentScrollY })
      prevScrollY.current = currentScrollY
    })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [handleScroll])

  return state
}
