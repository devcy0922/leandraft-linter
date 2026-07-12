# Overfit Checker — AI Collaboration Guide

이 파일은 Codex, Antigravity 등 AI 코딩 에이전트가 이 레포지토리에 기여할 때 따라야 할 작업 가이드입니다.

---

## 프로젝트 방향

**Overfit Checker**는 설계 문서, PR 계획, README를 입력받아
"이거 과한가?"를 판독하고 더 작은 대안을 제시하는 **독립 CLI 및 로컬 웹 UI 도구**입니다.

### 관계
```text
Govail (AI Governance Platform)
    ↑ 사용
overfit-checker (설계 검증 도구 - CLI & Web UI)
    ↑ 배포
Vercel (프론트엔드 + Serverless API)
```

Govail의 일부가 아니며 독립적으로 실행 가능합니다.

### 고베일 대규모 개편 및 포크 저장소 유지 사유
1. **고베일 대규모 개편 (Decomposition)**
   - 고베일 에코시스템이 모노레포 구조에서 개별 독립 리포지토리로 분해(Decomposition)되었습니다.
   - 이에 따라 `overfit-checker`는 완전히 독립된 CLI 및 로컬 웹 UI 프로젝트로 운영됩니다.
   - LLM 연동 방식이 기존의 고정 API Key 방식에서 **단기 만료형(15분) JWT 토큰 발행 및 검증 방식**으로 전면 개편되었습니다.
2. **포크 저장소 유지 사유 (yoonCY/overfit-checker)**
   - **원본 저장소**: `https://github.com/GoVail/overfit-checker`
   - **포크 저장소 (우리 프로젝트)**: `https://github.com/yoonCY/overfit-checker`
   - **유지 사유**: Vercel 서버리스 환경(`api/check.ts` Serverless Function)에 실시간 배포 및 웹 UI 서비스를 업로드하고 테스트하기 위함입니다.
   - **기여 시 주의**: 원본 upstream 리포지토리의 최신 코드를 지속적으로 반영(싱크)하되, 우리 프로젝트 고유의 Vercel 배포 관련 커스텀 설정(예: JWT 서명 로직 `generateGatewayToken()`, `vercel.json` 설정, 배포 가이드 문서 등)이 손상되거나 삭제되지 않도록 유지해야 합니다.

---

## 현재 구현 상태 (2026-06-21 기준)

| 상태 | 항목 |
|---|---|
| ✅ 완료 | CLI `check` 서브커맨드 (파일/stdin, text/json/markdown 출력) |
| ✅ 완료 | CLI `overfit-check <file>` 최상위 파일 인수 지원 |
| ✅ 완료 | CLI `ui` 서브커맨드 (로컬 웹 서버 + 브라우저 자동 오픈, 테스트 전용) |
| ✅ 완료 | Express v5 API 서버 (`POST /api/check`) — devDependency, 로컬 테스트 전용 |
| ✅ 완료 | Vercel Serverless Function (`api/check.ts`) — 프로덕션 API |
| ✅ 완료 | Vue 3 + Vite 프론트엔드 (다크/라이트 모드, 샘플 로드, 규모 비교 UI) |
| ✅ 완료 | OpenAI-compatible LLM 클라이언트 (zod 검증) |
| ✅ 완료 | Markdown 파서 (최대 12,000자 제한, 토큰 추정) |
| ✅ 완료 | Zod 스키마 (`OverfitResult` — problem_size, solution_size 포함) |
| ✅ 완료 | 터미널 렌더러 (text/json/markdown 3종, 규모 불균형 탐지 출력) |
| ✅ 완료 | Dockerfile 멀티스테이지 빌드 + docker-compose.yml |
| ✅ 완료 | Vitest 단위 테스트 (parser, schema) |
| ✅ 완료 | 예제 문서 9종 (`examples/`) |
| ✅ 완료 | Vercel 배포 설정 (`vercel.json`, `.vercelignore`) |

---

## 컴포넌트 구조

