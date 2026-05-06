# 에이전트 팀 설계 — cergy2026 바이올린 학원 웹사이트

**작성일:** 2026-04-22  
**프로젝트:** cergy2026 (바이올린 학원 홍보 및 커뮤니티 웹사이트)  
**방식:** 오케스트레이터 + 레이어 전문가 팀 (병렬 + 파이프라인 혼합)

---

## 1. 전체 아키텍처

```
사용자
  │
  ├── /gallery-feature <기능 요청>    ← 갤러리 전용 오케스트레이터
  ├── /post-feature <기능 요청>       ← 게시판 전용 오케스트레이터
  └── /auth-feature <기능 요청>       ← 인증/마이페이지 오케스트레이터
         │
         │ 프로젝트 맥락 탑재 후 지휘
         ▼
  ┌─────────────────────────────────────────────┐
  │              레이어 에이전트 팀               │
  │                                             │
  │  feature-dev:code-explorer  ← 기존 코드 분석 │
  │       ↓                                     │
  │  system-architect  ← API 계약 & DB 스키마   │
  │       ↓                                     │
  │  frontend-dev ──┐  ← Next.js 컴포넌트       │
  │  backend-dev  ──┘  ← Express + Mongoose     │
  │    (병렬 실행)                               │
  │       ↓                                     │
  │  superpowers:code-reviewer  ← 코드 리뷰     │
  │       ↓                                     │
  │  devops  (선택)   ← EC2/S3/nginx 변경 시    │
  └─────────────────────────────────────────────┘
```

**핵심 원칙:**
- 오케스트레이터 스킬이 CLAUDE.md 규칙 전체를 컨텍스트로 탑재하여 하위 에이전트에 전달
- `system-architect`가 API 계약을 먼저 확정한 뒤 프론트/백엔드 병렬 착수
- 기능마다 독립된 스킬로 도메인 지식이 섞이지 않음
- `devops`는 인프라 변경(S3 정책, nginx 라우팅 등)이 필요할 때만 선택적 호출

---

## 2. 오케스트레이터 스킬

### 2-1. `/gallery-feature <요청>`

**탑재 맥락:**
- S3 presigned URL 업로드 패턴 (`gallery/{year}/{month}/`)
- `next/image` 최적화 규칙 (`width`/`height` 또는 `fill` 필수, `remotePatterns` 등록)
- Mongoose Gallery 모델 컨벤션 (`timestamps: true`, `findById`, `.orFail()`)
- 기존 코드 위치: `backend/src/routes/gallery.ts`

**실행 파이프라인:**
```
1. feature-dev:code-explorer  → 기존 갤러리 코드 분석 및 컨텍스트 요약
2. system-architect           → API 엔드포인트 + DB 스키마 설계 → docs/api/gallery.md
3. frontend-dev + backend-dev → 병렬 구현 (worktree 격리)
4. superpowers:code-reviewer  → 코드 리뷰 (CLAUDE.md 규칙 + 보안)
5. devops (선택)              → S3 버킷/정책 변경 필요 시
```

---

### 2-2. `/post-feature <요청>`

**탑재 맥락:**
- 게시판 카테고리 상수 패턴 (`as const`, enum 금지)
- 댓글/페이지네이션 쿼리 최적화 규칙
- Mantine 폼 + zodResolver 패턴 (`z.strictObject`, `z.email()`)
- 기존 코드 위치: `backend/src/routes/post.ts`

**실행 파이프라인:**
```
1. feature-dev:code-explorer  → 기존 게시판 코드 분석 및 컨텍스트 요약
2. system-architect           → API 계약 + 페이지네이션 설계 → docs/api/post.md
3. frontend-dev + backend-dev → 병렬 구현
4. superpowers:code-reviewer  → 코드 리뷰
```

---

### 2-3. `/auth-feature <요청>`

**탑재 맥락:**
- Passport.js Naver/Google OAuth 흐름
- `UserRole` 상수 패턴 및 권한 미들웨어 규칙
- 기존 코드 위치: `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`, `backend/src/models/User.ts`

