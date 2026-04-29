'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  TextInput,
  Select,
  Checkbox,
  FileButton,
  Button,
  Stack,
  Group,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TOKENS } from '@/lib/tokens'
import {
  GalleryCategory,
  deleteGalleryImage,
  getImageUrl,
  isVideo,
  listGallery,
  reorderGallery,
  uploadGalleryMedia,
  type GalleryItem,
} from '@/lib/api'
import { Display } from '@/components/Display'
import { PageHeader } from '@/components/PageHeader'
import { Photo } from '@/components/Photo'
import { CloseIcon, PlayIcon, TrashIcon } from '@/components/Icons'
import { useAdmin } from '@/components/AdminContext'

const CATEGORIES = [
  GalleryCategory.ALL,
  GalleryCategory.SPACE,
  GalleryCategory.LESSON,
  GalleryCategory.RECITAL,
  GalleryCategory.INSTRUMENT,
] as const

const UPLOAD_CATEGORIES = [
  GalleryCategory.SPACE,
  GalleryCategory.LESSON,
  GalleryCategory.RECITAL,
  GalleryCategory.INSTRUMENT,
] as const

const VIDEO_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime'

function generateVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(video.src)
        resolve(null)
        return
      }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src)
          resolve(blob)
        },
        'image/jpeg',
        0.8,
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(file)
  })
}

const playOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
}

const playCircleStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'rgba(0,0,0,.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function VideoOverlay() {
  return (
    <div style={playOverlayStyle}>
      <div style={playCircleStyle}>
        <PlayIcon size={22} color="#fff" />
      </div>
    </div>
  )
}

function mediaThumbnailSrc(item: GalleryItem): string | undefined {
  if (isVideo(item)) {
    return item.thumbnailUrl ?? undefined
  }
  return item.imageUrl
}

