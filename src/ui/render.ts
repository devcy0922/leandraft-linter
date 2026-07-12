import chalk from "chalk";
import type { OverfitResult } from "../schema/result.js";

const RISK_BADGE = {
  low: chalk.green("낮음"),
  medium: chalk.yellow("중간"),
  high: chalk.red("높음"),
} as const;

const VERDICT_STYLE = {
  적정: chalk.green,
  주의: chalk.yellow,
  과도: chalk.red,
} as const;

// 문제 규모와 해결책 규모 간 단계 차이를 계산 (불균형 탐지)
const PROBLEM_SIZE_RANK: Record<string, number> = {
  Tiny: 0,
  Small: 1,
  Medium: 2,
  Large: 3,
  Enterprise: 4,
};

const SOLUTION_SIZE_RANK: Record<string, number> = {
  Script: 0,
  Library: 1,
  Service: 2,
  Platform: 3,
  Ecosystem: 4,
};

function getSizeGapWarning(problemSize: string, solutionSize: string, verdict: string): string {
  if (verdict === "적정") {
    return chalk.green("✓  규모 균형 (적정 설계)");
  }
  const pRank = PROBLEM_SIZE_RANK[problemSize] ?? 0;
  const sRank = SOLUTION_SIZE_RANK[solutionSize] ?? 0;
  const gap = sRank - pRank;
  if (gap >= 2) return chalk.red("⚠️  규모 불균형 — 해결책이 문제보다 훨씬 큽니다");
  if (gap === 1) return chalk.yellow("△  규모 차이 — 약간 과도할 수 있습니다");
  return chalk.green("✓  규모 균형");
}

/**
 * 분석 결과를 터미널에 출력한다.
 */
export function renderResult(result: OverfitResult, label: string): void {
  const bar = chalk.dim("─".repeat(50));

  console.log();
  console.log(chalk.bold(`🔍  Overfit Analysis — ${chalk.cyan(label)}`));
  console.log(bar);
  console.log();

  // 복잡도 점수
  const scoreStyle = VERDICT_STYLE[result.verdict];
  const scoreBar = buildScoreBar(result.complexity_score);
  console.log(
    `📊  복잡도 점수   ${scoreStyle.bold(String(result.complexity_score))} / 10   ${scoreBar}   ${scoreStyle.bold(result.verdict)}`,
  );
  console.log();

  // 문제 규모 vs 해결책 규모
  const gapWarning = getSizeGapWarning(result.problem_size, result.solution_size, result.verdict);
  console.log(
    `🎯  문제 규모: ${chalk.cyan.bold(result.problem_size)}  →  해결책 규모: ${chalk.magenta.bold(result.solution_size)}   ${gapWarning}`,
  );
  console.log();

  console.log(chalk.dim(`    ${result.summary}`));
  console.log();

  // 설계 분석 메타 정보 (설명성 추가)
  console.log();
  console.log(chalk.bold("🔍  설계 분석 메타 정보"));
  console.log(
    `  📂  ${chalk.bold("설계 분류:")} ${chalk.yellow(result.detected_category || "N/A")}`,
  );
  console.log(`  🔎  ${chalk.bold("분석 방식:")} ${chalk.dim(result.analysis_approach || "N/A")}`);
  if (result.inferred_assumptions && result.inferred_assumptions.length > 0) {
    console.log(`  📋  ${chalk.bold("유추된 가정:")}`);
    for (const assumption of result.inferred_assumptions) {
      console.log(`    • ${chalk.dim(assumption)}`);
    }
  }
  console.log();
  console.log(bar);

  // AI 추론 분석 (Reasoning)
  if (result.reasoning) {
    console.log();
    console.log(chalk.bold("🧠  AI 추론 분석 (Reasoning)"));
    console.log();
    const lines = result.reasoning.split("\n");
    for (const line of lines) {
      console.log(`  ${chalk.italic.dim(line)}`);
    }
    console.log();
    console.log(bar);
  }

  // 과도한 설계 요소
  if (result.overfit_items.length === 0) {
    console.log();
    console.log(chalk.green("✅  과도한 설계 요소 없음 — 적정한 설계입니다."));
  } else {
    console.log();
    console.log(chalk.bold.red(`🚨  과도한 설계 요소 (${result.overfit_items.length}개)`));
    console.log();
    for (const [i, item] of result.overfit_items.entries()) {
      console.log(
        `  ${chalk.bold(`${i + 1}.`)} ${chalk.yellow(item.title)}   ${RISK_BADGE[item.risk]}`,
      );
      console.log(`     ${chalk.dim(item.reason)}`);
      console.log();
    }
  }

  console.log(bar);

  // 더 작은 대안
  console.log();
  console.log(chalk.bold("💡  더 작은 대안"));
  console.log();
  console.log(`  ${result.alternative.description}`);
  console.log(`  ${chalk.dim(`절감: ${result.alternative.savings}`)}`);
  console.log();
  console.log(bar);

  // 다음 최소 작업
  console.log();
  console.log(chalk.bold("✅  다음 최소 작업"));
  console.log();
  for (const task of result.next_tasks) {
    console.log(`  ${chalk.bold.green(`${task.order}.`)} ${task.task}`);
  }
  console.log();
}

/**
 * JSON 포맷으로 출력한다.
 */
export function renderJson(result: OverfitResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * 마크다운 포맷으로 출력한다. (복사하기 쉽도록 순수 텍스트 마크다운 출력)
 */
export function renderMarkdown(result: OverfitResult, label: string): void {
  let md = "";
  md += `# Overfit Analysis - ${label}\n\n`;
  md += `## 복잡도 점수: ${result.complexity_score} / 10 (${result.verdict})\n\n`;
  md += `| 문제 규모 | 해결책 규모 |\n|---|---|\n| ${result.problem_size} | ${result.solution_size} |\n\n`;
  md += `> ${result.summary}\n\n`;

  md += "## 설계 분석 메타 정보\n\n";
  md += `* **설계 분류**: ${result.detected_category || "N/A"}\n`;
  md += `* **분석 방식**: ${result.analysis_approach || "N/A"}\n`;
  if (result.inferred_assumptions && result.inferred_assumptions.length > 0) {
    md += "* **유추된 가정들**:\n";
    for (const assumption of result.inferred_assumptions) {
      md += `  - ${assumption}\n`;
    }
  }
  md += "\n";

  if (result.reasoning) {
    md += "## AI 추론 분석 (Reasoning)\n\n";
    md += `${result.reasoning}\n\n`;
  }

  md += `## 과도한 설계 요소 (${result.overfit_items.length}개)\n\n`;
  if (result.overfit_items.length === 0) {
    md += "* 과도한 설계 요소가 없으며, 적정한 설계입니다.\n\n";
  } else {
    for (const [i, item] of result.overfit_items.entries()) {
      md += `### ${i + 1}. ${item.title} (위험도: ${item.risk})\n`;
      md += `${item.reason}\n\n`;
    }
  }

  md += "## 더 작은 대안\n\n";
  md += `${result.alternative.description}\n`;
  md += `* **절감 범위**: ${result.alternative.savings}\n\n`;

  md += "## 다음 최소 작업\n\n";
  for (const task of result.next_tasks) {
    md += `${task.order}. ${task.task}\n`;
  }

  console.log(md.trim());
}

function buildScoreBar(score: number): string {
  const filled = Math.round(score / 2); // 10점 → 5칸
  const empty = 5 - filled;
  const color = score >= 8 ? chalk.red : score >= 5 ? chalk.yellow : chalk.green;
  return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}
