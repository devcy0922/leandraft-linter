# LeanDraft-Linter

LeanDraft-Linter는 설계 아키텍처의 복잡성 및 과적합(Over-engineering)을 탐지하고 제어하는 린터 도구입니다. 개발자가 제출한 설계 명세서, PR 계획서(Markdown), 코드베이스 상태를 정성적/정량적으로 평가하여 인프라의 과도한 비대화를 차단하고 최소 기능 아키텍처 대안을 제시합니다.

## 주요 기능

- **복잡도 점수 판독**: 핵심 비즈니스 문제 대비 설계 요소의 복잡성을 스코어링하여 복잡성 경고 발행.
- **오버 아키텍처 감지**: Procedural 코드로 충분한 구조에 불필요한 마이크로서비스, 컴파일러, 큐, 워크플로우 엔진이 주입되었는지 여부를 자동 린팅.
- **CLI & Web UI 지원**: 터미널 커맨드 단독 분석 및 Express 백엔드와 Vue 3 싱글 페이지 대시보드를 연동한 로컬 관제용 모니터 웹 구동 지원.

## 사용법

### CLI (터미널 스캔)
```bash
# 대상 아키텍처 계획서 파일 정적 린팅 실행
leandraft-lint check examples/simple-crud-plan.md

# 분석 결과를 JSON 포맷으로 출력
leandraft-lint check examples/simple-crud-plan.md --format json
```

### 로컬 웹 관제 서버 구동
```bash
# Express 웹 서버 기동 및 브라우저 자동 오픈
leandraft-lint ui --port 3000
```

## 기술 스택

- **CLI 프레임워크**: Commander.js & Biome 정적 분석
- **웹 서버 및 UI**: Express v5, Vue 3, Vite, TypeScript
- **빌더**: tsup
