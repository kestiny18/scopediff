import { describe, expect, it } from "vitest";
import { parseDiff } from "../src/core/git/parseDiff.js";

describe("parseDiff", () => {
  it("parses changed files and line counts", () => {
    const diff = `diff --git a/src/auth/LoginController.ts b/src/auth/LoginController.ts
index 1111111..2222222 100644
--- a/src/auth/LoginController.ts
+++ b/src/auth/LoginController.ts
@@ -1,3 +1,3 @@
-return 500;
+return 400;
 context
diff --git a/src/auth/LoginController.test.ts b/src/auth/LoginController.test.ts
index 3333333..4444444 100644
--- a/src/auth/LoginController.test.ts
+++ b/src/auth/LoginController.test.ts
@@ -1,2 +1,3 @@
 test("empty password", () => {
+  expect(status).toBe(400);
 });
`;

    const files = parseDiff(diff);

    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({
      path: "src/auth/LoginController.ts",
      additions: 1,
      deletions: 1,
      status: "modified"
    });
    expect(files[1]).toMatchObject({
      path: "src/auth/LoginController.test.ts",
      additions: 1,
      deletions: 0
    });
  });

  it("parses renames", () => {
    const diff = `diff --git a/src/auth/AuthService.ts b/src/auth/AuthManager.ts
similarity index 88%
rename from src/auth/AuthService.ts
rename to src/auth/AuthManager.ts
`;

    const files = parseDiff(diff);

    expect(files[0]).toMatchObject({
      path: "src/auth/AuthManager.ts",
      previousPath: "src/auth/AuthService.ts",
      status: "renamed"
    });
  });
});
