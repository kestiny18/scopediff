import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCheck } from "../src/cli/commands/check.js";

describe("runCheck", () => {
  it("supports --prompt-file and json output", () => {
    const cwd = createRepo({
      "package.json": "{\"version\":\"0.0.1\"}\n",
      "task.md": "fix login empty password returns 400\n"
    });
    writeFileSync(path.join(cwd, "package.json"), "{\"version\":\"0.0.2\"}\n", "utf8");

    const { exitCode, output } = captureStdout(() =>
      runCheck(cwd, {
        promptFile: "task.md",
        format: "json",
        color: false
      })
    );
    const parsed = JSON.parse(output) as {
      context: { source: string };
      findings: Array<{ ruleId: string }>;
    };

    expect(exitCode).toBe(1);
    expect(parsed.context.source).toBe("prompt_file");
    expect(parsed.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: "SD001" })])
    );
  });

  it("supports --staged diff selection", () => {
    const cwd = createRepo({
      "package.json": "{\"version\":\"0.0.1\"}\n",
      "src/auth/LoginController.ts": "return 500;\n"
    });
    writeFileSync(path.join(cwd, "package.json"), "{\"version\":\"0.0.2\"}\n", "utf8");
    writeFileSync(path.join(cwd, "src/auth/LoginController.ts"), "return 400;\n", "utf8");
    execFileSync("git", ["add", "package.json"], { cwd });

    const { exitCode, output } = captureStdout(() =>
      runCheck(cwd, {
        staged: true,
        prompt: "fix login empty password returns 400",
        format: "json",
        color: false
      })
    );
    const parsed = JSON.parse(output) as {
      summary: { changedFiles: number };
      findings: Array<{ ruleId: string; file?: string }>;
    };

    expect(exitCode).toBe(1);
    expect(parsed.summary.changedFiles).toBe(1);
    expect(parsed.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "SD001",
          file: "package.json"
        })
      ])
    );
  });

  it("supports --base diff selection", () => {
    const cwd = createRepo({
      "src/auth/LoginController.ts": "return 500;\n"
    });
    execFileSync("git", ["branch", "main"], { cwd });
    writeFileSync(path.join(cwd, "src/auth/LoginController.ts"), "return 400;\n", "utf8");
    execFileSync("git", ["add", "."], { cwd });
    execFileSync("git", ["commit", "-m", "fix login"], { cwd, stdio: "ignore" });

    const { exitCode, output } = captureStdout(() =>
      runCheck(cwd, {
        base: "main",
        prompt: "fix login empty password returns 400",
        format: "json",
        color: false
      })
    );
    const parsed = JSON.parse(output) as {
      summary: { changedFiles: number };
      result: { passed: boolean };
    };

    expect(exitCode).toBe(0);
    expect(parsed.summary.changedFiles).toBe(1);
    expect(parsed.result.passed).toBe(true);
  });
});

function createRepo(files: Record<string, string>): string {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "scopediff-cli-"));
  execFileSync("git", ["init", "-q"], { cwd });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd });
  execFileSync("git", ["config", "user.name", "ScopeDiff Test"], { cwd });
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd });

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(cwd, filePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
  }

  execFileSync("git", ["add", "."], { cwd });
  execFileSync("git", ["commit", "-m", "init"], { cwd, stdio: "ignore" });
  return cwd;
}

function captureStdout(callback: () => number): { exitCode: number; output: string } {
  const originalWrite = process.stdout.write.bind(process.stdout);
  let output = "";

  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;

  try {
    return {
      exitCode: callback(),
      output
    };
  } finally {
    process.stdout.write = originalWrite;
  }
}