**실행 파이프라인:**
```
1. feature-dev:code-explorer  → 기존 인증 코드 분석
2. system-architect           → 권한 흐름 설계
3. frontend-dev + backend-dev → 병렬 구현
4. superpowers:code-reviewer  → 코드 리뷰 (보안 집중)
```

---

### 공통 탑재 규칙 (모든 스킬 포함)

| 항목 | 규칙 |
|------|------|
| 패키지 매니저 | pnpm 필수 (npm/yarn 금지) |
| TypeScript 상수 | `as const` 필수, `enum` 금지 |
| 타입 안전성 | `any` 금지 → `unknown` + 타입 가드 |
| Mongoose 조회 | `findById()`, `findByIdAndUpdate()`, `.orFail()` 필수 |
| Mantine props | 기본값 props 금지 (`size="md"` 등) |
| 환경변수 | Fail Fast — fallback 값 금지, 없으면 즉시 throw |
| 코드 품질 | `??` 사용 (`\|\|` 금지), 중괄호 필수, 단일문자 변수명 금지 |
| Zod | v4 API 사용 (`z.strictObject`, `z.email()`, `z.looseObject`) |

---

## 3. 레이어 에이전트 역할

### `feature-dev:code-explorer` — 탐색 전문가
- **실행 시점:** 오케스트레이터 첫 번째 단계
- **책임:**
  - 기존 관련 코드 전체 분석 (routes, controllers, services, models, components)
  - 중복 구현 위험 파악
  - 다음 에이전트(`system-architect`)에게 전달할 컨텍스트 요약 생성

### `system-architect` — API 설계자
- **실행 시점:** code-explorer 완료 후
- **책임:**
  - REST API 엔드포인트 확정 (URL, method, req/res 스펙)
  - Mongoose 스키마 설계 (`timestamps: true`, 인덱스)
  - 프론트/백엔드 병렬 착수 가능한 계약 문서 생성
  - **결과물:** `docs/api/<feature>.md`

### `frontend-dev` — 프론트엔드 구현
- **실행 시점:** system-architect 완료 후 (backend-dev와 병렬)
- **책임:**
  - Next.js Server Component 우선 구현 (`'use client'` 최소화)
  - Mantine UI + zodResolver 폼 구현
  - `next/image` 최적화 (`width`/`height` 또는 `fill`)
  - 모바일 반응형 (Mantine breakpoints 기준)
  - 스타일 우선순위 준수: Mantine props → CSS Modules → Tailwind → inline

### `backend-dev` — 백엔드 구현
- **실행 시점:** system-architect 완료 후 (frontend-dev와 병렬)
- **책임:**
  - Router → Controller → Service → Model 레이어 구현
  - Zod v4 입력 검증, 전역 에러핸들러 연동 (`next(err)`)
  - S3 presigned URL 생성 (갤러리 기능 시)
  - Mongoose 컨벤션 준수 (`findById`, `.orFail()`, embedded 데이터 재조회 금지)

### `superpowers:code-reviewer` — 리뷰어
- **실행 시점:** 프론트/백엔드 구현 완료 후
- **책임:**
  - CLAUDE.md 규칙 준수 확인 (enum 사용, `any` 타입, `||` 연산자 등)
  - 보안 취약점 검토 (NoSQL injection, XSS, S3 퍼블릭 노출 등)
  - 레이어 역할 침범 여부 확인 (Controller에 비즈니스 로직 없는지 등)

### `devops` — 배포 전문가 (선택적)
- **실행 시점:** S3/EC2 인프라 변경이 필요한 경우만 호출
- **책임:**
  - S3 버킷 정책, presigned URL 설정
  - nginx 라우팅 변경
  - PM2 재시작, AWS SSM Parameter Store 환경변수 등록

---

## 4. 구현 순서

1. 오케스트레이터 스킬 파일 작성
   - `skills/gallery-feature.md`
   - `skills/post-feature.md`
   - `skills/auth-feature.md`

2. 스킬 등록 — `skills-lock.json` 업데이트

3. 검증 — 실제 기능 요청으로 파이프라인 동작 확인
