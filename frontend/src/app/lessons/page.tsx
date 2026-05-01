'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { notifications } from '@mantine/notifications'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TOKENS } from '@/lib/tokens'
import {
  listLessons,
  deleteLesson,
  reorderLessons,
  type LessonItem,
} from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { ArrowIcon } from '@/components/Icons'
import { useAdmin } from '@/components/AdminContext'

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  background: TOKENS.green,
  color: '#fff',
  border: 'none',
  fontFamily: "var(--font-sans), 'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.5,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const secondaryBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'transparent',
  color: TOKENS.green,
  border: `1px solid ${TOKENS.green}`,
}

function LessonCard({
  lesson,
  index,
  isAdmin,
  onDelete,
}: {
  lesson: LessonItem
  index: number
  isAdmin: boolean
  onDelete: (lesson: LessonItem) => void
}) {
  const isGreen = index % 2 === 0
  const isInactive = !lesson.active
  const displayNumber = String(index + 1).padStart(2, '0')

  return (
    <div
      style={{
        margin: '0 24px 18px',
        padding: 22,
        background: isGreen ? TOKENS.green : TOKENS.bgWarm,
        color: isGreen ? '#fff' : TOKENS.ink,
        opacity: isInactive ? 0.5 : 1,
        position: 'relative',
      }}
    >
      {isInactive && isAdmin && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            background: 'rgba(0,0,0,.5)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '4px 10px',
            letterSpacing: 1,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
          }}
        >
          비공개
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 36,
            color: isGreen ? TOKENS.goldBright : TOKENS.gold,
          }}
        >
          {displayNumber}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: -0.2,
            lineHeight: 1.05,
            color: isGreen ? '#fff' : TOKENS.green,
          }}
        >
          {lesson.title}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: isGreen ? TOKENS.sun : TOKENS.gold,
          fontFamily: "var(--font-sans), 'Inter', sans-serif",
          marginTop: 4,
          fontWeight: 600,
        }}
      >
        {lesson.subtitle.toUpperCase()}
      </div>
      <div
        style={{
          height: 1,
          background: isGreen ? 'rgba(255,255,255,.2)' : 'rgba(22,32,29,.12)',
          margin: '16px 0',
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
          fontSize: 13,
          lineHeight: 1.7,
          color: isGreen ? 'rgba(255,255,255,.85)' : TOKENS.inkSoft,
        }}
      >
        {lesson.description}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 18,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontSize: 18,
            fontStyle: 'italic',
          }}
        >
          {lesson.price}
        </div>
        <a
          href="https://ig.me/m/cergy_violin.piano"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 16px',
            border: `1px solid ${isGreen ? '#fff' : TOKENS.ink}`,
            fontSize: 11,
            letterSpacing: 2,
            fontWeight: 600,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          상담 신청 <ArrowIcon size={11} color={isGreen ? '#fff' : TOKENS.ink} />
        </a>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Link
            href={`/lessons/${lesson._id}/edit`}
            style={{
              ...secondaryBtnStyle,
              textDecoration: 'none',
              fontSize: 11,
              padding: '8px 14px',
              color: isGreen ? '#fff' : TOKENS.green,
              borderColor: isGreen ? '#fff' : TOKENS.green,
            }}
          >
            수정
          </Link>
          <button
            onClick={() => onDelete(lesson)}
            style={{
              ...secondaryBtnStyle,
              color: isGreen ? '#ffc0c0' : '#c0392b',
              borderColor: isGreen ? '#ffc0c0' : '#c0392b',
              fontSize: 11,
              padding: '8px 14px',
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

function SortableLessonRow({
  lesson,
  index,
  total,
  onMove,
}: {
  lesson: LessonItem
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson._id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid rgba(22,32,29,.08)',
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={(event) => { event.stopPropagation(); onMove(index, -1) }}
          disabled={index === 0}
          style={{
            background: 'none',
            border: 'none',
            cursor: index === 0 ? 'default' : 'pointer',
            opacity: index === 0 ? 0.3 : 1,
            fontSize: 14,
            padding: '2px 6px',
          }}
        >
          ▲
        </button>
        <button
          onClick={(event) => { event.stopPropagation(); onMove(index, 1) }}
          disabled={index === total - 1}
          style={{
            background: 'none',
            border: 'none',
            cursor: index === total - 1 ? 'default' : 'pointer',
            opacity: index === total - 1 ? 0.3 : 1,
            fontSize: 14,
            padding: '2px 6px',
          }}
        >
          ▼
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: TOKENS.ink,
          }}
        >
          {String(index + 1).padStart(2, '0')}. {lesson.title}
          {!lesson.active && (
            <span style={{ fontSize: 10, color: TOKENS.inkMute, marginLeft: 8 }}>비공개</span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 10,
            color: TOKENS.inkMute,
            letterSpacing: 1.5,
          }}
        >
          {lesson.subtitle} · {lesson.price}
        </div>
      </div>
    </div>
  )
}

export default function LessonsPage() {
  const { isAdmin } = useAdmin()
  const [items, setItems] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listLessons()
      setItems(result.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isAdmin && sortMode) {
      setSortMode(false)
    }
  }, [isAdmin, sortMode])

  const handleDelete = async (lesson: LessonItem) => {
    if (!window.confirm(`"${lesson.title}" 커리큘럼을 삭제하시겠습니까?`)) {
      return
    }
    try {
      await deleteLesson(lesson._id)
      notifications.show({ title: '완료', message: '삭제했습니다.', color: 'green' })
      void refresh()
    } catch (error) {
      notifications.show({
        title: '삭제 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  const persistOrder = async (next: LessonItem[]) => {
    const previous = items
    setItems(next)
    try {
      await reorderLessons(next.map((item) => item._id))
    } catch (error) {
      setItems(previous)
      notifications.show({
        title: '정렬 저장 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) {
      return
    }
    const next = arrayMove(items, index, target)
    void persistOrder(next)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = items.findIndex((item) => item._id === active.id)
    const newIndex = items.findIndex((item) => item._id === over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const next = arrayMove(items, oldIndex, newIndex)
    void persistOrder(next)
  }

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40 }}>
      <PageHeader
        title="커리큘럼"
        eyebrow="CURRICULUM"
        lead={
          <>
            기초부터 심화까지, 단계적으로 설계된 레슨
          </>
        }
      />

      {isAdmin && (
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {sortMode ? (
            <button onClick={() => setSortMode(false)} style={primaryBtnStyle}>
              완료
            </button>
          ) : (
            <>
              <button
                onClick={() => setSortMode(true)}
                style={secondaryBtnStyle}
                disabled={items.length < 2}
              >
                정렬
              </button>
              <Link href="/lessons/new" style={{ ...primaryBtnStyle, textDecoration: 'none' }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 커리큘럼 등록
              </Link>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 13,
            color: TOKENS.inkMute,
          }}
        >
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 13,
            color: TOKENS.inkMute,
          }}
        >
          등록된 커리큘럼이 없습니다.
        </div>
      ) : sortMode ? (
        <div style={{ padding: '0 24px' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
              {items.map((lesson, index) => (
                <SortableLessonRow
                  key={lesson._id}
                  lesson={lesson}
                  index={index}
                  total={items.length}
                  onMove={handleMove}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        items.map((lesson, index) => (
          <LessonCard
            key={lesson._id}
            lesson={lesson}
            index={index}
            isAdmin={isAdmin}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  )
}
