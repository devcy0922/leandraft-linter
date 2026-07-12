# Handoff 02: CLI 렌더러 및 웹 UI 구현 계획

이전 세션에서 Zod 스키마, 시스템 프롬프트, 클라이언트 폴백 및 테스트 템플릿의 갱신을 성공적으로 마쳤습니다. 이번 마이크로태스크에서는 변경된 스펙에 따라 CLI 및 웹 UI 렌더링을 업데이트하고, 적정 설계 시 규모 불균형 경고 오작동 버그를 완화하는 구현을 진행합니다.

## 📌 직전 진행 상황 요약
- **완료**: Zod 스키마 수정 (`detected_category`, `analysis_approach`, `inferred_assumptions`), `SYSTEM_PROMPT` 지침 보강, 모의 데이터 갱신 및 `pnpm test` 검증 통과.
- **남은 작업**: `src/ui/render.ts` (CLI) 및 `frontend/src/App.vue` (Web UI)에 설명성 정보 시각화 추가 및 `verdict === "적정"`일 때 규모 불균형 경고 완화 로직 구현.

## 🛠️ TASK CONTRACT (계약서)

### TARGET
- [render.ts](file:///Users/studio-server/srv/overfit-checker/src/ui/render.ts)
- [App.vue](file:///Users/studio-server/srv/overfit-checker/frontend/src/App.vue)

### ALLOWED
- `render.ts` 내 `getSizeGapWarning`에 `verdict` 파라미터를 추가하여 `verdict === '적정'`인 경우 `gap` 수치와 관계없이 경고 문구를 완화하거나 미표시 (`✓ 규모 균형 (적정 설계)`).
- `renderResult` 및 `renderMarkdown` 내에 `detected_category`, `analysis_approach`, `inferred_assumptions` 데이터 렌더링 레이아웃 추가.
- `App.vue` 내 `OverfitResult` Vue 인터페이스에 세 메타 필드 추가.
- `App.vue` 결과 영역 상단에 시스템 분류, 분석 접근법, 유추 및 가정 섹션을 노출하는 세련된 UI 컴포넌트 마크업 추가.
- `App.vue` 내 `getSizeGapClass`, `getSizeGapIcon`, `getSizeGapMessage` 함수에 `verdict` 파라미터를 전달하여 `verdict === '적정'` 시 안전 수준(`gap-ok` / "균형 잡힌 설계(허용 범위)")으로 출력되도록 수정.

### FORBIDDEN
- 기존 UI 레이아웃의 구조를 해치지 않으며, 디자인 규칙(Aesthetics)에 맞추어 고급스럽고 조화롭게 렌더링되도록 디자인할 것 (단순 투박한 스타일링은 금지).
- API 라우팅 모듈이나 LLM 클라이언트 모듈의 코드를 이번 단계에서 불필요하게 변경하지 말 것.

### SUCCESS
- CLI 실행 시 추가된 분석 메타 필드(분류, 접근 방식, 유추 가정)와 완화된 규모 불균형 메시지가 정상 출력됨.
- Web UI 실행 시 카드 레이아웃으로 메타 필드들이 미려하게 가시화되고, 적정 설계에 대해 규모 불균형 🚨 경고 대신 안정 메시지(✅)가 나타남.
- `pnpm check` 및 `pnpm test` 오류 없음.
