import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCheck } from "../src/cli/commands/check.js";
import { runIntent } from "../src/cli/commands/intent.js";
import { initAgent } from "../src/core/agent/initAgent.js";
import { loadIntent } from "../src/core/intent/loadIntent.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), "scopediff-int-"));
});

afterEach(() => {
  // best-effort; tmp dirs are reclaimed by the OS
});

function captureStdout(callback: () => number): { exitCode: number; output: string } {
  const originalWrite = process.stdout.write.bind(process.stdout);
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  try {
    return { exitCode: callback(), output };
  } finally {
    process.stdout.write = originalWrite;
  }
}

function initRepo(files: Record<string, string>): void {
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "ScopeDiff Test"], { cwd: dir });
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: dir });
  for (const [filePath, content] of Object.entries(files)) {
    const absolute = path.join(dir, filePath);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }
  execFileSync("git", ["add", "."], { cwd: dir });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir, stdio: "ignore" });
}

describe("scopediff intent command", () => {
  it("writes a valid, loadable declaration", () => {
    const code = runIntent(dir, {
      task: "fix login empty password returns 400",
      allow: ["src/auth/**", "src/auth/**"],
      rationale: "scoped to auth"
    });
    expect(code).toBe(0);

    const loaded = loadIntent(dir);
    expect(loaded?.intent.task).toBe("fix login empty password returns 400");
    expect(loaded?.intent.allow).toEqual(["src/auth/**"]); // de-duplicated
    expect(loaded?.intent.rationale).toBe("scoped to auth");
  });

  it("rejects a declaration with no allow globs", () => {
    expect(() => runIntent(dir, { task: "x", allow: [] })).toThrow(/--allow/);
  });
});

describe("intent + check end-to-end via git", () => {
  it("blocks an undeclared high-risk change and passes once declared", () => {
    initRepo({
      "package.json": "{\"version\":\"0.0.1\"}\n",
      "src/auth/LoginController.ts": "return 500;\n"
    });
    writeFileSync(path.join(dir, "package.json"), "{\"version\":\"0.0.2\"}\n", "utf8");
    writeFileSync(path.join(dir, "src/auth/LoginController.ts"), "return 400;\n", "utf8");

    runIntent(dir, { task: "fix login 400", allow: ["src/auth/**"] });

    const blocked = captureStdout(() => runCheck(dir, { format: "json", color: false }));
    const blockedResult = JSON.parse(blocked.output) as {
      findings: Array<{ ruleId: string; file?: string; severity: string }>;
    };
    expect(blocked.exitCode).toBe(1);
    expect(blockedResult.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD019", severity: "high", file: "package.json" })
      ])
    );

    // Declaring package.json brings it into scope -> passes.
    runIntent(dir, { task: "fix login 400 + bump version", allow: ["src/auth/**", "package.json"] });
    const passed = captureStdout(() => runCheck(dir, { format: "json", color: false }));
    expect(passed.exitCode).toBe(0);
  });
});

describe("check --hook mode", () => {
  it("emits a Claude Code block decision on blocking findings", () => {
    initRepo({ "package.json": "{\"version\":\"0.0.1\"}\n" });
    writeFileSync(path.join(dir, "package.json"), "{\"version\":\"0.0.2\"}\n", "utf8");
    runIntent(dir, { task: "fix login", allow: ["src/auth/**"] });

    const { exitCode, output } = captureStdout(() => runCheck(dir, { hook: true }));
    expect(exitCode).toBe(0); // hook contract: exit 0 + JSON on stdout
    const decision = JSON.parse(output) as {
      decision: string;
      hookSpecificOutput: { hookEventName: string; additionalContext: string };
    };
    expect(decision.decision).toBe("block");
    expect(decision.hookSpecificOutput.hookEventName).toBe("Stop");
    expect(decision.hookSpecificOutput.additionalContext).toContain("SD019");
  });

  it("stays silent and allows the stop when there are no blocking findings", () => {
    initRepo({ "README.md": "# Project\n" });
    writeFileSync(path.join(dir, "README.md"), "# Project\n\nDocs.\n", "utf8");

    const { exitCode, output } = captureStdout(() => runCheck(dir, { hook: true }));
    expect(exitCode).toBe(0);
    expect(output).toBe("");
  });
});

describe("init claude installs a Stop hook", () => {
  it("merges an idempotent Stop hook into .claude/settings.json", () => {
    writeFileSync(
      path.join(dir, ".claude-marker"),
      "" // ensure dir is writable
    );
    const first = initAgent(dir, "claude");
    expect(first.changed).toBe(true);

    const settings = JSON.parse(
      readFileSync(path.join(dir, ".claude", "settings.json"), "utf8")
    ) as { hooks: { Stop: Array<{ hooks: Array<{ command: string }> }> } };
    const commands = settings.hooks.Stop.flatMap((entry) => entry.hooks.map((h) => h.command));
    expect(commands.some((c) => c.includes("scopediff check --hook"))).toBe(true);

    // Idempotent: second run does not add a duplicate.
    initAgent(dir, "claude");
    const settings2 = JSON.parse(
      readFileSync(path.join(dir, ".claude", "settings.json"), "utf8")
    ) as { hooks: { Stop: Array<{ hooks: Array<{ command: string }> }> } };
    const count = settings2.hooks.Stop.flatMap((entry) =>
      entry.hooks.map((h) => h.command)
    ).filter((c) => c.includes("scopediff")).length;
    expect(count).toBe(1);
  });

  it("preserves existing settings and hooks when merging", () => {
    mkdirSync(path.join(dir, ".claude"), { recursive: true });
    writeFileSync(
      path.join(dir, ".claude", "settings.json"),
      JSON.stringify({ model: "opus", hooks: { Stop: [{ hooks: [{ type: "command", command: "echo hi" }] }] } }, null, 2),
      "utf8"
    );

    initAgent(dir, "claude");
    const settings = JSON.parse(
      readFileSync(path.join(dir, ".claude", "settings.json"), "utf8")
    ) as { model: string; hooks: { Stop: Array<{ hooks: Array<{ command: string }> }> } };

    expect(settings.model).toBe("opus");
    const commands = settings.hooks.Stop.flatMap((entry) => entry.hooks.map((h) => h.command));
    expect(commands).toContain("echo hi");
    expect(commands.some((c) => c.includes("scopediff"))).toBe(true);
  });
});
