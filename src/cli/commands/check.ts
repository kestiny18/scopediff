import type { AnalysisResult, Severity } from "../../types/index.js";
import { analyzeDiff } from "../../core/analyze/analyzeDiff.js";
import { loadConfig } from "../../core/config/loadConfig.js";
import { resolveContext } from "../../core/context/resolveContext.js";
import { getDiff } from "../../core/git/getDiff.js";
import { loadIntent } from "../../core/intent/loadIntent.js";
import { jsonReporter } from "../../core/report/jsonReporter.js";
import { textReporter } from "../../core/report/textReporter.js";

export type CheckCommandOptions = {
  prompt?: string;
  promptFile?: string;
  staged?: boolean;
  base?: string;
  format?: "text" | "json";
  config?: string;
  failOn?: Severity;
  color?: boolean;
  verbose?: boolean;
  hook?: boolean;
};

export function runCheck(cwd: string, options: CheckCommandOptions): number {
  const format = options.format ?? "text";
  if (format !== "text" && format !== "json") {
    throw new Error(`Unsupported format: ${format}`);
  }

  const { config } = loadConfig(cwd, options.config);
  const context = resolveContext(cwd, config, {
    prompt: options.prompt,
    promptFile: options.promptFile
  });
  const loadedIntent = loadIntent(cwd);
  const diffText = getDiff({
    cwd,
    staged: options.staged,
    base: options.base
  });
  const result = analyzeDiff({
    diffText,
    context,
    config,
    intent: loadedIntent?.intent,
    failOn: options.failOn ? failOnThreshold(options.failOn) : undefined
  });

  if (options.hook) {
    return runHookMode(result);
  }

  const report =
    format === "json"
      ? jsonReporter(result)
      : textReporter(result, {
          color: options.color,
          verbose: options.verbose,
          diffSource: describeDiffSource(options),
          showIsolationTip: shouldShowIsolationTip(options, result.summary.changedFiles)
        });

  process.stdout.write(report);
  return result.result.exitCode;
}

// Claude Code Stop-hook mode. Per the hook contract, we exit 0 and (only when
// there are blocking findings) print a block decision as JSON on stdout so the
// agent is sent back to address the findings before it can stop. With no diff
// or no blocking findings, we stay silent and allow the stop.
function runHookMode(result: AnalysisResult): number {
  const blocking = result.findings.filter((finding) => finding.blocking);
  if (blocking.length === 0) {
    return 0;
  }

  const lines = blocking.map(
    (finding) =>
      `- [${finding.ruleId}] ${finding.file ? `${finding.file}: ` : ""}${finding.title} — ${finding.reason}`
  );
  const guidance = result.intent
    ? "If a change is intentional, add its path to .scopediff/intent.json `allow` (e.g. `scopediff intent`); otherwise revert it."
    : "Declare the task scope with `scopediff intent --task <task> --allow <glob>` and re-run, or revert the unexpected changes.";

  const decision = {
    decision: "block" as const,
    reason: `ScopeDiff found ${blocking.length} blocking finding(s) before finishing.`,
    hookSpecificOutput: {
      hookEventName: "Stop" as const,
      additionalContext: `ScopeDiff blocking findings:\n${lines.join("\n")}\n\n${guidance}`
    }
  };

  process.stdout.write(`${JSON.stringify(decision)}\n`);
  return 0;
}

function describeDiffSource(options: CheckCommandOptions): string {
  if (options.staged) {
    return "git diff --staged";
  }
  if (options.base) {
    return `git diff ${options.base}...HEAD`;
  }
  return "git diff HEAD";
}

function shouldShowIsolationTip(options: CheckCommandOptions, changedFiles: number): boolean {
  return !options.staged && !options.base && changedFiles > 1;
}

function failOnThreshold(level: Severity): Severity[] {
  if (level === "high") {
    return ["high"];
  }
  if (level === "medium") {
    return ["high", "medium"];
  }
  return ["high", "medium", "info"];
}
