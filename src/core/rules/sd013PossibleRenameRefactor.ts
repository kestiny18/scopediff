import { refactorKeywords } from "../context/keywordMap.js";
import { contextHasIntent, finding, hasContext, type Rule } from "./ruleTypes.js";

export const sd013PossibleRenameRefactor: Rule = (input) => {
  if (!hasContext(input) || contextHasIntent(input, refactorKeywords)) {
    return [];
  }

  return input.files
    .filter((file) => file.status === "renamed")
    .map((file) =>
      finding(
        "SD013",
        "medium",
        "Possible rename/refactor",
        "A file rename was detected, but the task context does not mention refactor, rename, or naming work.",
        file.path
      )
    );
};
