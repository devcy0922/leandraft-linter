# Overfit Checker — 배포 가이드 (Vercel & GCP Cloud Run)

이 문서는 `overfit-checker` 애플리케이션을 Vercel과 GCP(Google Cloud Platform) Cloud Run 환경에 배포하고 연동하는 가이드라인을 제공합니다.

---

## 1. 공통 LLM 설정 및 보안

`overfit-checker`는 LLM 인프라와 통신하기 위해 다음 환경 변수가 필요합니다. 배포 플랫폼별 대시보드나 CLI 설정 시 반드시 입력해야 합니다.

| 환경 변수명 | 설명 | 예시 |
|---|---|---|
| `LLM_BASE_URL` | OpenAI 호환 LLM 게이트웨이 엔드포인트 URL | `https://your-llm-gateway.com/v1` |
| `LLM_MODEL` | 분석에 사용할 모델명 | `auto` 또는 `gpt-4o-mini` |
| `LLM_API_KEY` | LLM 게이트웨이 호출용 Bearer API Key | `your-gateway-api-key` |
| `JWT_SECRET` | 레거시 JWT 배포 호환용 공유 비밀 키 (`LLM_API_KEY`가 없을 때만 사용) | `your-shared-jwt-secret-key` |

> [!IMPORTANT]
> - **보안**: API 키와 `JWT_SECRET`은 공개 저장소(Git)에 절대 노출하지 마십시오.
> - **인증 우선순위**: `src/llm/client.ts`는 `LLM_API_KEY`가 있으면 Bearer API Key로 게이트웨이에 요청하고, 값이 없을 때만 `JWT_SECRET` 기반 15분 만료 토큰을 발행합니다.

---

## 2. Vercel 배포 가이드

Vercel은 프론트엔드(Vue 3 SPA)와 백엔드 API(Serverless Function)를 서버리스 아키텍처로 동시에 호스팅하기에 가장 이상적입니다.

### 2.1 사전 요구 사항
- 로컬에 [Vercel CLI](https://vercel.com/cli) 설치 (`npm install -g vercel`)
- Vercel 계정 및 CLI 로그인 (`vercel login`)

### 2.2 설정 파일 검토 (`vercel.json`)
프로젝트 루트의 `vercel.json` 설정에 따라 Vercel이 빌드하고 서빙을 제어합니다.
```json
{
  "buildCommand": "pnpm --filter frontend build",
  "outputDirectory": "frontend/dist",
  "installCommand": "pnpm install",
  "framework": null,
  "functions": {
    "api/check.ts": {
      "memory": 256,
      "maxDuration": 30
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2.3 로컬 개발 및 에뮬레이션
로컬에서 Vercel 환경과 동일하게 서버리스 함수(`api/check.ts`)와 프론트엔드를 기동하여 테스트할 수 있습니다.
```bash
# Vercel 로컬 에뮬레이터 실행
vercel dev
```

### 2.4 프로덕션 배포
CLI를 통해 수동 배포하거나, GitHub 연동을 통한 자동 배포를 권장합니다.

#### CLI 수동 배포
```bash
# Vercel 프로젝트 초기화 및 임시 배포
vercel

# 프로덕션 배포 반영
vercel --prod
```

> [!IMPORTANT]
> **Git Commit Author Verification(이메일 검증) 오류 조치**:
> `vercel --prod` 실행 시 커밋 이메일(`kin123d@gmail.com`)이 Vercel에 매핑된 계정과 불일치하여 빌드가 거부되는 현상이 발생하면, 터미널에서 Git 사용자 이메일을 Vercel 가입 메일과 일치하도록 임시 변경한 뒤 재배포해야 합니다.
> ```bash
> git config user.email "kin123d@gmail.com"
> npx vercel --prod
> ```

#### GitHub / GitLab Git Integration 자동 배포 (권장)
1. Vercel Dashboard 접속 후 **New Project** 클릭
2. `overfit-checker` 저장소 연결
3. **Environment Variables** 탭에 상기 LLM 환경 변수 입력:
   - `LLM_BASE_URL`
   - `LLM_MODEL`
   - `LLM_API_KEY`
4. **Deploy** 버튼 클릭. 이후 `main` 브랜치 push 시 자동 빌드 및 배포됩니다.

---

## 3. GCP Cloud Run 배포 가이드

GCP Cloud Run은 Docker 컨테이너를 구동하여 트래픽에 맞춰 자동으로 스케일링되는 서버리스 컨테이너 서비스입니다. CLI + Express UI 전체를 패키징하여 배포할 때 유용합니다.

### 3.1 사전 요구 사항
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) 설치 및 인증
- 대상 GCP 프로젝트 설정 및 청구 활성화
- Container/Artifact Registry 및 Cloud Run API 활성화

### 3.2 Docker 이미지 빌드 및 업로드 (Artifact Registry)

GCP Artifact Registry에 리포지토리를 생성한 뒤 빌드한 이미지를 푸시합니다.

```bash
# 1. 환경 변수 정의
PROJECT_ID="your-gcp-project-id"
REGION="asia-northeast3" # 서울 리전 예시
REPO_NAME="overfit-checker-repo"
IMAGE_NAME="overfit-checker"
TAG="latest"

# 2. Artifact Registry 리포지토리 생성 (최초 1회)
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Overfit Checker Docker repository"

# 3. Docker 인증 구성
gcloud auth configure-docker $REGION-docker.pkg.dev

# 4. 로컬 Docker 빌드 (M1/M2 맥 등에서 빌드 시 target platform 주의)
# Cloud Run은 amd64 환경이므로, Multi-platform 빌드를 권장합니다.
docker buildx build --platform linux/amd64 \
    -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:$TAG \
    --push .
```

### 3.3 Cloud Run 배포

업로드된 컨테이너 이미지를 기반으로 서비스를 생성합니다. Cloud Run은 기동 시 자동으로 `PORT` 환경 변수를 주입하므로, 컨테이너 내 Express 웹 서버가 `process.env.PORT` 포트로 리스닝해야 합니다. (이미 CLI 코드에서 보완되었습니다.)

```bash
# Cloud Run 배포 실행
gcloud run deploy overfit-checker \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:$TAG \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="LLM_BASE_URL=https://your-llm-gateway.com/v1,LLM_MODEL=auto" \
    --set-secrets="LLM_API_KEY=overfit-gateway-api-key:latest"
```

> [!TIP]
> - GCP 환경에서는 `LLM_API_KEY`, `JWT_SECRET`과 같은 민감한 비밀값을 일반 환경 변수(`--set-env-vars`) 대신 GCP **Secret Manager**를 연동하여 보안 주입하는 것을 강력히 권장합니다. (`--set-secrets`)

---

## 4. 환경 변수 및 헬스 체크

Cloud Run에 배포된 서비스는 다음과 같이 설정되어 정상 동작함을 보장합니다.
- **Port**: 기본 포트는 `8080` (Cloud Run 디폴트) 또는 `3000`입니다.
- **Startup & Liveness Probe**:
  - Cloud Run은 자동으로 컨테이너의 포트로 TCP 포트 체크를 수행하므로 별도의 헬스체크 엔드포인트를 지정하지 않아도 포트 바인딩이 성공하면 정상으로 판단합니다.
