'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { deleteNotice, getImageUrl, getNotice, type NoticeItem } from '@/lib/api'
import { Display } from '@/components/Display'
import { Eyebrow } from '@/components/Eyebrow'
import { ArrowIcon, BackIcon } from '@/components/Icons'
import { useAdmin } from '@/components/AdminContext'

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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NoticeDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [item, setItem] = useState<NoticeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNotice(id)
      .then((result) => {
        if (!cancelled) {
          setItem(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '공지를 불러올 수 없습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('이 공지를 삭제할까요?')) {
      return
    }
    try {
      await deleteNotice(id)
      notifications.show({ title: '완료', message: '공지를 삭제했습니다.', color: 'green' })
      router.push('/notice')
    } catch (err) {
      notifications.show({
        title: '삭제 실패',
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        불러오는 중...
      </div>
    )
  }

  if (error || !item) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ color: TOKENS.inkSoft, fontSize: 13, marginBottom: 14 }}>
          {error ?? '공지를 찾을 수 없습니다.'}
        </div>
        <Link href="/notice" style={{ color: TOKENS.green, fontSize: 12, fontWeight: 600 }}>
          목록으로
        </Link>
      </div>
    )
  }

  const tagColor = item.tag === 'EVENT' ? TOKENS.gold : TOKENS.green

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 24 }}>
      <div
        style={{
          padding: '18px 16px 4px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <Link
          href="/notice"
          aria-label="목록으로"
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
            textDecoration: 'none',
          }}
        >
          <BackIcon size={16} color={TOKENS.green} />
          <span>LIST</span>
        </Link>
        <div style={{ paddingLeft: 8 }}>
          <Eyebrow>BOARD · DETAIL</Eyebrow>
        </div>
        <div />
      </div>

      <div style={{ padding: '12px 24px 0' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 9,
            letterSpacing: 1.5,
            fontWeight: 700,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            color: tagColor,
            border: `1px solid ${tagColor}`,
            padding: '4px 10px',
          }}
        >
          {item.tag}
        </div>

        <Display size={24} color={TOKENS.green} italic={false} fontWeight={600} style={{ marginTop: 14, lineHeight: 1.35 }}>
          {item.title}
        </Display>

        <div
          style={{
            marginTop: 14,
            paddingBottom: 14,
            borderBottom: '1px solid rgba(22,32,29,.12)',
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 11,
            color: TOKENS.inkMute,
            display: 'flex',
            gap: 14,
          }}
        >
          <span>{formatDate(item.createdAt)}</span>
          <span>조회 {item.views ?? 0}</span>
        </div>

        <div
          style={{
            marginTop: 22,
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 14,
            lineHeight: 1.85,
            color: TOKENS.ink,
            whiteSpace: 'pre-wrap',
          }}
        >
          {item.body}
        </div>

        {item.images && item.images.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {item.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={getImageUrl(url)}
                alt=""
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ))}
          </div>
        )}

        {item.tag === 'EVENT' && (
          <a
            href="mailto:hello@cergy.example"
            style={{
              marginTop: 28,
              width: '100%',
              padding: '16px',
              background: TOKENS.green,
              color: '#fff',
              border: 'none',
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            예약하기 <ArrowIcon size={12} color="#fff" />
          </a>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <Link
              href={`/notice/${item._id}/edit`}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                background: 'transparent',
                color: TOKENS.green,
                border: `1px solid ${TOKENS.green}`,
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              수정
            </Link>
            <button
              onClick={() => void handleDelete()}
              style={{
                flex: 1,
                padding: '12px',
                background: '#c0392b',
                color: '#fff',
                border: 'none',
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div style={{ margin: '28px 24px 0', display: 'flex', justifyContent: 'space-between' }}>
        <Link
          href="/notice"
          style={{
            padding: '12px 18px',
            background: 'transparent',
            color: TOKENS.green,
            border: `1px solid ${TOKENS.green}`,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 11,
            letterSpacing: 2,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <BackIcon size={12} color={TOKENS.green} /> 목록
        </Link>
      </div>
    </div>
  )
}
