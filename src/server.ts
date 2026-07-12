import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { type StreamPayload, analyzeDocument } from "./llm/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function wantsStream(req: express.Request): boolean {
  return req.headers.accept?.includes("text/event-stream") ?? false;
}

function writeSse(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function createServer(): express.Express {
  const app = express();

  // JSON 요청 바디 파싱
  app.use(express.json({ limit: "10mb" }));

  // API 엔드포인트: 설계 마크다운 텍스트 분석
  app.post("/api/check", async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res
        .status(400)
        .json({ error: "분석할 마크다운 텍스트(content)가 누락되었거나 올바르지 않습니다." });
      return;
    }

    try {
      if (wantsStream(req)) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });

        const result = await analyzeDocument(content, (payload: StreamPayload) => {
          writeSse(res, "progress", payload);
        });

        writeSse(res, "result", result);
        res.end();
        return;
      }

      const result = await analyzeDocument(content);
      res.json(result);
    } catch (err) {
      console.error("설계 분석 오류:", err);
      if (wantsStream(req) && !res.headersSent) {
        res.writeHead(500, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });
      }
      if (wantsStream(req) && res.headersSent) {
        writeSse(res, "error", {
          error:
            err instanceof Error
              ? err.message
              : "서버 분석 과정에서 알 수 없는 오류가 발생했습니다.",
        });
        res.end();
        return;
      }
      res.status(500).json({
        error:
          err instanceof Error ? err.message : "서버 분석 과정에서 알 수 없는 오류가 발생했습니다.",
      });
    }
  });

  // 빌드 결과 정적 파일 서빙 (frontend/dist)
  // dev/prod 모두 이 경로는 동일하게 프로젝트 루트 하위 frontend/dist를 타겟팅합니다.
  const staticPath = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(staticPath));

  // SPA 라우팅 대응: index.html로 폴백
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });

  return app;
}