export default function GalleryPage() {
  const { isAdmin } = useAdmin()
  const [category, setCategory] = useState<GalleryCategory>(GalleryCategory.ALL)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState<GalleryItem | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [sortMode, setSortMode] = useState(false)

  const refresh = useCallback(async (cat: GalleryCategory) => {
    setLoading(true)
    try {
      const result = await listGallery(cat)
      setItems(result.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(category)
  }, [category, refresh])

  useEffect(() => {
    if (!isAdmin && sortMode) {
      setSortMode(false)
    }
  }, [isAdmin, sortMode])

  const handleDelete = async (item: GalleryItem) => {
    if (!window.confirm('이 항목을 삭제할까요?')) {
      return
    }
    try {
      await deleteGalleryImage(item._id)
      notifications.show({ title: '완료', message: '삭제했습니다.', color: 'green' })
      void refresh(category)
    } catch (error) {
      notifications.show({
        title: '삭제 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        color: 'red',
      })
    }
  }

  const enterSortMode = () => {
    setCategory(GalleryCategory.ALL)
    setSortMode(true)
  }

  const persistOrder = async (next: GalleryItem[]) => {
    const previous = items
    setItems(next)
    try {
      await reorderGallery(next.map((item) => item._id))
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

  const renderTiles = () => {
    const rows: React.ReactNode[] = []
    let pair: GalleryItem[] = []
    items.forEach((item, index) => {
      if (item.featured) {
        if (pair.length > 0) {
          rows.push(<PairRow key={`p-${index}`} items={pair} onTap={setFocus} isAdmin={isAdmin} onDelete={handleDelete} />)
          pair = []
        }
        rows.push(
          <div key={`b-${index}`} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFocus(item)}>
            <Photo label={item.caption ?? ''} height={280} tone="green" src={mediaThumbnailSrc(item)} alt={item.caption ?? ''} />
            {isVideo(item) && <VideoOverlay />}
            {isAdmin && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDelete(item)
                }}
                style={trashButtonStyle}
              >
                <TrashIcon size={14} color="#fff" />
              </button>
            )}
          </div>,
        )
      } else {
        pair.push(item)
        if (pair.length === 2) {
          rows.push(<PairRow key={`p-${index}`} items={pair} onTap={setFocus} isAdmin={isAdmin} onDelete={handleDelete} />)
          pair = []
        }
      }
    })
    if (pair.length > 0) {
      rows.push(<PairRow key="last" items={pair} onTap={setFocus} isAdmin={isAdmin} onDelete={handleDelete} />)
    }
    return rows
  }

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40 }}>
      <PageHeader
        title="공간, 그리고 시간."
        eyebrow="SPACE · MOMENTS"
        lead="학원의 일상과 발표회의 기록."
      />

      {isAdmin && (
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {sortMode ? (
            <button
              onClick={() => setSortMode(false)}
              style={primaryActionButtonStyle}
            >
              완료
            </button>
          ) : (
            <>
              <button
                onClick={enterSortMode}
                style={secondaryActionButtonStyle}
                disabled={items.length < 2}
              >
                정렬
              </button>
              <button
                onClick={() => setUploadOpen(true)}
                style={primaryActionButtonStyle}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 미디어 업로드
              </button>
            </>
          )}
        </div>
      )}

      {sortMode && (
        <div
          style={{
            margin: '0 24px 16px',
            padding: '12px 14px',
            background: TOKENS.bgWarm,
            border: `1px solid ${TOKENS.gold}`,
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 12,
            lineHeight: 1.6,
            color: TOKENS.ink,
          }}
        >
          정렬 모드입니다. 사진을 길게 눌러 드래그하거나 ↑ ↓ 버튼으로 순서를 바꾸세요. 변경사항은
          자동 저장됩니다.
        </div>
      )}

      {!sortMode && (
        <div
          className="cergy-no-scrollbar"
          style={{ padding: '8px 24px 18px', display: 'flex', gap: 8, overflowX: 'auto' }}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                border: `1px solid ${category === cat ? TOKENS.green : 'rgba(22,32,29,.2)'}`,
                background: category === cat ? TOKENS.green : 'transparent',
                color: category === cat ? '#fff' : TOKENS.ink,
                fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={emptyStateStyle}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={emptyStateStyle}>아직 등록된 미디어가 없습니다.</div>
        ) : sortMode ? (
          <SortList
            items={items}
            onPersist={persistOrder}
            onMove={handleMove}
          />
        ) : (
          renderTiles()
        )}
      </div>

      {focus && !sortMode && (
        <div
          onClick={() => setFocus(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,12,11,.92)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <div style={{ position: 'absolute', top: 18, right: 18, color: '#fff', cursor: 'pointer' }}>
            <CloseIcon size={24} color="#fff" />
          </div>
          <div
            style={{
              width: '100%',
              maxWidth: 600,
              position: 'relative',
              ...(isVideo(focus) ? {} : { aspectRatio: '1/1' }),
            }}
          >
            {isVideo(focus) ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={getImageUrl(focus.imageUrl)}
                controls
                playsInline
                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                onClick={(event) => event.stopPropagation()}
              />
            ) : focus.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(focus.imageUrl)}
                alt={focus.caption ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Photo label={focus.caption ?? ''} fillHeight tone="green" />
            )}
          </div>
          <div style={{ marginTop: 18, color: '#fff', textAlign: 'center' }}>
            <Display size={20} color="#fff">
              {focus.caption ?? ''}
            </Display>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                color: TOKENS.goldBright,
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                marginTop: 6,
              }}
            >
              {focus.category}
            </div>
          </div>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false)
          void refresh(category)
        }}
      />
    </div>
  )
}

const trashButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  background: 'rgba(0,0,0,.55)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
}

const primaryActionButtonStyle: React.CSSProperties = {
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

const secondaryActionButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  background: 'transparent',
  color: TOKENS.green,
  border: `1px solid ${TOKENS.green}`,
  fontFamily: "var(--font-sans), 'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.5,
  cursor: 'pointer',
}

const emptyStateStyle: React.CSSProperties = {
  padding: '60px 0',
  textAlign: 'center',
  fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
  fontSize: 13,
  color: TOKENS.inkMute,
}

interface PairRowProps {
  items: GalleryItem[]
  onTap: (item: GalleryItem) => void
  isAdmin: boolean
  onDelete: (item: GalleryItem) => void
}

