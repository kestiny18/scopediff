import { writeIntent } from "../../core/intent/writeIntent.js";

export type IntentCommandOptions = {
  task?: string;
  allow?: string[];
  deny?: string[];
  rationale?: string;
};

export function runIntent(cwd: string, options: IntentCommandOptions): number {
  if (!options.task) {
    throw new Error("Missing required option: --task");
  }
  if (!options.allow || options.allow.length === 0) {
    throw new Error("Missing required option: --allow (repeatable)");
  }

  const written = writeIntent(cwd, {
    task: options.task,
    allow: options.allow,
    deny: options.deny,
    rationale: options.rationale
  });

  process.stdout.write(
    `Declared scope in ${written.path}\n  allow: ${written.intent.allow.join(", ")}\n`
  );
  return 0;
}
