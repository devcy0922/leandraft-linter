# Overfit Checker (Scope Guard) - 프로젝트 기획 및 전략 명세

아, 별도 프로젝트면 오히려 더 좋을 수 있어.

**Govail 본체**는 무겁고 엔터프라이즈 지향:

```text
Gateway / Analyzer / Runtime / Audit / Policy
```

**오버엔지니어링 판독기**는 작고 선명한 도구:

```text
문서/설계/PR 계획을 넣으면
“이거 과한가?”를 판독하고
작은 대안을 제시
```

추천은 이거야.

```text
overfit-checker
```

또는

```text
scope-guard
```

같은 별도 프로젝트로 시작하고, 나중에 Govail의 `analyzer` 기능 중 하나로 흡수 가능하게 만드는 것.

구조는 작게:

```text
overfit-checker/
├── app/              # 웹앱 or CLI
├── rules/            # 판독 기준
├── examples/         # 샘플 설계 문서
├── docs/
└── README.md
```

MVP는 Govail보다 훨씬 단순하게:

```text
1. Markdown 붙여넣기
2. “과한 지점” 3~5개 탐지
3. 왜 과한지 설명
4. 더 작은 대안 제시
5. 다음 작업 3개로 축소
```

이건 별도 포폴로도 좋고, Govail 개발에도 바로 쓸 수 있어.

정리하면:

**별도 프로젝트로 시작 → Govail 실험 도구로 사용 → 검증되면 Govail Analyzer/Runtime에 흡수**
이 순서가 제일 안전해 보여.
