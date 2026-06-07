#!/usr/bin/env node
import { createRequire } from "node:module";
import { Command } from "commander";
import { runCheck } from "./commands/check.js";
import { runInit } from "./commands/init.js";
import { runIntent } from "./commands/intent.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version: string };

const program = new Command();

program
  .name("scopediff")
  .description("Check whether AI-generated code changes stay within task scope.")
  .version(packageJson.version);

program
  .command("check")
  .description("Analyze the current git diff for scope drift and high-risk changes.")
  .option("--prompt <text>", "task description")
  .option("--prompt-file <path>", "read task description from file")
  .option("--staged", "check staged diff")
  .option("--base <ref>", "compare against a branch or commit")
  .option("--format <format>", "output format: text or json", "text")
  .option("--config <path>", "config file path")
  .option("--fail-on <level>", "override blocking level: high, medium, or info")
  .option("--no-color", "disable color")
  .option("--verbose", "print extra detail")
  .option("--hook", "Claude Code Stop-hook mode: emit a block decision as JSON on blocking findings")
  .action((options) => {
    try {
      process.exitCode = runCheck(process.cwd(), options);
    } catch (error) {
      process.stderr.write(`${formatError(error)}\n`);
      process.exitCode = 2;
    }
  });

program
  .command("init [target]")
  .description("Create scopediff.yml or agent instructions for cursor, codex, or claude.")
  .action((target) => {
    try {
      process.exitCode = runInit(process.cwd(), { target });
    } catch (error) {
      process.stderr.write(`${formatError(error)}\n`);
      process.exitCode = 2;
    }
  });

program
  .command("intent")
  .description("Declare the scope of the current task to .scopediff/intent.json.")
  .requiredOption("--task <text>", "task description")
  .option("--allow <glob>", "path/glob allowed to change (repeatable)", collect, [])
  .option("--deny <glob>", "path/glob that must not change (repeatable)", collect, [])
  .option("--rationale <text>", "optional rationale for the declared scope")
  .action((options) => {
    try {
      process.exitCode = runIntent(process.cwd(), options);
    } catch (error) {
      process.stderr.write(`${formatError(error)}\n`);
      process.exitCode = 2;
    }
  });

program.parse();

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `ScopeDiff error: ${error.message}`;
  }
  return `ScopeDiff error: ${String(error)}`;
}
