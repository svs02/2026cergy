import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getNotice, getImageUrl, type NoticeItem } from '@/lib/api'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildArticleSchema, buildBreadcrumbSchema, schemaUtils } from '@/lib/schema'
import { absoluteUrl } from '@/lib/siteUrl'
import { BUSINESS } from '@/constants/business'

export const revalidate = 300

interface LayoutProps {
  params: Promise<{ id: string }>
  children: ReactNode
}

async function fetchNotice(id: string): Promise<NoticeItem | null> {
  try {
    return await getNotice(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const notice = await fetchNotice(id)
  if (!notice) {
    return { title: '공지사항' }
  }
  const description = schemaUtils.truncate(schemaUtils.stripHtml(notice.body))
  const url = absoluteUrl(`/notice/${notice._id}`)
  const firstImage = notice.images?.[0]
  const ogImage = firstImage ? getImageUrl(firstImage) : undefined

  return {
    title: notice.title,
    description,
    alternates: { canonical: `/notice/${notice._id}` },
    openGraph: {
      type: 'article',
      title: notice.title,
      description,
      url,
      siteName: BUSINESS.name,
      locale: 'ko_KR',
      publishedTime: notice.createdAt,
      modifiedTime: notice.updatedAt,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: notice.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function NoticeDetailLayout({ params, children }: LayoutProps) {
  const { id } = await params
  const notice = await fetchNotice(id)

  return (
    <>
      {notice && (
        <JsonLd
          data={[
            buildArticleSchema(notice),
            buildBreadcrumbSchema([
              { name: '홈', path: '/' },
              { name: '공지사항', path: '/notice' },
              { name: notice.title, path: `/notice/${notice._id}` },
            ]),
          ]}
        />
      )}
      {children}
    </>
  )
}
