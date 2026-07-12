import { exec } from "node:child_process";
import { Command } from "commander";
import { createServer } from "../server.js";

/**
 * OS 환경에 맞는 명령어로 기본 웹 브라우저를 연다.
 */
function openBrowser(url: string) {
  const start =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${start} ${url}`, (err) => {
    if (err) {
      console.warn(`브라우저 자동 오픈 실패: ${err.message}`);
    }
  });
}

function shouldOpenBrowser(): boolean {
  if (process.env.CI === "true" || process.env.NO_BROWSER === "1") {
    return false;
  }

  return process.stdout.isTTY;
}

export function createUiCommand(): Command {
  const cmd = new Command("ui");

  cmd
    .description("로컬 웹 UI 서버를 실행하고 웹 브라우저를 자동 팝업합니다")
    .option("-p, --port <port>", "서버가 리스닝할 포트 번호", process.env.PORT || "3000")
    .action((options: { port: string }) => {
      const port = Number.parseInt(options.port, 10);
      if (Number.isNaN(port)) {
        console.error("오류: 포트 번호는 숫자여야 합니다.");
        process.exit(1);
      }

      const app = createServer();

      try {
        app.listen(port, () => {
          const url = `http://localhost:${port}`;
          console.log(`\n🚀 Overfit Checker 웹 UI 서버 실행 완료: ${url}`);
          console.log("   서버를 종료하려면 Ctrl+C를 누르세요.\n");
          if (shouldOpenBrowser()) {
            openBrowser(url);
          }
        });
      } catch (err) {
        console.error(`서버 바인딩 실패 (포트: ${port}):`, err);
        process.exit(1);
      }
    });

  return cmd;
}
