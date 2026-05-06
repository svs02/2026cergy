import { TOKENS } from '@/lib/tokens'

interface GoldRuleProps {
  width?: number
  color?: string
}

export function GoldRule({ width = 36, color = TOKENS.gold }: GoldRuleProps) {
  return (
    <div
      style={{
        width,
        height: 1,
        background: color,
        margin: '10px 0',
      }}
    />
  )
}
