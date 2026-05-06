# OCI 웹 애플리케이션 배포 가이드 (주니어 개발자용)

> Next.js + Express + MongoDB 기반 웹 애플리케이션을 OCI(Oracle Cloud Infrastructure)에 배포하는 **실습 가이드**입니다.
> 명령어를 한 줄씩 따라하면 배포를 완성할 수 있습니다.

---

## 파트 0: 시작하기 전에

### 이 가이드가 하는 일

우리 프로젝트(바이올린 학원 웹사이트)를 **인터넷에 공개**하는 과정입니다. 지금은 `pnpm dev`로 내 컴퓨터에서만 볼 수 있지만, 이 가이드를 끝까지 따라하면 `https://app.yourdomain.com` 같은 주소로 누구나 접속할 수 있게 됩니다.

### 전체 아키텍처 — 건물 비유

```
🏢 건물 전체 = OCI (Oracle Cloud)
   우리 앱이 살아갈 클라우드 공간

📁 건물 관리 폴더 = Compartment
   우리 프로젝트의 모든 리소스를 묶어두는 폴더

🏗️ 건물 구조 = VCN (Virtual Cloud Network)
   건물의 내부 네트워크. 누가 들어오고 나갈 수 있는지 정합니다.

   1층 로비 (Public Subnet)
   └── 로드밸런서 — 외부 손님(사용자)이 처음 만나는 곳

   2층 사무실 (Private Subnet)
   └── OKE 클러스터 — 앱이 실제로 돌아가는 서버실
       ├── Frontend 컨테이너 (Next.js)
       └── Backend 컨테이너 (Express)

🗄️ 외부 데이터센터 = MongoDB Atlas
   데이터베이스는 MongoDB Atlas(클라우드 DB 서비스)를 사용합니다.
   OCI 안에 직접 설치하지 않고, 전문 서비스에 맡기는 겁니다.

📦 택배 보관함 = OCIR (Container Registry)
   Docker 이미지를 저장하는 곳. "이 버전의 앱"을 보관합니다.

🔒 금고 = OCI Vault
   비밀번호, API 키 같은 민감한 정보를 안전하게 보관합니다.
```

### 전체 흐름 요약

```
[내 컴퓨터]
    │
    │  1. 코드 작성 → GitHub에 push
    │
    ▼
[GitHub Actions] (자동)
    │
    │  2. 테스트 실행
    │  3. Docker 이미지 빌드
    │  4. OCIR에 이미지 업로드
    │  5. OKE에 배포 명령
    │
    ▼
[OCI - OKE 클러스터]
    │
    │  6. 새 컨테이너 시작
    │  7. 헬스체크 통과하면 트래픽 전환
    │
    ▼
[사용자] → https://app.yourdomain.com 접속 가능!
```

### 시작하기 전 체크리스트

| 필요한 것 | 어디서 만드나요? | 비용 |
|-----------|-----------------|------|
| OCI 계정 | cloud.oracle.com | 무료 (Always Free Tier) |
| GitHub 계정 | github.com | 무료 |
| MongoDB Atlas 계정 | mongodb.com/atlas | 무료 (M0 클러스터) |
| 도메인 (선택) | 가비아, Namecheap 등 | 연 1~2만원 |
| Docker Desktop | docker.com | 무료 (개인) |
| Git | git-scm.com | 무료 |

### 예상 비용

- **개발/테스트 (목표)**: OCI Always Free(ARM 4 OCPU/24GB) + MongoDB Atlas M0 = **완전 무료**
- **개발/테스트 (ARM capacity 대기 중)**: AMD E4 1 OCPU/6GB × 1노드 + Atlas M0 = **월 ~3만원**
- **운영(소규모)**: OKE Worker Node 1~2개 + MongoDB Atlas M10 = **월 약 5~10만원**

