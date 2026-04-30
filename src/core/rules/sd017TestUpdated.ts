import { finding, type Rule } from "./ruleTypes.js";

export const sd017TestUpdated: Rule = (input) => {
  if (!input.config.tests.allow_test_changes) {
    return [];
  }

  return input.files
    .filter((file) => file.isTest && file.status !== "deleted" && file.additions > 0)
    .map((file) =>
      finding(
        "SD017",
        "info",
        "Test added/updated",
        "Test changes are allowed and should be reviewed with the related implementation.",
        file.path
      )
    );
};
