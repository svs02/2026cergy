import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Noto_Sans_KR } from 'next/font/google'
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
  title: 'Cergy Music Atelier',
  description: '바이올린 학원 — 도심 속 작은 살롱에서, 천천히 한 음씩.',
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
      className={`${cormorant.variable} ${inter.variable} ${notoSansKr.variable}`}
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
