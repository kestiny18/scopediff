import { describe, expect, it } from "vitest";
import { analyzeDiff } from "../src/core/analyze/analyzeDiff.js";
import { defaultConfig } from "../src/core/config/defaultConfig.js";
import { parsePrompt } from "../src/core/context/parsePrompt.js";
import type { ScopeDiffConfig, TaskContext } from "../src/types/index.js";

describe("additional rule coverage", () => {
  it("flags lockfile, migration, and CI changes without matching context", () => {
    const result = analyzeDiff({
      diffText: `diff --git a/package-lock.json b/package-lock.json
--- a/package-lock.json
+++ b/package-lock.json
@@ -1 +1 @@
-{}
+{"lockfileVersion":3}
diff --git a/db/migrations/001.sql b/db/migrations/001.sql
--- a/db/migrations/001.sql
+++ b/db/migrations/001.sql
@@ -1 +1 @@
-select 1;
+select 2;
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -1 +1 @@
-name: old
+name: new
`,
      context: promptContext("fix login empty password returns 400"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD002", severity: "high" }),
        expect.objectContaining({ ruleId: "SD003", severity: "high" }),
        expect.objectContaining({ ruleId: "SD004", severity: "high" })
      ])
    );
  });

  it("flags cross-domain and too many files", () => {
    const customConfig = config();
    customConfig.diff.max_changed_files = 2;

    const result = analyzeDiff({
      diffText: changedFileDiff([
        "src/auth/LoginController.ts",
        "src/payment/PaymentService.ts",
        "db/schema.sql"
      ]),
      context: noContext(),
      config: customConfig
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD009", severity: "medium" }),
        expect.objectContaining({ ruleId: "SD011", severity: "medium" })
      ])
    );
  });

  it("flags formatting noise and rename/refactor without matching context", () => {
    const formattingLines = Array.from({ length: 40 }, (_, index) =>
      index % 2 === 0 ? "+import value from \"module\";" : "+  "
    ).join("\n");

    const result = analyzeDiff({
      diffText: `diff --git a/src/auth/old.ts b/src/auth/new.ts
similarity index 88%
rename from src/auth/old.ts
rename to src/auth/new.ts
diff --git a/src/auth/LoginController.ts b/src/auth/LoginController.ts
--- a/src/auth/LoginController.ts
+++ b/src/auth/LoginController.ts
@@ -1 +1,40 @@
${formattingLines}
`,
      context: promptContext("fix login empty password returns 400"),
      config: config()
    });

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "SD012", severity: "medium" }),
        expect.objectContaining({ ruleId: "SD013", severity: "medium" })
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

function changedFileDiff(files: string[]): string {
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