function PairRow({ items, onTap, isAdmin, onDelete }: PairRowProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map((item) => (
        <div
          key={item._id}
          style={{ aspectRatio: '1/1', cursor: 'pointer', position: 'relative' }}
          onClick={() => onTap(item)}
        >
          <Photo label={item.caption ?? ''} fillHeight tone="green" src={mediaThumbnailSrc(item)} alt={item.caption ?? ''} />
          {isVideo(item) && <VideoOverlay />}
          {isAdmin && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete(item)
              }}
              style={trashButtonStyle}
            >
              <TrashIcon size={14} color="#fff" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

interface SortListProps {
  items: GalleryItem[]
  onPersist: (next: GalleryItem[]) => Promise<void> | void
  onMove: (index: number, direction: -1 | 1) => void
}

function SortList({ items, onPersist, onMove }: SortListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = items.findIndex((item) => item._id === active.id)
    const newIndex = items.findIndex((item) => item._id === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }
    void onPersist(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, index) => (
            <SortableRow
              key={item._id}
              item={item}
              index={index}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMove={onMove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableRowProps {
  item: GalleryItem
  index: number
  isFirst: boolean
  isLast: boolean
  onMove: (index: number, direction: -1 | 1) => void
}

function SortableRow({ item, index, isFirst, isLast, onMove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'grid',
    gridTemplateColumns: '24px 84px 1fr auto',
    gap: 12,
    alignItems: 'center',
    padding: '8px 10px',
    background: isDragging ? TOKENS.bgWarm : '#fff',
    border: `1px solid ${isDragging ? TOKENS.gold : 'rgba(22,32,29,.12)'}`,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.18)' : 'none',
    opacity: isDragging ? 0.92 : 1,
    touchAction: 'none',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        aria-label="드래그하여 순서 변경"
        style={{
          cursor: 'grab',
          color: TOKENS.inkMute,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        ⋮⋮
      </div>
      <div style={{ width: 84, height: 84, position: 'relative', overflow: 'hidden' }}>
        <Photo label={item.caption ?? ''} fillHeight tone="green" src={mediaThumbnailSrc(item)} alt={item.caption ?? ''} />
        {isVideo(item) && (
          <div style={playOverlayStyle}>
            <div style={{ ...playCircleStyle, width: 28, height: 28 }}>
              <PlayIcon size={12} color="#fff" />
            </div>
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 13,
            color: TOKENS.ink,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.caption && item.caption.length > 0 ? item.caption : '(캡션 없음)'}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 10,
            color: TOKENS.gold,
            letterSpacing: 1.5,
            marginTop: 4,
          }}
        >
          {item.category}
          {item.featured ? ' · FEATURED' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          aria-label="위로 이동"
          onClick={() => onMove(index, -1)}
          disabled={isFirst}
          style={arrowButtonStyle(isFirst)}
        >
          ↑
        </button>
        <button
          aria-label="아래로 이동"
          onClick={() => onMove(index, 1)}
          disabled={isLast}
          style={arrowButtonStyle(isLast)}
        >
          ↓
        </button>
      </div>
    </div>
  )
}

function arrowButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 24,
    background: disabled ? 'rgba(22,32,29,.05)' : '#fff',
    color: disabled ? TOKENS.inkMute : TOKENS.green,
    border: `1px solid ${disabled ? 'rgba(22,32,29,.1)' : TOKENS.green}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1,
    padding: 0,
  }
}

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<GalleryCategory>(GalleryCategory.SPACE)
  const [caption, setCaption] = useState('')
  const [featured, setFeatured] = useState(false)
  const [uploading, setUploading] = useState(false)

  const reset = () => {
    setFile(null)
    setCategory(GalleryCategory.SPACE)
    setCaption('')
    setFeatured(false)
  }

  const handleSubmit = async () => {
    if (!file) {
      notifications.show({ title: '파일이 필요합니다', message: '파일을 선택해 주세요.', color: 'red' })
      return
    }
    setUploading(true)
    try {
      let thumbnail: Blob | undefined
      if (file.type.startsWith('video/')) {
        const generated = await generateVideoThumbnail(file)
        thumbnail = generated ?? undefined
      }
      await uploadGalleryMedia(
        file,
        {
          category,
          caption: caption.length > 0 ? caption : undefined,
          featured,
        },
        thumbnail,
      )
      notifications.show({ title: '완료', message: '업로드했습니다.', color: 'green' })
      reset()
      onUploaded()
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

  return (
    <Modal
      opened={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="미디어 업로드"
    >
      <Stack>
        <FileButton onChange={setFile} accept={VIDEO_ACCEPT}>
          {(props) => (
            <Button {...props} variant="outline">
              {file ? file.name : '이미지 / 동영상 선택'}
            </Button>
          )}
        </FileButton>
        <Select
          label="카테고리"
          data={UPLOAD_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          value={category}
          onChange={(value) => {
            if (!value) {
              return
            }
            const matched = UPLOAD_CATEGORIES.find((cat) => cat === value)
            if (matched) {
              setCategory(matched)
            }
          }}
        />
        <TextInput
          label="캡션 (선택)"
          value={caption}
          onChange={(event) => setCaption(event.currentTarget.value)}
          placeholder="예: 겨울 발표회 · 2025"
        />
        <Checkbox
          label="대표 사진 (풀폭 노출)"
          checked={featured}
          onChange={(event) => setFeatured(event.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            취소
          </Button>
          <Button onClick={() => void handleSubmit()} loading={uploading}>
            업로드
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
