# Handoff Plan - 고베일 게이트웨이 정적 API Key 인증 아키텍처 구현 계획

## 조사 요약 (Evidence 기반 발견)
1. **As-Is (현재 상태의 인증 결함)**:
   - 현재 `authenticate` 핸들러는 무조건 `jsonwebtoken::decode` 를 거칩니다. 이 때문에 정적 문자열로 주입된 API Key(예: `govail-demo-admin`)는 JWT 포맷 규칙(점 2개 구분)에 어긋나 무조건 401 Unauthorized 에러로 차단됩니다.
   
2. **To-Be (정적 API Key 설계)**:
   - `GatewayConfig` 에 `api_keys: HashMap<String, PrincipalConfig>` 필드를 추가하여, 환경 변수(`GOVAIL_API_KEYS` 및 `GOVAIL_API_KEY`)를 파싱하여 키별 프로젝트 매핑을 관리합니다.
   - `auth.rs` 의 `authenticate` 함수 시작부에 토큰이 이 정적 맵에 존재하는 경우 JWT 디코딩을 생략하고 즉시 `Principal` 을 반환하는 Bypass 로직을 주입합니다.

## 구현 계획 (Execution Graph)
- **Task A (config.rs 정적 API Key 구조체 도입)**:
  - `GatewayConfig` 내에 `api_keys` 필드를 추가하고 `GOVAIL_API_KEYS` (포맷: `key:project:role[:rpm]`) 및 `GOVAIL_API_KEY` 환경 변수를 파싱하여 적재하는 로직 구현.
- **Task B (auth.rs 정적 API Key Bypass 로직 구현)**:
  - `auth::authenticate` 에서 들어온 Bearer 토큰이 `config.api_keys` 에 매핑된 정적 키인 경우 즉시 `Principal` 객체를 생성하여 반환하도록 우회 처리 구현.
  - 관련 단위 테스트 코드 작성.
- **Task C (로컬 검증 및 E2E 테스트)**:
  - `cargo test --manifest-path gateway/Cargo.toml` 로 컴파일 및 로컬 단위 테스트 확인.
  - 게이트웨이 컨테이너 재배포 및 실제 API Key(`vercel-overfit-checker-prod`)를 `.env` 에 연동하여 curl로 정상 응답 수신 검증.

## COMPLEXITY BUDGET
- Max files modified: 2 (`config.rs`, `auth.rs`)
- Max execution phases: 2

## FIRST ACTION MUST
- **ACTION**: `govail-gateway/gateway/src/config.rs` 의 `GatewayConfig` 정의부를 열어 정적 `api_keys` 해시맵 필드 추가를 위한 임포트 및 매핑 추가 시작. (5분 이내 완료 가능)

## Verification Plan
- `cargo test --manifest-path gateway/Cargo.toml`
- `make gateway-check`
