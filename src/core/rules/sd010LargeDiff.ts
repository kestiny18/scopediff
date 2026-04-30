import { finding, type Rule } from "./ruleTypes.js";

export const sd010LargeDiff: Rule = (input) => {
  if (input.changedLines <= input.config.diff.max_diff_lines) {
    return [];
  }

  return [
    finding(
      "SD010",
      "medium",
      "Large diff",
      `Changed lines exceed configured threshold: ${input.config.diff.max_diff_lines}.`
    )
  ];
};
