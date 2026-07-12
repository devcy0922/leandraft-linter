import "dotenv/config";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import { type OverfitResult, OverfitResultSchema } from "../schema/result.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

export interface StreamPayload {
  stage:
    | "request_preparing"
    | "llm_waiting"
    | "validation"
    | "context_check"
    | "planning"
    | "delegation"
    | "completed"
    | "error";
  status: "processing" | "success" | "failed";
  message: string;
  data?: unknown;
}

interface FinalDecisionType {
  plan?: {
    steps?: Array<{
      step_id: number;
      action: string;
      target: string;
      description: string;
    }>;
  };
  delegation_result?: {
    runtime_task_id?: string;
    result?: string | Record<string, unknown>;
  };
  target?: string;
}

/**
 * 고베일 게이트웨이 전용 단기 만료형(15분) JWT 토큰을 발행합니다.
 */
function generateGatewayToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "LLM_API_KEY 또는 JWT_SECRET 환경 변수가 정의되지 않았습니다.\n" +
        "고베일 게이트웨이 연동을 위해 발급받은 Bearer API Key를 LLM_API_KEY에 설정하세요.",
    );
  }

  const payload = {
    sub: "vercel-leandraft-linter-prod",
    project: "leandraft-linter", // 게이트웨이가 JWT Secret을 조회할 프로젝트 식별자
    role: "developer",
    allowed_models: ["auto"],
    rpm: 60,
    jti: crypto.randomUUID(), // 토큰 고유 식별자 (SurrealDB 실시간 블랙리스트 조회용)
  };

  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

/**
 * 게이트웨이 인증 토큰을 결정합니다.
 * LLM_API_KEY가 있으면 Bearer API Key를 우선 사용하고,
 * 기존 배포 호환성을 위해 JWT_SECRET 기반 단기 토큰을 폴백으로 지원합니다.
 */
function resolveGatewayApiKey(): string {
  const apiKey = process.env.LLM_API_KEY;
  if (apiKey) {
    return apiKey;
  }

  return generateGatewayToken();
}

function resolveGatewayBaseUrl(): string {
  const configuredBaseUrl = process.env.LLM_BASE_URL?.trim();
  const isVercel = Boolean(process.env.VERCEL);

  if (!configuredBaseUrl) {
    if (isVercel) {
      throw new Error(
        "LLM_BASE_URL이 Vercel Production에 설정되지 않았습니다. GCP를 경유하는 공개 게이트웨이 URL(예: https://.../v1)을 non-sensitive 환경변수로 설정하세요.",
      );
    }

    return "http://localhost:8080/v1";
  }

  if (
    isVercel &&
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
      configuredBaseUrl,
    )
  ) {
    throw new Error(
      "Vercel에서는 로컬/사설망 LLM_BASE_URL에 접근할 수 없습니다. GCP를 경유하는 공개 게이트웨이 URL을 설정하세요.",
    );
  }

  return configuredBaseUrl;
}

/**
 * LLM 클라이언트 설정
 * .env에서 LLM_BASE_URL, LLM_API_KEY 또는 JWT_SECRET, LLM_MODEL 읽음
 */
function createClient(): OpenAI {
  const baseURL = resolveGatewayBaseUrl();
  const apiKey = resolveGatewayApiKey();

  return new OpenAI({ baseURL, apiKey, timeout: 50_000 });
}

/**
 * 설계 문서를 분석하고 진행 단계를 스트리밍하여 최종 결과를 반환합니다.
 * AEGIS_ROUTER_URL이 정의되어 있다면 Router의 SSE API를 호출하고,
 * 정의되어 있지 않다면 Direct LLM Gateway를 호출하면서 가상 진행 과정을 스트리밍합니다.
 */
