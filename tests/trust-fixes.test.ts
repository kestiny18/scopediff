import { describe, expect, it } from "vitest";
import { analyzeDiff } from "../src/core/analyze/analyzeDiff.js";
import { detectDomains } from "../src/core/analyze/detectDomains.js";
import { defaultConfig } from "../src/core/config/defaultConfig.js";
import type { ScopeDiffConfig, TaskContext } from "../src/types/index.js";

const packageJsonDiff = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1 +1 @@
-{"version":"0.0.1"}
+{"version":"0.0.2"}
`;

function config(): ScopeDiffConfig {
  return JSON.parse(JSON.stringify(defaultConfig)) as ScopeDiffConfig;
}

describe("A1: low-confidence fallback context does not trigger blocking HIGH rules", () => {
  it("does not flag SD001 when context is only a generic branch name", () => {
    // Simulates the branch_name fallback on a branch like "main": real source
    // text but parsed to "low" confidence with no domains.
    const branchContext: TaskContext = {
      source: "branch_name",
      raw: "main",
      summary: "main",
      confidence: "low",
      keywords: [],
      domains: []
    };

    const result = analyzeDiff({
      diffText: packageJsonDiff,
      context: branchContext,
      config: config()
    });

    expect(result.findings.some((finding) => finding.ruleId === "SD001")).toBe(false);
    expect(result.result.exitCode).toBe(0);
  });

  it("still flags SD001 when context is confident (medium+) and unrelated", () => {
    const promptContext: TaskContext = {
      source: "prompt",
      raw: "fix login empty password returns 400",
      summary: "fix login empty password returns 400",
      confidence: "medium",
      keywords: ["login", "password"],
      domains: ["auth"]
    };

    const result = analyzeDiff({
      diffText: packageJsonDiff,
      context: promptContext,
      config: config()
    });

    expect(result.findings.some((finding) => finding.ruleId === "SD001")).toBe(true);
    expect(result.result.exitCode).toBe(1);
  });
});

describe("A2: path domain detection uses whole-token matching", () => {
  it("does not misclassify lookalike path segments", () => {
    expect(detectDomains("src/authors/blog.ts")).not.toContain("auth");
    expect(detectDomains("src/utils/reorder.ts")).not.toContain("payment");
    expect(detectDomains("src/lib/recorder.ts")).not.toContain("payment");
  });

  it("preserves recall for real domain paths, including camelCase", () => {
    expect(detectDomains("src/auth/LoginController.ts")).toContain("auth");
    expect(detectDomains("src/payment/PaymentService.ts")).toContain("payment");
    expect(detectDomains("db/schema.sql")).toContain("database");
  });
});
