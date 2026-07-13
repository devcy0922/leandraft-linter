# LeanDraft-Linter 복잡도 스코어링 가이드

이 문서는 LeanDraft-Linter가 설계 문서를 판정하는 기준과 실제 분석 사례를 설명합니다.

---

## 1. 분석 파이프라인

```
입력 (Markdown 파일 또는 stdin)
        │
        ▼
parseFile() / parseStdin()
  └─ 최대 12,000자 잘라내기 + 토큰 수 추정
        │
        ▼
buildUserPrompt(document)
  └─ LLM 시스템 프롬프트 + 사용자 문서 결합
        │
        ▼
LLM (OpenAI-compatible API)
  └─ YAGNI/KISS 페르소나 시니어 엔지니어 분석
        │
        ▼
OverfitResultSchema (Zod 검증)
  └─ 스키마 불일치 시 예외 처리
        │
        ▼
renderResult() / renderJson() / renderMarkdown()
```

---

## 2. 문제 규모 (problem_size) 기준

| 값 | 기준 | 예시 |
|---|---|---|
| `Tiny` | 개인 스크립트, 단발성 자동화, 사용자 1~2명 | 개인 할 일 앱, 로컬 파일 변환 스크립트 |
| `Small` | 팀 내부 도구, 사이드 프로젝트, 사용자 10~100명 | 소규모 팀 슬랙 봇, 사내 데이터 변환 도구 |
| `Medium` | 스타트업 MVP, 팀 단위 서비스, 사용자 100~10,000명 | SaaS MVP, B2B 내부 플랫폼 |
| `Large` | 성장 단계 제품, 수십만 사용자, 복수 팀 | 중견 스타트업 핵심 서비스 |
| `Enterprise` | 대규모 조직, 수백만 사용자, 컴플라이언스 요구 | 금융·의료 플랫폼, 글로벌 서비스 |

---

## 3. 해결책 규모 (solution_size) 기준

| 값 | 기준 | 예시 |
|---|---|---|
| `Script` | 단일 파일, 함수 모음, 외부 의존성 최소 | Python 스크립트, bash 자동화 |
| `Library` | 패키지화된 재사용 모듈, npm/pypi 배포 단위 | SDK, 유틸리티 라이브러리 |
| `Service` | 독립 실행 API 서버, 하나의 프로세스 | REST API, 단일 백엔드 서버 |
| `Platform` | 여러 서비스 + 인프라 조합 | 메시지 큐, 분산 캐시, 복수 마이크로서비스 |
| `Ecosystem` | DSL/런타임/플러그인 시스템, 자체 생태계 구축 | 언어 런타임, 플러그인 아키텍처 |

---

## 4. 과도한 설계 탐지 패턴

LLM이 다음 요소의 **존재 + 근거 유무**를 함께 평가합니다:

| 패턴 | 위험 신호 |
|---|---|
| Kafka, RabbitMQ, NATS | 현재 요구사항에 비동기 메시징이 명시되지 않은 경우 |
| CQRS, Event Sourcing | 단순 CRUD로 해결 가능한 경우 |
| Actor 시스템 (Akka, Proto.Actor) | 순차 처리로 충분한 경우 |
| 워크플로우 엔진 (Temporal, Airflow) | 단순 스크립트 파이프라인 수준인 경우 |
| 전용 DSL / 컴파일러 | 범용 언어로 해결 가능한 경우 |
| 플러그인 시스템 | 현재 요구 확장점이 2개 이하인 경우 |
| gRPC + Protobuf | 동일 프로세스 내 통신이거나 클라이언트가 1개인 경우 |
| GraphQL | 단일 프론트엔드 클라이언트만 있는 경우 |
| 마이크로서비스 분리 | 팀이 1~2명이거나 경계가 불명확한 경우 |

---

## 5. 복잡도 점수 산정 기준

