# DART 잔여 문제점 추가 개선 계획

추가로 진단된 잔여 문제점(LLM 바이패스 Mock의 프롬프트 하드코딩 리스크 및 Mac mini의 Git 브랜치 동기화)을 해결하기 위한 상세 구현 계획입니다.

## User Review Required

> [!IMPORTANT]
> **원격 Mac mini Git 동기화 수행**
> - M1 Max 로컬 변경 파일을 모두 커밋한 후 `git push`를 실행하고, 원격 Mac mini에서 `git pull`을 받아 로컬 git 히스토리를 origin/master와 동기화(Fast-Forward)합니다.
> - 이 과정에서 로컬 파일 변경 사항이 안전하게 원격 저장소와 결합됩니다.

## Open Questions

- 없음

## Proposed Changes

### 1. LLM 바이패스 Mock 분기 리팩토링

#### [MODIFY] [router.rs](file:///Users/studio-server/srv/dart-ai-trading-bot/crates/dart-llm/src/router.rs)
- `LLM_ENABLED=false` 시 Mock 응답을 분기하는 로직을 기존의 `system_prompt` 문자열 포함 여부 매칭에서, `generate` 함수의 인자로 전달받는 `role: LlmRole` 열거형 매칭으로 개선합니다.
- `LlmRole::Analysis` -> NewsCollector용 감정 분석 JSON
- `LlmRole::DeepAnalysis` -> NewsDeepAnalyzer용 딥 분석 JSON
- `LlmRole::Trading` -> Premarket 최종 결정용 JSON 또는 StrategyAgent용 국면(Regime) 분석 JSON (Trading 내부의 세부 분기만 프롬프트 패턴 매칭 사용)
- 이를 통해 프롬프트 템플릿 변경에 영향받지 않는 강력하고 유연한 Mocking 시스템을 구축합니다.

---

### 2. 로컬 커밋 및 Mac mini Git 동기화

#### [MANUAL] M1 Max 변경사항 커밋 및 푸시
- 로컬 M1 Max에서 아래 명령어들을 실행합니다:
  ```bash
  git add .
  git commit -m "refact: DART 프로젝트 개선 방안 적용 및 동기화 무시 설정"
  git push origin master
  ```

#### [MANUAL] Mac mini Git Fast-Forward 실행
- 원격 Mac mini에서 뒤처진 3개 커밋 히스토리를 정렬하기 위해 `git pull`을 실행합니다.
  ```bash
  ssh macmini "cd /srv/dart-ai-trading-bot && git pull"
  ```

## Verification Plan

### Automated Tests
- `ssh macmini "cd /srv/dart-ai-trading-bot && cargo test --workspace"` 전체 테스트가 정상 통과하는지 검증합니다.
- `ssh macmini "cd /srv/dart-ai-trading-bot && git status"` 명령어의 결과가 양쪽 장비 모두 깨끗하며 `up to date` 상태인지 검증합니다.
