import { isCiFile } from "../analyze/classifyFile.js";
import { contextMentions, finding, hasContext, type Rule } from "./ruleTypes.js";

export const sd004CiChanged: Rule = (input) => {
  if (!hasContext(input) || contextMentions(input, "ci")) {
    return [];
  }

  return input.files
    .filter((file) => isCiFile(file.path))
    .map((file) =>
      finding(
        "SD004",
        "high",
        "CI/CD config changed without task mention",
        "CI/CD configuration changed, but task context does not mention CI, deploy, workflow, or pipeline work.",
        file.path
      )
    );
};
