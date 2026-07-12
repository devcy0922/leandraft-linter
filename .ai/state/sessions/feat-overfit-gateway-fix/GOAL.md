# GOAL

## FINAL GOAL
고베일 게이트웨이(`govail-gateway`)의 API Key 체계를 보안 정석(Security Best Practice)에 맞게 개편하여, **DLP 친화적 prefix (`gvk_`)**를 지닌 보안 암호학 난수 키를 발급하고, 데이터베이스(SurrealDB)에는 평문 대신 **SHA-256 해시값**만 보관하여 검증하는 종단간 보안 인증 로직을 완성합니다.

## As-Is vs To-Be Rationale
- **As-Is (기존 임시 상태)**: API Key가 일반 가독 텍스트 평문(`vercel-overfit-checker-prod` 등) 형태로 DB에 노출 보관되어, 데이터베이스 탈취 시 기밀성이 침해되는 보안 취약점을 지니고 있습니다.
- **To-Be (보안 정석)**: 암호 난수 키(`gvk_...`)를 발급하고, 게이트웨이가 토큰 요청 시 해시 함수(`short_hash`)를 통과시킨 해시 키값으로 DB `api_key:hash_val` 을 조회 및 대조하도록 고도화하여 기밀성 누출을 원천 차단합니다.

## DONE IF
1. `auth.rs` 에서 들어온 Bearer 토큰(평문 API Key)을 SHA-256 해싱(`short_hash`)한 후, 해시값 기반으로 SurrealDB `api_key` 테이블을 조회 및 대조하는 로직 구현이 빌드 완료되었는가? (YES)
2. `cargo test --manifest-path gateway/Cargo.toml` 로 로컬 단위 테스트가 모두 성공하는가? (YES)
3. SurrealDB에 신규 발급된 보안 API Key들의 SHA-256 해시 레코드를 등록 완료하였는가? (YES)
4. 신규 발급된 `gvk_` 키를 통해 completions 요청을 날렸을 때 정상 통과 및 감사 로그 매핑이 완수되는가? (YES)

## MUST NOT
- `overfit-checker` 소스 코드를 임의로 수정하거나 Vercel 배포망을 변경하지 않는다.
- 데이터베이스에 평문 API Key 원본 문자열을 그대로 저장하지 않는다.


## SCOPE (IN)
- `govail-gateway` 내 `config.rs` (정적 API Key Config 매핑 필드 추가)
- `govail-gateway` 내 `auth.rs` (정적 API Key 인증 Bypass 및 로컬 Principal 반환)
- 로컬 `gateway-check` 및 단위 테스트 추가 검증
- `audit.jsonl` 상에 정적 API Key 호출 내역이 `status: proxied` 로 찍히는지 최종 E2E 확인

## SCOPE (OUT)
- `overfit-checker` 소스 코드 수정 및 Vercel 배포



## SCOPE (OUT)
- `overfit-checker` 자체 소스 코드 패치
- 실서버 직접 배포 및 Vercel 설정 수정

## GOAL QUALITY SCORE
- **SCORE**: 10 / 10
- **GOAL QUALITY CHECK**:
  1. 완료 조건이 명확한가? YES
  2. 범위 밖 작업이 정의되어 있는가? YES
  3. 이 GOAL만으로 `/done` 판단이 가능한가? YES
  4. 세션명은 무엇으로 되었는가? feat-overfit-gateway-fix

## VERSION
- v1.1 (2026-06-28)

