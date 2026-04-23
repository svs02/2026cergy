# Agent Team 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cergy2026 프로젝트 전용 오케스트레이터 스킬 3개(`gallery-feature`, `post-feature`, `auth-feature`)를 `~/.claude/skills/`에 생성하여, 기능 개발 시 레이어 에이전트 팀을 일관되게 지휘할 수 있게 한다.

**Architecture:** 각 스킬은 프로젝트 고유 규칙(CLAUDE.md)과 도메인 맥락을 탑재한 오케스트레이터로, `feature-dev:code-explorer → system-architect → frontend-dev + backend-dev(병렬) → superpowers:code-reviewer → devops(선택)` 파이프라인을 지휘한다. 스킬 파일은 `~/.claude/skills/<skill-name>/SKILL.md` 형식으로 저장한다.

**Tech Stack:** Claude Code Skills (SKILL.md + YAML frontmatter), Markdown

---

## 파일 구조

```
~/.claude/skills/
├── gallery-feature/
│   └── SKILL.md          ← 갤러리 오케스트레이터 스킬
├── post-feature/
│   └── SKILL.md          ← 게시판 오케스트레이터 스킬
└── auth-feature/
    └── SKILL.md          ← 인증/마이페이지 오케스트레이터 스킬
```

---

## Task 1: gallery-feature 스킬 생성

**Files:**
- Create: `~/.claude/skills/gallery-feature/SKILL.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p ~/.claude/skills/gallery-feature
```

- [ ] **Step 2: SKILL.md 작성**

`~/.claude/skills/gallery-feature/SKILL.md` 내용:

```markdown
---
name: gallery-feature
description: cergy2026 바이올린 학원 프로젝트의 갤러리 기능을 개발할 때 사용. 사진/동영상 업로드, 앨범 관리, S3 연동 등 갤러리 관련 모든 기능 개발 시 반드시 이 스킬을 사용. "갤러리", "사진 업로드", "앨범", "이미지 관리" 등의 요청에 자동 트리거.
---

# Gallery Feature 오케스트레이터

cergy2026 프로젝트 갤러리 기능 전담 오케스트레이터.

## 프로젝트 컨텍스트

**스택:** Next.js App Router + TypeScript + Mantine UI (frontend) / Node.js + Express + Mongoose (backend) / AWS S3 (미디어)

**기존 코드 위치:**
- `backend/src/routes/gallery.ts`
- `frontend/src/app/(public)/gallery/`

**S3 구조:** `gallery/{year}/{month}/` — presigned URL로만 접근 (퍼블릭 직접 접근 금지)

## 파이프라인

아래 순서대로 에이전트를 지휘한다.

### Step 1 — 탐색 (feature-dev:code-explorer)

다음 내용을 분석하도록 지시:
- `backend/src/routes/gallery.ts`, `backend/src/models/` 내 Gallery 관련 모델
- `frontend/src/app/(public)/gallery/` 전체
- 중복 구현 위험 및 기존 패턴 요약

### Step 2 — 설계 (system-architect)

code-explorer 결과를 바탕으로:
- REST API 엔드포인트 확정 (URL, method, req body, res 스펙)
- Mongoose Gallery 스키마 (`timestamps: true`, 필요 인덱스)
- 결과물: `docs/api/gallery.md` 생성

### Step 3 — 구현 (frontend-dev + backend-dev 병렬)

system-architect 결과(`docs/api/gallery.md`)를 공유한 뒤 병렬 실행.

**backend-dev 지시사항:**
- Router → Controller → Service → Model 레이어 분리
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`로 presigned URL 생성
- Zod v4 입력 검증: `z.strictObject()` 사용 (`.strict()` 금지)
- `findById()`, `findByIdAndUpdate().orFail()` 필수
- 에러는 `next(err)`로 전역 핸들러에 위임

