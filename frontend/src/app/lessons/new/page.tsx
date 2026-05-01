'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { createLesson, type LessonInput } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { LessonForm } from '@/components/LessonForm'
import { useAdmin } from '@/components/AdminContext'

export default function LessonNewPage() {
  const router = useRouter()
  const { isAdmin, loading } = useAdmin()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/lessons')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        확인 중...
      </div>
    )
  }

  const handleSubmit = async (values: LessonInput) => {
    try {
      await createLesson(values)
      notifications.show({ title: '완료', message: '커리큘럼을 등록했습니다.', color: 'green' })
      router.push('/lessons')
    } catch (error) {
      notifications.show({
        title: '등록 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40, minHeight: '100vh' }}>
      <PageHeader title="커리큘럼 등록" eyebrow="CURRICULUM · NEW" backHref="/lessons" />
      <div style={{ padding: '0 24px' }}>
        <LessonForm submitLabel="등록" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
