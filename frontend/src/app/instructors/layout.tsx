import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { listInstructors } from '@/lib/api'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildInstructorListSchema } from '@/lib/schema'

export const revalidate = 600

export const metadata: Metadata = {
  title: '강사진',
  description: 'Cergy Music Academy 강사진 — 클래식 음악의 전문성을 바탕으로 학생 한 명 한 명에게 맞춘 레슨을 제공합니다.',
  alternates: { canonical: '/instructors' },
  openGraph: {
    type: 'website',
    title: '강사진',
    description: 'Cergy Music Academy 강사진 소개',
    url: '/instructors',
  },
}

export default async function InstructorsLayout({ children }: { children: ReactNode }) {
  let schema: Record<string, unknown> | null = null
  try {
    const result = await listInstructors()
    if (result.items.length > 0) {
      schema = buildInstructorListSchema(result.items)
    }
  } catch {
    schema = null
  }

  return (
    <>
      {schema && <JsonLd data={schema} />}
      {children}
    </>
  )
}
