'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { TOKENS } from '@/lib/tokens'
import { Display } from './Display'
import { Eyebrow } from './Eyebrow'
import { GoldRule } from './GoldRule'
import { BackIcon } from './Icons'
import { MenuButton } from './MenuButton'

interface PageHeaderProps {
  title: ReactNode
  eyebrow: ReactNode
  lead?: ReactNode
  backLabel?: string
}

export function PageHeader({ title, eyebrow, lead, backLabel = 'BACK' }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <>
      <div
        style={{
          padding: '18px 16px 4px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <div
          onClick={handleBack}
          role="button"
          aria-label="이전 페이지로"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px 8px 6px',
            cursor: 'pointer',
            color: TOKENS.green,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 11,
            letterSpacing: 1.5,
            fontWeight: 600,
          }}
        >
          <BackIcon size={16} color={TOKENS.green} />
          <span style={{ textTransform: 'uppercase' }}>{backLabel}</span>
        </div>
        <div style={{ paddingLeft: 8 }}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <MenuButton color={TOKENS.green} size={22} />
      </div>
      <div style={{ padding: '4px 24px 20px' }}>
        <Display size={32} color={TOKENS.green}>
          {title}
        </Display>
        <GoldRule width={28} />
        {lead && (
          <div
            style={{
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 13,
              lineHeight: 1.7,
              color: TOKENS.inkSoft,
              marginTop: 8,
            }}
          >
            {lead}
          </div>
        )}
      </div>
    </>
  )
}
