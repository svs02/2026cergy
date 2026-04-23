# 바이올린 학원 웹사이트

## 프로젝트 개요
바이올린 학원 홍보 및 커뮤니티 웹사이트.

## 기술 스택
- Frontend: Next.js(App Router), TypeScript, Tailwind CSS, Mantine UI
- Backend: Node.js + Express, MongoDB(Mongoose)
- Auth: Passport.js (Naver OAuth, Google OAuth)
- Storage: Vercel Blob 또는 AWS S3
- 패키지 매니저: **pnpm 필수** (npm, yarn 사용 금지)
  ```bash
  pnpm install        # 의존성 설치
  pnpm add <패키지>   # 패키지 추가
  pnpm dev            # 개발 서버 실행
  pnpm build          # 빌드
  ```

## 개발 원칙
- 한국어 UI, 모바일 반응형
- 관리자/일반 사용자 권한 분리
- 이미지/동영상 최적화 필수

## 보안 & 환경변수
- 시크릿은 `.env.local`에만 저장 — Git 커밋 절대 금지
- 환경변수 예시만 `.env.example`로 관리
- **Fail Fast**: 환경변수 fallback 값 금지. 없으면 즉시 throw
  ```ts
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI가 설정되지 않았습니다')
  ```

## TypeScript
- 상수는 `as const` 패턴 필수, `enum` 절대 금지
  ```ts
  export const UserRole = { ADMIN: 'ADMIN', MEMBER: 'MEMBER' } as const
  export type UserRole = (typeof UserRole)[keyof typeof UserRole]
  ```
- `any` 타입 금지 — `unknown` + 타입 가드 사용
- 이미 검증된 타입에 불필요한 `as` 캐스팅 금지

## Zod (v4 API)
- `z.looseObject()` — `.passthrough()` 대신
- `z.strictObject()` — `.strict()` 대신
- `z.email()` / `z.url()` — `z.string().email()` 대신
- `z.enum(상수객체)` — `z.nativeEnum()` 대신

## Mantine UI
- 기본값 props 작성 금지 (`size="md"`, `shadow="sm"`, `variant="filled"` 등)
- DateInput의 `value`, `minDate`, `maxDate`는 반드시 `string` 타입 (Date 객체 금지)
  ```ts
  const today = dayjs().format('YYYY-MM-DD')
  <DateInput value={form.values.date} minDate={today} />
  ```
- 스타일 우선순위: Mantine props → CSS Modules → Tailwind → inline style(동적값만)

## MongoDB/Mongoose
- `findOne({ _id })` 대신 `findById()` 필수
- `updateOne({ _id })` 대신 `findByIdAndUpdate()` 필수
- 문서가 반드시 존재해야 하면 `.orFail()` 사용
- `new Types.ObjectId(id)` 불필요 — Mongoose가 자동 변환
- `.select()`에서 `_id` 명시 금지 (자동 포함)
- embedded(역정규화) 데이터가 있으면 DB 재조회 금지
- 문서 없을 때 가짜 fallback 데이터 반환 금지 — 에러 발생

## 코드 품질
- null/undefined 체크에 `??` 사용 (`||` 금지 — 0, '' 도 덮어씀)
- `if`/`for`/`while` 중괄호 필수
- 콜백 변수명: 단일 문자(`e`, `u`, `x`) 및 줄임말(`req`, `usr`) 금지
- 불필요한 주석 금지 — 코드가 설명하는 내용은 주석 생략, WHY만 작성
- 임시 분석 문서는 `/tmp/`에만 저장, 프로젝트 폴더 내 생성 금지
