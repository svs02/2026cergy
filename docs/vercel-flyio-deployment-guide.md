# Vercel + Fly.io 배포 가이드

> Next.js 프론트엔드는 **Vercel**, Express 백엔드는 **Fly.io**에 배포합니다.
> Vercel은 서울(`icn1`), Fly.io는 도쿄(`nrt`) 리전 사용 — 한국에서 RTT ~30ms로 충분히 빠름.
> (Fly.io 신규 계정은 Seoul `icn` 리전이 capacity 제한으로 막혀 있어 도쿄 사용)
> Kubernetes 없이 30분~1시간 내 배포 완료.

---

## 파트 0: 사전 준비

### 0.1 계정 생성

| 서비스 | 가입 URL | 결제수단 |
|---|---|---|
| **Vercel** | https://vercel.com/signup | 불필요 (Hobby 무료) |
| **Fly.io** | https://fly.io/app/sign-up | 카드 등록 필요 (무료 플랜이지만 검증용) |
| **Cloudflare** *(선택)* | https://cloudflare.com/sign-up | DNS 관리용 (GoDaddy 그대로 써도 됨) |

GitHub 계정도 필요합니다 (Vercel이 GitHub repo를 자동 감지).

### 0.2 CLI 도구 설치

```bash
# Fly.io CLI
brew install flyctl

# Vercel CLI (선택 — 웹 UI로도 충분)
npm i -g vercel

# 설치 확인
flyctl version
```

### 0.3 준비물 체크리스트

- [ ] GitHub repo에 코드 push되어 있음
- [ ] MongoDB Atlas 클러스터 동작 중 (URI 보유)
- [ ] 도메인 `cergymusic.com` 보유 (GoDaddy)
- [ ] Naver/Google OAuth 클라이언트 정보 보유
- [ ] `backend/.env.local` / `frontend/.env.local`에 모든 환경변수 있음

---

## 파트 1: 백엔드 배포 (Fly.io)

### 1.1 Fly.io 로그인

```bash
flyctl auth login
```

브라우저가 열리면 로그인.

### 1.2 앱 생성 (`fly.toml` 자동 생성)

```bash
cd backend
flyctl launch --no-deploy --region nrt
```

> **리전 선택 주의**: 신규 Fly.io 계정은 Seoul(`icn`) 리전을 못 쓰는 경우가 많습니다.
> 사용 가능한 리전은 `flyctl platform regions`로 확인. 한국 사용자에겐 `nrt`(도쿄)가 차선책이며 RTT 차이가 거의 없습니다.

대화형 프롬프트에 답변:

| 질문 | 답변 |
|---|---|
| App name | `cergy-backend` |
| Postgres database? | **No** (MongoDB Atlas 사용 중) |
| Redis? | **No** |
| Deploy now? | **No** |

`backend/fly.toml` 파일이 생성됩니다.

### 1.3 `fly.toml` 수정

생성된 `fly.toml`을 다음과 같이 수정:

```toml
app = "cergy-backend"
primary_region = "nrt"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0   # 트래픽 없을 때 완전 정지 (비용 최소화, cold start 1~3초)

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

[mounts]
  source = "uploads_data"
  destination = "/app/uploads"
```

### 1.4 영구 디스크(Volume) 생성

업로드 파일을 영구 저장하기 위한 볼륨:

```bash
flyctl volumes create uploads_data --size 3 --region nrt --yes
```

> 무료 플랜: 3GB까지 무료. 65MB 정도면 충분.

### 1.5 환경변수(Secrets) 등록

```bash
flyctl secrets set \
  CLIENT_URL="https://cergymusic.com" \
  SESSION_SECRET="<강력한_랜덤_문자열>" \
  MONGODB_URI="<MongoDB_Atlas_URI>" \
  ADMIN_PASSWORD_HASH="<bcrypt_해시>" \
  RESEND_API_KEY="<선택>" \
  ADMIN_EMAIL="<선택>"
```

> 값에 특수문자가 있으면 작은따옴표(`'...'`)로 감싸세요.

확인:
```bash
flyctl secrets list
```

### 1.6 첫 배포

