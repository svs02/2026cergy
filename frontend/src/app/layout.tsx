import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Nanum_Myeongjo, Noto_Sans_KR } from 'next/font/google'
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AppShell } from '@/components/AppShell'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  display: 'swap',
  variable: '--font-display',
})

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-display-kr',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-kr',
})

export const metadata: Metadata = {
  title: 'Cergy Music Academy',
  description: '음악 학원 — 편안한 분위기에서, 음악을 통해 성장합니다.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      {...mantineHtmlProps}
      className={`${cormorant.variable} ${nanumMyeongjo.variable} ${inter.variable} ${notoSansKr.variable}`}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          <AppShell>{children}</AppShell>
        </MantineProvider>
      </body>
    </html>
  )
}