**frontend-dev 지시사항:**
- Server Component 우선 (`'use client'` 최소화)
- `next/image` `<Image>` 컴포넌트 필수 (`width`/`height` 또는 `fill`)
- 외부 S3 도메인을 `next.config.ts` `remotePatterns`에 등록
- Mantine 스타일 우선순위: props → CSS Modules → Tailwind → inline(동적값만)
- 기본값 props 작성 금지: `size="md"`, `shadow="sm"`, `variant="filled"` 등

### Step 4 — 리뷰 (superpowers:code-reviewer)

다음 항목 집중 검토:
- S3 presigned URL 사용 여부 (퍼블릭 직접 노출 금지)
- `enum` 사용 여부 (`as const` 패턴으로 교체)
- `any` 타입 사용 여부 (`unknown` + 타입 가드로 교체)
- `||` 연산자로 null 체크 여부 (`??`로 교체)
- Controller에 비즈니스 로직 없는지 확인

### Step 5 — 배포 (devops) — 선택적

S3 버킷 정책 변경, nginx 라우팅 추가, PM2 재시작이 필요한 경우만 호출.

## 공통 규칙 (모든 에이전트에 전달)

| 항목 | 규칙 |
|------|------|
| 패키지 매니저 | pnpm 필수 (npm/yarn 금지) |
| TypeScript 상수 | `as const` 필수, `enum` 금지 |
| 타입 | `any` 금지 → `unknown` + 타입 가드 |
| Null 체크 | `??` 사용 (`\|\|` 금지) |
| 환경변수 | fallback 금지, 없으면 즉시 throw |
| Zod | v4: `z.strictObject()`, `z.looseObject()`, `z.email()`, `z.url()` |
| 중괄호 | `if`/`for`/`while` 중괄호 필수 |
| 변수명 | 단일 문자(`e`, `u`) 및 줄임말(`req`, `usr`) 금지 |
```

- [ ] **Step 3: 파일 존재 확인**

```bash
cat ~/.claude/skills/gallery-feature/SKILL.md
```

Expected: 위에서 작성한 내용이 출력됨.

- [ ] **Step 4: 커밋 (설계 문서에 참조 추가)**

스킬은 `~/.claude/skills/`에 저장되어 git 추적 대상이 아니므로, 계획 문서에 경로를 기록한다.

---

## Task 2: post-feature 스킬 생성

**Files:**
- Create: `~/.claude/skills/post-feature/SKILL.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p ~/.claude/skills/post-feature
```

- [ ] **Step 2: SKILL.md 작성**

`~/.claude/skills/post-feature/SKILL.md` 내용:

```markdown
---
name: post-feature
description: cergy2026 바이올린 학원 프로젝트의 게시판/커뮤니티 기능을 개발할 때 사용. 공지사항, 자유게시판, 댓글, 페이지네이션 등 게시판 관련 모든 기능 개발 시 반드시 이 스킬을 사용. "게시판", "공지", "댓글", "게시글", "포스트" 등의 요청에 자동 트리거.
---

# Post Feature 오케스트레이터

cergy2026 프로젝트 게시판/커뮤니티 기능 전담 오케스트레이터.

## 프로젝트 컨텍스트

**스택:** Next.js App Router + TypeScript + Mantine UI (frontend) / Node.js + Express + Mongoose (backend)

**기존 코드 위치:**
- `backend/src/routes/post.ts`
- `frontend/src/app/(public)/posts/`

**카테고리 패턴:**
```ts
export const PostCategory = { NOTICE: 'NOTICE', FREE: 'FREE' } as const
export type PostCategory = (typeof PostCategory)[keyof typeof PostCategory]
```

**페이지네이션:** cursor 기반 또는 offset 기반 — system-architect가 결정.

## 파이프라인

### Step 1 — 탐색 (feature-dev:code-explorer)

다음 내용을 분석하도록 지시:
- `backend/src/routes/post.ts`, `backend/src/models/` 내 Post 관련 모델
- `frontend/src/app/(public)/posts/` 전체
- 기존 카테고리 상수, 페이지네이션 방식, 댓글 구조 파악

### Step 2 — 설계 (system-architect)

