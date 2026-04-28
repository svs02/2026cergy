'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { TOKENS } from '@/lib/tokens'
import { createNotice, type NoticeInput } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { NoticeForm } from '@/components/NoticeForm'
import { useAdmin } from '@/components/AdminContext'

export default function NoticeNewPage() {
  const router = useRouter()
  const { isAdmin, loading } = useAdmin()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/notice')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: TOKENS.inkMute, fontSize: 13 }}>
        확인 중...
      </div>
    )
  }

  const handleSubmit = async (values: NoticeInput) => {
    try {
      await createNotice(values)
      notifications.show({ title: '완료', message: '공지를 등록했습니다.', color: 'green' })
      router.push('/notice')
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
      <PageHeader title="새 공지 작성" eyebrow="BOARD · NEW" />
      <div style={{ padding: '0 24px' }}>
        <NoticeForm submitLabel="등록" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