⚠️ **모노레포 루트에서 실행**해야 합니다. Dockerfile이 `pnpm-workspace.yaml`과 `backend/` 둘 다 참조하므로 빌드 컨텍스트는 루트여야 합니다.

```bash
cd /Users/luke/Desktop/PP/2026cergy   # 루트로 이동
flyctl deploy --remote-only --config backend/fly.toml --dockerfile backend/Dockerfile
```

> `--remote-only`: 로컬 Docker 없이 Fly의 빌더 사용. M1/M2 Mac에서 권장.
> `backend/`에서 실행하면 `"/backend": not found` 에러가 납니다.

성공하면 `https://cergy-backend.fly.dev` 같은 URL이 출력됩니다.

### 1.7 동작 확인

```bash
# 헬스 체크 (라우트가 있으면)
curl https://cergy-backend.fly.dev/api/health

# 로그 보기
flyctl logs

# 머신 상태
flyctl status
```

### 1.8 기존 업로드 파일 마이그레이션 (선택)

`backend/uploads/`에 기존 파일이 있다면 볼륨으로 복사:

```bash
# 1. 머신에 SSH
flyctl ssh console

# 2. 다른 터미널에서 SFTP로 업로드
flyctl ssh sftp shell

# (sftp 프롬프트에서)
> put -r ./backend/uploads/* /app/uploads/
> bye
```

또는 더 간단하게, S3/R2로 옮길 거면 이 단계는 건너뛰고 나중에 처리.

---

## 파트 2: 프론트엔드 배포 (Vercel)

### 2.1 Vercel에 GitHub repo 연결

1. https://vercel.com/new 접속
2. GitHub 계정 연결 → 저장소 권한 부여
3. `2026cergy` 저장소 선택 → **Import**
4. **Configure Project** 화면:
   - Framework Preset: **Next.js** (자동 감지)
   - **Root Directory**: `frontend` ← 반드시 설정
   - Build Command: 기본값 유지
   - Install Command: `pnpm install` (자동 감지)

### 2.2 환경변수 등록

**Configure Project** 화면 하단 **Environment Variables** 섹션에서 추가:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.cergymusic.com` |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | `<네이버_지도_클라이언트_ID>` |

> 백엔드 도메인은 다음 단계에서 연결할 `api.cergymusic.com` 사용.
> 임시로 `https://cergy-backend.fly.dev` 써도 되지만 OAuth 쿠키 도메인 문제 생길 수 있음.

### 2.3 함수 리전을 서울로 설정

Vercel은 정적 자산은 글로벌 Edge에서 서빙하지만 SSR/API Route 함수는 기본적으로 미국 리전입니다. 서울로 변경:

`frontend/next.config.ts`에 추가 (이미 있으면 수정):

```ts
const nextConfig: NextConfig = {
  // ...기존 설정
}

// vercel.json도 추가하면 더 명확
```

또는 `frontend/vercel.json` 파일 생성:

```json
{
  "regions": ["icn1"]
}
```

### 2.4 배포

**Deploy** 버튼 클릭 → 2~5분 후 `https://2026cergy-xxx.vercel.app` 같은 URL 생성됨.

이후 `git push origin main`마다 자동 배포됩니다.

---

## 파트 3: 커스텀 도메인 연결

### 3.1 Vercel에 `cergymusic.com` 추가

1. Vercel 프로젝트 → **Settings → Domains**
2. `cergymusic.com` 입력 → **Add**
3. Vercel이 알려주는 DNS 설정 메모:
   - `cergymusic.com` → A 레코드 → `76.76.21.21`
   - `www.cergymusic.com` → CNAME → `cname.vercel-dns.com`

### 3.2 Fly.io에 `api.cergymusic.com` 추가

```bash
cd backend
flyctl certs add api.cergymusic.com
```

출력에서 DNS 설정 메모. Fly는 보통 A/AAAA 레코드(전용 IP)를 권장합니다:
- A 레코드: `api.cergymusic.com` → `<출력된_IPv4>`
- AAAA 레코드: `api.cergymusic.com` → `<출력된_IPv6>`

