import type { Severity } from "../../types/index.js";
import { analyzeDiff } from "../../core/analyze/analyzeDiff.js";
import { loadConfig } from "../../core/config/loadConfig.js";
import { resolveContext } from "../../core/context/resolveContext.js";
import { getDiff } from "../../core/git/getDiff.js";
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
  const diffText = getDiff({
    cwd,
    staged: options.staged,
    base: options.base
  });
  const result = analyzeDiff({
    diffText,
    context,
    config,
    failOn: options.failOn ? failOnThreshold(options.failOn) : undefined
  });

  const report =
    format === "json"
      ? jsonReporter(result)
      : textReporter(result, {
          color: options.color,
          verbose: options.verbose
        });

  process.stdout.write(report);
  return result.result.exitCode;
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