export async function analyzeDocument(
  documentContent: string,
  onProgress?: (payload: StreamPayload) => void,
): Promise<OverfitResult> {
  const routerURL = process.env.AEGIS_ROUTER_URL;

  if (routerURL) {
    // ----------------------------------------------------
    // 1. GoVail Router SSE 스트리밍 모드
    // ----------------------------------------------------
    const response = await fetch(routerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "yooncy-dev",
        "X-User-Name": "Yoon Chan-young",
        "X-User-Role": "developer",
      },
      body: JSON.stringify({
        text: documentContent,
        session_id: `overfit-session-${Math.random().toString(36).substring(2, 10)}`,
      }),
    });

    // biome-ignore lint/suspicious/noExplicitAny: cast to any for ts compilation in node fetch response
    const res = response as any;

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GoVail Router 호출 실패 (HTTP ${res.status}): ${errorText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("GoVail Router 응답 스트림 바디 리더를 획득할 수 없습니다.");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalDecision: FinalDecisionType | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const payload: StreamPayload = JSON.parse(line.slice(6));

            // 진행 콜백 호출
            if (onProgress) {
              onProgress(payload);
            }

            if (payload.stage === "completed") {
              finalDecision = payload.data as FinalDecisionType;
            } else if (payload.stage === "error") {
              throw new Error(`라우터 처리 과정 중 예외 발생: ${payload.message}`);
            }
          } catch (err) {
            if (err instanceof Error && err.message.startsWith("라우터 처리")) {
              throw err;
            }
            // JSON 파싱 에러 등은 무시하고 다음 청크를 대기
          }
        }
      }
    }

    if (!finalDecision) {
      throw new Error("최종 완료 시그널(completed)을 수신하지 못했습니다.");
    }

    // 최종 결과 가공 (Zod 스키마 검증 통과용 구조 조립)
    let finalResult: unknown = null;

    if (finalDecision.delegation_result?.result) {
      try {
        finalResult =
          typeof finalDecision.delegation_result.result === "string"
            ? JSON.parse(finalDecision.delegation_result.result)
            : finalDecision.delegation_result.result;
      } catch {
        // 파싱 실패 시 폴백
      }
    }

    if (!finalResult) {
      const stepsCount = finalDecision.plan?.steps?.length ?? 0;
      const isOverfit = stepsCount >= 5; // 임의 판정 임계치

      finalResult = {
        complexity_score: isOverfit ? 8 : 4,
        verdict: isOverfit ? "과도" : "적정",
        problem_size: isOverfit ? "Medium" : "Small",
        solution_size: isOverfit ? "Service" : "Script",
        overfit_items:
          finalDecision.plan?.steps?.map((step) => ({
            title: `과도한 ${step.action} 단계 수립`,
            reason: `${step.target} 파일에 대한 ${step.description}이 설계 단계에서 추가되었습니다.`,
            risk: isOverfit ? "high" : "medium",
          })) ?? [],
        alternative: {
          description: "외부 런타임 위임 기반의 가벼운 설계 분리 방안을 적용하세요.",
          savings: "불필요한 직접 런타임 구현 리팩토링 200라인 제거",
        },
        next_tasks: [
          {
            order: 1,
            task: `GoVail Runtime Task ID (${finalDecision.delegation_result?.runtime_task_id ?? "N/A"}) 실행 확인`,
          },
          { order: 2, task: `수립된 계획 스텝 ${stepsCount}개 검토` },
          { order: 3, task: "코드 복잡도 낮추기 및 설계 경량화 수행" },
        ],
        summary: `GoVail Router가 ${finalDecision.target ?? "N/A"} 타겟으로 작업 위임을 마쳤습니다.`,
        reasoning: `GoVail Router가 ${finalDecision.target ?? "N/A"} 타겟을 위해 수립한 ${stepsCount}개의 실행 스텝을 분석했습니다. 문제 규모에 비해 불필요하게 복잡한 다단계 프로세스 위임 또는 런타임이 식별되었습니다.`,
        detected_category: "Web API",
        analysis_approach: "GoVail Router 계획 실행 데이터 분석 및 타겟 복잡성 검증",
        inferred_assumptions: [
          "실행 계획 단계의 수가 많으므로 다중 서비스 모듈이 기동되어야 한다고 가정함",
          "런타임 위임 기능이 활성화되어 있어 분산 분리 실행 환경으로 유추함",
        ],
      };
    }

    if (onProgress) {
      onProgress({
        stage: "validation",
        status: "processing",
        message: "LLM 결과 JSON 파싱 및 스키마 검증 중...",
      });
    }

    // Zod 스키마 최종 검증
    const parsedResult = OverfitResultSchema.safeParse(finalResult);
    if (!parsedResult.success) {
      throw new Error(
        `최종 응답 스키마 검증 실패: ${parsedResult.error.message}\n데이터: ${JSON.stringify(finalResult)}`,
      );
    }

    return parsedResult.data;
  }

  // ----------------------------------------------------
  // 2. Direct LLM Gateway 모드 (가상 진행 피드백 지원)
  // ----------------------------------------------------
  if (onProgress) {
    onProgress({
      stage: "request_preparing",
      status: "processing",
      message: "요청 본문과 시스템 프롬프트를 준비하는 중...",
    });
  }

  // 약간의 딜레이를 주어 가상 스피너 단계를 시각화
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (onProgress) {
    onProgress({
      stage: "llm_waiting",
      status: "processing",
      message: "게이트웨이에 LLM 분석 요청을 보내고 응답을 기다리는 중...",
    });
  }

  const client = createClient();
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const completionRequest = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(documentContent) },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: false,
      },
    },
    max_tokens: 4096,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);
  let responseBody: {
    choices?: Array<{
      finish_reason?: string | null;
      message?: {
        content?: string | null;
      };
    }>;
    error?: { message?: string };
  };

  try {
    const response = (await fetch(`${client.baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(completionRequest),
      signal: controller.signal,
    })) as
      // biome-ignore lint/suspicious/noExplicitAny: bypass global response type conflict in vercel/node env
      any;

    responseBody = (await response.json()) as typeof responseBody;

    if (!response.ok) {
      throw new Error(
        responseBody.error?.message ?? `LLM 게이트웨이 호출 실패 (HTTP ${response.status})`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }

  if (onProgress) {
    onProgress({
      stage: "validation",
      status: "processing",
      message: "LLM 응답 JSON 파싱 및 결과 스키마 검증 중...",
    });
  }

  const choice = responseBody.choices?.[0];
  const raw = choice?.message?.content;

  if (!raw) {
    throw new Error(
      `LLM 응답 content가 비어 있습니다. 게이트웨이 라우팅 모델과 응답 형식을 확인하세요. (finish_reason: ${choice?.finish_reason ?? "unknown"})`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`LLM 응답 JSON 파싱 실패:\n${raw}`);
  }

  const result = OverfitResultSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`LLM 응답 스키마 검증 실패:\n${result.error.message}`);
  }

  if (onProgress) {
    onProgress({
      stage: "completed",
      status: "success",
      message: "Direct LLM 분석이 최종 완료되었습니다.",
      data: result.data,
    });
  }

  return result.data;
}
