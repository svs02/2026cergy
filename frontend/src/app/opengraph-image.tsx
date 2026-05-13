import { ImageResponse } from 'next/og'
import { BUSINESS } from '@/constants/business'
import { TOKENS } from '@/lib/tokens'

export const runtime = 'edge'
export const alt = `${BUSINESS.name} | ${BUSINESS.nameKo}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: `linear-gradient(135deg, ${TOKENS.green} 0%, ${TOKENS.greenDeep} 100%)`,
          color: '#fff5dc',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            color: TOKENS.goldBright,
            fontFamily: 'sans-serif',
            fontWeight: 600,
          }}
        >
          CERGY · MUSIC ACADEMY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              fontStyle: 'italic',
              color: '#fff5dc',
              maxWidth: 1000,
            }}
          >
            {BUSINESS.nameKo}
          </div>
          <div
            style={{
              width: 96,
              height: 2,
              background: TOKENS.gold,
            }}
          />
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.5,
              color: '#fff5dccc',
              maxWidth: 900,
              fontFamily: 'sans-serif',
            }}
          >
            편안한 분위기에서, 음악을 통해 성장합니다.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'sans-serif',
            fontSize: 18,
            letterSpacing: 2,
            color: '#fff5dc99',
          }}
        >
          <span>VIOLIN · PIANO · CELLO</span>
          <span style={{ color: TOKENS.goldBright }}>cergymusic</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
