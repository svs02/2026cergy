'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { getLesson, updateLesson, type LessonInput, type LessonItem } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { LessonForm } from '@/components/LessonForm'
import { useAdmin } from '@/components/AdminContext'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function LessonEditPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [item, setItem] = useState<LessonItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace('/lessons')
    }
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getLesson(id)
      .then((result) => {
        if (!cancelled) {
          setItem(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '커리큘럼 정보를 불러올 수 없습니다.')
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
        {error ?? '커리큘럼을 찾을 수 없습니다.'}
      </div>
    )
  }

  const handleSubmit = async (values: LessonInput) => {
    try {
      await updateLesson(id, values)
      notifications.show({ title: '완료', message: '커리큘럼을 수정했습니다.', color: 'green' })
      router.push('/lessons')
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
      <PageHeader title="커리큘럼 수정" eyebrow="CURRICULUM · EDIT" backHref="/lessons" />
      <div style={{ padding: '0 24px' }}>
        <LessonForm
          initialValues={{
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            price: item.price,
            active: item.active,
          }}
          submitLabel="수정"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
