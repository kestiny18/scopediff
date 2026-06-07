import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Intent } from "../../types/index.js";

export const INTENT_RELATIVE_PATH = ".scopediff/intent.json";

const intentSchema = z.object({
  version: z.literal(1),
  task: z.string().min(1),
  allow: z.array(z.string().min(1)).min(1),
  deny: z.array(z.string().min(1)).default([]),
  rationale: z.string().optional(),
  createdAt: z.string().optional()
});

export type LoadedIntent = {
  intent: Intent;
  path: string;
};

// Returns the declared intent, or undefined when no declaration exists.
// A present-but-malformed declaration throws (surfaced as a config error /
// exit 2) rather than silently degrading — a broken declaration the agent
// wrote should be visible, not hidden behind keyword fallback.
export function loadIntent(cwd: string): LoadedIntent | undefined {
  const intentPath = path.join(cwd, INTENT_RELATIVE_PATH);
  if (!existsSync(intentPath)) {
    return undefined;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(readFileSync(intentPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid intent file ${intentPath}: ${message}`);
  }

  const parsed = intentSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`Invalid intent file ${intentPath}: ${parsed.error.message}`);
  }

  return { intent: parsed.data, path: intentPath };
}
