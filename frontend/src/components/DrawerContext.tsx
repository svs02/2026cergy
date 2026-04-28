'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface DrawerContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext)
  if (!ctx) {
    throw new Error('useDrawer는 DrawerProvider 내부에서만 사용할 수 있습니다')
  }
  return ctx
}
