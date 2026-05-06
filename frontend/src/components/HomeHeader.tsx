'use client'

import Image from 'next/image'
import { TOKENS } from '@/lib/tokens'
import { HeroMenuButton } from './HeroMenuButton'
import { StickyHeader } from './StickyHeader'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function HomeHeader() {
  return (
    <StickyHeader transparent>
      <div
        style={{
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          onClick={scrollToTop}
          role="button"
          aria-label="페이지 최상단으로 이동"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              scrollToTop()
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <Image
            src="/image/153598104_910771036327156_2048521052833619321_n.jpg"
            alt="Cergy Music Academy 로고"
            width={40}
            height={40}
            style={{ borderRadius: '50%' }}
          />
          <div
            style={{
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 22,
              color: TOKENS.ink,
              letterSpacing: 1,
            }}
          >
            Cergy Music Academy
          </div>
        </div>
        <HeroMenuButton />
      </div>
    </StickyHeader>
  )
}
