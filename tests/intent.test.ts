import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { analyzeDiff } from "../src/core/analyze/analyzeDiff.js";
import { defaultConfig } from "../src/core/config/defaultConfig.js";
import { loadIntent, INTENT_RELATIVE_PATH } from "../src/core/intent/loadIntent.js";
import type { Intent, ScopeDiffConfig, TaskContext } from "../src/types/index.js";

function config(): ScopeDiffConfig {
  return JSON.parse(JSON.stringify(defaultConfig)) as ScopeDiffConfig;
}

function noContext(): TaskContext {
  return { source: "none", confidence: "none", keywords: [], domains: [] };
}

function intent(allow: string[], deny: string[] = []): Intent {
  return { version: 1, task: "fix login empty password returns 400", allow, deny };
}

function diffFor(files: string[]): string {
  return files
    .map(
      (filePath) => `diff --git a/${filePath} b/${filePath}
--- a/${filePath}
+++ b/${filePath}
@@ -1 +1 @@
-old
+new
`
    )
    .join("");
}

describe("SD019 declared-vs-actual scope engine", () => {
  it("flags an undeclared high-risk file as blocking HIGH", () => {
    const result = analyzeDiff({
      diffText: diffFor(["package.json"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    expect(result.mode).toBe("scope");
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD019", severity: "high", file: "package.json" })
      ])
    );
    expect(result.result.exitCode).toBe(1);
  });

  it("does not flag a declared high-risk file", () => {
    const result = analyzeDiff({
      diffText: diffFor(["package.json"]),
      context: noContext(),
      config: config(),
      intent: intent(["package.json", "src/auth/**"])
    });

    expect(result.findings.some((f) => f.ruleId === "SD019")).toBe(false);
    expect(result.findings.some((f) => f.ruleId === "SD001")).toBe(false);
    expect(result.result.exitCode).toBe(0);
  });

  it("flags an undeclared ordinary source file as non-blocking MEDIUM", () => {
    const result = analyzeDiff({
      diffText: diffFor(["src/payment/PaymentService.ts"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    const sd019 = result.findings.find((f) => f.ruleId === "SD019");
    expect(sd019).toMatchObject({ severity: "medium", file: "src/payment/PaymentService.ts" });
    expect(sd019?.blocking).toBe(false);
    expect(result.result.exitCode).toBe(0);
  });

  it("does not flag declared source files or test files", () => {
    const result = analyzeDiff({
      diffText: diffFor(["src/auth/LoginController.ts", "src/auth/LoginController.test.ts"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    expect(result.findings.some((f) => f.ruleId === "SD019")).toBe(false);
  });

  it("treats deny globs as overriding allow", () => {
    const result = analyzeDiff({
      diffText: diffFor(["src/auth/secret/keys.ts"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"], ["src/auth/secret/**"])
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD019", file: "src/auth/secret/keys.ts" })
      ])
    );
  });

  it("does not emit a separate SD005 for a declared secret path", () => {
    const result = analyzeDiff({
      diffText: diffFor(["src/auth/.env"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    expect(result.findings.some((f) => f.ruleId === "SD005")).toBe(false);
    expect(result.findings.some((f) => f.ruleId === "SD019")).toBe(false);
    expect(result.result.exitCode).toBe(0);
  });

  it("flags an undeclared secret via SD019 only, without a duplicate SD005", () => {
    const result = analyzeDiff({
      diffText: diffFor([".env"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    expect(result.findings.some((f) => f.ruleId === "SD005")).toBe(false);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD019", severity: "high", file: ".env" })
      ])
    );
  });

  it("flags an undeclared docs file as INFO", () => {
    const result = analyzeDiff({
      diffText: diffFor(["README.md"]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    const sd019 = result.findings.find((f) => f.ruleId === "SD019");
    expect(sd019).toMatchObject({ severity: "info", file: "README.md" });
    expect(sd019?.blocking).toBe(false);
    expect(result.result.exitCode).toBe(0);
  });

  it("reproduces the login-drift demo using declared scope instead of a prompt", () => {
    const result = analyzeDiff({
      diffText: diffFor([
        "src/auth/LoginController.ts",
        "src/auth/LoginController.test.ts",
        "src/payment/PaymentService.ts",
        "package.json"
      ]),
      context: noContext(),
      config: config(),
      intent: intent(["src/auth/**"])
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD019", severity: "high", file: "package.json" }),
        expect.objectContaining({
          ruleId: "SD019",
          severity: "medium",
          file: "src/payment/PaymentService.ts"
        }),
        expect.objectContaining({ ruleId: "SD017", severity: "info" })
      ])
    );
    // auth files are declared, so no scope finding for them
    expect(
      result.findings.some(
        (f) => f.ruleId === "SD019" && f.file === "src/auth/LoginController.ts"
      )
    ).toBe(false);
    expect(result.result.exitCode).toBe(1);
  });
});

describe("loadIntent", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "scopediff-intent-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeIntent(content: string): void {
    const target = path.join(dir, INTENT_RELATIVE_PATH);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content, "utf8");
  }

  it("returns undefined when no declaration exists", () => {
    expect(loadIntent(dir)).toBeUndefined();
  });

  it("loads and defaults deny to an empty array", () => {
    writeIntent(JSON.stringify({ version: 1, task: "fix", allow: ["src/auth/**"] }));
    const loaded = loadIntent(dir);
    expect(loaded?.intent.allow).toEqual(["src/auth/**"]);
    expect(loaded?.intent.deny).toEqual([]);
  });

  it("throws on a malformed declaration rather than silently degrading", () => {
    writeIntent(JSON.stringify({ version: 1, allow: [] }));
    expect(() => loadIntent(dir)).toThrow(/Invalid intent file/);
  });
});
