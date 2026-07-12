import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeDocument, type StreamPayload } from "../src/llm/client.js";

function wantsStream(req: VercelRequest): boolean {
  return req.headers.accept?.includes("text/event-stream") ?? false;
}

function writeSse(res: VercelResponse, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Vercel Serverless Function — POST /api/check
 *
 * Express 없이 analyzeDocument()를 직접 호출합니다.
 * 로컬 테스트: vercel dev
 * 프로덕션: Vercel 자동 배포
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 (Vercel 도메인에서 프론트엔드가 API 호출 시 필요)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 메서드만 허용됩니다." });
    return;
  }

  if (!req.body) {
    res.status(400).json({
      error: "요청 바디가 비어 있거나 올바르지 않습니다.",
    });
    return;
  }

  const { content } = req.body as { content?: string };

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({
      error: "분석할 마크다운 텍스트(content)가 누락되었거나 올바르지 않습니다.",
    });
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
    res.status(200).json(result);
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
        error: err instanceof Error ? err.message : "서버 분석 과정에서 알 수 없는 오류가 발생했습니다.",
      });
      res.end();
      return;
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : "서버 분석 과정에서 알 수 없는 오류가 발생했습니다.",
    });
  }
}
