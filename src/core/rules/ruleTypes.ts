import type {
  ChangedFile,
  Finding,
  Mode,
  ScopeDiffConfig,
  Severity,
  TaskContext
} from "../../types/index.js";

export type RuleInput = {
  files: ChangedFile[];
  context: TaskContext;
  config: ScopeDiffConfig;
  mode: Mode;
  changedLines: number;
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
