'use client'

import { useState } from 'react'
import {
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  FileButton,
  Checkbox,
  Switch,
  ActionIcon,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { z } from 'zod/v4'
import { TOKENS } from '@/lib/tokens'
import {
  PhotoTone,
  Day,
  uploadImage,
  getImageUrl,
  type InstructorInput,
  type ScheduleSlot,
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

const photoToneValues = Object.values(PhotoTone) as [string, ...string[]]

const schema = z.strictObject({
  name: z.string().min(1, '이름을 입력해 주세요'),
  nameEn: z.string().min(1, '영문 이름을 입력해 주세요'),
  role: z.string().min(1, '직책을 입력해 주세요'),
  tone: z.enum(photoToneValues),
  major: z.string().min(1, '전공을 입력해 주세요'),
  quote: z.string(),
  featured: z.boolean(),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const TONE_OPTIONS = [
  { value: PhotoTone.GREEN, label: 'Green (짙은 초록)' },
  { value: PhotoTone.GREEN_L, label: 'Green Light (밝은 초록)' },
  { value: PhotoTone.WOOD, label: 'Wood (갈색)' },
  { value: PhotoTone.SUN, label: 'Sun (노란색)' },
  { value: PhotoTone.CREAM, label: 'Cream (크림)' },
  { value: PhotoTone.IVORY, label: 'Ivory (아이보리)' },
]

const DAY_OPTIONS = Object.values(Day).map((day) => ({ value: day, label: day }))

const EMPTY_SLOT: ScheduleSlot = { day: Day.MON, startTime: '', endTime: '', lessonName: '' }

interface InstructorFormProps {
  initialValues?: Partial<InstructorInput>
  submitLabel: string
  onSubmit: (values: InstructorInput) => Promise<void>
}

export function InstructorForm({ initialValues, submitLabel, onSubmit }: InstructorFormProps) {
  const form = useForm<FormValues>({
    validate: zodV4Resolver(schema),
    initialValues: {
      name: initialValues?.name ?? '',
      nameEn: initialValues?.nameEn ?? '',
      role: initialValues?.role ?? '',
      tone: initialValues?.tone ?? PhotoTone.GREEN,
      major: initialValues?.major ?? '',
      quote: initialValues?.quote ?? '',
      featured: initialValues?.featured ?? false,
      active: initialValues?.active ?? true,
    },
  })

  const [career, setCareer] = useState<string[]>(
    initialValues?.career?.length ? [...initialValues.career] : [''],
  )
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(
    initialValues?.schedule?.length ? [...initialValues.schedule] : [],
  )
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialValues?.photoUrl)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const result = await uploadImage(file)
      setPhotoUrl(result.url)
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

  const handleCareerChange = (index: number, value: string) => {
    setCareer((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const addCareer = () => {
    setCareer((prev) => [...prev, ''])
  }

  const removeCareer = (index: number) => {
    setCareer((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleScheduleChange = (index: number, field: keyof ScheduleSlot, value: string) => {
    setSchedule((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addSchedule = () => {
    setSchedule((prev) => [...prev, { ...EMPTY_SLOT }])
  }

  const removeSchedule = (index: number) => {
    setSchedule((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = form.onSubmit(async (values) => {
    const filteredCareer = career.filter((item) => item.trim().length > 0)
    if (filteredCareer.length === 0) {
      notifications.show({ title: '입력 오류', message: '경력을 최소 1개 입력해 주세요', color: 'red' })
      return
    }

    const filteredSchedule = schedule.filter(
      (slot) => slot.startTime.length > 0 && slot.endTime.length > 0 && slot.lessonName.trim().length > 0,
    )

    setSubmitting(true)
    try {
      await onSubmit({
        ...values,
        tone: values.tone as PhotoTone,
        nameEn: values.nameEn.toUpperCase(),
        photoUrl: photoUrl ?? undefined,
        career: filteredCareer,
        schedule: filteredSchedule,
      })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="이름"
          placeholder="홍길동"
          required
          {...form.getInputProps('name')}
        />
        <TextInput
          label="영문 이름"
          placeholder="HONG GILDONG"
          required
          {...form.getInputProps('nameEn')}
          onChange={(event) => {
            form.setFieldValue('nameEn', event.currentTarget.value.toUpperCase())
          }}
        />
        <TextInput
          label="직책"
          placeholder="전임 강사 · Lecturer"
          required
          {...form.getInputProps('role')}
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
            프로필 사진
          </div>
          <Group gap="md">
            <FileButton onChange={(file) => void handlePhotoSelect(file)} accept="image/*">
              {(props) => (
                <Button {...props} variant="outline" loading={uploading}>
                  {photoUrl ? '사진 변경' : '사진 업로드'}
                </Button>
              )}
            </FileButton>
            {photoUrl && (
              <Button variant="subtle" color="red" onClick={() => setPhotoUrl(undefined)}>
                사진 제거
              </Button>
            )}
          </Group>
          {photoUrl && (
            <div style={{ marginTop: 12, width: 120, height: 120 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(photoUrl)}
                alt="프로필 미리보기"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        <Select
          label="톤 (플레이스홀더 색상)"
          required
          data={TONE_OPTIONS}
          value={form.values.tone}
          onChange={(value) => {
            if (value) {
              form.setFieldValue('tone', value as PhotoTone)
            }
          }}
        />

        <TextInput
          label="전공"
          placeholder="서울대학교 음악대학 기악과 졸업"
          required
          {...form.getInputProps('major')}
        />

        {/* 경력 동적 리스트 */}
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
            경력 <span style={{ color: 'red' }}>*</span>
          </div>
          <Stack gap="xs">
            {career.map((item, index) => (
              <Group key={index} gap="xs" wrap="nowrap">
                <TextInput
                  placeholder={`경력 ${index + 1}`}
                  value={item}
                  onChange={(event) => handleCareerChange(index, event.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  disabled={career.length <= 1}
                  onClick={() => removeCareer(index)}
                >
                  <TrashIcon size={14} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
          {career.length < 10 && (
            <Button variant="light" size="xs" mt="xs" onClick={addCareer}>
              + 경력 추가
            </Button>
          )}
        </div>

        <TextInput
          label="한 줄 소개 (인용문)"
          placeholder="서두르지 않아도 괜찮습니다."
          {...form.getInputProps('quote')}
        />

        {/* 일정 슬롯 */}
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
            수업 일정
          </div>
          <Stack gap="sm">
            {schedule.map((slot, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(22,32,29,.1)',
                  borderRadius: 4,
                }}
              >
                <Group gap="xs" wrap="nowrap" align="center">
                  <Select
                    data={DAY_OPTIONS}
                    value={slot.day}
                    onChange={(value) => {
                      if (value) {
                        handleScheduleChange(index, 'day', value)
                      }
                    }}
                    style={{ width: 120 }}
                  />
                  <TimeInput
                    value={slot.startTime}
                    onChange={(event) => handleScheduleChange(index, 'startTime', event.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 14, color: TOKENS.inkSoft }}>~</span>
                  <TimeInput
                    value={slot.endTime}
                    onChange={(event) => handleScheduleChange(index, 'endTime', event.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                </Group>
                <Group gap="xs" wrap="nowrap" align="center" mt="xs">
                  <TextInput
                    placeholder="수업명"
                    value={slot.lessonName}
                    onChange={(event) => handleScheduleChange(index, 'lessonName', event.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon variant="subtle" color="red" onClick={() => removeSchedule(index)}>
                    <TrashIcon size={14} />
                  </ActionIcon>
                </Group>
              </div>
            ))}
          </Stack>
          <Button variant="light" size="xs" mt="xs" onClick={addSchedule}>
            + 일정 추가
          </Button>
        </div>

        <Checkbox
          label="메인 화면에 노출"
          checked={form.values.featured}
          onChange={(event) => form.setFieldValue('featured', event.currentTarget.checked)}
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
