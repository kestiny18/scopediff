import { isEnvSecretFile } from "../analyze/classifyFile.js";
import { finding, type Rule } from "./ruleTypes.js";

export const sd005EnvSecretChanged: Rule = (input) =>
  input.files
    .filter((file) => isEnvSecretFile(file.path))
    .map((file) =>
      finding(
        "SD005",
        "high",
        "Env/secret file changed",
        "Environment, secret, or credential-related file changed. Please verify this was explicitly required.",
        file.path
      )
    );
