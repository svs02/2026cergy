import type { CSSProperties, ReactNode } from 'react'
import { TOKENS } from '@/lib/tokens'

interface EyebrowProps {
  children: ReactNode
  color?: string
  style?: CSSProperties
}

export function Eyebrow({ children, color = TOKENS.gold, style }: EyebrowProps) {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans), 'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
