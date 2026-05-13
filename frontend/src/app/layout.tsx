import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Nanum_Myeongjo, Noto_Sans_KR } from 'next/font/google'
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AppShell } from '@/components/AppShell'
import { JsonLd } from '@/components/seo/JsonLd'
import { BUSINESS } from '@/constants/business'
import { buildMusicSchoolSchema, buildWebSiteSchema } from '@/lib/schema'
import { SITE_URL } from '@/lib/siteUrl'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BUSINESS.name} | ${BUSINESS.nameKo}`,
    template: `%s | ${BUSINESS.name}`,
  },
  description: BUSINESS.description,
  keywords: [...BUSINESS.keywords],
  applicationName: BUSINESS.name,
  authors: [{ name: BUSINESS.name }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: BUSINESS.name,
    url: SITE_URL,
    title: `${BUSINESS.name} | ${BUSINESS.nameKo}`,
    description: BUSINESS.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BUSINESS.name} | ${BUSINESS.nameKo}`,
    description: BUSINESS.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': 'd197da97fdbea59a21f08a0e46b5ac7aeb398f9c',
    },
  },
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
        <JsonLd data={[buildMusicSchoolSchema(), buildWebSiteSchema()]} />
        <MantineProvider>
          <Notifications />
          <AppShell>{children}</AppShell>
        </MantineProvider>
      </body>
    </html>
  )
}
