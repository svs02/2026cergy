'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  listInstructors,
  deleteInstructor,
  reorderInstructors,
  getImageUrl,
  type InstructorItem,
} from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { Display } from '@/components/Display'
import { GoldRule } from '@/components/GoldRule'
import { Photo } from '@/components/Photo'
import { ArrowIcon, TrashIcon } from '@/components/Icons'
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

function InstructorCard({
  person,
  index,
  isAdmin,
  onDelete,
}: {
  person: InstructorItem
  index: number
  isAdmin: boolean
  onDelete: (instructor: InstructorItem) => void
}) {
  const isInactive = !person.active
  const hasSrc = !!person.photoUrl

  return (
    <div
      style={{
        marginBottom: 28,
        background: index === 0 ? TOKENS.bgWarm : '#fff',
        border: index === 0 ? 'none' : '1px solid rgba(22,32,29,.1)',
        opacity: isInactive ? 0.5 : 1,
        position: 'relative',
      }}
    >
      {isInactive && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            background: TOKENS.inkMute,
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

      {hasSrc ? (
        <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(person.photoUrl)}
            alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <Photo label={person.name} height={260} tone={person.tone} />
      )}

      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <Display size={24} italic={false} color={TOKENS.green} fontWeight={600}>
            {person.name}
          </Display>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2.5,
              color: TOKENS.gold,
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            {person.nameEn}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 12,
            color: TOKENS.inkSoft,
            marginTop: 4,
            letterSpacing: 0.5,
          }}
        >
          {person.role}
        </div>

        <GoldRule width={28} />

        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 13,
            color: TOKENS.ink,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {person.major}
        </div>

        <ul
          style={{
            margin: '12px 0 0',
            padding: 0,
            listStyle: 'none',
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 12.5,
            color: TOKENS.inkSoft,
            lineHeight: 1.75,
          }}
        >
          {person.career.map((item) => (
            <li key={item} style={{ display: 'flex', gap: 10, paddingLeft: 0 }}>
              <span style={{ color: TOKENS.gold }}>—</span>
              <span style={{ flex: 1 }}>{item}</span>
            </li>
          ))}
        </ul>

        {person.quote && (
          <div
            style={{
              marginTop: 18,
              padding: '14px 16px',
              borderLeft: `2px solid ${TOKENS.gold}`,
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: TOKENS.green,
              lineHeight: 1.5,
              background: index === 0 ? 'rgba(255,255,255,.5)' : TOKENS.bgWarm,
            }}
          >
            &ldquo;{person.quote}&rdquo;
          </div>
        )}

        {person.schedule.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 2,
                color: TOKENS.gold,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              SCHEDULE
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                fontSize: 12,
              }}
            >
              <tbody>
                {person.schedule.map((slot, slotIndex) => (
                  <tr
                    key={slotIndex}
                    style={{ borderBottom: '1px solid rgba(22,32,29,.06)' }}
                  >
                    <td style={{ padding: '6px 8px 6px 0', color: TOKENS.ink, fontWeight: 500, width: 30 }}>
                      {slot.day}
                    </td>
                    <td style={{ padding: '6px 8px', color: TOKENS.inkSoft }}>
                      {slot.startTime} – {slot.endTime}
                    </td>
                    <td style={{ padding: '6px 0 6px 8px', color: TOKENS.ink }}>
                      {slot.lessonName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <Link
              href={`/instructors/${person._id}/edit`}
              style={{
                ...secondaryBtnStyle,
                textDecoration: 'none',
                fontSize: 11,
                padding: '8px 14px',
              }}
            >
              수정
            </Link>
            <button
              onClick={() => onDelete(person)}
              style={{
                ...secondaryBtnStyle,
                color: '#c0392b',
                borderColor: '#c0392b',
                fontSize: 11,
                padding: '8px 14px',
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableInstructorRow({
  person,
  index,
  total,
  onMove,
}: {
  person: InstructorItem
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: person._id,
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
          {person.name}
          {!person.active && (
            <span style={{ fontSize: 10, color: TOKENS.inkMute, marginLeft: 8 }}>비공개</span>
          )}
          {person.featured && (
            <span style={{ fontSize: 10, color: TOKENS.gold, marginLeft: 8 }}>메인 노출</span>
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
          {person.nameEn} · {person.role}
        </div>
      </div>
    </div>
  )
}

export default function InstructorsPage() {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [items, setItems] = useState<InstructorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listInstructors()
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

  const handleDelete = async (instructor: InstructorItem) => {
    if (!window.confirm(`${instructor.name} 강사를 삭제하시겠습니까?`)) {
      return
    }
    try {
      await deleteInstructor(instructor._id)
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

  const persistOrder = async (next: InstructorItem[]) => {
    const previous = items
    setItems(next)
    try {
      await reorderInstructors(next.map((item) => item._id))
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
    <div style={{ background: TOKENS.bg, paddingBottom: 56 }}>
      <PageHeader
        title="강사진"
        eyebrow="INSTRUCTORS"
        lead="Cergy의 음악은 사람으로부터 시작됩니다."
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
              <Link href="/instructors/new" style={{ ...primaryBtnStyle, textDecoration: 'none' }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 강사 등록
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
          등록된 강사가 없습니다.
        </div>
      ) : sortMode ? (
        <div style={{ padding: '0 24px' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
              {items.map((person, index) => (
                <SortableInstructorRow
                  key={person._id}
                  person={person}
                  index={index}
                  total={items.length}
                  onMove={handleMove}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div style={{ padding: '8px 24px 0' }}>
          {items.map((person, index) => (
            <InstructorCard
              key={person._id}
              person={person}
              index={index}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

    </div>
  )
}
