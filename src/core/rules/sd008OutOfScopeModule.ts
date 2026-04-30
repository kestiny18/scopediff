import {
  isCiFile,
  isDependencyBuildFile,
  isEnvSecretFile,
  isLockfile,
  isMigrationFile
} from "../analyze/classifyFile.js";
import { finding, hasContext, type Rule } from "./ruleTypes.js";

const nonScopeDomains = new Set(["test"]);

export const sd008OutOfScopeModule: Rule = (input) => {
  if (!hasContext(input) || input.context.domains.length === 0) {
    return [];
  }

  return input.files.flatMap((file) => {
    if (
      file.isTest ||
      isDependencyBuildFile(file.path) ||
      isLockfile(file.path) ||
      isMigrationFile(file.path) ||
      isCiFile(file.path) ||
      isEnvSecretFile(file.path)
    ) {
      return [];
    }

    if (input.context.domains.includes("docs") && !file.isDocs) {
      return [
        finding(
          "SD008",
          "medium",
          "Potential scope drift: source file changed during docs task",
          "Task context appears documentation-related, but this file is not a docs file. Please review whether it belongs in this change.",
          file.path
        )
      ];
    }

    if (file.isDocs) {
      return [];
    }

    const fileDomains = file.domains.filter((domain) => !nonScopeDomains.has(domain));
    if (fileDomains.length === 0) {
      return [];
    }

    const overlaps = fileDomains.some((domain) => input.context.domains.includes(domain));
    if (overlaps) {
      return [];
    }

    return [
      finding(
        "SD008",
        "medium",
        "Potential scope drift: file may be outside task scope",
        `Task context mentions ${input.context.domains.join(", ")}, but this file appears related to ${fileDomains.join(", ")}.`,
        file.path
      )
    ];
  });
};
