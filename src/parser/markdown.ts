import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ParsedDocument {
  /** 원본 파일 경로 (stdin이면 undefined) */
  source: string | undefined;
  /** 파일명 또는 "<stdin>" */
  label: string;
  /** 전처리된 텍스트 */
  content: string;
  /** 대략적인 토큰 수 추정 (공백 기준 단어 수) */
  estimatedTokens: number;
}

const MAX_CHARS = 12_000; // 약 3000 토큰 안전 상한

/**
 * 파일 경로에서 Markdown 문서를 읽어 전처리한다.
 */
export function parseFile(filePath: string): ParsedDocument {
  const resolved = resolve(filePath);
  const raw = readFileSync(resolved, "utf-8");
  return buildDocument(raw, resolved, filePath);
}

/**
 * stdin 문자열을 전처리한다.
 */
export function parseStdin(raw: string): ParsedDocument {
  return buildDocument(raw, undefined, "<stdin>");
}

function buildDocument(raw: string, source: string | undefined, label: string): ParsedDocument {
  const trimmed = raw.trim();

  // 길이 제한: 너무 긴 문서는 앞부분만 분석
  const content =
    trimmed.length > MAX_CHARS
      ? `${trimmed.slice(0, MAX_CHARS)}\n\n[...문서가 너무 길어 앞부분만 분석합니다]`
      : trimmed;

  const estimatedTokens = content.split(/\s+/).filter(Boolean).length;

  return { source, label, content, estimatedTokens };
}
