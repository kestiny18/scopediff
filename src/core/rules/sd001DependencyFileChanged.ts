import { isDependencyBuildFile } from "../analyze/classifyFile.js";
import { contextMentions, finding, hasConfidentContext, type Rule } from "./ruleTypes.js";

export const sd001DependencyFileChanged: Rule = (input) => {
  // Superseded by SD019 (declared-vs-actual) when an intent declaration exists.
  if (input.intent) {
    return [];
  }
  if (!hasConfidentContext(input) || contextMentions(input, "dependency")) {
    return [];
  }

  return input.files
    .filter((file) => isDependencyBuildFile(file.path))
    .map((file) =>
      finding(
        "SD001",
        "high",
        "Dependency/build file changed without task mention",
        "Build/dependency file changed, but task context does not mention dependency, package, build, or upgrade.",
        file.path
      )
    );
};
