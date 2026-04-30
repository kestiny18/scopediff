import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ScopeDiffConfig, TaskContext } from "../../types/index.js";
import { parsePrompt } from "./parsePrompt.js";

export type ResolveContextOptions = {
  prompt?: string;
  promptFile?: string;
};

export function resolveContext(
  cwd: string,
  config: ScopeDiffConfig,
  options: ResolveContextOptions
): TaskContext {
  if (options.promptFile) {
    const promptPath = path.resolve(cwd, options.promptFile);
    const raw = readFileSync(promptPath, "utf8");
    return contextFromRaw("prompt_file", raw, config, promptPath);
  }

  if (options.prompt) {
    return contextFromRaw("prompt", options.prompt, config);
  }

  if (config.context.enable_commit_message) {
    const commitMessage = tryGit(cwd, ["log", "-1", "--pretty=%B"]);
    if (commitMessage.trim()) {
      return contextFromRaw("commit_message", commitMessage, config);
    }
  }

  if (config.context.enable_branch_name) {
    const branchName = tryGit(cwd, ["branch", "--show-current"]);
    if (branchName.trim()) {
      return contextFromRaw("branch_name", branchName.replace(/[-_/]+/g, " "), config);
    }
  }

  return {
    source: "none",
    confidence: "none",
    keywords: [],
    domains: []
  };
}

function contextFromRaw(
  source: TaskContext["source"],
  raw: string,
  config: ScopeDiffConfig,
  promptPath?: string
): TaskContext {
  const parsed = parsePrompt(raw, config.context.min_prompt_words);

  if (parsed.confidence === "none") {
    return {
      source: "none",
      confidence: "none",
      keywords: [],
      domains: []
    };
  }

  return {
    source,
    path: promptPath,
    raw,
    summary: parsed.summary,
    confidence: parsed.confidence,
    keywords: parsed.keywords,
    domains: parsed.domains
  };
}

function tryGit(cwd: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return "";
  }
}
