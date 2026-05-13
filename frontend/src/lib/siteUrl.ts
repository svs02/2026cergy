const url = process.env.NEXT_PUBLIC_SITE_URL
if (!url) {
  throw new Error('NEXT_PUBLIC_SITE_URL 환경변수가 설정되지 않았습니다')
}

export const SITE_URL = url.replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
