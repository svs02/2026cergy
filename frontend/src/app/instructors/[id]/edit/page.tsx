'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { getInstructor, updateInstructor, type InstructorInput, type InstructorItem } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { InstructorForm } from '@/components/InstructorForm'
import { useAdmin } from '@/components/AdminContext'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InstructorEditPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [item, setItem] = useState<InstructorItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace('/instructors')
    }
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getInstructor(id)
      .then((result) => {
        if (!cancelled) {
          setItem(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '강사 정보를 불러올 수 없습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (adminLoading || !isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        확인 중...
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        불러오는 중...
      </div>
    )
  }

  if (error || !item) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkSoft, fontSize: 13 }}>
        {error ?? '강사를 찾을 수 없습니다.'}
      </div>
    )
  }

  const handleSubmit = async (values: InstructorInput) => {
    try {
      await updateInstructor(id, values)
      notifications.show({ title: '완료', message: '강사 정보를 수정했습니다.', color: 'green' })
      router.push('/instructors')
    } catch (err) {
      notifications.show({
        title: '수정 실패',
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40, minHeight: '100vh' }}>
      <PageHeader title="강사 수정" eyebrow="INSTRUCTORS · EDIT" />
      <div style={{ padding: '0 24px' }}>
        <InstructorForm
          initialValues={{
            name: item.name,
            nameEn: item.nameEn,
            role: item.role,
            photoUrl: item.photoUrl,
            tone: item.tone,
            major: item.major,
            career: item.career,
            quote: item.quote,
            schedule: item.schedule,
            featured: item.featured,
            active: item.active,
          }}
          submitLabel="수정"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
