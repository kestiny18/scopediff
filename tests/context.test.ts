import { describe, expect, it } from "vitest";
import { parsePrompt } from "../src/core/context/parsePrompt.js";

describe("parsePrompt", () => {
  it("maps Chinese auth keywords", () => {
    const parsed = parsePrompt("修复登录空密码返回 400", 4);

    expect(parsed.domains).toContain("auth");
    expect(parsed.keywords).toEqual(expect.arrayContaining(["登录", "密码"]));
    expect(parsed.confidence).not.toBe("none");
  });

  it("marks short context as low confidence", () => {
    const parsed = parsePrompt("fix login", 4);

    expect(parsed.domains).toContain("auth");
    expect(parsed.confidence).toBe("low");
  });
});
