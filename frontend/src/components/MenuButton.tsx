'use client'

import { useRouter } from 'next/navigation'
import { useDrawer } from './DrawerContext'
import { MenuIcon } from './Icons'
import { useLongPress } from '@/hooks/useLongPress'

interface MenuButtonProps {
  color?: string
  size?: number
  padding?: number
}

export function MenuButton({ color = 'currentColor', size = 22, padding = 4 }: MenuButtonProps) {
  const drawer = useDrawer()
  const router = useRouter()

  const { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, firedRef } = useLongPress({
    onLongPress: () => {
      router.push('/admin-login')
    },
    durationMs: 5000,
  })

  const handleClick = () => {
    if (firedRef.current) {
      firedRef.current = false
      return
    }
    drawer.open()
  }

  return (
    <button
      type="button"
      aria-label="메뉴"
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
    >
      <MenuIcon size={size} color={color} />
    </button>
  )
}
