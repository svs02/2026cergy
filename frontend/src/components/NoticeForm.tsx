'use client'

import { useState } from 'react'
import {
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  FileButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { z } from 'zod/v4'
import { TOKENS } from '@/lib/tokens'
import {
  NoticeTag,
  getImageUrl,
  uploadImage,
  type NoticeInput,
} from '@/lib/api'
import { TrashIcon } from './Icons'

interface ZodLikeIssue {
  readonly path: ReadonlyArray<PropertyKey>
  readonly message: string
}
interface ZodLikeSchema<T> {
  safeParse: (values: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { issues: ReadonlyArray<ZodLikeIssue> } }
}

function zodV4Resolver<T extends Record<string, unknown>>(schema: ZodLikeSchema<T>) {
  return (values: T): Record<string, string> => {
    const parsed = schema.safeParse(values)
    if (parsed.success) {
      return {}
    }
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.map((segment) => String(segment)).join('.')
      if (!errors[path]) {
        errors[path] = issue.message
      }
    }
    return errors
  }
}

const schema = z.strictObject({
  title: z.string().min(1, '제목을 입력해 주세요'),
  body: z.string().min(1, '본문을 입력해 주세요'),
  tag: z.enum(NoticeTag),
})

type FormValues = z.infer<typeof schema>

interface NoticeFormProps {
  initialValues?: Partial<NoticeInput>
  submitLabel: string
  onSubmit: (values: NoticeInput) => Promise<void>
}

export function NoticeForm({ initialValues, submitLabel, onSubmit }: NoticeFormProps) {
  const form = useForm<FormValues>({
    validate: zodV4Resolver(schema),
    initialValues: {
      title: initialValues?.title ?? '',
      body: initialValues?.body ?? '',
      tag: initialValues?.tag ?? NoticeTag.NOTICE,
    },
  })
  const [images, setImages] = useState<string[]>(initialValues?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const result = await uploadImage(file)
      setImages((prev) => [...prev, result.url])
    } catch (error) {
      notifications.show({
        title: '업로드 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        color: 'red',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (url: string) => {
    setImages((prev) => prev.filter((image) => image !== url))
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true)
    try {
      await onSubmit({ ...values, images })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="제목"
          placeholder="공지 제목"
          required
          {...form.getInputProps('title')}
        />
        <Select
          label="태그"
          required
          data={[
            { value: NoticeTag.NOTICE, label: '공지' },
            { value: NoticeTag.EVENT, label: '이벤트' },
          ]}
          value={form.values.tag}
          onChange={(value) => {
            if (value === NoticeTag.NOTICE || value === NoticeTag.EVENT) {
              form.setFieldValue('tag', value)
            }
          }}
        />
        <Textarea
          label="본문"
          placeholder="공지 본문을 입력해 주세요"
          required
          autosize
          minRows={10}
          {...form.getInputProps('body')}
        />

        <div>
          <div
            style={{
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
              color: TOKENS.ink,
            }}
          >
            첨부 이미지
          </div>
          <FileButton onChange={(file) => void handleFileSelect(file)} accept="image/*">
            {(props) => (
              <Button {...props} variant="outline" loading={uploading}>
                이미지 추가
              </Button>
            )}
          </FileButton>
          {images.length > 0 && (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {images.map((url) => (
                <div key={url} style={{ position: 'relative', aspectRatio: '1/1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 28,
                      height: 28,
                      background: 'rgba(0,0,0,.55)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrashIcon size={14} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
