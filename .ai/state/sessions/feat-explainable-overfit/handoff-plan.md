# Micro-task Plan: CLI 렌더러 및 웹 UI 구현 (v1.1)

## TARGET
- [render.ts](file:///Users/studio-server/srv/overfit-checker/src/ui/render.ts)
- [App.vue](file:///Users/studio-server/srv/overfit-checker/frontend/src/App.vue)

## ALLOWED
- `src/ui/render.ts` 내 `getSizeGapWarning`에 `verdict` 매개변수(string)를 추가하여, `verdict === '적정'`인 경우 `gap` 수치와 관계없이 경고 문구를 완화하거나 `✓ 규모 균형 (적정 설계)` 등의 안전 문구로 출력되도록 수정.
- `src/ui/render.ts` 내 `renderResult` 및 `renderMarkdown`에 추가 설명성 필드(`detected_category`, `analysis_approach`, `inferred_assumptions`)의 터미널/마크다운 렌더링 구문 구현.
- `frontend/src/App.vue` 내 `OverfitResult` Vue 인터페이스에 세 메타 필드(`detected_category`, `analysis_approach`, `inferred_assumptions`) 정의 추가.
- `frontend/src/App.vue` 내 결과 화면 컴포넌트 상단(또는 적절한 위치)에 '시스템 분류', '분석 방식', '유추 및 가정' 카드를 시각화하는 마크업 및 디자인 CSS 적용.
- `frontend/src/App.vue` 내 `getSizeGapClass`, `getSizeGapIcon`, `getSizeGapMessage` 함수에 `verdict` 매개변수를 추가하고 `verdict === '적정'`일 때 안전 수준(`gap-ok` / "균형 잡힌 설계(허용 범위)")으로 출력하도록 보완.

## FORBIDDEN
- CLI 실행 및 UI 컴포넌트 구조의 원래 동작(예: 타이핑 효과, 히스토리 저장 등)이 손상되지 않도록 기존 로직을 신중히 다루어야 함.
- 다른 백엔드 API 라우팅이나 SDK 클라이언트는 이번 단계에서 불필요하게 변경하지 말 것.

## SUCCESS
- CLI 및 Web UI 테스트를 기동하여 적정 설계 로드 시 "규모 불균형" 🚨 대신 "안정/균형" 표시가 나타나야 함.
- 추가 설명성 필드들이 화면과 터미널에 아름답게 표현되어야 함.
- `pnpm check` 및 `pnpm test`가 통과됨.

## STOP CONDITIONS
- UI/CLI 렌더링 변경 중 빌드 실패 또는 타입 에러가 발생하고 20분 내로 해결되지 않을 경우 중단.
