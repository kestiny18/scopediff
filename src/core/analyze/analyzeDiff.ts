import type {
  AnalysisResult,
  ChangedFile,
  Intent,
  Mode,
  ScopeDiffConfig,
  Severity,
  TaskContext
} from "../../types/index.js";
import { VERSION } from "../../version.js";
import { parseDiff } from "../git/parseDiff.js";
import { classifyFile, isIgnoredPath } from "./classifyFile.js";
import { runRules } from "../rules/index.js";

export type AnalyzeDiffOptions = {
  diffText: string;
  context: TaskContext;
  config: ScopeDiffConfig;
  failOn?: Severity[];
  intent?: Intent;
};

export function analyzeDiff(options: AnalyzeDiffOptions): AnalysisResult {
  const files = parseDiff(options.diffText)
    .filter((file) => !isIgnoredPath(file.path, options.config))
    .map((file) => classifyFile(file, options.config));

  // A declared intent is itself authoritative scope context, so the analysis
  // runs in scope mode regardless of prompt confidence.
  const mode: Mode =
    options.intent || options.context.confidence !== "none" ? "scope" : "risk-only";
  const changedLines = countChangedLines(files);
  const failOn = options.failOn ?? options.config.risk.fail_on;

  const findings = applyBlocking(
    dedupeFindings(
      runRules({
        files,
        context: options.context,
        config: options.config,
        mode,
        changedLines,
        intent: options.intent
      })
    ),
    failOn
  );

  const summary = {
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    info: findings.filter((finding) => finding.severity === "info").length,
    changedFiles: files.length,
    changedLines
  };

  const passed = !findings.some((finding) => finding.blocking);

  return {
    version: VERSION,
    mode,
    context: options.context,
    intent: options.intent
      ? {
          task: options.intent.task,
          allow: options.intent.allow,
          deny: options.intent.deny
        }
      : undefined,
    summary,
    findings,
    result: {
      passed,
      exitCode: passed ? 0 : 1
    }
  };
}

function countChangedLines(files: ChangedFile[]): number {
  return files.reduce((total, file) => total + file.additions + file.deletions, 0);
}

function applyBlocking(findings: AnalysisResult["findings"], failOn: Severity[]): AnalysisResult["findings"] {
  const blockingLevels = new Set(failOn);
  return findings.map((finding) => ({
    ...finding,
    blocking: blockingLevels.has(finding.severity)
  }));
}

function dedupeFindings(findings: AnalysisResult["findings"]): AnalysisResult["findings"] {
  const seen = new Set<string>();
  const deduped: AnalysisResult["findings"] = [];

  for (const finding of findings) {
    const key = `${finding.ruleId}:${finding.file ?? ""}:${finding.reason}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(finding);
    }
  }

  return deduped;
}
