import { describe, expect, it } from "vitest";
import { analyzeDiff } from "../src/core/analyze/analyzeDiff.js";
import { defaultConfig } from "../src/core/config/defaultConfig.js";
import { parsePrompt } from "../src/core/context/parsePrompt.js";
import type { ScopeDiffConfig, TaskContext } from "../src/types/index.js";

describe("analyzeDiff", () => {
  it("flags dependency and payment drift for a login task", () => {
    const result = analyzeDiff({
      diffText: loginDriftDiff(),
      context: promptContext("fix login empty password returns 500 instead of 400"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD001", severity: "high", file: "package.json" }),
        expect.objectContaining({
          ruleId: "SD008",
          severity: "medium",
          file: "src/payment/PaymentService.ts"
        }),
        expect.objectContaining({
          ruleId: "SD017",
          severity: "info",
          file: "src/auth/LoginController.test.ts"
        })
      ])
    );
    expect(result.result.exitCode).toBe(1);
  });

  it("flags source changes during a docs task as medium", () => {
    const result = analyzeDiff({
      diffText: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1 +1,2 @@
 # ScopeDiff
+Install with npm.
diff --git a/src/auth/AuthService.ts b/src/auth/AuthService.ts
--- a/src/auth/AuthService.ts
+++ b/src/auth/AuthService.ts
@@ -1 +1,2 @@
 export class AuthService {}
+export const changed = true;
`,
      context: promptContext("update README installation section"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "SD008",
          severity: "medium",
          file: "src/auth/AuthService.ts"
        })
      ])
    );
    expect(result.result.exitCode).toBe(0);
  });

  it("does not flag rename/refactor when prompt allows it", () => {
    const result = analyzeDiff({
      diffText: `diff --git a/src/auth/AuthService.ts b/src/auth/AuthManager.ts
similarity index 88%
rename from src/auth/AuthService.ts
rename to src/auth/AuthManager.ts
`,
      context: promptContext("refactor auth service naming"),
      config: config()
    });

    expect(result.findings.some((finding) => finding.ruleId === "SD013")).toBe(false);
  });

  it("enters risk-only mode and flags env changes without context", () => {
    const result = analyzeDiff({
      diffText: `diff --git a/.env b/.env
--- a/.env
+++ b/.env
@@ -1 +1 @@
-TOKEN=old
+TOKEN=new
`,
      context: noContext(),
      config: config()
    });

    expect(result.mode).toBe("risk-only");
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD005", severity: "high", file: ".env" }),
        expect.objectContaining({ ruleId: "SD016", severity: "info" })
      ])
    );
    expect(result.result.exitCode).toBe(1);
  });

  it("flags large diffs", () => {
    const additions = Array.from({ length: 501 }, (_, index) => `+line ${index}`).join("\n");
    const result = analyzeDiff({
      diffText: `diff --git a/src/auth/LoginController.ts b/src/auth/LoginController.ts
--- a/src/auth/LoginController.ts
+++ b/src/auth/LoginController.ts
@@ -1 +1,501 @@
${additions}
`,
      context: promptContext("fix login empty password returns 400"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: "SD010", severity: "medium" })])
    );
  });

  it("flags test deletion", () => {
    const result = analyzeDiff({
      diffText: `diff --git a/src/auth/LoginController.test.ts b/src/auth/LoginController.test.ts
deleted file mode 100644
--- a/src/auth/LoginController.test.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-test("empty password", () => {});
-test("token", () => {});
`,
      context: promptContext("fix login empty password returns 400"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "SD006",
          severity: "high",
          file: "src/auth/LoginController.test.ts"
        })
      ])
    );
  });
});

function promptContext(raw: string): TaskContext {
  const parsed = parsePrompt(raw, defaultConfig.context.min_prompt_words);
  return {
    source: "prompt",
    raw,
    summary: parsed.summary,
    confidence: parsed.confidence,
    keywords: parsed.keywords,
    domains: parsed.domains
  };
}

function noContext(): TaskContext {
  return {
    source: "none",
    confidence: "none",
    keywords: [],
    domains: []
  };
}

function config(): ScopeDiffConfig {
  return JSON.parse(JSON.stringify(defaultConfig)) as ScopeDiffConfig;
}

function loginDriftDiff(): string {
  return `diff --git a/src/auth/LoginController.ts b/src/auth/LoginController.ts
--- a/src/auth/LoginController.ts
+++ b/src/auth/LoginController.ts
@@ -1 +1 @@
-return 500;
+return 400;
diff --git a/src/auth/LoginController.test.ts b/src/auth/LoginController.test.ts
--- a/src/auth/LoginController.test.ts
+++ b/src/auth/LoginController.test.ts
@@ -1 +1,2 @@
 test("empty password", () => {});
+expect(status).toBe(400);
diff --git a/src/payment/PaymentService.ts b/src/payment/PaymentService.ts
--- a/src/payment/PaymentService.ts
+++ b/src/payment/PaymentService.ts
@@ -1 +1,2 @@
 export class PaymentService {}
+export const changed = true;
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1 +1 @@
-{"version":"0.0.1"}
+{"version":"0.0.2"}
`;
}
