'use client'

import { MenuButton } from './MenuButton'
import { TOKENS } from '@/lib/tokens'

export function HeroMenuButton() {
  return <MenuButton color={TOKENS.ink} size={24} padding={6} />
}
