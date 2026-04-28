'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TOKENS } from '@/lib/tokens'
import { Display } from '@/components/Display'
import { Eyebrow } from '@/components/Eyebrow'
import { GoldRule } from '@/components/GoldRule'
import { useAdmin } from '@/components/AdminContext'

export function AdminLoginClient() {
  const router = useRouter()
  const { isAdmin, loading, login } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/')
    }
  }, [loading, isAdmin, router])

  const handleSubmit = async () => {
    if (submitting || password.length === 0) {
      return
    }
    setSubmitting(true)
    const ok = await login(password)
    setSubmitting(false)
    if (ok) {
      setPassword('')
      setError(false)
      router.push('/')
    } else {
      setError(true)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: TOKENS.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 36,
              color: TOKENS.green,
              letterSpacing: 1,
            }}
          >
            Cergy
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 10,
              letterSpacing: 3,
              color: TOKENS.gold,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            VIOLIN ATELIER
          </div>
        </div>

        <Eyebrow>RESTRICTED</Eyebrow>
        <Display size={24} color={TOKENS.green} italic={false} fontWeight={600} style={{ marginTop: 8 }}>
          운영자 로그인
        </Display>
        <GoldRule width={28} />

        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 12,
            color: TOKENS.inkSoft,
            marginTop: 12,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          운영자 권한이 필요한 페이지입니다. 비밀번호를 입력해 주세요.
        </div>

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          autoFocus
          onChange={(event) => {
            setPassword(event.target.value)
            setError(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleSubmit()
            }
          }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 16px',
            border: `1px solid ${error ? '#c0392b' : 'rgba(22,32,29,.2)'}`,
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 14,
            background: TOKENS.bgWarm,
            outline: 'none',
            marginBottom: 8,
          }}
        />
        {error && (
          <div
            style={{
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 12,
              color: '#c0392b',
              marginBottom: 12,
            }}
          >
            비밀번호가 올바르지 않습니다.
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || password.length === 0}
          style={{
            width: '100%',
            padding: 14,
            background: TOKENS.green,
            color: '#fff',
            border: 'none',
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1.5,
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting || password.length === 0 ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {submitting ? '확인 중...' : '확인'}
        </button>
      </div>
    </div>
  )
}
