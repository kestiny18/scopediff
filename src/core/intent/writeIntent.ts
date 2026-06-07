import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Intent } from "../../types/index.js";
import { INTENT_RELATIVE_PATH } from "./loadIntent.js";

export type WriteIntentOptions = {
  task: string;
  allow: string[];
  deny?: string[];
  rationale?: string;
};

export type WrittenIntent = {
  intent: Intent;
  path: string;
};

// Writes (or overwrites) .scopediff/intent.json. Intended to be called by the
// coding agent at the start of a task to declare its scope.
export function writeIntent(cwd: string, options: WriteIntentOptions): WrittenIntent {
  const task = options.task.trim();
  if (!task) {
    throw new Error("Intent requires a non-empty --task description.");
  }

  const allow = dedupe(options.allow.map((glob) => glob.trim()).filter(Boolean));
  if (allow.length === 0) {
    throw new Error("Intent requires at least one --allow glob.");
  }

  const intent: Intent = {
    version: 1,
    task,
    allow,
    deny: dedupe((options.deny ?? []).map((glob) => glob.trim()).filter(Boolean)),
    ...(options.rationale?.trim() ? { rationale: options.rationale.trim() } : {}),
    createdAt: new Date().toISOString()
  };

  const intentPath = path.join(cwd, INTENT_RELATIVE_PATH);
  mkdirSync(path.dirname(intentPath), { recursive: true });
  writeFileSync(intentPath, `${JSON.stringify(intent, null, 2)}\n`, "utf8");

  return { intent, path: intentPath };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
