import type { CSSProperties } from 'react'
import Image from 'next/image'
import { PHOTO_PALETTES, type PhotoTone } from '@/lib/tokens'
import { getImageUrl } from '@/lib/api'

interface PhotoProps {
  label?: string
  height?: number | string
  tone?: PhotoTone
  radius?: number
  src?: string | null
  alt?: string
  style?: CSSProperties
  fillHeight?: boolean
}

export function Photo({
  label,
  height = 200,
  tone = 'green',
  radius = 0,
  src,
  alt,
  style,
  fillHeight = false,
}: PhotoProps) {
  const palette = PHOTO_PALETTES[tone]
  const resolvedHeight = fillHeight ? '100%' : height
  const imgSrc = src ? getImageUrl(src) : null

  return (
    <div
      style={{
        height: resolvedHeight,
        width: '100%',
        background: imgSrc ? '#000' : `linear-gradient(135deg, ${palette.a}, ${palette.b})`,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: palette.t,
        fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
        fontSize: 10,
        letterSpacing: 1.5,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={alt ?? label ?? ''}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,.04) 14px 28px)',
            }}
          />
          {label && (
            <span
              style={{
                background: 'rgba(0,0,0,.32)',
                padding: '5px 10px',
                borderRadius: 2,
                fontVariant: 'small-caps',
                position: 'relative',
                zIndex: 1,
                backdropFilter: 'blur(2px)',
              }}
            >
              {label}
            </span>
          )}
        </>
      )}
    </div>
  )
}
