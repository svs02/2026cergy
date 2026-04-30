const API_URL = process.env.NEXT_PUBLIC_API_URL
if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다')
}

export const NoticeTag = {
  NOTICE: 'NOTICE',
  EVENT: 'EVENT',
} as const
export type NoticeTag = (typeof NoticeTag)[keyof typeof NoticeTag]

export const GalleryCategory = {
  ALL: '전체',
  SPACE: '공간',
  LESSON: '레슨',
  RECITAL: '발표회',
  INSTRUMENT: '악기',
} as const
export type GalleryCategory = (typeof GalleryCategory)[keyof typeof GalleryCategory]

export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
} as const
export type MediaType = (typeof MediaType)[keyof typeof MediaType]

export interface NoticeItem {
  _id: string
  title: string
  body: string
  tag: NoticeTag
  images: string[]
  views: number
  isPinned: boolean
  pinnedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NoticeListResponse {
  items: NoticeItem[]
  total: number
  page: number
  limit: number
}

export interface GalleryItem {
  _id: string
  imageUrl: string
  mediaType?: MediaType
  thumbnailUrl?: string
  category: GalleryCategory
  caption?: string
  featured?: boolean
  sortOrder: number
  createdAt: string
}

export function isVideo(item: GalleryItem): boolean {
  return item.mediaType === 'video'
}

export interface GalleryListResponse {
  items: GalleryItem[]
}

export interface AdminStatusResponse {
  isAdmin: boolean
}

export interface UploadResponse {
  url: string
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`
  const isFormData = init?.body instanceof FormData
  const headers = new Headers(init?.headers)
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const detail = text.length > 0 ? text : response.statusText
    throw new Error(`API 오류 ${response.status}: ${detail}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) {
    return ''
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${API_URL}${path}`
}

export async function getAdminStatus(): Promise<AdminStatusResponse> {
  return apiFetch<AdminStatusResponse>('/api/auth/admin/me')
}

export async function adminLogin(password: string): Promise<AdminStatusResponse> {
  return apiFetch<AdminStatusResponse>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export async function adminLogout(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/api/auth/admin/logout', {
    method: 'POST',
  })
}

export async function listNotices(page = 1, limit = 20): Promise<NoticeListResponse> {
  return apiFetch<NoticeListResponse>(`/api/notices?page=${page}&limit=${limit}`)
}

export async function getNotice(id: string): Promise<NoticeItem> {
  return apiFetch<NoticeItem>(`/api/notices/${id}`)
}

export interface NoticeInput {
  title: string
  body: string
  tag: NoticeTag
  images: string[]
}

export async function createNotice(data: NoticeInput): Promise<NoticeItem> {
  return apiFetch<NoticeItem>('/api/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateNotice(id: string, data: NoticeInput): Promise<NoticeItem> {
  return apiFetch<NoticeItem>(`/api/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteNotice(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/notices/${id}`, {
    method: 'DELETE',
  })
}

export async function toggleNoticePin(id: string, isPinned: boolean): Promise<NoticeItem> {
  return apiFetch<NoticeItem>(`/api/notices/${id}/pin`, {
    method: 'PATCH',
    body: JSON.stringify({ isPinned }),
  })
}

export async function listGallery(category?: GalleryCategory): Promise<GalleryListResponse> {
  const query = category && category !== GalleryCategory.ALL
    ? `?category=${encodeURIComponent(category)}`
    : ''
  return apiFetch<GalleryListResponse>(`/api/gallery${query}`)
}

export interface GalleryUploadMeta {
  category: GalleryCategory
  caption?: string
  featured?: boolean
}

export async function uploadGalleryMedia(
  file: File,
  meta: GalleryUploadMeta,
  thumbnail?: Blob,
): Promise<GalleryItem> {
  const form = new FormData()
  form.append('image', file)
  form.append('category', meta.category)
  if (meta.caption) {
    form.append('caption', meta.caption)
  }
  if (meta.featured) {
    form.append('featured', 'true')
  }
  if (thumbnail) {
    form.append('thumbnail', thumbnail, 'thumb.jpg')
  }
  return apiFetch<GalleryItem>('/api/gallery', {
    method: 'POST',
    body: form,
  })
}

export const uploadGalleryImage = uploadGalleryMedia

export async function deleteGalleryImage(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/gallery/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderGallery(orderedIds: string[]): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/api/gallery/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('image', file)
  return apiFetch<UploadResponse>('/api/upload', {
    method: 'POST',
    body: form,
  })
}

/* ── Instructor ── */

export const PhotoTone = {
  GREEN: 'green',
  GREEN_L: 'greenL',
  WOOD: 'wood',
  SUN: 'sun',
  CREAM: 'cream',
  IVORY: 'ivory',
} as const
export type PhotoTone = (typeof PhotoTone)[keyof typeof PhotoTone]

export const Day = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
} as const
export type Day = (typeof Day)[keyof typeof Day]

export interface ScheduleSlot {
  day: Day
  startTime: string
  endTime: string
  lessonName: string
}

export interface InstructorItem {
  _id: string
  name: string
  nameEn: string
  role: string
  photoUrl?: string
  tone: PhotoTone
  major: string
  career: string[]
  quote?: string
  schedule: ScheduleSlot[]
  featured: boolean
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface InstructorListResponse {
  items: InstructorItem[]
}

export interface InstructorInput {
  name: string
  nameEn: string
  role: string
  photoUrl?: string
  tone: PhotoTone
  major: string
  career: string[]
  quote?: string
  schedule: ScheduleSlot[]
  featured: boolean
  active: boolean
}

export async function listInstructors(featured?: boolean): Promise<InstructorListResponse> {
  const query = featured ? '?featured=true' : ''
  return apiFetch<InstructorListResponse>(`/api/instructors${query}`)
}

export async function getInstructor(id: string): Promise<InstructorItem> {
  return apiFetch<InstructorItem>(`/api/instructors/${id}`)
}

export async function createInstructor(data: InstructorInput): Promise<InstructorItem> {
  return apiFetch<InstructorItem>('/api/instructors', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateInstructor(id: string, data: Partial<InstructorInput>): Promise<InstructorItem> {
  return apiFetch<InstructorItem>(`/api/instructors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteInstructor(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/instructors/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderInstructors(orderedIds: string[]): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/api/instructors/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })
}
