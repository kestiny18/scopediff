import { finding, type Rule } from "./ruleTypes.js";

export const sd006TestDeletion: Rule = (input) =>
  input.files
    .filter(
      (file) =>
        file.isTest &&
        (file.status === "deleted" || (file.deletions >= 20 && file.deletions > file.additions * 2))
    )
    .map((file) =>
      finding(
        "SD006",
        "high",
        "Test deletion detected",
        "Test file or substantial test content was deleted. Please confirm this is within task scope.",
        file.path
      )
    );
