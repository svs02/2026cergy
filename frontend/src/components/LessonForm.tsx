'use client'

import { useState } from 'react'
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Switch,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { z } from 'zod/v4'
import type { LessonInput } from '@/lib/api'

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
  subtitle: z.string().min(1, '부제를 입력해 주세요'),
  description: z.string().min(1, '설명을 입력해 주세요'),
  price: z.string().min(1, '가격을 입력해 주세요'),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface LessonFormProps {
  initialValues?: Partial<LessonInput>
  submitLabel: string
  onSubmit: (values: LessonInput) => Promise<void>
}

export function LessonForm({ initialValues, submitLabel, onSubmit }: LessonFormProps) {
  const form = useForm<FormValues>({
    validate: zodV4Resolver(schema),
    initialValues: {
      title: initialValues?.title ?? '',
      subtitle: initialValues?.subtitle ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price ?? '',
      active: initialValues?.active ?? true,
    },
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="제목"
          placeholder="성인 입문"
          required
          {...form.getInputProps('title')}
        />
        <TextInput
          label="부제 (영문)"
          placeholder="For absolute beginners"
          required
          {...form.getInputProps('subtitle')}
        />
        <Textarea
          label="설명"
          placeholder="주 1회 30분 · 자세·활쓰기부터 천천히. 악기 대여 가능."
          required
          autosize
          minRows={2}
          {...form.getInputProps('description')}
        />
        <TextInput
          label="가격"
          placeholder="월 22만원~"
          required
          {...form.getInputProps('price')}
        />

        <Switch
          label="공개"
          checked={form.values.active}
          onChange={(event) => form.setFieldValue('active', event.currentTarget.checked)}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
