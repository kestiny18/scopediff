import { isSensitivePath } from "../analyze/classifyFile.js";
import { finding, type Rule } from "./ruleTypes.js";

export const sd014SensitivePathChanged: Rule = (input) => {
  // When scope is declared, SD019 already covers undeclared sensitive paths and
  // declared ones are expected, so this path-based heuristic is redundant noise.
  if (input.intent) {
    return [];
  }

  return input.files
    .filter((file) => {
      if (!isSensitivePath(file.path, input.config)) {
        return false;
      }

      if (input.mode === "risk-only") {
        return true;
      }

      if (input.context.domains.length === 0) {
        return true;
      }

      return false;
    })
    .map((file) =>
      finding(
        "SD014",
        "medium",
        "Sensitive path changed",
        "A sensitive path changed. Please review whether this was expected for the task.",
        file.path
      )
    );
};
