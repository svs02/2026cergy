export const UserRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const UserRoleDisplay = {
  [UserRole.ADMIN]: '관리자',
  [UserRole.MEMBER]: '회원',
  [UserRole.GUEST]: '비회원',
} as const

export const PostCategory = {
  NOTICE: 'NOTICE',
  EVENT: 'EVENT',
  GALLERY: 'GALLERY',
} as const

export type PostCategory = (typeof PostCategory)[keyof typeof PostCategory]

export const PostCategoryDisplay = {
  [PostCategory.NOTICE]: '공지사항',
  [PostCategory.EVENT]: '행사',
  [PostCategory.GALLERY]: '갤러리',
} as const
