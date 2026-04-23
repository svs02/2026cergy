# Frontend 개발 가이드

Next.js App Router + TypeScript + Tailwind CSS + Mantine UI 기반.
루트 CLAUDE.md의 모든 규칙을 기본으로 따른다.

## 패키지 매니저

- **pnpm 필수** (npm, yarn 사용 금지)
- 의존성 설치: `pnpm install`
- 개발 서버: `pnpm dev`
- 빌드: `pnpm build`

## 폴더 구조

```
src/
├── app/                   # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃 (MantineProvider)
│   ├── page.tsx           # 홈
│   ├── (public)/          # 비로그인 접근 가능
│   │   ├── about/
│   │   ├── posts/
│   │   └── gallery/
│   └── (auth)/            # 로그인 필요
│       └── mypage/
├── components/            # 공유 컴포넌트
│   ├── layout/            # Header, Footer, Nav
│   └── ui/                # 재사용 UI 컴포넌트
├── constants/             # as const 상수 정의
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티 (api.ts 등)
└── types/                 # 공유 타입 정의
```

## 네이밍 규칙

- 컴포넌트 파일: PascalCase (`PostCard.tsx`)
- 훅 파일: camelCase, use 접두사 (`usePostList.ts`)
- 유틸 파일: camelCase (`formatDate.ts`)
- CSS Module 파일: 컴포넌트와 동일 이름 (`PostCard.module.css`)

## 컴포넌트 작성 규칙

### Server Component 우선
- 데이터 페칭은 Server Component에서
- 인터랙션이 필요한 경우만 `'use client'` 추가

### Props 타입 정의
```tsx
// ✅ interface로 Props 정의
interface PostCardProps {
  title: string
  date: string
  category: PostCategory
}

export function PostCard({ title, date, category }: PostCardProps) { ... }
```

## Mantine 사용 규칙

### 기본값 props 금지
```tsx
// ❌ <Text size="md"> <Button variant="filled"> <Card shadow="sm">
// ✅ <Text fw={700}> <Button size="lg"> <Card shadow="md">
```

### 폼: useForm + zodResolver
```tsx
import { useForm, zodResolver } from '@mantine/form'
import { z } from 'zod'

const schema = z.strictObject({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.email('올바른 이메일을 입력해주세요'),
})

const form = useForm({
  validate: zodResolver(schema),
  initialValues: { name: '', email: '' },
})
```

### DateInput: string 타입 필수
```tsx
import dayjs from 'dayjs'
const today = dayjs().format('YYYY-MM-DD')
// value, minDate, maxDate 모두 string 타입
<DateInput value={form.values.date} minDate={today} />
```

### 알림
```tsx
import { notifications } from '@mantine/notifications'
notifications.show({ title: '완료', message: '저장되었습니다', color: 'green' })
```

## 스타일링 우선순위

1. Mantine 컴포넌트 props (`p`, `m`, `fw`, `c`, `bg` 등)
2. CSS Modules (`.module.css`) — 복잡한 레이아웃
3. Tailwind — 간단한 유틸리티
4. `style` prop — 동적 값만

## 이미지 최적화

- 모든 이미지는 `next/image`의 `<Image>` 컴포넌트 사용
- `width`, `height` 또는 `fill` 필수 지정
- 외부 이미지는 `next.config.ts`의 `remotePatterns`에 등록

## 반응형 기준 (Mantine 기본 breakpoints)

| 이름 | 너비 |
|------|------|
| xs   | 576px |
| sm   | 768px |
| md   | 992px |
| lg   | 1200px |
| xl   | 1400px |

```tsx
// Mantine 반응형 예시
<Stack gap={{ base: 'sm', md: 'xl' }}>
<Grid>
  <Grid.Col span={{ base: 12, md: 6 }}>
```
