import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/core/config/loadConfig.js";

describe("loadConfig", () => {
  it("merges partial scopediff.yml with defaults", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "scopediff-config-"));
    writeFileSync(
      path.join(dir, "scopediff.yml"),
      `version: 1
diff:
  max_changed_files: 3
`,
      "utf8"
    );

    const { config } = loadConfig(dir);

    expect(config.diff.max_changed_files).toBe(3);
    expect(config.diff.max_diff_lines).toBe(500);
    expect(config.risk.fail_on).toEqual(["high"]);
  });
});
