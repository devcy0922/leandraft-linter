# Orchestra Runtime 포지셔닝 및 아키텍처 명세 - 마지막 체크

최선은 **“Gateway에 넣지 말고, Gateway 옆에 붙여서 경험한다”** 쪽이야.

```text
IDE/RooCode/Cursor
        ↓
LLM Gateway  ← 로그/정책/라우팅
        ↓
Local LLM

별도
orchestra-runtime-py
        ↓
LLM Gateway를 통해 모델 호출
        ↓
분석/계획/리포트/장기작업
```

이러면 둘 다 얻어.

**Gateway는 안 꼬이고**,
**LangGraph/오케스트라 경험은 제대로 쌓임.**

오케스트라는 이런 작업으로 경험하면 됨.

```text
1. 보안감사 배치
   PHP 파일 300개 → chunk → 취약점 후보 → 검증 → 리포트

2. PR 리뷰 에이전트
   diff 입력 → 영향도 분석 → 위험도 산정 → 리뷰 코멘트

3. 레거시 코드 맵 생성
   route/controller/model/sql 관계 추출 → 문서화

4. 로그 기반 장애 분석
   error log + source map → 원인 후보 → 재현 절차

5. 모델 평가 파이프라인
   같은 프롬프트를 여러 모델에 던짐 → 점수화 → 모델 선택
```

중요한 건 이거야.

**오케스트라는 실시간 IDE 조작용으로 만들면 Cursor/RooCode랑 정면충돌함.**
대신 **배치 분석, 감사, 리뷰, 평가, 리포트**로 만들면 네 포트폴리오 가치가 살아남아.

한 줄로 정리하면:

**IDE는 손, Gateway는 관제, Orchestra는 분석관으로 분리해.**

모델: GPT-5.5 Thinking
