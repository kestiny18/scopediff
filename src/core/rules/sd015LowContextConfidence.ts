import { finding, type Rule } from "./ruleTypes.js";

export const sd015LowContextConfidence: Rule = (input) => {
  if (input.mode !== "scope" || input.context.confidence !== "low") {
    return [];
  }

  return [
    finding(
      "SD015",
      "info",
      "Low context confidence",
      "Task context is short or broad, so scope findings may be less precise."
    )
  ];
};
