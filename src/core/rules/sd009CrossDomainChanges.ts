import { broadChangeKeywords } from "../context/keywordMap.js";
import { contextHasIntent, finding, type Rule } from "./ruleTypes.js";

export const sd009CrossDomainChanges: Rule = (input) => {
  // Keyword-domain breadth is a guess; a declared scope (SD019) supersedes it.
  if (input.intent) {
    return [];
  }

  const domains = new Set<string>();

  for (const file of input.files) {
    for (const domain of file.domains) {
      if (domain !== "test" && domain !== "docs") {
        domains.add(domain);
      }
    }
  }

  if (domains.size < 3 || contextHasIntent(input, broadChangeKeywords)) {
    return [];
  }

  return [
    finding(
      "SD009",
      "medium",
      "Potential scope drift: cross-domain changes",
      `Diff touches ${domains.size} domains (${[...domains].join(", ")}). Please review whether this breadth is intended.`
    )
  ];
};