| 디렉토리/파일 | 역할 |
|---|---|
| `src/index.ts` | CLI 진입점 (`overfit-check` 바이너리, Commander.js v12, 최상위 파일 인수 지원) |
| `src/commands/check.ts` | `check` 서브커맨드 (파일/stdin 입력, text/json/markdown 출력 포맷) |
| `src/commands/ui.ts` | `ui` 서브커맨드 (Express 서버 기동 + OS별 브라우저 자동 오픈, 로컬 테스트 전용) |
| `src/server.ts` | Express v5 기반 `POST /api/check` API + `frontend/dist` 정적 서빙 + SPA 폴백 (로컬 전용) |
| `api/check.ts` | **Vercel Serverless Function** — Express 없이 `analyzeDocument()` 직접 호출 |
| `frontend/` | Vite + Vue 3 + TypeScript (pnpm 워크스페이스, 다크/라이트 모드) |
| `frontend/src/App.vue` | 메인 SPA (마크다운 입력, 분석 요청, 결과 표시, 규모 비교 배지, 샘플 로드) |
| `frontend/src/style.css` | CSS 변수 기반 테마 (다크/라이트), 스켈레톤 로더, size-comparison 스타일 |
| `src/llm/client.ts` | OpenAI SDK v4 클라이언트 (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) |
| `src/llm/prompt.ts` | 시스템 프롬프트(YAGNI/KISS 페르소나, problem_size/solution_size 판정 기준) + `buildUserPrompt()` |
| `src/parser/markdown.ts` | `parseFile()` / `parseStdin()` — 최대 12,000자 잘라내기, 토큰 수 추정 |
| `src/schema/result.ts` | Zod 스키마 (`OverfitResultSchema`) + 타입 export |
| `src/ui/render.ts` | `renderResult()` / `renderJson()` / `renderMarkdown()` — chalk + 점수 바 + 규모 불균형 탐지 |
| `examples/` | 테스트용 샘플 설계 문서 9종 |
| `tests/` | Vitest 단위 테스트 (`parser.test.ts`, `schema.test.ts`) |
| `Dockerfile` | 멀티스테이지 빌드 (base → builder → runner, Alpine + Node 20) |
| `docker-compose.yml` | 컨테이너 실행 구성 (포트 3000, `.env` 파일 주입) |
| `vercel.json` | Vercel 배포 설정 (빌드 명령, Serverless Function 라우팅, SPA 폴백) |
| `.vercelignore` | Vercel 배포 제외 파일 목록 |
| `biome.json` | Biome 린터/포매터 설정 |
| `tsup.config.ts` | CLI 빌드 설정 (ESM, shebang `#!/usr/bin/env node` 자동 삽입, Node 20 target) |
| `pnpm-workspace.yaml` | pnpm 모노레포 워크스페이스 (`frontend/` 포함) |

---

## package.json 의존성 분리 원칙

```
dependencies (프로덕션 런타임)
├── commander     — CLI 프레임워크
├── chalk, ora    — 터미널 출력
├── openai        — LLM 클라이언트
├── zod           — 스키마 검증
├── dotenv        — 환경변수 로딩
└── @clack/prompts — 인터랙티브 CLI

devDependencies (로컬 개발/테스트 전용)
├── express, @types/express — 로컬 overfit-check ui 서버
├── @vercel/node            — Vercel Function 타입
├── @biomejs/biome          — 린터/포매터
├── tsup, tsx, typescript   — 빌드/실행 도구
└── vitest                  — 단위 테스트
```

> **중요**: `express`는 `devDependencies`입니다. Vercel 프로덕션 배포 시 포함되지 않습니다.
> 로컬 `overfit-check ui` 서브커맨드는 Express를 사용하지만, 프로덕션 API는 `api/check.ts` Serverless Function을 사용합니다.

---

## 핵심 데이터 스키마 (`src/schema/result.ts`)

```typescript
OverfitResult = {
  complexity_score: number(1-10),               // 복잡도 점수
  verdict: '적정' | '주의' | '과도',             // 1~4: 적정, 5~7: 주의, 8~10: 과도
  problem_size: 'Tiny'|'Small'|'Medium'|'Large'|'Enterprise', // 문제 규모
  solution_size: 'Script'|'Library'|'Service'|'Platform'|'Ecosystem', // 해결책 규모
  overfit_items: OverfitItem[],                 // 과도한 설계 요소 (최대 5개)
  alternative: Alternative,                     // 더 작은 대안 (description + savings)
  next_tasks: NextTask[3],                      // 다음 최소 작업 정확히 3개
  summary: string,                              // 한 줄 요약
}
```

---

## 제품 원칙

- **Minimal**: 의존성을 최소화한다. DB, 외부 복잡한 인프라 없이 동작해야 한다.
- **Standalone**: Govail 게이트웨이 없이도 `.env`에서 LLM URL만 바꾸면 동작한다.
- **Honest**: 탐지 결과는 근거와 함께 제시한다. 막연한 "복잡하다"는 금지.
- **Safe Demos**: 예제는 실제 API 키 없이 mock 환경에서 실행 가능해야 한다.

---

## 엔지니어링 워크플로우

