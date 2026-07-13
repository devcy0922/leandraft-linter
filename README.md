# LeanDraft-Linter

LeanDraft-Linter는 설계 문서, PR 계획서(Markdown)를 입력받아 현재 문제 대비 설계가 과도한지를 판독하고, 더 작은 대안을 제시하는 린터 도구입니다.

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
