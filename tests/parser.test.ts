import { describe, expect, it } from "vitest";
import { parseStdin } from "../src/parser/markdown.js";

describe("parseStdin", () => {
  it("일반 텍스트를 파싱한다", () => {
    const raw = "# 제목\n\n본문 내용입니다.";
    const doc = parseStdin(raw);

    expect(doc.label).toBe("<stdin>");
    expect(doc.source).toBeUndefined();
    expect(doc.content).toBe(raw.trim());
    expect(doc.estimatedTokens).toBeGreaterThan(0);
  });

  it("빈 줄을 trim 처리한다", () => {
    const raw = "\n\n# 제목\n\n";
    const doc = parseStdin(raw);
    expect(doc.content).toBe("# 제목");
  });

  it("12000자 초과 시 잘라낸다", () => {
    const raw = "a".repeat(13_000);
    const doc = parseStdin(raw);
    expect(doc.content.length).toBeLessThan(13_000);
    expect(doc.content).toContain("[...문서가 너무 길어 앞부분만 분석합니다]");
  });
});
