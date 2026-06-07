import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { installClaudeStopHook } from "./claudeHook.js";
import { cursorRule, codexSection, claudeSection } from "./templates.js";

export type AgentTarget = "cursor" | "codex" | "claude";

export type InitAgentResult = {
  path: string;
  changed: boolean;
  message: string;
};

export function initAgent(cwd: string, target: AgentTarget): InitAgentResult {
  switch (target) {
    case "cursor":
      return upsertFile(
        path.join(cwd, ".cursor", "rules", "scopediff.mdc"),
        cursorRule,
        "ScopeDiff Rule"
      );
    case "codex":
      return upsertFile(path.join(cwd, "AGENTS.md"), codexSection, "# ScopeDiff");
    case "claude": {
      const doc = upsertFile(path.join(cwd, "CLAUDE.md"), claudeSection, "# ScopeDiff");
      const hook = installClaudeStopHook(cwd);
      return {
        path: doc.path,
        changed: doc.changed || hook.changed,
        message: `${doc.message}\n${hook.message}`
      };
    }
  }
}

function upsertFile(filePath: string, section: string, marker: string): InitAgentResult {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });

  if (!existsSync(filePath)) {
    writeFileSync(filePath, section, "utf8");
    return {
      path: filePath,
      changed: true,
      message: `Created ${filePath}`
    };
  }

  const existing = readFileSync(filePath, "utf8");
  if (existing.includes(marker)) {
    return {
      path: filePath,
      changed: false,
      message: `ScopeDiff section already exists in ${filePath}`
    };
  }

  const next = `${existing.trimEnd()}\n\n${section}`;
  writeFileSync(filePath, next, "utf8");
  return {
    path: filePath,
    changed: true,
    message: `Appended ScopeDiff section to ${filePath}`
  };
}
