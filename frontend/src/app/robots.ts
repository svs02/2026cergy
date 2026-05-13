import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin-login', '/notice/new', '/notice/*/edit', '/instructors/new', '/instructors/*/edit'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/admin-login', '/notice/new', '/notice/*/edit', '/instructors/new', '/instructors/*/edit'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