```bash
# 의존성 설치 (루트 + frontend 워크스페이스)
pnpm install

# CLI 개발 실행 (빌드 없이 tsx로 직접 실행)
pnpm dev -- check examples/govail-runtime-spec.md
pnpm dev -- examples/govail-runtime-spec.md       # 최상위 인수 방식 (동일 동작)
pnpm dev -- ui --port 3000                        # 로컬 Express 서버 (테스트 전용)

# Vercel 로컬 에뮬레이션 (api/check.ts 포함)
vercel dev

# Docker 기반 실행 (로컬 빌드 후 컨테이너 실행)
docker compose up --build

# 빌드 (frontend 먼저, 그 다음 CLI)
pnpm build

# 빌드 후 실행
node dist/index.js check examples/govail-runtime-spec.md
node dist/index.js ui --port 3000

# 전체 검사
pnpm check   # lint(biome) + typecheck(tsc) + test(vitest)

# 개별 실행
pnpm lint        # biome check src tests
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm fmt         # biome format --write src tests

# Vercel 배포
vercel --prod
```

---

## LLM 설정 가이드

`.env` 파일 기준 (`.env.example` 복사 후 편집):

| 시나리오 | `LLM_BASE_URL` | `JWT_SECRET` | `LLM_MODEL` | 비고 |
|---|---|---|---|---|
| Govail 게이트웨이 (사설망) | `http://192.168.0.5:8080/v1` | `52f2bc1dff...` (등록된 Secret) | `auto` | macmini 게이트웨이 경유 (JWT 인증 강제) |
| Govail 게이트웨이 (Vercel) | `https://<public-gateway-url>/v1` | `<shared-secret-key>` | `auto` | Vercel 배포 시 15분 단기 JWT 자동 서명 발행 |
| OpenAI 직접 (비권장) | `https://api.openai.com/v1` | (JWT_SECRET 미설정 후 client.ts 별도 커스텀 필요) | `gpt-4o-mini` | 외부 클라우드 직접 연동 |

**Vercel 배포 시**: Vercel 대시보드 → Project Settings → Environment Variables에서 `LLM_BASE_URL`, `LLM_MODEL`, 및 `JWT_SECRET`을 필수로 설정합니다. (고정 API Key는 더 이상 지원되지 않습니다.)

---

## 배포 및 클라우드 호스팅 가이드

애플리케이션은 서버리스(Vercel) 및 컨테이너(GCP Cloud Run) 환경으로 배포 가능하며, 상세 지침은 [docs/deployment.md](docs/deployment.md)에 통합 관리됩니다. AI 에이전트는 기여 시 다음 핵심 규칙을 인지하고 있어야 합니다.

### Vercel 배포 핵심 규칙
- **빌드 커맨드**: `pnpm --filter frontend build`
- **출력 디렉토리**: `frontend/dist`
- **서버리스 API**: `api/check.ts` (`express`를 타지 않고 직접 실행하므로 `api/check.ts` 코드 변경 시 주의)
- **Git Commit 이메일 검증 오류 조치**: Vercel의 Commit Author Verification 보안 규칙에 의해 배포가 차단되는 경우, 로컬 Git의 이메일 설정(`git config user.email`)을 Vercel에 가입된 GitHub 이메일(`kin123d@gmail.com`)로 임시/영구 변경하여 배포해야 합니다.

### GCP Cloud Run 배포 핵심 규칙
- **포트 매핑**: GCP Cloud Run이 동적으로 주입하는 `PORT` 환경 변수를 기본값으로 감지하도록 구성되었습니다. CLI `ui` 서브커맨드는 기본적으로 `process.env.PORT || "3000"` 포트로 바인딩됩니다.
- **보안 설정**: `JWT_SECRET`과 같은 자격 증명은 일반 환경 변수 대신 GCP Secret Manager에 등록 후 Cloud Run 서비스에 마운트하여 기동해야 합니다.

---

## 현재 하지 말 것

- DB 또는 영속성 레이어 추가 (상태 없는 도구)
- Govail 내부 컴포넌트(Temporal, SurrealDB)에 의존
- 실제 API 키 또는 내부 호스트명 커밋
- 분석 결과 서버 전송 (로컬 전용)
- `express`를 `dependencies`로 이동 (로컬 테스트 전용으로 `devDependencies` 유지)
- `frontend/src/components/HelloWorld.vue` 삭제 전 App.vue 의존 확인 필요 (현재 미사용)

---

## 버전 관리

- API 스키마 불안정 기간: `v0.x.y` 태그 사용
- `pnpm-lock.yaml` 커밋 유지
- `.env`는 절대 커밋 금지, `.env.example`만 커밋
- `examples/test_0621.md` 등 임시 테스트 파일은 정기적으로 정리