### 3.3 GoDaddy DNS 설정

GoDaddy 콘솔 → 도메인 관리 → DNS:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 600 |
| CNAME | `www` | `cname.vercel-dns.com` | 600 |
| A | `api` | `<flyctl certs add 출력의 IPv4>` | 600 |
| AAAA | `api` | `<flyctl certs add 출력의 IPv6>` | 600 |

> `api` 서브도메인은 위의 A/AAAA 대신 **CNAME `api` → `cergy-backend.fly.dev`** 한 줄로도 동작합니다.
> 차이는 DNS 조회 1번뿐 (체감 무차이). 둘 중 한 방식만 사용 — A/CNAME 공존 불가.
> 기존 A 레코드(OCI/EC2 IP)는 모두 삭제.

### 3.4 SSL 자동 발급 확인

DNS 전파(5분~1시간) 후:

```bash
# 백엔드 인증서
flyctl certs check api.cergymusic.com

# 프론트엔드는 Vercel 콘솔에서 자동 처리
```

브라우저에서 `https://cergymusic.com`, `https://api.cergymusic.com` 둘 다 접속 확인.

---

## 파트 4: OAuth Callback URL 갱신

### 4.1 Naver

https://developers.naver.com/apps → 해당 앱 → API 설정:
- 서비스 URL: `https://cergymusic.com`
- Callback URL: `https://api.cergymusic.com/api/auth/naver/callback`

### 4.2 Google

https://console.cloud.google.com/apis/credentials → OAuth 2.0 클라이언트 ID:
- 승인된 자바스크립트 출처: `https://cergymusic.com`
- 승인된 리디렉션 URI: `https://api.cergymusic.com/api/auth/google/callback`

> 정확한 callback 경로는 백엔드 라우터 코드 확인 필수.

---

## 파트 5: 배포 후 검증

### 5.1 헬스 체크

```bash
# 백엔드
curl https://api.cergymusic.com/api/instructors

# 프론트엔드
curl -I https://cergymusic.com
```

### 5.2 로그인 테스트

브라우저에서:
1. `https://cergymusic.com` 접속
2. 네이버/구글 로그인 시도 → callback 정상 동작?
3. 개발자도구 Network 탭에서 API 요청이 `api.cergymusic.com`으로 가는지 확인

### 5.3 파일 업로드 테스트

관리자 로그인 → 강사 프로필 사진 업로드 → 페이지 새로고침 후에도 사진 보이는지 확인 (Volume 동작 확인).

---

## 파트 6: CI/CD

### 6.1 Vercel — 자동 (설정 불필요)

GitHub과 연결만 되어 있으면:
- `main` push → 자동 production 배포
- 다른 브랜치 push → preview URL 자동 생성

### 6.2 Fly.io — GitHub Actions로 자동 배포

`.github/workflows/fly-deploy.yml` 생성:

```yaml
name: Deploy Backend to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'pnpm-lock.yaml'
      - 'pnpm-workspace.yaml'
      - 'package.json'
      - '.github/workflows/fly-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: fly-deploy
      cancel-in-progress: true
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --config backend/fly.toml --dockerfile backend/Dockerfile
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

> ⚠️ `working-directory` 설정하지 말 것 — Dockerfile이 모노레포 루트(`pnpm-workspace.yaml` 위치)를 빌드 컨텍스트로 사용하므로 루트에서 실행해야 함.

토큰 발급 & GitHub Secret 등록:

```bash
# 토큰 생성
flyctl tokens create deploy