code-explorer 결과를 바탕으로:
- REST API 엔드포인트 확정
- 페이지네이션 전략 결정 (cursor vs offset)
- Mongoose Post/Comment 스키마
- 결과물: `docs/api/post.md` 생성

### Step 3 — 구현 (frontend-dev + backend-dev 병렬)

system-architect 결과(`docs/api/post.md`)를 공유한 뒤 병렬 실행.

**backend-dev 지시사항:**
- Router → Controller → Service → Model 레이어 분리
- 카테고리 상수는 `as const` 패턴 (`enum` 금지)
- Zod v4 입력 검증: `z.strictObject()` 사용
- `findById()`, `findByIdAndUpdate().orFail()` 필수
- 페이지네이션 쿼리 최적화 (인덱스 활용)
- 에러는 `next(err)`로 전역 핸들러에 위임

**frontend-dev 지시사항:**
- Server Component 우선 (`'use client'` 최소화)
- Mantine `useForm` + `zodResolver` 폼 구현
- `z.strictObject()`로 폼 스키마 정의
- 알림: `notifications.show({ title, message, color })` 사용
- Mantine 기본값 props 작성 금지

### Step 4 — 리뷰 (superpowers:code-reviewer)

다음 항목 집중 검토:
- `enum` 사용 여부 (`as const` 패턴으로 교체)
- `any` 타입 사용 여부
- `||` 연산자로 null 체크 여부 (`??`로 교체)
- Controller에 비즈니스 로직 없는지
- 관리자 권한 체크 누락 여부 (공지 작성 등)

## 공통 규칙 (모든 에이전트에 전달)

| 항목 | 규칙 |
|------|------|
| 패키지 매니저 | pnpm 필수 (npm/yarn 금지) |
| TypeScript 상수 | `as const` 필수, `enum` 금지 |
| 타입 | `any` 금지 → `unknown` + 타입 가드 |
| Null 체크 | `??` 사용 (`\|\|` 금지) |
| 환경변수 | fallback 금지, 없으면 즉시 throw |
| Zod | v4: `z.strictObject()`, `z.looseObject()`, `z.email()`, `z.url()` |
| 중괄호 | `if`/`for`/`while` 중괄호 필수 |
| 변수명 | 단일 문자(`e`, `u`) 및 줄임말(`req`, `usr`) 금지 |
```

- [ ] **Step 3: 파일 존재 확인**

```bash
cat ~/.claude/skills/post-feature/SKILL.md
```

Expected: 위에서 작성한 내용이 출력됨.

---

## Task 3: auth-feature 스킬 생성

**Files:**
- Create: `~/.claude/skills/auth-feature/SKILL.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p ~/.claude/skills/auth-feature
```

- [ ] **Step 2: SKILL.md 작성**

`~/.claude/skills/auth-feature/SKILL.md` 내용:

```markdown
---
name: auth-feature
description: cergy2026 바이올린 학원 프로젝트의 인증/마이페이지 기능을 개발할 때 사용. Naver/Google OAuth, 권한 관리, 마이페이지, 사용자 프로필 등 인증 관련 모든 기능 개발 시 반드시 이 스킬을 사용. "로그인", "OAuth", "권한", "마이페이지", "프로필" 등의 요청에 자동 트리거.
---

# Auth Feature 오케스트레이터

cergy2026 프로젝트 인증/마이페이지 기능 전담 오케스트레이터.

## 프로젝트 컨텍스트

**스택:** Passport.js (Naver OAuth, Google OAuth) / Mongoose User 모델

**기존 코드 위치:**
- `backend/src/routes/auth.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/models/User.ts`
- `frontend/src/app/(auth)/mypage/`

**권한 패턴:**
```ts
export const UserRole = { ADMIN: 'ADMIN', MEMBER: 'MEMBER' } as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
```

**미들웨어:** `backend/src/middleware/auth.ts`의 `requireAuth`, `requireAdmin` 사용.

## 파이프라인

### Step 1 — 탐색 (feature-dev:code-explorer)

