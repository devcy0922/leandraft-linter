import "dotenv/config";
import { Command } from "commander";
import { createCheckCommand } from "./commands/check.js";
import { createUiCommand } from "./commands/ui.js";
import { analyzeDocument } from "./llm/client.js";
import { parseFile, parseStdin } from "./parser/markdown.js";
import { renderJson, renderMarkdown, renderResult } from "./ui/render.js";

const program = new Command();

program
  .name("leandraft-lint")
  .description("설계 문서의 오버엔지니어링 여부를 판독하고 더 작은 대안을 제시합니다")
  .version("0.1.0");

// 최상위 파일 인수 지원: leandraft-lint plan.md [--json|--markdown]
// 기존 서브커맨드(check, ui)는 그대로 유지됩니다.
program
  .argument("[file]", "분석할 Markdown 파일 경로 (생략 시 --stdin 필요)")
  .option("--stdin", "stdin에서 문서를 읽습니다")
  .option("--format <format>", "출력 형식: text | json | markdown", "text")
  .option("--model <model>", "사용할 LLM 모델 (LLM_MODEL 환경변수 오버라이드)")
  .action(
    async (
      file: string | undefined,
      options: { stdin?: boolean; format: string; model?: string },
    ) => {
      // 서브커맨드가 매칭되지 않은 경우에만 실행
      // Commander는 서브커맨드가 있으면 이 action을 호출하지 않음
      if (!file && !options.stdin) {
        // 파일도 stdin도 없으면 도움말 출력
        program.help();
        return;
      }

      if (options.model) {
        process.env.LLM_MODEL = options.model;
      }

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

      const { default: ora } = await import("ora");
      const spinner = ora({
        text: `분석 중... (약 ${doc.estimatedTokens.toLocaleString()} 토큰)`,
        color: "cyan",
      }).start();

      try {
        const result = await analyzeDocument(doc.content);
        spinner.succeed("분석 완료");

        if (options.format === "json") {
          renderJson(result);
        } else if (options.format === "markdown") {
          renderMarkdown(result, doc.label);
        } else {
          renderResult(result, doc.label);
        }
      } catch (err) {
        spinner.fail("분석 실패");
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    },
  );

program.addCommand(createCheckCommand());
program.addCommand(createUiCommand());

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
