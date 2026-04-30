import { finding, type Rule } from "./ruleTypes.js";

export const sd016RiskOnlyMode: Rule = (input) => {
  if (input.mode !== "risk-only") {
    return [];
  }

  return [
    finding(
      "SD016",
      "info",
      "Risk-only mode",
      "No task context was found, so ScopeDiff only checked high-risk diff patterns."
    )
  ];
};
