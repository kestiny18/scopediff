import pc from "picocolors";
import type { AnalysisResult, Finding } from "../../types/index.js";

export type TextReporterOptions = {
  color?: boolean;
  verbose?: boolean;
  diffSource?: string;
  showIsolationTip?: boolean;
};

export function textReporter(result: AnalysisResult, options: TextReporterOptions = {}): string {
  const color = options.color !== false;
  const lines: string[] = [];

  lines.push(style("ScopeDiff Report", "bold", color));
  lines.push("");
  lines.push("Mode:");
  lines.push(`  ${result.mode}`);
  lines.push("");
  if (result.intent) {
    lines.push("Declared scope:");
    lines.push(`  task: ${result.intent.task}`);
    lines.push(`  allow: ${result.intent.allow.join(", ")}`);
    if (result.intent.deny.length > 0) {
      lines.push(`  deny: ${result.intent.deny.join(", ")}`);
    }
    lines.push("");
  }
  lines.push("Context:");
  lines.push(`  source: ${result.context.source}`);
  if (result.context.path) {
    lines.push(`  path: ${result.context.path}`);
  }
  lines.push(`  confidence: ${result.context.confidence}`);
  if (result.context.summary) {
    lines.push(`  summary: ${result.context.summary}`);
  }
  if (options.verbose && result.context.keywords.length > 0) {
    lines.push(`  keywords: ${result.context.keywords.join(", ")}`);
  }
  if (options.diffSource) {
    lines.push("");
    lines.push("Diff:");
    lines.push(`  source: ${options.diffSource}`);
    if (options.showIsolationTip) {
      lines.push(
        "  tip: This check includes all tracked changes relative to HEAD. Use --staged to check only selected files."
      );
    }
  }
  lines.push("");
  lines.push("Summary:");
  lines.push(
    `  ${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.info} info`
  );
  lines.push(`  ${result.summary.changedFiles} files, ${result.summary.changedLines} changed lines`);

  appendFindingSection(lines, "High Risk", result.findings, "high", color);
  appendFindingSection(lines, "Potential Scope Drift", result.findings, "medium", color);
  appendFindingSection(lines, "Info", result.findings, "info", color);

  lines.push("");
  lines.push("Result:");
  if (result.result.passed) {
    lines.push(`  ${style("passed", "green", color)}`);
  } else {
    lines.push(
      `  ${style("failed", "red", color)} because ${result.findings.filter((finding) => finding.blocking).length} blocking finding(s) were found.`
    );
  }

  return `${lines.join("\n")}\n`;
}

function appendFindingSection(
  lines: string[],
  title: string,
  findings: Finding[],
  severity: Finding["severity"],
  color: boolean
): void {
  const sectionFindings = findings.filter((finding) => finding.severity === severity);
  if (sectionFindings.length === 0) {
    return;
  }

  lines.push("");
  lines.push(style(`${title}:`, severity === "high" ? "red" : severity === "medium" ? "yellow" : "blue", color));

  for (const finding of sectionFindings) {
    lines.push(`  [${finding.ruleId}] ${finding.title}`);
    if (finding.file) {
      lines.push(`  file: ${finding.file}`);
    }
    lines.push(`  reason: ${finding.reason}`);
    if (finding.blocking) {
      lines.push("  blocking: true");
    }
    lines.push("");
  }

  if (lines.at(-1) === "") {
    lines.pop();
  }
}

function style(value: string, styleName: "bold" | "red" | "yellow" | "blue" | "green", color: boolean): string {
  if (!color) {
    return value;
  }

  switch (styleName) {
    case "bold":
      return pc.bold(value);
    case "red":
      return pc.red(value);
    case "yellow":
      return pc.yellow(value);
    case "blue":
      return pc.blue(value);
    case "green":
      return pc.green(value);
  }
}
