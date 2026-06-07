import { isMigrationFile } from "../analyze/classifyFile.js";
import { contextMentions, finding, hasConfidentContext, type Rule } from "./ruleTypes.js";

export const sd003MigrationChanged: Rule = (input) => {
  if (input.intent) {
    return [];
  }
  if (!hasConfidentContext(input) || contextMentions(input, "database")) {
    return [];
  }

  return input.files
    .filter((file) => isMigrationFile(file.path))
    .map((file) =>
      finding(
        "SD003",
        "high",
        "Database schema/migration changed without task mention",
        "Database schema or migration file changed, but task context does not mention database, migration, schema, or SQL work.",
        file.path
      )
    );
};
