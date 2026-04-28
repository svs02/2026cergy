import type { CSSProperties, ReactNode } from 'react'
import { TOKENS } from '@/lib/tokens'

interface DisplayProps {
  children: ReactNode
  size?: number
  italic?: boolean
  color?: string
  fontWeight?: number
  style?: CSSProperties
}

export function Display({
  children,
  size = 32,
  italic = true,
  color,
  fontWeight = 500,
  style,
}: DisplayProps) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
        fontWeight,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        lineHeight: 1.05,
        color: color ?? TOKENS.ink,
        letterSpacing: -0.2,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
