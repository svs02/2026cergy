export const TOKENS = {
  bg: '#ffffff',
  bgWarm: '#fdf6e6',
  bgPaper: '#fffaf0',
  green: '#1f3a35',
  greenDeep: '#162a26',
  greenSoft: '#3a5650',
  wood: '#8a5a3b',
  gold: '#b88a3e',
  goldBright: '#d9a94a',
  ink: '#16201d',
  inkSoft: '#4d5a55',
  inkMute: '#7d877f',
  sun: '#f5c878',
} as const

export type TokenKey = keyof typeof TOKENS

export const PHOTO_PALETTES = {
  green: { a: '#1f3a35', b: '#2a4a43', t: '#fff5dc' },
  greenL: { a: '#3a5650', b: '#46645d', t: '#fff5dc' },
  wood: { a: '#8a5a3b', b: '#a06d4b', t: '#fff8ec' },
  sun: { a: '#e8b86c', b: '#f0c787', t: '#16201d' },
  cream: { a: '#ffeec5', b: '#f5e0aa', t: '#1f3a35' },
  ivory: { a: '#fff8ec', b: '#f0e6cf', t: '#1f3a35' },
} as const

export type PhotoTone = keyof typeof PHOTO_PALETTES