# 출력된 토큰을 GitHub repo Settings → Secrets and variables → Actions에 추가
# Name: FLY_API_TOKEN
# Value: <위에서 출력된 토큰>
```

이제 `backend/` 변경 후 push만으로 자동 배포됩니다.

---

## 파트 7: OCI/K8s 잔재 정리

작동 확인 후 다음 파일/리소스 정리:

### 7.1 코드 정리

- [ ] `k8s/` 디렉토리 삭제
- [ ] `.github/workflows/deploy.yml` (OKE 배포) 삭제
- [ ] `nginx/` 디렉토리 삭제 (Fly가 처리)
- [ ] `docker-compose.yml` 검토 (로컬 개발용이면 유지)
- [ ] `ecosystem.config.cjs` 삭제 (PM2 설정, 불필요)
- [ ] `scripts/cleanup-nodepools.sh` 삭제
- [ ] `scripts/retry-arm-nodepool.sh` 삭제
- [ ] `docs/oci-deployment-guide.md` 삭제 (또는 보관)

### 7.2 OCI 리소스 삭제

OCI 콘솔에서:
1. **OKE 클러스터** 삭제
2. **VCN** 삭제 (Terminate all resources 옵션 체크)
3. **Container Registry**의 이미지 삭제 (선택, 무료니까 둬도 됨)
4. **Block Volumes** 모두 삭제

### 7.3 GitHub Secrets 정리

다음 secrets 삭제 (더 이상 불필요):
- `OCI_CLI_*`
- `KUBECONFIG`
- `CLUSTER_ID`
- `OCIR_*`

### 7.4 CLAUDE.md 갱신

루트 `CLAUDE.md` 및 `backend/CLAUDE.md`의 AWS/OCI 배포 섹션을 Vercel + Fly.io로 교체.

---

## 트러블슈팅

### Fly.io 배포 실패

```bash
# 빌드 로그 자세히
flyctl deploy --remote-only --verbose

# 머신 로그 실시간
flyctl logs

# SSH로 접속해서 직접 확인
flyctl ssh console
```

### Vercel 빌드 실패

- Root Directory가 `frontend`로 설정됐는지 확인
- 환경변수 누락 — Vercel 콘솔 → Settings → Environment Variables 재확인
- `pnpm-lock.yaml`이 frontend가 아닌 루트에 있어서 워크스페이스 인식 안 되는 경우 → "Build Command"를 `cd .. && pnpm install && cd frontend && pnpm build`로 변경

### CORS 에러

백엔드 `app.ts`의 cors 설정 확인:
```ts
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
```

`CLIENT_URL=https://cergymusic.com`로 secrets에 등록됐는지 확인.

### 세션 쿠키가 도메인 사이에 안 넘어감

Vercel(`cergymusic.com`) ↔ Fly.io(`api.cergymusic.com`)는 다른 도메인이므로 쿠키 설정 필요:

```ts
app.use(session({
  cookie: {
    secure: true,
    sameSite: 'none',
    domain: '.cergymusic.com', // 서브도메인 공유
  },
}))
```

---

## 비용

> ⚠️ Fly.io는 2024년 10월부터 신규 계정에 무료 티어가 없어졌습니다 (Free Trial만 제공: VM 2시간 또는 7일).
> 카드 등록 후 사용량 기준 과금. 학원 사이트 수준의 저트래픽이면 월 $1~3 수준.

| 항목 | 비용 | 비고 |
|---|---|---|
| Vercel Hobby | 무료 | 100GB 대역폭/월, Edge 무제한, Pro 전환 시 $20/월 |
| Fly.io 머신 (shared-cpu-1x, 512MB) | 시간당 ~$0.0044 | `min_machines_running = 0`이면 트래픽 없을 때 정지 → 거의 $0 |
| Fly.io 볼륨 (3GB) | 월 $0.45 | $0.15/GB/월, 항상 과금 |
| Fly.io 송신 트래픽 | 일정량 무료 | 초과 시 GB당 과금 (저트래픽이면 사실상 $0) |
| MongoDB Atlas Free (M0) | 무료 | 512MB |
| GoDaddy 도메인 | 연 ~$20 | — |

**예상 월 비용**: **$1~3** (저트래픽 + `min_machines_running = 0` 기준, 볼륨 $0.45 + 머신 cold start 시간만 과금)

### 비용 더 줄이기

- `min_machines_running = 0`: 무조건 켜둘 필요 없으면 0으로. 첫 요청에 1~3초 cold start.
- 볼륨 안 쓰면 삭제 (S3/R2로 이전): 볼륨 비용 $0.45/월 절약
- `flyctl scale count 0`로 임시 정지 가능 (개발 중일 때)