> ⚠️ **현실 체크**: 한국 리전(춘천/서울)에서 ARM 무료 티어 capacity가 부족한 경우가 많습니다.
> AMD로 운영하면서 ARM 재시도 스크립트를 백그라운드로 돌리는 전략이 일반적입니다.
> 자세한 내용은 [스텝 6.2](#스텝-62-worker-node-pool-만들기) 참고.

---

## 파트 1: OCI 계정 설정 & 도구 설치

### 스텝 1.1: OCI 무료 계정 만들기

> **한 줄 요약**: Oracle Cloud에 가입합니다.
> **쉽게 말하면**: AWS, GCP 같은 클라우드 서비스에 회원가입하는 것입니다.

**왜 필요한가요?**
우리 앱을 올릴 서버(클라우드)가 필요합니다. OCI는 Always Free Tier가 넉넉해서 학습용으로 좋습니다.

**하는 방법:**

1. https://cloud.oracle.com 접속
2. "Sign Up for Free" 클릭
3. 정보 입력 (신용카드 필요하지만 Free Tier 범위 내에서는 과금되지 않음)
4. Home Region 선택: **South Korea Central (Seoul)** — `ap-seoul-1`
5. 가입 완료 후 이메일 인증

**잘 됐는지 확인하기:**

OCI 콘솔(https://cloud.oracle.com)에 로그인이 되면 성공입니다.

**문제가 생겼다면:**
- "Account creation failed" → 다른 이메일로 재시도하거나, 신용카드 정보를 확인하세요
- Home Region을 잘못 선택했다면 → 새 계정을 만들어야 합니다 (변경 불가)

---

### 스텝 1.2: OCI CLI 설치

> **한 줄 요약**: 터미널에서 OCI를 조작할 수 있는 도구를 설치합니다.
> **쉽게 말하면**: OCI 웹 콘솔에서 클릭하는 것을 터미널 명령어로 할 수 있게 해주는 프로그램입니다.

**왜 필요한가요?**
서버 만들기, 네트워크 설정 등을 명령어로 빠르게 할 수 있습니다. 자동화(CI/CD)에도 필수입니다.

**하는 방법:**

**Mac (Homebrew):**
```bash
# Homebrew로 OCI CLI를 설치합니다
brew install oci-cli
```

**Linux / Mac (Homebrew 없을 때):**
```bash
# OCI 공식 설치 스크립트를 다운받아 실행합니다
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

설치 중 질문이 나오면 전부 Enter(기본값)를 누르면 됩니다.

**잘 됐는지 확인하기:**

```bash
# 설치된 버전을 확인합니다
oci --version
```
→ 이런 결과가 나오면 성공:
```
3.x.x
```

**문제가 생겼다면:**
- "command not found: oci" → 터미널을 껐다 켜거나, `source ~/.bashrc` (또는 `source ~/.zshrc`) 실행
- Mac에서 Homebrew가 없다면 → `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` 로 먼저 설치

---

### 스텝 1.3: OCI CLI 설정 (API 키 등록)

> **한 줄 요약**: OCI CLI가 내 계정으로 명령을 실행할 수 있도록 연결합니다.
> **쉽게 말하면**: "이 터미널은 내 OCI 계정이야"라고 인증하는 과정입니다.

**왜 필요한가요?**
CLI가 내 계정의 리소스에 접근하려면 인증 정보(API 키)가 필요합니다.

**하는 방법:**

1. 설정 마법사를 실행합니다:
```bash
# 대화형 설정을 시작합니다 — 질문에 답하면 자동으로 설정 파일이 만들어집니다
oci setup config
```

2. 질문에 이렇게 답합니다:

| 질문 | 답변 | 어디서 찾나요? |
|------|------|--------------|
| Config file location | Enter (기본값) | — |
| User OCID | `ocid1.user.oc1..aaa...` | OCI 콘솔 → 오른쪽 위 사람 아이콘 → My Profile → OCID 복사 |
| Tenancy OCID | `ocid1.tenancy.oc1..aaa...` | OCI 콘솔 → 왼쪽 하단 ⚙️ → Tenancy Details → OCID 복사 |
| Region | `ap-seoul-1` | Seoul 리전 |
| Generate API key? | `Y` | 자동으로 키 파일을 만들어줍니다 |

3. 생성된 공개키를 OCI에 등록합니다:

```bash
# 생성된 공개키 내용을 출력합니다 — 이걸 복사해야 합니다
cat ~/.oci/oci_api_key_public.pem
```

4. OCI 콘솔에서 등록:
   - 오른쪽 위 사람 아이콘 → **My Profile**
   - 왼쪽 메뉴 **API Keys** → **Add API Key**
   - **Paste Public Key** 선택 → 위에서 복사한 내용 붙여넣기 → **Add**

**잘 됐는지 확인하기:**

```bash
# 내 계정의 네임스페이스(= 테넌시 고유 이름)를 조회합니다
oci os ns get
```
→ 이런 결과가 나오면 성공:
```json
{
  "data": "axle3example"
}
```

**문제가 생겼다면:**
- "401 NotAuthenticated" → API Key가 잘 등록되었는지 OCI 콘솔에서 확인. Fingerprint가 `~/.oci/config` 파일과 일치하는지 확인
- "Could not find config file" → `oci setup config`를 다시 실행

---

### 스텝 1.4: kubectl 설치

> **한 줄 요약**: 쿠버네티스 클러스터를 조작하는 도구를 설치합니다.
> **쉽게 말하면**: OKE(쿠버네티스)에게 "앱 배포해", "상태 보여줘" 같은 명령을 내리는 리모컨입니다.

**왜 필요한가요?**
나중에 OKE 클러스터에 앱을 배포하고 관리할 때 필수입니다.

**하는 방법:**

**Mac:**
```bash
# Homebrew로 kubectl을 설치합니다
brew install kubectl
```

**Linux:**
```bash
# kubectl 바이너리를 다운받아 설치합니다
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

**잘 됐는지 확인하기:**

```bash
# kubectl 버전을 확인합니다
kubectl version --client
```
→ 이런 결과가 나오면 성공:
```
Client Version: v1.29.x
```

---

### 스텝 1.5: Docker Desktop 설치 확인

> **한 줄 요약**: Docker가 설치되어 있는지 확인합니다.

**하는 방법:**

```bash
# Docker 버전을 확인합니다
docker --version
```
→ 이런 결과가 나오면 OK:
```
Docker version 24.x.x
```

설치가 안 되어 있다면:
- **Mac**: https://www.docker.com/products/docker-desktop/ 에서 다운로드 → 설치 → 실행
- **Linux**: `sudo apt-get install docker.io` (Ubuntu) 또는 공식 문서 참고

---

## 파트 2: 네트워크 만들기 (VCN, Subnet)

> **이 파트에서 하는 일**: 우리 앱이 살아갈 "가상 건물"의 구조를 만듭니다.
> 건물(VCN) 안에 1층 로비(Public Subnet), 2층 사무실(Private Subnet)을 만들고,
> 출입문(Gateway)과 출입 규칙(Security List)을 설정합니다.

### 스텝 2.1: Compartment 만들기

> **한 줄 요약**: 우리 프로젝트 전용 폴더를 만듭니다.
> **쉽게 말하면**: 컴퓨터에서 프로젝트별로 폴더를 만드는 것처럼, OCI에서도 리소스를 폴더로 정리합니다.

**왜 필요한가요?**
모든 리소스(네트워크, 서버, DB 등)를 하나의 Compartment에 넣으면 관리가 쉽고, 나중에 한꺼번에 삭제도 가능합니다.

**하는 방법:**

```bash
# 프로젝트용 Compartment(폴더)를 만듭니다
# --compartment-id: 최상위 테넌시 OCID를 넣습니다
oci iam compartment create \
  --name "cergy2026" \
  --description "바이올린 학원 웹사이트 리소스" \
  --compartment-id $TENANCY_OCID
```

> **$TENANCY_OCID는 뭔가요?**
> 스텝 1.3에서 입력했던 Tenancy OCID입니다. `cat ~/.oci/config`로 확인할 수 있습니다.
> 앞으로 나오는 `$변수명`은 이전 스텝에서 얻은 값을 의미합니다.

**결과에서 OCID를 복사해두세요** — 앞으로 `$COMPARTMENT_ID`로 사용합니다:
```bash
# 결과에서 "id" 값이 Compartment OCID입니다
# 예: "id": "ocid1.compartment.oc1..aaaaaaaaxxx..."
```

**잘 됐는지 확인하기:**

```bash
# 만들어진 Compartment 목록을 조회합니다
oci iam compartment list --compartment-id $TENANCY_OCID --query "data[?name=='cergy2026'].{name:name, id:id}"
```

**또는 OCI 콘솔에서 확인:**
- 왼쪽 메뉴 → **Identity & Security** → **Compartments** → "cergy2026"이 보이면 성공

---

### 스텝 2.2: VCN 만들기

> **한 줄 요약**: 가상 네트워크(건물)를 만듭니다.
> **쉽게 말하면**: 우리 앱 전용 사설 네트워크입니다. 이 안에서 서버들이 서로 통신합니다.

**왜 필요한가요?**
클라우드에서 서버를 만들려면 먼저 네트워크가 있어야 합니다. 집을 짓기 전에 땅을 마련하는 것과 같습니다.

**하는 방법:**

```bash
# VCN(가상 네트워크)을 만듭니다
# CIDR 10.0.0.0/16은 "이 건물에서 사용할 IP 범위"입니다 (65,000개 이상의 IP)
oci network vcn create \
  --compartment-id $COMPARTMENT_ID \
  --cidr-blocks '["10.0.0.0/16"]' \
  --display-name "cergy-vcn"
```

**결과에서 VCN OCID를 복사해두세요** → `$VCN_ID`

**잘 됐는지 확인하기:**

OCI 콘솔 → **Networking** → **Virtual Cloud Networks** → "cergy-vcn"이 보이면 성공

---

### 스텝 2.3: Public Subnet 만들기

> **한 줄 요약**: 외부에서 접근 가능한 네트워크 영역을 만듭니다.
> **쉽게 말하면**: 건물 1층 로비입니다. 외부 손님(사용자)이 들어오는 곳이고, 여기에 로드밸런서를 놓습니다.

**하는 방법:**

```bash
# Public Subnet을 만듭니다 — 외부 인터넷에서 접근 가능한 영역
# prohibit-public-ip-on-vnic을 false로 해야 공인 IP를 받을 수 있습니다
oci network subnet create \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --cidr-block "10.0.1.0/24" \
  --display-name "public-subnet" \
  --prohibit-public-ip-on-vnic false
```

**결과에서 Subnet OCID를 복사해두세요** → `$PUBLIC_SUBNET_ID`

---

### 스텝 2.4: Private Subnet 만들기 (앱 서버용)

> **한 줄 요약**: 외부에서 직접 접근할 수 없는 보안 영역을 만듭니다.
> **쉽게 말하면**: 건물 2층 사무실입니다. 1층 로비(로드밸런서)를 통해서만 접근 가능합니다.

**왜 필요한가요?**
앱 서버를 외부에 직접 노출하면 보안 위험이 큽니다. 로드밸런서만 앞에 세우고, 실제 서버는 뒤에 숨깁니다.

**하는 방법:**

```bash
# Private Subnet을 만듭니다 — 외부에서 직접 접근 불가, 내부 통신만 가능
oci network subnet create \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --cidr-block "10.0.2.0/24" \
  --display-name "app-subnet" \
  --prohibit-public-ip-on-vnic true
```

**결과에서 Subnet OCID를 복사해두세요** → `$APP_SUBNET_ID`

---

### 스텝 2.5: Internet Gateway + NAT Gateway 만들기

> **한 줄 요약**: 건물의 출입구를 만듭니다.
> **쉽게 말하면**:
> - **Internet Gateway** = 정문. 외부에서 들어오고, 외부로 나갈 수 있는 문 (Public Subnet용)
> - **NAT Gateway** = 직원 전용 후문. 안에서 밖으로만 나갈 수 있는 문 (Private Subnet용)

**왜 필요한가요?**
- Public Subnet의 로드밸런서는 인터넷과 통신해야 하니까 → Internet Gateway
- Private Subnet의 앱 서버도 외부 API(MongoDB Atlas 등)를 호출해야 하니까 → NAT Gateway (나가는 것만 가능)

**하는 방법:**

```bash
# Internet Gateway를 만듭니다 — Public Subnet의 인터넷 연결 통로
oci network internet-gateway create \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --is-enabled true \
  --display-name "cergy-igw"
```

**결과에서 OCID 복사** → `$IGW_ID`

```bash
# NAT Gateway를 만듭니다 — Private Subnet에서 외부로 나가는 통로
oci network nat-gateway create \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --display-name "cergy-natgw"
```

**결과에서 OCID 복사** → `$NATGW_ID`

---

### 스텝 2.6: Route Table 설정

> **한 줄 요약**: "이 Subnet에서 나가는 트래픽은 어느 문(Gateway)으로 보낼지" 규칙을 정합니다.
> **쉽게 말하면**: 건물 안에서 "택배는 후문으로, 손님은 정문으로" 같은 안내판을 세우는 것입니다.

**왜 필요한가요?**
Subnet을 만들었지만, 트래픽이 어디로 가야 하는지 아직 모릅니다. Route Table로 길을 알려줘야 합니다.

**하는 방법:**

VCN을 만들면 기본 Route Table이 자동 생성됩니다. 이것을 수정합니다.

```bash
# Public Subnet용 Route Table — 모든 외부 트래픽을 Internet Gateway로 보냅니다
# 먼저 기본 Route Table ID를 확인합니다
oci network route-table list \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --query "data[0].id" --raw-output
```

**결과에서 OCID 복사** → `$PUBLIC_RT_ID`

```bash
# Route Table에 규칙을 추가합니다: "0.0.0.0/0(모든 외부) → Internet Gateway로"
oci network route-table update \
  --rt-id $PUBLIC_RT_ID \
  --route-rules '[{
    "destination": "0.0.0.0/0",
    "destinationType": "CIDR_BLOCK",
    "networkEntityId": "'$IGW_ID'"
  }]' \
  --force
```

```bash
# Private Subnet용 Route Table을 새로 만듭니다
oci network route-table create \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --display-name "private-rt" \
  --route-rules '[{
    "destination": "0.0.0.0/0",
    "destinationType": "CIDR_BLOCK",
    "networkEntityId": "'$NATGW_ID'"
  }]'
```

**결과에서 OCID 복사** → `$PRIVATE_RT_ID`

그다음, Private Subnet에 이 Route Table을 연결합니다:

```bash
# Private Subnet의 Route Table을 방금 만든 것으로 변경합니다
oci network subnet update \
  --subnet-id $APP_SUBNET_ID \
  --route-table-id $PRIVATE_RT_ID \
  --force
```

### 스텝 2.7: Security List 설정

> **한 줄 요약**: 어떤 포트로 들어오고 나갈 수 있는지 규칙을 정합니다.
> **쉽게 말하면**: 건물 경비원에게 "443번 출입증 가진 사람만 통과시켜"라고 지시하는 것입니다.

**왜 필요한가요?**
기본적으로 모든 포트가 차단되어 있습니다. 웹 서비스에 필요한 포트만 열어야 합니다.

**하는 방법:**

```bash
# Public Subnet의 Security List ID를 확인합니다
oci network security-list list \
  --compartment-id $COMPARTMENT_ID \
  --vcn-id $VCN_ID \
  --query "data[0].id" --raw-output
```

**결과에서 OCID 복사** → `$SECLIST_ID`

```bash
# 인바운드 규칙: HTTPS(443)와 HTTP(80)을 허용합니다
oci network security-list update \
  --security-list-id $SECLIST_ID \
  --ingress-security-rules '[
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 443, "max": 443}},
      "description": "HTTPS 허용"
    },
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}},
      "description": "HTTP 허용 (HTTPS로 리다이렉트용)"
    }
  ]' \
  --force
```

**잘 됐는지 확인하기:**

OCI 콘솔 → **Networking** → **Virtual Cloud Networks** → "cergy-vcn" 클릭 → 왼쪽에서 각 Subnet과 Route Table, Security List가 보이면 성공

**문제가 생겼다면:**
- "Authorization failed" → Compartment 권한 확인. 루트 Compartment를 사용 중인지 확인
- Route Table이나 Security List를 잘못 설정했다면 → OCI 콘솔에서 직접 수정 가능

---

## 파트 3: MongoDB Atlas 설정

> **이 파트에서 하는 일**: 데이터베이스를 만듭니다.
> OCI 안에 직접 설치하는 대신, MongoDB Atlas(전문 클라우드 DB 서비스)를 사용합니다.
> 자동 백업, 자동 스케일링, 보안 패치를 알아서 해주기 때문에 관리가 편합니다.

### 스텝 3.1: MongoDB Atlas 무료 클러스터 만들기

> **한 줄 요약**: 클라우드 데이터베이스를 만듭니다.
> **쉽게 말하면**: 구글 드라이브처럼, 데이터를 저장할 클라우드 공간을 만드는 것입니다.

**하는 방법:**

1. https://www.mongodb.com/atlas 접속 → **Try Free** 클릭 → 가입
2. **Create a Cluster** 클릭
3. 설정:
   - **Plan**: M0 (Free) 선택
   - **Provider**: AWS 선택 (OCI에서 가장 가까운 네트워크)
   - **Region**: `ap-northeast-2` (Seoul)
   - **Cluster Name**: `cergy2026`
4. **Create Deployment** 클릭

> 클러스터가 만들어지는 데 1~3분 걸립니다.

---

### 스텝 3.2: 데이터베이스 사용자 만들기

> **한 줄 요약**: DB에 접근할 사용자 계정을 만듭니다.

**하는 방법:**

1. Atlas 대시보드 → 왼쪽 **Database Access** 클릭
2. **Add New Database User** 클릭
3. 설정:
   - **Authentication Method**: Password
   - **Username**: `cergy-app`
   - **Password**: 강력한 비밀번호 생성 (메모해두세요!)
   - **Database User Privileges**: **Read and write to any database**
4. **Add User** 클릭

---

### 스텝 3.3: Network Access 설정

> **한 줄 요약**: 어디서 DB에 접속할 수 있는지 IP를 허용합니다.
> **쉽게 말하면**: "이 IP에서 오는 접속만 허용해"라고 설정하는 것입니다.

**왜 필요한가요?**
보안을 위해 기본적으로 모든 외부 접속이 차단되어 있습니다. OKE 서버에서 접속할 수 있도록 열어줘야 합니다.

**하는 방법:**

1. Atlas 대시보드 → 왼쪽 **Network Access** 클릭
2. **Add IP Address** 클릭

**개발 단계에서는:**
- **Allow Access from Anywhere** (0.0.0.0/0) 선택 → **Confirm**
- ⚠️ 운영 환경에서는 OKE Worker Node의 NAT Gateway IP만 허용해야 합니다 (파트 11에서 다룸)

---

### 스텝 3.4: Connection String 복사

> **한 줄 요약**: 앱에서 DB에 접속할 주소를 가져옵니다.

**하는 방법:**

1. Atlas 대시보드 → **Database** → **Connect** 클릭
2. **Drivers** 선택
3. Connection String을 복사합니다:

```
mongodb+srv://cergy-app:<password>@cergy2026.xxxxx.mongodb.net/cergy2026?retryWrites=true&w=majority
```

> `<password>` 부분을 스텝 3.2에서 만든 비밀번호로 바꿔야 합니다!
> `/cergy2026`은 데이터베이스 이름입니다 (기본 `test` → `cergy2026`으로 변경).

이 값을 메모해두세요 — 나중에 `MONGODB_URI` 환경변수로 사용합니다.

---

### 스텝 3.5: 로컬에서 연결 테스트

> **한 줄 요약**: 내 컴퓨터에서 Atlas DB에 접속이 되는지 확인합니다.

**하는 방법:**

```bash
# mongosh가 없다면 설치합니다 (Mac)
brew install mongosh

# Atlas에 연결을 테스트합니다 — <password>를 실제 비밀번호로 바꾸세요
mongosh "mongodb+srv://cergy-app:<password>@cergy2026.xxxxx.mongodb.net/cergy2026"
```

**잘 됐는지 확인하기:**

```
Current Mongosh Log ID: 6xxx...
Connecting to:          mongodb+srv://...
Using MongoDB:          7.0.x
cergy2026>
```

이 프롬프트가 나오면 성공입니다! `exit`으로 빠져나오세요.

**문제가 생겼다면:**
- "connection timed out" → Network Access에서 내 IP가 허용되어 있는지 확인
- "authentication failed" → 사용자 이름과 비밀번호 확인, 특수문자가 있다면 URL 인코딩 필요

---

## 파트 4: Docker 이미지 만들기

> **이 파트에서 하는 일**: 우리 앱을 "도시락"처럼 포장합니다.
>
> **Docker란?** 앱과 그 앱이 실행되는 데 필요한 모든 것(Node.js, 라이브러리 등)을
> 하나의 "상자(이미지)"에 담는 기술입니다.
>
> 내 컴퓨터에서 되는 게 서버에서는 안 되는 문제("내 컴퓨터에서는 잘 되는데?")를 해결합니다.
> 같은 상자를 어디에서 열어도 똑같이 동작하니까요.

### 스텝 4.1: Frontend Dockerfile 작성

> **한 줄 요약**: Next.js 앱을 Docker 이미지로 만드는 레시피를 작성합니다.

**하는 방법:**

`frontend/Dockerfile` 파일을 만듭니다:

```dockerfile
# ── 1단계: 기본 환경 준비 ──
# node:20-alpine = Node.js 20 버전이 설치된 초경량 리눅스
# alpine을 쓰면 이미지 크기가 약 900MB → 약 150MB로 줄어듭니다
FROM node:20-alpine AS base
# pnpm을 사용할 수 있도록 활성화합니다
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── 2단계: 의존성 설치 ──
# package.json과 lock 파일만 먼저 복사해서 의존성을 설치합니다
# 코드가 바뀌어도 의존성이 안 바뀌면 이 단계는 캐시되어 빌드가 빨라집니다
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── 3단계: 빌드 ──
# 소스 코드를 복사하고 Next.js를 빌드합니다
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드 시점에 필요한 환경변수 (API 서버 주소)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

# ── 4단계: 실행 ──
# 빌드 결과물만 가져와서 실행합니다 (소스코드, devDependencies 제외 → 이미지 크기 최소화)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# 보안: root가 아닌 전용 사용자로 실행합니다
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Next.js standalone 빌드 결과물을 복사합니다
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> **중요**: Next.js standalone 모드를 사용하려면 `next.config.ts`에 설정이 필요합니다:
> ```ts
> // next.config.ts
> const nextConfig = {
>   output: 'standalone',
>   // ... 기존 설정
> }
> ```

---

### 스텝 4.2: Backend Dockerfile 작성

> **한 줄 요약**: Express 앱을 Docker 이미지로 만드는 레시피를 작성합니다.

**하는 방법:**

`backend/Dockerfile` 파일을 만듭니다:

```dockerfile
# ── 1단계: 기본 환경 준비 ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── 2단계: 의존성 설치 ──
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── 3단계: TypeScript 빌드 ──
# tsc로 TypeScript를 JavaScript로 변환합니다
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── 4단계: 실행 ──
# 빌드된 JS 파일과 production 의존성만 가져옵니다
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 보안: 전용 사용자로 실행
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs

# 빌드 결과물과 production 의존성만 복사합니다
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 업로드 파일 저장 디렉토리 (필요한 경우)
RUN mkdir -p /app/uploads && chown expressjs:nodejs /app/uploads

USER expressjs
EXPOSE 4000
# tsc로 빌드된 결과물을 실행합니다
CMD ["node", "dist/index.js"]
```

---

### 스텝 4.3: .dockerignore 작성

> **한 줄 요약**: Docker 빌드할 때 불필요한 파일을 제외합니다.
> **쉽게 말하면**: `.gitignore`처럼 Docker가 무시할 파일 목록입니다.

**하는 방법:**

`frontend/.dockerignore`와 `backend/.dockerignore`를 각각 만듭니다 (내용은 동일):

```
node_modules
.next
dist
.env*
.git
*.md
```

---

### 스텝 4.4: docker-compose.yml 업데이트 (로컬 테스트용)

> **한 줄 요약**: 로컬에서 전체 앱(Frontend + Backend + MongoDB)을 한 번에 실행할 수 있도록 설정합니다.

**하는 방법:**

프로젝트 루트의 `docker-compose.yml`을 수정합니다:

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: cergy2026-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: cergy2026

  backend:
    build:
      context: ./backend
    container_name: cergy2026-backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=development
      - PORT=4000
      - MONGODB_URI=mongodb://mongodb:27017/cergy2026
      - SESSION_SECRET=local-dev-secret-change-in-production
      - CORS_ORIGIN=http://localhost:3000

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: http://localhost:4000
    container_name: cergy2026-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

---

### 스텝 4.5: 로컬에서 빌드 & 테스트

> **한 줄 요약**: Docker로 전체 앱을 빌드하고 실행해봅니다.

**하는 방법:**

```bash
# 프로젝트 루트에서 실행합니다
# --build 옵션은 이미지를 새로 빌드하라는 뜻입니다
docker compose up --build
```

> 첫 빌드는 5~10분 걸릴 수 있습니다. 이후에는 캐시 덕분에 훨씬 빨라집니다.

**잘 됐는지 확인하기:**

- http://localhost:3000 — Frontend가 보이면 성공
- http://localhost:4000/health — Backend가 응답하면 성공 (health 엔드포인트가 있는 경우)

```bash
# 실행 중인 컨테이너 확인
docker compose ps
```
→ 3개 컨테이너가 모두 "Up" 상태면 성공:
```
NAME                    STATUS
cergy2026-frontend      Up
cergy2026-backend       Up
cergy2026-mongodb       Up
```

**테스트가 끝나면:**
```bash
# 컨테이너를 중지합니다
docker compose down
```

**문제가 생겼다면:**
- 빌드 에러 → `docker compose logs frontend` 또는 `docker compose logs backend`로 로그 확인
- 포트 충돌 → `lsof -i :3000` 또는 `lsof -i :4000`으로 포트 사용 중인 프로세스 확인 후 종료
- `standalone` 관련 에러 → `next.config.ts`에 `output: 'standalone'` 설정이 있는지 확인

---

## 파트 5: 컨테이너 저장소 (OCIR)

> **이 파트에서 하는 일**: 만든 Docker 이미지를 OCI의 저장소에 업로드합니다.
>
> **OCIR(Oracle Cloud Infrastructure Registry)란?**
> Docker Hub의 OCI 버전입니다. 이미지를 여기에 올려놓으면 OKE 클러스터에서 가져다 쓸 수 있습니다.
> 마치 "앱 택배 보관함"처럼, 이미지를 넣어두면 서버가 꺼내 쓰는 구조입니다.

### 스텝 5.1: OCIR 레포지토리 만들기

> **한 줄 요약**: Docker 이미지를 저장할 공간을 만듭니다.

**하는 방법:**

```bash
# Frontend 이미지 저장소를 만듭니다
# is-public을 false로 하면 인증된 사용자만 이미지를 가져갈 수 있습니다
oci artifacts container repository create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "cergy2026/frontend" \
  --is-public false

# Backend 이미지 저장소를 만듭니다
oci artifacts container repository create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "cergy2026/backend" \
  --is-public false
```

**잘 됐는지 확인하기:**

OCI 콘솔 → **Developer Services** → **Container Registry** → 2개의 레포지토리가 보이면 성공

---

### 스텝 5.2: Auth Token 만들기

> **한 줄 요약**: OCIR에 로그인할 때 사용할 비밀번호를 생성합니다.
> **쉽게 말하면**: Docker Hub에 로그인할 때 비밀번호가 필요하듯, OCIR도 토큰이 필요합니다.

**하는 방법:**

1. OCI 콘솔 → 오른쪽 위 사람 아이콘 → **My Profile**
2. 왼쪽 **Auth Tokens** → **Generate Token**
3. Description: `ocir-push-token`
4. **Generate Token** 클릭
5. ⚠️ **토큰을 즉시 복사해두세요!** 다시 볼 수 없습니다. → `$OCI_AUTH_TOKEN`

---

### 스텝 5.3: OCIR 로그인

> **한 줄 요약**: 터미널에서 OCIR에 로그인합니다.

**하는 방법:**

```bash
# OCIR에 로그인합니다
# 서울 리전의 OCIR 주소는 yny.ocir.io 입니다
# 사용자명 형식: <네임스페이스>/<사용자이메일>
docker login yny.ocir.io \
  -u "<네임스페이스>/<사용자이메일>" \
  --password-stdin <<< "$OCI_AUTH_TOKEN"
```

> **네임스페이스는 어디서 찾나요?**
> `oci os ns get` 명령어의 결과값입니다 (스텝 1.3에서 확인했습니다).

**잘 됐는지 확인하기:**
```
Login Succeeded
```

---

### 스텝 5.4: 이미지 빌드 & 푸시

> **한 줄 요약**: 멀티 플랫폼(AMD64 + ARM64) 이미지를 빌드하고 OCIR에 업로드합니다.

> **왜 멀티 플랫폼인가요?**
> Mac(Apple Silicon)에서 빌드하면 기본적으로 ARM64 이미지가 만들어집니다.
> OKE 노드는 AMD64일 수도 있고 ARM64일 수도 있으므로, 처음부터 두 아키텍처를 모두 빌드해두면
> 나중에 노드 타입을 바꿔도 이미지를 다시 빌드할 필요가 없습니다.

**하는 방법:**

```bash
NAMESPACE=$(oci os ns get --query "data" --raw-output)
REGION="yny.ocir.io"

# buildx 멀티 플랫폼 빌더 준비 (처음 한 번만)
docker buildx create --name multiplatform --use
docker buildx inspect --bootstrap

# Backend: AMD64 + ARM64 동시 빌드 & 푸시
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  -t ${REGION}/${NAMESPACE}/cergy2026/backend:latest \
  -f backend/Dockerfile \
  .

# Frontend: AMD64 + ARM64 동시 빌드 & 푸시
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  -t ${REGION}/${NAMESPACE}/cergy2026/frontend:latest \
  -f frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://backend:4000 \
  .
```

> **빌드 컨텍스트는 항상 프로젝트 루트(`.`)** — `pnpm-workspace.yaml`이 루트에 있어서 모노레포 의존성이 올바르게 복사됩니다.
> **`--push` 플래그** — 멀티 플랫폼 빌드는 로컬에 저장할 수 없어서 빌드와 동시에 OCIR로 푸시합니다.

**잘 됐는지 확인하기:**

OCI 콘솔 → **Developer Services** → **Container Registry** → 레포지토리 클릭 → 이미지가 보이면 성공

**문제가 생겼다면:**
- "denied: requested access" → `docker login`을 다시 시도. 네임스페이스/사용자명이 정확한지 확인
- "no image found for architecture amd64" → `--platform linux/amd64,linux/arm64` 없이 빌드한 경우. 위 명령어로 재빌드 필요
- buildx 빌더가 없다는 에러 → `docker buildx create --name multiplatform --use` 먼저 실행

---

## 파트 6: 쿠버네티스 클러스터 (OKE)

> **이 파트에서 하는 일**: 컨테이너를 실행할 서버(쿠버네티스 클러스터)를 만듭니다.
>
> **쿠버네티스(Kubernetes, 줄여서 K8s)란?**
> 컨테이너(Docker 이미지로 만든 앱)를 자동으로 관리해주는 시스템입니다.
>
> 비유하면 **편의점 본사**와 같습니다:
> - "서울에 매장 3개 운영해" (= 컨테이너 3개 실행)
> - "한 매장이 망하면 새 매장을 열어" (= 컨테이너가 죽으면 자동 재시작)
> - "손님이 몰리면 매장을 더 열어" (= 자동 스케일링)
>
> **OKE(Oracle Kubernetes Engine)**는 OCI에서 제공하는 쿠버네티스 서비스입니다.
> 쿠버네티스의 핵심 부분(Control Plane)은 OCI가 무료로 관리해주고,
> 우리는 앱이 실제로 돌아갈 서버(Worker Node)만 관리하면 됩니다.

### 스텝 6.1: OKE 클러스터 만들기

> **한 줄 요약**: 쿠버네티스의 "두뇌" 부분을 만듭니다.

**왜 필요한가요?**
클러스터는 쿠버네티스의 중앙 관리 시스템입니다. 이것이 Worker Node들에게 "이 컨테이너를 실행해"라고 지시합니다.

**하는 방법:**

```bash
# OKE 클러스터를 만듭니다
# 로드밸런서가 Public Subnet에 만들어지도록 설정합니다
# API 엔드포인트도 Public Subnet에 두어 외부에서 kubectl로 접근 가능하게 합니다
oci ce cluster create \
  --compartment-id $COMPARTMENT_ID \
  --name "cergy-cluster" \
  --vcn-id $VCN_ID \
  --kubernetes-version "v1.35.2" \
  --service-lb-subnet-ids "[\"$PUBLIC_SUBNET_ID\"]" \
  --endpoint-subnet-id "$PUBLIC_SUBNET_ID" \
  --endpoint-public-ip-enabled true
```

> ⏱️ 클러스터 생성에 **5~10분** 정도 걸립니다. OCI 콘솔에서 상태를 확인할 수 있습니다.
> **Developer Services** → **Kubernetes Clusters (OKE)** → 상태가 "Active"가 될 때까지 기다립니다.

**결과에서 Cluster OCID를 복사해두세요** → `$CLUSTER_ID`

> ⚠️ **Kubernetes 버전 주의**:
> OCI는 각 K8s 버전을 약 14개월만 지원합니다. 가입 시점에 사용 가능한 **가장 최신 버전**을 선택하세요.
> 사용 가능한 버전 조회: `oci ce cluster-options get --cluster-option-id all --query 'data."kubernetes-versions"'`
>
> 나중에 업그레이드할 때는 **마이너 버전을 건너뛸 수 없습니다**.
> 예: v1.32 → v1.35는 불가, v1.32 → v1.33 → v1.34 → v1.35로 단계별 진행 필요.

---

### 스텝 6.2: Worker Node Pool 만들기

> **한 줄 요약**: 앱이 실제로 실행될 서버(VM)들을 만듭니다.
> **쉽게 말하면**: 클러스터(두뇌)에게 "일할 직원"을 배정하는 것입니다.

#### 6.2.1: 노드 이미지(OS) ID 조회

Node Pool 생성 시 **워커 노드용 OKE 빌드 이미지**가 반드시 필요합니다(`--node-source-details`).
일반 Compute 이미지가 아니라 **OKE 워커 노드 전용 이미지**여야 합니다.

```bash
# 사용하려는 K8s 버전(v1.35.2)에 맞는 OKE 이미지 목록 조회
# AMD(x86_64): aarch64 와 GPU 가 들어간 이름 제외
# 주의: zsh에서 ! 가 history expansion으로 해석되지 않도록 외부는 작은따옴표 사용
oci ce node-pool-options get \
  --node-pool-option-id $CLUSTER_ID \
  --query 'data.sources[?contains("source-name", `1.35.2`) && !contains("source-name", `aarch64`) && !contains("source-name", `GPU`)]'

# ARM(aarch64): aarch64가 들어간 이름만
oci ce node-pool-options get \
  --node-pool-option-id $CLUSTER_ID \
  --query 'data.sources[?contains("source-name", `1.35.2`) && contains("source-name", `aarch64`)]'
```

위 결과에서 가장 최신 빌드의 `image-id`를 복사해서 `--node-source-details` 에 사용합니다.

> 💡 **zsh `event not found` 에러가 나는 경우**:
> JMESPath 쿼리 안에 `!`(NOT 연산자)가 있을 때 발생합니다.
> 위처럼 **외부는 작은따옴표(`'`), JMESPath literal은 백틱(`` ` ``)** 으로 감싸면 해결됩니다.

#### 6.2.2: ⚠️ ARM 무료 티어의 현실 — 먼저 읽어보세요

**Always Free 티어 ARM(`VM.Standard.A1.Flex`)은 4 OCPU / 24GB가 무료**라서 매력적이지만,
**한국 리전(춘천/서울)에서는 ARM capacity 부족이 매우 흔합니다.**

```
"2 node(s) need be provisioned, 0 node(s) provisioning"
"Validating nodes: 0 provisioned, 0 provisioning, 2 remaining" × 10번 반복
"Work request exceeded max retry count" → FAILED
```

이런 패턴이 보이면 **OCI에 ARM 호스트가 비어있지 않은 상태**입니다. 즉시 풀리지 않으며 며칠 걸릴 수도 있습니다.

**대응 전략 3가지:**

| 전략 | 비용 | 즉시 가능? | 추천 |
|------|------|-----------|------|
| **A. AMD 작은 노드로 시작 → ARM 풀리면 마이그레이션** | 월 ~3만원 → $0 | ✅ | ⭐⭐⭐⭐⭐ |
| **B. ARM 재시도 스크립트만 돌리기 (며칠 ~ 1주)** | 무료 | ❌ (대기) | ⭐⭐⭐ |
| **C. AMD 그대로 운영 (작은 사이즈)** | 월 ~3~5만원 | ✅ | ⭐⭐⭐ (학습 목적) |

이 가이드는 **A 전략(AMD로 시작, ARM 마이그레이션)** 을 권장합니다.

#### 6.2.3: AMD 노드 풀 생성 (즉시 운영 시작)

가장 저렴한 운영 가능 사양 — **1 OCPU / 6GB × 1노드 (월 약 $25)**:

```bash
# Availability Domain 조회
AD=$(oci iam availability-domain list \
  --compartment-id $TENANCY_OCID \
  --query "data[0].name" --raw-output)

# AMD x86_64 OKE 이미지 ID (위 6.2.1에서 조회한 값으로 교체)
AMD_IMAGE_ID="ocid1.image.oc1.ap-chuncheon-1.aaaaaaaa..."

oci ce node-pool create \
  --compartment-id $COMPARTMENT_ID \
  --cluster-id $CLUSTER_ID \
  --name "cergy-amd-pool" \
  --kubernetes-version "v1.35.2" \
  --node-shape "VM.Standard.E4.Flex" \
  --node-shape-config '{"ocpus":1,"memoryInGBs":6}' \
  --node-source-details "{\"sourceType\":\"IMAGE\",\"imageId\":\"$AMD_IMAGE_ID\"}" \
  --size 1 \
  --placement-configs "[{\"availabilityDomain\":\"$AD\",\"subnetId\":\"$APP_SUBNET_ID\"}]" \
  --wait-for-state SUCCEEDED \
  --wait-for-state FAILED
```

> ⏱️ AMD는 capacity 문제가 거의 없어서 **5~10분 안에 SUCCEEDED**가 나옵니다.

**설정값 설명:**

| 설정 | 값 | 의미 |
|------|-----|------|
| `node-shape` | VM.Standard.E4.Flex | AMD 기반 가성비 좋은 VM |
| `ocpus` | 1 | CPU 1코어 (개발용 최소) |
| `memoryInGBs` | 6 | OKE 워커 최소 권장 |
| `size` | 1 | VM 1대 (개발/소규모 운영) |
| `--wait-for-state` | SUCCEEDED \| FAILED | 끝날 때까지 자동 대기 |

#### 6.2.4: ARM 노드 풀 생성 시도 (병렬 진행)

AMD 노드 풀이 만들어지는 동안 (또는 만들어진 후) **ARM 무료 티어를 백그라운드에서 계속 재시도**해두세요.
프로젝트 루트에 다음 스크립트를 만들어둡니다:

`scripts/retry-arm-nodepool.sh`:

```bash
#!/bin/bash
# ARM A1.Flex 노드 풀 생성 재시도 스크립트
# Out of capacity 에러가 풀릴 때까지 5분마다 재시도

COMPARTMENT_ID="ocid1.compartment.oc1..xxx"
CLUSTER_ID="ocid1.cluster.oc1.ap-chuncheon-1.xxx"
IMAGE_ID="<6.2.1에서 조회한 ARM aarch64 이미지 ID>"
SUBNET_ID="ocid1.subnet.oc1.ap-chuncheon-1.xxx"  # App(Private) Subnet
AVAILABILITY_DOMAIN="<AD 이름>"
K8S_VERSION="v1.35.2"

ATTEMPT=0
while true; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[$(date +%H:%M:%S)] 시도 #$ATTEMPT 시작..."

  RESULT=$(oci ce node-pool create \
    --compartment-id "$COMPARTMENT_ID" \
    --cluster-id "$CLUSTER_ID" \
    --name "cergy-arm-pool" \
    --kubernetes-version "$K8S_VERSION" \
    --node-shape "VM.Standard.A1.Flex" \
    --node-shape-config '{"ocpus":2,"memoryInGBs":12}' \
    --node-source-details "{\"sourceType\":\"IMAGE\",\"imageId\":\"$IMAGE_ID\"}" \
    --size 2 \
    --placement-configs "[{\"availabilityDomain\":\"$AVAILABILITY_DOMAIN\",\"subnetId\":\"$SUBNET_ID\"}]" \
    --wait-for-state SUCCEEDED \
    --wait-for-state FAILED \
    2>&1)

  if echo "$RESULT" | grep -q '"status": "SUCCEEDED"'; then
    echo "✅ 성공! ARM 노드 풀 생성 완료"
    echo "$RESULT"
    break
  fi

  echo "[$(date +%H:%M:%S)] 실패. 5분 후 재시도..."
  sleep 300
done
```

백그라운드 실행:

```bash
chmod +x scripts/retry-arm-nodepool.sh
mkdir -p logs
nohup ./scripts/retry-arm-nodepool.sh > logs/arm-retry.log 2>&1 &
echo $! > logs/arm-retry.pid
echo "✅ PID: $(cat logs/arm-retry.pid)"

# 진행 상황 확인
tail -f logs/arm-retry.log

# 중단하고 싶을 때
kill $(cat logs/arm-retry.pid)
```

> ⚠️ **노트북 절전/종료 시 스크립트 멈춤**. 가능하면 켜둔 채로 두세요.
> 24시간 이상 안 풀리면 다른 리전(도쿄 `ap-tokyo-1` 등) 시도 고려.

#### 6.2.5: ARM 풀리면 마이그레이션 (며칠 후)

ARM 노드 풀이 ACTIVE 되면 다음 순서로 AMD에서 ARM으로 워크로드를 옮깁니다:

**1단계: 이미지 확인**

스텝 5.4에서 `--platform linux/amd64,linux/arm64`로 빌드했다면 이미지 재빌드 불필요.
AMD-only로 빌드했다면 스텝 5.4 명령어로 재빌드 후 푸시.

**2단계: Deployment에 ARM 우선 nodeSelector 추가**

`k8s/base/backend-deployment.yaml`, `k8s/base/frontend-deployment.yaml`에 다음 추가:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        kubernetes.io/arch: arm64   # ARM 노드에만 스케줄
```

적용:

```bash
kubectl apply -k k8s/overlays/production
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/frontend -n production
```

새 Pod이 모두 ARM 노드에 뜨고 Ready 확인:

```bash
kubectl get pods -n production -o wide
# 노드 이름 보고 ARM 노드인지 확인
kubectl get nodes -L kubernetes.io/arch
```

**3단계: AMD 노드 풀 삭제 (월 비용 → $0)**

```bash
oci ce node-pool delete \
  --node-pool-id <AMD 노드풀 OCID> \
  --force
```

→ 이 시점부터 **월 $25 → $0**, 완전 무료 운영 시작 ✅

#### 6.2.6: ⚠️ 흔한 에러 모음

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `Invalid nodeSourceDetails` | `--node-source-details` 누락 | 6.2.1로 이미지 ID 조회 후 추가 |
| `Invalid nodeShape: Node shape and image are not compatible` | shape와 이미지 아키텍처 불일치 | E4=AMD x86_64 / A1=ARM aarch64. 이미지 이름 재확인 |
| `Out of host capacity for shape A1.Flex` | ARM capacity 부족 | 6.2.4 재시도 스크립트 사용 |
| `Work request exceeded max retry count` | 위와 동일 | 위와 동일 |
| `Node pool ... still has new or running job` | 이전 작업 진행 중 | `oci ce work-request get`으로 SUCCEEDED 대기 후 재시도 |

---

### 스텝 6.3: kubeconfig 설정

> **한 줄 요약**: 내 터미널에서 OKE 클러스터에 명령을 내릴 수 있도록 연결합니다.
> **쉽게 말하면**: TV 리모컨(kubectl)에 우리 TV(클러스터)를 등록하는 것입니다.

**하는 방법:**

```bash
# kubeconfig 파일을 생성합니다 — kubectl이 이 파일을 보고 어디에 연결할지 압니다
# --region은 클러스터를 만든 리전과 동일해야 합니다 (예: ap-chuncheon-1, ap-seoul-1, ap-tokyo-1)
oci ce cluster create-kubeconfig \
  --cluster-id $CLUSTER_ID \
  --file ~/.kube/config \
  --region ap-chuncheon-1 \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT
```

**잘 됐는지 확인하기:**

```bash
# 클러스터의 Worker Node 목록을 조회합니다
kubectl get nodes
```
→ 이런 결과가 나오면 성공:
```
NAME           STATUS   ROLES   AGE   VERSION
10.0.2.10      Ready    node    5m    v1.35.2
```

> 노드 1개(AMD)만 보일 수 있습니다. ARM 노드 풀이 나중에 만들어지면 자동으로 추가됩니다.

> STATUS가 모두 **Ready**여야 합니다. "NotReady"면 몇 분 더 기다려주세요.

**문제가 생겼다면:**
- "Unable to connect to the server" → OKE 클러스터가 Active 상태인지 확인
- "No resources found" → Node Pool이 아직 생성 중. OCI 콘솔에서 Node Pool 상태 확인
- "Unauthorized" → `oci ce cluster create-kubeconfig`를 다시 실행

---

## 파트 7: 쿠버네티스에 앱 배포

> **이 파트에서 하는 일**: 드디어! OCIR에 올린 Docker 이미지를 OKE 클러스터에서 실행합니다.
>
> 쿠버네티스에서는 YAML 파일로 "어떤 앱을 몇 개 실행하고, 어떻게 네트워크를 연결할지" 선언합니다.
> 이 YAML 파일들을 **매니페스트(manifest)**라고 부릅니다.

### 스텝 7.1: k8s 디렉토리 구조 만들기

> **한 줄 요약**: 쿠버네티스 설정 파일들을 보관할 폴더를 만듭니다.

**하는 방법:**

```bash
# 프로젝트 루트에서 실행합니다
mkdir -p k8s/base k8s/overlays/{dev,staging,production}
```

결과 구조:
```
k8s/
├── base/                    ← 공통 설정 (모든 환경에서 동일)
│   ├── kustomization.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── ingress.yaml
└── overlays/                ← 환경별 차이점만 덮어쓰기
    ├── dev/
    ├── staging/
    └── production/
```

> **왜 base와 overlays로 나누나요?**
> 90%는 똑같고 10%만 다르기 때문입니다 (예: dev는 replica 1개, prod는 3개).
> base에 공통 설정을, overlays에 차이점만 작성하면 중복을 줄일 수 있습니다.
> 이 방식을 **Kustomize**라고 합니다 (kubectl에 내장).

---

### 스텝 7.2: Namespace 만들기

> **한 줄 요약**: 환경별로 격리된 공간을 만듭니다.
> **쉽게 말하면**: 같은 건물(클러스터) 안에 "개발 사무실", "테스트 사무실", "운영 사무실"을 나누는 것입니다.

**하는 방법:**

```bash
# dev, staging, production 3개의 Namespace를 만듭니다
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace production
```

**잘 됐는지 확인하기:**
```bash
kubectl get namespaces
```
→ dev, staging, production이 목록에 보이면 성공

---

### 스텝 7.3: Secret 만들기

> **한 줄 요약**: 비밀번호, API 키 같은 민감한 정보를 쿠버네티스에 안전하게 저장합니다.
> **쉽게 말하면**: `.env.local` 파일의 쿠버네티스 버전입니다.

**왜 필요한가요?**
환경변수를 YAML 파일에 직접 쓰면 GitHub에 올라가니까요. Secret은 암호화되어 저장됩니다.

**하는 방법:**

**1) OCIR 로그인 Secret** (이미지를 가져올 때 인증용):
```bash
# OKE가 OCIR에서 이미지를 가져올 때 사용할 인증 정보를 등록합니다
kubectl create secret docker-registry ocir-secret \
  -n production \
  --docker-server=yny.ocir.io \
  --docker-username="<네임스페이스>/<사용자이메일>" \
  --docker-password="$OCI_AUTH_TOKEN" \
  --docker-email="your@email.com"
```

**2) 앱 환경변수 Secret** (MongoDB URI, 세션 시크릿 등):
```bash
# 앱이 사용할 민감한 환경변수를 등록합니다
kubectl create secret generic app-secrets \
  -n production \
  --from-literal=MONGODB_URI="mongodb+srv://cergy-app:<password>@cergy2026.xxxxx.mongodb.net/cergy2026" \
  --from-literal=SESSION_SECRET="$(openssl rand -hex 32)"
```

> dev, staging에도 각각 만들어주세요 (값만 다르게).

---

### 스텝 7.4: ConfigMap 만들기

> **한 줄 요약**: 민감하지 않은 설정값을 저장합니다.
> **쉽게 말하면**: Secret은 비밀번호용, ConfigMap은 일반 설정용입니다.

**하는 방법:**

```bash
# 일반 환경변수를 ConfigMap으로 만듭니다
# ⚠️ 도메인 연결 전이라면 CORS_ORIGIN을 "*"로 설정하세요 (아래 참고)
kubectl create configmap app-config \
  -n production \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=4000 \
  --from-literal=CORS_ORIGIN="*"
```

> **도메인이 있지만 아직 연결하지 않은 경우**
>
> 지금 단계에서는 LoadBalancer IP가 아직 발급되지 않았고, 도메인 A 레코드도 설정하지 않았습니다.
> `CORS_ORIGIN`에 실제 도메인을 넣어도 현재는 동작하지 않으므로 `"*"`로 임시 설정합니다.
>
> 파트 8에서 LoadBalancer IP 발급 → 도메인 A 레코드 설정을 완료한 후, 아래 명령어로 업데이트하세요:
>
> ```bash
> kubectl create configmap app-config \
>   -n production \
>   --from-literal=NODE_ENV=production \
>   --from-literal=PORT=4000 \
>   --from-literal=CORS_ORIGIN="https://yourdomain.com" \
>   --dry-run=client -o yaml | kubectl apply -f -
> ```
>
> `--dry-run=client -o yaml | kubectl apply -f -` 패턴은 이미 존재하는 ConfigMap을 **덮어쓸 때** 사용합니다.

---

### 스텝 7.5: backend-deployment.yaml 작성

> **한 줄 요약**: Backend 앱을 어떻게 실행할지 선언합니다.

`k8s/base/backend-deployment.yaml`:

```yaml
# apiVersion: 이 YAML의 문법 버전
apiVersion: apps/v1
# kind: 이 파일이 뭘 정의하는지 — Deployment = "이 앱을 이렇게 실행해"
kind: Deployment
metadata:
  name: backend
spec:
  # replicas: 동시에 몇 개의 컨테이너를 실행할지 (2개면 하나가 죽어도 서비스 유지)
  replicas: 2
  # selector: "app: backend" 라벨이 붙은 Pod를 관리하겠다
  selector:
    matchLabels:
      app: backend
  # strategy: 새 버전 배포 방식
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 새 컨테이너를 1개 먼저 만들고
      maxUnavailable: 0  # 기존 컨테이너는 0개만 내림 (= 무중단 배포)
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          # IMAGE_TAG는 CI/CD에서 Git 커밋 해시로 치환됩니다
          image: yny.ocir.io/NAMESPACE/cergy2026/backend:IMAGE_TAG
          ports:
            - containerPort: 4000
          # 환경변수: ConfigMap에서 가져오기
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: NODE_ENV
            - name: PORT
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: PORT
            - name: CORS_ORIGIN
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: CORS_ORIGIN
            # 환경변수: Secret에서 가져오기 (민감한 정보)
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: MONGODB_URI
            - name: SESSION_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: SESSION_SECRET
          # resources: CPU와 메모리 제한 — 한 컨테이너가 자원을 독점하지 못하게
          resources:
            requests:          # 최소 보장량
              cpu: 250m        # 0.25 코어
              memory: 256Mi    # 256MB
            limits:            # 최대 사용량
              cpu: 1000m       # 1 코어
              memory: 512Mi    # 512MB
          # readinessProbe: "이 컨테이너가 요청을 받을 준비가 됐는지" 체크
          # 준비가 안 되면 트래픽을 보내지 않습니다
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10  # 시작 후 10초 뒤부터 체크
            periodSeconds: 5         # 5초마다 체크
          # livenessProbe: "이 컨테이너가 살아있는지" 체크
          # 응답이 없으면 자동으로 재시작합니다
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
      # OCIR에서 이미지를 가져올 때 인증 정보
      imagePullSecrets:
        - name: ocir-secret
```

> **주의**: Backend에 `/health` 엔드포인트가 있어야 합니다.
> 없다면 간단히 추가하세요:
> ```ts
> // backend/src/routes/health.ts
> router.get('/health', (_req, res) => { res.json({ status: 'ok' }) })
> ```

---

### 스텝 7.6: frontend-deployment.yaml 작성

`k8s/base/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: yny.ocir.io/NAMESPACE/cergy2026/frontend:IMAGE_TAG
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      imagePullSecrets:
        - name: ocir-secret
```

---

### 스텝 7.7: Service 파일 작성

> **한 줄 요약**: 컨테이너에 접근할 수 있는 내부 주소를 만듭니다.
> **쉽게 말하면**: 컨테이너는 켜질 때마다 IP가 바뀌는데, Service는 고정 주소를 제공합니다.
> "backend"라는 이름으로 항상 접근할 수 있게 해주는 내부 DNS입니다.

`k8s/base/backend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend       # "app: backend" 라벨이 붙은 Pod들에게 트래픽을 보냅니다
  ports:
    - port: 4000       # Service가 받는 포트
      targetPort: 4000 # 컨테이너의 포트
  type: ClusterIP      # 클러스터 내부에서만 접근 가능 (외부 노출은 Ingress가 담당)
```

`k8s/base/frontend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
```

---

### 스텝 7.8: Kustomization 파일 작성

`k8s/base/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - frontend-deployment.yaml
  - frontend-service.yaml
  - backend-deployment.yaml
  - backend-service.yaml
  - ingress.yaml
```

`k8s/overlays/production/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
resources:
  - ../../base
patches:
  - path: patches.yaml
```

`k8s/overlays/production/patches.yaml` (운영 환경에서 replica 수 증가):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: backend
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 2000m
              memory: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 3
```

`k8s/overlays/dev/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: dev
resources:
  - ../../base
patches:
  - path: patches.yaml
```

`k8s/overlays/dev/patches.yaml` (개발 환경은 최소 리소스):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
```

---

### 스텝 7.9: 배포 실행

> **한 줄 요약**: 작성한 매니페스트를 클러스터에 적용합니다.

**하는 방법:**

```bash
# dev 환경에 먼저 배포해봅니다
# -k 옵션은 Kustomize를 사용하겠다는 뜻입니다
kubectl apply -k k8s/overlays/dev/
```

**잘 됐는지 확인하기:**

```bash
# Pod(컨테이너) 상태를 확인합니다
kubectl get pods -n dev
```
→ 이런 결과가 나오면 성공:
```
NAME                        READY   STATUS    RESTARTS   AGE
backend-7d8f9b6c4-xxxxx    1/1     Running   0          2m
frontend-5c6d7e8f9-xxxxx   1/1     Running   0          2m
```

> STATUS가 **Running**이고 READY가 **1/1**이면 정상입니다.

```bash
# 더 자세한 상태 확인
kubectl describe pod <pod-name> -n dev

# 로그 확인 (문제가 있을 때)
kubectl logs <pod-name> -n dev
```

**문제가 생겼다면:**
- STATUS가 **ImagePullBackOff** → OCIR 이미지 경로가 맞는지, `ocir-secret`이 해당 namespace에 있는지 확인
- STATUS가 **CrashLoopBackOff** → `kubectl logs <pod-name> -n dev`로 에러 로그 확인
- STATUS가 **Pending** → Node에 리소스가 부족할 수 있음. `kubectl describe pod`로 원인 확인

---

## 파트 8: HTTPS & 도메인 설정

> **이 파트에서 하는 일**: 앱에 도메인(app.yourdomain.com)과 HTTPS(자물쇠)를 연결합니다.
>
> 지금은 클러스터 내부에서만 접근 가능한 상태입니다.
> 외부 사용자가 접근하려면 **Ingress**(진입점)를 설정해야 합니다.

### 스텝 8.1: nginx-ingress-controller 설치

> **한 줄 요약**: 외부 트래픽을 받아서 올바른 서비스로 보내주는 "교통 경찰"을 설치합니다.

**하는 방법:**

```bash
# Helm(쿠버네티스 패키지 매니저)을 설치합니다 — 이미 있다면 건너뛰세요
brew install helm   # Mac
# Linux: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# nginx-ingress 저장소를 추가합니다
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# nginx-ingress-controller를 설치합니다
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

> ⏱️ 설치 후 1~3분 기다리면 OCI Load Balancer가 자동으로 만들어집니다.

**잘 됐는지 확인하기:**

```bash
# 로드밸런서의 External IP를 확인합니다
kubectl get svc -n ingress-nginx
```
→ **EXTERNAL-IP**에 IP 주소가 나오면 성공:
```
NAME                       TYPE           EXTERNAL-IP     PORT(S)
ingress-nginx-controller   LoadBalancer   129.xxx.xxx.x   80:31080/TCP,443:31443/TCP
```

> 이 IP가 우리 앱의 공인 IP입니다. 도메인의 A 레코드를 이 IP로 설정합니다.

---

### 스텝 8.2: cert-manager 설치

> **한 줄 요약**: HTTPS 인증서(자물쇠)를 자동으로 발급받고 갱신하는 도구를 설치합니다.

**하는 방법:**

```bash
# cert-manager를 설치합니다 — Let's Encrypt 무료 인증서를 자동 관리해줍니다
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

**잘 됐는지 확인하기:**

```bash
# cert-manager Pod가 모두 Running인지 확인합니다
kubectl get pods -n cert-manager
```
→ 3개 Pod가 모두 Running이면 성공

---

### 스텝 8.3: ClusterIssuer 만들기

> **한 줄 요약**: "Let's Encrypt에서 인증서를 받아오겠다"고 설정합니다.

**하는 방법:**

`k8s/base/cluster-issuer.yaml` 파일을 만듭니다:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Let's Encrypt의 인증서 발급 서버 주소
    server: https://acme-v02.api.letsencrypt.org/directory
    # 인증서 만료 알림을 받을 이메일
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

```bash
kubectl apply -f k8s/base/cluster-issuer.yaml
```

---

### 스텝 8.4: Ingress 리소스 만들기

> **한 줄 요약**: "이 도메인으로 오면 이 서비스로 보내라"는 라우팅 규칙을 만듭니다.

`k8s/base/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    # nginx-ingress를 사용하겠다
    kubernetes.io/ingress.class: "nginx"
    # cert-manager가 자동으로 인증서를 발급하도록
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    # HTTP → HTTPS 자동 리다이렉트
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - app.yourdomain.com
        - api.yourdomain.com
      secretName: tls-secret  # 인증서가 저장될 Secret 이름
  rules:
    # app.yourdomain.com → frontend 서비스
    - host: app.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
    # api.yourdomain.com → backend 서비스
    - host: api.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 4000
```

```bash
kubectl apply -f k8s/base/ingress.yaml -n production
```

---

### 스텝 8.5: DNS 설정

> **한 줄 요약**: 도메인을 로드밸런서 IP에 연결합니다.

**하는 방법:**

1. 스텝 8.1에서 확인한 **EXTERNAL-IP**를 메모합니다
2. 도메인 관리 사이트(가비아, Namecheap 등)에서:

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | app | 129.xxx.xxx.x (로드밸런서 IP) |
| A | api | 129.xxx.xxx.x (같은 IP) |

> DNS 반영에 최대 24시간 걸릴 수 있지만, 보통 5~30분이면 됩니다.

**잘 됐는지 확인하기:**

```bash
# DNS가 반영됐는지 확인합니다
nslookup app.yourdomain.com
```
→ 로드밸런서 IP가 나오면 성공

```bash
# HTTPS 접속 테스트
curl -I https://app.yourdomain.com
```
→ `HTTP/2 200`이 나오면 성공!

---

## 파트 9: CI/CD (GitHub Actions)

> **이 파트에서 하는 일**: 코드를 GitHub에 push하면 자동으로 테스트 → 빌드 → 배포되도록 파이프라인을 만듭니다.
>
> **CI/CD란?**
> - **CI (Continuous Integration)**: 코드 push → 자동으로 테스트
> - **CD (Continuous Deployment)**: 테스트 통과 → 자동으로 서버에 배포
>
> 매번 수동으로 `docker build` → `docker push` → `kubectl apply` 하는 것을 자동화합니다.

### 스텝 9.1: GitHub Secrets 등록

> **한 줄 요약**: GitHub Actions가 OCI에 접근할 수 있도록 인증 정보를 등록합니다.

**왜 필요한가요?**
CI/CD 파이프라인이 OCIR에 이미지를 push하고 OKE에 배포하려면 OCI 인증 정보가 필요합니다. 이걸 코드에 넣으면 안 되니까 GitHub Secrets에 저장합니다.

**하는 방법:**

1. GitHub → 리포지토리 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**으로 아래 8개를 등록합니다:

| Secret Name | 값 | 어디서 찾나요? |
|-------------|-----|--------------|
| `OCI_TENANCY_OCID` | `ocid1.tenancy.oc1..aaa...` | `cat ~/.oci/config`의 tenancy |
| `OCI_USER_OCID` | `ocid1.user.oc1..aaa...` | `cat ~/.oci/config`의 user |
| `OCI_FINGERPRINT` | `aa:bb:cc:...` | `cat ~/.oci/config`의 fingerprint |
| `OCI_PRIVATE_KEY` | (PEM 키 전체 내용) | `cat ~/.oci/oci_api_key.pem` |
| `OCI_TENANCY_NAMESPACE` | `axle3example` | `oci os ns get` 결과 |
| `OCI_USERNAME` | `your@email.com` | OCI 로그인 이메일 |
| `OCI_AUTH_TOKEN` | (토큰 값) | 스텝 5.2에서 만든 Auth Token |
| `OKE_CLUSTER_ID` | `ocid1.cluster.oc1..aaa...` | 스텝 6.1에서 복사한 Cluster OCID |

---

### 스텝 9.2: GitHub Actions Workflow 작성

> **한 줄 요약**: 자동 배포 파이프라인을 만듭니다.

`.github/workflows/deploy.yml`:

```yaml
# 워크플로우 이름 — GitHub Actions 탭에 표시됩니다
name: Build and Deploy to OCI

# 언제 실행할지: main, develop, staging 브랜치에 push될 때
on:
  push:
    branches: [main, develop, staging]

# 공통 환경변수
env:
  OCI_REGION: ap-seoul-1
  OCIR_REGISTRY: yny.ocir.io
  OCIR_NAMESPACE: ${{ secrets.OCI_TENANCY_NAMESPACE }}
  OKE_CLUSTER_ID: ${{ secrets.OKE_CLUSTER_ID }}

jobs:
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Job 1: 어떤 환경에 배포할지 결정
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  set-env:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.env.outputs.environment }}
      namespace: ${{ steps.env.outputs.namespace }}
    steps:
      - id: env
        run: |
          # 브랜치 이름에 따라 배포 환경을 결정합니다
          # main → production, staging → staging, 나머지 → dev
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "namespace=production" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "namespace=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
            echo "namespace=dev" >> $GITHUB_OUTPUT
          fi

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Job 2: 테스트 실행
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test:
    runs-on: ubuntu-latest
    # frontend와 backend를 동시에(병렬로) 테스트합니다
    strategy:
      matrix:
        app: [frontend, backend]
    steps:
      - uses: actions/checkout@v4

      # pnpm 설치
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      # Node.js 설치 + pnpm 캐시 활성화 (2번째부터 빨라짐)
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: ${{ matrix.app }}/pnpm-lock.yaml

      - name: 의존성 설치 & 테스트 실행
        working-directory: ${{ matrix.app }}
        run: |
          pnpm install --frozen-lockfile
          pnpm lint
          # pnpm test  ← 테스트가 있으면 활성화

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Job 3: Docker 이미지 빌드 & OCIR 푸시
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  build-push:
    needs: [set-env, test]   # set-env와 test가 끝나야 실행
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [frontend, backend]
    steps:
      - uses: actions/checkout@v4

      # OKE 클러스터에 연결 (kubectl 사용 가능하게)
      - name: OKE 클러스터 연결
        uses: oracle-actions/configure-kubectl-oke@v1.5.1
        with:
          cluster: ${{ env.OKE_CLUSTER_ID }}
          region: ${{ env.OCI_REGION }}
          tenancy: ${{ secrets.OCI_TENANCY_OCID }}
          user: ${{ secrets.OCI_USER_OCID }}
          fingerprint: ${{ secrets.OCI_FINGERPRINT }}
          private_key: ${{ secrets.OCI_PRIVATE_KEY }}

      # OCIR에 docker login
      - name: OCIR 로그인
        run: |
          echo "${{ secrets.OCI_AUTH_TOKEN }}" | docker login \
            ${{ env.OCIR_REGISTRY }} \
            -u "${{ env.OCIR_NAMESPACE }}/${{ secrets.OCI_USERNAME }}" \
            --password-stdin

      # Docker 이미지 빌드 & 푸시
      - name: Docker 이미지 빌드 & 푸시
        run: |
          IMAGE=${{ env.OCIR_REGISTRY }}/${{ env.OCIR_NAMESPACE }}/cergy2026/${{ matrix.app }}
          # Git 커밋 해시를 태그로 사용 — 어떤 코드 버전인지 추적 가능
          TAG=${{ github.sha }}

          docker build \
            -t ${IMAGE}:${TAG} \
            -t ${IMAGE}:latest \
            -f ${{ matrix.app }}/Dockerfile \
            ./${{ matrix.app }}

          docker push ${IMAGE}:${TAG}
          docker push ${IMAGE}:latest

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Job 4: OKE에 배포
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deploy:
    needs: [set-env, build-push]   # 이미지가 푸시된 후에 실행
    runs-on: ubuntu-latest
    environment: ${{ needs.set-env.outputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: OKE 클러스터 연결
        uses: oracle-actions/configure-kubectl-oke@v1.5.1
        with:
          cluster: ${{ env.OKE_CLUSTER_ID }}
          region: ${{ env.OCI_REGION }}
          tenancy: ${{ secrets.OCI_TENANCY_OCID }}
          user: ${{ secrets.OCI_USER_OCID }}
          fingerprint: ${{ secrets.OCI_FINGERPRINT }}
          private_key: ${{ secrets.OCI_PRIVATE_KEY }}

      - name: Kubernetes 매니페스트 배포
        run: |
          NAMESPACE=${{ needs.set-env.outputs.namespace }}
          TAG=${{ github.sha }}

          # YAML 파일 안의 IMAGE_TAG를 실제 Git 커밋 해시로 치환합니다
          sed -i "s|IMAGE_TAG|${TAG}|g" k8s/overlays/${NAMESPACE}/*.yaml
          sed -i "s|IMAGE_TAG|${TAG}|g" k8s/base/*.yaml

          # Kustomize로 배포합니다
          kubectl apply -k k8s/overlays/${NAMESPACE}/

      - name: 배포 상태 확인 & 자동 롤백
        run: |
          NAMESPACE=${{ needs.set-env.outputs.namespace }}

          # 5분 이내에 배포가 완료되는지 확인합니다
          # 실패하면 자동으로 이전 버전으로 롤백합니다
          if ! kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=300s; then
            echo "❌ Backend 배포 실패 — 자동 롤백 실행"
            kubectl rollout undo deployment/backend -n ${NAMESPACE}
            kubectl rollout undo deployment/frontend -n ${NAMESPACE}
            exit 1
          fi

          if ! kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=300s; then
            echo "❌ Frontend 배포 실패 — 자동 롤백 실행"
            kubectl rollout undo deployment/frontend -n ${NAMESPACE}
            exit 1
          fi

          echo "✅ 배포 완료!"
```

---

### 스텝 9.3: 테스트 배포

> **한 줄 요약**: develop 브랜치에 push해서 파이프라인이 잘 동작하는지 확인합니다.

**하는 방법:**

```bash
# develop 브랜치에서 push합니다
git checkout develop
git push origin develop
```

**잘 됐는지 확인하기:**

1. GitHub → 리포지토리 → **Actions** 탭 → 워크플로우가 실행 중인지 확인
2. 모든 Job에 녹색 체크(✓)가 뜨면 성공

**문제가 생겼다면:**
- Job 이름을 클릭하면 상세 로그를 볼 수 있습니다
- "OCIR login failed" → GitHub Secrets의 값이 정확한지 확인
- "kubectl: command not found" → `oracle-actions/configure-kubectl-oke` 액션이 올바르게 설정되었는지 확인

---

## 파트 10: 모니터링 & 운영

> **이 파트에서 하는 일**: 배포 후 앱이 잘 동작하는지 모니터링하고,
> 문제가 생겼을 때 대응하는 방법을 배웁니다.

### 스텝 10.1: 기본 모니터링 — kubectl 명령어

> **한 줄 요약**: kubectl로 앱 상태를 확인하는 필수 명령어들입니다.

**자주 쓰는 명령어:**

```bash
# 1. Pod 상태 확인 — "우리 앱 컨테이너들이 잘 돌아가고 있나?"
kubectl get pods -n production

# 2. Pod 로그 보기 — "에러가 나면 여기서 확인"
kubectl logs <pod-name> -n production

# 실시간 로그 보기 (tail -f 같은 것)
kubectl logs <pod-name> -n production -f

# 3. Pod 상세 정보 — "왜 시작이 안 되지?" 할 때 확인
kubectl describe pod <pod-name> -n production

# 4. 배포 이력 확인
kubectl rollout history deployment/backend -n production

# 5. 리소스 사용량 확인 — "CPU나 메모리를 얼마나 쓰고 있나?"
kubectl top pods -n production
```

---

### 스텝 10.2: OCI Logging 설정 (Fluentd)

> **한 줄 요약**: 컨테이너 로그를 OCI Logging 서비스로 자동 수집합니다.
> **쉽게 말하면**: `kubectl logs`는 수동으로 봐야 하지만, Fluentd를 설치하면 모든 로그가 자동으로 OCI에 저장됩니다.

**하는 방법:**

```yaml
# k8s/base/fluentd-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
        - name: fluentd
          image: fluent/fluentd-kubernetes-daemonset:v1-debian-oci
          env:
            - name: OCI_REGION
              value: ap-seoul-1
            - name: OCI_LOG_ID
              valueFrom:
                configMapKeyRef:
                  name: fluentd-config
                  key: log-ocid
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: dockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: dockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

```bash
kubectl apply -f k8s/base/fluentd-daemonset.yaml
```

> **DaemonSet이란?** 모든 Worker Node에 하나씩 자동 배포되는 Pod입니다.
> 각 Node의 로그를 수집해야 하니까 모든 Node에 설치해야 합니다.

**잘 됐는지 확인하기:**

OCI 콘솔 → **Observability & Management** → **Logging** → 로그가 수집되고 있으면 성공

---

### 스텝 10.3: 알람 설정

> **한 줄 요약**: CPU나 메모리가 너무 높으면 알림을 받도록 설정합니다.

**하는 방법:**

```bash
# CPU 80% 초과 시 알람 — 이 상태가 5분 이상 지속되면 알림을 보냅니다
oci monitoring alarm create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "High CPU - Backend" \
  --metric-compartment-id $COMPARTMENT_ID \
  --namespace "oci_computeagent" \
  --query 'CpuUtilization[5m].mean() > 80' \
  --severity "CRITICAL" \
  --destinations "[\"$TOPIC_ID\"]" \
  --is-enabled true
```

> **$TOPIC_ID는 뭔가요?**
> OCI Notifications → **Topic** 을 먼저 만들고, 거기에 이메일을 구독하면 됩니다.
> OCI 콘솔 → **Developer Services** → **Notifications** → **Create Topic** → **Create Subscription** (이메일)

---

### 스텝 10.4: 롤백하는 법

> **한 줄 요약**: 배포한 버전에 문제가 있으면 이전 버전으로 되돌립니다.

**상황**: 새 버전을 배포했는데 에러가 발생! 빨리 이전 버전으로 돌아가야 할 때.

```bash
# 즉시 롤백 — 바로 직전 버전으로 되돌립니다
kubectl rollout undo deployment/backend -n production

# 특정 버전으로 롤백하고 싶다면:
# 1. 배포 이력을 봅니다
kubectl rollout history deployment/backend -n production

# 2. 원하는 리비전 번호로 롤백합니다
kubectl rollout undo deployment/backend -n production --to-revision=3
```

**롤백 후 확인:**
```bash
# 롤백이 완료됐는지 확인합니다
kubectl rollout status deployment/backend -n production
```

---

### 스텝 10.5: 무중단 배포는 어떻게 동작하나요?

> 이미 파트 7에서 설정한 `RollingUpdate`가 무중단 배포를 보장합니다.

**동작 순서:**

```
1. 새 이미지 태그로 Deployment 업데이트
   kubectl set image deployment/backend backend=새이미지:새태그

2. 새 Pod 생성 (기존 Pod은 그대로 유지)
   [기존 Pod A] [기존 Pod B] [새 Pod C 생성 중...]

3. 새 Pod가 readinessProbe를 통과하면 트래픽 전환
   [기존 Pod A] [기존 Pod B → 트래픽 차단] [새 Pod C ← 트래픽 시작]

4. 기존 Pod 종료
   [기존 Pod A → 종료] [새 Pod C] [새 Pod D 생성 중...]

5. 완료
   [새 Pod C] [새 Pod D]
```

> `maxUnavailable: 0`이기 때문에 항상 최소 replica 수만큼의 Pod가 동작합니다.
> 사용자는 배포 중에도 끊김 없이 서비스를 이용할 수 있습니다.

---

## 파트 11: 보안 & 비용 최적화

### 스텝 11.1: OCI Vault로 Secret 관리

> **한 줄 요약**: 비밀번호를 OCI Vault에 안전하게 저장하고, K8s Secret으로 주입합니다.
> **쉽게 말하면**: 비밀번호를 금고(Vault)에 넣어두고, 필요할 때 꺼내 쓰는 방식입니다.

**왜 필요한가요?**
`kubectl create secret`으로 직접 만든 Secret은 클러스터가 삭제되면 사라집니다. Vault에 저장해두면 영구적이고, 접근 권한도 관리할 수 있습니다.

**하는 방법:**

```bash
# 1. Vault(금고) 만들기
oci kms management vault create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "cergy-vault" \
  --vault-type DEFAULT
```

**결과에서 OCID 복사** → `$VAULT_ID`

```bash
# 2. Master Key 만들기 — Vault 안의 데이터를 암호화하는 키
oci kms management key create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "cergy-master-key" \
  --key-shape '{"algorithm":"AES","length":32}' \
  --endpoint $VAULT_MGMT_ENDPOINT
```

> `$VAULT_MGMT_ENDPOINT`는 Vault 생성 결과에서 `management-endpoint` 값입니다.

**결과에서 OCID 복사** → `$KEY_ID`

```bash
# 3. Secret 저장하기 — MongoDB URI를 Vault에 저장
oci vault secret create-base64 \
  --compartment-id $COMPARTMENT_ID \
  --vault-id $VAULT_ID \
  --key-id $KEY_ID \
  --secret-name "prod-mongodb-uri" \
  --secret-content-content "$(echo -n 'mongodb+srv://cergy-app:password@...' | base64)"
```

```bash
# 4. CI/CD에서 Vault의 Secret → K8s Secret으로 주입
kubectl create secret generic app-secrets \
  -n production \
  --from-literal=MONGODB_URI="$(oci secrets secret-bundle get \
    --secret-id $SECRET_ID \
    --query 'data."secret-bundle-content".content' \
    --raw-output | base64 -d)"
```

---

### 스텝 11.2: IAM 최소 권한 설정

> **한 줄 요약**: 각 역할에 필요한 권한만 부여합니다.

**왜 필요한가요?**
모든 사람에게 관리자 권한을 주면, 실수로 운영 DB를 삭제하는 사고가 날 수 있습니다.

**하는 방법:**

OCI 콘솔 → **Identity & Security** → **Policies** → **Create Policy**

```hcl
# CI/CD 계정: 이미지 푸시와 배포만 가능
Allow group ci-cd-group to manage repos in compartment cergy2026
Allow group ci-cd-group to use clusters in compartment cergy2026
Allow group ci-cd-group to read vaults in compartment cergy2026
Allow group ci-cd-group to read secrets in compartment cergy2026

# 개발자: 읽기 + dev 환경만 접근
Allow group dev-group to read all-resources in compartment cergy2026
Allow group dev-group to use clusters in compartment cergy2026

# 관리자: 전체 권한 (최소 인원만)
Allow group admin-group to manage all-resources in compartment cergy2026
```

---

### 스텝 11.3: 보안 체크리스트

배포 전에 아래 항목을 확인하세요:

- [ ] MongoDB Atlas Network Access에 0.0.0.0/0 대신 **NAT Gateway IP만 허용** (운영 환경)
- [ ] OCI Security List에서 **필요한 포트만** 열려 있는지 확인
- [ ] 앱 서버가 **Private Subnet**에 있는지 확인 (외부 직접 접근 차단)
- [ ] HTTPS가 적용되어 있는지 확인 (`http://`로 접근하면 `https://`로 리다이렉트)
- [ ] 환경변수에 비밀번호가 **하드코딩되지 않았는지** 확인
- [ ] GitHub에 `.env.local`이 **커밋되지 않았는지** 확인

---

### 스텝 11.4: 비용 절약 팁

| 항목 | 전략 | 절감 효과 |
|------|------|----------|
| dev DB | MongoDB Atlas M0 (Free Tier) | 무료 |
| dev OKE Worker (목표) | ARM(Ampere) Always Free (4 OCPU, 24GB) | **무료** |
| dev OKE Worker (대기 중) | AMD E4.Flex 1 OCPU/6GB × 1노드 | 월 ~3만원 (임시) |
| prod OKE Worker | Preemptible Instance (비핵심 워크로드용) | 50% 절감 |
| Container Image | 멀티 스테이지 빌드 + Alpine 베이스 (이미 적용됨) | 이미지 크기 80% 감소 |
| Reserved Instance | 1년 약정 (prod Worker Node) | 30~50% 절감 |
| 멀티아키 빌드 | `docker buildx --platform linux/amd64,linux/arm64` | ARM 마이그레이션 무중단 |

> 💡 **ARM 무료 티어 전략**:
> 한국 리전은 ARM capacity 부족이 흔합니다. **AMD로 시작 → ARM 풀리면 마이그레이션**이 현실적입니다.
> 자세한 절차는 [스텝 6.2](#스텝-62-worker-node-pool-만들기) 참고.

---

## 최종 실행 체크리스트

모든 단계를 마쳤는지 확인하세요:

| # | 단계 | 확인 명령/방법 | 완료 |
|---|------|---------------|------|
| 1 | OCI CLI 설치 | `oci --version` | [ ] |
| 2 | OCI CLI 설정 | `oci os ns get` | [ ] |
| 3 | kubectl 설치 | `kubectl version --client` | [ ] |
| 4 | Compartment 생성 | OCI 콘솔에서 확인 | [ ] |
| 5 | VCN + 2 Subnets | OCI 콘솔 → Networking | [ ] |
| 6 | IGW + NAT GW + Route Table | 네트워크 흐름 검증 | [ ] |
| 7 | Security List 규칙 | 포트 443, 80 허용 확인 | [ ] |
| 8 | MongoDB Atlas 클러스터 | `mongosh`로 연결 테스트 | [ ] |
| 9 | Atlas Network Access | IP 허용 설정 확인 | [ ] |
| 10 | Frontend Dockerfile | `docker build` 성공 | [ ] |
| 11 | Backend Dockerfile | `docker build` 성공 | [ ] |
| 12 | docker-compose 로컬 테스트 | `docker compose up` → 3개 서비스 정상 | [ ] |
| 13 | OCIR 레포지토리 생성 | OCI 콘솔 → Container Registry | [ ] |
| 14 | OCIR 이미지 푸시 | `docker push` 성공 확인 | [ ] |
| 15 | OKE 클러스터 생성 | `kubectl get nodes` → Ready | [ ] |
| 16 | Worker Node Pool 활성화 | 노드 2개 Ready 확인 | [ ] |
| 17 | K8s Namespace 생성 | dev, staging, production | [ ] |
| 18 | K8s Secrets 생성 | `ocir-secret`, `app-secrets` | [ ] |
| 19 | nginx-ingress 설치 | `kubectl get svc -n ingress-nginx` → EXTERNAL-IP 확인 | [ ] |
| 20 | cert-manager 설치 | `kubectl get pods -n cert-manager` → Running | [ ] |
| 21 | DNS 레코드 설정 | `nslookup app.yourdomain.com` | [ ] |
| 22 | GitHub Secrets 등록 | 8개 모두 등록 | [ ] |
| 23 | develop → dev 배포 | GitHub Actions 파이프라인 성공 | [ ] |
| 24 | staging → stg 배포 | 파이프라인 성공 | [ ] |
| 25 | main → prod 배포 | HTTPS 접속 확인 | [ ] |
| 26 | 롤백 테스트 | `kubectl rollout undo` 검증 | [ ] |

### GitHub Secrets 등록 목록

| Secret Name | 설명 | 어디서 찾나요? |
|-------------|------|--------------|
| `OCI_TENANCY_OCID` | 테넌시 OCID | `~/.oci/config` |
| `OCI_USER_OCID` | CI/CD 사용자 OCID | `~/.oci/config` |
| `OCI_FINGERPRINT` | API Key 지문 | `~/.oci/config` |
| `OCI_PRIVATE_KEY` | API Key 개인키 (PEM) | `~/.oci/oci_api_key.pem` |
| `OCI_TENANCY_NAMESPACE` | OCIR 네임스페이스 | `oci os ns get` |
| `OCI_USERNAME` | OCIR 로그인 사용자 | OCI 로그인 이메일 |
| `OCI_AUTH_TOKEN` | OCIR 인증 토큰 | OCI 콘솔 → My Profile → Auth Tokens |
| `OKE_CLUSTER_ID` | OKE 클러스터 OCID | OCI 콘솔 → OKE → 클러스터 상세 |
