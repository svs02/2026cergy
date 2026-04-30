'use client'

import { useDrawer } from './DrawerContext'
import { MenuIcon } from './Icons'

interface MenuButtonProps {
  color?: string
  size?: number
  padding?: number
}

export function MenuButton({ color = 'currentColor', size = 22, padding = 4 }: MenuButtonProps) {
  const drawer = useDrawer()

  return (
    <button
      type="button"
      aria-label="메뉴"
      onClick={drawer.open}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MenuIcon size={size} color={color} />
    </button>
  )
}
