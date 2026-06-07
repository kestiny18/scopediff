import { finding, isDangerCategory, isDeclared, type Rule } from "./ruleTypes.js";

// Declared-vs-actual scope check. Only active when an intent declaration
// exists; it then supersedes the keyword-based scope rules (SD001-SD004, SD008).
// Test files are governed by the test rules (SD006/SD017) and the
// allow_test_changes policy, so they are not treated as scope drift here.
export const sd019OutOfDeclaredScope: Rule = (input) => {
  const intent = input.intent;
  if (!intent) {
    return [];
  }

  return input.files.flatMap((file) => {
    if (file.isTest || isDeclared(intent, file.path)) {
      return [];
    }

    if (isDangerCategory(file.path)) {
      return [
        finding(
          "SD019",
          "high",
          "High-risk file changed outside declared scope",
          `This file was changed but is not covered by the declared scope (${intent.allow.join(", ")}). High-risk files require an explicit declaration.`,
          file.path
        )
      ];
    }

    if (file.isDocs) {
      return [
        finding(
          "SD019",
          "info",
          "Docs file changed outside declared scope",
          `This documentation file was changed but is not covered by the declared scope (${intent.allow.join(", ")}).`,
          file.path
        )
      ];
    }

    return [
      finding(
        "SD019",
        "medium",
        "Potential scope drift: file changed outside declared scope",
        `This file was changed but is not covered by the declared scope (${intent.allow.join(", ")}). Please review whether it belongs in this task.`,
        file.path
      )
    ];
  });
};