| 점수 | 판정 | 의미 |
|---|---|---|
| **1 ~ 4** | ✅ 적정 | problem_size와 solution_size가 균형 잡힘. 지금 구현을 시작해도 됨. |
| **5 ~ 7** | ⚠️ 주의 | 일부 과도한 설계 요소 존재. overfit_items 목록 검토 후 단순화 여부 결정. |
| **8 ~ 10** | 🔴 과도 | 심각한 오버엔지니어링. alternative의 더 작은 대안을 우선 검토할 것. |

점수는 problem_size × solution_size 불균형 수준 + 탐지된 과도 설계 요소 수에 비례하여 산정됩니다.

---

## 6. 실제 분석 사례

### 사례 1 — ✅ 적정 (점수: 2/10)

**입력 파일**: `examples/simple-crud-plan.md`

```
할 일 목록 앱 — Node.js + Express + SQLite + React
개발자 1명, 예상 사용자 2~3명
```

**분석 결과 요약**

| 항목 | 값 |
|---|---|
| `complexity_score` | 2 |
| `verdict` | 적정 |
| `problem_size` | Tiny |
| `solution_size` | Service |
| `overfit_items` | 없음 |
| `summary` | 개인 프로젝트 규모에 적합한 스택 선택. 지금 바로 구현 시작 가능. |

**next_tasks**

1. `todos` 테이블 스키마 작성 및 SQLite 초기화
2. CRUD 엔드포인트 4개 구현 (POST/GET/PATCH/DELETE)
3. React 프론트엔드 기본 UI 구성

---

### 사례 2 — 🔴 과도 (점수: 9/10)

**입력 파일**: `examples/govail-runtime-spec.md`

```
파일 의존성 분석 도구 — DSL 컴파일러 + Actor 시스템 + Plugin 시스템 + Workflow Engine + 분산 그래프 저장소
개발자 1명, 예상 사용자 3명
```

**분석 결과 요약**

| 항목 | 값 |
|---|---|
| `complexity_score` | 9 |
| `verdict` | 과도 |
| `problem_size` | Tiny |
| `solution_size` | Ecosystem |
| `overfit_items` | DSL 컴파일러, Actor 시스템, Plugin 시스템, Workflow Engine, 분산 그래프 저장소 (5개) |
| `summary` | 3명을 위한 의존성 분석 도구에 자체 생태계 수준 인프라 도입. |

**alternative**

> TypeScript + ts-morph 라이브러리로 의존성 그래프를 JSON 파일로 출력하는 단일 스크립트.  
> 12주 일정 → 3일로 단축 가능.

---

### 사례 3 — ⚠️ 주의 (점수: 6/10)

**입력 파일**: `examples/orchestra-positioning-spec.md`

**분석 결과 요약**

| 항목 | 값 |
|---|---|
| `complexity_score` | 6 |
| `verdict` | 주의 |
| `problem_size` | Small |
| `solution_size` | Platform |
| `overfit_items` | 멀티 에이전트 오케스트레이션 레이어, 플러그인 레지스트리 |
| `summary` | 핵심 기능 구현 전 조율 인프라를 먼저 설계하는 순서 역전 위험. |

**next_tasks**

1. 단일 에이전트로 핵심 사용 사례 1개 구현 후 검증
2. 오케스트레이션 필요성 재평가
3. 플러그인 구조는 2개 이상의 실제 확장 케이스가 생긴 후 도입

---

## 7. 출력 스키마 전체 참조

```typescript
OverfitResult = {
  complexity_score: number          // 1~10
  verdict: '적정' | '주의' | '과도'
  problem_size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Enterprise'
  solution_size: 'Script' | 'Library' | 'Service' | 'Platform' | 'Ecosystem'
  overfit_items: Array<{            // 최대 5개
    title: string
    reason: string
    risk: 'low' | 'medium' | 'high'
  }>
  alternative: {
    description: string
    savings: string
  }
  next_tasks: Array<{               // 정확히 3개
    order: number
    task: string
  }>
  summary: string
  reasoning: string                 // 아키텍처 불균형 분석 과정
  detected_category: string
  analysis_approach: string
  inferred_assumptions: string[]    // 최대 5개
}
```
