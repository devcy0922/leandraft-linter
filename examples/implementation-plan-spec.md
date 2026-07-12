# implementation_plan.md: 지침 문서, README, AI 스킬 업데이트 및 PR 생성 계획서

최근 적용된 LiteLLM 업스트림 자동 폴백 메커니즘을 문서화하고, AI 지침(스킬) 문서에 남아있는 온프레미스 식별 정보(사설 IP 및 Hostname)를 일반화된 형태의 도메인과 환경변수로 리팩토링합니다. 작업 완료 후 커밋 및 PR 생성을 위한 준비를 마칩니다.

## User Review Required

> [!IMPORTANT]
> - `README.md` 및 `AGENTS.md`에 LiteLLM의 메인/서브 업스트림 폴백 메커니즘에 대한 가이드 문구를 추가합니다.
> - `agents/rules/` 디렉토리 내의 지침 파일들(`rules.md`, `00-L3-m1max-workspace.md`, `10-L3-govail-gateway.md`, `11-L3-govail-analyzer.md`)에 남아있는 사설 IP(`192.168.0.x`) 및 온프레미스 호스트명(`macmini`, `dgx-spark` 등)을 일반화된 도메인(`gpu-node.local`, `app-host.local`, `local-workstation` 등)으로 리팩토링합니다.
> - 최종 변경사항을 반영하여 `git commit` 후 Pull Request를 제안할 수 있도록 브랜치를 설정하고 준비합니다.

## Proposed Changes

### Documentation (VCS Tracked)

#### [MODIFY] [README.md](file:///Users/studio-server/srv/govail/README.md)
- `빠른 시작` 또는 `환경 변수 설정` 부분에 `SUB_UPSTREAM_URL`이 명시되지 않았을 때 메인 LLM 업스트림 주소로 자동 폴백되는 다중 폴백 구조에 대한 설명을 추가합니다.

#### [MODIFY] [AGENTS.md](file:///Users/studio-server/srv/govail/AGENTS.md)
- `6. 대표적인 배포 및 설정 환경 구성` 하위에 LiteLLM 업스트림 자동 폴백(Fallback) 아키텍처와 검증 노하우에 대한 엔지니어링 지침을 명시합니다.

---

### AI Rules & Skills (VCS Ignored, Local Core)

#### [MODIFY] [agents/rules.md](file:///Users/studio-server/srv/govail/agents/rules.md)
- `M1 Max(192.168.0.8)` 명칭을 일반화된 워크스테이션 명칭으로 수정합니다.

#### [MODIFY] [00-L3-m1max-workspace.md](file:///Users/studio-server/srv/govail/agents/rules/00-L3-m1max-workspace.md)
- 사설 IP 주소 및 호스트명을 `local-workstation`, `app-host.local`, `gpu-node.local`로 리팩토링합니다.

#### [MODIFY] [10-L3-govail-gateway.md](file:///Users/studio-server/srv/govail/agents/rules/10-L3-govail-gateway.md)
- `dgx-spark(192.168.0.7:8080)` 지침을 `gpu-node.local:8080`으로 일반화합니다.

#### [MODIFY] [11-L3-govail-analyzer.md](file:///Users/studio-server/srv/govail/agents/rules/11-L3-govail-analyzer.md)
- `SurrealDB(macmini:8800)`, `govail-gateway(192.168.0.7:8080)`, `macmini(192.168.0.5)` 명칭을 각각 `app-host.local` 및 일반화된 구성으로 업데이트합니다.

## Verification Plan

### Automated Checks
- `git status` 및 `git diff`를 통해 사설 IP 유출 방지 조치 및 변경 내역을 더블체크합니다.
- 빌드/포맷팅 린트 명령인 `make gateway-fmt-check` 및 `make analyzer-lint`를 실행하여 문서 및 관련 설정이 빌드에 악영향을 주지 않는지 확인합니다.

### Pull Request 준비
- `git checkout -b feature/upstream-fallback-and-docs` 와 같이 신규 기능/문서 개선용 브랜치를 생성하고 커밋을 작성합니다.
