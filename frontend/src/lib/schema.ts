import { BUSINESS } from '@/constants/business'
import type { InstructorItem, NoticeItem } from '@/lib/api'
import { getImageUrl } from '@/lib/api'
import { absoluteUrl, SITE_URL } from '@/lib/siteUrl'

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) {
    return text
  }
  return `${text.slice(0, max - 1).trim()}…`
}

export function buildMusicSchoolSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicSchool',
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    alternateName: BUSINESS.nameKo,
    url: SITE_URL,
    logo: absoluteUrl(BUSINESS.logoPath),
    image: absoluteUrl(BUSINESS.logoPath),
    description: BUSINESS.description,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.addressLocality,
      addressRegion: BUSINESS.address.addressRegion,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.addressCountry,
    },
    openingHours: BUSINESS.openingHours,
    sameAs: BUSINESS.sameAs,
  }
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BUSINESS.name,
    inLanguage: 'ko-KR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function buildArticleSchema(notice: NoticeItem): Record<string, unknown> {
  const url = absoluteUrl(`/notice/${notice._id}`)
  const description = truncate(stripHtml(notice.body))
  const firstImage = notice.images?.[0]
  const imageUrl = firstImage ? getImageUrl(firstImage) : absoluteUrl(BUSINESS.logoPath)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: notice.title,
    description,
    image: [imageUrl],
    datePublished: notice.createdAt,
    dateModified: notice.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function buildPersonSchema(instructor: InstructorItem): Record<string, unknown> {
  const image = instructor.photoUrl ? getImageUrl(instructor.photoUrl) : undefined
  return {
    '@type': 'Person',
    name: instructor.name,
    alternateName: instructor.nameEn,
    jobTitle: instructor.role,
    description: instructor.major,
    knowsAbout: instructor.major,
    ...(image ? { image } : {}),
    ...(instructor.career.length > 0 ? { alumniOf: instructor.career } : {}),
    worksFor: { '@id': `${SITE_URL}/#organization` },
  }
}

export function buildInstructorListSchema(items: InstructorItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '강사진',
    url: absoluteUrl('/instructors'),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: buildPersonSchema(item),
    })),
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export const schemaUtils = { stripHtml, truncate }
