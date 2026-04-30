'use client'

import { usePathname, useRouter } from 'next/navigation'
import { TOKENS } from '@/lib/tokens'
import { useDrawer } from './DrawerContext'
import { useAdmin } from './AdminContext'
import { CloseIcon } from './Icons'
import { useLongPress } from '@/hooks/useLongPress'

interface MenuItem {
  label: string
  en: string
  route: string
}

const MENU_ITEMS: readonly MenuItem[] = [
  { label: '홈', en: 'HOME', route: '/' },
  { label: '커리큘럼', en: 'LESSONS', route: '/lessons' },
  { label: '강사진', en: 'INSTRUCTORS', route: '/instructors' },
  { label: '갤러리', en: 'GALLERY', route: '/gallery' },
  { label: '공지', en: 'NOTICE', route: '/notice' },
  { label: '오시는 길', en: 'VISIT', route: '/#visit' },
] as const

export function DrawerMenu() {
  const { isOpen, close } = useDrawer()
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, logout } = useAdmin()

  const { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel } = useLongPress({
    onLongPress: () => {
      close()
      router.push('/admin-login')
    },
    durationMs: 5000,
  })

  if (!isOpen) {
    return null
  }

  const handleLogout = async () => {
    close()
    await logout()
    router.push('/')
  }

  const handleNavigate = (route: string) => {
    close()
    if (route.startsWith('/#')) {
      if (pathname === '/') {
        const id = route.slice(2)
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        router.push(route)
      }
      return
    }
    router.push(route)
  }

  return (
    <>
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(22,32,29,.5)',
          zIndex: 50,
          animation: 'cergy-fade-in .18s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          maxWidth: '85vw',
          zIndex: 51,
          background: TOKENS.green,
          color: TOKENS.bg,
          padding: '60px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cergy-slide-left .22s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            onPointerDown={isAdmin ? undefined : onPointerDown}
            onPointerUp={isAdmin ? undefined : onPointerUp}
            onPointerLeave={isAdmin ? undefined : onPointerLeave}
            onPointerCancel={isAdmin ? undefined : onPointerCancel}
            onContextMenu={isAdmin ? undefined : (event) => event.preventDefault()}
            style={{
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 24,
              color: TOKENS.bg,
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              touchAction: 'manipulation',
            }}
          >
            Cergy Music Academy
          </div>
          <div onClick={close} style={{ color: TOKENS.bg, cursor: 'pointer', padding: 4 }}>
            <CloseIcon size={22} color={TOKENS.bg} />
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.18)', margin: '20px 0 8px' }} />
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.route
          return (
            <div
              key={item.route}
              onClick={() => handleNavigate(item.route)}
              style={{
                padding: '16px 0',
                borderBottom: '0.5px solid rgba(255,255,255,.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: active ? TOKENS.goldBright : TOKENS.bg,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans), 'Inter', sans-serif",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: TOKENS.goldBright,
                  fontWeight: 600,
                }}
              >
                {item.en}
              </div>
            </div>
          )
        })}
        <div style={{ flex: 1 }} />
        {isAdmin && (
          <div
            onClick={() => void handleLogout()}
            role="button"
            aria-label="관리자 로그아웃"
            style={{
              padding: '12px 0',
              borderTop: '0.5px solid rgba(255,255,255,.1)',
              cursor: 'pointer',
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 11,
              letterSpacing: 2,
              color: TOKENS.goldBright,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            ADMIN ✕  로그아웃
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 10,
            letterSpacing: 2,
            color: 'rgba(255,245,220,.6)',
            marginTop: 24,
          }}
        >
          02-1234-5678
          <br />
          평일 13–21시 · 토 10–18시
        </div>
      </div>
    </>
  )
}
