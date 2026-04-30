'use client'

import { useEffect, useRef } from 'react'

interface NaverMapProps {
  latitude: number
  longitude: number
  height?: number
  label?: string
  mapUrl?: string
}

declare global {
  interface Window {
    naver: typeof naver
  }
}

const SCRIPT_ID = 'naver-map-sdk'

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Naver Maps 스크립트 로드 실패')))
      return
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    if (!clientId) {
      reject(new Error('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다'))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Naver Maps 스크립트 로드 실패'))
    document.head.appendChild(script)
  })
}

export function NaverMap({ latitude, longitude, height = 180, label, mapUrl }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)

  useEffect(() => {
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current) {
          return
        }

        const position = new window.naver.maps.LatLng(latitude, longitude)

        const map = new window.naver.maps.Map(containerRef.current, {
          center: position,
          zoom: 16,
          zoomControl: false,
          mapDataControl: false,
          scaleControl: false,
        })

        new window.naver.maps.Marker({ position, map })

        mapRef.current = map
      })
      .catch(() => {
        // 스크립트 로드 실패 시 조용히 무시 — 지도 영역만 빈 상태로 유지
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [latitude, longitude])

  const handleClick = () => {
    if (mapUrl) {
      window.open(mapUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#e8e8e8',
        cursor: mapUrl ? 'pointer' : undefined,
      }}
      aria-label={label}
      role={mapUrl ? 'link' : undefined}
    />
  )
}
