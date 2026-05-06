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

## AWS 배포 구성

### 아키텍처

```
인터넷
  └── Route 53 (도메인)
        └── ACM (SSL/TLS)
              └── EC2 (nginx → PM2 → Express)
                    ├── S3 (미디어 파일 업로드)
                    └── MongoDB Atlas (DB, AWS VPC Peering 권장)
```

### EC2 설정

- OS: Ubuntu 22.04 LTS
- 인스턴스: t3.small 이상 권장
- 포트: 80(nginx), 443(nginx), 22(SSH — IP 제한 필수)
- 보안 그룹: 외부에 Express 포트(4000) 직접 노출 금지

### nginx 설정 (리버스 프록시)

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### PM2 프로세스 관리

```bash
# 빌드 후 실행
pnpm build
pm2 start dist/index.js --name cergy-backend

# 재시작 정책
pm2 startup   # 서버 재부팅 시 자동 시작
pm2 save
```

### S3 미디어 파일

- 버킷 이름: `cergy2026-media`
- 퍼블릭 읽기 차단 — presigned URL로만 접근
- 업로드: 서버에서 `@aws-sdk/client-s3` 사용
- 폴더 구조: `gallery/{year}/{month}/`, `profile/`

```typescript
// presigned URL 생성 패턴
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
```

### 환경변수 관리 (AWS SSM Parameter Store)

운영 환경에서는 `.env.local` 대신 **AWS SSM Parameter Store** 사용.

```bash
# 값 등록
aws ssm put-parameter --name "/cergy2026/prod/MONGODB_URI" \
  --value "mongodb+srv://..." --type SecureString

# EC2에서 불러오기 (IAM Role 권한 필요)
aws ssm get-parameter --name "/cergy2026/prod/MONGODB_URI" \
  --with-decryption --query Parameter.Value --output text
```

EC2 IAM Role에 `ssm:GetParameter` 권한 부여 필수.
로컬 개발은 기존대로 `.env.local` 사용.

### 배포 체크리스트

- [ ] EC2 보안 그룹에서 4000 포트 외부 차단 확인
- [ ] nginx SSL 인증서 적용 (Let's Encrypt 또는 ACM)
- [ ] PM2 startup 설정
- [ ] MongoDB Atlas IP 화이트리스트에 EC2 IP 등록
- [ ] S3 버킷 퍼블릭 접근 차단 확인
- [ ] SSM Parameter Store에 모든 운영 환경변수 등록
- [ ] IAM Role에 최소 권한 원칙 적용
