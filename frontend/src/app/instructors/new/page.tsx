'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { createInstructor, type InstructorInput } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { InstructorForm } from '@/components/InstructorForm'
import { useAdmin } from '@/components/AdminContext'

export default function InstructorNewPage() {
  const router = useRouter()
  const { isAdmin, loading } = useAdmin()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/instructors')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        확인 중...
      </div>
    )
  }

  const handleSubmit = async (values: InstructorInput) => {
    try {
      await createInstructor(values)
      notifications.show({ title: '완료', message: '강사를 등록했습니다.', color: 'green' })
      router.push('/instructors')
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
      <PageHeader title="강사 등록" eyebrow="INSTRUCTORS · NEW" />
      <div style={{ padding: '0 24px' }}>
        <InstructorForm submitLabel="등록" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
