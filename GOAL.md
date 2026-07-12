# 🎯 GOAL.md (Full)

## GOAL

설계 문서 오버핏 분석 시, (1) 설계 카테고리(detected_category), (2) 분석 접근 방식(analysis_approach), (3) 유추 및 가정 사항(inferred_assumptions)을 추출하여 터미널 CLI 및 웹 UI에 투명하게 시각화하고, (4) 분석 판정이 "적정"일 경우 문제-해결책 규모 차이가 있더라도 불균형 경고를 완화하도록 로직을 보완하여 분석 신뢰도를 높인다.

---

## DONE IF

* `src/schema/result.ts` 스키마에 세 개의 설명 필드가 추가되고, 비디오/텍스트 분석 검증이 Zod를 통과함.
* `src/llm/prompt.ts` 프롬프트에 세 필드의 판정 기준 및 가이드가 추가되고 LLM이 유효한 JSON을 정상 리턴함.
* `src/ui/render.ts` 터미널 및 마크다운 렌더러에서 세 필드가 정상 출력됨.
* `frontend/src/App.vue` 웹 UI에서 '시스템 분류', '분석 방식', '유추 및 가정' 데이터가 미려한 스타일로 가시화되어 노출됨.
* `src/ui/render.ts` 및 `frontend/src/App.vue`에서 `verdict === "적정"`일 경우 규모 불균형 경고가 발생하지 않고 적정 수준(또는 균형)으로 완화되어 출력됨.
* `pnpm test` 단위 테스트 및 `pnpm check` 타입 검사/린트가 에러 없이 100% 통과함.

---

## MUST NOT 🚫

* 기존 OverfitResultSchema의 핵심 분석 지표(`complexity_score`, `verdict`, `problem_size`, `solution_size`)를 삭제하거나 명칭을 변경하지 않는다.
* DB 등 영속성 레이어를 추가하지 않는다.
* API Key 및 사설망 내부 자격증명을 커밋에 포함시키지 않는다.

---

## SCOPE

IN:
* `src/schema/result.ts` Zod 스키마 수정
* `src/llm/prompt.ts` 시스템 프롬프트 가이드 추가
* `src/llm/client.ts` GoVail Router SSE 폴백용 모의 데이터 수정
* `src/ui/render.ts` CLI 렌더링 수정 및 규모 불균형 판정 조건 완화
* `frontend/src/App.vue` 결과 컴포넌트 마크업, 타입 정의 및 규모 불균형 판정 조건 완화
* `tests/schema.test.ts` 모의 결과 데이터 스키마 테스트 수정

OUT:
* 로컬 Express 서버의 라우팅 비즈니스 로직 대대적 수정 (Zod 스키마 검증 외에는 건드리지 않음)
* 외부 LLM Gateway 서비스의 인프라스트럭처 설정 변경

---

## ASSUMPTIONS

* OpenAI 호환 API 서버가 정상 기동 중이거나 Vercel 환경에서 환경변수 설정이 유효함.
* pnpm workspace 기반 의존성이 정상적으로 해결되어 있음.

---

## GOAL QUALITY SCORE

* 10 / 10 (COMPLETENESS: 2, MEASURABILITY: 2, SCOPE CONTROL: 2, CONSTRAINT CLARITY: 2, OVERBUILD DEFENSE: 2)

---

## VERSION

v1.2 | 2026-06-27
