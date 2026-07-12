import { z } from "zod";

// 개별 과도한 설계 요소
export const OverfitItemSchema = z.object({
  title: z.string().describe("과도한 설계 요소 이름"),
  reason: z.string().describe("왜 과도한지 설명"),
  risk: z.enum(["low", "medium", "high"]).describe("리스크 수준"),
});

// 더 작은 대안
export const AlternativeSchema = z.object({
  description: z.string().describe("더 작은 대안 설명"),
  savings: z.string().describe("줄일 수 있는 복잡도/작업량"),
});

// 다음 최소 작업
export const NextTaskSchema = z.object({
  order: z.number().int().min(1).max(3).describe("순서"),
  task: z.string().describe("최소 작업 설명"),
});

// 문제 규모 (현재 요구사항 크기)
export const ProblemSizeSchema = z.enum(["Tiny", "Small", "Medium", "Large", "Enterprise"]);

// 해결책 규모 (제안된 구현의 복잡도 계층)
export const SolutionSizeSchema = z.enum(["Script", "Library", "Service", "Platform", "Ecosystem"]);

// 전체 분석 결과
export const OverfitResultSchema = z.object({
  complexity_score: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("복잡도 점수 (1=단순, 10=극단적 오버엔지니어링)"),
  verdict: z.enum(["적정", "주의", "과도"]).describe("1~4: 적정, 5~7: 주의, 8~10: 과도"),
  problem_size: ProblemSizeSchema.describe(
    "문제 규모: Tiny=개인 스크립트 / Small=팀 도구 / Medium=스타트업 MVP / Large=성장 서비스 / Enterprise=대규모 조직",
  ),
  solution_size: SolutionSizeSchema.describe(
    "해결책 규모: Script=단일파일 / Library=패키지 / Service=API서버 / Platform=다중서비스+인프라 / Ecosystem=DSL/런타임/플러그인",
  ),
  overfit_items: z
    .array(OverfitItemSchema)
    .min(0)
    .max(5)
    .describe("과도한 설계 요소 목록 (최대 5개)"),
  alternative: AlternativeSchema.describe("더 작은 대안"),
  next_tasks: z.array(NextTaskSchema).length(3).describe("다음 최소 작업 3개"),
  summary: z.string().describe("한 줄 요약"),
  reasoning: z
    .string()
    .describe("과적합 여부를 판단하기까지의 핵심 추론 및 고민 과정 (500자 이내)"),
  detected_category: z
    .string()
    .describe("AI가 분석해낸 설계 대상의 주요 성격/분류 (예: Web API, Batch/Pipeline, CLI 등)"),
  analysis_approach: z
    .string()
    .describe("분석을 위해 설계 문서에서 어떤 단서나 섹션에 초점을 맞췄는지 서술 (500자 이내)"),
  inferred_assumptions: z
    .array(z.string())
    .describe(
      "명확한 부하 수치 등이 누락되어 분석을 위해 자체적으로 유추/가정한 전제 조건 목록 (최대 5개)",
    ),
});

export type OverfitItem = z.infer<typeof OverfitItemSchema>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export type NextTask = z.infer<typeof NextTaskSchema>;
export type OverfitResult = z.infer<typeof OverfitResultSchema>;
export type ProblemSize = z.infer<typeof ProblemSizeSchema>;
export type SolutionSize = z.infer<typeof SolutionSizeSchema>;
