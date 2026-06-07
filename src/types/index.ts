export type Severity = "high" | "medium" | "info";
export type Mode = "scope" | "risk-only";
export type ContextConfidence = "high" | "medium" | "low" | "none";

export type TaskContext = {
  source: "prompt" | "prompt_file" | "commit_message" | "branch_name" | "none";
  path?: string;
  raw?: string;
  summary?: string;
  confidence: ContextConfidence;
  keywords: string[];
  domains: string[];
};

export type ChangedFileStatus = "added" | "modified" | "deleted" | "renamed";

export type ChangedFile = {
  path: string;
  previousPath?: string;
  status: ChangedFileStatus;
  additions: number;
  deletions: number;
  isTest: boolean;
  isDocs: boolean;
  isSensitiveFile: boolean;
  sensitiveCategory?: string;
  domains: string[];
  changedLines: string[];
};

export type Finding = {
  ruleId: string;
  severity: Severity;
  title: string;
  file?: string;
  reason: string;
  blocking: boolean;
};

// Declared task scope, written (typically by the coding agent during planning)
// to .scopediff/intent.json. When present it is the authoritative source for
// "was this change in scope?", replacing keyword inference.
export type Intent = {
  version: 1;
  task: string;
  allow: string[];
  deny: string[];
  rationale?: string;
  createdAt?: string;
};

export type AnalysisResult = {
  version: string;
  mode: Mode;
  context: TaskContext;
  intent?: {
    task: string;
    allow: string[];
    deny: string[];
  };
  summary: {
    high: number;
    medium: number;
    info: number;
    changedFiles: number;
    changedLines: number;
  };
  findings: Finding[];
  result: {
    passed: boolean;
    exitCode: 0 | 1 | 2;
  };
};

export type ScopeDiffConfig = {
  version: 1;
  risk: {
    fail_on: Severity[];
  };
  diff: {
    max_changed_files: number;
    max_diff_lines: number;
    max_deleted_lines: number;
  };
  context: {
    min_prompt_words: number;
    enable_branch_name: boolean;
    enable_commit_message: boolean;
  };
  sensitive_files: string[];
  sensitive_paths: string[];
  ignore: string[];
  tests: {
    patterns: string[];
    allow_test_changes: boolean;
  };
};
