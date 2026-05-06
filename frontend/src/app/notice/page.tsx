'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TOKENS } from '@/lib/tokens'
import { listNotices, type NoticeItem } from '@/lib/api'
import { Display } from '@/components/Display'
import { Eyebrow } from '@/components/Eyebrow'
import { GoldRule } from '@/components/GoldRule'
import { ArrowIcon, BackIcon, PhotoIcon } from '@/components/Icons'
import { useAdmin } from '@/components/AdminContext'
import { MenuButton } from '@/components/MenuButton'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export default function NoticeListPage() {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [items, setItems] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listNotices(1, 50)
      setItems(result.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40, minHeight: '100vh' }}>
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
          <span>BACK</span>
        </div>
        <div style={{ paddingLeft: 8 }}>
          <Eyebrow>BOARD</Eyebrow>
        </div>
        <MenuButton color={TOKENS.green} size={22} />
      </div>

      <div style={{ padding: '4px 24px 20px' }}>
        <Display size={28} color={TOKENS.green}>
          공지사항
        </Display>
        <GoldRule width={28} />
      </div>

      {isAdmin && (
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/notice/new"
            style={{
              padding: '10px 18px',
              background: TOKENS.green,
              color: '#fff',
              border: 'none',
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 새 공지 작성
          </Link>
        </div>
      )}

      <div style={{ padding: '0 24px' }}>
        {loading ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 13,
              color: TOKENS.inkMute,
            }}
          >
            불러오는 중...
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 13,
              color: TOKENS.inkMute,
            }}
          >
            등록된 공지가 없습니다.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item._id}
              href={`/notice/${item._id}`}
              style={{
                display: 'block',
                padding: '20px 0',
                borderBottom: '0.5px solid rgba(22,32,29,.1)',
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: TOKENS.ink,
                  lineHeight: 1.45,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {item.isPinned && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "var(--font-sans), 'Inter', sans-serif",
                      letterSpacing: 1,
                      color: TOKENS.gold,
                      border: `1px solid ${TOKENS.gold}`,
                      padding: '2px 6px',
                    }}
                  >
                    고정
                  </span>
                )}
                <span>{item.title}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  fontFamily: "var(--font-sans), 'Inter', sans-serif",
                  fontSize: 11,
                  color: TOKENS.inkMute,
                }}
              >
                <span>{formatDate(item.createdAt)}</span>
                {item.images && item.images.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: TOKENS.inkSoft }}>
                    <PhotoIcon size={12} />
                    사진 {item.images.length}
                  </span>
                )}
                <span style={{ marginLeft: 'auto' }}>
                  <ArrowIcon size={11} color={TOKENS.inkMute} />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  )
}
