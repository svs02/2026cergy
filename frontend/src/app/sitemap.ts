import type { MetadataRoute } from 'next'
import { listNotices } from '@/lib/api'
import { absoluteUrl } from '@/lib/siteUrl'

export const revalidate = 3600

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/notice', priority: 0.8, changeFrequency: 'daily' },
  { path: '/gallery', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/instructors', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/lessons', priority: 0.7, changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  let noticeEntries: MetadataRoute.Sitemap = []
  try {
    const result = await listNotices(1, 1000)
    noticeEntries = result.items.map((notice) => ({
      url: absoluteUrl(`/notice/${notice._id}`),
      lastModified: new Date(notice.updatedAt ?? notice.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    noticeEntries = []
  }

  return [...staticEntries, ...noticeEntries]
}
