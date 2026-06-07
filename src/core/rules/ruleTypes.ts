import type {
  ChangedFile,
  Finding,
  Intent,
  Mode,
  ScopeDiffConfig,
  Severity,
  TaskContext
} from "../../types/index.js";
import {
  isCiFile,
  isDependencyBuildFile,
  isEnvSecretFile,
  isLockfile,
  isMigrationFile,
  matchesAny
} from "../analyze/classifyFile.js";

export type RuleInput = {
  files: ChangedFile[];
  context: TaskContext;
  config: ScopeDiffConfig;
  mode: Mode;
  changedLines: number;
  intent?: Intent;
};

export type Rule = (input: RuleInput) => Finding[];

export function finding(
  ruleId: string,
  severity: Severity,
  title: string,
  reason: string,
  file?: string
): Finding {
  return {
    ruleId,
    severity,
    title,
    file,
    reason,
    blocking: false
  };
}

export function hasContext(input: RuleInput): boolean {
  return input.context.confidence !== "none";
}

// Stronger gate for rules that emit blocking HIGH findings (SD001-SD004).
// "low" confidence comes from short/broad fallback context (e.g. a generic
// branch name like "main"), which is too weak to assert scope and would
// otherwise produce false HIGH findings. Require at least "medium".
export function hasConfidentContext(input: RuleInput): boolean {
  return input.context.confidence === "high" || input.context.confidence === "medium";
}

export function contextMentions(input: RuleInput, ...domains: string[]): boolean {
  return domains.some((domain) => input.context.domains.includes(domain));
}

export function hasAnyDomain(file: ChangedFile, domains: string[]): boolean {
  return file.domains.some((domain) => domains.includes(domain));
}

export function contextHasIntent(input: RuleInput, terms: string[]): boolean {
  const raw = input.context.raw?.toLowerCase() ?? "";
  return terms.some((term) => raw.includes(term.toLowerCase()));
}

// A file is in declared scope when it matches an `allow` glob and is not
// excluded by a `deny` glob. `deny` overrides `allow`.
export function isDeclared(intent: Intent, filePath: string): boolean {
  if (matchesAny(filePath, intent.deny)) {
    return false;
  }
  return matchesAny(filePath, intent.allow);
}

// High-risk file categories. Touching one outside declared scope is a blocking
// HIGH; an ordinary source file outside scope is only a non-blocking MEDIUM.
export function isDangerCategory(filePath: string): boolean {
  return (
    isDependencyBuildFile(filePath) ||
    isLockfile(filePath) ||
    isMigrationFile(filePath) ||
    isCiFile(filePath) ||
    isEnvSecretFile(filePath)
  );
}
