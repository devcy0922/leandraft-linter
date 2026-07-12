# Govail Runtime — 설계 명세

## 목표

코드 변경 시 영향도를 자동으로 분석한다.

## 아키텍처

```
입력: 파일 경로
출력: 영향받는 파일 목록
```

## 구현 계획

### 1. DSL 컴파일러

코드 의존성 표현을 위한 전용 DSL 설계.

```
IMPORT src/auth.ts AS auth
DEPENDS_ON auth -> src/middleware.ts
```

DSL 파서, AST, 인터프리터, 컴파일러 4단계로 구현.

### 2. Actor System

파일 분석을 병렬화하기 위해 Actor 모델 도입.

- FileActor: 파일 읽기 담당
- DependencyActor: 의존성 추출 담당
- GraphActor: 그래프 업데이트 담당
- CoordinatorActor: 전체 조율 담당

메시지 패싱 방식으로 통신.

### 3. Plugin System

다양한 언어 지원을 위한 플러그인 아키텍처.

- PluginRegistry: 플러그인 등록 및 관리
- PluginLoader: 동적 로딩
- PluginSandbox: 격리 실행 환경

추후 Python, Java, Go 분석기를 플러그인으로 추가.

### 4. Workflow Engine

분석 파이프라인 오케스트레이션을 위한 워크플로우 엔진.

- WorkflowDefinition: YAML로 파이프라인 정의
- WorkflowRunner: 실행 엔진
- WorkflowMonitor: 진행 상태 모니터링
- RetryPolicy: 실패 시 재시도 정책

### 5. 분산 그래프 저장소

SurrealDB를 사용한 코드 의존성 그래프 저장.
샤딩, 복제, 트랜잭션 지원 필요.

### 6. Runtime API

외부에서 분석 결과를 조회하기 위한 REST + gRPC API.
OpenAPI 스펙 자동 생성, SDK 자동 생성 파이프라인 포함.

## 팀 구성

현재 개발자: 1명
예상 사용자: 내부 테스트 3명

## 타임라인

- 1~2주: DSL 설계
- 3~4주: Actor System 구현
- 5~6주: Plugin System
- 7~8주: Workflow Engine
- 9~10주: 분산 저장소
- 11~12주: Runtime API
