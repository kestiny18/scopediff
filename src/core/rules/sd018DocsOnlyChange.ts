import { finding, type Rule } from "./ruleTypes.js";

export const sd018DocsOnlyChange: Rule = (input) => {
  if (input.files.length === 0 || !input.files.every((file) => file.isDocs)) {
    return [];
  }

  return [
    finding(
      "SD018",
      "info",
      "Docs-only change",
      "Only documentation files changed."
    )
  ];
};
