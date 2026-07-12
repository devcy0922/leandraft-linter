import { Command } from "commander";
import ora from "ora";
import { analyzeDocument } from "../llm/client.js";
import { parseFile, parseStdin } from "../parser/markdown.js";
import type { OverfitResult } from "../schema/result.js";
import { renderJson, renderMarkdown, renderResult } from "../ui/render.js";

function getStageLabel(stage: string): string {
  switch (stage) {
    case "request_preparing":
      return "요청 준비";
    case "llm_waiting":
      return "LLM 응답 대기";
    case "validation":
      return "결과 검증";
    case "context_check":
      return "문맥 점검";
    case "planning":
      return "계획 수립";
    case "delegation":
      return "실행 위임";
    case "completed":
      return "전체 완료";
    case "error":
      return "오류 발생";
    default:
      return stage;
  }
}

export function createCheckCommand(): Command {
  const cmd = new Command("check");

  cmd
    .description("설계 문서를 분석하여 오버엔지니어링 여부를 판독합니다")
    .argument("[file]", "분석할 Markdown 파일 경로 (생략 시 --stdin 필요)")
    .option("--stdin", "stdin에서 문서를 읽습니다")
    .option("--format <format>", "출력 형식: text | json | markdown", "text")
    .option("--model <model>", "사용할 LLM 모델 (LLM_MODEL 환경변수 오버라이드)")
    .action(
      async (
        file: string | undefined,
        options: { stdin?: boolean; format: string; model?: string },
      ) => {
        // 모델 오버라이드
        if (options.model) {
          process.env.LLM_MODEL = options.model;
        }

        // 문서 로딩
        let doc: { content: string; estimatedTokens: number; label: string };
        try {
          if (options.stdin || !file) {
            const chunks: Buffer[] = [];
            for await (const chunk of process.stdin) {
              chunks.push(chunk as Buffer);
            }
            const raw = Buffer.concat(chunks).toString("utf-8");
            if (!raw.trim()) {
              console.error(
                "오류: stdin이 비어 있습니다. 파일 경로 또는 --stdin과 파이프를 사용하세요.",
              );
              process.exit(1);
            }
            doc = parseStdin(raw);
          } else {
            doc = parseFile(file);
          }
        } catch (err) {
          console.error(`파일 읽기 실패: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }

        // 실시간 스트리밍 과정 렌더링
        console.log(
          `\n🔍 GoVail Router 오케스트레이션 기동 (추정 토큰: ${doc.estimatedTokens.toLocaleString()})\n`,
        );
        const spinner = ora({
          text: "오케스트레이터 시작 대기 중...",
          color: "cyan",
        }).start();

        let currentStage = "";
        let result: OverfitResult;

        try {
          result = await analyzeDocument(doc.content, (payload) => {
            const { stage, status, message, data } = payload;

            if (stage !== currentStage) {
              if (currentStage && currentStage !== "completed") {
                spinner.succeed(`[${getStageLabel(currentStage)}] 처리 완료.`);
              }
              currentStage = stage;
              spinner.start(`[${getStageLabel(stage)}] ${message}`);
            } else {
              spinner.text = `[${getStageLabel(stage)}] ${message}`;
            }

            // 세부 단계 완료 시 추가 출력
            if (status === "success" && data) {
              const details = data as {
                steps?: Array<{
                  step_id: number;
                  action: string;
                  target: string;
                  description: string;
                }>;
                runtime_task_id?: string;
              };

              if (stage === "planning" && details.steps) {
                spinner.info(`[${getStageLabel(stage)}] 생성된 계획 스텝:`);
                for (const s of details.steps) {
                  console.log(
                    `    - 스텝 ${s.step_id}: [${s.action}] ${s.target} (${s.description})`,
                  );
                }
              } else if (stage === "delegation" && details.runtime_task_id) {
                spinner.info(
                  `[${getStageLabel(stage)}] 외부 런타임 위임 태스크 ID: ${details.runtime_task_id}`,
                );
              }
            }
          });
          spinner.succeed("오케스트레이션 분석 전 처리 완료.");
        } catch (err) {
          spinner.fail("오케스트레이터 처리 실패");
          console.error(err instanceof Error ? err.message : String(err));
          process.exit(1);
        }

        // 최종 분석 결과 출력
        console.log(`\n📊 최종 설계 검증 보고서 (${doc.label})\n`);
        if (options.format === "json") {
          renderJson(result);
        } else if (options.format === "markdown") {
          renderMarkdown(result, doc.label);
        } else {
          renderResult(result, doc.label);
        }
      },
    );

  return cmd;
}
