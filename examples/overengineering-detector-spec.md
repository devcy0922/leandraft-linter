# Govail Overengineering Detector - 제품 기획 및 최종 골 명세

좋다. 그 아이디어 꽤 좋다.

“오버엔지니어링 판독기”는 Govail 자체에도 맞고, 네 작업 방식에도 맞아.

이걸 최종골로 잡으면 이렇게 정리할 수 있어.

Govail = AI 시대의 엔터프라이즈 코드/AI 작업 거버넌스 플랫폼

첫 번째 제품 기능:
Overengineering Detector

AI나 개발자가 제안한 설계/코드/작업계획이
현재 문제 대비 과도한지 판독하고,
더 작은 대안을 제시한다.

이게 좋은 이유는 명확해.

지금 네가 겪은 문제 자체가 제품 문제가 됨.

LLM Gateway 만들려다 Runtime 만듦
Runtime 만들려다 Compiler 만듦
Compiler 만들다 Workflow Engine 됨
Workflow Engine 하다 LangGraph로 회귀

이 흐름을 막는 도구.

최종 골 초안
Govail은 AI 코딩 에이전트와 개발자가 만든 설계/작업계획을 검토하여,
보안·정책·복잡도·실행 가능성 관점에서 안전한 작업 경로를 제안하는
AI Governance Runtime Platform이다.

MVP는 Overengineering Detector다.

입력:
- README
- 설계 문서
- 작업 계획
- PR diff
- AI agent proposal

출력:
- 과한 설계 여부
- 근거
- 위험도
- 줄일 수 있는 범위
- 다음에 해야 할 최소 작업
