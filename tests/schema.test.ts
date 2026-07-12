import { describe, expect, it } from "vitest";
import { OverfitResultSchema } from "../src/schema/result.js";

describe("OverfitResultSchema", () => {
  const validResult = {
    complexity_score: 8,
    verdict: "과도",
    problem_size: "Small",
    solution_size: "Platform",
    overfit_items: [
      {
        title: "DSL 컴파일러",
        reason: "현재 문제에 컴파일러가 필요 없음",
        risk: "high",
      },
    ],
    alternative: {
      description: "파일 읽기 → 의존성 추출 → JSON 출력",
      savings: "6주 → 1주",
    },
    next_tasks: [
      { order: 1, task: "파일 읽기 함수" },
      { order: 2, task: "의존성 파싱" },
      { order: 3, task: "JSON 출력" },
    ],
    summary: "1명 팀에 컴파일러와 Actor 시스템은 과도함",
    reasoning:
      "이 프로젝트는 1명 팀을 위한 단순한 도구입니다. 하지만 Actor 시스템과 독자적인 DSL 컴파일러를 추가하여 유지보수 비용을 크게 늘렸습니다. 이는 명백한 과적합(Overfit) 설계입니다.",
    detected_category: "CLI Tool",
    analysis_approach: "설계 문서의 아키텍처 다이어그램 및 Actor 라이브러리 도입 계획 분석",
    inferred_assumptions: [
      "1명 팀 구성이라는 제약 조건 하에 개인 개발 환경으로 가정",
      "트래픽 정보 부재로 인해 로컬 단일 프로세스 실행으로 유추",
    ],
  };

  it("유효한 결과를 파싱한다", () => {
    const result = OverfitResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it("complexity_score가 1~10 범위를 벗어나면 실패한다", () => {
    const invalid = { ...validResult, complexity_score: 0 };
    const result = OverfitResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("overfit_items가 5개를 초과하면 실패한다", () => {
    const tooMany = {
      ...validResult,
      overfit_items: Array.from({ length: 6 }, (_, i) => ({
        title: `항목 ${i}`,
        reason: "이유",
        risk: "low",
      })),
    };
    const result = OverfitResultSchema.safeParse(tooMany);
    expect(result.success).toBe(false);
  });

  it("next_tasks가 정확히 3개여야 한다", () => {
    const twoTasks = {
      ...validResult,
      next_tasks: [
        { order: 1, task: "작업 1" },
        { order: 2, task: "작업 2" },
      ],
    };
    const result = OverfitResultSchema.safeParse(twoTasks);
    expect(result.success).toBe(false);
  });

  it("verdict가 적정|주의|과도 중 하나여야 한다", () => {
    const invalid = { ...validResult, verdict: "unknown" };
    const result = OverfitResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("problem_size가 올바른 enum 값이어야 한다", () => {
    const invalid = { ...validResult, problem_size: "Gigantic" };
    const result = OverfitResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("solution_size가 올바른 enum 값이어야 한다", () => {
    const invalid = { ...validResult, solution_size: "Monolith" };
    const result = OverfitResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
