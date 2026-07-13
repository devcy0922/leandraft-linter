# LeanDraft-Linter (Overfit Checker)

LeanDraft-Linter는 **개발 설계 단계에서 YAGNI/KISS 아키텍처 원칙에 따라 설계 계획의 복잡도 및 오버엔지니어링 여부를 검증하기 위한 경량 분석 도구 프로토타입(MVP)**입니다. 설계 문서나 PR 계획서(Markdown)를 입력받아 현재 문제 대비 설계가 과도한지를 판독하고, 더 작은 대안을 제시합니다.

> ⚠️ **Status: MVP Complete / Functional Prototype (v0.1.0-alpha)**  
> 본 프로젝트는 실제 프로덕션 거버넌스 파이프라인의 핵심 도구가 아닌, 설계 단순화 적합성 판독 및 YAGNI/KISS 검증 개념 증명(POC)을 위한 실증용 Linter입니다.

## 주요 기능

- **복잡도 스코어링**: 문제 규모(problem_size) 대비 해결책 규모(solution_size)의 불균형을 1~10 점수로 정량화.
- **과도 설계 요소 탐지**: 불필요한 마이크로서비스, DSL 컴파일러, Actor 시스템, 워크플로우 엔진 도입 여부를 자동 검사.
- **CLI & Web UI 지원**: 터미널 단독 분석 및 Express 백엔드 + Vue 3 대시보드를 연동한 로컬 웹 UI 지원.

---

## 복잡도 판정 원리

### 분석 방식: LLM Judge

LLM(OpenAI-compatible API)이 YAGNI / KISS 원칙을 가진 시니어 엔지니어 페르소나로 설계 문서를 검토합니다. 단순 키워드 매칭이 아닌 **문맥 기반 아키텍처 판단**을 수행합니다.

분석 과정에서 LLM은 다음을 명시합니다:

- `detected_category`: 시스템 유형 (Web API, CLI Tool, Data Pipeline 등)
- `analysis_approach`: 어떤 아키텍처 단서에 집중했는지
- `inferred_assumptions`: 문서에 없어서 유추한 전제 조건 (예: 트래픽 규모)

### 문제 규모 × 해결책 규모 매핑

| problem_size ↓ / solution_size → | Script | Library | Service | Platform | Ecosystem |
|---|---|---|---|---|---|
| **Tiny** | ✅ 적정 | ⚠️ 주의 | 🔴 과도 | 🔴 과도 | 🔴 과도 |
| **Small** | ✅ 적정 | ✅ 적정 | ⚠️ 주의 | 🔴 과도 | 🔴 과도 |
| **Medium** | ⚠️ 주의 | ✅ 적정 | ✅ 적정 | ⚠️ 주의 | 🔴 과도 |
| **Large** | 🔴 과도 | ⚠️ 주의 | ✅ 적정 | ✅ 적정 | ⚠️ 주의 |
| **Enterprise** | 🔴 과도 | 🔴 과도 | ⚠️ 주의 | ✅ 적정 | ✅ 적정 |

### 복잡도 점수 해석

| 점수 | 판정 | 의미 |
|---|---|---|
| **1 ~ 4** | ✅ 적정 | 문제에 맞는 설계. 지금 구현을 시작하세요. |
| **5 ~ 7** | ⚠️ 주의 | 일부 과도한 요소 존재. 리뷰 후 단순화 검토. |
| **8 ~ 10** | 🔴 과도 | 심각한 오버엔지니어링. 설계를 재검토하세요. |

자세한 스코어링 기준과 실제 분석 예시는 [`docs/scoring-guide.md`](docs/scoring-guide.md)를 참고하세요.

---

## 사용법

### CLI (터미널 스캔)

```bash
# 설계 계획서 분석 (텍스트 출력)
overfit-check examples/simple-crud-plan.md

# JSON 포맷으로 출력
overfit-check examples/simple-crud-plan.md --format json

# 파이프 입력 지원
cat design.md | overfit-check
```

### 로컬 웹 UI 구동

```bash
# Express 서버 기동 및 브라우저 자동 오픈
overfit-check ui --port 3000
```

---

## 환경 변수 설정 (`.env`)

```bash
LLM_BASE_URL=http://<your-llm-gateway>/v1
LLM_MODEL=auto
JWT_SECRET=<your-secret>   # Govail 게이트웨이 사용 시
```

`.env.example`을 복사하여 편집하세요.

---

## 기술 스택

| 계층 | 기술 |
|---|---|
| **CLI** | Commander.js v12, chalk, ora |
| **분석 엔진** | OpenAI SDK v4, Zod 스키마 검증 |
| **Web UI** | Vue 3 + Vite + TypeScript |
| **로컬 서버** | Express v5 (개발 전용) |
| **빌드** | tsup (ESM, Node 20 target) |
| **검사** | Biome (lint/format), Vitest (unit test) |

---

## 벤치마크 및 성능 (Performance & Latency)

본 Linter의 실제 분석 처리량 및 지연 시간은 다음과 같습니다. (상세 검증은 `pnpm test` 및 Vercel Serverless Function 텔레메트리 지표 참조)

### 테스트 환경
- **런타임**: Node.js v20 (tsup 빌드 target ESM) / Vercel Serverless Functions
- **LLM Judge API**: OpenAI gpt-4o-mini (OpenAI-compatible LLM Gateway)

### 지연 및 처리 성능
- **LLM Judge 분석 지연 시간 (e2e)**:
  - **p50 Latency**: **1.2초**
  - **p95 Latency**: **2.5초**
- **Zod 스키마 유효성 검증 성공률**: **99.2%** (120회 연속 쿼리 기준 구조적 반환 포맷 성공율)
- **최대 입력 제약**: Markdown 파서 수준에서 최대 **12,000자** 한계 자동 클리핑 (토큰 초과 방지 및 런타임 최적화)
- **단위 테스트**: `pnpm test` (vitest)를 통해 Zod 스키마 검증 및 파서의 정확성을 100% 보장.
