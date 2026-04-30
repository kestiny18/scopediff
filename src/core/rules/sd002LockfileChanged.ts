import { isLockfile } from "../analyze/classifyFile.js";
import { contextMentions, finding, hasContext, type Rule } from "./ruleTypes.js";

export const sd002LockfileChanged: Rule = (input) => {
  if (!hasContext(input) || contextMentions(input, "dependency")) {
    return [];
  }

  return input.files
    .filter((file) => isLockfile(file.path))
    .map((file) =>
      finding(
        "SD002",
        "high",
        "Lockfile changed without package task mention",
        "Lockfile changed, but task context does not mention dependencies, packages, build, or upgrade.",
        file.path
      )
    );
};
