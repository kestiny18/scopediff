import { finding, type Rule } from "./ruleTypes.js";

export const sd007LargeDeletion: Rule = (input) =>
  input.files
    .filter(
      (file) =>
        !file.isTest &&
        !file.isDocs &&
        file.deletions > input.config.diff.max_deleted_lines
    )
    .map((file) =>
      finding(
        "SD007",
        "high",
        "Large production-code deletion",
        `Production-code deletions exceed configured threshold: ${input.config.diff.max_deleted_lines}.`,
        file.path
      )
    );
