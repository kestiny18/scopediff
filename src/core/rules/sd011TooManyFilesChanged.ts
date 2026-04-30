import { finding, type Rule } from "./ruleTypes.js";

export const sd011TooManyFilesChanged: Rule = (input) => {
  if (input.files.length <= input.config.diff.max_changed_files) {
    return [];
  }

  return [
    finding(
      "SD011",
      "medium",
      "Too many files changed",
      `Changed file count exceeds configured threshold: ${input.config.diff.max_changed_files}.`
    )
  ];
};
