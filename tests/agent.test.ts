import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initAgent } from "../src/core/agent/initAgent.js";

describe("initAgent", () => {
  it("creates and does not duplicate AGENTS.md section", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "scopediff-agent-"));

    const first = initAgent(dir, "codex");
    const second = initAgent(dir, "codex");
    const content = readFileSync(path.join(dir, "AGENTS.md"), "utf8");

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(content.match(/# ScopeDiff/g)).toHaveLength(1);
  });

  it("creates Cursor rule file", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "scopediff-cursor-"));

    const result = initAgent(dir, "cursor");

    expect(result.changed).toBe(true);
    expect(readFileSync(path.join(dir, ".cursor", "rules", "scopediff.mdc"), "utf8")).toContain(
      "ScopeDiff Rule"
    );
  });
});
