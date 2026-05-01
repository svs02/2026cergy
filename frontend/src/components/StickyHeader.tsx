'use client'

import type { ReactNode } from 'react'
import { TOKENS } from '@/lib/tokens'
import { useScrollDirection } from '@/hooks/useScrollDirection'

interface StickyHeaderProps {
  children: ReactNode
  transparent?: boolean
}

export function StickyHeader({ children, transparent = false }: StickyHeaderProps) {
  const { isHidden, scrollY } = useScrollDirection()

  const showSolidBg = !transparent || scrollY > 100

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
        willChange: 'transform',
        background: showSolidBg ? TOKENS.bg : 'transparent',
        boxShadow: showSolidBg ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 768,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
