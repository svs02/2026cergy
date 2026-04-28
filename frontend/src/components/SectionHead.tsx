import type { ReactNode } from 'react'
import { TOKENS } from '@/lib/tokens'
import { Display } from './Display'
import { Eyebrow } from './Eyebrow'
import { ArrowIcon } from './Icons'

interface SectionHeadProps {
  eyebrow: ReactNode
  title: ReactNode
  action?: ReactNode
  light?: boolean
}

export function SectionHead({ eyebrow, title, action, light = false }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
      }}
    >
      <div>
        <Eyebrow color={light ? TOKENS.goldBright : TOKENS.gold}>{eyebrow}</Eyebrow>
        <Display size={22} color={light ? TOKENS.bg : TOKENS.green} style={{ marginTop: 6 }}>
          {title}
        </Display>
      </div>
      {action && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            color: light ? TOKENS.bg : TOKENS.ink,
            paddingBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {action}
          <ArrowIcon size={11} color={light ? TOKENS.bg : TOKENS.ink} />
        </div>
      )}
    </div>
  )
}
