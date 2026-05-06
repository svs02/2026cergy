# Backend 개발 가이드

Node.js + Express + TypeScript + Mongoose 기반.
루트 CLAUDE.md의 모든 규칙을 기본으로 따른다.

## 패키지 매니저

- **pnpm 필수** (npm, yarn 사용 금지)
- 의존성 설치: `pnpm install`
- 개발 서버: `pnpm dev`
- 빌드: `pnpm build`

## 폴더 구조

```
src/
├── index.ts              # 서버 진입점 (bootstrap)
├── app.ts                # Express 앱 설정 (미들웨어, 라우터 등록)
├── routes/               # 라우터 — URL 매핑만 담당
├── controllers/          # 컨트롤러 — req/res 처리, 서비스 호출
├── services/             # 비즈니스 로직 — DB 직접 접근
├── models/               # Mongoose 스키마 & 모델
├── middleware/           # Express 미들웨어 (auth, errorHandler 등)
├── lib/                  # 유틸리티 (db.ts, passport.ts 등)
└── types/                # 공유 타입 정의
```

## 레이어 역할 분리

```
Router → Controller → Service → Model
```

- **Router**: 경로 등록, 미들웨어 연결만
- **Controller**: req 파싱, 응답 반환, try/catch — 비즈니스 로직 없음
- **Service**: 비즈니스 로직, DB 접근 — req/res 의존 없음
- **Model**: Mongoose 스키마 정의

## Express 컨트롤러 패턴

```typescript
// ✅ 컨트롤러: req/res 처리만
export async function getPosts(req: Request, res: Response) {
  const posts = await postService.findAll()
  res.json(posts)
}

// ✅ 서비스: 비즈니스 로직
export async function findAll() {
  return Post.find().sort({ createdAt: -1 })
}
```

## Mongoose 모델 규칙

- 인터페이스 정의 후 `Schema<IModel>` 타입 지정
- `{ timestamps: true }` 항상 사용 (createdAt, updatedAt 자동)
- 복합 인덱스는 스키마 외부에서 `.index()` 호출
- enum 필드는 `enum: Object.values(상수객체)` 사용

```typescript
const PostStatus = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' } as const
type PostStatus = (typeof PostStatus)[keyof typeof PostStatus]

interface IPost {
  title: string
  status: PostStatus
  author: Types.ObjectId
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    status: { type: String, required: true, enum: Object.values(PostStatus) },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)
```

## 에러 처리

전역 에러 핸들러를 통해 일관된 응답 반환.

```typescript
// middleware/errorHandler.ts
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: '입력값이 올바르지 않습니다', errors: err.errors })
    return
  }
  console.error(err)
  res.status(500).json({ message: '서버 오류가 발생했습니다' })
}
```

컨트롤러에서 `next(err)` 또는 `async` 래퍼로 전달.

---

## 배포 — Fly.io

### 아키텍처

```
인터넷 (cergymusic.com)
  └── Vercel (프론트엔드, 서울 icn1)
        └── api.cergymusic.com
              └── Fly.io (백엔드, 도쿄 nrt)
                    ├── Fly Volume (/app/uploads, 영구 디스크)
                    └── MongoDB Atlas (외부)
```

### Fly.io 구성

- 앱: `cergy-backend`
- 리전: `nrt` (도쿄) — 신규 계정은 `icn` 서울 리전 capacity 제한
- 머신: `shared-cpu-1x` 512MB (`min_machines_running = 0` → 트래픽 없을 때 정지)
- 영구 볼륨: `uploads_data` 3GB (`/app/uploads` 마운트)
- SSL: Let's Encrypt 자동 발급 (Fly가 처리)

### 배포 명령

⚠️ **반드시 모노레포 루트에서 실행** — Dockerfile이 `pnpm-workspace.yaml`을 참조하므로 빌드 컨텍스트는 루트여야 함.

```bash
# 수동 배포
cd /path/to/2026cergy
flyctl deploy --remote-only --config backend/fly.toml --dockerfile backend/Dockerfile

# 자동 배포 (CI)
# .github/workflows/fly-deploy.yml 가 main 푸시마다 위 명령 실행
```

### 환경변수 관리 (Fly Secrets)

운영 환경 환경변수는 **Fly Secrets**로 관리. `.env.local`은 로컬 전용.

```bash
# 등록
flyctl secrets set KEY=value -a cergy-backend

# 목록 확인 (값은 안 보임)
flyctl secrets list -a cergy-backend

# 삭제
flyctl secrets unset KEY -a cergy-backend
```

⚠️ `$`가 포함된 값(bcrypt 해시 등)은 **반드시 작은따옴표(`'...'`)** 로 감싸기.

운영 시 등록된 secrets:
- `CLIENT_URL` — 프론트엔드 origin (CORS용)
- `SESSION_SECRET` — 세션 쿠키 서명 키
- `MONGODB_URI` — Atlas 연결 문자열
- `ADMIN_PASSWORD_HASH` — bcrypt 해시 (관리자 로그인용)
- `RESEND_API_KEY`, `ADMIN_EMAIL` — 관리자 로그인 알림 이메일 (선택)

### 파일 업로드 — Fly Volume

`/app/uploads`에 마운트된 영구 볼륨 사용. 머신 재시작/재배포에도 데이터 유지됨.

- multer가 `/app/uploads`에 직접 저장
- Express `static` 미들웨어로 서빙
- 머신은 단일 인스턴스 운영 권장 (볼륨은 1머신 1볼륨)

### 운영 명령

```bash
flyctl status -a cergy-backend           # 머신 상태
flyctl logs -a cergy-backend             # 실시간 로그
flyctl ssh console -a cergy-backend      # 머신 내부 접속
flyctl machine list -a cergy-backend     # 머신 목록
flyctl volumes list -a cergy-backend     # 볼륨 목록
flyctl releases -a cergy-backend         # 배포 이력
```

### 배포 체크리스트

- [ ] `fly.toml`의 `primary_region = "nrt"` 확인
- [ ] 모든 secrets 등록 (`flyctl secrets list`)
- [ ] MongoDB Atlas Network Access에 `0.0.0.0/0` 허용 (Fly outbound IP 동적)
- [ ] 볼륨이 머신과 같은 리전에 있는지 확인
- [ ] CI 워크플로우의 `FLY_API_TOKEN` 시크릿 등록