다음 내용을 분석하도록 지시:
- `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`, `backend/src/models/User.ts`
- `frontend/src/app/(auth)/mypage/` 전체
- 기존 OAuth 콜백 흐름, 세션 처리 방식, 권한 미들웨어 구조 파악

### Step 2 — 설계 (system-architect)

code-explorer 결과를 바탕으로:
- 추가/변경할 API 엔드포인트 확정
- User 스키마 변경사항 (필요 시)
- 결과물: `docs/api/auth.md` 생성 또는 업데이트

### Step 3 — 구현 (frontend-dev + backend-dev 병렬)

system-architect 결과를 공유한 뒤 병렬 실행.

**backend-dev 지시사항:**
- 권한 체크는 반드시 `requireAuth`, `requireAdmin` 미들웨어 활용
- UserRole 상수는 `as const` 패턴 (`enum` 금지)
- `findById().orFail()` 필수
- 세션 데이터 변경 시 `req.session.save()` 처리 확인

**frontend-dev 지시사항:**
- `(auth)/` route group — 로그인 필요 페이지만 배치
- Server Component에서 세션 확인 후 리다이렉트
- Mantine 폼 + zodResolver 패턴

### Step 4 — 리뷰 (superpowers:code-reviewer)

보안 집중 검토:
- 권한 미들웨어 누락 여부 (모든 보호 라우트에 `requireAuth` 확인)
- 관리자 전용 엔드포인트에 `requireAdmin` 누락 여부
- 세션 고정 공격(session fixation) 위험 여부
- `enum` 사용, `any` 타입, `||` null 체크 여부

## 공통 규칙 (모든 에이전트에 전달)

| 항목 | 규칙 |
|------|------|
| 패키지 매니저 | pnpm 필수 (npm/yarn 금지) |
| TypeScript 상수 | `as const` 필수, `enum` 금지 |
| 타입 | `any` 금지 → `unknown` + 타입 가드 |
| Null 체크 | `??` 사용 (`\|\|` 금지) |
| 환경변수 | fallback 금지, 없으면 즉시 throw |
| Zod | v4: `z.strictObject()`, `z.looseObject()`, `z.email()`, `z.url()` |
| 중괄호 | `if`/`for`/`while` 중괄호 필수 |
| 변수명 | 단일 문자(`e`, `u`) 및 줄임말(`req`, `usr`) 금지 |
```

- [ ] **Step 3: 파일 존재 확인**

```bash
cat ~/.claude/skills/auth-feature/SKILL.md
```

Expected: 위에서 작성한 내용이 출력됨.

---

## Task 4: 스킬 등록 확인 및 최종 검증

- [ ] **Step 1: 스킬 디렉토리 구조 확인**

```bash
find ~/.claude/skills -name "SKILL.md" | sort
```

Expected:
```
/Users/admin/.claude/skills/auth-feature/SKILL.md
/Users/admin/.claude/skills/gallery-feature/SKILL.md
/Users/admin/.claude/skills/post-feature/SKILL.md
```

- [ ] **Step 2: 각 스킬 frontmatter 확인**

```bash
head -5 ~/.claude/skills/gallery-feature/SKILL.md
head -5 ~/.claude/skills/post-feature/SKILL.md
head -5 ~/.claude/skills/auth-feature/SKILL.md
```

Expected: 각 파일이 `---`, `name:`, `description:` 순서로 시작.

- [ ] **Step 3: 새 Claude Code 세션에서 스킬 인식 확인**

새 세션을 열고 다음 메시지로 트리거 테스트:
- "갤러리에 앨범 목록 페이지 추가해줘" → `gallery-feature` 스킬 자동 호출 확인
- "공지사항 게시판 만들어줘" → `post-feature` 스킬 자동 호출 확인

- [ ] **Step 4: 계획 문서 커밋**

```bash
cd /Users/admin/Desktop/PP/cergy2026
git add docs/superpowers/plans/2026-04-22-agent-team.md
git commit -m "docs: 에이전트 팀 구현 계획 추가"
```
